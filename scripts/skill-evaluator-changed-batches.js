#!/usr/bin/env node
"use strict";
// Deterministically partition only changed, still-present skills into Tier 1 batches <=100.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const MAX = 100;

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function fail(message) { throw new Error(message); }
function isSha(value) { return /^[0-9a-f]{40}$/.test(value || ""); }
function runGit(args) {
  const proc = cp.spawnSync("git", args, {
    cwd: root, encoding: "buffer", maxBuffer: 8 * 1024 * 1024,
  });
  if (proc.status !== 0) fail("git diff failed: " + proc.stderr.toString().slice(0, 300));
  return proc.stdout;
}
function currentSkills() {
  const paths = [];
  const skills = path.join(root, "skills");
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, "SKILL.md"))) {
        paths.push(path.relative(root, full).replaceAll(path.sep, "/"));
      }
      walk(full);
    }
  }
  walk(skills);
  return new Set(paths);
}
function changedPaths(base, head) {
  const output = runGit(["diff", "--name-only", "-z", "--diff-filter=ACMRT", base, head, "--", "skills"]);
  return output.toString("utf8").split("\0").filter(Boolean);
}
function createManifest(base, head, fixtureFile) {
  if (!isSha(base) || !isSha(head)) fail("base/head must be exact commit SHAs");
  const all = currentSkills();
  const changed = new Set();
  if (fixtureFile) {
    // Explicit test fixture mode: verify partitioning without assuming Git history exists.
    const ids = fs.readFileSync(fixtureFile, "utf8").split("\n").filter(Boolean);
    for (const id of ids) {
      if (!all.has(id)) fail("unknown fixture skill: " + id);
      changed.add(id);
    }
  } else {
    const paths = changedPaths(base, head);
    for (const filename of paths) {
      const pieces = filename.split("/");
      if (pieces.length < 3 || pieces[0] !== "skills") continue;
      // One REI skill per top-level directory. Support files also select that skill.
      const candidate = pieces.slice(0, 2).join("/");
      if (all.has(candidate)) changed.add(candidate);
    }
  }
  const sorted = [...changed].sort();
  const batches = [];
  for (let i = 0; i < sorted.length; i += MAX) {
    const group = sorted.slice(i, i + MAX);
    batches.push({
      id: "changed-" + String(batches.length + 1).padStart(2, "0"),
      count: group.length,
      paths: group,
    });
  }
  const digest = crypto.createHash("sha256").update(sorted.join("\n")).digest("hex");
  const manifest = {
    schemaVersion: "rei.changed-skills.v1",
    base,
    head,
    batchLimit: MAX,
    totalChangedSkills: sorted.length,
    digest,
    batches,
  };
  verifyManifest(manifest);
  return manifest;
}
function verifyManifest(manifest) {
  if (manifest.schemaVersion !== "rei.changed-skills.v1") fail("invalid schema");
  if (manifest.batchLimit !== MAX) fail("batch size mismatch");
  const expected = new Set();
  const all = currentSkills();
  for (const batch of manifest.batches) {
    if (batch.count !== batch.paths.length) fail("wrong count: " + batch.id);
    if (!batch.count || batch.count > MAX) fail("invalid size: " + batch.id);
    for (const p of batch.paths) {
      if (!all.has(p)) fail("unknown skill: " + p);
      if (expected.has(p)) fail("duplicate skill: " + p);
      expected.add(p);
    }
  }
  if (expected.size !== manifest.totalChangedSkills) fail("partition coverage mismatch");
  const digest = crypto.createHash("sha256").update([...expected].sort().join("\n")).digest("hex");
  if (digest !== manifest.digest) fail("manifest integrity mismatch");
  if (manifest.totalChangedSkills > 0 && manifest.batches.length < 1) fail("missing batches");
  return manifest;
}
try {
  const cmd = process.argv[2];
  if (cmd === "generate") {
    const base = getArg("--base");
    const head = getArg("--head");
    const dest = getArg("--output");
    if (!dest) fail("missing --output");
    const manifest = createManifest(base, head, getArg("--paths-file"));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(JSON.stringify({ count: manifest.totalChangedSkills, batches: manifest.batches.length, digest: manifest.digest }));
  } else if (cmd === "verify") {
    const file = process.argv[3];
    if (!file) fail("missing manifest");
    const manifest = verifyManifest(JSON.parse(fs.readFileSync(file, "utf8")));
    console.log("PASS: " + manifest.totalChangedSkills + " changed skills partitioned exactly once into " + manifest.batches.length + " batches");
  } else {
    fail("Usage: generate --base SHA --head SHA --output FILE | verify FILE");
  }
} catch (e) {
  console.error("FAIL: " + e.message);
  process.exitCode = 1;
}
