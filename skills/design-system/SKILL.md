---
name: "design-system"
description: "Generate a design system from an existing codebase or audit one for visual consistency: extract tokens (colors, typography, spacing, shadows) into design-tokens.json and CSS custom properties with DESIGN.md rationale and an interactive HTML preview, score the UI across 10 dimensions, and flag AI-slop patterns. Use when starting a design system, aud"
risk: "safe"
source: "affaan-m/ECC@3f14a103a8694e51c1df9a806217a6d0b5f7a6f7"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/affaan-m/ECC/blob/3f14a103a8694e51c1df9a806217a6d0b5f7a6f7/skills/design-system/SKILL.md

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

# Design System — Generate & Audit Visual Systems

## When to Use

- Starting a new project that needs a design system
- Auditing an existing codebase for visual consistency
- Before a redesign — understand what you have
- When the UI looks "off" but you can't pinpoint why
- Reviewing PRs that touch styling

## How It Works

### Mode 1: Generate Design System

Analyzes your codebase and generates a cohesive design system:

```
1. Scan CSS/Tailwind/styled-components for existing patterns
2. Extract: colors, typography, spacing, border-radius, shadows, breakpoints
3. Research 3 competitor sites for inspiration (via browser MCP)
4. Propose a design token set (JSON + CSS custom properties)
5. Generate DESIGN.md with rationale for each decision
6. Create an interactive HTML preview page (self-contained, no deps)
```

Output: `DESIGN.md` + `design-tokens.json` + `design-preview.html`

### Mode 2: Visual Audit

Scores your UI across 10 dimensions (0-10 each):

```
1. Color consistency — are you using your palette or random hex values?
2. Typography hierarchy — clear h1 > h2 > h3 > body > caption?
3. Spacing rhythm — consistent scale (4px/8px/16px) or arbitrary?
4. Component consistency — do similar elements look similar?
5. Responsive behavior — fluid or broken at breakpoints?
6. Dark mode — complete or half-done?
7. Animation — purposeful or gratuitous?
8. Accessibility — contrast ratios, focus states, touch targets
9. Information density — cluttered or clean?
10. Polish — hover states, transitions, loading states, empty states
```

Each dimension gets a score, specific examples, and a fix with exact file:line.

### Mode 3: AI Slop Detection

Identifies generic AI-generated design patterns:

```
- Gratuitous gradients on everything
- Purple-to-blue defaults
- "Glass morphism" cards with no purpose
- Rounded corners on things that shouldn't be rounded
- Excessive animations on scroll
- Generic hero with centered text over stock gradient
- Sans-serif font stack with no personality
```

## Examples

**Generate for a SaaS app:**
```
/design-system generate --style minimal --palette earth-tones
```

**Audit existing UI:**
```
/design-system audit --url http://localhost:3000 --pages / /pricing /docs
```

**Check for AI slop:**
```
/design-system slop-check
```
