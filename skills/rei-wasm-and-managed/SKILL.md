---
name: rei-wasm-and-managed
description: "Trace authorized WebAssembly modules, .NET CIL assemblies, and JVM bytecode for type recovery and API analysis."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, wasm, webassembly, dotnet, jvm, bytecode, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI WASM and Managed Code

## When to Use

- Trace authorized WebAssembly, .NET, Java, IL, JVM bytecode and managed package control flow. Use for manifest/metadata triage, type recovery, IL inspection, WASM import/export tracing, obfuscation assessment and compatible API reconstruction.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Use `wasm-tools`, `WABT`, `Binaryen`, `ILSpy`, `dnSpyEx`, `ildasm`, `monodis`, `javap`, `CFR`, and compatible bytecode analyzers only when actually available.

## Procedure

1. Hash artifact and confirm format using header and container checks.
2. Recover module/type/import/export tables, metadata and declared interfaces.
3. Trace one method and its caller contract with exact offsets and signatures.
4. Cross-check generated source against bytecode; document lost symbols and generics.
5. Build a separate compatible implementation and test stable fixture outputs.

## Evidence and limits

Do not confuse decompiler output with original handwritten code; static graphs do not establish actual runtime paths.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
