# REI Web and Protocols — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Identify provenance and hash of supplied recording; note packet loss or redaction.
2. Inventory endpoints, streams, frame lengths, time ordering and protocol versions.
3. Create a state-machine and sample input/output fixtures with secrets redacted.
4. Implement a local parser and compare byte framing, checksum, error handling and field interpretation.
5. Test malformed and boundary frames without probing any production endpoint.

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
