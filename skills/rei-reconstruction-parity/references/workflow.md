# REI Reconstruction Parity — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Turn observed behavior into a spec with explicit unknowns.
2. Separate code ownership and reference evidence; do not copy private data or leaked credentials.
3. Implement via adapter/gateway/feature flag, leaving the old core intact.
4. Build golden tests, negative tests, metamorphic properties and timing tolerance where relevant.
5. Publish parity coverage, mismatches, fallback and rollback procedures.

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
