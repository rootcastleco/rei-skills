#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { buildPlan } = require("./orchestration-plan");
const { jsonFile, rankNative, normalizeNativeSkills, safeSkillRecord } = require("./native-selection");
const MAX_NATIVE_BYTES = 32768;

function parseArgs(args) {
  const options = { files: [], nativeSkills: [] };
  const flags = new Set(["--offline", "--help"]);
  const allowed = new Set(["--task", "--files", "--native-manifest", "--repo-root", "--cache-dir", "--output", "--max-skills", "--max-context-chars", "--commit", "--version"]);
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (flags.has(key)) { if (key === "--offline") options.offline = true; else options.help = true; continue; }
    if (!allowed.has(key) || i + 1 >= args.length || args[i+1].startsWith("--")) throw new Error("Invalid flag or missing value: " + key);
    const value = args[++i];
    if (key === "--task") options.task = value;
    if (key === "--files") options.files = value.split(",").map(x => x.trim()).filter(Boolean);
    if (key === "--repo-root") options.repoRoot = value;
    if (key === "--cache-dir") options.cacheDir = value;
    if (key === "--output") options.output = value;
    if (key === "--commit") options.commit = value;
    if (key === "--version") options.version = value;
    if (key === "--max-skills") options.maxSkills = Number(value);
    if (key === "--max-context-chars") options.maxContextChars = Number(value);
    if (key === "--native-manifest") {
      const file = path.resolve(value);
      if (fs.statSync(file).size > MAX_NATIVE_BYTES) throw new Error("Native skill manifest exceeds 32 KiB");
      const parsed = jsonFile(file);
      options.nativeSkills = normalizeNativeSkills(Array.isArray(parsed) ? parsed : parsed.skills);
    }
  }
  return options;
}

async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    process.stdout.write("Usage: node orchestrate.js --task TEXT [--files a,b] [--repo-root PATH] [--native-manifest JSON] [--offline] [--output NEW_JSON]\n");
    return;
  }
  const result = await buildPlan(options);
  const text = JSON.stringify(result, null, 2) + "\n";
  if (options.output) {
    const target = path.resolve(options.output);
    fs.writeFileSync(target, text, { flag: "wx", mode: 0o600 });
    process.stdout.write("Wrote planning-only report: " + target + "\n");
  } else process.stdout.write(text);
}

if (require.main === module) main().catch(e => { process.stderr.write("REI Ultimate: " + e.message + "\n"); process.exitCode = 2; });
module.exports = { buildPlan, parseArgs, rankNative, normalizeNativeSkills, safeSkillRecord };
