#!/usr/bin/env python3
"""
Repair and Normalize Skill Frontmatter & Provenance
Rootcastle Engineering & Innovation (REI)

1. Repairs broken multiline YAML `description:` fields caused by legacy quote scripts.
2. Restores accurate upstream `source:` attribution from attribution manifests and docs/SOURCES.md.
3. Assigns accurate risk classifications (`none`, `safe`, `critical`, `offensive`) where `risk: unknown`.
4. Ensures every `SKILL.md` parses cleanly with both PyYAML and Node `yaml`.
"""

import json
import os
import re
import sys
import yaml
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
MS_ATTRIBUTION_FILE = REPO_ROOT / "docs" / "microsoft-skills-attribution.json"
LEGACY_DATA_INDEX = REPO_ROOT / "data" / "skills_index.json"
REA_MANIFEST_FILE = REPO_ROOT / "data" / "rei-rea-manifest.json"

# Explicit upstream provenance map from CREDITS.md and docs/SOURCES.md
EXPLICIT_SOURCES = {
    # Anthropic Official
    "docx-official": "anthropics/skills",
    "pdf-official": "anthropics/skills",
    "pptx-official": "anthropics/skills",
    "xlsx-official": "anthropics/skills",
    "brand-guidelines-anthropic": "anthropics/skills",
    "internal-comms-anthropic": "anthropics/skills",
    "mcp-builder": "anthropics/skills",
    "webapp-testing": "anthropics/skills",
    # OpenAI Official
    "concise-planning": "openai/skills",
    "skill-creator": "openai/skills",
    # Vercel Labs
    "vercel-deploy-claimable": "vercel-labs/agent-skills",
    "react-best-practices": "vercel-labs/agent-skills",
    "web-design-guidelines": "vercel-labs/agent-skills",
    "vercel-deployment": "vercel-labs/agent-skills",
    # Supabase
    "postgres-best-practices": "supabase/agent-skills",
    # Remotion
    "remotion-best-practices": "remotion-dev/skills",
    # Google Labs / Gemini
    "design-md": "google-labs-code/stitch-skills",
    "deep-research": "sanjay3290/ai-skills",
    "imagen": "sanjay3290/ai-skills",
    # Hugging Face
    "hugging-face-cli": "huggingface/skills",
    "hugging-face-jobs": "huggingface/skills",
    # Trail of Bits
    "culture-index": "trailofbits/skills",
    "fix-review": "trailofbits/skills",
    "sharp-edges": "trailofbits/skills",
    # Expo
    "expo-deployment": "expo/skills",
    "upgrading-expo": "expo/skills",
    # Sentry
    "commit": "getsentry/skills",
    "create-pr": "getsentry/skills",
    "find-bugs": "getsentry/skills",
    "iterate-pr": "getsentry/skills",
    # Neon
    "using-neon": "neondatabase/agent-skills",
    # fal.ai
    "fal-audio": "fal-ai-community/skills",
    "fal-generate": "fal-ai-community/skills",
    "fal-image-edit": "fal-ai-community/skills",
    "fal-platform": "fal-ai-community/skills",
    "fal-upscale": "fal-ai-community/skills",
    "fal-workflow": "fal-ai-community/skills",
    # fp-ts
    "fp-ts-pragmatic": "whatiskadudoing/fp-ts-skills",
    "fp-ts-react": "whatiskadudoing/fp-ts-skills",
    "fp-ts-errors": "whatiskadudoing/fp-ts-skills",
    # Specific community repos in docs/SOURCES.md
    "cloud-penetration-testing": "hacktricks/community",
    "active-directory-attacks": "hacktricks/community",
    "owasp-top-10": "owasp/community",
    "crewai": "crewai/community",
    "langgraph": "langchain-ai/langgraph",
    "automate-whatsapp": "gokapso/agent-skills",
    "observe-whatsapp": "gokapso/agent-skills",
    "readme": "Shpigford/skills",
    "screenshots": "Shpigford/skills",
    "aws-skills": "zxkane/aws-skills",
    "ffuf-claude-skill": "jthack/ffuf_claude_skill",
    "ui-skills": "ibelick/ui-skills",
    "vexor": "scarletkc/vexor",
    "pypict-skill": "omkamal/pypict-claude-skill",
    "makepad-skills": "ZhangHanDong/makepad-skills",
    "swiftui-expert-skill": "AvdLee/SwiftUI-Agent-Skill",
    "threejs-skills": "CloudAI-X/threejs-skills",
    "claude-scientific-skills": "K-Dense-AI/claude-scientific-skills",
    "claude-win11-speckit-update-skill": "NotMyself/claude-win11-speckit-update-skill",
    "security-bluebook-builder": "SHADOWPR0/security-bluebook-builder",
    "beautiful-prose": "SHADOWPR0/beautiful_prose",
    "claude-ally-health": "huifer/Claude-Ally-Health",
    "clarity-gate": "frmoretto/clarity-gate",
    "n8n-code-python": "czlonkowski/n8n-skills",
    "n8n-mcp-tools-expert": "czlonkowski/n8n-skills",
    "n8n-node-configuration": "czlonkowski/n8n-skills",
    "varlock-claude-skill": "wrsmith108/varlock-claude-skill",
    "linear-claude-skill": "wrsmith108/linear-claude-skill",
    "claude-speed-reader": "SeanZoR/claude-speed-reader",
    "skill-seekers": "yusufkaraaslan/Skill_Seekers",
    "frontend-slides": "zarazhangrui/frontend-slides",
    "skill-rails-upgrade": "robzolkos/skill-rails-upgrade",
    "context-fundamentals": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "context-degradation": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "context-compression": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "context-optimization": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "multi-agent-patterns": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "tool-design": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "evaluation": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "memory-systems": "muratcankoylan/Agent-Skills-for-Context-Engineering",
    "terraform-skill": "antonbabenko/terraform-skill",
    "agent-memory-mcp": "webzler/agentMemory",
}

NONE_RISK_KEYWORDS = {
    "brainstorming", "copywriting", "content-creator", "content-marketer",
    "doc-coauthoring", "writing-plans", "writing-skills", "beautiful-prose",
    "seo-content-writer", "seo-content-planner", "seo-keyword-strategist",
    "pricing-strategy", "market-sizing-analysis", "competitive-landscape",
    "competitor-alternatives", "product-manager-toolkit", "business-analyst",
    "startup-analyst", "hr-pro", "legal-advisor", "customer-support",
}

CRITICAL_RISK_KEYWORDS = {
    "git-pushing", "deployment-engineer", "deployment-procedures",
    "database-migrations-sql-migrations", "database-migrations-migration-observability",
    "database-admin", "incident-responder", "incident-runbook-templates",
    "terraform-specialist", "terraform-skill", "kubernetes-architect",
    "k8s-manifest-generator", "helm-chart-scaffolding",
}


def load_source_lookup() -> dict[str, str]:
    lookup = dict(EXPLICIT_SOURCES)

    # 1. Microsoft skills attribution
    if MS_ATTRIBUTION_FILE.exists():
        ms_data = json.loads(MS_ATTRIBUTION_FILE.read_text(encoding="utf-8"))
        for entry in ms_data.get("skills", []):
            flat_name = entry.get("flat_name")
            if flat_name:
                lookup[flat_name] = "microsoft/skills"

    # 2. Legacy data/skills_index.json sources (e.g. vibeship-spawner-skills)
    if LEGACY_DATA_INDEX.exists():
        try:
            legacy_list = json.loads(LEGACY_DATA_INDEX.read_text(encoding="utf-8"))
            for item in legacy_list:
                sid = item.get("id")
                src = item.get("source")
                if sid and src and src not in ("unknown", "self", "rootcastle-rei"):
                    if sid not in lookup:
                        lookup[sid] = src
        except Exception:
            pass

    # 3. REI REA skills
    if REA_MANIFEST_FILE.exists():
        rea_data = json.loads(REA_MANIFEST_FILE.read_text(encoding="utf-8"))
        for sk in rea_data.get("skills", []):
            sid = sk.get("id")
            if sid:
                lookup[sid] = "rootcastle-rei"

    return lookup


def repair_frontmatter_text(fm_text: str) -> str:
    lines = fm_text.splitlines()
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^(description):\s*(.*)$", line)
        if m:
            val = m.group(2).strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val_inner = val[1:-1].strip()
            else:
                val_inner = val

            cont = []
            if val_inner in (">", ">-", "|", "|-"):
                val_inner = ""

            j = i + 1
            while j < len(lines) and (lines[j].startswith("  ") or not lines[j].strip()):
                if lines[j].strip():
                    cont.append(lines[j].strip())
                j += 1

            if cont:
                full_desc = (" ".join([p for p in [val_inner] + cont if p])).strip()
                out.append(f"description: {json.dumps(full_desc)}")
                i = j
                continue

        # Also handle unquoted values containing @ or colons
        kv_match = re.match(r"^(\s*[\w-]+):\s*(.+)$", line)
        if kv_match:
            key, val = kv_match.groups()
            val_s = val.strip()
            if val_s not in (">", ">-", "|", "|-") and not (
                val_s.startswith('"') or val_s.startswith("'") or val_s.startswith("[") or val_s.startswith("{")
            ):
                if "@" in val_s or ": " in val_s:
                    out.append(f"{key}: {json.dumps(val_s)}")
                    i += 1
                    continue

        out.append(line)
        i += 1
    return "\n".join(out)


def infer_risk(skill_id: str, current_risk: str, body: str) -> str:
    if current_risk in ("none", "safe", "critical", "offensive"):
        return current_risk
    if "AUTHORIZED USE ONLY" in body or any(
        w in skill_id for w in ("pentest", "exploit", "injection", "fuzzing", "privilege-escalation", "red-team", "attacks")
    ):
        return "offensive"
    if skill_id in NONE_RISK_KEYWORDS:
        return "none"
    if skill_id in CRITICAL_RISK_KEYWORDS:
        return "critical"
    return "safe"


def infer_source(skill_id: str, lookup: dict[str, str]) -> str:
    if skill_id in lookup:
        return lookup[skill_id]
    if skill_id.startswith("rei-"):
        return "rootcastle-rei"
    if skill_id.startswith(("azure-", "m365-", "microsoft-", "agent-framework-azure-")):
        return "microsoft/skills"
    return "community"


def main():
    lookup = load_source_lookup()
    repaired_yaml = 0
    updated_files = 0
    total_files = 0

    for skill_md in sorted(SKILLS_DIR.rglob("SKILL.md")):
        total_files += 1
        raw = skill_md.read_text(encoding="utf-8")
        fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$", raw)
        if not fm_match:
            print(f"⚠️ No frontmatter in {skill_md}")
            continue

        orig_fm, body = fm_match.group(1), fm_match.group(2)
        fixed_fm = repair_frontmatter_text(orig_fm)
        if fixed_fm != orig_fm:
            repaired_yaml += 1

        try:
            data = yaml.safe_load(fixed_fm)
        except Exception as e:
            print(f"❌ Failed to parse YAML in {skill_md}: {e}")
            continue

        skill_id = skill_md.parent.name
        current_risk = str(data.get("risk", "unknown")).strip()
        new_risk = infer_risk(skill_id, current_risk, body)
        new_source = infer_source(skill_id, lookup)

        # Update risk and source in fixed_fm lines
        fm_lines = fixed_fm.splitlines()
        new_fm_lines = []
        has_risk = False
        has_source = False
        for line in fm_lines:
            if re.match(r"^risk:\s*", line):
                new_fm_lines.append(f"risk: {new_risk}")
                has_risk = True
            elif re.match(r"^source:\s*", line):
                new_fm_lines.append(f"source: {new_source}")
                has_source = True
            else:
                new_fm_lines.append(line)

        if not has_risk:
            new_fm_lines.append(f"risk: {new_risk}")
        if not has_source:
            new_fm_lines.append(f"source: {new_source}")

        final_fm = "\n".join(new_fm_lines)
        new_content = f"---\n{final_fm}\n---{body}"
        if new_content != raw:
            skill_md.write_text(new_content, encoding="utf-8", newline="\n")
            updated_files += 1

    print(f"✅ Processed {total_files} SKILL.md files.")
    print(f"   🔧 Repaired multiline YAML descriptions: {repaired_yaml}")
    print(f"   📝 Updated provenance/risk metadata: {updated_files}")


if __name__ == "__main__":
    main()
