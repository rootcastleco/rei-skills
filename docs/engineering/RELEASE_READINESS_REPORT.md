# REI Skills — Platform Release Readiness Report (`v6.5.0+` / `feat/auditable-quality-gold50-platform`)

**Prepared By:** Principal Architecture & Release Engineering Review  
**Branches / PR Lineage:**  
- **PR #12–#15 & `v6.5.0` (`main` @ `0f32ce1`):** Foundations, Hybrid BM25 + semantic router, Workflow DAG compiler, Prompt Archive v2, Rust Secure Gateway `v0.2.0`, HOL Guard policy engine, capability-aware adapters, observability/improvement engine, and static Web Hub.
- **Current PR Branch (`feat/auditable-quality-gold50-platform` -> `main`):** Phase A–E Auditable Quality Engine (`14pt-v1`), Gold 50 Engineering Program, `npx skills` compatibility matrix, `quality` & `remove` CLI commands, Q0 quarantine + tool/overlap/token-budget routing + `Precision@3`, workflow conflict detection, Prompt Archive authenticity separation + `pinPromptVersion` + 1-step rollback, 5-level `getEnvironmentCapabilityManifest`, Rust gateway boundary control-character abuse tests (`8/8`), and aligned documentation (`docs/audits/BASELINE_AUDIT.md`, `docs/QUALITY_METHODOLOGY.md`, `docs/QUALITY_REPORT.md`, `docs/ADAPTER_COMPATIBILITY_MATRIX.md`, `docs/PROMPT_ARCHIVE_SECURITY.md`, `docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md`).

---

## 1. Deliverable & Capability Classification Matrix

Every component below is classified strictly by direct evidence (`PASS`, `FAIL`, or `NOT VERIFIED`).

| Phase / Component | Evidence & Scope | Classification |
| :--- | :--- | :--- |
| **Phase A — Baseline Audit & npm Verification** | Baseline audit (`docs/audits/BASELINE_AUDIT.md`) + `v6.5.0` npm/CI verification; root-caused async CDN indexing false failures (`npm-release-verification.test.js`). Verified `1,423` skills against `vercel-labs/skills` frontmatter rules (`0` invalid names, `0` oversized descriptions). | **PASS** |
| **Quality Engine (`14pt-v1`) & Gold 50 Program** | `lib/quality-engine.js`, `scripts/validate_skills.py`, `scripts/build-gold50-manifest.js`, `scripts/evaluate-gold50.js`, `scripts/tests/gold50-quality.test.js`: scores all `1,423` skills (`Q3: 346`, `Q2: 936`, `Q1: 141`, `Q0: 0`, avg `9.76/14`), keeps `human_reviewed_count: 0` & `hardware_verified_count: 0`, and achieves Gold 50 `50/50` (`100.0%`), positive `149/150` (`99.3%`), negative `100/100` (`100.0%`), adapters `50/50`. | **PASS** |
| **Phase B — Hybrid Semantic Router (`Recall@3`, `Precision@3`)** | Tested against 260-task benchmark (`train=80, dev=60, eval=120` held-out). Held-out `eval`: `Recall@3 = 97.32%` (target `>=85%`, legacy `91.07%`), `Precision@3 = 58.9%`, `IncAct = 2.68%`, `MRR = 0.9009`, `nDCG@5 = 0.8537`, out-of-scope `FPR = 0.0%` (legacy `37.5%`), Critical misroute = `0`, `positive_tr` Recall@3 = `100.0%` across all splits, `p95 = 4.755ms` (`all = 2.851ms`). Includes Q0 quarantine, `availableTools` compatibility, conflict suppression, and `contextTokenBudget`. | **PASS** |
| **Phase C — Workflow DAG Compiler & Conflict Validation** | `lib/workflow-compiler.js` verified via `workflow-compiler.test.js`, `installer.test.js` (`plan --json` reading `stage.skillIds`), and `gold50-quality.test.js`: topological ordering, cycle detection, SI/Fusion unit checks, `capabilityValidation` (`invalidCapabilityCombinations` & `resourceConflicts`), and `claimedPhysicalExecution: false`. | **PASS** |
| **Phase D — Rootcastle Prompt Intelligence & Rollback** | `lib/prompt-archive.js` verified via `prompt-archive.test.js` & `gold50-quality.test.js` (mocked transport): separates SHA-256 content integrity (`integrityHashVerified: true`) from unsigned publisher status (`publisherSignatureVerified: false`), supports `pinPromptVersion`, `prompt-archive.prev.json` backup, 1-step `rollbackSnapshot`, injection scanning, and offline fallbacks. | **PASS** |
| **Phase E — Rust Secure Gateway (`v0.2.0`)** | `rust/rei-hook-gateway` compiled cleanly with zero warnings; `8/8` `cargo test` cases pass (legacy compat, replay rejection, dedup, rate limiting, `max_in_flight` backpressure, cancellation, unsafe payload deny, boundary control-char/null-byte frame abuse test, fail-closed non-loopback mTLS guard, `serve_until_shutdown`). | **PASS** |
| **Phase F — HOL Guard Local Policy Engine** | `lib/hol-guard-policy.js` wired into `bin/mcp-server.js` and tested via `hol-guard-policy.test.js`: deny-by-default tool allowlist, prompt injection/secret/traversal blocking, output sanitization, preserves 10 default MCP tools (`REI_MCP_EXTENDED_TOOLS=1` opts into 3 read-only extended tools). | **PASS** |
| **Phase G — Controlled Continuous Improvement** | `lib/observability.js`, `lib/evaluation-engine.js`, `lib/improvement-engine.js` tested via `improvement-engine.test.js` & documented in `docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md`: secret redaction, non-regression gate on `dev`/`eval`, security rejection, review-only `prDraft` (`automaticWrites: false`, `autoMerge: false`, `autoPublish: false`). | **PASS** |
| **Phase H — Capability-Aware Adapters & 5-Level Manifest** | `lib/engineering-adapters.js` tested via `engineering-adapters.test.js` & `gold50-quality.test.js`: 5-level `getEnvironmentCapabilityManifest` (`L0`–`L4`), explicit contracts & computational verifiers (`kicad`, `fusion360`, `embedded`, `scientific`, `industrial_measurement`), `verifiedPhysicalExecution: false`. | **PASS** |
| **Phase I — Adapter Compatibility, CLI & Static Web Hub** | `bin/install.js` (`quality`, `remove`/`uninstall`, `plan`, `evaluate`, `adapters`, `security-status`, `improve`), `docs/ADAPTER_COMPATIBILITY_MATRIX.md`, `scripts/build-doc-site.js` (`docs/site/index.html` with Quality Engine, Gold 50, Precision@3, Capability Manifest, DAG, Security panels) verified via `npm run build`, `installer.test.js`, `npm-package.test.js`. | **PASS** |
| **Skill Validation & Security Audit Gates** | `validate:strict` (1,423 skills), `validate:node` (1,412 top-level skills), `validate:refs`, `security-audit` (0 Critical, 0 High blocking across 1,423 skills), `sync_rei_rea.py --check` (`12` REA skills). | **PASS** |
| **External Hardware / DAQ / Physical Instruments** | No physical accelerometer, rotor bench, GNSS receiver, CAN interface, or SCPI hardware attached. All DSP, balancing, and protocol checks executed purely in software against synthetic fixtures with `claimedPhysicalExecution: false`. | **NOT VERIFIED** |
| **Live External KiCad / Autodesk Fusion 360 Runtime** | Live GUI/binary execution of `kicad-cli` or Fusion 360 Desktop Add-In was not run against physical PCB/CAD assemblies in this CI environment; `test_cad_ecad_verify.py` verified dry-run commands and exit-code report parsing. | **NOT VERIFIED** |
| **Live External `@hashgraphonline/hol-guard` Package** | `getHolGuardIntegrationStatus()` confirms `@hashgraphonline/hol-guard` is not installed locally; only local enforcement in `lib/hol-guard-policy.js` and the upstream contribution schema contract (`hashgraph-online/hol-guard` PR #7538) are active here. | **NOT VERIFIED** |
| **Live Remote mTLS Network Termination** | No TLS crate (`rustls` / `openssl`) was added to keep offline `Cargo.lock` compatibility intact. `validate_bind_address` enforces loopback-only binding and fails closed (`remote_enabled: false`) until remote TLS transport is implemented and verified. | **NOT VERIFIED** |
| **Live `npm publish` CI Workflow Execution (`v6.5.0+` Unreleased PR)** | `rei-skills@6.5.0` is live on npm (`0f32ce1`, OIDC attestations verified). The new uncommitted changes on `feat/auditable-quality-gold50-platform` have not yet been merged or published as a release tag. | **NOT VERIFIED** |
| **Optional External Neural `embeddingProvider`** | `lib/hybrid-router.js` supports custom `embeddingProvider` injection, but only offline deterministic BM25 + 256-dim vector mode was benchmarked. | **NOT VERIFIED** |

---

## 2. Known Inventory & Packaging Observations

- The historical `19` vs `6` role-bundle count mismatch in `AGENTS.md`, `docs/GETTING_STARTED.md`, and `bin/mcp-server.js` has been resolved (`AGENTS.md`, `docs/GETTING_STARTED.md`, and live `resources/list` now match the `6` bundles in `data/bundles.json`).
- `scripts/tests/npm-package.test.js` runs an actual `npm pack` + isolated prefix `npm install` across the package tarball and confirms all `10` default MCP tools expose identically from the packed package.

---

## 3. Release Verification Signoff Rule

This release candidate is **READY FOR PR REVIEW** (`PASS` across all offline software, build, security audit, Gold 50, Rust `cargo test`, and packaging gates; zero regressions on all existing `1,423` skills and `10` default MCP tool contracts), subject to explicit acknowledgment of all **NOT VERIFIED** hardware/external runtime boundaries listed in Section 1.
