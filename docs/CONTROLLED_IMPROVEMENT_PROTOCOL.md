# REI Skills — Controlled Continuous Improvement Protocol

**Implementation:** [`lib/observability.js`](../lib/observability.js), [`lib/evaluation-engine.js`](../lib/evaluation-engine.js), [`lib/improvement-engine.js`](../lib/improvement-engine.js)  
**Test Suite:** [`scripts/tests/improvement-engine.test.js`](../scripts/tests/improvement-engine.test.js)

---

## 1. Governance Principle

Continuous improvement exists for **automated discovery, controlled experimentation, and evidence-backed PR proposals** — never autonomous self-modification of production registries, HOL Guard security policies, credentials, or connected hardware.

Mandatory structural flags enforced across `runImprovementCycle`:
- `automaticWrites: false`
- `autoMerge: false`
- `autoPublish: false`
- `prDraft.requiresHumanApproval: true`

---

## 2. Ten-Step Closed-Loop Protocol

1. **Collect Privacy-Safe Signals:** Capture opted-in task outcome traces via `ObservabilityRecorder`; scrub tokens, keys, and credentials through `redactAndScanSecrets` (`lib/hol-guard-policy.js`).
2. **Detect Recurring Failures:** `analyzeWeaknesses` aggregates failed benchmark items, recurring feedback patterns, and high-similarity skill overlaps.
3. **Identify Candidate Improvements:** Target missing domain triggers, ambiguous tags, outdated constraints, or coverage gaps.
4. **Form Bounded Hypotheses:** Record a falsifiable hypothesis with explicit expected metric delta (`candidate.hypothesis`).
5. **Create Isolated In-Memory Revision:** `buildCandidateCatalog` clones and adjusts candidate metadata/tags in memory without touching disk files.
6. **Evaluate Against Baseline (`dev`):** Run `evaluateBenchmarkSplit` on the development dataset split.
7. **Run Held-Out Regression & Security Gates:** Evaluate separately on the frozen held-out `eval` split (`120` tasks) to detect overfitting, plus `validateCandidateSecurity` (HOL Guard injection, machine command, XSS, and secret scanning).
8. **Compare Performance, Latency & Cost:** `compareBenchmarkRuns` blocks promotion unless measurable `dev`/`eval` improvements exist AND:
   - `eval.recallAt3 >= 0.85` (platform acceptance target `>= 0.95` tracked in `evaluate-router.js`),
   - `eval.criticalRiskMisroutingCount === 0`,
   - `eval.falsePositiveRate <= baseline`,
   - no held-out `Recall@3` regression.
9. **Generate Evidence-Backed Change Report:** Output a review-only `prDraft` comparing before/after metrics, deltas, suggested regression tests, and `[EVIDENCE]`/`[INFERENCE]`/`[UNKNOWN]` provenance.
10. **Human Review & Rollback Path:** Changes enter `main` exclusively via human-reviewed PR and CI gates. Every `prDraft` documents branch revert rollback steps (`git revert` + `npm run build && npm test`).

---

## 3. Reproducible CLI Execution

```bash
# Inspect router benchmark metrics (Precision@3, Recall@3, Incorrect Activation, FPR, Tokens, Latency)
node scripts/evaluate-router.js

# Inspect Gold 50 scenario evaluation (150 positive, 100 negative triggers, 50 adapter checks)
node scripts/evaluate-gold50.js

# Run a dry-run improvement experiment with CLI
npx rei-skills improve --feedback "Improve SPICE to bench parity triggers" --json
```
