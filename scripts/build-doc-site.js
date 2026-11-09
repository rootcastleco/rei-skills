#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { AI_TARGETS } = require('../lib/ai-adapters');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_DIR = path.join(ROOT, 'docs', 'site');

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const catalog = readJson(path.join(DATA_DIR, 'catalog.json'), { total: 0, skills: [], categories: [] });
const bundlesData = readJson(path.join(DATA_DIR, 'bundles.json'), { bundles: {} });
const workflowsData = readJson(path.join(DATA_DIR, 'workflows.json'), { workflows: [] });
const reaManifest = readJson(path.join(DATA_DIR, 'rei-rea-manifest.json'), { skills: [] });

fs.mkdirSync(SITE_DIR, { recursive: true });
// Ensure GitHub Pages serves static assets without Jekyll interference
fs.writeFileSync(path.join(SITE_DIR, '.nojekyll'), '', 'utf8');

const compactSkills = (catalog.skills || []).map(s => ({
  id: s.id,
  name: s.name || s.id,
  description: s.description || '',
  category: s.category || 'uncategorized',
  risk: s.risk || 'none',
  source: s.source || 'community',
  tags: s.tags || [],
  triggers: s.triggers || [],
  path: s.path || `skills/${s.id}`
}));

const compactAiTargets = Object.values(AI_TARGETS).map(t => ({
  id: t.id,
  flag: t.flag,
  name: t.name,
  ecosystem: t.ecosystem,
  format: t.format,
  workspacePath: t.defaultWorkspacePath,
  indexFile: t.indexFile,
  invocationHint: t.invocationHint
}));

const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <link rel="canonical" href="https://rootcastleco.github.io/rei-skills/" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>REI Skills — Smart Multi-AI Skill Studio, MCP Hub &amp; Registry</title>
  <meta name="description" content="The universal engineering-grade skill layer &amp; Smart MCP Server for AI agents. Browse ${compactSkills.length} validated skills across ${compactAiTargets.length} AI coding assistants, IDEs, and SDKs." />
  <style>
    :root {
      --bg: #070B14;
      --surface: #0D1424;
      --surface-elevated: #131D33;
      --border: #1E293B;
      --border-active: #0EA5E9;
      --text: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --accent: #00F0FF;
      --accent-secondary: #38BDF8;
      --purple: #C084FC;
      --emerald: #34D399;
      --amber: #FBBF24;
      --red: #F87171;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    }
    [data-theme="light"] {
      --bg: #F8FAFC;
      --surface: #FFFFFF;
      --surface-elevated: #F1F5F9;
      --border: #E2E8F0;
      --border-active: #0284C7;
      --text: #0F172A;
      --text-secondary: #475569;
      --text-muted: #64748B;
      --accent: #0284C7;
      --accent-secondary: #0369A1;
      --purple: #7E22CE;
      --emerald: #059669;
      --amber: #D97706;
      --red: #DC2626;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.5;
      min-height: 100vh;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(7, 11, 20, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    [data-theme="light"] .topbar {
      background: rgba(248, 250, 252, 0.92);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      font-size: 18px;
    }
    .brand-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(0, 240, 255, 0.12);
      border: 1px solid var(--border-active);
      color: var(--accent);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 7px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn:hover {
      border-color: var(--border-active);
      color: var(--accent);
    }
    .btn-primary {
      background: rgba(0, 240, 255, 0.14);
      border-color: var(--border-active);
      color: var(--accent);
      font-weight: 700;
    }
    .ai-selector-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-active);
      padding: 4px 10px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 12px;
    }
    .ai-selector-wrap select {
      border: none;
      background: transparent;
      color: var(--accent);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 12px;
      padding: 4px;
      cursor: pointer;
    }
    .hero {
      max-width: 1280px;
      margin: 0 auto;
      padding: 34px 24px 18px;
    }
    .hero-eyebrow {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--accent);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .hero h1 {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    .hero p {
      color: var(--text-secondary);
      max-width: 900px;
      font-size: 15px;
      margin-bottom: 20px;
    }
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 22px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .stat-label {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text);
      margin-top: 4px;
    }
    .smart-box {
      background: linear-gradient(135deg, rgba(13, 20, 36, 0.96), rgba(19, 29, 51, 0.96));
      border: 1px solid var(--border-active);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    [data-theme="light"] .smart-box {
      background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
    }
    .smart-box-title {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .smart-inputs {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 10px;
      margin-top: 12px;
    }
    @media (max-width: 820px) {
      .smart-inputs { grid-template-columns: 1fr; }
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .chip {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      cursor: pointer;
    }
    .chip:hover {
      border-color: var(--border-active);
      color: var(--accent);
    }
    .tabs {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
    }
    .tab-btn {
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
      font-weight: 700;
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px;
    }
    .controls {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 820px) {
      .controls { grid-template-columns: 1fr; }
    }
    input[type="search"], input[type="text"], select {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-family: var(--font-sans);
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--border-active);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .card:hover {
      border-color: var(--border-active);
      transform: translateY(-1px);
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .card-title {
      font-family: var(--font-mono);
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      word-break: break-word;
    }
    .badge {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      white-space: nowrap;
    }
    .badge-cat { color: var(--accent-secondary); background: rgba(56, 189, 248, 0.1); }
    .badge-rea { color: var(--purple); border-color: var(--purple); background: rgba(192, 132, 252, 0.12); }
    .badge-match { color: var(--emerald); border-color: var(--emerald); background: rgba(52, 211, 153, 0.12); }
    .badge-risk-none, .badge-risk-safe { color: var(--emerald); }
    .badge-risk-unknown { color: var(--amber); }
    .badge-risk-offensive { color: var(--red); border-color: var(--red); }
    .card-desc {
      font-size: 13px;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }
    .copy-cmd {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 5px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      color: var(--accent);
      cursor: pointer;
    }
    .copy-cmd:hover {
      border-color: var(--border-active);
    }
    pre.code-block {
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      overflow-x: auto;
      color: var(--text);
    }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <span>REI SKILLS</span>
      <span class="brand-badge">SMART MULTI-AI &amp; MCP HUB v6.2</span>
    </div>
    <div class="nav-actions">
      <div class="ai-selector-wrap">
        <span>Target AI:</span>
        <select id="aiTargetSelect" title="Select target AI assistant to customize install commands"></select>
      </div>
      <a class="btn" href="https://rootcastle.com/en/projects/rei-skills/">Rootcastle project guide</a>
      <a class="btn" href="https://github.com/rootcastleco/rei-skills" target="_blank" rel="noopener">GitHub</a>
      <a class="btn" href="https://github.com/rootcastleco/Rei-Reverse-engineer" target="_blank" rel="noopener">REI REA Workbench</a>
      <button class="btn" id="themeToggle" type="button">Toggle Theme</button>
    </div>
  </header>

  <section class="hero">
    <div class="hero-eyebrow">ROOTCASTLE ENGINEERING &amp; INNOVATION · ENGINEERING BEYOND BOUNDARIES</div>
    <h1>The Smart Skill Layer &amp; MCP Server for Every AI Agent</h1>
    <p>Discover, route, transpile, and serve <strong>${compactSkills.length} schema-validated skills</strong> across <strong>${compactAiTargets.length} AI coding assistants, IDEs, CLI agents, and SDKs</strong> — powered by our built-in <strong>Smart Intent &amp; Stack Router</strong> and zero-dependency <strong>MCP Server (<code>npx rei-skills mcp</code>)</strong>.</p>

    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-label">Validated Skills</div>
        <div class="stat-value">${compactSkills.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Supported AI Assistants</div>
        <div class="stat-value">${compactAiTargets.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Smart MCP Tools</div>
        <div class="stat-value">8</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">REI REA Specialist Skills</div>
        <div class="stat-value">${(reaManifest.skills || []).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Curated Bundles</div>
        <div class="stat-value">${Object.keys(bundlesData.bundles || {}).length}</div>
      </div>
    </div>

    <!-- SMART AI TASK ROUTER -->
    <div class="smart-box">
      <div class="smart-box-title">
        <span>🧠 SMART AI TASK &amp; STACK ROUTER (AKILLI YETENEK ÖNERİCİ — EN / TR)</span>
        <span style="font-size:11px;color:var(--text-secondary);">CLI: <code>npx rei-skills recommend "&lt;task&gt;" --files a.ts,b.wasm</code></span>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);">Describe what you want to build, debug, audit, or reverse-engineer (in English or Turkish) and optionally list workspace files to get instant multi-signal skill, bundle, and workflow recommendations:</p>
      <div class="smart-inputs">
        <input type="text" id="smartTaskInput" placeholder="e.g. Reverse engineer Android APK &amp; firmware image / Next.js SaaS billing &amp; security audit..." />
        <input type="text" id="smartFilesInput" placeholder="Optional files: app.apk, router.bin, App.tsx" />
        <button class="btn btn-primary" id="smartRunBtn" type="button">Recommend Skills</button>
      </div>
      <div class="chips">
        <span class="chip" data-task="Reverse engineer Android APK, native JNI library and firmware image" data-files="app.apk,libnative.so,router.bin">🔬 Android APK &amp; Firmware Triage (REI REA)</span>
        <span class="chip" data-task="Compare two WebAssembly builds and verify clean-room parity" data-files="v1.wasm,v2.wasm">🧬 WebAssembly Version Diff</span>
        <span class="chip" data-task="Build production Next.js SaaS with Stripe billing, Postgres and E2E tests" data-files="next.config.ts,schema.prisma">🚀 Next.js SaaS + Stripe + Postgres</span>
        <span class="chip" data-task="Web uygulaması güvenlik testi, API zafiyet analizi ve OWASP denetimi" data-files="routes/auth.ts">🛡️ Web &amp; API Güvenlik Denetimi (TR)</span>
        <span class="chip" data-task="Design autonomous AI agent with MCP tools, RAG and LangGraph evaluation" data-files="agent.py">🤖 AI Agent + MCP + LangGraph</span>
      </div>
      <div id="smartResultsWrap" class="hidden" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <strong style="font-family:var(--font-mono);font-size:13px;color:var(--emerald);" id="smartSummaryTitle"></strong>
          <button class="copy-cmd" id="smartBatchInstallBtn"></button>
        </div>
        <div class="grid" id="smartSkillsGrid"></div>
      </div>
    </div>
  </section>

  <nav class="tabs">
    <button class="tab-btn active" data-tab="skills">Skill Registry (${compactSkills.length})</button>
    <button class="tab-btn" data-tab="mcp">🔌 Smart MCP Server Setup</button>
    <button class="tab-btn" data-tab="ai-targets">🤖 AI Compatibility (${compactAiTargets.length} AI Tools)</button>
    <button class="tab-btn" data-tab="rea">🔬 REI Reverse Engineering (${(reaManifest.skills || []).length})</button>
    <button class="tab-btn" data-tab="bundles">📦 Role Bundles (${Object.keys(bundlesData.bundles || {}).length})</button>
    <button class="tab-btn" data-tab="workflows">🔄 Workflows (${(workflowsData.workflows || []).length})</button>
  </nav>

  <main class="container">
    <div id="tab-skills">
      <div class="controls">
        <input type="search" id="searchInput" placeholder="Search ${compactSkills.length} skills by ID, description, tag, or trigger..." />
        <select id="categoryFilter">
          <option value="">All Categories</option>
        </select>
        <select id="riskFilter">
          <option value="">All Risk Profiles</option>
          <option value="none">none (Read-only)</option>
          <option value="safe">safe (Local Workspace)</option>
          <option value="unknown">unknown (Review Needed)</option>
          <option value="offensive">offensive (Authorized Use Only)</option>
        </select>
        <div style="font-family:var(--font-mono);font-size:12px;align-self:center;color:var(--text-secondary);" id="resultCount"></div>
      </div>
      <div class="grid" id="skillsGrid"></div>
    </div>

    <!-- SMART MCP SERVER TAB -->
    <div id="tab-mcp" class="hidden">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header">
          <div class="card-title">🔌 REI Skills Smart MCP Server (<code>rei-skills-mcp</code> / <code>npx rei-skills mcp</code>)</div>
          <span class="badge badge-match">Zero-Dependency Stdio JSON-RPC 2.0</span>
        </div>
        <p style="font-size:14px;color:var(--text-secondary);">
          Connect your AI assistant directly to the <strong>REI Skills Smart MCP Server</strong>. Instead of loading all 895 skills into your prompt, your AI agent can dynamically call <code>rei_recommend_skills</code>, <code>rei_search_skills</code>, <code>rei_get_skill</code>, <code>rei_get_workflow</code>, <code>rei_install_skill</code>, and <code>rei_compile_skill</code> on demand!
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button class="copy-cmd" onclick="copyCommand('npx rei-skills add rei-rea --claude --mcp-config ~/.claude/mcp.json', this)">Auto-Configure Claude Code MCP</button>
          <button class="copy-cmd" onclick="copyCommand('npx rei-skills add rei-rea --cursor --mcp-config ~/.cursor/mcp.json', this)">Auto-Configure Cursor MCP</button>
        </div>
        <pre class="code-block" id="mcpJsonBlock">{
  "mcpServers": {
    "rei-skills": {
      "command": "npx",
      "args": ["-y", "rei-skills", "mcp"]
    },
    "rei-rea": {
      "command": "rei-rea",
      "args": ["mcp"]
    }
  }
}</pre>
      </div>
      <div class="grid">
        <article class="card">
          <div class="card-title">1. rei_recommend_skills</div>
          <p class="card-desc">Smart Intent &amp; Stack Router: analyzes natural language tasks (EN/TR) and workspace filenames (<code>.wasm</code>, <code>.apk</code>, <code>.tsx</code>, <code>Dockerfile</code>) to return top-ranked skills, workflows, and execution plans.</p>
        </article>
        <article class="card">
          <div class="card-title">2. rei_get_skill</div>
          <p class="card-desc">Loads the complete <code>SKILL.md</code> instructions and reference files (e.g. <code>references/workflow.md</code>) for any skill ID on demand without bloating context.</p>
        </article>
        <article class="card">
          <div class="card-title">3. rei_install_skill &amp; rei_compile_skill</div>
          <p class="card-desc">Installs or transpiles skills on the fly into any of the 21 supported AI assistant formats (<code>cursor-mdc</code>, <code>copilot-instructions</code>, <code>windsurf-rule</code>, <code>sdk-json</code>).</p>
        </article>
      </div>
    </div>

    <div id="tab-ai-targets" class="hidden">
      <div class="grid" id="aiTargetsGrid"></div>
    </div>

    <div id="tab-rea" class="hidden">
      <div class="grid" id="reaGrid"></div>
    </div>

    <div id="tab-bundles" class="hidden">
      <div class="grid" id="bundlesGrid"></div>
    </div>

    <div id="tab-workflows" class="hidden">
      <div class="grid" id="workflowsGrid"></div>
    </div>
  </main>

  <script>
    const SKILLS = ${JSON.stringify(compactSkills)};
    const AI_TARGETS = ${JSON.stringify(compactAiTargets)};
    const BUNDLES = ${JSON.stringify(bundlesData.bundles || {})};
    const WORKFLOWS = ${JSON.stringify(workflowsData.workflows || [])};
    const REA_MANIFEST = ${JSON.stringify(reaManifest)};

    const SYNONYMS = {
      tersine: ['reverse', 'reverse-engineering', 'rei-rea', 'binary'],
      muhendislik: ['engineering', 'reverse-engineering'],
      mühendislik: ['engineering', 'reverse-engineering'],
      guvenlik: ['security', 'vulnerability', 'audit', 'pentest', 'owasp'],
      güvenlik: ['security', 'vulnerability', 'audit', 'pentest', 'owasp'],
      zafiyet: ['vulnerability', 'security', 'exploit', 'audit'],
      gomulu: ['firmware', 'iot', 'embedded'],
      gömülü: ['firmware', 'iot', 'embedded'],
      mobil: ['mobile', 'android', 'ios', 'apk', 'flutter'],
      veritabani: ['database', 'sql', 'postgres', 'schema'],
      veritabanı: ['database', 'sql', 'postgres', 'schema'],
      arayuz: ['frontend', 'ui', 'ux', 'react', 'design', 'tailwind'],
      arayüz: ['frontend', 'ui', 'ux', 'react', 'design', 'tailwind'],
      mimari: ['architecture', 'ddd', 'microservices'],
      ajan: ['agent', 'ai', 'llm', 'mcp', 'langgraph', 'rag']
    };

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const riskFilter = document.getElementById('riskFilter');
    const aiTargetSelect = document.getElementById('aiTargetSelect');
    const skillsGrid = document.getElementById('skillsGrid');
    const resultCount = document.getElementById('resultCount');

    const allAiOpt = document.createElement('option');
    allAiOpt.value = '--all-ai';
    allAiOpt.textContent = 'All AI Assistants (--all-ai)';
    aiTargetSelect.appendChild(allAiOpt);

    AI_TARGETS.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.flag;
      opt.textContent = t.name + ' (' + t.flag + ')';
      if (t.id === 'claude') opt.selected = true;
      aiTargetSelect.appendChild(opt);
    });

    const categories = [...new Set(SKILLS.map(s => s.category))].sort();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat + ' (' + SKILLS.filter(s => s.category === cat).length + ')';
      categoryFilter.appendChild(opt);
    });

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function copyCommand(cmd, btn) {
      navigator.clipboard.writeText(cmd);
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = prev; }, 1200);
    }

    function getSelectedFlag() {
      return aiTargetSelect.value || '--claude';
    }

    function runSmartRecommendation() {
      const task = document.getElementById('smartTaskInput').value.trim();
      const filesRaw = document.getElementById('smartFilesInput').value.trim();
      if (!task && !filesRaw) return;

      const flag = getSelectedFlag();
      const rawTokens = (task + ' ' + filesRaw)
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç._-]+/gi, ' ')
        .split(/\\s+/)
        .filter(t => t.length >= 2);

      const tokens = new Set();
      rawTokens.forEach(t => {
        tokens.add(t);
        if (SYNONYMS[t]) SYNONYMS[t].forEach(s => tokens.add(s));
      });

      const boostMap = {};
      const combined = (task + ' ' + filesRaw).toLowerCase();
      if (/\\.(wasm|wat)\\b/.test(combined)) {
        ['rei-wasm-and-managed', 'rei-binary-intelligence', 'rei-reconstruction-parity', 'rei-rea-orchestrator'].forEach((id, i) => boostMap[id] = 30 - i*4);
      }
      if (/\\.(apk|dex|smali)\\b/.test(combined)) {
        ['rei-android-apks', 'rei-mobile-runtime', 'rei-binary-intelligence', 'rei-rea-orchestrator'].forEach((id, i) => boostMap[id] = 30 - i*4);
      }
      if (/\\.(bin|fw|img|rom)\\b/.test(combined)) {
        ['rei-firmware-and-iot', 'rei-binary-intelligence', 'rei-evidence-ledger', 'rei-rea-orchestrator'].forEach((id, i) => boostMap[id] = 30 - i*4);
      }
      if (/\\.(tsx|jsx)\\b|next\\.config/.test(combined)) {
        ['nextjs-best-practices', 'react-best-practices', 'frontend-developer', 'tailwind-patterns'].forEach((id, i) => boostMap[id] = 24 - i*3);
      }

      const scored = [];
      SKILLS.forEach(s => {
        let score = boostMap[s.id] || 0;
        const idL = s.id.toLowerCase();
        const descL = s.description.toLowerCase();
        const catL = s.category.toLowerCase();
        const tagsL = (s.tags || []).map(x => x.toLowerCase());
        let hits = 0;
        tokens.forEach(tok => {
          let m = false;
          if (idL === tok || idL.split('-').includes(tok)) { score += 14; m = true; }
          else if (idL.includes(tok)) { score += 8; m = true; }
          if (tagsL.includes(tok)) { score += 9; m = true; }
          if (catL.includes(tok)) { score += 6; m = true; }
          if (descL.includes(tok)) { score += 5; m = true; }
          if (m) hits++;
        });
        if (hits > 1) score += hits * 4;
        if (score > 0) {
          const conf = Math.min(99, Math.round((score / Math.max(32, tokens.size * 12)) * 100));
          scored.push({ ...s, score, conf });
        }
      });

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 6);
      const wrap = document.getElementById('smartResultsWrap');
      wrap.classList.remove('hidden');

      document.getElementById('smartSummaryTitle').textContent =
        '🎯 Top ' + top.length + ' Smart-Routed Skills for your task:';

      const firstId = top[0] ? top[0].id : 'essentials';
      const batchCmd = 'npx rei-skills add ' + firstId + ' ' + flag;
      const batchBtn = document.getElementById('smartBatchInstallBtn');
      batchBtn.textContent = 'Install #1 Recommended: ' + batchCmd;
      batchBtn.onclick = function() { copyCommand(batchCmd, batchBtn); };

      document.getElementById('smartSkillsGrid').innerHTML = top.map(s => {
        const cmd = 'npx rei-skills add ' + s.id + ' ' + flag;
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(s.id)}</div>
                <span class="badge badge-match">\${s.conf}% match</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">\${escapeHtml(s.description)}</p>
            </div>
            <div class="card-footer">
              <span class="badge badge-cat">\${escapeHtml(s.category)}</span>
              <button class="copy-cmd" onclick="copyCommand('\${escapeHtml(cmd)}', this)">\${escapeHtml(cmd)}</button>
            </div>
          </article>
        \`;
      }).join('');
    }

    document.getElementById('smartRunBtn').addEventListener('click', runSmartRecommendation);
    document.getElementById('smartTaskInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') runSmartRecommendation();
    });
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('smartTaskInput').value = chip.dataset.task || '';
        document.getElementById('smartFilesInput').value = chip.dataset.files || '';
        runSmartRecommendation();
      });
    });

    function renderSkills() {
      const q = searchInput.value.trim().toLowerCase();
      const cat = categoryFilter.value;
      const risk = riskFilter.value;
      const flag = getSelectedFlag();

      const filtered = SKILLS.filter(s => {
        if (cat && s.category !== cat) return false;
        if (risk && s.risk !== risk) return false;
        if (!q) return true;
        return (
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.tags || []).some(t => t.toLowerCase().includes(q))
        );
      });

      resultCount.textContent = filtered.length + ' / ' + SKILLS.length + ' skills';
      const slice = filtered.slice(0, 120);

      skillsGrid.innerHTML = slice.map(s => {
        const isRea = s.id.startsWith('rei-');
        const cmd = 'npx rei-skills add ' + s.id + ' ' + flag;
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(s.id)}</div>
                <span class="badge \${isRea ? 'badge-rea' : 'badge-cat'}">\${escapeHtml(s.category)}</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">\${escapeHtml(s.description)}</p>
            </div>
            <div class="card-footer">
              <span class="badge badge-risk-\${escapeHtml(s.risk)}">risk: \${escapeHtml(s.risk)}</span>
              <button class="copy-cmd" onclick="copyCommand('\${escapeHtml(cmd)}', this)">\${escapeHtml(cmd)}</button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function renderAiTargets() {
      document.getElementById('aiTargetsGrid').innerHTML = AI_TARGETS.map(t => {
        const cmd = 'npx rei-skills ' + t.flag + ' --workspace';
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(t.name)}</div>
                <span class="badge badge-cat">\${escapeHtml(t.format)}</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">
                <strong>Flag:</strong> <code>\${escapeHtml(t.flag)}</code><br/>
                <strong>Workspace Path:</strong> <code>\${escapeHtml(t.workspacePath)}</code><br/>
                <strong>Invoke:</strong> <code>\${escapeHtml(t.invocationHint)}</code>
              </p>
            </div>
            <div class="card-footer">
              <span>index: \${escapeHtml(t.indexFile)}</span>
              <button class="copy-cmd" onclick="copyCommand('\${escapeHtml(cmd)}', this)">\${escapeHtml(cmd)}</button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function renderRea() {
      const flag = getSelectedFlag();
      const reaSkills = SKILLS.filter(s => s.id.startsWith('rei-'));
      document.getElementById('reaGrid').innerHTML = reaSkills.map(s => {
        const cmd = 'npx rei-skills add ' + s.id + ' ' + flag;
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(s.id)}</div>
                <span class="badge badge-rea">REI REA v\${escapeHtml(REA_MANIFEST.upstream_version || '0.2.0')}</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">\${escapeHtml(s.description)}</p>
            </div>
            <div class="card-footer">
              <span>commit: \${escapeHtml(REA_MANIFEST.upstream_commit_short || '09fbc7b')}</span>
              <button class="copy-cmd" onclick="copyCommand('\${escapeHtml(cmd)}', this)">\${escapeHtml(cmd)}</button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function renderBundles() {
      const flag = getSelectedFlag();
      document.getElementById('bundlesGrid').innerHTML = Object.entries(BUNDLES).map(([id, b]) => {
        const cmd = 'npx rei-skills add ' + id + ' ' + flag;
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(b.name || id)}</div>
                <span class="badge badge-cat">\${(b.skills || []).length} skills</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">\${escapeHtml(b.description || '')}</p>
            </div>
            <div class="card-footer">
              <span>bundle: \${escapeHtml(id)}</span>
              <button class="copy-cmd" onclick="copyCommand('\${escapeHtml(cmd)}', this)">\${escapeHtml(cmd)}</button>
            </div>
          </article>
        \`;
      }).join('');
    }

    function renderWorkflows() {
      document.getElementById('workflowsGrid').innerHTML = WORKFLOWS.map(w => {
        const stepsCount = (w.steps || []).length;
        return \`
          <article class="card">
            <div>
              <div class="card-header">
                <div class="card-title">\${escapeHtml(w.name || w.id)}</div>
                <span class="badge badge-cat">\${stepsCount} steps</span>
              </div>
              <p class="card-desc" style="margin-top:8px;">\${escapeHtml(w.description || '')}</p>
            </div>
            <div class="card-footer">
              <span>category: \${escapeHtml(w.category || 'general')}</span>
              <span>id: \${escapeHtml(w.id)}</span>
            </div>
          </article>
        \`;
      }).join('');
    }

    searchInput.addEventListener('input', renderSkills);
    categoryFilter.addEventListener('change', renderSkills);
    riskFilter.addEventListener('change', renderSkills);
    aiTargetSelect.addEventListener('change', () => {
      renderSkills();
      renderRea();
      renderBundles();
      if (!document.getElementById('smartResultsWrap').classList.contains('hidden')) {
        runSmartRecommendation();
      }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        ['skills', 'mcp', 'ai-targets', 'rea', 'bundles', 'workflows'].forEach(t => {
          document.getElementById('tab-' + t).classList.toggle('hidden', t !== tab);
        });
      });
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      const root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    });

    renderSkills();
    renderAiTargets();
    renderRea();
    renderBundles();
    renderWorkflows();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html, 'utf8');
console.log(`✅ Built Smart Multi-AI & MCP Developer Hub -> docs/site/index.html (${compactSkills.length} skills, ${compactAiTargets.length} AI targets indexed)`);
