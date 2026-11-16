#!/usr/bin/env node
"use strict";

/**
 * Evaluates both the legacy fallback router and the Hybrid Semantic Router
 * against `data/benchmarks/routing-benchmark-v1.json` and writes
 * `data/benchmarks/routing-evaluation-report.json`.
 */
const fs = require("node:fs");
const path = require("node:path");
const { measureRouter } = require("./measure-baseline");

const ROOT = path.resolve(__dirname, "..");
const REPORT_PATH = path.join(ROOT, "data", "benchmarks", "routing-evaluation-report.json");

function compareSplits(baseline, hybrid) {
  const delta = {};
  for (const splitName of ["train", "dev", "eval", "all"]) {
    const b = baseline.splits[splitName];
    const h = hybrid.splits[splitName];
    delta[splitName] = {
      recallAt3Delta: Number((h.recallAt3 - b.recallAt3).toFixed(4)),
      mrrDelta: Number((h.mrr - b.mrr).toFixed(4)),
      ndcgAt5Delta: Number((h.ndcgAt5 - b.ndcgAt5).toFixed(4)),
      falsePositiveRateDelta: Number((h.falsePositiveRate - b.falsePositiveRate).toFixed(4)),
      criticalRiskMisroutingDelta: h.criticalRiskMisroutingCount - b.criticalRiskMisroutingCount,
      p95LatencyRatio: b.latencyMs.p95 > 0 ? Number((h.latencyMs.p95 / b.latencyMs.p95).toFixed(3)) : 1,
    };
  }
  return delta;
}

function runEvaluation() {
  const legacyReport = measureRouter("legacy");
  const hybridReport = measureRouter("hybrid");
  const delta = compareSplits(legacyReport, hybridReport);

  const evalMetrics = hybridReport.splits.eval;
  const targetsMet = {
    evalRecallAt3Gte85Pct: evalMetrics.recallAt3 >= 0.85,
    criticalRiskMisroutingZero: evalMetrics.criticalRiskMisroutingCount === 0,
    noFalsePositiveRegression: evalMetrics.falsePositiveRate <= legacyReport.splits.eval.falsePositiveRate,
  };

  const fullReport = {
    schemaVersion: "rei.routing-comparison.v1",
    evaluatedAt: new Date().toISOString(),
    benchmarkPath: "data/benchmarks/routing-benchmark-v1.json",
    totalTasks: hybridReport.totalTasks,
    targetsMet,
    legacy: legacyReport.splits,
    hybrid: hybridReport.splits,
    delta,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(fullReport, null, 2) + "\n", "utf8");
  return fullReport;
}

if (require.main === module) {
  const report = runEvaluation();
  console.log("=== REI Skills Hybrid Router vs Legacy Baseline ===");
  for (const splitName of ["train", "dev", "eval", "all"]) {
    const b = report.legacy[splitName];
    const h = report.hybrid[splitName];
    console.log(
      `[${splitName}] Legacy R@3=${(b.recallAt3 * 100).toFixed(2)}% FPR=${(b.falsePositiveRate * 100).toFixed(1)}% p95=${b.latencyMs.p95}ms` +
      `  -->  Hybrid R@3=${(h.recallAt3 * 100).toFixed(2)}% MRR=${h.mrr.toFixed(4)} nDCG@5=${h.ndcgAt5.toFixed(4)} FPR=${(h.falsePositiveRate * 100).toFixed(1)}% Crit=${h.criticalRiskMisroutingCount} p95=${h.latencyMs.p95}ms`
    );
  }
  console.log("Targets:", report.targetsMet);
  if (!report.targetsMet.evalRecallAt3Gte85Pct || !report.targetsMet.criticalRiskMisroutingZero) {
    process.exitCode = 1;
  }
}

module.exports = { runEvaluation };
