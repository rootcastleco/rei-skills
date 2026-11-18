---
name: rei-programmatic-video
description: "Compose deterministic 1280x720 MP4 videos and timed SRT subtitles from storyboards, slide frames, and narration audio integrating heygen-com/hyperframes patterns (Apache-2.0, commit e83ddae) and FFmpeg. Verify dimensions, codecs, duration, and audio sync via ffprobe."
category: development
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - video
    - hyperframes
    - ffmpeg
    - mp4
    - subtitles
    - storyboard
---

# REI Programmatic Video (`HyperFrames` & FFmpeg Renderer)

Render deterministic, multi-scene educational `.mp4` videos paired with synchronized `.srt` captions and narration audio using `heygen-com/hyperframes` (`Apache-2.0`) authoring concepts and local FFmpeg via [`lib/multimodal-providers.js`](../../lib/multimodal-providers.js).

## When to Use

- Converting a validated `storyboard/storyboard.json`, shared slide deck specification, and `audio/narration.wav` into playable `.mp4` output.
- Rendering motion-graphic engineering briefs, chart explanations, and citation overlays programmatically.

## Inputs and Outputs

- **Inputs:** Validated `storyboard.json` + `SlideDeckSpec`, synchronized `audio/narration.wav`, and workspace output directory.
- **Outputs:** `video/final.mp4` (`1280x720` `yuv420p` video + `aac` audio) and `video/subtitles.srt` (UTF-8 timed Turkish/English captions), plus `ffprobe` validation metadata and SHA-256 checksums.

## Prerequisites & License Constraints

- Upstream: `heygen-com/hyperframes` (`Apache-2.0`, commit `e83ddaed28b426104c041c3e7fe3fa9eee9689ad`).
- Requires local `ffmpeg` and `ffprobe` (optional `@hyperframes/engine` + headless Chrome when HTML browser capture is desired). Python `Pillow` (`PIL`) accelerates local slide card rendering.

## Offline vs Online Capabilities

- **Offline:** Full scene timing, frame generation, `.srt` generation, and FFmpeg H.264/AAC encoding operate 100% locally offline.

## Procedure

1. Compute scene durations aligned cleanly to measured `audio/narration.wav` duration.
2. Render clean `1280x720` scene cards (`#000000` / `#0E3D8A` / `#228B55`) with citations and harmonic plots.
3. Encode with FFmpeg (`shell: false`, validated paths) and verify `ffprobe` streams (`width`, `height`, `durationSec > 0`, audio stream presence).

```sh
node bin/install.js pipeline run "Rotor vibration analysis brief with Turkish narration" --output ./tmp-video --json
ffprobe -v quiet -print_format json -show_format -show_streams tmp-video/video/final.mp4
```

## Do not use

Constraints and safety: Operational boundary — never substitute a JSON storyboard for a requested `.mp4` file; if FFmpeg is missing, return explicit `BLOCKED (MISSING_FFMPEG)`. Respect copyright on external footage.

## Verification Criteria & Failure Recovery

- Verify `integrityValid === true`, `ffprobe.video.width === 1280`, `ffprobe.video.height === 720`, and `ffprobe.audio.sampleRate > 0`.
- Temporary PNG frames must live in `os.tmpdir()` and be cleaned up in a `finally` block.

## Authoritative product references

- https://github.com/heygen-com/hyperframes
