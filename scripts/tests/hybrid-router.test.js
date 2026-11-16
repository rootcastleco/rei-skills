#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const catalog = require(path.join(ROOT, "data/catalog.json"));
const bundles = require(path.join(ROOT, "data/bundles.json"));
const workflows = require(path.join(ROOT, "data/workflows.json"));
const { recommendForTask, recommendForTaskLegacy } = require(path.join(ROOT, "lib/smart-router"));
const { normalizeQuery, recommendHybrid } = require(path.join(ROOT, "lib/hybrid-router"));

console.log("Running Hybrid Semantic Skill Router tests...");

// 1. Turkish technical query normalization and routing (fixes baseline Turkish failures)
{
  const norm = normalizeQuery("Makine titreşim spektrumu hız dönüşümü ve yatak arıza frekansları");
  assert(!norm.rawTokens.includes("ve"), "Turkish stopword 've' must be filtered");
  assert(norm.expandedTokens.includes("vibration"), "Turkish 'titreşim' must expand to 'vibration'");
  assert(norm.expandedTokens.includes("bearing"), "Turkish 'yatak' must expand to 'bearing'");

  const vib = recommendForTask(catalog, bundles, workflows, {
    task: "Makine titreşim spektrumu hız dönüşümü ve yatak arıza frekansları",
    maxResults: 5,
  });
  const top3 = vib.recommendedSkills.slice(0, 3).map((s) => s.id);
  assert(
    top3.includes("rc-machine-vibration-acceleration-to-velocity") ||
      top3.includes("rc-machine-vibration-bearing-defect-sidebands"),
    "Expected vibration skill in top 3, got: " + top3.join(", ")
  );
  assert.equal(vib.uncertainty.isOutOfScope, false);
  assert(vib.routingMeta.engine.startsWith("hybrid-v1"));
}

// 2. Multi-domain diversity (4-channel vibration PCB + Fusion 360 enclosure)
{
  const res = recommendForTask(catalog, bundles, workflows, {
    task: "Design a four-channel vibration measurement PCB and its Fusion 360 enclosure",
    maxResults: 6,
  });
  assert(res.detectedDomains.length >= 2, "Should detect multiple engineering domains");
  const domainsInTop6 = new Set(res.recommendedSkills.map((s) => s.domain));
  assert(domainsInTop6.size >= 3, "Top 6 should cover at least 3 distinct domains, got: " + Array.from(domainsInTop6).join(", "));
  const first = res.recommendedSkills[0];
  assert(first.scoreBreakdown && typeof first.scoreBreakdown.bm25 === "number");
  assert(first.dependencies && Array.isArray(first.dependencies.followUps));
}

// 3. Risk-aware candidate filtering (`safeOnly: true` and `maxRisk`)
{
  const safeRes = recommendForTask(catalog, bundles, workflows, {
    task: "Audit authentication JWT OAuth2 security without exploits",
    safeOnly: true,
    maxResults: 15,
  });
  assert(safeRes.recommendedSkills.length > 0);
  assert(
    safeRes.recommendedSkills.every((s) => s.risk !== "critical" && s.risk !== "offensive"),
    "safeOnly must strictly block critical and offensive skills"
  );

  const noneOnly = recommendForTask(catalog, bundles, workflows, {
    task: "brainstorming architecture",
    maxRisk: "none",
    maxResults: 10,
  });
  assert(noneOnly.recommendedSkills.every((s) => s.risk === "none"), "maxRisk='none' must exclude safe/critical/offensive");
}

// 4. Out-of-scope / negative uncertainty detection
{
  for (const oos of [
    "Write a romantic poem about sunset over the Bosphorus bridge",
    "Explain the rules of chess castling and en passant",
    "Galatasaray Fenerbahçe derbisi kaç kaç bitti",
    "Türk kahvesi köpüklü nasıl pişirilir anlat",
  ]) {
    const res = recommendForTask(catalog, bundles, workflows, { task: oos, maxResults: 3 });
    assert.equal(
      res.uncertainty.isOutOfScope,
      true,
      `Expected out-of-scope uncertainty flag for '${oos}', got ${JSON.stringify(res.uncertainty)}`
    );
    if (res.recommendedSkills.length > 0) {
      assert(res.recommendedSkills[0].confidence < 35, `Expected low confidence for OOS query '${oos}'`);
    }
  }
}

// 5. Optional pluggable embeddingProvider integration & offline fallback
{
  let embedCalls = 0;
  const mockProvider = {
    embed(text) {
      embedCalls++;
      const vec = new Float32Array(256);
      vec[0] = 1.0;
      return vec;
    },
  };
  const withExt = recommendHybrid(catalog, bundles, workflows, {
    task: "Validate GNSS carrier cycle slip",
    embeddingProvider: mockProvider,
    maxResults: 3,
  });
  assert.equal(embedCalls, 1);
  assert.equal(withExt.routingMeta.engine, "hybrid-v1-external-embeddings");

  // Broken external provider must safely fall back to offline vector embedding
  const brokenProvider = {
    embed() {
      throw new Error("Simulated embedding service offline");
    },
  };
  const fallbackRes = recommendHybrid(catalog, bundles, workflows, {
    task: "Validate GNSS carrier cycle slip",
    embeddingProvider: brokenProvider,
    maxResults: 3,
  });
  assert(fallbackRes.recommendedSkills.length > 0);
}

// 6. Legacy fallback option (`engine: "legacy"`) remains deterministic and functional
{
  const legacyRes = recommendForTask(catalog, bundles, workflows, {
    task: "Reverse engineer Android APK",
    files: ["app.apk"],
    engine: "legacy",
    maxResults: 3,
  });
  assert.equal(legacyRes.routingMeta.engine, "legacy-fallback");
  assert(legacyRes.recommendedSkills.some((s) => s.id === "rei-android-apks"));
  assert.equal(typeof recommendForTaskLegacy, "function");
}

console.log("PASS: Hybrid Semantic Skill Router tests passed.");
