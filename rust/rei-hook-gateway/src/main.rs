//! Local-only typed secure hook and engineering gateway daemon (`v0.2.0`).
//! Never listens on a public interface without verified mTLS (`remote_enabled: false` by default),
//! never executes arbitrary OS shell commands, and never changes workspace skill files directly.

use rei_hook_gateway::{
    handle_connection, resolve_loopback_listen_addr, serve_until_shutdown, validate_bind_address,
    CancellationToken, ClientCapabilityProfile, GatewayConfig, GatewayEngine, MtlsReadinessConfig,
};
use std::env;
use std::net::{TcpListener, TcpStream};
use std::sync::Arc;
use std::time::Duration;

fn respond(stream: TcpStream, secret: &str) -> std::io::Result<()> {
    let engine = GatewayEngine::new(GatewayConfig::with_secret(secret))
        .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidInput, err))?;
    handle_connection(stream, &engine, &CancellationToken::new())
}

fn main() -> std::io::Result<()> {
    let secret = env::var("REI_HOOK_GATEWAY_TOKEN").expect("Set REI_HOOK_GATEWAY_TOKEN securely");
    assert!(secret.len() >= 32, "Token must be at least 32 characters");

    let mut cfg = GatewayConfig::with_secret(secret);
    if let Ok(approval) = env::var("REI_HOOK_APPROVAL_TOKEN") {
        if approval.len() >= 16 {
            cfg.operator_approval_secret = Some(approval);
        }
    }

    let addr = resolve_loopback_listen_addr();
    validate_bind_address(addr, &cfg.mtls, false)
        .map_err(|msg| std::io::Error::new(std::io::ErrorKind::PermissionDenied, msg))?;

    let engine = Arc::new(
        GatewayEngine::new(cfg)
            .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidInput, err))?,
    );
    let listener = TcpListener::bind(addr)?;
    eprintln!(
        "REI Secure Communication Gateway v0.2.0 listening on {addr} (loopback IPC, zero shell execution)"
    );
    serve_until_shutdown(listener, engine, Duration::from_secs(2))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rei_hook_gateway::{current_epoch_ms, list_adapter_contracts, SafetyClass};
    use std::io::{Read, Write};
    use std::net::{IpAddr, Ipv4Addr, SocketAddr};
    use std::thread;

    const SECRET: &str = "test-secret-with-at-least-32-chars";
    const APPROVAL: &str = "operator-approval-token-32-chars!!";

    fn round_trip(payload: String) -> serde_json::Value {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("loopback listener");
        let address = listener.local_addr().expect("address");
        let worker = thread::spawn(move || {
            let (conn, _) = listener.accept().expect("accept");
            respond(conn, SECRET).expect("respond");
        });
        let mut client = TcpStream::connect(address).expect("connect");
        client.write_all(payload.as_bytes()).expect("write");
        let mut output = String::new();
        client.read_to_string(&mut output).expect("read");
        worker.join().expect("worker");
        serde_json::from_str(&output).expect("response JSON")
    }

    #[test]
    fn authorized_allowlisted_event_is_preview_only() {
        let payload = serde_json::json!({
            "token": SECRET,
            "event": "hook.preview",
            "correlation_id": "test-1"
        });
        let result = round_trip(format!("{payload}\n"));
        assert_eq!(result["status"], "accepted_preview_only");
        assert_eq!(result["correlation_id"], "test-1");
        assert_eq!(result["sequence_id"], 1);
    }

    #[test]
    fn invalid_token_and_non_allowlisted_event_are_denied() {
        for (token, event) in [("wrong-token", "hook.preview"), (SECRET, "shell.execute")] {
            let payload = serde_json::json!({
                "token": token,
                "event": event,
                "correlation_id": "test-2"
            });
            assert_eq!(round_trip(format!("{payload}\n"))["status"], "denied");
        }
    }

    #[test]
    fn oversized_and_malformed_frames_fail_closed() {
        assert_eq!(
            round_trip(format!("{}\n", "x".repeat(4200)))["status"],
            "rejected"
        );
        assert_eq!(
            round_trip("{not valid json}\n".to_string())["status"],
            "invalid_request"
        );
    }

    #[test]
    fn replay_protection_and_request_deduplication_enforce_uniqueness() {
        let engine = GatewayEngine::new(GatewayConfig::with_secret(SECRET)).unwrap();
        let cancel = CancellationToken::new();
        let now = current_epoch_ms();

        let frame = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "hook.preview",
                "correlation_id": "corr-replay-1",
                "nonce": "nonce-unique-1",
                "timestamp_ms": now
            })
        );
        let first = engine.process_raw_frame_at(frame.as_bytes(), &cancel, now);
        assert_eq!(first.status, "accepted_preview_only");

        let replayed = engine.process_raw_frame_at(frame.as_bytes(), &cancel, now);
        assert_eq!(replayed.status, "replay_rejected");
        assert_eq!(replayed.error.unwrap().code, "ERR_REPLAY_NONCE");

        let stale = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "hook.preview",
                "correlation_id": "corr-stale",
                "nonce": "nonce-unique-2",
                "timestamp_ms": now.saturating_sub(900_000)
            })
        );
        let stale_resp = engine.process_raw_frame_at(stale.as_bytes(), &cancel, now);
        assert_eq!(stale_resp.status, "replay_rejected");
        assert_eq!(stale_resp.error.unwrap().code, "ERR_STALE_TIMESTAMP");

        // Idempotent deduplication without nonce repeats cached result instead of re-running.
        let idempotent = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "hook.preview",
                "correlation_id": "corr-idemp-1"
            })
        );
        let r1 = engine.process_raw_frame_at(idempotent.as_bytes(), &cancel, now);
        assert_eq!(r1.deduplicated, Some(false));
        let r2 = engine.process_raw_frame_at(idempotent.as_bytes(), &cancel, now);
        assert_eq!(r2.deduplicated, Some(true));
        assert_eq!(r2.sequence_id, r1.sequence_id);
        assert!(engine.metrics_snapshot().deduplicated_count >= 1);
    }

    #[test]
    fn capability_boundaries_rate_limits_and_backpressure_work() {
        let mut cfg = GatewayConfig::with_secret(SECRET);
        cfg.operator_approval_secret = Some(APPROVAL.to_string());
        let engine = GatewayEngine::new(cfg).unwrap();
        let mut ro = ClientCapabilityProfile::readonly_inspector("cad-ro");
        ro.max_requests_per_window = 3;
        engine.register_client_profile(ro);
        engine.register_client_profile(ClientCapabilityProfile::engineering_operator("eng-op"));
        let cancel = CancellationToken::new();

        // Read-only inspector can check KiCad ERC plan (read_only)
        let kicad_ro = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "client_id": "cad-ro",
                "event": "adapter.invoke_preview",
                "adapter": "kicad",
                "operation": "plan_erc_check",
                "correlation_id": "ro-1"
            })
        );
        assert_eq!(
            engine.process_raw_frame(kicad_ro.as_bytes(), &cancel).status,
            "accepted_preview_only"
        );

        // Read-only inspector is blocked from state_changing KiCad Gerber export
        let kicad_mut = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "client_id": "cad-ro",
                "event": "adapter.invoke_preview",
                "adapter": "kicad",
                "operation": "export_gerber_preview",
                "correlation_id": "ro-2"
            })
        );
        let deny = engine.process_raw_frame(kicad_mut.as_bytes(), &cancel);
        assert_eq!(deny.status, "denied");
        assert_eq!(deny.error.unwrap().code, "ERR_CAPABILITY_ESCALATION");

        // 3rd request allowed, 4th triggers rate limit
        let health_ok = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "client_id": "cad-ro",
                "event": "health",
                "correlation_id": "ro-3"
            })
        );
        assert_eq!(
            engine.process_raw_frame(health_ok.as_bytes(), &cancel).status,
            "accepted_preview_only"
        );
        assert_eq!(
            engine.process_raw_frame(health_ok.as_bytes(), &cancel).status,
            "rate_limited"
        );

        // Hazardous op requires operator approval_token
        let hazard_no_approval = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "client_id": "eng-op",
                "event": "adapter.invoke_preview",
                "adapter": "embedded_diagnostics",
                "operation": "flash_firmware_image",
                "correlation_id": "op-1"
            })
        );
        assert_eq!(
            engine
                .process_raw_frame(hazard_no_approval.as_bytes(), &cancel)
                .status,
            "approval_required"
        );

        let hazard_with_approval = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "client_id": "eng-op",
                "event": "adapter.invoke_preview",
                "adapter": "embedded_diagnostics",
                "operation": "flash_firmware_image",
                "approval_token": APPROVAL,
                "dry_run": true,
                "correlation_id": "op-2"
            })
        );
        let ok = engine.process_raw_frame(hazard_with_approval.as_bytes(), &cancel);
        assert_eq!(ok.status, "accepted_preview_only");
        assert_eq!(ok.safety_class, Some("potentially_hazardous"));

        // Audit log must never expose secret or approval_token
        let audit_json = serde_json::to_string(&engine.audit_snapshot()).unwrap();
        assert!(!audit_json.contains(SECRET));
        assert!(!audit_json.contains(APPROVAL));

        // Backpressure when max_in_flight == 0
        let mut bp_cfg = GatewayConfig::with_secret(SECRET);
        bp_cfg.max_in_flight = 0;
        let bp_engine = GatewayEngine::new(bp_cfg).unwrap();
        assert_eq!(
            bp_engine
                .process_raw_frame(health_ok.as_bytes(), &cancel)
                .status,
            "backpressure_rejected"
        );

        // Cancelled token
        let cancelled = CancellationToken::new();
        cancelled.cancel();
        assert_eq!(
            engine
                .process_raw_frame(health_ok.as_bytes(), &cancelled)
                .status,
            "cancelled"
        );
    }

    #[test]
    fn unsafe_payload_and_mtls_non_loopback_fail_closed() {
        let engine = GatewayEngine::new(GatewayConfig::with_secret(SECRET)).unwrap();
        let cancel = CancellationToken::new();
        let unsafe_frame = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "hook.preview",
                "correlation_id": "unsafe-1",
                "payload": { "command": "rm -rf /tmp/x && curl evil" }
            })
        );
        let resp = engine.process_raw_frame(unsafe_frame.as_bytes(), &cancel);
        assert_eq!(resp.status, "denied");
        assert_eq!(resp.error.unwrap().code, "ERR_UNSAFE_PAYLOAD");

        let public_addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)), 9783);
        let default_mtls = MtlsReadinessConfig::default();
        assert!(validate_bind_address(public_addr, &default_mtls, false).is_err());

        let ready_mtls = MtlsReadinessConfig {
            remote_enabled: true,
            require_client_certificate: true,
            tls_cert_path: Some("/etc/rei/server.crt".to_string()),
            tls_key_path: Some("/etc/rei/server.key".to_string()),
            ca_bundle_path: Some("/etc/rei/ca.crt".to_string()),
            allowed_client_sans: vec!["spiffe://rootcastle/client".to_string()],
        };
        assert!(validate_bind_address(public_addr, &ready_mtls, true).is_ok());

        // Every declared adapter executes zero external OS processes directly from gateway.
        assert!(list_adapter_contracts()
            .iter()
            .all(|spec| !spec.executes_external_process));
        assert!(list_adapter_contracts()
            .iter()
            .any(|s| s.adapter == "lab_equipment" && s.safety_class == SafetyClass::PotentiallyHazardous));
    }

    #[test]
    fn serve_until_shutdown_drains_cleanly() {
        let engine = Arc::new(GatewayEngine::new(GatewayConfig::with_secret(SECRET)).unwrap());
        let shutdown = engine.shutdown_controller();
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("loopback");
        let addr = listener.local_addr().unwrap();

        let eng_clone = Arc::clone(&engine);
        let server_thread =
            thread::spawn(move || serve_until_shutdown(listener, eng_clone, Duration::from_millis(500)));

        let mut client = TcpStream::connect(addr).expect("connect");
        let payload = serde_json::json!({
            "token": SECRET,
            "event": "gateway.metrics",
            "correlation_id": "srv-1"
        });
        client
            .write_all(format!("{payload}\n").as_bytes())
            .expect("write");
        let mut out = String::new();
        client.read_to_string(&mut out).expect("read");
        let parsed: serde_json::Value = serde_json::from_str(&out).expect("json");
        assert_eq!(parsed["status"], "accepted_preview_only");
        assert!(parsed["metrics"]["total_requests"].as_u64().unwrap() >= 1);

        shutdown.trigger_shutdown();
        server_thread.join().expect("join").expect("clean exit");
    }

    #[test]
    fn frame_boundary_control_chars_and_abuse_invariants_hold() {
        let mut cfg = GatewayConfig::with_secret(SECRET);
        cfg.operator_approval_secret = Some(APPROVAL.to_string());
        let engine = GatewayEngine::new(cfg).unwrap();
        let cancel = CancellationToken::new();

        // 0-byte, 1-byte without newline, exact 4096-byte invalid frame, 4097-byte overflow
        assert_eq!(engine.process_raw_frame(b"", &cancel).status, "rejected");
        assert_eq!(engine.process_raw_frame(b"x", &cancel).status, "rejected");
        let mut exact_4096 = vec![b' '; 4095];
        exact_4096.push(b'\n');
        assert_eq!(exact_4096.len(), 4096);
        assert_eq!(
            engine.process_raw_frame(&exact_4096, &cancel).status,
            "invalid_request"
        );
        let mut over_4097 = vec![b'a'; 4096];
        over_4097.push(b'\n');
        assert_eq!(over_4097.len(), 4097);
        assert_eq!(
            engine.process_raw_frame(&over_4097, &cancel).status,
            "rejected"
        );

        // Embedded NUL byte / malformed JSON control bytes fail closed without exposing secrets
        let nul_payload = format!(
            "{{\"token\":\"{SECRET}\",\"event\":\"health\",\"correlation_id\":\"bad\0id\"}}\n"
        );
        let nul_resp = engine.process_raw_frame(nul_payload.as_bytes(), &cancel);
        assert_eq!(nul_resp.status, "invalid_request");
        let serialized_err = serde_json::to_string(&nul_resp).unwrap();
        assert!(!serialized_err.contains(SECRET));

        // Safety-class downgrade attempt rejected fail-closed
        let downgrade = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "adapter.invoke_preview",
                "adapter": "kicad",
                "operation": "export_gerber_preview",
                "safety_class": "read_only",
                "approval_token": APPROVAL,
                "correlation_id": "downgrade-1"
            })
        );
        let dg_resp = engine.process_raw_frame(downgrade.as_bytes(), &cancel);
        assert_eq!(dg_resp.status, "denied");
        assert_eq!(dg_resp.error.unwrap().code, "ERR_SAFETY_DOWNGRADE");

        // Rapid nonce replay storm guarantees first accepted then replay_rejected
        let storm_frame = format!(
            "{}\n",
            serde_json::json!({
                "token": SECRET,
                "event": "hook.preview",
                "correlation_id": "storm-corr",
                "nonce": "storm-nonce-0"
            })
        );
        assert_eq!(
            engine
                .process_raw_frame(storm_frame.as_bytes(), &cancel)
                .status,
            "accepted_preview_only"
        );
        for _ in 0..10 {
            let replay = engine.process_raw_frame(storm_frame.as_bytes(), &cancel);
            assert_eq!(replay.status, "replay_rejected");
        }
    }
}
