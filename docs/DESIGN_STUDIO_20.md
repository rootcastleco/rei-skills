# REI Design Studio + Creative Toolkit (20 + 25)

Both user lists are mapped to REI Skills; existing skills are reused, 14 new workflow adapters were created. These are not installed third-party packages, verified live integrations or license grants.

## Design Studio — 20 entries

| # | REI skill | Upstream | Mode |
|---|---|---|---|
| 01 | ui-ux-pro-max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | existing |
| 02 | canvas-design | https://github.com/anthropics/skills | existing |
| 03 | pptx | https://github.com/anthropics/skills | existing |
| 04 | theme-factory | https://github.com/anthropics/skills | existing |
| 05 | stitch-design | https://github.com/google-labs-code/stitch-skills | adapter |
| 06 | frontend-design | https://github.com/anthropics/skills | existing |
| 07 | design-md | https://github.com/google-labs-code/stitch-skills | existing |
| 08 | astryx-design | https://github.com/meta/astryx | adapter |
| 09 | shadcn-ui-design | https://github.com/shadcn-ui/ui | adapter |
| 10 | tailwind-css-design | https://github.com/tailwindlabs/tailwindcss | adapter |
| 11 | magic-ui-design | https://github.com/magicuidesign/magicui | adapter |
| 12 | magic-mcp-design | https://github.com/21st-dev/magic-mcp | adapter |
| 13 | figma-context-design | https://github.com/GLips/Figma-Context-MCP | adapter |
| 14 | penpot-design | https://github.com/penpot/penpot | adapter |
| 15 | excalidraw-design | https://github.com/excalidraw/excalidraw | adapter |
| 16 | tldraw-design | https://github.com/tldraw/tldraw | adapter |
| 17 | lucide-design | https://github.com/lucide-icons/lucide | adapter |
| 18 | leonardo-colors | https://github.com/adobe/leonardo | adapter |
| 19 | rembg-assets | https://github.com/danielgatis/rembg | adapter |
| 20 | agent-browser-qa | https://github.com/vercel-labs/agent-browser | adapter |

## Creative Production — 25 entries

| # | REI skill | Upstream |
|---|---|---|
| 01 | frontend-design | https://github.com/anthropics/skills |
| 02 | canvas-design | https://github.com/anthropics/skills |
| 03 | algorithmic-art | https://github.com/anthropics/skills |
| 04 | theme-factory | https://github.com/anthropics/skills |
| 05 | remotion-best-practices | https://github.com/remotion-dev/skills |
| 06 | docx | https://github.com/anthropics/skills |
| 07 | pptx | https://github.com/anthropics/skills |
| 08 | xlsx | https://github.com/anthropics/skills |
| 09 | pdf | https://github.com/anthropics/skills |
| 10 | doc-coauthoring | https://github.com/anthropics/skills |
| 11 | copywriting | https://github.com/coreyhaines31/marketingskills |
| 12 | seo-audit | https://github.com/coreyhaines31/marketingskills |
| 13 | page-cro | https://github.com/coreyhaines31/marketingskills |
| 14 | email-sequence | https://github.com/coreyhaines31/marketingskills |
| 15 | social-content | https://github.com/coreyhaines31/marketingskills |
| 16 | writing-plans | https://github.com/obra/superpowers |
| 17 | subagent-driven-development | https://github.com/obra/superpowers |
| 18 | using-git-worktrees | https://github.com/obra/superpowers |
| 19 | mcp-builder | https://github.com/anthropics/skills |
| 20 | skill-creator | https://github.com/anthropics/skills |
| 21 | webapp-testing | https://github.com/anthropics/skills |
| 22 | systematic-debugging | https://github.com/obra/superpowers |
| 23 | test-driven-development | https://github.com/obra/superpowers |
| 24 | requesting-code-review | https://github.com/obra/superpowers |
| 25 | verification-before-completion | https://github.com/obra/superpowers |

## Integration contract

Task -> REI Router (choose 1–5) -> brand DESIGN.md / task specification -> isolated local tool or authorized external connector -> editable artifact -> visual/technical QA -> review gate.

Upstream packages, remote MCP services, assets and model weights are not automatically installed or redistributed. Audit upstream licenses individually, particularly Anthropic PPTX, tldraw production licensing and rembg model weights. No secrets or unpublished assets are sent to external services without authorization.

Brand tokens: #000000, #0E3D8A, #228B55. Preserve existing frameworks, Git branch hygiene, HOL Guard and opt-in adapters.

Acceptance: all 45 requested entries resolve, 14 adapter entrypoints and one orchestrator exist, build/validate/security/tests pass. Independent browser, screenshot and artifact QA remain NOT VERIFIED unless actually performed. Rollback by reverting the integration commit.


## High-Signal GitHub Design Extension

Eight additional non-vendored source-backed workflow adapters and one preexisting web-design-guidelines skill were selected after verifying exact upstream SKILL.md paths through GitHub. See `data/design-studio-high-signal.json`. This is not a star-only ranking, and it does not claim that full upstream skill directories, installations or supporting runtimes are available.
