# REI REA Orchestrator — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Establish the exact artifact, question, authorization and analysis boundary.
2. Inspect sources first when complete; otherwise hash and inventory the supplied artifact.
3. Load the specialist skill based on observed format, not file extension.
4. Start a case with evidence IDs and mark observed/inferred/unknown separately.
5. Avoid execution until a specific runtime question, isolated environment and permission are established.
6. Derive behavioral spec, local implementation and parity corpus; report pass/fail and unresolved gaps.

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
