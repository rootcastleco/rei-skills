"use strict";

const assert = require("node:assert/strict");
const { validateRegistryResults, checkPublishedVersion } = require("../verify-npm-release");

function payload(version = "6.2.0") {
  return {
    name: "rei-skills",
    version,
    dist: {
      tarball: "https://registry.npmjs.org/rei-skills/-/rei-skills-" + version + ".tgz",
      integrity: "sha512-example",
    },
  };
}

async function main() {
  assert.equal(validateRegistryResults("6.2.0", payload(), {"dist-tags": {latest: "6.2.0"}}).ready, true);
  assert.equal(validateRegistryResults("6.2.0", payload("1.0.0"), {"dist-tags": {latest: "6.2.0"}}).ready, false);
  assert.equal(validateRegistryResults("6.2.0", payload(), {"dist-tags": {latest: "1.0.0"}}).ready, false);
  assert.equal(validateRegistryResults("6.2.0", {name:"rei-skills",version:"6.2.0"}, {"dist-tags": {latest: "6.2.0"}}).ready, false);
  assert.equal(validateRegistryResults("6.2.0", {...payload(), dist:{tarball:"http://evil.example/bad.tgz",integrity:"sha512-fake"}}, {"dist-tags": {latest: "6.2.0"}}).ready, false);
  let requests=0;
  const ready=await checkPublishedVersion("6.2.0", async(url,opts)=>{
    requests++;
    assert.equal(opts.headers["Cache-Control"],"no-cache");
    return {ok:true,status:200,json:async()=>url.includes("/6.2.0?") ? payload() : {"dist-tags":{latest:"6.2.0"}}};
  });
  assert.equal(ready.ready,true);
  assert.equal(requests,2);
  const missing=await checkPublishedVersion("6.2.0",async(url)=>{
    return url.includes("/6.2.0?") ? {ok:false,status:404} : {ok:true,status:200,json:async()=>({"dist-tags":{latest:"1.0.0"}})};
  });
  assert.equal(missing.ready,false);
  await assert.rejects(()=>checkPublishedVersion("6.2.0",async()=>({ok:false,status:503})),/npm registry HTTP 503/);
  console.log("npm release verification tests passed.");
}

main().catch(error => { console.error(error); process.exitCode=1; });
