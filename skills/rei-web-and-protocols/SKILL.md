---
name: rei-web-and-protocols
description: "Analyze authorized HAR, PCAP/PCAPNG captures, telemetry frames, and protocol state machines for interoperability."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, protocols, pcap, har, network-analysis, telemetry, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Web and Protocols

## When to Use

- Analyze user-provided HAR/PCAP/PCAPNG, documented APIs, browser workflows, GPS/IoT telemetry protocols and data formats for lawful interoperability. Use to trace request serialization, network frame boundaries, state machines, pagination, error semantics and latency from supplied recordings.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Entry contract

Use only the target the user provides or explicitly authorizes. Establish the question, artifact SHA-256, permitted scope, desired output and actually available tools. If repository source is complete, inspect it first instead of treating every task as binary RE.

## Available tooling

Use `tshark`, `Wireshark`, `mitmproxy`, `protobuf`, `grpcurl`, `Kaitai Struct`, and browser DevTools with user-authorized recordings. Never transform a packet capture into claims about a live server without corroboration.

## Procedure

1. Identify provenance and hash of supplied recording; note packet loss or redaction.
2. Inventory endpoints, streams, frame lengths, time ordering and protocol versions.
3. Create a state-machine and sample input/output fixtures with secrets redacted.
4. Implement a local parser and compare byte framing, checksum, error handling and field interpretation.
5. Test malformed and boundary frames without probing any production endpoint.

## Evidence and limits

Do not perform intrusive network scanning, traffic interception or credential collection outside explicit authorization.

For every conclusion record: target hash, source address/offset/file line, method and version, status (`observed`/`inferred`/`unknown`), coverage, alternative hypotheses, next verification. Do not invent installed tools or report target execution that did not happen.

See [workflow checkpoints](references/workflow.md) for outputs and acceptance criteria.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
