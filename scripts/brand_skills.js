#!/usr/bin/env node

/**
 * 🏰 Rei Skills — Brand Curation Script
 * Rootcastle Engineering & Innovation | Batuhan Ayrıbaş
 *
 * Ensures every SKILL.md has:
 * 1. A valid `source` attribution in frontmatter (defaults to 'rootcastle-rei' ONLY when missing; never overwrites upstream attribution).
 * 2. The Rootcastle curation footer (idempotent).
 */

const fs = require("fs");
const path = require("path");

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const BRAND_MARKER = "Rootcastle Engineering";

const BRAND_FOOTER = `
---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş  
> Engineering Beyond Boundaries | admin@rootcastle.com
`;

function findSkillFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSkillFiles(fullPath));
    } else if (entry.name === "SKILL.md") {
      results.push(fullPath);
    }
  }
  return results;
}

function ensureFrontmatterSource(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return content;

  let frontmatter = fmMatch[1];

  // Preserve existing upstream source; only add if missing or unknown
  if (!/^source:\s*.+$/m.test(frontmatter)) {
    frontmatter += "\nsource: rootcastle-rei";
  }

  return content.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${frontmatter}\n---`);
}

function addBrandingFooter(content) {
  if (content.includes(BRAND_MARKER)) {
    return content;
  }
  return content.trimEnd() + "\n" + BRAND_FOOTER;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  content = ensureFrontmatterSource(content);
  content = addBrandingFooter(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

function main() {
  console.log("\n🏰 Rei Skills — Brand Curation Script");
  console.log("   Rootcastle Engineering & Innovation | Batuhan Ayrıbaş\n");

  const files = findSkillFiles(SKILLS_DIR);
  console.log(`Found ${files.length} SKILL.md files\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const changed = processFile(file);
      if (changed) {
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      console.error(
        `  ❌ Error processing ${path.relative(SKILLS_DIR, file)}: ${err.message}`,
      );
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already compliant): ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
  console.log(`   📁 Total: ${files.length}\n`);
}

main();
