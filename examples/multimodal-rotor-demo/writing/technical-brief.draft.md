# Rotor Vibration Analysis — Technical Brief

At its core, what matters is that rotor vibration diagnostics evaluates RMS velocity across 10 Hz - 1000 Hz per ISO 10816-3 and ISO 20816-1 [SRC-1].
Using 4 synchronous channels sampled at 10 kHz with Hanning windowing reveals BPFO and BPFI bearing fault harmonics [SRC-3].
Single-plane vector balancing computes Wc = -V0 / A at 1,800 RPM (`COMPUTATIONAL_ONLY`); physical mass installation requires lockout/tagout and remains NOT VERIFIED [SRC-2].

## Verified References
- **SRC-1**: ISO 20816-1 / ISO 10816-3 — Mechanical vibration measurement and evaluation of rotating machinery (https://www.iso.org/standard/78311.html)
- **SRC-2**: REI Skills: Influence-Coefficient Single & Two-Plane Rotor Balancing Contract (https://github.com/rootcastleco/rei-skills/blob/main/skills/rc-rotor-mass-balance-two-plane-coupling/SKILL.md)
- **SRC-3**: REI Skills: FFT Windowing, Anti-Aliasing & Bearing Defect Sidebands (https://github.com/rootcastleco/rei-skills/blob/main/skills/rc-machine-vibration-hanning-window-leakage/SKILL.md)
- **SRC-4**: Rootcastle Public Prompt Archive Reference Policy (https://promt.rootcastle.com/)
