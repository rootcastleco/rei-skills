# Installation and examples

## ChatGPT

Install the exported `skill.zip` through the Skills interface. Once installed, its description can trigger automatically for Rootcastle workflows; the host still decides applicability and enforces mandatory native skill invocation. A repository file or a chat preference cannot unconditionally activate it in other accounts or chats. Do not mistake installed npm package access for installed ChatGPT skill access.

## Coding agents (Codex, Claude Code, Cursor, Gemini CLI)

Add a short high-priority paragraph in the workspace `AGENTS.md` / agent-specific instructions pointing to `skills/rei-ultimate-orchestrator/SKILL.md`, then add the regular REI Skills MCP server where the host supports it:

```json
{"mcpServers":{"rei-skills":{"command":"npx","args":["-y","rei-skills","mcp"]}}}
```

Verify package identity and availability before accepting executable tools. For private projects, never transmit confidential task content to the public Prompt Archive; a sync only fetches its public catalog.

## Manifest of installed native skills

The optional `--native-manifest` file is an array of *real* available native skill descriptors:

```json
[{"name":"rootcastle-embedded-systems","description":"Embedded MCU and RTOS engineering","uri":"skills://rootcastle-embedded-systems"}]
```

Do not fill in the file from guesses. The planner ranks this user-provided manifest; it cannot discover the ChatGPT Skills library from an arbitrary Node subprocess.

## Example tasks

- KiCad review: invoke native embedded/PCB skill when installed; route to relevant REI circuit, sensor, and DRC skills; use a bounded public prompt reference; report ERC/DRC evidence.
- Scientific paper: invoke a native research/writing skill if available; select `rei-paper-orchestra` only if it is actually in the catalog; separate unverified citations from source-grounded findings.
- Software security: native SDLC/audit skill first, then REI testing/security skills, then build a testable plan. Do not run active offensive tests without explicit authorization.
- No accessible REI Skills: run the native skill alone and label REI selection `NOT VERIFIED`.