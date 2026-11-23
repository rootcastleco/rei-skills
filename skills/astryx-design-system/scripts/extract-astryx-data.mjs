#!/usr/bin/env node
/**
 * Extracts authoritative Meta Astryx design-system metadata from a local
 * checkout of https://github.com/meta/astryx into:
 *   - rust-server/data/astryx_catalog.json
 *   - references/components.md
 *   - references/tokens.md
 *   - references/themes.md
 *
 * Usage:
 *   node scripts/extract-astryx-data.mjs [path-to-meta-astryx-checkout]
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');
const UPSTREAM =
  process.argv[2] ||
  path.join(process.env.TEMP || process.env.TMP || '/tmp', 'astryx-upstream');

if (!fs.existsSync(UPSTREAM)) {
  console.error(`Upstream meta/astryx checkout not found at: ${UPSTREAM}`);
  process.exit(1);
}

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full, predicate, out);
    } else if (predicate(entry.name, full)) {
      out.push(full);
    }
  }
  return out;
}

function cleanText(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

function splitLightDark(val) {
  const s = cleanText(val);
  const m = s.match(/^light-dark\((.+)\)$/);
  if (!m) return {light: s, dark: s};
  // Split at top-level comma (respecting parentheses)
  const inner = m[1];
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      splitIdx = i;
      break;
    }
  }
  if (splitIdx === -1) return {light: s, dark: s};
  return {
    light: inner.slice(0, splitIdx).trim(),
    dark: inner.slice(splitIdx + 1).trim(),
  };
}

// 1. Parse packages/core/src/theme/tokens.stylex.ts
function extractTokens() {
  const tokensPath = path.join(UPSTREAM, 'packages/core/src/theme/tokens.stylex.ts');
  const src = fs.readFileSync(tokensPath, 'utf8');
  const familyMap = [
    ['colorDefaults', 'color'],
    ['spacingDefaults', 'spacing'],
    ['sizeDefaults', 'size'],
    ['borderDefaults', 'border'],
    ['focusDefaults', 'focus'],
    ['radiusDefaults', 'radius'],
    ['shadowDefaults', 'shadow'],
    ['durationDefaults', 'duration'],
    ['easeDefaults', 'ease'],
    ['typographyDefaults', 'typography'],
    ['textSizeDefaults', 'textSize'],
    ['fontWeightDefaults', 'fontWeight'],
    ['typeScaleDefaults', 'typeScale'],
  ];

  const tokens = [];
  for (const [constName, family] of familyMap) {
    const re = new RegExp(
      `export const ${constName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as const;`,
    );
    const match = src.match(re);
    if (!match) continue;
    const block = match[1]
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Match '--token-name': 'value' or "--token-name": "value"
    const entryRe = /['"](--[a-z0-9-]+)['"]\s*:\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/gi;
    let m;
    while ((m = entryRe.exec(block)) !== null) {
      const name = m[1];
      const value = cleanText(m[3]);
      const {light, dark} = splitLightDark(value);
      tokens.push({name, family, value, light, dark});
    }
  }
  return tokens;
}

// 2. Parse all core component & hook .doc.mjs files
async function extractComponents() {
  const coreSrc = path.join(UPSTREAM, 'packages/core/src');
  const docFiles = walk(coreSrc, (name) => name.endsWith('.doc.mjs')).sort();
  const items = [];

  for (const file of docFiles) {
    try {
      const mod = await import(pathToFileURL(file).href);
      const d = mod.docs || mod.doc || mod.default;
      if (!d || typeof d !== 'object') continue;

      const base = path.basename(file, '.doc.mjs');
      const relDir = path.relative(coreSrc, path.dirname(file)).replace(/\\/g, '/');
      const name = d.name || base;
      const isHook = name.startsWith('use') || relDir.startsWith('hooks');
      const isUtility =
        !isHook &&
        (name.startsWith('create') ||
          relDir.startsWith('theme') ||
          relDir.startsWith('i18n') ||
          relDir.startsWith('animator') ||
          relDir.startsWith('gestures') ||
          relDir.startsWith('dragToSnapPoints') ||
          relDir.startsWith('reorderable'));

      const kind = isHook ? 'hook' : isUtility ? 'utility' : 'component';
      const topFolder = relDir.split('/')[0];
      const importPath =
        topFolder === 'hooks'
          ? `@astryxdesign/core`
          : `@astryxdesign/core/${topFolder}`;

      const description = cleanText(
        d.usage?.description || d.description || `${name} in @astryxdesign/core.`,
      );

      const props = Array.isArray(d.props)
        ? d.props.slice(0, 40).map((p) => ({
            name: String(p.name || ''),
            type: cleanText(String(p.type || 'unknown')),
            defaultValue: p.default != null ? cleanText(String(p.default)) : '',
            required: Boolean(p.required),
            description: cleanText(String(p.description || '')),
          }))
        : [];

      const bestPractices = Array.isArray(d.usage?.bestPractices)
        ? d.usage.bestPractices.slice(0, 12).map((bp) => ({
            doRule: bp.guidance !== false,
            text: cleanText(bp.description || bp.text || ''),
          }))
        : [];

      const accessibility = Array.isArray(d.usage?.accessibility)
        ? d.usage.accessibility.slice(0, 8).map((a) => ({
            name: cleanText(a.name || ''),
            criterion: cleanText(a.criterion || ''),
            requirement: cleanText(a.requirement || ''),
            description: cleanText(a.description || ''),
          }))
        : [];

      const anatomy = Array.isArray(d.usage?.anatomy)
        ? d.usage.anatomy.slice(0, 10).map((a) => ({
            name: cleanText(a.name || ''),
            required: Boolean(a.required),
            description: cleanText(a.description || ''),
          }))
        : [];

      const keywords = Array.isArray(d.keywords)
        ? d.keywords.map((k) => String(k).toLowerCase()).slice(0, 20)
        : [];

      // Construct concise usage snippet
      let exampleCode = '';
      if (kind === 'component') {
        const reqProps = props
          .filter((p) => p.required && p.name !== 'children')
          .slice(0, 3)
          .map((p) => {
            if (p.name === 'label') return `label="${name}"`;
            if (p.type.includes('boolean')) return `${p.name}`;
            if (p.type.includes('=>')) return `${p.name}={() => {}}`;
            return `${p.name}={...}`;
          })
          .join(' ');
        const hasChildren = props.some((p) => p.name === 'children');
        const usesLabel = props.some((p) => p.name === 'label');
        exampleCode =
          `import {${name}} from '${importPath}';\n\n` +
          (usesLabel && !hasChildren
            ? `<${name}${reqProps ? ' ' + reqProps : ' label="Example"'} />`
            : hasChildren
              ? `<${name}${reqProps ? ' ' + reqProps : ''}>Content</${name}>`
              : `<${name}${reqProps ? ' ' + reqProps : ''} />`);
      } else {
        exampleCode = `import {${name}} from '${importPath}';`;
      }

      items.push({
        name,
        displayName: cleanText(d.displayName || name),
        kind,
        category: cleanText(d.category || (isHook ? 'Hooks' : 'General')),
        group: cleanText(d.group || topFolder),
        importPath,
        description,
        keywords,
        props,
        bestPractices,
        accessibility,
        anatomy,
        exampleCode,
      });
    } catch (err) {
      // Some .doc.mjs files may import local helpers; fall back to regex metadata extraction
      const raw = fs.readFileSync(file, 'utf8');
      const base = path.basename(file, '.doc.mjs');
      const relDir = path.relative(coreSrc, path.dirname(file)).replace(/\\/g, '/');
      const topFolder = relDir.split('/')[0];
      const nameMatch = raw.match(/name:\s*['"]([^'"]+)['"]/);
      const catMatch = raw.match(/category:\s*['"]([^'"]+)['"]/);
      const descMatch = raw.match(/description:\s*['"`]([^'"`]{10,400})['"`]/);
      const name = nameMatch ? nameMatch[1] : base;
      const kind = name.startsWith('use') ? 'hook' : 'component';
      items.push({
        name,
        displayName: name,
        kind,
        category: catMatch ? catMatch[1] : kind === 'hook' ? 'Hooks' : 'General',
        group: topFolder,
        importPath: `@astryxdesign/core/${topFolder}`,
        description: descMatch ? cleanText(descMatch[1]) : `${name} in @astryxdesign/core.`,
        keywords: [name.toLowerCase(), topFolder.toLowerCase()],
        props: [],
        bestPractices: [],
        accessibility: [],
        anatomy: [],
        exampleCode: `import {${name}} from '@astryxdesign/core/${topFolder}';`,
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

// 3. Parse all 7 official themes + resolved hex palettes
async function extractThemes() {
  const themeNames = ['neutral', 'butter', 'chocolate', 'gothic', 'matcha', 'stone', 'y2k'];
  const themes = [];

  for (const t of themeNames) {
    const dir = path.join(UPSTREAM, 'packages/themes', t, 'src');
    const docPath = path.join(dir, `${t}Theme.doc.mjs`);
    const tsPath = path.join(dir, `${t}Theme.ts`);
    const palPath = path.join(dir, `${t}Palettes.generated.ts`);

    let docMeta = {name: t, displayName: t[0].toUpperCase() + t.slice(1), description: '', maintained: false};
    if (fs.existsSync(docPath)) {
      try {
        const mod = await import(pathToFileURL(docPath).href);
        const d = mod.default || mod.doc || mod.docs || {};
        docMeta = {
          name: d.name || t,
          displayName: d.displayName || docMeta.displayName,
          description: cleanText(d.description || ''),
          maintained: Boolean(d.maintained),
        };
      } catch {}
    }

    // Load generated OKLCH palette if present
    let palette = {};
    if (fs.existsSync(palPath)) {
      const psrc = fs.readFileSync(palPath, 'utf8');
      const pm = psrc.match(/export const palette\s*=\s*(\{[\s\S]*?\})\s*as const;/);
      if (pm) {
        try {
          palette = JSON.parse(pm[1]);
        } catch {}
      }
    }

    const tsrc = fs.existsSync(tsPath) ? fs.readFileSync(tsPath, 'utf8') : '';

    // Color modes
    const cmMatch = tsrc.match(/export const colorModes\s*=\s*\[([^\]]+)\]/);
    const colorModes = cmMatch
      ? Array.from(cmMatch[1].matchAll(/['"](light|dark)['"]/g)).map((m) => m[1])
      : ['light', 'dark'];

    // Typography
    const scaleMatch = tsrc.match(/scale:\s*\{\s*base:\s*(\d+)\s*,\s*ratio:\s*([0-9.]+)/);
    const bodyFamMatch = tsrc.match(/body:\s*\{[\s\S]*?family:\s*['"]([^'"]+)['"]/);
    const headFamMatch = tsrc.match(/heading:\s*\{[\s\S]*?family:\s*['"]([^'"]+)['"]/);
    const codeFamMatch = tsrc.match(/code:\s*\{[\s\S]*?family:\s*['"]([^'"]+)['"]/);

    const resolveExpr = (expr) => {
      const e = expr.replace(/\s+/g, ' ').trim();
      const lit = e.match(/^['"]([^'"]+)['"]$/);
      if (lit) return lit[1];
      const palRef = e.match(/^(\w+)\.(light|dark)\[(\d+)\]$/);
      if (palRef) {
        const [, ramp, mode, stop] = palRef;
        return palette?.[ramp]?.[mode]?.[stop] || '';
      }
      const alphaRef = e.match(/^withAlpha\(\s*(\w+)\.(light|dark)\[(\d+)\]\s*,\s*['"]([0-9a-fA-F]{2})['"]\s*\)$/);
      if (alphaRef) {
        const [, ramp, mode, stop, alpha] = alphaRef;
        const base = palette?.[ramp]?.[mode]?.[stop];
        return base ? `${base}${alpha}` : '';
      }
      return '';
    };

    // Extract tokens: { ... } block specifically inside defineTheme({ ... })
    const tokenOverrides = {};
    const dtIdx = tsrc.indexOf('defineTheme(');
    const dtSlice = dtIdx >= 0 ? tsrc.slice(dtIdx) : tsrc;
    const tokStart = dtSlice.search(/\btokens:\s*\{/);
    if (tokStart >= 0) {
      const openIdx = dtSlice.indexOf('{', tokStart);
      let depth = 0;
      let closeIdx = -1;
      for (let i = openIdx; i < dtSlice.length; i++) {
        if (dtSlice[i] === '{') depth++;
        else if (dtSlice[i] === '}') {
          depth--;
          if (depth === 0) {
            closeIdx = i;
            break;
          }
        }
      }
      const tb = (closeIdx > openIdx ? dtSlice.slice(openIdx + 1, closeIdx) : '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      // Parse top-level entries separated by commas (respecting brackets & parens)
      const entries = [];
      let cur = '';
      let bDepth = 0;
      let pDepth = 0;
      for (let i = 0; i < tb.length; i++) {
        const ch = tb[i];
        if (ch === '[') bDepth++;
        else if (ch === ']') bDepth--;
        else if (ch === '(') pDepth++;
        else if (ch === ')') pDepth--;
        if (ch === ',' && bDepth === 0 && pDepth === 0) {
          if (cur.trim()) entries.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      if (cur.trim()) entries.push(cur.trim());

      for (const entry of entries) {
        const km = entry.match(/^['"](--[a-z0-9-]+)['"]\s*:\s*([\s\S]+)$/);
        if (!km) continue;
        const key = km[1];
        const rhs = km[2].trim();
        if (rhs.startsWith('[') && rhs.endsWith(']')) {
          const inner = rhs.slice(1, -1).trim();
          // Split inner into two expressions at top-level comma
          let bd = 0, pd = 0, split = -1;
          for (let i = 0; i < inner.length; i++) {
            const c = inner[i];
            if (c === '[') bd++;
            else if (c === ']') bd--;
            else if (c === '(') pd++;
            else if (c === ')') pd--;
            else if (c === ',' && bd === 0 && pd === 0) {
              split = i;
              break;
            }
          }
          if (split > 0) {
            const left = inner.slice(0, split).trim();
            const right = inner.slice(split + 1).replace(/,\s*$/, '').trim();
            const light = resolveExpr(left);
            const dark = resolveExpr(right);
            if (light && dark) tokenOverrides[key] = {light, dark};
          }
        } else {
          const val = resolveExpr(rhs);
          if (val) tokenOverrides[key] = {light: val, dark: val};
        }
      }
    }

    const bodyFont = bodyFamMatch ? bodyFamMatch[1] : 'Figtree';
    const headingFont = headFamMatch ? headFamMatch[1] : bodyFont;
    const codeFont = codeFamMatch ? codeFamMatch[1] : 'JetBrains Mono';

    themes.push({
      name: docMeta.name,
      displayName: docMeta.displayName,
      packageName: `@astryxdesign/theme-${t}`,
      description: docMeta.description,
      maintained: docMeta.maintained,
      colorModes,
      fonts: {
        body: bodyFont,
        heading: headingFont,
        code: codeFont,
      },
      typeScale: {
        base: scaleMatch ? Number(scaleMatch[1]) : 14,
        ratio: scaleMatch ? Number(scaleMatch[2]) : 1.2,
      },
      tokens: tokenOverrides,
    });
  }

  return themes;
}

// 4. Parse all 58 page templates
async function extractTemplates() {
  const pagesDir = path.join(UPSTREAM, 'packages/cli/assets/templates/pages');
  const docFiles = walk(pagesDir, (name) => name === 'template.doc.mjs').sort();
  const templates = [];

  for (const file of docFiles) {
    const slug = path.basename(path.dirname(file));
    try {
      const mod = await import(pathToFileURL(file).href);
      const d = mod.doc || mod.docs || mod.default || {};
      // Also scan sibling .tsx files to extract @astryxdesign/core imports used by this template
      const dir = path.dirname(file);
      const tsxFiles = walk(dir, (n) => n.endsWith('.tsx') || n.endsWith('.ts'));
      const usedSet = new Set();
      for (const tf of tsxFiles) {
        const src = fs.readFileSync(tf, 'utf8');
        for (const m of src.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]@astryxdesign\/core(?:\/[^'"]+)?['"]/g)) {
          for (const sym of m[1].split(',')) {
            const clean = sym.replace(/\btype\b/g, '').trim().split(/\s+as\s+/)[0].trim();
            if (clean && /^[A-Z]/.test(clean)) usedSet.add(clean);
          }
        }
      }

      templates.push({
        slug,
        name: cleanText(d.displayName || d.name || slug),
        category: cleanText(d.category || 'Page'),
        description: cleanText(d.description || ''),
        keywords: Array.isArray(d.keywords)
          ? d.keywords.map((k) => String(k).toLowerCase())
          : [slug],
        components: Array.from(usedSet).sort(),
        isReady: d.isReady !== false,
      });
    } catch {
      templates.push({
        slug,
        name: slug,
        category: 'Page',
        description: `Astryx page template: ${slug}`,
        keywords: [slug],
        components: [],
        isReady: true,
      });
    }
  }

  return templates;
}

// 5. Parse core CLI reference docs
async function extractDocs() {
  const docsDir = path.join(UPSTREAM, 'packages/cli/assets/docs');
  const targetFiles = [
    ['principles', 'principles.doc.mjs'],
    ['theme', 'theme.doc.mjs'],
    ['getting-started', 'getting-started.doc.mjs'],
    ['color', 'color.doc.mjs'],
    ['spacing', 'spacing.doc.mjs'],
    ['elevation', 'elevation.doc.mjs'],
    ['shape', 'shape.doc.mjs'],
    ['motion', 'motion.doc.mjs'],
    ['styling-overview', 'styling-overview.doc.mjs'],
    ['icons', 'icons.doc.mjs'],
    ['is-my-code-good', 'is-my-code-good.doc.mjs'],
    ['browser-support', 'browser-support.doc.mjs'],
  ];

  const renderContent = (contentArr) => {
    if (!Array.isArray(contentArr)) return '';
    const parts = [];
    for (const item of contentArr) {
      if (!item || typeof item !== 'object') continue;
      if (item.type === 'prose' && item.text) parts.push(cleanText(item.text));
      else if (item.type === 'list' && Array.isArray(item.items)) {
        parts.push(
          item.items
            .map((it) =>
              typeof it === 'string'
                ? `- ${cleanText(it)}`
                : it?.text
                  ? `- ${cleanText(it.text)}`
                  : '',
            )
            .filter(Boolean)
            .join('\n'),
        );
      } else if (item.type === 'code' && item.code) {
        parts.push('```\n' + String(item.code).trim() + '\n```');
      } else if (item.type === 'callout' && item.text) {
        parts.push(`> ${cleanText(item.text)}`);
      }
    }
    return parts.join('\n\n').slice(0, 2200);
  };

  const docs = [];
  for (const [slug, file] of targetFiles) {
    const full = path.join(docsDir, file);
    if (!fs.existsSync(full)) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      const d = mod.docs || mod.doc || mod.default || {};
      const sections = Array.isArray(d.sections)
        ? d.sections
            .filter(Boolean)
            .map((s) => ({
              title: cleanText(s.title || s.section || 'Overview'),
              body: renderContent(s.content),
            }))
            .filter((s) => s.body)
        : [];

      docs.push({
        slug,
        title: cleanText(d.title || d.name || slug),
        description: cleanText(d.description || ''),
        sections,
      });
    } catch {}
  }

  return docs;
}

async function main() {
  const tokens = extractTokens();
  const components = await extractComponents();
  const themes = await extractThemes();
  const templates = await extractTemplates();
  const docs = await extractDocs();

  const corePkg = JSON.parse(
    fs.readFileSync(path.join(UPSTREAM, 'packages/core/package.json'), 'utf8'),
  );

  const catalog = {
    meta: {
      name: 'Astryx',
      upstream: 'https://github.com/meta/astryx',
      coreVersion: corePkg.version || '0.7.18',
      reactPeer: '>=19.0.0',
      stylexPeer: '^0.19.0',
      license: 'MIT',
      counts: {
        components: components.filter((c) => c.kind === 'component').length,
        hooks: components.filter((c) => c.kind === 'hook').length,
        utilities: components.filter((c) => c.kind === 'utility').length,
        tokens: tokens.length,
        themes: themes.length,
        templates: templates.length,
        docs: docs.length,
      },
    },
    components,
    tokens,
    themes,
    templates,
    docs,
  };

  const outJsonPath = path.join(SKILL_ROOT, 'rust-server/data/astryx_catalog.json');
  fs.mkdirSync(path.dirname(outJsonPath), {recursive: true});
  fs.writeFileSync(outJsonPath, JSON.stringify(catalog) + '\n', 'utf8');

  // Generate references/components.md
  const refsDir = path.join(SKILL_ROOT, 'references');
  fs.mkdirSync(refsDir, {recursive: true});

  const byCat = new Map();
  for (const c of components) {
    const key = c.kind === 'hook' ? 'Hooks' : c.category || 'General';
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(c);
  }
  const compLines = [
    '# Astryx Component & Hook Reference',
    '',
    `> Extracted from [meta/astryx](https://github.com/meta/astryx) (\`@astryxdesign/core@${catalog.meta.coreVersion}\`) — ${catalog.meta.counts.components} components, ${catalog.meta.counts.hooks} hooks, ${catalog.meta.counts.utilities} utilities.`,
    '',
  ];
  for (const cat of Array.from(byCat.keys()).sort()) {
    const list = byCat.get(cat);
    compLines.push(`## ${cat} (${list.length})`, '');
    compLines.push('| Name | Kind | Import | Key Props | Summary |');
    compLines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const c of list) {
      const keyProps = c.props
        .slice(0, 5)
        .map((p) => (p.required ? `\`${p.name}*\`` : `\`${p.name}\``))
        .join(', ');
      const desc = c.description.replace(/\|/g, '\\|').slice(0, 140);
      compLines.push(
        `| \`${c.name}\` | ${c.kind} | \`${c.importPath}\` | ${keyProps || '—'} | ${desc} |`,
      );
    }
    compLines.push('');
  }
  fs.writeFileSync(path.join(refsDir, 'components.md'), compLines.join('\n'), 'utf8');

  // Generate references/tokens.md
  const byFam = new Map();
  for (const t of tokens) {
    if (!byFam.has(t.family)) byFam.set(t.family, []);
    byFam.get(t.family).push(t);
  }
  const tokLines = [
    '# Astryx Design Tokens Reference',
    '',
    `> Extracted from \`packages/core/src/theme/tokens.stylex.ts\` (${tokens.length} tokens across ${byFam.size} families).`,
    '',
    'Always consume tokens via `var(--token-name)` or `tokenVar("--token-name")` from `@astryxdesign/core/theme/tokens`. Never hardcode hex colors, pixel radii, or arbitrary spacing.',
    '',
  ];
  for (const [fam, list] of byFam.entries()) {
    tokLines.push(`## ${fam} (${list.length})`, '');
    tokLines.push('| Token | Light Value | Dark Value |');
    tokLines.push('| :--- | :--- | :--- |');
    for (const t of list) {
      tokLines.push(
        `| \`${t.name}\` | \`${t.light.replace(/\|/g, '\\|')}\` | \`${t.dark.replace(/\|/g, '\\|')}\` |`,
      );
    }
    tokLines.push('');
  }
  fs.writeFileSync(path.join(refsDir, 'tokens.md'), tokLines.join('\n'), 'utf8');

  // Generate references/themes.md
  const themeLines = [
    '# Astryx Themes Reference',
    '',
    'All 7 official Meta Astryx theme packages. Themes override CSS custom properties under `[data-astryx-theme="<name>"]` without wrapping or forking components.',
    '',
    '| Theme | Package | Modes | Body Font | Heading Font | Scale (base / ratio) | Description |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ];
  for (const th of themes) {
    themeLines.push(
      `| **${th.displayName}** | \`${th.packageName}\` | ${th.colorModes.join(', ')} | ${th.fonts.body} | ${th.fonts.heading} | ${th.typeScale.base}px / ${th.typeScale.ratio} | ${th.description.replace(/\|/g, '\\|')} |`,
    );
  }
  themeLines.push(
    '',
    '## Using a Theme in React 19',
    '',
    '```tsx',
    "import '@astryxdesign/theme-neutral/fonts.css';",
    "import '@astryxdesign/core/reset.css';",
    "import '@astryxdesign/core/astryx.css';",
    "import '@astryxdesign/theme-neutral/theme.css';",
    "import {Theme} from '@astryxdesign/core/theme';",
    "import {neutralTheme} from '@astryxdesign/theme-neutral/built';",
    '',
    'export function Providers({children}: {children: React.ReactNode}) {',
    '  return (',
    '    <Theme theme={neutralTheme} mode="system">',
    '      {children}',
    '    </Theme>',
    '  );',
    '}',
    '```',
    '',
    '## Serving Theme CSS Directly from the Native Rust Server',
    '',
    'The bundled Rust service dynamically compiles any theme into CSS custom properties at:',
    '',
    '- `GET http://127.0.0.1:7331/api/themes/neutral/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/butter/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/chocolate/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/gothic/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/matcha/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/stone/tokens.css`',
    '- `GET http://127.0.0.1:7331/api/themes/y2k/tokens.css`',
    '',
  );
  fs.writeFileSync(path.join(refsDir, 'themes.md'), themeLines.join('\n'), 'utf8');

  console.log('Extraction complete!');
  console.log(JSON.stringify(catalog.meta.counts, null, 2));
  console.log('Catalog size (KB):', (fs.statSync(outJsonPath).size / 1024).toFixed(1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
