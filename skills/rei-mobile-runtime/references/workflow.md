# REI Mobile Runtime — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Write the precise observation question and app/device identities.
2. Prepare a disposable test profile with no real customer secrets.
3. Record baseline, clocks, tool versions and filtered hooks.
4. Observe specific method or protocol behavior, not unrelated user data.
5. Save evidence pointers and tear down hooks; compare with static hypotheses.

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
