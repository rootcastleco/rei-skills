#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ============================================================================
// 🏰 Rei Skills — Rootcastle Engineering & Innovation
// Curated by Batuhan Ayrıbaş | www.rootcastle.com
// ============================================================================

const REPO = "https://github.com/rootcastleco/rei-skills.git";
const HOME = process.env.HOME || process.env.USERPROFILE || "";
const BRAND = "rei";

function resolveDir(p) {
  if (!p) return null;
  const s = p.replace(/^~($|\/)/, HOME + "$1");
  return path.resolve(s);
}

function parseArgs() {
  const a = process.argv.slice(2);
  let pathArg = null;
  let versionArg = null;
  let tagArg = null;
  let cursor = false,
    claude = false,
    gemini = false,
    codex = false,
    antigravity = false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--help" || a[i] === "-h") return { help: true };
    if (a[i] === "--path" && a[i + 1]) {
      pathArg = a[++i];
      continue;
    }
    if (a[i] === "--version" && a[i + 1]) {
      versionArg = a[++i];
      continue;
    }
    if (a[i] === "--tag" && a[i + 1]) {
      tagArg = a[++i];
      continue;
    }
    if (a[i] === "--cursor") {
      cursor = true;
      continue;
    }
    if (a[i] === "--claude") {
      claude = true;
      continue;
    }
    if (a[i] === "--gemini") {
      gemini = true;
      continue;
    }
    if (a[i] === "--codex") {
      codex = true;
      continue;
    }
    if (a[i] === "--antigravity") {
      antigravity = true;
      continue;
    }
    if (a[i] === "install") continue;
  }

  return {
    pathArg,
    versionArg,
    tagArg,
    cursor,
    claude,
    gemini,
    codex,
    antigravity,
  };
}

function defaultDir(opts) {
  if (opts.pathArg) return resolveDir(opts.pathArg);
  if (opts.cursor) return path.join(HOME, ".cursor", "skills");
  if (opts.claude) return path.join(HOME, ".claude", "skills");
  if (opts.gemini) return path.join(HOME, ".gemini", "skills");
  if (opts.codex) {
    const codexHome = process.env.CODEX_HOME;
    if (codexHome) return path.join(codexHome, "skills");
    return path.join(HOME, ".codex", "skills");
  }
  if (opts.antigravity)
    return path.join(HOME, ".gemini", BRAND, "skills");
  // Default: ~/.gemini/rei/skills
  return path.join(HOME, ".gemini", BRAND, "skills");
}

function printHelp() {
  console.log(`
🏰 rei-skills — Rootcastle Engineering & Innovation
   Curated by Batuhan Ayrıbaş | www.rootcastle.com

  npx rei-skills [install] [options]

  Installs 883+ universal agentic skills into your AI assistant's skills directory.

Options:
  --cursor       Install to ~/.cursor/skills (Cursor)
  --claude       Install to ~/.claude/skills (Claude Code)
  --gemini       Install to ~/.gemini/skills (Gemini CLI)
  --codex        Install to ~/.codex/skills (Codex CLI)
  --antigravity  Install to ~/.gemini/${BRAND}/skills (Antigravity)
  --path <dir>   Install to <dir> (default: ~/.gemini/${BRAND}/skills)
  --version <ver>  After clone, checkout tag v<ver> (e.g. 1.0.0 -> v1.0.0)
  --tag <tag>      After clone, checkout this tag (e.g. v1.0.0)

Examples:
  npx rei-skills
  npx rei-skills --cursor
  npx rei-skills --claude
  npx rei-skills --antigravity
  npx rei-skills --version 1.0.0
  npx rei-skills --path ./my-skills

🌐 https://www.rootcastle.com | admin@rootcastle.com
`);
}

function copyRecursiveSync(src, dest, skipGit = true) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((child) => {
      if (skipGit && child === ".git") return;
      copyRecursiveSync(path.join(src, child), path.join(dest, child), skipGit);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/** Copy contents of repo's skills/ into target so each skill is target/skill-name/ */
function installSkillsIntoTarget(tempDir, target) {
  const repoSkills = path.join(tempDir, "skills");
  if (!fs.existsSync(repoSkills)) {
    console.error("Cloned repo has no skills/ directory.");
    process.exit(1);
  }
  fs.readdirSync(repoSkills).forEach((name) => {
    const src = path.join(repoSkills, name);
    const dest = path.join(target, name);
    copyRecursiveSync(src, dest);
  });
  const repoDocs = path.join(tempDir, "docs");
  if (fs.existsSync(repoDocs)) {
    const docsDest = path.join(target, "docs");
    if (!fs.existsSync(docsDest)) fs.mkdirSync(docsDest, { recursive: true });
    copyRecursiveSync(repoDocs, docsDest);
  }
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status == null ? 1 : r.status);
}

function main() {
  const opts = parseArgs();
  const { tagArg, versionArg } = opts;

  if (opts.help) {
    printHelp();
    return;
  }

  console.log("\n🏰 Rei Skills — Rootcastle Engineering & Innovation");
  console.log("   Curated by Batuhan Ayrıbaş | www.rootcastle.com\n");

  const target = defaultDir(opts);
  if (!target || !HOME) {
    console.error(
      "Could not resolve home directory. Use --path <absolute-path>.",
    );
    process.exit(1);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-skills-"));
  const originalCwd = process.cwd();

  try {
    if (process.platform === "win32") {
      run("git", ["-c", "core.symlinks=true", "clone", REPO, tempDir]);
    } else {
      run("git", ["clone", REPO, tempDir]);
    }

    const ref =
      tagArg ||
      (versionArg
        ? versionArg.startsWith("v")
          ? versionArg
          : `v${versionArg}`
        : null);
    if (ref) {
      console.log(`Checking out ${ref}…`);
      process.chdir(tempDir);
      run("git", ["checkout", ref]);
      process.chdir(originalCwd);
    }

    if (fs.existsSync(target)) {
      const gitDir = path.join(target, ".git");
      if (fs.existsSync(gitDir)) {
        console.log("Migrating from full-repo install to skills-only layout…");
        const entries = fs.readdirSync(target);
        for (const name of entries) {
          const full = path.join(target, name);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            if (fs.rmSync) {
              fs.rmSync(full, { recursive: true, force: true });
            } else {
              fs.rmdirSync(full, { recursive: true });
            }
          } else {
            fs.unlinkSync(full);
          }
        }
      } else {
        console.log(`Updating existing install at ${target}…`);
      }
    } else {
      const parent = path.dirname(target);
      if (!fs.existsSync(parent)) {
        try {
          fs.mkdirSync(parent, { recursive: true });
        } catch (e) {
          console.error(`Cannot create parent directory: ${parent}`, e.message);
          process.exit(1);
        }
      }
      fs.mkdirSync(target, { recursive: true });
    }

    installSkillsIntoTarget(tempDir, target);

    console.log(`\n✅ Rei Skills installed to ${target}`);
    console.log(
      "📦 Pick a bundle in docs/BUNDLES.md and use @skill-name in your AI assistant.",
    );
    console.log(
      "🌐 www.rootcastle.com | Engineering Beyond Boundaries\n",
    );
  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        if (fs.rmSync) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } else {
          fs.rmdirSync(tempDir, { recursive: true });
        }
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }
}

main();
