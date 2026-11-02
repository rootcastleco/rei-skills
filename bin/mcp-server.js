#!/usr/bin/env node

/**
 * 🏰 REI Skills — Smart Skill Management Model Context Protocol (MCP) Server
 * Rootcastle Engineering & Innovation (REI) | https://rootcastle.com
 *
 * Zero-dependency MCP Server (stdio JSON-RPC 2.0) compatible with:
 * Claude Code, Claude Desktop, Cursor, Windsurf, VS Code GitHub Copilot,
 * Cline, Roo Code, Google Antigravity, Gemini CLI, OpenAI Codex, Zed, and Block Goose.
 */

const fs = require("fs");
const path = require("path");
const {
  AI_TARGETS,
  transpileSkillContent,
  materializeSkillForTarget,
  generateUniversalRouterMarkdown,
} = require("../lib/ai-adapters");
const { recommendForTask } = require("../lib/smart-router");
const { resolveSkillSourceDir } = require("./install");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SKILLS_DIR = path.join(ROOT, "skills");

const SERVER_INFO = {
  name: "rei-skills-mcp",
  version: "6.2.0",
};

function loadJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

let cachedData = null;
function getRegistryData() {
  if (!cachedData) {
    cachedData = {
      catalog: loadJson(path.join(DATA_DIR, "catalog.json"), { total: 0, skills: [] }),
      bundles: loadJson(path.join(DATA_DIR, "bundles.json"), { bundles: {} }),
      workflows: loadJson(path.join(DATA_DIR, "workflows.json"), { workflows: [] }),
      reaManifest: loadJson(path.join(DATA_DIR, "rei-rea-manifest.json"), { skills: [] }),
    };
  }
  return cachedData;
}

function readSkillFiles(skillId, subfile = null) {
  const resolvedDir = resolveSkillSourceDir(SKILLS_DIR, skillId);
  if (!resolvedDir || !fs.existsSync(resolvedDir)) {
    return null;
  }
  const skillMdPath = path.join(resolvedDir, "SKILL.md");
  const skillMd = fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, "utf8") : "";

  const availableFiles = [];
  const walk = (dir, base = resolvedDir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, base);
      else availableFiles.push(path.relative(base, full).replace(/\\/g, "/"));
    }
  };
  walk(resolvedDir);

  let requestedSubfileContent = null;
  if (subfile) {
    const safeSub = path.normalize(subfile).replace(/^(\.\.(\/|\\|$))+/, "");
    const targetSub = path.join(resolvedDir, safeSub);
    if (
      targetSub.startsWith(path.resolve(resolvedDir)) &&
      fs.existsSync(targetSub) &&
      fs.statSync(targetSub).isFile()
    ) {
      requestedSubfileContent = fs.readFileSync(targetSub, "utf8");
    }
  }

  return {
    id: skillId,
    resolvedDir,
    skillMd,
    availableFiles,
    requestedSubfileContent,
  };
}

const MCP_TOOLS = [
  {
    name: "rei_recommend_skills",
    description:
      "Smart Intent & Stack Router: Analyzes a natural language engineering task (in English or Turkish) and optional file names/extensions to recommend the highest-scoring skills, multi-skill workflows, role bundles, and an ordered execution plan from the 895-skill REI Skills catalog.",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Natural language description of what the user wants to build, debug, audit, or reverse-engineer.",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of filenames or paths in the active workspace (e.g. ['firmware.bin', 'src/App.tsx', 'Dockerfile']).",
        },
        max_results: {
          type: "number",
          description: "Maximum number of recommended skills to return (default: 5).",
        },
        safe_only: {
          type: "boolean",
          description: "If true, excludes 'offensive' and 'critical' risk skills.",
        },
        include_full_top_skill: {
          type: "boolean",
          description: "If true, automatically includes the full SKILL.md body of the #1 recommended skill so the agent can act immediately.",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "rei_search_skills",
    description:
      "Search the 895 validated REI Skills catalog by keyword, category, risk level (none, safe, critical, offensive), or source provenance.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keywords (e.g. 'reverse engineering', 'nextjs', 'kubernetes', 'ddd').",
        },
        category: {
          type: "string",
          description: "Optional category filter (e.g. 'reverse-engineering', 'security', 'development', 'data-ai', 'infrastructure', 'architecture', 'testing', 'workflow').",
        },
        risk: {
          type: "string",
          description: "Optional risk filter ('none', 'safe', 'critical', 'offensive').",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default: 15).",
        },
      },
    },
  },
  {
    name: "rei_get_skill",
    description:
      "Load the complete SKILL.md operational instructions (and optionally a reference file such as 'references/workflow.md') for a specific skill ID on demand.",
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          description: "Exact skill ID (e.g. 'rei-rea-orchestrator', 'rei-binary-intelligence', 'brainstorming', 'react-best-practices').",
        },
        subfile: {
          type: "string",
          description: "Optional relative file inside the skill directory to read (e.g. 'references/workflow.md').",
        },
      },
      required: ["skill_id"],
    },
  },
  {
    name: "rei_get_workflow",
    description:
      "Retrieve multi-skill orchestration workflows (e.g. 'reverse-engineer-binary-release', 'firmware-iot-security-triage', 'ship-saas-mvp', 'security-audit-web-app', 'build-ai-agent-system', 'qa-browser-automation', 'design-ddd-core-domain').",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: {
          type: "string",
          description: "Optional workflow ID. Omit to list all 7 available workflows.",
        },
      },
    },
  },
  {
    name: "rei_list_bundles",
    description:
      "List all 19 curated role bundles (e.g. 'rei-rea', 'essentials', 'fullstack', 'security-engineer', 'ddd-architecture') or inspect the skills inside a specific bundle.",
    inputSchema: {
      type: "object",
      properties: {
        bundle_id: {
          type: "string",
          description: "Optional bundle ID to inspect in detail.",
        },
      },
    },
  },
  {
    name: "rei_install_skill",
    description:
      "Install a specific skill or curated role bundle into a project workspace directory, automatically transpiled into the native format of any of the 21 supported AI coding assistants (claude, cursor, copilot, windsurf, cline, roocode, codex, gemini, antigravity, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        target_name: {
          type: "string",
          description: "Skill ID or bundle ID to install (e.g. 'rei-rea', 'essentials', 'brainstorming').",
        },
        ai_assistant: {
          type: "string",
          description: "Target AI assistant ID: 'claude', 'codex', 'gemini', 'antigravity', 'cursor', 'copilot', 'windsurf', 'cline', 'roocode', 'continue', 'aider', 'amazonq', 'zed', 'goose', 'trae', 'junie', 'opencode', 'kiro', 'amp', 'devin', or 'sdk'.",
        },
        workspace_path: {
          type: "string",
          description: "Absolute or relative workspace directory path where the AI assistant's skill/rule folder should be created.",
        },
        generate_agents_md: {
          type: "boolean",
          description: "If true, also writes/updates a universal AGENTS.md router file in workspace_path.",
        },
      },
      required: ["target_name", "ai_assistant", "workspace_path"],
    },
  },
  {
    name: "rei_compile_skill",
    description:
      "Transpile a skill on the fly into any AI format ('strict', 'cursor-mdc', 'copilot-instructions', 'copilot-prompt', 'windsurf-rule', 'continue-rule', 'markdown-rule', 'sdk-json') and return the compiled output.",
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          description: "Skill ID to transpile (e.g. 'rei-binary-intelligence').",
        },
        format: {
          type: "string",
          description: "Target format: 'strict', 'cursor-mdc', 'copilot-instructions', 'copilot-prompt', 'windsurf-rule', 'continue-rule', 'markdown-rule', or 'sdk-json'.",
        },
      },
      required: ["skill_id", "format"],
    },
  },
  {
    name: "rei_list_ai_targets",
    description:
      "List all 21 supported AI coding assistants, IDEs, CLI agents, and SDK targets with their CLI flags, native rule/skill formats, and invocation hints.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function executeToolCall(name, args = {}) {
  const { catalog, bundles, workflows } = getRegistryData();

  if (name === "rei_recommend_skills") {
    const rec = recommendForTask(catalog, bundles, workflows, {
      task: args.task || "",
      files: args.files || args.workspace_files || [],
      maxResults: args.max_results || args.top_k || 5,
      safeOnly: Boolean(args.safe_only),
    });

    if (args.include_full_top_skill && rec.recommendedSkills.length > 0) {
      const topId = rec.recommendedSkills[0].id;
      const loaded = readSkillFiles(topId);
      if (loaded) {
        rec.topSkillFullInstructions = {
          id: topId,
          availableFiles: loaded.availableFiles,
          skillMd: loaded.skillMd,
        };
      }
    }
    return rec;
  }

  if (name === "rei_search_skills") {
    const q = String(args.query || "").trim().toLowerCase();
    const cat = args.category ? String(args.category).toLowerCase() : null;
    const risk = args.risk ? String(args.risk).toLowerCase() : null;
    const limit = Number(args.limit || 15);

    let results = catalog.skills || [];
    if (cat) results = results.filter((s) => (s.category || "").toLowerCase() === cat);
    if (risk) results = results.filter((s) => (s.risk || "").toLowerCase() === risk);
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      results = results.filter((s) => {
        const hay = `${s.id} ${s.name} ${s.description} ${(s.tags || []).join(" ")} ${s.category}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    return {
      totalMatches: results.length,
      returned: Math.min(limit, results.length),
      skills: results.slice(0, limit),
    };
  }

  if (name === "rei_get_skill") {
    const skillId = String(args.skill_id || args.id || "").trim();
    const loaded = readSkillFiles(skillId, args.subfile || null);
    if (!loaded) {
      throw new Error(`Skill '${skillId}' not found in catalog.`);
    }
    const meta = (catalog.skills || []).find((s) => s.id === skillId) || {};
    return {
      id: skillId,
      metadata: meta,
      availableFiles: loaded.availableFiles,
      skillMd: loaded.skillMd,
      subfile: args.subfile || null,
      subfileContent: loaded.requestedSubfileContent,
    };
  }

  if (name === "rei_get_workflow") {
    const wfList = workflows.workflows || [];
    if (args.workflow_id) {
      const found = wfList.find((w) => w.id === args.workflow_id);
      if (!found) throw new Error(`Workflow '${args.workflow_id}' not found.`);
      return found;
    }
    return { total: wfList.length, workflows: wfList };
  }

  if (name === "rei_list_bundles") {
    const bMap = bundles.bundles || {};
    if (args.bundle_id) {
      const b = bMap[args.bundle_id];
      if (!b) throw new Error(`Bundle '${args.bundle_id}' not found.`);
      return { id: args.bundle_id, ...b };
    }
    return {
      total: Object.keys(bMap).length,
      bundles: Object.entries(bMap).map(([id, b]) => ({
        id,
        name: b.name || id,
        description: b.description || "",
        skillCount: (b.skills || []).length,
        skills: b.skills || [],
      })),
    };
  }

  if (name === "rei_install_skill") {
    const targetName = String(args.target_name || "").trim();
    const aiId = String(args.ai_assistant || "claude").toLowerCase();
    const spec = AI_TARGETS[aiId];
    if (!spec) {
      throw new Error(`Unsupported ai_assistant '${aiId}'. Valid targets: ${Object.keys(AI_TARGETS).join(", ")}`);
    }
    const workspaceRoot = path.resolve(String(args.workspace_path || process.cwd()));
    const destDir = path.join(workspaceRoot, spec.defaultWorkspacePath);

    const bMap = bundles.bundles || {};
    let skillIds = [];
    if (targetName === "rei-rea") {
      skillIds = (catalog.skills || []).filter((s) => s.id.startsWith("rei-")).map((s) => s.id);
    } else if (bMap[targetName]) {
      skillIds = bMap[targetName].skills || [];
    } else {
      skillIds = [targetName];
    }

    const catalogMap = new Map((catalog.skills || []).map((s) => [s.id, s]));
    const installed = [];
    for (const sid of skillIds) {
      const resolvedSrc = resolveSkillSourceDir(SKILLS_DIR, sid);
      if (!resolvedSrc) continue;
      const res = materializeSkillForTarget(sid, resolvedSrc, destDir, spec, catalogMap.get(sid) || {});
      installed.push({ skillId: sid, path: res.path, format: res.format });
    }

    let routerPath = null;
    if (args.generate_agents_md) {
      const selectedSkills = (catalog.skills || []).filter((s) => skillIds.includes(s.id));
      const md = generateUniversalRouterMarkdown(selectedSkills, {
        title: "AGENTS.md — REI Skills Universal AI Agent Router",
        skillBasePath: spec.defaultWorkspacePath,
      });
      routerPath = path.join(workspaceRoot, "AGENTS.md");
      fs.writeFileSync(routerPath, md, "utf8");
    }

    return {
      status: "installed",
      aiAssistant: spec.name,
      format: spec.format,
      destination: destDir,
      installedCount: installed.length,
      installed,
      agentsMdPath: routerPath,
    };
  }

  if (name === "rei_compile_skill") {
    const skillId = String(args.skill_id || "").trim();
    const format = String(args.format || "strict").toLowerCase();
    const loaded = readSkillFiles(skillId);
    if (!loaded) throw new Error(`Skill '${skillId}' not found.`);
    const meta = (catalog.skills || []).find((s) => s.id === skillId) || {};
    const compiled = transpileSkillContent(skillId, loaded.skillMd, format, meta);
    return {
      skillId,
      format,
      compiledContent: compiled,
    };
  }

  if (name === "rei_list_ai_targets") {
    return {
      total: Object.keys(AI_TARGETS).length,
      targets: Object.values(AI_TARGETS),
    };
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}

function handleJsonRpcRequest(msg) {
  const { id, method, params } = msg;

  // Notifications have no id and expect no response
  if (id === undefined || id === null) {
    return null;
  }

  try {
    if (method === "initialize") {
      const clientProtocol = (params && params.protocolVersion) || "2024-11-05";
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: clientProtocol,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: SERVER_INFO,
        },
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };
    }

    if (method === "tools/call") {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      const output = executeToolCall(toolName, toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
          ],
          isError: false,
        },
      };
    }

    if (method === "resources/list") {
      const { catalog } = getRegistryData();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          resources: [
            {
              uri: "rei://catalog/summary",
              name: "REI Skills Catalog Summary",
              description: `Summary of ${catalog.total || 895} validated skills and categories`,
              mimeType: "application/json",
            },
            {
              uri: "rei://bundles",
              name: "REI Skills Curated Role Bundles",
              description: "19 role-based skill bundles including rei-rea",
              mimeType: "application/json",
            },
            {
              uri: "rei://workflows",
              name: "REI Skills Orchestrated Workflows",
              description: "7 multi-skill execution playbooks",
              mimeType: "application/json",
            },
          ],
        },
      };
    }

    if (method === "resources/templates/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          resourceTemplates: [
            {
              uriTemplate: "rei://skill/{id}",
              name: "Load REI Skill Instructions by ID",
              description: "Reads the full SKILL.md for any of the 895 skills",
              mimeType: "text/markdown",
            },
          ],
        },
      };
    }

    if (method === "resources/read") {
      const uri = (params && params.uri) || "";
      const { catalog, bundles, workflows } = getRegistryData();

      if (uri === "rei://catalog/summary") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(
                  {
                    total: catalog.total,
                    supportedAiTargets: Object.keys(AI_TARGETS).length,
                    categories: catalog.categories || [],
                  },
                  null,
                  2,
                ),
              },
            ],
          },
        };
      }
      if (uri === "rei://bundles") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify(bundles, null, 2) }],
          },
        };
      }
      if (uri === "rei://workflows") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [{ uri, mimeType: "application/json", text: JSON.stringify(workflows, null, 2) }],
          },
        };
      }
      if (uri.startsWith("rei://skill/")) {
        const skillId = uri.replace("rei://skill/", "").trim();
        const loaded = readSkillFiles(skillId);
        if (!loaded) {
          throw new Error(`Skill resource not found: ${uri}`);
        }
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [{ uri, mimeType: "text/markdown", text: loaded.skillMd }],
          },
        };
      }
      throw new Error(`Unknown resource URI: ${uri}`);
    }

    if (method === "prompts/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          prompts: [
            {
              name: "rei-smart-solve",
              description: "Automatically routes a task to the optimal REI Skills and injects their operational playbooks.",
              arguments: [
                { name: "task", description: "Engineering task description", required: true },
                { name: "files", description: "Comma-separated workspace files", required: false },
              ],
            },
            {
              name: "rei-reverse-engineer",
              description: "Activates the REI Reverse Engineering (REA) orchestrator and strict [EVIDENCE]/[INFERENCE]/[UNKNOWN] provenance rules.",
              arguments: [
                { name: "artifact", description: "Target binary, APK, Wasm, or firmware path", required: true },
              ],
            },
          ],
        },
      };
    }

    if (method === "prompts/get") {
      const promptName = params && params.name;
      const pArgs = (params && params.arguments) || {};
      const { catalog, bundles, workflows } = getRegistryData();

      if (promptName === "rei-smart-solve") {
        const rec = recommendForTask(catalog, bundles, workflows, {
          task: pArgs.task || "",
          files: pArgs.files || "",
          maxResults: 2,
        });
        const loadedBlocks = rec.recommendedSkills
          .map((s) => {
            const loaded = readSkillFiles(s.id);
            return loaded ? `### Activated Skill: ${s.id}\n\n${loaded.skillMd}` : "";
          })
          .filter(Boolean)
          .join("\n\n---\n\n");

        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: `Smart-routed skills for: ${pArgs.task || ""}`,
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Execute the following task using the automatically selected REI Skills below:\n\nTask: ${pArgs.task}\n\n${loadedBlocks}`,
                },
              },
            ],
          },
        };
      }

      if (promptName === "rei-reverse-engineer") {
        const orch = readSkillFiles("rei-rea-orchestrator");
        const ledger = readSkillFiles("rei-evidence-ledger");
        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: "REI Reverse Engineering & Provenance-Gated Triage",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Perform static-first reverse engineering triage on artifact: ${pArgs.artifact || "target"}\n\n${orch ? orch.skillMd : ""}\n\n---\n\n${ledger ? ledger.skillMd : ""}`,
                },
              },
            ],
          },
        };
      }

      throw new Error(`Unknown prompt: ${promptName}`);
    }

    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  } catch (err) {
    if (method === "tools/call") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true,
        },
      };
    }
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: err.message,
      },
    };
  }
}

/**
 * Starts the stdio MCP server supporting both newline-delimited JSON-RPC
 * and Content-Length framed JSON-RPC.
 */
function startMcpServer() {
  let buffer = Buffer.alloc(0);
  let useContentLength = false;

  function sendResponse(respObj) {
    if (!respObj) return;
    const json = JSON.stringify(respObj);
    if (useContentLength) {
      const byteLen = Buffer.byteLength(json, "utf8");
      process.stdout.write(`Content-Length: ${byteLen}\r\n\r\n${json}`);
    } else {
      process.stdout.write(`${json}\n`);
    }
  }

  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length > 0) {
      const str = buffer.toString("utf8");

      // Check for LSP Content-Length header
      if (str.startsWith("Content-Length:")) {
        useContentLength = true;
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) return; // wait for more data
        const headerStr = buffer.slice(0, headerEnd).toString("utf8");
        const match = headerStr.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
          buffer = buffer.slice(headerEnd + 4);
          continue;
        }
        const contentLen = parseInt(match[1], 10);
        const totalNeeded = headerEnd + 4 + contentLen;
        if (buffer.length < totalNeeded) return; // wait for full body

        const bodyStr = buffer.slice(headerEnd + 4, totalNeeded).toString("utf8");
        buffer = buffer.slice(totalNeeded);
        try {
          const msg = JSON.parse(bodyStr);
          const resp = handleJsonRpcRequest(msg);
          sendResponse(resp);
        } catch {
          // ignore malformed JSON
        }
      } else {
        // Newline-delimited JSON-RPC (standard MCP stdio transport)
        const newlineIdx = buffer.indexOf("\n");
        if (newlineIdx === -1) return;
        const line = buffer.slice(0, newlineIdx).toString("utf8").trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          const resp = handleJsonRpcRequest(msg);
          sendResponse(resp);
        } catch {
          // ignore non-JSON lines
        }
      }
    }
  });
}

if (require.main === module) {
  startMcpServer();
}

module.exports = {
  MCP_TOOLS,
  executeToolCall,
  handleJsonRpcRequest,
  startMcpServer,
};
