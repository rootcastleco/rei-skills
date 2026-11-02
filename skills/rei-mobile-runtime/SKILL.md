---
name: rei-mobile-runtime
description: "Plan explicitly authorized Android and iOS runtime observation and static-to-dynamic verification in lab environments."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, mobile, android, ios, runtime-analysis, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Mobile Runtime

## When to Use

- Perform explicitly authorized Android/iOS runtime-observation planning for owned devices or lab apps, including method instrumentation, app process traces, mobile network logs and static-to-dynamic hypothesis checks. Use only when static evidence cannot answer an app behavior question.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Use `Frida`, `adb`, platform LLDB, and controlled proxy traces when installed, permitted and appropriate. MCP skill instructions are not device access.

## Procedure

1. Write the precise observation question and app/device identities.
2. Prepare a disposable test profile with no real customer secrets.
3. Record baseline, clocks, tool versions and filtered hooks.
4. Observe specific method or protocol behavior, not unrelated user data.
5. Save evidence pointers and tear down hooks; compare with static hypotheses.

## Evidence and limits

No covert instrumentation, unauthorized surveillance or bypass of account restrictions. Scope ownership and user consent explicitly.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
