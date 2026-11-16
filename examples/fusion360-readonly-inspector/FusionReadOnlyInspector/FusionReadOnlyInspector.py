"""REI Fusion 360 read-only design inspector.

Run only inside Autodesk Fusion through Scripts and Add-Ins.
Do not invoke with ordinary Python: 'adsk' is injected by Fusion.
No model writes, exports, UI edits, or machine actions.
Sources:
  https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/ComponentsProxies_UM.htm
  https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/Units_UM.htm
"""


def run(context):
    app = None
    try:
        import adsk.core
        import adsk.fusion
        import json

        app = adsk.core.Application.get()
        if app is None or app.activeProduct is None:
            return

        design = adsk.fusion.Design.cast(app.activeProduct)
        if design is None:
            app.log("REI Fusion inspector: active product is not a Design")
            return

        root = design.rootComponent
        report = {
            "operation": "readonly_design_inspection",
            "root_component": root.name,
            "component_count": int(design.allComponents.count),
            "root_occurrence_count": int(root.occurrences.count),
            "parameters": [],
            "note": "Fusion Design API uses cm for internal lengths and rad for angles.",
        }
        parameters = design.userParameters
        for index in range(int(parameters.count)):
            parameter = parameters.item(index)
            report["parameters"].append({
                "name": parameter.name,
                "expression": parameter.expression,
            })

        app.log(json.dumps(report, indent=2, ensure_ascii=False))
    except Exception:
        import traceback
        if app is not None:
            app.log("REI Fusion inspector failed: " + traceback.format_exc())
        else:
            raise
