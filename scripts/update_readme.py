#!/usr/bin/env python3
"""
Deterministic README Metadata Updater for REI Skills
Rootcastle Engineering & Innovation (REI)

Synchronizes total skill count and per-category counts in README.md from
data/catalog.json and skills_index.json.
"""

import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


CATEGORY_META = [
    (
        "data-ai",
        "Data & AI",
        "LLM architectures, RAG, vector databases, data pipelines, Azure AI",
        "[`rag-engineer`](skills/rag-engineer/SKILL.md), [`langgraph`](skills/langgraph/SKILL.md), [`postgres-best-practices`](skills/postgres-best-practices/SKILL.md)",
    ),
    (
        "general",
        "General Engineering",
        "Planning, technical documentation, debugging, specifications",
        "[`brainstorming`](skills/brainstorming/SKILL.md), [`concise-planning`](skills/concise-planning/SKILL.md), [`doc-coauthoring`](skills/doc-coauthoring/SKILL.md)",
    ),
    (
        "development",
        "Software Development",
        "TypeScript, Python, Go, Rust, Java, React, Next.js, mobile SDKs",
        "[`typescript-pro`](skills/typescript-pro/SKILL.md), [`python-pro`](skills/python-pro/SKILL.md), [`react-best-practices`](skills/react-best-practices/SKILL.md)",
    ),
    (
        "security",
        "Security & AppSec",
        "Threat modeling, SAST, vulnerability auditing, authorized red-teaming",
        "[`security-auditor`](skills/security-auditor/SKILL.md), [`threat-modeling-expert`](skills/threat-modeling-expert/SKILL.md), [`api-security-best-practices`](skills/api-security-best-practices/SKILL.md)",
    ),
    (
        "infrastructure",
        "Infrastructure & Cloud",
        "Kubernetes, Terraform, CI/CD, observability, SRE, service mesh",
        "[`kubernetes-architect`](skills/kubernetes-architect/SKILL.md), [`terraform-specialist`](skills/terraform-specialist/SKILL.md), [`observability-engineer`](skills/observability-engineer/SKILL.md)",
    ),
    (
        "workflow",
        "Workflows & Automation",
        "Multi-agent orchestration, task automation, integration pipelines",
        "[`workflow-automation`](skills/workflow-automation/SKILL.md), [`mcp-builder`](skills/mcp-builder/SKILL.md), [`gitops-workflow`](skills/gitops-workflow/SKILL.md)",
    ),
    (
        "architecture",
        "Architecture & DDD",
        "System design, C4 modeling, DDD, CQRS, event-driven systems",
        "[`backend-architect`](skills/backend-architect/SKILL.md), [`domain-driven-design`](skills/domain-driven-design/SKILL.md), [`c4-context`](skills/c4-context/SKILL.md)",
    ),
    (
        "business",
        "Product & Business",
        "Product management, technical SEO, pricing, GTM analysis",
        "[`product-manager-toolkit`](skills/product-manager-toolkit/SKILL.md), [`seo-audit`](skills/seo-audit/SKILL.md), [`pricing-strategy`](skills/pricing-strategy/SKILL.md)",
    ),
    (
        "testing",
        "Testing & QA",
        "Test-driven development, E2E browser automation, regression suites",
        "[`test-driven-development`](skills/test-driven-development/SKILL.md), [`browser-automation`](skills/browser-automation/SKILL.md), [`e2e-testing-patterns`](skills/e2e-testing-patterns/SKILL.md)",
    ),
    (
        "reverse-engineering",
        "Reverse Engineering",
        "Binary intelligence, firmware/IoT triage, APK/Electron/WASM, forensics",
        "[`rei-rea-orchestrator`](skills/rei-rea-orchestrator/SKILL.md), [`rei-binary-intelligence`](skills/rei-binary-intelligence/SKILL.md), [`rei-firmware-and-iot`](skills/rei-firmware-and-iot/SKILL.md)",
    ),
]


def update_readme():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    readme_path = os.path.join(base_dir, "README.md")
    catalog_path = os.path.join(base_dir, "data", "catalog.json")
    index_path = os.path.join(base_dir, "skills_index.json")

    if os.path.exists(catalog_path):
        with open(catalog_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        skills = catalog.get("skills", [])
    else:
        with open(index_path, "r", encoding="utf-8") as f:
            skills = json.load(f)

    total_skills = len(skills)
    cat_counts = {}
    for s in skills:
        c = s.get("category", "general")
        cat_counts[c] = cat_counts.get(c, 0) + 1

    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update badge count
    content = re.sub(
        r"(badge/skills-)\d+(%20validated)",
        rf"\g<1>{total_skills}\g<2>",
        content,
    )

    # 2. Update inline total counts
    content = re.sub(
        r"(\*\*)\d+( validated skills\*\*)",
        rf"\g<1>{total_skills}\g<2>",
        content,
    )
    content = re.sub(
        r"(across )\d+( skills by domain)",
        rf"\g<1>{total_skills}\g<2>",
        content,
    )
    content = re.sub(
        r"(All )\d+( skills are scanned)",
        rf"\g<1>{total_skills}\g<2>",
        content,
    )

    # 3. Rebuild category table between markers
    table_lines = [
        "<!-- CATEGORY_TABLE_START -->",
        "| Category | Count | Focus Area | Representative Skills |",
        "| :--- | ---: | :--- | :--- |",
    ]
    for slug, label, focus, examples in CATEGORY_META:
        cnt = cat_counts.get(slug, 0)
        table_lines.append(f"| **{label}** (`{slug}`) | {cnt} | {focus} | {examples} |")
    table_lines.append("<!-- CATEGORY_TABLE_END -->")
    table_block = "\n".join(table_lines)

    content = re.sub(
        r"<!-- CATEGORY_TABLE_START -->[\s\S]*?<!-- CATEGORY_TABLE_END -->",
        table_block,
        content,
    )

    with open(readme_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

    print(f"✅ README.md synchronized with {total_skills} validated skills.")


if __name__ == "__main__":
    update_readme()
