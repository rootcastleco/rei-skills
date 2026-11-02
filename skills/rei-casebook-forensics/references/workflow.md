# Casebook review and handoff

## Evidence checkpoint

Confirm case ID, target SHA-256, whether target rehash was performed, event count, hash-chain integrity, search-index freshness, SHA-256 of exported ZIP and whether source bytes were intentionally omitted.

## Release gate

1. No source artifact bytes included in a bundle.
2. A complete case hash chain validated before export; output ZIP has passing internal checksums.
3. Distribution reviewed for incident-sensitive names and paths.
4. External timestamp, independent signer and key custody explicitly marked NOT IMPLEMENTED.
