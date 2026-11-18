---
name: rei-local-speech-synthesis
description: "Provider-independent CPU speech synthesis integrating kyutai-labs/pocket-tts (v4.0.1, MIT code / CC-BY-4.0 weights) and gradium-ai/xn-ptts Phonon (v0.7.1, Apache-2.0 31m-en vs CC-BY-NC-4.0 40m-* license gate), enforcing voice-cloning consent and clean WAV conversion."
category: data-ai
risk: critical
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - tts
    - speech
    - pocket-tts
    - phonon
    - wav
    - license-gate
---

# REI Local Speech Synthesis (`Pocket TTS` & `Phonon`)

Synthesize low-latency CPU audio while strictly separating permissive source licenses from non-commercial or attribution-gated model weights and enforcing explicit voice-cloning consent via [`lib/multimodal-registry.js`](../../lib/multimodal-registry.js).

## When to Use

- Generating English or European-language (FR/DE/ES/PT/IT/NL via Pocket TTS; EN commercial via Phonon `31m-en`) speech audio locally on CPU without heavyweight GPU dependencies.
- Enforcing automated blocks when commercial runs accidentally request non-commercial `gradium/phonon-40m-*` (`CC-BY-NC-4.0`) checkpoints or unauthorized voice cloning.

## Inputs and Outputs

- **Inputs:** Normalized plain text (numbers/SI units expanded), provider ID (`pocket-tts` or `phonon`), model ID (`gradium/phonon-31m-en` default commercial-safe), `commercialUse` flag, and mandatory `voiceCloningConsent` if reference voice audio is supplied.
- **Outputs:** Verified 16-bit PCM `.wav` file with SHA-256 digest, `ffprobe` stream report, synthesis latency, and explicit provider/fallback provenance.

## Prerequisites & License Constraints

- **Pocket TTS:** `https://github.com/kyutai-labs/pocket-tts` (`v4.0.1`, commit `a4a6054`, code `MIT`, model weights `CC-BY-4.0`, voice-specific licenses in `kyutai/tts-voices`, supports EN/FR/DE/PT/IT/ES/NL — **Turkish NOT supported**).
- **Phonon (`xn-ptts`):** `https://github.com/gradium-ai/xn-ptts` (`v0.7.1`, commit `ce2b35c`, code `MIT OR Apache-2.0`). **CRITICAL:** `gradium/phonon-31m-en` (English) is **`Apache-2.0`**, whereas `gradium/phonon-40m-*` and `gradium/phonon-40m-multilingual` are **`CC-BY-NC-4.0` (Non-Commercial Only)** and gated via `HF_TOKEN`.
- **Installation isolation:** Neither `pocket-tts` (~PyTorch) nor Hugging Face checkpoints are downloaded during normal `npm install rei-skills`.

## Offline vs Online Capabilities

- **Offline:** Policy evaluation, EN/TR technical text normalization, and deterministic acoustic WAV fallback run 100% offline.
- **External CLI:** Real neural CPU synthesis runs locally offline once external weights are explicitly cached by the user.

## Procedure

1. Run `evaluateProviderPolicy()` to validate model license compatibility (`commercialUse` rejects `phonon-40m-*`).
2. Reject any reference audio cloning attempt missing `{ authorized: true, speakerName, consentRecordId }`.
3. Generate or synthesize `.wav` and confirm `ffprobe` reports `codec=pcm_s16le` and `durationSec > 0`.

```sh
node -e 'const {evaluateProviderPolicy,loadProviderManifest}=require("./lib/multimodal-registry"); const ph=loadProviderManifest().providers.find(p=>p.id==="phonon"); console.log("31m commercial:", evaluateProviderPolicy(ph,{commercialUse:true,modelId:"gradium/phonon-31m-en"})); console.log("40m commercial:", evaluateProviderPolicy(ph,{commercialUse:true,modelId:"gradium/phonon-40m-multilingual"}));'
```

## Do not use

Constraints and safety: Operational boundary — never clone a human voice without explicit documented owner consent, never bundle `CC-BY-NC-4.0` weights into commercial deliverables, and never claim Pocket TTS / Phonon neural weights ran if fallback DSP audio was produced.

## Verification Criteria & Failure Recovery

- Verify `MODEL_LICENSE_NON_COMMERCIAL_BLOCKED` triggers on `phonon-40m-*` when `commercialUse: true` and `VOICE_CLONING_CONSENT_REQUIRED` triggers when cloning consent is omitted.

## Authoritative product references

- https://github.com/kyutai-labs/pocket-tts
- https://github.com/gradium-ai/xn-ptts
