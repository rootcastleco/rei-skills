#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const DEFAULT_MANIFEST = path.join(ROOT, "data", "skill-evaluator-batches.json");
const MAX_SIZE = 100;

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function walkSkillDirectories(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fs.existsSync(path.join(full, "SKILL.md"))) found.push(full);
      found.push(...walkSkillDirectories(full));
    }
  }
  return found;
}

function catalogDescriptor() {
  const entries = walkSkillDirectories(SKILLS_DIR).sort((a, b) =>
    path.relative(ROOT, a).localeCompare(path.relative(ROOT, b))
  );
  const hash = crypto.createHash("sha256");
  for (const dir of entries) {
    const relDir = path.relative(ROOT, dir).split(path.sep).join("/");
    const skillFile = path.join(dir, "SKILL.md");
    hash.update(`${relDir}\0${sha256(fs.readFileSync(skillFile))}\0`);
  }
  return {
    count: entries.length,
    sha256: hash.digest("hex"),
    skillPaths: entries.map((dir) => path.relative(ROOT, dir).split(path.sep).join("/")),
  };
}

function generate(outputPath, commit) {
  const catalog = catalogDescriptor();
  if (catalog.count === 0) throw new Error("No skill directories containing SKILL.md found");
  const batches = [];
  for (let i = 0; i < catalog.skillPaths.length; i += MAX_SIZE) {
    const paths = catalog.skillPaths.slice(i, i + MAX_SIZE);
    batches.push({
      id: `batch-${String(batches.length + 1).padStart(2, "0")}`,
      count: paths.length,
      paths,
    });
  }
  const manifest = {
    schemaVersion: "rei.skill-evaluator-batches.v1",
    catalogSha256: catalog.sha256,
    commit: commit || null,
    maxSkillsPerBatch: MAX_SIZE,
    totalSkills: catalog.count,
    batchCount: batches.length,
    batches,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function verify(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const catalog = catalogDescriptor();
  if (manifest.schemaVersion !== "rei.skill-evaluator-batches.v1") throw new Error("Unsupported manifest schema");
  if (manifest.catalogSha256 !== catalog.sha256) throw new Error("Catalog SHA-256 does not match the current skill catalog");
  if (manifest.totalSkills !== catalog.count) throw new Error("Manifest totalSkills does not match the catalog");
  if (manifest.batchCount !== manifest.batches.length) throw new Error("Manifest batchCount mismatch");
  if (manifest.maxSkillsPerBatch > MAX_SIZE) throw new Error("Manifest exceeds 100 skills per batch");

  const seen = new Set();
  for (const batch of manifest.batches) {
    if (batch.count !== batch.paths.length) throw new Error(`${batch.id}: count mismatch`);
    if (batch.paths.length > MAX_SIZE) throw new Error(`${batch.id}: exceeds 100 skills`);
    for (const skillPath of batch.paths) {
      if (!fs.existsSync(path.join(ROOT, skillPath, "SKILL.md"))) throw new Error(`${batch.id}: missing ${skillPath}/SKILL.md`);
      if (seen.has(skillPath)) throw new Error(`${batch.id}: duplicate ${skillPath}`);
      seen.add(skillPath);
    }
  }
  if (seen.size !== catalog.count) throw new Error("Manifest does not account for every catalog skill exactly once");
  for (const skillPath of catalog.skillPaths) {
    if (!seen.has(skillPath)) throw new Error(`Missing catalog skill ${skillPath}`);
  }
  return manifest;
}

function findJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findJsonFiles(full));
    else if (entry.name === "summary.json") found.push(full);
  }
  return found;
}

function evidenceStatus(files) {
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const serialized = JSON.stringify(data).toUpperCase();
      if (serialized.includes("NOT VERIFIED")) return "NOT VERIFIED";
      if (serialized.includes('"STATUS":"FAIL"') ||
          serialized.includes('"VERDICT":"FAIL"') ||
          serialized.includes('"CONCLUSION":"FAILURE"') ||
          serialized.includes('"STATUS":"FAILURE"')) return "FAIL";
      if (serialized.includes('"STATUS":"PASS"') ||
          serialized.includes('"VERDICT":"PASS"')) return "PASS";
    } catch {
      return "NOT VERIFIED";
    }
  }
  return "NOT VERIFIED";
}

function aggregate(manifestPath, evidenceDir, commit, outputPath) {
  const manifest = verify(manifestPath);
  if (commit && manifest.commit && manifest.commit !== commit) throw new Error("Manifest commit does not match aggregate commit");
  const summaries = [];
  for (const batch of manifest.batches) {
    const batchEvidenceDir = path.join(evidenceDir, batch.id);
    let files = findJsonFiles(batchEvidenceDir);
    if (!files.length) {
      for (const candidate of fs.readdirSync(evidenceDir, { withFileTypes: true })) {
        if (candidate.isDirectory() && candidate.name.includes(batch.id)) {
          files = findJsonFiles(path.join(evidenceDir, candidate.name));
          if (files.length) break;
        }
      }
    }
    const status = evidenceStatus(files);
    summaries.push({ id: batch.id, status, skillCount: batch.count, evidenceFiles: files.map((file) => path.relative(evidenceDir, file)) });
  }
  const failed = summaries.filter((item) => item.status === "FAIL");
  const incomplete = summaries.filter((item) => item.status === "NOT VERIFIED");
  const passed = summaries.filter((item) => item.status === "PASS");
  const report = {
    schemaVersion: "rei.skill-evaluator-summary.v1",
    status: failed.length || incomplete.length ? "FAIL" : "PASS",
    commit: commit || manifest.commit,
    catalogSha256: manifest.catalogSha256,
    batchCount: manifest.batchCount,
    totalSkills: manifest.totalSkills,
    passedBatches: passed.length,
    failedBatches: failed.map((item) => item.id),
    incompleteBatches: incomplete.map((item) => item.id),
    batches: summaries,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

function usage() {
  console.error("Usage: node scripts/skill-evaluator-batches.js generate [--output FILE] [--commit SHA] | verify [MANIFEST] | aggregate --manifest FILE --evidence DIR --commit SHA --output FILE");
  process.exit(2);
}

const [, , command, ...args] = process.argv;
function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

try {
  if (command === "generate") {
    const output = option("--output") || DEFAULT_MANIFEST;
    const manifest = generate(path.resolve(output), option("--commit"));
    process.stdout.write(JSON.stringify({ manifest: path.resolve(output), totalSkills: manifest.totalSkills, batchCount: manifest.batchCount, catalogSha256: manifest.catalogSha256 }));
  } else if (command === "verify") {
    const manifest = verify(path.resolve(args[0] || DEFAULT_MANIFEST));
    console.log(`PASS: ${manifest.totalSkills} skills accounted for exactly once across ${manifest.batchCount} batches; catalog ${manifest.catalogSha256}`);
  } else if (command === "aggregate") {
    const report = aggregate(
      path.resolve(option("--manifest") || DEFAULT_MANIFEST),
      path.resolve(option("--evidence") || "."),
      option("--commit"),
      path.resolve(option("--output") || "skill-evaluator-summary.json")
    );
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "PASS") process.exitCode = 1;
  } else {
    usage();
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
