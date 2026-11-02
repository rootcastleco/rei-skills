#!/usr/bin/env python3
import os
import json
import re
import sys
from pathlib import Path
import yaml

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def parse_frontmatter(content):
    """
    Parses YAML frontmatter, sanitizing unquoted values containing @.
    """
    fm_match = re.search(r"^---\r?\n(.*?)\r?\n---", content, re.DOTALL)
    if not fm_match:
        return {}

    yaml_text = fm_match.group(1)

    sanitized_lines = []
    for line in yaml_text.splitlines():
        match = re.match(r"^(\s*[\w-]+):\s*(.*)$", line)
        if match:
            key, val = match.groups()
            val_s = val.strip()
            if "@" in val_s and not (val_s.startswith('"') or val_s.startswith("'")):
                safe_val = val_s.replace('"', '\\"')
                line = f'{key}: "{safe_val}"'
        sanitized_lines.append(line)

    sanitized_yaml = "\n".join(sanitized_lines)

    try:
        loaded = yaml.safe_load(sanitized_yaml)
        return loaded if isinstance(loaded, dict) else {}
    except yaml.YAMLError as e:
        print(f"⚠️ YAML parsing error: {e}")
        return {}


def generate_index(skills_dir, output_file, mirror_file=None):
    print(f"🏗️ Generating index from: {skills_dir}")
    skills = []
    base_dir = os.path.dirname(skills_dir)

    for root, dirs, files in os.walk(skills_dir):
        dirs[:] = sorted([d for d in dirs if not d.startswith(".")])

        if "SKILL.md" in files:
            skill_path = os.path.join(root, "SKILL.md")
            dir_name = os.path.basename(root)
            parent_dir = os.path.basename(os.path.dirname(root))
            rel_path_posix = Path(root).relative_to(base_dir).as_posix()

            skill_info = {
                "id": dir_name,
                "path": rel_path_posix,
                "category": parent_dir if parent_dir != "skills" else "uncategorized",
                "name": dir_name.replace("-", " ").title(),
                "description": "",
                "risk": "safe",
                "source": "community",
            }

            try:
                with open(skill_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                print(f"⚠️ Error reading {skill_path}: {e}")
                continue

            metadata = parse_frontmatter(content)

            if "name" in metadata and metadata["name"]:
                skill_info["name"] = str(metadata["name"])
            if "description" in metadata and metadata["description"]:
                skill_info["description"] = str(metadata["description"])
            if "risk" in metadata and metadata["risk"]:
                skill_info["risk"] = str(metadata["risk"])
            if "source" in metadata and metadata["source"]:
                skill_info["source"] = str(metadata["source"])
            if "category" in metadata and metadata["category"]:
                skill_info["category"] = str(metadata["category"])

            if not skill_info["description"]:
                body = content
                fm_match = re.search(r"^---\r?\n(.*?)\r?\n---", content, re.DOTALL)
                if fm_match:
                    body = content[fm_match.end():].strip()

                lines = body.split("\n")
                desc_lines = []
                for line in lines:
                    if line.startswith("#") or not line.strip():
                        if desc_lines:
                            break
                        continue
                    desc_lines.append(line.strip())

                if desc_lines:
                    skill_info["description"] = " ".join(desc_lines)[:250].strip()

            skills.append(skill_info)

    skills.sort(key=lambda x: (x["name"].lower(), x["id"].lower()))

    serialized = json.dumps(skills, indent=2) + "\n"
    with open(output_file, "w", encoding="utf-8", newline="\n") as f:
        f.write(serialized)

    if mirror_file:
        os.makedirs(os.path.dirname(mirror_file), exist_ok=True)
        with open(mirror_file, "w", encoding="utf-8", newline="\n") as f:
            f.write(serialized)

    print(f"✅ Generated rich index with {len(skills)} skills at: {output_file}")
    return skills


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    skills_path = os.path.join(base_dir, "skills")
    output_path = os.path.join(base_dir, "skills_index.json")
    mirror_path = os.path.join(base_dir, "data", "skills_index.json")
    generate_index(skills_path, output_path, mirror_path)
