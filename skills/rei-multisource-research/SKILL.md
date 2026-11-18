---
name: rei-multisource-research
description: "Conduct grounded, deduplicated multi-source technical research integrating mvanhorn/last30days-skill (commit a854f3b) with primary/secondary evidence classification, staleness detection, and SHA-256 citation tracking. Use for technical briefs, engineering standards lookup, and source-traceable drafting."
category: data-ai
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - research
    - last30days
    - citations
    - evidence
    - deduplication
---

# REI Multisource Research (`last30days-skill` Adapter)

Collect, normalize, deduplicate, and trace engineering sources via [`skills/last30days`](../last30days/SKILL.md) and [`lib/multimodal-providers.js`](../../lib/multimodal-providers.js).

## When to Use

- Gathering standards, papers, repository docs, or recent discussions across Reddit, X, arXiv, YouTube, HN, or scoped engineering corpora.
- Producing `research/sources.json` and `research/evidence-report.json` with traceable `SRC-*` IDs for downstream slides and narration.

## Inputs and Outputs

- **Inputs:** Scoped research topic, date window (`maxAgeDays`), optional local/verified source entries, and optional `OPENAI_API_KEY` / `XAI_API_KEY`.
- **Outputs:** `research/sources.json` (normalized URLs, deduplication counts, SHA-256 content hashes) and `research/evidence-report.json` (`PRIMARY_EVIDENCE` vs `SECONDARY_EVIDENCE` counts and claim-to-citation mappings).

## Prerequisites & License Constraints

- Upstream: `mvanhorn/last30days-skill` (`MIT`, commit `a854f3bcb2c4344d7498426d653378510f8b253a`).
- Respect external platform Terms of Service; do not bypass paywalls or read unauthorized private browser cookies.

## Offline vs Online Capabilities

- **Offline:** Runs deterministically over scoped local source corpora and Rootcastle Prompt Archive snapshots without network access.
- **Online (Opt-In):** Invokes `skills/last30days/scripts/last30days.py --preflight` or web/API backends only when explicitly requested.

## Procedure

1. Inspect planned reads/writes with `last30days.py --preflight` before any external query.
2. Normalize URLs (strip UTM/tracking parameters) and compute deduplicated SHA-256 hashes.
3. Classify every claim as `PRIMARY_EVIDENCE`, `SECONDARY_EVIDENCE`, or `INFERENCE`.

```sh
python skills/last30days/scripts/last30days.py --preflight
node bin/install.js pipeline run "Rotor vibration ISO 20816-1 brief" --output ./tmp-research --json
```

## Do not use

Constraints and safety: Operational boundary — do not invent citations, treat secondary blog summaries as primary experimental data, or scrape blocked sources.

## Verification Criteria & Failure Recovery

- Verify `allClaimsTraceable === true`, `staleClaimsCount === 0` (or explicitly flagged), and valid SHA-256 digests (`^[a-f0-9]{64}$`) for every source.
- If API keys are missing, degrade cleanly to offline/scoped evidence mode without failing unrelated workflows.

## Authoritative product references

- https://github.com/mvanhorn/last30days-skill
