# 📊 Engineering & Adoption Metrics Framework

This document defines the transparent, verifiable engineering and adoption metrics tracked for **REI Skills** (`rootcastleco/rei-skills`) and **REI Reverse Engineering** (`rootcastleco/Rei-Reverse-engineer`).

> **Integrity Rule:** Never fabricate stars, download counts, contributor numbers, or benchmark claims. Every metric reported publicly must be reproducible via a CLI command or public API.

---

## 1. Repository Quality Metrics (Verified by CI on Every Commit)

| Metric | Verification Command | Current Verified Value (`v6.1.0`) | Target |
| :--- | :--- | :---: | :---: |
| **Total Indexed Skills** | `python scripts/validate_skills.py --strict` | `895` | `>= 895` |
| **Strict Schema Pass Rate (Python)** | `python scripts/validate_skills.py --strict` | `100%` (`895/895`, `0` errors, `0` warnings) | `100%` |
| **Strict Schema Pass Rate (Node)** | `node scripts/validate-skills.js` | `100%` (`0` errors, `0` warnings) | `100%` |
| **Security Audit Critical / High Issues** | `node scripts/security_audit.js` | `0` Critical, `0` High, `0` Unclassified | `0` |
| **Broken Bundle / Workflow References** | `python scripts/validate_references.py` | `0` | `0` |
| **REI REA Sync Integrity** | `python scripts/sync_rei_rea.py --check` | `12/12` SHA-256 verified (`v0.2.0`) | `100%` |
| **Installer Safety Test Suite** | `node scripts/tests/installer.test.js` | `100%` passing (`7/7` safety checks) | `100%` |

---

## 2. Organic Adoption & Community Health Metrics (Post-Launch Tracking)

Track monthly using the GitHub API (`gh api`) and npm registry stats:

1. **GitHub Discovery & Engagement:**
   - Unique repository clones & views (`gh api repos/rootcastleco/rei-skills/traffic/clones` & `/traffic/views`)
   - Referral sources (`gh api repos/rootcastleco/rei-skills/traffic/popular/referrers`)
   - Stargazers and forks across `rootcastleco/rei-skills` and `rootcastleco/Rei-Reverse-engineer`
2. **CLI & Package Usage:**
   - Weekly npm downloads of `rei-skills` (`https://api.npmjs.org/downloads/point/last-week/rei-skills`)
   - Cross-repository traffic to `rootcastleco/Rei-Reverse-engineer`
3. **Contributor Experience:**
   - Median time to first maintainer response on Issues and PRs (`Target: < 48 hours`)
   - PR first-run CI pass rate by external contributors
