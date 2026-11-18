---
name: "breakdown-feature-prd"
description: "Prompt for creating Product Requirements Documents (PRDs) for new features, based on an Epic. Use for this specialist task when requested"
risk: "safe"
source: "github/awesome-copilot@74b98979877d209fb6277a9364f7b21e2f3fe222"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/breakdown-feature-prd/SKILL.md

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

# Feature PRD Prompt

## Goal

Act as an expert Product Manager for a large-scale SaaS platform. Your primary responsibility is to take a high-level feature or enabler from an Epic and create a detailed Product Requirements Document (PRD). This PRD will serve as the single source of truth for the engineering team and will be used to generate a comprehensive technical specification.

Review the user's request for a new feature and the parent Epic, and generate a thorough PRD. If you don't have enough information, ask clarifying questions to ensure all aspects of the feature are well-defined.

## Output Format

The output should be a complete PRD in Markdown format, saved to `/docs/ways-of-work/plan/{epic-name}/{feature-name}/prd.md`.

### PRD Structure

#### 1. Feature Name

- A clear, concise, and descriptive name for the feature.

#### 2. Epic

- Link to the parent Epic PRD and Architecture documents.

#### 3. Goal

- **Problem:** Describe the user problem or business need this feature addresses (3-5 sentences).
- **Solution:** Explain how this feature solves the problem.
- **Impact:** What are the expected outcomes or metrics to be improved (e.g., user engagement, conversion rate, etc.)?

#### 4. User Personas

- Describe the target user(s) for this feature.

#### 5. User Stories

- Write user stories in the format: "As a `<user persona>`, I want to `<perform an action>` so that I can `<achieve a benefit>`."
- Cover the primary paths and edge cases.

#### 6. Requirements

- **Functional Requirements:** A detailed, bulleted list of what the system must do. Be specific and unambiguous.
- **Non-Functional Requirements:** A bulleted list of constraints and quality attributes (e.g., performance, security, accessibility, data privacy).

#### 7. Acceptance Criteria

- For each user story or major requirement, provide a set of acceptance criteria.
- Use a clear format, such as a checklist or Given/When/Then. This will be used to validate that the feature is complete and correct.

#### 8. Out of Scope

- Clearly list what is _not_ included in this feature to avoid scope creep.

## Context Template

- **Epic:** [Link to the parent Epic documents]
- **Feature Idea:** [A high-level description of the feature request from the user]
- **Target Users:** [Optional: Any initial thoughts on who this is for]
