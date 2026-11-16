# REI Skills — Adapter & Agent Skills Compatibility Matrix

**Scope:** `21` registered targets in [`lib/ai-adapters.js`](../lib/ai-adapters.js), `npx rei-skills` native installer ([`bin/install.js`](../bin/install.js)), and upstream `npx skills add` discovery specification (`vercel-labs/skills`).

> **Semantic Honesty Boundary:** The 21 supported targets do **not** share identical runtime semantics. Targets in `skill-dir` mode preserve nested `references/`, `scripts/`, and `agents/openai.yaml` subfiles, whereas rule-projected targets transpile `SKILL.md` into IDE rule headers (`cursor-mdc`, `copilot-instructions`, `windsurf-rule`, `markdown-rule`) or function-calling JSON schemas (`sdk-json`).

---

## 1. Universal Agent Skills Ecosystem (`npx skills add rootcastleco/rei-skills`)

Audit of the `1,423` skills in `skills/` against the `vercel-labs/skills` discovery specification:

| Check Item | Observed Result | Boundary / Notes |
| :--- | :--- | :--- |
| **Directory Discovery** | `1,412` top-level `skills/<id>/SKILL.md` + `11` nested 1-level `skills/<category>/<id>/SKILL.md` | Top-level & 1-level categorized layouts are standard discovery paths (`app-builder/templates`, `game-development/*`). |
| **Skill `name` Format** | `1,423 / 1,423` match `^[a-z0-9-]{1,64}$` | Verified clean (`0` invalid names). |
| **Description Length** | `1,423 / 1,423` `<= 1,024` chars | Verified clean (`0` oversized descriptions). |
| **Selective Installation** | `npx rei-skills add <id\|bundle> --<target> [-w]` | Avoids loading all 1,423 skills; `remove <id>` cleanly reverses single-skill installs. |
| **Windows Symlink Safety** | `docx`, `pdf`, `pptx`, `xlsx` aliases resolved via `data/aliases.json` | Real directory copies prevent Windows non-admin symlink failures. |
| **Conflict & Rollback** | Default `abort` policy on collisions; `backup` mode + `preview_token` | Verified by `scripts/tests/mcp-safe-installer.test.js` & `installer.test.js`. |

---

## 2. All 21 Registered AI Target Adapters (`lib/ai-adapters.js`)

| Adapter ID | Flag | Ecosystem | Projection Format | Workspace Path | Global Path Supported | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `antigravity` | `--antigravity` | Google DeepMind | `skill-dir` | `.agent/skills` | `~/.gemini/antigravity/skills` | Installer + YAML + CLI tests PASS |
| `claude` | `--claude` | Anthropic | `skill-dir` | `.claude/skills` | `~/.claude/skills` | Installer + symlink materialization PASS |
| `codex` | `--codex` | OpenAI | `skill-dir` | `.codex/skills` | `~/.codex/skills` | `agents/openai.yaml` + Gold 50 transpile PASS |
| `gemini` | `--gemini` | Google | `skill-dir` | `.gemini/skills` | `~/.gemini/skills` | Installer + frontmatter + Gold 50 PASS |
| `cursor` | `--cursor` | Anysphere | `cursor-hybrid` | `.cursor/skills` (+ `.cursor/rules/*.mdc`) | `~/.cursor/skills` | MCP safe installer + `.mdc` export PASS |
| `copilot` | `--copilot` | GitHub / MS | `copilot-instructions` | `.github/instructions` (+ `.github/prompts`) | `~/.copilot/skills` | `.instructions.md` export + Gold 50 PASS |
| `windsurf` | `--windsurf` | Codeium / Windsurf | `windsurf-rule` | `.windsurf/rules` | `~/.codeium/windsurf/skills` | Rule transpiler supported |
| `cline` | `--cline` | Cline | `markdown-rule` | `.clinerules` | `~/Documents/Cline/Rules` | Rule transpiler supported |
| `roocode` | `--roocode` | Roo Code | `markdown-rule` | `.roo/rules` | `~/.roo/rules` | Rule transpiler supported |
| `continue` | `--continue` | Continue | `continue-rule` | `.continue/rules` | `~/.continue/rules` | Rule transpiler supported |
| `aider` | `--aider` | Aider | `aider-conventions` | `.aider/skills` (`CONVENTIONS.md`) | `~/.aider/skills` | Target metadata & conventions path defined |
| `amazonq` | `--amazonq` | AWS | `markdown-rule` | `.amazonq/rules` | `~/.aws/amazonq/rules` | Rule transpiler supported |
| `zed` | `--zed` | Zed Industries | `markdown-rule` | `.zed/rules` | `~/.config/zed/rules` | Rule transpiler supported |
| `goose` | `--goose` | Block | `skill-dir` | `.goose/skills` | `~/.config/goose/skills` | Full directory copy |
| `trae` | `--trae` | Trae | `markdown-rule` | `.trae/rules` | `~/.trae/rules` | Rule transpiler supported |
| `junie` | `--junie` | JetBrains | `markdown-rule` | `.junie/skills` | `~/.junie/skills` | Rule transpiler supported |
| `opencode` | `--opencode` | OpenCode | `skill-dir` | `.agents/skills` | `~/.agents/skills` | Full directory copy |
| `kiro` | `--kiro` | AWS / Kiro | `skill-dir` | `.kiro/skills` | `~/.kiro/skills` | Full directory copy |
| `amp` | `--amp` | Sourcegraph | `skill-dir` | `.agents/skills` | `~/.config/amp/skills` | Full directory copy |
| `devin` | `--devin` | Cognition | `markdown-rule` | `.devin/playbooks` | `~/.devin/playbooks` | Playbook projection |
| `sdk` | `--sdk` | Multi-Model SDKs | `sdk-json` | `.rei-skills/sdk` | `~/.rei-skills/sdk` | OpenAI/Anthropic/Gemini JSON schema PASS |

*(External proprietary desktop/IDE binary loading of third-party clients like Devin/Trae/Zed is **NOT VERIFIED** inside headless CI; only local filesystem projection, frontmatter, and schema output formats are verified locally.)*
