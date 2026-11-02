# REI Reverse Engineering (REI REA) — Integration & Workbench Guide

**Canonical Runtime Repository:** [https://github.com/rootcastleco/Rei-Reverse-engineer](https://github.com/rootcastleco/Rei-Reverse-engineer)  
**Pinned Upstream Version:** `v0.2.0` (`09fbc7b`)  
**Manifest:** [`data/rei-rea-manifest.json`](../data/rei-rea-manifest.json)

---

## 1. Architectural Overview: Bundled Skills vs. Optional Runtime

REI Skills integrates **REI REA (Rootcastle Reverse Engineering Workbench)** through a clean two-layer architecture that separates **agent instruction skills** from **local execution runtimes**:

| Layer | Where It Lives | Installed by `npx rei-skills`? | What It Provides |
| :--- | :--- | :--- | :--- |
| **1. Specialist Agent Skills (12)** | `skills/rei-*` in `rei-skills` | **Yes (Default)** | Evidence-first investigation procedures, routing contracts, confidence classification (`observed` / `inferred` / `unknown`), and tool selection guidance (`SKILL.md` + `references/workflow.md` + `agents/openai.yaml`). |
| **2. REI REA Python Workbench** | [`rootcastleco/Rei-Reverse-engineer`](https://github.com/rootcastleco/Rei-Reverse-engineer) | **No (Explicit Opt-In)** | Dependency-free Python 3.10+ CLI (`rei-rea`), 14-tool local stdio MCP server (`rei-rea mcp`), bounded PE/ELF/WASM parsers, SHA-256 hash-linked evidence cases, SQLite casebook search, and 11 opt-in static adapters. |

> [!IMPORTANT]
> **No Silent Binary Installation.** Installing REI Skills never downloads reverse-engineering binaries, installs Python packages, or modifies MCP configurations without explicit user opt-in.

---

## 2. The 12 Bundled Specialist Skills

All 12 specialist skills are included in the `reverse-engineering` category and the `rei-rea` bundle:

| Skill ID | Domain & Trigger Scope | Reference Material |
| :--- | :--- | :--- |
| [`rei-rea-orchestrator`](../skills/rei-rea-orchestrator/SKILL.md) | Intake, SHA-256 identity, format-based skill routing, and verification gates. | `references/QUICKSTART.md`, `references/workflow.md`, `scripts/doctor.py` |
| [`rei-binary-intelligence`](../skills/rei-binary-intelligence/SKILL.md) | Bounded PE, ELF, and WebAssembly v1 structural analysis and version diffs (`rei-rea deep`, `rei-rea diff`). | `references/workflow.md` |
| [`rei-casebook-forensics`](../skills/rei-casebook-forensics/SKILL.md) | SQLite casebook indexing, cross-case search, and metadata-only forensic bundle handoff. | `references/workflow.md` |
| [`rei-native-binaries`](../skills/rei-native-binaries/SKILL.md) | PE, ELF, Mach-O, COFF symbols, imports, ABI boundaries, and call-graph evidence. | `references/workflow.md` |
| [`rei-electron-and-js`](../skills/rei-electron-and-js/SKILL.md) | Electron ASAR packages, preload bridges, IPC routes, and bundled JavaScript analysis. | `references/workflow.md` |
| [`rei-android-apks`](../skills/rei-android-apks/SKILL.md) | Android APK/AAB, DEX bytecode, manifest permissions, components, and JNI boundaries. | `references/workflow.md` |
| [`rei-firmware-and-iot`](../skills/rei-firmware-and-iot/SKILL.md) | Authorized MCU, UEFI, embedded Linux, automotive telemetry, and GPS/IoT firmware triage. | `references/workflow.md` |
| [`rei-mobile-runtime`](../skills/rei-mobile-runtime/SKILL.md) | Authorized Android/iOS lab runtime observation planning when static evidence is insufficient. | `references/workflow.md` |
| [`rei-evidence-ledger`](../skills/rei-evidence-ledger/SKILL.md) | Append-only SHA-256 hash-linked observation chains, source offsets, and confidence auditing. | `references/workflow.md` |
| [`rei-reconstruction-parity`](../skills/rei-reconstruction-parity/SKILL.md) | Clean-room behavioral specifications, differential golden-test corpora, and parity verification. | `references/workflow.md` |
| [`rei-wasm-and-managed`](../skills/rei-wasm-and-managed/SKILL.md) | WebAssembly modules, .NET CIL assemblies, and JVM bytecode control-flow and type recovery. | `references/workflow.md` |
| [`rei-web-and-protocols`](../skills/rei-web-and-protocols/SKILL.md) | HAR, PCAP/PCAPNG captures, telemetry frames, and protocol state-machine reconstruction. | `references/workflow.md` |

---

## 3. Accurate Capability States

REI Skills and REI REA enforce a strict distinction between tool discovery and execution capability. These states must never be collapsed into a single "supported" claim:

| Capability State | Definition | Current Status in REI REA v0.2.0 |
| :--- | :--- | :--- |
| **Cataloged** | Listed in the 124-entry discovery registry (`tools.json`) with tags and homepage. | **124 entries** (discovery metadata only). |
| **PATH-Detected** | Executable name found on the local machine `PATH` via `rei-rea tools doctor`. | Environment-dependent (probed locally). |
| **Adapter-Supported** | Covered by a reviewed, argument-locked static CLI adapter requiring `--allow-external`. | **11 adapters:** `file`, `readelf`, `objdump`, `llvm-objdump`, `llvm-readobj`, `nm`, `exiftool`, `otool`, `aapt2` (`android-aapt2`), `rabin2`, `rz-bin`. |
| **Built-In Tested** | Implemented directly in Python stdlib and verified against reproducible test fixtures. | **PE, ELF, and WASM v1** bounded structural parsers, SHA-256 evidence cases, SQLite casebook, 14 stdio MCP tools. |
| **Planned** | Architecture interface reserved; not active in v0.2.0. | Live Ghidra / IDA / Rizin session control, JADX / Frida automation, upstream `morluto/rea` server adapter. |
| **Unsupported** | Explicitly excluded from platform scope. | Autonomous exploit generation, firmware flashing, live remote scanning, license bypass. |

> **Provenance Note on `morluto/rea`:** Rootcastle REI REA is an original Python workbench with its own implementation and evidence contract. The independent [morluto/rea](https://github.com/morluto/rea) project is tracked separately in `Rei-Reverse-engineer/upstream/rea` and retains its upstream provenance.

---

## 4. Installation Tutorial

### Step 1: Install the REI REA Specialist Skills

```bash
# Install all 895 skills (includes the 12 REI REA skills)
npx rei-skills

# Or install ONLY the 12 REI REA specialist skills into Claude Code, Cursor, Codex, or Gemini:
npx rei-skills add rei-rea --claude
npx rei-skills add rei-rea --cursor
npx rei-skills add rei-rea --codex
npx rei-skills add rei-rea --gemini
```

### Step 2: Check Local Capability Status

```bash
npx rei-skills doctor
```

### Step 3: Optionally Install the REI REA Python Workbench

Requirements: Python 3.10 or newer and Git. Zero third-party Python dependencies are required.

```bash
git clone https://github.com/rootcastleco/Rei-Reverse-engineer.git
cd Rei-Reverse-engineer
python -m pip install -e .

# Verify CLI installation and inspect local PATH tools
rei-rea --version
rei-rea tools doctor
```

---

## 5. Connecting the 14-Tool Local MCP Server

Once `rei-rea` is installed on your `PATH`, you can register its local stdio MCP server (`rei-rea mcp`) with your AI coding assistant.

### Generate or safely update MCP configuration via `rei-skills`:

```bash
# Print the MCP configuration snippet to stdout
npx rei-skills add rei-rea --print-mcp

# Or safely merge into an existing MCP config file (automatically creates a timestamped .bak backup)
npx rei-skills add rei-rea --mcp-config ~/.cursor/mcp.json
```

### Standard `mcpServers` Configuration JSON:

```json
{
  "mcpServers": {
    "rei-rea": {
      "command": "rei-rea",
      "args": ["mcp"]
    }
  }
}
```

### Exposed MCP Tools (14):

| MCP Tool | Operation |
| :--- | :--- |
| `rei_rea_providers` | List provider profiles and execution modes without launching external binaries. |
| `rei_rea_tools` | Search the 124-entry tool discovery catalog by tag or format. |
| `rei_rea_doctor` | Check which cataloged executables exist on the local `PATH`. |
| `rei_rea_inspect` | Identify artifact format and compute full SHA-256 hash. |
| `rei_rea_plan` | Generate a format-aware specialist skill and tool routing plan. |
| `rei_rea_signals` | Extract bounded entropy, header signatures, and optional printable strings. |
| `rei_rea_compare` | Compute hash and bounded byte-level differences between two files. |
| `rei_rea_case_create` | Initialize a tamper-evident SHA-256 evidence case directory. |
| `rei_rea_case_verify` | Verify append-only event hash chain and optional target hash consistency. |
| `rei_rea_investigate` | Run a single-call cross-hash-checked static triage pipeline (up to 64 MiB). |
| `rei_rea_deep` | Parse bounded PE, ELF, and WebAssembly v1 structural headers, imports, and exports. |
| `rei_rea_diff` | Compare parsed PE/ELF/WASM structures across two artifact versions. |
| `rei_rea_case_search` | Query an explicitly indexed local SQLite forensic casebook. |
| `rei_rea_bundle_verify` | Verify SHA-256 integrity of an exported metadata-only evidence bundle. |

---

## 6. Reproducible Evidence-Led Investigation Walkthrough

A complete, runnable demonstration using harmless WebAssembly v1 fixtures is included in [`examples/rei-rea-demo/`](../examples/rei-rea-demo/README.md).

### 1. Inspect and Parse `telemetry-filter-v1.wasm` and `v2.wasm`

```bash
rei-rea inspect examples/rei-rea-demo/fixtures/telemetry-filter-v1.wasm
rei-rea diff \
  examples/rei-rea-demo/fixtures/telemetry-filter-v1.wasm \
  examples/rei-rea-demo/fixtures/telemetry-filter-v2.wasm
```

### 2. Real Structural Diff Output (Excerpt from [`examples/rei-rea-demo/DEMO_OUTPUT.json`](../examples/rei-rea-demo/DEMO_OUTPUT.json))

```json
{
  "kind": "wasm",
  "before_sha256": "a86707e622921126c88d3b27142cb9404320197c19c45ec4fb81a2a4e908949f",
  "after_sha256": "766cc87ddc6f9df8964a05f2da01e7a0c8bf8b8370b53646d57b954b5b20ba59",
  "structural_changes": {
    "imports": {
      "added": [
        { "module": "env", "name": "audit_log_frame", "kind": 0 }
      ],
      "removed": []
    },
    "exports": {
      "added": [
        { "name": "validate_packet_header", "kind": 0, "index": 3 }
      ],
      "removed": []
    }
  }
}
```

### 3. Record and Verify a Hash-Linked Evidence Case

```bash
rei-rea case init examples/rei-rea-demo/fixtures/telemetry-filter-v2.wasm --workspace .rei-cases
rei-rea case verify .rei-cases/<CASE-ID> --recheck-target
rei-rea case report .rei-cases/<CASE-ID> --output FINDING_REPORT.md
```

---

## 7. Security Boundaries & Version Compatibility

1. **Read-Only Default:** Built-in commands (`inspect`, `deep`, `diff`, `signals`, `plan`, `investigate`, `case`) perform bounded reads (32 MiB parser ceiling / 64 MiB pipeline ceiling), reject symlinks, and never execute the target artifact.
2. **Explicit External Opt-In:** External static adapters (`readelf`, `objdump`, `rabin2`, etc.) never run unless `--allow-external` is explicitly passed on the CLI.
3. **Controlled Upstream Synchronization:**
   - Check for upstream REI REA updates: `npm run sync:rei-rea:check` (`python scripts/sync_rei_rea.py --check`)
   - Synchronize and update manifest: `npm run sync:rei-rea` (`python scripts/sync_rei_rea.py --sync`)
   - Roll back synced skills: `python scripts/sync_rei_rea.py --rollback`

| `rei-skills` Version | `rootcastle-rei-rea` Version | Pinned Commit | Bundled Specialist Skills | MCP Schema Tools |
| :--- | :--- | :--- | :--- | :--- |
| `1.0.x` / `1.1.0` | `0.2.0` (Alpha) | `09fbc7b` | 12 (`rei-*`) | 14 stdio tools |

---

## 8. Troubleshooting

- **`rei-rea: command not found` when starting MCP:** Ensure the Python environment where `pip install -e .` was run is on your system `PATH`, or specify the full path to the `rei-rea` binary in `mcpServers.rei-rea.command`.
- **Tool shows `path_detected: false` in `rei-rea tools doctor`:** The catalog entry is metadata-only until you install the underlying tool (e.g., `llvm-objdump` or `radare2`) via your OS package manager.
- **Symlink refused during `rei-rea inspect`:** By design, `rei-rea` refuses to inspect symbolic links to prevent path-traversal and TOCTOU file-swap attacks. Pass the canonical resolved file path.
