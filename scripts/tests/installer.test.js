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

const CLI_PATH = path.resolve(__dirname, "../../bin/install.js");
const REPO_SKILLS = path.resolve(__dirname, "../../skills");

console.log("Running REI Skill Manager & Installer safety tests...");

// 1. Test CLI argument parsing
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

console.log("✅ All REI Skill Manager & Installer safety tests passed!");
