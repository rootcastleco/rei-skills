# 📣 Release Announcement: REI Skills v6.1.0

**Title:** `REI Skills v6.1.0 — 895 Schema-Validated Agent Skills, Upgraded CLI Manager & REI Reverse Engineering (REA) Integration`

---

We are excited to release **REI Skills v6.1.0**, a major engineering modernization of the REI Skills platform by **Rootcastle Engineering & Innovation**.

### What's New in `v6.1.0`

1. **First-Class REI Reverse Engineering (`rei-rea`) Integration (`12` Specialist Skills):**
   Synchronized directly from [`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) (`v0.2.0`), bringing structured static binary triage (`PE`, `ELF`, `Mach-O`, `APK`, `Wasm`), firmware magic/entropy scanning, Electron ASAR inspection, forensic casebook management, and `EVIDENCE` / `INFERENCE` / `UNKNOWN` provenance discipline to Claude Code, Codex, Gemini CLI, and Cursor.
   - Reproducible demo included in [`examples/rei-rea-demo/`](../../examples/rei-rea-demo/).

2. **Upgraded REI Skill Manager CLI (`npx rei-skills`):**
   - `npx rei-skills search <query>` — Search 895 skills from the terminal
   - `npx rei-skills info <skill-id>` — Inspect metadata, risk, and provenance
   - `npx rei-skills add <skill-or-bundle>` — Install individual skills or role bundles (`rei-rea`, `essentials`, `fullstack`, etc.)
   - `npx rei-skills doctor` & `npx rei-skills verify` — Diagnose environment health and verify YAML frontmatter
   - `npx rei-skills export --format strict` — Export strict 2-field frontmatter for `agentskills-ref` consumers
   - Non-destructive `.git` ownership verification, automatic backups, and Windows symlink materialization.

3. **100% Schema & Provenance Integrity (`895/895` Skills):**
   - Repaired 221 broken YAML frontmatter blocks across the catalog.
   - Restored upstream `source:` attribution across vendor and community skills (`microsoft/skills`, `anthropics/skills`, `obra/superpowers`, `rootcastleco/Rei-Reverse-engineer`).
   - Enforced strict CI validation (`validate_skills.py --strict`, `validate-skills.js`, `security_audit.js` with `0` critical/high/unclassified issues).

4. **Interactive Developer Hub (`docs/site/index.html`):**
   - Zero-dependency static search interface built via `scripts/build-doc-site.js`.

### Quick Start

```bash
# Install the full catalog
npx rei-skills

# Or install the REI Reverse Engineering bundle for Claude Code
npx rei-skills add rei-rea --claude
```
