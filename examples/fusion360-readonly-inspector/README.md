# Fusion 360 Read-Only Inspector Example

This example is a conservative **in-process Autodesk Fusion Python script**. It reads the active Design product, counts components/occurrences and reports user parameter expressions. It does **not** edit geometry, export files, synchronize Electronics PCB data or execute CAM.

## Run inside Fusion

1. Create/open a known test Fusion design and save a revision before experimenting.
2. Open **Utilities → Scripts and Add-Ins** (the navigation wording can vary by UI release).
3. Add the `FusionReadOnlyInspector` script folder or copy it under the Fusion Scripts location configured in Preferences.
4. Select it and choose **Run**; inspect the application's text log.

Autodesk's documented default script locations include:

- macOS: `~/Library/Application Support/Autodesk/Autodesk Fusion/API/Scripts`
- Windows: `%appdata%\Autodesk\Autodesk Fusion\API\Scripts`

Use only the installed application's supported script creation flow; do not copy unknown external Python modules into Fusion's privileged script environment.

## Validation

Syntax can be checked with:

```bash
python -m py_compile examples/fusion360-readonly-inspector/FusionReadOnlyInspector/FusionReadOnlyInspector.py
python scripts/tests/test_cad_ecad_verify.py
```

An ordinary OS Python cannot import `adsk` without Fusion; passing syntax checks **does not validate Fusion runtime execution**. Until the script has been run in the required Fusion version, runtime behavior remains **NOT VERIFIED**.

Source: [Autodesk Fusion Scripts and Add-Ins](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-9701BBA7-EC0E-4016-A9C8-964AA4838954), [Design API](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_Design.htm), [Units](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/Units_UM.htm).
