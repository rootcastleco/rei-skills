"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { buildInstallPlan, summarizePlan, applyInstallPlan } = require("../../lib/mcp-safe-install");
const { executeToolCall } = require("../../bin/mcp-server");

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rei-mcp-safe-test-"));
  const workspace = path.join(root, "workspace");
  const staging = path.join(root, "staging");
  fs.mkdirSync(workspace);
  fs.mkdirSync(staging);
  try { run({ root, workspace, staging }); }
  finally { fs.rmSync(root, { force: true, recursive: true }); }
}

function put(root, relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  return target;
}

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function plan(workspace, staging, policy = "abort") {
  return buildInstallPlan(workspace, staging, policy);
}

console.log("Running REI MCP safe installation and rollback tests...");

// Planning is read-only for the user workspace and reports all collisions.
fixture(({ workspace, staging }) => {
  put(staging, "agents/new.md", "new");
  put(staging, "AGENTS.md", "replacement");
  put(workspace, "AGENTS.md", "original");
  const before = fs.readdirSync(workspace).sort();
  const preview = summarizePlan(plan(workspace, staging));
  assert.deepStrictEqual(fs.readdirSync(workspace).sort(), before);
  assert.strictEqual(preview.fileCount, 2);
  assert.strictEqual(preview.replaceCount, 1);
  assert.strictEqual(preview.canInstall, false);
  assert.deepStrictEqual(preview.conflicts, ["AGENTS.md"]);
  assert.match(preview.previewToken, /^[a-f0-9]{64}$/);
  assert.throws(() => applyInstallPlan(plan(workspace, staging), staging), /Existing files would be overwritten/);
  assert.strictEqual(read(workspace, "AGENTS.md"), "original");
  assert.strictEqual(fs.existsSync(path.join(workspace, "agents")), false);
});

// A replacement is allowed only with backup policy and the matching preview token.
fixture(({ workspace, staging }) => {
  put(staging, "AGENTS.md", "updated content");
  put(workspace, "AGENTS.md", "existing user document");
  const initial = plan(workspace, staging, "backup");
  assert.throws(() => applyInstallPlan(initial, staging), /preview_token/);
  assert.throws(() => applyInstallPlan(initial, staging, { previewToken: "bad" }), /preview_token/);
  put(workspace, "AGENTS.md", "user changed it after preview");
  assert.throws(() => applyInstallPlan(initial, staging, { previewToken: initial.previewToken }), /Workspace changed/);
  assert.strictEqual(read(workspace, "AGENTS.md"), "user changed it after preview");

  const refreshed = plan(workspace, staging, "backup");
  const result = applyInstallPlan(refreshed, staging, { previewToken: refreshed.previewToken });
  assert.strictEqual(read(workspace, "AGENTS.md"), "updated content");
  assert.strictEqual(read(result.backupPath, "AGENTS.md"), "user changed it after preview");
  const manifest = JSON.parse(read(result.backupPath, "manifest.json"));
  assert.strictEqual(manifest.status, "committed");
  assert.strictEqual(manifest.files[0].action, "replace");
  assert.strictEqual(result.installedFileCount, 1);
});

// On failed or partial writes, restore all prior content and remove created files.
fixture(({ workspace, staging }) => {
  put(workspace, "a-existing.md", "original");
  put(staging, "a-existing.md", "new");
  put(staging, "z-created.md", "new");
  const before = plan(workspace, staging, "backup");
  let writes = 0;
  const partiallyFailingCopy = (src, dest) => {
    writes++;
    if (writes === 2) {
      fs.writeFileSync(dest, "partial");
      throw new Error("simulated disk failure");
    }
    fs.copyFileSync(src, dest);
  };
  assert.throws(() => applyInstallPlan(before, staging, {
    previewToken: before.previewToken,
    copyFile: partiallyFailingCopy,
  }), /rolled back/);
  assert.strictEqual(read(workspace, "a-existing.md"), "original");
  assert.strictEqual(fs.existsSync(path.join(workspace, "z-created.md")), false);
  const rootBackups = path.join(workspace, ".rei-skills-backups");
  const backups = fs.readdirSync(rootBackups);
  assert.strictEqual(backups.length, 1);
  assert.strictEqual(JSON.parse(read(path.join(rootBackups, backups[0]), "manifest.json")).status, "rolled-back");
});

// File and directory clashes must fail closed; untrusted workspace links must not be followed.
fixture(({ root, workspace, staging }) => {
  put(staging, "nested/new.md", "safe");
  put(workspace, "nested", "not a folder");
  assert.throws(() => plan(workspace, staging), /not a directory/);

  fs.rmSync(path.join(workspace, "nested"));
  const external = put(root, "outside.txt", "outside untouched");
  try {
    fs.symlinkSync(external, path.join(workspace, "nested"));
    assert.throws(() => plan(workspace, staging), /symlink/);
    assert.strictEqual(fs.readFileSync(external, "utf8"), "outside untouched");
  } catch (error) {
    if (!["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) throw error;
  }
});

// Staging links, bad workspace and invalid policy never lead to silent success.
fixture(({ root, workspace, staging }) => {
  put(staging, "safe.md", "safe");
  assert.throws(() => plan(path.join(root, "missing"), staging), /existing.*directory/);
  assert.throws(() => plan(workspace, staging, "overwrite"), /conflict_policy/);
  const outside = put(root, "outside.md", "untrusted");
  try {
    fs.symlinkSync(outside, path.join(staging, "linked.md"));
    assert.throws(() => plan(workspace, staging), /staged symlink/);
  } catch (error) {
    if (!["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) throw error;
  }
});

// End-to-end MCP: no workspace mutation on preview, both native paths installed,
// default collisions denied, backups recorded on explicitly approved updates.
fixture(({ workspace }) => {
  const input = {
    target_name: "rei-rea-orchestrator",
    ai_assistant: "cursor",
    workspace_path: workspace,
    generate_agents_md: true,
  };
  const preview = executeToolCall("rei_install_skill", { ...input, dry_run: true });
  assert.strictEqual(preview.status, "dry-run");
  assert.strictEqual(preview.replaceCount, 0);
  assert.strictEqual(fs.readdirSync(workspace).length, 0);
  assert.strictEqual(fs.existsSync(path.join(workspace, "AGENTS.md")), false);

  const installed = executeToolCall("rei_install_skill", input);
  assert.strictEqual(installed.status, "installed");
  assert.strictEqual(installed.installedCount, 1);
  assert(fs.existsSync(path.join(workspace, ".cursor", "skills", "rei-rea-orchestrator", "SKILL.md")));
  assert(fs.existsSync(path.join(workspace, ".cursor", "rules", "rei-rea-orchestrator.mdc")));
  assert(fs.existsSync(path.join(workspace, "AGENTS.md")));

  put(workspace, "AGENTS.md", "personal instructions");
  const deniedPreview = executeToolCall("rei_install_skill", { ...input, dry_run: true });
  assert.strictEqual(deniedPreview.canInstall, false);
  assert.throws(() => executeToolCall("rei_install_skill", input), /Existing files would be overwritten/);
  assert.strictEqual(read(workspace, "AGENTS.md"), "personal instructions");

  const allowedPreview = executeToolCall("rei_install_skill", {
    ...input, dry_run: true, conflict_policy: "backup",
  });
  assert.strictEqual(allowedPreview.canInstall, true);
  assert(allowedPreview.replaceCount >= 3);
  const allowed = executeToolCall("rei_install_skill", {
    ...input, conflict_policy: "backup", preview_token: allowedPreview.previewToken,
  });
  assert.strictEqual(allowed.status, "installed");
  assert(allowed.backupPath);
  assert.strictEqual(read(allowed.backupPath, "AGENTS.md"), "personal instructions");
  assert.notStrictEqual(read(workspace, "AGENTS.md"), "personal instructions");
  assert.strictEqual(JSON.parse(read(allowed.backupPath, "manifest.json")).status, "committed");
  assert.throws(() => executeToolCall("rei_install_skill", {
    ...input, target_name: "../../tmp", dry_run: true,
  }), /Unknown skill or bundle/);
});

console.log("MCP safe install tests passed.");
