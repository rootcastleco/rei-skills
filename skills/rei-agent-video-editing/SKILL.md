---
name: rei-agent-video-editing
description: "Perform safe, parameterized FFmpeg video cutting, concatenation, audio muxing, and color grading aligned with browser-use/video-use (MIT, commit 43cfc56). Enforces path boundaries and filtergraph injection guards before executing local media edits."
category: development
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - video-editing
    - video-use
    - ffmpeg
    - srt
    - media
---

# REI Agent Video Editing (`video-use` Adapter)

Coordinate repeatable FFmpeg timeline edits, phrase-aligned trims, audio fades, and color grading safely without arbitrary shell interpolation.

## When to Use

- Editing existing camera/screen-capture footage (`.mp4`, `.mov`, `.mkv`), slicing segments cleanly, or applying deterministic color/subtitle chains.
- Choosing between conversational footage editing (`video-use`) vs HTML scene rendering (`rei-programmatic-video`) vs opt-in AGPL studio orchestration (`rei-video-production-studio`).

## Inputs and Outputs

- **Inputs:** Validated source video paths, audio track (`.wav`), subtitle file (`.srt`), and clamped numeric trim/grade parameters.
- **Outputs:** Edited `.mp4` deliverable validated via `ffprobe` (duration, resolution, audio sync, SHA-256 digest).

## Prerequisites & License Constraints

- Upstream: `browser-use/video-use` (`MIT`, commit `43cfc566833548093455c9d4a46bd69913b7e552`).
- Requires `ffmpeg` / `ffprobe`. Optional cloud speech alignment (`ELEVENLABS_API_KEY`) is metered and never transmitted implicitly without approval.

## Offline vs Online Capabilities

- **Offline:** Cutting, concatenation, color LUT filtergraphs, and subtitle muxing run offline via local FFmpeg.
- **Online (Opt-In):** External word-level alignment via ElevenLabs Scribe only when `ELEVENLABS_API_KEY` is supplied and explicitly authorized.

## Procedure

1. Constrain input/output file paths via `validateFileAccessBoundary` (blocking `../`, sensitive directories, and shell metacharacters).
2. Clamp numeric trim start/end timestamps (`seconds >= 0`) and spawn `ffmpeg` with `shell: false` argument arrays.
3. Validate resulting `.mp4` streams via `ffprobe`.

```sh
node bin/install.js providers list --domain video --json
node -e 'const {evaluateProviderPolicy,loadProviderManifest}=require("./lib/multimodal-registry"); const m=loadProviderManifest().providers.find(p=>p.id==="video-use"); console.log(evaluateProviderPolicy(m,{commercialUse:true}));'
```

## Do not use

Constraints and safety: Operational boundary — never pass raw user strings unescaped into `-filter_complex` or shell commands, never download copyrighted media without rights, and never silently upload proprietary footage to third-party alignment APIs.

## Verification Criteria & Failure Recovery

- Confirm FFmpeg exit code `0`, output byte size `> 0`, valid `ffprobe` streams, and non-zero video duration.

## Authoritative product references

- https://github.com/browser-use/video-use
