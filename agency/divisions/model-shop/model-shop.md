# Model Shop

> A job enters. Verified product exits.

---

## Invocation

Describe the job. Point at an artifact. Or both. Model Shop always
starts at Receiving.

---

## The Line

```
[RECEIVING] -> [PLANNING] -> [CONSTRUCTION] -> [VERIFICATION]
```

Not every job starts at [PLANNING]. [RECEIVING] classifies the
material and determines where on the line it enters.

---

## Orchestration

The orchestrator dispatches work. It does not do work.

**Inline** (small, keeps orchestrator context clean):
- [RECEIVING] — classification, inventory
- [PLANNING] — Assay loop, feedstock enrichment, Fractionation
- [CONSTRUCTION] — Receiving, Routing

**Sub-agents** (clean I/O contracts, no information lost):
- [CONSTRUCTION] stations — build per STATION_BRIEF, return STATION_RETURN
- [VERIFICATION] — orchestrator-dispatched after station return via QC_BRIEF, return QC_RETURN

Sub-agents load their own department files and shared tooling.
The orchestrator receives concise results: status + artifact paths.

Only use sub-agents where the interface is clean — clearly defined
inputs and outputs. When the boundary would lose information, keep
the work inline.

### Station -> Verification Flow

The orchestrator manages the station-verification cycle:
1. Dispatch Station Worker with STATION_BRIEF (PROD.BUILD)
2. Receive STATION_RETURN
3. Dispatch Inspector with QC_BRIEF (PROD.QC)
4. Receive QC_RETURN
5. If QC FAIL: dispatch Station Worker with STATION_BRIEF (PROD.REWORK), go to step 2
6. If QC PASS: return MODEL_SHOP_RETURN to Captain (Captain handles docking)

### Escalation Protocol (RESOLVE)

When Planning Assay finds gaps outside Model Shop's scope:

1. **Checkpoint** — write current feedstock + any WOs to
   `jobs/checkpoints/planning-{timestamp}/`
2. **Return ESCALATION** — `STATUS: escalation` in MODEL_SHOP_RETURN
   with NEED, CONTEXT, ARTIFACTS, and CHECKPOINT fields
3. **Captain handles** — routes to sibling division (typically Intelligence)
4. **Resume** — Captain re-launches Model Shop with `PROD.RESUME` +
   enriched artifact pointers. Orchestrator loads checkpoint, Planning
   resumes Assay loop with new data.

The Orchestrator owns the checkpoint/escalation cycle. Planning
operations identify the gap; the Orchestrator executes the protocol.

---

## Production Workspace

```
jobs/
├── inventory.md      [RECEIVING] writes, all departments read
├── feedstock.md      [PLANNING] operations enrich, Assay reads
├── wo-1.md           [PLANNING] Fractionation produces
├── wo-2.md           ...
└── log.md            All departments append
```

All job-specific artifacts live in `jobs/`. Not in the repo.
Cleaned between jobs.

All paths are relative to this skill directory.

---

## Log Protocol

All departments append to `jobs/log.md` using this exact format.

### Format

```markdown
| Time                 | Source   | Event      | Detail                                    |
| -------------------- | -------- | ---------- | ----------------------------------------- |
| 2026-02-27T10:15:00Z | RECV     | RECEIVED   | ROM-424 — Remove contact from company     |
```

**4 columns, pipe-delimited.** Time is ISO-8601 (UTC). Source is a
department code. Event is a standard event code (see table below).
Detail is free text context.

### Department Codes

| Code | Department |
|---|---|
| RECV | Receiving |
| PLAN | Planning |
| CONSTR | Construction |
| VERIF | Verification |
| PROD | Division-wide |

### Event Codes

| Dept | Event | Meaning |
|---|---|---|
| RECV | RECEIVED | Job entered Model Shop |
| RECV | CLASSIFIED | Material type determined |
| RECV | QUARANTINED | Artifacts quarantined from git index |
| RECV | DISPATCHED | Sent to entry department |
| PLAN | OP_START | Operation launched |
| PLAN | OP_COMPLETE | Operation returned findings |
| PLAN | ASSAY_START | Purity check started |
| PLAN | ASSAY_PASS | Feedstock is pure |
| PLAN | ASSAY_FAIL | Impurities remain |
| PLAN | FRAC_START | Fractionation started |
| PLAN | FRAC_COMPLETE | WOs cut |
| CONSTR | WO_START | Work order production started |
| CONSTR | WO_HELD | WO blocked on dependency merge |
| CONSTR | WO_RELEASED | Dependency merged, WO released |
| CONSTR | WO_SKIPPED | WO already shipped, skipping |
| CONSTR | WO_RESUMED | WO resuming from prior state |
| CONSTR | STATION_START | Station branch created, work begun |
| CONSTR | COMMIT | Code committed |
| CONSTR | STATION_DONE | Station deliverables complete |
| CONSTR | REWORK | Sent back from Verification |
| VERIF | QC_START | QC gate sequence started |
| VERIF | GATE_PASS | Individual gate passed (detail: gate name) |
| VERIF | GATE_FAIL | Individual gate failed |
| VERIF | VERDICT_PASS | All gates passed |
| VERIF | VERDICT_FAIL | Gate report: rework needed |
| PROD | ESCALATION | Scope gap escalated to Captain (RESOLVE) |
| PROD | RESUMED | Job resumed from checkpoint |
| PROD | ESCALATION.TERMINAL | Terminal escalation |
| PROD | WO_SHIPPED | WO verified (partial return milestone) |
| PROD | RECOVERY | Corrective action taken |
| PROD | JOB_DONE | All WOs verified |

### Sub-Agent Event Forwarding

L3 sub-agents (Station Workers, Inspectors) operate in isolated context.
The orchestrator logs events on their behalf after receiving returns:

| Return Type | Events to Emit |
|---|---|
| STATION_RETURN (complete) | `CONSTR/STATION_DONE` + `CONSTR/COMMIT` per deliverable |
| QC_RETURN (pass) | `VERIF/QC_START` + `VERIF/GATE_PASS` per gate + `VERIF/VERDICT_PASS` |
| QC_RETURN (fail) | `VERIF/QC_START` + `VERIF/GATE_FAIL` per failed gate + `VERIF/VERDICT_FAIL` |
| Any (escalation) | `PROD/ESCALATION` with NEED |

### Captain Event Forwarding (Partial Returns)

For multi-WO jobs, emit a partial `MODEL_SHOP_RETURN` after each WO
is verified. This gives the Captain per-WO visibility.

After each WO verification pass:
1. Log `PROD | WO_SHIPPED` with WO ID
2. Return `MODEL_SHOP_RETURN` with `STATUS: partial`, `WO_COMPLETED: WO-N`,
   `WO_REMAINING: {count}`
3. Continue to next WO (Ship Gate -> Receiving)

Final WO returns `STATUS: complete`, `WO_COMPLETED: WO-N`, `WO_REMAINING: 0`.

### Log Initialization

When Receiving creates `jobs/log.md`, use this header:

```markdown
# Production Log — {TICKET}

| Time | Source | Event | Detail |
| ---- | ------ | ----- | ------ |
```

### Dashboard

Live dashboard: `bun run ~/.claude/tools/agency-dashboard/server.ts`
Opens at `http://localhost:4242`. Watches `jobs/` for changes via SSE.

---

## Intelligence Input (INTAKE)

Model Shop consumes intelligence products — it does not generate its own.
Only Intelligence produces dossiers. The LAUNCH_BRIEF includes a dossier
artifact pointer. Planning reads the dossier at that path for domain
knowledge, behavioral reference, and gap analysis. Verification uses the dossier
for Gates 3-4 (Browser QA and Network Behavior verification).

---

## Initialization

**Load:** this file only.
Sub-agents load department files and shared tooling as needed.

### Shared Tooling (Project Overlay Paths)

| Tool | File | Used By |
|---|---|---|
| SOPs | `memory/project/conventions.md` | [CONSTRUCTION] stations |
| Quality Manual | `memory/project/failure-class-catalog.md` | [VERIFICATION] |
| Coordination Board | `memory/project/coordination.md` | [PLANNING], [CONSTRUCTION] Receiving |
| Project Context | `memory/project/context.md` | [CONSTRUCTION] stations |
| Dossier | `{pointer from LAUNCH_BRIEF}` | [PLANNING], [VERIFICATION] Gates 3-4 |

Note: `memory/` paths are relative to `~/.claude/projects/{hash}/`.
Full path prefix: `~/.claude/projects/-Users-michaelstuart-dev-hubshot/`.

---

## Departments

| Department | File | Role |
|---|---|---|
| Receiving | `receiving.md` | Receiving |
| Planning | `planning.md` | Thinking |
| Construction | `construction.md` | Building |
| Verification | `verification.md` | Verifying |

---

## Feed-Forward

Each department produces output that feeds the next. The orchestrator
manages the flow:

1. Capture the output (status + artifact path)
2. Determine the next department
3. Dispatch (inline or sub-agent) with the output as input

---

## Terminal Escalation (RESOLVE — Terminal Severity)

Division-wide emergency stop. Use when escalation cascade cannot
resolve the problem and a fundamental failure has occurred.

**Trigger when:**
- Escalation cascade exhausted — Captain cannot route to a sibling
- Mainline has changed in a way that invalidates the work
- Repeated failures exceed circuit breakers
- External dependency blocks execution (unresolvable)

**What happens:**
- Work stops immediately
- Current state is preserved (branch, commits intact)
- Problem is escalated via MODEL_SHOP_RETURN with `STATUS: escalation`
- Failure logged to `jobs/log.md`

### Checkpoint Discipline

Before any terminal escalation, preserve work:
```bash
git reset HEAD -- '*.png' '*.jpg' '*.jpeg' '*.gif' '*.webp' '*.avif'
git add {all modified source files}
git commit -m "WIP: escalation — {failure_mode}"
git push -u origin {branch}
```

Write production state to an artifact file at
`jobs/checkpoints/escalation-{timestamp}.md` (branch, last commit,
push status, department, trigger). Reference this artifact in the
ESCALATION payload's ARTIFACTS list.

### Circuit Breakers

| Limit | Value | Department |
|---|---|---|
| QC rework cycles | 5 | [VERIFICATION] -> [CONSTRUCTION] |
| Browser QA retries | 5 | [VERIFICATION] |
| Total terminal escalations per job | 8 | Division-wide |
