"use strict";

// A read-only npm publication verifier. Never attempts to publish or retag.
const { setTimeout: sleep } = require("node:timers/promises");

const PACKAGE = "rei-skills";
const REGISTRY = "https://registry.npmjs.org";
const EXPECTED_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;

function validateRegistryResults(version, versionDoc, packageDoc) {
  if (versionDoc?.name !== PACKAGE || versionDoc?.version !== version) {
    return { ready: false, reason: "version metadata not indexed" };
  }
  if (!/^https:\/\/registry\.npmjs\.org\//.test(versionDoc?.dist?.tarball || "") ||
      !versionDoc.dist.integrity) {
    return { ready: false, reason: "tarball or integrity metadata missing" };
  }
  const latest = packageDoc?.["dist-tags"]?.latest ?? null;
  if (latest !== version) {
    return { ready: false, reason: "latest dist-tag is " + (latest || "missing") };
  }
  return { ready: true, reason: "version and latest tag match", tarball: versionDoc.dist.tarball };
}

async function getJson(url, fetchFn, signal) {
  const response = await fetchFn(url, {
    headers: { "Cache-Control": "no-cache", "Accept": "application/json" },
    signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("npm registry HTTP " + response.status);
  return await response.json();
}

async function checkPublishedVersion(version, fetchFn = fetch) {
  const nonce = Date.now().toString() + "-" + Math.random().toString(16).slice(2);
  const query = "?verify=" + nonce;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const [versionDoc, packageDoc] = await Promise.all([
      getJson(REGISTRY + "/" + PACKAGE + "/" + encodeURIComponent(version) + query, fetchFn, controller.signal),
      getJson(REGISTRY + "/" + PACKAGE + query, fetchFn, controller.signal),
    ]);
    return validateRegistryResults(version, versionDoc, packageDoc);
  } finally {
    clearTimeout(timeout);
  }
}

async function main(argv = process.argv.slice(2)) {
  const version = argv[0];
  if (!EXPECTED_VERSION.test(version || "")) {
    console.error("Usage: node scripts/verify-npm-release.js <exact-version> [--timeout-seconds=N]");
    process.exitCode = 2;
    return;
  }
  const timeoutArg = argv.find(x => x.startsWith("--timeout-seconds="));
  const waitSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 720;
  if (!Number.isInteger(waitSeconds) || waitSeconds < 0 || waitSeconds > 1800) {
    console.error("--timeout-seconds must be between 0 and 1800");
    process.exitCode = 2;
    return;
  }
  const deadline = Date.now() + waitSeconds * 1000;
  let attempt = 0;
  let result = { ready: false, reason: "unverified" };
  do {
    attempt++;
    try {
      result = await checkPublishedVersion(version);
      if (result.ready) {
        console.log("VERIFIED: " + PACKAGE + "@" + version + " is published and tagged latest.");
        console.log("Tarball: " + result.tarball);
        return;
      }
    } catch (error) {
      result = { ready: false, reason: "registry request failed: " + error.message };
    }
    console.log("PENDING: " + PACKAGE + "@" + version + " (check " + attempt + "; " + result.reason + ")");
    if (Date.now() >= deadline) break;
    await sleep(Math.min(15000, deadline - Date.now()));
  } while (Date.now() <= deadline);

  console.error("UNVERIFIED: npm did not index " + PACKAGE + "@" + version +
    " before the verification deadline (" + result.reason + ").");
  console.error("Do NOT repeat npm publish. Check the npm package settings or contact npm support with the original publish run.");
  process.exitCode = 1;
}

if (require.main === module) main().catch(error => {
  console.error("Registry verification failed: " + error.message);
  process.exitCode = 1;
});

module.exports = { validateRegistryResults, checkPublishedVersion };
