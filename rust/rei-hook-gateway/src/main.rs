//! Local-only hook event gateway (prototype).
//! Never listens on a public interface, runs commands or changes skill files.
use serde::{Deserialize, Serialize};
use std::env;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener, TcpStream};
use std::time::Duration;
use subtle::ConstantTimeEq;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request {
    token: String,
    event: String,
    correlation_id: String,
}

#[derive(Serialize)]
struct Response<'a> {
    status: &'a str,
    event: &'a str,
    correlation_id: &'a str,
}

fn respond(mut stream: TcpStream, secret: &str) -> std::io::Result<()> {
    stream.set_read_timeout(Some(Duration::from_secs(3)))?;
    stream.set_write_timeout(Some(Duration::from_secs(3)))?;
    let mut line = Vec::new();
    let bytes = BufReader::new(stream.try_clone()?)
        .take(4097)
        .read_until(b'\n', &mut line)?;
    if bytes == 0 || bytes > 4096 || !line.ends_with(b"\n") {
        stream.write_all(b"{\"status\":\"rejected\"}\n")?;
        return Ok(());
    }
    let request: Request = match serde_json::from_slice(&line) {
        Ok(request) => request,
        Err(_) => {
            stream.write_all(b"{\"status\":\"invalid_request\"}\n")?;
            return Ok(());
        }
    };
    // Token never goes to logs; fixed allowlist prohibits arbitrary execution.
    if request
        .token
        .as_bytes()
        .ct_eq(secret.as_bytes())
        .unwrap_u8()
        != 1
        || !matches!(
            request.event.as_str(),
            "health" | "hook.preview" | "hook.audit"
        )
        || request.correlation_id.len() > 128
    {
        stream.write_all(b"{\"status\":\"denied\"}\n")?;
        return Ok(());
    }
    // No hook execution. Authenticated and allowlisted events are acknowledgements.
    let result = Response {
        status: "accepted_preview_only",
        event: &request.event,
        correlation_id: &request.correlation_id,
    };
    serde_json::to_writer(&mut stream, &result)?;
    stream.write_all(b"\n")?;
    Ok(())
}

fn main() -> std::io::Result<()> {
    let secret = env::var("REI_HOOK_GATEWAY_TOKEN").expect("Set REI_HOOK_GATEWAY_TOKEN securely");
    assert!(secret.len() >= 32, "Token must be at least 32 characters");
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 9783);
    let listener = TcpListener::bind(addr)?;
    eprintln!("REI Hook Gateway listening on 127.0.0.1:9783 (preview only)");
    for incoming in listener.incoming() {
        match incoming {
            Ok(stream) => {
                if let Err(err) = respond(stream, &secret) {
                    eprintln!("connection error: {err}");
                }
            }
            Err(err) => eprintln!("accept error: {err}"),
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::thread;

    fn round_trip(payload: String) -> serde_json::Value {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("loopback listener");
        let address = listener.local_addr().expect("address");
        let worker = thread::spawn(move || {
            let (conn, _) = listener.accept().expect("accept");
            respond(conn, "test-secret-with-at-least-32-chars").expect("respond");
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
            "token": "test-secret-with-at-least-32-chars",
            "event": "hook.preview",
            "correlation_id": "test-1"
        });
        let result = round_trip(format!("{payload}\n"));
        assert_eq!(result["status"], "accepted_preview_only");
        assert_eq!(result["correlation_id"], "test-1");
    }

    #[test]
    fn invalid_token_and_non_allowlisted_event_are_denied() {
        for (token, event) in [
            ("wrong-token", "hook.preview"),
            ("test-secret-with-at-least-32-chars", "shell.execute"),
        ] {
            let payload = serde_json::json!({
                "token": token, "event": event, "correlation_id": "test-2"
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
}
