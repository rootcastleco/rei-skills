const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  parseArgs,
  defaultDir,
  isLegacyReiSkillsRepo,
  resolveSkillSourceDir,
} = require("../../bin/install");
const { AI_TARGETS, transpileSkillContent } = require("../../lib/ai-adapters");

const CLI_PATH = path.resolve(__dirname, "../../bin/install.js");
const REPO_SKILLS = path.resolve(__dirname, "../../skills");

console.log("Running REI Skill Manager, Smart Router, MCP Server, Universal AI Compiler & Installer safety tests...");

// 1. Test CLI argument parsing across multiple AI targets
{
  const opts1 = parseArgs(["--claude", "--dry-run"]);
  assert.strictEqual(opts1.command, "install");
  assert.strictEqual(opts1.claude, true);
  assert.strictEqual(opts1.dryRun, true);
  assert(defaultDir(opts1).endsWith(path.join(".claude", "skills")));

  const opts2 = parseArgs(["search", "firmware", "--category", "reverse-engineering", "--json"]);
  assert.strictEqual(opts2.command, "search");
  assert.deepStrictEqual(opts2.positional, ["firmware"]);
  assert.strictEqual(opts2.categoryArg, "reverse-engineering");
  assert.strictEqual(opts2.json, true);

  // Verify all 21 AI targets are registered and parseable via flags
  assert(Object.keys(AI_TARGETS).length >= 21, "Expected at least 21 AI targets");
  for (const targetId of ["copilot", "windsurf", "cline", "roocode", "continue", "aider", "amazonq", "zed", "goose", "trae", "junie", "opencode", "kiro", "amp", "devin", "sdk"]) {
    const parsed = parseArgs([`--${targetId}`, "--workspace"]);
    assert.strictEqual(parsed[targetId], true, `Flag --${targetId} should set opts.${targetId}`);
    assert.strictEqual(parsed.targetAi, targetId);
  }
}

// 2. Test Windows symlink / text-pointer resolution for docx, pdf, pptx, xlsx
{
  for (const alias of ["docx", "pdf", "pptx", "xlsx"]) {
    const resolved = resolveSkillSourceDir(REPO_SKILLS, alias);
    assert(resolved, `Failed to resolve ${alias}`);
    assert(
      fs.existsSync(path.join(resolved, "SKILL.md")),
      `Resolved ${alias} does not contain SKILL.md`,
    );
  }
}

// 3. Test CRITICAL safety gate: never delete or overwrite an unrelated Git repository
{
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), "rei-test-unrelated-git-"));
  try {
    spawnSync("git", ["init", tmpRepo]);
    spawnSync("git", ["-C", tmpRepo, "remote", "add", "origin", "https://github.com/example/user-project.git"]);
    const userFile = path.join(tmpRepo, "important-source.js");
    fs.writeFileSync(userFile, "console.log('do not delete');\n", "utf8");

    assert.strictEqual(isLegacyReiSkillsRepo(tmpRepo), false);

    const res = spawnSync(process.execPath, [CLI_PATH, "install", "--path", tmpRepo, "--local"], {
      encoding: "utf8",
    });

    assert.notStrictEqual(res.status, 0, "Installer must fail with non-zero exit code on unrelated .git repo");
    assert(fs.existsSync(userFile), "Unrelated user file must be preserved");
    assert(fs.existsSync(path.join(tmpRepo, ".git")), "Unrelated .git directory must be preserved");
  } finally {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  }
}

// 4. Test safe installation of REI REA pack, symlink materialization, and MCP config backup
{
  const tmpTarget = fs.mkdtempSync(path.join(os.tmpdir(), "rei-test-install-"));
  try {
    const existingNote = path.join(tmpTarget, "user-note.md");
    fs.writeFileSync(existingNote, "# User Note\n", "utf8");

    const mcpConfigPath = path.join(tmpTarget, "mcp_config.json");
    fs.writeFileSync(
      mcpConfigPath,
      JSON.stringify({ mcpServers: { existingServer: { command: "node", args: ["server.js"] } } }, null, 2),
      "utf8",
    );

    // Install rei-rea pack + update MCP config
    const res1 = spawnSync(
      process.execPath,
      [CLI_PATH, "add", "rei-rea", "--path", tmpTarget, "--mcp-config", mcpConfigPath, "--local"],
      { encoding: "utf8" },
    );
    assert.strictEqual(res1.status, 0, `add rei-rea failed: ${res1.stderr}`);
    assert(fs.existsSync(existingNote), "Unexpected existing file must be preserved");
    assert(fs.existsSync(path.join(tmpTarget, "rei-rea-orchestrator", "SKILL.md")));
    assert(fs.existsSync(path.join(tmpTarget, "rei-binary-intelligence", "SKILL.md")));

    const updatedMcp = JSON.parse(fs.readFileSync(mcpConfigPath, "utf8"));
    assert(updatedMcp.mcpServers.existingServer, "Existing MCP server must be preserved");
    assert.strictEqual(updatedMcp.mcpServers["rei-skills"].command, "npx");
    assert.strictEqual(updatedMcp.mcpServers["rei-rea"].command, "rei-rea");

    const backups = fs.readdirSync(tmpTarget).filter((f) => f.startsWith("mcp_config.json.bak."));
    assert(backups.length >= 1, "MCP config backup must be created before modification");

    // Materialize symlinked skill 'docx'
    const res2 = spawnSync(
      process.execPath,
      [CLI_PATH, "add", "docx", "--path", tmpTarget, "--local"],
      { encoding: "utf8" },
    );
    assert.strictEqual(res2.status, 0, `add docx failed: ${res2.stderr}`);
    assert(
      fs.existsSync(path.join(tmpTarget, "docx", "SKILL.md")),
      "Symlinked skill 'docx' must be materialized with a real SKILL.md on Windows/Linux/macOS",
    );
  } finally {
    fs.rmSync(tmpTarget, { recursive: true, force: true });
  }
}

// 5. Test Universal AI Compiler formats, Smart Router, and MCP Server
{
  const tmpExport = fs.mkdtempSync(path.join(os.tmpdir(), "rei-test-export-"));
  try {
    // Test Cursor .mdc export
    const mdcDir = path.join(tmpExport, "cursor-mdc");
    const resMdc = spawnSync(
      process.execPath,
      [CLI_PATH, "export", "--format", "cursor-mdc", "--filter", "rei-rea-orchestrator", "--output", mdcDir],
      { encoding: "utf8" },
    );
    assert.strictEqual(resMdc.status, 0, `export cursor-mdc failed: ${resMdc.stderr}`);
    const mdcContent = fs.readFileSync(path.join(mdcDir, "rei-rea-orchestrator.mdc"), "utf8");
    assert(mdcContent.includes("alwaysApply: false"), "Cursor .mdc must contain alwaysApply frontmatter");

    // Test GitHub Copilot .instructions.md export
    const copilotDir = path.join(tmpExport, "copilot");
    const resCopilot = spawnSync(
      process.execPath,
      [CLI_PATH, "export", "--format", "copilot-instructions", "--filter", "rei-rea-orchestrator", "--output", copilotDir],
      { encoding: "utf8" },
    );
    assert.strictEqual(resCopilot.status, 0, `export copilot-instructions failed: ${resCopilot.stderr}`);
    const copilotContent = fs.readFileSync(path.join(copilotDir, "rei-rea-orchestrator.instructions.md"), "utf8");
    assert(copilotContent.includes('applyTo: "**"'), "Copilot instructions must contain applyTo frontmatter");

    // Test SDK JSON export (OpenAI / Anthropic / Gemini tool definitions)
    const sdkDir = path.join(tmpExport, "sdk");
    const resSdk = spawnSync(
      process.execPath,
      [CLI_PATH, "export", "--format", "sdk-json", "--filter", "rei-rea-orchestrator", "--output", sdkDir],
      { encoding: "utf8" },
    );
    assert.strictEqual(resSdk.status, 0, `export sdk-json failed: ${resSdk.stderr}`);
    const sdkPayload = JSON.parse(fs.readFileSync(path.join(sdkDir, "rei-rea-orchestrator.json"), "utf8"));
    assert(sdkPayload.openai_function, "SDK JSON must include openai_function schema");
    assert(sdkPayload.anthropic_tool, "SDK JSON must include anthropic_tool schema");
    assert(sdkPayload.gemini_function_declaration, "SDK JSON must include gemini_function_declaration schema");

    // Test targets JSON output
    const resTargets = spawnSync(process.execPath, [CLI_PATH, "targets", "--json"], { encoding: "utf8" });
    assert.strictEqual(resTargets.status, 0);
    const targetsData = JSON.parse(resTargets.stdout);
    assert(targetsData.total >= 21);

    // Test Smart Intent & Stack Router (English + Turkish + file extensions)
    const resRec = spawnSync(
      process.execPath,
      [CLI_PATH, "recommend", "Android APK ve firmware tersine mühendislik analizi", "--files", "app.apk,router.bin", "--json"],
      { encoding: "utf8" },
    );
    assert.strictEqual(resRec.status, 0, `recommend command failed: ${resRec.stderr}`);
    const recData = JSON.parse(resRec.stdout);
    assert(Array.isArray(recData.recommendedSkills) && recData.recommendedSkills.length > 0, "Smart router must return recommendedSkills");
    const recIds = recData.recommendedSkills.map((s) => s.id);
    assert(recIds.includes("rei-android-apks") || recIds.includes("rei-firmware-and-iot"), "Smart router must match APK or Firmware skills");
    assert(Array.isArray(recData.query.extractedTokens) && recData.query.extractedTokens.length >= 2, "Smart router must extract intent & stack tokens");

    // Test REI Skills MCP Server JSON-RPC 2.0 handler
    const { handleJsonRpcRequest } = require("../../bin/mcp-server");
    const initRes = handleJsonRpcRequest({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    assert.strictEqual(initRes.result.serverInfo.name, "rei-skills-mcp");

    const toolsRes = handleJsonRpcRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    assert(toolsRes.result.tools.length >= 8, "MCP server must expose at least 8 tools");

    const callRecRes = handleJsonRpcRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "rei_recommend_skills",
        arguments: {
          task: "Analyze WebAssembly binary and verify clean-room parity",
          workspace_files: ["sample_v1.wasm", "sample_v2.wasm"],
          top_k: 4,
        },
      },
    });
    assert(!callRecRes.result.isError, "MCP rei_recommend_skills call should succeed");
    const mcpRecPayload = JSON.parse(callRecRes.result.content[0].text);
    assert(mcpRecPayload.recommendedSkills.some((s) => s.id === "rei-wasm-and-managed"));

    const callSkillRes = handleJsonRpcRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "rei_get_skill",
        arguments: { id: "rei-rea-orchestrator" },
      },
    });
    assert(!callSkillRes.result.isError, "MCP rei_get_skill should succeed");
    assert(callSkillRes.result.content[0].text.includes("rei-rea-orchestrator"));
  } finally {
    fs.rmSync(tmpExport, { recursive: true, force: true });
  }
}

console.log("✅ All REI Skill Manager, Smart Router, MCP Server, Universal AI Compiler & Installer safety tests passed!");
