"use strict";

// A read-only npm publication verifier. Never attempts to publish or retag.
const fs = require("node:fs");
const path = require("node:path");
const { setTimeout: sleep } = require("node:timers/promises");

const PACKAGE = "rei-skills";
const REGISTRY = "https://registry.npmjs.org";
const EXPECTED_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses `npm publish` output to extract immutable publication evidence
 * (exact package+version confirmation, Sigstore provenance URL, shasum/integrity,
 * and asynchronous registry indexing notices).
 */
function parsePublishEvidence(logText, version) {
  const text = String(logText || "");
  const versionPattern = new RegExp(`(?:^|\\n)\\s*\\+\\s+${escapeRegex(PACKAGE)}@${escapeRegex(version)}(?:\\s|$)`, "m");
  const published = versionPattern.test(text);

  const logIndexMatch = text.match(/https:\/\/search\.sigstore\.dev\/\?logIndex=\d+/);
  const hasProvenance = /Signed provenance statement/i.test(text) || Boolean(logIndexMatch);
  const shasumMatch = text.match(/npm notice shasum:\s*([a-f0-9]{40})/i);
  const integrityMatch = text.match(/npm notice integrity:\s*(sha\d+-[^\s]+)/i);
  const asyncProcessingNotice = /Your package is being processed and may take a few minutes/i.test(text);

  return {
    published,
    hasProvenance,
    logIndexUrl: logIndexMatch ? logIndexMatch[0] : null,
    shasum: shasumMatch ? shasumMatch[1] : null,
    integrity: integrityMatch ? integrityMatch[1] : null,
    asyncProcessingNotice,
  };
}

function validateRegistryResults(version, versionDoc, packageDoc) {
  const fallbackVersionDoc =
    !versionDoc &&
    packageDoc &&
    packageDoc.versions &&
    typeof packageDoc.versions === "object"
      ? packageDoc.versions[version] || null
      : null;
  const effectiveDoc = versionDoc || fallbackVersionDoc;

  if (!effectiveDoc || effectiveDoc.name !== PACKAGE || effectiveDoc.version !== version) {
    return { ready: false, fatal: false, status: "PENDING", reason: "version metadata not indexed" };
  }

  const tarball = effectiveDoc?.dist?.tarball || "";
  const integrity = effectiveDoc?.dist?.integrity || "";

  if (tarball && !/^https:\/\/registry\.npmjs\.org\//.test(tarball)) {
    return {
      ready: false,
      fatal: true,
      status: "INTEGRITY_ERROR",
      reason: "untrusted tarball origin: " + tarball,
    };
  }

  if (!tarball || !integrity) {
    return {
      ready: false,
      fatal: false,
      status: "PENDING",
      reason: "tarball or integrity metadata missing",
    };
  }

  const latest = packageDoc?.["dist-tags"]?.latest ?? null;
  if (latest !== version) {
    return {
      ready: false,
      fatal: false,
      status: "PENDING",
      reason: "latest dist-tag is " + (latest || "missing"),
    };
  }

  return {
    ready: true,
    fatal: false,
    status: "VERIFIED",
    reason: "version and latest tag match",
    tarball,
    integrity,
  };
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
    const versionUrlBase = REGISTRY + "/" + PACKAGE + "/" + encodeURIComponent(version);
    const packageUrlBase = REGISTRY + "/" + PACKAGE;
    let [versionDoc, packageDoc] = await Promise.all([
      getJson(versionUrlBase + query, fetchFn, controller.signal),
      getJson(packageUrlBase + query, fetchFn, controller.signal),
    ]);

    let result = validateRegistryResults(version, versionDoc, packageDoc);
    if (!result.ready && !result.fatal && !versionDoc) {
      versionDoc = await getJson(versionUrlBase, fetchFn, controller.signal);
      result = validateRegistryResults(version, versionDoc, packageDoc);
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

function getOptionValue(argv, prefix) {
  const eqArg = argv.find((x) => x.startsWith(prefix + "="));
  if (eqArg) return eqArg.slice(prefix.length + 1);
  const idx = argv.indexOf(prefix);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) {
    return argv[idx + 1];
  }
  return null;
}

function writeJsonReport(reportPath, payload) {
  if (!reportPath) return;
  const resolved = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function main(argv = process.argv.slice(2), deps = {}) {
  const fetchFn = deps.fetchFn || fetch;
  const version = argv[0];
  if (!EXPECTED_VERSION.test(version || "")) {
    console.error(
      "Usage: node scripts/verify-npm-release.js <exact-version> [--timeout-seconds=N] [--publish-log=PATH] [--allow-pending-after-publish] [--json-report=PATH]"
    );
    process.exitCode = 2;
    return 2;
  }

  const timeoutRaw = getOptionValue(argv, "--timeout-seconds");
  const waitSeconds = timeoutRaw !== null ? Number(timeoutRaw) : 720;
  if (!Number.isInteger(waitSeconds) || waitSeconds < 0 || waitSeconds > 1800) {
    console.error("--timeout-seconds must be between 0 and 1800");
    process.exitCode = 2;
    return 2;
  }

  const publishLogPath = getOptionValue(argv, "--publish-log");
  const allowPendingAfterPublish = argv.includes("--allow-pending-after-publish");
  const jsonReportPath = getOptionValue(argv, "--json-report");

  let publishEvidence = {
    published: false,
    hasProvenance: false,
    logIndexUrl: null,
    shasum: null,
    integrity: null,
    asyncProcessingNotice: false,
  };
  if (publishLogPath && fs.existsSync(publishLogPath)) {
    publishEvidence = parsePublishEvidence(fs.readFileSync(publishLogPath, "utf8"), version);
  }

  const deadline = Date.now() + waitSeconds * 1000;
  let attempt = 0;
  let result = { ready: false, fatal: false, status: "PENDING", reason: "unverified" };

  do {
    attempt++;
    try {
      result = await checkPublishedVersion(version, fetchFn);
      if (result.fatal) {
        console.error("INTEGRITY_ERROR: " + PACKAGE + "@" + version + " failed verification (" + result.reason + ").");
        writeJsonReport(jsonReportPath, {
          package: PACKAGE,
          version,
          status: result.status || "INTEGRITY_ERROR",
          reason: result.reason,
          attempts: attempt,
          publishEvidence,
          republishAllowed: false,
          verifiedAt: new Date().toISOString(),
        });
        process.exitCode = 1;
        return 1;
      }
      if (result.ready) {
        console.log("VERIFIED: " + PACKAGE + "@" + version + " is published and tagged latest.");
        console.log("Tarball: " + result.tarball);
        writeJsonReport(jsonReportPath, {
          package: PACKAGE,
          version,
          status: "VERIFIED",
          tarball: result.tarball,
          integrity: result.integrity || null,
          attempts: attempt,
          publishEvidence,
          republishAllowed: false,
          verifiedAt: new Date().toISOString(),
        });
        process.exitCode = 0;
        return 0;
      }
    } catch (error) {
      result = { ready: false, fatal: false, status: "PENDING", reason: "registry request failed: " + error.message };
    }
    console.log("PENDING: " + PACKAGE + "@" + version + " (check " + attempt + "; " + result.reason + ")");
    if (Date.now() >= deadline) break;
    await sleep(Math.min(15000, deadline - Date.now()));
  } while (Date.now() <= deadline);

  if (allowPendingAfterPublish && publishEvidence.published) {
    const msg =
      "PUBLISHED_INDEXING_PENDING: " + PACKAGE + "@" + version +
      " was accepted by npm (shasum=" + (publishEvidence.shasum || "present") +
      ", provenance=" + publishEvidence.hasProvenance +
      "), but public CDN indexing is still asynchronous (" + result.reason + ").";
    console.log(msg);
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log("::warning::" + msg + " Do NOT repeat npm publish.");
    }
    writeJsonReport(jsonReportPath, {
      package: PACKAGE,
      version,
      status: "PUBLISHED_INDEXING_PENDING",
      lastCheckReason: result.reason,
      attempts: attempt,
      publishEvidence,
      republishAllowed: false,
      verifiedAt: new Date().toISOString(),
    });
    process.exitCode = 0;
    return 0;
  }

  console.error(
    "UNVERIFIED: npm did not index " + PACKAGE + "@" + version +
    " before the verification deadline (" + result.reason + ")."
  );
  console.error("Do NOT repeat npm publish. Check the npm package settings or contact npm support with the original publish run.");
  writeJsonReport(jsonReportPath, {
    package: PACKAGE,
    version,
    status: "UNVERIFIED",
    lastCheckReason: result.reason,
    attempts: attempt,
    publishEvidence,
    republishAllowed: false,
    verifiedAt: new Date().toISOString(),
  });
  process.exitCode = 1;
  return 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Registry verification failed: " + error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  validateRegistryResults,
  checkPublishedVersion,
  parsePublishEvidence,
  main,
};
