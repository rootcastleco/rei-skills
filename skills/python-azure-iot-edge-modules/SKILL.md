---
name: "python-azure-iot-edge-modules"
description: "Build and operate Python Azure IoT Edge modules with robust messaging, deployment manifests, observability, and production readiness checks"
risk: "safe"
source: "github/awesome-copilot@74b98979877d209fb6277a9364f7b21e2f3fe222"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/python-azure-iot-edge-modules/SKILL.md

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

# Python Azure IoT Edge Modules

Use this skill to design, implement, and validate Python-based IoT Edge modules for telemetry processing, local inference, protocol translation, and edge-to-cloud integration.

## When To Use

Use this skill for requests like:

- "quiero crear un modulo Python para IoT Edge"
- "como despliego modulos edge con manifest"
- "necesito filtrar/agregar telemetria antes de subirla"
- "como manejo desconexiones y reintentos en edge"

## Mandatory Docs Review

Before recommending runtime behavior or deployment decisions, review:

- https://learn.microsoft.com/azure/iot-edge/
- https://learn.microsoft.com/es-es/azure/iot-edge/

Minimum checks:

- Runtime architecture and module lifecycle.
- Supported host OS and versions.
- Deployment model and configuration flow.
- Current release/version guidance.

If documentation cannot be fetched, proceed with explicit assumptions and flag them clearly.

## Python Official References and Best Practices (Required)

Before proposing Python implementation details, consult official Python sources:

- https://www.python.org/
- https://docs.python.org/3/
- https://docs.python.org/3/reference/
- https://docs.python.org/3/library/
- references/python-official-best-practices.md

Prefer official docs over community snippets unless there is a specific compatibility reason to deviate.

## Goals

- Deliver module architecture and implementation plan that is production-focused.
- Ensure reliable edge messaging under network variability.
- Provide deployment, observability, and validation artifacts.

## Module Use Cases

- Protocol adapter (serial/Modbus/OPC-UA to IoT message format).
- Telemetry enrichment and normalization.
- Local anomaly detection or inference.
- Command orchestration and local actuator control.

## Delivery Workflow

### 1) Contract and Interfaces

Define:

- Module inputs and outputs.
- Message schema and versioning policy.
- Routes and priorities for normal vs critical telemetry.
- Desired properties used for dynamic configuration.

### 2) Runtime and Packaging

Specify:

- Python runtime version target.
- Container image strategy (base image, slim footprint, CVE hygiene).
- Resource profile (CPU/memory bounds).
- Startup and health checks.

### 3) Reliability Design

Implement and validate:

- Retries with exponential backoff and jitter.
- Graceful degradation on upstream failures.
- Local queueing strategy where needed.
- Idempotent processing for replayed messages.

### 4) Security Controls

Require:

- No plaintext secrets in code or manifest.
- Least-privilege module behavior.
- Secure transport and trusted cert chain handling.
- Traceability for command handling and state changes.

### 5) Deployment and Operations

Define:

- Environment-specific deployment manifests.
- Rollout strategy (pilot, staged, broad).
- Rollback criteria.
- SLOs and alerting conditions.

## Reuse Other Skills

When relevant, combine with:

- `azure-smart-city-iot-solution-builder` for platform-level architecture.
- `appinsights-instrumentation` for telemetry instrumentation approaches.
- `azure-resource-visualizer` for architecture diagrams and dependency mapping.

Also use `references/python-official-best-practices.md` as baseline quality criteria for module design and implementation guidance.

## Required Output

Always provide:

1. Module design brief (purpose, inputs, outputs).
2. Deployment model (image, manifest, env settings).
3. Reliability and error-handling strategy.
4. Security and operations checklist.
5. Test matrix (functional, chaos, performance, rollback).

## Output Template

Use `references/python-edge-module-template.md` to structure implementation proposals and reviews.

1. Context and assumptions
2. Module architecture
3. Deployment and configuration
4. Reliability, security, observability
5. Validation and rollout plan

## Guardrails

- Do not recommend direct production rollout without pilot stage.
- Do not embed secrets in Dockerfiles, source, or manifests.
- Do not omit health probes, restart behavior, and rollback criteria.
