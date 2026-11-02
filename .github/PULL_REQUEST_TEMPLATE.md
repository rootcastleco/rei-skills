## Summary

<!-- Briefly describe what this Pull Request adds, fixes, or improves. -->

## Type of Change

- [ ] New Skill (`skills/<skill-id>/SKILL.md`)
- [ ] Skill Update / Bug Fix
- [ ] REI Reverse Engineering (`rei-rea`) Sync or Enhancement
- [ ] CLI Installer (`bin/install.js`) or Build Tooling (`scripts/`)
- [ ] Documentation / Catalog Improvement

## Provenance & Attribution

- [ ] Original work authored for Rootcastle / REI Skills (`source: rootcastle-rei` or `source: community`)
- [ ] Adapted or mirrored from an upstream open-source project (upstream URL preserved in `source:` and license/attribution verified in `CREDITS.md`)

## Verification Checklist

Please confirm you have run the following checks locally and all exited with code `0`:

- [ ] `npm run build` (regenerated `skills_index.json`, `CATALOG.md`, `data/catalog.json`, `README.md`, `docs/site/index.html`)
- [ ] `python scripts/validate_skills.py --strict` (strict YAML schema, trigger, and relative link validation)
- [ ] `node scripts/validate-skills.js` (Node frontmatter validation)
- [ ] `node scripts/security_audit.js` (0 critical/high findings, offensive skills include `AUTHORIZED USE ONLY` disclaimer)
- [ ] `python scripts/validate_references.py` (all bundle and workflow references resolve)
- [ ] `npm test` (catalog and installer safety test suite passes)
