"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BACKUP_DIR = ".rei-skills-backups";

function lstatIfPresent(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function assertWorkspace(workspacePath) {
  if (typeof workspacePath !== "string" || !workspacePath.trim()) {
    throw new Error("workspace_path must be an existing directory.");
  }
  const root = path.resolve(workspacePath);
  const stat = lstatIfPresent(root);
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("workspace_path must be an existing, non-symlink directory.");
  }
  return root;
}

function inside(root, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error("Invalid installation path.");
  }
  const result = path.resolve(root, relativePath);
  const relative = path.relative(root, result);
  if (!relative || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
    throw new Error("Installation path escapes the workspace: " + relativePath);
  }
  return result;
}

function inspectDestination(root, relativePath) {
  const destination = inside(root, relativePath);
  const parts = path.relative(root, destination).split(path.sep);
  let current = root;
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const stat = lstatIfPresent(current);
    if (!stat) continue;
    if (stat.isSymbolicLink()) {
      throw new Error("Refusing to follow a workspace symlink: " + path.relative(root, current));
    }
    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error("Installation parent is not a directory: " + path.relative(root, current));
    }
    if (index === parts.length - 1 && !stat.isFile()) {
      throw new Error("Installation destination is not a regular file: " + relativePath);
    }
  }
  return { destination, exists: Boolean(lstatIfPresent(destination)) };
}

function listStagedFiles(stagingRoot) {
  const files = [];
  function visit(directory, relativeDirectory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = path.join(relativeDirectory, entry.name);
      const fullPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error("Refusing staged symlink: " + relativePath);
      }
      if (entry.isDirectory()) visit(fullPath, relativePath);
      else if (entry.isFile()) files.push(relativePath);
      else throw new Error("Unsupported staged file type: " + relativePath);
    }
  }
  visit(stagingRoot, "");
  if (files.length === 0) throw new Error("No skill files were staged for installation.");
  return files;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/** Read-only workspace preflight. Changes only the caller-owned temporary staging directory. */
function buildInstallPlan(workspacePath, stagingRoot, conflictPolicy = "abort") {
  const root = assertWorkspace(workspacePath);
  if (!["abort", "backup"].includes(conflictPolicy)) {
    throw new Error("conflict_policy must be 'abort' or 'backup'.");
  }
  const files = listStagedFiles(stagingRoot).map((relativePath) => {
    const { destination, exists } = inspectDestination(root, relativePath);
    return {
      path: relativePath.split(path.sep).join("/"),
      action: exists ? "replace" : "create",
      originalHash: exists ? sha256(destination) : null,
      newHash: sha256(path.join(stagingRoot, relativePath)),
    };
  });
  const token = crypto.createHash("sha256").update(JSON.stringify({
    root,
    conflictPolicy,
    files,
  })).digest("hex");
  const conflicts = files.filter((file) => file.action === "replace").map((file) => file.path);
  return { root, conflictPolicy, files, conflicts, previewToken: token };
}

function summarizePlan(plan) {
  const replacements = plan.conflicts.length;
  return {
    workspace: plan.root,
    conflictPolicy: plan.conflictPolicy,
    canInstall: replacements === 0 || plan.conflictPolicy === "backup",
    fileCount: plan.files.length,
    createCount: plan.files.length - replacements,
    replaceCount: replacements,
    files: plan.files.slice(0, 40).map(({ path, action }) => ({ path, action })),
    additionalFiles: Math.max(0, plan.files.length - 40),
    conflicts: plan.conflicts.slice(0, 40),
    additionalConflicts: Math.max(0, replacements - 40),
    previewToken: plan.previewToken,
  };
}

function ensureDirectory(root, relativePath, createdDirectories) {
  const parts = relativePath.split(path.sep).filter(Boolean);
  let current = root;
  for (const segment of parts) {
    current = path.join(current, segment);
    const stat = lstatIfPresent(current);
    if (!stat) {
      fs.mkdirSync(current);
      createdDirectories.push(current);
    } else if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error("Refusing unsafe directory: " + path.relative(root, current));
    }
  }
}

function writeManifest(backupPath, manifest) {
  const target = path.join(backupPath, "manifest.json");
  fs.writeFileSync(target, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
}

/**
 * Install a fully staged set of files. Existing files require an exact, current
 * preview token AND explicit backup policy. Synchronous failures roll back all
 * touched files; persistent backups support manual recovery after interruption.
 */
function applyInstallPlan(plan, stagingRoot, options = {}) {
  const current = buildInstallPlan(plan.root, stagingRoot, plan.conflictPolicy);
  if (current.previewToken !== plan.previewToken) {
    throw new Error("Workspace changed after planning; run dry_run again.");
  }
  const replacements = current.conflicts.length;
  if (replacements && current.conflictPolicy !== "backup") {
    throw new Error("Existing files would be overwritten. Run dry_run, then use conflict_policy='backup' with its preview_token.");
  }
  if (replacements && (!options.previewToken || options.previewToken !== current.previewToken)) {
    throw new Error("Replacing files requires the current dry_run preview_token.");
  }
  if (options.previewToken && options.previewToken !== current.previewToken) {
    throw new Error("Stale preview_token; run dry_run again.");
  }

  const root = current.root;
  const transactionId = new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(6).toString("hex");
  const backupRelative = path.join(BACKUP_DIR, transactionId);
  let backupPath = null;
  const createdDirectories = [];
  const touched = [];
  const copyFile = options.copyFile || fs.copyFileSync;
  const manifest = {
    transactionId,
    status: "prepared",
    createdAt: new Date().toISOString(),
    files: current.files.map(({ path, action, originalHash, newHash }) => ({ path, action, originalHash, newHash })),
  };

  // Finish every backup before changing the first target file.
  if (replacements) {
    inspectDestination(root, path.join(BACKUP_DIR, "manifest-guard"));
    ensureDirectory(root, backupRelative, createdDirectories);
    backupPath = path.join(root, backupRelative);
    for (const file of current.files.filter((f) => f.action === "replace")) {
      const relative = file.path.split("/").join(path.sep);
      const source = inspectDestination(root, relative).destination;
      const backupRel = path.join(backupRelative, relative);
      ensureDirectory(root, path.dirname(backupRel), createdDirectories);
      fs.copyFileSync(source, path.join(root, backupRel), fs.constants.COPYFILE_EXCL);
    }
    writeManifest(backupPath, manifest);
  }

  try {
    for (const file of current.files) {
      const relative = file.path.split("/").join(path.sep);
      ensureDirectory(root, path.dirname(relative), createdDirectories);
      const checked = inspectDestination(root, relative);
      if (checked.exists !== (file.action === "replace") ||
          (checked.exists && sha256(checked.destination) !== file.originalHash)) {
        throw new Error("Destination changed during installation: " + file.path);
      }
      // Mark before copying so a partial write is also covered by rollback.
      touched.push(file);
      copyFile(path.join(stagingRoot, relative), checked.destination);
    }
    if (backupPath) {
      manifest.status = "committed";
      writeManifest(backupPath, manifest);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const file of touched.reverse()) {
      const relative = file.path.split("/").join(path.sep);
      const destination = path.join(root, relative);
      try {
        if (file.action === "replace") {
          fs.copyFileSync(path.join(backupPath, relative), destination);
        } else {
          fs.rmSync(destination, { force: true });
        }
      } catch (rollbackError) {
        rollbackErrors.push(file.path + ": " + rollbackError.message);
      }
    }
    for (const directory of createdDirectories.reverse()) {
      try {
        fs.rmdirSync(directory);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOTEMPTY" && cleanupError.code !== "ENOENT") {
          rollbackErrors.push("directory cleanup: " + cleanupError.message);
        }
      }
    }
    if (backupPath) {
      try {
        manifest.status = rollbackErrors.length ? "rollback-incomplete" : "rolled-back";
        writeManifest(backupPath, manifest);
      } catch (manifestError) {
        rollbackErrors.push("manifest: " + manifestError.message);
      }
    }
    if (rollbackErrors.length) {
      throw new Error(error.message + "; rollback incomplete: " + rollbackErrors.join("; ") +
        (backupPath ? "; recovery backup: " + backupPath : ""));
    }
    throw new Error(error.message + "; all modified files were rolled back.");
  }
  return { installedFileCount: current.files.length, backupPath, transactionId };
}

module.exports = { buildInstallPlan, summarizePlan, applyInstallPlan };
