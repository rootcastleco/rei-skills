# 🏰 Contributing to Rei Skills

**Welcome!** We're excited you want to contribute to the Rei Skills collection.

> **Maintained by:** [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş

---

## Quick Start

1. **Fork** the repository
2. **Create** your skill directory in `skills/your-skill-name/`
3. **Add** a `SKILL.md` file with proper frontmatter
4. **Validate** with `npm run validate`
5. **Submit** a Pull Request

---

## SKILL.md Format

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: "A clear, one-line description of what the skill does."
risk: safe | low | medium | high | unknown
source: rootcastle-rei
---

# Your Skill Name

## Purpose
Explain what this skill does and when to use it.

## How It Works
Step-by-step instructions...

## Examples
Concrete usage examples...

## When to Use
When should an AI agent invoke this skill?
```

### Frontmatter Fields

| Field         | Required | Description                                            |
| :------------ | :------- | :----------------------------------------------------- |
| `name`        | ✅       | Unique kebab-case identifier                           |
| `description` | ✅       | One-line description (max 200 chars)                   |
| `risk`        | ✅       | `safe`, `low`, `medium`, `high`, or `unknown`          |
| `source`      | ✅       | `rootcastle-rei` for new contributions                 |
| `category`    | Optional | E.g., `devops`, `security`, `frontend`                 |
| `displayName` | Optional | Human-readable name (e.g., "Docker Expert")            |

---

## Quality Guidelines

### ✅ Do

- Write clear, actionable instructions
- Include practical examples
- Specify when the skill should (and shouldn't) be used
- Follow OWASP guidelines for security-related skills
- Add `⚠️ AUTHORIZED USE ONLY` to offensive/pentest skills
- Keep content focused and under 500 lines

### ❌ Don't

- Include hardcoded API keys, tokens, or passwords
- Add dangerous shell commands without warnings
- Create duplicate skills (check existing ones first)
- Use overly generic descriptions
- Skip the frontmatter

---

## Validation

Before submitting, run:

```bash
# Validate all skills
npm run validate

# Full build pipeline
npm run build

# Security audit
npm run security-audit

# Brand check (if adding new skills)
npm run brand
```

---

## Directory Structure

```
skills/
└── your-skill-name/
    ├── SKILL.md          # Required: Main skill file
    ├── checklists.md     # Optional: Reference checklists
    ├── scripts/          # Optional: Helper scripts
    └── examples/         # Optional: Example files
```

---

## Pull Request Process

1. Ensure your skill passes `npm run validate`
2. One skill per PR (unless they're closely related)
3. Include a brief description of what the skill does
4. Maintainers will review within 48 hours

---

## Reporting Issues

- **Bugs:** Use the [Bug Report](https://github.com/rootcastleco/rei-skills/issues/new?template=bug-report.yml) template
- **New Ideas:** Use the [Feature Request](https://github.com/rootcastleco/rei-skills/issues/new?template=feature-request.yml) template
- **Security:** Email `admin@rootcastle.com` (see [SECURITY.md](SECURITY.md))

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
