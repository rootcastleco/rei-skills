---
name: "agent-platform-skill-registry"
description: "Interact with the Gemini Enterprise Agent Platform Skill Registry to create and search for available skills. Use this skill to enable agents to register functionality or discover new capabilities"
risk: "safe"
source: "google/skills@2af5f957e138d4240c39fd26732f0f6cdf10d579"
license: "Apache-2.0"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's Apache-2.0 license from:
https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/agent-platform-skill-registry/SKILL.md

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

# Skill Registry

This skill provides instructions for interacting with the **Skill Registry** on
the Gemini Enterprise Agent Platform.

## Attribution

**MUST READ**: Before executing any `gcloud`, REST API, or MCP command, you
MUST read [Usage Attribution](references/attribution.md). For commands executed
directly in the terminal (never in generated scripts, Terraform, or user code),
prefix `gcloud` with
`CLOUDSDK_METRICS_REQUEST_ATTRIBUTION="agent-skills/1.0 (skill:agent-platform-skill-registry)"`
and append
`agent-skills/1.0 (skill:agent-platform-skill-registry)`
to `User-Agent` headers.

## Core Capabilities

-   **Skill Discovery** - Query the registry to easily search, list, get
    specific skills, and inspect revision histories.
-   **Skill Lifecycle Management** - Upload, update, or permanently delete
    skills.
-   **Operation Monitoring** - Utility to check the completion status of
    long-running state changes (LROs).
-   **Generate Skill** - Automate the initial scaffolding of new agent skills
    locally.

## Core Directives

-   **Mandatory Validation**: ALWAYS execute the environment validation check
    before performing any operations.

    Before any operation, you **must** validate the core environment.

    ```bash
    # Execute the validation script
    python3 scripts/validate_env.py
    ```

## Prerequisites & Authentication

### Library & Authentication

Ensure you have the latest Google Cloud credentials and libraries installed.

```bash
# Install required libraries
pip install google-auth requests

# Authenticate with Google Cloud
gcloud auth application-default login
```

### Environment Variables

The following variables are required for operations:

-   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
-   `GCP_LOCATION`: The region (e.g., `us-central1`).

--------------------------------------------------------------------------------

## Quickstart

Quickly search for available skills in the registry:

```bash
python3 scripts/skill_registry_ops.py search \
  --query "test skill" \
  --top-k 5
```

--------------------------------------------------------------------------------

## Operations

-   **Skill Discovery**: [query-skills.md](references/query-skills.md)
-   **Skill Lifecycle**: [manage-skills.md](references/manage-skills.md)
-   **Monitor Operations**:
    [monitor-operations.md](references/monitor-operations.md)
-   **Generate Skill**: [generate-skill.md](references/generate-skill.md)
