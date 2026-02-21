#!/usr/bin/env node

/**
 * 🏰 Rei Skills — Brand Injection Script
 * Rootcastle Engineering & Innovation | Batuhan Ayrıbaş
 *
 * This script:
 * 1. Recursively finds all SKILL.md files in skills/
 * 2. Updates 'source' field in YAML frontmatter to 'rootcastle-rei'
 * 3. Adds a Rootcastle branding footer to each file (idempotent)
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
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findSkillFiles(fullPath));
        } else if (entry.name === "SKILL.md") {
            results.push(fullPath);
        }
    }
    return results;
}

function updateFrontmatter(content) {
    // Match YAML frontmatter between --- delimiters
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return content;

    let frontmatter = fmMatch[1];

    // Update source field
    if (/^source:\s*.+$/m.test(frontmatter)) {
        frontmatter = frontmatter.replace(
            /^source:\s*.+$/m,
            'source: rootcastle-rei'
        );
    } else {
        // Add source field if missing
        frontmatter += '\nsource: rootcastle-rei';
    }

    return content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatter}\n---`);
}

function addBrandingFooter(content) {
    // Check if branding footer already exists
    if (content.includes(BRAND_MARKER)) {
        return content;
    }

    // Remove trailing whitespace/newlines and add footer
    return content.trimEnd() + "\n" + BRAND_FOOTER;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Step 1: Update frontmatter source
    content = updateFrontmatter(content);

    // Step 2: Add branding footer
    content = addBrandingFooter(content);

    if (content !== original) {
        fs.writeFileSync(filePath, content, "utf8");
        return true;
    }
    return false;
}

function main() {
    console.log("\n🏰 Rei Skills — Brand Injection Script");
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
            console.error(`  ❌ Error processing ${path.relative(SKILLS_DIR, file)}: ${err.message}`);
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already branded): ${skipped}`);
    if (errors > 0) {
        console.log(`   ❌ Errors: ${errors}`);
    }
    console.log(`   📁 Total: ${files.length}\n`);
}

main();
