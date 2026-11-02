# GEMINI.md — Google Gemini CLI & Antigravity Guide for REI Skills

> Refer to [`AGENTS.md`](AGENTS.md) for the full universal skill routing table and progressive disclosure protocol.

## Quick Commands for Gemini CLI & Antigravity

- **Search the 895-skill catalog:** `node bin/install.js search "<query>"`
- **Inspect a skill's metadata and files:** `node bin/install.js info <skill-id>`
- **Install a skill or bundle for Gemini CLI (`~/.gemini/skills`):** `node bin/install.js add <skill-or-bundle> --gemini`
- **Install a skill or bundle for Antigravity (`~/.gemini/rei/skills`):** `node bin/install.js add <skill-or-bundle> --antigravity`
- **Run full validation & test suite:** `npm run build && npm test`
