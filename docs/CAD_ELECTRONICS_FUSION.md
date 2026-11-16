# CAD, Electronic Circuit Design and Fusion 360 — Evidence-Grounded Skill Pack

**REI Skills 6.4.0 candidate** · Source reviewed: 2026-11-16 · Engineering scope: 128 new skills in eight specialist domains.

This pack adds design workflows to the existing 400 Rootcastle engineering skills in PR #11. **It does not assert that Fusion or KiCad was run on a real project.** CAD files, physical boards, simulation and generated NC programs must be separately inspected before acceptance.

## 1. Capability and API evidence

| Tool | Supported interface | Verified boundary | Primary source |
|---|---|---|---|
| Autodesk Fusion Design | Python/C++ scripts, user parameters, components/occurrences, feature timeline, design export | Design lengths use **centimeters** internally, angles **radians**; expression strings such as `20 mm` avoid implicit-unit ambiguity | [Fusion API units](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/Units_UM.htm), [Design API](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_Design.htm) |
| Autodesk Fusion scripting | Scripts and Add-Ins dialog; Python `adsk.core` / `adsk.fusion` and documented object model | API code runs **inside a Fusion session**, not via a normal system Python interpreter | [Scripts and Add-Ins](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-9701BBA7-EC0E-4016-A9C8-964AA4838954) |
| Autodesk Fusion Electronics | `adsk.electron` read-only object navigation, supported EAGLE 9.6.2 format export | **Current public Electronics API preview does not support creating/changing PCB layout geometry.** Do not generate fictitious write operations | [Electronics API introduction](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/ElectronicsIntro.htm), [export](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/ElectronicsExport.htm) |
| Fusion Electronics GUI | Linked schematic, 2D PCB, 3D PCB and electronic parts | GUI operations and approved CAD review needed for synchronized 2D/3D placement and revisions | [Electronics workflow](https://help.autodesk.com/view/fusion360/ENU/?contextId=ECD-PROJECTS) |
| KiCad 10 CLI | `sch erc`, `pcb drc`, jobs and supported export formats | Options depend on the **installed CLI version**; choose supported operations, preserve warnings/errors and never treat DRC as a substitute for measurement | [KiCad 10 CLI](https://docs.kicad.org/10.0/en/cli/cli.html) |
| KiCad schematic/simulator | ERC and ngspice operating point, DC, AC and transient modes | Models require validated manufacturer parameters; idealized simulations are not certification | [KiCad Schematic Editor](https://docs.kicad.org/10.0/en/eeschema/eeschema.html) |
| Fusion Manufacturing | Machine setup, work offset and stock, toolpaths, simulation, machine-specific NC output | **Never** issue G-code to CNC hardware without machine-specific post, simulation, dry run and operator signoff | [Manufacturing Setup](https://help.autodesk.com/view/fusion360/ENU/?contextId=MFG-CREATE-SETUP), [Post Process](https://help.autodesk.com/view/fusion360/ENU/?contextId=MFG-POST-PROCESS-OPERATIONS) |

**License and source policy:** These skills are original workflow instructions synthesized from publicly documented interfaces, not copied Autodesk/KiCad manuals or bundled proprietary models. Their availability does not grant a Fusion license, enable premium features, or install Autodesk/KiCad.

## 2. Skill coverage

Each specialist domain contributes **16 task-specific entrypoints** with independent triggers and test acceptance criteria.

| Domain slug | Count | Typical cases |
|---|---:|---|
| `circuit-architecture` | 16 | power tree, regulators, op-amp bias, ADC input, CAN/RS485, TVS |
| `circuit-simulation` | 16 | SPICE operating point, transient, AC, tolerance corners, bench parity |
| `kicad-ecad` | 16 | ERC/DRC, pin-to-pad parity, STEP export, Gerber, BOM, footprint constraints |
| `fusion360-parametric` | 16 | sketch constraints, parameters, solid features, sheet metal, STEP/STL |
| `fusion360-api` | 16 | Fusion scripts and add-ins, parameter units, components, safe exports, Electronics read-only |
| `cad-3d-assembly` | 16 | housings, fasteners, tolerance stacks, joints, drawings, additive materials |
| `ecad-mcad-fit` | 16 | PCB STEP inside enclosure, connector orientation, clearance, keep-outs, 3D PCB |
| `fusion360-cam` | 16 | CNC WCS, cutters, toolpaths, simulation, post-review, 3D printing |
| **Total** | **128** | **Added to 400 pre-existing original workflows → 528 new workflows total** |

## 3. Rootcastle field examples

### Four-channel machine vibration measurement PCB

1. Audit the analogue supply and ADC reference: `rc-circuit-architecture-adc-reference-network` and `rc-circuit-simulation-adc-sampling-settling`.
2. Run ERC/DRC on an approved KiCad source copy. Check actual layer stack, pin-to-pad and screw-hole coordinates.
3. Export a revisioned PCB STEP file. Import it into a mechanical assembly and check board thickness, cable exit and accelerometer axes.
4. Use Fusion parametric enclosure features and tolerance-stack checks; export neutral STEP for design review.
5. Release only after electrical, EMC and mechanical acceptance evidence is complete.

### Field telemetry device enclosure

1. Capture battery, antenna, USB, connectors and seal requirements in units with revisions.
2. Build Fusion user-parameter table and dimensional configurations using documented Design API units.
3. Validate mechanical enclosure sweep, seal compression and antenna keep-out.
4. If making a physical prototype, perform mesh manifoldness, print orientation and clearance-coupon checks before production.

### CNC-milled aluminium sensor fixture

1. Create part geometry and dimensions with known datum and tool clearances.
2. Assign machine, stock, work origin, cutter and holder geometry in the Manufacture setup.
3. Simulate stock removal and fixture collisions, select correct post processor for controller.
4. Inspect NC code independently; record hash and dry-run signoff. Do not send NC to live machinery from a skill invocation.

## 4. Tools, examples and evidence

- `examples/fusion360-readonly-inspector/FusionReadOnlyInspector.py`: **read-only** Fusion Python script intended for execution through Fusion's Scripts and Add-Ins dialog. A local Python syntax check is possible; actual Fusion API behavior is NOT VERIFIED until tested within an installed, authorized Fusion instance.
- `scripts/cad_ecad_verify.py`: deterministic, default **dry-run** KiCad ERC/DRC command planner. Actual execution requires `--run` and an installed, compatible `kicad-cli`; the script never performs board modifications.
- `scripts/tests/test_cad_ecad_verify.py`: independent CLI planner safety contract tests, without needing KiCad installed.
- `scripts/tests/test_cad_router.js`: regression for Turkish/English phrases and CAD file extensions.
- `data/technical-expansion-source-06.txt`: 128 curated task definitions; `data/technical-expansion-manifest.json` hashes every generated skill.

## 5. Acceptance / limitations

**PASS** for release only when all 1,423 skills pass schema and source checks, all 528 generated skill hashes are reproducible, index and README rebuild cleanly, package test finds representative CAD entrypoints, CAD router tests pass, and GitHub CI succeeds on the exact PR commit.

**NOT VERIFIED** without hardware or licensed application access: Fusion in-process API runtime; actual PCB/schematic geometry; physical power and thermal behavior; manufacturing tolerances; safe operation of CNC machinery; regulatory conformity.

To revert, revert this additive commit and rebuild deterministic indexes. No source PCB or Fusion model is modified by this pack.
