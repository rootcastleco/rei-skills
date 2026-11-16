#!/usr/bin/env python3
"""
REI Skills — Canonical Skill Validator & Quality Scoring Pipeline
Rootcastle Engineering & Innovation (REI)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
import yaml

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

WHEN_TO_USE_PATTERNS = [
    re.compile(r"^##\s+When\s+to\s+Use", re.MULTILINE | re.IGNORECASE),
    re.compile(r"^##\s+Use\s+this\s+skill\s+when", re.MULTILINE | re.IGNORECASE),
    re.compile(r"^##\s+When\s+to\s+Use\s+This\s+Skill", re.MULTILINE | re.IGNORECASE),
    re.compile(r"^##\s+Entry\s+contract", re.MULTILINE | re.IGNORECASE),
]

HARDWARE_OR_PHYSICAL_PATTERN = re.compile(
    r"\b(pcb|kicad|spice|ngspice|fusion360|cad|mcad|ecad|vibration|rotor|balance|gnss|gps|rtos|embedded|firmware|accelerometer|daq|hardware|emc|emi|jt808|can)\b",
    re.IGNORECASE,
)
SPECIFICITY_PATTERN = re.compile(
    r"\b(units?|millimeters?|volts?|amperes?|hertz|tolerance|threshold|checksum|latency|clock|budget|contract|residual|schema|offset|crc)\b",
    re.IGNORECASE,
)
CONSTRAINTS_SAFETY_PATTERN = re.compile(
    r"^##\s+(Limitations|Constraints|Constraints\s+and\s+safety|Do\s+not\s+use|Evidence|Best\s+Practices|Operational\s+boundary)",
    re.MULTILINE | re.IGNORECASE,
)
PROCEDURE_PATTERN = re.compile(
    r"^##\s+(Procedure|Instructions|Workflow|How\s+It\s+Works|Core|Steps)",
    re.MULTILINE | re.IGNORECASE,
)
NEGATIVE_BOUNDARY_PATTERN = re.compile(
    r"^##\s+(Do\s+not\s+use|Limitations|Anti-Patterns|Non-Goals)|not\s+for\b|do\s+not\s+substitute",
    re.MULTILINE | re.IGNORECASE,
)


def load_evaluation_evidence(base_dir: Path):
    """Load real recorded evaluation evidence without fabricating pass states."""
    gold50_passed = set()
    benchmark_covered = set()

    gold50_report = base_dir / "data" / "benchmarks" / "gold50-evaluation-report.json"
    if gold50_report.exists():
        try:
            payload = json.loads(gold50_report.read_text(encoding="utf-8"))
            for item in payload.get("skills", []):
                if item.get("passed") is True and item.get("id"):
                    gold50_passed.add(item["id"])
        except Exception:
            pass

    bench_path = base_dir / "data" / "benchmarks" / "routing-benchmark-v1.json"
    if bench_path.exists():
        try:
            bench = json.loads(bench_path.read_text(encoding="utf-8"))
            for task in bench.get("tasks", []):
                for sid in task.get("expectedSkills", []) or []:
                    benchmark_covered.add(sid)
        except Exception:
            pass

    return gold50_passed, benchmark_covered


def score_quality_14(
    rel_id: str,
    content: str,
    metadata: dict,
    schema_ok: bool,
    refs_ok: bool,
    security_ok: bool,
    has_trigger: bool,
    has_references_dir: bool,
    has_scripts_dir: bool,
    gold50_passed: set,
    benchmark_covered: set,
):
    """Compute the deterministic 7-dimension (0-2, max 14) quality score & 6 verification axes."""
    dim_meta = 0
    if schema_ok:
        dim_meta = 1
        meta_obj = metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}
        tags_val = meta_obj.get("tags", "")
        has_tags = bool(tags_val) if isinstance(tags_val, (str, list)) else False
        if (metadata.get("license") or metadata.get("category") or has_tags) and len(str(metadata.get("description", ""))) >= 40:
            dim_meta = 2

    dim_trigger = 0
    if has_trigger:
        dim_trigger += 1
    if NEGATIVE_BOUNDARY_PATTERN.search(content):
        dim_trigger += 1
    if dim_trigger == 0 and re.search(r"use when\b", str(metadata.get("description", "")), re.IGNORECASE):
        dim_trigger = 1

    dim_spec = 0
    if len(content) >= 400 and metadata.get("description"):
        dim_spec += 1
    if SPECIFICITY_PATTERN.search(content) and (CONSTRAINTS_SAFETY_PATTERN.search(content) or rel_id in gold50_passed):
        dim_spec += 1

    dim_act = 0
    if PROCEDURE_PATTERN.search(content) or re.search(r"^\s*1\.\s+", content, re.MULTILINE):
        dim_act += 1
    if "```" in content or has_scripts_dir:
        dim_act += 1

    dim_refs = 0
    if refs_ok:
        dim_refs = 1
        if (
            has_references_dir
            or re.search(r"^##\s+(Authoritative|References|Sources|Documentation)", content, re.MULTILINE | re.IGNORECASE)
            or ("http://" in content or "https://" in content)
        ):
            dim_refs = 2

    dim_sec = 0
    if security_ok and metadata.get("risk") and metadata.get("risk") != "unknown":
        dim_sec = 1
        if re.search(
            r"Constraints\s+and\s+safety|Operational\s+boundary|untrusted\s+inputs?|AUTHORIZED\s+USE\s+ONLY|static-first|lockout",
            content,
            re.IGNORECASE,
        ):
            dim_sec = 2

    dim_eval = 0
    eval_passed = False
    if rel_id in gold50_passed:
        dim_eval = 2
        eval_passed = True
    elif rel_id in benchmark_covered or rel_id.startswith("rei-"):
        dim_eval = 1
        eval_passed = rel_id in benchmark_covered

    dimensions = {
        "metadata": dim_meta,
        "triggerPrecision": dim_trigger,
        "specificity": dim_spec,
        "actionability": dim_act,
        "references": dim_refs,
        "security": dim_sec,
        "evaluation": dim_eval,
    }
    score14 = sum(dimensions.values())
    mandatory_gate = bool(schema_ok and refs_ok and security_ok)

    if not mandatory_gate or score14 <= 3:
        tier = "Q0"
    elif score14 >= 12:
        tier = "Q3"
    elif score14 >= 8:
        tier = "Q2"
    else:
        tier = "Q1"

    hw_relevant = bool(HARDWARE_OR_PHYSICAL_PATTERN.search(f"{rel_id} {metadata.get('description', '')}"))
    verification_dimensions = {
        "schemaValid": schema_ok,
        "referenceValidated": refs_ok,
        "securityPolicyChecked": security_ok,
        "evaluationPassed": eval_passed,
        "humanReviewed": False,
        "hardwareVerified": "not_verified" if hw_relevant else "not_applicable",
    }

    return dimensions, score14, tier, tier == "Q0", verification_dimensions

MAX_DESCRIPTION_CHARS = 1024
VALID_RISK_LEVELS = ["none", "safe", "critical", "offensive", "unknown"]


def has_when_to_use_section(content: str) -> bool:
    return any(pattern.search(content) for pattern in WHEN_TO_USE_PATTERNS)


def parse_frontmatter(content: str):
    """
    Parse YAML frontmatter using PyYAML with fallback to line parser.
    Returns (metadata_dict_or_None, yaml_error_or_None).
    """
    fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---", content)
    if not fm_match:
        return None, "Missing YAML frontmatter delimiter (---)"

    fm_text = fm_match.group(1)
    try:
        loaded = yaml.safe_load(fm_text)
        if not isinstance(loaded, dict):
            return None, "Frontmatter must be a YAML mapping/object"
        # Convert scalar values to strings where expected by legacy consumers
        normalized = {}
        for k, v in loaded.items():
            normalized[str(k)] = v if isinstance(v, (dict, list)) else str(v).strip()
        return normalized, None
    except Exception as exc:
        return None, f"YAML parse error: {str(exc).splitlines()[0]}"


def validate_skills(skills_dir: str, strict_mode: bool = False, report_path: str | None = None) -> bool:
    print(f"🔍 Validating skills in: {skills_dir}")
    print(f"⚙️  Mode: {'STRICT (CI)' if strict_mode else 'Standard (Dev)'}")

    errors = []
    warnings = []
    skill_count = 0
    seen_rel_ids = set()
    quality_records = []
    base_dir_path = Path(skills_dir).resolve().parent
    gold50_passed, benchmark_covered = load_evaluation_evidence(base_dir_path)

    security_disclaimer_pattern = re.compile(r"AUTHORIZED USE ONLY", re.IGNORECASE)

    for root, dirs, files in os.walk(skills_dir):
        dirs[:] = sorted([d for d in dirs if not d.startswith(".")])

        if "SKILL.md" in files:
            skill_count += 1
            skill_path = os.path.join(root, "SKILL.md")
            rel_path = Path(skill_path).relative_to(skills_dir).as_posix()
            rel_id = Path(root).relative_to(skills_dir).as_posix()
            folder_name = os.path.basename(root)

            if rel_id in seen_rel_ids:
                errors.append(f"❌ {rel_path}: Duplicate skill ID '{rel_id}'")
            seen_rel_ids.add(rel_id)

            try:
                with open(skill_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                errors.append(f"❌ {rel_path}: Unreadable file - {str(e)}")
                continue

            # 1. Frontmatter Check
            metadata, yaml_err = parse_frontmatter(content)
            if not metadata:
                errors.append(f"❌ {rel_path}: {yaml_err or 'Missing or malformed YAML frontmatter'}")
                continue

            schema_ok = True
            refs_ok = True
            security_ok = True
            docs_score = 0

            # 2. Metadata Schema Checks
            if "name" not in metadata or not metadata["name"]:
                errors.append(f"❌ {rel_path}: Missing 'name' in frontmatter")
                schema_ok = False
            elif metadata["name"] != folder_name:
                errors.append(
                    f"❌ {rel_path}: Name '{metadata['name']}' does not match folder name '{folder_name}'"
                )
                schema_ok = False

            if "description" not in metadata or not metadata["description"]:
                errors.append(f"❌ {rel_path}: Missing 'description' in frontmatter")
                schema_ok = False
            else:
                desc_len = len(str(metadata["description"]))
                if desc_len > MAX_DESCRIPTION_CHARS:
                    errors.append(
                        f"❌ {rel_path}: Description is oversized ({desc_len} chars > {MAX_DESCRIPTION_CHARS})."
                    )
                    schema_ok = False

            # Risk Validation
            if "risk" not in metadata:
                msg = f"⚠️  {rel_path}: Missing 'risk' label (defaulting to 'unknown')"
                if strict_mode:
                    errors.append(msg.replace("⚠️", "❌"))
                    schema_ok = False
                else:
                    warnings.append(msg)
            elif metadata["risk"] not in VALID_RISK_LEVELS:
                errors.append(
                    f"❌ {rel_path}: Invalid risk level '{metadata['risk']}'. Must be one of {VALID_RISK_LEVELS}"
                )
                schema_ok = False

            # Source Validation
            if "source" not in metadata or not metadata["source"]:
                msg = f"⚠️  {rel_path}: Missing 'source' attribution"
                if strict_mode:
                    errors.append(msg.replace("⚠️", "❌"))
                    schema_ok = False
                else:
                    warnings.append(msg)

            # 3. Content Checks (Triggers & Completeness)
            has_trigger = has_when_to_use_section(content)
            if not has_trigger:
                msg = f"⚠️  {rel_path}: Missing '## When to Use' section"
                if strict_mode:
                    errors.append(msg.replace("⚠️", "❌"))
                else:
                    warnings.append(msg)
            else:
                docs_score += 25

            if "```" in content:
                docs_score += 25
            if re.search(r"^##\s+(Instructions|Procedure|How\s+It\s+Works|Workflow|Core)", content, re.M | re.I):
                docs_score += 25
            if re.search(r"^##\s+(Limitations|Constraints|Contracts|Evidence|Do\s+not\s+use|Best\s+Practices)", content, re.M | re.I):
                docs_score += 25

            # 4. Security Guardrails
            if metadata.get("risk") == "offensive":
                if not security_disclaimer_pattern.search(content):
                    errors.append(
                        f"🚨 {rel_path}: OFFENSIVE SKILL MISSING SECURITY DISCLAIMER! (Must contain 'AUTHORIZED USE ONLY')"
                    )
                    security_ok = False

            # 5. Dangling Links Validation
            links = re.findall(r"\[[^\]]*\]\(([^)]+)\)", content)
            for link in links:
                link_clean = link.split("#")[0].strip()
                if not link_clean or link_clean.startswith(
                    ("http://", "https://", "mailto:", "<", ">", "/")
                ):
                    continue
                if os.path.isabs(link_clean):
                    continue

                target_path = os.path.normpath(os.path.join(root, link_clean))
                if not os.path.exists(target_path):
                    errors.append(
                        f"❌ {rel_path}: Dangling link detected. Path '{link_clean}' (from '...({link})') does not exist locally."
                    )
                    refs_ok = False

            has_references_dir = os.path.isdir(os.path.join(root, "references"))
            has_scripts_dir = os.path.isdir(os.path.join(root, "scripts"))
            dimensions, score14, tier, quarantined, verification_dims = score_quality_14(
                rel_id=rel_id,
                content=content,
                metadata=metadata,
                schema_ok=schema_ok,
                refs_ok=refs_ok,
                security_ok=security_ok,
                has_trigger=has_trigger,
                has_references_dir=has_references_dir,
                has_scripts_dir=has_scripts_dir,
                gold50_passed=gold50_passed,
                benchmark_covered=benchmark_covered,
            )
            quality_records.append({
                "id": rel_id,
                "name": metadata.get("name", folder_name),
                "source": metadata.get("source", "unknown"),
                "risk": metadata.get("risk", "unknown"),
                "schema_valid": schema_ok,
                "references_valid": refs_ok,
                "security_compliant": security_ok,
                "documentation_score": docs_score,
                "has_progressive_references": has_references_dir,
                "has_helper_scripts": has_scripts_dir,
                "verification_tier": (
                    "tested-module"
                    if rel_id.startswith("rei-") or rel_id in gold50_passed
                    else ("schema-and-ref-validated" if (schema_ok and refs_ok and security_ok) else "needs-repair")
                ),
                "dimensions": dimensions,
                "quality_score_14": score14,
                "quality_tier": tier,
                "quarantined": quarantined,
                "verification_dimensions": verification_dims,
            })

    if report_path:
        report_file = Path(report_path)
        report_file.parent.mkdir(parents=True, exist_ok=True)
        tier_counts = {"Q3": 0, "Q2": 0, "Q1": 0, "Q0": 0}
        for r in quality_records:
            tier_counts[r["quality_tier"]] = tier_counts.get(r["quality_tier"], 0) + 1
        summary = {
            "total_skills": skill_count,
            "schema_valid_count": sum(1 for r in quality_records if r["schema_valid"]),
            "references_valid_count": sum(1 for r in quality_records if r["references_valid"]),
            "security_compliant_count": sum(1 for r in quality_records if r["security_compliant"]),
            "tested_module_count": sum(1 for r in quality_records if r["verification_tier"] == "tested-module"),
            "average_documentation_score": round(
                sum(r["documentation_score"] for r in quality_records) / max(len(quality_records), 1), 1
            ),
            "quality_framework_version": "14pt-v1",
            "tier_counts": tier_counts,
            "quarantined_count": tier_counts["Q0"],
            "gold50_verified_count": sum(1 for r in quality_records if r["id"] in gold50_passed),
            "evaluation_passed_count": sum(1 for r in quality_records if r["verification_dimensions"]["evaluationPassed"]),
            "human_reviewed_count": 0,
            "hardware_verified_count": 0,
            "average_score_14": round(
                sum(r["quality_score_14"] for r in quality_records) / max(len(quality_records), 1), 2
            ),
        }
        report_file.write_text(
            json.dumps({"summary": summary, "skills": quality_records}, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )

    print(f"\n📊 Checked {skill_count} skills.")

    if warnings:
        print(f"\n⚠️  Found {len(warnings)} Warnings:")
        for w in warnings:
            print(w)

    if errors:
        print(f"\n❌ Found {len(errors)} Critical Errors:")
        for e in errors:
            print(e)
        return False

    if strict_mode and warnings:
        print("\n❌ STRICT MODE: Failed due to warnings.")
        return False

    print("\n✨ All skills passed validation!")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate REI Skills")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings (for CI)")
    parser.add_argument("--report", help="Write JSON quality report to path", default=None)
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    skills_path = os.path.join(base_dir, "skills")

    success = validate_skills(skills_path, strict_mode=args.strict, report_path=args.report)
    if not success:
        sys.exit(1)
