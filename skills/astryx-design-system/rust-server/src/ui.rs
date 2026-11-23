//! Embedded interactive Astryx Design System Explorer UI served at `GET /`.

pub fn render_explorer_html() -> String {
    r#"<!doctype html>
<html lang="en" data-astryx-theme="neutral">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Astryx Design System — Native Rust Server</title>
<link id="astryx-theme-css" rel="stylesheet" href="/api/themes/neutral/tokens.css?mode=light" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--color-background-body, #f1f1f1);
    color: var(--color-text-primary, #111);
    font-family: var(--font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    font-size: 14px; line-height: 1.5;
    min-height: 100vh;
  }
  code, pre {
    font-family: var(--font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  }
  header {
    position: sticky; top: 0; z-index: 20;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 24px;
    background: var(--color-background-surface, #fff);
    border-bottom: 1px solid var(--color-border, rgba(0,0,0,.1));
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-mark {
    width: 30px; height: 30px; border-radius: var(--radius-element, 8px);
    background: var(--color-accent, #1b1b1b); color: var(--color-on-accent, #fff);
    display: grid; place-items: center; font-weight: 700; font-size: 15px;
  }
  .brand h1 { margin: 0; font-size: 16px; font-family: var(--font-family-heading, inherit); }
  .brand small { color: var(--color-text-secondary, #555); font-size: 12px; display: block; }
  .controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  select, input, textarea, button {
    font: inherit; color: inherit;
    background: var(--color-background-card, #fff);
    border: 1px solid var(--color-border-emphasized, rgba(0,0,0,.2));
    border-radius: var(--radius-element, 8px);
    padding: 6px 10px;
  }
  button { cursor: pointer; font-weight: 500; }
  button.primary {
    background: var(--color-accent, #1b1b1b);
    color: var(--color-on-accent, #fff);
    border-color: transparent;
  }
  button.tab { background: transparent; border-color: transparent; color: var(--color-text-secondary, #555); }
  button.tab.active {
    background: var(--color-accent-muted, rgba(0,0,0,.08));
    color: var(--color-text-primary, #111);
  }
  .shell {
    max-width: 1280px; margin: 0 auto; padding: 20px 24px 48px;
    display: grid; grid-template-columns: 1fr; gap: 18px;
  }
  .stats-row {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;
  }
  .stat-card, .panel {
    background: var(--color-background-card, #fff);
    border: 1px solid var(--color-border, rgba(0,0,0,.1));
    border-radius: var(--radius-container, 12px);
    padding: 16px;
    box-shadow: var(--shadow-low, none);
  }
  .stat-val { font-size: 24px; font-weight: 700; font-family: var(--font-family-heading, inherit); }
  .stat-lbl { font-size: 12px; color: var(--color-text-secondary, #555); }
  .nav-bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .search-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .search-row input { flex: 1; min-width: 240px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .item-card {
    background: var(--color-background-surface, #fff);
    border: 1px solid var(--color-border, rgba(0,0,0,.1));
    border-radius: var(--radius-container, 12px);
    padding: 14px; cursor: pointer; transition: transform .12s ease;
  }
  .item-card:hover { transform: translateY(-1px); border-color: var(--color-accent, #1b1b1b); }
  .chip {
    display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: var(--radius-full, 999px);
    background: var(--color-accent-muted, rgba(0,0,0,.08)); color: var(--color-text-primary, #111);
    margin-right: 4px; margin-bottom: 4px;
  }
  .swatch {
    display: inline-block; width: 16px; height: 16px; border-radius: 4px;
    border: 1px solid var(--color-border-emphasized, rgba(0,0,0,.2)); vertical-align: middle; margin-right: 6px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--color-border, rgba(0,0,0,.1)); vertical-align: top; }
  th { font-weight: 600; color: var(--color-text-secondary, #555); }
  pre {
    background: var(--color-background-muted, rgba(0,0,0,.05));
    padding: 12px; border-radius: var(--radius-element, 8px);
    overflow-x: auto; font-size: 12px;
  }
  .split { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 16px; }
  @media (max-width: 900px) { .split { grid-template-columns: 1fr; } }
  .muted { color: var(--color-text-secondary, #666); }
  .hidden { display: none !important; }
  .badge-err { background: var(--color-error-muted, #fee); color: var(--color-text-error, #b00); }
  .badge-warn { background: var(--color-warning-muted, #ffc); color: var(--color-text-warning, #750); }
  .badge-ok { background: var(--color-success-muted, #dfd); color: var(--color-text-success, #062); }
</style>
</head>
<body>
<header>
  <div class="brand">
    <div class="brand-mark">A</div>
    <div>
      <h1>Astryx Design System</h1>
      <small id="meta-line">Native Rust Service • Zero-Dependency HTTP + MCP + CLI</small>
    </div>
  </div>
  <div class="controls">
    <label for="theme-sel" class="muted">Theme</label>
    <select id="theme-sel">
      <option value="neutral">Neutral</option>
      <option value="butter">Butter</option>
      <option value="chocolate">Chocolate</option>
      <option value="gothic">Gothic (Dark)</option>
      <option value="matcha">Matcha</option>
      <option value="stone">Stone</option>
      <option value="y2k">Y2K</option>
    </select>
    <select id="mode-sel">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">System</option>
    </select>
    <a id="css-link" href="/api/themes/neutral/tokens.css?mode=light" target="_blank" style="color:var(--color-text-accent);text-decoration:none;font-size:12px;">tokens.css ↗</a>
  </div>
</header>

<main class="shell">
  <section class="stats-row" id="stats-row"></section>

  <nav class="nav-bar">
    <button class="tab active" data-tab="components">Components &amp; Hooks</button>
    <button class="tab" data-tab="tokens">Design Tokens</button>
    <button class="tab" data-tab="templates">Page Templates</button>
    <button class="tab" data-tab="themes">Themes</button>
    <button class="tab" data-tab="builder">Page Builder</button>
    <button class="tab" data-tab="doctor">Code Doctor</button>
  </nav>

  <section id="tab-components" class="panel">
    <div class="search-row">
      <input id="comp-q" placeholder="Search 270+ Astryx components & hooks (e.g. Button, Dialog, Table, useToast)..." />
      <select id="comp-kind">
        <option value="">All kinds</option>
        <option value="component">Components</option>
        <option value="hook">Hooks</option>
        <option value="utility">Utilities</option>
      </select>
    </div>
    <div class="split">
      <div id="comp-list" style="max-height:560px;overflow:auto;"></div>
      <div id="comp-detail" class="panel" style="margin:0;">
        <p class="muted">Select any component or hook to inspect its props, best practices, WCAG contrast rules, and JSX usage.</p>
      </div>
    </div>
  </section>

  <section id="tab-tokens" class="panel hidden">
    <div class="search-row">
      <input id="tok-q" placeholder="Filter CSS custom properties (e.g. --color-accent, spacing, radius, shadow)..." />
      <select id="tok-fam">
        <option value="">All families</option>
        <option value="color">color</option>
        <option value="spacing">spacing</option>
        <option value="radius">radius</option>
        <option value="shadow">shadow</option>
        <option value="size">size</option>
        <option value="focus">focus</option>
        <option value="duration">duration</option>
        <option value="ease">ease</option>
        <option value="typography">typography</option>
        <option value="textSize">textSize</option>
        <option value="fontWeight">fontWeight</option>
        <option value="typeScale">typeScale</option>
      </select>
    </div>
    <div style="max-height:560px;overflow:auto;">
      <table>
        <thead><tr><th>Token</th><th>Family</th><th>Light</th><th>Dark</th></tr></thead>
        <tbody id="tok-body"></tbody>
      </table>
    </div>
  </section>

  <section id="tab-templates" class="panel hidden">
    <div class="search-row">
      <input id="tpl-q" placeholder="Filter 58 page templates (e.g. dashboard, settings, ai-chat, table, kanban)..." />
    </div>
    <div class="grid" id="tpl-grid"></div>
  </section>

  <section id="tab-themes" class="panel hidden">
    <div class="grid" id="theme-grid"></div>
  </section>

  <section id="tab-builder" class="panel hidden">
    <div class="search-row">
      <input id="build-idea" value="analytics dashboard with KPIs, filters, and data table" placeholder="Describe the page you want to build..." />
      <button class="primary" id="build-btn">Generate Astryx Plan</button>
    </div>
    <div id="build-out"></div>
  </section>

  <section id="tab-doctor" class="panel hidden">
    <p class="muted" style="margin-top:0;">Paste React/TSX/CSS code to audit against Astryx rules (raw &lt;a&gt;, hardcoded hex, missing Button label, boolean prop naming, inline styles).</p>
    <textarea id="doc-code" rows="8" style="width:100%;font-family:var(--font-family-code,monospace);">&lt;div style={{ color: '#0064E0' }}&gt;
  &lt;a href="/settings"&gt;Settings&lt;/a&gt;
  &lt;Button disabled&gt;Save changes&lt;/Button&gt;
  &lt;Dialog open={true} /&gt;
&lt;/div&gt;</textarea>
    <div style="margin:10px 0;"><button class="primary" id="doc-run">Run Astryx Doctor</button></div>
    <div id="doc-out"></div>
  </section>
</main>

<script>
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function applyTheme() {
  const t = $('theme-sel').value;
  const m = t === 'gothic' ? 'dark' : $('mode-sel').value;
  document.documentElement.setAttribute('data-astryx-theme', t);
  const href = `/api/themes/${encodeURIComponent(t)}/tokens.css?mode=${encodeURIComponent(m)}`;
  $('astryx-theme-css').href = href;
  $('css-link').href = href;
}
$('theme-sel').addEventListener('change', applyTheme);
$('mode-sel').addEventListener('change', applyTheme);

document.querySelectorAll('button.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('button.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    ['components','tokens','templates','themes','builder','doctor'].forEach(t => {
      $('tab-' + t).classList.toggle('hidden', t !== target);
    });
  });
});

async function loadStats() {
  const s = await (await fetch('/api/stats')).json();
  $('meta-line').textContent = `Meta Astryx Core v${s.coreVersion} • React ${s.reactPeer} • StyleX ${s.stylexPeer} • Native Rust Server`;
  const c = s.counts;
  const cards = [
    ['Components', c.components],
    ['Hooks', c.hooks],
    ['Design Tokens', c.tokens],
    ['Official Themes', c.themes],
    ['Page Templates', c.templates],
    ['Guide Topics', c.docs]
  ];
  $('stats-row').innerHTML = cards.map(([k,v]) => `<div class="stat-card"><div class="stat-val">${v}</div><div class="stat-lbl">${k}</div></div>`).join('');
}

async function loadComponents() {
  const q = $('comp-q').value.trim();
  const kind = $('comp-kind').value;
  const url = `/api/components?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}`;
  const data = await (await fetch(url)).json();
  $('comp-list').innerHTML = data.items.map(it => `
    <div class="item-card" style="margin-bottom:8px;" onclick="inspectComponent('${esc(it.name)}')">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong>${esc(it.name)}</strong>
        <span class="chip">${esc(it.kind)} • ${esc(it.category)}</span>
      </div>
      <div class="muted" style="font-size:12px;margin-top:4px;">${esc(it.description).slice(0,130)}</div>
    </div>
  `).join('') || '<p class="muted">No matching components.</p>';
}

window.inspectComponent = async function(name) {
  const c = await (await fetch(`/api/components/${encodeURIComponent(name)}`)).json();
  const propsRows = (c.props || []).map(p => `
    <tr>
      <td><code>${esc(p.name)}${p.required ? '*' : ''}</code></td>
      <td><code>${esc(p.type)}</code></td>
      <td><code>${esc(p.defaultValue || '—')}</code></td>
      <td>${esc(p.description)}</td>
    </tr>`).join('');
  const bpHtml = (c.bestPractices || []).map(b => `<li>${b.do ? '✅' : '❌'} ${esc(b.text)}</li>`).join('');
  $('comp-detail').innerHTML = `
    <h2 style="margin:0 0 6px;">${esc(c.displayName)} <span class="chip">${esc(c.category)}</span></h2>
    <p class="muted" style="margin:0 0 10px;">${esc(c.description)}</p>
    <pre>${esc(c.exampleCode)}</pre>
    ${propsRows ? `<h4>Props (${c.props.length})</h4><div style="max-height:240px;overflow:auto;"><table><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>${propsRows}</tbody></table></div>` : ''}
    ${bpHtml ? `<h4>Best Practices</h4><ul style="padding-left:18px;font-size:12px;">${bpHtml}</ul>` : ''}
  `;
};

async function loadTokens() {
  const q = $('tok-q').value.trim();
  const fam = $('tok-fam').value;
  const data = await (await fetch(`/api/tokens?q=${encodeURIComponent(q)}&family=${encodeURIComponent(fam)}`)).json();
  $('tok-body').innerHTML = data.items.map(t => {
    const isColor = t.family === 'color';
    const swL = isColor ? `<span class="swatch" style="background:${esc(t.light)}"></span>` : '';
    const swD = isColor ? `<span class="swatch" style="background:${esc(t.dark)}"></span>` : '';
    return `<tr>
      <td><code style="cursor:pointer;" title="Click to copy var()" onclick="navigator.clipboard?.writeText('var(${esc(t.name)})')">${esc(t.name)}</code></td>
      <td><span class="chip">${esc(t.family)}</span></td>
      <td>${swL}<code>${esc(t.light)}</code></td>
      <td>${swD}<code>${esc(t.dark)}</code></td>
    </tr>`;
  }).join('');
}

async function loadTemplates() {
  const q = $('tpl-q').value.trim();
  const data = await (await fetch(`/api/templates?q=${encodeURIComponent(q)}`)).json();
  $('tpl-grid').innerHTML = data.items.map(t => `
    <div class="item-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <strong>${esc(t.name)}</strong>
        <span class="chip">${esc(t.slug)}</span>
      </div>
      <div class="muted" style="font-size:12px;margin:6px 0;">${esc(t.description)}</div>
      <div>${(t.components || []).slice(0,10).map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      <pre style="margin:8px 0 0;padding:8px;">${esc(t.scaffoldCommand)}</pre>
    </div>
  `).join('');
}

async function loadThemes() {
  const data = await (await fetch('/api/themes')).json();
  $('theme-grid').innerHTML = data.items.map(t => `
    <div class="item-card" onclick="$('theme-sel').value='${esc(t.name)}';applyTheme();">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${esc(t.displayName)}</strong>
        <span class="chip">${esc(t.colorModes.join(' / '))}</span>
      </div>
      <p class="muted" style="font-size:12px;margin:6px 0;">${esc(t.description)}</p>
      <div style="font-size:12px;">
        <div><strong>Package:</strong> <code>${esc(t.packageName)}</code></div>
        <div><strong>Fonts:</strong> ${esc(t.fonts.heading)} / ${esc(t.fonts.body)}</div>
        <div><strong>Overrides:</strong> ${t.overrideCount} semantic tokens</div>
      </div>
    </div>
  `).join('');
}

async function runBuilder() {
  const idea = $('build-idea').value.trim() || 'dashboard';
  const plan = await (await fetch(`/api/build?idea=${encodeURIComponent(idea)}`)).json();
  $('build-out').innerHTML = `
    <div style="margin-bottom:12px;"><strong>Recommended starter template:</strong> <span class="chip">${esc(plan.recommendedTemplate)}</span></div>
    <h4>Recommended Workflow</h4>
    <ol>${(plan.workflow || []).map(w => `<li>${esc(w)}</li>`).join('')}</ol>
    <h4>Matching Templates</h4>
    <div class="grid" style="margin-bottom:12px;">${(plan.templates || []).map(t => `<div class="item-card"><strong>${esc(t.name)}</strong> <span class="chip">${esc(t.slug)}</span><div class="muted" style="font-size:12px;">${esc(t.description)}</div></div>`).join('')}</div>
    <h4>Matching Components</h4>
    <div>${(plan.components || []).map(c => `<span class="chip">${esc(c.name)} (${esc(c.category)})</span>`).join('')}</div>
  `;
}

async function runDoctor() {
  const code = $('doc-code').value;
  const rep = await (await fetch('/api/doctor', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({filename: 'Page.tsx', code})
  })).json();
  const s = rep.summary;
  $('doc-out').innerHTML = `
    <div style="margin-bottom:10px;">
      <span class="chip ${rep.passed ? 'badge-ok' : 'badge-err'}">${rep.passed ? 'PASSED' : 'ISSUES FOUND'}</span>
      <span class="chip">Errors: ${s.errors}</span>
      <span class="chip">Warnings: ${s.warnings}</span>
      <span class="chip">Info: ${s.info}</span>
    </div>
    ${(rep.findings || []).map(f => `
      <div class="item-card" style="margin-bottom:8px;">
        <span class="chip ${f.severity === 'error' ? 'badge-err' : 'badge-warn'}">${esc(f.severity)} • ${esc(f.rule)} • line ${f.line}</span>
        <div style="margin-top:4px;">${esc(f.message)}</div>
        <div class="muted" style="font-size:12px;margin-top:4px;"><strong>Fix:</strong> ${esc(f.fix)}</div>
      </div>
    `).join('') || '<p class="muted">Clean! No Astryx rule violations detected.</p>'}
  `;
}

$('comp-q').addEventListener('input', loadComponents);
$('comp-kind').addEventListener('change', loadComponents);
$('tok-q').addEventListener('input', loadTokens);
$('tok-fam').addEventListener('change', loadTokens);
$('tpl-q').addEventListener('input', loadTemplates);
$('build-btn').addEventListener('click', runBuilder);
$('doc-run').addEventListener('click', runDoctor);

loadStats();
loadComponents().then(() => inspectComponent('Button'));
loadTokens();
loadTemplates();
loadThemes();
runBuilder();
</script>
</body>
</html>
"#.to_string()
}
