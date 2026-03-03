# Integration

> A job enters. Verified product exits.

---

## Invocation

Describe the job. Point at an artifact. Or both. Integration always
starts at Receiving.

---

## The Line

```
[RECEIVING] -> [PLOTTING] -> [COMPILATION] -> [VALIDATION]
```

Not every job starts at [PLOTTING]. [RECEIVING] classifies the
material and determines where on the line it enters.

---

## Orchestration

The orchestrator dispatches work. It does not do work.

**Inline** (small, keeps orchestrator context clean):
- [RECEIVING] — classification, inventory
- [PLOTTING] — Assay loop, feedstock enrichment, Fractionation
- [COMPILATION] — Receiving, Routing

**Sub-agents** (clean I/O contracts, no information lost):
- [COMPILATION] stations — build per COMPILE_BRIEF, return COMPILE_RETURN
- [VALIDATION] — orchestrator-dispatched after station return via VALIDATION_BRIEF, return VALIDATION_RETURN

Sub-agents load their own department files and shared tooling.
The orchestrator receives concise results: status + artifact paths.

Only use sub-agents where the interface is clean — clearly defined
inputs and outputs. When the boundary would lose information, keep
the work inline.

### Station -> Validation Flow

The orchestrator manages the station-verification cycle:
1. Dispatch Integration Engineer with COMPILE_BRIEF (INTEG.COMPILE)
2. Receive COMPILE_RETURN
3. Dispatch Inspector with VALIDATION_BRIEF (INTEG.VALIDATE)
4. Receive VALIDATION_RETURN
5. If Validation FAIL: dispatch Integration Engineer with COMPILE_BRIEF (INTEG.REWORK), go to step 2
6. If Validation PASS: return INTEGRATION_RETURN to Captain (Captain handles docking)

### Escalation Protocol (RESOLVE)

When Planning Assay finds gaps outside Integration's scope:

1. **Checkpoint** — write current feedstock + any WOs to
   `jobs/checkpoints/planning-{timestamp}/`
2. **Return ESCALATION** — `STATUS: escalation` in INTEGRATION_RETURN
   with NEED, CONTEXT, ARTIFACTS, and CHECKPOINT fields
3. **Captain handles** — routes to sibling department (typically Intelligence)
4. **Resume** — Captain re-launches Integration with `INTEG.RESUME` +
   enriched artifact pointers. Orchestrator loads checkpoint, Planning
   resumes Assay loop with new data.

The Orchestrator owns the checkpoint/escalation cycle. Planning
operations identify the gap; the Orchestrator executes the protocol.

---

## Production Workspace

```
jobs/
├── inventory.md      [RECEIVING] writes, all departments read
├── feedstock.md      [PLOTTING] operations enrich, Assay reads
├── ip-1.md           [PLOTTING] Fractionation produces
├── ip-2.md           ...
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
| PLOT | Plotting |
| COMPILE | Compilation |
| VALID | Validation |
| INTEG | Department-wide |

### Event Codes

| Dept | Event | Meaning |
|---|---|---|
| RECV | RECEIVED | Job entered Integration |
| RECV | CLASSIFIED | Material type determined |
| RECV | QUARANTINED | Artifacts quarantined from git index |
| RECV | DISPATCHED | Sent to entry department |
| PLOT | OP_START | Operation launched |
| PLOT | OP_COMPLETE | Operation returned findings |
| PLOT | ASSAY_START | Purity check started |
| PLOT | ASSAY_PASS | Feedstock is pure |
| PLOT | ASSAY_FAIL | Impurities remain |
| PLOT | FRAC_START | Fractionation started |
| PLOT | FRAC_COMPLETE | WOs cut |
| COMPILE | WO_START | Integration Plot production started |
| COMPILE | WO_HELD | WO blocked on dependency merge |
| COMPILE | WO_RELEASED | Dependency merged, WO released |
| COMPILE | WO_SKIPPED | WO already shipped, skipping |
| COMPILE | WO_RESUMED | WO resuming from prior state |
| COMPILE | STATION_START | Station branch created, work begun |
| COMPILE | COMMIT | Code committed |
| COMPILE | STATION_DONE | Station deliverables complete |
| COMPILE | REWORK | Sent back from Validation |
| VALID | QC_START | QC gate sequence started |
| VALID | GATE_PASS | Individual gate passed (detail: gate name) |
| VALID | GATE_FAIL | Individual gate failed |
| VALID | VERDICT_PASS | All gates passed |
| VALID | VERDICT_FAIL | Validation report: rework needed |
| INTEG | ESCALATION | Scope gap escalated to Captain (RESOLVE) |
| INTEG | RESUMED | Job resumed from checkpoint |
| INTEG | ESCALATION.TERMINAL | Terminal escalation |
| INTEG | WO_SHIPPED | WO verified (partial return milestone) |
| INTEG | RECOVERY | Corrective action taken |
| INTEG | JOB_DONE | All WOs verified |

### Sub-Agent Event Forwarding

L3 sub-agents (Integration Engineers, Inspectors) operate in isolated context.
The orchestrator logs events on their behalf after receiving returns:

| Return Type | Events to Emit |
|---|---|
| COMPILE_RETURN (complete) | `COMPILE/STATION_DONE` + `COMPILE/COMMIT` per deliverable |
| VALIDATION_RETURN (pass) | `VALID/QC_START` + `VALID/GATE_PASS` per gate + `VALID/VERDICT_PASS` |
| VALIDATION_RETURN (fail) | `VALID/QC_START` + `VALID/GATE_FAIL` per failed gate + `VALID/VERDICT_FAIL` |
| Any (escalation) | `INTEG/ESCALATION` with NEED |

### Captain Event Forwarding (Partial Returns)

For multi-WO jobs, emit a partial `INTEGRATION_RETURN` after each WO
is verified. This gives the Captain per-WO visibility.

After each WO verification pass:
1. Log `INTEG | WO_SHIPPED` with WO ID
2. Return `INTEGRATION_RETURN` with `STATUS: partial`, `WO_COMPLETED: IP-N`,
   `WO_REMAINING: {count}`
3. Continue to next WO (Ship Gate -> Receiving)

Final WO returns `STATUS: complete`, `WO_COMPLETED: IP-N`, `WO_REMAINING: 0`.

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

Integration consumes intelligence products — it does not generate its own.
Only Intelligence produces dossiers. The LAUNCH_BRIEF includes a dossier
artifact pointer. Planning reads the dossier at that path for domain
knowledge, behavioral reference, and gap analysis. Validation uses the dossier
for Gates 3-4 (Browser QA and Network Behavior verification).

---

## Initialization

**Load:** this file only.
Sub-agents load department files and shared tooling as needed.

### Shared Tooling (Project Overlay Paths)

| Tool | File | Used By |
|---|---|---|
| SOPs | `memory/project/conventions.md` | [COMPILATION] stations |
| Quality Manual | `memory/project/failure-class-catalog.md` | [VALIDATION] |
| Coordination Board | `memory/project/coordination.md` | [PLOTTING], [COMPILATION] Receiving |
| Project Context | `memory/project/context.md` | [COMPILATION] stations |
| Dossier | `{pointer from LAUNCH_BRIEF}` | [PLOTTING], [VALIDATION] Gates 3-4 |

Note: `memory/` paths are relative to `~/.claude/projects/{hash}/`.
Full path prefix: `~/.claude/projects/-Users-michaelstuart-dev-hubshot/`.

---

## Departments

| Department | File | Role |
|---|---|---|
| Receiving | `receiving.md` | Receiving |
| Plotting | `plotting.md` | Plotting |
| Compilation | `compilation.md` | Compiling |
| Validation | `validation.md` | Validating |

---

## Feed-Forward

Each department produces output that feeds the next. The orchestrator
manages the flow:

1. Capture the output (status + artifact path)
2. Determine the next department
3. Dispatch (inline or sub-agent) with the output as input

---

## Terminal Escalation (RESOLVE — Terminal Severity)

Department-wide emergency stop. Use when escalation cascade cannot
resolve the problem and a fundamental failure has occurred.

**Trigger when:**
- Escalation cascade exhausted — Captain cannot route to a sibling
- Mainline has changed in a way that invalidates the work
- Repeated failures exceed circuit breakers
- External dependency blocks execution (unresolvable)

**What happens:**
- Work stops immediately
- Current state is preserved (branch, commits intact)
- Problem is escalated via INTEGRATION_RETURN with `STATUS: escalation`
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
| QC rework cycles | 5 | [VALIDATION] -> [COMPILATION] |
| Browser QA retries | 5 | [VALIDATION] |
| Total terminal escalations per job | 8 | Department-wide |
