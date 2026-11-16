"""Offline contract tests for safe KiCad verification and Fusion reference code."""
import ast
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import cad_ecad_verify as cad


class CadCliVerificationTests(unittest.TestCase):
    def test_read_only_command_plan(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            schematic = root / "test.kicad_sch"
            board = root / "test.kicad_pcb"
            schematic.write_text("(kicad_sch)", encoding="utf-8")
            board.write_text("(kicad_pcb)", encoding="utf-8")
            out = root / "reports"
            plan = cad.make_plan(schematic, board, out)
            self.assertEqual([p["check"] for p in plan],
                             ["schematic-erc", "board-drc"])
            self.assertFalse(out.exists(), "Dry-run must not create reports")
            for entry in plan:
                self.assertEqual(entry["command"][0], "kicad-cli")
                self.assertIn("--exit-code-violations", entry["command"])
                self.assertNotIn("--save-board", entry["command"])
                self.assertNotIn("--refill-zones", entry["command"])
                self.assertNotIn(";", " ".join(entry["command"]))
            self.assertIn("--schematic-parity", plan[1]["command"])

    def test_no_input_or_bad_extension_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertRaises(ValueError, cad.make_plan, None, None, root)
            bad = root / "test.txt"
            bad.write_text("oops", encoding="utf-8")
            self.assertRaises(ValueError, cad.require_input, str(bad), ".kicad_pcb")
            self.assertRaises(FileNotFoundError,
                              cad.require_input, str(root / "no.kicad_pcb"), ".kicad_pcb")

    def test_default_main_is_true_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            sch = Path(tmp) / "board.kicad_sch"
            sch.write_text("(kicad_sch)", encoding="utf-8")
            output = Path(tmp) / "reports"
            with patch("cad_ecad_verify.subprocess.run") as mock_run:
                self.assertEqual(cad.main(["--schematic", str(sch),
                                           "--report-dir", str(output)]), 0)
                mock_run.assert_not_called()
            self.assertFalse(output.exists())

    def test_version_gate_and_drc_exit_code(self):
        class Fake:
            def __init__(self, code, stdout="", stderr=""):
                self.returncode, self.stdout, self.stderr = code, stdout, stderr
        with patch("cad_ecad_verify.subprocess.run", return_value=Fake(0, "10.0.0")):
            self.assertEqual(cad.validate_version("kicad-cli"), "10.0.0")
        with patch("cad_ecad_verify.subprocess.run", return_value=Fake(0, "9.0.0")):
            self.assertRaises(RuntimeError, cad.validate_version, "kicad-cli")
        with patch("cad_ecad_verify.subprocess.run", return_value=Fake(5, "", "DRC violations")):
            self.assertEqual(cad.run_checks([{
                "check": "board-drc", "report": "/tmp/drc.rpt",
                "command": ["kicad-cli", "pcb", "drc", "board.kicad_pcb"],
            }]), 5)

    def test_fusion_reference_is_syntactically_valid_and_readonly(self):
        file = ROOT / "examples/fusion360-readonly-inspector/FusionReadOnlyInspector/FusionReadOnlyInspector.py"
        text = file.read_text(encoding="utf-8")
        ast.parse(text)
        self.assertIn("adsk.fusion.Design.cast", text)
        self.assertIn("Application.get()", text)
        self.assertNotIn(".exportManager.execute(", text)
        self.assertNotIn("features.extrudeFeatures.add(", text)
        self.assertNotIn(".userParameters.add(", text)
        self.assertNotIn(".save(", text)


if __name__ == "__main__":
    unittest.main()
