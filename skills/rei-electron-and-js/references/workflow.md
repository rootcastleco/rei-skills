# REI Electron and JavaScript — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Inventory package.json, ASAR manifest and code origins; identify Electron main, renderer and preload.
2. Locate the UI action by labels/listeners and follow IPC to backend handlers.
3. Identify file writes, network requests and data serialization by direct code evidence.
4. Rebuild the smallest interoperable feature behind an adapter.
5. Verify with authorized sample traces and a version-locked fixture.

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
