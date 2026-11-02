# 🛡️ Security Guardrails & Authorized Use Policy

**REI Skills** includes defensive security, reverse engineering, binary intelligence, and offensive security assessment skills. This document defines the mandatory security guardrails enforced across the repository.

---

## 1. Offensive Skills Policy ("The Red Line")

Any skill with `risk: offensive` or covering penetration testing, exploit development, red teaming, or active vulnerability fuzzing is governed by strict rules:

### A. Mandatory "Authorized Use Only" Banner
Every offensive skill **must** include an explicit `AUTHORIZED USE ONLY` warning in its `SKILL.md`:

> **⚠️ AUTHORIZED USE ONLY**
> This skill is for educational purposes or authorized security assessments only.
> You must have explicit, written permission from the system owner before using this tool.
> Misuse of this tool is illegal and strictly prohibited.

This requirement is automatically enforced in CI by `node scripts/security_audit.js`.

### B. Human-in-the-Loop Confirmation
Offensive skills instruct the AI agent to confirm target scope and authorization with the user before executing active network or exploitation commands.

---

## 2. Reverse Engineering & Forensic Boundary (`rei-rea`)

The 12 **REI Reverse Engineering (`rei-rea`)** skills follow a **static-first, provenance-gated** methodology:
- Static structural inspection (`rei-binary-intelligence`, `rei-native-binaries`, `rei-wasm-and-managed`, `rei-firmware-and-iot`) parses headers, sections, imports/exports, and entropy **without executing untrusted sample code**.
- Dynamic instrumentation skills (`rei-mobile-runtime`) explicitly require isolated sandbox/emulator environments and authorized binaries.
- Every finding is separated into `[EVIDENCE]`, `[INFERENCE]`, or `[UNKNOWN]` via `rei-evidence-ledger`.

---

## 3. Automated Security Audit (`scripts/security_audit.js`)

Every commit and Pull Request runs `node scripts/security_audit.js`, which checks all 895 skills for:
- Live hardcoded credentials or private keys
- Destructive shell commands lacking safety warnings
- Unclassified risk levels
- Offensive skills missing `AUTHORIZED USE ONLY` banners
