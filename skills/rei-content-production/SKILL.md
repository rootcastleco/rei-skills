---
name: rei-content-production
description: "Orchestrate the 10-stage auditable multimodal research-to-media pipeline (Research, Evidence Validation, Script, Editorial Review, Storyboard, HTML/PPTX Slides, Narration, Video, QA, Artifact Package) via lib/multimodal-pipeline.js with license and safety gates. Activate when producing technical presentations, narrated educational videos, or traceable briefings."
category: workflow
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - multimodal
    - pipeline
    - presentation
    - video
    - tts
    - research
    - turkish
---

# REI Content Production — 10-Stage Multimodal Pipeline

Coordinate reproducible, source-backed research, editing, interactive HTML + editable `.pptx` slide generation, Turkish/English speech synthesis, FFmpeg video rendering, and SHA-256 provenance verification through [`lib/multimodal-pipeline.js`](../../lib/multimodal-pipeline.js).

## When to Use

- The user requests an end-to-end technical briefing, presentation deck, and/or narrated educational video backed by traceable citations.
- A task spans multiple media modalities (for example: `"Create an English rotor vibration presentation and video with Turkish narration and references"`).
- Resumable, hash-verified multi-stage execution (`rei-skills pipeline run --resume`) is needed so interrupted renders preserve earlier verified artifacts.

## Inputs and Outputs

- **Inputs:** Technical prompt/topic, optional scoped sources JSON, optional `voiceCloningConsent` record, commercial/AGPL policy flags (`--commercial`, `--allow-agpl`), and output directory.
- **Outputs:** Structured artifact tree under `<outputDir>/`:
  - `research/sources.json`, `research/evidence-report.json`
  - `writing/technical-brief.md`, `writing/script.md`, `writing/editorial-diff.json`
  - `storyboard/storyboard.json`
  - `presentations/presentation-html/index.html`, `presentations/presentation.pptx`
  - `audio/narration.wav`, `video/final.mp4`, `video/subtitles.srt`
  - `validation/quality-report.json`, `validation/provenance.json`, `validation/execution-manifest.json`

## Prerequisites & License Constraints

- Enforces commercial licensing gates by default: `openmontage` (`AGPL-3.0`) and `gradium/phonon-40m-*` (`CC-BY-NC-4.0`) remain blocked unless explicitly permitted.
- Voice cloning requires an explicit signed consent object; disabled by default.
- Requires local `ffmpeg` / `ffprobe` for `.mp4` video encoding (`video/final.mp4`); gracefully degrades to `SKIPPED`/`BLOCKED` with honest status if absent.

## Offline vs Online Capabilities

- Runs 100% offline using scoped local corpora, deterministic OpenXML PPTX writing, HTML deck rendering, TR/EN speech text normalization, DSP acoustic WAV fallback, and local FFmpeg rendering.
- Live upstream research queries (`OPENAI_API_KEY`, `XAI_API_KEY`) and optional external neural TTS downloads (`pocket-tts`, `ptts`, `zonos3`) remain strictly opt-in.

## Procedure

1. Preflight workstation runtimes, provider licenses, and disk capacity (`node bin/install.js providers doctor`).
2. Plan the 10-stage DAG and inspect resource budgets without writing artifacts (`dryRun`).
3. Execute stages sequentially with SHA-256 checkpointing and resume if interrupted.
4. Inspect `validation/quality-report.json` and `validation/execution-manifest.json` before distribution.

```sh
node bin/install.js pipeline plan "Rotor vibration analysis brief with Turkish narration" --commercial --json
node bin/install.js pipeline run "Rotor vibration analysis brief with Turkish narration" --output ./artifacts-rotor --json
node bin/install.js pipeline validate --output ./artifacts-rotor --json
```

## Do not use

Constraints and safety: Operational boundary — do not claim physical lab measurements (`hardware_verified` remains `NOT VERIFIED`), do not fabricate missing audio/video renders when FFmpeg is absent, and never execute untrusted upstream prompt/script payloads directly.

## Verification Criteria & Failure Recovery

- Verify exit status `0` and check that `validation/execution-manifest.json` reports `"status": "PASS"` across minimum thresholds (`durationSec > 0`, `width >= 1280`, `isEditable: true`, `mismatches.length === 0`).
- On stage interruption, re-run with `--resume` to reuse SHA-256-verified prior stage outputs without corrupting existing deliverables.

## Authoritative product references

- https://github.com/rootcastleco/rei-skills
- https://promt.rootcastle.com/
