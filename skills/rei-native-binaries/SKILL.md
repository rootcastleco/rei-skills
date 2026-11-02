---
name: rei-native-binaries
description: "Inspect authorized PE, ELF, Mach-O, and native libraries for symbols, imports, ABI boundaries, and call graphs."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, native-binaries, pe, elf, mach-o, abi, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Native Binaries

## When to Use

- Inspect authorized PE, ELF, Mach-O, COFF and native dynamic libraries. Use for x86/x64/ARM symbol and import analysis, function-call tracing, compiler artifact identification, Ghidra/radare2/IDA evidence, decompilation comparisons, patch impact and ABI compatibility reconstruction. Ground interpretations in addresses, sections, hashes and tool versions instead of assuming pseudocode equals source.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Preferred: `readelf`, `objdump`, `llvm-readobj`, `Ghidra`, `radare2`, `Rizin`, `Cutter`, `x64dbg`, `LLDB`. First run `rei-rea inspect PATH`, `rei-rea deep PATH` (PE/ELF only) and `rei-rea plan PATH`; `rei-rea run readelf PATH --allow-external` is opt-in only.

## Procedure

1. Verify PE/ELF/Mach-O header, architecture, ABI and artifact hash.
2. Inventory sections, entry points, imports and resources before interpreting code.
3. Trace a single feature through callers, xrefs and data transforms; capture addresses and confidence.
4. Cross-check pseudocode against assembly, calling conventions and independent probes.
5. For a rebuild, specify inputs/outputs and test a fixed corpus under a controlled environment.

## Evidence and limits

Do not treat compiler-generated code as original source; do not execute a suspicious binary merely to obtain faster results.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
