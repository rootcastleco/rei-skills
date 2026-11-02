# REI Evidence Ledger — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Inspect identity and state whether capture was complete.
2. Append a source-attributed observation with tool/version and exact evidence location.
3. Keep uncertain interpretations separate from observations.
4. Re-hash artifacts, verify the event chain and export a concise limitations report.
5. For adversarial custody requirements, add separately managed digital signatures and external timestamps.

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
