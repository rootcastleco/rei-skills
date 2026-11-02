# REI WASM and Managed Code — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Hash artifact and confirm format using header and container checks.
2. Recover module/type/import/export tables, metadata and declared interfaces.
3. Trace one method and its caller contract with exact offsets and signatures.
4. Cross-check generated source against bytecode; document lost symbols and generics.
5. Build a separate compatible implementation and test stable fixture outputs.

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
