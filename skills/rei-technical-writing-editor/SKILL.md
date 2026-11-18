---
name: rei-technical-writing-editor
description: "Refine English and Turkish technical drafts using blader/humanizer editorial patterns (commit b48c832) while strictly preserving numbers, SI units, equations, citations, and safety warnings. Use when removing AI-sounding filler from technical briefs, READMEs, or scripts."
category: general
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - writing
    - humanizer
    - editorial
    - turkish
    - citations
---

# REI Technical Writing Editor (`humanizer` Adapter)

Apply deterministic anti-filler editorial rules from `blader/humanizer` across English and Turkish technical documentation while enforcing strict factual, numeric, citation, and warning preservation invariants (`runEditorialStage`).

## When to Use

- Polishing technical briefs, scripts, documentation, or reports (`writing/technical-brief.md`, `writing/script.md`) to remove generic AI hype phrases.
- Requiring traceable editorial diffs (`writing/editorial-diff.json`) proving that quantitative units (`mm/s`, `Hz`, `kHz`, `RPM`), `[SRC-*]` citations, and `NOT VERIFIED` warnings remain intact.

## Inputs and Outputs

- **Inputs:** Draft Markdown or script text in English and/or Turkish.
- **Outputs:** Edited Markdown plus JSON diff ledger containing `editsApplied` and `preservedInvariants` (`allNumbersAndUnitsPreserved`, `allCitationsPreserved`, `allWarningsPreserved`).

## Prerequisites & License Constraints

- Upstream: `blader/humanizer` (`MIT`, commit `b48c832f0f809c1b5658edbb838c2521b72f2413`).
- Runs deterministically with zero external LLM calls, keeping confidential engineering drafts completely local.

## Offline vs Online Capabilities

- **Offline:** 100% offline rule engine executing inside Node.js (`<32 MB` RAM, zero network dependency).

## Procedure

1. Extract critical numbers, SI units, `[SRC-*]` references, and safety tags before editing.
2. Remove inflation cliches (both EN and TR) and tighten passive filler clauses.
3. Assert post-edit invariant parity; reject any rewrite that drops a number, citation, or safety notice.

```sh
node -e 'const {runEditorialStage}=require("./lib/multimodal-providers"); console.log(JSON.stringify(runEditorialStage("At its core, what matters is 10 kHz RMS 2.4 mm/s [SRC-1] NOT VERIFIED."), null, 2));'
```

## Do not use

Constraints and safety: Operational boundary — do not delete `NOT VERIFIED`, `COMPUTATIONAL_ONLY`, lockout/tagout warnings, numeric error bounds, or source citations merely to make prose sound confident.

## Verification Criteria & Failure Recovery

- Verify `preservedInvariants.allNumbersAndUnitsPreserved === true`, `allCitationsPreserved === true`, and `allWarningsPreserved === true`.
- Roll back to `originalText` immediately if any invariant check fails.

## Authoritative product references

- https://github.com/blader/humanizer
