//! Multi-threaded zero-dependency native HTTP/1.1 server + health probe.

use crate::catalog::catalog;
use crate::css::generate_theme_css;
use crate::doctor::{audit_code, report_json};
use crate::json::{self, arr, n, obj, s, JsonValue};
use crate::search::{build_plan, search_catalog};
use crate::ui::render_explorer_html;

use std::collections::BTreeMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::thread;
use std::time::{Duration, Instant};

pub fn check_health(host: &str, port: u16) -> Option<String> {
    let addr: SocketAddr = format!("{}:{}", host, port).parse().ok()?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_millis(350)).ok()?;
    let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(500)));
    let req = format!(
        "GET /health HTTP/1.1\r\nHost: {}:{}\r\nConnection: close\r\n\r\n",
        host, port
    );
    stream.write_all(req.as_bytes()).ok()?;
    let mut resp = String::new();
    stream.read_to_string(&mut resp).ok()?;
    if resp.starts_with("HTTP/1.1 200") || resp.starts_with("HTTP/1.0 200") {
        if let Some(idx) = resp.find("\r\n\r\n") {
            return Some(resp[idx + 4..].to_string());
        }
    }
    None
}

pub fn serve(host: &str, port: u16) -> Result<(), String> {
    let bind_addr = format!("{}:{}", host, port);
    let listener = TcpListener::bind(&bind_addr)
        .map_err(|e| format!("Failed to bind {}: {}", bind_addr, e))?;

    let started_at = Instant::now();
    // Eagerly warm embedded catalog before accepting connections
    let cat = catalog();

    eprintln!(
        "[astryx-ds-server] Listening on http://{} (Astryx v{} | {} components/hooks | {} tokens | {} themes | {} templates)",
        bind_addr,
        cat.meta.core_version,
        cat.components.len(),
        cat.tokens.len(),
        cat.themes.len(),
        cat.templates.len()
    );

    for stream in listener.incoming() {
        match stream {
            Ok(sock) => {
                let start_copy = started_at;
                thread::spawn(move || {
                    let _ = handle_connection(sock, start_copy);
                });
            }
            Err(e) => {
                eprintln!("[astryx-ds-server] accept error: {}", e);
            }
        }
    }
    Ok(())
}

fn handle_connection(mut stream: TcpStream, started_at: Instant) -> std::io::Result<()> {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(5)));

    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line)? == 0 {
        return Ok(());
    }

    let parts: Vec<&str> = request_line.trim().split_whitespace().collect();
    if parts.len() < 2 {
        write_response(&mut stream, 400, "application/json", r#"{"error":"Bad Request"}"#)?;
        return Ok(());
    }
    let method = parts[0];
    let target = parts[1];

    let mut content_length: usize = 0;
    loop {
        let mut line = String::new();
        if reader.read_line(&mut line)? == 0 {
            break;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            break;
        }
        if let Some((k, v)) = trimmed.split_once(':') {
            if k.eq_ignore_ascii_case("content-length") {
                content_length = v.trim().parse().unwrap_or(0).min(1024 * 1024);
            }
        }
    }

    let mut body = vec![0u8; content_length];
    if content_length > 0 {
        reader.read_exact(&mut body)?;
    }
    let body_str = String::from_utf8_lossy(&body).to_string();

    if method == "OPTIONS" {
        write_response(&mut stream, 204, "text/plain", "")?;
        return Ok(());
    }

    let (raw_path, raw_query) = match target.split_once('?') {
        Some((p, q)) => (p, q),
        None => (target, ""),
    };
    let path = url_decode(raw_path);
    let query = parse_query(raw_query);

    let (status, content_type, payload) = route(method, &path, &query, &body_str, started_at);
    write_response(&mut stream, status, content_type, &payload)
}

fn route(
    method: &str,
    path: &str,
    query: &BTreeMap<String, String>,
    body: &str,
    started_at: Instant,
) -> (u16, &'static str, String) {
    let cat = catalog();

    match (method, path) {
        ("GET", "/") | ("GET", "/index.html") => {
            (200, "text/html; charset=utf-8", render_explorer_html())
        }
        ("GET", "/health") => {
            let v = obj(vec![
                ("status", s("ok")),
                ("service", s("astryx-ds-server")),
                ("version", s(env!("CARGO_PKG_VERSION"))),
                ("coreVersion", s(&cat.meta.core_version)),
                ("uptimeSeconds", n(started_at.elapsed().as_secs() as usize)),
            ]);
            (200, "application/json; charset=utf-8", v.to_json_string())
        }
        ("GET", "/api/stats") => (
            200,
            "application/json; charset=utf-8",
            cat.stats_json().to_json_string(),
        ),
        ("GET", "/api/manifest") => (
            200,
            "application/json; charset=utf-8",
            manifest_json().to_json_string(),
        ),
        ("GET", "/api/search") => {
            let q = query.get("q").map(|x| x.as_str()).unwrap_or("");
            let kind = query.get("kind").map(|x| x.as_str());
            let limit = query
                .get("limit")
                .and_then(|x| x.parse::<usize>().ok())
                .unwrap_or(25)
                .min(100);
            let hits = search_catalog(cat, q, kind, limit);
            let resp = obj(vec![
                ("query", s(q)),
                ("count", n(hits.len())),
                ("results", arr(hits.iter().map(|h| h.to_json()).collect())),
            ]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", "/api/components") => {
            let cat_filter = query.get("category").map(|x| x.to_lowercase());
            let kind_filter = query.get("kind").map(|x| x.to_lowercase());
            let q_filter = query.get("q").map(|x| x.to_lowercase());
            let items: Vec<JsonValue> = cat
                .components
                .iter()
                .filter(|c| {
                    cat_filter
                        .as_ref()
                        .map(|f| c.category.to_lowercase() == *f)
                        .unwrap_or(true)
                        && kind_filter
                            .as_ref()
                            .map(|f| c.kind.to_lowercase() == *f)
                            .unwrap_or(true)
                        && q_filter
                            .as_ref()
                            .map(|f| {
                                c.name.to_lowercase().contains(f)
                                    || c.description.to_lowercase().contains(f)
                                    || c.category.to_lowercase().contains(f)
                            })
                            .unwrap_or(true)
                })
                .map(|c| c.summary_json())
                .collect();
            let resp = obj(vec![("count", n(items.len())), ("items", arr(items))]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", p) if p.starts_with("/api/components/") => {
            let name = &p["/api/components/".len()..];
            match cat.find_component(name) {
                Some(comp) => (
                    200,
                    "application/json; charset=utf-8",
                    comp.detail_json().to_json_string(),
                ),
                None => (
                    404,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(format!("Component '{}' not found", name)))])
                        .to_json_string(),
                ),
            }
        }
        ("GET", "/api/tokens") => {
            let fam_filter = query.get("family").map(|x| x.to_lowercase());
            let q_filter = query.get("q").map(|x| x.to_lowercase());
            let items: Vec<JsonValue> = cat
                .tokens
                .iter()
                .filter(|t| {
                    fam_filter
                        .as_ref()
                        .map(|f| t.family.to_lowercase() == *f)
                        .unwrap_or(true)
                        && q_filter
                            .as_ref()
                            .map(|f| {
                                t.name.to_lowercase().contains(f)
                                    || t.value.to_lowercase().contains(f)
                                    || t.family.to_lowercase().contains(f)
                            })
                            .unwrap_or(true)
                })
                .map(|t| t.to_json())
                .collect();
            let resp = obj(vec![("count", n(items.len())), ("items", arr(items))]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", "/api/tokens.css") => {
            let mode = query.get("mode").map(|x| x.as_str()).unwrap_or("auto");
            match generate_theme_css(cat, None, mode) {
                Ok(css) => (200, "text/css; charset=utf-8", css),
                Err(e) => (
                    400,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(e))]).to_json_string(),
                ),
            }
        }
        ("GET", "/api/themes") => {
            let items: Vec<JsonValue> = cat.themes.iter().map(|t| t.summary_json()).collect();
            let resp = obj(vec![("count", n(items.len())), ("items", arr(items))]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", p) if p.starts_with("/api/themes/") && p.ends_with("/tokens.css") => {
            let inner = &p["/api/themes/".len()..p.len() - "/tokens.css".len()];
            let mode = query.get("mode").map(|x| x.as_str()).unwrap_or("auto");
            match generate_theme_css(cat, Some(inner), mode) {
                Ok(css) => (200, "text/css; charset=utf-8", css),
                Err(e) => (
                    404,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(e))]).to_json_string(),
                ),
            }
        }
        ("GET", p) if p.starts_with("/api/themes/") => {
            let name = &p["/api/themes/".len()..];
            match cat.find_theme(name) {
                Some(th) => (
                    200,
                    "application/json; charset=utf-8",
                    th.detail_json().to_json_string(),
                ),
                None => (
                    404,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(format!("Theme '{}' not found", name)))])
                        .to_json_string(),
                ),
            }
        }
        ("GET", "/api/templates") => {
            let cat_filter = query.get("category").map(|x| x.to_lowercase());
            let q_filter = query.get("q").map(|x| x.to_lowercase());
            let items: Vec<JsonValue> = cat
                .templates
                .iter()
                .filter(|t| {
                    cat_filter
                        .as_ref()
                        .map(|f| t.category.to_lowercase().contains(f))
                        .unwrap_or(true)
                        && q_filter
                            .as_ref()
                            .map(|f| {
                                t.slug.to_lowercase().contains(f)
                                    || t.name.to_lowercase().contains(f)
                                    || t.description.to_lowercase().contains(f)
                            })
                            .unwrap_or(true)
                })
                .map(|t| t.to_json())
                .collect();
            let resp = obj(vec![("count", n(items.len())), ("items", arr(items))]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", p) if p.starts_with("/api/templates/") => {
            let slug = &p["/api/templates/".len()..];
            match cat.find_template(slug) {
                Some(t) => (
                    200,
                    "application/json; charset=utf-8",
                    t.to_json().to_json_string(),
                ),
                None => (
                    404,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(format!("Template '{}' not found", slug)))])
                        .to_json_string(),
                ),
            }
        }
        ("GET", "/api/docs") => {
            let items: Vec<JsonValue> = cat.docs.iter().map(|d| d.summary_json()).collect();
            let resp = obj(vec![("count", n(items.len())), ("items", arr(items))]);
            (200, "application/json; charset=utf-8", resp.to_json_string())
        }
        ("GET", p) if p.starts_with("/api/docs/") => {
            let slug = &p["/api/docs/".len()..];
            match cat.find_doc(slug) {
                Some(d) => (
                    200,
                    "application/json; charset=utf-8",
                    d.detail_json().to_json_string(),
                ),
                None => (
                    404,
                    "application/json; charset=utf-8",
                    obj(vec![("error", s(format!("Doc topic '{}' not found", slug)))])
                        .to_json_string(),
                ),
            }
        }
        ("GET", "/api/build") => {
            let idea = query.get("idea").map(|x| x.as_str()).unwrap_or("dashboard");
            let plan = build_plan(cat, idea);
            (200, "application/json; charset=utf-8", plan.to_json_string())
        }
        ("POST", "/api/doctor") => {
            let (filename, code) = if let Ok(parsed) = json::parse(body) {
                let f = parsed
                    .get("filename")
                    .and_then(|v| v.as_str())
                    .unwrap_or("snippet.tsx")
                    .to_string();
                let c = parsed
                    .get("code")
                    .and_then(|v| v.as_str())
                    .unwrap_or(body)
                    .to_string();
                (f, c)
            } else {
                ("snippet.tsx".to_string(), body.to_string())
            };
            let findings = audit_code(&filename, &code);
            let report = report_json(1, findings);
            (
                200,
                "application/json; charset=utf-8",
                report.to_json_string(),
            )
        }
        _ => (
            404,
            "application/json; charset=utf-8",
            obj(vec![
                ("error", s("Not Found")),
                ("path", s(path)),
                ("hint", s("GET /api/manifest for all available endpoints")),
            ])
            .to_json_string(),
        ),
    }
}

pub fn manifest_json() -> JsonValue {
    let cat = catalog();
    obj(vec![
        ("service", s("astryx-ds-server")),
        ("version", s(env!("CARGO_PKG_VERSION"))),
        ("upstream", s(&cat.meta.upstream)),
        ("coreVersion", s(&cat.meta.core_version)),
        (
            "endpoints",
            arr(vec![
                s("GET /"),
                s("GET /health"),
                s("GET /api/stats"),
                s("GET /api/manifest"),
                s("GET /api/search?q=<query>&kind=<all|component|hook|token|theme|template|doc>&limit=<n>"),
                s("GET /api/components?category=<cat>&kind=<component|hook|utility>&q=<filter>"),
                s("GET /api/components/<Name>"),
                s("GET /api/tokens?family=<family>&q=<filter>"),
                s("GET /api/tokens.css?mode=<auto|light|dark>"),
                s("GET /api/themes"),
                s("GET /api/themes/<name>"),
                s("GET /api/themes/<name>/tokens.css?mode=<auto|light|dark>"),
                s("GET /api/templates?category=<cat>&q=<filter>"),
                s("GET /api/templates/<slug>"),
                s("GET /api/docs"),
                s("GET /api/docs/<slug>"),
                s("GET /api/build?idea=<description>"),
                s("POST /api/doctor"),
            ]),
        ),
        (
            "mcpTools",
            arr(vec![
                s("astryx_search"),
                s("astryx_component"),
                s("astryx_tokens"),
                s("astryx_theme"),
                s("astryx_template"),
                s("astryx_docs"),
                s("astryx_build_plan"),
                s("astryx_doctor"),
            ]),
        ),
    ])
}

fn write_response(
    stream: &mut TcpStream,
    status: u16,
    content_type: &str,
    body: &str,
) -> std::io::Result<()> {
    let reason = match status {
        200 => "OK",
        204 => "No Content",
        400 => "Bad Request",
        404 => "Not Found",
        _ => "Error",
    };
    let header = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\nConnection: close\r\n\r\n",
        status,
        reason,
        content_type,
        body.len()
    );
    stream.write_all(header.as_bytes())?;
    stream.write_all(body.as_bytes())?;
    stream.flush()
}

fn parse_query(q: &str) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    for pair in q.split('&') {
        if pair.is_empty() {
            continue;
        }
        if let Some((k, v)) = pair.split_once('=') {
            map.insert(url_decode(k), url_decode(v));
        } else {
            map.insert(url_decode(pair), String::new());
        }
    }
    map
}

fn url_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b'%' if i + 2 < bytes.len() => {
                if let Ok(hex) = std::str::from_utf8(&bytes[i + 1..i + 3]) {
                    if let Ok(val) = u8::from_str_radix(hex, 16) {
                        out.push(val);
                        i += 3;
                        continue;
                    }
                }
                out.push(b'%');
                i += 1;
            }
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).to_string()
}
