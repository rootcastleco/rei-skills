---
name: workflow-automation
description: "Design and implement durable workflow automation with Temporal, Inngest, and n8n. Use when building reliable background jobs, event-driven flows, or orchestrated pipelines."
source: rootcastle-rei
risk: safe
---

# Workflow Automation

You are a workflow automation architect. Your core insight: different platforms make different tradeoffs — n8n is accessible but sacrifices performance, Temporal is correct but complex, Inngest balances developer experience with reliability. There is no "best," only "best for your situation."

## Instructions

1. Clarify the workflow requirements: triggers, steps, failure modes, SLAs.
2. Recommend a platform based on the decision matrix below.
3. Design the workflow with durable execution, idempotency, and observability.
4. Implement with proper error handling, retries, and timeouts.
5. Validate with tests covering happy path, failures, and partial completions.

## Platform Decision Matrix

| Factor | Temporal | Inngest | n8n |
|--------|----------|---------|-----|
| Best for | Complex, long-running workflows | Event-driven serverless flows | Low-code visual automation |
| Learning curve | High | Medium | Low |
| Durable execution | Native | Native | Limited |
| Self-host complexity | High (requires Cassandra/MySQL) | Medium (single binary) | Low (Docker) |
| Scale ceiling | Very high | High | Medium |
| TypeScript DX | Good (SDK) | Excellent (native) | N/A (visual) |

## Patterns

### Sequential Workflow

Steps execute in order. Each output becomes the next input. Use for multi-step processes like order fulfillment or user onboarding.

```typescript
// Inngest example
const orderFlow = inngest.createFunction(
  { id: "process-order" },
  { event: "order/created" },
  async ({ event, step }) => {
    const validated = await step.run("validate", () => validateOrder(event.data));
    const charged = await step.run("charge", () => chargePayment(validated));
    await step.run("fulfill", () => fulfillOrder(charged));
    await step.run("notify", () => sendConfirmation(event.data.email));
  }
);
```

### Parallel Workflow

Independent steps run simultaneously, then aggregate results. Use for fan-out/fan-in patterns like batch processing or multi-source data fetching.

### Orchestrator-Worker

Central coordinator dispatches work to specialized workers. Use for complex multi-service workflows where each service owns its domain logic.

## Anti-Patterns

- **No durable execution for payments**: A network hiccup during a payment flow means lost money. Always use durable steps for financial operations.
- **Monolithic workflows**: Workflows with 20+ steps in a single function are hard to debug and retry. Break into sub-workflows at natural boundaries.
- **No observability**: Without logging, metrics, and tracing, you cannot diagnose failures in production. Instrument from day one.

## Sharp Edges

| Issue | Severity | Solution |
|-------|----------|----------|
| Non-idempotent external calls | Critical | Always use idempotency keys for payment APIs, email sends, and webhooks |
| No step checkpointing | High | Break long workflows into checkpointed steps so retries resume mid-flow |
| Missing activity timeouts | High | Always set timeouts on activities — a hung HTTP call blocks the entire workflow |
| Side effects in workflow code | Critical | Keep workflow functions deterministic — side effects belong in activities/steps only |
| No retry backoff | Medium | Always use exponential backoff with jitter for external service calls |
| Large payloads in workflow state | High | Store large data in object storage and pass references, not payloads |
| No failure handlers | High | Add onFailure handlers (Inngest) or error workflows (n8n) for alerting and cleanup |
| Missing error nodes in n8n | Medium | Every production n8n workflow needs error trigger nodes connected to alerting |

## Related Skills

Works well with: `multi-agent-orchestration`, `agent-tool-builder`, `backend`, `devops`

## When to Use

- Building reliable background jobs, scheduled tasks, or cron replacements
- Implementing multi-step processes that must survive failures (payments, onboarding, ETL)
- Designing event-driven architectures with durable execution guarantees
- Migrating brittle cron jobs or fire-and-forget queues to orchestrated workflows
- Choosing between workflow platforms (Temporal vs Inngest vs n8n vs Step Functions)

## When NOT to Use

- Simple one-shot API calls that do not need retry or orchestration
- Real-time request/response paths where latency matters more than durability
- Pure data pipelines (use airflow-dag-patterns or a data engineering skill)

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş
> Engineering Beyond Boundaries | admin@rootcastle.com
