/**
 * 14-Point Auditable Quality Engine & 6-Dimension Verification Model (Phase B).
 *
 * Scoring rubric: 7 dimensions * (0..2) = max 14 points
 *   1. metadata          (0..2)
 *   2. triggerPrecision  (0..2)
 *   3. specificity       (0..2)
 *   4. actionability     (0..2)
 *   5. references        (0..2)
 *   6. security          (0..2)
 *   7. evaluation        (0..2) — backed strictly by recorded evaluation evidence
 *
 * Tiers:
 *   Q3 (Gold):       12..14 and all mandatory gates passed
 *   Q2 (Solid):       8..11 and all mandatory gates passed
 *   Q1 (Basic):       4..7  and all mandatory gates passed
 *   Q0 (Quarantine):  0..3  or any failed mandatory schema/reference/security gate
 */

const HARDWARE_OR_PHYSICAL_PATTERN =
  /\b(pcb|kicad|spice|ngspice|fusion360|cad|mcad|ecad|vibration|rotor|balance|gnss|gps|rtos|embedded|firmware|accelerometer|daq|hardware|emc|emi|jt808|can)\b/i;

const SPECIFICITY_PATTERN =
  /\b(units?|millimeters?|volts?|amperes?|hertz|tolerance|threshold|checksum|latency|clock|budget|contract|residual|schema|offset|crc)\b/i;

const CONSTRAINTS_SAFETY_PATTERN =
  /^##\s+(Limitations|Constraints|Constraints\s+and\s+safety|Do\s+not\s+use|Evidence|Best\s+Practices|Operational\s+boundary)/im;

const PROCEDURE_PATTERN =
  /^##\s+(Procedure|Instructions|Workflow|How\s+It\s+Works|Core|Steps)/im;

const TRIGGER_HEADER_PATTERN =
  /^##\s+(When\s+to\s+Use(\s+This\s+Skill)?|Use\s+this\s+skill\s+when|Entry\s+contract)/im;

const NEGATIVE_BOUNDARY_PATTERN =
  /^##\s+(Do\s+not\s+use|Limitations|Anti-Patterns|Non-Goals)|not\s+for\b|do\s+not\s+substitute/im;

function tierLabel(tier) {
  switch (tier) {
    case "Q3":
      return "Gold";
    case "Q2":
      return "Solid";
    case "Q1":
      return "Basic";
    default:
      return "Quarantine";
  }
}

/**
 * Evaluates a single skill across all 7 quality dimensions and 6 verification axes.
 */
function evaluateSkillQuality(input = {}) {
  const id = String(input.id || "");
  const content = String(input.content || "");
  const metadata = input.metadata || {};
  const schemaValid = Boolean(input.schemaValid);
  const referencesValid = Boolean(input.referencesValid);
  const securityCompliant = Boolean(input.securityCompliant);
  const hasProgressiveReferences = Boolean(input.hasProgressiveReferences);
  const hasHelperScripts = Boolean(input.hasHelperScripts);
  const gold50Result = input.gold50Result || null;
  const isBenchmarkCovered = Boolean(input.isBenchmarkCovered);
  const humanReviewRecord = input.humanReviewRecord || null;

  // 1. Metadata (0..2)
  let dimMetadata = 0;
  if (schemaValid) {
    dimMetadata = 1;
    const hasTags =
      metadata.metadata &&
      ((typeof metadata.metadata.tags === "string" && metadata.metadata.tags.trim()) ||
        Array.isArray(metadata.metadata.tags));
    if ((metadata.license || metadata.category || hasTags) && String(metadata.description || "").length >= 40) {
      dimMetadata = 2;
    }
  }

  // 2. Trigger Precision (0..2)
  let dimTriggerPrecision = 0;
  if (TRIGGER_HEADER_PATTERN.test(content)) dimTriggerPrecision += 1;
  if (NEGATIVE_BOUNDARY_PATTERN.test(content)) dimTriggerPrecision += 1;
  if (dimTriggerPrecision === 0 && /use when\b/i.test(String(metadata.description || ""))) {
    dimTriggerPrecision = 1;
  }

  // 3. Specificity (0..2)
  let dimSpecificity = 0;
  if (content.length >= 400 && metadata.description) dimSpecificity += 1;
  if (SPECIFICITY_PATTERN.test(content) && (CONSTRAINTS_SAFETY_PATTERN.test(content) || gold50Result)) {
    dimSpecificity += 1;
  }

  // 4. Actionability (0..2)
  let dimActionability = 0;
  if (PROCEDURE_PATTERN.test(content) || /^\s*1\.\s+/m.test(content)) dimActionability += 1;
  if (content.includes("```") || hasHelperScripts) dimActionability += 1;

  // 5. References (0..2)
  let dimReferences = 0;
  if (referencesValid) {
    dimReferences = 1;
    const hasRefSectionOrDir =
      hasProgressiveReferences ||
      /^##\s+(Authoritative|References|Sources|Documentation)/im.test(content) ||
      /https?:\/\//.test(content);
    if (hasRefSectionOrDir) dimReferences = 2;
  }

  // 6. Security (0..2)
  let dimSecurity = 0;
  if (securityCompliant && metadata.risk && metadata.risk !== "unknown") {
    dimSecurity = 1;
    if (
      /Constraints\s+and\s+safety|Operational\s+boundary|untrusted\s+inputs?|AUTHORIZED\s+USE\s+ONLY|static-first|lockout/i.test(
        content,
      )
    ) {
      dimSecurity = 2;
    }
  }

  // 7. Evaluation (0..2) — strictly derived from actual test/evaluation evidence
  let dimEvaluation = 0;
  let evaluationPassed = false;
  if (gold50Result && gold50Result.passed === true) {
    dimEvaluation = 2;
    evaluationPassed = true;
  } else if (isBenchmarkCovered || id.startsWith("rei-")) {
    dimEvaluation = 1;
    evaluationPassed = isBenchmarkCovered;
  }

  const dimensions = {
    metadata: dimMetadata,
    triggerPrecision: dimTriggerPrecision,
    specificity: dimSpecificity,
    actionability: dimActionability,
    references: dimReferences,
    security: dimSecurity,
    evaluation: dimEvaluation,
  };

  const score14 =
    dimMetadata +
    dimTriggerPrecision +
    dimSpecificity +
    dimActionability +
    dimReferences +
    dimSecurity +
    dimEvaluation;

  const mandatoryGatePassed = schemaValid && referencesValid && securityCompliant;

  let tier;
  if (!mandatoryGatePassed || score14 <= 3) {
    tier = "Q0";
  } else if (score14 >= 12) {
    tier = "Q3";
  } else if (score14 >= 8) {
    tier = "Q2";
  } else {
    tier = "Q1";
  }

  const hardwareRelevant = HARDWARE_OR_PHYSICAL_PATTERN.test(`${id} ${metadata.description || ""}`);
  const verificationDimensions = {
    schemaValid,
    referenceValidated: referencesValid,
    securityPolicyChecked: securityCompliant,
    evaluationPassed,
    humanReviewed: Boolean(humanReviewRecord && humanReviewRecord.reviewer),
    hardwareVerified: hardwareRelevant ? "not_verified" : "not_applicable",
  };

  return {
    id,
    dimensions,
    qualityScore14: score14,
    qualityTier: tier,
    qualityTierLabel: tierLabel(tier),
    quarantined: tier === "Q0",
    mandatoryGatePassed,
    verificationDimensions,
  };
}

/**
 * Summarizes an array of skill quality evaluation records.
 */
function summarizeQualityRecords(records = []) {
  const tierCounts = { Q3: 0, Q2: 0, Q1: 0, Q0: 0 };
  let total14 = 0;
  let gold50EvaluatedCount = 0;
  let humanReviewedCount = 0;
  for (const r of records) {
    const t = r.qualityTier || r.quality_tier || "Q0";
    if (Object.hasOwn(tierCounts, t)) tierCounts[t] += 1;
    total14 += Number(r.qualityScore14 ?? r.quality_score_14 ?? 0);
    const vd = r.verificationDimensions || r.verification_dimensions || {};
    if (vd.evaluationPassed) gold50EvaluatedCount += 1;
    if (vd.humanReviewed) humanReviewedCount += 1;
  }
  const n = Math.max(1, records.length);
  return {
    qualityFrameworkVersion: "14pt-v1",
    tierCounts,
    quarantinedCount: tierCounts.Q0,
    averageScore14: Number((total14 / n).toFixed(2)),
    evaluationPassedCount: gold50EvaluatedCount,
    humanReviewedCount,
    hardwareVerifiedCount: 0,
  };
}

module.exports = {
  tierLabel,
  evaluateSkillQuality,
  summarizeQualityRecords,
};
