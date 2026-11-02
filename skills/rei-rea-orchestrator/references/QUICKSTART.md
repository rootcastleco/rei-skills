# REI REA primary interface

Install the project package with `python -m pip install -e .` at the repository root. A Skill is not a Python installation and does not register MCP on its own.

- `rei-rea tools doctor`: local PATH discovery; no external programs executed
- `rei-rea investigate TARGET`: bounded end-to-end static investigation with cross-step hash check
- `rei-rea deep TARGET`: PE, ELF, WASM structural analysis
- `rei-rea diff OLD NEW`: structural version diff
- `rei-rea case index WORKSPACE`: build a local metadata-only SQLite index
- `rei-rea case search WORKSPACE`: search existing case snapshot
- `rei-rea inspect /absolute/path/to/file`: SHA-256 + header and bounded container inspection
- `rei-rea plan /absolute/path/to/file`: specialist routing and candidate tools
- `rei-rea case init /absolute/path/to/file --workspace .rei-cases`: local case and hash chain
- `rei-rea case verify /absolute/path/to/case --recheck-target`: verify integrity and identity
- `rei-rea case report /absolute/path/to/case`: reproduce report
- `rei-rea run file /absolute/path/to/file --allow-external`: vetted host parser, explicit consent
- `rei-rea mcp`: stdio MCP with 13 high-level tools
- `rei-rea serve --port 8765`: local tool catalog dashboard at 127.0.0.1

Use absolute paths. Command availability and tool installation are separate. Do not execute a suspicious input on a trusted machine.
