#!/usr/bin/env node

/**
 * 🔒 Rei Skills — Security Audit Script
 * Rootcastle Engineering & Innovation | Batuhan Ayrıbaş
 *
 * Scans all SKILL.md files for:
 * - Hardcoded API keys / secrets patterns (excluding documentation placeholders)
 * - Dangerous shell commands
 * - Missing risk classification
 * - Offensive skills without authorization warnings
 */

const fs = require("fs");
const path = require("path");
const { parseFrontmatter } = require("../lib/skill-utils");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

const SECRET_PATTERNS = [
  { regex: /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/gi, name: "API Key" },
  { regex: /password\s*[:=]\s*['"][^'"\n]{6,}['"]/gi, name: "Password" },
  { regex: /secret\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/gi, name: "Secret" },
  { regex: /token\s*[:=]\s*['"][A-Za-z0-9]{24,}['"]/gi, name: "Token" },
  { regex: /sk-(?:proj-)?[A-Za-z0-9]{24,}/g, name: "OpenAI Key" },
  { regex: /AKIA[0-9A-Z]{16}/g, name: "AWS Access Key" },
  { regex: /ghp_[A-Za-z0-9]{36}/g, name: "GitHub Token" },
  { regex: /glpat-[A-Za-z0-9-]{20}/g, name: "GitLab Token" },
  { regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, name: "Private Key" },
];

const PLACEHOLDER_SUBSTRINGS = [
  "your-",
  "your_",
  "yoursecure",
  "xxx",
  "example",
  "placeholder",
  "process.env",
  "env.",
  "${",
  "<password>",
  "[password]",
  "[input]",
  "\"password\"",
  "'password'",
  "password123",
  "securepass123",
  "supersecret123",
  "super-secret",
  "longpassword",
  "anything",
  "input",
  "changeme",
  "secret123",
  "dummy",
  "testpass",
  "<input",
];

const DANGEROUS_COMMANDS = [
  { regex: /rm\s+-rf\s+\/(?:\s|$)/g, name: "rm -rf / (destructive)" },
  { regex: /curl\s+[^\n]*\|\s*(ba)?sh/g, name: "curl | sh (remote execution)" },
  { regex: /wget\s+[^\n]*\|\s*(ba)?sh/g, name: "wget | sh (remote execution)" },
  { regex: /\bdd\s+if=.*of=\/dev\//g, name: "dd to device (destructive)" },
  { regex: /mkfs\./g, name: "mkfs (filesystem format)" },
  { regex: /:(){ :\|:& };:/g, name: "Fork bomb" },
];

const STRICT_OFFENSIVE_KEYWORDS = [
  "penetration testing",
  "pentest",
  "reverse shell",
  "privilege escalation",
  "sql injection",
  "password cracking",
  "metasploit",
  "burp suite",
  "red team",
  "offensive security",
];

const AUTH_PHRASES = [
  "authorized use only",
  "authorized educational",
  "explicit authorization",
  "written authorization",
  "authorized professional",
  "legal authorization",
  "own systems only",
  "permission to test",
  "authorized security",
];

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

function scanForSecrets(content, relPath) {
  const findings = [];
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const m of matches) {
        const lower = m.toLowerCase();
        if (PLACEHOLDER_SUBSTRINGS.some((sub) => lower.includes(sub))) {
          continue;
        }
        // Ignore repeated character masks like 'aaaaaaaaaaaa' or '1234567890'
        if (/(['"])([a-zA-Z0-9])\2{7,}\1/.test(m)) {
          continue;
        }

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
        severity: "ADVISORY",
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

function scanForOffensiveWithoutWarning(content, frontmatter, relPath) {
  const findings = [];
  const lowerContent = content.toLowerCase();
  const isDeclaredOffensive = frontmatter.risk === "offensive";
  const hasStrictKeyword = STRICT_OFFENSIVE_KEYWORDS.some((kw) =>
    lowerContent.includes(kw),
  );

  if (isDeclaredOffensive || hasStrictKeyword) {
    const hasWarning = AUTH_PHRASES.some((phrase) =>
      lowerContent.includes(phrase),
    );

    if (!hasWarning) {
      findings.push({
        type: "MISSING_AUTH_WARNING",
        severity: "HIGH",
        pattern: "Offensive skill without authorization warning",
        file: relPath,
      });
    }
  }
  return findings;
}

function addAuthWarning(content) {
  const warning = `\n> ⚠️ **AUTHORIZED USE ONLY** — This skill is intended for authorized security professionals only. Use only against systems you own or have explicit written permission to test. Unauthorized use may violate applicable laws.\n`;
  return content.replace(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/, `$1${warning}\n`);
}

function main() {
  console.log("\n🔒 Rei Skills — Security Audit");
  console.log("   Rootcastle Engineering & Innovation | Batuhan Ayrıbaş\n");

  const autoFix = process.argv.includes("--fix");
  const files = findSkillFiles(SKILLS_DIR);
  console.log(`Scanning ${files.length} SKILL.md files...\n`);

  const allFindings = [];
  let fixedCount = 0;

  for (const file of files) {
    const relPath = path.relative(SKILLS_DIR, file).replace(/\\/g, "/");
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const { data: frontmatter } = parseFrontmatter(content);

    const secretFindings = scanForSecrets(content, relPath);
    const cmdFindings = scanForDangerousCommands(content, relPath);
    const riskFindings = scanForMissingRisk(frontmatter, relPath);
    let authFindings = scanForOffensiveWithoutWarning(
      content,
      frontmatter,
      relPath,
    );

    if (autoFix && authFindings.length > 0) {
      const fixed = addAuthWarning(content);
      if (fixed !== content) {
        fs.writeFileSync(file, fixed, "utf8");
        fixedCount++;
        authFindings = [];
      }
    }

    allFindings.push(
      ...secretFindings,
      ...cmdFindings,
      ...riskFindings,
      ...authFindings,
    );
  }

  const critical = allFindings.filter((f) => f.severity === "CRITICAL");
  const high = allFindings.filter((f) => f.severity === "HIGH");
  const advisory = allFindings.filter((f) => f.severity === "ADVISORY");
  const low = allFindings.filter((f) => f.severity === "LOW");

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
      console.log(`   [${f.type}] ${f.file} — ${f.pattern}`);
    });
    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   🚨 Critical (Blocking): ${critical.length}`);
  console.log(`   ⚠️  High (Blocking):     ${high.length}`);
  console.log(`   ℹ️  Advisory Cmds:       ${advisory.length}`);
  console.log(`   ℹ️  Unclassified Risk:   ${low.length}`);
  console.log(`   📁 Total files scanned: ${files.length}`);
  if (autoFix) {
    console.log(`   🔧 Auto-fixed:          ${fixedCount} files`);
  }

  if (critical.length > 0 || high.length > 0) {
    console.error("\n❌ Security audit failed due to blocking findings.");
    process.exit(1);
  }

  console.log("\n✅ Security audit passed with zero blocking findings!\n");
}

main();
