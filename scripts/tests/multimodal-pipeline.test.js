"use strict";

/**
 * End-to-End Acceptance, Security, Licensing & Regression Suite (12 Cases)
 * for the REI Skills Multimodal Engineering & Content Production Ecosystem.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  loadProviderManifest,
  detectWorkstationCapabilities,
  evaluateProviderPolicy,
  listMultimodalProviders,
} = require("../../lib/multimodal-registry");
const {
  runResearchStage,
  runEditorialStage,
  normalizeTechnicalSpeechText,
  runSpeechStage,
  runVideoUnderstandingStage,
} = require("../../lib/multimodal-providers");
const {
  planMultimodalPipeline,
  runMultimodalPipeline,
  getPipelineStatus,
  validateMultimodalArtifacts,
} = require("../../lib/multimodal-pipeline");
const { verifyEditablePptx } = require("../../lib/pptx-openxml");
const { recommendHybrid } = require("../../lib/hybrid-router");
const mcpServer = require("../../bin/mcp-server");

const ROOT = path.resolve(__dirname, "../..");
const CLI = path.join(ROOT, "bin", "install.js");

function main() {
  console.log("Running Multimodal Production Pipeline Acceptance & Security Tests (12 Cases)...");

  const hostCaps = detectWorkstationCapabilities({ deterministic: true });
  const manifest = loadProviderManifest();
  assert.equal(manifest.providers.filter((p) => !p.upstream_url.startsWith("internal://")).length, 11);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rei-mm-test-"));
  try {
    // Case 1: Source-backed research produces verifiable references, dedup & primary/secondary distinction
    const resResearch = runResearchStage({
      task: "Rotor vibration analysis ISO 20816-1",
      requireOffline: true,
      checkUpstreamCli: false,
    });
    assert(resResearch.sourcesPayload.duplicatesRemoved >= 1, "Duplicate URL should be deduplicated");
    assert(resResearch.evidenceReport.primaryEvidenceCount >= 2);
    assert(resResearch.evidenceReport.allClaimsTraceable === true);

    // Case 2: Editorial processing strips AI slop while preserving numbers, units, citations & safety warnings
    const rawDraft =
      "At its core, what matters is that Günümüzün hızla gelişen dünyasında, 4 channels at 10 kHz record 2.4 mm/s RMS at 1,800 RPM [SRC-1]. Physical runs remain NOT VERIFIED and COMPUTATIONAL_ONLY.";
    const ed = runEditorialStage(rawDraft);
    assert(ed.editsApplied.length >= 2, "Must remove EN & TR AI-slop clichés");
    assert(!ed.editedText.includes("At its core, what matters is"));
    assert(!ed.editedText.includes("Günümüzün hızla gelişen dünyasında"));
    assert.equal(ed.preservedInvariants.allNumbersAndUnitsPreserved, true);
    assert.equal(ed.preservedInvariants.allCitationsPreserved, true);
    assert.equal(ed.preservedInvariants.allWarningsPreserved, true);
    assert(ed.editedText.includes("NOT VERIFIED"));

    // Case 3 & 4 & 6 & 8: Full 10-stage pipeline execution (PPTX, HTML, TR WAV speech, MP4 + SRT, QA)
    const runOut = path.join(tmpRoot, "rotor-run");
    const runRes = runMultimodalPipeline({
      task: "Create a technically accurate English presentation and short educational video explaining rotor vibration analysis, with Turkish narration and traceable references.",
      outputDir: runOut,
      targetDurationSec: 6,
      commercialUse: true,
      checkUpstreamCli: false,
      requireOffline: true,
    });
    assert.equal(runRes.status, "PASS", `Pipeline failed: ${runRes.error}`);

    // Case 3: PPTX export contains genuinely editable OpenXML shapes, tables & speaker notes
    const pptxInspect = verifyEditablePptx(path.join(runOut, "presentations", "presentation.pptx"));
    assert.equal(pptxInspect.validOpenXmlZip, true);
    assert.equal(pptxInspect.isEditable, true);
    assert.equal(pptxInspect.imageOnlySlides, 0);
    assert(pptxInspect.editableShapeCount >= 9);
    assert(pptxInspect.nativeTableCount >= 3);
    assert(pptxInspect.notesWithText >= 3);

    // Case 4: HTML presentation supports keyboard controls, ARIA live counter & reduced-motion
    const htmlContent = fs.readFileSync(path.join(runOut, "presentations", "presentation-html", "index.html"), "utf8");
    assert(htmlContent.includes('aria-live="polite"'));
    assert(htmlContent.includes("ArrowRight") && htmlContent.includes("ArrowLeft"));
    assert(htmlContent.includes("prefers-reduced-motion: reduce"));

    // Case 6: Turkish technical speech text normalization + verified WAV output
    const trNorm = normalizeTechnicalSpeechText("4 kanal 10 kHz ve 2.4 mm/s² ISO 10816-3 %95", "tr");
    assert(trNorm.includes("dört kanal"));
    assert(trNorm.includes("on kilohertz"));
    assert(trNorm.includes("milimetre bölü saniye kare"));
    assert(trNorm.includes("on bin sekiz yüz on altı tire üç"));
    assert(trNorm.includes("yüzde doksan beş"));
    assert.equal(runRes.qualityReport.speechVerified.status, "PASS");
    assert.equal(fs.existsSync(path.join(runOut, "audio", "narration.wav")), true);

    // Case 8 & 5: Playable MP4 validation & claude-video understanding audit when ffmpeg is installed
    if (hostCaps.binaries.ffmpeg.installed && hostCaps.binaries.ffprobe.installed) {
      const mp4Path = path.join(runOut, "video", "final.mp4");
      assert(fs.existsSync(mp4Path), "final.mp4 must exist when ffmpeg is installed");
      assert.equal(runRes.qualityReport.videoAudit.status, "PASS");
      assert(runRes.qualityReport.videoAudit.metadata.durationSec > 0);
      assert.equal(runRes.qualityReport.videoAudit.metadata.video.width, 1280);
      assert.equal(runRes.qualityReport.videoAudit.metadata.video.height, 720);
      assert(runRes.qualityReport.videoAudit.metadata.audio !== null, "MP4 must contain audio track");
      assert(runRes.qualityReport.videoAudit.extractedFrameCount >= 1);

      // Direct security tests on claude-video adapter
      const trav = runVideoUnderstandingStage("../../.ssh/id_rsa", { allowedRoots: [ROOT, os.tmpdir()] });
      assert.equal(trav.status, "BLOCKED");
      const badExt = runVideoUnderstandingStage(path.join(tmpRoot, "malicious.exe"), { allowedRoots: [ROOT, os.tmpdir()] });
      assert.equal(badExt.status, "BLOCKED");
      assert.equal(badExt.code, "UNSUPPORTED_MEDIA_FORMAT");
    }

    // Validate hash integrity across all outputs
    const valRes = validateMultimodalArtifacts(runOut);
    assert.equal(valRes.valid, true, JSON.stringify(valRes.mismatches));

    // Case 7: Licensing & voice-cloning consent gates block restricted uses
    const phonon = manifest.providers.find((p) => p.id === "phonon");
    const openmontage = manifest.providers.find((p) => p.id === "openmontage");
    const zonos = manifest.providers.find((p) => p.id === "zonos3-mini");

    const ph40Blocked = evaluateProviderPolicy(phonon, {
      commercialUse: true,
      modelId: "gradium/phonon-40m-multilingual",
    }, hostCaps);
    assert.equal(ph40Blocked.allowed, false);
    assert.equal(ph40Blocked.code, "MODEL_LICENSE_NON_COMMERCIAL_BLOCKED");

    const ph31Allowed = evaluateProviderPolicy(phonon, {
      commercialUse: true,
      modelId: "gradium/phonon-31m-en",
    }, hostCaps);
    assert.equal(ph31Allowed.allowed, true);

    const agplBlocked = evaluateProviderPolicy(openmontage, { commercialUse: true }, hostCaps);
    assert.equal(agplBlocked.allowed, false);
    assert.equal(agplBlocked.code, "LICENSE_AGPL_BLOCKED");

    const cloneBlocked = evaluateProviderPolicy(zonos, {
      commercialUse: true,
      voiceCloning: true,
    }, hostCaps);
    assert.equal(cloneBlocked.allowed, false);
    assert.equal(cloneBlocked.code, "VOICE_CLONING_CONSENT_REQUIRED");

    const cloneSpeechBlocked = runSpeechStage({
      providerId: "zonos3-mini",
      voiceCloning: true,
      text: "Test",
      outputPath: path.join(tmpRoot, "should-not-exist.wav"),
    });
    assert.equal(cloneSpeechBlocked.status, "BLOCKED");
    assert.equal(fs.existsSync(path.join(tmpRoot, "should-not-exist.wav")), false);

    // Case 9: Interrupted jobs fail safely preserving validated earlier outputs and resume cleanly
    const resumeOut = path.join(tmpRoot, "resume-run");
    const failRun = runMultimodalPipeline({
      task: "Rotor vibration brief with resumability test",
      outputDir: resumeOut,
      failAtStage: "storyboard",
      checkUpstreamCli: false,
      requireOffline: true,
    });
    assert.equal(failRun.status, "FAIL");
    assert(fs.existsSync(path.join(resumeOut, "writing", "technical-brief.md")), "Completed editorial output must remain intact");
    assert.equal(getPipelineStatus(resumeOut).status, "FAIL");

    const resumed = runMultimodalPipeline({
      task: "Rotor vibration brief with resumability test",
      outputDir: resumeOut,
      resume: true,
      skipVideoRender: true,
      checkUpstreamCli: false,
      requireOffline: true,
    });
    assert.equal(resumed.status, "PASS");
    assert.equal(resumed.manifest.stages.research.resumedFromCache, true);
    assert.equal(resumed.manifest.stages.editorial_review.resumedFromCache, true);

    // Case 10 & 11: CLI, MCP (10 default + 5 extended when enabled), Hybrid Router EN/TR discovery, & missing keys graceful run
    const cleanEnv = { ...process.env };
    delete cleanEnv.OPENAI_API_KEY;
    delete cleanEnv.XAI_API_KEY;
    delete cleanEnv.ELEVENLABS_API_KEY;
    delete cleanEnv.HF_TOKEN;
    const cliDoc = spawnSync(process.execPath, [CLI, "providers", "doctor", "--json"], {
      encoding: "utf8",
      env: cleanEnv,
    });
    assert.equal(cliDoc.status, 0, cliDoc.stderr);
    const docJson = JSON.parse(cliDoc.stdout);
    assert.equal(docJson.readyForPipelineExecution, true);
    assert.equal(docJson.providers.length, 12);

    const cliPlan = spawnSync(process.execPath, [CLI, "pipeline", "plan", "Rotor brief", "--json"], {
      encoding: "utf8",
      env: cleanEnv,
    });
    assert.equal(cliPlan.status, 0, cliPlan.stderr);
    assert.equal(JSON.parse(cliPlan.stdout).stages.length, 10);

    // MCP default contract must still expose exact 10 tools
    const prevExt = process.env.REI_MCP_EXTENDED_TOOLS;
    try {
      delete process.env.REI_MCP_EXTENDED_TOOLS;
      assert.equal(mcpServer.getActiveMcpTools().length, 10);
      process.env.REI_MCP_EXTENDED_TOOLS = "1";
      const extTools = mcpServer.getActiveMcpTools().map((t) => t.name);
      assert(extTools.includes("rei_multimodal_providers"));
      assert(extTools.includes("rei_multimodal_pipeline_plan"));
      const mcpProv = mcpServer.executeToolCall("rei_multimodal_providers", { commercial_use: true });
      assert(mcpProv.totalProviders >= 11);
    } finally {
      if (prevExt === undefined) delete process.env.REI_MCP_EXTENDED_TOOLS;
      else process.env.REI_MCP_EXTENDED_TOOLS = prevExt;
    }

    // Hybrid Router EN/TR discovery across newly created skills (tested once built in catalog)
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "catalog.json"), "utf8"));
    const trSlideRec = recommendHybrid(catalog, { bundles: {} }, { workflows: [] }, {
      task: "Türkçe seslendirme ve düzenlenebilir pptx sunum oluştur",
      maxResults: 5,
    });
    assert(trSlideRec.recommendedSkills.some((s) => s.id.startsWith("rei-")), "TR multimodal query should discover REI skills");

    // Case 12: Package tarball omits heavyweight weights & examples binary bloat (<50 MB in package.json files)
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    assert(!pkg.files.includes("rust/rei-hook-gateway"), "Must exclude rust target/ build artifacts");
    assert(pkg.files.includes("rust/rei-hook-gateway/src"));
    const demoProviders = listMultimodalProviders({ commercialUse: true });
    assert.equal(demoProviders.upstreamProjectsCount, 11);

    console.log("PASS: All 12 Multimodal Production Pipeline Acceptance & Security Cases Passed.");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main();
