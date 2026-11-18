---
name: rei-pptx-production
description: "Generate genuine editable PowerPoint (.pptx) decks with native OpenXML text shapes (<p:sp>), tables (<a:tbl>), and speaker notes (<p:notes>) aligned with hugohe3/ppt-master (commit 4478b1f) and lib/pptx-openxml.js. Never flattens slides into static screenshots."
category: workflow
risk: safe
source: rootcastle-rei
license: MIT
metadata:
  tags:
    - pptx
    - powerpoint
    - ppt-master
    - openxml
    - slides
---

# REI PPTX Production (`ppt-master` & OpenXML Adapter)

Author truly editable `.pptx` presentations (`presentations/presentation.pptx`) from shared `SlideDeckSpec` data using [`lib/pptx-openxml.js`](../../lib/pptx-openxml.js) and [`skills/pptx-official`](../pptx-official/SKILL.md) design discipline.

## When to Use

- Exporting engineering presentations into editable `.pptx` format preserving titles, structured bullet boxes, metric tables, citation footers, and bilingual speaker notes.
- Auditing imported or generated `.pptx` archives with `verifyEditablePptx()` to guarantee slides are not screenshot-only image containers.

## Inputs and Outputs

- **Inputs:** Shared `SlideDeckSpec` JSON (synchronized with HTML Path A).
- **Outputs:** OPC/OpenXML `.pptx` ZIP archive (`[Content_Types].xml`, `ppt/slides/slide*.xml`, `ppt/notesSlides/notesSlide*.xml`, `ppt/theme/theme1.xml`) plus XML structure verification metrics.

## Prerequisites & License Constraints

- Upstream: `hugohe3/ppt-master` (`MIT`, commit `4478b1f464442269f480a8a6265acc37174e4e7e`).
- Built-in pure Node.js OpenXML builder requires zero external pip packages (`python-pptx` / `pandoc` are optional only for legacy `.doc`/`.tex` imports). Inline attribution required if CC-BY external media is added.

## Offline vs Online Capabilities

- **Offline:** Complete OpenXML `.pptx` generation and XML structural inspection execute deterministically offline.

## Procedure

1. Compile shared `SlideDeckSpec` from validated research and editorial outputs.
2. Write native `<p:sp>` text boxes, `<a:tbl>` data tables, and `<p:notes>` XML speaker notes.
3. Run `verifyEditablePptx(pptxPath)` to verify `editableShapeCount >= slideCount * 2`, `nativeTableCount > 0`, and `imageOnlySlides === 0`.

```sh
node -e 'const {writeEditablePptx,verifyEditablePptx}=require("./lib/pptx-openxml"); writeEditablePptx("tmp-deck/out.pptx", {title:"Test", slides:[{tag:"Brief", title:"Slide 1", bullets:["Item 10 Hz [SRC-1]"], table:[["Key","Val"],["RMS","1.8 mm/s"]], speakerNotes:"Notlar", citations:["SRC-1"]}]}); console.log(verifyEditablePptx("tmp-deck/out.pptx"));'
```

## Do not use

Constraints and safety: Operational boundary — do not rasterize full slides into `<p:pic>` images and label them editable `.pptx`, and never drop unrepresented speaker notes or citation metadata silently.

## Verification Criteria & Failure Recovery

- Verify `validOpenXmlZip === true`, `isEditable === true`, `imageOnlySlides === 0`, and `notesWithText === slideCount`.

## Authoritative product references

- https://github.com/hugohe3/ppt-master
