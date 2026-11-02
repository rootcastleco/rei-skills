# CLAUDE.md — Anthropic Claude Code Guide for REI Skills

> Refer to [`AGENTS.md`](AGENTS.md) for the full universal skill routing table and progressive disclosure protocol.

## Quick Commands for Claude Code

- **Search the 895-skill catalog:** `node bin/install.js search "<query>"`
- **Inspect a skill's metadata and files:** `node bin/install.js info <skill-id>`
- **Install a skill or bundle into `~/.claude/skills`:** `node bin/install.js add <skill-or-bundle> --claude`
- **Install into workspace `.claude/skills`:** `node bin/install.js add <skill-or-bundle> --claude --workspace`
- **Run full validation & test suite:** `npm run build && npm test`
