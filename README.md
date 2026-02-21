# 🏰 Rei Skills — 883+ Universal Agentic Skills

> **The Ultimate Collection of 883+ Universal Agentic Skills for AI Coding Assistants — Curated by Rootcastle Engineering & Innovation (REI) | Batuhan Ayrıbaş**

[![Rootcastle](https://img.shields.io/badge/Rootcastle-Engineering-blue?style=for-the-badge)](https://www.rootcastle.com)
[![npm](https://img.shields.io/badge/npm-rei--skills-red?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/rei-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Skills](https://img.shields.io/badge/Skills-883+-green?style=for-the-badge)]()

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Anthropic-purple)](https://claude.ai)
[![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-Google-blue)](https://github.com/google-gemini/gemini-cli)
[![Codex CLI](https://img.shields.io/badge/Codex%20CLI-OpenAI-green)](https://github.com/openai/codex)
[![Cursor](https://img.shields.io/badge/Cursor-AI%20IDE-orange)](https://cursor.sh)
[![Copilot](https://img.shields.io/badge/GitHub%20Copilot-VSCode-lightblue)](https://github.com/features/copilot)
[![Antigravity](https://img.shields.io/badge/Antigravity-DeepMind-red)](https://github.com/rootcastle/rei-skills)

---

## 🏰 About Rootcastle Engineering & Innovation

**Rootcastle** is an international technology company that unifies engineering disciplines under a single architecture. With our software and R&D center in **Estonia** integrated with manufacturing, hardware development, and engineering capabilities in **Turkey**, we develop reliable, flexible, and scalable technologies.

Our expertise spans **software development**, **PCB & hardware design**, **embedded systems**, **IoT & GPS telematics**, **data security**, **3D manufacturing**, **rapid prototyping**, and **e-commerce integrations**. This infrastructure serves industries from logistics and manufacturing to public services, security, fleet management, and critical monitoring operations.

Under brands like **jTrack** and **NetFleet**, we support container security solutions (HSCTS), fleet telemetry devices, OBD-II product families, solar asset tracking systems, and mobile monitoring units. Through our technology partners in the **UK** and **US**, our platforms deliver cloud architectures, mobile applications, and modern API integrations.

> **🌍 5 International Partnerships | 150+ Global Projects**  
> **🔗 Website:** [www.rootcastle.com](https://www.rootcastle.com)  
> **📧 Contact:** admin@rootcastle.com  
> **📱 Phone:** +90 507 545 29 39

---

## Table of Contents

- [⚡ Quick Start](#quick-start)
- [📖 Complete Usage Guide](docs/USAGE.md)
- [🔌 Compatibility & Invocation](#compatibility--invocation)
- [🛠️ Installation](#installation)
- [🧯 Troubleshooting](#troubleshooting)
- [🎁 Curated Collections (Bundles)](#curated-collections)
- [🧭 Workflows](#workflows)
- [📦 Features & Categories](#features--categories)
- [📚 Browse 883+ Skills](#browse-883-skills)
- [🔒 Security](#security)
- [🤝 How to Contribute](#how-to-contribute)
- [👥 Credits & Sources](#credits--sources)
- [⚖️ License](#license)

---

## Quick Start

Install once, use everywhere. Get 883+ skills in your AI coding assistant in under a minute.

### 1. Install

```bash
# Default: ~/.gemini/rei/skills (Global)
npx rei-skills

# Or choose your platform:
npx rei-skills --claude       # Claude Code
npx rei-skills --gemini       # Gemini CLI
npx rei-skills --cursor       # Cursor IDE
npx rei-skills --codex        # Codex CLI
npx rei-skills --antigravity  # Antigravity IDE
```

### 2. Verify

```bash
test -d ~/.gemini/rei/skills && echo "✅ Rei Skills installed successfully"
```

### 3. Use Your First Skill

> "Use **@brainstorming** to plan a SaaS MVP."

### 4. Pick a Bundle

- **Web Dev?** → Start with `Web Wizard`
- **Security?** → Start with `Security Engineer`  
- **General?** → Start with `Essentials`

👉 **[Complete Usage Guide](docs/USAGE.md)** — Start here after installation  
👉 **[Bundles Guide](docs/BUNDLES.md)** — Curated skill packs by role

---

## Compatibility & Invocation

Rei Skills follow the universal **SKILL.md** format and work with any AI coding assistant that supports agentic skills.

| Tool            | Type | Invocation Example                | Path              |
| :-------------- | :--- | :-------------------------------- | :---------------- |
| **Claude Code** | CLI  | `>> /skill-name help me...`       | `.claude/skills/` |
| **Gemini CLI**  | CLI  | `(User Prompt) Use skill-name...` | `.gemini/skills/` |
| **Codex CLI**   | CLI  | `(User Prompt) Use skill-name...` | `.codex/skills/`  |
| **Antigravity** | IDE  | `(Agent Mode) Use skill...`       | Global: `~/.gemini/rei/skills/` · Workspace: `.agent/skills/` |
| **Cursor**      | IDE  | `@skill-name (in Chat)`           | `.cursor/skills/` |
| **Copilot**     | Ext  | `(Paste content manually)`        | N/A               |
| **OpenCode**    | CLI  | `opencode run @skill-name`        | `.agents/skills/`  |
| **AdaL CLI**    | CLI  | `(Auto) Skills load on-demand`    | `.adal/skills/`   |

> [!TIP]
> **Default installer path**: `~/.gemini/rei/skills` (Global). Use `--path ~/.agent/skills` for workspace-specific install.

> [!WARNING]
> **Windows Users**: This repository uses **symlinks** for official skills. Enable Developer Mode or run Git as Administrator. See [Troubleshooting](#troubleshooting).

---

## Installation

### Option A: npx (Recommended)

```bash
# Default: ~/.gemini/rei/skills (Global)
npx rei-skills

# Claude Code
npx rei-skills --claude

# Gemini CLI
npx rei-skills --gemini

# Codex CLI
npx rei-skills --codex

# Cursor
npx rei-skills --cursor

# Antigravity IDE
npx rei-skills --antigravity

# OpenCode
npx rei-skills --path .agents/skills

# Custom path
npx rei-skills --path ./my-skills
```

Run `npx rei-skills --help` for all options.

### Option B: Git Clone

```bash
# Global (matches npx default)
git clone https://github.com/rootcastle/rei-skills.git ~/.gemini/rei/skills

# Workspace-specific
git clone https://github.com/rootcastle/rei-skills.git .agent/skills

# Claude Code
git clone https://github.com/rootcastle/rei-skills.git .claude/skills

# Gemini CLI
git clone https://github.com/rootcastle/rei-skills.git .gemini/skills

# Cursor
git clone https://github.com/rootcastle/rei-skills.git .cursor/skills
```

---

## Troubleshooting

### `npx rei-skills` returns 404

Use the GitHub package fallback:

```bash
npx github:rootcastle/rei-skills
```

### Windows clone issues (symlinks)

```bash
git clone -c core.symlinks=true https://github.com/rootcastle/rei-skills.git .agent/skills
```

### Skills installed but not detected

Install to the tool-specific path using the installer flags: `--claude`, `--gemini`, `--codex`, `--cursor`, `--antigravity`, or `--path <dir>`.

### Update an existing installation

```bash
git -C ~/.gemini/rei/skills pull
```

### Reinstall from scratch

```bash
rm -rf ~/.gemini/rei/skills
npx rei-skills
```

---

## Curated Collections

**Bundles** are curated groups of skills for specific roles (e.g., `Web Wizard`, `Security Engineer`, `OSS Maintainer`).

> **Bundles are NOT separate installations.** You already have all skills after one install. Bundles are simply recommended lists to help you focus.

### How to use bundles:

1. **Install the repository once** (all 883+ skills included)
2. **Browse bundles** in [docs/BUNDLES.md](docs/BUNDLES.md)
3. **Pick 3-5 skills** from a bundle to start
4. **Reference them** in your conversations: `"Use @brainstorming..."`

### Examples:

- **Building a SaaS MVP:** `Essentials` + `Full-Stack Developer` + `QA & Testing`
- **Hardening production:** `Security Developer` + `DevOps & Cloud` + `Observability`
- **Shipping OSS changes:** `Essentials` + `OSS Maintainer`

---

## Workflows

Bundles help you choose skills. Workflows help you execute them in order.

- [docs/WORKFLOWS.md](docs/WORKFLOWS.md) — Human-readable playbooks
- [data/workflows.json](data/workflows.json) — Machine-readable workflow metadata

**Available Workflows:**

- 🚀 Ship a SaaS MVP
- 🔒 Security Audit for a Web App
- 🤖 Build an AI Agent System
- 🧪 QA and Browser Automation

---

## Features & Categories

| Category       | Focus                                              | Example Skills                                                     |
| :------------- | :------------------------------------------------- | :----------------------------------------------------------------- |
| Architecture   | System design, ADRs, C4, scalable patterns         | `architecture`, `c4-context`, `senior-architect`                   |
| Business       | Growth, pricing, CRO, SEO, go-to-market            | `copywriting`, `pricing-strategy`, `seo-audit`                     |
| Data & AI      | LLM apps, RAG, agents, observability               | `rag-engineer`, `prompt-engineer`, `langgraph`                     |
| Development    | Languages, frameworks, code quality                | `typescript-expert`, `python-patterns`, `react-patterns`           |
| General        | Planning, docs, product ops, writing               | `brainstorming`, `doc-coauthoring`, `writing-plans`                |
| Infrastructure | DevOps, cloud, serverless, CI/CD                   | `docker-expert`, `aws-serverless`, `vercel-deployment`             |
| Security       | AppSec, pentesting, vuln analysis, compliance      | `api-security-best-practices`, `vulnerability-scanner`             |
| Testing        | TDD, test design, QA workflows                     | `test-driven-development`, `testing-patterns`, `test-fixing`       |
| Workflow       | Automation, orchestration, agents                  | `workflow-automation`, `inngest`, `trigger-dev`                    |

---

## Browse 883+ Skills

👉 **[View the Complete Skill Catalog (CATALOG.md)](CATALOG.md)**

---

## Security

All skills are audited for security vulnerabilities, hardcoded credentials, and dangerous commands.

- [Security Policy](SECURITY.md)
- [Security Guardrails](docs/SECURITY_GUARDRAILS.md)
- [Community Guidelines](docs/COMMUNITY_GUIDELINES.md)

Offensive security skills (penetration testing, red teaming) are included for **authorized educational and professional use only**.

---

## How to Contribute

1. **Fork** the repository
2. **Create a new directory** inside `skills/` for your skill
3. **Add a `SKILL.md`** with the required frontmatter (`name`, `description`, `risk`, `source`). See [docs/SKILL_ANATOMY.md](docs/SKILL_ANATOMY.md) and [docs/QUALITY_BAR.md](docs/QUALITY_BAR.md).
4. **Run validation**: `npm run validate`
5. **Submit a Pull Request**

---

## Credits & Sources

This collection stands on the shoulders of the open-source community. Full attribution is preserved in **[CREDITS.md](CREDITS.md)**.

Key sources include:

- **[anthropics/skills](https://github.com/anthropics/skills)** — Official Anthropic skills
- **[microsoft/skills](https://github.com/microsoft/skills)** — Official Microsoft skills
- **[openai/skills](https://github.com/openai/skills)** — Official OpenAI Codex skills
- **[google-gemini/gemini-skills](https://github.com/google-gemini/gemini-skills)** — Official Gemini skills
- **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** — Vercel Labs skills
- **[supabase/agent-skills](https://github.com/supabase/agent-skills)** — Supabase skills
- **The Open Source Community** — 300+ community contributors

---

## Author

**Batuhan Ayrıbaş**  
Founder & Lead Engineer — Rootcastle Engineering & Innovation (REI)

- 🌐 [www.rootcastle.com](https://www.rootcastle.com)
- 📧 admin@rootcastle.com
- 📱 +90 507 545 29 39

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**🏰 Rei Skills — Engineering Beyond Boundaries**

*Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | © REI 2025. All rights reserved.*

</div>
