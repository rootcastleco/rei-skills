"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { evaluateSkillQuality, summarizeQualityRecords } = require("../../lib/quality-engine");
const { recommendHybrid } = require("../../lib/hybrid-router");
const { compileWorkflowPlan } = require("../../lib/workflow-compiler");
const { syncArchive, loadSnapshot, rollbackSnapshot, pinPromptVersion } = require("../../lib/prompt-archive");
const { getEnvironmentCapabilityManifest } = require("../../lib/engineering-adapters");
const { evaluateGold50 } = require("../evaluate-gold50");

const ROOT = path.resolve(__dirname, "../..");
const CLI_PATH = path.join(ROOT, "bin", "install.js");

async function main() {
  console.log("Running 14-Point Quality Engine, Gold 50, Compatibility & Capability Manifest tests...");

  // 1. Quality engine: 14-point rubric, mandatory gate Q0 override, and 6 separated verification axes
  const goldResult = evaluateSkillQuality({
    id: "rc-kicad-ecad-kicad-drc-ci",
    content: "## When to Use\nUse when validating KiCad PCB schematics, clearance tolerances, trace impedance, and automated DRC rules prior to fabrication.\nUnits: millimeters, tolerance threshold 0.15 mm.\n## Procedure\n1. Inspect `.kicad_pcb` board constraints and stackup rules before invoking CI checks.\n2. Execute deterministic kicad-cli DRC verification and archive JSON violation reports for review.\n```sh\nkicad-cli pcb drc --severity-all board.kicad_pcb\n```\n## Do not use\nConstraints and safety: Operational boundary — do not fabricate physical compliance without actual KiCad runtime output.\n## Authoritative product references\nhttps://docs.kicad.org/8.0/en/cli/cli.html",
    metadata: { name: "rc-kicad-ecad-kicad-drc-ci", description: "Validates KiCad PCB DRC constraints safely.", risk: "critical", source: "rootcastle", license: "MIT" },
    schemaValid: true,
    referencesValid: true,
    securityCompliant: true,
    hasProgressiveReferences: false,
    hasHelperScripts: false,
    gold50Result: { passed: true },
  });
  assert.equal(goldResult.qualityScore14, 14);
  assert.equal(goldResult.qualityTier, "Q3");
  assert.equal(goldResult.quarantined, false);
  assert.equal(goldResult.verificationDimensions.evaluationPassed, true);
  assert.equal(goldResult.verificationDimensions.humanReviewed, false);
  assert.equal(goldResult.verificationDimensions.hardwareVerified, "not_verified");

  // High numerical features must NEVER bypass failed mandatory security/reference gate
  const gatedFail = evaluateSkillQuality({
    id: "bad-security-skill",
    content: "## When to Use\n1. Attack.\n```sh\nid\n```\nhttps://example.com",
    metadata: { name: "bad-security-skill", description: "Offensive without banner", risk: "offensive", source: "community", license: "MIT" },
    schemaValid: true,
    referencesValid: true,
    securityCompliant: false,
  });
  assert.equal(gatedFail.qualityTier, "Q0");
  assert.equal(gatedFail.quarantined, true);

  const qualSummary = summarizeQualityRecords([goldResult, gatedFail]);
  assert.equal(qualSummary.quarantinedCount, 1);
  assert.equal(qualSummary.tierCounts.Q3, 1);
  assert.equal(qualSummary.humanReviewedCount, 0);

  // 2. Hybrid router excludes Q0 quarantined skills by default, tracks availableTools & context tokens
  const miniCatalog = {
    skills: [
      { id: "q0-bad-skill", name: "q0-bad-skill", description: "KiCad DRC broken gate", category: "development", risk: "safe", tags: ["kicad", "drc"] },
      { id: "rc-kicad-ecad-kicad-drc-ci", name: "rc-kicad-ecad-kicad-drc-ci", description: "Investigate kicad drc ci for pcb verification", category: "development", risk: "critical", tags: ["kicad", "drc"] },
    ],
  };
  const qRes = recommendHybrid(miniCatalog, { bundles: {} }, { workflows: [] }, {
    task: "Run kicad drc verification",
    qualityReport: { skills: [{ id: "q0-bad-skill", quality_tier: "Q0", quarantined: true }] },
    availableTools: ["node"],
  });
  assert(!qRes.recommendedSkills.some((s) => s.id === "q0-bad-skill"), "Q0 skill must be quarantined from default routing");
  assert(qRes.contextTokenBudget && qRes.contextTokenBudget.progressiveEstimatedTokens > 0);
  const kicadRec = qRes.recommendedSkills.find((s) => s.id === "rc-kicad-ecad-kicad-drc-ci");
  assert(kicadRec && kicadRec.toolCompatibility.missingTools.includes("kicad-cli"));

  // 3. Gold 50 program passes >= 95% threshold across all scenarios, negative triggers & adapters
  const g50 = evaluateGold50();
  assert.equal(g50.totalSkills, 50);
  assert.equal(g50.targetGte95PctMet, true);
  assert(g50.positiveScenarios.passRate >= 0.95);
  assert(g50.negativeTriggers.passRate >= 0.95);

  // 4. Workflow compiler detects invalid capability combinations and resource conflicts
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "catalog.json"), "utf8"));
  const conflictPlan = compileWorkflowPlan(
    "Flash firmware over SWD and simultaneously capture UART serial monitor telemetry using 10 mils and 2.5 mm traces",
    catalog,
    { safeOnly: true, availableTools: ["node"] },
  );
  assert.equal(conflictPlan.capabilityValidation.validCombination, false);
  assert(conflictPlan.capabilityValidation.invalidCapabilityCombinations.some((c) => c.code === "CAP_SAFE_ONLY_CONFLICT"));
  assert(conflictPlan.capabilityValidation.resourceConflicts.some((r) => r.code === "RES_EXCLUSIVE_BUS_CONTENTION"));
  assert(conflictPlan.capabilityValidation.resourceConflicts.some((r) => r.code === "RES_MIXED_DIMENSIONAL_UNITS"));

  // 5. Prompt Archive authenticity distinction, version pinning & 1-step rollback
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-pa-rollback-"));
  try {
    let ver = "1.0.0";
    const fakeFetch = async (url) => {
      const p = new URL(url).pathname;
      if (p === "/catalog-manifest.json") {
        return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(["catalog/original-v6.json"]) };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => JSON.stringify([{ id: "pin-1", title: "Firmware check", body: `Version ${ver} safe check`, version: ver }]),
      };
    };
    await syncArchive({ cacheDir: tmpDir, fetchFn: fakeFetch });
    ver = "2.0.0";
    await syncArchive({ cacheDir: tmpDir, fetchFn: fakeFetch });
    const v2Snap = loadSnapshot(tmpDir);
    assert.equal(v2Snap.authenticity.integrityHashVerified, true);
    assert.equal(v2Snap.authenticity.publisherSignatureVerified, false);
    const pinned = pinPromptVersion(v2Snap, "pin-1", "2.0.0");
    assert.equal(pinned.pinnedVersion, "2.0.0");
    assert.equal(pinned.publisherSignatureVerified, false);

    const rolled = rollbackSnapshot(tmpDir);
    assert.equal(rolled.rolledBack, true);
    const restoredSnap = loadSnapshot(tmpDir);
    assert.equal(restoredSnap.prompts[0].version, "1.0.0");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 6. Environment capability manifest distinguishes documented vs installed vs simulated vs physical
  const capManifest = getEnvironmentCapabilityManifest({ installedTools: ["kicad-cli"] });
  const kicadCap = capManifest.integrations.find((i) => i.id === "kicad");
  const spiceCap = capManifest.integrations.find((i) => i.id === "spice_ngspice");
  assert.equal(kicadCap.installedSoftware, true);
  assert.equal(kicadCap.verifiedPhysicalExecution, false);
  assert.equal(spiceCap.installedSoftware, false);
  assert.equal(spiceCap.verifiedPhysicalExecution, false);

  // 7. CLI `quality` and `remove` roundtrip
  const resQual = spawnSync(process.execPath, [CLI_PATH, "quality", "rc-kicad-ecad-kicad-drc-ci", "--json"], { encoding: "utf8" });
  assert.strictEqual(resQual.status, 0);
  const qJson = JSON.parse(resQual.stdout);
  assert.equal(qJson.inGold50Program, true);
  assert(qJson.quality_score_14 >= 12);

  const rmRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rei-cli-rm-"));
  try {
    const resAdd = spawnSync(
      process.execPath,
      [CLI_PATH, "add", "rei-rea-orchestrator", "--cursor", "--path", path.join(rmRoot, ".cursor", "skills"), "--local"],
      { encoding: "utf8" },
    );
    assert.strictEqual(resAdd.status, 0);
    assert(fs.existsSync(path.join(rmRoot, ".cursor", "skills", "rei-rea-orchestrator", "SKILL.md")));

    const resRm = spawnSync(
      process.execPath,
      [CLI_PATH, "remove", "rei-rea-orchestrator", "--path", path.join(rmRoot, ".cursor", "skills"), "--json"],
      { encoding: "utf8" },
    );
    assert.strictEqual(resRm.status, 0);
    const rmJson = JSON.parse(resRm.stdout);
    assert.equal(rmJson.status, "removed");
    assert.equal(fs.existsSync(path.join(rmRoot, ".cursor", "skills", "rei-rea-orchestrator")), false);
  } finally {
    fs.rmSync(rmRoot, { recursive: true, force: true });
  }

  console.log("PASS: 14-Point Quality Engine, Gold 50, Compatibility & Capability Manifest tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
