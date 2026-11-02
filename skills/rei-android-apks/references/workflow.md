# REI Android APKs — acceptance checkpoints

## Input

- Authorized local artifact or source repository, concrete question and environment constraints
- SHA-256 artifact identifier and expected output type

## Workflow

1. Hash package and inspect archive boundaries without extracting untrusted members.
2. Inventory manifest package, exported components, permissions and DEX files with appropriate tools.
3. Trace entry Activity/Service to method calls and JNI/native code if present.
4. Record obfuscation and resource decoding uncertainty; separate static and observed evidence.
5. Define API/UI behavior and run device-level parity tests only with owner permission.

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
