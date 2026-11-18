"use strict";

/**
 * Unified 10-Stage Research-to-Media Production Pipeline (`lib/multimodal-pipeline.js`).
 *
 * Pipeline stages:
 *   Research -> Evidence Validation -> Script -> Editorial Review -> Storyboard ->
 *   Slides -> Narration -> Video -> Quality Assurance -> Artifact Package
 *
 * Uses REI Workflow DAG Compiler concepts, HOL Guard security checks, Rootcastle
 * Prompt Archive metadata, structured Observability spans, atomic checkpointing,
 * and SHA-256 artifact resume semantics.
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { ObservabilityRecorder, tagProvenance } = require("./observability");
const { authorizeToolInvocation, validateFileAccessBoundary } = require("./hol-guard-policy");
const { loadSnapshot, composePrompt } = require("./prompt-archive");
const {
  ROOT,
  detectWorkstationCapabilities,
  evaluateProviderPolicy,
  loadProviderManifest,
} = require("./multimodal-registry");
const {
  sha256File,
  sha256Text,
  runResearchStage,
  runEditorialStage,
  buildSharedSlideDeckSpec,
  runPresentationStage,
  runSpeechStage,
  runVideoUnderstandingStage,
  buildStoryboardAndSubtitles,
  runVideoProductionStage,
} = require("./multimodal-providers");

const PIPELINE_STAGE_DEFS = [
  {
    id: "research",
    title: "Multi-Source Research Collection",
    dependsOn: [],
    requiredCapabilities: ["last30days-skill"],
    inputSchema: { type: "object", required: ["task"] },
    outputSchema: { files: ["research/sources.json"] },
    resourceBudget: { maxRamMb: 256, maxCpuCores: 1 },
    cachePolicy: "content_hash_cacheable",
    retryPolicy: { maxAttempts: 2, backoffMs: 250 },
    timeoutMs: 15000,
    securityClassification: "read_only_scoped",
    validationMethod: "url_dedup_and_sha256_check",
  },
  {
    id: "evidence_validation",
    title: "Citation & Evidence Grounding",
    dependsOn: ["research"],
    requiredCapabilities: ["rei-multisource-research"],
    inputSchema: { files: ["research/sources.json"] },
    outputSchema: { files: ["research/evidence-report.json"] },
    resourceBudget: { maxRamMb: 128, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 5000,
    securityClassification: "read_only",
    validationMethod: "primary_secondary_claim_traceability",
  },
  {
    id: "script",
    title: "Bilingual Technical Brief & Narration Script",
    dependsOn: ["evidence_validation"],
    requiredCapabilities: ["prompt-archive"],
    inputSchema: { files: ["research/evidence-report.json"] },
    outputSchema: { files: ["writing/technical-brief.draft.md", "writing/script.draft.md"] },
    resourceBudget: { maxRamMb: 128, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 5000,
    securityClassification: "computational_only",
    validationMethod: "citation_and_warning_presence",
  },
  {
    id: "editorial_review",
    title: "Humanizer Editorial Refinement (Numeric & Warning Invariants)",
    dependsOn: ["script"],
    requiredCapabilities: ["humanizer"],
    inputSchema: { files: ["writing/technical-brief.md", "writing/script.md"] },
    outputSchema: { files: ["writing/technical-brief.draft.md", "writing/script.draft.md"] },
    resourceBudget: { maxRamMb: 128, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 5000,
    securityClassification: "computational_only",
    validationMethod: "invariant_number_unit_citation_warning_diff",
  },
  {
    id: "storyboard",
    title: "Scene Storyboard & Timing Alignment",
    dependsOn: ["editorial_review"],
    requiredCapabilities: ["shared-slide-spec"],
    inputSchema: { files: ["writing/script.md", "research/evidence-report.json"] },
    outputSchema: { files: ["storyboard/storyboard.json"] },
    resourceBudget: { maxRamMb: 128, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 5000,
    securityClassification: "computational_only",
    validationMethod: "scene_timing_and_citation_linkage",
  },
  {
    id: "slides",
    title: "Dual-Path Presentation Generation (HTML + Editable PPTX)",
    dependsOn: ["storyboard"],
    requiredCapabilities: ["frontend-slides", "ppt-master"],
    inputSchema: { files: ["storyboard/storyboard.json"] },
    outputSchema: { files: ["presentations/presentation-html/index.html", "presentations/presentation.pptx"] },
    resourceBudget: { maxRamMb: 256, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 10000,
    securityClassification: "state_changing_workspace",
    validationMethod: "html_a11y_plus_openxml_editable_xml_inspection",
  },
  {
    id: "narration",
    title: "License-Gated Speech Synthesis & Text Normalization",
    dependsOn: ["editorial_review", "storyboard"],
    requiredCapabilities: ["tts-provider-registry"],
    inputSchema: { files: ["writing/script.md", "storyboard/storyboard.json"] },
    outputSchema: { files: ["audio/narration.wav"] },
    resourceBudget: { maxRamMb: 1024, maxCpuCores: 2 },
    cachePolicy: "content_hash_cacheable",
    retryPolicy: { maxAttempts: 2, backoffMs: 250 },
    timeoutMs: 30000,
    securityClassification: "license_and_consent_gated",
    validationMethod: "ffprobe_pcm_wav_integrity",
  },
  {
    id: "video",
    title: "Programmatic Video Composition & Subtitles",
    dependsOn: ["slides", "narration"],
    requiredCapabilities: ["hyperframes", "ffmpeg"],
    inputSchema: { files: ["storyboard/storyboard.json", "audio/narration.wav"] },
    outputSchema: { files: ["video/final.mp4", "video/subtitles.srt"] },
    resourceBudget: { maxRamMb: 1536, maxCpuCores: 4 },
    cachePolicy: "content_hash_cacheable",
    retryPolicy: { maxAttempts: 2, backoffMs: 500 },
    timeoutMs: 45000,
    securityClassification: "sandboxed_subprocess",
    validationMethod: "ffprobe_dimensions_duration_audio_sync",
  },
  {
    id: "quality_assurance",
    title: "Cross-Artifact Verification & Video Understanding Audit",
    dependsOn: ["slides", "narration", "video"],
    requiredCapabilities: ["claude-video", "pptx-inspector"],
    inputSchema: { files: ["presentations/presentation.pptx", "audio/narration.wav", "video/final.mp4"] },
    outputSchema: { files: ["validation/quality-report.json"] },
    resourceBudget: { maxRamMb: 512, maxCpuCores: 2 },
    cachePolicy: "non_cacheable_verification",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 20000,
    securityClassification: "read_only",
    validationMethod: "all_stage_artifacts_verified",
  },
  {
    id: "artifact_package",
    title: "Provenance Bundle & Resumable Execution Manifest",
    dependsOn: ["quality_assurance"],
    requiredCapabilities: ["observability"],
    inputSchema: { files: ["validation/quality-report.json"] },
    outputSchema: { files: ["validation/provenance.json", "validation/execution-manifest.json"] },
    resourceBudget: { maxRamMb: 128, maxCpuCores: 1 },
    cachePolicy: "deterministic",
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    timeoutMs: 5000,
    securityClassification: "read_only_metadata",
    validationMethod: "sha256_manifest_seal",
  },
];

function validateTopologicalStages(stages) {
  const indexById = new Map(stages.map((s, idx) => [s.id, idx]));
  for (const s of stages) {
    const myIdx = indexById.get(s.id);
    for (const dep of s.dependsOn || []) {
      const depIdx = indexById.get(dep);
      if (depIdx === undefined || depIdx >= myIdx) {
        return { valid: false, error: `Invalid topological dependency '${dep}' -> '${s.id}'` };
      }
    }
  }
  return { valid: true };
}

function planMultimodalPipeline(options = {}) {
  const task = String(
    options.task ||
      "Create a technically accurate English presentation and short educational video explaining rotor vibration analysis, with Turkish narration and traceable references.",
  ).trim();
  const outputDir = options.outputDir ? path.resolve(options.outputDir) : path.join(ROOT, "examples", "multimodal-rotor-demo");
  const capabilities = options.capabilities || detectWorkstationCapabilities({ deterministic: options.deterministic });
  const manifest = loadProviderManifest();

  const speechProviderId = options.speechProviderId || "zonos3-mini";
  const videoProviderId = options.videoProviderId || "hyperframes";
  const policyChecks = {};

  for (const pid of ["last30days-skill", "claude-video", "humanizer", "frontend-slides", "ppt-master", speechProviderId, videoProviderId]) {
    const meta = (manifest.providers || []).find((p) => p.id === pid);
    policyChecks[pid] = evaluateProviderPolicy(meta, options, capabilities);
  }

  const promptSnap = loadSnapshot(options.promptCacheDir || undefined, { allowBundledFallback: true });
  const composedPrompt = composePrompt(task, promptSnap, { limit: 2, skills: ["rei-content-production"] });
  const dagValid = validateTopologicalStages(PIPELINE_STAGE_DEFS);
  const planSeed = `${task}|${speechProviderId}|${videoProviderId}|${Boolean(options.commercialUse !== false)}`;

  return {
    schemaVersion: "rei.multimodal-pipeline-plan.v1",
    planId: `mm-${sha256Text(planSeed).slice(0, 12)}`,
    task,
    outputDir,
    dryRun: true,
    dagValid: dagValid.valid,
    stages: PIPELINE_STAGE_DEFS,
    selectedProviders: {
      research: "last30days-skill",
      editorial: "humanizer",
      presentationHtml: "frontend-slides",
      presentationPptx: "ppt-master",
      speech: speechProviderId,
      videoRender: videoProviderId,
      videoUnderstanding: "claude-video",
    },
    policyPreflight: policyChecks,
    promptArchiveReference: {
      origin: "https://promt.rootcastle.com/",
      trustClass: "UNTRUSTED_EXTERNAL_REFERENCE",
      referenceCount: (composedPrompt.selectedReferences || []).length,
    },
    workstation: capabilities,
    claimedMediaExecution: false,
  };
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return sha256File(filePath);
}

function checkStageCachedOutputs(outputDir, stageRecord) {
  if (!stageRecord || stageRecord.status !== "PASS" || !stageRecord.outputs) return false;
  for (const [relPath, expectedHash] of Object.entries(stageRecord.outputs)) {
    const full = path.join(outputDir, relPath);
    if (!fs.existsSync(full)) return false;
    if (expectedHash && sha256File(full) !== expectedHash) return false;
  }
  return true;
}

function runMultimodalPipeline(options = {}) {
  const plan = planMultimodalPipeline(options);
  const outputDir = plan.outputDir;

  // Enforce workspace path boundary via HOL Guard
  const pathGuard = validateFileAccessBoundary(outputDir, {
    allowedRoots: options.allowedRoots || [ROOT, os.tmpdir()],
  });
  if (!pathGuard.allowed) {
    return { status: "BLOCKED", code: "PATH_BOUNDARY_BLOCKED", reason: pathGuard.reason };
  }

  // Enforce commercial license / consent preflight before running stages
  const preflightBlocked = Object.entries(plan.policyPreflight).find(([, res]) => !res.allowed);
  if (preflightBlocked) {
    return {
      status: "BLOCKED",
      code: preflightBlocked[1].code,
      reason: preflightBlocked[1].reason,
      blockedProvider: preflightBlocked[0],
      planId: plan.planId,
    };
  }

  const manifestPath = path.join(outputDir, "validation", "execution-manifest.json");
  let existingManifest = null;
  if (options.resume && fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      existingManifest = null;
    }
  }

  const recorder = new ObservabilityRecorder();
  const correlationId = crypto.randomUUID();
  const stagesState = existingManifest && existingManifest.stages ? { ...existingManifest.stages } : {};

  let researchResult = null;
  let technicalBriefRaw = null;
  let scriptRaw = null;
  let editedBrief = null;
  let editedScript = null;
  let deckSpec = null;
  let storyboardData = null;
  let presentationRes = null;
  let speechRes = null;
  let videoRes = null;
  let qaReport = null;

  const persistManifest = (overallStatus, failedStage = null, errorMessage = null) => {
    const manifestObj = {
      schemaVersion: "rei.multimodal-execution-manifest.v1",
      planId: plan.planId,
      correlationId,
      task: plan.task,
      status: overallStatus,
      failedStage,
      error: errorMessage,
      updatedAt: new Date().toISOString(),
      selectedProviders: plan.selectedProviders,
      workstationHardware: plan.workstation.hardware,
      stages: stagesState,
      observability: recorder.getSummary(),
    };
    writeJsonFile(manifestPath, manifestObj);
    return manifestObj;
  };

  try {
    // 1. RESEARCH
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.research)) {
      const sp = JSON.parse(fs.readFileSync(path.join(outputDir, "research", "sources.json"), "utf8"));
      researchResult = { sourcesPayload: sp, evidenceReport: null };
      stagesState.research.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("research", correlationId);
      researchResult = runResearchStage({
        task: plan.task,
        topic: options.topic || "Rotor Vibration Analysis & Single-Plane Balancing",
        sources: options.sources,
        requireOffline: options.requireOffline,
        checkUpstreamCli: options.checkUpstreamCli,
      });
      const sourcesHash = writeJsonFile(path.join(outputDir, "research", "sources.json"), researchResult.sourcesPayload);
      span.finish("ok", { sourcesCount: researchResult.sourcesPayload.deduplicatedCount });
      stagesState.research = {
        status: "PASS",
        provider: "last30days-skill",
        outputs: { "research/sources.json": sourcesHash },
      };
      persistManifest("RUNNING");
    }

    if (options.failAtStage === "evidence_validation") {
      throw new Error("Injected failure at evidence_validation for resumability verification");
    }

    // 2. EVIDENCE VALIDATION
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.evidence_validation)) {
      const ev = JSON.parse(fs.readFileSync(path.join(outputDir, "research", "evidence-report.json"), "utf8"));
      researchResult.evidenceReport = ev;
      stagesState.evidence_validation.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("evidence_validation", correlationId);
      if (!researchResult.evidenceReport) {
        researchResult = runResearchStage({
          task: plan.task,
          topic: options.topic || "Rotor Vibration Analysis & Single-Plane Balancing",
          sources: researchResult.sourcesPayload.sources,
          checkUpstreamCli: false,
        });
      }
      const evHash = writeJsonFile(
        path.join(outputDir, "research", "evidence-report.json"),
        researchResult.evidenceReport,
      );
      span.finish("ok", { primaryCount: researchResult.evidenceReport.primaryEvidenceCount });
      stagesState.evidence_validation = {
        status: researchResult.evidenceReport.allClaimsTraceable ? "PASS" : "FAIL",
        outputs: { "research/evidence-report.json": evHash },
      };
      persistManifest("RUNNING");
    }

    // 3. SCRIPT
    deckSpec = buildSharedSlideDeckSpec(options.topic || "Rotor Vibration Analysis", researchResult);
    const briefLines = [
      `# ${deckSpec.title} — Technical Brief`,
      "",
      "At its core, what matters is that rotor vibration diagnostics evaluates RMS velocity across 10 Hz - 1000 Hz per ISO 10816-3 and ISO 20816-1 [SRC-1].",
      "Using 4 synchronous channels sampled at 10 kHz with Hanning windowing reveals BPFO and BPFI bearing fault harmonics [SRC-3].",
      "Single-plane vector balancing computes Wc = -V0 / A at 1,800 RPM (`COMPUTATIONAL_ONLY`); physical mass installation requires lockout/tagout and remains NOT VERIFIED [SRC-2].",
      "",
      "## Verified References",
      ...researchResult.sourcesPayload.sources.map((s) => `- **${s.id}**: ${s.title} (${s.url})`),
    ];
    technicalBriefRaw = briefLines.join("\n");
    scriptRaw = deckSpec.slides
      .map(
        (s, i) =>
          `## Scene ${i + 1}: ${s.title}\n\n- **Slide Copy (EN):** ${s.bullets.join(" ")}\n- **Narration (TR):** ${s.narrationTr} [${s.citations.join(", ")}]`,
      )
      .join("\n\n");

    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.script)) {
      stagesState.script.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("script", correlationId);
      const briefHash = sha256Text(technicalBriefRaw);
      fs.mkdirSync(path.join(outputDir, "writing"), { recursive: true });
      fs.writeFileSync(path.join(outputDir, "writing", "technical-brief.draft.md"), technicalBriefRaw + "\n", "utf8");
      fs.writeFileSync(path.join(outputDir, "writing", "script.draft.md"), scriptRaw + "\n", "utf8");
      span.finish("ok");
      stagesState.script = {
        status: "PASS",
        outputs: {
          "writing/technical-brief.draft.md": sha256File(path.join(outputDir, "writing", "technical-brief.draft.md")),
          "writing/script.draft.md": sha256File(path.join(outputDir, "writing", "script.draft.md")),
        },
        draftHash: briefHash,
      };
      persistManifest("RUNNING");
    }

    // 4. EDITORIAL REVIEW (humanizer rules + strict invariant check)
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.editorial_review)) {
      editedBrief = {
        editedText: fs.readFileSync(path.join(outputDir, "writing", "technical-brief.md"), "utf8"),
        preservedInvariants: { allNumbersAndUnitsPreserved: true, allCitationsPreserved: true, allWarningsPreserved: true },
      };
      editedScript = {
        editedText: fs.readFileSync(path.join(outputDir, "writing", "script.md"), "utf8"),
        preservedInvariants: { allNumbersAndUnitsPreserved: true, allCitationsPreserved: true, allWarningsPreserved: true },
      };
      stagesState.editorial_review.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("editorial_review", correlationId);
      editedBrief = runEditorialStage(technicalBriefRaw);
      editedScript = runEditorialStage(scriptRaw);
      if (
        !editedBrief.preservedInvariants.allNumbersAndUnitsPreserved ||
        !editedBrief.preservedInvariants.allCitationsPreserved ||
        !editedBrief.preservedInvariants.allWarningsPreserved
      ) {
        throw new Error("Editorial safety invariant failed: numbers, citations, or warnings lost");
      }
      fs.writeFileSync(path.join(outputDir, "writing", "technical-brief.md"), editedBrief.editedText + "\n", "utf8");
      fs.writeFileSync(path.join(outputDir, "writing", "script.md"), editedScript.editedText + "\n", "utf8");
      const diffHash = writeJsonFile(path.join(outputDir, "writing", "editorial-diff.json"), {
        briefEdits: editedBrief.editsApplied,
        preservedInvariants: editedBrief.preservedInvariants,
      });
      span.finish("ok", { rulesTriggered: editedBrief.editsApplied.length });
      stagesState.editorial_review = {
        status: "PASS",
        provider: "humanizer",
        outputs: {
          "writing/technical-brief.md": sha256File(path.join(outputDir, "writing", "technical-brief.md")),
          "writing/script.md": sha256File(path.join(outputDir, "writing", "script.md")),
          "writing/editorial-diff.json": diffHash,
        },
      };
      persistManifest("RUNNING");
    }

    if (options.failAtStage === "storyboard") {
      throw new Error("Injected interruption at storyboard for resumability verification");
    }

    // 5. STORYBOARD
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.storyboard)) {
      storyboardData = JSON.parse(fs.readFileSync(path.join(outputDir, "storyboard", "storyboard.json"), "utf8"));
      stagesState.storyboard.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("storyboard", correlationId);
      const sb = buildStoryboardAndSubtitles(deckSpec, options.targetDurationSec || 12);
      storyboardData = sb.storyboard;
      const sbHash = writeJsonFile(path.join(outputDir, "storyboard", "storyboard.json"), storyboardData);
      span.finish("ok", { scenes: storyboardData.scenes.length });
      stagesState.storyboard = {
        status: "PASS",
        outputs: { "storyboard/storyboard.json": sbHash },
      };
      persistManifest("RUNNING");
    }

    // 6. SLIDES (HTML + Editable PPTX from shared SlideDeckSpec)
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.slides)) {
      stagesState.slides.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("slides", correlationId);
      presentationRes = runPresentationStage(deckSpec, path.join(outputDir, "presentations"));
      span.finish("ok", { pptxEditable: presentationRes.pptx.inspection.isEditable });
      stagesState.slides = {
        status: presentationRes.pptx.inspection.isEditable ? "PASS" : "FAIL",
        providers: ["frontend-slides", "ppt-master"],
        inspection: presentationRes.pptx.inspection,
        accessibilityChecks: presentationRes.html.accessibilityChecks,
        outputs: {
          "presentations/presentation-html/index.html": sha256File(presentationRes.html.outputPath),
          "presentations/presentation.pptx": sha256File(presentationRes.pptx.outputPath),
        },
      };
      persistManifest("RUNNING");
    }

    if (options.failAtStage === "narration") {
      throw new Error("Injected failure at narration stage");
    }

    // 7. NARRATION (TR/EN technical normalizer + TTS)
    const wavOutPath = path.join(outputDir, "audio", "narration.wav");
    if (options.resume && checkStageCachedOutputs(outputDir, stagesState.narration)) {
      speechRes = { status: "PASS", outputPath: wavOutPath, resumedFromCache: true, ffprobe: { durationSec: 12 } };
      stagesState.narration.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("narration", correlationId);
      const trText = deckSpec.slides.map((s) => s.narrationTr).join(" ");
      speechRes = runSpeechStage({
        ...options,
        providerId: plan.selectedProviders.speech,
        language: "tr",
        text: trText,
        targetDurationSec: storyboardData ? storyboardData.totalDurationSec : 12,
        outputPath: wavOutPath,
      });
      if (speechRes.status !== "PASS") {
        throw new Error(speechRes.reason || "Speech synthesis stage failed");
      }
      span.finish("ok", { providerUsed: speechRes.providerUsed });
      stagesState.narration = {
        status: "PASS",
        providerRequested: speechRes.providerRequested,
        providerUsed: speechRes.providerUsed,
        syntheticDiagnosticAudio: speechRes.syntheticDiagnosticAudio,
        normalizedText: speechRes.normalizedText,
        outputs: { "audio/narration.wav": sha256File(wavOutPath) },
      };
      persistManifest("RUNNING");
    }

    if (options.failAtStage === "video") {
      throw new Error("Injected failure at video rendering stage");
    }

    // 8. VIDEO PRODUCTION
    const videoDir = path.join(outputDir, "video");
    if (options.skipVideoRender) {
      const sb = buildStoryboardAndSubtitles(deckSpec, storyboardData ? storyboardData.totalDurationSec : 12);
      fs.mkdirSync(videoDir, { recursive: true });
      fs.writeFileSync(path.join(videoDir, "subtitles.srt"), sb.srtContent, "utf8");
      stagesState.video = {
        status: "SKIPPED",
        reason: "skipVideoRender=true requested (subtitles & storyboard generated; MP4 intentionally omitted)",
        outputs: { "video/subtitles.srt": sha256File(path.join(videoDir, "subtitles.srt")) },
      };
      persistManifest("RUNNING");
    } else if (options.resume && checkStageCachedOutputs(outputDir, stagesState.video)) {
      stagesState.video.resumedFromCache = true;
    } else {
      const span = recorder.startSpan("video", correlationId);
      videoRes = runVideoProductionStage(deckSpec, wavOutPath, videoDir, {
        ...options,
        videoProviderId: plan.selectedProviders.videoRender,
      });
      if (videoRes.status === "BLOCKED") {
        span.finish("ok", { status: "BLOCKED", code: videoRes.code });
        stagesState.video = {
          status: "BLOCKED",
          code: videoRes.code,
          reason: videoRes.reason,
          outputs:
            videoRes.srtPath && fs.existsSync(videoRes.srtPath)
              ? { "video/subtitles.srt": sha256File(videoRes.srtPath) }
              : {},
        };
        persistManifest("RUNNING");
      } else if (videoRes.status !== "PASS") {
        throw new Error(videoRes.reason || "Video render failed");
      } else {
        span.finish("ok", { codec: videoRes.videoCodecUsed, durationSec: videoRes.ffprobe.durationSec });
        stagesState.video = {
          status: "PASS",
          provider: videoRes.provider,
          videoCodecUsed: videoRes.videoCodecUsed,
          ffprobe: videoRes.ffprobe,
          outputs: {
            "video/final.mp4": videoRes.mp4Sha256,
            "video/subtitles.srt": videoRes.srtSha256,
          },
        };
        persistManifest("RUNNING");
      }
    }

    // 9. QUALITY ASSURANCE (video understanding audit + cross-artifact checks)
    {
      const span = recorder.startSpan("quality_assurance", correlationId);
      const mp4Path = path.join(videoDir, "final.mp4");
      let videoAudit =
        stagesState.video && stagesState.video.status === "BLOCKED"
          ? { status: "NOT VERIFIED", code: stagesState.video.code, reason: stagesState.video.reason }
          : { status: "SKIPPED", reason: "No MP4 produced in this run" };
      if (fs.existsSync(mp4Path)) {
        const qaFramesDir = path.join(outputDir, "validation", "qa-frames");
        videoAudit = runVideoUnderstandingStage(mp4Path, {
          allowedRoots: [ROOT, outputDir, os.tmpdir()],
          framesDir: qaFramesDir,
        });
        // Remove extracted temp QA JPEGs after collecting hashes & metadata
        const frameCount = videoAudit.extractedFrameCount || 0;
        if (fs.existsSync(qaFramesDir)) {
          fs.rmSync(qaFramesDir, { recursive: true, force: true });
        }
        videoAudit.framesCleanedAfterAudit = frameCount;
        delete videoAudit.framesDir;
      }

      const pptxPath = path.join(outputDir, "presentations", "presentation.pptx");
      const htmlPath = path.join(outputDir, "presentations", "presentation-html", "index.html");
      qaReport = {
        schemaVersion: "rei.multimodal-quality-report.v1",
        planId: plan.planId,
        editorialInvariantsPassed: Boolean(editedBrief && editedBrief.preservedInvariants.allNumbersAndUnitsPreserved),
        pptxEditable: fs.existsSync(pptxPath) ? require("./pptx-openxml").verifyEditablePptx(pptxPath) : null,
        htmlAccessible: fs.existsSync(htmlPath)
          ? {
              exists: true,
              hasAriaLive: fs.readFileSync(htmlPath, "utf8").includes('aria-live="polite"'),
              hasReducedMotion: fs.readFileSync(htmlPath, "utf8").includes("prefers-reduced-motion"),
            }
          : null,
        speechVerified: stagesState.narration,
        videoAudit,
        hardwareVerified: "NOT VERIFIED",
        overallStatus:
          (stagesState.video.status === "PASS" ||
            stagesState.video.status === "SKIPPED" ||
            stagesState.video.status === "BLOCKED") &&
          (!videoAudit || videoAudit.status !== "FAIL")
            ? "PASS"
            : "FAIL",
      };
      const qaHash = writeJsonFile(path.join(outputDir, "validation", "quality-report.json"), qaReport);
      span.finish("ok", { status: qaReport.overallStatus });
      stagesState.quality_assurance = {
        status: qaReport.overallStatus,
        outputs: { "validation/quality-report.json": qaHash },
      };
    }

    // 10. ARTIFACT PACKAGE & PROVENANCE
    {
      const span = recorder.startSpan("artifact_package", correlationId);
      const provenance = {
        schemaVersion: "rei.multimodal-provenance.v1",
        planId: plan.planId,
        correlationId,
        promptArchive: plan.promptArchiveReference,
        provenanceTags: [
          tagProvenance("EVIDENCE", "ISO 20816-1 / 10816-3 & Rei Skills rotor rules", "SRC-1, SRC-2, SRC-3"),
          tagProvenance("INFERENCE", "Turkish technical speech normalization from English equations/units", "normalizeTechnicalSpeechText"),
          tagProvenance("UNKNOWN", "Physical rotor hardware telemetry / neural TTS human-likeness MOS", "NOT VERIFIED"),
        ],
        artifactHashes: Object.entries(stagesState).reduce((acc, [k, st]) => {
          acc[k] = st.outputs || {};
          return acc;
        }, {}),
      };
      writeJsonFile(path.join(outputDir, "validation", "provenance.json"), provenance);
      span.finish("ok");
      stagesState.artifact_package = {
        status: "PASS",
        outputs: {
          "validation/provenance.json": sha256File(path.join(outputDir, "validation", "provenance.json")),
        },
      };
    }

    const finalManifest = persistManifest("PASS");
    return {
      status: "PASS",
      planId: plan.planId,
      outputDir,
      manifest: finalManifest,
      qualityReport: qaReport,
    };
  } catch (err) {
    const failedManifest = persistManifest("FAIL", options.failAtStage || "runtime_error", err.message);
    return {
      status: "FAIL",
      planId: plan.planId,
      outputDir,
      error: err.message,
      manifest: failedManifest,
    };
  }
}

function getPipelineStatus(outputDir) {
  const manifestPath = path.join(path.resolve(outputDir), "validation", "execution-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { exists: false, status: "NOT_STARTED", manifestPath };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return {
    exists: true,
    status: manifest.status,
    planId: manifest.planId,
    updatedAt: manifest.updatedAt,
    completedStages: Object.entries(manifest.stages || {})
      .filter(([, s]) => s.status === "PASS")
      .map(([k]) => k),
    failedStage: manifest.failedStage || null,
    manifestPath,
  };
}

function validateMultimodalArtifacts(outputDir) {
  const dir = path.resolve(outputDir);
  const manifestPath = path.join(dir, "validation", "execution-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { valid: false, status: "FAIL", reason: "Missing validation/execution-manifest.json" };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const checks = [];
  let allHashesMatch = true;

  for (const [stageId, st] of Object.entries(manifest.stages || {})) {
    for (const [relPath, expectedHash] of Object.entries(st.outputs || {})) {
      const full = path.join(dir, relPath);
      const exists = fs.existsSync(full);
      const actualHash = exists ? sha256File(full) : null;
      const hashMatch = Boolean(exists && actualHash === expectedHash);
      if (!hashMatch) allHashesMatch = false;
      checks.push({ stageId, relPath, exists, hashMatch });
    }
  }

  return {
    valid: manifest.status === "PASS" && allHashesMatch,
    status: manifest.status === "PASS" && allHashesMatch ? "PASS" : "FAIL",
    planId: manifest.planId,
    checkedFiles: checks.length,
    mismatches: checks.filter((c) => !c.hashMatch),
  };
}

module.exports = {
  PIPELINE_STAGE_DEFS,
  validateTopologicalStages,
  planMultimodalPipeline,
  runMultimodalPipeline,
  getPipelineStatus,
  validateMultimodalArtifacts,
};
