"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

const additionallyExcluded = [
  "aws-penetration-testing", "broken-authentication", "cloud-penetration-testing", "ethical-hacking-methodology",
  "idor-testing", "metasploit-framework", "smtp-penetration-testing",
  "ssh-penetration-testing", "wordpress-penetration-testing",
];
const reviewedLicenses = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "MIT-0", "CC0-1.0", "Unlicense",
]);
const pinnedSource = /^https:\/\/(?:(?:github|gitee)\.com\/[\w.-]+\/[\w.-]+|gitlab\.com(?:\/[\w.-]+){2,}\/-)\/blob\/[a-f0-9]{40}\/(?:[^?#]*\/)?SKILL\.md$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function getReleaseScope() {
  const catalog = readJson(path.join(ROOT, "data", "catalog.json"));
  const declared = catalog.skills.filter(skill => skill.risk === "offensive");
  const excluded = new Set([...declared.map(skill => skill.id), ...additionallyExcluded]);
  return { catalog, declared, excluded };
}

function isExcludedPath(relative, excluded) {
  if (!relative.startsWith("skills/")) return false;
  const parts = relative.split("/");
  return parts.slice(1).some((_, index) => excluded.has(parts.slice(1, index + 2).join("/")));
}

function pruneRegistry(value, excluded) {
  if (typeof value === "string") return excluded.has(value) || isExcludedPath(value, excluded) ? undefined : value;
  if (Array.isArray(value)) {
    return value.map(entry => pruneRegistry(entry, excluded)).filter(entry => entry !== undefined);
  }
  if (!value || typeof value !== "object") return value;
  const ids = [value.id, value.skillId, value.skill_id, value.skill, value.slug];
  if (value.risk === "offensive" || ids.some(id => excluded.has(id))
      || (typeof value.path === "string" && isExcludedPath(value.path, excluded))) return undefined;
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const projected = pruneRegistry(entry, excluded);
    return excluded.has(key) || projected === undefined ? [] : [[key, projected]];
  }));
}

function makeReviewedSkills(target, excluded) {
  const index = readJson(path.join(ROOT, "data", "external-reviewed.json"));
  const records = [];
  for (const item of index) {
    const id = item.id;
    if (id.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || excluded.has(id)
        || !reviewedLicenses.has(item.license) || !pinnedSource.test(item.publisherUrl)
        || !item.files["SKILL.md"] || !item.files.LICENSE) throw new Error(`Invalid reviewed skill: ${id}`);
    const source = path.join(ROOT, "registry", "external-reviewed", id);
    const destination = path.join(target, "skills", id);
    if (fs.existsSync(destination)) throw new Error(`Reviewed skill collides with the package: ${id}`);
    for (const [file, expected] of Object.entries(item.files)) {
      if (!["LICENSE", "NOTICE"].includes(file) && !/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.md$/.test(file)) {
        throw new Error(`Unexpected file in ${id}`);
      }
      const contents = fs.readFileSync(path.join(source, file));
      if (createHash("sha256").update(contents).digest("hex") !== expected) {
        throw new Error(`Reviewed content changed: ${id}/${file}`);
      }
      const output = path.join(destination, file);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, contents, { flag: "wx" });
    }
    records.push({ id, name: id, path: `skills/${id}/SKILL.md`, description: item.description,
      category: item.category || "development", tags: id.split("-"), triggers: id.split("-"), risk: "safe",
      source: item.publisherUrl, license: item.license, reviewUrl: item.reviewUrl });
  }
  return records;
}

function updateQualitySummary(dataDir) {
  const file = path.join(dataDir, "quality-report.json");
  const report = readJson(file);
  const rows = report.skills;
  const count = predicate => rows.filter(predicate).length;
  const average = (key, precision) => Number((rows.reduce((sum, row) => sum + row[key], 0)
    / Math.max(rows.length, 1)).toFixed(precision));
  const tiers = Object.fromEntries(["Q3", "Q2", "Q1", "Q0"].map(tier => [tier, count(row => row.quality_tier === tier)]));
  const goldManifest = readJson(path.join(dataDir, "gold50-manifest.json"));
  Object.assign(report.summary, {
    total_skills: rows.length,
    schema_valid_count: count(row => row.schema_valid),
    references_valid_count: count(row => row.references_valid),
    security_compliant_count: count(row => row.security_compliant),
    tested_module_count: count(row => row.verification_tier === "tested-module"),
    average_documentation_score: average("documentation_score", 1),
    tier_counts: tiers,
    quarantined_count: tiers.Q0,
    evaluation_passed_count: count(row => row.verification_dimensions.evaluationPassed),
    human_reviewed_count: count(row => row.verification_dimensions.humanReviewed),
    hardware_verified_count: count(row => row.verification_dimensions.hardwareVerified),
    average_score_14: average("quality_score_14", 2),
  });
  if (goldManifest.skills.length !== goldManifest.totalSkills) {
    report.summary.gold50_verified_count = Math.min(report.summary.gold50_verified_count, goldManifest.skills.length);
  }
  writeJson(file, report);
}

function stageRelease(target) {
  const sourceManifest = readJson(path.join(ROOT, "package.json"));
  if (!sourceManifest.private) throw new Error("The repository package must be private; publish only the staged release.");
  fs.mkdirSync(target, { recursive: true });
  if (fs.readdirSync(target).length) throw new Error("The release destination must be empty.");
  const { catalog, declared, excluded } = getReleaseScope();
  const inventory = JSON.parse(execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["pack", "--ignore-scripts", "--dry-run", "--json"], {
      cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, shell: process.platform === "win32",
    }))[0];
  for (const { path: relative } of inventory.files) {
    if (relative === "package.json" || isExcludedPath(relative, excluded)) continue;
    if (path.posix.isAbsolute(relative) || relative.split("/").includes("..") || relative.includes("\\")) {
      throw new Error(`Invalid package member: ${relative}`);
    }
    const file = path.join(ROOT, relative);
    const output = path.join(target, relative);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    if (relative.startsWith("data/") && relative.endsWith(".json")) {
      writeJson(output, pruneRegistry(readJson(file), excluded));
    } else {
      fs.copyFileSync(file, output);
    }
  }

  const distribution = path.join(target, "data");
  const reviewed = makeReviewedSkills(target, excluded);
  const filtered = catalog.skills.filter(skill => !excluded.has(skill.id));
  const skills = [...filtered, ...reviewed].sort((a, b) => a.id.localeCompare(b.id, "en"));
  for (const skill of skills) {
    if (!fs.existsSync(path.join(target, skill.path))) throw new Error(`Missing packaged skill: ${skill.id}`);
  }
  writeJson(path.join(distribution, "catalog.json"), { ...catalog, total: skills.length, skills });
  const indexPath = path.join(distribution, "skills_index.json");
  writeJson(indexPath, [...readJson(indexPath), ...reviewed.map(skill => ({ ...skill, path: `skills/${skill.id}` }))]);
  updateQualitySummary(distribution);

  const { private: _, ...manifest } = sourceManifest;
  writeJson(path.join(target, "package.json"), { ...manifest, reiSkillsDistribution: true });
  console.log(`Staged ${filtered.length} repository skills and ${reviewed.length} reviewed upstream skills. `
    + `Excluded ${declared.length} offensive entries and ${excluded.size - declared.length} additional entries.`);
}

if (require.main === module) {
  if (process.argv.length !== 3) throw new Error("Usage: node scripts/stage-npm-release.js <empty-directory>");
  stageRelease(path.resolve(process.argv[2]));
}

module.exports = { getReleaseScope, isExcludedPath, stageRelease };
