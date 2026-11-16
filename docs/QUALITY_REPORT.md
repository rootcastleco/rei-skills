# REI Skills — Registry Quality & Gold 50 Report

**Generated From:** `data/quality-report.json` (`14pt-v1`) & `data/benchmarks/gold50-evaluation-report.json`  
**Audit Method:** Deterministic validation (`scripts/validate_skills.py --strict --report data/quality-report.json`) and functional evaluation (`scripts/evaluate-gold50.js`)

---

## 1. Registry-Wide Quality Summary (`1,423` Skills)

| Metric | Observed Count / Value | Verification Basis |
| :--- | ---: | :--- |
| **Total Skills Validated** | `1,423` | `scripts/validate_skills.py --strict` |
| **Schema Valid (`schemaValid`)** | `1,423` (`100.0%`) | PyYAML + strict frontmatter check |
| **References Validated (`referenceValidated`)** | `1,423` (`100.0%`) | Local relative path verification |
| **Security Policy Checked (`securityPolicyChecked`)** | `1,423` (`100.0%`) | Risk classification + `security_audit.js` |
| **Gold 50 Program Verified (`gold50_verified_count`)** | `50` | `scripts/evaluate-gold50.js` (`50/50` passed) |
| **Evaluation-Covered (`evaluation_passed_count`)** | `371` | Gold 50 (`50`) + benchmark-covered routing corpus |
| **Human-Reviewed (`human_reviewed_count`)** | `0` | *Not marked true without signed human review record* |
| **Hardware-Verified (`hardware_verified_count`)** | `0` | *Physical bench tests classified `not_verified`* |
| **Average 14-Point Score** | `9.76 / 14` | Across all `1,423` skills |
| **Average Legacy Doc Score** | `82.3 / 100` | Backwards-compatible metric retained |

### Quality Tier Distribution (`14pt-v1`)

| Quality Tier | Score Band | Skill Count | Share | Policy Status |
| :--- | :---: | ---: | ---: | :--- |
| **Q3 — Gold** | `12–14` | `346` | `24.3%` | Priority engineering quality |
| **Q2 — Solid** | `8–11` | `936` | `65.8%` | Active production catalog |
| **Q1 — Basic** | `4–7` | `141` | `9.9%` | Active; candidates for trigger/example enrichment |
| **Q0 — Quarantine** | `0–3` / gate fail | `0` | `0.0%` | Auto-quarantined from default recommendations |

---

## 2. Gold 50 Engineering Program Results

The **Gold 50** suite (`data/gold50-manifest.json`) evaluates 50 priority engineering skills (5 skills across each of 10 disciplines: `embedded-rtos`, `pcb-schematic`, `kicad-ecad`, `spice-simulation`, `fusion360-cad`, `mechanical-manufacturing`, `dsp-vibration-balancing`, `gnss-iot-telemetry`, `firmware-forensics`, and `optimization-reproducibility`):

| Check Dimension | Passed / Total | Rate | Acceptance Target | Status |
| :--- | ---: | ---: | :---: | :---: |
| **Skills Passing All Criteria** | `50 / 50` | `100.0%` | `>= 95.0%` | **PASS** |
| **Positive Evaluation Scenarios (EN & EN/TR)** | `149 / 150` | `99.3%` | `>= 95.0%` | **PASS** |
| **Negative / Unrelated / Injection Triggers** | `100 / 100` | `100.0%` | `>= 95.0%` | **PASS** |
| **Intended Adapter Transpilations** | `50 / 50` | `100.0%` | `>= 95.0%` | **PASS** |
| **5 Engineering Adapter Spot Checks** (`kicad`, `fusion360`, `embedded`, `scientific`, `industrial_measurement`) | `5 / 5` | `100.0%` | All computational checks green | **PASS** |

---

## 3. Verification Boundaries (Honesty Controls)

- Passing Gold 50 routing and adapter transpilation tests **does not** certify physical hardware behavior, CNC machining tolerances, SPICE thermal drift on silicon, or RF/EMC compliance (`hardwareVerified: "not_verified"`).
- Reproduction commands:
  ```bash
  node scripts/evaluate-gold50.js
  npm run validate:strict
  ```
