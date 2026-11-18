"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const d = read("data/design-studio-sources.json");
const h = read("data/design-studio-high-signal.json");
const curated = read("data/curated-design-bundles.json");
const bundles = read("data/bundles.json").bundles;
assert.equal(d.design20.length, 20);
assert.equal(d.toolkit25.length, 25);
assert.equal(h.items.length, 9);
assert.equal(h.items.filter((x) => !x.existing).length, 8);
for (const [name, entries] of [["design-studio", d.design20], ["creative-production-25", d.toolkit25], ["design-high-signal", h.items]]) {
  const aliases = { pptx: "pptx-official", docx: "docx-official", pdf: "pdf-official", xlsx: "xlsx-official" };
  const ids = new Set(entries.map((x) => aliases[x.id] || x.id));
  if (name === "design-studio") ids.add("rei-design-studio");
  assert.deepEqual(new Set(curated[name].skills), ids, name + " source mismatch");
  assert.deepEqual(new Set(bundles[name].skills), ids, name + " catalog mismatch");
  for (const id of ids) assert.ok(fs.existsSync(path.join(root,"skills",id,"SKILL.md")),id);
}
console.log("PASS: 20 + 25 + 9 registry entries, curated catalog persistence and SKILL.md resolution");
