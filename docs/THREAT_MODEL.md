# 🔒 REI Skills — Platform Threat Model

**Document ID:** `REI-SEC-TM-2026-001`  
**Status:** Enforced in CI  
**Maintainer:** Rootcastle Engineering & Innovation

---

## 1. System Scope & Trust Boundaries

**REI Skills** operates across four distinct trust boundaries:

1. **Repository & Build Pipeline Boundary (`scripts/`, `.github/workflows/`):** Processes 1423 `SKILL.md` files, generates JSON catalogs (`skills_index.json`, `data/catalog.json`), and synchronizes upstream collections (`scripts/sync_rei_rea.py`, `scripts/sync_microsoft_skills.py`).
2. **CLI Installer Boundary (`bin/install.js`):** Runs on developer workstations via `npx rei-skills`, writing files to `.cursor/skills`, `~/.claude/skills`, `~/.gemini/antigravity/skills`, and optionally updating MCP JSON configs.
3. **Agent Prompt Boundary (`skills/*/SKILL.md`):** Loaded into AI assistant context windows to guide code generation, analysis, and tool execution.
4. **Reverse-Engineering Sample Boundary (`rei-rea`):** Analyzes potentially untrusted binary artifacts (`PE`, `ELF`, `Mach-O`, `APK`, `Wasm`, firmware images).

---

## 2. Threat Matrix & Mitigations

| Threat ID | Threat Description | Attack Vector | Impact | Implemented Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **TM-01** | **Destructive Installer Overwrite** | Installer deletes an existing directory containing `.git` that belongs to an unrelated user project. | High (Data Loss) | `bin/install.js` (`inspectGitRepo`) verifies `remote.origin.url` before migrating legacy repos, creates timestamped backups before changes, and aborts if an unrelated Git repo is detected. Covered by `scripts/tests/installer.test.js`. |
| **TM-02** | **MCP Configuration Corruption** | `--mcp-config` overwrites or corrupts user's existing `mcp.json`. | Medium | `bin/install.js` (`configureMcp`) creates a `.bak` backup file before modifying any existing JSON file and validates JSON syntax before writing. |
| **TM-03** | **Prompt Injection / Unbounded Offensive Execution** | A skill instructs an AI agent to run destructive shell commands (`rm -rf /`) or unauthorized network exploits without user consent. | High | `scripts/security_audit.js` scans all 1423 skills in CI (with no `continue-on-error`), requiring `AUTHORIZED USE ONLY` banners on offensive skills and flagging unguarded destructive patterns. |
| **TM-04** | **Accidental Execution of Untrusted Reverse-Engineering Samples** | Analyst or agent executes an untrusted binary during triage. | Critical | `rei-rea` skills enforce a **static-first boundary** (header/section/entropy parsing via `rei-rea` without executing target code). Dynamic skills (`rei-mobile-runtime`) explicitly require isolated sandbox/emulator execution. |
| **TM-05** | **CI Workflow Privilege Escalation** | GitHub Actions workflow with default write tokens auto-commits untrusted changes to `main`. | High | `.github/workflows/ci.yml` enforces top-level `permissions: contents: read`, removes auto-push to `main`, and runs deterministic drift checks instead. |
| **TM-06** | **Upstream Sync Supply-Chain Drift** | Unverified changes from upstream repositories silently overwrite local skills. | Medium | `scripts/sync_rei_rea.py` records SHA-256 hashes and upstream commit SHAs in `data/rei-rea-manifest.json` and supports `--check` (CI verification) and `--rollback`. |
| **TM-07** | **External Prompt Archive Injection & Cache Poisoning** | Malicious prompt templates imported from external endpoints inject instructions, scripts, or mismatched payloads. | High | `lib/prompt-archive.js` enforces HTTPS origin allowlist (`promt.rootcastle.com`), SHA-256 `contentSha256` verification, `scanPromptForInjection`, explicit `UNTRUSTED_EXTERNAL_REFERENCE` tagging, TTL/offline bundled fallback, and progressive `maxContextChars` capping. |
| **TM-08** | **MCP Tool Poisoning, Path Traversal & Secret Exfiltration** | Malicious arguments probe `~/.ssh`/`~/.aws`, poison tool schemas, pass shell commands, or leak API keys in outputs. | Critical | `lib/hol-guard-policy.js` enforces deny-by-default tool authorization, path boundary confinement, prompt injection & dangerous machine command scanning, supply-chain inspection, and automatic secret redaction in `bin/mcp-server.js`. |
| **TM-09** | **Gateway Replay, Flooding & Privilege Escalation** | Captured IPC requests are replayed, flooded to exhaust memory/threads, or escalated to hazardous hardware operations. | High | `rust/rei-hook-gateway` (`v0.2.0`) enforces constant-time token compare, bounded nonce replay cache, timestamp skew window, sliding-window per-client rate limits, `max_in_flight` backpressure, and `SafetyClass` capability + approval gates. |
| **TM-10** | **Unauthenticated Remote Gateway Exposure** | Operator binds the Rust gateway to `0.0.0.0` without transport authentication. | Critical | `validate_bind_address` fails closed on any non-loopback address unless `MtlsReadinessConfig.remote_enabled === true` AND verified mTLS certificate paths + CA + client SAN allowlists are explicitly configured. |
| **TM-11** | **Autonomous Self-Modification / Routing Regression** | Automated skill updates degrade safety filtering or introduce injected triggers into production catalogs. | High | `lib/improvement-engine.js` runs sandboxed in-memory experiments only (`automaticWrites: false`, `autoMerge: false`), gates changes via `compareBenchmarkRuns` on held-out `eval` metrics, and blocks security violations via HOL Guard before generating PR drafts. |

---

## 3. Verification Commands

```bash
# Run automated security audit across all 1423 skills
node scripts/security_audit.js

# Run security regression, HOL Guard policy, and MCP safe-installer suites
node scripts/tests/security-regression.test.js
node scripts/tests/hol-guard-policy.test.js
node scripts/tests/mcp-safe-installer.test.js

# Run Rust Secure Gateway v0.2.0 test suite (replay, rate limit, backpressure, mTLS fail-closed)
cargo test --manifest-path rust/rei-hook-gateway/Cargo.toml

# Run installer safety & non-destructive migration tests
node scripts/tests/installer.test.js

# Verify REI REA manifest SHA-256 integrity
python scripts/sync_rei_rea.py --check
```
