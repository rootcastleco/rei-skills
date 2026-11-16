# Rootcastle Original Technical Skills — v6.4.0

**Scope:** 528 new Rootcastle-authored engineering workflows across 33 technical domains. The original 895 validated skills are preserved, for a catalog target of **1,423**.

The new skills are **task-specific methods and evidence contracts**, not pretrained models or validated hardware implementations. A successful schema audit is not proof of correctness on physical devices. Each skill marks unmeasured or unverified claims explicitly.

## Coverage

| Group | Domains | New skills |
|---|---|---:|
| GNSS and vehicle connectivity | GNSS measurement, fleet telematics, JT808 protocol, BLE sensor nodes, cellular IoT gateway | 80 |
| Embedded and secure networking | Embedded RTOS, firmware OTA, IoT security, Rust protocol services, industrial Ethernet | 80 |
| Measurement and electronics | Machine vibration, rotor balancing, sensor acquisition, PCB design, EMC precompliance | 80 |
| Data and applications | Time-series telemetry, edge ML, event streaming, cloud operations, mobile field applications | 80 |
| Verification and research | Binary forensics, hardware-in-the-loop, safety assurance, optimization, reproducible research | 80 |
| Electronic circuit and KiCad | Circuit architecture, SPICE verification, KiCad schematic/PCB automation | 48 |
| Fusion and 3D mechanical CAD | Fusion parametric CAD, Fusion API, 3D assemblies, ECAD–MCAD fitting, Fusion CAM | 80 |
| **Total** | **33 domains** | **528** |

See [CAD, Electronics and Fusion 360](CAD_ELECTRONICS_FUSION.md) for official product documentation, verified interface limitations and runnable reference code.

## Provenance and generation

- All instruction bodies are original Rootcastle-authored work, not scraped content from a prompt archive and not unlicensed repackaging of other vendors' skill collections.
- Six reviewed topic briefs reside in data/technical-expansion-source-01.txt through data/technical-expansion-source-06.txt.
- scripts/generate_technical_skills.py creates the individual SKILL.md entrypoints and agents/openai.yaml metadata.
- data/technical-expansion-manifest.json records the name, category and SHA-256 of each generated skill.
- Generated skills carry source rootcastle-original-technical-expansion-2026 and MIT license metadata.
- Generation is **offline and deterministic**. It cannot download instructions, execute hooks, call remote services or alter existing skill folders with different contents.

## Contract

Each individual skill includes a narrow invocation trigger, explicit input and units contract, a domain-specific technical task, negative-path and failure hypotheses, operational safety boundaries, and auditable PASS/FAIL/NOT VERIFIED acceptance evidence.

This does not imply that algorithms, physical measurement procedures, standard conformance or mechanical safety have been independently verified. Those validations require suitable datasets, reference equipment, an isolated test rig and sign-off by a competent engineer.

## Maintenance

1. Edit one of the curated source files. Keep exactly 33 unique domain headers and 16 distinct tasks in each domain for this version.
2. Regenerate with python scripts/generate_technical_skills.py and inspect the changed skill entrypoints and provenance hashes.
3. Run python scripts/generate_technical_skills.py --check followed by python scripts/validate_skills.py --strict.
4. Run python scripts/tests/test_technical_expansion.py, node scripts/security_audit.js and the complete npm test suite.
5. Rebuild indexes and documentation with npm run build and examine every resulting diff.
6. Submit a reviewed PR; do not silently self-modify skills or publish a new npm release outside the normal release gate.

The generator refuses to overwrite a modified generated skill. To alter one, revise its corresponding source brief and explicitly reconcile the intended change, preserving traceability.

## Rollback and compatibility

No existing skill ID or MCP tool is removed. The new skills are additive and can be excluded by source filter or left uninstalled. Rollback consists of reverting this catalog expansion commit and rebuilding derived indexes; do not delete user-installed files without a backup and consent. The source metadata and manifest allow distinguishing original 895 entries from the newly added 528.
