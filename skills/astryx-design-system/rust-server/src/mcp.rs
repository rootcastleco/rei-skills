//! Native Model Context Protocol (MCP) JSON-RPC 2.0 stdio server.
//!
//! Supports both newline-delimited JSON-RPC (standard MCP stdio transport)
//! and `Content-Length:` framed JSON-RPC messages.

use crate::catalog::catalog;
use crate::css::generate_theme_css;
use crate::doctor::{audit_code, audit_path, report_json};
use crate::json::{self, arr, b, obj, s, JsonValue};
use crate::search::{build_plan, search_catalog};

use std::io::{self, BufRead, BufReader, Write};
use std::path::Path;

pub fn run_mcp_stdio() -> Result<(), String> {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = BufReader::new(stdin.lock());
    let mut writer = stdout.lock();

    // Warm catalog on start
    let _ = catalog();

    loop {
        let Some((framed, raw_msg)) = read_message(&mut reader).map_err(|e| e.to_string())? else {
            break;
        };
        let trimmed = raw_msg.trim();
        if trimmed.is_empty() {
            continue;
        }

        let req = match json::parse(trimmed) {
            Ok(v) => v,
            Err(e) => {
                let err_resp = jsonrpc_error(JsonValue::Null, -32700, &format!("Parse error: {}", e));
                write_message(&mut writer, framed, &err_resp).map_err(|e| e.to_string())?;
                continue;
            }
        };

        let id = req.get("id").cloned();
        let method = req.get("method").and_then(|v| v.as_str()).unwrap_or("");
        let params = req.get("params");

        // Notifications (no id) do not receive responses
        if id.is_none() {
            if method == "exit" {
                break;
            }
            continue;
        }
        let req_id = id.unwrap();

        let response = match method {
            "initialize" => jsonrpc_ok(
                req_id,
                obj(vec![
                    ("protocolVersion", s("2024-11-05")),
                    (
                        "capabilities",
                        obj(vec![
                            ("tools", obj(vec![])),
                            ("resources", obj(vec![])),
                        ]),
                    ),
                    (
                        "serverInfo",
                        obj(vec![
                            ("name", s("astryx-ds-server")),
                            ("version", s(env!("CARGO_PKG_VERSION"))),
                        ]),
                    ),
                ]),
            ),
            "ping" => jsonrpc_ok(req_id, obj(vec![])),
            "tools/list" => jsonrpc_ok(req_id, obj(vec![("tools", list_tools())])),
            "tools/call" => handle_tool_call(req_id, params),
            "resources/list" => jsonrpc_ok(req_id, obj(vec![("resources", list_resources())])),
            "resources/read" => handle_resource_read(req_id, params),
            _ => jsonrpc_error(req_id, -32601, &format!("Method not found: {}", method)),
        };

        write_message(&mut writer, framed, &response).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn read_message<R: BufRead>(reader: &mut R) -> io::Result<Option<(bool, String)>> {
    let mut line = String::new();
    let n = reader.read_line(&mut line)?;
    if n == 0 {
        return Ok(None);
    }
    let trimmed = line.trim();
    if trimmed.to_ascii_lowercase().starts_with("content-length:") {
        let len: usize = trimmed
            .split_once(':')
            .and_then(|(_, v)| v.trim().parse().ok())
            .unwrap_or(0);
        // Consume remaining headers until blank line
        loop {
            let mut h = String::new();
            if reader.read_line(&mut h)? == 0 || h.trim().is_empty() {
                break;
            }
        }
        let mut buf = vec![0u8; len];
        reader.read_exact(&mut buf)?;
        Ok(Some((true, String::from_utf8_lossy(&buf).to_string())))
    } else {
        Ok(Some((false, line)))
    }
}

fn write_message<W: Write>(writer: &mut W, framed: bool, msg: &JsonValue) -> io::Result<()> {
    let payload = msg.to_json_string();
    if framed {
        write!(writer, "Content-Length: {}\r\n\r\n{}", payload.len(), payload)?;
    } else {
        writeln!(writer, "{}", payload)?;
    }
    writer.flush()
}

fn jsonrpc_ok(id: JsonValue, result: JsonValue) -> JsonValue {
    obj(vec![
        ("jsonrpc", s("2.0")),
        ("id", id),
        ("result", result),
    ])
}

fn jsonrpc_error(id: JsonValue, code: i32, message: &str) -> JsonValue {
    obj(vec![
        ("jsonrpc", s("2.0")),
        ("id", id),
        (
            "error",
            obj(vec![
                ("code", JsonValue::Number(code as f64)),
                ("message", s(message)),
            ]),
        ),
    ])
}

fn tool_def(name: &str, description: &str, properties: Vec<(&str, &str, &str)>, required: Vec<&str>) -> JsonValue {
    let prop_pairs: Vec<(&str, JsonValue)> = properties
        .into_iter()
        .map(|(k, typ, desc)| (k, obj(vec![("type", s(typ)), ("description", s(desc))])))
        .collect();
    obj(vec![
        ("name", s(name)),
        ("description", s(description)),
        (
            "inputSchema",
            obj(vec![
                ("type", s("object")),
                ("properties", obj(prop_pairs)),
                ("required", arr(required.into_iter().map(s).collect())),
            ]),
        ),
    ])
}

fn list_tools() -> JsonValue {
    arr(vec![
        tool_def(
            "astryx_search",
            "Search across all Meta Astryx components, hooks, tokens, themes, page templates, and docs.",
            vec![
                ("query", "string", "Search query (e.g., 'button', 'dialog', 'spacing', 'dashboard')"),
                ("kind", "string", "Optional filter: all | component | hook | token | theme | template | doc"),
                ("limit", "number", "Maximum results to return (default 15)"),
            ],
            vec!["query"],
        ),
        tool_def(
            "astryx_component",
            "Get full API documentation (import path, props, defaults, best practices, WCAG a11y, example) for an Astryx component or hook.",
            vec![("name", "string", "Component or hook name (e.g. 'Button', 'Dialog', 'Table', 'useToast')")],
            vec!["name"],
        ),
        tool_def(
            "astryx_tokens",
            "Query Astryx CSS custom property design tokens by family (color, spacing, radius, shadow, duration, ease, typography, typeScale).",
            vec![
                ("family", "string", "Optional token family filter"),
                ("query", "string", "Optional substring filter"),
            ],
            vec![],
        ),
        tool_def(
            "astryx_theme",
            "Inspect an official Astryx theme (neutral, butter, chocolate, gothic, matcha, stone, y2k) or generate its CSS custom properties.",
            vec![
                ("name", "string", "Theme slug (e.g. 'neutral', 'matcha', 'gothic'). Omit to list all themes."),
                ("css", "boolean", "If true, return compiled CSS custom properties stylesheet."),
                ("mode", "string", "CSS mode: auto | light | dark"),
            ],
            vec![],
        ),
        tool_def(
            "astryx_template",
            "Inspect an Astryx page template (e.g. 'dashboard', 'settings', 'ai-chat', 'table-page') or list available page templates.",
            vec![("slug", "string", "Template slug. Omit to list all 58 page templates.")],
            vec![],
        ),
        tool_def(
            "astryx_docs",
            "Read Astryx design principles, theming, spacing, color, motion, or getting-started reference guides.",
            vec![("topic", "string", "Topic slug (e.g. 'principles', 'theme', 'getting-started', 'color', 'spacing', 'motion'). Omit to list all topics.")],
            vec![],
        ),
        tool_def(
            "astryx_build_plan",
            "Recommend the best Astryx page template, components, hooks, and workflow for a UI idea.",
            vec![("idea", "string", "Description of the page or feature you want to build")],
            vec!["idea"],
        ),
        tool_def(
            "astryx_doctor",
            "Audit React/TSX/CSS code or a local directory against Astryx rules (raw <a>, hardcoded hex, Button label, boolean prop naming, inline styles).",
            vec![
                ("code", "string", "Inline React/TSX/CSS snippet to audit"),
                ("filename", "string", "Optional filename hint (default 'snippet.tsx')"),
                ("path", "string", "Optional local file or directory path to scan"),
            ],
            vec![],
        ),
    ])
}

fn list_resources() -> JsonValue {
    arr(vec![
        obj(vec![
            ("uri", s("astryx://stats")),
            ("name", s("Astryx Catalog Summary")),
            ("mimeType", s("application/json")),
        ]),
        obj(vec![
            ("uri", s("astryx://themes/neutral/tokens.css")),
            ("name", s("Astryx Neutral Theme CSS Tokens")),
            ("mimeType", s("text/css")),
        ]),
        obj(vec![
            ("uri", s("astryx://docs/principles")),
            ("name", s("Astryx Design Principles")),
            ("mimeType", s("application/json")),
        ]),
    ])
}

fn handle_resource_read(id: JsonValue, params: Option<&JsonValue>) -> JsonValue {
    let uri = params
        .and_then(|p| p.get("uri"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let cat = catalog();

    let (mime, text) = match uri {
        "astryx://stats" => ("application/json", cat.stats_json().to_json_pretty()),
        "astryx://themes/neutral/tokens.css" => (
            "text/css",
            generate_theme_css(cat, Some("neutral"), "auto").unwrap_or_default(),
        ),
        "astryx://docs/principles" => (
            "application/json",
            cat.find_doc("principles")
                .map(|d| d.detail_json().to_json_pretty())
                .unwrap_or_else(|| "{}".to_string()),
        ),
        _ => return jsonrpc_error(id, -32602, &format!("Unknown resource URI: {}", uri)),
    };

    jsonrpc_ok(
        id,
        obj(vec![(
            "contents",
            arr(vec![obj(vec![
                ("uri", s(uri)),
                ("mimeType", s(mime)),
                ("text", s(text)),
            ])]),
        )]),
    )
}

fn tool_text_result(id: JsonValue, text: String, is_error: bool) -> JsonValue {
    jsonrpc_ok(
        id,
        obj(vec![
            (
                "content",
                arr(vec![obj(vec![("type", s("text")), ("text", s(text))])]),
            ),
            ("isError", b(is_error)),
        ]),
    )
}

fn handle_tool_call(id: JsonValue, params: Option<&JsonValue>) -> JsonValue {
    let name = params
        .and_then(|p| p.get("name"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let args = params.and_then(|p| p.get("arguments"));
    let cat = catalog();

    match name {
        "astryx_search" => {
            let query = args.and_then(|a| a.get("query")).and_then(|v| v.as_str()).unwrap_or("");
            let kind = args.and_then(|a| a.get("kind")).and_then(|v| v.as_str());
            let limit = args
                .and_then(|a| a.get("limit"))
                .and_then(|v| v.as_u64())
                .unwrap_or(15) as usize;
            let hits = search_catalog(cat, query, kind, limit);
            let out = obj(vec![
                ("query", s(query)),
                ("results", arr(hits.iter().map(|h| h.to_json()).collect())),
            ]);
            tool_text_result(id, out.to_json_pretty(), false)
        }
        "astryx_component" => {
            let comp_name = args.and_then(|a| a.get("name")).and_then(|v| v.as_str()).unwrap_or("");
            match cat.find_component(comp_name) {
                Some(c) => tool_text_result(id, c.detail_json().to_json_pretty(), false),
                None => tool_text_result(
                    id,
                    format!("Component '{}' not found. Try astryx_search first.", comp_name),
                    true,
                ),
            }
        }
        "astryx_tokens" => {
            let fam = args.and_then(|a| a.get("family")).and_then(|v| v.as_str()).map(|x| x.to_lowercase());
            let q = args.and_then(|a| a.get("query")).and_then(|v| v.as_str()).map(|x| x.to_lowercase());
            let list: Vec<JsonValue> = cat
                .tokens
                .iter()
                .filter(|t| {
                    fam.as_ref().map(|f| t.family.to_lowercase() == *f).unwrap_or(true)
                        && q.as_ref()
                            .map(|s| t.name.to_lowercase().contains(s) || t.value.to_lowercase().contains(s))
                            .unwrap_or(true)
                })
                .map(|t| t.to_json())
                .collect();
            tool_text_result(id, arr(list).to_json_pretty(), false)
        }
        "astryx_theme" => {
            let tname = args.and_then(|a| a.get("name")).and_then(|v| v.as_str());
            let wants_css = args.and_then(|a| a.get("css")).and_then(|v| v.as_bool()).unwrap_or(false);
            let mode = args.and_then(|a| a.get("mode")).and_then(|v| v.as_str()).unwrap_or("auto");
            if wants_css {
                match generate_theme_css(cat, tname, mode) {
                    Ok(css) => tool_text_result(id, css, false),
                    Err(e) => tool_text_result(id, e, true),
                }
            } else if let Some(tn) = tname {
                match cat.find_theme(tn) {
                    Some(th) => tool_text_result(id, th.detail_json().to_json_pretty(), false),
                    None => tool_text_result(id, format!("Theme '{}' not found.", tn), true),
                }
            } else {
                let list: Vec<JsonValue> = cat.themes.iter().map(|t| t.summary_json()).collect();
                tool_text_result(id, arr(list).to_json_pretty(), false)
            }
        }
        "astryx_template" => {
            if let Some(slug) = args.and_then(|a| a.get("slug")).and_then(|v| v.as_str()) {
                match cat.find_template(slug) {
                    Some(t) => tool_text_result(id, t.to_json().to_json_pretty(), false),
                    None => tool_text_result(id, format!("Template '{}' not found.", slug), true),
                }
            } else {
                let list: Vec<JsonValue> = cat.templates.iter().map(|t| t.to_json()).collect();
                tool_text_result(id, arr(list).to_json_pretty(), false)
            }
        }
        "astryx_docs" => {
            if let Some(topic) = args.and_then(|a| a.get("topic")).and_then(|v| v.as_str()) {
                match cat.find_doc(topic) {
                    Some(d) => tool_text_result(id, d.detail_json().to_json_pretty(), false),
                    None => tool_text_result(id, format!("Doc topic '{}' not found.", topic), true),
                }
            } else {
                let list: Vec<JsonValue> = cat.docs.iter().map(|d| d.summary_json()).collect();
                tool_text_result(id, arr(list).to_json_pretty(), false)
            }
        }
        "astryx_build_plan" => {
            let idea = args.and_then(|a| a.get("idea")).and_then(|v| v.as_str()).unwrap_or("dashboard");
            tool_text_result(id, build_plan(cat, idea).to_json_pretty(), false)
        }
        "astryx_doctor" => {
            if let Some(path_str) = args.and_then(|a| a.get("path")).and_then(|v| v.as_str()) {
                let rep = audit_path(Path::new(path_str));
                tool_text_result(id, rep.to_json_pretty(), false)
            } else if let Some(code) = args.and_then(|a| a.get("code")).and_then(|v| v.as_str()) {
                let fname = args.and_then(|a| a.get("filename")).and_then(|v| v.as_str()).unwrap_or("snippet.tsx");
                let rep = report_json(1, audit_code(fname, code));
                tool_text_result(id, rep.to_json_pretty(), false)
            } else {
                tool_text_result(id, "Provide either `code` or `path` to audit.".to_string(), true)
            }
        }
        _ => jsonrpc_error(id, -32602, &format!("Unknown tool: {}", name)),
    }
}
