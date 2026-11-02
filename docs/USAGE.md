# 📖 Usage Guide: How to Discover, Install, and Execute REI Skills

> **Installed REI Skills and wondering what to do next?** This guide walks you through discovering, installing, verifying, and invoking skills across all supported AI coding assistants.

---

## 1. Choose Your Installation Strategy

Unlike legacy monolithic skill repositories, **REI Skills** lets you either install the complete 895-skill catalog or selectively install individual skills and role bundles:

```bash
# Strategy A: Install only a specific skill or role bundle into your workspace
npx rei-skills add brainstorming --cursor
npx rei-skills add rei-rea --claude

# Strategy B: Install the complete 895-skill catalog
npx rei-skills --cursor
```

---

## 2. Discover Skills from the Terminal

Use the built-in REI Skill Manager CLI to search and inspect skills without leaving your terminal:

```bash
# Search by keyword, domain, or tag
npx rei-skills search "reverse engineering"
npx rei-skills search "nextjs"

# Inspect full metadata, risk classification, and source provenance
npx rei-skills info rei-rea-orchestrator

# List categories or bundles
npx rei-skills list --categories
npx rei-skills list --bundles
```

---

## 3. How to Invoke a Skill in Your AI Assistant

Once installed, skills remain dormant on disk until you or your agent invoke them—keeping your context window clean.

### Claude Code
```text
Use @brainstorming to design a rate-limiting middleware for our Express API
```

### Cursor
```text
@react-best-practices audit src/components/Dashboard.tsx for unnecessary re-renders
```

### Gemini CLI / Antigravity IDE
```text
Use @rei-binary-intelligence to inspect the sections and entropy of examples/rei-rea-demo/fixtures/telemetry-filter-v2.wasm
```

### OpenAI Codex CLI
```text
Apply @api-security-best-practices to review routes/auth.ts
```

---

## 4. Verify & Diagnose Your Installation

If your assistant does not recognize a skill or you want to verify frontmatter integrity:

```bash
# Check installed skill directories, symlinks, and optional REI REA tools
npx rei-skills doctor

# Verify YAML frontmatter integrity across an installed directory
npx rei-skills verify --path .cursor/skills

# Export strict 2-field frontmatter for consumers that reject extended metadata
npx rei-skills export --format strict --output ./dist-strict-skills
```

---

## 5. Related Guides

- [Getting Started](GETTING_STARTED.md)
- [Curated Role Bundles](BUNDLES.md)
- [Multi-Skill Workflows](WORKFLOWS.md)
- [REI Reverse Engineering Integration](REI_REA_INTEGRATION.md)
- [Client Integrations Matrix](INTEGRATIONS.md)
