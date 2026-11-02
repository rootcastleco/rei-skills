# 🎯 REI Skills — Strategic Product Positioning

**Brand Owner:** [Rootcastle Engineering & Innovation](https://rootcastle.com/)  
**Product Identity:** REI Skills  
**Primary Positioning:** *The engineering-grade skill layer for AI agents.*  
**Corporate Tagline:** *Engineering Beyond Boundaries.*

---

## 1. The Core Problem

Developers using AI coding assistants (Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Antigravity, OpenCode) face three recurring problems with existing "awesome skill" repositories:
1. **Unvalidated Prompt Dumps:** Hundreds of Markdown files with broken YAML frontmatter, dangling relative links, and vague instructions that waste agent context tokens.
2. **All-or-Nothing Destructive Installers:** Legacy installers that clone everything blindly or delete existing `.git` directories without verifying repository ownership.
3. **Lack of Deep Systems & Binary Intelligence:** Most collections stop at boilerplate web CRUD and lack rigorous workflows for systems engineering, binary triage, firmware inspection, and forensic provenance.

---

## 2. The REI Skills Differentiation

**REI Skills** is engineered as a verifiable platform, not a static list:

| Dimension | Generic Skill Lists | REI Skills (`v6.1.0`) |
| :--- | :--- | :--- |
| **Schema & Link Integrity** | Unchecked Markdown / broken YAML | **895/895** skills pass strict Python + Node schema and relative-link validation |
| **Security & Risk Governance** | Unclassified prompts | Every skill classified (`none`, `safe`, `critical`, `offensive`) + automated `security_audit.js` |
| **Installation Granularity** | Full clone only | Full catalog **or** selective `npx rei-skills add <skill-or-bundle>` + `doctor` & `verify` |
| **Cross-Client Compatibility** | Single frontmatter assumption | Extended provenance frontmatter + `npx rei-skills export --format strict` |
| **Reverse Engineering & Forensics** | None or generic tips | **12 specialist REI REA skills** backed by [`Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) CLI + MCP server |

---

## 3. Target Developer Personas

1. **Full-Stack & Cloud Architects** using Claude Code, Cursor, or Codex CLI who want curated role bundles (`fullstack`, `devops-cloud`, `ddd-architecture`) without context bloat.
2. **Security Engineers & Reverse Engineers** who need provenance-gated static triage (`EVIDENCE` / `INFERENCE` / `UNKNOWN`), binary diffing, firmware inspection, and MCP tool integration via `rei-rea`.
3. **AI Agent Platform Engineers** who require schema-validated, deterministic `SKILL.md` assets with clear upstream licensing and attribution.
