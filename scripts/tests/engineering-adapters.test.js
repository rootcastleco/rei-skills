"use strict";

const assert = require("node:assert/strict");
const {
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
} = require("../../lib/engineering-adapters");

console.log("Running Engineering Tool Adapters (Phase H) tests...");

// 1. All 5 priority domain adapters publish complete capability & honesty contracts
const adapters = listEngineeringAdapters();
assert.equal(adapters.length, 5);
for (const a of adapters) {
  assert(a.id && a.domain && a.safetyClass);
  assert(Array.isArray(a.supportedApis) && a.supportedApis.length > 0);
  assert(Array.isArray(a.simulatedOperations) && a.simulatedOperations.length > 0);
  assert(Array.isArray(a.unsupportedFunctions) && a.unsupportedFunctions.length > 0);
  assert.equal(a.claimedPhysicalExecution, false);
}
assert(getEngineeringAdapter("kicad"));
assert.throws(() => evaluateEngineeringAdapter("unknown-cad", "foo", {}), /Unknown engineering adapter/);

// 2. KiCad ECAD planning verifier
const kicadPlan = planKicadVerification({
  schematicPath: "pcb/vib_daq.kicad_sch",
  boardPath: "pcb/vib_daq.kicad_pcb",
  outputDir: "build/reports",
  layerCount: 4,
  minTraceMm: 0.15,
  minClearanceMm: 0.15,
  minViaDrillMm: 0.25,
});
assert.equal(kicadPlan.claimedPhysicalExecution, false);
assert.equal(kicadPlan.fabRulesPass, true);
assert.equal(kicadPlan.dryRunCommands.length, 2);
assert.equal(kicadPlan.dryRunCommands[0].command[0], "kicad-cli");

const riskyKicad = planKicadVerification({ minTraceMm: 0.05, layerCount: 5 });
assert.equal(riskyKicad.fabRulesPass, false);
assert(riskyKicad.designRuleWarnings.length >= 2);

// 3. Fusion 360 unit conversions (1 internal unit = 1 cm) & enclosure clearance verifier
const conv = convertFusionUnits(125, "mm", "in");
assert(Math.abs(conv.fusionInternalCm - 12.5) < 1e-6);
assert(Math.abs(conv.output.value - 125 / 25.4) < 1e-4);

const goodFit = verifyEnclosureFit({
  pcbWidthMm: 80,
  pcbLengthMm: 100,
  pcbHeightMm: 18,
  innerWidthMm: 84,
  innerLengthMm: 104,
  innerHeightMm: 22,
  minClearanceMm: 1.5,
  minWallThicknessMm: 2.0,
  actualWallThicknessMm: 2.5,
});
assert.equal(goodFit.fits, true);
assert.equal(goodFit.marginsMm.perSideX, 2);
assert.equal(goodFit.fusionInternalDimensionsCm.innerWidthCm, 8.4);

const badFit = verifyEnclosureFit({
  pcbWidthMm: 80,
  pcbLengthMm: 100,
  pcbHeightMm: 18,
  innerWidthMm: 80.4,
  innerLengthMm: 100.4,
  innerHeightMm: 18.2,
  minClearanceMm: 1.0,
  minWallThicknessMm: 2.0,
  actualWallThicknessMm: 1.2,
});
assert.equal(badFit.fits, false);
assert.equal(badFit.issues.length, 4);

// 4. Embedded GNSS NMEA-0183 checksum & SAE J1939 29-bit CAN decoder
// Construct valid $GPGGA frame with dynamically computed checksum in test fixture
const body = "GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,";
let xor = 0;
for (let i = 0; i < body.length; i++) xor ^= body.charCodeAt(i);
const cs = xor.toString(16).toUpperCase().padStart(2, "0");
const goodNmea = validateNmeaSentence(`$${body}*${cs}`);
assert.equal(goodNmea.checksumValid, true);
assert.equal(goodNmea.sentenceType, "GGA");
assert.equal(goodNmea.parsed.satellitesTracked, 8);
const badNmea = validateNmeaSentence(`$${body}*00`);
assert.equal(badNmea.checksumValid, false);

const j1939 = parseJ1939CanId("0x18FEF100");
assert.equal(j1939.priority, 6);
assert.equal(j1939.pgn, 65265);
assert.equal(j1939.sourceAddress, 0);
assert(j1939.knownPgnName.includes("CCVS1"));

// 5. Scientific dimensional check & optimization feasibility
const forceCheck = verifyDimensionalConsistency({
  lhs: "force",
  rhsTerms: [{ factors: [{ dim: "mass", power: 1 }, { dim: "acceleration", power: 1 }] }],
});
assert.equal(forceCheck.consistent, true);
const badDimCheck = verifyDimensionalConsistency({
  lhs: "force",
  rhsTerms: ["energy"],
});
assert.equal(badDimCheck.consistent, false);
assert.equal(
  evaluateOptimizationFeasibility({ objectiveValue: 12.4, equalityResiduals: [1e-8], inequalityValues: [-0.2] }).feasible,
  true,
);

// 6. Industrial vibration, calibration & single-plane balancing math
const calOk = validateSensorCalibration({
  sensorId: "ACC-CH1",
  sensitivityMvPerG: 100.4,
  calibrationDateIso: "2026-06-01T00:00:00Z",
  nowIso: "2026-11-01T00:00:00Z",
  maxAgeDays: 365,
  referenceCertId: "ISO17025-2026-8841",
});
assert.equal(calOk.valid, true);
assert.equal(calOk.claimedPhysicalExecution, false);

// Synthesize pure 100 Hz sine @ 1000 Hz sampling over 100 samples (exact integer cycles)
const N = 100;
const fsHz = 1000;
const samples = Array.from({ length: N }, (_, n) => 1.5 * Math.sin((2 * Math.PI * 100 * n) / fsHz));
const fft = computeVibrationFftMetrics({ samplesG: samples, sampleRateHz: fsHz });
assert(Math.abs(fft.dominantFrequencyHz - 100) < 0.01);
assert(Math.abs(fft.dominantAmplitudeG - 1.5) < 0.05);
assert(Math.abs(fft.rmsAcG - 1.5 / Math.SQRT2) < 0.02);

// Single-plane balancing verification: V0 = 4<0, trial weight Wt = 10g<0 causes V1 = 4 + 2i => dV = 2i => A = 0.2i => Wc = -4 / (0.2i) = +20i = 20g<90
const balance = calculateSinglePlaneBalance({
  initialVibration: { amplitude: 4, phaseDeg: 0 },
  trialWeightGrams: 10,
  trialAngleDeg: 0,
  trialVibration: { amplitude: Math.hypot(4, 2), phaseDeg: (Math.atan2(2, 4) * 180) / Math.PI },
});
assert.equal(balance.executionMode, "COMPUTATIONAL_ONLY");
assert.equal(balance.requiresOperatorSignoff, true);
assert.equal(balance.claimedPhysicalExecution, false);
assert(Math.abs(balance.correctionMassGrams - 20) < 0.01);
assert(Math.abs(balance.correctionAngleDeg - 90) < 0.05);

// Router dispatch check via evaluateEngineeringAdapter
const viaRouter = evaluateEngineeringAdapter("fusion360", "convertFusionUnits", {
  value: 25.4,
  fromUnit: "mm",
  toUnit: "in",
});
assert(Math.abs(viaRouter.output.value - 1) < 1e-6);

console.log("PASS: Engineering Tool Adapters (Phase H) tests passed.");
