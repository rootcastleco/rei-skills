<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/rei-skills-hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/brand/rei-skills-hero-light.svg">
  <img alt="REI Skills — Autonomous Engineering Skill Intelligence Platform" src="assets/brand/rei-skills-hero-dark.svg" width="100%">
</picture>

<br/>

# REI SKILLS

**The auditable engineering skill platform for AI agents.**  
*Discover capabilities, build workflows, enforce security policies, and verify engineering outcomes across AI tools.*

[![CI Status](https://github.com/rootcastleco/rei-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/rootcastleco/rei-skills/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/rootcastleco/rei-skills/actions/workflows/pages.yml/badge.svg)](https://rootcastleco.github.io/rei-skills/)
[![npm version](https://img.shields.io/npm/v/rei-skills?label=npm&color=0E3D8A&logo=npm)](https://www.npmjs.com/package/rei-skills)
[![Validated Skills](https://img.shields.io/badge/skills-1424%20validated-228B55)](#explore-the-library)
[![Gold 50](https://img.shields.io/badge/Gold%2050-50%2F50%20verified-228B55)](#registry-quality-engine--gold-50-program)
[![Hybrid Router](https://img.shields.io/badge/Hybrid%20Router-97.3%25%20Recall%403-0E3D8A)](#hybrid-semantic-skill-router--benchmark-evaluation)
[![REI REA Workbench](https://img.shields.io/badge/REI%20REA-v0.2.0%20integrated-0E3D8A)](docs/REI_REA_INTEGRATION.md)
[![Rust Gateway](https://img.shields.io/badge/Rust%20Gateway-v0.2.0-228B55)](docs/engineering/RUST_GATEWAY_SPEC.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-228B55)](LICENSE)

**[npm package](https://www.npmjs.com/package/rei-skills)** · **[Interactive Web Hub (GitHub Pages)](https://rootcastleco.github.io/rei-skills/)** · **[Publish workflow](https://github.com/rootcastleco/rei-skills/actions/workflows/publish.yml)**

**[Platform Architecture](#platform-architecture--autonomous-skill-intelligence)** · **[Quick Start](#install-in-seconds)** · **[Hybrid Router & Benchmarks](#hybrid-semantic-skill-router--benchmark-evaluation)** · **[Quality & Gold 50](#registry-quality-engine--gold-50-program)** · **[Workflows & Adapters](#workflow-dag-compiler--capability-aware-engineering-adapters)** · **[MCP & HOL Guard](#smart-mcp-server--hol-guard-defense-in-depth)** · **[Prompt Archive & Rust Gateway](#rootcastle-prompt-intelligence-rust-gateway-v020--continuous-improvement)** · **[Explore Skills](#explore-the-library)** · **[Docs & Reports](#engineering-documentation--reports)**

</div>

---

## Platform Architecture — Autonomous Skill Intelligence

**REI Skills** evolves a 1,423-skill repository into a verified, evaluated, and defense-in-depth engineering intelligence platform maintained by **[Rootcastle Engineering & Innovation](https://www.rootcastle.com)**:

```mermaid
flowchart LR
    T[Task Input & Files] --> N[Intent & EN/TR Normalization]
    N --> HR[Hybrid BM25 + 256-dim Router]
    HR --> WC[Workflow DAG Compiler]
    WC --> PA[Prompt Archive v2 SHA-256]
    PA --> HG[HOL Guard Deny-by-Default Policy]
    HG --> EA[Capability-Aware Engineering Adapters]
    HG --> RG[Rust Secure Gateway v0.2.0 Loopback IPC]
    EA --> OB[Observability & Provenance]
    RG --> OB
    OB --> EV[Split Evaluation Engine]
    EV --> IM[Controlled PR Draft Generator]
```

<div align="center">
  <img src="assets/brand/architecture.svg" alt="REI Skills Platform Architecture" width="100%">
</div>

| Subsystem | Core Implementation | Verification Suite | Key Guarantee |
| :--- | :--- | :--- | :--- |
| **Hybrid Semantic Router** | [`lib/hybrid-router.js`](lib/hybrid-router.js), [`lib/smart-router.js`](lib/smart-router.js) | [`hybrid-router.test.js`](scripts/tests/hybrid-router.test.js) | Offline BM25 + 256-dim vectors, EN/TR normalization, Q0 quarantine, tool & overlap filters |
| **14-Point Quality & Gold 50** | [`lib/quality-engine.js`](lib/quality-engine.js), [`scripts/validate_skills.py`](scripts/validate_skills.py), [`scripts/evaluate-gold50.js`](scripts/evaluate-gold50.js) | [`gold50-quality.test.js`](scripts/tests/gold50-quality.test.js) | `14pt-v1` tiers (`Q3`–`Q0`), 6 verification axes, Gold 50 (`50/50` verified) |
| **Workflow DAG Compiler** | [`lib/workflow-compiler.js`](lib/workflow-compiler.js) | [`workflow-compiler.test.js`](scripts/tests/workflow-compiler.test.js) | Topological ordering, SI/Fusion unit checks, conflict gates, `claimedPhysicalExecution: false` |
| **Rootcastle Prompt Archive** | [`lib/prompt-archive.js`](lib/prompt-archive.js) | [`prompt-archive.test.js`](scripts/tests/prompt-archive.test.js) | SHA-256 content verification, unsigned publisher disclosure, version pin & 1-step rollback |
| **HOL Guard Policy Layer** | [`lib/hol-guard-policy.js`](lib/hol-guard-policy.js), [`bin/mcp-server.js`](bin/mcp-server.js) | [`hol-guard-policy.test.js`](scripts/tests/hol-guard-policy.test.js) | Deny-by-default MCP authorization, secret redaction, traversal gates |
| **Engineering Adapters** | [`lib/engineering-adapters.js`](lib/engineering-adapters.js) | [`engineering-adapters.test.js`](scripts/tests/engineering-adapters.test.js) | 5-level `getEnvironmentCapabilityManifest` + software/hardware boundaries across 5 domains |
| **Rust Secure Gateway** | [`rust/rei-hook-gateway`](rust/rei-hook-gateway/) (`v0.2.0`) | `cargo test` (`8/8` passing) | Loopback IPC, replay/rate-limit/backpressure, boundary control-char rejection, mTLS closed |
| **Observability & Self-Improvement** | [`lib/observability.js`](lib/observability.js), [`lib/evaluation-engine.js`](lib/evaluation-engine.js), [`lib/improvement-engine.js`](lib/improvement-engine.js) | [`improvement-engine.test.js`](scripts/tests/improvement-engine.test.js) | Non-regression held-out gating; review-only PR drafts (`automaticWrites: false`) |
| **Multi-AI Installer & Safe MCP Staging** | [`bin/install.js`](bin/install.js), [`lib/ai-adapters.js`](lib/ai-adapters.js), [`lib/mcp-safe-install.js`](lib/mcp-safe-install.js) | [`installer.test.js`](scripts/tests/installer.test.js), [`mcp-safe-installer.test.js`](scripts/tests/mcp-safe-installer.test.js) | 21 AI targets, `npx skills` compat, `remove`/`quality` CLI, transactional rollback |

---

## Install in Seconds

Install the complete **1424 validated skills** library or project focused skills into any assistant with a single command:

```bash
npx rei-skills
npx skills add rootcastleco/rei-skills --list   # Standard Agent Skills / vercel-labs discovery
```

### Target Any AI Coding Assistant, IDE, or Agent SDK (`21` Targets Supported)

The **Universal Multi-AI Transpiler & Adapter Engine** ([`lib/ai-adapters.js`](lib/ai-adapters.js)) natively projects `SKILL.md` directories, Cursor `.mdc` rules, GitHub Copilot `.instructions.md` + `.prompt.md` files, Windsurf Cascade rules, Cline/RooCode/Continue/Aider/AmazonQ/Zed/Junie rules, universal `AGENTS.md` routers, and OpenAI/Anthropic/Gemini Function-Calling JSON schemas:

```bash
# CLI & IDE Skill Directories (SKILL.md + references + scripts)
npx rei-skills --claude                  # Anthropic Claude Code (~/.claude/skills)
npx rei-skills --codex                   # OpenAI Codex CLI      (~/.codex/skills)
npx rei-skills --gemini                  # Google Gemini CLI     (~/.gemini/skills)
npx rei-skills --antigravity             # Google Antigravity    (~/.gemini/rei/skills)
npx rei-skills --goose                   # Block Goose Agent     (~/.config/goose/skills)
npx rei-skills --opencode                # OpenCode Agent        (~/.agents/skills)
npx rei-skills --kiro                    # Kiro Spec-Driven IDE  (~/.kiro/skills)
npx rei-skills --amp                     # Sourcegraph Amp       (~/.config/amp/skills)

# Native IDE Rule & Prompt Transpilation (--workspace installs into current project)
npx rei-skills add rei-rea --cursor -w   # Cursor (.cursor/skills/* + .cursor/rules/*.mdc)
npx rei-skills add rei-rea --copilot -w  # GitHub Copilot (.github/instructions/*.instructions.md + prompts)
npx rei-skills add rei-rea --windsurf -w # Windsurf Cascade (.windsurf/rules/*.md)
npx rei-skills add rei-rea --cline -w    # Cline Autonomous Agent (.clinerules/*.md)
npx rei-skills add rei-rea --roocode -w  # Roo Code (.roo/rules/*.md)
npx rei-skills add rei-rea --continue -w # Continue.dev (.continue/rules/*.md)
npx rei-skills add rei-rea --aider -w    # Aider (.aider/skills/*.md + CONVENTIONS.md)
npx rei-skills add rei-rea --amazonq -w  # Amazon Q Developer (.amazonq/rules/*.md)
npx rei-skills add rei-rea --zed -w      # Zed AI (.zed/rules/*.md)
npx rei-skills add rei-rea --trae -w     # Trae AI IDE (.trae/rules/*.md)
npx rei-skills add rei-rea --junie -w    # JetBrains Junie (.junie/skills/*.md)
npx rei-skills add rei-rea --devin -w    # Cognition Devin (.devin/playbooks/*.devin.md)
npx rei-skills add rei-rea --sdk -w      # OpenAI / Anthropic / Gemini / LangGraph Tool JSON

# Configure ALL major AI assistants + generate universal AGENTS.md router at once:
npx rei-skills add rei-rea --all-ai --path ./my-project
```

### Unified CLI Quick Reference

```bash
# 1. Hybrid Intent & Stack Routing (English & Turkish + workspace file detection)
npx rei-skills recommend "Android APK ve firmware tersine mühendislik analizi" --files app.apk,router.bin

# 2. Dependency-Aware Workflow DAG Planning (computational vs hardware/CAD boundaries)
npx rei-skills plan "Design a 4-channel vibration PCB and its Fusion 360 enclosure" --files pcb.kicad_pcb,housing.step --json

# 3. Evaluate Router Performance on Held-Out Benchmark Split (train / dev / eval / all)
npx rei-skills evaluate --split eval

# 4. Inspect Capability-Aware Engineering Adapters & HOL Guard Security Status
npx rei-skills adapters --json
npx rei-skills security-status --json

# 5. Rootcastle Prompt Archive Sync, Composition & Controlled Improvement Drafts
npx rei-skills prompt sync
npx rei-skills prompt compose "Review telemetry firmware for failure modes"
npx rei-skills improve --feedback "Add SPICE bench parity cross-check" --json

# 6. Catalog Discovery, Quality Audits, Removal/Rollback, MCP Server & Format Export
npx rei-skills search firmware           # Search across 1424 skills by domain, keyword, risk, or upstream source
npx rei-skills quality rc-kicad-ecad-kicad-drc-ci --json
npx rei-skills remove rei-rea-orchestrator --cursor -w
npx rei-skills list --category reverse-engineering
npx rei-skills targets
npx rei-skills doctor
npx rei-skills mcp                       # Start stdio JSON-RPC 2.0 MCP Server
npx rei-skills export --format sdk-json --filter rei- --output ./dist-sdk
```

---

## Hybrid Semantic Skill Router & Benchmark Evaluation

Instead of injecting all 1,423 skill manuals into an agent's context window, [`lib/hybrid-router.js`](lib/hybrid-router.js) ranks relevant skills in real time using:

- **BM25 Weighted Inverted Index** (`WeakMap`-cached per catalog snapshot) paired with **256-dim offline character-trigram and domain-concept embeddings** (plus optional external `embeddingProvider` injection).
- **Bilingual EN/TR Normalization:** Turkish ASCII folding, suffix stemming, domain lexicon expansion, deduplicated stack boosts, slug-specialty matching, and boundary-matched `PHRASE_RULES`.
- **Quality, Tool & Token Budget Controls:** Default **Q0 quarantine filtering** (`includeQuarantined` opt-in), `availableTools` compatibility annotations, `detectConflictingSkills`, `contextTokenBudget` accounting, `safeOnly` risk filtering excluding `critical`/`offensive` skills, out-of-scope uncertainty gating (`high_uncertainty_or_out_of_scope`), and deterministic fallback (`engine: "legacy"`).

Measured across the 260-task benchmark ([`data/benchmarks/routing-benchmark-v1.json`](data/benchmarks/routing-benchmark-v1.json), split `train` = 80 / `dev` = 60 / `eval` = 120 held-out; report in [`data/benchmarks/routing-evaluation-report.json`](data/benchmarks/routing-evaluation-report.json)):

| Split | Router Engine | Recall@3 | Precision@3 | IncAct | MRR | nDCG@5 | Out-of-Scope FPR | `p95` Latency | `positive_tr` R@3 |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **`train`** (80) | Legacy | 88.89% | 49.5% | 11.11% | 0.8412 | 0.7376 | 25.0% | 26.519 ms | 60.00% |
| **`train`** (80) | **Hybrid** | **98.61%** | **58.8%** | **1.39%** | **0.9079** | **0.8392** | **0.0%** | **4.458 ms** | **100.00%** |
| **`dev`** (60) | Legacy | 89.29% | 51.8% | 10.71% | 0.8603 | 0.7854 | 25.0% | 21.989 ms | 62.50% |
| **`dev`** (60) | **Hybrid** | **96.43%** | **58.9%** | **3.57%** | **0.9000** | **0.8412** | **0.0%** | **5.942 ms** | **100.00%** |
| **`eval`** (120 held-out) | Legacy | 91.07% | 53.6% | 8.93% | 0.8375 | 0.7587 | 37.5% | 22.127 ms | 70.00% |
| **`eval`** (120 held-out) | **Hybrid** | **97.32%** | **58.9%** | **2.68%** | **0.9009** | **0.8537** | **0.0%** | **4.755 ms** | **100.00%** |

Critical-risk misrouting across all splits and engines: **0**. Full breakdown: [`docs/engineering/BENCHMARK_AND_EVALUATION_REPORT.md`](docs/engineering/BENCHMARK_AND_EVALUATION_REPORT.md).

---

## Registry Quality Engine & Gold 50 Program

Every skill in the 1,423-skill catalog is scored by the deterministic **14-Point Auditable Quality Engine** ([`lib/quality-engine.js`](lib/quality-engine.js), [`scripts/validate_skills.py`](scripts/validate_skills.py), [`data/quality-report.json`](data/quality-report.json)) across 7 × (`0..2`) = 14 dimensions, paired with **6 separated verification axes** (`schemaValid`, `referenceValidated`, `securityPolicyChecked`, `evaluationPassed`, `humanReviewed`, `hardwareVerified`):

- **Quality Tiers (`14pt-v1`):** `Q3` Gold (**346** skills), `Q2` Solid (**936** skills), `Q1` Basic (**141** skills), `Q0` Quarantine (**0** skills) · Average `14pt-v1` score: **`9.76 / 14`** (legacy doc score `82.3 / 100`).
- **Epistemic Integrity:** Failing schema, reference, or security checks force **`Q0` Quarantine** regardless of numerical score; unperformed checks remain explicit (`human_reviewed_count: 0`, `hardware_verified_count: 0` / `"not_verified"`).
- **Gold 50 Engineering Program ([`data/gold50-manifest.json`](data/gold50-manifest.json), [`scripts/evaluate-gold50.js`](scripts/evaluate-gold50.js)):** Evaluates **50 priority skills across 10 engineering disciplines** — **50/50 (`100.0%`)** skills passing, **149/150 (`99.3%`)** positive EN & EN/TR scenarios passing, **100/100 (`100.0%`)** negative/injection triggers cleanly rejected, and **50/50** multi-AI adapter transpilations passing (`targetGte95PctMet: true`). See [`docs/QUALITY_METHODOLOGY.md`](docs/QUALITY_METHODOLOGY.md) and [`docs/QUALITY_REPORT.md`](docs/QUALITY_REPORT.md).

---

## Workflow DAG Compiler & Capability-Aware Engineering Adapters

### Typed Workflow Orchestration ([`lib/workflow-compiler.js`](lib/workflow-compiler.js))

For complex multi-domain requests (such as *"Design a four-channel vibration measurement PCB and its Fusion 360 enclosure"*), `compileWorkflowPlan` constructs an acyclic topological DAG with unit compatibility checks (`mm` ↔ `cm`, `kHz` ↔ `Hz`), capability & resource conflict detection (`capabilityValidation`), resource budgets, retry policies, explicit uncertainty states, and strict execution boundary classifications:

- `COMPUTATIONAL_ONLY` — deterministic software planning, math, schema, and code verification.
- `REQUIRES_CAD_OR_EDA_SOFTWARE` — requires external KiCad / Fusion 360 tooling for geometry or PCB edits.
- `REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE` — requires physical sensors, DAQ hardware, or bench equipment.
- `REQUIRES_HUMAN_APPROVAL` — explicit operator signoff prior to manufacturing, flashing, or actuation.

Planning never fabricates physical outcomes (`executionRecord.claimedPhysicalExecution: false`).

### Capability-Aware Engineering Adapters ([`lib/engineering-adapters.js`](lib/engineering-adapters.js))

| Adapter ID | Domain | Safety Class | Computational Verifiers Implemented | External Software / Hardware Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **`kicad`** | ECAD / PCB Design | `state_changing` | `planKicadVerification` (dry-run `kicad-cli` ERC/DRC plans, fab rules) | Requires `kicad-cli` on host to run actual checks; [`cad_ecad_verify.py`](scripts/cad_ecad_verify.py) |
| **`fusion360`** | MCAD / Enclosures | `state_changing` | `convertFusionUnits` (`1 cm` DB unit math), `verifyEnclosureFit` | Requires Fusion Desktop Add-In for live timeline BRep edits |
| **`embedded`** | GNSS / CAN / Firmware | `potentially_hazardous` | `validateNmeaSentence` (XOR checksum + GGA), `parseJ1939CanId` (29-bit PGN/SA) | Hardware flashing / bench telemetry requires physical target + approval |
| **`scientific`** | Physics & Optimization | `read_only` | `verifyDimensionalConsistency` (7-base SI), `evaluateOptimizationFeasibility` | Pure numerical algebra; no closed-loop lab actuation |
| **`industrial_measurement`** | Vibration & Balancing | `potentially_hazardous` | `validateSensorCalibration`, `computeVibrationFftMetrics`, `calculateSinglePlaneBalance` | Marked `COMPUTATIONAL_ONLY`; lockout/tagout & operator signoff mandatory |

### Domain Expansion Coverage (`+528` Original Engineering Skills)

- **33 Technical Specialties:** Integrated alongside the original 895 skills (`528 + 895 = 1,423`) covering GNSS, JT808 telematics, BLE, cellular IoT, RTOS, firmware OTA, IoT security, Rust, industrial Ethernet, machinery vibration, rotor balancing, DAQ, PCB/EMC, time-series pipelines, edge ML, binary forensics, HIL testing, safety assurance, and reproducible research ([`docs/TECHNICAL_SKILL_EXPANSION.md`](docs/TECHNICAL_SKILL_EXPANSION.md)).
- **128 CAD, Electronics & Fusion 360 Skills:** Circuit design, SPICE parity, KiCad ERC/DRC, Fusion 360 parametric modeling & Python API, PCB–enclosure tolerance fits, and CAM ([`docs/CAD_ELECTRONICS_FUSION.md`](docs/CAD_ELECTRONICS_FUSION.md)).
- **Quality & capability boundary:** `getEnvironmentCapabilityManifest()` separates 5 operational levels (`L0` Documented → `L1` Software Installed → `L2` Offline Simulation → `L3` Configured Bridge → `L4` Physical Hardware Bench, strictly `not_verified` without attached calibrated bench instruments). Passing schema and security audits never certifies hardware, machining tolerances, or RF/EMC compliance (`claimedPhysicalExecution: false`).

---

## Smart MCP Server & HOL Guard Defense-in-Depth

Connect any MCP client (Claude Code, Cursor, Windsurf, Cline, Roo Code, Gemini CLI, Codex, Antigravity) to [`bin/mcp-server.js`](bin/mcp-server.js) and optionally [`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer):

```json
{
  "mcpServers": {
    "rei-skills": {
      "command": "npx",
      "args": ["-y", "rei-skills", "mcp"]
    },
    "rei-rea": {
      "command": "rei-rea",
      "args": ["mcp"]
    }
  }
}
```

### Registered MCP Tool Surface (`10` Core Tools + `3` Opt-In Extended)

- **Default Core Tools (`10`):**
  - *Policy Tier `inherit` (read / recommend / compose / compile):* `rei_recommend_skills`, `rei_search_skills`, `rei_get_skill`, `rei_get_workflow`, `rei_list_bundles`, `rei_compile_skill`, `rei_list_ai_targets`, `rei_compose_prompt`, `rei_propose_prompt_improvement`.
  - *Policy Tier `review` (staged workspace mutation):* `rei_install_skill` (`dry_run` preview, collision detection, `preview_token`, private `.rei-skills-backups/<transaction-id>/`, synchronous rollback).
- **Opt-In Extended Tools (`REI_MCP_EXTENDED_TOOLS=1`):** `rei_compile_workflow_plan`, `rei_evaluate_adapter`, `rei_security_status`.

### HOL Guard Integration & Local Policy Engine ([`lib/hol-guard-policy.js`](lib/hol-guard-policy.js))

- **Upstream Contribution:** REI Skills was contributed to Hashgraph Online's HOL Guard MCP ecosystem in [PR #7538](https://github.com/hashgraph-online/hol-guard/pull/7538) (**merged 15 Nov 2026**, schema `guard.mcp-server-contribution.v1`).
- **Local Deny-by-Default Enforcement:** `executeToolCall` routes every request and output through [`lib/hol-guard-policy.js`](lib/hol-guard-policy.js) — enforcing unknown-tool denial, prompt-injection & tool-poisoning detection, dangerous machine command blocking, credential/system path confinement (`~/.ssh`, `~/.aws`, `.npmrc`, traversal guards), supply-chain checks, and automatic API key / token output redaction.
- **Honest Runtime Disclosure:** `getHolGuardIntegrationStatus()` dynamically checks for `@hashgraphonline/hol-guard`; the external HOL Guard package is **not** installed locally in this repository by default, so local enforcement runs independently via `lib/hol-guard-policy.js` without misreporting external coverage.

---

## Rootcastle Prompt Intelligence, Rust Gateway `v0.2.0` & Continuous Improvement

- **Prompt Archive v2 ([`lib/prompt-archive.js`](lib/prompt-archive.js)):** Fetches versioned references from `https://promt.rootcastle.com/` with HTTPS allowlisting, explicit separation between SHA-256 content integrity (`integrityHashVerified: true`) and unsigned publisher verification (`publisherSignatureVerified: false`), injection scanning, `pinPromptVersion` pinning, 1-step `rollbackSnapshot` recovery, TTL expiry with `stale_offline_fallback` + `bundled_fallback`, and `maxContextChars` budgeting ([`docs/PROMPT_ARCHIVE_SECURITY.md`](docs/PROMPT_ARCHIVE_SECURITY.md)).
- **Rust Secure Communication Gateway (`v0.2.0`, [`rust/rei-hook-gateway`](rust/rei-hook-gateway/), `8/8` `cargo test`):** Typed local loopback IPC gateway (`127.0.0.1:9783`, `serde`/`serde_json`/`subtle`, zero host shell execution) enforcing constant-time token compare, `SafetyClass` gates (`read_only`, `state_changing`, `potentially_hazardous`), isolated engineering adapter contracts (`kicad`, `fusion360`, `embedded_diagnostics`, `telemetry`, `lab_equipment`), bounded nonce/timestamp replay protection, control-char/boundary abuse rejection, sliding-window rate limits, `max_in_flight` backpressure, cancellation, sanitized audit ring buffer, and fail-closed non-loopback `validate_bind_address` (`remote_enabled: false` until verified `mTLS` credentials + SAN allowlist are supplied). See [`docs/engineering/RUST_GATEWAY_SPEC.md`](docs/engineering/RUST_GATEWAY_SPEC.md).
- **Controlled Self-Improvement ([`lib/observability.js`](lib/observability.js), [`lib/evaluation-engine.js`](lib/evaluation-engine.js), [`lib/improvement-engine.js`](lib/improvement-engine.js)):** Executes sandboxed `Observe -> Detect Weakness -> Form Hypothesis -> Generate Candidate -> Test -> Compare Baseline -> Security Review -> Create PR Draft` experiments across `dev` and held-out `eval` splits, rejecting unsafe or non-beneficial mutations and outputting reviewable PR drafts with rollback plans (`automaticWrites: false`, `autoMerge: false`, `autoPublish: false`; see [`docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md`](docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md)).

---

## Interactive Web Hub

Explore the searchable catalog, live Hybrid Intent & Stack Router (EN/TR), pre-compiled **Workflow DAG Preview**, **Benchmark Evaluation Dashboard**, **HOL Guard Status**, **Prompt Archive Provenance**, and **Rust Gateway** architecture on **[GitHub Pages](https://rootcastleco.github.io/rei-skills/)** or build locally via `npm run doc-site` ([`docs/site/index.html`](docs/site/index.html)).

---

## Explore the Library

The registry currently contains **1424 validated skills** across **10 engineering categories**. Counts below are synchronized directly from [`data/catalog.json`](data/catalog.json):

<!-- CATEGORY_TABLE_START -->
| Category | Count | Focus Area | Representative Skills |
| :--- | ---: | :--- | :--- |
| **Data & AI** (`data-ai`) | 244 | LLM architectures, RAG, vector databases, data pipelines, Azure AI | [`rag-engineer`](skills/rag-engineer/SKILL.md), [`langgraph`](skills/langgraph/SKILL.md), [`postgres-best-practices`](skills/postgres-best-practices/SKILL.md) |
| **General Engineering** (`general`) | 170 | Planning, technical documentation, debugging, specifications | [`brainstorming`](skills/brainstorming/SKILL.md), [`concise-planning`](skills/concise-planning/SKILL.md), [`doc-coauthoring`](skills/doc-coauthoring/SKILL.md) |
| **Software Development** (`development`) | 357 | TypeScript, Python, Go, Rust, Java, React, Next.js, mobile SDKs | [`typescript-pro`](skills/typescript-pro/SKILL.md), [`python-pro`](skills/python-pro/SKILL.md), [`react-best-practices`](skills/react-best-practices/SKILL.md) |
| **Security & AppSec** (`security`) | 144 | Threat modeling, SAST, vulnerability auditing, authorized red-teaming | [`security-auditor`](skills/security-auditor/SKILL.md), [`threat-modeling-expert`](skills/threat-modeling-expert/SKILL.md), [`api-security-best-practices`](skills/api-security-best-practices/SKILL.md) |
| **Infrastructure & Cloud** (`infrastructure`) | 149 | Kubernetes, Terraform, CI/CD, observability, SRE, service mesh | [`kubernetes-architect`](skills/kubernetes-architect/SKILL.md), [`terraform-specialist`](skills/terraform-specialist/SKILL.md), [`observability-engineer`](skills/observability-engineer/SKILL.md) |
| **Workflows & Automation** (`workflow`) | 80 | Multi-agent orchestration, task automation, integration pipelines | [`workflow-automation`](skills/workflow-automation/SKILL.md), [`mcp-builder`](skills/mcp-builder/SKILL.md), [`gitops-workflow`](skills/gitops-workflow/SKILL.md) |
| **Architecture & DDD** (`architecture`) | 99 | System design, C4 modeling, DDD, CQRS, event-driven systems | [`backend-architect`](skills/backend-architect/SKILL.md), [`domain-driven-design`](skills/domain-driven-design/SKILL.md), [`c4-context`](skills/c4-context/SKILL.md) |
| **Product & Business** (`business`) | 40 | Product management, technical SEO, pricing, GTM analysis | [`product-manager-toolkit`](skills/product-manager-toolkit/SKILL.md), [`seo-audit`](skills/seo-audit/SKILL.md), [`pricing-strategy`](skills/pricing-strategy/SKILL.md) |
| **Testing & QA** (`testing`) | 111 | Test-driven development, E2E browser automation, regression suites | [`test-driven-development`](skills/test-driven-development/SKILL.md), [`browser-automation`](skills/browser-automation/SKILL.md), [`e2e-testing-patterns`](skills/e2e-testing-patterns/SKILL.md) |
| **Reverse Engineering** (`reverse-engineering`) | 30 | Binary intelligence, firmware/IoT triage, APK/Electron/WASM, forensics | [`rei-rea-orchestrator`](skills/rei-rea-orchestrator/SKILL.md), [`rei-binary-intelligence`](skills/rei-binary-intelligence/SKILL.md), [`rei-firmware-and-iot`](skills/rei-firmware-and-iot/SKILL.md) |
<!-- CATEGORY_TABLE_END -->

- **Full Markdown Catalog:** [`CATALOG.md`](CATALOG.md)
- **Interactive Web Hub:** [`docs/site/index.html`](docs/site/index.html)
- **Curated Role Bundles:** [`docs/BUNDLES.md`](docs/BUNDLES.md) (`rei-rea`, `core-dev`, `security-core`, `k8s-core`, `data-core`, `ops-core`)
- **Execution Workflows:** [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md)

---

## REI Reverse Engineering (REI REA)

REI Skills integrates the **[REI Reverse Engineering Workbench (`rootcastleco/Rei-Reverse-engineer`)](https://github.com/rootcastleco/Rei-Reverse-engineer)** as a first-class engineering module:

- **Bundled by default in `rei-skills`:** **12 specialist agent skills** (`skills/rei-*`) guiding evidence-first triage, SHA-256 artifact identity verification, format-specific inspection, and confidence tracking (`observed`, `inferred`, `unknown`).
- **Optional Python/MCP Workbench (`rootcastle-rei-rea` v0.2.0):** Standalone Python 3.10+ CLI and **14-tool local stdio MCP server** installed separately without mutating user environments automatically.

| Skill | Investigation Scope |
| :--- | :--- |
| [`rei-rea-orchestrator`](skills/rei-rea-orchestrator/SKILL.md) | Intake, SHA-256 identity, format-based routing, and verification checkpoints. |
| [`rei-binary-intelligence`](skills/rei-binary-intelligence/SKILL.md) | Bounded PE, ELF, and WebAssembly v1 structural parsing and version-to-version diffs. |
| [`rei-casebook-forensics`](skills/rei-casebook-forensics/SKILL.md) | SQLite casebook indexing, cross-case search, and metadata-only forensic bundle verification. |
| [`rei-native-binaries`](skills/rei-native-binaries/SKILL.md) | PE, ELF, Mach-O, and COFF symbol, import, ABI, and call-graph inspection. |
| [`rei-electron-and-js`](skills/rei-electron-and-js/SKILL.md) | Electron ASAR archives, preload scripts, IPC routes, and bundled JavaScript analysis. |
| [`rei-android-apks`](skills/rei-android-apks/SKILL.md) | Android APK/AAB, DEX bytecode, manifest permissions, and JNI boundary triage. |
| [`rei-firmware-and-iot`](skills/rei-firmware-and-iot/SKILL.md) | Authorized MCU, UEFI, embedded Linux, automotive telemetry, and GPS/IoT firmware analysis. |
| [`rei-mobile-runtime`](skills/rei-mobile-runtime/SKILL.md) | Authorized Android/iOS lab runtime observation planning when static evidence is insufficient. |
| [`rei-evidence-ledger`](skills/rei-evidence-ledger/SKILL.md) | Append-only SHA-256 hash-linked case records and confidence auditing. |
| [`rei-reconstruction-parity`](skills/rei-reconstruction-parity/SKILL.md) | Clean-room behavioral specifications, differential test corpora, and parity verification. |
| [`rei-wasm-and-managed`](skills/rei-wasm-and-managed/SKILL.md) | WebAssembly v1 modules, .NET CIL assemblies, and JVM bytecode analysis. |
| [`rei-web-and-protocols`](skills/rei-web-and-protocols/SKILL.md) | HAR, PCAP/PCAPNG captures, telemetry frames, and protocol state-machine reconstruction. |

👉 **Full integration guide:** [`docs/REI_REA_INTEGRATION.md`](docs/REI_REA_INTEGRATION.md) · **Reproducible demo:** [`examples/rei-rea-demo/`](examples/rei-rea-demo/README.md)

---

## Practical Demonstrations

### 1. Install the REI REA Specialist Pack and Inspect a Skill

```text
$ npx rei-skills add rei-rea --path ./.agent/skills --local

✅ REI Skills installed (12 items) to ./.agent/skills
```

```text
$ npx rei-skills info rei-rea-orchestrator

🏰 Skill: rei-rea-orchestrator (rei-rea-orchestrator)
   Category:    reverse-engineering
   Risk Level:  safe
   Provenance:  rootcastle-rei
   Path:        skills/rei-rea-orchestrator/SKILL.md
```

### 2. Inspect Harmless WebAssembly Fixtures with REI REA

```bash
rei-rea diff \
  examples/rei-rea-demo/fixtures/telemetry-filter-v1.wasm \
  examples/rei-rea-demo/fixtures/telemetry-filter-v2.wasm
```

Verified excerpt ([`examples/rei-rea-demo/DEMO_OUTPUT.json`](examples/rei-rea-demo/DEMO_OUTPUT.json)):

```json
{
  "kind": "wasm",
  "before_sha256": "a86707e622921126c88d3b27142cb9404320197c19c45ec4fb81a2a4e908949f",
  "after_sha256": "766cc87ddc6f9df8964a05f2da01e7a0c8bf8b8370b53646d57b954b5b20ba59",
  "structural_changes": {
    "imports": { "added": [{ "module": "env", "name": "audit_log_frame", "kind": 0 }], "removed": [] },
    "exports": { "added": [{ "name": "validate_packet_header", "kind": 0, "index": 3 }], "removed": [] }
  }
}
```

---

## Compatibility

Compatibility across adapters is verified via automated schema validation, `npx skills` discovery checks (`vercel-labs/skills`), and installer tests ([`docs/ADAPTER_COMPATIBILITY_MATRIX.md`](docs/ADAPTER_COMPATIBILITY_MATRIX.md), [`scripts/tests/installer.test.js`](scripts/tests/installer.test.js), [`scripts/tests/mcp-safe-installer.test.js`](scripts/tests/mcp-safe-installer.test.js), [`scripts/tests/npm-package.test.js`](scripts/tests/npm-package.test.js)):

| AI Assistant / Client | Target Directory | Installer Flag | Verification Status | Invocation Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **`npx skills` (`vercel-labs/skills`)** | `skills/<id>/SKILL.md` | `--list` / direct URL | **Tested** (`0` invalid names/descriptions across `1,423` skills) | `npx skills add rootcastleco/rei-skills` |
| **Claude Code** | `~/.claude/skills` | `--claude` | **Tested** (Installer + YAML schema + symlink materialization) | `/skill-name` or `@skill-name` |
| **OpenAI Codex CLI** | `~/.codex/skills` | `--codex` | **Tested** (`agents/openai.yaml` metadata preserved) | `Use @skill-name ...` |
| **Gemini CLI** | `~/.gemini/skills` | `--gemini` | **Tested** (Installer + `SKILL.md` frontmatter parser) | `Use skill-name to ...` |
| **Cursor IDE** | `~/.cursor/skills` | `--cursor` | **Tested** (Installer + `.cursor/rules/*.mdc` + MCP backup) | `@skill-name` in Cursor Chat |
| **Antigravity IDE** | `~/.gemini/rei/skills` | `--antigravity` | **Tested** (Default global target + workspace `.agent/skills`) | `Use @skill-name ...` |
| **GitHub Copilot** | `.github/instructions` | `--copilot` / `export` | **Tested** (`.instructions.md` transpiler + format tests) | Attach instructions / prompt |
| **15 Additional Targets** | `.windsurf`, `.clinerules`, etc. | `--windsurf`, `--sdk`, etc. | **Tested** (`AI_TARGETS` matrix in `lib/ai-adapters.js`) | Native rule / SDK JSON |

---

## NVIDIA SkillEvaluator — Independent Skill Quality Checks

The optional [NVIDIA SkillEvaluator](https://github.com/NVIDIA/SkillEvaluator) integration adds an **independent skill-quality evaluation path** to REI Skills. Version **v0.9.0** is installed separately (not bundled in the npm package). The scoped [`skill-checks.yml`](.github/workflows/skill-checks.yml) GitHub Actions workflow runs **Tier 1** in advisory mode with pinned upstream artifacts. A green targeted run does **not** verify the full catalog or establish a security attestation.

- [Integration guide and verified scope](docs/SKILLEVALUATOR_INTEGRATION.md)
- [GitHub Actions skill checks](https://github.com/rootcastleco/rei-skills/actions/workflows/skill-checks.yml)
- Optional local setup: `uv tool install skillevaluator==0.9.0`
- Tier 2 and Tier 3 require separate model/provider or sandbox setup; these are **NOT VERIFIED** in the recorded integration evidence.

---

## Google Research PaperOrchestra — Evidence-Gated Research Writing

REI Skills includes [`rei-paper-orchestra`](skills/rei-paper-orchestra/SKILL.md), an isolated, opt-in bridge to [Google Research PaperOrchestra](https://github.com/google-research/paper-orchestra). It can draft LaTeX manuscripts from actual experiment notes through outline, literature, section-writing, refinement, and optional plotting agents. All external processing is opt-in; citation existence, experimental numbers, figures, originality, and venue compliance require independent human review. See [integration guide](docs/PAPER_ORCHESTRA_INTEGRATION.md). **Upstream Apache-2.0; original REI adapter MIT.** No upstream code is bundled.

---

## Engineering Documentation & Reports

| Document | Scope |
| :--- | :--- |
| [`docs/audits/BASELINE_AUDIT.md`](docs/audits/BASELINE_AUDIT.md) | Baseline repository, `npx skills`, bundle count & verification gap audit |
| [`docs/QUALITY_METHODOLOGY.md`](docs/QUALITY_METHODOLOGY.md) | `14pt-v1` rubric (`Q3`–`Q0`), Q0 quarantine rules, and 6 separated verification axes |
| [`docs/QUALITY_REPORT.md`](docs/QUALITY_REPORT.md) | Registry-wide quality summary (`346 Q3`, `936 Q2`, `141 Q1`, `0 Q0`) & Gold 50 (`50/50`) results |
| [`docs/ADAPTER_COMPATIBILITY_MATRIX.md`](docs/ADAPTER_COMPATIBILITY_MATRIX.md) | 21-target transpiler & `vercel-labs/skills` (`npx skills`) verified compatibility semantics |
| [`docs/PROMPT_ARCHIVE_SECURITY.md`](docs/PROMPT_ARCHIVE_SECURITY.md) | SHA-256 integrity vs unsigned publisher distinction, pinning & 1-step rollback contract |
| [`docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md`](docs/CONTROLLED_IMPROVEMENT_PROTOCOL.md) | Evidence-gated, review-only improvement workflow & held-out non-regression policy |
| [`docs/engineering/ARCHITECTURE.md`](docs/engineering/ARCHITECTURE.md) | End-to-end platform pipeline and ADRs `001`–`008` |
| [`docs/engineering/PHASE_A_BASELINE_REPORT.md`](docs/engineering/PHASE_A_BASELINE_REPORT.md) | Baseline audit, `npm publish` verification root-cause, and latency/FPR measurements |
| [`docs/engineering/BENCHMARK_AND_EVALUATION_REPORT.md`](docs/engineering/BENCHMARK_AND_EVALUATION_REPORT.md) | 260-task split evaluation (`Recall@3`, `Precision@3`, `MRR`, `nDCG@5`, `FPR`, `p95`) |
| [`docs/engineering/RUST_GATEWAY_SPEC.md`](docs/engineering/RUST_GATEWAY_SPEC.md) | Wire schema, isolated adapter safety classes, replay/rate-limit/backpressure & mTLS gate |
| [`docs/engineering/RELEASE_READINESS_REPORT.md`](docs/engineering/RELEASE_READINESS_REPORT.md) | Evidence-backed `PASS` / `FAIL` / `NOT VERIFIED` release readiness matrix |
| [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) | Platform threat model (`TM-01`–`TM-11`) and verification commands |
| [`docs/PROMPT_AUTOMATION.md`](docs/PROMPT_AUTOMATION.md) | Prompt Archive & Rust gateway operational boundary guide |
| [`docs/USAGE.md`](docs/USAGE.md) | Detailed CLI, MCP, and workflow usage guide |

---

## Contributing and Community

1. **Fork & Branch:** Create a feature branch from `main`.
2. **Add or Improve a Skill:** Follow [`docs/SKILL_ANATOMY.md`](docs/SKILL_ANATOMY.md) and [`docs/QUALITY_BAR.md`](docs/QUALITY_BAR.md).
3. **Validate Locally:**
   ```bash
   npm run validate:strict
   npm run security-audit
   npm run build
   npm test
   cargo test --manifest-path rust/rei-hook-gateway/Cargo.toml
   ```
4. **Open a Pull Request:** Follow [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). See also [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), [`SUPPORT.md`](SUPPORT.md), and [`ROADMAP.md`](ROADMAP.md).

---

## License, Attribution, and Security

- **License:** Original code, tooling, and Rootcastle-authored skills are released under the **[MIT License](LICENSE)**.
- **Upstream Attribution & Provenance:** Preserves upstream work from `anthropics/skills`, `microsoft/skills` ([`docs/LICENSE-MICROSOFT`](docs/LICENSE-MICROSOFT)), `openai/skills`, `vercel-labs/agent-skills`, `supabase/agent-skills`, `google-gemini/gemini-skills`, and open-source contributors documented in [`CREDITS.md`](CREDITS.md) and [`docs/SOURCES.md`](docs/SOURCES.md).
- **Security Policy & Guardrails:** All 1424 skills are scanned by [`scripts/security_audit.js`](scripts/security_audit.js) and [`scripts/validate_skills.py`](scripts/validate_skills.py). Offensive security skills carry mandatory `AUTHORIZED USE ONLY` disclaimers. See [`SECURITY.md`](SECURITY.md), [`docs/SECURITY_GUARDRAILS.md`](docs/SECURITY_GUARDRAILS.md), and [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

---

<div align="center">

**REI Skills — Engineering Beyond Boundaries**  
Maintained by **[Rootcastle Engineering & Innovation](https://www.rootcastle.com)** · Batuhan Ayrıbaş · [admin@rootcastle.com](mailto:admin@rootcastle.com)  
[Project overview](https://rootcastle.com/en/projects/rei-skills/) · [Engineering walkthrough](https://rootcastle.com/en/engineering-notes/evidence-based-reverse-engineering/)

</div>
