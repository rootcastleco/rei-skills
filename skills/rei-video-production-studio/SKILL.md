---
name: rei-video-production-studio
description: "Isolated external adapter contract for OpenMontageInc/OpenMontage (AGPL-3.0, commit 2e003e6). Blocked by default under commercial clean-room policy unless allowAgplProviders=true is explicitly set for an external worker."
category: workflow
risk: critical
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - openmontage
    - agpl-3.0
    - video
    - studio
    - license-gate
---

# REI Video Production Studio (`OpenMontage` Isolated External Adapter)

Provide an isolated integration boundary and license gate for `OpenMontageInc/OpenMontage` (`AGPL-3.0`) without introducing AGPL source code or heavy GPU/Blender/Remotion runtimes into the core `rei-skills` MIT package.

## When to Use

- Determining whether a studio video job should route to permissive `rei-programmatic-video` (`Apache-2.0`) vs externally deployed OpenMontage Backlot pipelines.
- Enforcing `LICENSE_AGPL_BLOCKED` automatically in commercial proprietary pipelines unless explicit legal/operator opt-in (`allowAgplProviders: true`) is provided.

## Inputs and Outputs

- **Inputs:** Storyboard spec JSON and policy flags (`commercialUse`, `allowAgplProviders`).
- **Outputs:** Policy gate verdict (`BLOCKED` under `LICENSE_AGPL_BLOCKED` by default; `ISOLATED_EXTERNAL_OPT_IN` manifest contract when authorized).

## Prerequisites & License Constraints

- Upstream: `OpenMontageInc/OpenMontage` (`AGPL-3.0`, commit `2e003e65fa99a0f329478a2c1cdcf26bc481933a`).
- **CRITICAL LICENSE BOUNDARY:** `AGPL-3.0` imposes strong network copyleft obligations. OpenMontage source code and sub-tools (Remotion, Blender, Kling/Fal providers) are **excluded** from `rei-skills` npm distribution and must only run out-of-process in an explicitly approved environment.

## Offline vs Online Capabilities

- **In-Repo:** Deterministic policy enforcement and isolated storyboard export run offline.
- **External Worker:** Live studio execution requires a separately installed OpenMontage checkout, FFmpeg, Python 3.10+, Node.js, and optional GPU/API keys.

## Procedure

1. Check provider policy via `evaluateProviderPolicy(openmontage, { commercialUse, allowAgplProviders })`.
2. Route standard commercial workflows to `hyperframes` / `video-use` (`Apache-2.0` / `MIT`) when AGPL copyleft is disallowed.
3. Only launch isolated external Backlot runners when `allowAgplProviders === true` is documented.

```sh
node bin/install.js providers list --commercial --json
node -e 'const {evaluateProviderPolicy,loadProviderManifest}=require("./lib/multimodal-registry"); const p=loadProviderManifest().providers.find(x=>x.id==="openmontage"); console.log(evaluateProviderPolicy(p,{commercialUse:true,allowAgplProviders:false}));'
```

## Do not use

Constraints and safety: Operational boundary — never copy AGPL-3.0 code directly into MIT `lib/` or `skills/`, never enable `allowAgplProviders` silently in commercial pipelines, and never claim Backlot execution unless the external worker ran and produced verified `.mp4` outputs.

## Verification Criteria & Failure Recovery

- Verify commercial clean-room policy blocks `openmontage` with `code: "LICENSE_AGPL_BLOCKED"` when `allowAgplProviders` is false.

## Authoritative product references

- https://github.com/OpenMontageInc/OpenMontage
