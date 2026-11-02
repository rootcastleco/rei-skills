# 🛟 Support & Help Guide — REI Skills

Need help installing, configuring, or authoring skills with **REI Skills**? Here is where to look first and how to reach the maintainers.

---

## 1. Self-Service Diagnostics (`npx rei-skills doctor`)

Before opening an issue, run the built-in diagnostic and verification commands:

```bash
# Check installed skill directories, symlink materialization, and optional REI REA tools
npx rei-skills doctor

# Verify YAML frontmatter integrity across an installed directory
npx rei-skills verify --path .cursor/skills
```

---

## 2. Documentation Index

- **[Getting Started Guide](docs/GETTING_STARTED.md)** — 2-minute installation for Claude Code, Codex, Gemini CLI, Cursor, Antigravity, and OpenCode.
- **[Usage Guide](docs/USAGE.md)** — How to search, selectively install (`add`), and invoke skills.
- **[REI Reverse Engineering Integration](docs/REI_REA_INTEGRATION.md)** — Using the 12 `rei-*` specialist reverse-engineering skills and optional Python workbench.
- **[Client Integrations Matrix](docs/INTEGRATIONS.md)** — Directory conventions, strict frontmatter export, and MCP configuration.
- **[Frequently Asked Questions](docs/FAQ.md)** — Troubleshooting Windows symlinks, context limits, and tool paths.

---

## 3. Where to Ask Questions & Report Issues

| Topic | Channel |
| :--- | :--- |
| **Bug Reports (Broken Skill or CLI Issue)** | [GitHub Bug Report Template](https://github.com/rootcastleco/rei-skills/issues/new?template=bug-report.yml) |
| **New Skill Proposals** | [New Skill Proposal Template](https://github.com/rootcastleco/rei-skills/issues/new?template=new-skill.yml) |
| **Documentation Improvements** | [Documentation Issue Template](https://github.com/rootcastleco/rei-skills/issues/new?template=docs-improvement.yml) |
| **Reverse Engineering Workbench (`rei-rea`)** | [rootcastleco/Rei-Reverse-engineer Issues](https://github.com/rootcastleco/Rei-Reverse-engineer/issues) |
| **Security Vulnerabilities** | **Do not open a public issue.** Email `admin@rootcastle.com` (see [SECURITY.md](SECURITY.md)). |

---

> Maintained by **[Rootcastle Engineering & Innovation](https://rootcastle.com/)** — *Engineering Beyond Boundaries.*
