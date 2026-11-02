# 🔒 REI Skills — Platform Threat Model

**Document ID:** `REI-SEC-TM-2026-001`  
**Status:** Enforced in CI  
**Maintainer:** Rootcastle Engineering & Innovation

---

## 1. System Scope & Trust Boundaries

**REI Skills** operates across four distinct trust boundaries:

1. **Repository & Build Pipeline Boundary (`scripts/`, `.github/workflows/`):** Processes 895 `SKILL.md` files, generates JSON catalogs (`skills_index.json`, `data/catalog.json`), and synchronizes upstream collections (`scripts/sync_rei_rea.py`, `scripts/sync_microsoft_skills.py`).
2. **CLI Installer Boundary (`bin/install.js`):** Runs on developer workstations via `npx rei-skills`, writing files to `.cursor/skills`, `~/.claude/skills`, `~/.gemini/antigravity/skills`, and optionally updating MCP JSON configs.
3. **Agent Prompt Boundary (`skills/*/SKILL.md`):** Loaded into AI assistant context windows to guide code generation, analysis, and tool execution.
4. **Reverse-Engineering Sample Boundary (`rei-rea`):** Analyzes potentially untrusted binary artifacts (`PE`, `ELF`, `Mach-O`, `APK`, `Wasm`, firmware images).

---

## 2. Threat Matrix & Mitigations

| Threat ID | Threat Description | Attack Vector | Impact | Implemented Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **TM-01** | **Destructive Installer Overwrite** | Installer deletes an existing directory containing `.git` that belongs to an unrelated user project. | High (Data Loss) | `bin/install.js` (`inspectGitRepo`) verifies `remote.origin.url` before migrating legacy repos, creates timestamped backups before changes, and aborts if an unrelated Git repo is detected. Covered by `scripts/tests/installer.test.js`. |
| **TM-02** | **MCP Configuration Corruption** | `--mcp-config` overwrites or corrupts user's existing `mcp.json`. | Medium | `bin/install.js` (`configureMcp`) creates a `.bak` backup file before modifying any existing JSON file and validates JSON syntax before writing. |
| **TM-03** | **Prompt Injection / Unbounded Offensive Execution** | A skill instructs an AI agent to run destructive shell commands (`rm -rf /`) or unauthorized network exploits without user consent. | High | `scripts/security_audit.js` scans all 895 skills in CI (with no `continue-on-error`), requiring `AUTHORIZED USE ONLY` banners on offensive skills and flagging unguarded destructive patterns. |
| **TM-04** | **Accidental Execution of Untrusted Reverse-Engineering Samples** | Analyst or agent executes an untrusted binary during triage. | Critical | `rei-rea` skills enforce a **static-first boundary** (header/section/entropy parsing via `rei-rea` without executing target code). Dynamic skills (`rei-mobile-runtime`) explicitly require isolated sandbox/emulator execution. |
| **TM-05** | **CI Workflow Privilege Escalation** | GitHub Actions workflow with default write tokens auto-commits untrusted changes to `main`. | High | `.github/workflows/ci.yml` enforces top-level `permissions: contents: read`, removes auto-push to `main`, and runs deterministic drift checks instead. |
| **TM-06** | **Upstream Sync Supply-Chain Drift** | Unverified changes from upstream repositories silently overwrite local skills. | Medium | `scripts/sync_rei_rea.py` records SHA-256 hashes and upstream commit SHAs in `data/rei-rea-manifest.json` and supports `--check` (CI verification) and `--rollback`. |

---

## 3. Verification Commands

```bash
# Run automated security audit across all 895 skills
node scripts/security_audit.js

# Run installer safety & non-destructive migration tests
node scripts/tests/installer.test.js

# Verify REI REA manifest SHA-256 integrity
python scripts/sync_rei_rea.py --check
```
