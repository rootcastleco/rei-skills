# 🔒 Security Policy — REI Skills

**Maintainer:** [Rootcastle Engineering & Innovation](https://rootcastle.com/)  
**Security Contact:** `admin@rootcastle.com`  
**Threat Model:** [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md)  
**Security Guardrails:** [`docs/SECURITY_GUARDRAILS.md`](docs/SECURITY_GUARDRAILS.md)

---

## 1. Supported Versions

Security updates and guardrail audits are applied continuously to the `main` branch and published releases (`>= 6.1.0`).

| Version | Supported |
| :--- | :---: |
| `6.1.x` | ✅ |
| `< 6.1.0` | ❌ (Upgrade to `>= 6.1.0` for safe `.git` installer checks and 100% validated frontmatter) |

---

## 2. Reporting a Vulnerability

**DO NOT open a public GitHub issue for security vulnerabilities.**

If you discover a vulnerability in:
- The CLI installer (`bin/install.js`) or build scripts (`scripts/`),
- A skill (`skills/*/SKILL.md`) containing malicious instructions, prompt injection, or unguarded destructive commands, or
- The REI REA synchronization pipeline (`scripts/sync_rei_rea.py`),

please report it privately:
1. **Email:** `admin@rootcastle.com` with reproduction steps and affected file paths.
2. **GitHub Private Security Advisory:** Open a draft advisory under the repository's **Security** tab.
3. **Response SLA:** We acknowledge reports within **48 hours** and coordinate remediation before public disclosure.

---

## 3. Enforced Security Controls

Every commit and Pull Request in this repository is gated by automated security controls:
- **Zero Hardcoded Secrets & Guardrail Enforcement (`node scripts/security_audit.js`):** Verifies all 895 skills have classified risk levels (`0` unclassified), `0` critical/high unguarded patterns, and mandatory `AUTHORIZED USE ONLY` disclaimers on offensive security skills.
- **Non-Destructive Installer (`bin/install.js`):** Verifies `.git` remote ownership before migrating legacy skill directories, creates timestamped backups before modifying user directories or MCP JSON configs, and refuses to overwrite unrelated Git repositories.
- **Static-First Reverse Engineering Boundary (`rei-rea`):** The 12 REI Reverse Engineering skills inspect binary headers, sections, imports/exports, and entropy statically without executing untrusted sample code.
