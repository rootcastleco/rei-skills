const fs = require("fs");
const path = require("path");

/**
 * 🧠 REI Skills — Smart Intent, Stack & Semantic Skill Router
 * Uses multi-signal BM25-inspired term weighting, file-extension/tech-stack inference,
 * trigger phrase matching, and workflow graph correlation to recommend the optimal
 * skills, bundles, and execution workflows for any engineering task.
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at", "by",
  "for", "with", "about", "against", "between", "into", "through", "during", "before",
  "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "once", "here", "there", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now",
  "how", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is",
  "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do",
  "does", "did", "doing", "i", "me", "my", "we", "our", "you", "your", "he", "she",
  "it", "they", "them", "want", "need", "help", "make", "build", "create", "use", "using"
]);

/**
 * Maps file extensions and filenames to domain keywords and priority skill IDs.
 */
const STACK_RULES = [
  {
    match: /\.(wasm|wat)$/i,
    keywords: ["wasm", "webassembly", "reverse-engineering", "binary"],
    boostSkills: ["rei-wasm-and-managed", "rei-binary-intelligence", "rei-rea-orchestrator", "rei-reconstruction-parity"],
  },
  {
    match: /\.(exe|dll|sys|elf|so|dylib|macho|o|ko|out)$/i,
    keywords: ["native", "binary", "pe", "elf", "mach-o", "reverse-engineering", "disassembly"],
    boostSkills: ["rei-native-binaries", "rei-binary-intelligence", "rei-rea-orchestrator", "rei-evidence-ledger", "rei-casebook-forensics"],
  },
  {
    match: /\.(apk|dex|aab|smali|ipa)$/i,
    keywords: ["android", "apk", "mobile", "dex", "jni", "frida"],
    boostSkills: ["rei-android-apks", "rei-mobile-runtime", "rei-rea-orchestrator", "rei-binary-intelligence"],
  },
  {
    match: /\.(bin|fw|img|hex|uf2|rom|squashfs|uimage)$/i,
    keywords: ["firmware", "iot", "embedded", "entropy", "reverse-engineering"],
    boostSkills: ["rei-firmware-and-iot", "rei-binary-intelligence", "rei-rea-orchestrator", "rei-evidence-ledger"],
  },
  {
    match: /\.(asar)$/i,
    keywords: ["electron", "asar", "ipc", "preload", "javascript"],
    boostSkills: ["rei-electron-and-js", "rei-web-and-protocols", "rei-rea-orchestrator"],
  },
  {
    match: /\.(pcap|pcapng|har)$/i,
    keywords: ["protocol", "network", "packet", "har", "pcap"],
    boostSkills: ["rei-web-and-protocols", "wireshark-analysis", "rei-evidence-ledger"],
  },
  {
    match: /\.(tsx|jsx)$/i,
    keywords: ["react", "frontend", "typescript", "ui", "component", "nextjs", "tailwind"],
    boostSkills: ["react-best-practices", "react-patterns", "frontend-developer", "typescript-expert", "tailwind-patterns"],
  },
  {
    match: /next\.config\.(js|mjs|ts)$/i,
    keywords: ["nextjs", "react", "app-router", "ssr"],
    boostSkills: ["nextjs-best-practices", "nextjs-app-router-patterns", "react-best-practices"],
  },
  {
    match: /\.(py)$/i,
    keywords: ["python", "fastapi", "django", "pytest", "async"],
    boostSkills: ["python-pro", "python-patterns", "python-testing-patterns", "fastapi-pro"],
  },
  {
    match: /\.(rs)|Cargo\.toml$/i,
    keywords: ["rust", "cargo", "systems", "memory-safety"],
    boostSkills: ["rust-pro", "memory-safety-patterns"],
  },
  {
    match: /\.(go)|go\.mod$/i,
    keywords: ["golang", "go", "concurrency"],
    boostSkills: ["golang-pro", "go-concurrency-patterns"],
  },
  {
    match: /Dockerfile|docker-compose\.ya?ml$/i,
    keywords: ["docker", "container", "devops", "deployment"],
    boostSkills: ["docker-expert", "deployment-procedures", "kubernetes-architect"],
  },
  {
    match: /\.(tf|tfvars)$/i,
    keywords: ["terraform", "iac", "cloud", "infrastructure"],
    boostSkills: ["terraform-specialist", "aws-serverless", "kubernetes-architect"],
  },
  {
    match: /\.(sql|prisma)$/i,
    keywords: ["database", "sql", "postgres", "schema"],
    boostSkills: ["postgres-best-practices", "sql-pro", "database-design", "database-architect"],
  },
];

/**
 * Bilingual (TR -> EN) and domain synonym expansion table so Turkish or shorthand queries
 * route accurately to English skill metadata.
 */
const SYNONYM_MAP = {
  tersine: ["reverse", "reverse-engineering", "rei-rea", "binary"],
  muhendislik: ["engineering", "reverse-engineering"],
  mühendislik: ["engineering", "reverse-engineering"],
  ikili: ["binary", "pe", "elf", "wasm"],
  analiz: ["analysis", "audit", "triage", "inspect"],
  guvenlik: ["security", "vulnerability", "audit", "pentest", "owasp"],
  güvenlik: ["security", "vulnerability", "audit", "pentest", "owasp"],
  zafiyet: ["vulnerability", "security", "exploit", "audit"],
  sizma: ["pentest", "penetration", "offensive", "ethical-hacking"],
  sızma: ["pentest", "penetration", "offensive", "ethical-hacking"],
  gomulu: ["firmware", "iot", "embedded"],
  gömülü: ["firmware", "iot", "embedded"],
  mobil: ["mobile", "android", "ios", "apk", "flutter", "react-native"],
  veritabani: ["database", "sql", "postgres", "schema"],
  veritabanı: ["database", "sql", "postgres", "schema"],
  arayuz: ["frontend", "ui", "ux", "react", "design", "tailwind"],
  arayüz: ["frontend", "ui", "ux", "react", "design", "tailwind"],
  mimari: ["architecture", "ddd", "microservices", "system-design"],
  ajan: ["agent", "ai", "llm", "mcp", "langgraph", "rag"],
  test: ["testing", "tdd", "e2e", "playwright", "pytest", "qa"],
  hata: ["debugging", "bug", "fix", "systematic-debugging"],
  performans: ["performance", "optimization", "caching", "profiling"],
  bulut: ["cloud", "aws", "azure", "gcp", "kubernetes", "docker"],
  otomasyon: ["automation", "workflow", "ci", "cd", "pipeline"],
  dokuman: ["documentation", "docs", "readme", "pdf", "docx"],
  döküman: ["documentation", "docs", "readme", "pdf", "docx"],
  re: ["reverse-engineering", "rei-rea", "binary"],
  rev: ["reverse-engineering", "rei-rea", "binary"],
  forensics: ["casebook", "evidence", "rei-casebook-forensics", "rei-evidence-ledger"],
  adli: ["forensics", "casebook", "evidence", "rei-casebook-forensics"],
};

function tokenize(text) {
  if (!text) return [];
  const rawTokens = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç_-]+/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  const expanded = new Set();
  for (const tok of rawTokens) {
    expanded.add(tok);
    if (tok.includes("-")) {
      tok.split("-").forEach((part) => {
        if (part.length >= 2 && !STOP_WORDS.has(part)) expanded.add(part);
      });
    }
    if (SYNONYM_MAP[tok]) {
      for (const syn of SYNONYM_MAP[tok]) expanded.add(syn);
    }
  }
  return Array.from(expanded);
}

function inferStackSignals(files = [], taskText = "") {
  const boostedSkills = new Map();
  const extraKeywords = new Set();

  const inputs = [...files, ...String(taskText).split(/\s+/)];
  for (const item of inputs) {
    for (const rule of STACK_RULES) {
      if (rule.match.test(item)) {
        rule.keywords.forEach((k) => extraKeywords.add(k));
        rule.boostSkills.forEach((id, idx) => {
          const prev = boostedSkills.get(id) || 0;
          boostedSkills.set(id, prev + (28 - idx * 3));
        });
      }
    }
  }

  return {
    boostedSkills,
    extraKeywords: Array.from(extraKeywords),
  };
}

/**
 * Recommends top skills, bundles, and workflows for a given task and file list.
 */
function recommendForTask(catalogData, bundlesData, workflowsData, options = {}) {
  const task = String(options.task || "").trim();
  const files = Array.isArray(options.files)
    ? options.files
    : typeof options.files === "string"
      ? options.files.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const maxResults = Number(options.maxResults || 8);
  const safeOnly = Boolean(options.safeOnly);
  const categoryFilter = options.category ? String(options.category).toLowerCase() : null;

  const { boostedSkills, extraKeywords } = inferStackSignals(files, task);
  const queryTokens = tokenize(`${task} ${extraKeywords.join(" ")}`);
  const queryLower = task.toLowerCase();

  const skills = (catalogData && catalogData.skills) || [];
  const scored = [];

  for (const skill of skills) {
    if (safeOnly && (skill.risk === "offensive" || skill.risk === "critical")) {
      continue;
    }
    if (categoryFilter && (skill.category || "").toLowerCase() !== categoryFilter) {
      continue;
    }

    let score = 0;
    const reasons = [];

    // 1. Direct stack/file extension boost
    if (boostedSkills.has(skill.id)) {
      const boost = boostedSkills.get(skill.id);
      score += boost;
      reasons.push(`File/stack signature match (+${boost})`);
    }

    // 2. Exact skill ID or name mention in task
    if (queryLower.includes(skill.id.toLowerCase())) {
      score += 45;
      reasons.push("Exact skill ID match");
    }

    const idLower = (skill.id || "").toLowerCase();
    const descLower = (skill.description || "").toLowerCase();
    const catLower = (skill.category || "").toLowerCase();
    const tagsLower = (skill.tags || []).map((t) => String(t).toLowerCase());
    const triggersLower = (skill.triggers || []).map((t) => String(t).toLowerCase());

    // 3. Token-level weighted scoring
    let matchedTokens = 0;
    for (const tok of queryTokens) {
      let tokMatched = false;
      if (idLower === tok || idLower.split("-").includes(tok)) {
        score += 14;
        tokMatched = true;
      } else if (idLower.includes(tok)) {
        score += 8;
        tokMatched = true;
      }
      if (tagsLower.includes(tok)) {
        score += 9;
        tokMatched = true;
      }
      if (catLower.includes(tok)) {
        score += 6;
        tokMatched = true;
      }
      if (descLower.includes(tok)) {
        score += 5;
        tokMatched = true;
      }
      if (triggersLower.some((tr) => tr.includes(tok))) {
        score += 7;
        tokMatched = true;
      }
      if (tokMatched) matchedTokens++;
    }

    if (matchedTokens > 1) {
      // Multi-term synergy bonus
      const synergy = matchedTokens * 4;
      score += synergy;
      reasons.push(`Matched ${matchedTokens} intent terms`);
    }

    // 4. Special domain boost for REI REA reverse-engineering queries
    if (
      skill.id.startsWith("rei-") &&
      queryTokens.some((t) =>
        [
          "reverse",
          "reverse-engineering",
          "binary",
          "firmware",
          "wasm",
          "apk",
          "electron",
          "forensics",
          "elf",
          "pe",
          "decompile",
          "triage",
        ].includes(t),
      )
    ) {
      score += 12;
      reasons.push("REI REA reverse-engineering domain priority");
    }

    if (score > 0) {
      scored.push({
        id: skill.id,
        name: skill.name || skill.id,
        category: skill.category,
        risk: skill.risk,
        source: skill.source,
        description: skill.description,
        path: skill.path || `skills/${skill.id}/SKILL.md`,
        score,
        confidence: Math.min(99, Math.round((score / Math.max(35, queryTokens.length * 16)) * 100)),
        reasons: reasons.length > 0 ? reasons : ["Keyword relevance"],
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const topSkills = scored.slice(0, maxResults);
  const topSkillIds = new Set(topSkills.map((s) => s.id));

  // Recommend matching workflows
  const workflows = (workflowsData && workflowsData.workflows) || [];
  const recommendedWorkflows = workflows
    .map((wf) => {
      const wfSkillIds = new Set();
      for (const step of wf.steps || []) {
        for (const sid of step.skills || []) wfSkillIds.add(sid);
      }
      let overlap = 0;
      for (const sid of topSkillIds) {
        if (wfSkillIds.has(sid)) overlap++;
      }
      const wfText = `${wf.id} ${wf.name} ${wf.description} ${wf.category}`.toLowerCase();
      let tokenHits = 0;
      for (const tok of queryTokens) {
        if (wfText.includes(tok)) tokenHits++;
      }
      const wfScore = overlap * 15 + tokenHits * 6;
      return {
        id: wf.id,
        name: wf.name,
        category: wf.category,
        description: wf.description,
        steps: wf.steps,
        score: wfScore,
      };
    })
    .filter((w) => w.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // Recommend matching role bundles
  const bundlesMap = (bundlesData && bundlesData.bundles) || {};
  const recommendedBundles = Object.entries(bundlesMap)
    .map(([bId, b]) => {
      const bSkills = b.skills || [];
      const overlap = bSkills.filter((sid) => topSkillIds.has(sid)).length;
      return {
        id: bId,
        name: b.name || bId,
        description: b.description || "",
        matchedSkillsCount: overlap,
        totalSkillsCount: bSkills.length,
        installCommand: `npx rei-skills add ${bId}`,
      };
    })
    .filter((b) => b.matchedSkillsCount > 0)
    .sort((a, b) => b.matchedSkillsCount - a.matchedSkillsCount)
    .slice(0, 3);

  return {
    query: {
      task,
      files,
      extractedTokens: queryTokens,
    },
    recommendedSkills: topSkills,
    recommendedWorkflows,
    recommendedBundles,
    executionPlan: topSkills.slice(0, 3).map((s, idx) => ({
      step: idx + 1,
      skillId: s.id,
      action: `Load '${s.path}' (${s.category}, risk: ${s.risk}) — ${s.description}`,
    })),
  };
}

module.exports = {
  tokenize,
  inferStackSignals,
  recommendForTask,
};
