/**
 * Controlled Continuous Improvement Engine (Phase G).
 *
 * Implements:
 *   Observe -> Detect Weakness -> Form Hypothesis -> Generate Candidate
 *   -> Test -> Compare Baseline -> Security Review -> Create PR Draft
 *
 * Strict Governance Invariants:
 * - No unattended production file modification (`automaticWrites: false`).
 * - No auto-merging (`autoMerge: false`) or unattended npm publishing (`autoPublish: false`).
 * - Candidate overrides are tested in memory against separate `dev` and held-out `eval`
 *   benchmark splits and must pass HOL Guard security checks before yielding a PR draft.
 */

const crypto = require("crypto");
const { recommendForTask, tokenize } = require("./smart-router");
const { buildDenseEmbedding, cosineSimilarity } = require("./hybrid-router");
const { evaluateDevAndHeldOut, compareBenchmarkRuns, loadEvaluationDataset } = require("./evaluation-engine");
const { tagProvenance } = require("./observability");
const {
  detectPromptInjection,
  detectDangerousMachineCommands,
  redactAndScanSecrets,
  validateRegistryEntrySafety,
} = require("./hol-guard-policy");

/**
 * 1. Observes benchmark misses, user feedback corrections, and redundant catalog overlaps.
 */
function analyzeWeaknesses(options = {}) {
  const feedbackLog = Array.isArray(options.feedbackLog) ? options.feedbackLog : [];
  const benchmarkReport = options.benchmarkReport || null;
  const dataset = options.catalog
    ? { catalog: options.catalog }
    : loadEvaluationDataset({
        benchmarkPath: options.benchmarkPath,
        catalogPath: options.catalogPath,
        bundlesPath: options.bundlesPath,
        workflowsPath: options.workflowsPath,
      });

  const missedBenchmarkTasks = [];
  if (benchmarkReport && benchmarkReport.hybrid) {
    for (const split of ["train", "dev", "eval"]) {
      const s = benchmarkReport.hybrid[split];
      if (s && Array.isArray(s.sampleFailures)) {
        for (const f of s.sampleFailures) {
          missedBenchmarkTasks.push({ split, ...f });
        }
      }
    }
  }

  const recurringFeedback = [];
  const grouped = new Map();
  for (const item of feedbackLog) {
    const key = String(item.task || item.skillId || item.feedback || "general").toLowerCase().slice(0, 80);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  for (const [key, items] of grouped.entries()) {
    recurringFeedback.push({
      pattern: key,
      occurrences: items.length,
      samples: items.slice(0, 3),
    });
  }

  // Detect high-similarity redundant pairs across same-category sample catalog skills
  const sampleSkills = (dataset.catalog.skills || []).slice(0, 120);
  const embeddedSample = sampleSkills.map((skill) => ({
    id: skill.id,
    category: skill.category || "general",
    vec: buildDenseEmbedding(`${skill.name || ""} ${skill.description || ""} ${(skill.tags || []).join(" ")}`),
  }));
  const overlaps = [];
  for (let i = 0; i < embeddedSample.length; i++) {
    for (let j = i + 1; j < embeddedSample.length; j++) {
      if (embeddedSample[i].category !== embeddedSample[j].category) continue;
      const sim = cosineSimilarity(embeddedSample[i].vec, embeddedSample[j].vec);
      if (sim >= 0.85) {
        overlaps.push({
          skillA: embeddedSample[i].id,
          skillB: embeddedSample[j].id,
          similarity: Number(sim.toFixed(3)),
        });
      }
    }
  }

  return {
    missedBenchmarkTasksCount: missedBenchmarkTasks.length,
    missedBenchmarkTasks: missedBenchmarkTasks.slice(0, 15),
    recurringFeedback,
    overlappingSkillPairsCount: overlaps.length,
    overlappingSkillPairs: overlaps.slice(0, 10),
    provenance: tagProvenance(
      "EVIDENCE",
      `Observed ${missedBenchmarkTasks.length} missed benchmark items, ${feedbackLog.length} feedback events, and ${overlaps.length} redundant skill pairs.`,
    ),
  };
}

/**
 * 2. Validates a candidate skill/trigger override through HOL Guard security gates.
 */
function validateCandidateSecurity(candidate = {}) {
  const issues = [];
  const overrides = Array.isArray(candidate.skillOverrides) ? candidate.skillOverrides : [];

  for (const ov of overrides) {
    const entryCheck = validateRegistryEntrySafety({
      id: ov.id || "candidate-skill",
      title: ov.name || ov.id,
      description: ov.description || "",
      body: ov.body || (Array.isArray(ov.addTags) ? ov.addTags.join(" ") : ""),
    });
    if (!entryCheck.safe) {
      issues.push(...entryCheck.findings);
    }

    const texts = [
      ov.description || "",
      ov.body || "",
      ...(Array.isArray(ov.addTags) ? ov.addTags : []),
      ...(Array.isArray(ov.addTriggers) ? ov.addTriggers : []),
    ];
    for (const t of texts) {
      const inj = detectPromptInjection(String(t));
      if (!inj.safe) issues.push(...inj.findings);
      const cmd = detectDangerousMachineCommands(String(t));
      if (!cmd.safe) issues.push(...cmd.findings);
      const sec = redactAndScanSecrets(String(t));
      if (sec.hasSecrets) issues.push(...sec.findings);
    }
  }

  if (candidate.newSkillCandidate) {
    const ns = candidate.newSkillCandidate;
    const entryCheck = validateRegistryEntrySafety({
      id: ns.id,
      title: ns.name || ns.id,
      description: ns.description,
      body: ns.body || "",
    });
    if (!entryCheck.safe) issues.push(...entryCheck.findings);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * 3. Forms an in-memory mutated catalog view applying candidate metadata/tags
 *    without writing any workspace file.
 */
function buildCandidateCatalog(catalog, skillOverrides = [], newSkillCandidate = null) {
  const overrideMap = new Map();
  for (const ov of skillOverrides) {
    if (ov && ov.id) overrideMap.set(ov.id, ov);
  }

  const nextSkills = (catalog.skills || []).map((skill) => {
    const ov = overrideMap.get(skill.id);
    if (!ov) return skill;
    const mergedTags = Array.from(
      new Set([...(skill.tags || []), ...(ov.addTags || []), ...(ov.addTriggers || [])]),
    );
    return {
      ...skill,
      description: ov.description ? `${skill.description} ${ov.description}` : skill.description,
      tags: mergedTags,
    };
  });

  if (newSkillCandidate && newSkillCandidate.id && !overrideMap.has(newSkillCandidate.id)) {
    nextSkills.push({
      id: newSkillCandidate.id,
      name: newSkillCandidate.name || newSkillCandidate.id,
      description: newSkillCandidate.description || "",
      category: newSkillCandidate.category || "engineering",
      risk: newSkillCandidate.risk || "safe",
      tags: newSkillCandidate.tags || [],
    });
  }

  return {
    ...catalog,
    skills: nextSkills,
  };
}

/**
 * Runs a complete sandboxed Observe -> Improve -> Evaluate -> Security Review -> PR Draft cycle.
 */
function runImprovementCycle(options = {}) {
  const dataset = loadEvaluationDataset(options);
  const feedbackLog = Array.isArray(options.feedbackLog) ? options.feedbackLog : [];
  const observations = analyzeWeaknesses({
    catalog: dataset.catalog,
    feedbackLog,
    benchmarkReport: options.benchmarkReport || null,
  });

  // Candidate overrides: caller-supplied experiment OR synthesized trigger boost from missed tasks/feedback
  const skillOverrides = Array.isArray(options.skillOverrides) ? options.skillOverrides : [];
  const synthesizedOverrides = [...skillOverrides];
  if (synthesizedOverrides.length === 0 && feedbackLog.length > 0) {
    for (const fb of feedbackLog.slice(0, 3)) {
      if (fb.targetSkillId && Array.isArray(fb.suggestedTags) && fb.suggestedTags.length > 0) {
        synthesizedOverrides.push({
          id: fb.targetSkillId,
          addTags: fb.suggestedTags,
          description: fb.rationale || "",
        });
      }
    }
  }

  const candidate = {
    id: `cand-${crypto.randomBytes(4).toString("hex")}`,
    hypothesis:
      options.hypothesis ||
      (synthesizedOverrides.length > 0
        ? `Enrich trigger/domain tags on ${synthesizedOverrides.length} targeted skill(s) observed in failure logs.`
        : "Baseline evaluation probe without metadata mutations."),
    skillOverrides: synthesizedOverrides,
    newSkillCandidate: options.newSkillCandidate || null,
  };

  // Security review BEFORE or alongside experiment (never allows unsafe payload into PR draft)
  const securityReview = validateCandidateSecurity(candidate);
  if (!securityReview.passed) {
    return {
      schema: "rei.improvement-cycle.v1",
      candidateId: candidate.id,
      decision: "REJECTED_SECURITY",
      promoted: false,
      automaticWrites: false,
      autoMerge: false,
      autoPublish: false,
      hypothesis: candidate.hypothesis,
      observations,
      securityReview,
      comparison: null,
      prDraft: null,
      regressionTestsSuggested: [],
      provenance: [
        tagProvenance(
          "EVIDENCE",
          `Candidate ${candidate.id} rejected by HOL Guard security scan (${securityReview.issues.length} issue(s)).`,
        ),
      ],
    };
  }

  // Baseline evaluation on dev + held-out eval splits
  const baselineMetrics = evaluateDevAndHeldOut({
    ...options,
    catalog: dataset.catalog,
    bundles: dataset.bundles,
    workflows: dataset.workflows,
    engine: "hybrid",
  });

  // Evaluate candidate in memory (zero disk mutation)
  const candidateCatalog = buildCandidateCatalog(
    dataset.catalog,
    candidate.skillOverrides,
    candidate.newSkillCandidate,
  );
  // Pre-warm optional candidate recommend wrapper supporting explicit trigger affinity
  const candidateRecommendFn =
    options.candidateRecommendFn ||
    ((cat, bundles, workflows, opts) => {
      const rec = recommendForTask(cat, bundles, workflows, opts);
      // If a custom semantic scorer hook is provided for sandboxed tests, apply bounded re-rank
      if (typeof options.candidatePostScorer === "function") {
        return options.candidatePostScorer(rec, opts, candidateCatalog);
      }
      return rec;
    });

  const candidateMetrics = evaluateDevAndHeldOut({
    ...options,
    catalog: candidateCatalog,
    bundles: dataset.bundles,
    workflows: dataset.workflows,
    engine: "hybrid",
    recommendFn: candidateRecommendFn,
  });

  const comparison = compareBenchmarkRuns(baselineMetrics, candidateMetrics, options.thresholds || {});

  // Build reproducible regression tests from observed failures
  const regressionTestsSuggested = observations.missedBenchmarkTasks.slice(0, 3).map((m) => ({
    id: `reg-${m.id || "task"}`,
    task: m.task,
    expectedSkills: m.expected || [],
    note: "Add to dev/regression suite after human review",
  }));

  if (!comparison.promoted) {
    return {
      schema: "rei.improvement-cycle.v1",
      candidateId: candidate.id,
      decision: "REJECTED_NO_BENEFIT_OR_REGRESSION",
      promoted: false,
      automaticWrites: false,
      autoMerge: false,
      autoPublish: false,
      hypothesis: candidate.hypothesis,
      observations,
      securityReview,
      baselineMetrics,
      candidateMetrics,
      comparison,
      prDraft: null,
      regressionTestsSuggested,
      provenance: [
        tagProvenance(
          "EVIDENCE",
          `Candidate ${candidate.id} rejected: ${comparison.regressionReasons.join("; ")}`,
        ),
      ],
    };
  }

  const branchName = `chore/improve-${candidate.id}`;
  const prDraft = {
    requiresHumanApproval: true,
    autoMerge: false,
    autoPublish: false,
    suggestedBranch: branchName,
    title: `Improve routing metadata (${candidate.id}): Eval Recall@3 ${(candidateMetrics.eval.recallAt3 * 100).toFixed(2)}%`,
    body: [
      "## Automated Discovery & Sandboxed Experiment Summary",
      `- **Hypothesis:** ${candidate.hypothesis}`,
      `- **Dev Recall@3:** ${(baselineMetrics.dev.recallAt3 * 100).toFixed(2)}% -> ${(candidateMetrics.dev.recallAt3 * 100).toFixed(2)}%`,
      `- **Held-Out Eval Recall@3:** ${(baselineMetrics.eval.recallAt3 * 100).toFixed(2)}% -> ${(candidateMetrics.eval.recallAt3 * 100).toFixed(2)}%`,
      `- **Held-Out Eval MRR:** ${baselineMetrics.eval.mrr} -> ${candidateMetrics.eval.mrr}`,
      `- **Critical-Risk Misrouting:** ${candidateMetrics.eval.criticalRiskMisroutingCount}`,
      `- **HOL Guard Security Review:** PASSED`,
      "",
      "## Rollback Plan",
      `Revert commit on branch \`${branchName}\` and re-run \`npm run build && npm test\`.`,
    ].join("\n"),
    candidateOverrides: candidate.skillOverrides,
    regressionTestsSuggested,
    embeddingSignatureDim: buildDenseEmbedding(candidate.hypothesis).length,
  };

  return {
    schema: "rei.improvement-cycle.v1",
    candidateId: candidate.id,
    decision: "PROPOSED_PR_DRAFT",
    promoted: true,
    automaticWrites: false,
    autoMerge: false,
    autoPublish: false,
    hypothesis: candidate.hypothesis,
    observations,
    securityReview,
    baselineMetrics,
    candidateMetrics,
    comparison,
    prDraft,
    regressionTestsSuggested,
    provenance: [
      tagProvenance(
        "EVIDENCE",
        `Candidate ${candidate.id} improved dev/eval metrics with zero regressions and passed HOL Guard review.`,
      ),
    ],
  };
}

module.exports = {
  analyzeWeaknesses,
  validateCandidateSecurity,
  buildCandidateCatalog,
  runImprovementCycle,
};
