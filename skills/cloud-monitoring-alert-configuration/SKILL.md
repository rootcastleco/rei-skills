---
name: "cloud-monitoring-alert-configuration"
description: "Configures Cloud Monitoring alerting policies using Terraform and PromQL across Cloud Run, Google Kubernetes Engine (GKE), Compute Engine, AI Hypercomputer reservations, Vertex AI Agent Engine, and generic Google Cloud resources. Use when creating, reviewing, migrating, or deduplicating Terraform alerting policies for latency, traffic, error rates,"
risk: "safe"
source: "google/skills@2af5f957e138d4240c39fd26732f0f6cdf10d579"
license: "Apache-2.0"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's Apache-2.0 license from:
https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/SKILL.md

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

# Configure Cloud Monitoring Alerts

Configure high-signal alerting policies in Cloud Monitoring using
Terraform (`google_monitoring_alert_policy`) and PromQL
(`condition_prometheus_query_language`).

## Usage Attribution

For all `gcloud` CLI, REST API, and MCP attribution requirements when executing
commands with this skill, follow the instructions in
[Usage Attribution](references/attribution.md).

## Enforce Core Alerting Rules

1.  **Apply the Four Golden Signals**: Cover latency, traffic, errors, and
    saturation for the target workload.
2.  **Use Dynamic Grouping**: Aggregate metrics by resource labels and
    parameterize thresholds with Terraform variables. Never hardcode ephemeral
    pod or instance identifiers.
3.  **Default to PromQL**: Use Prometheus Query Language (PromQL) for metric
    conditions, and use log-based alerts
    (`condition_matched_log` or `google_logging_metric`) for lifecycle and
    audit events.
4.  **Attach Skill Attribution Labels**: Always include `user_labels` with
    `created-with-google-skill = "cloud-monitoring-alert-configuration"` on
    every generated `google_monitoring_alert_policy` resource.
5.  **Require User Confirmation Before Mutating Resources**: Never execute
    commands that modify infrastructure, enable telemetry, create online
    monitors, or apply Terraform without waiting for explicit user confirmation.
6.  **Prompt for Notification Channels**: Alerting policies without notification
    channels incur charges without notifying anyone during an incident. Whenever
    notification channels are not specified in the user prompt across any
    workflow, explicitly inform the user that no notification channels are
    attached to the alerting policies, advise them to configure and attach
    notification channels before deploying, and ask at the end of your response
    if they want to configure notification channels.

## Route by Target Resource Type

Identify the target resource type and read only the matching reference file
directly. Never run directory listings or workspace file searches to look for
queries or `.tf` files unless the prompt
explicitly provides a file path. If a user asks to fix or validate a PromQL
query without providing the query text or a file path, construct a
representative broken-and-corrected query example directly.

### Configure Cloud Run Alerts

*   **HTTP Services**:
    [cloud_run_services.md](references/cloud_run_services.md)
*   **Batch Jobs**:
    [cloud_run_jobs.md](references/cloud_run_jobs.md)
*   **Worker Pools**:
    [cloud_run_worker_pools.md](references/cloud_run_worker_pools.md)

### Configure Google Kubernetes Engine Alerts

*   **PromQL Queries and Golden Signals**:
    [GKE PromQL Queries](references/kubernetes_promql_queries.md)
*   **Metrics Catalog and Open-Source Alerts**:
    [GKE Metrics](references/kubernetes_metrics_and_alerts_catalog.md)
*   **Prerequisites and Setup**:
    [GKE Setup](references/kubernetes_gke_configuration_prerequisites.md)

### Configure AI Agent Alerts

*   **Reliability**:
    [Reliability](references/agent_platform_reliability_alert_policies.md)
*   **Quality**:
    [Quality](references/agent_platform_quality_alert_policies.md)
*   **Cost**:
    [Cost](references/agent_platform_cost_alert_policies.md)
*   **Safety**:
    [Safety](references/agent_platform_safety_alert_policies.md)
*   **Security**:
    [Security](references/agent_platform_security_alert_policies.md)
*   **Telemetry Enablement**:
    [Telemetry](references/agent_platform_telemetry_enablement.md)
*   **Traffic Profiles**:
    [Historical](references/agent_platform_has_historical_traffic_data.md)
    and
    [No History](references/agent_platform_no_historical_traffic_data.md)

### Configure Compute Engine and AI Hypercomputer Alerts

*   **Compute Engine VMs, MIGs, GPU XID Insights, Host or Reservation
    Maintenance (`type=scheduled`, `unscheduled`, or `multiple`), and Machine
    or Domain Health**:
    [compute_engine_alerts.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/references/compute_engine_alerts.md)

### Configure Generic Resource Alerts

*   **Generic Workloads, Custom Metrics, MQL Migration, and HCL Deduplication**:
    [generic_alert_policies.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/references/generic_alert_policies.md)

### Delegate Service Level Objective Alerts

**Delegate to the `google-cloud-slo-alert-configuration` skill.** That skill
owns the SLO setup wizard, the burn-rate PromQL templates
(`references/promql_templates.md`), the SLI metric mapping
(`references/service_metrics.md`), and the App Hub scoping labels
(`references/app_hub_labels.md`). Do **NOT** duplicate those templates here or
claim that this skill owns its own SLO PromQL template library.

Delegate whenever the user asks for an **availability or latency SLO**, an
**error budget or burn-rate alert**, or a **Service Level Objective** on any
resource. When SLOs are only one part of a broader request (for example, a full
production alerting suite for a Cloud Run service), delegate the SLO policies
and continue generating the remaining golden-signal policies from the
resource-specific reference in the same response.

Every resource reference carries a **Context to hand off** list naming the SLI
metric, its good or bad filter, and the grouping labels — under a `## Delegate
Service Level Objective Alerts` heading for Cloud Run and generic resources, and
inside the SLO section itself for GKE and Agent Platform. Read it and pass that
context on, so the SLO skill does not repeat discovery you have already done.
When delegating, you MUST also:

1.  State the SLO target and window explicitly if the user gave them, or let the
    SLO skill apply its SRE defaults (99.9% over a rolling 28 days) if they did
    not.
2.  Require the returned policies to carry `user_labels` with
    `created-with-google-skill = "cloud-monitoring-alert-configuration"` so
    attribution stays consistent with the rest of the generated suite. This
    literal value does **NOT** change when you delegate: the label records the
    entry-point skill, not whichever skill supplied the template. Do **NOT**
    set `created-with-google-skill = "google-cloud-slo-alert-configuration"` on
    policies generated through this delegation.
3.  Preserve the burn-rate duration contract, which
    `google-cloud-slo-alert-configuration` does not specify: Fast Burn (`1h` and
    `5m` windows, factor `14.4`) carries `duration = "300s"`, and Slow Burn
    (`[3d]` and `[6h]` lookback, factor `1.0`) **omits the `duration` field
    entirely** — do not emit `duration = "0s"` in its place. Cloud Monitoring
    rejects a non-zero retest buffer when the lookback window exceeds 25 hours.
4.  When no notification channels are provided, inform the user that no
    notification channels are attached to the alerting policies, advise them to
    configure and attach notification channels, and ask if they want to
    configure notification channels.

> [!IMPORTANT]
> **Always tell the user about the referral, even on the fallback path.** Some
> reference files in this skill include standalone burn-rate templates to use
> when the `google-cloud-slo-alert-configuration` skill is not installed. If you
> emit policies from those fallback templates, your response MUST still tell the
> user that `google-cloud-slo-alert-configuration` owns SLO configuration, state
> that the emitted policies use the local fallback templates, and list the
> handoff context. Never silently present SLO policies as if this
> skill owned them.

> [!NOTE]
> **Exception**: Agent Platform (OpenTelemetry-instrumented AI agents on any
> runtime, including Vertex AI Agent Engine and Cloud Run) is the one resource
> whose Fast and Slow burn policies live in this skill and remain authoritative.
> Delegate only for SLO customization — see
> [Reliability](references/agent_platform_reliability_alert_policies.md).

## Delegate Related Observability Tasks

*   **Notification Channels**: Delegate to
    `cloud-monitoring-notification-channels-configuration` to configure email,
    PagerDuty, Pub/Sub, or Slack channels. When an alerting policy has no
    notification channels attached, inform the user that no notification
    channels are attached and that they should configure notification channels
    and attach them to the alerting policy.
*   **PromQL Authoring**: Delegate to `cloud-monitoring-promql-query` for
    standalone PromQL query authoring or metric exploration.

## Follow the Alert Configuration Workflow

1.  **Discover**: Identify target resources, metric schemas, and scoping
    projects using the lookup commands in the matching reference file (such as
    [discover_metric_schema.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/discover_metric_schema.py) for Compute
    Engine metrics and other Google Cloud resource metrics, or
    [gather_agent_info.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/gather_agent_info.py),
    [check_telemetry.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/check_telemetry.py),
    [analyze_traffic.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/analyze_traffic.py),
    [create_online_monitor.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/create_online_monitor.py),
    [list_trace_scope_table_names.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/list_trace_scope_table_names.py),
    and
    [list_log_scope_table_names.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/list_log_scope_table_names.py)
    for AI agents).
2.  **Route**: Load the reference file for the target resource type or delegate
    SLOs to `google-cloud-slo-alert-configuration`.
3.  **Generate**: Produce parameterized Terraform HCL configurations with
    required `user_labels`.
4.  **Validate**: When the loaded reference file requires a validation script
    (such as [lint_promql.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/lint_promql.py),
    [validate_config.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/kubernetes/validate_config.py),
    [lint_syntax.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/lint_syntax.py), or
    [scan_duplicates.py](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/cloud-monitoring-alert-configuration/scripts/agent_platform/scan_duplicates.py)), run or
    print that exact script command. Do not list or search the `scripts/`
    directory.
5.  **Explain and Prompt**: Explain each alert policy in plain English. When no
    notification channels are provided, tell the user that no notification
    channels are attached to the alerting policy, advise them to configure and
    attach notification channels, and ask if they want to configure notification
    channels.
