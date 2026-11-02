---
name: rei-reconstruction-parity
description: "Specify and verify clean-room behavioral parity and differential test corpora from observed artifact evidence."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, reconstruction, parity-testing, clean-room, verification, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Reconstruction Parity

## When to Use

- Reimplement a single observed application or firmware behavior from evidence while preserving original product boundaries. Use for clean-room compatibility, API replacement, local rebuilds, feature-level parity testing, corpus design, differential tests and regression-proof delivery.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Use the existing project test runner and REI case ledger. Build a fixture manifest with fixed input/output pairs. External REA analysis tools are optional sources, not proof of parity.

## Procedure

1. Turn observed behavior into a spec with explicit unknowns.
2. Separate code ownership and reference evidence; do not copy private data or leaked credentials.
3. Implement via adapter/gateway/feature flag, leaving the old core intact.
4. Build golden tests, negative tests, metamorphic properties and timing tolerance where relevant.
5. Publish parity coverage, mismatches, fallback and rollback procedures.

## Evidence and limits

Do not copy source merely because decompilation is available or claim binary-identical reproduction without measurements.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
