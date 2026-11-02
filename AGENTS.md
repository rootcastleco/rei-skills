# AGENTS.md — REI Skills Universal AI Agent Router

> **Repository:** [rootcastleco/rei-skills](https://github.com/rootcastleco/rei-skills) (`v6.2.0`)  
> **Live Interactive Hub (GitHub Pages):** [https://rootcastleco.github.io/rei-skills/](https://rootcastleco.github.io/rei-skills/)  
> **Brand Owner:** [Rootcastle Engineering & Innovation](https://rootcastle.com/) — *Engineering Beyond Boundaries.*  
> **Compatibility:** OpenAI Codex, Anthropic Claude Code, Google Gemini CLI, Google Antigravity, Cursor, GitHub Copilot, Windsurf, Cline, Roo Code, Continue.dev, Aider, Amazon Q Developer, Zed AI, Block Goose, Trae, JetBrains Junie, OpenCode, Kiro, Sourcegraph Amp, Cognition Devin, and Multi-Model Agent SDKs.

---

## 1. Progressive Disclosure & Smart Routing Protocol (For All AI Agents)

This repository contains **895 schema-validated skills** in `skills/<skill-id>/SKILL.md`, **19 curated role bundles** in `data/bundles.json`, and **7 multi-skill workflows** in `data/workflows.json`.

1. **Never load all 895 skills into context simultaneously.**
2. **Use the Smart Intent & Stack Router first:** Run `node bin/install.js recommend "<task>" --files f1,f2` (or call MCP tool `rei_recommend_skills`) to rank the exact 1–5 skills, bundles, and workflows relevant to the user's request and workspace files.
3. **Read on demand:** Open `skills/<skill-id>/SKILL.md` (or call MCP tool `rei_get_skill`) only when executing a matching task.
4. **Enforce safety & epistemic provenance:**
   - For reverse-engineering, binary triage, firmware, and forensic tasks (`skills/rei-*/SKILL.md`), strictly separate findings into `[EVIDENCE]`, `[INFERENCE]`, and `[UNKNOWN]`, and never execute untrusted sample binaries directly.
   - For `risk: offensive` security skills, verify explicit user authorization before executing active testing commands.

---

## 2. Smart Skill Management MCP Server (`bin/mcp-server.js`)

Connect any MCP-capable AI client (Claude Code, Cursor, Windsurf, Cline, Roo Code, Gemini CLI, Codex, Antigravity) to the built-in zero-dependency stdio MCP server:

```json
{
  "mcpServers": {
    "rei-skills": {
      "command": "npx",
      "args": ["-y", "rei-skills", "mcp"]
    },
    "rei-rea": {
      "command": "rei-rea",
      "args": ["mcp"]
    }
  }
}
```

### Exposed MCP Tools (`8` Tools)
- `rei_recommend_skills` — Multi-signal Smart Intent & Stack Router (English + Turkish + file extension detection)
- `rei_search_skills` — Keyword, category, and risk-profile catalog search
- `rei_get_skill` — On-demand loading of `SKILL.md` and `references/*`
- `rei_get_workflow` — Retrieve multi-step execution playbooks
- `rei_list_bundles` — Inspect curated role bundles
- `rei_install_skill` — Non-destructive installation into any of the 21 AI assistant formats
- `rei_compile_skill` — Transpile any skill into `cursor-mdc`, `copilot-instructions`, `windsurf-rule`, `sdk-json`, etc.
- `rei_list_ai_targets` — List all 21 supported AI assistants and target paths

---

## 3. First-Class REI Reverse Engineering (`rei-rea`) Skills (`12` Specialist Skills)

Synchronized from [`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) (`v0.2.0`):

| Skill ID | Path | Specialization |
| :--- | :--- | :--- |
| `rei-rea-orchestrator` | `skills/rei-rea-orchestrator/SKILL.md` | Master multi-phase reverse-engineering router & orchestrator |
| `rei-binary-intelligence` | `skills/rei-binary-intelligence/SKILL.md` | Static PE/ELF/Mach-O/APK/Wasm header, section, string & entropy triage |
| `rei-casebook-forensics` | `skills/rei-casebook-forensics/SKILL.md` | SHA-256 chain-of-custody casebook & structured finding reports |
| `rei-native-binaries` | `skills/rei-native-binaries/SKILL.md` | Native C/C++/Rust/Go/Swift/ObjC symbol, import/export & ABI analysis |
| `rei-electron-and-js` | `skills/rei-electron-and-js/SKILL.md` | Electron ASAR, preload bridge, IPC surface & bundled JS inspection |
| `rei-android-apks` | `skills/rei-android-apks/SKILL.md` | Android APK manifest, DEX structure, JNI bridge & signing inspection |
| `rei-firmware-and-iot` | `skills/rei-firmware-and-iot/SKILL.md` | Embedded firmware magic offset scanning & entropy segmentation |
| `rei-mobile-runtime` | `skills/rei-mobile-runtime/SKILL.md` | Authorized Frida/LLDB/ADB dynamic runtime verification playbooks |
| `rei-evidence-ledger` | `skills/rei-evidence-ledger/SKILL.md` | Provenance-gated `[EVIDENCE]` / `[INFERENCE]` / `[UNKNOWN]` auditing |
| `rei-reconstruction-parity` | `skills/rei-reconstruction-parity/SKILL.md` | Clean-room structural parity & cross-release binary diffing |
| `rei-wasm-and-managed` | `skills/rei-wasm-and-managed/SKILL.md` | WebAssembly custom sections, imports/exports & .NET/JVM metadata |
| `rei-web-and-protocols` | `skills/rei-web-and-protocols/SKILL.md` | Sourcemaps, webpack/Vite chunks, GraphQL schemas & protocol frames |

---

## 4. Universal CLI & Compiler Commands (`bin/install.js`)

```bash
# Smart Intent & Stack Router (English & Turkish + workspace file detection)
node bin/install.js recommend "Reverse engineer Android APK and firmware" --files app.apk,router.bin

# Start the Smart Skill Management MCP Server over stdio
node bin/install.js mcp

# List all 21 supported AI assistants, native formats, and flags
node bin/install.js targets

# Search skills by keyword, category, or risk
node bin/install.js search "reverse engineering"

# Install a skill or bundle for any AI assistant (21 targets supported)
node bin/install.js add rei-rea --claude
node bin/install.js add rei-rea --copilot --workspace
node bin/install.js add rei-rea --windsurf --workspace
node bin/install.js add rei-rea --cursor --workspace
node bin/install.js add rei-rea --cline --workspace

# Compile/export skills into any AI format (strict, cursor-mdc, copilot-instructions, windsurf-rule, sdk-json, agents-md)
node bin/install.js export --format sdk-json --filter rei- --output ./dist-sdk
```

---

## 5. Repository Validation & Build Commands

When modifying skills or scripts in this repository, always run:

```bash
npm run build
npm run validate:strict
npm run security-audit
npm test
```
