#!/usr/bin/env python3
"""PaperOrchestra adapter: preview by default; opt-in execution with file isolation."""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def within(path, root):
    return path == root or root in path.parents


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for arg in ("upstream", "raw-materials", "template", "output"):
        p.add_argument("--" + arg, type=Path, required=True)
    p.add_argument("--idea-filename", default="idea_sparse.md")
    p.add_argument("--experimental-log-filename", default="experimental_log.md")
    p.add_argument("--writer-model", default="gemini-3.1-pro-preview")
    p.add_argument("--reflection-model", default="gemini-3.1-pro-preview")
    p.add_argument("--research-cutoff")
    p.add_argument("--use-plotting", action="store_true")
    p.add_argument("--execute", action="store_true")
    p.add_argument("--confirm-remote-processing", action="store_true")
    p.add_argument("--python", default=sys.executable)
    args = p.parse_args()
    try:
        for name in ("idea_filename", "experimental_log_filename"):
            value = getattr(args, name)
            if not re.fullmatch(r"[a-zA-Z0-9_][a-zA-Z0-9_.-]*", value) or value in (".", ".."):
                raise ValueError("filenames must not contain paths")
        if args.research_cutoff and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", args.research_cutoff):
            raise ValueError("research cutoff must be YYYY-MM")
        source = args.upstream.expanduser()
        raw = args.raw_materials.expanduser()
        template = args.template.expanduser()
        output = args.output.expanduser()
        if any(x.is_symlink() for x in (source, raw, template, output)):
            raise ValueError("symlink roots are not allowed")
        source, raw, template = (x.resolve(strict=True) for x in (source, raw, template))
        output = output.resolve()
        if not all(x.is_dir() for x in (source, raw, template)):
            raise ValueError("missing source, raw materials, or template directory")
        if output.exists() or not output.parent.is_dir():
            raise ValueError("output must be a fresh directory with an existing parent")
        if any(within(output, x) or within(x, output) for x in (source, raw, template)):
            raise ValueError("output overlaps protected inputs")
        if within(raw, source) or within(source, raw) or within(raw, template) or within(template, raw):
            raise ValueError("raw materials must be separate from source and template")
        for root in (raw, template):
            if any(path.is_symlink() for path in root.rglob("*")):
                raise ValueError("symlinks inside inputs are prohibited")
        entry = source / "paper_writing_cli.py"
        files = {
            "upstream_cli_sha256": sha(entry),
            "idea_sha256": sha(raw / args.idea_filename),
            "experimental_log_sha256": sha(raw / args.experimental_log_filename),
            "template_sha256": sha(template / "template.tex"),
            "guidelines_sha256": sha(template / "guidelines.md"),
        }
        try:
            commit = subprocess.run(["git", "-C", str(source), "rev-parse", "HEAD"],
                                    capture_output=True, text=True, timeout=5, check=True).stdout.strip()
            if not re.fullmatch(r"[a-f0-9]{40}", commit):
                commit = "NOT VERIFIED"
        except (OSError, subprocess.SubprocessError):
            commit = "NOT VERIFIED"
        cmd = [
            args.python, str(entry), "--raw_materials_dir", str(raw),
            "--latex_template_dir", str(template), "--output_dir", str(output),
            "--idea_filename", args.idea_filename,
            "--experimental_log_filename", args.experimental_log_filename,
            "--writer_model_name", args.writer_model,
            "--reflection_model_name", args.reflection_model,
            "--use_plotting", "true" if args.use_plotting else "false",
        ]
        if args.research_cutoff:
            cmd.extend(["--research_cutoff", args.research_cutoff])
        manifest = {
            "upstream": "google-research/paper-orchestra",
            "upstream_revision": commit, "input_hashes": files,
            "output": str(output), "command": cmd, "status": "PREVIEW",
        }
        print(json.dumps(manifest, indent=2))
        if not args.execute:
            return 0
        if not args.confirm_remote_processing:
            raise ValueError("--execute requires --confirm-remote-processing")
        if not (os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or
                (os.getenv("VERTEX_AI_PROJECT") and os.getenv("VERTEX_AI_LOCATION"))):
            raise ValueError("missing model provider credentials")
        output.mkdir(mode=0o700)
        path = output / "rei_paper_orchestra_run.json"
        manifest["status"] = "RUNNING"
        path.write_text(json.dumps(manifest, indent=2) + "\n")
        try:
            result = subprocess.run(cmd, cwd=source, check=False)
            pdf = output / "final_paper.pdf"
            good = result.returncode == 0 and pdf.is_file() and pdf.stat().st_size > 0
            manifest["status"] = "PASS" if good else "FAIL"
            manifest["upstream_exit_code"] = result.returncode
            if good:
                manifest["pdf_sha256"] = sha(pdf)
            return 0 if good else 2
        except (OSError, subprocess.SubprocessError) as exc:
            manifest["status"] = "FAIL"
            manifest["error_type"] = type(exc).__name__
            return 2
        finally:
            path.write_text(json.dumps(manifest, indent=2) + "\n")
    except (OSError, ValueError) as exc:
        print("ERROR: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
