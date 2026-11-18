# REI Skills 6.7.0 — Source-backed expansion

## Scope and provenance

This release combines the 20-tool Design Studio, 25-item creative toolkit and high-signal design additions with **274 additional source-backed skills** across engineering, cloud, research, security and business operations. The 274 new entrypoints contain real upstream specialist instructions with REI permission and validation boundaries. They are not empty placeholders.

GitHub stars represent repository-level attention, not an individual skill quality grade. Snapshot: 19 November 2026. Source file SHA-256 and pinned commits are retained in data/rei67-import-provenance.json.

| Repository | Stars at curation | License | New skills |
| --- | ---: | --- | ---: |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 118928 | MIT | 23 |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | 306449 | MIT | 44 |
| [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | 57699 | MIT | 57 |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | 41325 | MIT | 61 |
| [google/skills](https://github.com/google/skills) | 24432 | Apache-2.0 | 30 |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 30074 | MIT | 39 |
| [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit) | 2700 | MIT | 20 |

## Curated bundles

| Bundle | Number (overlapping) | Purpose |
| --- | ---: | --- |
| rei-popular-67 | 274 | 274 new source-backed specialist skills curated from seven high-interest GitHub repositories with pinned versions, deduplication and license gating. |
| rei-research-67 | 57 | Scientific computation, statistics and research methods (source backed; optional scientific runtimes not installed). |
| rei-agent-67 | 88 | AI agent architecture, context, evaluation, safety, orchestration and disciplined software practices. |
| rei-cloud-67 | 44 | Cloud, analytics, infrastructure, APIs and observability for managed platforms. |
| rei-security-67 | 19 | Defensive code security, threat modeling, supply chain integrity and engineering release assurance. |
| rei-business-67 | 42 | Founder and executive operations, proposals, partnerships, pricing, commercial strategy and customer support. |
| rei-developer-67 | 66 | Software engineering quality, API design, testing, backend/frontend contracts, databases and performance. |

## Release and evidence gates

- Pin real upstream files by exact commit SHA and SHA-256, and reject existing names, missing content, unsafe examples and unsuitable licenses.
- Bundle selected Markdown references where present; link to immutable upstream source for unbundled resources. Never execute third-party helper scripts automatically.
- Include upstream license texts in the published npm data/third-party-licenses directory.
- Keep the existing HOL Guard and route on demand to only the 1–5 most relevant skills.
- Run npm run build, npm run validate:strict, npm run security-audit, npm test and npm pack --dry-run.
- Verify data/catalog.json has 1,733 entries after a fresh build and that seven curated bundles survive regeneration.
- Publish through existing GitHub Actions trusted OIDC publishing; independently verify rei-skills@6.7.0 on npm before claiming release.

## Constraints and rollback

Source-backed SKILL.md instructions do not guarantee that third-party APIs, paid platforms, binaries, models, or hardware exist. Schema and safety lint PASS does not imply scientific or operational outcomes have been reproduced. Repo star counts are not evidence of per-skill quality.

Git source can be reverted using the release commit. An already-published npm version is immutable; release a newer corrective patch and avoid destructive npm unpublish.
