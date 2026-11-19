"use strict";

// Runs against the npm tarball, never the developer checkout.
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { gunzipSync } = require("node:zlib");
const { getReleaseScope, isExcludedPath, stageRelease } = require("../stage-npm-release");

const root = path.resolve(__dirname, "../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rei-npm-smoke-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    timeout: 180000,
    shell: process.platform === "win32" && command === npm,
    env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
  });
  assert.equal(result.status, 0, [command, ...args].join(" ") + "\n" + result.stderr + "\n" + result.stdout);
  return result.stdout;
}

try {
  const stage = path.join(tmp, "stage");
  stageRelease(stage);
  const pack = JSON.parse(run(npm, ["pack", "--ignore-scripts", "--json", "--pack-destination", tmp], stage))[0];
  const paths = new Set(pack.files.map((file) => file.path));
  const { catalog: sourceCatalog, excluded } = getReleaseScope();
  assert(![...paths].some(file => isExcludedPath(file, excluded)), "Tarball must exclude skill files and their resources");
  for (const skill of sourceCatalog.skills) {
    if (!excluded.has(skill.id)) assert(paths.has(skill.path), `Retained skill missing: ${skill.id}`);
  }
  const required = [
    "bin/install.js", "bin/mcp-server.js", "bin/prompt-agent.js", "lib/ai-adapters.js",
    "lib/smart-router.js", "lib/mcp-safe-install.js", "lib/prompt-archive.js",
    "data/catalog.json", "data/bundles.json", "data/workflows.json",
    "data/rei-rea-manifest.json", "skills/rei-rea-orchestrator/SKILL.md",
    "skills/docx-official/SKILL.md", "rust/rei-hook-gateway/Cargo.toml",
    "skills/rc-gnss-measurement-carrier-cycle-slip/SKILL.md",
    "skills/rc-rotor-mass-balance-two-plane-coupling/SKILL.md",
    "skills/rc-embedded-rtos-priority-inversion-analysis/SKILL.md",
    "skills/rc-fusion360-api-fusion-api-ecad-readonly/SKILL.md",
    "skills/rc-circuit-architecture-power-tree-budgeting/SKILL.md",
    "skills/rc-kicad-ecad-kicad-drc-ci/SKILL.md",
    "scripts/cad_ecad_verify.py",
    "examples/fusion360-readonly-inspector/FusionReadOnlyInspector/FusionReadOnlyInspector.py",
  ];
  for (const file of required) {
    assert(paths.has(file), "npm artifact missing: " + file);
  }
  assert(paths.size > 3500, "Expected the indexed skill library in the npm release");

  const archive = path.join(tmp, pack.filename);
  run(npm, [
    "install", "--ignore-scripts", "--no-save", "--no-audit", "--no-fund",
    "--prefix", tmp, archive,
  ], tmp);

  const installed = path.join(tmp, "node_modules", "rei-skills");
  const cli = path.join(installed, "bin", "install.js");
  const publicCatalog = require(path.join(installed, "data", "catalog.json"));
  const reviewedIndex = require(path.join(installed, "data", "external-reviewed.json"));
  const coverage = require(path.join(installed, "data", "external-review-coverage.json"));
  const evidence = require(path.join(installed, "data", "external-license-evidence.json"));
  const digest = contents => createHash("sha256").update(contents).digest("hex");
  assert.equal(publicCatalog.total, sourceCatalog.total - excluded.size + reviewedIndex.length);
  assert(publicCatalog.skills.every(item => item.risk !== "offensive" && !excluded.has(item.id)));
  const discovery = JSON.parse(run(process.execPath, [cli, "discover", "--stats"], tmp));
  assert.equal(discovery.externalCount, 29101);
  assert.equal(discovery.reviewedCount, reviewedIndex.length);
  const snapshot = fs.readFileSync(path.join(installed, "data", "external-discovery.jsonl.gz"));
  assert.equal(digest(snapshot), coverage.snapshotSha256);
  assert.equal(coverage.metadataScanned, discovery.externalCount);
  assert.equal(coverage.publishedReviewedTotal, reviewedIndex.length);
  const [, ...external] = gunzipSync(snapshot).toString("utf8").trimEnd().split("\n").map(JSON.parse);
  const externalById = new Map(external.map(item => [item.id, item]));
  const outcomes = gunzipSync(fs.readFileSync(path.join(root, coverage.recordOutcomes)))
    .toString("utf8").trimEnd().split("\n").map(JSON.parse);
  assert.equal(outcomes.length, external.length);
  assert.equal(new Set(outcomes.map(row => row.id)).size, external.length);
  const counts = {};
  for (const { id, status } of outcomes) {
    assert(externalById.has(id), "Unknown discovery ID in review outcomes");
    counts[status] = (counts[status] || 0) + 1;
  }
  assert.deepEqual(counts, coverage.outcomes);
  const linkedReviews = reviewedIndex.filter(item => item.discoveryId);
  const additions = linkedReviews.filter(item => item.introducedIn === coverage.release);
  const proofById = new Map(evidence.map(item => [item.id, item]));
  assert.equal(proofById.size, evidence.length);
  assert.equal(evidence.length, coverage.verifiedLicenseRecords);
  for (const proof of evidence) {
    assert(externalById.has(proof.id));
    assert.match(proof.licenseUrl, /^https:\/\/(?:github\.com|gitlab\.com|gitee\.com)\/.*\/blob\/[a-f0-9]{40}\//);
  }
  assert.equal(evidence.filter(item => !externalById.get(item.id).license).length, coverage.recoveredLicenseRecords);
  assert.deepEqual(new Set(linkedReviews.map(item => item.discoveryId)),
    new Set(outcomes.filter(row => row.status === "published").map(row => row.id)));
  assert.equal(additions.length, coverage.publishedAdditions);
  for (const item of reviewedIndex) {
    if (item.discoveryId) {
      const source = externalById.get(item.discoveryId);
      assert.equal(source.name, item.id);
      if (item.introducedIn) {
        const proof = proofById.get(item.discoveryId);
        assert.equal(proof.license, item.license);
        assert.equal(proof.licenseUrl, item.licenseUrl);
      } else {
        assert.equal(source.license, item.license);
      }
      if (item.previousSnapshotSha256) {
        assert.equal(item.previousSnapshotSha256, source.sha256);
        assert.notEqual(item.files["SKILL.md"], source.sha256);
      } else if (source.sha256) {
        assert.equal(item.files["SKILL.md"], source.sha256);
      }
    }
    for (const [file, hash] of Object.entries(item.files)) {
      assert(paths.has(`skills/${item.id}/${file}`));
      assert.equal(digest(fs.readFileSync(path.join(installed, "skills", item.id, file))), hash);
    }
  }
  const discoveryMatch = JSON.parse(run(process.execPath, [cli, "discover", "expo-dom", "--reviewed", "--json"], tmp));
  assert.equal(discoveryMatch.results[0].name, "expo-dom");
  const verifiedTarget = path.join(tmp, "reviewed-install");
  run(process.execPath, [cli, "add", "maui-safe-area", "--codex", "--path", verifiedTarget], tmp);
  assert(fs.existsSync(path.join(verifiedTarget, "maui-safe-area", "references", "safe-area-api.md")));
  assert(fs.existsSync(path.join(verifiedTarget, "maui-safe-area", "LICENSE")));
  for (const item of additions) {
    run(process.execPath, [cli, "add", item.id, "--codex", "--path", verifiedTarget], tmp);
    for (const [file, hash] of Object.entries(item.files)) {
      assert.equal(digest(fs.readFileSync(path.join(verifiedTarget, item.id, file))), hash);
    }
  }
  const recovered = additions.find(item => !externalById.get(item.discoveryId).license);
  assert.equal(additions.filter(item => !externalById.get(item.discoveryId).license).length,
    coverage.publishedRecoveredLicenses);
  if (recovered) {
    const results = JSON.parse(run(process.execPath, [cli, "discover", recovered.id, "--reviewed", "--json"], tmp));
    assert(results.results.some(row => row.id === recovered.discoveryId && row.npmSkill === recovered.id
      && row.license === recovered.license && row.licenseUrl === recovered.licenseUrl));
  }
  const remote = spawnSync(process.execPath, [cli, "add", "maui-safe-area", "--remote", "--path", verifiedTarget], { encoding: "utf8" });
  assert.equal(remote.status, 1);
  assert(remote.stderr.includes("installs its bundled skills"));
  for (const binary of ["rei-skills", "rei-skills-prompt"]) {
    const file = path.join(installed, "bin", binary === "rei-skills" ? "install.js" : "prompt-agent.js");
    if (process.platform !== "win32") {
      assert(fs.statSync(file).mode & 0o111, binary + " must be executable on Unix");
    }
    assert(fs.readFileSync(file, "utf8").startsWith("#!/usr/bin/env node"), binary + " must declare node shebang");
    const binaryResult = spawnSync(process.execPath, [file, "--help"], {
      cwd: tmp, encoding: "utf8", timeout: 30000,
    });
    assert.equal(binaryResult.status, 0, binary + " --help must work after npm install");
  }

  const mcp = require(path.join(installed, "bin", "mcp-server.js"));
  const response = mcp.handleJsonRpcRequest({
    jsonrpc: "2.0", method: "tools/list", id: 10, params: {},
  });
  const tools = response.result.tools.map((entry) => entry.name);
  assert.equal(tools.length, 10, "Packaged MCP must expose all ten tools");

  const skill = mcp.executeToolCall("rei_get_skill", { skill_id: "rei-rea-orchestrator" });
  assert(skill.skillMd.includes("rei-rea-orchestrator"));

  const catalog = mcp.executeToolCall("rei_search_skills", { query: "reverse engineering", limit: 2 });
  assert(catalog.totalMatches > 0, "Packaged MCP must load a populated catalog");

  const { resolveSkillSourceDir } = require(path.join(installed, "bin", "install.js"));
  const alias = resolveSkillSourceDir(path.join(installed, "skills"), "docx");
  assert(alias && fs.existsSync(path.join(alias, "SKILL.md")),
    "The packaged CLI must resolve aliases omitted by npm");

  const workspace = path.join(tmp, "workspace");
  fs.mkdirSync(workspace);
  const preview = mcp.executeToolCall("rei_install_skill", {
    target_name: "rei-rea-orchestrator",
    ai_assistant: "cursor",
    workspace_path: workspace,
    dry_run: true,
  });
  assert.equal(preview.status, "dry-run");
  assert.equal(preview.canInstall, true);
  assert.equal(fs.readdirSync(workspace).length, 0, "Preview must not mutate workspace");
  console.log("PASS: npm tarball includes runtime, catalog, skill tree, aliases and 10 working MCP tools.");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
