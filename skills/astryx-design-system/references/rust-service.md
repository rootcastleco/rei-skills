# Native Rust Astryx Service API Reference (`astryx-ds-server`)

The bundled Rust crate (`rust-server/`) compiles with **zero external dependencies** (pure Rust `std`) into a single native binary (`~1.8 MB`) with the full Meta Astryx catalog embedded at compile time.

## Auto-Build & Auto-Serve Launchers

Every launcher automatically builds `target/release/astryx-ds-server` if missing or stale, then executes the requested mode:

| Platform | Command | Default Behavior |
| :--- | :--- | :--- |
| Cross-platform (Node) | `node skills/astryx-design-system/scripts/astryx-serve.mjs` | Runs `ensure` (auto-starts HTTP server on `127.0.0.1:7331`) |
| Windows PowerShell | `./skills/astryx-design-system/scripts/astryx-serve.ps1` | Runs `ensure` (auto-starts HTTP server on `127.0.0.1:7331`) |
| macOS / Linux | `sh skills/astryx-design-system/scripts/astryx-serve.sh` | Runs `ensure` (auto-starts HTTP server on `127.0.0.1:7331`) |
| Direct Rust binary | `cargo run --release --manifest-path skills/astryx-design-system/rust-server/Cargo.toml -- ensure` | Builds & ensures background server |

## HTTP / REST Endpoints (`http://127.0.0.1:7331`)

All JSON endpoints return CORS-enabled `application/json; charset=utf-8`.

| Method & Path | Description |
| :--- | :--- |
| `GET /` | Interactive **Astryx Design System Explorer UI** with live 7-theme switcher, Light/Dark mode, component inspector, token swatches, template gallery, page builder, and code doctor |
| `GET /health` | Service status, version, Astryx core version, and uptime |
| `GET /api/stats` | Catalog totals (components, hooks, utilities, tokens, themes, templates, docs) |
| `GET /api/manifest` | Machine-readable list of all HTTP endpoints and MCP tools |
| `GET /api/search?q=<query>&kind=<all\|component\|hook\|token\|theme\|template\|doc>&limit=<n>` | Ranked keyword, prefix, and fuzzy subsequence search |
| `GET /api/components?category=<cat>&kind=<component\|hook\|utility>&q=<filter>` | List/filter all 272 Astryx components, hooks, and utilities |
| `GET /api/components/<Name>` | Full component/hook API: import path, props, defaults, best practices, WCAG a11y, anatomy, and JSX example |
| `GET /api/tokens?family=<family>&q=<filter>` | List/filter all 211 design tokens across 13 families |
| `GET /api/tokens.css?mode=<auto\|light\|dark>` | Dynamic CSS custom properties stylesheet for Astryx core defaults |
| `GET /api/themes` | List all 7 official Astryx themes |
| `GET /api/themes/<name>` | Detailed theme metadata, fonts, type scale, and resolved light/dark token overrides |
| `GET /api/themes/<name>/tokens.css?mode=<auto\|light\|dark>` | Live compiled CSS stylesheet scoped to `[data-astryx-theme="<name>"]` |
| `GET /api/templates?category=<cat>&q=<filter>` | List/filter all 58 page templates and their used components |
| `GET /api/templates/<slug>` | Inspect one page template + scaffold command |
| `GET /api/docs` | List all 12 core reference documentation topics |
| `GET /api/docs/<slug>` | Full section-by-section guide (e.g. `principles`, `theme`, `getting-started`, `color`, `spacing`, `motion`) |
| `GET /api/build?idea=<prompt>` | Recommends page templates, components, hooks, and workflow steps for a UI idea |
| `POST /api/doctor` | Audits submitted code (`{"filename":"Page.tsx","code":"..."}` or raw text) for Astryx rule violations |

## Native MCP JSON-RPC 2.0 Server (`mcp`)

Start via `node skills/astryx-design-system/scripts/astryx-serve.mjs mcp` (or see [mcp.json](../mcp.json)). Supports both newline-delimited JSON-RPC and `Content-Length` framed stdio.

### Exposed MCP Tools

| Tool | Required Args | Purpose |
| :--- | :--- | :--- |
| `astryx_search` | `query` | Multi-domain ranked search (`kind`, `limit` optional) |
| `astryx_component` | `name` | Full component/hook props, best practices, WCAG a11y, JSX snippet |
| `astryx_tokens` | *(none)* | Filter 211 CSS tokens by `family` or `query` |
| `astryx_theme` | *(none)* | List/inspect themes or emit live `tokens.css` (`name`, `css`, `mode`) |
| `astryx_template` | *(none)* | List all 58 page templates or inspect a specific `slug` |
| `astryx_docs` | *(none)* | List or read reference guides (`topic`) |
| `astryx_build_plan` | `idea` | Recommend starter page template, components, hooks, and workflow |
| `astryx_doctor` | `code` or `path` | Audit a snippet or local project folder against Astryx rules |

### Exposed MCP Resources

- `astryx://stats` (`application/json`)
- `astryx://themes/neutral/tokens.css` (`text/css`)
- `astryx://docs/principles` (`application/json`)

## Direct CLI Reference

```bash
# Ensure background HTTP server is running (idempotent auto-start)
astryx-ds-server ensure --port 7331 --json

# Search across every domain
astryx-ds-server search "confirmation modal" --json

# Inspect a component's full API
astryx-ds-server component Button
astryx-ds-server component Dialog --json

# Generate live theme CSS
astryx-ds-server theme matcha --css --mode auto > matcha-tokens.css

# Plan a new page
astryx-ds-server build "team billing and subscription settings"

# Audit a project directory for Astryx anti-patterns
astryx-ds-server doctor ./src --json
```
