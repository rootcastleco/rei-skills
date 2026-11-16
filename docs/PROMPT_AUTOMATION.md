# REI Skills — Prompt Archive & Hook Gateway

**Status:** opt-in Prompt Archive MVP; Rust hook gateway is a local preview-only prototype.
**Archive:** https://promt.rootcastle.com/
**Source API:** `/catalog-manifest.json` -> allowlisted `catalog/*.json` shards.
**HOL Guard:** [external REI Skills MCP contribution PR #7538](https://github.com/hashgraph-online/hol-guard/pull/7538) (merged 2026-11-15). This is a *separate integration*, not a runtime dependency and not proof that the new prompt/gateway module is protected by HOL.

## What works now

1. `npx rei-skills-prompt sync` downloads up to 32 catalog shards from the fixed HTTPS origin, rejects redirects, bounds response sizes and entry lengths, filters invalid records and writes an atomic snapshot to `~/.cache/rei-skills/prompt-archive.json`. Newly published prompts in the selected shards are discovered on subsequent syncs, **not pushed automatically**.
2. `npx rei-skills-prompt compose "my engineering task"` selects cached references using deterministic keyword scoring and produces a **review-only** task prompt with SHA-256 provenance for each excerpt.
3. `npx rei-skills-prompt propose "my task" --feedback "missing negative tests"` creates a proposed improvement record and **does not** edit a skill, create a commit, run a hook or deploy.
4. MCP tools `rei_compose_prompt` and `rei_propose_prompt_improvement` call the same offline cache. `rei_compose_prompt` includes the already-existing safe-only skill router.
5. Standalone Rust prototype `rust/rei-hook-gateway/` provides an optional loopback-only TCP listener (127.0.0.1:9783), mandatory token and allowlisted `health`, `hook.preview`, `hook.audit` events. It returns acknowledgements **without executing machine commands**.

The existing installer, MCP tools, skill catalog and publishing workflow remain intact. No automatic remote execution or autonomous code editing is enabled.

## Architecture

```text
promt.rootcastle.com (untrusted catalog JSON)
        | explicit sync, bounded HTTPS fetch, strict origin
        v
local versioned cache + SHA-256 excerpt references
        | deterministic relevance selection
        v
REI Skills Smart Router --> Draft prompt --> Human review
        |                                |
        +--> MCP read-only tools           +--> Feedback proposal
                                           |
                                       PR + CI + review
                                           |
                                      accepted changes
                                      (not automatic)
Optional: Rust hook gateway -- localhost auth --> preview/audit ACK only
External: HOL Guard -- opt-in MCP policy integration (separately configured)
```

## Safety and trust boundaries

The archive is **untrusted content**, including Rootcastle-authored and community-added prompts. Prompt body text is data, not a higher-priority instruction. A prompt cannot add privileges, install hooks or call OS tools. Remote networking is disabled during normal composition; only `sync` makes outbound requests. Requests use no cookies or authentication credentials. The cache is placed outside the repo and written atomically; a failed refresh preserves the previous snapshot.

The Rust gateway is a **prototype**. It does not use TLS, so it deliberately binds only to 127.0.0.1. Do not port-forward, expose via reverse proxy, or deploy to shared networks. Its fixed read-only ACK protocol is not a machine-command bridge. For a future remote fleet gateway require mutually authenticated TLS, per-device identities, replay prevention, signed policies, auditable actions, rate limiting and a deny-by-default hook allowlist.

HOL Guard should be applied as defense-in-depth to the MCP connection at its supported boundary; it does not make fetched prompts trustworthy or authorize code execution. Inspect the integration's package identity and policy deployment separately.

## Continuous improvement policy

Continuous feedback may **propose** better prompts, hook templates and tests. No unattended self-modification, file writes, auto-merges or auto-publication. Improvement workflow: observe → score → synthesize candidate → unit/contract/security tests → independent review → authorized merge → canary release → monitored rollback. Feedback and selection quality must be measurable (task success, false positives, tool-call denials, regression rate, latency). Fail closed if catalog parsing or authentication fails.

## Verification

```bash
npm ci
node scripts/tests/prompt-archive.test.js
npm test
npx rei-skills-prompt sync
npx rei-skills-prompt compose "firmware telemetry security validation"
```

For the optional Rust prototype (requires Rust toolchain):

```bash
cd rust/rei-hook-gateway
cargo test
REI_HOOK_GATEWAY_TOKEN="$(openssl rand -hex 32)" cargo run
```

Only use the loopback gateway in a local development session. The initial implementation has not been verified against physical devices or authenticated fleet communications.

## Exit criteria for a production Rust machine gateway

- Strict protocol schema, bounded messages, authentication/authorization and replay protections.
- No arbitrary shell or dynamic hook registration from an unreviewed prompt.
- TLS/mTLS in any non-loopback mode, certificate rotation and per-device revocation.
- Negative tests: spoofed tokens, oversized payloads, replay, malicious prompt injection, timeout, disconnect and fail-closed behavior.
- p95 latency and resource budgets measured under representative load; audit log correlation IDs and monotonic sequence numbering.
- Documented canary rollout, feature flag default-off, rollback and kill switch.
