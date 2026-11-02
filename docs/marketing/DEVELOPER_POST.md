# 📝 Technical Launch Article: Engineering a Verifiable Skill Layer for AI Agents

**Suggested Title:** *Why We Audited 895 Agent Skills, Fixed 221 Broken YAML Schemas, and Integrated a Reverse-Engineering Workbench*  
**Author:** Rootcastle Engineering & Innovation

---

## Introduction

As AI coding assistants like Claude Code, OpenAI Codex CLI, Gemini CLI, and Cursor have converged on `SKILL.md` files as their modularity primitive, developer repositories have accumulated hundreds of community-contributed instructions.

When we audited our own skill registry at **Rootcastle Engineering & Innovation**, we discovered that scale without strict systems engineering creates silent failure modes:
1. **221 `SKILL.md` files** had broken YAML block-scalar quoting (`description: ">"`), causing strict YAML parsers to misread or drop skill metadata.
2. **4 official document skills** (`docx`, `pdf`, `pptx`, `xlsx`) were stored as Git mode `120000` symlinks—which check out as 1-line text files on Windows machines when `core.symlinks=false`.
3. **A mass-rebrand script** had overwritten upstream `source:` URLs instead of preserving third-party provenance.
4. **The CLI installer** deleted any target directory containing `.git` without verifying whether that `.git` repo belonged to an unrelated user project.

Here is how we re-engineered **[REI Skills (`v6.1.0`)](https://github.com/rootcastleco/rei-skills)** into a deterministic, verifiable open-source platform—and integrated **[REI Reverse Engineering (`rei-rea`)](https://github.com/rootcastleco/Rei-Reverse-engineer)** as a first-class binary intelligence module.

---

## 1. Dual-Profile Schema Validation & Provenance Preservation

Different AI clients have different frontmatter expectations:
- Repository maintainers and enterprise security teams need `risk` (`none`, `safe`, `critical`, `offensive`) and `source` provenance.
- Strict `agentskills-ref` validators only permit `name` and `description`.

Instead of deleting provenance metadata, we unified our Python (`scripts/validate_skills.py`) and Node (`lib/skill-utils.js`) parsers and added a lossless exporter to the CLI:

```bash
npx rei-skills export --format strict --output ./strict-skills
```

Every exported skill produces a 2-field `SKILL.md` alongside a `.rei-metadata.json` sidecar file, preserving full attribution and risk metadata.

---

## 2. Provenance-Gated Binary Reverse Engineering (`rei-rea`)

When an AI agent inspects a compiled binary (`PE`, `ELF`, `Mach-O`, `APK`, `Wasm`, or firmware image), hallucinated claims are worse than useless—they derail investigations.

We integrated **12 specialist skills** from **[`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer)** (`rei-rea-orchestrator`, `rei-binary-intelligence`, `rei-casebook-forensics`, `rei-native-binaries`, `rei-electron-and-js`, `rei-android-apks`, `rei-firmware-and-iot`, `rei-mobile-runtime`, `rei-evidence-ledger`, `rei-reconstruction-parity`, `rei-wasm-and-managed`, `rei-web-and-protocols`).

Every `rei-*` skill enforces three rules:
1. **Static-First Boundary:** Parse headers, sections, imports/exports, strings, and entropy without executing untrusted sample code.
2. **SHA-256 Chain of Custody:** Record every artifact and finding in a reproducible forensic casebook.
3. **Epistemic Tagging (`[EVIDENCE]` / `[INFERENCE]` / `[UNKNOWN]`):** Never state a behavioral hypothesis without separating it from raw structural evidence.

You can run our end-to-end WebAssembly release-diff demo locally:

```bash
python examples/rei-rea-demo/run_demo.py
```

---

## 3. Try REI Skills Today

```bash
# Search 895 validated skills from your terminal
npx rei-skills search "reverse engineering"

# Install the 12-skill REI REA bundle into Claude Code or Cursor
npx rei-skills add rei-rea --claude
npx rei-skills add rei-rea --cursor
```

- **GitHub Repository:** [github.com/rootcastleco/rei-skills](https://github.com/rootcastleco/rei-skills)
- **REI Reverse Engineering Workbench:** [github.com/rootcastleco/Rei-Reverse-engineer](https://github.com/rootcastleco/Rei-Reverse-engineer)
