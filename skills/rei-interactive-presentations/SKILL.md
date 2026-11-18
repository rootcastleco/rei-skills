---
name: rei-interactive-presentations
description: "Build zero-dependency, accessible interactive HTML5 presentations from shared SlideDeckSpec structures integrating zarazhangrui/frontend-slides (commit 9906a34). Includes keyboard navigation, ARIA live counters, speaker notes toggle, and prefers-reduced-motion support."
category: development
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - presentations
    - html
    - frontend-slides
    - accessibility
    - slides
---

# REI Interactive Presentations (`frontend-slides` Adapter)

Compile shared `SlideDeckSpec` structures into standalone responsive HTML5 presentations (`presentations/presentation-html/index.html`) paired cleanly with editable `.pptx` output via [`skills/frontend-slides`](../frontend-slides/SKILL.md) and [`lib/multimodal-providers.js`](../../lib/multimodal-providers.js).

## When to Use

- Delivering web-based engineering slide decks with interactive slide controls, tables, and speaker notes without npm build chains.
- Pairing HTML presentation Path A with editable PowerPoint Path B from a single validated content & citation specification.

## Inputs and Outputs

- **Inputs:** Shared `SlideDeckSpec` JSON (titles, bullets, comparison tables, `[SRC-*]` citations, Turkish/English speaker notes).
- **Outputs:** Self-contained responsive `index.html` using Rootcastle palette (`#000000`, `#0E3D8A`, `#228B55`) with keyboard navigation (`ArrowRight`/`ArrowLeft`/`Space`/`Home`/`End`/`N`) and accessibility metadata.

## Prerequisites & License Constraints

- Upstream: `zarazhangrui/frontend-slides` (`MIT`, commit `9906a34d640d2111f724544cbc50f7f130569ae1`).
- Zero dependencies for HTML generation; optional `playwright` needed only for headless PDF export.

## Offline vs Online Capabilities

- **Offline:** Generates standalone single-file HTML decks with zero external CDN fonts or scripts.

## Procedure

1. Build or validate `SlideDeckSpec` with XSS-escaped text fields and verified citations.
2. Render `presentations/presentation-html/index.html` with `aria-live="polite"` slide counters and `@media (prefers-reduced-motion: reduce)`.
3. Verify keyboard navigation hooks and reduced-motion rules before distribution.

```sh
node -e 'const {buildSharedSlideDeckSpec,renderHtmlPresentation,runResearchStage}=require("./lib/multimodal-providers"); const r=runResearchStage({checkUpstreamCli:false}); console.log(renderHtmlPresentation("tmp-deck/index.html", buildSharedSlideDeckSpec("Vibration Brief", r)));'
```

## Do not use

Constraints and safety: Operational boundary — do not inject unsanitized raw HTML or external third-party tracking scripts into generated decks, and do not flatten tabular metrics into unreadable bitmaps.

## Verification Criteria & Failure Recovery

- Verify `accessibilityChecks.ariaLiveCounter === true`, `keyboardNavigation === true`, and `reducedMotionMediaQuery === true`.

## Authoritative product references

- https://github.com/zarazhangrui/frontend-slides
