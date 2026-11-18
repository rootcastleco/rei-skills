---
name: rei-multilingual-voice
description: "Turkish and English technical speech normalization and MIT-licensed Zyphra/ZONOS3-Mini voice generation adapter (commit a50e141), pairing unit/number/acronym expansion (Hz, kHz, mm/s, RPM, ISO) with loopback SSRF limits, explicit cloning consent, and offline DSP WAV fallback."
category: data-ai
risk: critical
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - zonos3-mini
    - turkish-tts
    - multilingual
    - text-normalization
    - wav
    - speech
---

# REI Multilingual Voice (`ZONOS3-Mini` & EN/TR Normalizer)

Normalize Turkish and English technical numbers, SI units, acronyms, dates, and ISO identifiers for clear pronunciation and coordinate MIT-licensed `Zyphra/ZONOS3-Mini` synthesis (`ggml` CPU/Metal or Linux CUDA) with an explicit deterministic fallback via [`lib/multimodal-providers.js`](../../lib/multimodal-providers.js).

## When to Use

- Narrating engineering presentations or educational videos containing Turkish or English technical terms (`10 kHz`, `1,800 RPM`, `2.4 mm/s²`, `ISO 10816-3`, `%95`).
- Running MIT-licensed multilingual neural TTS via an authorized local `127.0.0.1:1919` ZONOS3-Mini server or deterministic offline WAV synthesis.

## Inputs and Outputs

- **Inputs:** Bilingual script text (`tr` or `en`), target speech provider (`zonos3-mini`), optional `voiceCloningConsent` record, and output `.wav` path.
- **Outputs:** Normalized spoken text string, verified PCM `.wav` file (`24000 Hz`, mono, SHA-256 digest, `ffprobe` stream check), and transparent `neuralTtsWeightsExecuted` boolean flag.

## Prerequisites & License Constraints

- Upstream: `Zyphra/ZONOS3-Mini` (`MIT`, commit `a50e14117d99181ba7f28047b451ba03ba1a09a9`; `NOTICE` attributes Mini-SGLang `MIT` and NVIDIA NeMo-text-processing `Apache-2.0`).
- **Hardware & Weights Boundary:** Full PyTorch CUDA weights require ~9 GB disk/GPU (`ggml` supports CPU/Metal without CUDA). Heavy weights are **never** downloaded automatically on `npm install`.
- Voice cloning requires explicit documented speaker consent. ZONOS3 HTTP calls remain confined to `127.0.0.1` loopback.

## Offline vs Online Capabilities

- **Offline:** Turkish & English technical text normalization (`normalizeTechnicalSpeechText`) and diagnostic acoustic WAV synthesis run 100% locally offline with zero weights.
- **Local Server:** Verified offline on local GPU/ggml host once weights are explicitly installed by the operator.

## Procedure

1. Pass raw narration text through `normalizeTechnicalSpeechText(text, "tr" | "en")`.
2. Verify voice-cloning consent before touching any speaker reference clip.
3. Synthesize or convert `44.1 kHz f32le PCM` / WAV cleanly with FFmpeg and inspect with `ffprobe`.

```sh
node -e 'const {normalizeTechnicalSpeechText,runSpeechStage}=require("./lib/multimodal-providers"); console.log(normalizeTechnicalSpeechText("4 kanal 10 kHz ve 2.4 mm/s2 ISO 10816-3", "tr")); console.log(runSpeechStage({text:"4 kanal 10 kHz test.", language:"tr", outputPath:"tmp-tr-test.wav"}));'
```

## Do not use

Constraints and safety: Operational boundary — never clone third-party voices without documented consent, never bind remote speech endpoints off loopback without authentication, and never report deterministic fallback audio as neural human-voice synthesis (`neuralTtsWeightsExecuted: false`).

## Verification Criteria & Failure Recovery

- Verify normalized Turkish output expands numbers and units (`on kilohertz`, `milimetre bölü saniye`) accurately, and confirm `ffprobe` validates `audio/narration.wav` (`durationSec > 0`, `codec_name: "pcm_s16le"`).

## Authoritative product references

- https://github.com/Zyphra/ZONOS3-Mini
