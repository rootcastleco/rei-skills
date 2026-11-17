"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildPlan, parseArgs, rankNative, safeSkillRecord } = require("./orchestrate");

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rei-ultimate-test-"));
  try {
    const skills = path.join(dir, "skills");
    fs.mkdirSync(path.join(skills, "rc-kicad-check"), { recursive: true });
    fs.writeFileSync(path.join(skills, "rc-kicad-check", "SKILL.md"), "---\nname: rc-kicad-check\n---\n# Reviewed\n");
    fs.mkdirSync(path.join(skills, "rei-ultimate-orchestrator"));
    fs.writeFileSync(path.join(skills, "rei-ultimate-orchestrator", "SKILL.md"), "# self");
    fs.symlinkSync(path.join(dir, "outside"), path.join(skills, "malicious-symlink"));
    fs.mkdirSync(path.join(dir, "outside"));
    fs.writeFileSync(path.join(dir, "outside", "SKILL.md"), "# untrusted");
    const catalog = { skills: [
      { id: "rc-kicad-check", description: "KiCad PCB validation", risk: "critical", category: "testing" },
      { id: "rei-ultimate-orchestrator", description: "self", risk: "safe" },
      { id: "offensive-skill", description: "active intrusion", risk: "offensive" },
      { id: "malicious-symlink", description: "external link", risk: "safe" },
    ] };
    const wanted = ["rei-ultimate-orchestrator", "rc-kicad-check", "offensive-skill", "malicious-symlink", "../secrets"];
    const router = { recommendForTask: () => ({ recommendedSkills: wanted.map(id => ({ id })) }) };
    let syncCalls = 0;
    let cache = null;
    const fallback = { cacheStatus: "bundled_fallback", prompts: [], fetchedAt: "1970-01-01T00:00:00Z" };
    const archive = {
      loadSnapshot: () => { if (!cache) throw Error("no cache"); return cache; },
      loadBundledFallbackSnapshot: () => fallback,
      syncArchive: async () => { syncCalls++; cache = { cacheStatus: "fresh", prompts: [], fetchedAt: "2026-11-18" }; },
      composePrompt: (task, snapshot, options) => ({
        prompt: `Reviewed draft for ${task}`,
        matches: [{ id: "verified-ref", sha256: "e".repeat(64), trustClassification: "UNTRUSTED_EXTERNAL_REFERENCE" }],
        cacheStatus: snapshot.cacheStatus,
        contextChars: 100,
        optionsUsed: options,
      }),
    };
    const adapters = { catalog, bundles: {}, workflows: {}, router, archive };
    const config = {
      task: "KiCad PCB board audit", files: ["board.kicad_pcb"], repoRoot: dir,
      nativeSkills: [{ name: "rootcastle-embedded-systems", description: "KiCad PCB firmware engineering", uri: "skills://rootcastle-embedded-systems" }],
    };
    const online = await buildPlan(config, adapters);
    assert.equal(online.status, "PLANNED_NOT_EXECUTED");
    assert.equal(online.reiSkills.length, 1);
    assert.equal(online.reiSkills[0].id, "rc-kicad-check");
    assert.equal(online.reiSkills[0].approvalRequired, true);
    assert.match(online.reiSkills[0].sha256, /^[a-f0-9]{64}$/);
    assert.equal(online.nativeSkills[0].name, "rootcastle-embedded-systems");
    assert.equal(online.promptArchive.cacheStatus, "fresh");
    assert.equal(syncCalls, 1);
    assert.equal(online.executionPolicy.actualExecution, false);
    const offline = await buildPlan({ ...config, offline: true, nativeSkills: [] }, adapters);
    assert.equal(syncCalls, 1, "offline mode must not touch network");
    assert.equal(offline.nativeSkillDiscovery.startsWith("NOT VERIFIED"), true);
    assert.equal(offline.promptArchive.requiresApproval, true);
    assert(!online.reiSkills.some(s => s.id === "rei-ultimate-orchestrator" || s.id === "offensive-skill"));
    const invalidPath = safeSkillRecord(dir, { id: "../secrets" }, new Map(catalog.skills.map(s => [s.id, s])));
    assert.equal(invalidPath, null);
    assert.equal(rankNative("vibration", [{ name: "docx", description: "document editing" }]).length, 0);
    assert.throws(() => parseArgs(["--unknown"]), /Invalid flag/);
    assert.throws(() => parseArgs(["--task"]), /Invalid flag/);
    assert.equal(parseArgs(["--task", "review", "--offline"]).offline, true);
    await assert.rejects(() => buildPlan({ ...config, task: "X".repeat(4001) }, adapters), /max 4000/);
    const linkRecord = safeSkillRecord(dir, { id: "malicious-symlink" }, new Map(catalog.skills.map(s => [s.id, s])));
    assert.equal(linkRecord, null, "symlink must not leave skill root");
    console.log("PASS: REI Ultimate planning, real-native metadata, prompt cache, offline mode, recursion, risk gating, path checks");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
