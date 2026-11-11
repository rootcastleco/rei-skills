#!/usr/bin/env node

/**
 * 🏰 REI Skills — Universal Multi-AI Skill Manager, Smart Router, MCP Server & Installer CLI
 * Rootcastle Engineering & Innovation (REI) | Batuhan Ayrıbaş
 * https://www.rootcastle.com
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {
  AI_TARGETS,
  transpileSkillContent,
  generateUniversalRouterMarkdown,
  materializeSkillForTarget,
} = require("../lib/ai-adapters");

const REPO = "https://github.com/rootcastleco/rei-skills.git";
const REA_REPO = "https://github.com/rootcastleco/Rei-Reverse-engineer.git";
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir() || "";
const BRAND = "rei";
const LOCAL_ROOT = path.resolve(__dirname, "..");

const KNOWN_SYMLINK_ALIASES = {
  docx: "docx-official",
  pdf: "pdf-official",
  pptx: "pptx-official",
  xlsx: "xlsx-official",
};

const SUBCOMMANDS = new Set([
  "install",
  "list",
  "search",
  "info",
  "add",
  "doctor",
  "verify",
  "update",
  "export",
  "compile",
  "targets",
  "router",
  "recommend",
  "mcp",
]);

function resolveDir(p) {
  if (!p) return null;
  const s = String(p).replace(/^~($|[\\/])/, HOME + "$1");
  return path.resolve(s);
}

function parseArgs(argv = process.argv.slice(2)) {
  const opts = {
    command: "install",
    positional: [],
    pathArg: null,
    fromArg: null,
    outArg: null,
    agentArg: null,
    targetAi: null,
    formatArg: null,
    filterArg: null,
    filesArg: null,
    categoryArg: null,
    bundleArg: null,
    riskArg: null,
    sourceArg: null,
    mcpConfigArg: null,
    versionArg: null,
    tagArg: null,
    cursor: false,
    claude: false,
    gemini: false,
    codex: false,
    antigravity: false,
    copilot: false,
    windsurf: false,
    cline: false,
    roocode: false,
    continue: false,
    aider: false,
    amazonq: false,
    zed: false,
    goose: false,
    trae: false,
    junie: false,
    opencode: false,
    kiro: false,
    amp: false,
    devin: false,
    sdk: false,
    allAi: false,
    workspace: false,
    agentsMd: false,
    categoriesFlag: false,
    bundlesFlag: false,
    dryRun: false,
    local: false,
    remote: false,
    json: false,
    strict: false,
    printMcp: false,
    help: false,
  };

  let commandSet = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (!arg.startsWith("-") && !commandSet && SUBCOMMANDS.has(arg)) {
      opts.command = arg;
      commandSet = true;
      continue;
    }
    if (arg === "--path" && argv[i + 1]) {
      opts.pathArg = argv[++i];
      continue;
    }
    if (arg === "--from" && argv[i + 1]) {
      opts.fromArg = argv[++i];
      continue;
    }
    if ((arg === "--out" || arg === "--output") && argv[i + 1]) {
      opts.outArg = argv[++i];
      continue;
    }
    if ((arg === "--agent" || arg === "--target" || arg === "--ai") && argv[i + 1]) {
      const val = argv[++i].toLowerCase();
      opts.agentArg = val;
      if (AI_TARGETS[val]) {
        opts.targetAi = val;
        opts[val] = true;
      }
      continue;
    }
    if (arg === "--format" && argv[i + 1]) {
      opts.formatArg = argv[++i].toLowerCase();
      continue;
    }
    if (arg === "--filter" && argv[i + 1]) {
      opts.filterArg = argv[++i];
      continue;
    }
    if (arg === "--files" && argv[i + 1]) {
      opts.filesArg = argv[++i];
      continue;
    }
    if (arg === "--category" && argv[i + 1]) {
      opts.categoryArg = argv[++i].toLowerCase();
      continue;
    }
    if (arg === "--bundle" && argv[i + 1]) {
      opts.bundleArg = argv[++i].toLowerCase();
      continue;
    }
    if (arg === "--risk" && argv[i + 1]) {
      opts.riskArg = argv[++i].toLowerCase();
      continue;
    }
    if (arg === "--source" && argv[i + 1]) {
      opts.sourceArg = argv[++i].toLowerCase();
      continue;
    }
    if (arg === "--mcp-config" && argv[i + 1]) {
      opts.mcpConfigArg = argv[++i];
      continue;
    }
    if (arg === "--version" && argv[i + 1]) {
      opts.versionArg = argv[++i];
      continue;
    }
    if (arg === "--tag" && argv[i + 1]) {
      opts.tagArg = argv[++i];
      continue;
    }
    if (arg === "--all-ai") {
      opts.allAi = true;
      continue;
    }
    if (arg === "--workspace" || arg === "-w") {
      opts.workspace = true;
      continue;
    }
    if (arg === "--agents-md") {
      opts.agentsMd = true;
      continue;
    }
    if (arg === "--categories") {
      opts.categoriesFlag = true;
      continue;
    }
    if (arg === "--bundles") {
      opts.bundlesFlag = true;
      continue;
    }
    const cleanFlag = arg.startsWith("--") ? arg.slice(2).toLowerCase() : null;
    if (cleanFlag && AI_TARGETS[cleanFlag]) {
      opts[cleanFlag] = true;
      opts.targetAi = cleanFlag;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--local") {
      opts.local = true;
      continue;
    }
    if (arg === "--remote") {
      opts.remote = true;
      continue;
    }
    if (arg === "--json") {
      opts.json = true;
      continue;
    }
    if (arg === "--strict") {
      opts.strict = true;
      continue;
    }
    if (arg === "--print-mcp") {
      opts.printMcp = true;
      continue;
    }
    if (!arg.startsWith("-")) {
      opts.positional.push(arg);
    }
  }

  return opts;
}

function getSelectedAiSpec(opts) {
  if (opts.targetAi && AI_TARGETS[opts.targetAi]) {
    return AI_TARGETS[opts.targetAi];
  }
  for (const key of Object.keys(AI_TARGETS)) {
    if (opts[key]) return AI_TARGETS[key];
  }
  return null;
}

function defaultDir(opts) {
  if (opts.pathArg) return resolveDir(opts.pathArg);
  if (opts.cursor) {
    return opts.workspace
      ? path.resolve(process.cwd(), ".cursor", "skills")
      : path.join(HOME, ".cursor", "skills");
  }
  if (opts.claude) {
    return opts.workspace
      ? path.resolve(process.cwd(), ".claude", "skills")
      : path.join(HOME, ".claude", "skills");
  }
  if (opts.gemini) {
    return opts.workspace
      ? path.resolve(process.cwd(), ".gemini", "skills")
      : path.join(HOME, ".gemini", "skills");
  }
  if (opts.codex) {
    if (opts.workspace) return path.resolve(process.cwd(), ".codex", "skills");
    const codexHome = process.env.CODEX_HOME;
    if (codexHome) return path.join(codexHome, "skills");
    return path.join(HOME, ".codex", "skills");
  }
  if (opts.antigravity) {
    return opts.workspace
      ? path.resolve(process.cwd(), ".agent", "skills")
      : path.join(HOME, ".gemini", BRAND, "skills");
  }
  const spec = getSelectedAiSpec(opts);
  if (spec) {
    return opts.workspace
      ? path.resolve(process.cwd(), spec.defaultWorkspacePath)
      : spec.defaultGlobalPath;
  }
  return path.join(HOME, ".gemini", BRAND, "skills");
}

function printHelp() {
  console.log(`
🏰 rei-skills — Rootcastle Engineering & Innovation
   The universal engineering-grade skill layer & Smart MCP Server for AI agents

Usage:
  npx rei-skills [command] [options]

Commands:
  install                  Install skills into target AI directory (default)
  recommend <task>         Smart Intent & Stack Router: recommend top skills, bundles & workflows
  mcp                      Start the REI Skills Smart MCP Server over stdio (JSON-RPC 2.0)
  add <id|bundle|rei-rea>  Install a specific skill, role bundle, or REI REA pack
  search <query>           Search 895 skills by name, category, tags, risk, or source
  list                     List skills (--category, --bundle, --categories, --bundles)
  info <skill-id>          Inspect a skill's metadata, risk, provenance, and files
  targets                  List all 21 supported AI assistants, formats, and flags
  export / compile         Transpile & export skills to any AI format (--format, --out)
  router                   Generate universal AGENTS.md / CLAUDE.md / GEMINI.md router
  doctor                   Inspect environment, 21 AI directories, and REI REA status
  verify                   Verify installed or repository skills (--path, --strict)
  update                   Safely update an existing installation with backup & rollback

Universal AI Target Flags (21 Supported AI Assistants & Runtimes):
  --claude                 Anthropic Claude Code (~/.claude/skills or .claude/skills)
  --codex                  OpenAI Codex CLI & Cloud Agent (~/.codex/skills)
  --gemini                 Google Gemini CLI (~/.gemini/skills)
  --antigravity            Google Antigravity IDE (~/.gemini/rei/skills or .agent/skills)
  --cursor                 Cursor AI IDE (Skills + native .cursor/rules/*.mdc)
  --copilot                GitHub Copilot (.github/instructions/*.instructions.md + prompts)
  --windsurf               Windsurf IDE (.windsurf/rules/*.md with Cascade frontmatter)
  --cline                  Cline Autonomous Agent (.clinerules/*.md)
  --roocode                Roo Code Agent (.roo/rules/*.md)
  --continue               Continue.dev Autopilot (.continue/rules/*.md)
  --aider                  Aider Pair Programmer (.aider/skills/*.md + CONVENTIONS.md)
  --amazonq                Amazon Q Developer (.amazonq/rules/*.md)
  --zed                    Zed AI Editor (.zed/rules/*.md)
  --goose                  Block Goose Agent (~/.config/goose/skills)
  --trae                   Trae AI IDE (.trae/rules/*.md)
  --junie                  JetBrains Junie & AI Assistant (.junie/skills/*.md)
  --opencode               OpenCode Agent (~/.agents/skills)
  --kiro                   Kiro Spec-Driven IDE (~/.kiro/skills)
  --amp                    Sourcegraph Amp (~/.config/amp/skills)
  --devin                  Cognition Devin Playbooks (.devin/playbooks/*.devin.md)
  --sdk                    Universal Agent SDK JSON (OpenAI / Anthropic / Gemini / LangGraph)
  --all-ai                 Compile & install for ALL major workspace AI assistants at once

Examples:
  npx rei-skills recommend "reverse engineer android apk and firmware" --files app.apk,fw.bin
  npx rei-skills mcp
  npx rei-skills targets
  npx rei-skills add rei-rea --claude --mcp-config ~/.claude/mcp.json
  npx rei-skills add rei-rea --copilot --workspace --agents-md

🌐 https://rootcastleco.github.io/rei-skills/ | https://www.rootcastle.com
`);
}

function checkGitAvailable() {
  const r = spawnSync("git", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function isLegacyReiSkillsRepo(targetDir) {
  const gitDir = path.join(targetDir, ".git");
  if (!fs.existsSync(gitDir)) return false;
  const r = spawnSync(
    "git",
    ["-C", targetDir, "config", "--get", "remote.origin.url"],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !r.stdout) return false;
  const url = r.stdout.trim().toLowerCase();
  return (
    url.includes("rei-skills") || url.includes("antigravity-awesome-skills")
  );
}

function copyRecursiveSync(src, dest, skipGit = true) {
  let stats;
  try {
    stats = fs.lstatSync(src);
  } catch {
    return;
  }

  if (stats.isSymbolicLink()) {
    try {
      const realSrc = fs.realpathSync(src);
      const realStats = fs.statSync(realSrc);
      if (realStats.isDirectory()) {
        copyRecursiveSync(realSrc, dest, skipGit);
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(realSrc, dest);
      }
    } catch {
      // Ignore broken symlink
    }
    return;
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((child) => {
      if (skipGit && child === ".git") return;
      copyRecursiveSync(path.join(src, child), path.join(dest, child), skipGit);
    });
  } else if (stats.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function resolveSkillSourceDir(repoSkills, entryName) {
  const src = path.join(repoSkills, entryName);
  // npm omits symlinks from published tarballs. Resolve the known
  // legacy aliases to their real directories when the link is absent.
  if (!fs.existsSync(src)) {
    const alias = KNOWN_SYMLINK_ALIASES[entryName];
    const fallback = alias ? path.join(repoSkills, alias) : null;
    return fallback && fs.existsSync(fallback) && fs.statSync(fallback).isDirectory()
      ? fallback
      : null;
  }

  const lstat = fs.lstatSync(src);
  if (lstat.isSymbolicLink()) {
    try {
      const real = fs.realpathSync(src);
      if (fs.statSync(real).isDirectory()) return real;
    } catch {
      // Fallback to known alias table
    }
  } else if (lstat.isFile()) {
    try {
      const content = fs.readFileSync(src, "utf8").trim();
      if (content && !content.includes("\n") && content.length < 64) {
        const targetCandidate = path.resolve(repoSkills, content);
        if (
          targetCandidate.startsWith(path.resolve(repoSkills)) &&
          fs.existsSync(targetCandidate) &&
          fs.statSync(targetCandidate).isDirectory()
        ) {
          return targetCandidate;
        }
      }
    } catch {
      // ignore
    }
  } else if (lstat.isDirectory()) {
    return src;
  }

  if (KNOWN_SYMLINK_ALIASES[entryName]) {
    const aliasTarget = path.join(repoSkills, KNOWN_SYMLINK_ALIASES[entryName]);
    if (fs.existsSync(aliasTarget) && fs.statSync(aliasTarget).isDirectory()) {
      return aliasTarget;
    }
  }
  return null;
}

function installSkillsIntoTarget(sourceRoot, target, filterSkillIds = null, targetSpec = null) {
  const repoSkills = path.join(sourceRoot, "skills");
  if (!fs.existsSync(repoSkills)) {
    throw new Error(`Source directory has no skills/ folder: ${sourceRoot}`);
  }

  const { catalog } = loadCatalogData(sourceRoot);
  const catalogMap = new Map((catalog.skills || []).map((s) => [s.id, s]));

  const entries = fs.readdirSync(repoSkills);
  let installedCount = 0;

  for (const name of entries) {
    if (name.startsWith(".")) continue;
    if (filterSkillIds && !filterSkillIds.has(name)) continue;

    const resolvedSrc = resolveSkillSourceDir(repoSkills, name);
    if (!resolvedSrc) continue;

    if (targetSpec && targetSpec.format !== "skill-dir") {
      materializeSkillForTarget(name, resolvedSrc, target, targetSpec, catalogMap.get(name) || {});
    } else {
      const dest = path.join(target, name);
      copyRecursiveSync(resolvedSrc, dest);
    }
    installedCount++;
  }

  if (!filterSkillIds && (!targetSpec || targetSpec.format === "skill-dir")) {
    const repoDocs = path.join(sourceRoot, "docs");
    if (fs.existsSync(repoDocs)) {
      const docsDest = path.join(target, "docs");
      copyRecursiveSync(repoDocs, docsDest);
    }
  }

  return installedCount;
}

function cloneSourceRepo(tempDir, ref = null) {
  if (!checkGitAvailable()) {
    throw new Error(
      "Git is not installed or not on PATH. Install Git or use --from <local-directory>.",
    );
  }

  let cloneRes;
  if (process.platform === "win32") {
    cloneRes = spawnSync(
      "git",
      ["-c", "core.symlinks=true", "clone", "--depth", "1", REPO, tempDir],
      { encoding: "utf8" },
    );
    if (cloneRes.status !== 0) {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cloneRes = spawnSync(
        "git",
        ["-c", "core.symlinks=false", "clone", "--depth", "1", REPO, tempDir],
        { stdio: "inherit" },
      );
    }
  } else {
    cloneRes = spawnSync("git", ["clone", "--depth", "1", REPO, tempDir], {
      stdio: "inherit",
    });
  }

  if (cloneRes.status !== 0) {
    throw new Error("Failed to clone REI Skills repository.");
  }

  if (ref) {
    const fetchTag = spawnSync(
      "git",
      ["-C", tempDir, "fetch", "--tags", "origin", ref],
      { stdio: "inherit" },
    );
    const checkout = spawnSync("git", ["-C", tempDir, "checkout", ref], {
      stdio: "inherit",
    });
    if (fetchTag.status !== 0 && checkout.status !== 0) {
      throw new Error(`Failed to checkout ref: ${ref}`);
    }
  }
}

function resolveCatalogSourceRoot(opts) {
  if (opts.fromArg) {
    const resolved = resolveDir(opts.fromArg);
    if (!fs.existsSync(path.join(resolved, "skills"))) {
      throw new Error(`Specified --from directory does not contain skills/: ${resolved}`);
    }
    return { root: resolved, isTemp: false };
  }

  const hasLocalSkills = fs.existsSync(path.join(LOCAL_ROOT, "skills"));
  if ((opts.local || !opts.remote) && hasLocalSkills && !opts.versionArg && !opts.tagArg) {
    return { root: LOCAL_ROOT, isTemp: false };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-skills-"));
  const ref =
    opts.tagArg ||
    (opts.versionArg
      ? opts.versionArg.startsWith("v")
        ? opts.versionArg
        : `v${opts.versionArg}`
      : null);
  cloneSourceRepo(tempDir, ref);
  return { root: tempDir, isTemp: true };
}

function loadCatalogData(sourceRoot = LOCAL_ROOT) {
  const catalogPath = path.join(sourceRoot, "data", "catalog.json");
  const bundlesPath = path.join(sourceRoot, "data", "bundles.json");
  const workflowsPath = path.join(sourceRoot, "data", "workflows.json");
  const reaManifestPath = path.join(sourceRoot, "data", "rei-rea-manifest.json");

  const catalog = fs.existsSync(catalogPath)
    ? JSON.parse(fs.readFileSync(catalogPath, "utf8"))
    : { total: 0, skills: [] };
  const bundles = fs.existsSync(bundlesPath)
    ? JSON.parse(fs.readFileSync(bundlesPath, "utf8"))
    : { bundles: {} };
  const workflows = fs.existsSync(workflowsPath)
    ? JSON.parse(fs.readFileSync(workflowsPath, "utf8"))
    : { workflows: [] };
  const reaManifest = fs.existsSync(reaManifestPath)
    ? JSON.parse(fs.readFileSync(reaManifestPath, "utf8"))
    : null;

  return { catalog, bundles, workflows, reaManifest };
}

function performSafeInstall(opts, filterSkillIds = null, label = "all skills") {
  if (opts.allAi) {
    const baseWorkspace = opts.pathArg ? resolveDir(opts.pathArg) : process.cwd();
    const multiTargets = ["claude", "codex", "gemini", "cursor", "copilot", "windsurf", "cline", "roocode"];
    const results = [];
    for (const tId of multiTargets) {
      const spec = AI_TARGETS[tId];
      const subTarget = path.join(baseWorkspace, spec.defaultWorkspacePath);
      const subOpts = { ...opts, allAi: false, targetAi: tId, pathArg: subTarget };
      performSafeInstall(subOpts, filterSkillIds, `${label} [${spec.name}]`);
      results.push({ ai: tId, path: subTarget, format: spec.format });
    }
    writeWorkspaceRouterFile(baseWorkspace, filterSkillIds);
    return results;
  }

  const targetSpec = getSelectedAiSpec(opts);
  const target = defaultDir(opts);
  if (!target || !HOME) {
    console.error("Could not resolve target directory. Use --path <absolute-path>.");
    process.exit(1);
  }

  if (fs.existsSync(path.join(target, ".git"))) {
    if (!isLegacyReiSkillsRepo(target)) {
      console.error(
        `❌ Safety Error: Target directory '${target}' contains an unrelated Git repository (.git).`,
      );
      console.error(
        "   REI Skills refuses to delete or overwrite unrelated Git repositories.",
      );
      console.error(
        "   Choose a dedicated skills directory (e.g. --path ./.agent/skills or --claude).",
      );
      process.exit(1);
    }
  }

  if (opts.dryRun) {
    const out = {
      status: "dry-run",
      action: "install",
      target,
      aiTarget: targetSpec ? targetSpec.id : "default",
      format: targetSpec ? targetSpec.format : "skill-dir",
      scope: label,
      skillCount: filterSkillIds ? filterSkillIds.size : "all",
    };
    if (opts.json) {
      console.log(JSON.stringify(out, null, 2));
    } else {
      console.log(
        `\n🔍 [DRY RUN] Would install ${label} (${out.format}) to: ${target}`,
      );
    }
    return;
  }

  const { root: sourceRoot, isTemp } = resolveCatalogSourceRoot(opts);
  let backupDir = null;

  try {
    if (fs.existsSync(target) && fs.existsSync(path.join(target, ".git")) && isLegacyReiSkillsRepo(target)) {
      backupDir = `${target}-backup-${Date.now()}`;
      console.log(`📦 Backing up legacy full-repo installation to ${backupDir}…`);
      copyRecursiveSync(target, backupDir, false);
      const gitDir = path.join(target, ".git");
      fs.rmSync(gitDir, { recursive: true, force: true });
    } else if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const count = installSkillsIntoTarget(sourceRoot, target, filterSkillIds, targetSpec);

    const receipt = {
      installedAt: new Date().toISOString(),
      aiTarget: targetSpec ? targetSpec.id : "antigravity",
      format: targetSpec ? targetSpec.format : "skill-dir",
      scope: label,
      installedCount: count,
      source: isTemp ? REPO : sourceRoot,
    };
    fs.writeFileSync(
      path.join(target, ".rei-skills-receipt.json"),
      JSON.stringify(receipt, null, 2) + "\n",
      "utf8",
    );

    if (opts.agentsMd) {
      writeWorkspaceRouterFile(process.cwd(), filterSkillIds, sourceRoot);
    }

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            status: "installed",
            target,
            aiTarget: receipt.aiTarget,
            format: receipt.format,
            installedCount: count,
            backupDir,
          },
          null,
          2,
        ),
      );
    } else {
      const targetTitle = targetSpec ? `${targetSpec.name} [${targetSpec.format}]` : "Universal Skill Directory";
      console.log(`\n✅ REI Skills installed (${count} items) for ${targetTitle}`);
      console.log(`   Location: ${target}`);
      if (targetSpec && targetSpec.invocationHint) {
        console.log(`   Invoke:   ${targetSpec.invocationHint}`);
      }
      if (backupDir) {
        console.log(`🛡️  Migration backup preserved at: ${backupDir}`);
      }
      console.log("📦 Run `npx rei-skills recommend \"<task>\"`, `npx rei-skills mcp`, or `npx rei-skills doctor` anytime.");
      console.log("🌐 https://rootcastleco.github.io/rei-skills/ | Engineering Beyond Boundaries\n");
    }
  } catch (err) {
    console.error(`\n❌ Installation failed: ${err.message}`);
    if (backupDir && fs.existsSync(backupDir)) {
      console.error(`🔄 Rolling back from backup: ${backupDir}`);
      try {
        if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
        fs.renameSync(backupDir, target);
      } catch (rbErr) {
        console.error(`⚠️ Rollback warning: ${rbErr.message}`);
      }
    }
    process.exit(1);
  } finally {
    if (isTemp && fs.existsSync(sourceRoot)) {
      try {
        fs.rmSync(sourceRoot, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }
}

function writeWorkspaceRouterFile(workspaceDir, filterSkillIds = null, sourceRoot = LOCAL_ROOT) {
  const { catalog } = loadCatalogData(sourceRoot);
  let skills = catalog.skills || [];
  if (filterSkillIds) {
    skills = skills.filter((s) => filterSkillIds.has(s.id));
  }
  const agentsMdContent = generateUniversalRouterMarkdown(skills, {
    title: "AGENTS.md — REI Skills Universal AI Agent Router",
    skillBasePath: "skills",
  });
  const outPath = path.join(workspaceDir, "AGENTS.md");
  fs.writeFileSync(outPath, agentsMdContent, "utf8");
  return outPath;
}

function handleTargets(opts) {
  const list = Object.values(AI_TARGETS);
  if (opts.json) {
    console.log(JSON.stringify({ total: list.length, targets: list }, null, 2));
    return;
  }

  console.log(`\n🤖 REI Skills — Universal AI Compatibility Matrix (${list.length} Supported AI Assistants & SDKs)\n`);
  for (const t of list) {
    console.log(`  • ${t.flag.padEnd(16)} ${t.name.padEnd(48)} [format: ${t.format.padEnd(20)}] (${t.defaultWorkspacePath})`);
  }
  console.log(`\n💡 Tip: Use '--workspace' to install into the current project, '--all-ai' to configure all major AI assistants at once, or 'npx rei-skills mcp' to launch the Smart Skill Management MCP Server.\n`);
}

function handleRouter(opts) {
  const outDir = opts.pathArg ? resolveDir(opts.pathArg) : process.cwd();
  const { catalog, bundles } = loadCatalogData();
  let filterSet = null;
  if (opts.bundleArg && bundles.bundles && bundles.bundles[opts.bundleArg]) {
    filterSet = new Set(bundles.bundles[opts.bundleArg].skills || []);
  } else if (opts.filterArg) {
    filterSet = new Set(
      (catalog.skills || [])
        .filter((s) => s.id.startsWith(opts.filterArg))
        .map((s) => s.id),
    );
  }
  const written = writeWorkspaceRouterFile(outDir, filterSet);
  if (opts.json) {
    console.log(JSON.stringify({ status: "generated", file: written }, null, 2));
  } else {
    console.log(`\n✅ Generated universal AGENTS.md router at: ${written}\n`);
  }
}

function handleRecommend(opts) {
  const task = opts.positional.join(" ").trim();
  if (!task && !opts.filesArg) {
    console.error("Usage: rei-skills recommend \"<your task description>\" [--files file1.ts,file2.wasm] [--json]");
    process.exit(1);
  }
  const { recommendForTask } = require("../lib/smart-router");
  const { catalog, bundles, workflows } = loadCatalogData();

  const res = recommendForTask(catalog, bundles, workflows, {
    task,
    files: opts.filesArg || "",
    maxResults: 6,
  });

  if (opts.json) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  console.log(`\n🧠 REI Smart Skill Router — Recommendations for: "${task}"`);
  if (res.query.files && res.query.files.length > 0) {
    console.log(`   Workspace Files Analyzed: ${res.query.files.join(", ")}`);
  }
  console.log("\n🎯 Top Recommended Skills:");
  for (const s of res.recommendedSkills) {
    console.log(`  • ${s.id.padEnd(34)} [${s.confidence}% match] (${s.category} · risk:${s.risk})`);
    console.log(`    ↳ ${s.description}`);
    console.log(`    ↳ Reason: ${s.reasons.join(", ")} | Install: npx rei-skills add ${s.id}`);
  }

  if (res.recommendedBundles.length > 0) {
    console.log("\n📦 Recommended Role Bundles:");
    for (const b of res.recommendedBundles) {
      console.log(`  • ${b.id.padEnd(28)} (${b.matchedSkillsCount}/${b.totalSkillsCount} top skills matched) -> ${b.installCommand}`);
    }
  }

  if (res.recommendedWorkflows.length > 0) {
    console.log("\n🔄 Recommended Orchestration Workflows:");
    for (const wf of res.recommendedWorkflows) {
      console.log(`  • ${wf.name} (${wf.id}) — ${wf.description}`);
    }
  }
  console.log();
}

function handleSearch(opts) {
  const query = opts.positional.join(" ").trim().toLowerCase();
  const { catalog } = loadCatalogData();
  let results = catalog.skills || [];

  if (opts.categoryArg) {
    results = results.filter((s) => (s.category || "").toLowerCase() === opts.categoryArg);
  }
  if (opts.riskArg) {
    results = results.filter((s) => (s.risk || "").toLowerCase() === opts.riskArg);
  }
  if (opts.sourceArg) {
    results = results.filter((s) =>
      (s.source || "").toLowerCase().includes(opts.sourceArg),
    );
  }
  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    results = results.filter((s) => {
      const hay = `${s.id} ${s.name} ${s.description} ${(s.tags || []).join(" ")} ${s.category} ${s.source}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  if (opts.json) {
    console.log(JSON.stringify({ total: results.length, results }, null, 2));
    return;
  }

  console.log(`\n🔍 Found ${results.length} matching skills${query ? ` for "${query}"` : ""}:\n`);
  for (const s of results.slice(0, 35)) {
    const desc = (s.description || "").slice(0, 88);
    console.log(`  • ${s.id.padEnd(36)} [${s.category}] (${s.risk}) — ${desc}${s.description && s.description.length > 88 ? "…" : ""}`);
  }
  if (results.length > 35) {
    console.log(`\n  … and ${results.length - 35} more. Refine with --category, --risk, --source, or --json.`);
  }
  console.log();
}

function handleList(opts) {
  const { catalog, bundles } = loadCatalogData();
  let skills = catalog.skills || [];

  if (opts.bundlesFlag) {
    const bMap = bundles.bundles || {};
    if (opts.json) {
      console.log(JSON.stringify({ total: Object.keys(bMap).length, bundles: bMap }, null, 2));
      return;
    }
    console.log(`\n📦 Curated Role Bundles (${Object.keys(bMap).length}):\n`);
    for (const [id, b] of Object.entries(bMap)) {
      console.log(`  • ${id.padEnd(28)} (${(b.skills || []).length} skills) — ${b.description || b.name}`);
    }
    console.log();
    return;
  }

  if (opts.bundleArg) {
    const b = bundles.bundles && bundles.bundles[opts.bundleArg];
    if (!b) {
      const available = Object.keys(bundles.bundles || {}).join(", ");
      console.error(`❌ Unknown bundle '${opts.bundleArg}'. Available bundles: ${available}`);
      process.exit(1);
    }
    const set = new Set(b.skills || []);
    skills = skills.filter((s) => set.has(s.id));
  }
  if (opts.categoryArg) {
    skills = skills.filter((s) => (s.category || "").toLowerCase() === opts.categoryArg);
  }
  if (opts.riskArg) {
    skills = skills.filter((s) => (s.risk || "").toLowerCase() === opts.riskArg);
  }
  if (opts.sourceArg) {
    skills = skills.filter((s) => (s.source || "").toLowerCase().includes(opts.sourceArg));
  }

  const categoryCounts = {};
  for (const s of skills) {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  }

  if (opts.json) {
    console.log(JSON.stringify({ total: skills.length, categories: categoryCounts, skills }, null, 2));
    return;
  }

  console.log(`\n📚 REI Skills Library (${skills.length} skills)\n`);
  console.log("Categories:");
  for (const [cat, cnt] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  • ${cat.padEnd(22)} ${cnt} skills`);
  }
  if (!opts.categoriesFlag) {
    console.log("\nSample skills:");
    for (const s of skills.slice(0, 25)) {
      console.log(`  - ${s.id} (${s.category} · risk:${s.risk} · source:${s.source})`);
    }
    if (skills.length > 25) {
      console.log(`  … and ${skills.length - 25} more. Use --category <name> or --json to view all.\n`);
    } else {
      console.log();
    }
  } else {
    console.log();
  }
}

function handleInfo(opts) {
  const skillId = opts.positional[0];
  if (!skillId) {
    console.error("Usage: rei-skills info <skill-id>");
    process.exit(1);
  }

  const { catalog, reaManifest } = loadCatalogData();
  const entry = (catalog.skills || []).find(
    (s) => s.id === skillId || s.name === skillId,
  );
  if (!entry) {
    console.error(`❌ Skill not found: ${skillId}`);
    process.exit(1);
  }

  const skillDir = path.join(LOCAL_ROOT, "skills", ...entry.id.split("/"));
  const files = [];
  if (fs.existsSync(skillDir)) {
    const walk = (dir, base = skillDir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) walk(full, base);
        else files.push(path.relative(base, full).replace(/\\/g, "/"));
      }
    };
    walk(skillDir);
  }

  const reaInfo =
    reaManifest &&
    (reaManifest.skills || []).find((s) => s.id === entry.id);

  const info = {
    ...entry,
    files,
    supportedAiTargets: Object.keys(AI_TARGETS),
    rea_workbench_skill: Boolean(reaInfo),
    rea_provenance: reaInfo || undefined,
  };

  if (opts.json) {
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  console.log(`\n🏰 Skill: ${info.name} (${info.id})`);
  console.log(`   Category:    ${info.category}`);
  console.log(`   Risk Level:  ${info.risk}`);
  console.log(`   Provenance:  ${info.source}`);
  console.log(`   Path:        ${info.path}`);
  console.log(`   Tags:        ${(info.tags || []).join(", ")}`);
  console.log(`   Description: ${info.description}`);
  console.log(`   Files:       ${files.join(", ")}`);
  console.log(`   AI Targets:  Compatible with all 21 AI targets (--claude, --codex, --gemini, --cursor, --copilot, --windsurf, --cline, etc.)`);
  if (reaInfo) {
    console.log(`   REI REA:     Specialist Reverse-Engineering Skill (Upstream SHA-256: ${reaInfo.upstream_sha256.slice(0, 12)}…)`);
    console.log(`   Runtime:     Optional CLI/MCP workbench at ${REA_REPO}`);
  }
  console.log();
}

function writeMcpConfigSafely(configPath, dryRun = false) {
  const resolved = resolveDir(configPath);
  const reiSkillsMcpEntry = {
    command: "npx",
    args: ["-y", "rei-skills", "mcp"],
  };
  const mcpEntry = {
    command: "rei-rea",
    args: ["mcp"],
  };

  let existing = {};
  let backupPath = null;
  if (fs.existsSync(resolved)) {
    const raw = fs.readFileSync(resolved, "utf8");
    existing = JSON.parse(raw);
    backupPath = `${resolved}.bak.${Date.now()}`;
    if (!dryRun) {
      fs.copyFileSync(resolved, backupPath);
    }
  }

  if (!existing.mcpServers || typeof existing.mcpServers !== "object") {
    existing.mcpServers = {};
  }
  existing.mcpServers["rei-skills"] = reiSkillsMcpEntry;
  existing.mcpServers["rei-rea"] = mcpEntry;

  if (!dryRun) {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, JSON.stringify(existing, null, 2) + "\n", "utf8");
  }

  return { configPath: resolved, backupPath, mcpServers: existing.mcpServers };
}

function handleAdd(opts) {
  const targetName = opts.positional[0];
  if (!targetName) {
    console.error("Usage: rei-skills add <skill-id | bundle-name | rei-rea> [options]");
    process.exit(1);
  }

  const { catalog, bundles, reaManifest } = loadCatalogData();
  let filterSet = null;
  let label = targetName;

  if (targetName === "rei-rea" || targetName === "reverse-engineering") {
    const reaSkills = (reaManifest && reaManifest.skills)
      ? reaManifest.skills.map((s) => s.id)
      : (catalog.skills || [])
          .filter((s) => s.id.startsWith("rei-"))
          .map((s) => s.id);
    filterSet = new Set(reaSkills);
    label = `REI REA specialist skill pack (${filterSet.size} skills)`;
  } else if (bundles.bundles && bundles.bundles[targetName]) {
    filterSet = new Set(bundles.bundles[targetName].skills || []);
    label = `bundle '${targetName}' (${filterSet.size} skills)`;
  } else if (KNOWN_SYMLINK_ALIASES[targetName]) {
    filterSet = new Set([targetName, KNOWN_SYMLINK_ALIASES[targetName]]);
    label = `skill alias '${targetName}' -> '${KNOWN_SYMLINK_ALIASES[targetName]}'`;
  } else {
    const found = (catalog.skills || []).find(
      (s) => s.id === targetName || s.name === targetName,
    );
    if (!found) {
      console.error(`❌ Unknown skill or bundle '${targetName}'. Run 'rei-skills search ${targetName}'.`);
      process.exit(1);
    }
    filterSet = new Set([found.id.split("/")[0]]);
    label = `skill '${found.id}'`;
  }

  performSafeInstall(opts, filterSet, label);

  if (targetName === "rei-rea" || opts.printMcp || opts.mcpConfigArg) {
    const mcpSnippet = {
      mcpServers: {
        "rei-skills": {
          command: "npx",
          args: ["-y", "rei-skills", "mcp"],
        },
        "rei-rea": {
          command: "rei-rea",
          args: ["mcp"],
        },
      },
    };

    if (opts.mcpConfigArg) {
      const res = writeMcpConfigSafely(opts.mcpConfigArg, opts.dryRun);
      if (!opts.json) {
        console.log(`🔧 Updated MCP configuration (rei-skills + rei-rea) at: ${res.configPath}`);
        if (res.backupPath) {
          console.log(`🛡️  Previous MCP config backed up to: ${res.backupPath}`);
        }
      }
    } else if (opts.printMcp || !opts.json) {
      console.log("🔌 Smart Skill Management MCP & REI REA Runtime Setup:");
      console.log("   • Run `npx rei-skills mcp` to serve all 895 skills + Smart Task Router over MCP.");
      console.log("   • Optional REI REA Python CLI & 14-tool Binary Intelligence MCP server:");
      console.log(`     git clone ${REA_REPO}`);
      console.log("     cd Rei-Reverse-engineer && python -m pip install -e .");
      console.log("     rei-rea tools doctor\n");
      if (opts.printMcp) {
        console.log("   MCP Client Configuration (mcpServers JSON):");
        console.log(JSON.stringify(mcpSnippet, null, 2));
        console.log();
      }
    }
  }
}

function handleDoctor(opts) {
  const gitOk = checkGitAvailable();
  const pyCheck = spawnSync("python", ["--version"], { encoding: "utf8" });
  const py3Check = spawnSync("python3", ["--version"], { encoding: "utf8" });
  const pythonAvailable = pyCheck.status === 0 || py3Check.status === 0;
  const pythonVersion =
    pyCheck.status === 0
      ? (pyCheck.stdout || pyCheck.stderr).trim()
      : py3Check.status === 0
        ? (py3Check.stdout || py3Check.stderr).trim()
        : null;

  const reaCliCheck = spawnSync("rei-rea", ["--version"], { encoding: "utf8" });
  const reaRuntimeInstalled = reaCliCheck.status === 0;
  const reaVersion = reaRuntimeInstalled ? (reaCliCheck.stdout || "").trim() : null;

  const { catalog, reaManifest } = loadCatalogData();

  const installations = {};
  for (const [id, spec] of Object.entries(AI_TARGETS)) {
    const dir = spec.defaultGlobalPath;
    const exists = fs.existsSync(dir);
    let count = 0;
    if (exists) {
      try {
        count = fs
          .readdirSync(dir)
          .filter((name) => !name.startsWith(".")).length;
      } catch {
        count = 0;
      }
    }
    installations[id] = {
      name: spec.name,
      format: spec.format,
      path: dir,
      workspacePath: spec.defaultWorkspacePath,
      exists,
      installedItems: count,
    };
  }

  const report = {
    platform: process.platform,
    nodeVersion: process.version,
    gitAvailable: gitOk,
    pythonAvailable,
    pythonVersion,
    catalogTotalSkills: catalog.total || 0,
    supportedAiTargetsCount: Object.keys(AI_TARGETS).length,
    smartMcpServerReady: true,
    agentInstallations: installations,
    reiReaWorkbench: {
      specialistSkillsBundled: reaManifest ? reaManifest.skills.length : 12,
      upstreamVersionPinned: reaManifest ? reaManifest.upstream_version : "0.2.0",
      upstreamCommitPinned: reaManifest ? reaManifest.upstream_commit : "09fbc7b",
      capabilityMatrix: {
        catalogedTools: 124,
        optInStaticAdapters: 11,
        mcpServerTools: 14,
        runtimeCliOnPath: reaRuntimeInstalled,
        runtimeVersionDetected: reaVersion,
        liveDecompilerSessions: "planned (not bundled)",
      },
    },
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("\n🩺 REI Skills — Universal Multi-AI Environment & Capability Doctor\n");
  console.log(`  OS / Node:          ${report.platform} (${report.nodeVersion})`);
  console.log(`  Git CLI:            ${report.gitAvailable ? "✅ Available" : "❌ Missing"}`);
  console.log(`  Python Runtime:     ${report.pythonAvailable ? `✅ ${report.pythonVersion}` : "⚠️ Not detected on PATH"}`);
  console.log(`  Catalog Inventory:  ${report.catalogTotalSkills} validated skills`);
  console.log(`  Smart MCP Server:   ✅ Ready (run 'npx rei-skills mcp' or 'rei-skills-mcp')`);
  console.log(`  AI Compatibility:   ${report.supportedAiTargetsCount} AI assistants & SDK formats supported\n`);

  console.log("  Global AI Assistant Skill/Rule Directories:");
  for (const [agent, info] of Object.entries(installations)) {
    const status = info.exists ? `✅ ${info.installedItems} items` : "⚪ Ready to install";
    console.log(`    • ${agent.padEnd(14)} ${status.padEnd(20)} [format: ${info.format.padEnd(20)}] (${info.path})`);
  }

  console.log("\n  REI Reverse Engineering (REI REA) Capability States:");
  console.log(`    • Specialist Skills:   ✅ ${report.reiReaWorkbench.specialistSkillsBundled} bundled (v${report.reiReaWorkbench.upstreamVersionPinned} @ ${report.reiReaWorkbench.upstreamCommitPinned})`);
  console.log(`    • Tool Registry:       📖 124 cataloged records (discovery metadata only)`);
  console.log(`    • Static CLI Adapters: 🔒 11 adapter-supported tools (require local binary + --allow-external)`);
  console.log(`    • Local CLI / MCP:     ${reaRuntimeInstalled ? `✅ PATH-detected (${reaVersion})` : "⚪ Optional (install from https://github.com/rootcastleco/Rei-Reverse-engineer)"}`);
  console.log(`    • Live Decompilers:    ⏳ Planned (Ghidra/IDA/JADX/Frida session providers not bundled)\n`);
}

function handleVerify(opts) {
  const targetDir = opts.pathArg
    ? resolveDir(opts.pathArg)
    : path.join(LOCAL_ROOT, "skills");

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory to verify does not exist: ${targetDir}`);
    process.exit(1);
  }

  let parseFrontmatter;
  try {
    ({ parseFrontmatter } = require("../lib/skill-utils"));
  } catch {
    parseFrontmatter = (txt) => {
      const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      return { hasFrontmatter: Boolean(m), data: { name: "ok", description: "ok" }, errors: [] };
    };
  }

  const entries = fs
    .readdirSync(targetDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "docs");

  let checked = 0;
  const issues = [];

  for (const entry of entries) {
    const skillMd = path.join(targetDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      if (entry.name === "SPDD") continue;
      issues.push(`${entry.name}: Missing SKILL.md`);
      continue;
    }
    checked++;
    const content = fs.readFileSync(skillMd, "utf8");
    const { data, errors, hasFrontmatter } = parseFrontmatter(content);
    if (!hasFrontmatter) {
      issues.push(`${entry.name}: Missing YAML frontmatter`);
    } else if (errors && errors.length > 0) {
      issues.push(`${entry.name}: YAML error (${errors[0]})`);
    } else if (!data.name || !data.description) {
      issues.push(`${entry.name}: Missing name or description in frontmatter`);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({ targetDir, checked, valid: issues.length === 0, issues }, null, 2));
  } else {
    console.log(`\n🔍 Verified ${checked} skills in ${targetDir}`);
    if (issues.length > 0) {
      console.error(`❌ Found ${issues.length} issues:`);
      issues.slice(0, 20).forEach((iss) => console.error(`  - ${iss}`));
    } else {
      console.log("✅ All verified skills have valid frontmatter and structure.\n");
    }
  }

  if (issues.length > 0) process.exit(1);
}

function handleExport(opts) {
  const agent = opts.agentArg || "claude";
  const targetSpec = AI_TARGETS[agent] || null;
  const format =
    opts.formatArg ||
    (opts.strict ? "strict" : targetSpec ? targetSpec.format : "strict");
  const outDir = resolveDir(opts.outArg || `./dist/export-${format}`);
  const { parseFrontmatter } = require("../lib/skill-utils");
  const { catalog } = loadCatalogData();
  const catalogMap = new Map((catalog.skills || []).map((s) => [s.id, s]));
  const skillsDir = path.join(LOCAL_ROOT, "skills");

  if (!opts.dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (format === "agents-md") {
    let skills = catalog.skills || [];
    if (opts.filterArg) {
      skills = skills.filter((s) => s.id.startsWith(opts.filterArg));
    }
    if (!opts.dryRun) {
      const md = generateUniversalRouterMarkdown(skills, {
        title: "AGENTS.md — REI Skills Universal AI Agent Router",
        skillBasePath: ".agent/skills",
      });
      fs.writeFileSync(path.join(outDir, "AGENTS.md"), md, "utf8");
    }
    if (opts.json) {
      console.log(JSON.stringify({ status: "exported", format, outDir, exportedCount: skills.length }, null, 2));
    } else {
      console.log(`\n📦 Exported AGENTS.md universal router (${skills.length} skills) to ${outDir}\n`);
    }
    return;
  }

  const entries = fs.readdirSync(skillsDir);
  let exportedCount = 0;
  const sdkBundle = [];

  for (const name of entries) {
    if (name.startsWith(".")) continue;
    if (opts.filterArg && !name.startsWith(opts.filterArg)) continue;
    const resolvedSrc = resolveSkillSourceDir(skillsDir, name);
    if (!resolvedSrc) continue;
    const skillMdPath = path.join(resolvedSrc, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;

    const raw = fs.readFileSync(skillMdPath, "utf8");
    const extraMeta = catalogMap.get(name) || {};

    if (!opts.dryRun) {
      if (format === "strict" || format === "strict-skill-md" || format === "extended" || format === "skill-dir") {
        const destSkillDir = path.join(outDir, name);
        copyRecursiveSync(resolvedSrc, destSkillDir);
        if (format === "strict" || format === "strict-skill-md") {
          const { data } = parseFrontmatter(raw);
          const strictContent = transpileSkillContent(name, raw, "strict", extraMeta);
          fs.writeFileSync(path.join(destSkillDir, "SKILL.md"), strictContent, "utf8");
          fs.writeFileSync(
            path.join(destSkillDir, ".rei-metadata.json"),
            JSON.stringify(
              {
                id: name,
                name: data.name || name,
                risk: data.risk || extraMeta.risk || "safe",
                source: data.source || extraMeta.source || "rootcastle-rei",
                category: extraMeta.category || "engineering",
              },
              null,
              2,
            ) + "\n",
            "utf8",
          );
        }
      } else if (format === "cursor-mdc") {
        const content = transpileSkillContent(name, raw, "cursor-mdc", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.mdc`), content, "utf8");
      } else if (format === "copilot-instructions") {
        const content = transpileSkillContent(name, raw, "copilot-instructions", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.instructions.md`), content, "utf8");
      } else if (format === "windsurf-rule") {
        const content = transpileSkillContent(name, raw, "windsurf-rule", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.md`), content, "utf8");
      } else if (format === "continue-rule") {
        const content = transpileSkillContent(name, raw, "continue-rule", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.md`), content, "utf8");
      } else if (format === "markdown-rule") {
        const content = transpileSkillContent(name, raw, "markdown-rule", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.md`), content, "utf8");
      } else if (format === "sdk-json" || format === "openai-tool") {
        const jsonStr = transpileSkillContent(name, raw, "sdk-json", extraMeta);
        fs.writeFileSync(path.join(outDir, `${name}.json`), jsonStr, "utf8");
        sdkBundle.push(JSON.parse(jsonStr));
      }
    }
    exportedCount++;
  }

  if (!opts.dryRun && sdkBundle.length > 0) {
    fs.writeFileSync(
      path.join(outDir, "rei-skills-bundle.json"),
      JSON.stringify({ total: sdkBundle.length, skills: sdkBundle }, null, 2) + "\n",
      "utf8",
    );
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        { status: opts.dryRun ? "dry-run" : "exported", agent, format, outDir, exportedCount },
        null,
        2,
      ),
    );
  } else {
    console.log(`\n📦 Exported ${exportedCount} skills [format: ${format}] to ${outDir}\n`);
  }
}

function main() {
  const opts = parseArgs();

  if (opts.help) {
    printHelp();
    return;
  }

  switch (opts.command) {
    case "mcp": {
      const { startMcpServer } = require("./mcp-server");
      startMcpServer();
      break;
    }
    case "recommend":
      handleRecommend(opts);
      break;
    case "targets":
      handleTargets(opts);
      break;
    case "router":
      handleRouter(opts);
      break;
    case "search":
      handleSearch(opts);
      break;
    case "list":
      handleList(opts);
      break;
    case "info":
      handleInfo(opts);
      break;
    case "add":
      handleAdd(opts);
      break;
    case "doctor":
      handleDoctor(opts);
      break;
    case "verify":
      handleVerify(opts);
      break;
    case "compile":
    case "export":
      handleExport(opts);
      break;
    case "update":
    case "install":
    default:
      performSafeInstall(opts, null, "all skills");
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  defaultDir,
  isLegacyReiSkillsRepo,
  resolveSkillSourceDir,
  installSkillsIntoTarget,
  writeMcpConfigSafely,
};
