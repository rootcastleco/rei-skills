---
name: rei-firmware-and-iot
description: "Examine authorized MCU, UEFI, embedded Linux, automotive telemetry, and GPS/IoT firmware images safely."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, firmware, iot, embedded, uefi, telemetry, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Firmware and IoT

## When to Use

- Study authorized MCU, UEFI, embedded Linux, automotive telemetry, gateway, GPS/IoT and other firmware images. Use for file-system identification, container carving, SoC architecture hypotheses, boot-chain mapping, serial traces, protocol frame documentation and safe compatibility implementations.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Catalog: `binwalk`, `ubi_reader`, `jefferson`, `UEFITool`, `dtc`, `squashfs-tools`, `Ghidra`, `QEMU`, `Wireshark`, `tshark`. Hardware tools need explicit electrical and scope checks.

## Procedure

1. Identify acquisition method, hash and hardware revision.
2. Map partitions, headers, byte offsets, compression and endianness without extraction.
3. Extract only in a sandbox after checking traversal and decompression limits.
4. Correlate code with hardware register maps, schematics, UART/logic recordings.
5. Validate on a non-production device with recoverable firmware and rollback image.

## Evidence and limits

Do not flash unknown images, infer power pinouts or change physical device state without independent verification.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
