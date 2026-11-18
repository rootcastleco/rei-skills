---
name: "dashboard-builder"
description: "Build monitoring dashboards that answer real operator questions for Grafana, SigNoz, and similar platforms. Use when turning metrics into a working dashboard instead of a vanity board"
risk: "safe"
source: "affaan-m/ECC@3f14a103a8694e51c1df9a806217a6d0b5f7a6f7"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/affaan-m/ECC/blob/3f14a103a8694e51c1df9a806217a6d0b5f7a6f7/skills/dashboard-builder/SKILL.md

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

# Dashboard Builder

Use this when the task is to build a dashboard people can operate from.

The goal is not "show every metric." The goal is to answer:

- is it healthy?
- where is the bottleneck?
- what changed?
- what action should someone take?

## When to Use

- "Build a Kafka monitoring dashboard"
- "Create a Grafana dashboard for Elasticsearch"
- "Make a SigNoz dashboard for this service"
- "Turn this metrics list into a real operational dashboard"

## Guardrails

- do not start from visual layout; start from operator questions
- do not include every available metric just because it exists
- do not mix health, throughput, and resource panels without structure
- do not ship panels without titles, units, and sane thresholds

## Workflow

### 1. Define the operating questions

Organize around:

- health / availability
- latency / performance
- throughput / volume
- saturation / resources
- service-specific risk

### 2. Study the target platform schema

Inspect existing dashboards first:

- JSON structure
- query language
- variables
- threshold styling
- section layout

### 3. Build the minimum useful board

Recommended structure:

1. overview
2. performance
3. resources
4. service-specific section

### 4. Cut vanity panels

Every panel should answer a real question. If it does not, remove it.

## Example Panel Sets

### Elasticsearch

- cluster health
- shard allocation
- search latency
- indexing rate
- JVM heap / GC

### Kafka

- broker count
- under-replicated partitions
- messages in / out
- consumer lag
- disk and network pressure

### API gateway / ingress

- request rate
- p50 / p95 / p99 latency
- error rate
- upstream health
- active connections

## Quality Checklist

- [ ] valid dashboard JSON
- [ ] clear section grouping
- [ ] titles and units are present
- [ ] thresholds/status colors are meaningful
- [ ] variables exist for common filters
- [ ] default time range and refresh are sensible
- [ ] no vanity panels with no operator value

## Related Skills

- `research-ops`
- `backend-patterns`
- `terminal-ops`
