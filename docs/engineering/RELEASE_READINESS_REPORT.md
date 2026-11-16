# REI Skills — Platform Release Readiness Report (`v6.4.0+`)

**Prepared By:** Principal Architecture & Release Engineering Review  
**Branches / Stacked PRs:**  
- **PR #12 (`feat/milestone-1-reliability-foundation` -> `main`):** Phase A baseline audit, npm release verification resilience (`scripts/verify-npm-release.js`, `.github/workflows/publish.yml`), Windows test portability, security regression suite, and 260-task benchmark (`data/benchmarks/routing-benchmark-v1.json`).  
- **PR #13 (`feat/milestone-2-intelligence-layer` -> `feat/milestone-1-reliability-foundation`):** Hybrid BM25 + offline semantic router (`lib/hybrid-router.js`, `lib/smart-router.js`), workflow DAG compiler (`lib/workflow-compiler.js`), and Prompt Archive v2 (`lib/prompt-archive.js`).  
- **PR #14 (`feat/milestone-3-secure-execution-layer` -> `feat/milestone-2-intelligence-layer`):** Rust Secure Communication Gateway `v0.2.0` (`rust/rei-hook-gateway`), HOL Guard deny-by-default policy engine (`lib/hol-guard-policy.js`, `bin/mcp-server.js`), and capability-aware engineering adapters (`lib/engineering-adapters.js`).  
- **Stacked PR (Milestone 4: `feat/milestone-4-adaptive-platform` -> `feat/milestone-3-secure-execution-layer`):** Observability & provenance (`lib/observability.js`), split evaluation (`lib/evaluation-engine.js`), controlled improvement loop (`lib/improvement-engine.js`), CLI extensions (`bin/install.js`), Web Hub upgrade (`scripts/build-doc-site.js`), architecture/threat docs, and readiness signoff.

---

## 1. Deliverable & Capability Classification Matrix

Every component below is classified strictly by direct evidence (`PASS`, `FAIL`, or `NOT VERIFIED`).

| Phase / Component | Evidence & Scope | Classification |
| :--- | :--- | :--- |
| **Phase A — Baseline Audit & npm Verification** | Root-caused failed `v6.4.0` publish verification run `43831748086` (`rei-skills@6.4.0` was accepted with Sigstore provenance `3921507629`; async CDN indexing caused false 720s failure). Added `parsePublishEvidence`, `versions[version]` fallback, `--allow-pending-after-publish`. Verified via `npm-release-verification.test.js`. | **PASS** |
| **Phase B — Hybrid Semantic Router** | Tested against 260-task benchmark (`train=80, dev=60, eval=120` held-out). Held-out `eval` Recall@3 = `96.43%` (target `>=85%`, legacy `91.07%`), MRR = `0.8897`, nDCG@5 = `0.8456`, out-of-scope FPR = `0.0%` (legacy `37.50%`), Critical misroute = `0`, `positive_tr` Recall@3 = `100.0%` (`eval`), `p95` = `2.919ms`. Deterministic `legacy` fallback preserved. | **PASS** |
| **Phase C — Workflow DAG Compiler** | `lib/workflow-compiler.js` verified via `workflow-compiler.test.js` & `installer.test.js` (`plan --json`): topological stage ordering, cycle check, SI/Fusion unit checks, resource budget, execution mode boundaries, `claimedPhysicalExecution: false`. | **PASS** |
| **Phase D — Rootcastle Prompt Intelligence** | `lib/prompt-archive.js` verified via `prompt-archive.test.js` (mocked transport): SHA-256 `contentSha256`, injection scanning, incremental sync, TTL `stale_offline_fallback` & `bundled_fallback`, snapshot diffing, compatibility checks, `maxContextChars` progressive loading. | **PASS** |
| **Phase E — Rust Secure Gateway (`v0.2.0`)** | `rust/rei-hook-gateway` compiled cleanly with zero warnings; `7/7` `cargo test` cases pass (legacy 3-field frame compat, replay rejection, idempotent dedup, rate limiting, `max_in_flight` backpressure, cancellation, client capabilities, unsafe payload deny, fail-closed non-loopback mTLS guard, `serve_until_shutdown`). | **PASS** |
| **Phase F — HOL Guard Local Policy Engine** | `lib/hol-guard-policy.js` wired into `bin/mcp-server.js` and tested via `hol-guard-policy.test.js`: 10 defense-in-depth checks, deny-by-default tool allowlist, prompt injection/secret/traversal blocking, output sanitization, preserves 10 default MCP tools (`REI_MCP_EXTENDED_TOOLS=1` opts into 3 read-only extended tools). | **PASS** |
| **Phase G — Controlled Continuous Improvement** | `lib/observability.js`, `lib/evaluation-engine.js`, `lib/improvement-engine.js` tested via `improvement-engine.test.js`: secret redaction, latency percentiles, non-regression gate on `dev`/`eval`, security & no-benefit rejection, review-only `prDraft` with `automaticWrites: false`, `autoMerge: false`, `autoPublish: false`. | **PASS** |
| **Phase H — Capability-Aware Adapters** | `lib/engineering-adapters.js` tested via `engineering-adapters.test.js`: explicit contracts & computational verifiers (`kicad`, `fusion360` mm/cm + clearances, `embedded` NMEA-0183 & J1939, `scientific` SI dimensions & feasibility, `industrial_measurement` calibration/DFT/balancing). `claimedPhysicalExecution: false`. | **PASS** |
| **Phase I — CLI & Static Web Hub** | `bin/install.js` (`plan`, `evaluate`, `adapters`, `security-status`, `improve`), `scripts/build-doc-site.js` (`docs/site/index.html` Rootcastle palette `#000000`/`#0E3D8A`/`#228B55`, `10` MCP tools stat, static evaluation/DAG/security panels) built and verified via `npm run build` & `installer.test.js`. | **PASS** |
| **Skill Validation & Security Audit Gates** | `validate:strict` (1,423 skills), `validate:node` (1,412 top-level skills), `validate:refs`, `security-audit` (0 Critical, 0 High blocking across 1,423 skills), `sync_rei_rea.py --check` (`12` REA skills). | **PASS** |
| **External Hardware / DAQ / Physical Instruments** | No physical accelerometer, rotor bench, GNSS receiver, CAN interface, or SCPI hardware attached. All DSP, balancing, and protocol checks executed purely in software against synthetic fixtures with `claimedPhysicalExecution: false`. | **NOT VERIFIED** |
| **Live External KiCad / Autodesk Fusion 360 Runtime** | Live GUI/binary execution of `kicad-cli` or Fusion 360 Desktop Add-In was not run against physical PCB/CAD assemblies in this CI environment; `test_cad_ecad_verify.py` verified dry-run commands and exit-code report parsing. | **NOT VERIFIED** |
| **Live External `@hashgraphonline/hol-guard` Package** | `getHolGuardIntegrationStatus()` confirms `@hashgraphonline/hol-guard` is not installed locally; only local enforcement in `lib/hol-guard-policy.js` and the upstream contribution schema contract (`hashgraph-online/hol-guard` PR #7538) are active here. | **NOT VERIFIED** |
| **Live Remote mTLS Network Termination** | No TLS crate (`rustls` / `openssl`) was added to keep offline `Cargo.lock` compatibility intact. `validate_bind_address` enforces loopback-only binding and fails closed (`remote_enabled: false`) until remote TLS transport is implemented and verified. | **NOT VERIFIED** |
| **Live `npm publish` CI Workflow Execution** | Publish workflow fixes are verified by offline unit fixtures (`npm-release-verification.test.js`), not a live tag release on npm (`v6.4.0` already published on `main`). | **NOT VERIFIED** |
| **Optional External Neural `embeddingProvider`** | `lib/hybrid-router.js` supports custom `embeddingProvider` injection, but only offline deterministic BM25 + 256-dim vector mode was benchmarked. | **NOT VERIFIED** |

---

## 2. Known Inventory Observations (Non-Blocking)

- Documentation references (`AGENTS.md`, `bin/mcp-server.js` `rei://bundles` description) historically state `19` role bundles while `data/bundles.json` currently defines `6` bundles (`rei-rea`, `core-dev`, `security-core`, `k8s-core`, `data-core`, `ops-core`). Left preserved intentionally to avoid breaking existing assertions outside scope.
- `scripts/tests/npm-package.test.js` runs an actual `npm pack` + isolated prefix `npm install` across 4,223 files (~60–85s on Windows NTFS) and confirms all 10 default MCP tools expose identically from the packed tarball.

---

## 3. Release Verification Signoff Rule

This release candidate is **READY FOR PR REVIEW** (`PASS` across all offline software, build, security audit, and Rust test gates; zero regressions on all existing `1,423` skills and `10` default MCP tool contracts), subject to explicit acknowledgment of all **NOT VERIFIED** hardware/external runtime boundaries listed in Section 1.
