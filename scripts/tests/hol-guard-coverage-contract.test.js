"use strict";

const assert = require("node:assert/strict");
const { MCP_TOOLS, EXTENDED_MCP_TOOLS } = require("../../bin/mcp-server");
const { authorizeToolInvocation, validateToolRegistration } = require("../../lib/hol-guard-policy");

const upstreamInherited = [
  "rei_recommend_skills", "rei_search_skills", "rei_get_skill",
  "rei_get_workflow", "rei_list_bundles", "rei_compile_skill", "rei_list_ai_targets",
];
const upstreamReviewed = ["rei_install_skill"];
const publishedNames = new Set(MCP_TOOLS.map((tool) => tool.name));

for (const name of [...upstreamInherited, ...upstreamReviewed]) {
  assert.ok(publishedNames.has(name), "Reviewed upstream tool missing from current MCP server: " + name);
}
for (const name of upstreamInherited) {
  const result = authorizeToolInvocation(name, {});
  assert.equal(result.policyTier, "inherit", name);
}
const preview = authorizeToolInvocation("rei_install_skill", {
  target_name: "rei-rea", ai_assistant: "codex", dry_run: true,
});
assert.equal(preview.policyTier, "review");
const install = authorizeToolInvocation("rei_install_skill", {
  target_name: "rei-rea", ai_assistant: "codex", dry_run: false,
});
assert.equal(install.policyTier, "review");
const unknown = authorizeToolInvocation("rei_unlisted_future_tool", {});
assert.equal(unknown.allowed, false);
assert.equal(unknown.decision, "deny");
for (const tool of EXTENDED_MCP_TOOLS) {
  assert.equal(validateToolRegistration(tool, { allowExtended: false }).valid, false);
}
for (const tool of MCP_TOOLS) {
  assert.equal(validateToolRegistration(tool).valid, true, tool.name);
}
const upstreamNames = new Set([...upstreamInherited, ...upstreamReviewed]);
const extra = [...publishedNames].filter((name) => !upstreamNames.has(name));
assert.ok(extra.length > 0, "Current MCP tool surface expected to exceed historical reviewed inventory");
console.log("PASS: REI Skills source-level HOL Guard contract smoke test");
console.log("Additional MCP tools outside upstream named inventory:", extra.join(", "));
console.log("NOT VERIFIED: external HOL Guard agent/hook interception; test with locally enabled Guard");
