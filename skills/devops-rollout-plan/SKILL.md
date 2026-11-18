---
name: "devops-rollout-plan"
description: "Generate comprehensive rollout plans with preflight checks, step-by-step deployment, verification signals, rollback procedures, and communication plans for infrastructure and application changes. Use for this specialist task when requested"
risk: "safe"
source: "github/awesome-copilot@74b98979877d209fb6277a9364f7b21e2f3fe222"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/devops-rollout-plan/SKILL.md

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

# DevOps Rollout Plan Generator

Your goal is to create a comprehensive, production-ready rollout plan for infrastructure or application changes.

## Input Requirements

Gather these details before generating the plan:

### Change Description
- What's changing (infrastructure, application, configuration)
- Version or state transition (from/to)
- Problem solved or feature added

### Environment Details
- Target environment (dev, staging, production, all)
- Infrastructure type (Kubernetes, VMs, serverless, containers)
- Affected services and dependencies
- Current capacity and scale

### Constraints & Requirements
- Acceptable downtime window
- Change window restrictions
- Approval requirements
- Regulatory or compliance considerations

### Risk Assessment
- Blast radius of change
- Data migrations or schema changes
- Rollback complexity and safety
- Known risks

## Output Format

Generate a structured rollout plan with these sections:

### 1. Executive Summary
- What, why, when, duration
- Risk level and rollback time
- Affected systems and user impact
- Expected downtime

### 2. Prerequisites & Approvals
- Required approvals (technical lead, security, compliance, business)
- Required resources (capacity, backups, monitoring, rollback automation)
- Pre-deployment backups

### 3. Preflight Checks
- Infrastructure health validation
- Application health baseline
- Dependency availability
- Monitoring baseline metrics
- Go/no-go decision checklist

### 4. Step-by-Step Rollout Procedure
**Phases**: Pre-deployment, deployment, progressive verification
- Specific commands for each step
- Validation after each step
- Duration estimates

### 5. Verification Signals
**Immediate** (0-2 min): Deployment success, pods/containers started, health checks passing
**Short-term** (2-5 min): Application responding, error rates acceptable, latency normal
**Medium-term** (5-15 min): Sustained metrics, stable connections, integrations working
**Long-term** (15+ min): No degradation, capacity healthy, business metrics normal

### 6. Rollback Procedure
**Decision Criteria**: When to initiate rollback
**Rollback Steps**: Automated, infrastructure revert, or full restore
**Post-Rollback Verification**: Confirm system health restored
**Communication**: Stakeholder notification

### 7. Communication Plan
- Pre-deployment (T-24h): Schedule and impact notice
- Deployment start: Commencement notice
- Progress updates: Status every X minutes
- Completion: Success confirmation
- Rollback (if needed): Issue notification

**Stakeholder Matrix**: Who to notify, when, via what method, with what content

### 8. Post-Deployment Tasks
- Immediate (1h): Verify criteria met, review logs
- Short-term (24h): Monitor metrics, review errors
- Medium-term (1 week): Post-deployment review, lessons learned

### 9. Contingency Plans
Scenarios: Partial failure, performance degradation, data inconsistency, dependency failure
For each: Symptoms, response, timeline

### 10. Contact Information
- Primary and secondary on-call
- Escalation path
- Emergency contacts (infrastructure, security, database, networking)

## Plan Customization

Adapt based on:
- **Infrastructure Type**: Kubernetes, VMs, serverless, databases
- **Risk Level**: Low (simplified), medium (standard), high (additional gates)
- **Change Type**: Code deployment, infrastructure, configuration, data migration
- **Environment**: Production (full plan), staging (simplified), development (minimal)

## Remember

- Always have a tested rollback plan
- Communicate early and often
- Monitor metrics, not just logs
- Document everything
- Learn from each deployment
- Never deploy on Friday afternoon (unless critical)
- Never skip verification steps
- Never assume "it should work"
