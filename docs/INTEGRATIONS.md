# 🔌 AI Assistant Integrations Guide

This document details how **REI Skills** integrates with each supported AI coding assistant, including directory conventions, frontmatter compatibility, and optional MCP server registration.

---

## 1. Client Directory Matrix

| AI Assistant | Flag | Global Path | Workspace Path | Invocation Syntax |
| :--- | :--- | :--- | :--- | :--- |
| **Antigravity IDE** | `--antigravity` | `~/.gemini/antigravity/skills` | `.agent/skills` | `Use @<skill-id>` |
| **Claude Code** | `--claude` | `~/.claude/skills` | `.claude/skills` | `/<skill-id>` or `@<skill-id>` |
| **Cursor** | `--cursor` | `~/.cursor/skills` | `.cursor/skills` | `@<skill-id>` |
| **Gemini CLI** | `--gemini` | `~/.gemini/skills` | `.gemini/skills` | `Use @<skill-id>` |
| **OpenAI Codex CLI** | `--codex` | `~/.codex/skills` | `.codex/skills` | `Use @<skill-id>` |
| **OpenCode** | `--opencode` | `~/.agents/skills` | `.agents/skills` | `@<skill-id>` |
| **Kiro** | `--kiro` | `~/.kiro/skills` | `.kiro/skills` | `@<skill-id>` |

---

## 2. Frontmatter Compatibility Profiles

REI Skills maintains rich provenance metadata (`name`, `description`, `risk`, `source`, `tags`) in repository `SKILL.md` files. For strict `agentskills-ref` consumers that accept only `name` and `description`, use the built-in exporter:

```bash
# Export strict 2-field SKILL.md files (plus sidecar .rei-metadata.json)
npx rei-skills export --format strict --output ./strict-skills

# Or export only the 12 REI REA specialist skills in strict mode
npx rei-skills export --format strict --filter rei- --output ./strict-rea-skills
```

---

## 3. Windows Symlink Materialization

Four vendor-mirrored document skills (`docx`, `pdf`, `pptx`, `xlsx`) are stored in Git as relative symlinks (`120000`). Even when `git config core.symlinks` is `false` on Windows, `npx rei-skills` automatically resolves and materializes full directory copies during installation so every assistant receives complete `SKILL.md` files.

---

## 4. Optional REI REA MCP Server Registration

To connect the **REI Reverse Engineering Workbench (`rei-rea`)** MCP server (`stdio` JSON-RPC) to your assistant:

```bash
# Safely merge the rei-rea MCP server entry (creates a .bak backup automatically)
npx rei-skills --mcp-config ~/.cursor/mcp.json
```

This adds:

```json
{
  "mcpServers": {
    "rei-rea": {
      "command": "rei-rea-mcp",
      "args": []
    }
  }
}
```

Verify your environment readiness at any time with:

```bash
npx rei-skills doctor
```
