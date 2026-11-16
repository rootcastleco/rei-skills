# REI Secure Communication Gateway — Protocol & Security Specification (`v0.2.0`)

**Crate:** `rust/rei-hook-gateway` (`version = "0.2.0"`, `publish = false`)  
**Default Bind Address:** `127.0.0.1:9783` (configurable via `REI_HOOK_GATEWAY_PORT`, loopback only)  
**External Runtime Dependencies:** `serde`, `serde_json`, `subtle` (zero async runtime, zero arbitrary process execution)

---

## 1. Security Invariants

1. **Zero Arbitrary Shell Execution:** The gateway never invokes `std::process::Command`, host shells, or hook scripts from incoming frames. Any frame sending `"event": "shell.execute"` or embedding forbidden execution keys (`shell`, `command`, `cmd`, `exec`, `spawn`, `bash`, `powershell`, `pwsh`, `script_exec`) or shell control operators (`&&`, `$(`, `` ` ``, `| sh`) inside `payload` is rejected with `status: "denied"`.
2. **Loopback Default & Fail-Closed mTLS Remote Gate:** `validate_bind_address(addr, &mtls_config, mtls_verified)` allows loopback (`127.0.0.1` / `::1`) locally and **fails closed** on non-loopback addresses unless:
   - `mtls_config.remote_enabled === true` (disabled by default: `false`),
   - `mtls_verified === true` and `mtls_config.require_client_certificate === true`,
   - non-empty `tls_cert_path`, `tls_key_path`, `ca_bundle_path`, and `allowed_client_sans` are configured.
3. **Constant-Time Token Authentication:** Authentication tokens (`>= 32` characters) and operator approval tokens are checked with `subtle::ConstantTimeEq`. Tokens are never emitted into responses or audit logs.

---

## 2. Wire Framing & Schema

Each connection reads at most one newline-delimited JSON line capped at `MAX_FRAME_BYTES = 4096`. Unterminated, empty, or oversized frames return `status: "rejected"` (`ERR_FRAME_LIMIT`). Unknown fields are denied via `#[serde(deny_unknown_fields)]`.

### Request Frame (`GatewayRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | Yes | Shared gateway token (`>= 32` chars). Backwards compatible with 3-field legacy frames. |
| `event` | `string` | Yes | Allowlisted event (`health`, `hook.preview`, `hook.audit`, `gateway.metrics`, `gateway.capabilities`, `adapter.describe`, `adapter.invoke_preview`). |
| `correlation_id` | `string` | Yes | Trace identifier (`1..=128` chars). |
| `client_id` | `string` | No | Client capability profile identifier (defaults to `"local-default"`). |
| `nonce` | `string` | No | Unique replay-prevention token (`1..=128` chars, bounded `ReplayCache`). |
| `timestamp_ms` | `u64` | No | Epoch millisecond timestamp verified against `+/-300,000 ms` skew tolerance. |
| `safety_class` | `SafetyClass` | No | Caller-declared class (`read_only`, `state_changing`, `potentially_hazardous`). Cannot downgrade adapter minimums. |
| `adapter` | `string` | No | Adapter identifier for `adapter.*` events. |
| `operation` | `string` | No | Contract operation identifier inside `adapter`. |
| `dry_run` | `bool` | No | Dry-run preview indicator (default `true`). |
| `approval_token` | `string` | No | Constant-time verified operator approval secret for `state_changing` / `potentially_hazardous` operations. |
| `payload` | `JSON Value` | No | Structured typed metadata scanned against unsafe payload patterns. |

---

## 3. Isolated Adapter Contracts & Safety Classification

| Adapter | Operation | `SafetyClass` | External Process Executed | Approval Required |
| :--- | :--- | :--- | :--- | :--- |
| `kicad` | `inspect_schematic_summary` | `read_only` | `false` | No |
| `kicad` | `plan_erc_check` | `read_only` | `false` | No |
| `kicad` | `plan_drc_check` | `read_only` | `false` | No |
| `kicad` | `export_gerber_preview` | `state_changing` | `false` | Yes |
| `fusion360` | `inspect_assembly_metadata` | `read_only` | `false` | No |
| `fusion360` | `verify_enclosure_clearance` | `read_only` | `false` | No |
| `fusion360` | `export_step_preview` | `state_changing` | `false` | Yes |
| `embedded_diagnostics` | `read_device_telemetry` | `read_only` | `false` | No |
| `embedded_diagnostics` | `validate_nmea_frame` | `read_only` | `false` | No |
| `embedded_diagnostics` | `decode_can_j1939` | `read_only` | `false` | No |
| `embedded_diagnostics` | `flash_firmware_image` | `potentially_hazardous` | `false` | Yes |
| `telemetry` | `ingest_readonly_sample` | `read_only` | `false` | No |
| `telemetry` | `query_stream_health` | `read_only` | `false` | No |
| `lab_equipment` | `read_instrument_identity` | `read_only` | `false` | No |
| `lab_equipment` | `validate_calibration_cert` | `read_only` | `false` | No |
| `lab_equipment` | `energize_actuator` | `potentially_hazardous` | `false` | Yes |

---

## 4. Operational Controls

- **Replay Protection & Idempotent Deduplication:** Consumed `nonce` values return `status: "replay_rejected"` (`ERR_REPLAY_NONCE`). Stale timestamps return `status: "replay_rejected"` (`ERR_STALE_TIMESTAMP`). Repeated `(client_id, event, correlation_id)` tuples without a new nonce return `deduplicated: true` with cached response state without re-dispatch.
- **Sliding-Window Rate Limiting:** Enforced per `client_id` (`local-default`: 120 req/60s, `readonly-inspector`: 60 req/60s); excess returns `status: "rate_limited"` (`ERR_RATE_LIMITED`).
- **Backpressure & Cancellation:** RAII `InFlightGuard` enforces `max_in_flight` (`32` default); saturated queues return `status: "backpressure_rejected"` (`ERR_BACKPRESSURE`). `CancellationToken` and `request_timeout` return `cancelled` / `timeout`.
- **Graceful Shutdown & Sanitized Audit:** `serve_until_shutdown` polls non-blocking `TcpListener`, drains active connections cleanly until `drain_timeout`, and maintains bounded metrics + sanitized `AuditEntry` records (512 entries).

Verified via `cargo test` inside `rust/rei-hook-gateway` (`7 passed; 0 failed`).
