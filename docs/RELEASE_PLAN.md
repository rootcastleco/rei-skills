# 🚀 REI Skills — Release & Publishing Plan

**Document ID:** `REI-REL-2026-001`  
**Package Name:** `rei-skills`  
**Current Version:** `6.1.0`

---

## 1. Release Readiness Checklist

Before cutting a new release tag (`vX.Y.Z`) or publishing to npm, every item below must pass with exit code `0`:

```bash
# 1. Synchronize and verify REI REA specialist skills (12 skills)
python scripts/sync_rei_rea.py --check

# 2. Rebuild all indices, catalogs, README, and static documentation site
npm run build

# 3. Run strict Python & Node.js skill validators (895 skills)
python scripts/validate_skills.py --strict --report data/quality-report.json
node scripts/validate-skills.js

# 4. Run referential integrity checks (workflows, bundles, docs/BUNDLES.md)
python scripts/validate_references.py

# 5. Run security audit (0 critical, 0 high, 0 unclassified)
node scripts/security_audit.js

# 6. Run automated test suite (catalog + CLI installer safety tests)
npm test

# 7. Verify npm package payload in dry-run mode
npm pack --dry-run
```

---

## 2. Package Payload Architecture

To keep `npx rei-skills` fast while supporting offline local clones, `package.json` ships:
- `bin/install.js` — Full-featured REI Skill Manager CLI (`install`, `search`, `list`, `info`, `add`, `doctor`, `verify`, `update`, `export`).
- `lib/skill-utils.js` — Shared frontmatter parser and POSIX path normalizer.
- `data/rei-rea-manifest.json` — Pinned REI Reverse Engineering skill manifest.
- `README.md`, `LICENSE`, `CREDITS.md` — Attribution and usage documentation.

When invoked via `npx rei-skills`, if a full local catalog is not bundled in the tarball, the CLI clones `https://github.com/rootcastleco/rei-skills.git` (or uses `--local` when run from a repository checkout) and materializes symlinked skills across all platforms.

---

## 3. Automated Release Workflow (`.github/workflows/publish.yml`)

Publishing is triggered **only** by pushing a signed semantic version tag (`v*.*.*`) or creating a GitHub Release:
1. Executes full validation (`validate_skills.py --strict`, `security_audit.js`, `npm test`).
2. Verifies `NPM_TOKEN` secret availability before attempting `npm publish --access public`.
3. Never force-pushes or mutates `main` during CI runs.
