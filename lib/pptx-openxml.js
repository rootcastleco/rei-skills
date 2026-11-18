"use strict";

/**
 * Clean-room OpenXML (.pptx) Presentation Builder & Editable-Element Inspector.
 *
 * Writes standards-compliant OPC/OpenXML ZIP archives containing real editable
 * <p:sp> text boxes, native <a:tbl> tables, accent vector shapes, and <p:notes>
 * speaker notes — never flattening slides into images.
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

// CRC-32 lookup table for PKZIP local & central directory headers
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const rawData = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data || ""), "utf8");
    const compressed = zlib.deflateRawSync(rawData);
    const crc = crc32(rawData);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

function readZipEntries(zipBuffer) {
  const entries = new Map();
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= Math.max(0, zipBuffer.length - 65558); i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error("Invalid ZIP/PPTX archive: EOCD record not found");
  }
  const cdCount = zipBuffer.readUInt16LE(eocdOffset + 10);
  let pos = zipBuffer.readUInt32LE(eocdOffset + 16);

  for (let i = 0; i < cdCount; i++) {
    if (zipBuffer.readUInt32LE(pos) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory header");
    }
    const method = zipBuffer.readUInt16LE(pos + 10);
    const compSize = zipBuffer.readUInt32LE(pos + 20);
    const nameLen = zipBuffer.readUInt16LE(pos + 28);
    const extraLen = zipBuffer.readUInt16LE(pos + 30);
    const commentLen = zipBuffer.readUInt16LE(pos + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(pos + 42);
    const fileName = zipBuffer.subarray(pos + 46, pos + 46 + nameLen).toString("utf8");

    const lfhNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const lfhExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
    const rawComp = zipBuffer.subarray(dataStart, dataStart + compSize);
    const content = method === 0 ? rawComp : zlib.inflateRawSync(rawComp);
    entries.set(fileName, content);

    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function xmlEscape(val) {
  return String(val || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTextBoxXml(id, name, box, paragraphs, options = {}) {
  const {
    fontSize = 1800,
    bold = false,
    color = "FFFFFF",
    fill = null,
    bullet = false,
  } = options;

  const fillXml = fill
    ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>`
    : `<a:noFill/>`;

  const pXml = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
    .filter((p) => p !== undefined && p !== null)
    .map((p) => {
      const text = typeof p === "string" ? p : String(p.text || "");
      const pBold = typeof p === "object" && p.bold !== undefined ? p.bold : bold;
      const pSize = typeof p === "object" && p.fontSize ? p.fontSize : fontSize;
      const pColor = typeof p === "object" && p.color ? p.color : color;
      const buXml = bullet
        ? `<a:buChar char="•"/>`
        : `<a:buNone/>`;
      return `<a:p><a:pPr ${bullet ? 'marL="228600" indent="-228600"' : ""}>${buXml}</a:pPr><a:r><a:rPr lang="en-US" sz="${pSize}" b="${pBold ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${pColor}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xmlEscape(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${pSize}"/></a:p>`;
    })
    .join("");

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${xmlEscape(name)}"/>
      <p:cNvSpPr txBox="1"/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${box.x}" y="${box.y}"/><a:ext cx="${box.cx}" cy="${box.cy}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      ${fillXml}
      <a:ln><a:noFill/></a:ln>
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>
      <a:lstStyle/>
      ${pXml}
    </p:txBody>
  </p:sp>`;
}

function buildTableXml(id, name, box, tableRows = []) {
  if (!Array.isArray(tableRows) || tableRows.length === 0) return "";
  const colCount = Math.max(1, tableRows[0].length);
  const colWidth = Math.floor(box.cx / colCount);
  const rowHeight = Math.min(480000, Math.floor(box.cy / tableRows.length));

  const gridCols = Array.from({ length: colCount }, () => `<a:gridCol w="${colWidth}"/>`).join("");
  const trXml = tableRows
    .map((row, rIdx) => {
      const isHeader = rIdx === 0;
      const bg = isHeader ? "0E3D8A" : rIdx % 2 === 1 ? "111827" : "182235";
      const tcXml = row
        .map((cell) => {
          return `<a:tc>
            <a:txBody>
              <a:bodyPr/>
              <a:lstStyle/>
              <a:p><a:r><a:rPr lang="en-US" sz="1300" b="${isHeader ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xmlEscape(cell)}</a:t></a:r></a:p>
            </a:txBody>
            <a:tcPr marL="68580" marR="68580" marT="45720" marB="45720">
              <a:solidFill><a:srgbClr val="${bg}"/></a:solidFill>
            </a:tcPr>
          </a:tc>`;
        })
        .join("");
      return `<a:tr h="${rowHeight}">${tcXml}</a:tr>`;
    })
    .join("");

  return `<p:graphicFrame>
    <p:nvGraphicFramePr>
      <p:cNvPr id="${id}" name="${xmlEscape(name)}"/>
      <p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>
      <p:nvPr/>
    </p:nvGraphicFramePr>
    <p:xfrm><a:off x="${box.x}" y="${box.y}"/><a:ext cx="${box.cx}" cy="${box.cy}"/></p:xfrm>
    <a:graphic>
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
        <a:tbl>
          <a:tblPr firstRow="1" bandRow="1"/>
          <a:tblGrid>${gridCols}</a:tblGrid>
          ${trXml}
        </a:tbl>
      </a:graphicData>
    </a:graphic>
  </p:graphicFrame>`;
}

function buildSlideXml(slide, idx, total) {
  const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
  const hasTable = Array.isArray(slide.table) && slide.table.length > 0;
  const headerBar = `<p:sp>
    <p:nvSpPr><p:cNvPr id="2" name="TopAccentBar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="140000"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      <a:solidFill><a:srgbClr val="0E3D8A"/></a:solidFill>
      <a:ln><a:noFill/></a:ln>
    </p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>
  </p:sp>`;

  const greenBadge = buildTextBoxXml(
    3,
    "SectionTag",
    { x: 640080, y: 260000, cx: 3600000, cy: 360000 },
    `${String(slide.tag || "ENGINEERING BRIEF").toUpperCase()} · ${idx + 1}/${total}`,
    { fontSize: 1200, bold: true, color: "FFFFFF", fill: "228B55" },
  );

  const titleBox = buildTextBoxXml(
    4,
    "SlideTitle",
    { x: 640080, y: 720000, cx: 10911840, cy: 860000 },
    slide.title || `Slide ${idx + 1}`,
    { fontSize: 2800, bold: true, color: "FFFFFF" },
  );

  const bodyWidth = hasTable ? 5600000 : 10911840;
  const bulletsBox = buildTextBoxXml(
    5,
    "MainBullets",
    { x: 640080, y: 1700000, cx: bodyWidth, cy: 3900000 },
    bullets,
    { fontSize: 1800, bold: false, color: "E2E8F0", bullet: true },
  );

  const tableXml = hasTable
    ? buildTableXml(
        6,
        "MetricsTable",
        { x: 6480000, y: 1750000, cx: 5070000, cy: 3600000 },
        slide.table,
      )
    : "";

  const citationText = (slide.citations || []).length
    ? `Sources: ${slide.citations.join(", ")}`
    : "Rootcastle REI Skills";
  const footerBox = buildTextBoxXml(
    7,
    "CitationFooter",
    { x: 640080, y: 6180000, cx: 10911840, cy: 420000 },
    citationText,
    { fontSize: 1100, bold: false, color: "94A3B8" },
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${headerBar}
      ${greenBadge}
      ${titleBox}
      ${bulletsBox}
      ${tableXml}
      ${footerBox}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function buildNotesXml(notesText, idx) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${buildTextBoxXml(2, `Notes-${idx + 1}`, { x: 685800, y: 1143000, cx: 5486400, cy: 5000000 }, notesText || "", {
        fontSize: 1400,
        color: "000000",
      })}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:notes>`;
}

/**
 * Generates an editable OpenXML .pptx presentation from a SlideDeckSpec.
 */
function writeEditablePptx(outputPath, deckSpec) {
  const slides = Array.isArray(deckSpec.slides) ? deckSpec.slides : [];
  if (slides.length === 0) {
    throw new Error("Cannot build PPTX from an empty SlideDeckSpec");
  }

  const entries = [];
  const slideOverrides = [];
  const presRels = [
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`,
  ];
  const sldIdEntries = [];

  for (let i = 0; i < slides.length; i++) {
    const n = i + 1;
    const relId = `rId${n + 2}`;
    presRels.push(
      `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${n}.xml"/>`,
    );
    sldIdEntries.push(`<p:sldId id="${255 + n}" r:id="${relId}"/>`);

    slideOverrides.push(
      `<Override PartName="/ppt/slides/slide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
      `<Override PartName="/ppt/notesSlides/notesSlide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`,
    );

    entries.push({
      name: `ppt/slides/slide${n}.xml`,
      data: buildSlideXml(slides[i], i, slides.length),
    });
    entries.push({
      name: `ppt/slides/_rels/slide${n}.xml.rels`,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${n}.xml"/>
</Relationships>`,
    });
    entries.push({
      name: `ppt/notesSlides/notesSlide${n}.xml`,
      data: buildNotesXml(slides[i].speakerNotes || "", i),
    });
    entries.push({
      name: `ppt/notesSlides/_rels/notesSlide${n}.xml.rels`,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${n}.xml"/>
</Relationships>`,
    });
  }

  entries.push({
    name: "[Content_Types].xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides.join("\n  ")}
</Types>`,
  });

  entries.push({
    name: "_rels/.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
  });

  entries.push({
    name: "ppt/presentation.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${sldIdEntries.join("")}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`,
  });

  entries.push({
    name: "ppt/_rels/presentation.xml.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels.join("\n  ")}
</Relationships>`,
  });

  entries.push({
    name: "ppt/slideLayouts/slideLayout1.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`,
  });

  entries.push({
    name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
  });

  entries.push({
    name: "ppt/slideMasters/slideMaster1.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`,
  });

  entries.push({
    name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
  });

  entries.push({
    name: "ppt/theme/theme1.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="RootcastleTheme">
  <a:themeElements>
    <a:clrScheme name="Rootcastle">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="0F172A"/></a:dk2>
      <a:lt2><a:srgbClr val="E2E8F0"/></a:lt2>
      <a:accent1><a:srgbClr val="0E3D8A"/></a:accent1>
      <a:accent2><a:srgbClr val="228B55"/></a:accent2>
      <a:accent3><a:srgbClr val="38BDF8"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="8B5CF6"/></a:accent5>
      <a:accent6><a:srgbClr val="10B981"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink>
      <a:folHlink><a:srgbClr val="94A3B8"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="RootcastleFonts">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="RootcastleFmt"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`,
  });

  const zipBuffer = buildZipArchive(entries);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, zipBuffer);

  return {
    outputPath,
    slideCount: slides.length,
    bytes: zipBuffer.length,
  };
}

/**
 * Verifies a generated .pptx archive contains real editable XML shapes,
 * native tables, and speaker notes (not flattened screenshots).
 */
function verifyEditablePptx(pptxPath) {
  const buf = fs.readFileSync(pptxPath);
  const entries = readZipEntries(buf);
  const slideKeys = [...entries.keys()].filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort();
  const noteKeys = [...entries.keys()].filter((k) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(k)).sort();

  let editableShapeCount = 0;
  let nativeTableCount = 0;
  let imageOnlySlides = 0;
  const extractedTexts = [];

  for (const key of slideKeys) {
    const xml = entries.get(key).toString("utf8");
    const spMatches = xml.match(/<p:sp>/g) || [];
    const tblMatches = xml.match(/<a:tbl>/g) || [];
    const picMatches = xml.match(/<p:pic>/g) || [];
    editableShapeCount += spMatches.length;
    nativeTableCount += tblMatches.length;
    if (spMatches.length === 0 && picMatches.length > 0) {
      imageOnlySlides += 1;
    }
    const textMatches = [...xml.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map((m) => m[1]);
    extractedTexts.push(...textMatches);
  }

  let notesTextCount = 0;
  for (const nk of noteKeys) {
    const xml = entries.get(nk).toString("utf8");
    if (/<a:t>[^<]+<\/a:t>/.test(xml)) notesTextCount += 1;
  }

  return {
    validOpenXmlZip: entries.has("[Content_Types].xml") && entries.has("ppt/presentation.xml"),
    slideCount: slideKeys.length,
    noteSlideCount: noteKeys.length,
    notesWithText: notesTextCount,
    editableShapeCount,
    nativeTableCount,
    imageOnlySlides,
    isEditable: editableShapeCount >= slideKeys.length * 2 && imageOnlySlides === 0,
    sampleTexts: extractedTexts.slice(0, 12),
  };
}

module.exports = {
  buildZipArchive,
  readZipEntries,
  writeEditablePptx,
  verifyEditablePptx,
};
