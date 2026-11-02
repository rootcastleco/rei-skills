# REI Firmware and IoT — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Identify acquisition method, hash and hardware revision.
2. Map partitions, headers, byte offsets, compression and endianness without extraction.
3. Extract only in a sandbox after checking traversal and decompression limits.
4. Correlate code with hardware register maps, schematics, UART/logic recordings.
5. Validate on a non-production device with recoverable firmware and rollback image.

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
