# 🏆 REI Skills — Flagship Capability Showcase

A curated look at the engineering workflows that set **REI Skills** apart.

---

## 1. Provenance-Gated Reverse Engineering (`rei-rea`)

Most AI prompts hallucinate when asked to inspect compiled binaries. The **12 REI Reverse Engineering (`rei-rea`)** skills enforce a strict forensic contract:
- Every claim in [`examples/rei-rea-demo/FINDING_REPORT.md`](../../examples/rei-rea-demo/FINDING_REPORT.md) is tagged as:
  - **`[EVIDENCE]`** — Directly backed by a SHA-256 hash, section table, export symbol, or byte offset.
  - **`[INFERENCE]`** — Analytical hypothesis derived from evidence (e.g., `audit_packet` export + `audit.strict_mode` string -> packet auditing feature).
  - **`[UNKNOWN]`** — Questions that cannot be answered by static header inspection alone and require disassembly or dynamic tracing.

### Try It in 30 Seconds
```bash
npx rei-skills add rei-rea --claude
python examples/rei-rea-demo/run_demo.py
```

---

## 2. Selective Role Bundle Installation (`npx rei-skills add`)

Instead of copying 895 folders into every project workspace, developers can install role-specific bundles on demand:

```bash
# Install 12 reverse-engineering skills
npx rei-skills add rei-rea --cursor

# Install 8 Domain-Driven Design & CQRS skills
npx rei-skills add ddd-architecture --claude

# Install 5 core engineering hygiene skills
npx rei-skills add essentials --codex
```

---

## 3. Dual-Profile Frontmatter Exporter (`npx rei-skills export`)

Need strict `agentskills-ref` compatibility (`name` and `description` only) without losing repository provenance?

```bash
npx rei-skills export --format strict --output ./dist-strict-skills
```
Each exported skill writes a strict 2-field `SKILL.md` alongside a `.rei-metadata.json` sidecar preserving `risk`, `source`, and `category`.
