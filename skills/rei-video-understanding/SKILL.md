---
name: rei-video-understanding
description: "Analyze video containers, durations, resolutions, audio channels, and extracted keyframes using bradautomates/claude-video patterns (commit 03ceb42) and local ffprobe/ffmpeg, with explicit WhisperX boundary reporting. Use when inspecting rendered or supplied video files with grounded timestamps."
category: data-ai
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - video
    - claude-video
    - ffprobe
    - ffmpeg
    - keyframes
    - analysis
---

# REI Video Understanding (`claude-video` Adapter)

Extract verifiable stream metadata, keyframes, and timestamped scene observations from video files using [`lib/multimodal-providers.js`](../../lib/multimodal-providers.js) (`runVideoUnderstandingStage`).

## When to Use

- Auditing rendered videos (`final.mp4`) or supplied engineering clips (`.mp4`, `.mov`, `.mkv`, `.webm`, `.m4v`, `.avi`).
- Checking real duration in seconds, pixel dimensions (`width x height`), video/audio codecs, and extracting keyframes at grounded timestamps.

## Inputs and Outputs

- **Inputs:** Validated workspace/temp video path (`validateFileAccessBoundary` enforced; supported extensions only).
- **Outputs:** JSON inspection report containing `ffprobe` container/stream metrics, `extractedFrameCount`, timestamped `segments[]`, SHA-256 digest, and explicit `transcriptStatus` / uncertainty disclosures.

## Prerequisites & License Constraints

- Upstream: `bradautomates/claude-video` (`MIT`, commit `03ceb42f7fa2c4439aca01752118044baabffb8f`).
- Requires local `ffprobe` and `ffmpeg`. Optional `whisperx` (3.8.6, ~3 GB free disk) is never installed automatically during `npm install`.

## Offline vs Online Capabilities

- **Offline:** Full container inspection and FFmpeg keyframe extraction operate locally with zero network calls or API keys.
- **Online / Extended:** Cloud transcription APIs or remote `yt-dlp` downloads remain opt-in and disabled by default for security and cost control.

## Procedure

1. Validate path confinement and reject unsupported extensions or traversal attempts (`../`, credential paths).
2. Run `ffprobe -show_format -show_streams` and extract representative 1 fps keyframes with `ffmpeg`.
3. Attach exact timestamps and report `transcriptStatus: NOT_VERIFIED` when WhisperX is absent.

```sh
ffprobe -v quiet -print_format json -show_format -show_streams video/final.mp4
node bin/install.js pipeline validate --output ./examples/multimodal-rotor-demo --json
```

## Do not use

Constraints and safety: Operational boundary — do not claim semantic ASR speech transcription when WhisperX is missing, do not fabricate video timestamps, and never download copyrighted external streams without rights.

## Verification Criteria & Failure Recovery

- Verify `metadata.ok === true`, `durationSec > 0`, valid `width x height` integers, and non-empty `segments[]`.
- Clean temporary extracted `.jpg` frames immediately after QA audit.

## Authoritative product references

- https://github.com/bradautomates/claude-video
