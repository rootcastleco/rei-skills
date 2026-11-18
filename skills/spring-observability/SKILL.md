---
name: "spring-observability"
description: "Add and review observability in Spring Boot 3/4 apps: Actuator exposure and health probes, Micrometer metrics, Observation API, OpenTelemetry tracing and OTLP/Prometheus export, structured logging with correlation ids, and safe use of heapdump/threaddump. Use when instrumenting, monitoring or troubleshooting a Spring Boot service"
risk: "safe"
source: "github/awesome-copilot@74b98979877d209fb6277a9364f7b21e2f3fe222"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/spring-observability/SKILL.md

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

# Spring Boot observability

Covers Actuator, Micrometer, the Observation API, tracing, and logging. Details in `references/`. For JDK-level diagnosis (thread dumps, JFR, heap analysis) see the `java-diagnostics` skill; for securing endpoints see `spring-security`.

## Safety rules

- Never read or print secrets (`.env`, credentials, tokens) while inspecting configuration or `/actuator/env`.
- Never expose `heapdump` or `threaddump` over public HTTP. The only exception is a temporary, user-consented window with authentication, TLS and network restriction, removed afterwards (same policy in `java-diagnostics`).
- Never expose `env`, `configprops`, `loggers`, or `shutdown` in production without authentication and network restrictions.
- Pin dependency versions via the Boot BOM; do not add explicit versions for Boot-managed artifacts.

## Detect first

Check the Boot version (3.x or 4.x) and what is already present (`spring-boot-starter-actuator`, `micrometer-registry-*`, tracing/OTel dependencies, `logback-spring.xml`). Boot 4 modularized observability (`spring-boot-micrometer-*`, `spring-boot-opentelemetry`) but starters still bring them in.

## Quick start

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus   # allow-list, never "*" in production
  endpoint:
    health:
      probes:
        enabled: true                     # /actuator/health/liveness and /readiness
      show-details: when-authorized
```

## Topics

- [Actuator, health groups and probes, endpoint exposure](references/actuator.md)
- [Micrometer metrics and Prometheus/OTLP export](references/metrics.md)
- [Observation API and tracing with OpenTelemetry](references/tracing-observation.md)
- [Structured logging and correlation ids](references/logging.md)
- [Heapdump/threaddump caveats and runtime diagnosis](references/dumps-and-diagnostics.md)

## Checklist

- [ ] Only needed endpoints exposed and secured; separate management port if possible.
- [ ] Liveness/readiness probes configured for the platform (Kubernetes); readiness group includes critical dependencies only.
- [ ] Metrics exported to the chosen backend; common tags (`application`, `env`) set; no high-cardinality tags (user ids, URLs with ids).
- [ ] Tracing sampling probability set deliberately (Boot default 10%).
- [ ] Logs carry trace/span ids; JSON structured logs in production.
- [ ] Custom observations/metrics have tests.

## Local runtime insights (optional)

For a local-only developer console (and an opt-in MCP server) that shows a running Spring Boot or Quarkus app's runtime state, see BootUI: https://github.com/jdubois/boot-ui and https://www.julien-dubois.com/boot-ui/. Its agent skill can be installed with `gh skill install jdubois/boot-ui skills/bootui`.

- Ask the user for consent before adding any dependency.
- Use it only in a dev/local profile (for example a Maven/Gradle profile or `developmentOnly` configuration); never ship it to production.
- Follow BootUI's own documentation for coordinates and setup rather than copying them here.

See also: <https://docs.spring.io/spring-boot/reference/actuator/observability.html> and <https://docs.micrometer.io/micrometer/reference/>.
