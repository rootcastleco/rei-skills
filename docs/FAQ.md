# ❓ Frequently Asked Questions (FAQ)

Answers to common questions about **REI Skills** and the **REI Reverse Engineering (`rei-rea`)** integration.

---

## General Questions

### What are "skills" in REI Skills?
Skills are structured `SKILL.md` playbooks that give AI coding assistants (Claude Code, Codex CLI, Gemini CLI, Cursor, Antigravity, OpenCode) domain-specific workflows, architectural constraints, and tool usage rules on demand.

### Do I have to install all 895 skills?
**No.** With the upgraded REI Skill Manager CLI, you can install individual skills or curated role bundles selectively:
```bash
npx rei-skills add brainstorming --cursor
npx rei-skills add rei-rea --claude
```
Or install the complete catalog with `npx rei-skills` — your AI assistant only loads skills into its context window when triggered.

### What is the difference between Bundles and Workflows?
- **Bundles** ([`docs/BUNDLES.md`](BUNDLES.md)) are curated skill collections organized by engineering role (e.g., `rei-rea`, `essentials`, `fullstack`).
- **Workflows** ([`docs/WORKFLOWS.md`](WORKFLOWS.md)) are step-by-step execution playbooks that coordinate multiple skills in sequence.

---

## REI Reverse Engineering (`rei-rea`) Questions

### Do the `rei-*` reverse-engineering skills work without installing the Python workbench?
**Yes.** All 12 `rei-*` skills work standalone as structured analytical methodologies (`EVIDENCE` / `INFERENCE` / `UNKNOWN` provenance discipline, triage checklists, and architecture patterns). Installing the [Rei-Reverse-engineer](https://github.com/rootcastleco/Rei-Reverse-engineer) Python package (`rei-rea` CLI + `rei-rea-mcp` server) unlocks automated binary parsing, SHA-256 casebook management, and MCP tool execution.

### Does REI Skills execute untrusted binaries during reverse-engineering triage?
**No.** Static triage in `rei-rea` inspects headers, sections, strings, hashes, and entropy without executing target binaries.

---

## Cross-Platform & Troubleshooting

### Does REI Skills work on Windows without Developer Mode symlinks?
**Yes.** `npx rei-skills` automatically resolves and materializes symlinked skills (`docx`, `pdf`, `pptx`, `xlsx`) into full directories during installation on Windows, macOS, and Linux.

### How do I check if my installation is healthy?
Run:
```bash
npx rei-skills doctor
npx rei-skills verify --path .cursor/skills
```
