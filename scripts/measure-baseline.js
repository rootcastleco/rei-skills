#!/usr/bin/env node
"use strict";

/**
 * Measures routing metrics (Recall@3, MRR, nDCG@5, False Positive Rate,
 * Critical-Risk Misrouting, Latency p50/p95, and Heap Memory Delta) for a router
 * against `data/benchmarks/routing-benchmark-v1.json`.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "catalog.json");
const BUNDLES_PATH = path.join(ROOT, "data", "bundles.json");
const WORKFLOWS_PATH = path.join(ROOT, "data", "workflows.json");
const BENCHMARK_PATH = path.join(ROOT, "data", "benchmarks", "routing-benchmark-v1.json");
const BASELINE_OUT = path.join(ROOT, "data", "benchmarks", "baseline-report.json");

function computeNdcgAtK(recommendedIds, expectedSet, k = 5) {
  if (expectedSet.size === 0) return null;
  let dcg = 0;
  const topK = recommendedIds.slice(0, k);
  for (let i = 0; i < topK.length; i++) {
    if (expectedSet.has(topK[i])) {
      dcg += 1 / Math.log2(i + 2);
    }
  }
  const idealHits = Math.min(expectedSet.size, k);
  let idcg = 0;
  for (let i = 0; i < idealHits; i++) {
    idcg += 1 / Math.log2(i + 2);
  }
  return idcg > 0 ? dcg / idcg : 0;
}

function evaluateSplit(tasks, recommendFn, catalog, bundles, workflows, engineLabel) {
  const latenciesMs = [];
  const memBefore = process.memoryUsage().heapUsed;

  let positiveCount = 0;
  let recallAt3Hits = 0;
  let recallAt3MicroSum = 0;
  let mrrSum = 0;
  let ndcg5Sum = 0;

  let negativeCount = 0;
  let negativeFalsePositives = 0;

  let safetyCount = 0;
  let safetyViolations = 0;

  const perQueryType = {};
  const failures = [];

  for (const item of tasks) {
    const start = process.hrtime.bigint();
    const res = recommendFn(catalog, bundles, workflows, {
      task: item.task,
      files: item.files,
      safeOnly: item.safeOnly,
      maxResults: 8,
      engine: engineLabel,
    });
    const end = process.hrtime.bigint();
    latenciesMs.push(Number(end - start) / 1e6);

    const rec = res.recommendedSkills || [];
    const recIds = rec.map((r) => r.id);
    const expectedSet = new Set(item.expectedSkills || []);

    const qt = item.queryType;
    if (!perQueryType[qt]) {
      perQueryType[qt] = { count: 0, recallAt3Hits: 0, mrrSum: 0, ndcg5Sum: 0 };
    }
    perQueryType[qt].count++;

    if (item.safeOnly) {
      safetyCount++;
      const violated = rec.some((r) => r.risk === "critical" || r.risk === "offensive");
      if (violated) {
        safetyViolations++;
      }
    }

    if (expectedSet.size > 0) {
      positiveCount++;
      const top3 = recIds.slice(0, 3);
      const hitInTop3 = top3.some((id) => expectedSet.has(id));
      const matchedCountTop3 = top3.filter((id) => expectedSet.has(id)).length;
      const itemRecall3 = matchedCountTop3 / Math.min(3, expectedSet.size);

      if (hitInTop3) {
        recallAt3Hits++;
        perQueryType[qt].recallAt3Hits++;
      } else {
        failures.push({
          id: item.id,
          queryType: item.queryType,
          task: item.task,
          expected: item.expectedSkills,
          gotTop3: top3,
        });
      }
      recallAt3MicroSum += itemRecall3;

      let rr = 0;
      for (let i = 0; i < recIds.length; i++) {
        if (expectedSet.has(recIds[i])) {
          rr = 1 / (i + 1);
          break;
        }
      }
      mrrSum += rr;
      perQueryType[qt].mrrSum += rr;

      const ndcg = computeNdcgAtK(recIds, expectedSet, 5);
      ndcg5Sum += ndcg;
      perQueryType[qt].ndcg5Sum += ndcg;
    } else {
      negativeCount++;
      // False positive if router emits a confident non-uncertain recommendation on out-of-scope query
      const isUncertain = res.uncertainty && res.uncertainty.state === "high_uncertainty_or_out_of_scope";
      const topConf = rec.length > 0 ? rec[0].confidence : 0;
      if (!isUncertain && rec.length > 0 && topConf >= 35) {
        negativeFalsePositives++;
        failures.push({
          id: item.id,
          queryType: item.queryType,
          task: item.task,
          expected: [],
          gotTop3: recIds.slice(0, 3),
          topConfidence: topConf,
        });
      }
    }
  }

  const memAfter = process.memoryUsage().heapUsed;
  const sortedLat = [...latenciesMs].sort((a, b) => a - b);
  const p50 = sortedLat.length ? sortedLat[Math.floor(sortedLat.length * 0.5)] : 0;
  const p95 = sortedLat.length ? sortedLat[Math.min(sortedLat.length - 1, Math.floor(sortedLat.length * 0.95))] : 0;
  const meanLat = sortedLat.length ? sortedLat.reduce((a, b) => a + b, 0) / sortedLat.length : 0;

  const queryTypeBreakdown = {};
  for (const [qt, stats] of Object.entries(perQueryType)) {
    queryTypeBreakdown[qt] = {
      count: stats.count,
      recallAt3HitRate: qt === "negative_out_of_scope" ? null : Number((stats.recallAt3Hits / stats.count).toFixed(4)),
      mrr: qt === "negative_out_of_scope" ? null : Number((stats.mrrSum / stats.count).toFixed(4)),
      ndcgAt5: qt === "negative_out_of_scope" ? null : Number((stats.ndcg5Sum / stats.count).toFixed(4)),
    };
  }

  return {
    totalTasks: tasks.length,
    positiveTasks: positiveCount,
    negativeTasks: negativeCount,
    safetyTasks: safetyCount,
    recallAt3: positiveCount ? Number((recallAt3Hits / positiveCount).toFixed(4)) : 0,
    recallAt3Fractional: positiveCount ? Number((recallAt3MicroSum / positiveCount).toFixed(4)) : 0,
    mrr: positiveCount ? Number((mrrSum / positiveCount).toFixed(4)) : 0,
    ndcgAt5: positiveCount ? Number((ndcg5Sum / positiveCount).toFixed(4)) : 0,
    falsePositiveRate: negativeCount ? Number((negativeFalsePositives / negativeCount).toFixed(4)) : 0,
    criticalRiskMisroutingRate: safetyCount ? Number((safetyViolations / safetyCount).toFixed(4)) : 0,
    criticalRiskMisroutingCount: safetyViolations,
    latencyMs: {
      p50: Number(p50.toFixed(3)),
      p95: Number(p95.toFixed(3)),
      mean: Number(meanLat.toFixed(3)),
    },
    memoryDeltaMb: Number(((memAfter - memBefore) / (1024 * 1024)).toFixed(3)),
    queryTypeBreakdown,
    sampleFailures: failures.slice(0, 15),
    failureCount: failures.length,
  };
}

function measureRouter(engineLabel = "legacy") {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const bundles = JSON.parse(fs.readFileSync(BUNDLES_PATH, "utf8"));
  const workflows = JSON.parse(fs.readFileSync(WORKFLOWS_PATH, "utf8"));
  const benchmark = JSON.parse(fs.readFileSync(BENCHMARK_PATH, "utf8"));
  const { recommendForTask } = require("../lib/smart-router");

  const splits = {};
  for (const splitName of ["train", "dev", "eval"]) {
    const subset = benchmark.tasks.filter((t) => t.split === splitName);
    splits[splitName] = evaluateSplit(subset, recommendForTask, catalog, bundles, workflows, engineLabel);
  }
  splits.all = evaluateSplit(benchmark.tasks, recommendForTask, catalog, bundles, workflows, engineLabel);

  return {
    schemaVersion: "rei.routing-evaluation.v1",
    measuredAt: new Date().toISOString(),
    engine: engineLabel,
    benchmarkPath: "data/benchmarks/routing-benchmark-v1.json",
    totalTasks: benchmark.totalTasks,
    splits,
  };
}

if (require.main === module) {
  const report = measureRouter("legacy");
  fs.mkdirSync(path.dirname(BASELINE_OUT), { recursive: true });
  fs.writeFileSync(BASELINE_OUT, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log("Baseline Legacy Router Evaluation:");
  for (const splitName of ["train", "dev", "eval", "all"]) {
    const s = report.splits[splitName];
    console.log(
      `  [${splitName}] Recall@3=${(s.recallAt3 * 100).toFixed(2)}% | ` +
      `MRR=${s.mrr.toFixed(4)} | nDCG@5=${s.ndcgAt5.toFixed(4)} | ` +
      `FPR=${(s.falsePositiveRate * 100).toFixed(2)}% | ` +
      `CritMisroute=${s.criticalRiskMisroutingCount} | p95=${s.latencyMs.p95}ms`
    );
  }
}

module.exports = { computeNdcgAtK, evaluateSplit, measureRouter };
