# 🏆 Quality Bar & Validation Standards

To ensure **REI Skills** remains a trusted, engineering-grade skill layer for AI agents, every skill in the catalog (`895` skills) is validated against strict structural, metadata, and safety gates.

---

## Automated Validation Gates

Every `SKILL.md` in the repository must pass **both** validators in CI:

1. `python scripts/validate_skills.py --strict --report data/quality-report.json`
2. `node scripts/validate-skills.js`
3. `node scripts/security_audit.js`

### 1. Metadata Integrity
- `name`: Kebab-case identifier matching the directory name (`^[a-z0-9-]+$`).
- `description`: Concise, single-line or clean YAML string (`<= 200` characters) stating what the skill does and when to trigger it.
- `risk`: Explicit risk profile (`none`, `safe`, `critical`, `offensive`, or `unknown`).
- `source`: Explicit provenance (`rootcastle-rei`, upstream GitHub repository URL, or `community`).

### 2. Actionable Triggers ("When to Use")
Every skill should define clear activation triggers (`## When to Use`, `## Overview`, or explicit trigger conditions) so agents do not misroute tasks.

### 3. Safety & Risk Classification
- 🟢 **`none`**: Pure reasoning, architecture, or documentation guidance.
- 🔵 **`safe`**: Local workspace inspection, linting, static analysis, and read-only triage.
- 🟠 **`critical`**: State-mutating operations (e.g., deployment, database migrations).
- 🔴 **`offensive`**: Authorized security testing, red-teaming, and exploitation playbooks. **Must** include the mandatory `AUTHORIZED USE ONLY` disclaimer.

### 4. Referential Integrity
All relative markdown links (`[label](path/to/file.md)`) inside every `SKILL.md` are verified at build time by `scripts/validate_skills.py` and `scripts/validate_references.py` to prevent agent file-not-found hallucinations.

---

## Running Validation Locally

```bash
# Strict Python schema + link validator + JSON quality report
python scripts/validate_skills.py --strict --report data/quality-report.json

# Node.js frontmatter validator
node scripts/validate-skills.js

# Security & offensive guardrail audit
node scripts/security_audit.js
```
