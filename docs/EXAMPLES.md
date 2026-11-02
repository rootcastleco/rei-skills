# 🧪 Real-World Engineering Examples ("The REI Cookbook")

Practical recipes combining **REI Skills** across software architecture, security auditing, and reverse engineering.

---

## 🥘 Recipe 1: Binary Release Triage & Version Diff (`rei-rea`)

_Scenario: You have two builds of a compiled module (`telemetry-filter-v1.wasm` and `telemetry-filter-v2.wasm`) and need to verify what changed structurally between releases with hash-backed evidence._

**Install the bundle:**
```bash
npx rei-skills add rei-rea --claude
```

**Skills Used:**
1. `@rei-casebook-forensics` — Initialize a forensic case and intake artifacts with SHA-256 provenance.
2. `@rei-wasm-and-managed` — Inspect WebAssembly imports, exports, and custom producer sections.
3. `@rei-reconstruction-parity` & `@rei-evidence-ledger` — Diff exports/sections and classify findings into `[EVIDENCE]`, `[INFERENCE]`, and `[UNKNOWN]`.

**Try the live reproducible demo locally:**
```bash
python examples/rei-rea-demo/run_demo.py
```

---

## 🥘 Recipe 2: Legacy API Security & Refactoring Audit

_Scenario: You inherited a production Node.js/TypeScript backend and need to audit its authentication and input validation before refactoring._

**Skills Used:**
1. `@concise-planning` — Map endpoints and refactoring milestones.
2. `@api-security-best-practices` — Audit authentication, rate limiting, and input validation.
3. `@lint-and-validate` — Enforce static analysis and type checks.

**Prompt Example:**
```text
Use @concise-planning and @api-security-best-practices to audit src/routes/auth.ts and produce a prioritized remediation plan.
```

---

## 🥘 Recipe 3: Production AI Agent with MCP Tools

_Scenario: You are building a domain-specific agent with custom MCP tools and deterministic evaluation gates._

**Skills Used:**
1. `@ai-agents-architect` — Define agent boundaries and fallback behavior.
2. `@mcp-builder` — Implement schema-validated MCP tools.
3. `@agent-evaluation` — Benchmark tool-calling reliability and failure modes.
