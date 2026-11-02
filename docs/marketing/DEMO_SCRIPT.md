# 🎬 90-Second Terminal Demo Script (`REI Skills + REI REA`)

Use this script to record a crisp 90-second terminal screencast (or GIF via `vhs` / `asciinema`) for GitHub, X/Twitter, and LinkedIn.

---

## Pre-Recording Setup

- Terminal size: `120×34`, dark background (`#070B14`), JetBrains Mono `14pt`.
- Working directory: `rei-skills` repository root with `Rei-Reverse-engineer/src` available.

---

## Scene 1: Search & Inspect from the Terminal (`0:00 – 0:25`)

**Narration / Caption:**
*"REI Skills gives Claude Code, Codex, Gemini CLI, and Cursor 895 schema-validated skills—with instant terminal search and selective installation."*

```bash
# Search reverse-engineering skills
node bin/install.js search "reverse engineering"

# Inspect a specialist skill's metadata, risk profile, and upstream provenance
node bin/install.js info rei-rea-orchestrator
```

---

## Scene 2: Selective Role Bundle Install & Doctor Check (`0:25 – 0:55`)

**Narration / Caption:**
*"Don't bloat your workspace with 895 folders. Install only the 12-skill REI Reverse Engineering bundle (`rei-rea`) and verify your environment."*

```bash
# Install the 12-skill REI REA bundle into a workspace
node bin/install.js add rei-rea --local --path ./demo-workspace/.claude/skills

# Verify frontmatter integrity across installed skills
node bin/install.js verify --path ./demo-workspace/.claude/skills

# Run environment diagnostics
node bin/install.js doctor
```

---

## Scene 3: Reproducible Binary Triage & Version Diff (`0:55 – 1:30`)

**Narration / Caption:**
*"Paired with the REI Reverse Engineering Workbench, agents perform static binary triage, version diffing, and SHA-256 evidence logging without executing untrusted code."*

```bash
# Run the live WebAssembly v1 vs v2 reverse-engineering demo
python examples/rei-rea-demo/run_demo.py

# View the provenance-gated forensic report ([EVIDENCE] / [INFERENCE] / [UNKNOWN])
head -n 45 examples/rei-rea-demo/FINDING_REPORT.md
```
