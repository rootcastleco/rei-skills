# REI Skills & REI REA — Comprehensive Repository Reconnaissance & Audit Report

**Date:** 2026-11-02  
**Organization:** Rootcastle Engineering & Innovation (REI)  
**Primary Repository:** `https://github.com/rootcastleco/rei-skills`  
**Integrated Workbench Repository:** `https://github.com/rootcastleco/Rei-Reverse-engineer`  
**Audit Scope:** Full static, structural, metadata, installer, security, and CI/CD reconnaissance across both repositories prior to platform modernization.

---

## 1. Executive Summary

A complete inspection of `rootcastleco/rei-skills` (at commit `a8f0263`) and `rootcastleco/Rei-Reverse-engineer` (at commit `09fbc7b`, v0.2.0 alpha) confirmed that while both repositories contain substantial, valuable engineering content, several critical operational, safety, cross-platform, and provenance defects existed in `rei-skills`:

1. **Critical Installer Data-Loss Defect (`HIGH / CRITICAL`):** `bin/install.js` (lines 215–231) checks whether the target directory contains a `.git` folder (`path.join(target, ".git")`) and unconditionally deletes **every file and subdirectory** inside `target` using `fs.rmSync(..., { recursive: true, force: true })` under the assumption that it is migrating an older full-repo clone. Running `npx rei-skills --path .` inside any user Git repository destroys the repository and working tree without backup or remote verification.
2. **Broken Windows Symlinks & Clone Failure (`HIGH`):** Four skill directories (`skills/docx`, `skills/pdf`, `skills/pptx`, `skills/xlsx`) and three `CLAUDE.md` files (`skills/dbos-*/CLAUDE.md`) are stored in Git as mode `120000` symbolic links. `bin/install.js` runs `git -c core.symlinks=true clone` on Windows, which fails unless Windows Developer Mode or Administrator privileges are active. When `core.symlinks=false`, these entries are checked out as 1-line plain-text files rather than directories.
3. **Suppressed Security Gate Failures in CI (`HIGH`):** `.github/workflows/ci.yml` executes `node scripts/security_audit.js` and `npm audit` with `continue-on-error: true`. Running `node scripts/security_audit.js` locally exited with code `1` (reporting 22 Critical findings, 17 High findings, 2 Medium findings, and 785 Low findings caused by CRLF frontmatter regex issues and unannotated examples).
4. **Duplicate Release Workflows & Upstream Star-History Pollution (`HIGH`):** Both `.github/workflows/publish.yml` and `.github/workflows/publish-npm.yml` trigger on `release: types: [published]` and run `npm publish`, guaranteeing a race condition or duplicate-version error on release. Meanwhile, `.github/workflows/star-history.yml` runs daily with `contents: write`, fetching chart data for `sickn33/antigravity-awesome-skills` and committing directly to `main`.
5. **YAML Frontmatter & Cross-Platform Validation Failures (`MEDIUM / HIGH`):**
   - `scripts/validate_skills.py` crashes on Windows consoles (`UnicodeEncodeError: 'gbk' codec`) because `sys.stdout` is not configured for UTF-8, and falsely flags web-route example links (`/alternatives/notion`) as local dangling paths because `os.path.isabs('/alternatives/notion')` returns `False` on Windows.
   - `lib/skill-utils.js` and `scripts/build-catalog.js` use `path.relative()` without POSIX slash normalization, emitting Windows backslashes (`\\`) into `data/catalog.json` and `CATALOG.md` when run on Windows.
   - Over 100 `SKILL.md` files contain multiline `description:` fields or unquoted colons that fail strict YAML parsing (`yaml.parseDocument` in `scripts/validate-skills.js`).
6. **Provenance Overwrite (`MEDIUM`):** `scripts/brand_skills.js` overwrote `source:` in YAML frontmatter to `source: rootcastle-rei` across 878 skills, obscuring upstream provenance from `microsoft/skills` (140 skills tracked in `docs/microsoft-skills-attribution.json`), `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `supabase/agent-skills`, and community contributors documented in `docs/SOURCES.md` and `CREDITS.md`.
7. **README & Index Drift (`MEDIUM`):**
   - `scripts/update_readme.py` searches for legacy heading `# 🌌 Antigravity Awesome Skills: \d+`, making `npm run readme` a silent no-op on `# 🏰 Rei Skills`.
   - Root `skills_index.json` contains 883 entries while `data/skills_index.json` contains a stale 559-entry snapshot.

---

## 2. Primary Repository Findings (`rootcastleco/rei-skills`)

### 2.1 Inventory & Skill Count Verification

| Metric | Observed Value (Before Modernization) | Notes |
| :--- | :--- | :--- |
| Top-level entries in `skills/` | `879` | `875` directories + `4` symlinks (`docx`, `pdf`, `pptx`, `xlsx`) |
| Top-level directories with `SKILL.md` | `872` | `skills/game-development` also has a top-level `SKILL.md` |
| Top-level directories without `SKILL.md` | `1` (`skills/SPDD`) | Contains `1-research.md`, `2-spec.md`, `3-implementation.md` |
| Nested skill directories with `SKILL.md` | `11` | `10` under `skills/game-development/*` + `1` at `skills/app-builder/templates` |
| Total `SKILL.md` files on disk | `883` | Matches `skills_index.json` count (`883`) |
| REI REA specialist skills to integrate | `12` | From `rootcastleco/Rei-Reverse-engineer/skills/` |
| **Post-integration canonical skill count** | **`895`** (or `896` if `spdd` is normalized) | Dynamically calculated by indexers |

### 2.2 Detailed Defect Register

| ID | Component | Severity | Finding | Remediation |
| :--- | :--- | :--- | :--- | :--- |
| `AUD-01` | `bin/install.js:215-231` | **CRITICAL** | Unconditional `fs.rmSync` on any target directory containing `.git`. | Verify remote URL before migration, create timestamped backup, preserve unrelated files, support `--dry-run` and atomic staging. |
| `AUD-02` | `bin/install.js:194-198` & `skills/{docx,pdf,pptx,xlsx}` | **HIGH** | `git -c core.symlinks=true clone` fails on unprivileged Windows; symlinked skills copy as 1-line files when `core.symlinks=false`. | Clone without requiring privileged symlinks; resolve symlink targets during installation so `docx`, `pdf`, `pptx`, `xlsx` materialize as full skill directories on all OSes. |
| `AUD-03` | `.github/workflows/ci.yml` | **HIGH** | `security_audit.js` and `npm audit` use `continue-on-error: true`; top-level `permissions: contents: write` granted on PRs; CI auto-commits to `main`. | Set top-level `permissions: contents: read`; remove `continue-on-error` on `security_audit.js`; fix underlying audit findings; enforce deterministic drift check instead of self-modifying CI. |
| `AUD-04` | `.github/workflows/publish-npm.yml` & `publish.yml` | **HIGH** | Two separate workflows trigger on `release: [published]` and run `npm publish`. | Remove legacy `publish-npm.yml`; harden `publish.yml` with tag-version verification, test/audit gate, and npm provenance. |
| `AUD-05` | `.github/workflows/star-history.yml` | **MEDIUM** | Daily cron fetches star history for `sickn33/antigravity-awesome-skills` and pushes commits to `main`. | Remove daily auto-commit pollution and update target repo reference. |
| `AUD-06` | `scripts/validate_skills.py` | **HIGH** | Crashes on Windows (`gbk` codec error on emoji print); false-positive dangling links on web route paths (`/alternatives/...`) on Windows. | Reconfigure `sys.stdout`/`sys.stderr` to UTF-8; treat leading `/` web route examples consistently across platforms; add YAML parse verification. |
| `AUD-07` | `lib/skill-utils.js` & `scripts/build-catalog.js` | **HIGH** | `path.relative()` outputs backslashes (`\`) on Windows; `skills_index.json` and `data/skills_index.json` diverge. | Normalize all relative paths to POSIX `/`; synchronize `skills_index.json` and `data/skills_index.json` from a single source of truth. |
| `AUD-08` | `skills/*/SKILL.md` Frontmatter | **MEDIUM** | 100+ skills have unindented multiline `description:` or unquoted colons that break strict YAML parsers (`yaml.parseDocument`). | Normalize frontmatter YAML across all skills while preserving all content and metadata fields. |
| `AUD-09` | `scripts/brand_skills.js` & Provenance | **MEDIUM** | `brand_skills.js` overwrote `source:` to `rootcastle-rei` across third-party skills. | Restore accurate upstream `source:` attribution from `docs/microsoft-skills-attribution.json` and `docs/SOURCES.md`; use `curated_by: rootcastle-rei` or keep `source` intact when already set. |
| `AUD-10` | `scripts/security_audit.js` | **MEDIUM** | Regex `^---\n` fails on CRLF files (causing 785 false `MISSING_RISK` findings); naive password regex matches HTML/placeholder examples (`password: "password"`). | Support `\r?\n` in frontmatter extraction; refine placeholder exclusions; sanitize ambiguous password strings in documentation examples; add auth disclaimers where required. |
| `AUD-11` | `scripts/update_readme.py` | **MEDIUM** | Uses legacy regex `# 🌌 Antigravity Awesome Skills`, failing to update `README.md`. | Update `update_readme.py` to update REI Skills markers and category tables deterministically. |
| `AUD-12` | `package.json` scripts | **MEDIUM** | Hardcodes `python3` (unavailable by default on Windows where Python executable is `python`); `npm test` clones `microsoft/skills` live over the network. | Use cross-platform runner (`node` wrapper or Python launcher) and separate offline deterministic unit tests (`npm test`) from live network sync checks (`npm run test:network`). |

---

## 3. Reverse Engineering Repository Findings (`rootcastleco/Rei-Reverse-engineer`)

### 3.1 Verified Implementation State (Commit `09fbc7b`, v0.2.0 Alpha)

Inspection of `C:\Appdev\rei rea` (`https://github.com/rootcastleco/Rei-Reverse-engineer.git`) and execution of its full test suite (`python -m unittest discover -s tests -v`) confirmed:

- **Package & Version:** `rootcastle-rei-rea` version `0.2.0` (`requires-python >= 3.10`, zero third-party runtime dependencies).
- **Test Status:** All unit tests in `tests/` (`test_casebook.py`, `test_cli.py`, `test_deep.py`, `test_discovery.py`, `test_evidence.py`, `test_inspector.py`, `test_mcp.py`, `test_metadata.py`, `test_planner.py`, `test_registry.py`, `test_signals.py`, `test_skills.py`, `test_sync_workflow.py`) **PASS**.
- **Core Modules (`src/rei_rea/`):**
  - `cli.py`: Structured JSON CLI supporting `inspect`, `signals`, `plan`, `deep`, `investigate`, `compare`, `diff`, `tools list/doctor`, `providers`, `run --allow-external`, `case init/note/verify/report/index/search/bundle/bundle-verify`, `mcp`, and `serve`.
  - `mcp.py`: Local stdio JSON-RPC MCP server exposing **14 tools**: `rei_rea_providers`, `rei_rea_tools`, `rei_rea_doctor`, `rei_rea_inspect`, `rei_rea_plan`, `rei_rea_signals`, `rei_rea_compare`, `rei_rea_case_create`, `rei_rea_case_verify`, `rei_rea_investigate`, `rei_rea_deep`, `rei_rea_diff`, `rei_rea_case_search`, `rei_rea_bundle_verify`.
  - `registry.py` & `data/tools.json`: **124-entry tool catalog** with explicit separation between cataloged tools, PATH-detected executables, and **11 opt-in static adapters** (`file`, `readelf`, `objdump`, `llvm-objdump`, `llvm-readobj`, `nm`, `exiftool`, `otool`, `android-aapt2` / `aapt2`, `rabin2`, `rz-bin`).
  - `inspector.py` & `deep.py`: Read-only static format detection and bounded structural parsers for PE, ELF, and WebAssembly v1 (up to 32 MiB / 64 MiB pipeline ceiling), refusing symlinks and path traversal.
  - `evidence.py` & `casebook.py`: Append-only SHA-256 hash-linked evidence cases, SQLite casebook search index, and metadata-only ZIP bundle export/verification.
- **12 Specialist Agent Skills (`skills/`):**
  1. `rei-rea-orchestrator`
  2. `rei-binary-intelligence`
  3. `rei-casebook-forensics`
  4. `rei-native-binaries`
  5. `rei-electron-and-js`
  6. `rei-android-apks`
  7. `rei-firmware-and-iot`
  8. `rei-mobile-runtime`
  9. `rei-evidence-ledger`
  10. `rei-reconstruction-parity`
  11. `rei-wasm-and-managed`
  12. `rei-web-and-protocols`
- **Upstream Relationship (`upstream/rea`):**
  - `morluto/rea` is tracked separately as a gitlink submodule in `upstream/rea` with its own review-PR workflow (`docs/UPSTREAM-SYNC.md`). REI REA is an original Rootcastle Python implementation and does not claim drop-in parity with `morluto/rea`.

### 3.2 Integration Requirements for `rei-skills`

When importing the 12 REI REA specialist skills into `rei-skills`:
- Each skill currently has `name` and `description` (> 200 chars in some cases, e.g., 300–430 chars) in `SKILL.md` frontmatter, plus `agents/openai.yaml` and `references/workflow.md`.
- To satisfy both `rei-skills` validation (`risk`, `source`, concise `description`, `## When to Use`) and `Rei-Reverse-engineer` skill contracts (`## Entry contract` / `## Procedure` / `## Contracts` / `references/workflow.md`), our synchronization script (`scripts/sync_rei_rea.py`) must preserve all REA sections, references, and `agents/openai.yaml` files while adding standardized frontmatter (`risk: safe`, `source: rootcastle-rei`, `category: reverse-engineering`) and a `## When to Use` section (or recognizing REA's entry contract).
