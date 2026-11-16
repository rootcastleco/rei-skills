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
    cwd,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    timeout: 180000,
    shell: process.platform === "win32",
    env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
  });
  assert.equal(result.status, 0, [command, ...args].join(" ") + "\n" + result.stderr + "\n" + result.stdout);
  return result.stdout;
}

try {
  const pack = JSON.parse(run(npm, ["pack", "--ignore-scripts", "--json", "--pack-destination", tmp]))[0];
  const paths = new Set(pack.files.map((file) => file.path));
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
