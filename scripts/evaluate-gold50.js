#!/usr/bin/env node
"use strict";

/**
 * Runs deterministic functional evaluation over the 50 Gold engineering skills
 * (`data/gold50-manifest.json`):
 * - 150 positive scenarios (checks Top-3 routing precision & recall)
 * - 100 negative/unrelated trigger checks (ensures zero false activations and safeOnly protection)
 * - 50 intended adapter transpilation & skill-loading checks
 *
 * Writes `data/benchmarks/gold50-evaluation-report.json`.
 */

const fs = require("fs");
const path = require("path");
const { recommendForTask } = require("../lib/smart-router");
const { transpileSkillContent, AI_TARGETS } = require("../lib/ai-adapters");
const { evaluateEngineeringAdapter } = require("../lib/engineering-adapters");
const { evaluateSkillQuality } = require("../lib/quality-engine");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "gold50-manifest.json");
const CATALOG_PATH = path.join(ROOT, "data", "catalog.json");
const BUNDLES_PATH = path.join(ROOT, "data", "bundles.json");
const WORKFLOWS_PATH = path.join(ROOT, "data", "workflows.json");
const REPORT_OUT = path.join(ROOT, "data", "benchmarks", "gold50-evaluation-report.json");

function evaluateGold50() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const bundles = JSON.parse(fs.readFileSync(BUNDLES_PATH, "utf8"));
  const workflows = JSON.parse(fs.readFileSync(WORKFLOWS_PATH, "utf8"));
  const catalogMap = new Map((catalog.skills || []).map((s) => [s.id, s]));

  let positiveTotal = 0;
  let positivePassed = 0;
  let negativeTotal = 0;
  let negativePassed = 0;
  let adapterTotal = 0;
  let adapterPassed = 0;

  const skillResults = [];
  const failures = [];

  for (const entry of manifest.skills) {
    const skillMeta = catalogMap.get(entry.id) || {};
    const skillMdPath = path.join(ROOT, skillMeta.path || `skills/${entry.id}/SKILL.md`);
    const skillDir = path.dirname(skillMdPath);
    const rawMd = fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, "utf8") : "";

    let skillPosPass = 0;
    for (const sc of entry.evaluationScenarios) {
      positiveTotal++;
      const res = recommendForTask(catalog, bundles, workflows, {
        task: sc.task,
        files: sc.files || [],
        safeOnly: false,
        maxResults: 5,
      });
      const top3Ids = (res.recommendedSkills || []).slice(0, 3).map((s) => s.id);
      if (top3Ids.includes(sc.expectedSkillId)) {
        positivePassed++;
        skillPosPass++;
      } else {
        failures.push({
          type: "positive_miss",
          skillId: entry.id,
          scenarioId: sc.scenarioId,
          gotTop3: top3Ids,
        });
      }
    }

    let skillNegPass = 0;
    for (const nc of entry.negativeTriggerCases) {
      negativeTotal++;
      const res = recommendForTask(catalog, bundles, workflows, {
        task: nc.task,
        files: nc.files || [],
        safeOnly: Boolean(nc.safeOnly),
        maxResults: 3,
      });
      const topIds = (res.recommendedSkills || []).map((s) => s.id);
      const isUncertain = res.uncertainty && res.uncertainty.state === "high_uncertainty_or_out_of_scope";
      const safeViolation = nc.safeOnly && (res.recommendedSkills || []).some((s) => s.risk === "critical" || s.risk === "offensive");
      const ok = !topIds.includes(nc.mustNotActivateId) && !safeViolation && (nc.safeOnly ? isUncertain || !topIds.includes(nc.mustNotActivateId) : true);
      if (ok) {
        negativePassed++;
        skillNegPass++;
      } else {
        failures.push({
          type: "negative_false_activation",
          skillId: entry.id,
          caseId: nc.caseId,
          gotTop3: topIds,
        });
      }
    }

    // Intended AI adapter transpilation check
    adapterTotal++;
    let adapterOk = false;
    try {
      const targetSpec = AI_TARGETS[entry.intendedAdapter];
      if (!targetSpec) throw new Error(`Unknown target adapter ${entry.intendedAdapter}`);
      const fmt = targetSpec.format === "cursor-hybrid" ? "cursor-mdc" : targetSpec.format;
      const transpiled = transpileSkillContent(entry.id, rawMd, fmt, skillMeta);
      if (transpiled && transpiled.length > 50 && rawMd.length > 50) {
        adapterOk = true;
      } else {
        throw new Error(`Transpiled output too short for ${entry.intendedAdapter} (${fmt})`);
      }
    } catch (err) {
      failures.push({
        type: "adapter_transpile_error",
        skillId: entry.id,
        error: err.message,
      });
    }
    if (adapterOk) adapterPassed++;

    const passed = skillPosPass >= 2 && skillNegPass === entry.negativeTriggerCases.length && adapterOk;
    const qual = evaluateSkillQuality({
      id: entry.id,
      content: rawMd,
      metadata: skillMeta,
      schemaValid: Boolean(rawMd && skillMeta.name),
      referencesValid: true,
      securityCompliant: true,
      hasProgressiveReferences: fs.existsSync(path.join(skillDir, "references")),
      hasHelperScripts: fs.existsSync(path.join(skillDir, "scripts")),
      gold50Result: { passed },
      isBenchmarkCovered: true,
    });

    skillResults.push({
      id: entry.id,
      discipline: entry.discipline,
      intendedAdapter: entry.intendedAdapter,
      engineeringAdapter: entry.engineeringAdapter,
      positivePassed: skillPosPass,
      positiveTotal: entry.evaluationScenarios.length,
      negativePassed: skillNegPass,
      negativeTotal: entry.negativeTriggerCases.length,
      adapterTranspileOk: adapterOk,
      passed,
      qualityScore14: qual.qualityScore14,
      qualityTier: qual.qualityTier,
      verificationDimensions: qual.verificationDimensions,
    });
  }

  // Spot-check domain engineering adapters across all 5 adapters
  const domainAdapterChecks = {
    kicad: evaluateEngineeringAdapter("kicad", "planKicadVerification", { layerCount: 4 }).fabRulesPass,
    fusion360: evaluateEngineeringAdapter("fusion360", "convertFusionUnits", { value: 100, fromUnit: "mm", toUnit: "cm" }).output.value === 10,
    embedded: evaluateEngineeringAdapter("embedded", "parseJ1939CanId", { canId: "0x18FEF100" }).pgn === 65265,
    scientific: evaluateEngineeringAdapter("scientific", "verifyDimensionalConsistency", { lhs: "force", rhsTerms: [{ factors: [{ dim: "mass", power: 1 }, { dim: "acceleration", power: 1 }] }] }).consistent,
    industrial_measurement: evaluateEngineeringAdapter("industrial_measurement", "calculateSinglePlaneBalance", {
      initialVibration: { amplitude: 4, phaseDeg: 0 },
      trialWeightGrams: 10,
      trialAngleDeg: 0,
      trialVibration: { amplitude: Math.hypot(4, 2), phaseDeg: (Math.atan2(2, 4) * 180) / Math.PI },
    }).executionMode === "COMPUTATIONAL_ONLY",
  };

  const positivePassRate = positiveTotal ? Number((positivePassed / positiveTotal).toFixed(4)) : 0;
  const negativePassRate = negativeTotal ? Number((negativePassed / negativeTotal).toFixed(4)) : 0;
  const adapterPassRate = adapterTotal ? Number((adapterPassed / adapterTotal).toFixed(4)) : 0;
  const skillsPassedCount = skillResults.filter((s) => s.passed).length;

  const report = {
    schemaVersion: "rei.gold50-evaluation.v1",
    evaluatedAt: new Date().toISOString(),
    totalSkills: skillResults.length,
    skillsPassedCount,
    skillsPassRate: Number((skillsPassedCount / Math.max(1, skillResults.length)).toFixed(4)),
    positiveScenarios: { passed: positivePassed, total: positiveTotal, passRate: positivePassRate },
    negativeTriggers: { passed: negativePassed, total: negativeTotal, passRate: negativePassRate },
    adapterChecks: { passed: adapterPassed, total: adapterTotal, passRate: adapterPassRate },
    domainAdapterSpotChecks: domainAdapterChecks,
    targetGte95PctMet:
      positivePassRate >= 0.95 &&
      negativePassRate >= 0.95 &&
      adapterPassRate >= 0.95 &&
      skillsPassedCount / Math.max(1, skillResults.length) >= 0.95,
    failures: failures.slice(0, 20),
    skills: skillResults,
  };

  fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
  fs.writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

if (require.main === module) {
  const report = evaluateGold50();
  console.log(
    `Gold 50 Evaluation: skills=${report.skillsPassedCount}/${report.totalSkills} (${(report.skillsPassRate * 100).toFixed(1)}%) | ` +
      `pos=${report.positiveScenarios.passed}/${report.positiveScenarios.total} (${(report.positiveScenarios.passRate * 100).toFixed(1)}%) | ` +
      `neg=${report.negativeTriggers.passed}/${report.negativeTriggers.total} (${(report.negativeTriggers.passRate * 100).toFixed(1)}%) | ` +
      `adapters=${report.adapterChecks.passed}/${report.adapterChecks.total} | targetMet=${report.targetGte95PctMet}`,
  );
  if (!report.targetGte95PctMet) {
    process.exitCode = 1;
  }
}

module.exports = { evaluateGold50 };
