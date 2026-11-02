# 🚀 REI Skills v6.1.0 — Organic Engineering Launch Plan

**Objective:** Drive high-signal developer adoption, GitHub stars, and technical contributors for `rootcastleco/rei-skills` and `rootcastleco/Rei-Reverse-engineer` through verifiable engineering artifacts and reproducible demos.

> **Principle:** Zero artificial hype, zero fabricated metrics, zero spam. Every post leads with working code, reproducible CLI commands, and real binary triage output.

---

## Phase 1: Repository & Package Readiness (Day 0)

- [x] Merge `feat/platform-modernization-rea` Pull Request with all 895 skills passing strict CI gates.
- [x] Configure GitHub repository metadata (description, website URL, 20 discovery topics, social preview image `assets/brand/rei-skills-og.png`).
- [x] Tag release `v6.1.0` and publish `rei-skills@6.1.0` to npm via `.github/workflows/publish.yml`.
- [x] Cross-link `rootcastleco/Rei-Reverse-engineer` README to `rootcastleco/rei-skills`.

---

## Phase 2: Technical Launch Content (Days 1–3)

1. **GitHub Release (`v6.1.0`):** Publish [`RELEASE_ANNOUNCEMENT.md`](RELEASE_ANNOUNCEMENT.md) with changelog highlights, CLI upgrade notes, and the WebAssembly version-diff demo.
2. **Engineering Deep-Dive Article:** Publish [`DEVELOPER_POST.md`](DEVELOPER_POST.md) on the Rootcastle Engineering blog, Dev.to, and Hashnode explaining:
   - How we repaired 221 broken YAML frontmatters and built a dual-profile (`extended` vs `strict`) skill exporter.
   - How the 12 REI REA skills enforce `EVIDENCE` / `INFERENCE` / `UNKNOWN` provenance during binary reverse engineering.
3. **90-Second Terminal Demo Video:** Record [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) showing `npx rei-skills search`, `npx rei-skills add rei-rea`, and `python examples/rei-rea-demo/run_demo.py`.

---

## Phase 3: Ecosystem & Directory Submissions (Days 4–14)

Execute [`COMMUNITY_OUTREACH.md`](COMMUNITY_OUTREACH.md) across:
- MCP & Agent Skill registries (Model Context Protocol community directories, Claude Code & Cursor community showcases).
- Reverse engineering & security communities (`r/ReverseEngineering`, `r/netsec`, `r/LocalLLaMA`, `r/ClaudeAI`).
- Upstream contributor acknowledgments.
