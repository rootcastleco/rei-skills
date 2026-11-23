mod catalog;
mod css;
mod doctor;
mod http;
mod json;
mod mcp;
mod search;
mod ui;

use crate::catalog::catalog;
use crate::css::generate_theme_css;
use crate::doctor::audit_path;
use crate::json::{arr, n, obj, s};
use crate::search::{build_plan, search_catalog};

use std::env;
use std::path::Path;
use std::process::{self, Command, Stdio};
use std::thread;
use std::time::Duration;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() || has_flag(&args, "--help") || has_flag(&args, "-h") {
        print_help();
        return;
    }
    if has_flag(&args, "--version") || has_flag(&args, "-V") {
        println!(
            "astryx-ds-server {} (Meta Astryx Core {})",
            env!("CARGO_PKG_VERSION"),
            catalog().meta.core_version
        );
        return;
    }

    let as_json = has_flag(&args, "--json");
    let cmd = args[0].as_str();
    let rest = &args[1..];

    let result = match cmd {
        "serve" => cmd_serve(rest),
        "ensure" => cmd_ensure(rest, as_json),
        "mcp" => mcp::run_mcp_stdio(),
        "search" => cmd_search(rest, as_json),
        "component" => cmd_component(rest, as_json),
        "tokens" => cmd_tokens(rest, as_json),
        "theme" => cmd_theme(rest, as_json),
        "template" => cmd_template(rest, as_json),
        "docs" => cmd_docs(rest, as_json),
        "build" => cmd_build(rest, as_json),
        "doctor" => cmd_doctor(rest, as_json),
        "manifest" => {
            println!("{}", http::manifest_json().to_json_pretty());
            Ok(())
        }
        "stats" => {
            println!("{}", catalog().stats_json().to_json_pretty());
            Ok(())
        }
        other => Err(format!(
            "Unknown command '{}'. Run `astryx-ds-server --help` for usage.",
            other
        )),
    };

    if let Err(err) = result {
        eprintln!("Error: {}", err);
        process::exit(1);
    }
}

fn has_flag(args: &[String], flag: &str) -> bool {
    args.iter().any(|a| a == flag)
}

fn flag_value<'a>(args: &'a [String], flag: &str) -> Option<&'a str> {
    args.windows(2)
        .find(|w| w[0] == flag)
        .map(|w| w[1].as_str())
}

fn first_positional<'a>(args: &'a [String]) -> Option<&'a str> {
    let mut skip_next = false;
    for a in args {
        if skip_next {
            skip_next = false;
            continue;
        }
        if matches!(
            a.as_str(),
            "--host" | "--port" | "--kind" | "--limit" | "--family" | "--mode" | "--category"
        ) {
            skip_next = true;
            continue;
        }
        if a.starts_with('-') {
            continue;
        }
        return Some(a.as_str());
    }
    None
}

fn cmd_serve(args: &[String]) -> Result<(), String> {
    let host = flag_value(args, "--host").unwrap_or("127.0.0.1");
    let port: u16 = flag_value(args, "--port")
        .and_then(|p| p.parse().ok())
        .unwrap_or(7331);
    http::serve(host, port)
}

fn cmd_ensure(args: &[String], as_json: bool) -> Result<(), String> {
    let host = flag_value(args, "--host").unwrap_or("127.0.0.1");
    let port: u16 = flag_value(args, "--port")
        .and_then(|p| p.parse().ok())
        .unwrap_or(7331);
    let url = format!("http://{}:{}", host, port);

    if let Some(health) = http::check_health(host, port) {
        if as_json {
            println!(
                "{}",
                obj(vec![
                    ("status", s("running")),
                    ("started", json::b(false)),
                    ("url", s(&url)),
                    ("health", s(health)),
                ])
                .to_json_pretty()
            );
        } else {
            println!("Astryx native Rust server already running at {}", url);
        }
        return Ok(());
    }

    let exe = env::current_exe().map_err(|e| format!("Cannot resolve current executable: {}", e))?;
    let mut command = Command::new(exe);
    command
        .arg("serve")
        .arg("--host")
        .arg(host)
        .arg("--port")
        .arg(port.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x0000_0008;
        const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;
        command.creation_flags(DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
    }

    command
        .spawn()
        .map_err(|e| format!("Failed to spawn background server: {}", e))?;

    for _ in 0..30 {
        thread::sleep(Duration::from_millis(100));
        if let Some(health) = http::check_health(host, port) {
            if as_json {
                println!(
                    "{}",
                    obj(vec![
                        ("status", s("running")),
                        ("started", json::b(true)),
                        ("url", s(&url)),
                        ("health", s(health)),
                    ])
                    .to_json_pretty()
                );
            } else {
                println!("Started Astryx native Rust server at {}", url);
            }
            return Ok(());
        }
    }

    Err(format!(
        "Timed out waiting for Astryx server to become healthy at {}",
        url
    ))
}

fn cmd_search(args: &[String], as_json: bool) -> Result<(), String> {
    let query = first_positional(args).unwrap_or("");
    if query.is_empty() {
        return Err("Usage: astryx-ds-server search <query> [--kind component|hook|token|theme|template|doc] [--limit N] [--json]".to_string());
    }
    let kind = flag_value(args, "--kind");
    let limit = flag_value(args, "--limit")
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(15);
    let hits = search_catalog(catalog(), query, kind, limit);
    if as_json {
        let out = obj(vec![
            ("query", s(query)),
            ("count", n(hits.len())),
            ("results", arr(hits.iter().map(|h| h.to_json()).collect())),
        ]);
        println!("{}", out.to_json_pretty());
    } else {
        println!("Results for \"{}\" ({}):\n", query, hits.len());
        for h in hits {
            println!("  [{:<9}] {} ({})", h.kind, h.id, h.category);
            println!("             {}", truncate(&h.description, 100));
            println!("             -> {}\n", h.follow_up);
        }
    }
    Ok(())
}

fn cmd_component(args: &[String], as_json: bool) -> Result<(), String> {
    let cat = catalog();
    if has_flag(args, "--list") || first_positional(args).is_none() {
        let cat_filter = flag_value(args, "--category").map(|x| x.to_lowercase());
        let kind_filter = flag_value(args, "--kind").map(|x| x.to_lowercase());
        let filtered: Vec<_> = cat
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
            })
            .collect();
        if as_json {
            println!(
                "{}",
                arr(filtered.iter().map(|c| c.summary_json()).collect()).to_json_pretty()
            );
        } else {
            println!("Astryx Components & Hooks ({}):\n", filtered.len());
            for c in filtered {
                println!(
                    "  {:<32} [{:<9}] {:<18} {}",
                    c.name, c.kind, c.category, c.import_path
                );
            }
        }
        return Ok(());
    }

    let name = first_positional(args).unwrap();
    let comp = cat
        .find_component(name)
        .ok_or_else(|| format!("Component '{}' not found. Try `astryx-ds-server search {}`.", name, name))?;

    if as_json {
        println!("{}", comp.detail_json().to_json_pretty());
    } else {
        println!("# {} ({} • {})\n", comp.display_name, comp.kind, comp.category);
        println!("{}\n", comp.description);
        println!("Import: {}\n", comp.import_path);
        println!("Example:\n{}\n", comp.example_code);
        if !comp.props.is_empty() {
            println!("Props ({}):", comp.props.len());
            for p in &comp.props {
                let req = if p.required { " (required)" } else { "" };
                let def = if p.default_value.is_empty() {
                    String::new()
                } else {
                    format!(" [default: {}]", p.default_value)
                };
                println!("  - {}: {}{}{}", p.name, p.prop_type, req, def);
                if !p.description.is_empty() {
                    println!("      {}", truncate(&p.description, 120));
                }
            }
            println!();
        }
        if !comp.best_practices.is_empty() {
            println!("Best Practices:");
            for bp in &comp.best_practices {
                let mark = if bp.do_rule { "[DO]   " } else { "[DON'T]" };
                println!("  {} {}", mark, bp.text);
            }
        }
    }
    Ok(())
}

fn cmd_tokens(args: &[String], as_json: bool) -> Result<(), String> {
    let cat = catalog();
    let mode = flag_value(args, "--mode").unwrap_or("auto");
    if has_flag(args, "--css") {
        let css = generate_theme_css(cat, None, mode)?;
        print!("{}", css);
        return Ok(());
    }
    let fam = flag_value(args, "--family").map(|x| x.to_lowercase());
    let filtered: Vec<_> = cat
        .tokens
        .iter()
        .filter(|t| {
            fam.as_ref()
                .map(|f| t.family.to_lowercase() == *f)
                .unwrap_or(true)
        })
        .collect();
    if as_json {
        println!(
            "{}",
            arr(filtered.iter().map(|t| t.to_json()).collect()).to_json_pretty()
        );
    } else {
        println!("Astryx Design Tokens ({}):\n", filtered.len());
        for t in filtered {
            println!(
                "  {:<36} [{:<10}] light={} | dark={}",
                t.name, t.family, t.light, t.dark
            );
        }
    }
    Ok(())
}

fn cmd_theme(args: &[String], as_json: bool) -> Result<(), String> {
    let cat = catalog();
    let mode = flag_value(args, "--mode").unwrap_or("auto");
    let target = first_positional(args);

    if has_flag(args, "--css") {
        let css = generate_theme_css(cat, target, mode)?;
        print!("{}", css);
        return Ok(());
    }

    if has_flag(args, "--list") || target.is_none() {
        if as_json {
            println!(
                "{}",
                arr(cat.themes.iter().map(|t| t.summary_json()).collect()).to_json_pretty()
            );
        } else {
            println!("Astryx Official Themes ({}):\n", cat.themes.len());
            for th in &cat.themes {
                println!(
                    "  {:<12} {:<30} modes={:<12} fonts={}/{}",
                    th.name,
                    th.package_name,
                    th.color_modes.join(","),
                    th.font_heading,
                    th.font_body
                );
            }
        }
        return Ok(());
    }

    let name = target.unwrap();
    let th = cat
        .find_theme(name)
        .ok_or_else(|| format!("Theme '{}' not found.", name))?;
    if as_json {
        println!("{}", th.detail_json().to_json_pretty());
    } else {
        println!("# {} ({})\n", th.display_name, th.package_name);
        println!("{}\n", th.description);
        println!("Color Modes: {}", th.color_modes.join(", "));
        println!(
            "Typography: heading='{}', body='{}', code='{}' (base={}px, ratio={})",
            th.font_heading, th.font_body, th.font_code, th.scale_base, th.scale_ratio
        );
        println!("Token Overrides: {}", th.tokens.len());
        println!(
            "\nGenerate CSS: astryx-ds-server theme {} --css --mode auto",
            th.name
        );
    }
    Ok(())
}

fn cmd_template(args: &[String], as_json: bool) -> Result<(), String> {
    let cat = catalog();
    if has_flag(args, "--list") || first_positional(args).is_none() {
        if as_json {
            println!(
                "{}",
                arr(cat.templates.iter().map(|t| t.to_json()).collect()).to_json_pretty()
            );
        } else {
            println!("Astryx Page Templates ({}):\n", cat.templates.len());
            for t in &cat.templates {
                println!("  {:<28} [{:<22}] {}", t.slug, t.category, t.name);
            }
        }
        return Ok(());
    }

    let slug = first_positional(args).unwrap();
    let tpl = cat
        .find_template(slug)
        .ok_or_else(|| format!("Template '{}' not found.", slug))?;
    if as_json {
        println!("{}", tpl.to_json().to_json_pretty());
    } else {
        println!("# {} ({})\n", tpl.name, tpl.slug);
        println!("Category: {}\n", tpl.category);
        println!("{}\n", tpl.description);
        println!("Components used: {}", tpl.components.join(", "));
        println!(
            "\nScaffold: npx @astryxdesign/cli template {} src/pages/{}.tsx",
            tpl.slug, tpl.slug
        );
    }
    Ok(())
}

fn cmd_docs(args: &[String], as_json: bool) -> Result<(), String> {
    let cat = catalog();
    if has_flag(args, "--list") || first_positional(args).is_none() {
        if as_json {
            println!(
                "{}",
                arr(cat.docs.iter().map(|d| d.summary_json()).collect()).to_json_pretty()
            );
        } else {
            println!("Astryx Reference Docs ({}):\n", cat.docs.len());
            for d in &cat.docs {
                println!("  {:<20} — {}", d.slug, truncate(&d.description, 90));
            }
        }
        return Ok(());
    }

    let slug = first_positional(args).unwrap();
    let doc = cat
        .find_doc(slug)
        .ok_or_else(|| format!("Doc topic '{}' not found.", slug))?;
    if as_json {
        println!("{}", doc.detail_json().to_json_pretty());
    } else {
        println!("# {}\n", doc.title);
        if !doc.description.is_empty() {
            println!("{}\n", doc.description);
        }
        for sec in &doc.sections {
            println!("## {}\n{}\n", sec.title, sec.body);
        }
    }
    Ok(())
}

fn cmd_build(args: &[String], as_json: bool) -> Result<(), String> {
    let idea = first_positional(args).unwrap_or("dashboard");
    let plan = build_plan(catalog(), idea);
    if as_json {
        println!("{}", plan.to_json_pretty());
    } else {
        println!("# Astryx Build Plan for \"{}\"\n", idea);
        println!(
            "Recommended Template: {}\n",
            plan.get("recommendedTemplate")
                .and_then(|v| v.as_str())
                .unwrap_or("blank")
        );
        if let Some(steps) = plan.get("workflow").and_then(|v| v.as_array()) {
            println!("Workflow:");
            for st in steps {
                if let Some(text) = st.as_str() {
                    println!("  {}", text);
                }
            }
        }
    }
    Ok(())
}

fn cmd_doctor(args: &[String], as_json: bool) -> Result<(), String> {
    let target = first_positional(args).unwrap_or(".");
    let report = audit_path(Path::new(target));
    if as_json {
        println!("{}", report.to_json_pretty());
    } else {
        let passed = report.get("passed").and_then(|v| v.as_bool()).unwrap_or(false);
        let files = report
            .get("scannedFiles")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        println!(
            "Astryx Doctor — {} (scanned {} files)",
            if passed { "PASSED" } else { "FAILED" },
            files
        );
        if let Some(findings) = report.get("findings").and_then(|v| v.as_array()) {
            for f in findings {
                println!(
                    "  [{}] {}:{} ({}) — {}",
                    f.get("severity").and_then(|v| v.as_str()).unwrap_or(""),
                    f.get("file").and_then(|v| v.as_str()).unwrap_or(""),
                    f.get("line").and_then(|v| v.as_u64()).unwrap_or(0),
                    f.get("rule").and_then(|v| v.as_str()).unwrap_or(""),
                    f.get("message").and_then(|v| v.as_str()).unwrap_or("")
                );
            }
        }
    }
    Ok(())
}

fn truncate(input: &str, max_chars: usize) -> String {
    let mut chars = input.chars();
    let taken: String = chars.by_ref().take(max_chars).collect();
    if chars.next().is_some() {
        format!("{}...", taken)
    } else {
        taken
    }
}

fn print_help() {
    println!(
        r#"astryx-ds-server {} — Native Rust Astryx Design System Service (Rei Skills)

SERVING & AGENT PROTOCOLS:
  serve [--host 127.0.0.1] [--port 7331]   Start HTTP/1.1 API + live Explorer UI
  ensure [--host 127.0.0.1] [--port 7331]  Auto-start detached background server if not running
  mcp                                      Run native MCP JSON-RPC 2.0 server over stdio

DESIGN SYSTEM CLI QUERIES:
  search <query> [--kind ...] [--limit N]  Search components, hooks, tokens, themes, templates, docs
  component [Name | --list] [--category C] Inspect component/hook API, props, best practices, a11y
  tokens [--family F] [--css] [--mode M]   Inspect 211 CSS tokens or emit tokens.css
  theme [name | --list] [--css] [--mode M] Inspect 7 official themes or emit theme tokens.css
  template [slug | --list]                 Inspect 58 Astryx page templates
  docs [topic | --list]                    Read Astryx design principles & architecture docs
  build "<page idea>"                      Recommend page template, components, and workflow
  doctor [path]                            Audit TSX/TS/JSX/CSS files for Astryx anti-patterns
  manifest | stats                         Print JSON manifest or catalog counts

GLOBAL FLAGS:
  --json                                   Emit machine-readable JSON output
  -V, --version                            Print version info
  -h, --help                               Print this help message"#,
        env!("CARGO_PKG_VERSION")
    );
}
