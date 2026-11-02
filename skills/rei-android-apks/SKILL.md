---
name: rei-android-apks
description: "Analyze authorized Android APK, AAB, DEX bytecode, manifests, permissions, and JNI boundaries using read-only triage."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, android, apk, dex, jni, mobile, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Android APKs

## When to Use

- Analyze user-supplied Android APK, AAB, DEX and Android manifests using read-only triage, JADX, Apktool and Android SDK metadata. Trigger for Android application architecture, Java/Kotlin class tracing, app permissions, manifest components, JNI boundaries and compatible local functionality reconstruction.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Catalog: `jadx`, `apktool`, `aapt2`, `apkanalyzer`, `dex2jar`, `baksmali`, `androguard`; `adb` and `Frida` are runtime tools requiring an isolated authorized test device.

## Procedure

1. Hash package and inspect archive boundaries without extracting untrusted members.
2. Inventory manifest package, exported components, permissions and DEX files with appropriate tools.
3. Trace entry Activity/Service to method calls and JNI/native code if present.
4. Record obfuscation and resource decoding uncertainty; separate static and observed evidence.
5. Define API/UI behavior and run device-level parity tests only with owner permission.

## Evidence and limits

Never claim JADX recovers the original source or that an APK is benign because no suspicious strings were found.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
