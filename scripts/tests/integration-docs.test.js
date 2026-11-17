"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const readme = read("README.md");
const generator = read("scripts/build-doc-site.js");
const page = read("docs/site/index.html");
for (const name of ["NVIDIA SkillEvaluator", "Google Research PaperOrchestra"]) {
  assert(readme.includes(name), "README missing " + name);
  assert(generator.includes(name), "Site generator missing " + name);
  assert(page.includes(name), "Generated Pages artifact missing " + name);
}
for (const name of ["docs/SKILLEVALUATOR_INTEGRATION.md", "docs/PAPER_ORCHESTRA_INTEGRATION.md"]) {
  assert(fs.existsSync(path.join(root, name)), "Missing integration guide: " + name);
}
console.log("PASS: both upstream integrations documented in README and generated Pages.");
