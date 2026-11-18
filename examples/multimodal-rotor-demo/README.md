# Multimodal Rotor Vibration Demo (`examples/multimodal-rotor-demo`)

Generated deterministically via:

```bash
node bin/install.js pipeline run \
  "Create a technically accurate English presentation and short educational video explaining rotor vibration analysis, with Turkish narration and traceable references." \
  --output examples/multimodal-rotor-demo --json
node bin/install.js pipeline validate --output examples/multimodal-rotor-demo --json
```

## Deliverable Inventory

- **Research:** `research/sources.json` (deduplicated ISO 20816-1 / 10816-3 and REI Skills primary sources) & `research/evidence-report.json`
- **Writing & Editorial:** `writing/technical-brief.draft.md`, `writing/script.draft.md`, `writing/technical-brief.md`, `writing/script.md`, `writing/editorial-diff.json` (numeric, SI unit, citation & `NOT VERIFIED` warning invariants preserved)
- **Storyboard:** `storyboard/storyboard.json`
- **Presentations (Shared `SlideDeckSpec`):**
  - Path A (Interactive HTML5): `presentations/presentation-html/index.html` (keyboard navigation, ARIA live counter, `prefers-reduced-motion`)
  - Path B (Editable PowerPoint): `presentations/presentation.pptx` (`3` slides, `15` editable `<p:sp>` text shapes, `3` native `<a:tbl>` tables, `3` speaker notes slides, `0` image-only slides)
- **Audio:** `audio/narration.wav` (`24 kHz` 16-bit PCM mono WAV synthesized via `deterministic-dsp-fallback` with Turkish technical text normalization; `neuralTtsWeightsExecuted: false`)
- **Video & Subtitles:** `video/final.mp4` (`1280×720` `24 fps` H.264 + AAC) & `video/subtitles.srt` (Turkish synchronized subtitles)
- **Validation:** `validation/quality-report.json`, `validation/provenance.json`, `validation/execution-manifest.json` (`15/15` SHA-256 artifacts verified)

> Note: Physical rotor bench measurements remain explicitly **`NOT VERIFIED`**.
