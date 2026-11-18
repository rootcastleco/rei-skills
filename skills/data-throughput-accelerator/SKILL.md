---
name: "data-throughput-accelerator"
description: "Diagnose and accelerate large data movement — ingestion, backfill, export, ETL, warehouse loading, manifest catch-up, and table synchronization — by isolating the true bottleneck, benchmarking variants, and codifying the fastest path with a hard accounting block proving rows and timestamps cohere. Use when a pipeline or backfill is too slow and mus"
risk: "safe"
source: "affaan-m/ECC@3f14a103a8694e51c1df9a806217a6d0b5f7a6f7"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/affaan-m/ECC/blob/3f14a103a8694e51c1df9a806217a6d0b5f7a6f7/skills/data-throughput-accelerator/SKILL.md

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

# Data Throughput Accelerator

Use this skill when the bottleneck is moving, transforming, or saving lots of
data. The goal is not just speed. The goal is faster correct data landing in the
right place with proof.

## First Distinction

Separate these before optimizing:

- source extraction speed;
- network transfer speed;
- warehouse/load speed;
- transform speed;
- serving-table freshness;
- live tail growth while the job runs.

A pipeline can be "fast" and still appear behind if new data arrives faster
than the final catch-up window.

## Fast Path Heuristics

- Move compute to where the data already is.
- Prefer warehouse-native scans, joins, and appends for large landed files.
- Use manifests or checkpoints so completed files/partitions are skipped.
- Use partitioning and clustering that match the read and append pattern.
- Batch small files, requests, and writes.
- Make writes idempotent through unique keys, manifests, or replaceable staging.
- Keep raw, derived, and serving tables separately accountable.

## Workflow

1. Read the current source, target, and manifest contracts.
2. Measure backlog: external files, manifest rows, raw rows, derived rows,
   min/max timestamps, and unprocessed counts.
3. Run a safe catch-up or sample benchmark.
4. Compare variants: batch size, worker count, warehouse SQL, file grouping,
   staging shape, and manifest update method.
5. Promote only the fastest path that keeps counts and timestamps coherent.
6. Codify the path as a CLI, scheduled job, workflow, or runbook.
7. Rerun final accounting after the codified path executes.

## Accounting Output

Use a hard accounting block:

```text
Data throughput result:
- Source files discovered: 294
- Files processed this run: 294
- Raw rows added: 9,683,598
- Derived rows added: 8,917,585
- Remaining tail: 24 files at readback time
- Runtime: 38.7s
- Correctness gate: manifest counts and table max timestamps match
```

## Guardrails

- Do not delete raw data to make a metric look better.
- Do not skip failed files silently.
- Do not mix historical backfill status with live-tail freshness.
- Do not call a pipeline complete until the target tables and manifest agree.
- For finance, healthcare, regulated, or customer-impacting data, preserve
  replay evidence and approval gates.
