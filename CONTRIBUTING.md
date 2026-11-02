# 🏰 Contributing to REI Skills

Thank you for contributing to **REI Skills** — the engineering-grade skill layer for AI agents, maintained by **[Rootcastle Engineering & Innovation](https://rootcastle.com/)**.

---

## 1. Quick Contribution Workflow

1. **Fork & Branch:** Fork `rootcastleco/rei-skills` and create a feature branch (`feat/skill-<name>` or `fix/<issue>`).
2. **Author or Update Skill:** Create `skills/<your-skill-name>/SKILL.md` following the schema below.
3. **Run Local Validation & Build:**
   ```bash
   # Rebuild catalog, index, README, and static doc site
   npm run build

   # Run strict Python & Node validators (must exit 0)
   npm run validate:strict
   node scripts/validate-skills.js

   # Run security audit & reference checks (must exit 0)
   npm run security-audit
   python scripts/validate_references.py

   # Run test suite
   npm test
   ```
4. **Submit Pull Request:** Open a PR against `main` using the repository Pull Request template.

---

## 2. `SKILL.md` Specification & Quality Bar

Every skill directory (`skills/<skill-id>/SKILL.md`) must begin with valid YAML frontmatter:

```markdown
---
name: your-skill-name
description: "Concise one-line description of what the skill does and when to trigger it (max 200 chars)."
risk: safe
source: rootcastle-rei
---

# Your Skill Title

## Overview
Explain the engineering problem this skill solves.

## When to Use
- Bullet points describing exact user intents or scenarios that should trigger this skill.

## Workflow / Instructions
Step-by-step actionable instructions for the AI agent.

## Examples
Copy-pasteable prompt or code examples.

## Limitations
Explicit boundaries or prerequisites.
```

### Frontmatter Field Reference

| Field | Required | Allowed Values / Rules |
| :--- | :---: | :--- |
| `name` | ✅ | Lowercase kebab-case matching the directory name (`^[a-z0-9-]+$`). |
| `description` | ✅ | Clear single-line string (`<= 200` characters). Avoid unquoted colons. |
| `risk` | ✅ | `none` (read-only reasoning), `safe` (local workspace inspection/code), `critical` (stateful ops), `offensive` (authorized pentesting — requires `⚠️ AUTHORIZED USE ONLY` banner). |
| `source` | ✅ | `rootcastle-rei` for original Rootcastle skills, upstream repository URL for adapted/mirrored skills, or `community`. |

---

## 3. Provenance & Third-Party Attribution Rules

- **Preserve Upstream Attribution:** Never strip third-party copyright notices, licenses, or `source:` URLs when updating adapted or mirrored skills.
- **REI Reverse Engineering (`rei-*`) Skills:** The 12 `rei-*` skills are synchronized from [`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) via `python scripts/sync_rei_rea.py --sync` and verified in CI via `python scripts/sync_rei_rea.py --check`.

---

## 4. Reporting Issues & Security

- **Bug Reports:** [Bug Report Template](https://github.com/rootcastleco/rei-skills/issues/new?template=bug-report.yml)
- **New Skill Proposals:** [New Skill Template](https://github.com/rootcastleco/rei-skills/issues/new?template=new-skill.yml)
- **Documentation Improvements:** [Docs Improvement Template](https://github.com/rootcastleco/rei-skills/issues/new?template=docs-improvement.yml)
- **Security Vulnerabilities:** Email `admin@rootcastle.com` privately (see [SECURITY.md](SECURITY.md)).
