# REI Skills — Multimodal Production Pipeline & Capability Ecosystem

**Architecture Version:** `rei.multimodal-pipeline.v1`  
**Provider Manifest:** [`data/multimodal-providers.json`](../data/multimodal-providers.json)  
**Verified Example Deliverables:** [`examples/multimodal-rotor-demo/`](../examples/multimodal-rotor-demo/README.md)

---

## 1. Architecture Overview

The multimodal extension integrates into the existing **REI Skills** control plane (MCP + CLI + Hybrid Router + REI Ultimate Orchestrator + Workflow DAG + HOL Guard + Observability) without duplicating routing engines or security boundaries:

```text
Agent Client (Claude Code / Codex / Gemini CLI / Cursor / Copilot)
                      │
                      ▼
        bin/mcp-server.js & bin/install.js (`pipeline`, `providers`)
                      │
                      ▼
       lib/hybrid-router.js (EN/TR + Stack + Phrase Discovery)
                      │
                      ▼
   lib/multimodal-pipeline.js (10-Stage Resumable DAG + SHA-256)
     ├─ Policy Gate: lib/hol-guard-policy.js + lib/multimodal-registry.js
     ├─ Prompt Ref:  lib/prompt-archive.js (UNTRUSTED_EXTERNAL_REFERENCE)
     └─ Telemetry:   lib/observability.js (`[EVIDENCE]`/`[INFERENCE]`/`[UNKNOWN]`)
                      │
                      ▼
    Modular Capability Adapters (lib/multimodal-providers.js + lib/pptx-openxml.js)
     ├─ Research:       last30days-skill + deduplicated citation collector
     ├─ Video Audit:    claude-video (ffprobe/ffmpeg keyframe & stream inspector)
     ├─ Editorial:      humanizer (EN/TR anti-filler with unit/citation locks)
     ├─ Slides:         shared SlideDeckSpec -> frontend-slides HTML + OpenXML PPTX
     ├─ Speech (TTS):   Pocket TTS / Phonon / ZONOS3-Mini + deterministic WAV fallback
     └─ Video Render:   HyperFrames / video-use / isolated OpenMontage + FFmpeg MP4/SRT
```

---

## 2. Upstream Integration & Licensing Matrix (`11` Projects + Fallback)

| Provider ID | Upstream Repository & Pinned Commit | Code License | Model-Weight / External License | Commercial Use & Gate | Integration Mode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `last30days-skill` | `mvanhorn/last30days-skill` (`a854f3b`) | `MIT` | `N/A` | Allowed (`OPENAI_API_KEY`/`XAI_API_KEY` optional; offline corpus fallback) | Bundled `skills/last30days` + adapter |
| `claude-video` | `bradautomates/claude-video` (`03ceb42`) | `MIT` | Optional `WhisperX` 3.8.6 + Silero (`MIT`/`BSD`) | Allowed (`yt-dlp`/cloud transcription opt-in only) | Native `ffprobe` / `ffmpeg` adapter |
| `humanizer` | `blader/humanizer` (`b48c832`) | `MIT` | `N/A` | Allowed (`0` external deps) | Native EN/TR rule engine (`rei-technical-writing-editor`) |
| `frontend-slides` | `zarazhangrui/frontend-slides` (`9906a34`) | `MIT` | `N/A` | Allowed (zero-dependency HTML; optional Playwright PDF) | Bundled `skills/frontend-slides` + `renderHtmlPresentation` |
| `ppt-master` | `hugohe3/ppt-master` (`4478b1f`) | `MIT` | `N/A` (inline credit if CC-BY external media used) | Allowed (pure Node OpenXML builder, real shapes/tables/notes) | Native OpenXML adapter (`lib/pptx-openxml.js`) |
| `hyperframes` | `heygen-com/hyperframes` (`e83ddae`) | `Apache-2.0` | `N/A` | Allowed (`Apache-2.0` Notice preserved) | Local `PIL`/FFmpeg 1280×720 H.264/AAC renderer |
| `video-use` | `browser-use/video-use` (`43cfc56`) | `MIT` | ElevenLabs API terms if cloud alignment enabled | Allowed locally (`ELEVENLABS_API_KEY` opt-in) | Parameterized FFmpeg filtergraph adapter |
| `openmontage` | `OpenMontageInc/OpenMontage` (`2e003e6`) | `AGPL-3.0` | Mixed third-party providers | **BLOCKED by default (`LICENSE_AGPL_BLOCKED`)**; requires explicit `allowAgplProviders=true` | Isolated external provider boundary only |
| `pocket-tts` | `kyutai-labs/pocket-tts` (`a4a6054`, `v4.0.1`) | `MIT` | `CC-BY-4.0` (`kyutai/pocket-tts`), per-voice terms | Commercial with CC-BY attribution; **Turkish unsupported**; consent gate on cloning | Optional external CPU CLI + consent check |
| `phonon` | `gradium-ai/xn-ptts` (`ce2b35c`, `v0.7.1`) | `MIT OR Apache-2.0` | `Apache-2.0` (`phonon-31m-en` ONLY); **`CC-BY-NC-4.0`** (`phonon-40m-*`) | **`phonon-40m-*` BLOCKED in commercial mode (`MODEL_LICENSE_NON_COMMERCIAL_BLOCKED`)** | License-gated optional CLI + `phonon-31m-en` default |
| `zonos3-mini` | `Zyphra/ZONOS3-Mini` (`a50e141`) | `MIT` | `MIT` (`NOTICE`: Mini-SGLang `MIT`, NeMo `Apache-2.0`) | Commercial (`~9 GB` weights opt-in only, localhost `127.0.0.1:1919` SSRF cap) | Localhost adapter + consent gate |
| `deterministic-dsp-fallback` | Built-in (`lib/multimodal-providers.js`) | `MIT` | `N/A` | Unconditional commercial & CI offline use | Zero-weight EN/TR textnorm + 24 kHz PCM WAV |

---

## 3. Unified 10-Stage Pipeline & CLI / MCP Reference

Stages executed in topological DAG order:

`research` → `evidence_validation` → `script` → `editorial_review` → `storyboard` → `slides` → `narration` → `video` → `quality_assurance` → `artifact_package`

### CLI Commands

```bash
node bin/install.js providers list --commercial --json
node bin/install.js providers doctor --json
node bin/install.js pipeline plan "Rotor vibration brief with Turkish narration" --json
node bin/install.js pipeline run "Rotor vibration brief with Turkish narration" --output ./my-run --json
node bin/install.js pipeline status --output ./my-run --json
node bin/install.js pipeline run "Rotor vibration brief with Turkish narration" --output ./my-run --resume --json
node bin/install.js pipeline validate --output ./my-run --json
```

### Opt-In MCP Tools (`REI_MCP_EXTENDED_TOOLS=1`)

Default `tools/list` preserves exact backwards compatibility (**10** default tools). Setting `REI_MCP_EXTENDED_TOOLS=1` also exposes read-only tools allowlisted in [`lib/hol-guard-policy.js`](../lib/hol-guard-policy.js):
- `rei_multimodal_providers` (`read_only`, `inherit`)
- `rei_multimodal_pipeline_plan` (`read_only`, `inherit`, dry-run planning only)

---

## 4. STRIDE Threat Model & Supply-Chain Boundaries

| Threat Category | Attack Vector | Mitigation in REI Skills |
| :--- | :--- | :--- |
| **Spoofing / Voice Identity** | Unauthorized speaker cloning via `pocket-tts`, `phonon`, `zonos3-mini` | Default deny (`VOICE_CLONING_CONSENT_REQUIRED`) unless `voiceCloningConsent: { authorized: true, speakerName, consentRecordId }` is present. |
| **Tampering / Prompt Injection** | Hostile webpages, transcripts, or external `SKILL.md`/Prompt Archive text | `UNTRUSTED_EXTERNAL_REFERENCE` tagging, `detectPromptInjection`, and SHA-256 verification across stage manifests. |
| **Repudiation / Editorial Drift** | AI filler rewriting drops quantitative limits, citations, or `NOT VERIFIED` flags | `runEditorialStage` extracts and asserts 100% parity on numbers, SI units, `[SRC-*]` citations, and warnings before saving. |
| **Information Disclosure / SSRF** | Secret leakage in logs or unapproved outbound HTTP calls / `file://` traversal | `redactAndScanSecrets` in `observability.js`; `validateFileAccessBoundary`; zero shell interpolation (`shell: false`). |
| **Denial of Service / Bloat** | Heavy PyTorch/WhisperX checkpoints bloated into npm package or runaway FFmpeg | `package.json` `"files"` excludes model checkpoints & `rust/rei-hook-gateway/target/`; resource budgets + subprocess timeouts (`15s`–`45s`) enforced. |
| **Elevation / Cross-License** | Silent inclusion of `AGPL-3.0` (`OpenMontage`) or `CC-BY-NC-4.0` (`phonon-40m`) | Hard policy failures `LICENSE_AGPL_BLOCKED` and `MODEL_LICENSE_NON_COMMERCIAL_BLOCKED` in commercial mode. |

---

## 5. Workstation Hardware & Measured Benchmarks

Measured on actual development host (`win32 x64`, `Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz`, `12` logical cores, `15.91 GB` RAM, `39.28 GB` free disk, `Node v22.19.0`, `Python 3.14.7`, `FFmpeg 8.0-full_build`):

- **Workstation Native Media Ready:** `ffmpeg 8.0` and `ffprobe 8.0` verified (`readyForPipelineExecution: true`, `nativeMediaRendererReady: true`).
- **End-to-End 10-Stage Demo (`examples/multimodal-rotor-demo`):**
  - Editable PowerPoint (`presentation.pptx`): `13,544` bytes (`3` slides, `15` editable `<p:sp>` text shapes, `3` native `<a:tbl>` tables, `3` speaker notes slides, `imageOnlySlides: 0`).
  - Interactive HTML Deck (`presentation-html/index.html`): `8,328` bytes (keyboard navigation, `aria-live`, `prefers-reduced-motion`).
  - Turkish Normalized Audio (`audio/narration.wav`): `576,044` bytes (`12.0s`, `24000 Hz`, `pcm_s16le`, `deterministic-dsp-fallback`, `neuralTtsWeightsExecuted: false`).
  - Rendered Video (`video/final.mp4`): `233,816` bytes (`12.0s`, `1280x720`, `24 fps`, `h264` + `aac`) with `video/subtitles.srt` (`608` bytes).
  - External Neural Weights (`pocket-tts`, `phonon`, `zonos3-mini`, `whisperx`) & GPU Inference: **NOT VERIFIED** locally (weights not downloaded to keep base package lightweight).

---

## 6. Rollback & Safe Maintenance

1. Removing the multimodal extension requires zero core schema migrations: revert the commit or remove `lib/multimodal-*.js`, `lib/pptx-openxml.js`, `data/multimodal-providers.json`, and the 11 `skills/rei-*` multimodal directories, then re-run `npm run build`.
2. Partial/failed pipeline runs leave earlier SHA-256 verified outputs untouched; resume cleanly with `--resume` or delete only `<outputDir>/validation/execution-manifest.json` to trigger a clean rebuild.
