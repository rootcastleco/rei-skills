#!/usr/bin/env python3
"""
REI REA Reproducible Evidence-Led Investigation Demo
Rootcastle Engineering & Innovation (REI)

Generates two harmless, redistributable WebAssembly v1 binary fixtures
(`sample-v1.wasm` and `sample-v2.wasm`) and runs the REI REA CLI/library
when available to demonstrate:
  1. Static artifact identification & SHA-256 hashing (`inspect`)
  2. Bounded WebAssembly structural parsing (`deep`)
  3. Structural version comparison (`diff`)
  4. Specialist skill routing (`plan`)
  5. Hash-linked SHA-256 evidence case creation, verification, and reporting (`case`)
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DEMO_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = DEMO_DIR / "fixtures"
CASE_WORKSPACE = DEMO_DIR / ".demo-cases"


def _uleb128(value: int) -> bytes:
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        if value != 0:
            byte |= 0x80
        out.append(byte)
        if value == 0:
            break
    return bytes(out)


def _wasm_section(sec_id: int, payload: bytes) -> bytes:
    return bytes([sec_id]) + _uleb128(len(payload)) + payload


def _wasm_str(s: str) -> bytes:
    b = s.encode("utf-8")
    return _uleb128(len(b)) + b


def build_minimal_wasm(imports: list[tuple[str, str]], exports: list[str], custom_note: str) -> bytes:
    """Build a valid, harmless WebAssembly v1 binary module with specified imports/exports."""
    header = b"\x00asm\x01\x00\x00\x00"

    # Custom section (id 0): build metadata
    custom_payload = _wasm_str("rei.fixture") + custom_note.encode("utf-8")
    sec_custom = _wasm_section(0, custom_payload)

    # Type section (id 1): 1 func type () -> i32
    type_payload = _uleb128(1) + b"\x60\x00\x01\x7f"
    sec_type = _wasm_section(1, type_payload)

    # Import section (id 2): each import uses type index 0
    imp_entries = bytearray(_uleb128(len(imports)))
    for mod_name, field_name in imports:
        imp_entries += _wasm_str(mod_name) + _wasm_str(field_name) + b"\x00\x00"
    sec_import = _wasm_section(2, bytes(imp_entries))

    # Function section (id 3): one defined function per export using type 0
    func_payload = _uleb128(len(exports)) + (b"\x00" * len(exports))
    sec_func = _wasm_section(3, func_payload)

    # Export section (id 7): export defined functions starting after imported funcs
    exp_entries = bytearray(_uleb128(len(exports)))
    base_idx = len(imports)
    for idx, exp_name in enumerate(exports):
        exp_entries += _wasm_str(exp_name) + b"\x00" + _uleb128(base_idx + idx)
    sec_export = _wasm_section(7, bytes(exp_entries))

    # Code section (id 10): each function returns i32.const 42
    body = b"\x00\x41\x2a\x0b"  # 0 locals, i32.const 42, end
    one_func_code = _uleb128(len(body)) + body
    code_payload = _uleb128(len(exports)) + (one_func_code * len(exports))
    sec_code = _wasm_section(10, code_payload)

    return header + sec_custom + sec_type + sec_import + sec_func + sec_export + sec_code


def ensure_fixtures() -> tuple[Path, Path]:
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    v1_path = FIXTURES_DIR / "telemetry-filter-v1.wasm"
    v2_path = FIXTURES_DIR / "telemetry-filter-v2.wasm"

    v1_bytes = build_minimal_wasm(
        imports=[("env", "telemetry_emit")],
        exports=["calculate_crc"],
        custom_note="Rootcastle harmless fixture v1.0",
    )
    v2_bytes = build_minimal_wasm(
        imports=[("env", "telemetry_emit"), ("env", "audit_log_frame")],
        exports=["calculate_crc", "validate_packet_header"],
        custom_note="Rootcastle harmless fixture v2.0",
    )

    v1_path.write_bytes(v1_bytes)
    v2_path.write_bytes(v2_bytes)
    return v1_path, v2_path


def run_rei_rea_cmd(args: list[str], env: dict) -> dict | str:
    cmd = [sys.executable, "-m", "rei_rea", *args]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env, check=True)
    out = res.stdout.strip()
    try:
        return json.loads(out)
    except Exception:
        return out


def main():
    v1_path, v2_path = ensure_fixtures()
    print(f"✅ Generated harmless WASM fixtures:\n   - {v1_path}\n   - {v2_path}")

    env = dict(os.environ)
    local_rea_src = Path(r"C:\Appdev\rei rea\src")
    if local_rea_src.exists():
        env["PYTHONPATH"] = str(local_rea_src) + (
            os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else ""
        )

    # Check if rei_rea is importable
    probe = subprocess.run(
        [sys.executable, "-m", "rei_rea", "--version"],
        capture_output=True,
        text=True,
        env=env,
    )
    if probe.returncode != 0:
        print("ℹ️ rei_rea runtime not found in current PYTHONPATH; fixtures generated only.")
        return

    print(f"🔬 Executing real REI REA workbench ({probe.stdout.strip()}) against fixtures...")

    if CASE_WORKSPACE.exists():
        shutil.rmtree(CASE_WORKSPACE)

    inspect_v1 = run_rei_rea_cmd(["inspect", str(v1_path)], env)
    deep_v1 = run_rei_rea_cmd(["deep", str(v1_path)], env)
    deep_v2 = run_rei_rea_cmd(["deep", str(v2_path)], env)
    diff_v1_v2 = run_rei_rea_cmd(["diff", str(v1_path), str(v2_path)], env)
    plan_v2 = run_rei_rea_cmd(["plan", str(v2_path)], env)

    case_init = run_rei_rea_cmd(
        ["case", "init", str(v2_path), "--workspace", str(CASE_WORKSPACE)], env
    )
    case_dir = case_init["case_path"]

    run_rei_rea_cmd(
        [
            "case",
            "note",
            case_dir,
            "--type",
            "structural-diff",
            "--text",
            "Observed addition of imported host function env.audit_log_frame and exported function validate_packet_header in v2.0 fixture.",
            "--source",
            "wasm:import_section,export_section",
            "--confidence",
            "observed",
        ],
        env,
    )

    case_verify = run_rei_rea_cmd(
        ["case", "verify", case_dir, "--recheck-target"], env
    )

    report_path = DEMO_DIR / "FINDING_REPORT.md"
    run_rei_rea_cmd(
        ["case", "report", case_dir, "--output", str(report_path)], env
    )

    # Sanitize absolute local paths for deterministic repository snapshot
    def scrub_paths(obj):
        if isinstance(obj, dict):
            return {k: scrub_paths(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [scrub_paths(x) for x in obj]
        if isinstance(obj, str):
            return (
                obj.replace(str(DEMO_DIR), ".")
                .replace(str(DEMO_DIR).replace("\\", "/"), ".")
                .replace("\\", "/")
            )
        return obj

    demo_snapshot = scrub_paths({
        "rei_rea_version": probe.stdout.strip(),
        "fixtures": {
            "v1": "fixtures/telemetry-filter-v1.wasm",
            "v2": "fixtures/telemetry-filter-v2.wasm",
        },
        "inspect_v1": inspect_v1,
        "deep_v1": deep_v1,
        "deep_v2": deep_v2,
        "diff_v1_to_v2": diff_v1_v2,
        "routing_plan_v2": plan_v2,
        "case_verification": case_verify,
    })

    out_json_path = DEMO_DIR / "DEMO_OUTPUT.json"
    out_json_path.write_text(
        json.dumps(demo_snapshot, indent=2) + "\n", encoding="utf-8", newline="\n"
    )

    if report_path.exists():
        rep_txt = report_path.read_text(encoding="utf-8")
        rep_txt = scrub_paths(rep_txt)
        report_path.write_text(rep_txt, encoding="utf-8", newline="\n")

    if CASE_WORKSPACE.exists():
        shutil.rmtree(CASE_WORKSPACE)

    print(f"✅ Wrote verified REI REA output to {out_json_path} and {report_path}")


if __name__ == "__main__":
    main()
