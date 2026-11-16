#!/usr/bin/env python3
"""Regression and provenance checks for the 400 original REI technical skills."""
import hashlib
import json
from pathlib import Path
import re
import yaml

ROOT = Path(__file__).resolve().parents[2]
SOURCE = "rootcastle-original-technical-expansion-2026"
manifest = json.loads((ROOT / "data/technical-expansion-manifest.json").read_text(encoding="utf-8"))
catalog = json.loads((ROOT / "data/catalog.json").read_text(encoding="utf-8"))
by_id = {entry["id"]: entry for entry in catalog["skills"]}

assert manifest["schema_version"] == 1
assert manifest["skill_count"] == 400
assert manifest["domain_count"] == 25
assert manifest["skills_per_domain"] == 16
assert len(manifest["skills"]) == 400
assert len({entry["id"] for entry in manifest["skills"]}) == 400
assert catalog["total"] == len(catalog["skills"]) == 1295
assert len([s for s in catalog["skills"] if s["source"] != SOURCE]) == 895

titles = set()
descriptions = set()
hashes = set()
for item in manifest["skills"]:
    sid = item["id"]
    assert sid in by_id, sid
    assert by_id[sid]["source"] == SOURCE
    assert by_id[sid]["category"] == item["category"]
    skill = ROOT / "skills" / sid / "SKILL.md"
    agent = ROOT / "skills" / sid / "agents" / "openai.yaml"
    assert skill.is_file(), sid
    assert agent.is_file(), sid
    text = skill.read_text(encoding="utf-8")
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    assert digest == item["sha256"], sid
    assert not re.search(r"TODO|TBD|\[PLACEHOLDER\]", text, re.I), sid
    assert 1400 <= len(text) <= 8500, sid
    for section in ["## When to Use", "## Entry contract", "## Procedure",
                    "## Do not use", "## Evidence and acceptance", "NOT VERIFIED"]:
        assert section in text, (sid, section)
    fm_match = re.match(r"^---\n(.*?)\n---", text, re.S)
    assert fm_match, sid
    fm = yaml.safe_load(fm_match.group(1))
    assert fm["name"] == sid
    assert fm["source"] == SOURCE
    assert fm["category"] == item["category"]
    assert fm["risk"] in ("safe", "critical")
    assert "interface" in yaml.safe_load(agent.read_text(encoding="utf-8"))
    title = text.split("\n# ", 1)[1].splitlines()[0]
    assert title not in titles, sid
    assert fm["description"] not in descriptions, sid
    assert digest not in hashes, sid
    titles.add(title)
    descriptions.add(fm["description"])
    hashes.add(digest)

print("PASS: 400 unique original skills, 895 existing skills preserved, 1295 indexed, SHA-256 and metadata verified.")
