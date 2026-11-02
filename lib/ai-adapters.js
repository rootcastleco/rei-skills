const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseFrontmatter } = require('./skill-utils');

/**
 * Registry of all supported AI coding assistants, IDEs, CLI agents, and SDK targets.
 * Each target defines:
 * - id: canonical target identifier
 * - flag: CLI flag (e.g. --cursor, --copilot, --windsurf)
 * - name: human-readable assistant name
 * - format: how skills are materialized ('skill-dir', 'cursor-mdc', 'copilot-instructions', 'windsurf-rule', 'markdown-rule', 'agents-md', 'sdk-json')
 * - defaultWorkspacePath: workspace-relative installation path
 * - defaultGlobalPath: user home installation path (if supported by the client)
 * - indexFile: optional root/workspace router file (e.g. AGENTS.md, CLAUDE.md, .github/copilot-instructions.md)
 * - invocationHint: how to trigger a skill inside that assistant
 */
const AI_TARGETS = {
  antigravity: {
    id: 'antigravity',
    flag: '--antigravity',
    name: 'Google Antigravity IDE',
    ecosystem: 'Google DeepMind',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
    defaultWorkspacePath: '.agent/skills',
    indexFile: 'AGENTS.md',
    invocationHint: 'Use @<skill-id> to ...'
  },
  claude: {
    id: 'claude',
    flag: '--claude',
    name: 'Anthropic Claude Code',
    ecosystem: 'Anthropic',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.claude', 'skills'),
    defaultWorkspacePath: '.claude/skills',
    indexFile: 'CLAUDE.md',
    invocationHint: '/<skill-id> or Use @<skill-id> to ...'
  },
  codex: {
    id: 'codex',
    flag: '--codex',
    name: 'OpenAI Codex CLI & Cloud Agent',
    ecosystem: 'OpenAI',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.codex', 'skills'),
    defaultWorkspacePath: '.codex/skills',
    indexFile: 'AGENTS.md',
    invocationHint: 'Use $<skill-id> or @<skill-id> to ...'
  },
  gemini: {
    id: 'gemini',
    flag: '--gemini',
    name: 'Google Gemini CLI',
    ecosystem: 'Google',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.gemini', 'skills'),
    defaultWorkspacePath: '.gemini/skills',
    indexFile: 'GEMINI.md',
    invocationHint: 'Use @<skill-id> to ...'
  },
  cursor: {
    id: 'cursor',
    flag: '--cursor',
    name: 'Cursor AI IDE (Skills + .mdc Rules)',
    ecosystem: 'Anysphere',
    format: 'cursor-hybrid',
    defaultGlobalPath: path.join(os.homedir(), '.cursor', 'skills'),
    defaultWorkspacePath: '.cursor/skills',
    rulesWorkspacePath: '.cursor/rules',
    indexFile: 'AGENTS.md',
    invocationHint: '@<skill-id> in Cursor Chat / Composer'
  },
  copilot: {
    id: 'copilot',
    flag: '--copilot',
    name: 'GitHub Copilot (VS Code / JetBrains / GitHub.com)',
    ecosystem: 'GitHub / Microsoft',
    format: 'copilot-instructions',
    defaultGlobalPath: path.join(os.homedir(), '.copilot', 'skills'),
    defaultWorkspacePath: '.github/instructions',
    promptsWorkspacePath: '.github/prompts',
    indexFile: '.github/copilot-instructions.md',
    invocationHint: '#<skill-id> or /<skill-id> in GitHub Copilot Chat'
  },
  windsurf: {
    id: 'windsurf',
    flag: '--windsurf',
    name: 'Windsurf IDE (Cascade Rules & Skills)',
    ecosystem: 'Codeium / Windsurf',
    format: 'windsurf-rule',
    defaultGlobalPath: path.join(os.homedir(), '.codeium', 'windsurf', 'skills'),
    defaultWorkspacePath: '.windsurf/rules',
    indexFile: '.windsurfrules',
    invocationHint: '@<skill-id> in Windsurf Cascade'
  },
  cline: {
    id: 'cline',
    flag: '--cline',
    name: 'Cline Autonomous Coding Agent',
    ecosystem: 'Cline',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), 'Documents', 'Cline', 'Rules'),
    defaultWorkspacePath: '.clinerules',
    indexFile: 'AGENTS.md',
    invocationHint: 'Reference @<skill-id>.md in Cline task prompt'
  },
  roocode: {
    id: 'roocode',
    flag: '--roocode',
    name: 'Roo Code (VS Code Autonomous Agent)',
    ecosystem: 'Roo Code',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.roo', 'rules'),
    defaultWorkspacePath: '.roo/rules',
    indexFile: 'AGENTS.md',
    invocationHint: 'Reference @<skill-id> in Roo Code'
  },
  continue: {
    id: 'continue',
    flag: '--continue',
    name: 'Continue.dev (Open-Source IDE Autopilot)',
    ecosystem: 'Continue',
    format: 'continue-rule',
    defaultGlobalPath: path.join(os.homedir(), '.continue', 'rules'),
    defaultWorkspacePath: '.continue/rules',
    indexFile: 'AGENTS.md',
    invocationHint: '@<skill-id> in Continue Chat'
  },
  aider: {
    id: 'aider',
    flag: '--aider',
    name: 'Aider AI Pair Programmer',
    ecosystem: 'Aider',
    format: 'aider-conventions',
    defaultGlobalPath: path.join(os.homedir(), '.aider', 'skills'),
    defaultWorkspacePath: '.aider/skills',
    indexFile: 'CONVENTIONS.md',
    invocationHint: '/read .aider/skills/<skill-id>.md'
  },
  amazonq: {
    id: 'amazonq',
    flag: '--amazonq',
    name: 'Amazon Q Developer',
    ecosystem: 'AWS',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.aws', 'amazonq', 'rules'),
    defaultWorkspacePath: '.amazonq/rules',
    indexFile: 'AGENTS.md',
    invocationHint: '@rules / @<skill-id> in Amazon Q Chat'
  },
  zed: {
    id: 'zed',
    flag: '--zed',
    name: 'Zed AI Editor',
    ecosystem: 'Zed Industries',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.config', 'zed', 'rules'),
    defaultWorkspacePath: '.zed/rules',
    indexFile: '.rules',
    invocationHint: '/file .zed/rules/<skill-id>.md in Zed Assistant'
  },
  goose: {
    id: 'goose',
    flag: '--goose',
    name: 'Block Goose Autonomous Agent',
    ecosystem: 'Block',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.config', 'goose', 'skills'),
    defaultWorkspacePath: '.goose/skills',
    indexFile: '.goosehints',
    invocationHint: 'Use <skill-id> skill in Goose session'
  },
  trae: {
    id: 'trae',
    flag: '--trae',
    name: 'Trae AI IDE',
    ecosystem: 'Trae',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.trae', 'rules'),
    defaultWorkspacePath: '.trae/rules',
    indexFile: 'AGENTS.md',
    invocationHint: '#<skill-id> in Trae Builder/Chat'
  },
  junie: {
    id: 'junie',
    flag: '--junie',
    name: 'JetBrains Junie & AI Assistant',
    ecosystem: 'JetBrains',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.junie', 'skills'),
    defaultWorkspacePath: '.junie/skills',
    indexFile: '.junie/guidelines.md',
    invocationHint: 'Reference .junie/skills/<skill-id>.md in Junie'
  },
  opencode: {
    id: 'opencode',
    flag: '--opencode',
    name: 'OpenCode CLI & Agent',
    ecosystem: 'OpenCode',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.agents', 'skills'),
    defaultWorkspacePath: '.agents/skills',
    indexFile: 'AGENTS.md',
    invocationHint: 'Use @<skill-id> in OpenCode'
  },
  kiro: {
    id: 'kiro',
    flag: '--kiro',
    name: 'Kiro Spec-Driven AI IDE',
    ecosystem: 'AWS / Kiro',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.kiro', 'skills'),
    defaultWorkspacePath: '.kiro/skills',
    indexFile: 'AGENTS.md',
    invocationHint: '#<skill-id> in Kiro'
  },
  amp: {
    id: 'amp',
    flag: '--amp',
    name: 'Sourcegraph Amp Coding Agent',
    ecosystem: 'Sourcegraph',
    format: 'skill-dir',
    defaultGlobalPath: path.join(os.homedir(), '.config', 'amp', 'skills'),
    defaultWorkspacePath: '.agents/skills',
    indexFile: 'AGENTS.md',
    invocationHint: 'Mention @<skill-id> in Amp'
  },
  devin: {
    id: 'devin',
    flag: '--devin',
    name: 'Cognition Devin & Playbooks',
    ecosystem: 'Cognition',
    format: 'markdown-rule',
    defaultGlobalPath: path.join(os.homedir(), '.devin', 'playbooks'),
    defaultWorkspacePath: '.devin/playbooks',
    indexFile: 'AGENTS.md',
    invocationHint: 'Attach playbook <skill-id>.devin.md'
  },
  sdk: {
    id: 'sdk',
    flag: '--sdk',
    name: 'Universal Agent SDK Bundle (OpenAI / Anthropic / Gemini / LangGraph / CrewAI / Ollama JSON)',
    ecosystem: 'Multi-Model SDKs',
    format: 'sdk-json',
    defaultGlobalPath: path.join(os.homedir(), '.rei-skills', 'sdk'),
    defaultWorkspacePath: '.rei-skills/sdk',
    indexFile: 'AGENTS.md',
    invocationHint: 'Load from rei-skills-bundle.json in Python/TypeScript SDK'
  }
};

/**
 * Transpiles a parsed SKILL.md into any target AI format.
 */
function transpileSkillContent(skillId, rawSkillMd, format, extraMeta = {}) {
  const parsed = parseFrontmatter(rawSkillMd);
  const data = parsed.data || {};
  const name = data.name || skillId;
  const description = String(data.description || extraMeta.description || `REI Skill: ${skillId}`).replace(/\r?\n/g, ' ').trim();
  const risk = data.risk || extraMeta.risk || 'safe';
  const source = data.source || extraMeta.source || 'rootcastle-rei';
  const category = extraMeta.category || data.category || 'engineering';
  const body = (parsed.body || rawSkillMd).trim();

  switch (format) {
    case 'strict':
    case 'strict-skill-md':
      return [
        '---',
        `name: ${name}`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        body,
        ''
      ].join('\n');

    case 'cursor-mdc':
      return [
        '---',
        `description: ${JSON.stringify(description)}`,
        'globs: ',
        'alwaysApply: false',
        '---',
        '',
        `<!-- REI Skills | id: ${name} | category: ${category} | risk: ${risk} | source: ${source} -->`,
        '',
        body,
        ''
      ].join('\n');

    case 'copilot-instructions':
      return [
        '---',
        'applyTo: "**"',
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        `<!-- REI Skills | id: ${name} | category: ${category} | risk: ${risk} | source: ${source} -->`,
        '',
        body,
        ''
      ].join('\n');

    case 'copilot-prompt':
      return [
        '---',
        'mode: "agent"',
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        body,
        ''
      ].join('\n');

    case 'windsurf-rule':
      return [
        '---',
        'trigger: model_decision',
        `description: ${JSON.stringify(description)}`,
        'globs: ',
        '---',
        '',
        body,
        ''
      ].join('\n');

    case 'continue-rule':
      return [
        '---',
        `name: ${JSON.stringify(name)}`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        body,
        ''
      ].join('\n');

    case 'markdown-rule':
    case 'aider-conventions':
      return [
        `# REI Skill: ${name}`,
        `> **Description:** ${description}`,
        `> **Category:** \`${category}\` | **Risk Profile:** \`${risk}\` | **Source:** \`${source}\``,
        '',
        body,
        ''
      ].join('\n');

    case 'sdk-json':
    case 'openai-tool':
      return JSON.stringify({
        id: name,
        name,
        description,
        category,
        risk,
        source,
        system_prompt: body,
        openai_function: {
          type: 'function',
          function: {
            name: `activate_skill_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`,
            description: description.slice(0, 1024),
            parameters: {
              type: 'object',
              properties: {
                task_context: {
                  type: 'string',
                  description: 'Specific task or file context to apply this skill to.'
                }
              },
              required: ['task_context']
            }
          }
        },
        anthropic_tool: {
          name: `activate_skill_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          description: description.slice(0, 1024),
          input_schema: {
            type: 'object',
            properties: {
              task_context: {
                type: 'string',
                description: 'Specific task or file context to apply this skill to.'
              }
            },
            required: ['task_context']
          }
        },
        gemini_function_declaration: {
          name: `activate_skill_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          description: description.slice(0, 1024),
          parameters: {
            type: 'OBJECT',
            properties: {
              task_context: {
                type: 'STRING',
                description: 'Specific task or file context to apply this skill to.'
              }
            },
            required: ['task_context']
          }
        }
      }, null, 2);

    case 'extended':
    case 'skill-dir':
    default:
      return rawSkillMd;
  }
}

/**
 * Generates a universal workspace index/router file (AGENTS.md, CLAUDE.md, GEMINI.md, .github/copilot-instructions.md, etc.)
 * listing the installed skills and how any AI assistant can load them on demand.
 */
function generateUniversalRouterMarkdown(skillsList, options = {}) {
  const title = options.title || 'AGENTS.md — REI Skills Universal AI Agent Router';
  const skillBasePath = options.skillBasePath || '.agent/skills';

  const lines = [
    `# ${title}`,
    '',
    '> **Generated by [REI Skills](https://github.com/rootcastleco/rei-skills)** — *The engineering-grade skill layer for AI agents* ([Rootcastle Engineering & Innovation](https://rootcastle.com/)).',
    '>',
    '> This file provides a universal index for **OpenAI Codex**, **Anthropic Claude Code**, **Google Gemini CLI**, **Google Antigravity**, **Cursor**, **GitHub Copilot**, **Windsurf**, **Cline**, **Roo Code**, **Continue.dev**, **Aider**, **Amazon Q**, **Zed AI**, **Block Goose**, **JetBrains Junie**, **OpenCode**, **Sourcegraph Amp**, and **Devin**.',
    '',
    '## How to Use Installed Skills (Progressive Disclosure Protocol)',
    '',
    '1. **Do not load every skill into context at once.** Scan the index below to match the user\'s task against a skill ID or description.',
    '2. **Read on demand:** When a task matches a skill below, read its full instructions file at the listed path before executing the task.',
    '3. **Enforce safety & provenance:** Respect `[EVIDENCE]`, `[INFERENCE]`, and `[UNKNOWN]` provenance boundaries on reverse-engineering tasks (`rei-*` skills) and require explicit user authorization before executing any `offensive` or state-mutating commands.',
    '',
    `## Installed Skills (${skillsList.length})`,
    '',
    '| Skill ID | Category | Risk | Description | Path |',
    '| :--- | :--- | :---: | :--- | :--- |'
  ];

  for (const s of skillsList) {
    const safeDesc = String(s.description || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
    const skillPath = s.installedPath || `${skillBasePath}/${s.id}/SKILL.md`;
    lines.push(`| \`${s.id}\` | \`${s.category || 'general'}\` | \`${s.risk || 'safe'}\` | ${safeDesc} | \`${skillPath}\` |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('*Manage installed skills with `npx rei-skills search <query>`, `npx rei-skills add <skill-or-bundle>`, or `npx rei-skills doctor`.*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Installs a single resolved skill directory into a target directory according to the AI target's native format.
 */
function materializeSkillForTarget(skillId, resolvedSrcDir, destBaseDir, targetSpec, extraMeta = {}) {
  const skillMdPath = path.join(resolvedSrcDir, 'SKILL.md');
  const rawSkillMd = fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, 'utf8') : '';
  const format = targetSpec ? targetSpec.format : 'skill-dir';

  if (format === 'cursor-hybrid') {
    // 1. Copy full skill directory into destBaseDir (<workspace>/.cursor/skills/<id>)
    const skillDest = path.join(destBaseDir, skillId);
    fs.mkdirSync(skillDest, { recursive: true });
    fs.cpSync(resolvedSrcDir, skillDest, { recursive: true, dereference: true });

    // 2. Also emit native Cursor .mdc rule in sibling .cursor/rules/<id>.mdc if inside a .cursor workspace
    const parentDir = path.dirname(destBaseDir);
    if (path.basename(parentDir) === '.cursor' || destBaseDir.endsWith(path.join('.cursor', 'skills'))) {
      const rulesDir = path.join(parentDir, 'rules');
      fs.mkdirSync(rulesDir, { recursive: true });
      const mdcContent = transpileSkillContent(skillId, rawSkillMd, 'cursor-mdc', extraMeta);
      fs.writeFileSync(path.join(rulesDir, `${skillId}.mdc`), mdcContent, 'utf8');
    }
    return { path: skillDest, format: 'cursor-hybrid' };
  }

  if (format === 'copilot-instructions') {
    fs.mkdirSync(destBaseDir, { recursive: true });
    const outFile = path.join(destBaseDir, `${skillId}.instructions.md`);
    const content = transpileSkillContent(skillId, rawSkillMd, 'copilot-instructions', extraMeta);
    fs.writeFileSync(outFile, content, 'utf8');

    // If inside .github/instructions, also emit .github/prompts/<id>.prompt.md
    const parentDir = path.dirname(destBaseDir);
    if (path.basename(parentDir) === '.github') {
      const promptsDir = path.join(parentDir, 'prompts');
      fs.mkdirSync(promptsDir, { recursive: true });
      const promptContent = transpileSkillContent(skillId, rawSkillMd, 'copilot-prompt', extraMeta);
      fs.writeFileSync(path.join(promptsDir, `${skillId}.prompt.md`), promptContent, 'utf8');
    }
    return { path: outFile, format: 'copilot-instructions' };
  }

  if (format === 'windsurf-rule') {
    fs.mkdirSync(destBaseDir, { recursive: true });
    const outFile = path.join(destBaseDir, `${skillId}.md`);
    const content = transpileSkillContent(skillId, rawSkillMd, 'windsurf-rule', extraMeta);
    fs.writeFileSync(outFile, content, 'utf8');
    return { path: outFile, format: 'windsurf-rule' };
  }

  if (format === 'continue-rule') {
    fs.mkdirSync(destBaseDir, { recursive: true });
    const outFile = path.join(destBaseDir, `${skillId}.md`);
    const content = transpileSkillContent(skillId, rawSkillMd, 'continue-rule', extraMeta);
    fs.writeFileSync(outFile, content, 'utf8');
    return { path: outFile, format: 'continue-rule' };
  }

  if (format === 'markdown-rule' || format === 'aider-conventions') {
    fs.mkdirSync(destBaseDir, { recursive: true });
    const ext = targetSpec && targetSpec.id === 'devin' ? '.devin.md' : '.md';
    const outFile = path.join(destBaseDir, `${skillId}${ext}`);
    const content = transpileSkillContent(skillId, rawSkillMd, 'markdown-rule', extraMeta);
    fs.writeFileSync(outFile, content, 'utf8');
    return { path: outFile, format };
  }

  if (format === 'sdk-json') {
    fs.mkdirSync(destBaseDir, { recursive: true });
    const outFile = path.join(destBaseDir, `${skillId}.json`);
    const content = transpileSkillContent(skillId, rawSkillMd, 'sdk-json', extraMeta);
    fs.writeFileSync(outFile, content, 'utf8');
    return { path: outFile, format: 'sdk-json' };
  }

  // Default: 'skill-dir' (copies full directory including scripts, references, resources, agents/openai.yaml)
  const skillDest = path.join(destBaseDir, skillId);
  fs.mkdirSync(skillDest, { recursive: true });
  fs.cpSync(resolvedSrcDir, skillDest, { recursive: true, dereference: true });
  return { path: skillDest, format: 'skill-dir' };
}

module.exports = {
  AI_TARGETS,
  transpileSkillContent,
  generateUniversalRouterMarkdown,
  materializeSkillForTarget
};
