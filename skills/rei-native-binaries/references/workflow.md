# REI Native Binaries — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Verify PE/ELF/Mach-O header, architecture, ABI and artifact hash.
2. Inventory sections, entry points, imports and resources before interpreting code.
3. Trace a single feature through callers, xrefs and data transforms; capture addresses and confidence.
4. Cross-check pseudocode against assembly, calling conventions and independent probes.
5. For a rebuild, specify inputs/outputs and test a fixed corpus under a controlled environment.

## Minimum output

| Claim | State | Evidence pointer | Tool / version | Verification | Limitation |
| --- | --- | --- | --- | --- | --- |
| Example claim | unknown | pending | pending | independent fixture | not examined |

## Acceptance

1. Every claim has explicit evidence and uncertainty.
2. Input identity is stable or the changed hash is flagged.
3. Unavailable providers are named; no unsupported success claim.
4. Reconstructed behavior has passing and failing cases documented.
5. Scope/security approvals are explicit for any execution or live traffic.
