# 🗺️ REI Skills — Public Engineering Roadmap

This document tracks verified milestones and planned engineering work for **REI Skills** and its integration with the **REI Reverse Engineering Workbench (`rei-rea`)**.

---

## ✅ Delivered in `v6.1.0` (Current Release)

- **100% Schema-Validated Catalog (`895` Skills):** Repaired 221 broken YAML frontmatters, restored upstream repository provenance (`microsoft/skills`, `anthropics/skills`, `obra/superpowers`, `rootcastleco/Rei-Reverse-engineer`, etc.), and enforced cross-platform validation on Windows, macOS, and Linux.
- **First-Class REI Reverse Engineering (`rei-rea`) Integration:** Synchronized 12 specialist reverse-engineering skills (`rei-rea-orchestrator`, `rei-binary-intelligence`, `rei-casebook-forensics`, `rei-native-binaries`, `rei-electron-and-js`, `rei-android-apks`, `rei-firmware-and-iot`, `rei-mobile-runtime`, `rei-evidence-ledger`, `rei-reconstruction-parity`, `rei-wasm-and-managed`, `rei-web-and-protocols`) with SHA-256 manifest verification (`data/rei-rea-manifest.json`) and a reproducible WebAssembly triage demo (`examples/rei-rea-demo/`).
- **Upgraded REI Skill Manager CLI (`bin/install.js`):** Added `search`, `list`, `info`, `add`, `doctor`, `verify`, `update`, and `export` subcommands; safe `.git` ownership verification before migration; automatic backup/rollback; and cross-platform Windows symlink materialization.
- **Interactive Developer Hub (`docs/site/index.html`):** Built a zero-dependency searchable catalog explorer generated deterministically via `scripts/build-doc-site.js`.
- **Hardened CI & Security Gates:** Removed `continue-on-error` bypasses, removed auto-push bot commits to `main`, enforced `permissions: contents: read`, and achieved `0` critical/high/unclassified findings in `scripts/security_audit.js`.

---

## 🔭 Next Milestones (`v6.2.0` – `v6.3.0`)

### 1. Skill Execution Eval Harness (`v6.2.0`)
- Deterministic prompt-and-rubric test fixtures for top role bundles (`rei-rea`, `essentials`, `fullstack`, `security-developer`) to benchmark trigger accuracy across Claude Code, Codex CLI, and Gemini CLI.

### 2. Extended REI REA Format Fixtures & Playbooks (`v6.2.0`)
- Additional synthetic, redistributable reverse-engineering fixtures (ELF stripped binary, Electron ASAR mini-bundle, and SquashFS firmware header fixture) in `examples/rei-rea-demo/`.

### 3. Lockfile-Pinned Workspace Skill Manifests (`v6.3.0`)
- Support a project-level `rei-skills.lock.json` file allowing engineering teams to pin exact skill IDs and SHA-256 hashes per repository and sync them in one command (`npx rei-skills sync`).

---

## 💡 Proposing Roadmap Items

Have a concrete engineering use case? Open a [Feature Request](https://github.com/rootcastleco/rei-skills/issues/new?template=feature-request.yml) with reproducible requirements.
