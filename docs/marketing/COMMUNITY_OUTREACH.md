# 🤝 Community Outreach & Ecosystem Submissions Guide

This guide provides ethical, technical-first templates for sharing **REI Skills (`v6.1.0`)** and **REI Reverse Engineering (`rei-rea`)** across developer communities and open-source directories.

---

## 1. Open-Source Directories & Awesome Lists to Submit PRs

1. **MCP & Agent Tooling Registries:**
   - Submit `Rei-Reverse-engineer` (`rei-rea-mcp`) and `rei-skills` (`--mcp-config`) to community Model Context Protocol server directories.
2. **Claude Code / Cursor / Codex Skill Collections:**
   - Highlight the `npx rei-skills export --format strict` capability and selective bundle installation (`npx rei-skills add <bundle>`).
3. **Reverse Engineering & Security Tooling Lists:**
   - Share the 12 `rei-*` specialist skills and the reproducible WebAssembly version-diff demo (`examples/rei-rea-demo/`).

---

## 2. Technical Community Post Templates (No Spam / Evidence-First)

### A. Reverse Engineering & Security Communities (`r/ReverseEngineering`, Security Forums)

**Subject:** *Open-source static binary triage & provenance-gated agent skills (`rei-rea` + `rei-skills`)*

**Body:**
> We recently open-sourced an integration between [`Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) (`v0.2.0`) and [`rei-skills`](https://github.com/rootcastleco/rei-skills) to solve a specific problem when using LLMs for binary triage: agents conflating structural facts with behavioral guesses.
>
> The 12 `rei-*` skills (`rei-binary-intelligence`, `rei-native-binaries`, `rei-wasm-and-managed`, `rei-firmware-and-iot`, `rei-evidence-ledger`, etc.) enforce a static-first boundary and require every finding to be tagged as `[EVIDENCE]` (backed by SHA-256 hash + offset/symbol), `[INFERENCE]`, or `[UNKNOWN]`.
>
> We included a reproducible Python walkthrough (`examples/rei-rea-demo/run_demo.py`) that builds two synthetic WebAssembly modules (`v1` and `v2`), runs `rei-rea` static triage + export diffing, and generates a structured finding report (`examples/rei-rea-demo/FINDING_REPORT.md`). Feedback on the schema and triage output is very welcome.

---

### B. AI Coding Assistant Communities (`Claude Code`, `Cursor`, `Codex`)

**Subject:** *`npx rei-skills`: Selective role bundle installer, Windows symlink materializer, and 895 schema-validated skills*

**Body:**
> If you use `SKILL.md` files in Claude Code, Cursor, Codex CLI, or Gemini CLI, we just shipped `rei-skills v6.1.0` ([github.com/rootcastleco/rei-skills](https://github.com/rootcastleco/rei-skills)):
> - **Selective install:** `npx rei-skills add essentials --cursor` or `npx rei-skills add rei-rea --claude` (install 1 skill or a role bundle instead of cloning 895 folders).
> - **Terminal discovery:** `npx rei-skills search <query>` and `npx rei-skills info <skill>`.
> - **Windows symlink fix:** Automatically materializes symlinked skills (`docx`, `pdf`, `pptx`, `xlsx`) even when `core.symlinks=false`.
> - **100% validated YAML:** Repaired 221 broken frontmatters and added `npx rei-skills export --format strict` for strict `agentskills-ref` parsers.
