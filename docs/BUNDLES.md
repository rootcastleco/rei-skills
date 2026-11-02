# 📦 REI Skills — Curated Role Bundles

> **Curated collections of skills organized by engineering role and domain.**
> Every bundle can be installed selectively via `npx rei-skills add <bundle-id>` or explored directly from a full catalog installation.

## 🚀 Quick Start

1. **Install the full catalog or a specific bundle:**
   ```bash
   # Full catalog (895 skills)
   npx rei-skills

   # Or install a single role bundle selectively
   npx rei-skills add rei-rea
   npx rei-skills add essentials
   ```

2. **Use skills** by referencing them in your AI coding assistant:
   - **Claude Code:** `/skill-name` or `@skill-name`
   - **OpenAI Codex CLI:** `Use @skill-name...`
   - **Gemini CLI / Antigravity:** `Use @skill-name...`
   - **Cursor:** `@skill-name` in chat

---

## 🔬 Reverse Engineering & Binary Intelligence

### 🔬 The "REI Reverse Engineering & Forensics (REA)" Pack (`rei-rea`)

_First-class specialist suite synchronized from [Rei-Reverse-engineer](https://github.com/rootcastleco/Rei-Reverse-engineer) (`v0.2.0`)._

```bash
npx rei-skills add rei-rea
```

- [`rei-rea-orchestrator`](../skills/rei-rea-orchestrator/): Master multi-phase reverse-engineering orchestrator and routing engine.
- [`rei-binary-intelligence`](../skills/rei-binary-intelligence/): Structural PE/ELF/Mach-O/APK/Wasm triage, entropy, strings, and hash profiling.
- [`rei-casebook-forensics`](../skills/rei-casebook-forensics/): Reproducible forensic case management, artifact intake, and finding reports.
- [`rei-native-binaries`](../skills/rei-native-binaries/): Native x86_64/ARM64/Rust/Go/C++/Swift/ObjC symbol, section, and import recovery.
- [`rei-electron-and-js`](../skills/rei-electron-and-js/): Electron ASAR, preload bridge, IPC surface, and bundled JS analysis.
- [`rei-android-apks`](../skills/rei-android-apks/): Android APK manifest, DEX structure, JNI bridge, and signing inspection.
- [`rei-firmware-and-iot`](../skills/rei-firmware-and-iot/): Embedded firmware images, magic offset discovery, and entropy segmentation.
- [`rei-mobile-runtime`](../skills/rei-mobile-runtime/): Authorized Frida/LLDB/ADB dynamic runtime verification playbooks.
- [`rei-evidence-ledger`](../skills/rei-evidence-ledger/): Provenance-gated `EVIDENCE` / `INFERENCE` / `UNKNOWN` classification.
- [`rei-reconstruction-parity`](../skills/rei-reconstruction-parity/): Clean-room structural parity auditing and release version diffing.
- [`rei-wasm-and-managed`](../skills/rei-wasm-and-managed/): WebAssembly custom sections, imports/exports, and .NET/JVM metadata inspection.
- [`rei-web-and-protocols`](../skills/rei-web-and-protocols/): Sourcemaps, webpack/Vite chunks, GraphQL schemas, and protocol frame inspection.

---

## 🎯 Essentials & Core

### 🚀 The "Essentials" Starter Pack (`essentials`)

_For everyone. Install these first._

- [`concise-planning`](../skills/concise-planning/): Always start with a structured plan.
- [`lint-and-validate`](../skills/lint-and-validate/): Keep your code clean automatically.
- [`git-pushing`](../skills/git-pushing/): Save and push your work safely.
- [`kaizen`](../skills/kaizen/): Continuous improvement mindset.
- [`systematic-debugging`](../skills/systematic-debugging/): Root-cause debugging workflow.

---

## 🛡️ Security & Compliance

### 🛡️ The "Security Engineer" Pack (`security-engineer`)

_For authorized pentesting, auditing, and hardening._

- [`ethical-hacking-methodology`](../skills/ethical-hacking-methodology/): Reconnaissance to reporting methodology.
- [`burp-suite-testing`](../skills/burp-suite-testing/): Web vulnerability scanning workflows.
- [`top-web-vulnerabilities`](../skills/top-web-vulnerabilities/): OWASP-aligned vulnerability taxonomy.
- [`linux-privilege-escalation`](../skills/linux-privilege-escalation/): Linux security assessment checklist.
- [`cloud-penetration-testing`](../skills/cloud-penetration-testing/): AWS/Azure/GCP security assessment.
- [`security-auditor`](../skills/security-auditor/): Comprehensive security audits.
- [`vulnerability-scanner`](../skills/vulnerability-scanner/): Vulnerability analysis patterns.

### 🔐 The "Security Developer" Pack (`security-developer`)

_For building secure applications by default._

- [`api-security-best-practices`](../skills/api-security-best-practices/): Secure API design patterns.
- [`auth-implementation-patterns`](../skills/auth-implementation-patterns/): JWT, OAuth2, session management.
- [`backend-security-coder`](../skills/backend-security-coder/): Secure backend coding practices.
- [`frontend-security-coder`](../skills/frontend-security-coder/): XSS prevention and client-side security.
- [`cc-skill-security-review`](../skills/cc-skill-security-review/): Security checklist for features.
- [`pci-compliance`](../skills/pci-compliance/): Payment card security standards.

---

## 🌐 Web Development

### 🌐 The "Web Wizard" Pack (`web-wizard`)

_For building modern, high-performance web apps._

- [`frontend-design`](../skills/frontend-design/): UI guidelines and aesthetics.
- [`react-best-practices`](../skills/react-best-practices/): React & Next.js performance optimization.
- [`react-patterns`](../skills/react-patterns/): Modern React patterns and principles.
- [`nextjs-best-practices`](../skills/nextjs-best-practices/): Next.js App Router patterns.
- [`tailwind-patterns`](../skills/tailwind-patterns/): Tailwind CSS v4 styling patterns.
- [`form-cro`](../skills/form-cro/): Optimize forms for conversion.
- [`seo-audit`](../skills/seo-audit/): Technical SEO health checks.

### ⚡ The "Full-Stack Developer" Pack (`fullstack`)

_For end-to-end web application development._

- [`senior-fullstack`](../skills/senior-fullstack/): Complete fullstack development guide.
- [`frontend-developer`](../skills/frontend-developer/): React 19+ and Next.js 15+ expertise.
- [`backend-dev-guidelines`](../skills/backend-dev-guidelines/): Node.js/Express/TypeScript patterns.
- [`api-patterns`](../skills/api-patterns/): REST vs GraphQL vs tRPC selection.
- [`database-design`](../skills/database-design/): Schema design and ORM selection.
- [`stripe-integration`](../skills/stripe-integration/): Payments and subscriptions.

---

## 🤖 AI & Agents

### 🤖 The "Agent Architect" Pack (`agent-architect`)

_For building AI systems and autonomous agents._

- [`agent-evaluation`](../skills/agent-evaluation/): Test and benchmark your agents.
- [`langgraph`](../skills/langgraph/): Build stateful agent workflows.
- [`mcp-builder`](../skills/mcp-builder/): Create your own MCP tools.
- [`prompt-engineering`](../skills/prompt-engineering/): Structured LLM prompting patterns.
- [`ai-agents-architect`](../skills/ai-agents-architect/): Design autonomous AI agents.
- [`rag-engineer`](../skills/rag-engineer/): Build RAG systems with vector search.

### 🧠 The "LLM Application Developer" Pack (`llm-dev`)

_For building production LLM applications._

- [`llm-app-patterns`](../skills/llm-app-patterns/): Production-ready LLM patterns.
- [`rag-implementation`](../skills/rag-implementation/): Retrieval-Augmented Generation.
- [`prompt-caching`](../skills/prompt-caching/): Cache strategies for LLM prompts.
- [`context-window-management`](../skills/context-window-management/): Manage LLM context efficiently.
- [`langfuse`](../skills/langfuse/): LLM observability and tracing.

---

## 🐍 Backend, Systems & Infrastructure

### 🐍 The "Python Pro" Pack (`python-pro`)

- [`python-pro`](../skills/python-pro/): Python 3.12+ with modern typing and async features.
- [`python-patterns`](../skills/python-patterns/): Idiomatic Python architecture.
- [`fastapi-pro`](../skills/fastapi-pro/): High-performance async APIs.
- [`django-pro`](../skills/django-pro/): Production Django patterns.
- [`python-testing-patterns`](../skills/python-testing-patterns/): Comprehensive testing with pytest.

### 🦀 The "Systems Programming" Pack (`systems`)

- [`rust-pro`](../skills/rust-pro/): Rust 1.75+ with async patterns.
- [`go-concurrency-patterns`](../skills/go-concurrency-patterns/): Go concurrency mastery.
- [`golang-pro`](../skills/golang-pro/): Go development expertise.
- [`memory-safety-patterns`](../skills/memory-safety-patterns/): Memory-safe programming.
- [`cpp-pro`](../skills/cpp-pro/): Modern C++ development.

### 🌧️ The "DevOps & Cloud" Pack (`devops-cloud`)

- [`docker-expert`](../skills/docker-expert/): Containers and multi-stage builds.
- [`aws-serverless`](../skills/aws-serverless/): Serverless on AWS (Lambda, DynamoDB).
- [`kubernetes-architect`](../skills/kubernetes-architect/): K8s architecture and GitOps.
- [`terraform-specialist`](../skills/terraform-specialist/): Infrastructure as Code mastery.
- [`deployment-procedures`](../skills/deployment-procedures/): Safe rollout strategies.

### 🧱 The "DDD & Evented Architecture" Pack (`ddd-architecture`)

- [`domain-driven-design`](../skills/domain-driven-design/): Route DDD work from strategic modeling to implementation patterns.
- [`ddd-strategic-design`](../skills/ddd-strategic-design/): Subdomains, bounded contexts, and ubiquitous language.
- [`ddd-context-mapping`](../skills/ddd-context-mapping/): Cross-context integration and anti-corruption boundaries.
- [`ddd-tactical-patterns`](../skills/ddd-tactical-patterns/): Aggregates, value objects, repositories, and domain events.
- [`cqrs-implementation`](../skills/cqrs-implementation/): Read/write model separation.
- [`event-store-design`](../skills/event-store-design/): Event persistence and replay architecture.
- [`saga-orchestration`](../skills/saga-orchestration/): Cross-context long-running transaction coordination.
- [`projection-patterns`](../skills/projection-patterns/): Materialized read models from event streams.

---

## 🧰 Maintainer & OSS

### 🛠️ The "OSS Maintainer" Pack (`oss-maintainer`)

- [`commit`](../skills/commit/): High-quality conventional commits.
- [`create-pr`](../skills/create-pr/): PR creation with review-ready context.
- [`requesting-code-review`](../skills/requesting-code-review/): Ask for targeted, high-signal reviews.
- [`receiving-code-review`](../skills/receiving-code-review/): Apply feedback with technical rigor.
- [`changelog-automation`](../skills/changelog-automation/): Keep release notes and changelogs consistent.
- [`git-advanced-workflows`](../skills/git-advanced-workflows/): Rebase, cherry-pick, bisect, recovery.

### 🧱 The "Skill Author" Pack (`skill-author`)

- [`skill-creator`](../skills/skill-creator/): Design effective new skills.
- [`skill-developer`](../skills/skill-developer/): Implement triggers, hooks, and skill lifecycle.
- [`writing-skills`](../skills/writing-skills/): Improve clarity and structure of skill instructions.
- [`lint-and-validate`](../skills/lint-and-validate/): Validate quality after edits.
- [`verification-before-completion`](../skills/verification-before-completion/): Confirm changes before claiming done.

---

## 📖 Related Documentation

- [Getting Started Guide](GETTING_STARTED.md)
- [REI Reverse Engineering Integration](REI_REA_INTEGRATION.md)
- [Workflows Playbook](WORKFLOWS.md)
- [Full Skill Catalog](../CATALOG.md)
