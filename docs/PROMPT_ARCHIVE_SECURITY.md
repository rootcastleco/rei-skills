# Rootcastle Prompt Archive — Security, Integrity & Trust Model

**Endpoint:** `https://promt.rootcastle.com/` (`ORIGIN` allowlisted in `lib/prompt-archive.js`)  
**Implementation:** [`lib/prompt-archive.js`](../lib/prompt-archive.js)

---

## 1. Security & Trust Invariants

1. **Untrusted Data Boundary:** Every prompt retrieved from `https://promt.rootcastle.com/` is tagged `UNTRUSTED_EXTERNAL_REFERENCE` and enclosed within `<<<UNTRUSTED_PROMPT_REFERENCE>>> ... <<<END_UNTRUSTED_PROMPT_REFERENCE>>>` delimiters when composed.
2. **Zero Privilege Escalation:** Synchronized prompts never become system-level instructions, install executable hooks, grant MCP tool permissions, mutate local skills, or execute shell commands.
3. **SSRF & Transport Confinement:**
   - Strictly enforces `parsed.origin === "https://promt.rootcastle.com"`.
   - Rejects redirects (`redirect: "error"`), embedded URL credentials, path traversal outside `catalog/[a-zA-Z0-9._-]+\.json`, and payloads exceeding `16 MiB` shards or `40,000` character prompt bodies.
4. **Content Integrity vs Publisher Authentication (Explicit Distinction):**
   - `integrityHashVerified: true`: SHA-256 content digests (`contentSha256` & `manifestSha256`) verify downloaded bytes were not altered post-fetch or corrupted in local cache (`pinPromptVersion`).
   - `publisherSignatureVerified: false` (`authenticityMode: "https_origin_and_sha256_only"`): Unsigned JSON manifests rely on TLS/HTTPS origin transport plus SHA-256 digests — they are **not** detached cryptographic publisher signatures (`PGP`/`Sigstore`). Until cryptographic signatures exist upstream, external prompts remain `UNTRUSTED_EXTERNAL_REFERENCE`.
5. **Injection Scanning:** `scanPromptForInjection` detects role spoofing, instruction override strings, delimiter escapes, `rm -rf /`, and remote shell pipes, down-ranking or filtering risky prompts (`excludeInjectionRisk: true`).

---

## 2. Caching, TTL, Offline Fallback & Atomic Rollback

- **Incremental Caching:** Matching `manifestSha256` reuses valid local cache without redundant downloads while refreshing `lastVerifiedAt`.
- **TTL & Offline Continuity:** Cached snapshots remain `"fresh"` inside `DEFAULT_TTL_MS` (`24h`) and degrade cleanly to `"stale_offline_fallback"` or `"bundled_fallback"` (`loadBundledFallbackSnapshot`) when offline or expired.
- **1-Step Safe Rollback:** Before atomically swapping `prompt-archive.json` via temporary staging (`0o600`), `syncArchive` preserves the previous validated snapshot at `prompt-archive.prev.json`. Call `rollbackSnapshot(cacheDir)` to restore the prior validated snapshot atomically.
- **Version Pinning:** `pinPromptVersion(snapshot, promptId, expectedVersion)` verifies exact prompt version and recalculates `contentSha256` prior to composition.
