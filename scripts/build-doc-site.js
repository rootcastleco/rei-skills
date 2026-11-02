#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Prepare compact JSON payload for instant client-side search & filtering
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

const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>REI Skills — Developer Hub &amp; Interactive Skill Registry</title>
  <meta name="description" content="The engineering-grade skill layer for AI agents. Browse ${compactSkills.length} validated skills, bundles, workflows, and the REI Reverse Engineering (REA) module." />
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
      background: rgba(7, 11, 20, 0.88);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    [data-theme="light"] .topbar {
      background: rgba(248, 250, 252, 0.9);
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
      gap: 12px;
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
    .hero {
      max-width: 1280px;
      margin: 0 auto;
      padding: 40px 24px 24px;
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
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    .hero p {
      color: var(--text-secondary);
      max-width: 780px;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 28px;
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
    .tabs {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }
    .tab-btn {
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 10px 18px;
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
    input[type="search"], select {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-family: var(--font-sans);
    }
    input[type="search"]:focus, select:focus {
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
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <span>REI SKILLS</span>
      <span class="brand-badge">ROOTCASTLE ENGINEERING &amp; INNOVATION</span>
    </div>
    <div class="nav-actions">
      <a class="btn" href="https://github.com/rootcastleco/rei-skills" target="_blank" rel="noopener">GitHub</a>
      <a class="btn" href="https://github.com/rootcastleco/Rei-Reverse-engineer" target="_blank" rel="noopener">REI REA Workbench</a>
      <button class="btn" id="themeToggle" type="button">Toggle Theme</button>
    </div>
  </header>

  <section class="hero">
    <div class="hero-eyebrow">ENGINEERING BEYOND BOUNDARIES</div>
    <h1>The Engineering-Grade Skill Layer for AI Agents</h1>
    <p>Search, inspect, and install ${compactSkills.length} validated skills across Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Antigravity, and OpenCode — featuring first-class integration with the REI Reverse Engineering &amp; Binary Intelligence Workbench.</p>
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-label">Validated Skills</div>
        <div class="stat-value">${compactSkills.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">REI REA Specialist Skills</div>
        <div class="stat-value">${(reaManifest.skills || []).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Curated Bundles</div>
        <div class="stat-value">${Object.keys(bundlesData.bundles || {}).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Orchestrated Workflows</div>
        <div class="stat-value">${(workflowsData.workflows || []).length}</div>
      </div>
    </div>
  </section>

  <nav class="tabs">
    <button class="tab-btn active" data-tab="skills">Skill Registry (${compactSkills.length})</button>
    <button class="tab-btn" data-tab="rea">REI Reverse Engineering (${(reaManifest.skills || []).length})</button>
    <button class="tab-btn" data-tab="bundles">Role Bundles (${Object.keys(bundlesData.bundles || {}).length})</button>
    <button class="tab-btn" data-tab="workflows">Workflows (${(workflowsData.workflows || []).length})</button>
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
    const BUNDLES = ${JSON.stringify(bundlesData.bundles || {})};
    const WORKFLOWS = ${JSON.stringify(workflowsData.workflows || [])};
    const REA_MANIFEST = ${JSON.stringify(reaManifest)};

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const riskFilter = document.getElementById('riskFilter');
    const skillsGrid = document.getElementById('skillsGrid');
    const resultCount = document.getElementById('resultCount');

    // Populate categories
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

    function renderSkills() {
      const q = searchInput.value.trim().toLowerCase();
      const cat = categoryFilter.value;
      const risk = riskFilter.value;

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
        const cmd = 'npx rei-skills add ' + s.id;
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

    function renderRea() {
      const reaSkills = SKILLS.filter(s => s.id.startsWith('rei-'));
      document.getElementById('reaGrid').innerHTML = reaSkills.map(s => {
        const cmd = 'npx rei-skills add ' + s.id;
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
      document.getElementById('bundlesGrid').innerHTML = Object.entries(BUNDLES).map(([id, b]) => {
        const cmd = 'npx rei-skills add ' + id;
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

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        ['skills', 'rea', 'bundles', 'workflows'].forEach(t => {
          document.getElementById('tab-' + t).classList.toggle('hidden', t !== tab);
        });
      });
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      const root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    });

    renderSkills();
    renderRea();
    renderBundles();
    renderWorkflows();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html, 'utf8');
console.log(`✅ Built static searchable documentation site -> docs/site/index.html (${compactSkills.length} skills indexed)`);
