/**
 * Evaluation Engine & Non-Regression Gate (Phase G).
 *
 * Wraps benchmark split evaluation across `train`, `dev`, `eval` (held-out), and `all`,
 * and enforces quantitative non-regression invariants before promoting candidate skill or
 * routing changes.
 */

const fs = require("fs");
const path = require("path");
const { evaluateSplit } = require("../scripts/measure-baseline");
const { recommendForTask } = require("./smart-router");
const { ObservabilityRecorder, tagProvenance } = require("./observability");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BENCHMARK_PATH = path.join(ROOT, "data", "benchmarks", "routing-benchmark-v1.json");
const DEFAULT_CATALOG_PATH = path.join(ROOT, "data", "catalog.json");
const DEFAULT_BUNDLES_PATH = path.join(ROOT, "data", "bundles.json");
const DEFAULT_WORKFLOWS_PATH = path.join(ROOT, "data", "workflows.json");

function loadEvaluationDataset(options = {}) {
  const benchmarkPath = options.benchmarkPath || DEFAULT_BENCHMARK_PATH;
  const catalogPath = options.catalogPath || DEFAULT_CATALOG_PATH;
  const bundlesPath = options.bundlesPath || DEFAULT_BUNDLES_PATH;
  const workflowsPath = options.workflowsPath || DEFAULT_WORKFLOWS_PATH;

  return {
    benchmark: JSON.parse(fs.readFileSync(benchmarkPath, "utf8")),
    catalog: options.catalog || JSON.parse(fs.readFileSync(catalogPath, "utf8")),
    bundles: options.bundles || JSON.parse(fs.readFileSync(bundlesPath, "utf8")),
    workflows: options.workflows || JSON.parse(fs.readFileSync(workflowsPath, "utf8")),
  };
}

/**
 * Evaluates a router engine (`hybrid`, `legacy`, or custom function) on a chosen benchmark split.
 */
function evaluateBenchmarkSplit(options = {}) {
  const splitName = ["train", "dev", "eval", "all"].includes(options.split) ? options.split : "eval";
  const engineLabel = options.engine || "hybrid";
  const recommendFn = options.recommendFn || recommendForTask;
  const dataset = loadEvaluationDataset(options);
  const recorder = options.recorder || new ObservabilityRecorder();

  const tasks = dataset.benchmark.tasks || [];
  const filtered = splitName === "all" ? tasks : tasks.filter((t) => t.split === splitName);

  const span = recorder.startSpan(`evaluate:${engineLabel}:${splitName}`, null, {
    taskCount: filtered.length,
  });
  const metrics = evaluateSplit(
    filtered,
    recommendFn,
    dataset.catalog,
    dataset.bundles,
    dataset.workflows,
    engineLabel,
  );
  span.finish("ok", { recallAt3: metrics.recallAt3, fpr: metrics.falsePositiveRate });

  return {
    split: splitName,
    engine: engineLabel,
    taskCount: filtered.length,
    metrics,
    provenance: tagProvenance(
      "EVIDENCE",
      `Measured ${engineLabel} router across ${filtered.length} '${splitName}' benchmark tasks.`,
      path.relative(ROOT, options.benchmarkPath || DEFAULT_BENCHMARK_PATH).replace(/\\/g, "/"),
    ),
  };
}

/**
 * Evaluates both `dev` and held-out `eval` splits (kept separate from `train` to avoid overfitting).
 */
function evaluateDevAndHeldOut(options = {}) {
  const devResult = evaluateBenchmarkSplit({ ...options, split: "dev" });
  const evalResult = evaluateBenchmarkSplit({ ...options, split: "eval" });
  return {
    dev: devResult.metrics,
    eval: evalResult.metrics,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Compares candidate benchmark metrics against a baseline and verifies promotion criteria.
 * Rejects candidates unless measurable improvement exists WITHOUT regressing safety,
 * false-positive rate, or held-out Recall@3.
 */
function compareBenchmarkRuns(baseline, candidate, options = {}) {
  const minEvalRecallAt3 = Number(options.minEvalRecallAt3 ?? 0.85);
  const maxAllowedDevDrop = Number(options.maxAllowedDevDrop ?? 0.02);

  const baseDev = baseline.dev || baseline;
  const baseEval = baseline.eval || baseline;
  const candDev = candidate.dev || candidate;
  const candEval = candidate.eval || candidate;

  const evalRecallDelta = Number((candEval.recallAt3 - baseEval.recallAt3).toFixed(4));
  const evalMrrDelta = Number((candEval.mrr - baseEval.mrr).toFixed(4));
  const evalNdcgDelta = Number((candEval.ndcgAt5 - baseEval.ndcgAt5).toFixed(4));
  const evalFprDelta = Number((candEval.falsePositiveRate - baseEval.falsePositiveRate).toFixed(4));
  const devRecallDelta = Number((candDev.recallAt3 - baseDev.recallAt3).toFixed(4));
  const devMrrDelta = Number((candDev.mrr - baseDev.mrr).toFixed(4));
  const critDelta = candEval.criticalRiskMisroutingCount - baseEval.criticalRiskMisroutingCount;

  const regressionReasons = [];
  if (candEval.recallAt3 < minEvalRecallAt3) {
    regressionReasons.push(`Held-out eval Recall@3 (${candEval.recallAt3}) < floor (${minEvalRecallAt3})`);
  }
  if (candEval.criticalRiskMisroutingCount > 0 || critDelta > 0) {
    regressionReasons.push(
      `Critical-risk misrouting increased or non-zero (${candEval.criticalRiskMisroutingCount})`,
    );
  }
  if (evalFprDelta > 0) {
    regressionReasons.push(`Held-out eval FPR increased by ${evalFprDelta}`);
  }
  if (evalRecallDelta < -0.005) {
    regressionReasons.push(`Held-out eval Recall@3 regressed (${evalRecallDelta})`);
  }
  if (devRecallDelta < -maxAllowedDevDrop) {
    regressionReasons.push(`Dev Recall@3 regressed (${devRecallDelta})`);
  }

  // Improvement requires strict measured gain on dev or eval without regressions
  const measuredBenefit =
    evalRecallDelta > 0 ||
    evalMrrDelta >= 0.002 ||
    evalNdcgDelta >= 0.002 ||
    devRecallDelta > 0 ||
    devMrrDelta >= 0.002 ||
    evalFprDelta < 0 ||
    candEval.failureCount < baseEval.failureCount;

  if (!measuredBenefit) {
    regressionReasons.push("No measurable quantitative benefit over baseline on dev/eval datasets");
  }

  return {
    promoted: regressionReasons.length === 0 && measuredBenefit,
    measuredBenefit,
    regressionReasons,
    deltas: {
      devRecallAt3Delta: devRecallDelta,
      devMrrDelta,
      evalRecallAt3Delta: evalRecallDelta,
      evalMrrDelta,
      evalNdcgAt5Delta: evalNdcgDelta,
      evalFalsePositiveRateDelta: evalFprDelta,
      criticalRiskMisroutingDelta: critDelta,
    },
  };
}

module.exports = {
  loadEvaluationDataset,
  evaluateBenchmarkSplit,
  evaluateDevAndHeldOut,
  compareBenchmarkRuns,
};
