---
name: review-changelog
description: 檢查 changelog 是否需要根據最近的 commits 更新，並準備版本發佈。Use when the user wants to review or update changelogs before a version bump. Triggers on requests like "review changelog", "update changelog", "檢查更新日誌", "準備發版", or when the user invokes /review-changelog. Analyzes commits since the last git tag, drafts bilingual changelog entries, and guides through the commit-then-version-bump sequence.
---

# Review Changelog

Analyze commits since the last release tag, draft bilingual changelog entries, and guide the version bump workflow.

## Changelog Files

| File | Language |
|------|----------|
| `website/changelog.md` | 繁體中文 (zh-TW) |
| `website/en/changelog.md` | English |

Both files must always be updated together with matching content.

## Workflow

1. **Identify the last release tag and current version**
   ```bash
   git describe --tags --abbrev=0
   node -p "require('./package.json').version"
   ```

2. **List commits since last tag**
   ```bash
   git log <last-tag>..HEAD --oneline --no-merges
   ```
   If no commits exist, report "Changelog is up-to-date" and stop.

3. **Read current changelogs** to understand existing format and the latest entry structure.

4. **Categorize commits** into:
   - **新功能 / New Features** — new user-facing functionality
   - **修復 / Fixes** — bug fixes
   - **改進 / Improvements** — enhancements to existing features
   - **重構 / Refactor** — code structure changes
   - **效能 / Performance** — performance optimizations
   - **文件 / Documentation** — docs-only changes
   - **測試 / Testing** — test infrastructure or new tests
   - Skip commits that are changelog/version bumps themselves.

5. **Determine version bump type**
   - `patch`: bug fixes, minor improvements, docs, tests
   - `minor`: new features, significant UI changes
   - `major`: breaking changes (rare)

6. **Draft bilingual entries** in zh-TW and English. Follow the existing format:
   ```markdown
   ## v{version}

   _YYYY-MM-DD_

   ### 新功能
   - **Area**: Description

   ### 修復
   - **Area**: Description
   ```
   Use today's date. Match the style of existing entries (bold area prefix, concise descriptions).

7. **Present report in zh-TW** to the user:
   - Proposed version bump type with rationale
   - Draft changelog entries (both languages)
   - List of commits mapped to categories
   - Ask user to confirm or adjust

8. **After confirmation, execute in order:**
   1. Edit `website/changelog.md` — insert new version section after the header
   2. Edit `website/en/changelog.md` — insert matching English section
   3. Stage and commit changelog files: `docs: update changelog for v{version}`
   4. Run `npm version <patch|minor|major>` (creates git tag automatically)
   5. Report the new version and tag

## Version History Structure Rule

Only the **two most recent minor versions** keep detailed per-patch entries. When a new minor version is introduced, condense the oldest of the two into the "Earlier Versions" summary section at the bottom of each changelog file.
