"use strict";

async function getPromptEvidence({ config, archive, task, selectedSkills, maxContextChars }) {
  const warnings = [];
  let snapshot;
  const cacheDir = config.cacheDir;
  try {
    snapshot = archive.loadSnapshot(cacheDir, { allowBundledFallback: false });
  } catch (e) {
    warnings.push("No valid existing prompt cache: " + String(e.message).slice(0, 160));
  }
  // Public GET only: no task or user data is sent to the Prompt Archive.
  if (!config.offline && (!snapshot || snapshot.cacheStatus !== "fresh")) {
    try {
      await archive.syncArchive({ cacheDir, incremental: true });
      snapshot = archive.loadSnapshot(cacheDir, { allowBundledFallback: false });
    } catch (e) {
      warnings.push("Public prompt archive refresh unavailable: " + String(e.message).slice(0, 160));
    }
  }
  if (!snapshot) snapshot = archive.loadBundledFallbackSnapshot();
  const promptDraft = archive.composePrompt(task, snapshot, {
    limit: 3, maxContextChars,
    skills: selectedSkills.map(x => x.id),
    skillSummaries: selectedSkills,
    excludeInjectionRisk: true,
  });
  return { promptDraft, warnings };
}
module.exports = { getPromptEvidence };
