---
name: rei-casebook-forensics
description: "Index, search, and verify tamper-evident SHA-256 reverse-engineering casebooks and metadata-only forensic bundles."
risk: safe
source: rootcastle-rei
category: reverse-engineering
metadata:
  tags: "reverse-engineering, digital-forensics, casebook, evidence, sqlite, rei-rea"
  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"
  curated_by: "rootcastle-rei"
---

# REI Casebook Forensics

## When to Use

- Organize and search authorized reverse-engineering investigations using REI REA's local SQLite casebook, SHA-256 evidence chains and portable metadata-only bundles. Use for case indexing, searching by identifier or artifact hash, audit reports, cross-case workflows, forensic handoffs, chain verification and incident review while preserving source privacy and distinguishing local checksums from independently trusted signatures.
- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.


## Procedure

1. Establish the evidence workspace and the target's original artifact SHA-256; confirm no customer file will be published automatically.
2. Create a case with `rei-rea case init TARGET --workspace WORKSPACE` when appropriate, then record precisely attributed observations using `rei-rea case note`.
3. Explicitly index local case metadata with `rei-rea case index WORKSPACE`. Do not assume indexing happens automatically.
4. Search with `rei-rea case search WORKSPACE --query TEXT` or `--kind KIND`, using a bounded result count. The index is a snapshot; refresh after case updates.
5. Verify the underlying case with `rei-rea case verify CASE --recheck-target` before making claims.
6. Export metadata only with `rei-rea case bundle CASE OUTPUT.zip`, then use `rei-rea case bundle-verify OUTPUT.zip` to verify internal checksums.

## Controls

- The SQLite index contains case names, paths, artifact hashes, type and chain verification metadata. It does **not** include raw artifact bytes or event payloads.
- A local hash chain can be recomputed by a malicious writer; ZIP checksum verification cannot prove identity, ownership or trusted timestamp.
- Avoid publishing case paths, report text and saved metadata without review; they can still reveal sensitive project details.
- Never claim judicial chain-of-custody compliance, cryptographic signatures or trusted timestamps from the current implementation.

Read [references/workflow.md](references/workflow.md) for handoff checks.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
