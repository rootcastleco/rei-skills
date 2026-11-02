# 🔄 REI Workflows — Multi-Skill Orchestration Playbooks

> **Deterministic step-by-step execution playbooks that coordinate multiple skills toward a verifiable engineering outcome.**

## What Is a Workflow?

- **Bundles** (`docs/BUNDLES.md`) group skills by engineering role.
- **Workflows** (`docs/WORKFLOWS.md` and `data/workflows.json`) define ordered execution phases, required skills, and expected output artifacts.

---

## 1. Workflow: Reverse Engineer & Triage a Binary Release (`reverse-engineer-binary-release`)

Perform provenance-gated static triage, format inspection, version diffing, and forensic reporting on native binaries, Electron apps, APKs, or WebAssembly modules.

**Related bundle:** `rei-rea` (`npx rei-skills add rei-rea`)

### Prerequisites

- Authorized binary/application sample(s) in a local workspace.
- Optional: `rei-rea` Python workbench installed (`pip install -e .` from `Rei-Reverse-engineer`) for CLI/MCP automation.

### Steps

1. **Initialize forensic casebook & intake artifact**
   - **Goal:** Establish SHA-256 chain of custody and detect format/entropy profile.
   - **Skills:** [`@rei-rea-orchestrator`](../skills/rei-rea-orchestrator/), [`@rei-casebook-forensics`](../skills/rei-casebook-forensics/), [`@rei-binary-intelligence`](../skills/rei-binary-intelligence/)
   - **Prompt example:** `Use @rei-casebook-forensics and @rei-binary-intelligence to intake build-v2.bin and summarize its sections, hashes, and entropy.`

2. **Run format-specific structural inspection**
   - **Goal:** Extract imports, exports, symbols, IPC channels, or embedded payloads.
   - **Skills:** [`@rei-native-binaries`](../skills/rei-native-binaries/), [`@rei-electron-and-js`](../skills/rei-electron-and-js/), [`@rei-android-apks`](../skills/rei-android-apks/), [`@rei-wasm-and-managed`](../skills/rei-wasm-and-managed/)
   - **Prompt example:** `Use @rei-wasm-and-managed to inspect imports, exports, and custom sections of telemetry-filter-v2.wasm.`

3. **Compare versions & audit reconstruction parity**
   - **Goal:** Identify structural changes between releases and verify parity obligations.
   - **Skills:** [`@rei-reconstruction-parity`](../skills/rei-reconstruction-parity/), [`@rei-evidence-ledger`](../skills/rei-evidence-ledger/)
   - **Prompt example:** `Use @rei-reconstruction-parity and @rei-evidence-ledger to compare v1 and v2 and classify findings into EVIDENCE, INFERENCE, and UNKNOWN.`

---

## 2. Workflow: Firmware & IoT Image Security Triage (`firmware-iot-security-triage`)

Inspect embedded firmware images for magic header offsets, high-entropy encrypted/compressed segments, embedded filesystems, and hardcoded credentials.

**Related bundles:** `rei-rea`, `security-engineer`

### Steps

1. **Scan magic headers & entropy layout**
   - **Goal:** Map bootloaders, kernel images, SquashFS/CramFS roots, and encrypted blocks.
   - **Skills:** [`@rei-firmware-and-iot`](../skills/rei-firmware-and-iot/), [`@rei-binary-intelligence`](../skills/rei-binary-intelligence/)
   - **Prompt example:** `Use @rei-firmware-and-iot to map magic signatures and entropy regions in router-fw.bin.`

2. **Audit extracted configurations & binaries**
   - **Goal:** Identify insecure defaults, hardcoded keys, or vulnerable native services.
   - **Skills:** [`@rei-native-binaries`](../skills/rei-native-binaries/), [`@security-auditor`](../skills/security-auditor/), [`@rei-evidence-ledger`](../skills/rei-evidence-ledger/)
   - **Prompt example:** `Use @rei-evidence-ledger to record verified findings with file offsets and SHA-256 hashes.`

---

## 3. Workflow: Ship a SaaS MVP (`ship-saas-mvp`)

Build and ship a minimal, production-hardened SaaS application from specification to deployment.

**Related bundles:** `essentials`, `fullstack`, `devops-cloud`

### Steps

1. **Plan the scope**
   - **Skills:** [`@brainstorming`](../skills/brainstorming/), [`@concise-planning`](../skills/concise-planning/), [`@writing-plans`](../skills/writing-plans/)
   - **Prompt example:** `Use @concise-planning to define milestones and acceptance criteria for our SaaS MVP.`

2. **Build backend and API**
   - **Skills:** [`@backend-dev-guidelines`](../skills/backend-dev-guidelines/), [`@api-patterns`](../skills/api-patterns/), [`@database-design`](../skills/database-design/)
   - **Prompt example:** `Use @backend-dev-guidelines to implement the billing domain API and database schema.`

3. **Build frontend**
   - **Skills:** [`@frontend-developer`](../skills/frontend-developer/), [`@react-patterns`](../skills/react-patterns/), [`@frontend-design`](../skills/frontend-design/)
   - **Prompt example:** `Use @frontend-developer to build the onboarding and dashboard views.`

4. **Test and validate**
   - **Skills:** [`@test-driven-development`](../skills/test-driven-development/), [`@browser-automation`](../skills/browser-automation/)
   - **Prompt example:** `Use @browser-automation to write deterministic Playwright E2E tests for signup and checkout.`

5. **Ship safely**
   - **Skills:** [`@deployment-procedures`](../skills/deployment-procedures/), [`@observability-engineer`](../skills/observability-engineer/)
   - **Prompt example:** `Use @deployment-procedures to prepare our zero-downtime release and rollback checklist.`

---

## 4. Workflow: Security Audit for a Web App (`security-audit-web-app`)

Run an authorized security review from threat modeling to verified remediation.

**Related bundles:** `security-engineer`, `security-developer`

### Steps

1. **Define scope and threat model**
   - **Skills:** [`@ethical-hacking-methodology`](../skills/ethical-hacking-methodology/), [`@threat-modeling-expert`](../skills/threat-modeling-expert/), [`@attack-tree-construction`](../skills/attack-tree-construction/)
2. **Review auth and access control**
   - **Skills:** [`@broken-authentication`](../skills/broken-authentication/), [`@auth-implementation-patterns`](../skills/auth-implementation-patterns/), [`@idor-testing`](../skills/idor-testing/)
3. **Assess API and input security**
   - **Skills:** [`@api-security-best-practices`](../skills/api-security-best-practices/), [`@api-fuzzing-bug-bounty`](../skills/api-fuzzing-bug-bounty/), [`@top-web-vulnerabilities`](../skills/top-web-vulnerabilities/)
4. **Harden and verify**
   - **Skills:** [`@security-auditor`](../skills/security-auditor/), [`@sast-configuration`](../skills/sast-configuration/), [`@verification-before-completion`](../skills/verification-before-completion/)

---

## 5. Workflow: Build an AI Agent System (`build-ai-agent-system`)

Design and deliver a production-grade agent with measurable evaluation gates.

**Related bundles:** `agent-architect`, `llm-dev`

### Steps

1. **Define target behavior and KPIs**
   - **Skills:** [`@ai-agents-architect`](../skills/ai-agents-architect/), [`@agent-evaluation`](../skills/agent-evaluation/), [`@product-manager-toolkit`](../skills/product-manager-toolkit/)
2. **Design retrieval and memory**
   - **Skills:** [`@llm-app-patterns`](../skills/llm-app-patterns/), [`@rag-implementation`](../skills/rag-implementation/), [`@vector-database-engineer`](../skills/vector-database-engineer/)
3. **Implement orchestration**
   - **Skills:** [`@langgraph`](../skills/langgraph/), [`@mcp-builder`](../skills/mcp-builder/), [`@workflow-automation`](../skills/workflow-automation/)
4. **Evaluate and iterate**
   - **Skills:** [`@agent-evaluation`](../skills/agent-evaluation/), [`@langfuse`](../skills/langfuse/), [`@kaizen`](../skills/kaizen/)

---

## 6. Workflow: QA and Browser Automation (`qa-browser-automation`)

Create resilient browser automation with deterministic execution in CI.

### Steps

1. **Prepare test strategy** — [`@e2e-testing-patterns`](../skills/e2e-testing-patterns/), [`@test-driven-development`](../skills/test-driven-development/)
2. **Implement browser tests** — [`@browser-automation`](../skills/browser-automation/), [`@go-playwright`](../skills/go-playwright/)
3. **Triage and harden** — [`@systematic-debugging`](../skills/systematic-debugging/), [`@test-fixing`](../skills/test-fixing/), [`@verification-before-completion`](../skills/verification-before-completion/)

---

## 7. Workflow: Design a DDD Core Domain (`design-ddd-core-domain`)

Model a complex domain coherently, then implement tactical and evented patterns only where justified.

### Steps

1. **Assess DDD fit and scope** — [`@domain-driven-design`](../skills/domain-driven-design/), [`@architecture-decision-records`](../skills/architecture-decision-records/)
2. **Create strategic model** — [`@ddd-strategic-design`](../skills/ddd-strategic-design/)
3. **Map context relationships** — [`@ddd-context-mapping`](../skills/ddd-context-mapping/)
4. **Implement tactical model** — [`@ddd-tactical-patterns`](../skills/ddd-tactical-patterns/), [`@test-driven-development`](../skills/test-driven-development/)
5. **Adopt evented patterns selectively** — [`@cqrs-implementation`](../skills/cqrs-implementation/), [`@event-store-design`](../skills/event-store-design/), [`@projection-patterns`](../skills/projection-patterns/), [`@saga-orchestration`](../skills/saga-orchestration/)

---

## Machine-Readable Workflows

All workflow definitions are validated in CI via `scripts/validate_references.py` against [`data/workflows.json`](../data/workflows.json).
