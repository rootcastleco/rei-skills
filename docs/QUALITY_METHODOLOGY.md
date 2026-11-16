# REI Skills — 14-Point Quality Methodology & Verification Architecture

**Rubric Version:** `14pt-v1`  
**Implementation:** `lib/quality-engine.js` (Node.js) and `scripts/validate_skills.py` (Python CI pipeline)  
**Primary Output:** `data/quality-report.json`

---

## 1. Seven-Dimension Quality Rubric (0–2 per Dimension, Max 14 Points)

Every skill in `skills/*/SKILL.md` is evaluated deterministically across seven dimensions:

| Dimension | Score `0` | Score `1` | Score `2` |
| :--- | :--- | :--- | :--- |
| **1. Metadata** | Invalid or incomplete frontmatter (`name` mismatch, missing `description`, missing `risk`/`source`) | Valid required frontmatter (`name`, `description <= 1024`, `risk`, `source`) | Complete metadata including `license`, `category`, or structured `metadata.tags` with descriptive summary (`>= 40` chars) |
| **2. Trigger Precision** | No `## When to Use` / `## Entry contract` and no `"Use when..."` rule | Contains explicit activation section (`## When to Use` / `## Entry contract`) or `"Use when"` description | Explicit activation section AND explicit non-goal / negative boundary (`## Do not use`, `## Limitations`, `do not substitute`) |
| **3. Specificity** | Generic short overview (`< 400` chars) without technical constraints | Concrete domain narrative (`>= 400` chars) with bounded problem focus | Concrete engineering units/tolerances/contracts (`units`, `tolerance`, `threshold`, `checksum`, `clock`, `schema`, etc.) paired with safety/constraint bounds or Gold 50 contract |
| **4. Actionability** | Conceptual prose only; no concrete procedure or runnable examples | Ordered steps (`## Procedure` / `## Instructions` / numbered workflow) OR runnable code/template blocks | Both structured ordered execution steps AND fenced code/command blocks or helper scripts |
| **5. References** | Dangling or missing local reference paths | All local markdown paths verified existing | Verified local references AND external authoritative links (`https://...`), `references/` subdirectory, or `## Authoritative` section |
| **6. Security** | Missing/invalid `risk` or missing mandatory `AUTHORIZED USE ONLY` disclaimer on `offensive` skills | Valid `risk` classification passing security audit gates | Explicit `Constraints and safety` / `Operational boundary` / untrusted-input / static-first / lockout guardrails documented |
| **7. Evaluation** | Static checks only; zero recorded task evaluation evidence | Included in `rei-*` tested module suite OR 260-task routing benchmark coverage (`evaluationPassed`) | Passed multi-scenario functional + negative-trigger + adapter evaluation in Gold 50 (`data/benchmarks/gold50-evaluation-report.json`) |

---

## 2. Quality Tiers & Mandatory Quarantine Rules

| Tier | Score Band | Meaning & Routing Policy |
| :--- | :---: | :--- |
| **Q3 — Gold** | `12–14` | Engineering-grade structure, bounded non-goals, security boundaries, and verified references/evaluations |
| **Q2 — Solid** | `8–11` | Production-usable skill passing all mandatory schema, reference, and security checks |
| **Q1 — Basic** | `4–7` | Schema-valid baseline instruction; candidate for trigger/actionability/evaluation enrichment |
| **Q0 — Quarantine** | `0–3` *or gate fail* | **Quarantined (`quarantined: true`)**: excluded from default `recommendHybrid` suggestions unless `includeQuarantined: true` |

**Non-Overridable Mandatory Gates:** A high numerical score **never** overrides a failed mandatory check (`!schema_valid || !references_valid || !security_compliant` forces `quality_tier = "Q0"` and `quarantined = true`).

---

## 3. Six Separated Verification Dimensions

Static schema checks must never be conflated with functional testing, human review, or physical hardware testing. Each entry in `data/quality-report.json` tracks six independent fields:

1. `schemaValid` (`boolean`) — YAML frontmatter, folder naming, required keys, and strict formatting.
2. `referenceValidated` (`boolean`) — No broken local markdown/file links inside `SKILL.md` or `references/`.
3. `securityPolicyChecked` (`boolean`) — Valid risk tier, mandatory `AUTHORIZED USE ONLY` banner where required, zero blocking `security_audit.js` findings.
4. `evaluationPassed` (`boolean`) — `true` **only** when backed by deterministic benchmark/Gold 50 evaluation records (`data/benchmarks/gold50-evaluation-report.json` / `routing-benchmark-v1.json`).
5. `humanReviewed` (`boolean`) — Defaults strictly to `false` unless backed by an explicit reviewer attestation record (never fabricated).
6. `hardwareVerified` (`"not_verified"` | `"not_applicable"`) — Explicitly `"not_verified"` on hardware/PCB/CAD/instrument skills when physical bench validation has not occurred.
