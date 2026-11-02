#!/usr/bin/env python3
"""
REI REA Controlled Synchronization & Integration Script
Rootcastle Engineering & Innovation (REI)

Synchronizes the 12 specialist reverse-engineering skills and runtime capability
metadata from the canonical `rootcastleco/Rei-Reverse-engineer` repository into
`rei-skills`, while preserving independent lifecycles, provenance, and rollback.

Usage:
  python scripts/sync_rei_rea.py --sync [--source <path-or-url>]
  python scripts/sync_rei_rea.py --check [--source <path-or-url>]
  python scripts/sync_rei_rea.py --rollback
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
DATA_DIR = REPO_ROOT / "data"
MANIFEST_PATH = DATA_DIR / "rei-rea-manifest.json"
BACKUP_DIR = REPO_ROOT / ".rei-rea-backup"

CANONICAL_REPO_URL = "https://github.com/rootcastleco/Rei-Reverse-engineer.git"
DEFAULT_LOCAL_CANDIDATES = [
    REPO_ROOT.parent / "rei rea",
    REPO_ROOT.parent / "Rei-Reverse-engineer",
]

REA_SKILL_METADATA = {
    "rei-rea-orchestrator": {
        "short_description": "Route authorized reverse-engineering investigations across binaries, APKs, Electron, firmware, and WASM using REI REA.",
        "tags": ["reverse-engineering", "binary-analysis", "orchestrator", "mcp", "rei-rea", "triage"],
    },
    "rei-binary-intelligence": {
        "short_description": "Analyze authorized PE, ELF, and WebAssembly structure and version diffs with REI REA bounded static parsers.",
        "tags": ["reverse-engineering", "binary-analysis", "pe", "elf", "wasm", "rei-rea"],
    },
    "rei-casebook-forensics": {
        "short_description": "Index, search, and verify tamper-evident SHA-256 reverse-engineering casebooks and metadata-only forensic bundles.",
        "tags": ["reverse-engineering", "digital-forensics", "casebook", "evidence", "sqlite", "rei-rea"],
    },
    "rei-native-binaries": {
        "short_description": "Inspect authorized PE, ELF, Mach-O, and native libraries for symbols, imports, ABI boundaries, and call graphs.",
        "tags": ["reverse-engineering", "native-binaries", "pe", "elf", "mach-o", "abi", "rei-rea"],
    },
    "rei-electron-and-js": {
        "short_description": "Investigate authorized Electron ASAR archives, preload scripts, IPC routes, and bundled JavaScript applications.",
        "tags": ["reverse-engineering", "electron", "asar", "javascript", "ipc", "nodejs", "rei-rea"],
    },
    "rei-android-apks": {
        "short_description": "Analyze authorized Android APK, AAB, DEX bytecode, manifests, permissions, and JNI boundaries using read-only triage.",
        "tags": ["reverse-engineering", "android", "apk", "dex", "jni", "mobile", "rei-rea"],
    },
    "rei-firmware-and-iot": {
        "short_description": "Examine authorized MCU, UEFI, embedded Linux, automotive telemetry, and GPS/IoT firmware images safely.",
        "tags": ["reverse-engineering", "firmware", "iot", "embedded", "uefi", "telemetry", "rei-rea"],
    },
    "rei-mobile-runtime": {
        "short_description": "Plan explicitly authorized Android and iOS runtime observation and static-to-dynamic verification in lab environments.",
        "tags": ["reverse-engineering", "mobile", "android", "ios", "runtime-analysis", "rei-rea"],
    },
    "rei-evidence-ledger": {
        "short_description": "Maintain and audit SHA-256 hash-linked reverse-engineering case observations with explicit confidence states.",
        "tags": ["reverse-engineering", "evidence", "provenance", "forensics", "audit", "rei-rea"],
    },
    "rei-reconstruction-parity": {
        "short_description": "Specify and verify clean-room behavioral parity and differential test corpora from observed artifact evidence.",
        "tags": ["reverse-engineering", "reconstruction", "parity-testing", "clean-room", "verification", "rei-rea"],
    },
    "rei-wasm-and-managed": {
        "short_description": "Trace authorized WebAssembly modules, .NET CIL assemblies, and JVM bytecode for type recovery and API analysis.",
        "tags": ["reverse-engineering", "wasm", "webassembly", "dotnet", "jvm", "bytecode", "rei-rea"],
    },
    "rei-web-and-protocols": {
        "short_description": "Analyze authorized HAR, PCAP/PCAPNG captures, telemetry frames, and protocol state machines for interoperability.",
        "tags": ["reverse-engineering", "protocols", "pcap", "har", "network-analysis", "telemetry", "rei-rea"],
    },
}

MCP_TOOLS = [
    {"name": "rei_rea_providers", "purpose": "Discover provider profiles without execution."},
    {"name": "rei_rea_tools", "purpose": "Filter 124-entry tool catalog records by tag or capability."},
    {"name": "rei_rea_doctor", "purpose": "Inspect local PATH availability vs adapter support."},
    {"name": "rei_rea_inspect", "purpose": "Identify format and compute SHA-256 of an authorized artifact."},
    {"name": "rei_rea_plan", "purpose": "Produce an evidence-based specialist skill and tool routing plan."},
    {"name": "rei_rea_signals", "purpose": "Read bounded entropy, signature, and optional string signals."},
    {"name": "rei_rea_compare", "purpose": "Compare hashes and bounded byte differences of two files."},
    {"name": "rei_rea_case_create", "purpose": "Initialize a hash-linked SHA-256 evidence case."},
    {"name": "rei_rea_case_verify", "purpose": "Validate append-only case event integrity and target hash."},
    {"name": "rei_rea_investigate", "purpose": "Run read-only cross-hash-checked static analysis pipeline (<= 64 MiB)."},
    {"name": "rei_rea_deep", "purpose": "Parse bounded PE, ELF, and WebAssembly v1 structural headers/tables."},
    {"name": "rei_rea_diff", "purpose": "Compare parsed binary structures across two artifact versions."},
    {"name": "rei_rea_case_search", "purpose": "Search an explicitly indexed local SQLite forensic casebook."},
    {"name": "rei_rea_bundle_verify", "purpose": "Verify checksums of an exported metadata-only evidence bundle."},
]

STATIC_ADAPTERS = [
    {"id": "file", "executable": "file", "mode": "opt-in-static-adapter"},
    {"id": "readelf", "executable": "readelf", "mode": "opt-in-static-adapter"},
    {"id": "objdump", "executable": "objdump", "mode": "opt-in-static-adapter"},
    {"id": "llvm-objdump", "executable": "llvm-objdump", "mode": "opt-in-static-adapter"},
    {"id": "llvm-readobj", "executable": "llvm-readobj", "mode": "opt-in-static-adapter"},
    {"id": "nm", "executable": "nm", "mode": "opt-in-static-adapter"},
    {"id": "exiftool", "executable": "exiftool", "mode": "opt-in-static-adapter"},
    {"id": "otool", "executable": "otool", "mode": "opt-in-static-adapter"},
    {"id": "android-aapt2", "executable": "aapt2", "mode": "opt-in-static-adapter"},
    {"id": "radare2", "executable": "rabin2", "mode": "opt-in-static-adapter"},
    {"id": "rizin", "executable": "rz-bin", "mode": "opt-in-static-adapter"},
]

CAPABILITY_STATES = {
    "cataloged": "Listed in the 124-entry discovery registry with metadata and homepage. Does NOT imply local installation or execution support.",
    "path_detected": "Executable name was resolved on the local machine PATH via `rei-rea tools doctor`.",
    "adapter_supported": "Covered by one of the 11 reviewed, argument-locked static adapters requiring explicit `--allow-external` opt-in.",
    "tested_in_env": "Verified against a reproducible local fixture in the active environment.",
    "planned": "Documented for future provider integration (e.g., live Ghidra/IDA/JADX/Frida session control or upstream morluto/rea server).",
    "unsupported": "Excluded from REI REA scope (e.g., autonomous exploit generation, firmware flashing, or unauthorized target interaction).",
}

BRAND_FOOTER = (
    "\n---\n\n"
    "> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  \n"
    "> Engineering Beyond Boundaries | admin@rootcastle.com\n"
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def extract_upstream_description(raw_md: str) -> str:
    fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n", raw_md)
    if not fm_match:
        return ""
    fm_text = fm_match.group(1)
    lines = fm_text.splitlines()
    desc_parts = []
    in_desc = False
    for line in lines:
        if line.startswith("description:"):
            val = line.split(":", 1)[1].strip()
            if val in (">-", "|", ">"):
                in_desc = True
            else:
                desc_parts.append(val.strip("\"'"))
        elif in_desc:
            if re.match(r"^[a-zA-Z0-9_-]+:", line):
                break
            desc_parts.append(line.strip())
    return " ".join(p for p in desc_parts if p)


def transform_skill_markdown(skill_id: str, raw_md: str) -> str:
    meta = REA_SKILL_METADATA.get(skill_id, {})
    full_trigger_desc = extract_upstream_description(raw_md)
    short_desc = meta.get("short_description") or full_trigger_desc[:190]
    tags = meta.get("tags", ["reverse-engineering", "rei-rea"])

    body = re.sub(r"^---\r?\n[\s\S]*?\r?\n---\r?\n*", "", raw_md, count=1).strip()

    # Ensure ## When to Use section is present for rei-skills validator compatibility
    if not re.search(r"^##\s+(When\s+to\s+Use|Use\s+this\s+skill\s+when)", body, re.MULTILINE | re.IGNORECASE):
        when_to_use_block = (
            "## When to Use\n\n"
            f"- {full_trigger_desc}\n"
            "- When performing authorized, evidence-led reverse engineering with SHA-256 artifact tracking.\n"
        )
        # Insert after H1 title if present
        h1_match = re.search(r"^#\s+.+$", body, re.MULTILINE)
        if h1_match:
            insert_pos = h1_match.end()
            body = body[:insert_pos] + "\n\n" + when_to_use_block + body[insert_pos:]
        else:
            body = when_to_use_block + "\n" + body

    if "Rootcastle Engineering" not in body:
        body = body.rstrip() + "\n" + BRAND_FOOTER

    tags_str = ", ".join(tags)
    frontmatter = (
        "---\n"
        f"name: {skill_id}\n"
        f'description: "{short_desc}"\n'
        "risk: safe\n"
        "source: rootcastle-rei\n"
        "category: reverse-engineering\n"
        "metadata:\n"
        f'  tags: "{tags_str}"\n'
        '  upstream_repo: "https://github.com/rootcastleco/Rei-Reverse-engineer"\n'
        '  curated_by: "rootcastle-rei"\n'
        "---\n\n"
    )
    return frontmatter + body.lstrip()


def read_upstream_info(source_dir: Path) -> dict:
    version = "0.2.0"
    pyproject = source_dir / "pyproject.toml"
    if pyproject.exists():
        text = pyproject.read_text(encoding="utf-8")
        m = re.search(r'^version\s*=\s*"([^"]+)"', text, re.MULTILINE)
        if m:
            version = m.group(1)

    commit = "unknown"
    try:
        r = subprocess.run(
            ["git", "-C", str(source_dir), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode == 0 and r.stdout.strip():
            commit = r.stdout.strip()
    except Exception:
        pass

    full_commit = commit
    try:
        r2 = subprocess.run(
            ["git", "-C", str(source_dir), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
        )
        if r2.returncode == 0 and r2.stdout.strip():
            full_commit = r2.stdout.strip()
    except Exception:
        pass

    return {
        "version": version,
        "commit": commit,
        "full_commit": full_commit,
    }


def resolve_source_dir(source_arg: str | None) -> tuple[Path, tempfile.TemporaryDirectory | None]:
    if source_arg:
        candidate = Path(source_arg)
        if candidate.exists() and (candidate / "skills").exists():
            return candidate.resolve(), None
        # Treat as git URL
        tmp = tempfile.TemporaryDirectory(prefix="rei-rea-sync-")
        subprocess.run(
            ["git", "clone", "--depth", "1", source_arg, tmp.name],
            check=True,
        )
        return Path(tmp.name), tmp

    for cand in DEFAULT_LOCAL_CANDIDATES:
        if cand.exists() and (cand / "skills").exists():
            return cand.resolve(), None

    tmp = tempfile.TemporaryDirectory(prefix="rei-rea-sync-")
    subprocess.run(
        ["git", "clone", "--depth", "1", CANONICAL_REPO_URL, tmp.name],
        check=True,
    )
    return Path(tmp.name), tmp


def sync_rei_rea(source_arg: str | None = None, check_only: bool = False) -> dict:
    source_dir, tmp_ctx = resolve_source_dir(source_arg)
    try:
        upstream_info = read_upstream_info(source_dir)
        upstream_skills_dir = source_dir / "skills"
        if not upstream_skills_dir.exists():
            raise RuntimeError(f"No skills/ directory found in {source_dir}")

        skill_dirs = sorted(
            [d for d in upstream_skills_dir.iterdir() if d.is_dir() and (d / "SKILL.md").exists()],
            key=lambda p: p.name,
        )

        synced_skills = []
        changed_skills = []

        if not check_only:
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)

        for src_skill_dir in skill_dirs:
            skill_id = src_skill_dir.name
            dest_skill_dir = SKILLS_DIR / skill_id
            raw_skill_md = (src_skill_dir / "SKILL.md").read_text(encoding="utf-8")
            upstream_hash = sha256_bytes(raw_skill_md.encode("utf-8"))
            transformed_md = transform_skill_markdown(skill_id, raw_skill_md)
            synced_hash = sha256_bytes(transformed_md.encode("utf-8"))

            current_dest_md = dest_skill_dir / "SKILL.md"
            is_changed = True
            if current_dest_md.exists():
                existing_bytes = current_dest_md.read_text(encoding="utf-8").encode("utf-8")
                if sha256_bytes(existing_bytes) == synced_hash:
                    is_changed = False

            if is_changed:
                changed_skills.append(skill_id)

            files_copied = []
            for rel_file in sorted(src_skill_dir.rglob("*")):
                if rel_file.is_file():
                    rel_path = rel_file.relative_to(src_skill_dir).as_posix()
                    files_copied.append(rel_path)

            if not check_only:
                if dest_skill_dir.exists():
                    backup_target = BACKUP_DIR / skill_id
                    if backup_target.exists():
                        shutil.rmtree(backup_target)
                    shutil.copytree(dest_skill_dir, backup_target)
                    shutil.rmtree(dest_skill_dir)

                shutil.copytree(src_skill_dir, dest_skill_dir)
                (dest_skill_dir / "SKILL.md").write_text(transformed_md, encoding="utf-8", newline="\n")

            synced_skills.append({
                "id": skill_id,
                "name": skill_id,
                "category": "reverse-engineering",
                "risk": "safe",
                "source": "rootcastle-rei",
                "short_description": REA_SKILL_METADATA.get(skill_id, {}).get("short_description", ""),
                "tags": REA_SKILL_METADATA.get(skill_id, {}).get("tags", []),
                "upstream_sha256": upstream_hash,
                "synced_sha256": synced_hash,
                "files": files_copied,
            })

        manifest = {
            "schema_version": "1.0.0",
            "module": "rei-rea",
            "title": "REI Reverse Engineering Workbench (REI REA)",
            "upstream_repository": "https://github.com/rootcastleco/Rei-Reverse-engineer",
            "upstream_version": upstream_info["version"],
            "upstream_commit": upstream_info["commit"],
            "upstream_full_commit": upstream_info["full_commit"],
            "license": "MIT",
            "upstream_rea_notice": (
                "REI REA is an original Rootcastle Engineering & Innovation Python workbench. "
                "The independent morluto/rea project is tracked separately in Rei-Reverse-engineer/upstream/rea "
                "and retains its own upstream provenance."
            ),
            "runtime": {
                "package_name": "rootcastle-rei-rea",
                "python_requirement": ">=3.10",
                "cli_command": "rei-rea",
                "install_instructions": [
                    "git clone https://github.com/rootcastleco/Rei-Reverse-engineer.git",
                    "cd Rei-Reverse-engineer",
                    "python -m pip install -e .",
                    "rei-rea --version",
                    "rei-rea tools doctor",
                ],
                "mcp_config": {
                    "mcpServers": {
                        "rei-rea": {
                            "command": "rei-rea",
                            "args": ["mcp"],
                        }
                    }
                },
                "cataloged_tool_count": 124,
                "static_adapter_count": len(STATIC_ADAPTERS),
                "mcp_tool_count": len(MCP_TOOLS),
                "specialist_skill_count": len(synced_skills),
            },
            "capability_states": CAPABILITY_STATES,
            "mcp_tools": MCP_TOOLS,
            "static_adapters": STATIC_ADAPTERS,
            "skills": synced_skills,
        }

        if not check_only:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
            if BACKUP_DIR.exists():
                shutil.rmtree(BACKUP_DIR)

        return {
            "status": "checked" if check_only else "synced",
            "upstream_version": upstream_info["version"],
            "upstream_commit": upstream_info["commit"],
            "skill_count": len(synced_skills),
            "changed_skills": changed_skills,
            "manifest_path": str(MANIFEST_PATH.relative_to(REPO_ROOT).as_posix()),
        }
    finally:
        if tmp_ctx is not None:
            tmp_ctx.cleanup()


def rollback_rei_rea() -> dict:
    if not MANIFEST_PATH.exists():
        return {"status": "noop", "message": "No rei-rea-manifest.json found."}
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    removed = []
    for sk in manifest.get("skills", []):
        sid = sk.get("id")
        if sid and (SKILLS_DIR / sid).exists():
            shutil.rmtree(SKILLS_DIR / sid)
            removed.append(sid)
    return {"status": "rolled_back", "removed_skills": removed}


def main():
    parser = argparse.ArgumentParser(description="Synchronize REI REA specialist skills and manifest")
    parser.add_argument("--source", help="Path or Git URL to Rei-Reverse-engineer repository", default=None)
    parser.add_argument("--check", action="store_true", help="Check for drift without modifying files")
    parser.add_argument("--sync", action="store_true", help="Synchronize skills and write data/rei-rea-manifest.json")
    parser.add_argument("--rollback", action="store_true", help="Remove synced REI REA skills using manifest")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON summary")
    args = parser.parse_args()

    if args.rollback:
        res = rollback_rei_rea()
    else:
        check_only = args.check and not args.sync
        res = sync_rei_rea(source_arg=args.source, check_only=check_only)

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"🏰 REI REA Sync Status: {res['status'].upper()}")
        if "upstream_version" in res:
            print(f"   Upstream Version: v{res['upstream_version']} ({res['upstream_commit']})")
            print(f"   Specialist Skills: {res['skill_count']}")
            print(f"   Changed Skills: {len(res['changed_skills'])}")
            if res["changed_skills"]:
                print(f"   Updated: {', '.join(res['changed_skills'])}")
        elif "removed_skills" in res:
            print(f"   Removed {len(res['removed_skills'])} skills.")

    if args.check and res.get("changed_skills"):
        sys.exit(1)


if __name__ == "__main__":
    main()
