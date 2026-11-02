---
name: rei-rea-orchestrator
description: "Route authorized reverse-engineering investigations across binaries, APKs, Electron, firmware, and WASM using REI REA."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, binary-analysis, orchestrator, mcp, rei-rea, triage"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI REA Orchestrator

## When to Use

- Route authorized reverse-engineering investigations across native binaries, Android APKs, Electron apps, firmware, browser artifacts, .NET and WebAssembly. Use when a target file or app is supplied and the user asks what it does, to trace one feature, assess coverage, compare versions or reconstruct behavior with evidence. Coordinate the central REI REA CLI/MCP catalog, SHA-256 case ledger and specialist skills. Do not imply external engines are installed, licensed or automatically executed.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Use `rei-rea investigate TARGET` for a bounded read-only workflow; use `rei-rea deep TARGET` and `rei-rea diff OLD NEW` for format-specific questions. Use `rei-rea tools doctor`, `rei-rea plan TARGET`, and `rei-rea case init TARGET` for candidate tools and evidence cases. In an MCP client, prefer `rei_rea_inspect`, `rei_rea_plan`, `rei_rea_case_create`, `rei_rea_tools` when actually registered.

## Procedure

1. Establish the exact artifact, question, authorization and analysis boundary.
2. Inspect sources first when complete; otherwise hash and inventory the supplied artifact.
3. Load the specialist skill based on observed format, not file extension.
4. Start a case with evidence IDs and mark observed/inferred/unknown separately.
5. Avoid execution until a specific runtime question, isolated environment and permission are established.
6. Derive behavioral spec, local implementation and parity corpus; report pass/fail and unresolved gaps.

## Evidence and limits

Never claim this skill installed engines or MCP. Read-only triage is default. Do not bypass third-party licensing, steal credentials, or operate against unauthorized targets. The command catalog is discovery, not automatic provisioning.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
