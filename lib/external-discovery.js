"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");
const { gunzipSync } = require("node:zlib");

const DATA = path.join(__dirname, "..", "data");

function loadExternalDiscovery() {
  const [snapshot, ...external] = gunzipSync(fs.readFileSync(path.join(DATA, "external-discovery.jsonl.gz")))
    .toString("utf8").trimEnd().split("\n").map(JSON.parse);
  if (snapshot.schemaVersion !== 1 || snapshot.total !== external.length) {
    throw new Error("Invalid external discovery snapshot");
  }
  const packages = JSON.parse(fs.readFileSync(path.join(DATA, "external-reviewed.json"), "utf8"));
  const reviewed = new Map(packages.map(item => [item.id, item]));
  const records = external.map(entry => {
    const item = reviewed.get(entry.name);
    if (!item || (item.discoveryId && item.discoveryId !== entry.id)) return entry;
    return { ...entry, reviewUrl: item.reviewUrl, reviewedSourceUrl: item.publisherUrl, npmSkill: item.id };
  });
  const names = new Set(records.map(record => record.name));
  for (const item of packages) {
    if (!names.has(item.id)) {
      records.push({ id: item.id, name: item.id, description: item.description, license: item.license,
        category: "development", repository: new URL(item.publisherUrl).pathname.split("/").slice(1, 3).join("/"),
        url: item.publisherUrl, reviewUrl: item.reviewUrl, reviewedSourceUrl: item.publisherUrl, npmSkill: item.id });
    }
  }
  return { snapshot, records, externalCount: external.length, reviewedCount: packages.length };
}

function integer(value, min, max, flag) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
    throw new Error(`${flag} must be an integer from ${min} to ${max}.`);
  }
  return Number(value);
}

function runDiscovery(args) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    reviewed: { type: "boolean" }, category: { type: "string" }, license: { type: "string" },
    limit: { type: "string", default: "20" }, offset: { type: "string", default: "0" },
    stats: { type: "boolean" }, json: { type: "boolean" }, help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log("Usage: rei-skills discover [query] [--reviewed] [--category NAME] [--license SPDX] [--limit 1-100] [--offset N] [--stats] [--json]");
    return;
  }
  const { snapshot, records, externalCount, reviewedCount } = loadExternalDiscovery();
  if (values.stats) {
    console.log(JSON.stringify({ discovery: records.length, externalCount, reviewedCount, sources: snapshot.sources }, null, 2));
    return;
  }
  const limit = integer(values.limit, 1, 100, "--limit");
  const offset = integer(values.offset, 0, Number.MAX_SAFE_INTEGER, "--offset");
  const query = positionals.join(" ").toLowerCase().trim();
  const terms = query.match(/[\p{L}\p{N}]+/gu) || [];
  const matches = [];
  for (const entry of records) {
    if (values.reviewed && !entry.reviewUrl) continue;
    if (values.category && entry.category !== values.category) continue;
    if (values.license && entry.license !== values.license) continue;
    const name = entry.name.toLowerCase();
    const text = [name, entry.repository, entry.description, entry.category, entry.tags].join(" ").toLowerCase();
    if (!terms.every(term => text.includes(term) || (term.length >= 5 && term.endsWith("s") && text.includes(term.slice(0, -1))))) continue;
    matches.push({ entry, rank: (name === query ? 100 : 0) + (name.includes(query) ? 10 : 0) + (entry.reviewUrl ? 1 : 0) });
  }
  const results = matches.sort((a, b) => b.rank - a.rank).slice(offset, offset + limit).map(({ entry }) => entry);
  if (values.json) {
    console.log(JSON.stringify({ total: matches.length, offset, limit, results }, null, 2));
    return;
  }
  console.log(`${matches.length.toLocaleString("en-US")} matching records`);
  for (const item of results) {
    console.log(`\n${item.name} · ${item.license || "license unlisted"}\n  ${item.reviewUrl || item.url}`);
    if (item.attributionUrl) console.log(`  Catalog credit: ${item.attributionUrl}`);
  }
}

module.exports = { runDiscovery };
