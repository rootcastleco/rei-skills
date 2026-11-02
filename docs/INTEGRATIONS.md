# 🔌 Universal AI Assistant & Agent SDK Integrations Guide (`21` Targets)

**REI Skills** includes a native **Multi-AI Transpiler & Adapter Engine** ([`lib/ai-adapters.js`](../lib/ai-adapters.js)) that compiles `SKILL.md` files into the exact directory structure, frontmatter schema, or function-calling JSON required by **21 AI coding assistants, IDEs, CLI agents, and Agent SDKs**.

---

## 1. Universal AI Compatibility Matrix (`npx rei-skills targets`)

| AI Assistant / Runtime | CLI Flag | Native Format | Workspace Path | Router / Index File | Invocation Syntax |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Antigravity IDE** | `--antigravity` | `skill-dir` (`SKILL.md`) | `.agent/skills` | `AGENTS.md` | `Use @<skill-id>` |
| **Anthropic Claude Code** | `--claude` | `skill-dir` (`SKILL.md`) | `.claude/skills` | `CLAUDE.md` | `/<skill-id>` or `@<skill-id>` |
| **OpenAI Codex CLI & Cloud** | `--codex` | `skill-dir` (`SKILL.md` + `agents/openai.yaml`) | `.codex/skills` | `AGENTS.md` | `$<skill-id>` or `@<skill-id>` |
| **Google Gemini CLI** | `--gemini` | `skill-dir` (`SKILL.md`) | `.gemini/skills` | `GEMINI.md` | `Use @<skill-id>` |
| **Cursor AI IDE** | `--cursor` | `cursor-hybrid` (`SKILL.md` + `.cursor/rules/*.mdc`) | `.cursor/skills` & `.cursor/rules` | `AGENTS.md` | `@<skill-id>` in Chat/Composer |
| **GitHub Copilot** | `--copilot` | `copilot-instructions` (`.instructions.md` + `.prompt.md`) | `.github/instructions` & `.github/prompts` | `.github/copilot-instructions.md` | `#<skill-id>` or `/<skill-id>` |
| **Windsurf IDE (Cascade)** | `--windsurf` | `windsurf-rule` (`trigger: model_decision`) | `.windsurf/rules` | `.windsurfrules` | `@<skill-id>` in Cascade |
| **Cline Autonomous Agent** | `--cline` | `markdown-rule` (`.clinerules/*.md`) | `.clinerules` | `AGENTS.md` | Reference `@<skill-id>.md` |
| **Roo Code Agent** | `--roocode` | `markdown-rule` (`.roo/rules/*.md`) | `.roo/rules` | `AGENTS.md` | Reference `@<skill-id>` |
| **Continue.dev Autopilot** | `--continue` | `continue-rule` (`.continue/rules/*.md`) | `.continue/rules` | `AGENTS.md` | `@<skill-id>` in Continue |
| **Aider Pair Programmer** | `--aider` | `aider-conventions` (`.aider/skills/*.md`) | `.aider/skills` | `CONVENTIONS.md` | `/read .aider/skills/<id>.md` |
| **Amazon Q Developer** | `--amazonq` | `markdown-rule` (`.amazonq/rules/*.md`) | `.amazonq/rules` | `AGENTS.md` | `@rules` / `@<skill-id>` |
| **Zed AI Editor** | `--zed` | `markdown-rule` (`.zed/rules/*.md`) | `.zed/rules` | `.rules` | `/file .zed/rules/<id>.md` |
| **Block Goose Agent** | `--goose` | `skill-dir` (`SKILL.md`) | `.goose/skills` | `.goosehints` | `Use <skill-id> skill` |
| **Trae AI IDE** | `--trae` | `markdown-rule` (`.trae/rules/*.md`) | `.trae/rules` | `AGENTS.md` | `#<skill-id>` in Trae |
| **JetBrains Junie / AI** | `--junie` | `markdown-rule` (`.junie/skills/*.md`) | `.junie/skills` | `.junie/guidelines.md` | Reference `.junie/skills/<id>.md` |
| **OpenCode CLI & Agent** | `--opencode` | `skill-dir` (`SKILL.md`) | `.agents/skills` | `AGENTS.md` | `Use @<skill-id>` |
| **Kiro Spec-Driven IDE** | `--kiro` | `skill-dir` (`SKILL.md`) | `.kiro/skills` | `AGENTS.md` | `#<skill-id>` in Kiro |
| **Sourcegraph Amp** | `--amp` | `skill-dir` (`SKILL.md`) | `.agents/skills` | `AGENTS.md` | Mention `@<skill-id>` |
| **Cognition Devin** | `--devin` | `markdown-rule` (`.devin/playbooks/*.devin.md`) | `.devin/playbooks` | `AGENTS.md` | Attach `<id>.devin.md` |
| **Universal Agent SDKs** | `--sdk` | `sdk-json` (OpenAI / Anthropic / Gemini Tool JSON) | `.rei-skills/sdk` | `rei-skills-bundle.json` | Import JSON in LangGraph/CrewAI/SDK |

---

## 2. Multi-AI Installation & Workspace Router (`--all-ai` & `--agents-md`)

### Configure All Major AI Assistants in a Project Workspace at Once
```bash
# Installs a bundle into .claude/skills, .codex/skills, .gemini/skills, .cursor/skills + .cursor/rules (.mdc),
# .github/instructions (.instructions.md), .windsurf/rules, .clinerules, .roo/rules AND generates AGENTS.md!
npx rei-skills add rei-rea --all-ai --path ./my-project
```

### Generate Universal `AGENTS.md` Progressive Disclosure Router
```bash
# Generates AGENTS.md at the workspace root so any AGENTS.md-aware agent discovers installed skills
npx rei-skills router --bundle rei-rea --path ./my-project
```

---

## 3. Multi-Format Skill Compiler (`npx rei-skills export`)

Compile the entire catalog—or any filtered subset—into any target format:

```bash
# 1. Strict 2-field SKILL.md (agentskills-ref) + sidecar .rei-metadata.json
npx rei-skills export --format strict --output ./dist/strict

# 2. Native Cursor .mdc rules (with description, globs, alwaysApply: false)
npx rei-skills export --format cursor-mdc --filter rei- --output ./dist/cursor-rules

# 3. GitHub Copilot .instructions.md rules (with applyTo: "**")
npx rei-skills export --format copilot-instructions --filter rei- --output ./dist/copilot

# 4. Windsurf Cascade .md rules (with trigger: model_decision)
npx rei-skills export --format windsurf-rule --filter rei- --output ./dist/windsurf

# 5. Universal Agent SDK JSON (OpenAI function tool + Anthropic input_schema + Gemini FunctionDeclaration + system_prompt)
npx rei-skills export --format sdk-json --filter rei- --output ./dist/sdk
```
