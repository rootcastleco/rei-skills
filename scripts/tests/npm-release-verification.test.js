"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  validateRegistryResults,
  checkPublishedVersion,
  parsePublishEvidence,
  main: verifyMain,
} = require("../verify-npm-release");

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

async function runTests() {
  // 1. Existing registry result validation contracts
  assert.equal(validateRegistryResults("6.2.0", payload(), { "dist-tags": { latest: "6.2.0" } }).ready, true);
  assert.equal(validateRegistryResults("6.2.0", payload("1.0.0"), { "dist-tags": { latest: "6.2.0" } }).ready, false);
  assert.equal(validateRegistryResults("6.2.0", payload(), { "dist-tags": { latest: "1.0.0" } }).ready, false);
  assert.equal(validateRegistryResults("6.2.0", { name: "rei-skills", version: "6.2.0" }, { "dist-tags": { latest: "6.2.0" } }).ready, false);

  // 2. Integrity error fails fast when tarball origin is untrusted
  const badOrigin = validateRegistryResults(
    "6.2.0",
    { ...payload(), dist: { tarball: "http://evil.example/bad.tgz", integrity: "sha512-fake" } },
    { "dist-tags": { latest: "6.2.0" } }
  );
  assert.equal(badOrigin.ready, false);
  assert.equal(badOrigin.fatal, true);
  assert.equal(badOrigin.status, "INTEGRITY_ERROR");

  // 3. Fallback to packageDoc.versions[version] when per-version endpoint lags with 404
  const pkgFallback = validateRegistryResults(
    "6.4.0",
    null,
    {
      "dist-tags": { latest: "6.4.0" },
      versions: { "6.4.0": payload("6.4.0") },
    }
  );
  assert.equal(pkgFallback.ready, true);
  assert.equal(pkgFallback.status, "VERIFIED");

  // 4. checkPublishedVersion query behavior and HTTP error handling
  let requests = 0;
  const ready = await checkPublishedVersion("6.2.0", async (url, opts) => {
    requests++;
    assert.equal(opts.headers["Cache-Control"], "no-cache");
    return {
      ok: true,
      status: 200,
      json: async () => (url.includes("/6.2.0?") ? payload() : { "dist-tags": { latest: "6.2.0" } }),
    };
  });
  assert.equal(ready.ready, true);
  assert.equal(requests, 2);

  const missing = await checkPublishedVersion("6.2.0", async (url) => {
    return url.includes("/6.2.0?")
      ? { ok: false, status: 404 }
      : { ok: true, status: 200, json: async () => ({ "dist-tags": { latest: "1.0.0" } }) };
  });
  assert.equal(missing.ready, false);

  await assert.rejects(
    () => checkPublishedVersion("6.2.0", async () => ({ ok: false, status: 503 })),
    /npm registry HTTP 503/
  );

  // 5. Real GitHub Actions rei-skills@6.4.0 publish log parsing
  const realPublishLog = [
    "npm notice package size: 23.2 MB",
    "npm notice unpacked size: 47.9 MB",
    "npm notice shasum: 58aa4903bb8db5eddeb3988db48c788d74363fb5",
    "npm notice integrity: sha512-vKuiov0TK4h+1[...]yY49dzCd3w2iw==",
    "npm notice total files: 4223",
    "npm notice Publishing to https://registry.npmjs.org/ with tag latest and public access",
    "npm notice publish Signed provenance statement with source and build information from GitHub Actions",
    "npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=3921507629",
    "npm notice Your package is being processed and may take a few minutes to become available.",
    "+ rei-skills@6.4.0",
  ].join("\n");

  const ev = parsePublishEvidence(realPublishLog, "6.4.0");
  assert.equal(ev.published, true);
  assert.equal(ev.hasProvenance, true);
  assert.equal(ev.logIndexUrl, "https://search.sigstore.dev/?logIndex=3921507629");
  assert.equal(ev.shasum, "58aa4903bb8db5eddeb3988db48c788d74363fb5");
  assert.equal(ev.asyncProcessingNotice, true);
  assert.equal(parsePublishEvidence(realPublishLog, "6.5.0").published, false);

  // 6. End-to-end main(): separate publication evidence from eventual CDN indexing
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-npm-verify-"));
  try {
    const logFile = path.join(tmpDir, "npm-publish.log");
    const reportPending = path.join(tmpDir, "pending-report.json");
    const reportFail = path.join(tmpDir, "fail-report.json");
    fs.writeFileSync(logFile, realPublishLog, "utf8");

    const notIndexedFetch = async () => ({ ok: false, status: 404 });

    // Valid publish evidence + --allow-pending-after-publish => exit 0 (never trigger republish)
    const pendingCode = await verifyMain(
      [
        "6.4.0",
        "--timeout-seconds=0",
        "--publish-log=" + logFile,
        "--allow-pending-after-publish",
        "--json-report=" + reportPending,
      ],
      { fetchFn: notIndexedFetch }
    );
    assert.equal(pendingCode, 0);
    const pendingJson = JSON.parse(fs.readFileSync(reportPending, "utf8"));
    assert.equal(pendingJson.status, "PUBLISHED_INDEXING_PENDING");
    assert.equal(pendingJson.republishAllowed, false);
    assert.equal(pendingJson.publishEvidence.published, true);

    // Without publish evidence => exit 1 (UNVERIFIED)
    const unverifiedCode = await verifyMain(
      [
        "6.4.0",
        "--timeout-seconds=0",
        "--allow-pending-after-publish",
        "--json-report=" + reportFail,
      ],
      { fetchFn: notIndexedFetch }
    );
    assert.equal(unverifiedCode, 1);
    const failJson = JSON.parse(fs.readFileSync(reportFail, "utf8"));
    assert.equal(failJson.status, "UNVERIFIED");
    assert.equal(failJson.republishAllowed, false);

    // Reset process.exitCode after simulated failure test
    process.exitCode = 0;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("npm release verification tests passed.");
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
