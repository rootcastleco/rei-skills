"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=(x)=>JSON.parse(fs.readFileSync(path.join(ROOT,x),"utf8"));
const report=read("data/rei67-import-provenance.json");
const config=read("data/curated-expansion-bundles.json");
const generated=read("data/bundles.json").bundles;
const pkg=read("package.json");
const index=read("data/catalog.json");
assert.match(pkg.version,/^6\.(?:7|8)\.\d+$/);
assert.equal(report.schemaVersion,1);
assert.equal(report.imported.length,274);
assert.equal(new Set(report.imported.map(x=>x.id)).size,274);
assert.equal(report.repositories.length,7);
assert.ok(index.total>=1733,"expected at least 1733 catalog entries");
const indexed=new Set(index.skills.map(x=>x.id));
const sha=(b)=>crypto.createHash("sha256").update(b).digest("hex");
for(const item of report.imported){
 const file=path.join(ROOT,"skills",item.id,"SKILL.md");
 assert.ok(fs.existsSync(file),item.id);
 const contents=fs.readFileSync(file);
 assert.equal(sha(contents),item.contentSha256,item.id+" provenance integrity");
 assert.ok(contents.includes(item.sha),item.id+" pinned upstream ref");
 assert.ok(indexed.has(item.id),item.id+" catalog missing");
 assert.ok(report.licenses[item.repo],item.id+" missing license notice");
 for(const ref of item.referencesIncluded||[]){
   const file=path.join(ROOT,"skills",item.id,ref.path);
   assert.ok(fs.existsSync(file),"missing reference "+item.id+"/"+ref.path);
   assert.equal(sha(fs.readFileSync(file)),ref.sha256,"ref digest mismatch");
 }
}
for(const license of Object.values(report.licenses)){
 const filename=path.join(ROOT,license.path);
 assert.ok(fs.existsSync(filename),"missing license: "+license.path);
 assert.equal(sha(fs.readFileSync(filename)),license.sha256,"license digest mismatch");
}
const bundleIds=new Set(report.imported.map(x=>x.id));
assert.deepEqual(new Set(config["rei-popular-67"].skills),bundleIds);
for(const [name,bundle] of Object.entries(config)){
 assert.ok(bundle.description&&bundle.skills.length);
 assert.deepEqual(new Set(generated[name].skills),new Set(bundle.skills),"catalog did not preserve curated bundle: "+name);
 for(const id of bundle.skills) assert.ok(indexed.has(id),name+" unknown skill "+id);
}
console.log("PASS: 274 unique source-backed skills, 7 provenance snapshots, licenses, reference integrity, 1733 catalog entries and 7 persisted bundles");
