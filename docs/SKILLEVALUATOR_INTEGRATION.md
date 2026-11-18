# NVIDIA SkillEvaluator integration (REI Skills 6.6.0)

This is a **separate evaluation tool**, not an npm dependency and not an upgrade of REI Skills. `package.json`, `package-lock.json`, package exports, CLI entry points, and the npm publishing workflow are unchanged.

## Local macOS install

NVIDIA SkillEvaluator is installed independently with:

```sh
uv tool install skillevaluator==0.9.0
skillevaluator --version
```

Supported Python: 3.12–3.14. This installation does not modify the project environment. The pinned upstream release is [v0.9.0](https://github.com/NVIDIA/SkillEvaluator/releases/tag/v0.9.0).

## Basic smoke test (offline quality check)

```sh
skillevaluator quality-check skills/agent-evaluation -r cli -r json -o /tmp/rei-skillevaluator-smoke
```

The smoke test is a **quality check only**; a passing score is not a security attestation. Complete Tier 1 security checks may fetch and run pinned third-party scanners. Tier 2 requires an LLM/embedding provider; Tier 3 also requires supported agents and a sandbox.

## GitHub Actions

`.github/workflows/skill-checks.yml` integrates NVIDIA's v0.9.0 released **Tier 1** reusable workflow and pinned container digest. It runs on relevant skill changes and may be triggered manually. It does **not** alter the existing `ci.yml`, `pages.yml`, or `publish.yml` workflows.

Initial `enforcement-mode: advisory` collects results without turning baseline quality failures into a merge gate. Scanner failures, incomplete security evidence and configuration errors are still failures. When all scoped skills have been reviewed and scanner evidence is complete, the maintainers can remove the advisory setting to enforce strict checks.

NVIDIA's scan `auto` mode is not used by this workflow because main/manual runs can otherwise attempt a catalog-wide selection above the upstream 100-skill limit. Pull requests and main pushes run an explicit `changed` Tier 1 gate. Main pushes and `workflow_dispatch` additionally run an inspectable deterministic full-catalog partition in matrix batches of at most 100 skills. `data/skill-evaluator-batches.json` records the fixed catalog partition and catalog SHA-256; the workflow generates a commit-bound copy and aggregates every batch into `skill-evaluator-full-catalog-summary-<commit>`.

A batch is `PASS`, `FAIL`, or `NOT VERIFIED` from its retained evidence. Missing or malformed evidence remains `NOT VERIFIED`; configuration and scan failures remain visible and make the aggregate fail. The workflow never converts unscanned skills into PASS. The `workflow_dispatch` event runs the same partitioned full-catalog scan as a main push, rather than invoking the previously unsupported over-100-skill `all` mode.

No LLM keys or npm secrets are used. HTML/JSON/SARIF reports are retained as GitHub Actions artifacts; no report is automatically hosted on the existing GitHub Pages site.

## Rollback

Remove `.github/workflows/skill-checks.yml` to disable the additional CI check. Local uninstall: `uv tool uninstall skillevaluator`. Both operations leave the REI Skills npm version at `6.6.0`.

## Evidence (2026-11-16)

On the separate macOS checkout at commit `977060cbea6bccc97a8449e78d930a445e920086`, `skillevaluator 0.9.0` ran `quality-check skills/agent-evaluation` successfully: **86.8/100, B**, exit code 0. Eight non-blocking advisory findings were reported. Full security scanning, CI execution and 1,423-skill coverage are **NOT VERIFIED**.
