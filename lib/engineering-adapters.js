/**
 * Capability-Aware Engineering Tool Adapters & Computational Verifiers (Phase H).
 *
 * Design invariants:
 * - Every adapter explicitly declares supported APIs, simulated operations, real executions,
 *   unsupported functions, and whether external CAD software / physical hardware is required.
 * - All operations run deterministic mathematical, schema, or protocol verification in software.
 * - No adapter claims that physical measurements, CAD GUI actions, or hardware actuations occurred.
 */

const SI_NAMED_DIMENSIONS = Object.freeze({
  dimensionless: [0, 0, 0, 0, 0, 0, 0],
  mass: [1, 0, 0, 0, 0, 0, 0],
  length: [0, 1, 0, 0, 0, 0, 0],
  time: [0, 0, 1, 0, 0, 0, 0],
  current: [0, 0, 0, 1, 0, 0, 0],
  temperature: [0, 0, 0, 0, 1, 0, 0],
  velocity: [0, 1, -1, 0, 0, 0, 0],
  acceleration: [0, 1, -2, 0, 0, 0, 0],
  frequency: [0, 0, -1, 0, 0, 0, 0],
  force: [1, 1, -2, 0, 0, 0, 0],
  pressure: [1, -1, -2, 0, 0, 0, 0],
  energy: [1, 2, -2, 0, 0, 0, 0],
  power: [1, 2, -3, 0, 0, 0, 0],
  voltage: [1, 2, -3, -1, 0, 0, 0],
  resistance: [1, 2, -3, -2, 0, 0, 0],
  capacitance: [-1, -2, 4, 2, 0, 0, 0],
});

const J1939_KNOWN_PGNS = Object.freeze({
  61444: "EEC1 (Electronic Engine Controller 1)",
  65262: "ET1 (Engine Temperature 1)",
  65263: "EFL/P1 (Engine Fluid Level/Pressure 1)",
  65265: "CCVS1 (Cruise Control / Vehicle Speed 1)",
  65271: "VEP1 (Vehicle Electrical Power 1)",
});

const FUSION_UNIT_TO_MM = Object.freeze({
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
});

const ADAPTER_REGISTRY = Object.freeze({
  kicad: {
    id: "kicad",
    domain: "ECAD / PCB Design",
    safetyClass: "state_changing",
    supportedApis: [
      "kicad-cli sch erc",
      "kicad-cli pcb drc",
      "kicad-cli pcb export gerbers",
      "kicad-cli pcb export drill",
    ],
    simulatedOperations: ["planKicadVerification", "buildManufacturingChecklist"],
    realExecutions: ["Dry-run CLI command generation & PCB fab rule validation in software"],
    unsupportedFunctions: [
      "Direct schematic capture or interactive trace routing",
      "Fabrication Gerber execution when kicad-cli binary is absent",
    ],
    requiresExternalSoftwareOrHardware: true,
    claimedPhysicalExecution: false,
  },
  fusion360: {
    id: "fusion360",
    domain: "MCAD / Parametric Enclosure",
    safetyClass: "state_changing",
    supportedApis: [
      "adsk.core.UnitsManager (1 internal unit = 1 cm)",
      "adsk.fusion.BRepBodies envelope check",
      "adsk.fusion.ExportManager STEP/STL planning",
    ],
    simulatedOperations: ["convertFusionUnits", "verifyEnclosureFit"],
    realExecutions: ["Fusion internal cm unit conversions & enclosure clearance geometry checks"],
    unsupportedFunctions: [
      "Live Fusion 360 timeline rebuild without Autodesk Fusion desktop add-in session",
    ],
    requiresExternalSoftwareOrHardware: true,
    claimedPhysicalExecution: false,
  },
  embedded: {
    id: "embedded",
    domain: "GNSS / CAN / Embedded Diagnostics",
    safetyClass: "potentially_hazardous",
    supportedApis: [
      "NMEA-0183 checksum and fix frame decoder",
      "SAE J1939 29-bit CAN arbitration ID decoder",
    ],
    simulatedOperations: ["validateNmeaSentence", "parseJ1939CanId"],
    realExecutions: ["Deterministic frame checksum & bit-field protocol verification in software"],
    unsupportedFunctions: [
      "Unattended serial/CAN bus actuation or firmware flashing without target hardware & operator approval",
    ],
    requiresExternalSoftwareOrHardware: true,
    claimedPhysicalExecution: false,
  },
  scientific: {
    id: "scientific",
    domain: "Scientific Computing & Optimization",
    safetyClass: "read_only",
    supportedApis: [
      "SI 7-base dimensional consistency analyzer",
      "Constraint residual & feasibility evaluator",
    ],
    simulatedOperations: ["verifyDimensionalConsistency", "evaluateOptimizationFeasibility"],
    realExecutions: ["Exact SI dimensional algebra & inequality/equality residual computation"],
    unsupportedFunctions: ["Closed-loop physical laboratory actuation"],
    requiresExternalSoftwareOrHardware: false,
    claimedPhysicalExecution: false,
  },
  industrial_measurement: {
    id: "industrial_measurement",
    domain: "Industrial Vibration, Metrology & Balancing",
    safetyClass: "potentially_hazardous",
    supportedApis: [
      "Accelerometer/sensor calibration certificate validator",
      "DFT vibration spectrum & crest-factor analyzer",
      "Single-plane vector influence balancing calculator",
    ],
    simulatedOperations: [
      "validateSensorCalibration",
      "computeVibrationFftMetrics",
      "calculateSinglePlaneBalance",
    ],
    realExecutions: [
      "Numerical DSP/FFT & complex influence-vector arithmetic ONLY (never reads live DAQ or attaches weights)",
    ],
    unsupportedFunctions: [
      "Direct IEPE/DAQ sampling without calibrated acquisition hardware",
      "Unattended rotor balancing without physical lockout/tagout and operator verification",
    ],
    requiresExternalSoftwareOrHardware: true,
    claimedPhysicalExecution: false,
  },
});

function listEngineeringAdapters() {
  return Object.values(ADAPTER_REGISTRY);
}

function getEngineeringAdapter(id) {
  return ADAPTER_REGISTRY[String(id || "").toLowerCase()] || null;
}

/**
 * KiCad verifier: constructs dry-run ERC/DRC command plan and fab design-rule sanity checks.
 */
function planKicadVerification(params = {}) {
  const schematicPath = String(params.schematicPath || "hardware/board.kicad_sch");
  const boardPath = String(params.boardPath || "hardware/board.kicad_pcb");
  const outputDir = String(params.outputDir || "reports");
  const layerCount = Number(params.layerCount ?? 4);
  const minTraceMm = Number(params.minTraceMm ?? 0.15);
  const minClearanceMm = Number(params.minClearanceMm ?? 0.15);
  const minViaDrillMm = Number(params.minViaDrillMm ?? 0.25);

  const designRuleWarnings = [];
  if (![2, 4, 6, 8, 10, 12].includes(layerCount)) {
    designRuleWarnings.push(`Non-standard copper layer count '${layerCount}'`);
  }
  if (!(minTraceMm >= 0.1)) designRuleWarnings.push("minTraceMm < 0.10mm requires high-cost HDI fab");
  if (!(minClearanceMm >= 0.1)) designRuleWarnings.push("minClearanceMm < 0.10mm requires HDI fab");
  if (!(minViaDrillMm >= 0.15)) designRuleWarnings.push("minViaDrillMm < 0.15mm violates standard mechanical drill");

  const stem = boardPath.replace(/\.kicad_pcb$/i, "").split(/[/\\]/).pop() || "board";
  const schStem = schematicPath.replace(/\.kicad_sch$/i, "").split(/[/\\]/).pop() || "board";

  return {
    adapter: "kicad",
    operation: "planKicadVerification",
    executionMode: "COMPUTATIONAL_PLAN_ONLY",
    claimedPhysicalExecution: false,
    fabRulesPass: designRuleWarnings.length === 0,
    designRuleWarnings,
    dryRunCommands: [
      {
        check: "schematic-erc",
        command: [
          "kicad-cli",
          "sch",
          "erc",
          "--exit-code-violations",
          "--output",
          `${outputDir}/${schStem}-erc.rpt`,
          schematicPath,
        ],
      },
      {
        check: "board-drc",
        command: [
          "kicad-cli",
          "pcb",
          "drc",
          "--exit-code-violations",
          "--output",
          `${outputDir}/${stem}-drc.rpt`,
          boardPath,
        ],
      },
    ],
    manufacturingChecklist: [
      `Verify ${layerCount}-layer stackup & impedance table`,
      "Confirm Gerber X2 + Excellon drill files before fab upload",
      "Cross-check BOM MPNs and JLC/assembly centroid rotation",
    ],
  };
}

/**
 * Fusion 360 unit converter (remembering Fusion API database unit is centimeters).
 */
function convertFusionUnits(value, fromUnit = "mm", toUnit = "cm") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("Unit conversion value must be finite");
  }
  const f = String(fromUnit).toLowerCase();
  const t = String(toUnit).toLowerCase();
  if (!Object.hasOwn(FUSION_UNIT_TO_MM, f)) {
    throw new Error(`Unsupported source unit '${fromUnit}'`);
  }
  if (!Object.hasOwn(FUSION_UNIT_TO_MM, t)) {
    throw new Error(`Unsupported target unit '${toUnit}'`);
  }
  const inMm = numeric * FUSION_UNIT_TO_MM[f];
  const converted = inMm / FUSION_UNIT_TO_MM[t];
  const fusionInternalCm = inMm / 10;
  return {
    adapter: "fusion360",
    operation: "convertFusionUnits",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    input: { value: numeric, unit: f },
    output: { value: Number(converted.toFixed(6)), unit: t },
    fusionInternalCm: Number(fusionInternalCm.toFixed(6)),
  };
}

/**
 * Fusion 360 parametric enclosure clearance and wall-thickness verifier.
 */
function verifyEnclosureFit(params = {}) {
  const pcbWidthMm = Number(params.pcbWidthMm);
  const pcbLengthMm = Number(params.pcbLengthMm);
  const pcbHeightMm = Number(params.pcbHeightMm);
  const innerWidthMm = Number(params.innerWidthMm);
  const innerLengthMm = Number(params.innerLengthMm);
  const innerHeightMm = Number(params.innerHeightMm);
  const minClearanceMm = Number(params.minClearanceMm ?? 0.5);
  const minWallThicknessMm = Number(params.minWallThicknessMm ?? 2.0);
  const actualWallThicknessMm = Number(params.actualWallThicknessMm ?? 2.5);

  for (const [k, v] of Object.entries({
    pcbWidthMm,
    pcbLengthMm,
    pcbHeightMm,
    innerWidthMm,
    innerLengthMm,
    innerHeightMm,
    minClearanceMm,
    minWallThicknessMm,
    actualWallThicknessMm,
  })) {
    if (!Number.isFinite(v) || v <= 0) {
      throw new Error(`Parameter '${k}' must be a positive finite number`);
    }
  }

  // Per-side X/Y margin assumes centered PCB; Z margin is total vertical headroom.
  const marginPerSideXMm = Number(((innerWidthMm - pcbWidthMm) / 2).toFixed(4));
  const marginPerSideYMm = Number(((innerLengthMm - pcbLengthMm) / 2).toFixed(4));
  const verticalHeadroomMm = Number((innerHeightMm - pcbHeightMm).toFixed(4));

  const issues = [];
  if (marginPerSideXMm < minClearanceMm) {
    issues.push(`X per-side clearance ${marginPerSideXMm}mm < required ${minClearanceMm}mm`);
  }
  if (marginPerSideYMm < minClearanceMm) {
    issues.push(`Y per-side clearance ${marginPerSideYMm}mm < required ${minClearanceMm}mm`);
  }
  if (verticalHeadroomMm < minClearanceMm) {
    issues.push(`Vertical headroom ${verticalHeadroomMm}mm < required ${minClearanceMm}mm`);
  }
  if (actualWallThicknessMm < minWallThicknessMm) {
    issues.push(`Wall thickness ${actualWallThicknessMm}mm < minimum ${minWallThicknessMm}mm`);
  }

  return {
    adapter: "fusion360",
    operation: "verifyEnclosureFit",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    fits: issues.length === 0,
    marginsMm: {
      perSideX: marginPerSideXMm,
      perSideY: marginPerSideYMm,
      verticalZ: verticalHeadroomMm,
      wallThickness: actualWallThicknessMm,
    },
    fusionInternalDimensionsCm: {
      innerWidthCm: Number((innerWidthMm / 10).toFixed(4)),
      innerLengthCm: Number((innerLengthMm / 10).toFixed(4)),
      innerHeightCm: Number((innerHeightMm / 10).toFixed(4)),
      wallThicknessCm: Number((actualWallThicknessMm / 10).toFixed(4)),
    },
    issues,
  };
}

/**
 * GNSS NMEA-0183 frame & XOR checksum validator.
 */
function validateNmeaSentence(sentence) {
  const raw = String(sentence || "").trim();
  const match = /^\$([^*]+)\*([0-9A-Fa-f]{2})$/.exec(raw);
  if (!match) {
    return {
      adapter: "embedded",
      operation: "validateNmeaSentence",
      executionMode: "COMPUTATIONAL_ONLY",
      claimedPhysicalExecution: false,
      validFrame: false,
      checksumValid: false,
      reason: "Malformed NMEA-0183 framing (expected $<body...>*<HH>)",
    };
  }
  const body = match[1];
  const actualChecksum = match[2].toUpperCase();
  let xor = 0;
  for (let i = 0; i < body.length; i++) {
    xor ^= body.charCodeAt(i);
  }
  const expectedChecksum = xor.toString(16).toUpperCase().padStart(2, "0");
  const checksumValid = actualChecksum === expectedChecksum;
  const fields = body.split(",");
  const tag = fields[0] || "";
  const talkerId = tag.slice(0, 2);
  const sentenceType = tag.slice(2);

  let parsed = null;
  if (sentenceType === "GGA" && fields.length >= 10) {
    parsed = {
      utcTime: fields[1] || null,
      fixQuality: Number.parseInt(fields[6] || "0", 10),
      satellitesTracked: Number.parseInt(fields[7] || "0", 10),
      hdop: fields[8] ? Number.parseFloat(fields[8]) : null,
      altitudeMeters: fields[9] ? Number.parseFloat(fields[9]) : null,
    };
  }

  return {
    adapter: "embedded",
    operation: "validateNmeaSentence",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    validFrame: checksumValid,
    checksumValid,
    expectedChecksum,
    actualChecksum,
    talkerId,
    sentenceType,
    fieldCount: fields.length,
    parsed,
  };
}

/**
 * SAE J1939 29-bit extended CAN arbitration ID decoder.
 */
function parseJ1939CanId(canIdInput) {
  let id;
  if (typeof canIdInput === "number" && Number.isInteger(canIdInput)) {
    id = canIdInput;
  } else {
    const cleaned = String(canIdInput || "").trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]{1,8}$/.test(cleaned)) {
      throw new Error(`Invalid J1939 CAN ID '${canIdInput}'`);
    }
    id = Number.parseInt(cleaned, 16);
  }
  if (id < 0 || id > 0x1fffffff) {
    throw new Error(`J1939 ID 0x${id.toString(16)} exceeds 29-bit range (0x1FFFFFFF)`);
  }

  const priority = (id >>> 26) & 0x7;
  const reserved = (id >>> 25) & 0x1;
  const dataPage = (id >>> 24) & 0x1;
  const pduFormat = (id >>> 16) & 0xff;
  const pduSpecific = (id >>> 8) & 0xff;
  const sourceAddress = id & 0xff;

  const isBroadcast = pduFormat >= 240;
  const pgn = isBroadcast
    ? (reserved << 17) | (dataPage << 16) | (pduFormat << 8) | pduSpecific
    : (reserved << 17) | (dataPage << 16) | (pduFormat << 8);

  return {
    adapter: "embedded",
    operation: "parseJ1939CanId",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    canIdHex: `0x${id.toString(16).toUpperCase().padStart(8, "0")}`,
    priority,
    reserved,
    dataPage,
    pduFormat,
    pduSpecific,
    pduType: isBroadcast ? "PDU2_BROADCAST" : "PDU1_PEER_TO_PEER",
    destinationAddress: isBroadcast ? null : pduSpecific,
    sourceAddress,
    pgn,
    pgnHex: `0x${pgn.toString(16).toUpperCase()}`,
    knownPgnName: J1939_KNOWN_PGNS[pgn] || null,
  };
}

function resolveDimensionVector(term) {
  if (Array.isArray(term)) {
    if (term.length !== 7 || !term.every((n) => Number.isFinite(n))) {
      throw new Error("Dimension array must contain 7 finite SI exponents [M,L,T,I,Theta,N,J]");
    }
    return term;
  }
  if (typeof term === "string") {
    const key = term.trim().toLowerCase();
    if (!Object.hasOwn(SI_NAMED_DIMENSIONS, key)) {
      throw new Error(`Unknown physical dimension '${term}'`);
    }
    return [...SI_NAMED_DIMENSIONS[key]];
  }
  if (term && typeof term === "object") {
    if (Array.isArray(term.factors)) {
      const total = [0, 0, 0, 0, 0, 0, 0];
      for (const factor of term.factors) {
        const power = Number(factor.power ?? 1);
        const vec = resolveDimensionVector(factor.dim || factor);
        for (let i = 0; i < 7; i++) total[i] += vec[i] * power;
      }
      return total;
    }
    if (term.dim) return resolveDimensionVector(term.dim);
  }
  throw new Error("Invalid dimension specification");
}

/**
 * Verifies SI dimensional consistency across LHS = sum(RHS terms).
 */
function verifyDimensionalConsistency(equationSpec = {}) {
  const lhsVec = resolveDimensionVector(equationSpec.lhs);
  const rhsTerms = Array.isArray(equationSpec.rhsTerms) ? equationSpec.rhsTerms : [];
  if (rhsTerms.length === 0) {
    throw new Error("rhsTerms must contain at least one term");
  }
  const termResults = rhsTerms.map((term, idx) => {
    const vec = resolveDimensionVector(term);
    const matchesLhs = vec.every((exp, i) => Math.abs(exp - lhsVec[i]) < 1e-9);
    return { index: idx, vector: vec, matchesLhs };
  });
  return {
    adapter: "scientific",
    operation: "verifyDimensionalConsistency",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    consistent: termResults.every((t) => t.matchesLhs),
    lhsVector: lhsVec,
    terms: termResults,
  };
}

/**
 * Evaluates numerical optimization solution feasibility from equality and inequality residuals.
 */
function evaluateOptimizationFeasibility(params = {}) {
  const objectiveValue = Number(params.objectiveValue);
  const equalityResiduals = Array.isArray(params.equalityResiduals) ? params.equalityResiduals : [];
  const inequalityValues = Array.isArray(params.inequalityValues) ? params.inequalityValues : [];
  const tolerance = Number(params.tolerance ?? 1e-6);

  if (!Number.isFinite(objectiveValue)) {
    throw new Error("objectiveValue must be finite");
  }
  const maxEqViolation = equalityResiduals.reduce(
    (m, v) => Math.max(m, Math.abs(Number(v))),
    0,
  );
  const maxIneqViolation = inequalityValues.reduce(
    (m, v) => Math.max(m, Math.max(0, Number(v))),
    0,
  );
  const feasible = maxEqViolation <= tolerance && maxIneqViolation <= tolerance;
  return {
    adapter: "scientific",
    operation: "evaluateOptimizationFeasibility",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    feasible,
    objectiveValue,
    tolerance,
    maxEqualityViolation: maxEqViolation,
    maxInequalityViolation: maxIneqViolation,
  };
}

/**
 * Validates accelerometer / instrumentation calibration expiry and sensitivity metadata.
 */
function validateSensorCalibration(params = {}) {
  const sensorId = String(params.sensorId || "").trim();
  const sensitivityMvPerG = Number(params.sensitivityMvPerG);
  const calibrationDateIso = String(params.calibrationDateIso || "").trim();
  const maxAgeDays = Number(params.maxAgeDays ?? 365);
  const referenceCertId = String(params.referenceCertId || "").trim();
  const nowMs = params.nowIso ? Date.parse(params.nowIso) : Date.now();
  const calMs = Date.parse(calibrationDateIso);

  const issues = [];
  if (!sensorId) issues.push("Missing sensorId");
  if (!Number.isFinite(sensitivityMvPerG) || sensitivityMvPerG <= 0) {
    issues.push("sensitivityMvPerG must be a positive finite number");
  }
  if (!Number.isFinite(calMs)) {
    issues.push("Invalid calibrationDateIso");
  }
  if (!referenceCertId) {
    issues.push("Missing traceable referenceCertId");
  }
  const ageDays = Number.isFinite(calMs) ? (nowMs - calMs) / 86400000 : Infinity;
  if (Number.isFinite(ageDays) && ageDays < 0) {
    issues.push("Calibration date lies in the future relative to evaluation clock");
  }
  const expired = ageDays > maxAgeDays;
  if (expired) {
    issues.push(`Calibration expired (${Math.round(ageDays)}d > ${maxAgeDays}d limit)`);
  }

  return {
    adapter: "industrial_measurement",
    operation: "validateSensorCalibration",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    valid: issues.length === 0,
    sensorId,
    sensitivityMvPerG,
    ageDays: Number.isFinite(ageDays) ? Number(ageDays.toFixed(2)) : null,
    expired,
    issues,
  };
}

/**
 * Computes time-domain RMS, peak, crest factor, and DFT dominant spectral peaks for sampled vibration.
 */
function computeVibrationFftMetrics(params = {}) {
  const samplesG = Array.isArray(params.samplesG) ? params.samplesG.map(Number) : [];
  const sampleRateHz = Number(params.sampleRateHz);
  if (samplesG.length < 4 || !samplesG.every(Number.isFinite)) {
    throw new Error("samplesG must contain at least 4 finite numeric samples");
  }
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new Error("sampleRateHz must be positive");
  }

  const N = samplesG.length;
  const meanG = samplesG.reduce((a, b) => a + b, 0) / N;
  let sumSqAc = 0;
  let peakAbsG = 0;
  for (const s of samplesG) {
    const ac = s - meanG;
    sumSqAc += ac * ac;
    if (Math.abs(ac) > peakAbsG) peakAbsG = Math.abs(ac);
  }
  const rmsG = Math.sqrt(sumSqAc / N);
  const crestFactor = rmsG > 1e-12 ? peakAbsG / rmsG : 0;

  const half = Math.floor(N / 2);
  const spectrum = [];
  for (let k = 1; k <= half; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      const ac = samplesG[n] - meanG;
      re += ac * Math.cos(angle);
      im -= ac * Math.sin(angle);
    }
    const scale = k === half && N % 2 === 0 ? 1 / N : 2 / N;
    const amplitudeG = Math.sqrt(re * re + im * im) * scale;
    spectrum.push({
      bin: k,
      frequencyHz: Number(((k * sampleRateHz) / N).toFixed(3)),
      amplitudeG: Number(amplitudeG.toFixed(6)),
    });
  }
  spectrum.sort((a, b) => b.amplitudeG - a.amplitudeG);

  return {
    adapter: "industrial_measurement",
    operation: "computeVibrationFftMetrics",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    sampleCount: N,
    sampleRateHz,
    dcOffsetG: Number(meanG.toFixed(6)),
    rmsAcG: Number(rmsG.toFixed(6)),
    peakAcG: Number(peakAbsG.toFixed(6)),
    crestFactor: Number(crestFactor.toFixed(4)),
    dominantFrequencyHz: spectrum[0] ? spectrum[0].frequencyHz : 0,
    dominantAmplitudeG: spectrum[0] ? spectrum[0].amplitudeG : 0,
    topPeaks: spectrum.slice(0, 3),
  };
}

function phasorToCartesian(amplitude, angleDeg) {
  const rad = (Number(angleDeg) * Math.PI) / 180;
  const amp = Number(amplitude);
  return { re: amp * Math.cos(rad), im: amp * Math.sin(rad) };
}

function cartesianToPhasor(re, im) {
  const amplitude = Math.hypot(re, im);
  let phaseDeg = (Math.atan2(im, re) * 180) / Math.PI;
  phaseDeg = ((phaseDeg % 360) + 360) % 360;
  return { amplitude: Number(amplitude.toFixed(6)), phaseDeg: Number(phaseDeg.toFixed(3)) };
}

/**
 * Single-plane vector influence-coefficient balancing calculation (`W_c = -V_0 / A`).
 * Explicitly computational only — requires human lockout/tagout before rotor mass changes.
 */
function calculateSinglePlaneBalance(params = {}) {
  const v0 = params.initialVibration || {};
  const v1 = params.trialVibration || {};
  const wtAmp = Number(params.trialWeightGrams);
  const wtAngle = Number(params.trialAngleDeg);

  if (!Number.isFinite(wtAmp) || wtAmp <= 0 || !Number.isFinite(wtAngle)) {
    throw new Error("trialWeightGrams (>0) and trialAngleDeg must be finite");
  }
  if (!Number.isFinite(v0.amplitude) || !Number.isFinite(v0.phaseDeg)) {
    throw new Error("initialVibration must specify finite amplitude and phaseDeg");
  }
  if (!Number.isFinite(v1.amplitude) || !Number.isFinite(v1.phaseDeg)) {
    throw new Error("trialVibration must specify finite amplitude and phaseDeg");
  }

  const c0 = phasorToCartesian(v0.amplitude, v0.phaseDeg);
  const c1 = phasorToCartesian(v1.amplitude, v1.phaseDeg);
  const wt = phasorToCartesian(wtAmp, wtAngle);

  // Delta V = V1 - V0 (effect produced purely by trial weight Wt)
  const dvRe = c1.re - c0.re;
  const dvIm = c1.im - c0.im;
  const dvMagSq = dvRe * dvRe + dvIm * dvIm;
  if (dvMagSq < 1e-12) {
    throw new Error("Trial run produced negligible vibration change (|V1 - V0| ~ 0); cannot solve influence vector");
  }

  // Influence coefficient A = (V1 - V0) / Wt
  const wtMagSq = wt.re * wt.re + wt.im * wt.im;
  const infRe = (dvRe * wt.re + dvIm * wt.im) / wtMagSq;
  const infIm = (dvIm * wt.re - dvRe * wt.im) / wtMagSq;
  const influence = cartesianToPhasor(infRe, infIm);

  // Correction mass vector Wc = -V0 / A = (-V0 * Wt) / (V1 - V0)
  const numRe = -(c0.re * wt.re - c0.im * wt.im);
  const numIm = -(c0.re * wt.im + c0.im * wt.re);
  const wcRe = (numRe * dvRe + numIm * dvIm) / dvMagSq;
  const wcIm = (numIm * dvRe - numRe * dvIm) / dvMagSq;
  const correction = cartesianToPhasor(wcRe, wcIm);

  return {
    adapter: "industrial_measurement",
    operation: "calculateSinglePlaneBalance",
    executionMode: "COMPUTATIONAL_ONLY",
    claimedPhysicalExecution: false,
    requiresOperatorSignoff: true,
    safetyNotice:
      "COMPUTATIONAL_ONLY: Lockout/tagout and physical operator verification required before attaching or removing rotor weights.",
    correctionMassGrams: correction.amplitude,
    correctionAngleDeg: correction.phaseDeg,
    influenceSensitivity: {
      amplitudePerGram: influence.amplitude,
      phaseDeg: influence.phaseDeg,
    },
    predictedLinearResidualG: 0,
  };
}

function evaluateEngineeringAdapter(adapterId, operation, params = {}) {
  const adapter = getEngineeringAdapter(adapterId);
  if (!adapter) {
    throw new Error(`Unknown engineering adapter '${adapterId}'`);
  }
  const dispatch = {
    kicad: {
      planKicadVerification,
    },
    fusion360: {
      convertFusionUnits: (p) => convertFusionUnits(p.value, p.fromUnit, p.toUnit),
      verifyEnclosureFit,
    },
    embedded: {
      validateNmeaSentence: (p) => validateNmeaSentence(p.sentence),
      parseJ1939CanId: (p) => parseJ1939CanId(p.canId),
    },
    scientific: {
      verifyDimensionalConsistency,
      evaluateOptimizationFeasibility,
    },
    industrial_measurement: {
      validateSensorCalibration,
      computeVibrationFftMetrics,
      calculateSinglePlaneBalance,
    },
  };
  const fn = dispatch[adapter.id] && dispatch[adapter.id][operation];
  if (!fn) {
    throw new Error(`Unsupported operation '${operation}' on adapter '${adapter.id}'`);
  }
  return fn(params);
}

module.exports = {
  ADAPTER_REGISTRY,
  listEngineeringAdapters,
  getEngineeringAdapter,
  evaluateEngineeringAdapter,
  planKicadVerification,
  convertFusionUnits,
  verifyEnclosureFit,
  validateNmeaSentence,
  parseJ1939CanId,
  verifyDimensionalConsistency,
  evaluateOptimizationFeasibility,
  validateSensorCalibration,
  computeVibrationFftMetrics,
  calculateSinglePlaneBalance,
};
