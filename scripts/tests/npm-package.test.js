"use strict";

// Runs against the npm tarball, never the developer checkout.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rei-npm-smoke-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd, encoding: "utf8", maxBuffer: 40 * 1024 * 1024,
    timeout: 180000, env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
  });
  assert.equal(result.status, 0, [command, ...args].join(" ") + "\n" + result.stderr + "\n" + result.stdout);
  return result.stdout;
}

try {
  const pack = JSON.parse(run(npm, ["pack", "--ignore-scripts", "--json", "--pack-destination", tmp]))[0];
  const paths = new Set(pack.files.map((file) => file.path));
  const required = [
    "bin/install.js", "bin/mcp-server.js", "lib/ai-adapters.js",
    "lib/smart-router.js", "lib/mcp-safe-install.js",
    "data/catalog.json", "data/bundles.json", "data/workflows.json",
    "data/rei-rea-manifest.json", "skills/rei-rea-orchestrator/SKILL.md",
    "skills/docx-official/SKILL.md",
  ];
  for (const file of required) {
    assert(paths.has(file), "npm artifact missing: " + file);
  }
  assert(paths.size > 800, "Expected the indexed skill library in the npm release");

  const archive = path.join(tmp, pack.filename);
  run(npm, [
    "install", "--ignore-scripts", "--no-save", "--no-audit", "--no-fund",
    "--prefix", tmp, archive,
  ], tmp);

  const installed = path.join(tmp, "node_modules", "rei-skills");
  const mcp = require(path.join(installed, "bin", "mcp-server.js"));
  const response = mcp.handleJsonRpcRequest({
    jsonrpc: "2.0", method: "tools/list", id: 10, params: {},
  });
  const tools = response.result.tools.map((entry) => entry.name);
  assert.equal(tools.length, 8, "Packaged MCP must expose all eight tools");

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
  console.log("PASS: npm tarball includes runtime, catalog, skill tree, aliases and 8 working MCP tools.");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
