"use strict";

/**
 * Multimodal Capability Registry, Workstation Detector & Licensing Policy Engine.
 *
 * Audits all 11 integrated upstream media/research/speech projects + built-in
 * deterministic fallbacks, detects actual host binaries and hardware resources,
 * and enforces HOL Guard + commercial license + voice-cloning consent gates.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "multimodal-providers.json");

function loadProviderManifest(manifestPath = MANIFEST_PATH) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Multimodal provider manifest missing at ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function probeBinary(cmd, args = ["--version"]) {
  try {
    const res = spawnSync(cmd, args, {
      encoding: "utf8",
      timeout: 3500,
      shell: false,
      windowsHide: true,
    });
    if (res.status === 0) {
      const firstLine = String(res.stdout || res.stderr || "").trim().split(/\r?\n/)[0] || "detected";
      return { installed: true, version: firstLine.slice(0, 120) };
    }
  } catch {
    // Missing binary handled cleanly below
  }
  return { installed: false, version: null };
}

function probePythonModule(pythonCmd, moduleName) {
  try {
    const res = spawnSync(pythonCmd, ["-c", `import ${moduleName}`], {
      encoding: "utf8",
      timeout: 3500,
      shell: false,
      windowsHide: true,
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

function getDiskStatsSafe(targetDir = ROOT) {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(targetDir);
      const freeBytes = Number(stats.bavail) * Number(stats.bsize);
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      return {
        freeGb: Number((freeBytes / 1024 ** 3).toFixed(2)),
        totalGb: Number((totalBytes / 1024 ** 3).toFixed(2)),
      };
    }
  } catch {
    // Fallback if statfs unavailable
  }
  return { freeGb: null, totalGb: null };
}

function detectWorkstationCapabilities(options = {}) {
  if (options.probeOverride) {
    return options.probeOverride;
  }

  const pyCmd = probeBinary("python", ["--version"]).installed ? "python" : "python3";
  const ffmpeg = probeBinary("ffmpeg", ["-version"]);
  const ffprobe = probeBinary("ffprobe", ["-version"]);
  const python = probeBinary(pyCmd, ["--version"]);
  const node = { installed: true, version: process.version };
  const cargo = probeBinary("cargo", ["--version"]);
  const uv = probeBinary("uv", ["--version"]);
  const ytdlp = probeBinary("yt-dlp", ["--version"]);
  const ptts = probeBinary("ptts", ["--version"]);
  const pocketTts = probeBinary("pocket-tts", ["--help"]);
  const hyperframes = probeBinary("hyperframes", ["--version"]);

  const pythonModules = python.installed
    ? {
        yaml: probePythonModule(pyCmd, "yaml"),
        PIL: probePythonModule(pyCmd, "PIL"),
        wave: probePythonModule(pyCmd, "wave"),
        pptx: probePythonModule(pyCmd, "pptx"),
        whisperx: probePythonModule(pyCmd, "whisperx"),
        pocket_tts: probePythonModule(pyCmd, "pocket_tts"),
        zonos3: probePythonModule(pyCmd, "zonos3"),
      }
    : {};

  const credentials = {
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    XAI_API_KEY: Boolean(process.env.XAI_API_KEY),
    ELEVENLABS_API_KEY: Boolean(process.env.ELEVENLABS_API_KEY),
    HF_TOKEN: Boolean(process.env.HF_TOKEN),
  };

  const cpus = os.cpus() || [];
  return {
    schemaVersion: "rei.workstation-capabilities.v1",
    probedAt: options.deterministic ? "deterministic" : new Date().toISOString(),
    os: {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
    },
    hardware: {
      cpuCount: cpus.length,
      cpuModel: cpus[0] ? cpus[0].model : "unknown",
      totalRamGb: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
      freeRamGb: Number((os.freemem() / 1024 ** 3).toFixed(2)),
      disk: getDiskStatsSafe(ROOT),
    },
    binaries: {
      node,
      python: { ...python, command: pyCmd },
      cargo,
      uv,
      ffmpeg,
      ffprobe,
      "yt-dlp": ytdlp,
      ptts,
      "pocket-tts": pocketTts,
      hyperframes,
    },
    pythonModules,
    credentialsPresent: credentials,
  };
}

/**
 * Enforces commercial licensing, AGPL isolation, voice cloning consent, and
 * external API privacy/network gates for a provider invocation.
 */
function evaluateProviderPolicy(provider, context = {}, hostCaps = null) {
  if (!provider) {
    return { allowed: false, code: "PROVIDER_UNKNOWN", reason: "Provider not registered" };
  }

  const commercialUse = context.commercialUse !== undefined ? Boolean(context.commercialUse) : true;
  const allowAgpl = Boolean(context.allowAgplProviders);
  const allowNonCommercial = Boolean(context.allowNonCommercialModelWeights);
  const requestedModel = context.modelId || context.model || null;
  const cloningRequested = Boolean(context.voiceCloning || context.referenceAudioPath);

  // 1. AGPL copyleft gate (OpenMontage)
  if (String(provider.license || "").toUpperCase().includes("AGPL") && commercialUse && !allowAgpl) {
    return {
      allowed: false,
      code: "LICENSE_AGPL_BLOCKED",
      reason: `${provider.name} is licensed under AGPL-3.0. Blocked under commercial clean-room policy unless allowAgplProviders=true and executed as an isolated external worker.`,
    };
  }

  // 2. Model-weight non-commercial gate (Phonon 40m CC-BY-NC-4.0)
  if (provider.id === "phonon") {
    const modelName = String(requestedModel || "gradium/phonon-31m-en");
    const variants = provider.model_variants || {};
    const variantMeta = variants[modelName];
    const isNonCommercialModel =
      (variantMeta && !variantMeta.commercial_use) ||
      /phonon-40m|cc-by-nc/i.test(modelName);

    if (commercialUse && !allowNonCommercial && isNonCommercialModel) {
      return {
        allowed: false,
        code: "MODEL_LICENSE_NON_COMMERCIAL_BLOCKED",
        reason: `Model '${modelName}' is licensed under CC-BY-NC-4.0 (Non-Commercial Only). Use 'gradium/phonon-31m-en' (Apache-2.0), ZONOS3-Mini (MIT), or pass allowNonCommercialModelWeights=true for strictly non-commercial work.`,
      };
    }
  }

  // 3. Explicit voice cloning consent gate (Pocket TTS, Phonon, ZONOS3-Mini)
  if (cloningRequested) {
    if (provider.voice_cloning_policy === "not_supported_clean_room") {
      return {
        allowed: false,
        code: "VOICE_CLONING_UNSUPPORTED",
        reason: `${provider.name} does not support voice cloning.`,
      };
    }
    const consent = context.voiceCloningConsent;
    const validConsent =
      consent &&
      consent.authorized === true &&
      typeof consent.speakerName === "string" &&
      consent.speakerName.trim().length > 1 &&
      typeof consent.consentRecordId === "string" &&
      consent.consentRecordId.trim().length > 2;

    if (!validConsent) {
      return {
        allowed: false,
        code: "VOICE_CLONING_CONSENT_REQUIRED",
        reason: "Voice cloning is disabled by default. Provide voiceCloningConsent { authorized: true, speakerName, consentRecordId, timestamp } from the voice owner.",
      };
    }
  }

  // 4. Explicit remote network gate
  if (context.requireOffline && provider.requires_network === true) {
    return {
      allowed: false,
      code: "OFFLINE_NETWORK_BLOCKED",
      reason: `${provider.name} requires network connectivity, blocked by requireOffline=true.`,
    };
  }

  // 5. Runtime availability check (distinguish native vs built-in fallback)
  let runtimeStatus = "READY_FALLBACK";
  let missingDeps = [];

  if (hostCaps) {
    const bins = hostCaps.binaries || {};
    const pyMods = hostCaps.pythonModules || {};
    if (provider.id === "hyperframes" || provider.id === "video-use" || provider.id === "claude-video") {
      if (bins.ffmpeg && bins.ffmpeg.installed && bins.ffprobe && bins.ffprobe.installed) {
        runtimeStatus = "READY_NATIVE_FFMPEG";
      } else {
        missingDeps.push("ffmpeg", "ffprobe");
        runtimeStatus = "DEGRADED_MISSING_FFMPEG";
      }
    } else if (provider.id === "pocket-tts") {
      runtimeStatus = pyMods.pocket_tts || (bins["pocket-tts"] && bins["pocket-tts"].installed)
        ? "READY_NATIVE"
        : "OPTIONAL_EXTERNAL_NOT_INSTALLED";
    } else if (provider.id === "phonon") {
      runtimeStatus = bins.ptts && bins.ptts.installed
        ? "READY_NATIVE"
        : "OPTIONAL_EXTERNAL_NOT_INSTALLED";
    } else if (provider.id === "zonos3-mini") {
      runtimeStatus = pyMods.zonos3 ? "READY_NATIVE" : "OPTIONAL_EXTERNAL_NOT_INSTALLED";
    } else if (provider.id === "openmontage") {
      runtimeStatus = "ISOLATED_EXTERNAL_OPT_IN";
    } else if (
      provider.id === "humanizer" ||
      provider.id === "frontend-slides" ||
      provider.id === "ppt-master" ||
      provider.id === "deterministic-dsp-fallback" ||
      provider.id === "last30days-skill"
    ) {
      runtimeStatus = "READY_NATIVE";
    }
  }

  return {
    allowed: true,
    code: "ALLOWED",
    reason: null,
    runtimeStatus,
    missingDeps,
  };
}

function listMultimodalProviders(options = {}) {
  const manifest = loadProviderManifest(options.manifestPath);
  const hostCaps = options.capabilities || detectWorkstationCapabilities({ deterministic: options.deterministic });
  const domainFilter = options.domain ? String(options.domain).toLowerCase() : null;

  const entries = (manifest.providers || [])
    .filter((p) => !domainFilter || String(p.domain || "").toLowerCase().includes(domainFilter))
    .map((provider) => {
      const policy = evaluateProviderPolicy(provider, options, hostCaps);
      return {
        id: provider.id,
        name: provider.name,
        domain: provider.domain,
        upstream_url: provider.upstream_url,
        commit_sha: provider.commit_sha,
        license: provider.license,
        model_license: provider.model_license,
        commercial_use: provider.commercial_use,
        integration_mode: provider.integration_mode,
        rei_skill_id: provider.rei_skill_id,
        existing_skill_id: provider.existing_skill_id || null,
        policyDecision: policy.allowed ? "ALLOWED" : "BLOCKED",
        policyCode: policy.code,
        policyReason: policy.reason,
        runtimeStatus: policy.runtimeStatus || (policy.allowed ? "UNKNOWN" : "BLOCKED_BY_POLICY"),
        missingDeps: policy.missingDeps || [],
      };
    });

  return {
    schemaVersion: "rei.provider-status-list.v1",
    totalProviders: entries.length,
    upstreamProjectsCount: entries.filter((e) => !String(e.upstream_url).startsWith("internal://")).length,
    workstation: hostCaps,
    providers: entries,
  };
}

function runMultimodalDoctor(options = {}) {
  const commercialReport = listMultimodalProviders({
    ...options,
    commercialUse: options.commercialUse !== undefined ? options.commercialUse : true,
    allowAgplProviders: Boolean(options.allowAgplProviders),
    allowNonCommercialModelWeights: Boolean(options.allowNonCommercialModelWeights),
  });

  const ffmpegReady = Boolean(
    commercialReport.workstation.binaries.ffmpeg &&
      commercialReport.workstation.binaries.ffmpeg.installed &&
      commercialReport.workstation.binaries.ffprobe &&
      commercialReport.workstation.binaries.ffprobe.installed
  );

  return {
    schemaVersion: "rei.multimodal-doctor.v1",
    readyForPipelineExecution: true,
    nativeMediaRendererReady: ffmpegReady,
    blockedByDefaultCommercialPolicy: commercialReport.providers
      .filter((p) => p.policyDecision === "BLOCKED")
      .map((p) => ({ id: p.id, code: p.policyCode, reason: p.policyReason })),
    workstation: commercialReport.workstation,
    providers: commercialReport.providers,
    optionalInstalls: [
      {
        provider: "pocket-tts",
        command: "pip install pocket-tts==4.0.1",
        note: "CPU TTS (~6x real-time, CC-BY-4.0 weights downloaded on first use).",
      },
      {
        provider: "phonon",
        command: "cargo install --git https://github.com/gradium-ai/xn-ptts --rev ce2b35c ptts-cli",
        note: "Commercial projects MUST stick to gradium/phonon-31m-en (Apache-2.0); 40m models are CC-BY-NC-4.0.",
      },
      {
        provider: "claude-video (whisperx)",
        command: "setup optional Python 3.12 + whisperx==3.8.6 (~3 GB disk)",
        note: "Base container metadata + keyframe inspection runs immediately using installed ffprobe/ffmpeg.",
      },
      {
        provider: "openmontage",
        command: "isolated external clone only (AGPL-3.0 copyleft)",
        note: "Never bundled inside core rei-skills npm distribution.",
      },
    ],
  };
}

module.exports = {
  ROOT,
  MANIFEST_PATH,
  loadProviderManifest,
  detectWorkstationCapabilities,
  evaluateProviderPolicy,
  listMultimodalProviders,
  runMultimodalDoctor,
};
