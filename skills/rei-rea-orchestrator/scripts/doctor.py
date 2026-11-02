#!/usr/bin/env python3
"""Check the installed REI REA CLI without downloading or executing targets."""
import subprocess
import sys

result = subprocess.run([sys.executable, "-m", "rei_rea", "tools", "doctor"], check=False)
raise SystemExit(result.returncode)
