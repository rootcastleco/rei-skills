/**
 * HOL Guard Defense-in-Depth Policy Engine & Security Controls (Phase F).
 *
 * Aligns local MCP execution and registry validation with Rootcastle's upstream
 * HOL Guard contribution contract (`guard.mcp-server-contribution.v1`, PR #7538
 * against `hashgraph-online/hol-guard`) while preserving honest runtime reporting:
 * local policy gates operate independently, and external `@hashgraphonline/hol-guard`
 * integration is reported as installed/active ONLY if actually present at runtime.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");

const SECURITY_EVENT_LIMIT = 256;
const securityAuditEvents = [];

/**
 * Policy tier matrix mirroring `contributions/mcp-servers/mcp.rei-skills.json`
 * (`guard.mcp-server-contribution.v1`: 7+ read/compile tools `inherit`, mutation `review`).
 */
const DEFAULT_TOOL_POLICIES = Object.freeze({
  rei_recommend_skills: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_search_skills: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_get_skill: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_get_workflow: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_list_bundles: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_compile_skill: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_compose_prompt: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_propose_prompt_improvement: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_list_ai_targets: { tier: "inherit", safetyClass: "read_only", extended: false },
  rei_install_skill: { tier: "review", safetyClass: "state_changing", extended: false },
  // Opt-in extended read-only inspection tools (gated behind REI_MCP_EXTENDED_TOOLS=1)
  rei_compile_workflow_plan: { tier: "inherit", safetyClass: "read_only", extended: true },
  rei_evaluate_adapter: { tier: "inherit", safetyClass: "read_only", extended: true },
  rei_security_status: { tier: "inherit", safetyClass: "read_only", extended: true },
});

const INJECTION_RULES = [
  {
    id: "INJ_SYSTEM_OVERRIDE",
    severity: "critical",
    pattern:
      /(?:ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+instructions?|disregard\s+system\s+prompt|override\s+(?:developer|system|policy)|<\s*\|?\s*(?:im_start|system|endoftext)\s*\|?\s*>)/i,
  },
  {
    id: "INJ_PRIVILEGE_ESCALATION",
    severity: "critical",
    pattern:
      /(?:grant\s+tool\s+privileges|bypass\s+(?:hol[-_\s]?guard|security|approval|policy)|enable\s+shell\.execute|install\s+executable\s+hook)/i,
  },
  {
    id: "INJ_EXFIL_DIRECTIVE",
    severity: "high",
    pattern:
      /(?:exfiltrat(?:e|ion)|dump\s+(?:env|environment\s+variables?|credentials?)|send\s+(?:secrets?|tokens?|keys?)\s+to\s+https?:\/\/)/i,
  },
  {
    id: "INJ_HIDDEN_TAG",
    severity: "high",
    pattern: /<\s*(?:IMPORTANT|SYSTEM|TOOL_OVERRIDE|HIDDEN_INSTRUCTION)\b/i,
  },
  {
    id: "INJ_BIDI_CONTROL",
    severity: "medium",
    pattern: /[\u202a-\u202e\u2066-\u2069]/,
  },
];

const DANGEROUS_COMMAND_RULES = [
  {
    id: "CMD_DESTRUCTIVE_FS",
    severity: "critical",
    pattern: /(?:^|[\s;&|])(?:rm\s+-rf\s+(?:\/|~|\*|\.\.)|mkfs(?:\.[a-z0-9]+)?|dd\s+if=\/dev\/)/i,
  },
  {
    id: "CMD_REMOTE_PIPE_EXEC",
    severity: "critical",
    pattern: /(?:curl|wget|Invoke-WebRequest)\s+[^\n|]{4,}\|\s*(?:ba)?sh\b/i,
  },
  {
    id: "CMD_ENCODED_SHELL",
    severity: "high",
    pattern: /\b(?:powershell(?:\.exe)?\s+-(?:e|enc|encodedcommand)|Invoke-Expression|iex\s*\(|bash\s+-c\s+['"][^'"]*base64)/i,
  },
  {
    id: "CMD_HARDWARE_INTERLOCK_BYPASS",
    severity: "critical",
    pattern:
      /\b(?:override_e_stop|disable_safety_interlock|bypass_interlock|flash_unverified_bootloader|shell\.execute)\b/i,
  },
  {
    id: "CMD_FORK_BOMB",
    severity: "critical",
    pattern: /:\(\)\s*\{\s*:\|:&\s*\};:/,
  },
];

const SECRET_PATTERNS = [
  { id: "SEC_AWS_ACCESS_KEY", regex: /\bAKIA[0-9A-Z]{16}\b/g, replacement: "[REDACTED:AWS_KEY]" },
  { id: "SEC_GITHUB_TOKEN", regex: /\b(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED:GITHUB_TOKEN]" },
  { id: "SEC_GITHUB_PAT", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, replacement: "[REDACTED:GITHUB_PAT]" },
  { id: "SEC_NPM_TOKEN", regex: /\bnpm_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED:NPM_TOKEN]" },
  { id: "SEC_OPENAI_OR_API_KEY", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g, replacement: "[REDACTED:API_KEY]" },
  {
    id: "SEC_PRIVATE_KEY_BLOCK",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
    replacement: "[REDACTED:PRIVATE_KEY]",
  },
  {
    id: "SEC_ASSIGNMENT",
    regex: /\b(api[_-]?key|secret|password|passwd|auth[_-]?token|bearer|access[_-]?token)\s*[:=]\s*(['"]?)([A-Za-z0-9_./+=~-]{12,})\2/gi,
    replacement: "$1=[REDACTED:CREDENTIAL]",
  },
];

const SENSITIVE_PATH_FRAGMENTS = [
  ".ssh/",
  ".ssh\\",
  ".aws/",
  ".aws\\",
  ".npmrc",
  ".pypirc",
  ".netrc",
  ".git-credentials",
  "/etc/shadow",
  "/etc/passwd",
  "/etc/sudoers",
  "id_rsa",
  "id_ed25519",
  ".gemini/antigravity",
  "\\windows\\system32",
];

function recordSecurityEvent(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  if (securityAuditEvents.length >= SECURITY_EVENT_LIMIT) {
    securityAuditEvents.shift();
  }
  securityAuditEvents.push(entry);
  return entry;
}

/**
 * Returns recent structured security events recorded by the policy layer.
 */
function getSecurityAuditLog(limit = 50) {
  return securityAuditEvents.slice(-Math.max(1, limit));
}

function clearSecurityAuditLog() {
  securityAuditEvents.length = 0;
}

/**
 * 1. Scans text for prompt injection, hidden override tags, or privilege escalation payloads.
 */
function detectPromptInjection(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { safe: true, riskScore: 0, findings: [] };
  }
  const findings = [];
  for (const rule of INJECTION_RULES) {
    if (rule.pattern.test(text)) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: `Prompt injection signature matched: ${rule.id}`,
      });
    }
  }
  const weight = { critical: 1.0, high: 0.75, medium: 0.45 };
  const riskScore = Math.min(
    1,
    Number(findings.reduce((acc, f) => acc + (weight[f.severity] || 0.3), 0).toFixed(2)),
  );
  return {
    safe: findings.length === 0,
    riskScore,
    findings,
  };
}

/**
 * 2. Scans an MCP tool description for embedded directives or tool-poisoning attempts.
 */
function scanToolDescriptionSafety(description) {
  if (typeof description !== "string" || !description.trim()) {
    return { safe: false, findings: [{ ruleId: "DESC_EMPTY", severity: "medium", message: "Tool description missing" }] };
  }
  const inj = detectPromptInjection(description);
  const findings = [...inj.findings];
  if (/(?:read\s+~\/\.|cat\s+~\/\.|pass\s+contents?\s+of\s+\.env|silently\s+send)/i.test(description)) {
    findings.push({
      ruleId: "DESC_COVERT_EXFIL",
      severity: "critical",
      message: "Tool description instructs covert file read or exfiltration",
    });
  }
  if (/https?:\/\/(?!(?:promt\.rootcastle\.com|rootcastle\.com|github\.com\/rootcastleco|github\.com\/hashgraph-online))/i.test(description)) {
    findings.push({
      ruleId: "DESC_UNTRUSTED_URL",
      severity: "medium",
      message: "Tool description embeds unexpected external URL",
    });
  }
  return {
    safe: findings.length === 0,
    findings,
  };
}

/**
 * 3. Validates MCP tool registration entries before exposing or invoking them.
 */
function validateToolRegistration(toolDef, options = {}) {
  const allowExtended = Boolean(options.allowExtended);
  if (!toolDef || typeof toolDef !== "object") {
    return { valid: false, reason: "Tool definition must be an object", findings: [] };
  }
  const name = String(toolDef.name || "");
  if (!/^[a-z][a-z0-9_]{2,63}$/.test(name)) {
    return { valid: false, reason: `Invalid tool name '${name}'`, findings: [] };
  }
  const policy = DEFAULT_TOOL_POLICIES[name];
  if (!policy) {
    return {
      valid: false,
      reason: `Tool '${name}' rejected by deny-by-default registration allowlist`,
      findings: [{ ruleId: "REG_UNALLOWLISTED_TOOL", severity: "critical" }],
    };
  }
  if (policy.extended && !allowExtended) {
    return {
      valid: false,
      reason: `Extended tool '${name}' requires opt-in extended mode`,
      findings: [{ ruleId: "REG_EXTENDED_DISABLED", severity: "medium" }],
    };
  }
  const descAudit = scanToolDescriptionSafety(toolDef.description || "");
  if (!descAudit.safe) {
    return {
      valid: false,
      reason: `Tool '${name}' description failed safety scan`,
      findings: descAudit.findings,
    };
  }
  if (!toolDef.inputSchema || toolDef.inputSchema.type !== "object") {
    return { valid: false, reason: `Tool '${name}' missing object inputSchema`, findings: [] };
  }
  return { valid: true, policy, findings: [] };
}

/**
 * 4. Validates untrusted external registry/prompt-archive entries.
 */
function validateRegistryEntrySafety(entry) {
  if (!entry || typeof entry !== "object") {
    return { safe: false, reason: "Registry entry must be an object", findings: [] };
  }
  const findings = [];
  for (const field of ["id", "title", "description", "body", "content"]) {
    if (typeof entry[field] === "string") {
      const inj = detectPromptInjection(entry[field]);
      findings.push(...inj.findings);
      if (/<script\b|javascript:/i.test(entry[field])) {
        findings.push({
          ruleId: "REG_ACTIVE_SCRIPT",
          severity: "critical",
          message: `Active script tag/URI in registry field '${field}'`,
        });
      }
    }
  }
  if (entry.contentSha256 && typeof entry.body === "string") {
    const actual = crypto.createHash("sha256").update(entry.body, "utf8").digest("hex");
    if (actual !== entry.contentSha256) {
      findings.push({
        ruleId: "REG_HASH_MISMATCH",
        severity: "critical",
        message: "Registry entry contentSha256 does not match body",
      });
    }
  }
  return {
    safe: findings.length === 0,
    trustLevel: findings.length === 0 ? entry.trustClassification || "untrusted_reference" : "quarantined",
    findings,
  };
}

/**
 * 5. Enforces strict file path boundary checks for workspace/cache/subfile parameters.
 */
function validateFileAccessBoundary(targetPath, options = {}) {
  if (typeof targetPath !== "string" || !targetPath.trim()) {
    return { allowed: false, reason: "Path must be a non-empty string" };
  }
  if (targetPath.includes("\0")) {
    return { allowed: false, reason: "NUL byte rejected in path" };
  }
  const normalizedForward = targetPath.replace(/\\/g, "/").toLowerCase();
  for (const frag of SENSITIVE_PATH_FRAGMENTS) {
    const f = frag.replace(/\\/g, "/");
    if (normalizedForward.includes(f)) {
      return {
        allowed: false,
        reason: `Access to credential or system path matching '${frag}' is denied`,
      };
    }
  }
  if (/(?:^|\/)\.(?:ssh|aws|gnupg)(?:$|\/)/i.test(normalizedForward) || /^\/etc(?:$|\/)/i.test(normalizedForward)) {
    return {
      allowed: false,
      reason: `Access to sensitive directory '${targetPath}' is denied`,
    };
  }
  if (/^~[\\/]|^\$\{?(?:home|userprofile|appdata)/i.test(targetPath) && normalizedForward.includes("ssh")) {
    return { allowed: false, reason: "Home SSH path expansion denied" };
  }

  if (options.relativeOnly) {
    if (path.isAbsolute(targetPath) || /^(\.\.(?:\/|\\|$))/.test(path.normalize(targetPath))) {
      return { allowed: false, reason: "Relative path cannot escape root directory" };
    }
    return { allowed: true, resolved: targetPath };
  }

  const resolved = path.resolve(targetPath);
  if (Array.isArray(options.allowedRoots) && options.allowedRoots.length > 0) {
    const inside = options.allowedRoots.some((root) => {
      const r = path.resolve(root);
      return resolved === r || resolved.startsWith(r + path.sep);
    });
    if (!inside) {
      return {
        allowed: false,
        reason: `Path '${resolved}' falls outside authorized workspace/cache roots`,
      };
    }
  }
  return { allowed: true, resolved };
}

/**
 * 6. Scans strings or nested JSON structures for credentials/secrets and produces redacted copies.
 */
function redactAndScanSecrets(input, depth = 0) {
  if (depth > 8) {
    return { hasSecrets: false, findings: [], redacted: input };
  }
  const findings = [];
  const walk = (val, d) => {
    if (d > 8 || val === null || val === undefined) return val;
    if (typeof val === "string") {
      let out = val;
      for (const spec of SECRET_PATTERNS) {
        spec.regex.lastIndex = 0;
        if (spec.regex.test(out)) {
          findings.push({ ruleId: spec.id, severity: "critical" });
          spec.regex.lastIndex = 0;
          out = out.replace(spec.regex, spec.replacement);
        }
      }
      return out;
    }
    if (Array.isArray(val)) {
      return val.map((item) => walk(item, d + 1));
    }
    if (typeof val === "object") {
      const cloned = {};
      for (const [k, v] of Object.entries(val)) {
        if (/^(?:token|api[_-]?key|secret|password|private[_-]?key)$/i.test(k) && typeof v === "string" && v.length >= 8) {
          findings.push({ ruleId: "SEC_SENSITIVE_KEY", key: k, severity: "critical" });
          cloned[k] = "[REDACTED:SECRET_FIELD]";
        } else {
          cloned[k] = walk(v, d + 1);
        }
      }
      return cloned;
    }
    return val;
  };
  const redacted = walk(input, depth);
  return {
    hasSecrets: findings.length > 0,
    findings,
    redacted,
  };
}

/**
 * 7. Detects dangerous shell or hardware-safety override commands anywhere in arguments.
 */
function detectDangerousMachineCommands(input) {
  const strings = [];
  const collect = (val, d = 0) => {
    if (d > 6 || val === null || val === undefined) return;
    if (typeof val === "string") strings.push(val);
    else if (Array.isArray(val)) val.forEach((x) => collect(x, d + 1));
    else if (typeof val === "object") Object.values(val).forEach((x) => collect(x, d + 1));
  };
  collect(input);
  const findings = [];
  for (const s of strings) {
    for (const rule of DANGEROUS_COMMAND_RULES) {
      if (rule.pattern.test(s)) {
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: `Dangerous command signature matched (${rule.id})`,
        });
      }
    }
  }
  return {
    safe: findings.length === 0,
    findings,
  };
}

/**
 * 8. Sanitizes MCP/tool outputs before returning them across protocol boundaries.
 */
function sanitizeToolOutput(output) {
  const secretScan = redactAndScanSecrets(output);
  const stripAnsi = (val, d = 0) => {
    if (d > 8 || val === null || val === undefined) return val;
    if (typeof val === "string") {
      // Strip ANSI terminal escape sequences that could spoof terminal UI
      // eslint-disable-next-line no-control-regex
      return val.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
    }
    if (Array.isArray(val)) return val.map((x) => stripAnsi(x, d + 1));
    if (typeof val === "object") {
      const next = {};
      for (const [k, v] of Object.entries(val)) next[k] = stripAnsi(v, d + 1);
      return next;
    }
    return val;
  };
  return stripAnsi(secretScan.redacted);
}

/**
 * 9. Verifies local supply-chain manifests for unexpected lifecycle hooks or missing hashes.
 */
function verifySupplyChainManifests(options = {}) {
  const rootDir = path.resolve(options.rootDir || ROOT);
  const checks = [];
  const issues = [];

  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const scripts = pkg.scripts || {};
    const riskyHooks = ["preinstall", "postinstall", "install"].filter((k) => Boolean(scripts[k]));
    checks.push({ artifact: "package.json", version: pkg.version, riskyLifecycleHooks: riskyHooks });
    if (riskyHooks.length > 0) {
      issues.push(`Unexpected npm lifecycle hooks declared: ${riskyHooks.join(", ")}`);
    }
  } else {
    issues.push("Missing package.json manifest");
  }

  const cargoPath = path.join(rootDir, "rust", "rei-hook-gateway", "Cargo.toml");
  if (fs.existsSync(cargoPath)) {
    const cargo = fs.readFileSync(cargoPath, "utf8");
    const hasProcessExec = /\bstd::process::Command\b|\btokio::process\b/.test(cargo);
    checks.push({ artifact: "rust/rei-hook-gateway/Cargo.toml", present: true, hasProcessExec });
  }

  const catalogPath = path.join(rootDir, "data", "catalog.json");
  if (fs.existsSync(catalogPath)) {
    const raw = fs.readFileSync(catalogPath);
    const sha256 = crypto.createHash("sha256").update(raw).digest("hex");
    checks.push({ artifact: "data/catalog.json", bytes: raw.length, sha256 });
  } else {
    issues.push("Missing data/catalog.json");
  }

  return {
    verified: issues.length === 0,
    checks,
    issues,
  };
}

/**
 * 10. Central deny-by-default authorization check for MCP tool invocations.
 */
function authorizeToolInvocation(toolName, args = {}, context = {}) {
  const correlationId = context.correlationId || crypto.randomUUID();
  const allowExtended =
    context.allowExtended !== undefined
      ? Boolean(context.allowExtended)
      : process.env.REI_MCP_EXTENDED_TOOLS === "1";

  const policy = DEFAULT_TOOL_POLICIES[toolName];
  if (!policy) {
    const ev = recordSecurityEvent({
      correlationId,
      toolName,
      decision: "deny",
      ruleId: "POLICY_UNKNOWN_TOOL",
      reason: `Unknown tool '${toolName}' denied by default`,
    });
    return {
      allowed: false,
      decision: "deny",
      policyTier: "deny",
      reason: ev.reason,
      findings: [{ ruleId: ev.ruleId, severity: "critical" }],
      correlationId,
      timestamp: ev.timestamp,
    };
  }

  if (policy.extended && !allowExtended) {
    const ev = recordSecurityEvent({
      correlationId,
      toolName,
      decision: "deny",
      ruleId: "POLICY_EXTENDED_TOOL_DISABLED",
      reason: `Extended tool '${toolName}' requires REI_MCP_EXTENDED_TOOLS=1`,
    });
    return {
      allowed: false,
      decision: "deny",
      policyTier: policy.tier,
      reason: ev.reason,
      findings: [{ ruleId: ev.ruleId, severity: "medium" }],
      correlationId,
      timestamp: ev.timestamp,
    };
  }

  const findings = [];

  // Check dangerous machine commands anywhere in args
  const cmdCheck = detectDangerousMachineCommands(args);
  if (!cmdCheck.safe) {
    findings.push(...cmdCheck.findings);
  }

  // Check secret/credential exfiltration embedded inside args
  const secretCheck = redactAndScanSecrets(args);
  if (secretCheck.hasSecrets) {
    findings.push(...secretCheck.findings);
  }

  // Check prompt injection in free-text fields
  for (const field of ["task", "feedback", "query"]) {
    if (typeof args[field] === "string") {
      const inj = detectPromptInjection(args[field]);
      if (!inj.safe) findings.push(...inj.findings);
    }
  }

  // File access boundary validation
  if (typeof args.workspace_path === "string" && args.workspace_path.trim()) {
    const wb = validateFileAccessBoundary(args.workspace_path, {
      allowedRoots: context.allowedWorkspaceRoots || undefined,
    });
    if (!wb.allowed) {
      findings.push({ ruleId: "PATH_WORKSPACE_VIOLATION", severity: "critical", message: wb.reason });
    }
  }
  if (typeof args.cache_dir === "string" && args.cache_dir.trim()) {
    const cb = validateFileAccessBoundary(args.cache_dir, {
      allowedRoots: context.allowedCacheRoots || [ROOT, os.tmpdir(), path.join(os.homedir(), ".rei-skills")],
    });
    if (!cb.allowed) {
      findings.push({ ruleId: "PATH_CACHE_VIOLATION", severity: "high", message: cb.reason });
    }
  }
  if (typeof args.subfile === "string" && args.subfile.trim()) {
    const sb = validateFileAccessBoundary(args.subfile, { relativeOnly: true });
    if (!sb.allowed) {
      findings.push({ ruleId: "PATH_SUBFILE_TRAVERSAL", severity: "critical", message: sb.reason });
    }
  }
  if (Array.isArray(args.files)) {
    for (const fileEntry of args.files) {
      if (typeof fileEntry === "string" && fileEntry.trim()) {
        const fb = validateFileAccessBoundary(fileEntry);
        if (!fb.allowed) {
          findings.push({ ruleId: "PATH_CONTEXT_FILE_BLOCKED", severity: "high", message: fb.reason });
        }
      }
    }
  }

  if (findings.length > 0) {
    const ev = recordSecurityEvent({
      correlationId,
      toolName,
      decision: "deny",
      ruleId: findings[0].ruleId,
      reason: findings[0].message || `Blocked by HOL Guard policy (${findings[0].ruleId})`,
      findingCount: findings.length,
    });
    return {
      allowed: false,
      decision: "deny",
      policyTier: policy.tier,
      reason: ev.reason,
      findings,
      correlationId,
      timestamp: ev.timestamp,
    };
  }

  // Mutation review gate when strict operator approval is requested for non-dry-run install
  if (
    policy.tier === "review" &&
    context.requireExplicitApprovalForMutation &&
    !args.dry_run &&
    !args.preview_token &&
    !context.operatorApproved
  ) {
    const ev = recordSecurityEvent({
      correlationId,
      toolName,
      decision: "require_approval",
      ruleId: "POLICY_MUTATION_APPROVAL_REQUIRED",
      reason: `Tool '${toolName}' has tier 'review' and requires preview_token or explicit operator approval`,
    });
    return {
      allowed: false,
      decision: "require_approval",
      policyTier: policy.tier,
      reason: ev.reason,
      findings: [{ ruleId: ev.ruleId, severity: "medium", message: ev.reason }],
      correlationId,
      timestamp: ev.timestamp,
    };
  }

  const ev = recordSecurityEvent({
    correlationId,
    toolName,
    decision: "allow",
    policyTier: policy.tier,
    safetyClass: policy.safetyClass,
  });

  return {
    allowed: true,
    decision: "allow",
    policyTier: policy.tier,
    safetyClass: policy.safetyClass,
    reason: null,
    findings: [],
    correlationId,
    timestamp: ev.timestamp,
  };
}

/**
 * Reports the real, unexaggerated HOL Guard runtime integration state.
 */
function getHolGuardIntegrationStatus() {
  let externalPackageInstalled = false;
  try {
    require.resolve("@hashgraphonline/hol-guard", { paths: [ROOT] });
    externalPackageInstalled = true;
  } catch {
    externalPackageInstalled = false;
  }

  return {
    schema: "rei.security-status.v1",
    upstreamContract: {
      repository: "https://github.com/hashgraph-online/hol-guard",
      contributionPr: 7538,
      contractSchema: "guard.mcp-server-contribution.v1",
      contributionPath: "contributions/mcp-servers/mcp.rei-skills.json",
      activation: "opt-in",
      trustClass: "external",
    },
    localEnforcement: {
      active: true,
      module: "lib/hol-guard-policy.js",
      mode: "deny_by_default",
      toolPolicyCount: Object.keys(DEFAULT_TOOL_POLICIES).length,
      recordedEventsCount: securityAuditEvents.length,
    },
    externalRuntime: {
      packageName: "@hashgraphonline/hol-guard",
      installed: externalPackageInstalled,
      configured: Boolean(process.env.HOL_GUARD_POLICY_PATH || externalPackageInstalled),
      honestDisclosure: externalPackageInstalled
        ? "External @hashgraphonline/hol-guard package detected locally."
        : "External @hashgraphonline/hol-guard runtime is NOT installed in this repository; local defense-in-depth enforcement runs via lib/hol-guard-policy.js.",
    },
  };
}

module.exports = {
  DEFAULT_TOOL_POLICIES,
  validateToolRegistration,
  authorizeToolInvocation,
  detectPromptInjection,
  scanToolDescriptionSafety,
  validateRegistryEntrySafety,
  validateFileAccessBoundary,
  redactAndScanSecrets,
  detectDangerousMachineCommands,
  sanitizeToolOutput,
  verifySupplyChainManifests,
  getHolGuardIntegrationStatus,
  getSecurityAuditLog,
  clearSecurityAuditLog,
};
