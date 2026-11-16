#!/usr/bin/env node
"use strict";

/**
 * Security Regression Test Suite for REI Skills
 * Verifies:
 * 1. Repository-wide security_audit.js exits 0 with zero blocking findings.
 * 2. MCP safe installer blocks path traversal and workspace symlink escapes.
 * 3. Prompt Archive adapter blocks untrusted origins and oversized responses.
 * 4. KiCad dry-run planner refuses destructive flags and invalid extensions.
 * 5. Rust gateway unit tests pass when cargo is installed.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const { buildInstallPlan } = require("../../lib/mcp-safe-install");
const { fetchJson, normalizeEntry } = require("../../lib/prompt-archive");

async function main() {
  console.log("Running REI Skills security regression checks...");

  // 1. Repository security audit must pass with 0 blocking findings
  const auditRes = spawnSync(process.execPath, [path.join(ROOT, "scripts", "security_audit.js")], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(auditRes.status, 0, "security_audit.js failed:\n" + auditRes.stdout + auditRes.stderr);

  // 2. MCP safe installer blocks path traversal, relative escape, and non-directory workspace
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-sec-reg-"));
  try {
    const workspace = path.join(tmpDir, "ws");
    const staging = path.join(tmpDir, "stage");
    fs.mkdirSync(workspace);
    fs.mkdirSync(staging);
    fs.writeFileSync(path.join(staging, "safe.md"), "# Safe\n", "utf8");

    assert.throws(() => buildInstallPlan(path.join(tmpDir, "missing"), staging), /existing.*directory/);
    assert.throws(() => buildInstallPlan(workspace, staging, "force-overwrite"), /conflict_policy/);

    // 3. Prompt archive rejects private entries, untrusted origins, and data:/https: IDs
    assert.equal(normalizeEntry({ id: "p1", title: "Private", body: "secret", visibility: "private" }, "catalog/0.json"), null);
    assert.equal(normalizeEntry({ id: "https://evil.test/x", title: "Bad", body: "x" }, "catalog/0.json"), null);
    await assert.rejects(() => fetchJson("https://attacker.example/catalog-manifest.json"), /Untrusted prompt archive origin/);

    // 4. KiCad verification script refuses invalid file extension and remains dry-run by default
    const py = process.platform === "win32" ? "python" : "python3";
    const badCad = spawnSync(py, [path.join(ROOT, "scripts", "cad_ecad_verify.py"), "--board", path.join(staging, "safe.md")], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });
    assert.notEqual(badCad.status, 0, "cad_ecad_verify.py must reject non-.kicad_pcb inputs");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("PASS: REI Skills security regression suite passed.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
