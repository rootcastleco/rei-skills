#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const catalog = require(path.join(ROOT, "data/catalog.json"));
const bundles = require(path.join(ROOT, "data/bundles.json"));
const workflows = require(path.join(ROOT, "data/workflows.json"));
const {
  EXECUTION_MODES,
  validateUnitCompatibility,
  detectCycles,
  compileWorkflowPlan,
} = require(path.join(ROOT, "lib/workflow-compiler"));

console.log("Running Workflow Compiler (Phase C) tests...");

// 1. Flagship multi-domain task: 4-channel vibration measurement PCB + Fusion 360 enclosure
{
  const plan = compileWorkflowPlan(
    "Design a four-channel vibration measurement PCB and its Fusion 360 enclosure",
    catalog,
    {
      bundlesData: bundles,
      workflowsData: workflows,
      files: ["vibration.kicad_pcb", "enclosure.f3d"],
    }
  );

  assert.match(plan.planId, /^plan-[a-f0-9]{12}$/);
  assert.equal(plan.schemaVersion, "rei.workflow-plan.v1");
  assert.equal(plan.dependencyGraph.hasCycles, false);
  assert.equal(plan.sharedContext.channelCount, 4);
  assert.equal(plan.executionRecord.claimedPhysicalExecution, false);
  assert.match(plan.executionRecord.planDigestSha256, /^[a-f0-9]{64}$/);

  const stageIds = plan.stages.map((s) => s.stageId);
  for (const requiredStage of [
    "requirements_and_constraints",
    "sensor_and_analog_front_end",
    "adc_timing_and_power_tree",
    "schematic_and_simulation",
    "ecad_layout_and_erc_drc",
    "ecad_mcad_interface",
    "mcad_enclosure_and_tolerance",
    "manufacturing_and_validation_gate",
  ]) {
    assert(stageIds.includes(requiredStage), `Missing expected workflow stage: ${requiredStage}`);
  }

  // Topological ordering verification: every dependency must appear earlier than its consumer
  const orderPos = new Map(stageIds.map((id, i) => [id, i]));
  for (const edge of plan.dependencyGraph.edges) {
    assert(
      orderPos.get(edge.from) < orderPos.get(edge.to),
      `Topological violation: ${edge.from} must precede ${edge.to}`
    );
  }

  // Epistemic honesty & execution mode separation
  assert(plan.computationalVsPhysicalSummary.computationalOnlyStages.includes("sensor_and_analog_front_end"));
  assert(plan.computationalVsPhysicalSummary.externalSoftwareRequiredStages.includes("ecad_layout_and_erc_drc"));
  assert(plan.computationalVsPhysicalSummary.externalSoftwareRequiredStages.includes("mcad_enclosure_and_tolerance"));
  assert(plan.computationalVsPhysicalSummary.humanApprovalStages.includes("manufacturing_and_validation_gate"));

  for (const stage of plan.stages) {
    assert.equal(stage.executionStatus, "PLANNED_NOT_EXECUTED");
    assert.equal(stage.claimedPhysicalExecution, false);
  }

  assert(plan.humanApprovalCheckpoints.length >= 3);
  assert(plan.uncertaintyState.hasUnknowns);
  assert(plan.parameterContracts.every((c) => c.check.compatible === true));
}

// 2. Unit compatibility verification (positive & negative dimensional mismatches)
{
  const mmToCm = validateUnitCompatibility("mm", "cm");
  assert.equal(mmToCm.compatible, true);
  assert.equal(mmToCm.scaleFactor, 0.1);

  const khzToHz = validateUnitCompatibility("kHz", "Hz");
  assert.equal(khzToHz.compatible, true);
  assert.equal(khzToHz.scaleFactor, 1000);

  const mismatch = validateUnitCompatibility("mm", "V");
  assert.equal(mismatch.compatible, false);
  assert.match(mismatch.reason, /Dimensional mismatch/i);

  const unknown = validateUnitCompatibility("furlong", "mm");
  assert.equal(unknown.compatible, false);
}

// 3. Cycle detector catches cyclic DAGs
{
  const cyclic = detectCycles(
    [{ stageId: "a" }, { stageId: "b" }],
    [
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ]
  );
  assert.equal(cyclic.hasCycles, true);
}

// 4. Safe-only compilation excludes critical & offensive skills
{
  const safePlan = compileWorkflowPlan("Analyze suspicious firmware image statically", catalog, {
    safeOnly: true,
    files: ["router.bin"],
  });
  const catalogMap = new Map(catalog.skills.map((s) => [s.id, s]));
  for (const stage of safePlan.stages) {
    for (const sid of stage.skillIds) {
      const sk = catalogMap.get(sid);
      assert(sk && sk.risk !== "critical" && sk.risk !== "offensive", `Safe plan leaked risky skill: ${sid}`);
    }
  }
}

// 5. Empty task rejection
assert.throws(() => compileWorkflowPlan("", catalog), /Task description is required/);

console.log("PASS: Workflow Compiler tests passed.");
