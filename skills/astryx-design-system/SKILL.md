---
name: astryx-design-system
description: "Meta Astryx design system skill with an auto-serving native Rust HTTP, MCP, and CLI server covering 176+ components, 87 hooks, 211 tokens, 7 themes, and 58 templates."
risk: safe
source: https://github.com/meta/astryx
license: MIT
tags: ["design-system", "astryx", "react", "stylex", "rust", "mcp", "ui"]
---

# Meta Astryx Design System (Native Rust Service)

Authoritative agentic skill for **[Meta Astryx](https://github.com/meta/astryx)** (`@astryxdesign/core`, React 19+, StyleX v0.19+) backed by an embedded, zero-dependency **native Rust server (`astryx-ds-server`)** that automatically compiles and serves the full design-system catalog over **HTTP/JSON**, **live CSS token stylesheets**, **interactive Explorer UI**, **MCP stdio**, and **CLI**.

## When to Use

- Use when building, styling, theming, or migrating React 19+ UIs with `@astryxdesign/core` and `@astryxdesign/theme-*`.
- Use when choosing accessible UI components, hooks, page templates, or semantic CSS tokens from Meta's Astryx design system.
- Use when you need a fast local design-system server (HTTP API, live theme CSS, interactive Explorer UI, or MCP tools) powered natively by Rust without running Node/npm lookups on every query.
- Use when auditing React/TSX/CSS code against Astryx rules (`doctor`).

## Automatic Native Rust Service

Start or ensure the local native Rust server automatically (builds `--release` on first run if missing or stale, then spawns a background server on `http://127.0.0.1:7331` if not already running):

```bash
# Cross-platform (Windows, macOS, Linux) — auto-builds & auto-serves
node skills/astryx-design-system/scripts/astryx-serve.mjs

# Windows PowerShell
./skills/astryx-design-system/scripts/astryx-serve.ps1

# macOS / Linux
sh skills/astryx-design-system/scripts/astryx-serve.sh
```

Once running:

- **Explorer UI:** `http://127.0.0.1:7331/` (live 7-theme switcher, Light/Dark mode, component inspector, token swatches, template browser, page builder, code doctor)
- **JSON API:** `GET /api/search?q=...`, `GET /api/components/<Name>`, `GET /api/tokens`, `GET /api/themes/<name>/tokens.css`, `GET /api/templates`, `GET /api/build?idea=...`, `POST /api/doctor`
- **MCP Stdio Mode:** `node skills/astryx-design-system/scripts/astryx-serve.mjs mcp` (see [mcp.json](mcp.json))

## Core Workflow & Instructions

Always follow Astryx's template-first workflow instead of composing pages from scratch:

1. **Plan from an idea:** Query the Rust server for matching templates and components:
   ```bash
   node skills/astryx-design-system/scripts/astryx-serve.mjs build "analytics dashboard with KPIs and table"
   ```
   (Or via official Astryx CLI inside a consumer project: `npx @astryxdesign/cli build "<idea>"`.)
2. **Scaffold a page template:** Pick one of the 58 official templates (`dashboard`, `settings`, `ai-chat`, `table-page`, `detail-page`, `form-wizard`, `kanban-board`, etc.) and keep its `Layout` frame, gaps, and padding intact. Wrap page content in `AppShell`, `TopNav`, and/or `SideNav`.
3. **Verify exact component props before writing JSX:**
   ```bash
   node skills/astryx-design-system/scripts/astryx-serve.mjs component Button
   node skills/astryx-design-system/scripts/astryx-serve.mjs component Dialog --json
   ```
4. **Apply theming via CSS custom properties (no component wrapping):**
   ```tsx
   import '@astryxdesign/theme-neutral/fonts.css';
   import '@astryxdesign/core/reset.css';
   import '@astryxdesign/core/astryx.css';
   import '@astryxdesign/theme-neutral/theme.css';
   import {Theme} from '@astryxdesign/core/theme';
   import {neutralTheme} from '@astryxdesign/theme-neutral/built';
   import {Button} from '@astryxdesign/core/Button';

   export function App() {
     return (
       <Theme theme={neutralTheme} mode="system">
         <Button label="Save changes" variant="primary" />
       </Theme>
     );
   }
   ```
5. **Audit every file before delivery:**
   ```bash
   node skills/astryx-design-system/scripts/astryx-serve.mjs doctor ./src
   ```

## Non-Negotiable Astryx Rules

- **`label` vs `children`:** `Button`, `IconButton`, `Badge`, `Token`, and `Tab` take text in `label` (`<Button label="Save" />`). `Text`, `Heading`, and `Link` take `children`.
- **Boolean naming:** All boolean props start with `is` or `has` (`isOpen`, `isDisabled`, `isLoading`, `isSelected`), paired with `onOpenChange` / `defaultIsOpen`.
- **Controlled inputs:** Form fields take `value` and `onChange`.
- **Navigation links:** Never write raw `<a href="...">`. Use `<Link>` from `@astryxdesign/core/Link` or `useLinkComponent()`.
- **Dense data = rows:** Use `Table` or `List`/`Item` for dense data lists; reserve `Card` for discrete widgets or galleries and `Section` for settings groups.
- **Semantic tokens only:** Never hardcode hex colors or raw pixel spacing. Use `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`, `var(--shadow-*)`, and `var(--text-*)`.
- **No inline styles or `@apply`:** Use component props, StyleX `xstyle`, or Tailwind semantic classes mapped to Astryx CSS variables.

## Reference Documentation

- [README.md](README.md) — Full architecture, auto-serve setup, MCP config, and troubleshooting
- [references/components.md](references/components.md) — Complete categorized index of 176 components, 87 hooks, and 9 utilities
- [references/tokens.md](references/tokens.md) — Complete catalog of all 211 CSS custom properties across 13 token families
- [references/themes.md](references/themes.md) — All 7 official themes (`neutral`, `butter`, `chocolate`, `gothic`, `matcha`, `stone`, `y2k`)
- [references/principles-and-conventions.md](references/principles-and-conventions.md) — Design rules, naming table, StyleX v0.19 capabilities, and anti-patterns
- [references/rust-service.md](references/rust-service.md) — Native Rust HTTP API, MCP tools, CLI subcommands, and auto-launchers

## Do Not Use

- Do not use for non-React frameworks (Vue, Svelte, Angular, Flutter) or projects locked into another component library (MUI, Chakra, Ant Design) unless migrating to Astryx.
- Do not use as a substitute for `@astryxdesign/cli upgrade --apply` AST codemods or `swizzle` source ejection inside consumer projects.

## Constraints and Safety

- **Local loopback service only:** `astryx-ds-server` binds to `127.0.0.1` by default, executes zero shell commands from HTTP or MCP inputs, and treats all submitted code snippets as untrusted inputs during static `doctor` scanning.
- **Rust toolchain required for first native build:** Auto-building `astryx-ds-server` requires `cargo` / `rustc` (Rust 1.70+ recommended; zero external crates needed, compiles offline in ~5–10 seconds).
- **React 19+ peer requirement:** Consumer web applications using `@astryxdesign/core` require `react >= 19.0.0` and `react-dom >= 19.0.0`.
- **Static snapshot sync:** The embedded catalog matches `@astryxdesign/core@0.7.18` (strict schema contract). Re-run `scripts/extract-astryx-data.mjs` against a fresh `meta/astryx` checkout to sync future upstream releases.
