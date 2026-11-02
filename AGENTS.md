# AGENTS.md — REI Skills Universal AI Agent Router

> **Repository:** [rootcastleco/rei-skills](https://github.com/rootcastleco/rei-skills) (`v6.1.0`)  
> **Brand Owner:** [Rootcastle Engineering & Innovation](https://rootcastle.com/) — *Engineering Beyond Boundaries.*  
> **Compatibility:** OpenAI Codex, Anthropic Claude Code, Google Gemini CLI, Google Antigravity, Cursor, GitHub Copilot, Windsurf, Cline, Roo Code, Continue.dev, Aider, Amazon Q Developer, Zed AI, Block Goose, Trae, JetBrains Junie, OpenCode, Kiro, Sourcegraph Amp, Cognition Devin, and Multi-Model Agent SDKs.

---

## 1. Progressive Disclosure Protocol (For All AI Agents)

This repository contains **895 schema-validated skills** in `skills/<skill-id>/SKILL.md`, **19 curated role bundles** in `data/bundles.json`, and **7 multi-skill workflows** in `data/workflows.json`.

1. **Never load all 895 skills into context simultaneously.**
2. **Match intent first:** Query `data/catalog.json` or run `node bin/install.js search "<keywords>"` to identify the exact 1–3 skills relevant to the user's request.
3. **Read on demand:** Open `skills/<skill-id>/SKILL.md` (and any linked files in `references/` or `resources/`) only when executing a matching task.
4. **Enforce safety & epistemic provenance:**
   - For reverse-engineering, binary triage, firmware, and forensic tasks (`skills/rei-*/SKILL.md`), strictly separate findings into `[EVIDENCE]`, `[INFERENCE]`, and `[UNKNOWN]`, and never execute untrusted sample binaries directly.
   - For `risk: offensive` security skills, verify explicit user authorization before executing active testing commands.

---

## 2. First-Class REI Reverse Engineering (`rei-rea`) Skills (`12` Specialist Skills)

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

## 3. Universal CLI & Compiler Commands (`bin/install.js`)

```bash
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

## 4. Repository Validation & Build Commands

When modifying skills or scripts in this repository, always run:

```bash
npm run build
npm run validate:strict
npm run security-audit
npm test
```
