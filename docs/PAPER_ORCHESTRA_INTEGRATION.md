# PaperOrchestra integration

REI Skills includes `rei-paper-orchestra`, a standalone, opt-in, evidence-gated bridge to [google-research/paper-orchestra](https://github.com/google-research/paper-orchestra) (Apache-2.0).

**What it provides:** an on-demand skill with scientific evidence gates and a Python CLI adapter for preflight, optional outline/literature/section/refinement/plotting pipeline execution, SHA-256 input tracking, and explicit model API consent. The default behavior does not run upstream code or contact providers.

**What it does not provide:** bundled Google source, model API credentials, a research dataset, a reproducible experimental result, a venue guarantee, or fully autonomous publication. The upstream project is not an officially supported Google product.

Read [the skill](../skills/rei-paper-orchestra/SKILL.md) and its [setup and verification guide](../skills/rei-paper-orchestra/references/integration.md).

## Validation

Use `npm run validate:strict`, `npm run security-audit`, `npm run build`, `npm test`, and `node scripts/tests/paper-orchestra.test.js` before merging. Full upstream paper-generation E2E requires provider credentials, a LaTeX toolchain, reviewed research inputs and author approval; mark that test **NOT VERIFIED** unless actually performed.

Rollback requires deleting the isolated skill and updating documentation/indexes. Existing REI Skills internals stay unchanged.
