# REI Skills — Baseline Repository Audit Report

**Audit Date:** 2026-11-16  
**Inspected Commit SHA (`main`):** `0f32ce1535fbaaaff7d349d4629e217710122229`  
**Isolated Feature Branch:** `feat/auditable-quality-gold50-platform`  
**Observed Package Version:** `rei-skills@6.5.0` (verified live on `https://registry.npmjs.org/rei-skills/6.5.0` with `HTTP 200`, `shasum=e43a0d27dbb046e006998fbc17b4797be50a61ec`, OIDC `attestations=true`, `dist-tags.latest="6.5.0"`)

---

## 1. Inspected Baseline Inventory

| Subsystem | Observed State on `0f32ce1` | Evidence Source |
| :--- | :--- | :--- |
| **Skill Registry** | `1,423` skills indexed (`1,412` top-level + `11` nested 1-level skills under `app-builder/` & `game-development/`); `0` invalid `a-z0-9-` names > 64 chars; `0` descriptions > 1,024 chars | `data/catalog.json`, `scripts/validate_skills.py`, `scripts/validate-skills.js` |
| **AI Target Adapters** | `21` registered targets (`claude`, `codex`, `gemini`, `antigravity`, `cursor`, `copilot`, `windsurf`, `cline`, `roocode`, `continue`, `aider`, `amazonq`, `zed`, `goose`, `trae`, `junie`, `opencode`, `kiro`, `amp`, `devin`, `sdk`) | `lib/ai-adapters.js` |
| **MCP Server (`bin/mcp-server.js`)** | `SERVER_INFO.version = "6.5.0"`; `10` default tools + `3` opt-in extended tools (`REI_MCP_EXTENDED_TOOLS=1`), wrapped in `lib/hol-guard-policy.js` | `bin/mcp-server.js`, `lib/hol-guard-policy.js` |
| **Hybrid Router** | Held-out `eval` (120 tasks): `Recall@3 = 96.43%`, `MRR = 0.8897`, `nDCG@5 = 0.8456`, `FPR = 0.0%`, `positive_tr Recall@3 = 100.0%`, `p95 = 2.919 ms` | `data/benchmarks/routing-evaluation-report.json` |
| **Rust Gateway (`rust/rei-hook-gateway`)** | `v0.2.0` (`publish = false`, dependencies: `serde`, `serde_json`, `subtle`); loopback IPC (`127.0.0.1:9783`), `7/7` cargo tests passing | `rust/rei-hook-gateway/Cargo.toml`, `src/lib.rs`, `src/main.rs` |
| **Prompt Archive (`lib/prompt-archive.js`)** | HTTPS allowlist (`https://promt.rootcastle.com/`), SHA-256 `contentSha256`, injection scanner, incremental cache, TTL fallback, bundled fallback | `lib/prompt-archive.js`, `scripts/tests/prompt-archive.test.js` |
| **Quality Report (`data/quality-report.json`)** | `1,423/1,423` `schema_valid`, `references_valid`, `security_compliant`; `12` `tested-module` (`rei-*`); `average_documentation_score = 82.3` (0–100) | `scripts/validate_skills.py`, `data/quality-report.json` |
| **Security Audit (`scripts/security_audit.js`)** | `0` Critical blocking, `0` High blocking, `5` Advisory command hits, `0` Unclassified risk | `scripts/security_audit.js` |
| **REI REA Sync (`scripts/sync_rei_rea.py`)** | `Upstream Version: v0.2.0 (78fab82)`, `12` specialist skills, `Changed Skills: 0` | `scripts/sync_rei_rea.py --check` |
| **npm & GitHub Pages (`0f32ce1`)** | GitHub Actions `Publish` (`43916976625`), `CI` (`43916976766`), `Pages` (`43916976758`) all `completed` / `success` | `gh run list --branch main` |
| **Repositories / Git Tags** | Latest tag on remote: `v1.0.0`; releases: `v1.0.0` (historically tagged before 6.x series); active PRs: `0` open | `git tag -l`, `gh release list` |

---

## 2. Baseline Defects, Gaps & Unsupported Claims Identified

1. **Coarse Quality Scoring Without Auditable Gates:**
   - `data/quality-report.json` currently computes only a 4-bucket `documentation_score` (`0..100`) and hardcodes `tested-module` exclusively to `rel_id.startswith("rei-")`.
   - Missing: the 7-dimension (0–2, max 14) rubric, `Q3 Gold` / `Q2 Solid` / `Q1 Basic` / `Q0 Quarantine` tiers, quarantine exclusion in routing, and strict separation of the 6 verification dimensions (`schemaValid`, `referenceValidated`, `securityPolicyChecked`, `evaluationPassed`, `humanReviewed`, `hardwareVerified`).
2. **No Evaluated Gold 50 Program:**
   - The routing benchmark covers 260 tasks globally, but there is no curated **Gold 50** engineering program with per-skill non-goals, capability/tool contracts, >=3 evaluation scenarios, >=2 negative trigger cases, safety/failure behavior, and adapter smoke tests.
3. **Contradictory Manually Maintained Counters:**
   - `AGENTS.md`, `bin/mcp-server.js` (`rei_list_bundles` & `rei://bundles`), and `docs/GETTING_STARTED.md` claim **19** curated role bundles, whereas `data/bundles.json` actually defines **6** bundles (`rei-rea`, `core-dev`, `security-core`, `k8s-core`, `data-core`, `ops-core`).
4. **Missing Uninstall / Removal Lifecycle Command & Quality CLI:**
   - `bin/install.js` installs and backs up files via `rei-skills add`, but lacks a symmetric `remove` / `uninstall` command to cleanly remove an installed skill or rule, and lacks a `quality` inspection command.
5. **Router & Evaluator Telemetry Gaps:**
   - `lib/hybrid-router.js` does not filter `Q0` quarantined skills, track tool-availability mismatches (`availableTools`), detect explicit conflicting skills, or report estimated context token consumption.
   - `scripts/measure-baseline.js` / `lib/evaluation-engine.js` lack `Precision@3`, `incorrectActivationRate`, `negativeTriggerFalsePositiveRate`, and domain/language latency/token aggregates.
6. **Workflow Compiler Resource & Capability Conflict Gaps:**
   - `lib/workflow-compiler.js` detects cycles and parameter unit checks (`mm`/`cm`), but does not explicitly flag mutually conflicting capability requirements or shared hardware/device resource contention.
7. **Prompt Archive Signature vs Integrity Distinction & Snapshot Rollback:**
   - `lib/prompt-archive.js` checks SHA-256 hashes over HTTPS allowlisted origins, but does not expose separate `integrityHashVerified` vs `publisherSignatureVerified` fields or keep a 1-step rollback snapshot (`snapshot.prev.json`) on `syncArchive`.
8. **Missing Structured Environment Capability Manifest:**
   - `lib/engineering-adapters.js` defines per-adapter capability metadata, but lacks a unified `getEnvironmentCapabilityManifest` distinguishing documented support, installed software, runtime API, simulation capability, and verified physical execution.

---

## 3. Baseline Verification Commands Executed

```bash
git checkout -b feat/auditable-quality-gold50-platform
npm ci --ignore-scripts --dry-run
npm run build
npm run check:rea
npm run security-audit
node scripts/tests/installer.test.js
node scripts/tests/hol-guard-policy.test.js
```

All baseline checks above passed on `0f32ce1` before implementing the audit remediations. External hardware/CAD runtimes, `@hashgraphonline/hol-guard` package runtime execution, and human-reviewed audit claims remain `NOT VERIFIED` unless backed by explicit artifacts.
