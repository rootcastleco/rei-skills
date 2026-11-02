# 🚀 Getting Started with REI Skills

**Equip your AI coding agent with engineering-grade skills in under 2 minutes.**

> Maintained by **[Rootcastle Engineering & Innovation](https://rootcastle.com/)** — *Engineering Beyond Boundaries.*

---

## 1. What Are REI Skills?

AI coding assistants (**Claude Code**, **OpenAI Codex CLI**, **Gemini CLI**, **Cursor**, **Antigravity**, **OpenCode**) are general-purpose models. **REI Skills** are structured, schema-validated `SKILL.md` operational playbooks that give your agent deterministic workflows, architectural constraints, and domain expertise on demand.

---

## 2. Quick Install

### Option A — Selective Skill or Bundle Install (Recommended)

Install only the exact skills or role bundle your project needs:

```bash
# Install the Essentials starter bundle for Cursor
npx rei-skills add essentials --cursor

# Install the 12-skill REI Reverse Engineering (REA) bundle for Claude Code
npx rei-skills add rei-rea --claude

# Install a single skill into the universal .agent/skills directory
npx rei-skills add systematic-debugging
```

### Option B — Full Catalog Install (895 Skills)

```bash
npx rei-skills                 # Default: ~/.gemini/antigravity/skills
npx rei-skills --claude        # ~/.claude/skills
npx rei-skills --cursor        # ./.cursor/skills
npx rei-skills --gemini        # ~/.gemini/skills
npx rei-skills --codex         # ~/.codex/skills
npx rei-skills --opencode      # ~/.agents/skills
```

---

## 3. Supported AI Clients

| Client | CLI Target Flag | Default Target Path |
| :--- | :--- | :--- |
| **Antigravity** | `--antigravity` | `~/.gemini/antigravity/skills` |
| **Claude Code** | `--claude` | `~/.claude/skills` |
| **Cursor** | `--cursor` | `./.cursor/skills` |
| **Gemini CLI** | `--gemini` | `~/.gemini/skills` |
| **OpenAI Codex CLI** | `--codex` | `~/.codex/skills` |
| **OpenCode** | `--opencode` | `~/.agents/skills` |
| **Kiro** | `--kiro` | `~/.kiro/skills` |
| **Custom Workspace** | `--path <dir>` | `<dir>` |

---

## 4. Next Steps

1. **[Usage Guide](USAGE.md)** — How to search, invoke, and chain skills in prompts
2. **[Role Bundles](BUNDLES.md)** — 19 curated role packs (`essentials`, `rei-rea`, `fullstack`, `security-engineer`, etc.)
3. **[Workflows](WORKFLOWS.md)** — Step-by-step multi-skill orchestration playbooks
4. **[REI Reverse Engineering](REI_REA_INTEGRATION.md)** — Binary intelligence, casebook forensics, and MCP setup
