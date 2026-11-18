"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const script = path.join(root,"scripts/skill-evaluator-changed-batches.js");
const base = "0e94b2422a1c48ea8d3cd2a5e9305c315409ca2e";
const head = cp.execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"rei-changed-partitions-"));
const output=path.join(tmp,"changed.json");
const fixture=path.join(tmp,"paths.txt");
const imported=JSON.parse(fs.readFileSync(path.join(root,"data/rei67-import-provenance.json"),"utf8"));
const design=JSON.parse(fs.readFileSync(path.join(root,"data/design-studio-sources.json"),"utf8"));
const high=JSON.parse(fs.readFileSync(path.join(root,"data/design-studio-high-signal.json"),"utf8"));
const expected=new Set([
  ...imported.imported.map(x=>"skills/"+x.id),
  ...design.design20.filter(x=>x.mode==="adapter").map(x=>"skills/"+x.id),
  ...high.items.filter(x=>!x.existing).map(x=>"skills/"+x.id),
  "skills/rei-design-studio",
]);
assert.equal(expected.size,297);
fs.writeFileSync(fixture,[...expected].sort().join("\n")+"\n");
function run(args){
  return cp.spawnSync(process.execPath,[script,...args],{cwd:root,encoding:"utf8"});
}
const generated=run(["generate","--base",base,"--head",head,"--paths-file",fixture,"--output",output]);
assert.equal(generated.status,0,generated.stderr);
const verified=run(["verify",output]);
assert.equal(verified.status,0,verified.stderr);
const data=JSON.parse(fs.readFileSync(output,"utf8"));
assert.equal(data.totalChangedSkills,297);
assert.equal(data.batches.length,3);
assert.deepEqual(data.batches.map(x=>x.count),[100,100,97]);
const observed=data.batches.flatMap(x=>x.paths);
assert.deepEqual(new Set(observed),expected);
assert.equal(new Set(observed).size,observed.length);
// On full-history checkouts additionally prove the production git-diff path.
const hasBase=cp.spawnSync("git",["cat-file","-e",base+"^{commit}"],{cwd:root}).status===0;
if(hasBase){
  const source=path.join(tmp,"git.json");
  const result=run(["generate","--base",base,"--head",head,"--output",source]);
  assert.equal(result.status,0,result.stderr);
  const fromGit=JSON.parse(fs.readFileSync(source,"utf8"));
  assert.deepEqual(new Set(fromGit.batches.flatMap(x=>x.paths)),expected);
}
console.log("PASS: 297 changed skill entries, deterministic 100/100/97 partitioning; git-diff path "+(hasBase?"PASS":"NOT VERIFIED in shallow checkout"));
