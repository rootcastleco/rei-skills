# REI PaperOrchestra — integration and audit

Source: [Google Research PaperOrchestra](https://github.com/google-research/paper-orchestra), Apache-2.0 (Copyright 2026 Google LLC). Research publication: Song et al., *PaperOrchestra: A Multi-Agent Framework for Automated AI Research Paper Writing*, arXiv:2604.05018. The REI adapter is an independently authored integration; no affiliation or endorsement by Google is implied.

## Scope

The adapter does **not** vendor or modify PaperOrchestra. It invokes a reviewed upstream Git checkout, using its own Python environment and LaTeX dependencies. Upstream CLI provides outline, literature, section writing, reflection, and optional plotting agents. Current inspected upstream has `templates/iclr2025` and `templates/cvpr2025`. Its dataset is not included. Check model names, dependencies, template and target venue before running.

## Setup

Install upstream separately in an isolated environment (Python 3.11 is upstream's recommended version):

```bash
git clone https://github.com/google-research/paper-orchestra.git
cd paper-orchestra
git rev-parse HEAD
conda create -n paper_orchestra python=3.11
conda activate paper_orchestra
pip install -r requirements.txt
# Install/verify a LaTeX toolchain and supply credentials through env vars.
```

Raw material directory (separate from upstream): `idea_sparse.md`, `experimental_log.md`, optional `figures/` for vetted figures. The template directory must contain `template.tex` and `guidelines.md`.

Preview:

```bash
python3 skills/rei-paper-orchestra/scripts/paper_orchestra_bridge.py \
  --upstream /path/to/paper-orchestra \
  --raw-materials /path/to/study \
  --template /path/to/paper-orchestra/templates/iclr2025 \
  --output /path/to/new-run
```

Only after explicit approval, run with `--execute --confirm-remote-processing`; optionally set `--use-plotting`, `--writer-model`, `--reflection-model`, and `--research-cutoff YYYY-MM`.

## Acceptance criteria

1. Inspect the upstream commit hash and all input SHA-256 values from the preview and run manifest.
2. Confirm input/output isolation and never reuse an existing output directory.
3. Check provider expenses and privacy: the pipeline may upload source materials to external model/literature APIs; do not use private or restricted data without authorization.
4. Verify every bibliography entry against primary publications, and match each scientific claim to actual experiment logs.
5. Independently reproduce numerical results and figures; do not invent measurements, baselines, citations, or sample sizes.
6. Inspect output LaTeX, non-empty final PDF, venue formatting and originality. Human approval is required before submission.
7. Mark each evidence gate `PASS`, `FAIL`, or `NOT VERIFIED`; an upstream exit code of zero does **not** certify academic correctness.

## Risk and rollback

Threats: prompt injection in retrieved papers, exfiltration, hidden model costs, fabricated citations, unreliable generated figures, upstream CLI's deletion of output subdirectories. Mitigations: reviewed commit, isolation, default read-only preview, explicit consent, fresh private output, SHA-256, primary-source checks, author approval.

Rollback: remove the isolated `skills/rei-paper-orchestra/` directory, related documentation links, and rebuild indexes. No REI MCP, Prompt Archive, Rust, or registry core mutation is required.
