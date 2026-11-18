---
name: "automation-audit-ops"
description: "Evidence-first automation inventory and overlap audit workflow for ECC. Use when the user wants to know which jobs, hooks, connectors, MCP servers, or wrappers are live, broken, redundant, or missing before fixing anything"
risk: "safe"
source: "affaan-m/ECC@3f14a103a8694e51c1df9a806217a6d0b5f7a6f7"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/affaan-m/ECC/blob/3f14a103a8694e51c1df9a806217a6d0b5f7a6f7/skills/automation-audit-ops/SKILL.md

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

# Automation Audit Ops

Use this when the user asks what automations are live, which jobs are broken, where overlap exists, or what tooling and connectors are actually doing useful work right now.

This is an audit-first operator skill. The job is to produce an evidence-backed inventory and a keep / merge / cut / fix-next recommendation set before rewriting anything.

## Skill Stack

Pull these ECC-native skills into the workflow when relevant:

- `workspace-surface-audit` for connector, MCP, hook, and app inventory
- `knowledge-ops` when the audit needs to reconcile live repo truth with durable context
- `github-ops` when the answer depends on CI, scheduled workflows, issues, or PR automation
- `ecc-tools-cost-audit` when the real problem is webhook fanout, queued jobs, or billing burn in the sibling app repo
- `research-ops` when local inventory must be compared against current platform support or public docs
- `verification-loop` for proving post-fix state instead of relying on assumed recovery

## When to Use

- user asks "what automations do I have", "what is live", "what is broken", or "what overlaps"
- the task spans cron jobs, GitHub Actions, local hooks, MCP servers, connectors, wrappers, or app integrations
- the user wants to know what was ported from another agent system and what still needs to be rebuilt inside ECC
- the workspace has accumulated multiple ways to do the same thing and the user wants one canonical lane

## Guardrails

- start read-only unless the user explicitly asked for fixes
- separate:
  - configured
  - authenticated
  - recently verified
  - stale or broken
  - missing entirely
- do not claim a tool is live just because a skill or config references it
- do not merge or delete overlapping surfaces until the evidence table exists

## Workflow

### 1. Inventory the real surface

Read the current live surface before theorizing:

- repo hooks and local hook scripts
- GitHub Actions and scheduled workflows
- MCP configs and enabled servers
- connector- or app-backed integrations
- wrapper scripts and repo-specific automation entrypoints

Group them by surface:

- local runtime
- repo CI / automation
- connected external systems
- messaging / notifications
- billing / customer operations
- research / monitoring

### 2. Classify each item by live state

For every surfaced automation, mark:

- configured
- authenticated
- recently verified
- stale or broken
- missing

Then classify the problem type:

- active breakage
- auth outage
- stale status
- overlap or redundancy
- missing capability

### 3. Trace the proof path

Back every important claim with a concrete source:

- file path
- workflow run
- hook log
- config entry
- recent command output
- exact failure signature

If the current state is ambiguous, say so directly instead of pretending the audit is complete.

### 4. End with keep / merge / cut / fix-next

For each overlapping or suspect surface, return one call:

- keep
- merge
- cut
- fix next

The value is in collapsing noisy automation into one canonical ECC lane, not in preserving every historical path.

## Output Format

```text
CURRENT SURFACE
- automation
- source
- live state
- proof

FINDINGS
- active breakage
- overlap
- stale status
- missing capability

RECOMMENDATION
- keep
- merge
- cut
- fix next

NEXT ECC MOVE
- exact skill / hook / workflow / app lane to strengthen
```

## Pitfalls

- do not answer from memory when the live inventory can be read
- do not treat "present in config" as "working"
- do not fix lower-value redundancy before naming the broken high-signal path
- do not widen the task into a repo rewrite if the user asked for inventory first

## Verification

- important claims cite a live proof path
- each surfaced automation is labeled with a clear live-state category
- the final recommendation distinguishes keep / merge / cut / fix-next
