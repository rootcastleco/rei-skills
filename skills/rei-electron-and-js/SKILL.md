---
name: rei-electron-and-js
description: "Investigate authorized Electron ASAR archives, preload scripts, IPC routes, and bundled JavaScript applications."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, electron, asar, javascript, ipc, nodejs, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Electron and JavaScript

## When to Use

- Investigate Electron/ASAR, Node.js, browser JavaScript bundles, preload APIs, IPC routes, source maps and client-side workflows for authorized application analysis and feature reconstruction. Trigger for Electron desktop installers, packed app.asar, minified JavaScript, browser app call graphs or IPC-based features.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Prefer textual inventory and `rg`, `asar`, source-map viewers, JS parser and officially registered upstream REA JavaScript analyzer. Record exact module paths, import edges and IPC channel names.

## Procedure

1. Inventory package.json, ASAR manifest and code origins; identify Electron main, renderer and preload.
2. Locate the UI action by labels/listeners and follow IPC to backend handlers.
3. Identify file writes, network requests and data serialization by direct code evidence.
4. Rebuild the smallest interoperable feature behind an adapter.
5. Verify with authorized sample traces and a version-locked fixture.

## Evidence and limits

Do not infer runtime results from string matches; executing app packages or connecting live accounts requires separate authorization.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
