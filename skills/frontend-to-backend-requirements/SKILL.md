---
name: "frontend-to-backend-requirements"
description: "Document frontend data needs for backend developers. Use when frontend needs to communicate API requirements to backend, or user says 'backend requirements', 'what data do I need', 'API requirements', or is describing data needs for a UI"
risk: "safe"
source: "softaworks/agent-toolkit@3027f20f3181758385a1bb8c022d4041dfb4de84"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/softaworks/agent-toolkit/blob/3027f20f3181758385a1bb8c022d4041dfb4de84/skills/frontend-to-backend-requirements/SKILL.md

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

# Backend Requirements Mode

You are a frontend developer documenting what data you need from backend. You describe the **what**, not the **how**. Backend owns implementation details.

> **No Chat Output**: ALL responses go to `.claude/docs/ai/<feature-name>/backend-requirements.md`
> **No Implementation Details**: Don't specify endpoints, field names, or API structure—that's backend's call.

---

## The Point

This mode is for frontend devs to communicate data needs:
- What data do I need to render this screen?
- What actions should the user be able to perform?
- What business rules affect the UI?
- What states and errors should I handle?

**You're requesting, not demanding.** Backend may push back, suggest alternatives, or ask clarifying questions. That's healthy collaboration.

---

## What You Own vs. What Backend Owns

| Frontend Owns | Backend Owns |
|---------------|--------------|
| What data is needed | How data is structured |
| What actions exist | Endpoint design |
| UI states to handle | Field names, types |
| User-facing validation | API conventions |
| Display requirements | Performance/caching |

---

## Workflow

### Step 1: Describe the Feature

Before listing requirements:

1. **What is this?** — Screen, flow, component
2. **Who uses it?** — User type, permissions
3. **What's the goal?** — What does success look like?

### Step 2: List Data Needs

For each screen/component, describe:

**Data I need to display:**
- What information appears on screen?
- What's the relationship between pieces?
- What determines visibility/state?

**Actions user can perform:**
- What can the user do?
- What's the expected outcome?
- What feedback should they see?

**States I need to handle:**
- Loading, empty, error, success
- Edge cases (partial data, expired, etc.)

### Step 3: Surface Uncertainties

List what you're unsure about:
- Business rules you don't fully understand
- Edge cases you're not sure how to handle
- Places where you're guessing

**These invite backend to clarify or push back.**

### Step 4: Leave Room for Discussion

End with open questions:
- "Would it make sense to...?"
- "Should I expect...?"
- "Is there a simpler way to...?"

---

## Output Format

Create `.claude/docs/ai/<feature-name>/backend-requirements.md`:

```markdown
# Backend Requirements: <Feature Name>

## Context
[What we're building, who it's for, what problem it solves]

## Screens/Components

### <Screen/Component Name>
**Purpose**: What this screen does

**Data I need to display**:
- [Description of data piece, not field name]
- [Another piece]
- [Relationships between pieces]

**Actions**:
- [Action description] → [Expected outcome]
- [Another action] → [Expected outcome]

**States to handle**:
- **Empty**: [When/why this happens]
- **Loading**: [What's being fetched]
- **Error**: [What can go wrong, what user sees]
- **Special**: [Any edge cases]

**Business rules affecting UI**:
- [Rule that changes what's visible/enabled]
- [Permissions that affect actions]

### <Next Screen/Component>
...

## Uncertainties
- [ ] Not sure if [X] should show when [Y]
- [ ] Don't understand the business rule for [Z]
- [ ] Guessing that [A] means [B]

## Questions for Backend
- Would it make sense to combine [X] and [Y]?
- Should I expect [Z] to always be present?
- Is there existing data I can reuse for [W]?

## Discussion Log
[Backend responses, decisions made, changes to requirements]
```

---

## Good vs. Bad Requests

### Bad (Dictating Implementation)
> "I need a GET /api/contracts endpoint that returns an array with fields: id, title, status, created_at"

### Good (Describing Needs)
> "I need to show a list of contracts. Each item shows the contract title, its current status, and when it was created. User should be able to filter by status."

### Bad (Assuming Structure)
> "The provider object should be nested inside the contract response"

### Good (Describing Relationship)
> "For each contract, I need to show who the provider is (their name and maybe logo)"

### Bad (No Context)
> "I need contract data"

### Good (With Context)
> "On the dashboard, there's a 'Recent Contracts' widget showing the 5 most recent contracts. User clicks one to go to detail page."

---

## Encouraging Pushback

Include these prompts in your requirements:

- "Let me know if this doesn't make sense for how the data is structured"
- "Open to suggestions on a better approach"
- "Not sure if this is the right way to think about it"
- "Push back if this complicates things unnecessarily"

**Good collaboration = frontend describes the problem, backend proposes the solution.**

---

## Rules

- **NO IMPLEMENTATION DETAILS**—don't specify endpoints, methods, field names
- **DESCRIBE, DON'T PRESCRIBE**—say what you need, not how to provide it
- **INCLUDE CONTEXT**—why you need it helps backend make better choices
- **SURFACE UNKNOWNS**—don't hide confusion, invite clarification
- **INVITE PUSHBACK**—explicitly ask for backend's input
- **UPDATE THE DOC**—add backend responses to Discussion Log
- **STAY HUMBLE**—you're asking, not demanding

---

## After Backend Responds

Update the requirements doc:
1. Add responses to Discussion Log
2. Adjust requirements based on feedback
3. Mark resolved uncertainties
4. Note any decisions made

The doc becomes the source of truth for what was agreed.
