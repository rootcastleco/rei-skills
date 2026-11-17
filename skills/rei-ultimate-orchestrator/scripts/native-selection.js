"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function jsonFile(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function tokenSet(text) {
  const tokens = String(text || "").toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
  return new Set(tokens.filter(x => !["the", "for", "with", "and", "bir", "ile", "için"].includes(x)));
}

function normalizeNativeSkills(input) {
  if (!Array.isArray(input) || input.length > 100) throw new Error("Native manifest must contain up to 100 entries");
  return input.map(item => {
    if (typeof item === "string") return { name: item.slice(0, 120), description: "", uri: "" };
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return {
      name: String(item.name || "").slice(0, 120),
      description: String(item.description || "").slice(0, 600),
      uri: typeof item.uri === "string" && item.uri.startsWith("skills://") ? item.uri.slice(0, 250) : "",
    };
  }).filter(item => item && /^[a-zA-Z0-9][a-zA-Z0-9-]{1,119}$/.test(item.name));
}

function rankNative(task, list) {
  const tokens = tokenSet(task);
  return normalizeNativeSkills(list)
    .filter(item => item.name !== "rei-ultimate-orchestrator")
    .map(item => {
      const named = tokenSet(item.name.replace(/-/g, " "));
      const described = tokenSet(item.description);
      let score = 0;
      for (const tok of tokens) score += (named.has(tok) ? 4 : 0) + (described.has(tok) ? 1 : 0);
      return { ...item, score, status: "AVAILABLE_METADATA_ONLY" };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 4);
}

function safeSkillRecord(repoRoot, candidate, catalogById) {
  const id = String(candidate && candidate.id || "");
  if (!/^[a-z0-9][a-z0-9-]{1,120}$/.test(id) || id === "rei-ultimate-orchestrator") return null;
  const record = catalogById.get(id);
  if (!record) return null;
  const risk = String(record.risk || "unknown").toLowerCase();
  // Offensive skills require a separately authorized workflow; do not auto-select.
  if (risk === "offensive") return null;
  const base = fs.realpathSync(path.join(repoRoot, "skills"));
  const localFile = path.join(base, id, "SKILL.md");
  let sha256 = null;
  let fileStatus = "NOT VERIFIED";
  try {
    const real = fs.realpathSync(localFile);
    if (real !== path.join(base, id, "SKILL.md")) return null; // exclude symlink hops
    const stat = fs.statSync(real);
    if (!stat.isFile() || stat.size > 102400) return null;
    sha256 = crypto.createHash("sha256").update(fs.readFileSync(real)).digest("hex");
    fileStatus = "VERIFIED_LOCAL_FILE";
  } catch (error) {
    if (error.code !== "ENOENT") return null;
  }
  return {
    id, category: record.category || "general", risk,
    description: String(record.description || "").slice(0, 400),
    path: `skills/${id}/SKILL.md`,
    source: String(record.source || "unknown").slice(0, 160),
    sha256, fileStatus,
    approvalRequired: risk === "critical" || risk === "high" || risk === "unknown",
    selectionOnly: true,
  };
}


module.exports = { jsonFile, normalizeNativeSkills, rankNative, safeSkillRecord };
