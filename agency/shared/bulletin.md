# Bulletin
Moored: Plan of the Day (Naval Operations)

> Standing orders and organizational norms. Active cross-division directives.
> All agents read this bulletin on muster before executing their brief.

---

## Standing Orders

### SO-001: Repo Opacity
The team cannot know the Agency exists. Nothing in the repository reveals
it. PRs and Linear ticket updates are the only team-visible output. All
reporting goes through the Director (human), never automated to team.

### Campaign Rules

Campaign constraints (Critical Rules, QC Gates) are loaded via
conversation context (`MEMORY.md`). All agents inherit them
automatically. They are not repeated here (TRUTH — single source).

---

## Known Constraints

### Context Window Limits
- L3 sub-agents (station workers, field agents) have hard context limits
- WOs with >6 deliverables risk exhausting context before QC runs
- Cut smaller at Planning — 3-6 deliverables per WO is the sweet spot

### CursorBot Timing
- Takes 10-20 minutes per run
- Full loop: 60-90 minutes
- Wait minimum 2 minutes before first poll

### CI Pipeline
- oxfmt formatting (CI enforced)
- knip dead-code detection (CI enforced)
- Conventional commit PR titles (CI enforced)
- API compatibility check (no routes outside reference API)

---

## Organizational Signals

No active signals.

Signals are temporary. Posted by the Director or Admiral during operations.
Cleared by the Admiral on operation close. Default state: no active signals.
