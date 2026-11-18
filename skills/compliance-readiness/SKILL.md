---
name: "compliance-readiness"
description: "Use for /compliance-os:compliance-readiness, or before adding a framework or planning the annual audit calendar"
risk: "safe"
source: "alirezarezvani/claude-skills@f8593c4941210a621a6629ce1da9e07897976d5f"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/alirezarezvani/claude-skills/blob/f8593c4941210a621a6629ce1da9e07897976d5f/compliance-os/skills/compliance-readiness/SKILL.md

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

# /compliance-os:compliance-readiness — Compliance Officer Forcing Questions

**Command:** `/compliance-os:compliance-readiness <program>`

The multi-framework compliance officer pressure-tests any compliance program. Six questions before any new-framework commitment, audit cycle planning, or certification readiness sign-off.

## When to Run

- Before adopting a new compliance framework
- Before annual audit calendar finalization
- Before certification stage 1 readiness sign-off
- Before management review (Clause 9.3 across frameworks)
- When evidence-collection effort has grown 50%+ year-over-year (a smell)
- When an audit produced > 15% critical findings

## The Six Compliance Officer Questions

### 1. Have you named every applicable framework?
**No framework selector run, no defensible scope.**
- Run `framework_selector.py` with company profile
- Forgetting a framework means rebuilding the audit program later
- Pay attention to industry-specific overlays (financial: NYDFS, FINMA; healthcare: HIPAA, ISO 13485; AI: ISO 42001 + EU AI Act)

### 2. Where do the frameworks overlap, and what's the reuse leverage?
**Single evidence -> N controls = the cornerstone of multi-framework efficiency.**
- Run `cross_framework_mapper.py` with enabled frameworks
- HIGH-confidence mappings: same evidence; MEDIUM: existing + overlay; LOW: new artefact
- Without overlap analysis, you'll collect the same access-review records 3 times

### 3. Who owns each artefact, and what's the reuse-leverage score?
**Joint ownership without accountability is the most common cause of stale evidence.**
- Run `evidence_pool_generator.py` for the artefact inventory
- HIGH-leverage artefacts (≥ 5 mappings) get built first
- Each artefact needs one accountable owner
- Stale evidence is an effective gap — even if the artefact existed historically

### 4. What's the audit calendar, and is auditor independence respected?
**Surveillance audits stacking in the same week is a smell.**
- Use per-framework audit-plan tools (aims_audit_scheduler, isms_audit_scheduler, audit_schedule_optimizer)
- Auditor cannot audit their own work (Clause 9.2 across all ISO standards)
- For small teams: rotate auditors + occasional external auditor

### 5. What does a mock audit produce, and is the severity distribution healthy?
**No mock audit, no readiness signal.**
- Run `audit_simulator.py` with framework + scope
- Healthy distribution: ≥ 40% observation, ≤ 15% critical
- All-critical findings = destructive audit OR genuinely failing program
- All-observation findings = audit too superficial

### 6. What's the management review cadence across frameworks?
**Each framework wants its own management review; an integrated review (per Annex SL) saves 5x exec time.**
- Schedule one quarterly cross-framework review covering all enabled frameworks' Clause 9.3 inputs
- Inputs: risk register changes, open nonconformities, audit findings, incidents, drift, KPIs
- Outputs: action items, resource decisions, scope adjustments

## Workflow

```bash
# 1. Framework selection
python ../../skills/compliance-os/scripts/framework_selector.py profile.json

# 2. Cross-framework overlap
python ../../skills/compliance-os/scripts/cross_framework_mapper.py program.json

# 3. Evidence pool consolidation
python ../../skills/compliance-os/scripts/evidence_pool_generator.py program.json

# 4. Mock audit (per framework)
python ../../skills/compliance-os/scripts/audit_simulator.py scope.json
```

## Output Format

```markdown
# Compliance Readiness: <program>
**Date:** YYYY-MM-DD

## The Decision Being Made
[framework-set | audit-calendar | certification-readiness | evidence-consolidation]

## Framework Set
- Applicable: <list>
- Binding (regulations): <count>
- Certifiable: <count>
- Missing dependencies: <list>

## Cross-Framework Overlap
- Total merged controls in scope: N
- High-leverage artefacts (≥ 5 mappings): M
- Top reuse opportunities: <top 5 artefacts>

## Evidence Pool
- Artefacts in catalog: N
- High-leverage count: M
- Stale evidence rate: X%
- Unowned artefacts: K

## Audit Calendar
- Frameworks scheduled this year: <list>
- Auditor independence respected: Y/N
- Conflicts: <list>

## Mock Audit Results (per framework)
- <framework>: total findings N, critical X%, observation Y%, healthy distribution: Y/N

## Verdict
🟢 READY | 🟡 STAGE-2-CANDIDATE | 🔴 NOT-READY

## Top 3 Actions
[3 concrete next steps with owners + dates]
```

## Routing

- `/compliance-os:aims-audit` — for ISO 42001-specific forcing questions
- `/compliance-os:ai-act-readiness` — for EU AI Act-specific forcing questions
- `/c-level-agents:ciso-review` — for cybersecurity strategy
- `/c-level-agents:caio-review` — for executive AI strategy
- `/c-level-agents:gc-review` — for novel-case legal review
- `/c-level-agents:decide` — to log the verdict
- `/c-level-agents:freeze 30` — on certification commitments (multi-year financial impact)

## Related

- Agent: [`cs-compliance-officer`](https://github.com/alirezarezvani/claude-skills/blob/f8593c4941210a621a6629ce1da9e07897976d5f/compliance-os/agents/cs-compliance-officer.md)
- Skill: [`compliance-os`](https://github.com/alirezarezvani/claude-skills/blob/f8593c4941210a621a6629ce1da9e07897976d5f/compliance-os/skills/compliance-os/SKILL.md)
- Adjacent: `${CLAUDE_PLUGIN_ROOT}/vendor/ra-qm-team/iso42001-specialist/`, `${CLAUDE_PLUGIN_ROOT}/vendor/ra-qm-team/eu-ai-act-specialist/`, `${CLAUDE_PLUGIN_ROOT}/vendor/ra-qm-team/information-security-manager-iso27001/`, `${CLAUDE_PLUGIN_ROOT}/vendor/ra-qm-team/soc2-compliance/`, `${CLAUDE_PLUGIN_ROOT}/vendor/ra-qm-team/gdpr-dsgvo-expert/`

---

**Version:** 1.0.0
