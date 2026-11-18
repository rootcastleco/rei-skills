const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const script = path.join(root, "scripts/skill-evaluator-batches.js");

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-skill-batches-"));
const manifestPath = path.join(tempDir, "manifest.json");
let result = run(["generate", "--output", manifestPath, "--commit", "a".repeat(40)]);
assert.strictEqual(result.status, 0, result.stderr);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.strictEqual(manifest.commit, "a".repeat(40));
assert.ok(manifest.totalSkills > 100);
assert.ok(manifest.batchCount >= 15);
assert.ok(manifest.batches.every((batch) => batch.count <= 100));

const seen = new Set();
for (const batch of manifest.batches) {
  for (const skillPath of batch.paths) {
    assert.ok(fs.existsSync(path.join(root, skillPath, "SKILL.md")), `missing ${skillPath}`);
    assert.ok(!seen.has(skillPath), `duplicate ${skillPath}`);
    seen.add(skillPath);
  }
}
assert.strictEqual(seen.size, manifest.totalSkills);

result = run(["verify", manifestPath]);
assert.strictEqual(result.status, 0, result.stderr);
assert.match(result.stdout, /PASS: \d+ skills accounted for exactly once/);

const evidenceDir = path.join(tempDir, "evidence");
for (const batch of manifest.batches) {
  const folder = path.join(evidenceDir, `${batch.id}-other`);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "summary.json"), JSON.stringify({ status: "PASS", batch: batch.id }));
}
const summaryPath = path.join(tempDir, "summary.json");
result = run(["aggregate", "--manifest", manifestPath, "--evidence", evidenceDir, "--commit", "a".repeat(40), "--output", summaryPath]);
assert.strictEqual(result.status, 0, result.stderr);
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
assert.strictEqual(summary.status, "PASS");
assert.strictEqual(summary.passedBatches, manifest.batchCount);
assert.strictEqual(summary.failedBatches.length, 0);
assert.strictEqual(summary.incompleteBatches.length, 0);
assert.strictEqual(summary.commit, "a".repeat(40));
assert.strictEqual(summary.catalogSha256, manifest.catalogSha256);

const incompleteBatch = manifest.batches[0];
fs.rmSync(path.join(evidenceDir, `${incompleteBatch.id}-other`), { recursive: true });
const incompleteSummaryPath = path.join(tempDir, "incomplete-summary.json");
result = run(["aggregate", "--manifest", manifestPath, "--evidence", evidenceDir, "--commit", "a".repeat(40), "--output", incompleteSummaryPath]);
assert.strictEqual(result.status, 1);
const incompleteSummary = JSON.parse(fs.readFileSync(incompleteSummaryPath, "utf8"));
assert.strictEqual(incompleteSummary.status, "FAIL");
assert.deepStrictEqual(incompleteSummary.incompleteBatches, [incompleteBatch.id]);

console.log("PASS: SkillEvaluator batch partitioning, exact coverage and aggregation");
