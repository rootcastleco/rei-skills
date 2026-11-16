# Phase A — Repository Audit & Baseline Report (`rei-skills@6.4.0`)

**Date:** 2026-11-16  
**Baseline Commit:** `43fa8e3ab94177190ab128fde29b184d0c0c9680` (`origin/main`)  
**Package Version:** `rei-skills@6.4.0` (verified live on `https://registry.npmjs.org/rei-skills`)  
**Organization:** Rootcastle Engineering & Innovation (REI)

---

## 1. Executive Summary & Verification Matrix

| Component / Check | Classification | Measured Evidence |
| :--- | :--- | :--- |
| Skill Schema & Reference Integrity (`validate:strict`) | **PASS** | `1,423 / 1,423` skills schema-valid, reference-valid, and security-compliant (`data/quality-report.json`, avg documentation score `82.3`). |
| Top-Level Node Validator (`validate:node`) | **PASS** | `1,412 / 1,412` top-level skills pass (`11` nested skills under `app-builder/templates` and `game-development/*` skipped by `listSkillIds`). |
| Cross-References (`validate:refs`) | **PASS** | All `data/workflows.json` (`7` workflows), `data/bundles.json` (`6` bundles), and `docs/BUNDLES.md` references resolve cleanly. |
| Security & Guardrails Scan (`security-audit`) | **PASS** | `1,423` `SKILL.md` files scanned: `0` Critical blocking, `0` High blocking, `5` Advisory cmds, `0` Unclassified risk. |
| REI REA Sync Manifest (`sync_rei_rea.py --check`) | **PASS** | `12 / 12` specialist skills match upstream `v0.2.0` (`78fab82`) SHA-256 digests (`0` drift). |
| Technical Expansion Integrity (`test:expansion`) | **PASS** | `528` original skills across `33` domains (`16` per domain) + `895` existing skills = `1,423`; SHA-256 manifest verified. |
| CAD/ECAD Dry-Run & Router Tests (`test:cad`) | **PASS** | `5 / 5` `cad_ecad_verify.py` tests PASS; `cad-router.test.js` PASS. |
| Rust Hook Gateway Prototype (`cargo test`) | **PASS** | `3 / 3` unit tests PASS in `0.01s` (`rust/rei-hook-gateway`). |
| Windows Packaged CLI Smoke (`npm-package.test.js`) | **FAIL (Baseline) -> PASS (Fixed in M1)** | Failed on baseline Windows (`Node v22.19.0`) with `EINVAL` on `spawnSync('npm.cmd', ...)` without `shell: true`, and Unix `0o111` mode check. Fixed on `feat/milestone-1-reliability-foundation`. |
| npm Release Verification (`publish.yml` run `43831748086`) | **FAIL (False Negative)** | `npm publish --access public` succeeded (`+ rei-skills@6.4.0`, Sigstore `logIndex=3921507629`, `shasum=58aa4903...`), but `scripts/verify-npm-release.js` timed out after 720s due to asynchronous npm CDN indexing lag and exited `1`. Fixed in M1. |
| Fusion 360 In-Process Runtime (`FusionReadOnlyInspector.py`) | **NOT VERIFIED** | Syntactically valid Python AST; live Autodesk Fusion runtime execution requires an authorized local Fusion installation. |
| KiCad CLI Live Execution (`kicad-cli`) | **NOT VERIFIED** | Dry-run command planner verified; live ERC/DRC requires KiCad >=10 binary and real `.kicad_sch`/`.kicad_pcb` project files. |

---

## 2. Skill Inventory, Distribution & Overlap Analysis

### 2.1 Catalog Metrics (`1,423` Skills)
- **Categories (`data/catalog.json`):** `development` (357), `data-ai` (243), `general` (170), `infrastructure` (149), `security` (144), `testing` (111), `architecture` (99), `workflow` (80), `business` (40), `reverse-engineering` (30).
- **Risk Distribution (`skills_index.json`):** `safe` (1,007), `critical` (264), `offensive` (132), `none` (20), `unknown` (0).
  - *Audit Finding:* Several general developer skills (`python-pro`, `fastapi-pro`, `golang-pro`, `docker-expert`, `backend-architect`, `sql-pro`) are classified `offensive` in upstream metadata, while `kubernetes-architect`, `terraform-specialist`, and hardware/CAD/circuit/vibration `rc-*` domains carry `critical` risk labels. Risk-aware filtering (`safeOnly: true`) must strictly preserve exclusion of `critical` and `offensive` entries.
- **Provenance Sources (`skills_index.json`):** `community` (609), `rootcastle-original-technical-expansion-2026` (528), `microsoft/skills` (141), `vibeship-spawner-skills (Apache 2.0)` (51), `rootcastle-rei` (12), `anthropics/skills` (8), `muratcankoylan/Agent-Skills-for-Context-Engineering` (8), `fal-ai-community/skills` (6), `getsentry/skills` (4), `vercel-labs/agent-skills` (4), plus 34 additional documented upstream repositories.
- **Documentation & Bundle Consistency Drift:** `data/bundles.json` contains **6** bundles (`rei-rea`, `core-dev`, `security-core`, `k8s-core`, `data-core`, `ops-core`), whereas `AGENTS.md` and `bin/mcp-server.js` tool descriptions reference **19** curated bundles (the fuller manual list in `docs/BUNDLES.md`).

### 2.2 Overlap & Duplication Findings
Pairwise Jaccard similarity over skill ID + tag tokens identified **47 high-overlap pairs** (`Jaccard >= 0.75`), primarily multi-language SDK siblings (`azure-ai-contentsafety-py` vs `azure-ai-contentsafety-ts`, `azure-cosmos-db-py` vs `azure-cosmos-py` vs `azure-cosmos-ts`, `azure-identity-py` vs `azure-identity-ts`) and multi-domain overlapping topics (`rc-circuit-architecture-*` vs `rc-sensor-acquisition-*` vs `rc-pcb-design-review-*`). Without explicit overlap detection and multi-domain diversity preservation, single-signal keyword scoring tends to flood top-3 results with near-duplicate entries from one sub-domain.

---

## 3. Existing Module Dependency Graph

```text
bin/install.js
 ├── lib/ai-adapters.js ──▶ lib/skill-utils.js ──▶ yaml
 ├── lib/smart-router.js
 ├── lib/skill-utils.js
 └── bin/mcp-server.js
      ├── lib/mcp-safe-install.js
      ├── lib/ai-adapters.js
      ├── lib/smart-router.js
      ├── lib/prompt-archive.js
      └── bin/install.js (resolveSkillSourceDir)

bin/prompt-agent.js
 └── lib/prompt-archive.js

scripts/build-catalog.js ──▶ lib/skill-utils.js
scripts/build-doc-site.js ──▶ lib/ai-adapters.js
scripts/validate-skills.js ──▶ lib/skill-utils.js
scripts/security_audit.js ──▶ lib/skill-utils.js

rust/rei-hook-gateway/src/main.rs (standalone TCP loopback prototype, 127.0.0.1:9783)
```

---

## 4. Measured Routing Baseline (`lib/smart-router.js`)

Evaluated on the **260-task benchmark** (`data/benchmarks/routing-benchmark-v1.json`: `80` train, `60` dev, `120` held-out eval) via `scripts/measure-baseline.js` (`data/benchmarks/baseline-report.json`):

| Split | Tasks | Recall@3 (Hit Rate) | Fractional Recall@3 | MRR | nDCG@5 | Out-of-Scope FPR | Crit-Risk Misroutes | p50 (ms) | p95 (ms) | Heap Delta (MB) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `train` | 80 | 88.89% | 66.20% | 0.8412 | 0.7376 | 25.00% | 0 | 22.241 | 45.627 | +8.243 |
| `dev` | 60 | 89.29% | 73.51% | 0.8603 | 0.7854 | 25.00% | 0 | 17.915 | 30.613 | -2.803 |
| `eval` | 120 | 91.07% | 73.81% | 0.8375 | 0.7587 | **37.50%** | 0 | 19.366 | 29.086 | +0.381 |
| **`all`** | **260** | **90.00%** | **71.46%** | **0.8439** | **0.7586** | **30.00%** | **0** | **18.013** | **29.846** | **+12.256** |

### Diagnosed Baseline Failure Modes (By Query Type across 260 Tasks)
1. **Turkish Queries (`positive_tr`, `38` tasks):** `Recall@3 = 65.79%`, `MRR = 0.5947`, `nDCG@5 = 0.4407`.
   - *Root Cause:* Turkish stopwords like `"ve"` and `"en"` are absent from `STOP_WORDS` and match via naive `.includes()` substrings inside unrelated English IDs/descriptions (`azure-eventgrid-*` matching `"ve"` in `"event"` / `"server"` for vibration and fleet queries `tr-051` and `dv-044`). Suffixes (`-leri`, `-ında`, `-lama`, `-ması`) prevent exact dictionary hits in `SYNONYM_MAP`.
2. **Multilingual Mixed Queries (`multilingual_mixed`, `15` tasks):** `Recall@3 = 66.67%`, `MRR = 0.5562`, `nDCG@5 = 0.3876`.
3. **Out-of-Scope Negative Queries (`negative_out_of_scope`, `20` tasks):** `FPR = 30.00%` overall (`37.50%` on held-out `eval`).
   - *Root Cause:* `smart-router.js` emits confident scores (`36%–57%`) on non-engineering requests (e.g., `"Bosphorus bridge"` matching `sensor-bridge-conditioning`, `"chess rules"` matching `code-explain`, `"clean cat hair"` matching `"en"` substrings) and has no uncertainty or out-of-scope classification.
4. **Multi-Domain Orchestration Queries (`ambiguous_multi_domain`, `14` tasks):** `Recall@3 = 71.43%`, `nDCG@5 = 0.4752`.
   - *Root Cause:* Single-domain boosts allow one sub-domain (e.g., `rc-fusion360-parametric-*` or `rc-hardware-in-loop-*`) to saturate all top slots without preserving cross-domain diversity or dependency chains.
5. **Linear Scan Overhead:** Every query scans all `1,423` skills linearly without an inverted index (`p95 = 29.0–45.6 ms`).

---

## 5. Security Boundaries, External Integrations & Release Reliability

### 5.1 Prompt Archive (`lib/prompt-archive.js`, `https://promt.rootcastle.com/`)
- **Live Verification:** `GET https://promt.rootcastle.com/catalog-manifest.json` returns `200 OK` with `24` shards (`catalog/cc0-refresh-v13.json`, `catalog/optimization-v11.json`, `catalog/studio-v11.json`, `catalog/marwedel-v8.json`, `catalog/original-v6.json`, etc.).
- **Current Strengths:** Enforces fixed origin (`https://promt.rootcastle.com`), `redirect: "error"`, streaming byte limit (`16 MiB`), body limit (`40,000` chars), atomic write, and `<<<UNTRUSTED_PROMPT_REFERENCE>>>` delimiters.
- **Current Gaps:** `normalizeEntry` drops rich upstream fields (`language`, `tags`, `catalogCategories`, `license`, `snapshotDate`, `kind`, `author`), lacks content SHA-256 on cached records, lacks incremental manifest skip, lacks cache TTL / expiry labeling, and does not run prompt-injection heuristics on fetched excerpts.

### 5.2 MCP Authorization & HOL Guard (`bin/mcp-server.js`, `hashgraph-online/hol-guard` PR #7538)
- **External Contract Verified:** `hashgraph-online/hol-guard` contains `contributions/mcp-servers/mcp.rei-skills.json` (`schemaVersion: "guard.mcp-server-contribution.v1"`, `trustClass: "external"`, `activation: "opt-in"`, `package: "rei-skills@6.2.0"`).
- **Policy Matrix in HOL Guard:** `rei_recommend_skills`, `rei_search_skills`, `rei_get_skill`, `rei_get_workflow`, `rei_list_bundles`, `rei_compile_skill`, and `rei_list_ai_targets` are `inherit`; `rei_install_skill` and `other` (which currently covers `rei_compose_prompt` and `rei_propose_prompt_improvement`) require `review`.
- **Internal Gap:** Inside `rei-skills` itself, `bin/mcp-server.js` performs path/backup checks inside `rei_install_skill` and `rei_get_skill`, but lacks a centralized deny-by-default policy layer for prompt-injection scanning, output sanitization, tool registration verification, secret redaction, and supply-chain manifest checks.

### 5.3 Rust Hook Gateway Prototype (`rust/rei-hook-gateway/src/main.rs`)
- **Current Capabilities:** Loopback-only TCP (`127.0.0.1:9783`), constant-time token verification (`subtle::ConstantTimeEq`), 4,096-byte frame limit, 3s read/write timeouts, `#[serde(deny_unknown_fields)]`, allowlisted events (`health`, `hook.preview`, `hook.audit`) returning `accepted_preview_only`.
- **Current Gaps:** Single-threaded sequential accept loop, no replay/nonce protection, no request deduplication, no per-client capability model, no rate limiting or backpressure, no metrics/sequence numbers, no adapter safety classification, and no graceful shutdown signal handling.

### 5.4 Deployment & npm Release Verification (`publish.yml`, `scripts/verify-npm-release.js`)
- **Root Cause of `rei-skills@6.4.0` Run `43831748086` Failure:** OIDC publishing succeeded (`+ rei-skills@6.4.0`, Sigstore `logIndex=3921507629`), and npm reported `"Your package is being processed and may take a few minutes to become available."` Public CDN metadata indexing took longer than the 720s poll window, causing `verify-npm-release.js` to exit `1` despite successful publication.
- **Milestone 1 Remediation:** `scripts/verify-npm-release.js` now parses `npm publish` stdout (`--publish-log`) for cryptographic/publication evidence (`parsePublishEvidence`), checks `packageDoc.versions[version]` fallback, fails immediately on untrusted tarball origins (`INTEGRITY_ERROR`), and exits `0` with explicit `PUBLISHED_INDEXING_PENDING` status when `--allow-pending-after-publish` is enabled alongside verified publish output — eliminating false failures without ever repeating `npm publish`.
