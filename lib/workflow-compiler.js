"use strict";

/**
 * 🧭 REI Skills — Skill Orchestration & Typed Workflow Compiler (Phase C)
 *
 * Transforms complex engineering tasks into dependency-aware, typed execution plans
 * with DAG topological ordering, parameter & unit compatibility checks, resource budgets,
 * uncertainty tracking, human approval gates, and epistemic execution boundaries.
 *
 * Never claims physical measurements, CAD/EDA mutations, or hardware runs occurred
 * without real execution evidence.
 */

const crypto = require("node:crypto");
const { recommendHybrid } = require("./hybrid-router");

const EXECUTION_MODES = Object.freeze({
  COMPUTATIONAL_ONLY: "COMPUTATIONAL_ONLY",
  REQUIRES_CAD_OR_EDA_SOFTWARE: "REQUIRES_CAD_OR_EDA_SOFTWARE",
  REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE: "REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE",
  REQUIRES_HUMAN_APPROVAL: "REQUIRES_HUMAN_APPROVAL",
});

const UNIT_DIMENSIONS = {
  mm: { dimension: "length", toBase: 1e-3, base: "m" },
  cm: { dimension: "length", toBase: 1e-2, base: "m" },
  m: { dimension: "length", toBase: 1, base: "m" },
  mil: { dimension: "length", toBase: 2.54e-5, base: "m" },
  in: { dimension: "length", toBase: 2.54e-2, base: "m" },
  hz: { dimension: "frequency", toBase: 1, base: "Hz" },
  khz: { dimension: "frequency", toBase: 1e3, base: "Hz" },
  mhz: { dimension: "frequency", toBase: 1e6, base: "Hz" },
  v: { dimension: "voltage", toBase: 1, base: "V" },
  mv: { dimension: "voltage", toBase: 1e-3, base: "V" },
  a: { dimension: "current", toBase: 1, base: "A" },
  ma: { dimension: "current", toBase: 1e-3, base: "A" },
  deg: { dimension: "angle", toBase: 1, base: "deg" },
  rad: { dimension: "angle", toBase: 180 / Math.PI, base: "deg" },
  g: { dimension: "mass", toBase: 1e-3, base: "kg" },
  kg: { dimension: "mass", toBase: 1, base: "kg" },
  count: { dimension: "count", toBase: 1, base: "count" },
};

function validateUnitCompatibility(sourceUnit, targetUnit) {
  const s = String(sourceUnit || "").toLowerCase();
  const t = String(targetUnit || "").toLowerCase();
  const sMeta = UNIT_DIMENSIONS[s];
  const tMeta = UNIT_DIMENSIONS[t];

  if (!sMeta || !tMeta) {
    return {
      compatible: false,
      reason: `Unsupported unit(s): '${sourceUnit}' -> '${targetUnit}'`,
      scaleFactor: null,
    };
  }
  if (sMeta.dimension !== tMeta.dimension) {
    return {
      compatible: false,
      reason: `Dimensional mismatch: ${sMeta.dimension} ('${sourceUnit}') cannot convert to ${tMeta.dimension} ('${targetUnit}')`,
      scaleFactor: null,
    };
  }
  return {
    compatible: true,
    dimension: sMeta.dimension,
    scaleFactor: Number((sMeta.toBase / tMeta.toBase).toPrecision(8)),
    reason: `Compatible (${sMeta.dimension}); multiply '${sourceUnit}' by ${sMeta.toBase / tMeta.toBase} to obtain '${targetUnit}'`,
  };
}

/**
 * Canonical engineering stage templates that activate based on task intent and domains.
 */
const STAGE_TEMPLATES = [
  {
    stageId: "requirements_and_constraints",
    title: "Requirements, Channel Budget & Interface Contracts",
    domain: "requirements",
    triggers: /pcb|circuit|devre|vibration|titreşim|titresim|enclosure|muhafaza|fusion|kicad|gnss|ota|rtos|firmware|reverse|architecture|api|system/i,
    defaultSkills: ["concise-planning", "architecture-decision-records"],
    dependsOn: [],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["task_specification", "operating_environment_bounds"],
    outputs: ["interface_control_document", "unit_parameter_ledger"],
    requiredEvidenceArtifacts: ["requirements-matrix.json"],
    uncertaintyHints: ["ambient_temperature_range_c", "target_supply_voltage_v", "ingress_protection_rating"],
  },
  {
    stageId: "sensor_and_analog_front_end",
    title: "Sensor Interfaces, Analog Conditioning & Anti-Aliasing",
    domain: "sensor-acquisition",
    triggers: /vibration|titreşim|titresim|sensor|sensör|accelerometer|ivmeölçer|ivmeolcer|iepe|analog|bridge|strain|channel|kanal/i,
    defaultSkills: [
      "rc-sensor-acquisition-accelerometer-sensitivity",
      "rc-sensor-acquisition-anti-alias-filter-choice",
      "rc-circuit-architecture-analog-front-end-bias",
    ],
    dependsOn: ["requirements_and_constraints"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["unit_parameter_ledger", "sensor_datasheet_sensitivity"],
    outputs: ["afe_gain_filter_spec", "noise_and_bandwidth_budget"],
    requiredEvidenceArtifacts: ["afe-transfer-budget.json"],
    uncertaintyHints: ["sensor_excitation_current_ma", "sensor_bandwidth_hz"],
  },
  {
    stageId: "adc_timing_and_power_tree",
    title: "ADC Reference, Synchronous Sampling Timing & Power Tree",
    domain: "circuit-architecture",
    triggers: /adc|sampling|örnekleme|ornekleme|power|voltage|voltaj|regulator|regülatör|pcb|circuit|devre|vibration|titreşim/i,
    defaultSkills: [
      "rc-circuit-architecture-adc-reference-network",
      "rc-sensor-acquisition-synchronous-sampling-phase",
      "rc-circuit-architecture-power-tree-budgeting",
    ],
    dependsOn: ["requirements_and_constraints", "sensor_and_analog_front_end"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["afe_gain_filter_spec", "channel_count_and_sample_rate"],
    outputs: ["power_rail_budget", "adc_settling_and_clock_spec"],
    requiredEvidenceArtifacts: ["power-tree-and-adc-budget.json"],
    uncertaintyHints: ["adc_resolution_bits", "max_sampling_rate_hz"],
  },
  {
    stageId: "schematic_and_simulation",
    title: "Circuit Simulation (SPICE AC/Transient & Corner Verification)",
    domain: "circuit-simulation",
    triggers: /spice|simulation|simülasyon|pcb|circuit|devre|analog|filter|opamp|regulator|vibration|titreşim/i,
    defaultSkills: [
      "rc-circuit-simulation-adc-sampling-settling",
      "rc-circuit-simulation-filter-transfer-verification",
      "rc-circuit-simulation-worst-case-corner-sweep",
    ],
    dependsOn: ["adc_timing_and_power_tree", "sensor_and_analog_front_end"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["afe_gain_filter_spec", "power_rail_budget"],
    outputs: ["spice_corner_report", "transfer_function_verification"],
    requiredEvidenceArtifacts: ["spice-simulation-report.json"],
    uncertaintyHints: ["vendor_spice_model_provenance"],
  },
  {
    stageId: "ecad_layout_and_erc_drc",
    title: "KiCad Schematic ERC, PCB Layout Constraints & DRC Parity",
    domain: "kicad-ecad",
    triggers: /kicad|pcb|gerber|erc|drc|schematic|şematik|sematik|baskı devre|circuit|devre/i,
    defaultSkills: [
      "rc-kicad-ecad-kicad-erc-automation",
      "rc-kicad-ecad-kicad-drc-ci",
      "rc-pcb-design-review-analog-digital-partition",
    ],
    dependsOn: ["adc_timing_and_power_tree", "schematic_and_simulation"],
    executionMode: EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE,
    inputs: ["power_rail_budget", "spice_corner_report"],
    outputs: ["erc_report", "drc_report", "pcb_step_model", "gerber_drill_package"],
    requiredEvidenceArtifacts: ["board-erc.rpt", "board-drc.rpt", "board-assembly.step"],
    uncertaintyHints: ["fabricator_layer_stackup", "kicad_cli_version_ge_10"],
  },
  {
    stageId: "ecad_mcad_interface",
    title: "ECAD-MCAD STEP Envelope, Mounting Holes & Connector Keep-Outs",
    domain: "ecad-mcad-fit",
    triggers: /(pcb|kicad|board|kart).*(enclosure|muhafaza|housing|fusion|step|case|kutu)|ecad.?mcad/i,
    defaultSkills: [
      "rc-ecad-mcad-fit-pcb-to-enclosure-step",
      "rc-ecad-mcad-fit-mounting-hole-pattern",
      "rc-ecad-mcad-fit-sensor-mount-orientation",
    ],
    dependsOn: ["ecad_layout_and_erc_drc"],
    executionMode: EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE,
    inputs: ["pcb_step_model", "unit_parameter_ledger"],
    outputs: ["ecad_mcad_fit_clearance_report", "mounting_datum_coordinates"],
    requiredEvidenceArtifacts: ["ecad-mcad-fit-report.json"],
    uncertaintyHints: ["tallest_pcb_component_mm", "connector_mating_sweep_mm"],
  },
  {
    stageId: "mcad_enclosure_and_tolerance",
    title: "Fusion 360 Parametric Enclosure, Tolerance Stack-Up & STEP/STL Export",
    domain: "fusion360-parametric",
    triggers: /fusion|enclosure|muhafaza|housing|kutu|cad|3d|step|stl|tolerance|tolerans|gasket|conta/i,
    defaultSkills: [
      "rc-fusion360-parametric-fusion-design-parameter-table",
      "rc-fusion360-api-fusion-api-parameter-units",
      "rc-cad-3d-assembly-tolerance-stack-up",
      "rc-fusion360-parametric-fusion-step-stl-export",
    ],
    dependsOn: ["requirements_and_constraints", "ecad_mcad_interface"],
    executionMode: EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE,
    inputs: ["mounting_datum_coordinates", "ecad_mcad_fit_clearance_report"],
    outputs: ["enclosure_parametric_table", "enclosure_step_stl_artifacts", "tolerance_stack_report"],
    requiredEvidenceArtifacts: ["enclosure.step", "enclosure.stl", "tolerance-stack.json"],
    uncertaintyHints: ["manufacturing_process_cnc_vs_fdm", "wall_thickness_mm"],
  },
  {
    stageId: "vibration_balancing_diagnostics",
    title: "Vibration Signal Processing & Rotor Balancing Calculations",
    domain: "machine-vibration",
    triggers: /rotor|balans|balance|fft|bearing|yatak|spectrum|spektrum|tachometer|balancing/i,
    defaultSkills: [
      "rc-machine-vibration-acceleration-to-velocity",
      "rc-machine-vibration-fft-window-leakage",
      "rc-rotor-mass-balance-single-plane-influence",
    ],
    dependsOn: ["requirements_and_constraints"],
    executionMode: EXECUTION_MODES.REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE,
    inputs: ["calibrated_sensor_waveforms", "tachometer_phase_reference"],
    outputs: ["fft_velocity_spectrum", "trial_weight_influence_calculation"],
    requiredEvidenceArtifacts: ["calibration-certificate.json", "vibration-metrics.json"],
    uncertaintyHints: ["keyphasor_angle_convention", "rotor_balance_grade_iso"],
  },
  {
    stageId: "embedded_firmware_and_protocols",
    title: "Embedded RTOS, OTA Lifecycle, GNSS & Protocol Parsing",
    domain: "embedded-rtos",
    triggers: /firmware|rtos|ota|gnss|nmea|jt808|ble|cellular|canbus|embedded|gömülü|gomulu/i,
    defaultSkills: [
      "rc-embedded-rtos-wcet-scheduling-budget",
      "rc-firmware-ota-ab-slot-state-machine",
      "rc-gnss-measurement-nmea-talker-validation",
    ],
    dependsOn: ["requirements_and_constraints"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["interface_control_document", "protocol_frame_vectors"],
    outputs: ["rtos_wcet_schedule", "ota_state_machine_spec"],
    requiredEvidenceArtifacts: ["protocol-conformance-tests.json"],
    uncertaintyHints: ["target_mcu_flash_layout", "watchdog_timeout_ms"],
  },
  {
    stageId: "reverse_engineering_and_forensics",
    title: "Static-First Binary Triage & SHA-256 Casebook Ledger",
    domain: "reverse-engineering",
    triggers: /reverse|tersine|binary|ikili|apk|asar|wasm|elf|forensic|casebook|firmware.*\.bin/i,
    defaultSkills: [
      "rei-rea-orchestrator",
      "rei-binary-intelligence",
      "rei-evidence-ledger",
      "rei-casebook-forensics",
    ],
    dependsOn: ["requirements_and_constraints"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["target_artifact_sha256", "authorization_scope"],
    outputs: ["static_triage_report", "evidence_casebook_bundle"],
    requiredEvidenceArtifacts: ["casebook-sha256.json", "finding-report.md"],
    uncertaintyHints: ["stripped_symbol_tables", "encrypted_firmware_sections"],
  },
  {
    stageId: "software_architecture_and_testing",
    title: "Software Design, Verification & Automated Test Suite",
    domain: "software",
    triggers: /api|backend|frontend|react|next|database|postgres|sql|rust|python|typescript|kubernetes|docker|ddd|agent|rag|mcp|test/i,
    defaultSkills: ["test-driven-development", "systematic-debugging", "verification-before-completion"],
    dependsOn: ["requirements_and_constraints"],
    executionMode: EXECUTION_MODES.COMPUTATIONAL_ONLY,
    inputs: ["interface_control_document"],
    outputs: ["automated_test_results", "verified_software_patch"],
    requiredEvidenceArtifacts: ["test-report.json"],
    uncertaintyHints: ["target_runtime_constraints"],
  },
  {
    stageId: "manufacturing_and_validation_gate",
    title: "Bench Validation, Safety Gate & Human Release Approval",
    domain: "safety-assurance",
    triggers: /.*/,
    defaultSkills: [
      "rc-kicad-ecad-kicad-ecad-release-gate",
      "rc-safety-assurance-release-safety-gate",
      "verification-before-completion",
    ],
    dependsOn: ["*"], // Automatically depends on all preceding active stages
    executionMode: EXECUTION_MODES.REQUIRES_HUMAN_APPROVAL,
    inputs: ["all_upstream_stage_artifacts"],
    outputs: ["signed_release_readiness_decision"],
    requiredEvidenceArtifacts: ["release-gate-checklist.json", "operator-signoff.json"],
    uncertaintyHints: ["physical_bench_acceptance_measured", "authorized_operator_signoff"],
  },
];

function detectCycles(nodes, edges) {
  const inDegree = new Map();
  const adj = new Map();
  for (const n of nodes) {
    inDegree.set(n.stageId, 0);
    adj.set(n.stageId, []);
  }
  for (const e of edges) {
    if (!adj.has(e.from) || !inDegree.has(e.to)) continue;
    adj.get(e.from).push(e.to);
    inDegree.set(e.to, inDegree.get(e.to) + 1);
  }
  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }
  const ordered = [];
  while (queue.length > 0) {
    queue.sort();
    const curr = queue.shift();
    ordered.push(curr);
    for (const next of adj.get(curr)) {
      const nextDeg = inDegree.get(next) - 1;
      inDegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }
  return {
    hasCycles: ordered.length !== nodes.length,
    topologicalOrder: ordered,
  };
}

function extractEngineeringContext(task, files, providedParams = {}) {
  const lower = String(task || "").toLowerCase();
  let channelCount = providedParams.channelCount || null;
  if (!channelCount) {
    if (/\bfour[- ]?channel\b|dört kanallı|dort kanalli|\b4[- ]?ch/i.test(lower)) channelCount = 4;
    else if (/\btwo[- ]?channel\b|iki kanallı|\b2[- ]?ch/i.test(lower)) channelCount = 2;
    else {
      const m = lower.match(/\b(\d+)[- ]?channel\b/);
      if (m) channelCount = Number(m[1]);
    }
  }

  return {
    channelCount,
    files: Array.isArray(files) ? files : [],
    canonicalUnits: {
      mechanicalCadUserUnit: "mm",
      fusionApiInternalLengthUnit: "cm",
      pcbDimensionUnit: "mm",
      frequencyUnit: "Hz",
      voltageUnit: "V",
      accelerationUnit: "m/s^2",
    },
    parameters: { ...providedParams },
  };
}

/**
 * Compiles a natural-language engineering task into a typed, dependency-ordered workflow plan.
 */
function compileWorkflowPlan(task, catalogData, options = {}) {
  const cleanTask = String(task || "").trim();
  if (!cleanTask) {
    throw new Error("Task description is required to compile a workflow plan.");
  }

  const files = Array.isArray(options.files)
    ? options.files
    : typeof options.files === "string"
      ? options.files.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const safeOnly = Boolean(options.safeOnly);

  const rec = recommendHybrid(
    catalogData,
    options.bundlesData || { bundles: {} },
    options.workflowsData || { workflows: [] },
    { task: cleanTask, files, safeOnly, maxResults: 18 }
  );

  const catalogMap = new Map(((catalogData && catalogData.skills) || []).map((s) => [s.id, s]));
  const recByDomain = new Map();
  for (const s of rec.recommendedSkills) {
    if (!recByDomain.has(s.domain)) recByDomain.set(s.domain, []);
    recByDomain.get(s.domain).push(s.id);
  }

  // Select active stages (excluding final release gate initially)
  const intermediateTemplates = STAGE_TEMPLATES.slice(0, -1);
  const activeRaw = [];
  for (const tpl of intermediateTemplates) {
    const regexMatch = tpl.triggers.test(cleanTask) || files.some((f) => tpl.triggers.test(f));
    const domainMatch = recByDomain.has(tpl.domain);
    if (regexMatch || domainMatch) {
      activeRaw.push(tpl);
    }
  }

  // Always include requirements + final release gate
  if (!activeRaw.some((t) => t.stageId === "requirements_and_constraints")) {
    activeRaw.unshift(STAGE_TEMPLATES[0]);
  }
  const activeStageIds = new Set(activeRaw.map((t) => t.stageId));
  activeStageIds.add("manufacturing_and_validation_gate");

  const stageTemplates = [...activeRaw, STAGE_TEMPLATES[STAGE_TEMPLATES.length - 1]];
  const nodes = [];
  const edges = [];

  for (const tpl of stageTemplates) {
    let resolvedSkills = [];
    if (recByDomain.has(tpl.domain)) {
      resolvedSkills.push(...recByDomain.get(tpl.domain));
    }
    for (const defId of tpl.defaultSkills) {
      if (!resolvedSkills.includes(defId) && catalogMap.has(defId)) {
        const sk = catalogMap.get(defId);
        if (!safeOnly || (sk.risk !== "critical" && sk.risk !== "offensive")) {
          resolvedSkills.push(defId);
        }
      }
    }
    resolvedSkills = resolvedSkills.slice(0, 4);

    let deps;
    if (tpl.dependsOn.includes("*")) {
      deps = activeRaw.map((a) => a.stageId);
    } else {
      deps = tpl.dependsOn.filter((d) => activeStageIds.has(d));
      if (deps.length === 0 && tpl.stageId !== "requirements_and_constraints" && activeStageIds.has("requirements_and_constraints")) {
        deps = ["requirements_and_constraints"];
      }
    }

    for (const parent of deps) {
      edges.push({
        from: parent,
        to: tpl.stageId,
        contract: `${parent} -> ${tpl.stageId}`,
      });
    }

    nodes.push({
      stageId: tpl.stageId,
      title: tpl.title,
      domain: tpl.domain,
      skillIds: resolvedSkills,
      dependsOn: deps,
      executionMode: tpl.executionMode,
      executionStatus: "PLANNED_NOT_EXECUTED",
      claimedPhysicalExecution: false,
      inputs: tpl.inputs,
      outputs: tpl.outputs,
      requiredEvidenceArtifacts: tpl.requiredEvidenceArtifacts,
      uncertaintyFlags: tpl.uncertaintyHints,
    });
  }

  const dagCheck = detectCycles(nodes, edges);
  if (dagCheck.hasCycles) {
    throw new Error("Compiled workflow dependency graph unexpectedly contains cycles.");
  }

  const nodeMap = new Map(nodes.map((n) => [n.stageId, n]));
  const orderedStages = dagCheck.topologicalOrder.map((id, idx) => ({
    step: idx + 1,
    ...nodeMap.get(id),
  }));

  const sharedContext = extractEngineeringContext(cleanTask, files, options.parameters || {});

  const parameterContracts = [];
  if (activeStageIds.has("ecad_mcad_interface") || activeStageIds.has("mcad_enclosure_and_tolerance")) {
    parameterContracts.push({
      contractId: "ecad-to-mcad-length-unit",
      sourceStage: "ecad_layout_and_erc_drc",
      targetStage: "mcad_enclosure_and_tolerance",
      parameter: "board_dimensions",
      sourceUnit: "mm",
      targetUnit: "cm",
      check: validateUnitCompatibility("mm", "cm"),
    });
  }
  if (activeStageIds.has("sensor_and_analog_front_end") && activeStageIds.has("adc_timing_and_power_tree")) {
    parameterContracts.push({
      contractId: "afe-to-adc-bandwidth",
      sourceStage: "sensor_and_analog_front_end",
      targetStage: "adc_timing_and_power_tree",
      parameter: "anti_alias_cutoff_vs_sample_rate",
      sourceUnit: "kHz",
      targetUnit: "Hz",
      check: validateUnitCompatibility("kHz", "Hz"),
    });
  }
  if (sharedContext.channelCount) {
    parameterContracts.push({
      contractId: "channel-count-consistency",
      sourceStage: "requirements_and_constraints",
      targetStage: "adc_timing_and_power_tree",
      parameter: "channel_count",
      value: sharedContext.channelCount,
      sourceUnit: "count",
      targetUnit: "count",
      check: validateUnitCompatibility("count", "count"),
    });
  }

  const unknownParameters = Array.from(
    new Set(orderedStages.flatMap((s) => s.uncertaintyFlags || []))
  );

  const humanApprovalCheckpoints = orderedStages
    .filter(
      (s) =>
        s.executionMode === EXECUTION_MODES.REQUIRES_HUMAN_APPROVAL ||
        s.executionMode === EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE ||
        s.executionMode === EXECUTION_MODES.REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE
    )
    .map((s) => ({
      stageId: s.stageId,
      executionMode: s.executionMode,
      gateReason:
        s.executionMode === EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE
          ? "Requires licensed CAD/EDA tool execution (KiCad/Fusion 360) and artifact review"
          : s.executionMode === EXECUTION_MODES.REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE
            ? "Requires physical sensor/instrument calibration and operator safety sign-off"
            : "Mandatory human release sign-off before manufacturing or deployment",
      requiresExplicitApproval: true,
    }));

  const invalidCapabilityCombinations = [];
  if (safeOnly && (/\bflash\s+firmware|energize|overclock|bypass\s+interlock\b/i.test(cleanTask))) {
    invalidCapabilityCombinations.push({
      code: "CAP_SAFE_ONLY_CONFLICT",
      message: "safeOnly mode conflicts with hardware actuation / flashing directives; kept in plan-only preview.",
    });
  }
  if (Array.isArray(options.availableTools)) {
    const avail = new Set(options.availableTools.map((t) => String(t).toLowerCase()));
    const cadStage = orderedStages.find((s) => s.executionMode === EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE);
    if (cadStage && !avail.has("kicad-cli") && !avail.has("fusion360")) {
      invalidCapabilityCombinations.push({
        code: "CAP_MISSING_EXTERNAL_CAD_TOOL",
        stageId: cadStage.stageId,
        message: "Stage requires external CAD/EDA software ('kicad-cli' or 'fusion360') absent in availableTools.",
      });
    }
  }

  const resourceConflicts = [];
  if (
    /\b(?:flash|swd|jtag)\b/i.test(cleanTask) &&
    /\b(?:live telemetry|uart log|serial monitor)\b/i.test(cleanTask)
  ) {
    resourceConflicts.push({
      code: "RES_EXCLUSIVE_BUS_CONTENTION",
      resource: "target_debug_serial_bus",
      message: "Concurrent firmware flashing and serial telemetry streaming require sequential scheduling over the same hardware debug/UART bus.",
    });
  }
  if (/\bmils?\b|\binches\b/i.test(cleanTask) && /\bmm\b|\bmillimeters?\b/i.test(cleanTask)) {
    resourceConflicts.push({
      code: "RES_MIXED_DIMENSIONAL_UNITS",
      resource: "mechanical_ecad_length_units",
      message: "Mixed imperial (mil/inch) and metric (mm/cm) references detected; normalize explicitly at ECAD-MCAD boundary.",
    });
  }

  const canonicalBody = {
    schemaVersion: "rei.workflow-plan.v1",
    task: cleanTask,
    files,
    safeOnly,
    detectedDomains: rec.detectedDomains,
    sharedContext,
    dependencyGraph: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasCycles: false,
      topologicalOrder: dagCheck.topologicalOrder,
      edges,
    },
    stages: orderedStages,
    parameterContracts,
    resourceBudget: {
      maxSkillContextTokens: Number(options.maxSkillContextTokens || 16000),
      maxStageRetries: 2,
      stageTimeoutMs: 60000,
      maxParallelBranches: 2,
    },
    uncertaintyState: {
      hasUnknowns: unknownParameters.length > 0,
      unknownParameters,
      epistemicRule: "Physical measurements, CAD edits, and hardware actions are NOT executed by planning alone.",
    },
    retryAndRecoveryPolicy: {
      maxRetriesPerStage: 2,
      onPartialFailure: "checkpoint_completed_stages_and_halt_downstream",
      rollbackSupported: true,
    },
    humanApprovalCheckpoints,
    capabilityValidation: {
      validCombination: invalidCapabilityCombinations.length === 0,
      invalidCapabilityCombinations,
      resourceConflicts,
    },
    computationalVsPhysicalSummary: {
      computationalOnlyStages: orderedStages
        .filter((s) => s.executionMode === EXECUTION_MODES.COMPUTATIONAL_ONLY)
        .map((s) => s.stageId),
      externalSoftwareRequiredStages: orderedStages
        .filter((s) => s.executionMode === EXECUTION_MODES.REQUIRES_CAD_OR_EDA_SOFTWARE)
        .map((s) => s.stageId),
      hardwareOrInstrumentStages: orderedStages
        .filter((s) => s.executionMode === EXECUTION_MODES.REQUIRES_CALIBRATED_INSTRUMENT_OR_HARDWARE)
        .map((s) => s.stageId),
      humanApprovalStages: orderedStages
        .filter((s) => s.executionMode === EXECUTION_MODES.REQUIRES_HUMAN_APPROVAL)
        .map((s) => s.stageId),
    },
  };

  const planDigestSha256 = crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalBody))
    .digest("hex");

  return {
    planId: "plan-" + planDigestSha256.slice(0, 12),
    ...canonicalBody,
    executionRecord: {
      planDigestSha256,
      status: "PLANNED_AWAITING_EXECUTION",
      claimedPhysicalExecution: false,
      compiledAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  EXECUTION_MODES,
  UNIT_DIMENSIONS,
  validateUnitCompatibility,
  detectCycles,
  compileWorkflowPlan,
};
