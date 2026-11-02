---
name: rei-binary-intelligence
description: "Analyze authorized PE, ELF, and WebAssembly structure and version diffs with REI REA bounded static parsers."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, binary-analysis, pe, elf, wasm, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Binary Intelligence

## When to Use

- Analyze authorized PE, ELF, and WebAssembly binary structure with REI REA's built-in bounded parsers. Use when an analyst needs import/export tables, PE sections and hardening flags, ELF dependencies and program headers, WASM modules or version-to-version structural changes without running the artifact. Require SHA-256 identity, exact offsets, declared coverage and independent verification before inferring runtime behavior.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Procedure

1. Identify the supplied authorized artifact using `rei-rea inspect TARGET` and record its complete SHA-256.
2. Run `rei-rea deep TARGET` for native structural PE/ELF/WASM observations. If format is unsupported or the parser is partial/invalid, report that status and do not fill gaps by guessing.
3. Compare two exact versions with `rei-rea diff OLD NEW`; record both hashes and distinguish changed metadata from changed behavior.
4. Prefer `rei-rea investigate TARGET` for one bounded, cross-hash-checked static workflow when the file is at most 64 MiB.
5. For semantic questions beyond structural evidence, obtain a separately available vetted decompiler and verify its output against independent test fixtures.
6. Cite section offsets, imported API names, symbol lists and data directories as observations only. Do not infer reachability, malware, exploitability or hardening effectiveness from names/flags alone.

## Contracts

- Files are not executed. Built-in structural parsing reads at most 32 MiB; larger files may have partial coverage.
- PE and ELF parsers are intentionally incomplete: unknown relocation, debug, extended-header, certificate and nested-resource semantics must be marked unresolved.
- The WASM reader inventories sections/imports/exports. It does not validate instruction code or implement full WebAssembly semantics.
- Large counts and malformed offsets are rejected. Capture parse errors and input hash in the report.

Read [references/workflow.md](references/workflow.md) for evidence fields and acceptance checks.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
