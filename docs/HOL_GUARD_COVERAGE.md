# REI Skills MCP — HOL Guard coverage and release qualification

**Publisher:** Rootcastle Engineering & Innovation (GitHub: [rootcastleco](https://github.com/rootcastleco))  
**Status:** External, local opt-in; not a security certification or endorsement.  
**Reviewed upstream contribution:** [hashgraph-online/hol-guard PR #7538](https://github.com/hashgraph-online/hol-guard/pull/7538).  
**Source-of-truth policy:** [mcp.rei-skills.json](https://github.com/hashgraph-online/hol-guard/blob/main/contributions/mcp-servers/mcp.rei-skills.json).

## Trust boundaries

- HOL Guard's upstream catalog declares `npx -y rei-skills@6.2.0 mcp`. The current REI Skills repository declares `6.8.0` (checked 2026-11-23). **Do not silently replace the reviewed launcher pin**; qualify a proposed revision separately.
- Seven upstream discovery/retrieval/compilation tools have the `inherit` state. `rei_install_skill` and `other` are `review`.
- `inherit` is **not** approval. Guard policy, device-specific grants and first-party floors still apply.
- Local REI Skills policy (`lib/hol-guard-policy.js`) runs independently. Its allowlist does not demonstrate that the upstream Guard intercepted a call.
- The active REI MCP surface may include `rei_compose_prompt`, `rei_propose_prompt_improvement` and opt-in extended tools absent from upstream's reviewed inventory; upstream `other=review` applies if identified by Guard. Never infer new tools are covered by a named reviewed entry.
- Skill content is untrusted instructions. Compilation or retrieval does not authorize execution, remote transmission, or installation.

## Setup in a disposable workspace

1. Install and enable a locally reviewed HOL Guard release following [HOL Guard MCP contributions](https://github.com/hashgraph-online/hol-guard/blob/main/docs/guard/mcp-server-contributions.md); this contributed extension remains off until a local administrator enables it.
2. Use the **reviewed** launch identity `npx -y rei-skills@6.2.0 mcp` with a workspace containing only disposable data. Record the downloaded artifact hash, npm provenance and Guard version; a launcher selector alone is not an installed-package attestation.
3. Confirm disabled state leaves the contribution inert, then enable it locally and observe Guard's per-tool decision traces.
4. Run the local contract smoke test: `node scripts/tests/hol-guard-coverage-contract.test.js`. It verifies REI's source-level policy and tool inventory assumptions only, **not** Guard runtime interception.

## Test matrix and required evidence

| Scenario | Expected upstream behavior | Evidence |
| --- | --- | --- |
| Extension disabled | Contributed defaults inactive | Before/after Guard decisions |
| Search, recommendation, retrieval, workflow, bundle, compile, targets | `inherit`; subject to host policy | Per-tool decision log |
| `rei_install_skill` with `dry_run=true` | `review` unless stricter policy | Approval request, unchanged workspace hash |
| Installation with `conflict_policy=abort` | `review`; conflicts must abort | Approval and conflict result |
| Replacement with `conflict_policy=backup` and matching `preview_token` | `review` plus application-level backup | Backup path, change log, recovery |
| Installation outside approved workspace or without approval | Denied by relevant policies | Denial and unchanged files |
| Unknown tool, prompt tools, and opt-in extended tools | `other=review` at upstream boundary | Guard decision per tool |
| Unversioned / other-version launch | No assertion of reviewed release; tightening reviews persist | Launch identity and tool decision |
| Cloud-only activation or stronger global floor | Must not bypass local opt-in / stronger floor | Negative decisions |

A **PASS** requires actual Guard-installed agent/hook interception and immutable test logs. Passing the local smoke test alone is **NOT VERIFIED** for the external interception gate.

## Release procedure

- Propose the 6.8.0 policy update only after verifying actual npm package identity and tool inventory, review of new/changed effects, Guard native and Python contribution suites, isolated installation/rollback tests, and the live interception matrix above.
- Keep `rei_install_skill=review` and `other=review`; never add `allow` without a new security review.
- Capture Guard version, REI package version and digest, CI URLs, reviewed PR, test environment, decision traces and a dated reviewer sign-off.
- Rollback: disable the extension locally; restore the previous reviewed launcher pin and contribution on a separate PR; recover workspace files from recorded backups. Do not force-update user work.

## Publisher launch copy

**REI Skills MCP** — Engineering skill discovery, recommendations, retrieval, workflows and agent-targeted compilation by [Rootcastle Engineering & Innovation](https://rootcastle.com/). Optional workspace installation can modify files and requires review. This community-contributed HOL Guard catalog entry is **external and disabled until locally enabled**. Its tool coverage and permission gates are documented, but catalog presence is not a security certification, upstream endorsement or proof of live agent-hook interception.

## Verification record (2026-11-23)

- Upstream PR #7538: merged; reviewed contribution currently pins 6.2.0.
- REI Skills main source manifest: 6.8.0.
- Local source-level tests and runtime interception results must be recorded separately. No external production qualification is asserted here.
