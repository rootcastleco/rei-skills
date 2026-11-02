# Format-aware structural investigations

## Input

An authorized regular file, an explicit analytical question, and (optionally) one prior version for comparison.

## Output

`kind`, artifact SHA-256, parser status, observed sections/segments/imports/exports, offsets and bounds, limitations, unresolved questions and suggested independent verification.

## Acceptance checks

1. The tool confirms `status=complete` or explicitly reports `partial`, `invalid` or `unsupported`.
2. Every field is derived from the current artifact hash; never transplant findings across versions.
3. Version reports distinguish structural changes from byte changes and runtime behavior.
4. For untrusted binaries, inspect in a restricted filesystem/container and do not execute them merely to obtain evidence.
