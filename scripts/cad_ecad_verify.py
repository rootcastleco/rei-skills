#!/usr/bin/env python3
"""Plan or run read-only KiCad ERC/DRC checks for an authorized project.

Default: print the command plan, no external programs or file writes.
Optional --run: validate KiCad major version and run only ERC / DRC,
writing reports to a separate report directory.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import subprocess
import sys


def require_input(filename: str | None, extension: str) -> Path | None:
    if not filename:
        return None
    candidate = Path(filename).expanduser().resolve()
    if candidate.suffix.lower() != extension:
        raise ValueError(f"Expected a {extension} file: {candidate}")
    if not candidate.is_file():
        raise FileNotFoundError(f"Input file does not exist: {candidate}")
    return candidate


def make_plan(
    schematic: Path | None,
    board: Path | None,
    report_dir: Path,
    executable: str = "kicad-cli",
) -> list[dict]:
    if not schematic and not board:
        raise ValueError("Provide --schematic, --board, or both")
    plan = []
    if schematic:
        plan.append({
            "check": "schematic-erc",
            "report": str(report_dir / (schematic.stem + "-erc.rpt")),
            "command": [
                executable, "sch", "erc", "--exit-code-violations",
                "--output", str(report_dir / (schematic.stem + "-erc.rpt")),
                str(schematic),
            ],
        })
    if board:
        plan.append({
            "check": "board-drc",
            "report": str(report_dir / (board.stem + "-drc.rpt")),
            "command": [
                executable, "pcb", "drc", "--schematic-parity",
                "--exit-code-violations",
                "--output", str(report_dir / (board.stem + "-drc.rpt")),
                str(board),
            ],
        })
    return plan


def validate_version(executable: str) -> str:
    result = subprocess.run(
        [executable, "version"],
        check=False, capture_output=True, text=True, timeout=20,
    )
    if result.returncode:
        raise RuntimeError("Could not query KiCad version: " + result.stderr[:500])
    match = re.search(r"(?<!\d)(\d+)\.(\d+)(?:\.\d+)?", result.stdout)
    if not match:
        raise RuntimeError("Unrecognized KiCad CLI version output")
    if int(match.group(1)) < 10:
        raise RuntimeError("This verified command profile requires KiCad CLI >=10")
    return match.group(0)


def run_checks(plan: list[dict]) -> int:
    for check in plan:
        result = subprocess.run(
            check["command"], check=False, capture_output=True, text=True,
            timeout=180,
        )
        print(json.dumps({
            "check": check["check"],
            "exit_code": result.returncode,
            "report": check["report"],
            "stderr_tail": result.stderr[-800:],
        }, ensure_ascii=False))
        if result.returncode:
            # In KiCad, a nonzero exit can be an ERC/DRC violation: retain the
            # generated report; never treat it as successful validation.
            return result.returncode
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schematic", help="Existing .kicad_sch path")
    parser.add_argument("--board", help="Existing .kicad_pcb path")
    parser.add_argument("--report-dir", default="./cad-reports")
    parser.add_argument("--kicad-cli", default="kicad-cli")
    parser.add_argument("--run", action="store_true", help="Explicitly execute ERC/DRC instead of dry-run")
    args = parser.parse_args(argv)
    try:
        sch = require_input(args.schematic, ".kicad_sch")
        pcb = require_input(args.board, ".kicad_pcb")
        report_dir = Path(args.report_dir).expanduser().resolve()
        plan = make_plan(sch, pcb, report_dir, args.kicad_cli)
        if not args.run:
            print(json.dumps({"mode": "dry-run", "checks": plan}, ensure_ascii=False, indent=2))
            return 0
        version = validate_version(args.kicad_cli)
        report_dir.mkdir(parents=True, exist_ok=True)
        print(json.dumps({"mode": "run", "kicad_cli_version": version}, ensure_ascii=False))
        return run_checks(plan)
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
        print(f"REI CAD validation error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
