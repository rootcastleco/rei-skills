#!/usr/bin/env node

/**
 * 🔒 Rei Skills — Security Audit Script
 * Rootcastle Engineering & Innovation | Batuhan Ayrıbaş
 *
 * Scans all SKILL.md files for:
 * - Hardcoded API keys / secrets patterns
 * - Dangerous shell commands
 * - Missing risk classification
 * - Offensive skills without authorization warnings
 * - Potential code injection patterns
 */

const fs = require("fs");
const path = require("path");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

// ============================================================================
// Pattern Definitions
// ============================================================================

const SECRET_PATTERNS = [
    { regex: /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/gi, name: "API Key" },
    { regex: /password\s*[:=]\s*['"][^'"]{4,}['"]/gi, name: "Password" },
    { regex: /secret\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/gi, name: "Secret" },
    { regex: /token\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/gi, name: "Token" },
    { regex: /sk-[A-Za-z0-9]{20,}/g, name: "OpenAI Key" },
    { regex: /AKIA[0-9A-Z]{16}/g, name: "AWS Access Key" },
    { regex: /ghp_[A-Za-z0-9]{36}/g, name: "GitHub Token" },
    { regex: /glpat-[A-Za-z0-9-]{20}/g, name: "GitLab Token" },
];

const DANGEROUS_COMMANDS = [
    { regex: /rm\s+-rf\s+\//g, name: "rm -rf / (destructive)" },
    { regex: /curl\s+[^\n]*\|\s*(ba)?sh/g, name: "curl | sh (remote execution)" },
    { regex: /wget\s+[^\n]*\|\s*(ba)?sh/g, name: "wget | sh (remote execution)" },
    { regex: /eval\s*\(/g, name: "eval() (code injection risk)" },
    { regex: /exec\s*\(\s*['"`]/g, name: "exec() with string (injection risk)" },
    { regex: /\bdd\s+if=.*of=\/dev\//g, name: "dd to device (destructive)" },
    { regex: /mkfs\./g, name: "mkfs (filesystem format)" },
    { regex: /:(){ :\|:& };:/g, name: "Fork bomb" },
    { regex: /chmod\s+777/g, name: "chmod 777 (insecure permissions)" },
    { regex: /--no-verify/g, name: "--no-verify (bypass security)" },
];

const OFFENSIVE_KEYWORDS = [
    "penetration testing", "pentest", "exploit", "payload",
    "reverse shell", "privilege escalation", "sql injection",
    "xss", "cross-site scripting", "brute force",
    "password cracking", "vulnerability scanning",
    "attack", "hacking", "metasploit", "burp suite",
    "reconnaissance", "enumeration", "fuzzing",
    "red team", "offensive security",
];

const AUTH_WARNING = "⚠️";
const AUTH_PHRASES = [
    "authorized use only",
    "authorized educational",
    "explicit authorization",
    "written authorization",
    "authorized professional",
    "legal authorization",
    "own systems only",
    "permission to test",
];

// ============================================================================
// Scanner Functions
// ============================================================================

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

function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const fm = {};
    match[1].split("\n").forEach((line) => {
        const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
        if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    });
    return fm;
}

function scanForSecrets(content, relPath) {
    const findings = [];
    for (const pattern of SECRET_PATTERNS) {
        const matches = content.match(pattern.regex);
        if (matches) {
            // Exclude examples and placeholders
            for (const m of matches) {
                const lower = m.toLowerCase();
                if (
                    lower.includes("your-") ||
                    lower.includes("xxx") ||
                    lower.includes("example") ||
                    lower.includes("placeholder") ||
                    lower.includes("process.env") ||
                    lower.includes("env.") ||
                    lower.includes("${")
                ) continue;

                findings.push({
                    type: "SECRET",
                    severity: "CRITICAL",
                    pattern: pattern.name,
                    match: m.substring(0, 60),
                    file: relPath,
                });
            }
        }
    }
    return findings;
}

function scanForDangerousCommands(content, relPath) {
    const findings = [];
    for (const pattern of DANGEROUS_COMMANDS) {
        const matches = content.match(pattern.regex);
        if (matches) {
            findings.push({
                type: "DANGEROUS_CMD",
                severity: "HIGH",
                pattern: pattern.name,
                count: matches.length,
                file: relPath,
            });
        }
    }
    return findings;
}

function scanForMissingRisk(frontmatter, relPath) {
    const findings = [];
    if (!frontmatter.risk || frontmatter.risk === "unknown") {
        findings.push({
            type: "MISSING_RISK",
            severity: "LOW",
            pattern: `risk: ${frontmatter.risk || "missing"}`,
            file: relPath,
        });
    }
    return findings;
}

function scanForOffensiveWithoutWarning(content, relPath) {
    const findings = [];
    const lowerContent = content.toLowerCase();

    const isOffensive = OFFENSIVE_KEYWORDS.some((kw) =>
        lowerContent.includes(kw)
    );

    if (isOffensive) {
        const hasWarning = AUTH_PHRASES.some((phrase) =>
            lowerContent.includes(phrase)
        );

        if (!hasWarning) {
            findings.push({
                type: "MISSING_AUTH_WARNING",
                severity: "MEDIUM",
                pattern: "Offensive skill without authorization warning",
                file: relPath,
            });
        }
    }
    return findings;
}

function addAuthWarning(content) {
    const lowerContent = content.toLowerCase();
    const isOffensive = OFFENSIVE_KEYWORDS.some((kw) =>
        lowerContent.includes(kw)
    );
    const hasWarning = AUTH_PHRASES.some((phrase) =>
        lowerContent.includes(phrase)
    );

    if (isOffensive && !hasWarning) {
        // Add warning after frontmatter
        const warning = `\n> ⚠️ **AUTHORIZED USE ONLY** — This skill is intended for authorized security professionals only. Use only against systems you own or have explicit written permission to test. Unauthorized use may violate applicable laws.\n`;

        return content.replace(
            /^(---\n[\s\S]*?\n---\n)/,
            `$1${warning}\n`
        );
    }
    return content;
}

// ============================================================================
// Main
// ============================================================================

function main() {
    console.log("\n🔒 Rei Skills — Security Audit");
    console.log("   Rootcastle Engineering & Innovation | Batuhan Ayrıbaş\n");

    const autoFix = process.argv.includes("--fix");

    const files = findSkillFiles(SKILLS_DIR);
    console.log(`Scanning ${files.length} SKILL.md files...\n`);

    const allFindings = [];
    let fixedCount = 0;

    for (const file of files) {
        const relPath = path.relative(SKILLS_DIR, file);
        let content;
        try {
            content = fs.readFileSync(file, "utf8");
        } catch {
            continue;
        }

        const frontmatter = extractFrontmatter(content);

        // Run all scans
        allFindings.push(...scanForSecrets(content, relPath));
        allFindings.push(...scanForDangerousCommands(content, relPath));
        allFindings.push(...scanForMissingRisk(frontmatter, relPath));
        allFindings.push(...scanForOffensiveWithoutWarning(content, relPath));

        // Auto-fix: add authorization warnings to offensive skills
        if (autoFix) {
            const fixed = addAuthWarning(content);
            if (fixed !== content) {
                fs.writeFileSync(file, fixed, "utf8");
                fixedCount++;
            }
        }
    }

    // Group findings by severity
    const critical = allFindings.filter((f) => f.severity === "CRITICAL");
    const high = allFindings.filter((f) => f.severity === "HIGH");
    const medium = allFindings.filter((f) => f.severity === "MEDIUM");
    const low = allFindings.filter((f) => f.severity === "LOW");

    // Report
    if (critical.length > 0) {
        console.log("🚨 CRITICAL FINDINGS:");
        critical.forEach((f) => {
            console.log(`   [${f.type}] ${f.file} — ${f.pattern}: ${f.match || ""}`);
        });
        console.log();
    }

    if (high.length > 0) {
        console.log("⚠️  HIGH FINDINGS:");
        high.forEach((f) => {
            console.log(`   [${f.type}] ${f.file} — ${f.pattern} (×${f.count || 1})`);
        });
        console.log();
    }

    if (medium.length > 0) {
        console.log("🔶 MEDIUM FINDINGS:");
        medium.forEach((f) => {
            console.log(`   [${f.type}] ${f.file} — ${f.pattern}`);
        });
        console.log();
    }

    console.log(`📊 Summary:`);
    console.log(`   🚨 Critical: ${critical.length}`);
    console.log(`   ⚠️  High:     ${high.length}`);
    console.log(`   🔶 Medium:   ${medium.length}`);
    console.log(`   ℹ️  Low:      ${low.length}`);
    console.log(`   📁 Total files scanned: ${files.length}`);
    if (autoFix) {
        console.log(`   🔧 Auto-fixed: ${fixedCount} files`);
    }

    console.log(
        `\n💡 Run with --fix to auto-add authorization warnings to offensive skills.\n`
    );

    // Exit with error if critical findings
    if (critical.length > 0) {
        process.exit(1);
    }
}

main();
