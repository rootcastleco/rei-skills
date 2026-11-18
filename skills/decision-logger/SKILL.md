---
name: "decision-logger"
description: "Use when logging a decision after a board meeting, reviewing past decisions or checking overdue actions. Keeps raw transcripts and approved decisions separately with decision_tracker.py"
risk: "safe"
source: "alirezarezvani/claude-skills@f8593c4941210a621a6629ce1da9e07897976d5f"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/alirezarezvani/claude-skills/blob/f8593c4941210a621a6629ce1da9e07897976d5f/c-level-advisor/skills/decision-logger/SKILL.md

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

# Decision Logger

Two-layer memory system. Layer 1 stores everything. Layer 2 stores only what the founder approved. Future meetings read Layer 2 only — this prevents hallucinated consensus from past debates bleeding into new deliberations.

## Keywords
decision log, memory, approved decisions, action items, board minutes, /decision-logger decisions, /decision-logger review, conflict detection, DO_NOT_RESURFACE

## Quick Start

```bash
python scripts/decision_tracker.py --demo             # See sample output
python scripts/decision_tracker.py --summary          # Overview + overdue
python scripts/decision_tracker.py --overdue          # Past-deadline actions
python scripts/decision_tracker.py --conflicts        # Contradiction detection
python scripts/decision_tracker.py --owner "CTO"      # Filter by owner
python scripts/decision_tracker.py --search "pricing" # Search decisions
```

---

## Commands

| Command | Effect |
|---------|--------|
| `/decision-logger decisions` | Last 10 approved decisions |
| `/decision-logger decisions --all` | Full history |
| `/decision-logger decisions --owner CMO` | Filter by owner |
| `/decision-logger decisions --topic pricing` | Search by keyword |
| `/decision-logger review` | Action items due within 7 days |
| `/decision-logger review --overdue` | Items past deadline |

---

## Two-Layer Architecture

Storage follows the canonical two-layer decision memory (see `../agent-protocol/SKILL.md` → "Decision Memory (Canonical Layout)") — the same layout `/c-level-agents:decide` writes.

### Layer 1 — Raw Transcripts
**Location:** `~/.claude/decisions/raw/YYYY-MM-DD-<slug>.md`
- Full Phase 2 agent contributions, Phase 3 critique, Phase 4 synthesis
- All debates, including rejected arguments
- **NEVER auto-loaded.** Only on explicit founder request.
- Archive after 90 days → `~/.claude/decisions/raw/archive/YYYY/`

### Layer 2 — Approved Decisions
**Location:** `~/.claude/decisions/approved/` — one record per decision (`YYYY-MM-DD-<slug>.md`) plus the append-only index `decisions.md`
- ONLY founder-approved decisions, action items, user corrections
- **Loaded automatically in Phase 1 of every board meeting**
- Append-only. Decisions are never deleted — only superseded.
- Managed by Chief of Staff after Phase 5. Never written by agents directly.

Migration: a legacy `memory/board-meetings/` folder may exist from earlier versions; read it for history but write all new entries to `~/.claude/decisions/`.

---

## Decision Entry Format

```markdown
## [YYYY-MM-DD] — [AGENDA ITEM TITLE]

**Decision:** [One clear statement of what was decided.]
**Owner:** [One person or role — accountable for execution.]
**Deadline:** [YYYY-MM-DD]
**Review:** [YYYY-MM-DD]
**Rationale:** [Why this over alternatives. 1-2 sentences.]

**User Override:** [If founder changed agent recommendation — what and why. Blank if not applicable.]

**Rejected:**
- [Proposal] — [reason] [DO_NOT_RESURFACE]

**Action Items:**
- [ ] [Action] — Owner: [name] — Due: [YYYY-MM-DD] — Review: [YYYY-MM-DD]

**Supersedes:** [DATE of previous decision on same topic, if any]
**Superseded by:** [Filled in retroactively if overridden later]
**Raw transcript:** ~/.claude/decisions/raw/[DATE]-<slug>.md
```

---

## Conflict Detection

Before logging, Chief of Staff checks for:
1. **DO_NOT_RESURFACE violations** — new decision matches a rejected proposal
2. **Topic contradictions** — two active decisions on same topic with different conclusions
3. **Owner conflicts** — same action assigned to different people in different decisions

When a conflict is found:
```
⚠️ DECISION CONFLICT
New: [text]
Conflicts with: [DATE] — [existing text]

Options: (1) Supersede old  (2) Merge  (3) Defer to founder
```

**DO_NOT_RESURFACE enforcement:**
```
🚫 BLOCKED: "[Proposal]" was rejected on [DATE]. Reason: [reason].
To reopen: founder must explicitly say "reopen [topic] from [DATE]".
```

---

## Logging Workflow (Post Phase 5)

1. Founder approves synthesis
2. Write Layer 1 raw transcript → `~/.claude/decisions/raw/YYYY-MM-DD-<slug>.md`
3. Check conflicts against `~/.claude/decisions/approved/decisions.md`
4. Surface conflicts → wait for founder resolution
5. Write the approved record to `~/.claude/decisions/approved/YYYY-MM-DD-<slug>.md` and append to the index `decisions.md`
6. Confirm: decisions logged, actions tracked, DO_NOT_RESURFACE flags added

---

## Marking Actions Complete

```markdown
- [x] [Action] — Owner: [name] — Completed: [DATE] — Result: [one sentence]
```

Never delete completed items. The history is the record.

---

## File Structure

```
~/.claude/decisions/
├── raw/YYYY-MM-DD-<slug>.md        # Layer 1: full transcript per meeting
├── raw/archive/YYYY/               # Raw files after 90 days
├── approved/YYYY-MM-DD-<slug>.md   # Layer 2: one record per approved decision
└── approved/decisions.md           # Layer 2 index: append-only, founder-approved
```

---

## References
- `templates/decision-entry.md` — single entry template with field rules
- `scripts/decision_tracker.py` — CLI parser, overdue tracker, conflict detector
