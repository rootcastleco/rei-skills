"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const catalog = require(path.join(root, "data/catalog.json"));
const bundles = require(path.join(root, "data/bundles.json"));
const workflows = require(path.join(root, "data/workflows.json"));
const { recommendForTask } = require(path.join(root, "lib/smart-router"));

function assertRoutes(task, files, prefix) {
  const result = recommendForTask(catalog, bundles, workflows, {
    task, files, maxResults: 25,
  });
  const ids = result.recommendedSkills.map(x => x.id);
  assert(ids.some(id => id.startsWith(prefix)),
    "CAD router missed " + prefix + " for " + task + ". Top: " + ids.slice(0, 12).join(", "));
}

assert.equal(catalog.total, 1423, "CAD expansion index must be rebuilt");
assertRoutes("Fusion 360 ile parametrik 3D çizim yap", ["enclosure.f3d"], "rc-fusion360");
assertRoutes("Elektronik devre tasarımı güç kaynağı voltaj regülatörü", [], "rc-circuit-architecture");
assertRoutes("KiCad PCB DRC doğrula", ["board.kicad_pcb"], "rc-kicad-ecad");
assertRoutes("SPICE transient circuit simulation", [], "rc-circuit-simulation");
assertRoutes("3D muhafaza PCB STEP mekanik uyumluluk", ["board.step"], "rc-ecad-mcad-fit");
assertRoutes("Fusion CAM CNC postprocess toolpath", [], "rc-fusion360-cam");

const safe = recommendForTask(catalog, bundles, workflows, {
  task: "Fusion 360 API parametric enclosure inspector",
  files: ["enclosure.f3d"], safeOnly: true, maxResults: 20,
});
assert(safe.recommendedSkills.length, "Expected safe CAD recommendations");
assert(safe.recommendedSkills.every(x => x.risk !== "critical" && x.risk !== "offensive"),
  "Safe-only routing must not promote critical manufacturing steps");
console.log("PASS: English/Turkish CAD intent routing, file type signals and safe-only risk filters.");
