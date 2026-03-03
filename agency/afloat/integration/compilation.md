# Construction

> All the doing. Receives a Integration Plot and builds the product.
> Pure production.

---

## Department I/O

**Input:** Integration Plot (`jobs/ip-{N}.md`)
**Output:** Product (code on Integration Plot branch)

Log events: see `integration.md` Event Codes (COMPILE department).

---

## Branching Model

```
dev
 └─ feature/{ticket}-{name}-ip{N}              (integration plot branch)
     ├─ feature/{ticket}-{name}-ip{N}-s{M}     (station branch, if multi-station)
     │   squash merge -> integration plot branch
     └─ ...
         squash merge -> dev
```

Each Integration Plot produces exactly one branch and one PR. Sequential
IPs are independent branches from `dev`, linked only by the Ship
Gate dependency. Single-station IPs build directly on the IP branch.
Multi-station IPs use parallel station branches off the same IP
branch state.

---

## Operations

### Receiving

**Runs inline** — small, verification only.

**Input:** Integration Plot
**Output:** Verified Integration Plot + environment

1. **Completeness check** — scan for impurities. If found, reject
   back to [PLOTTING] (terminal escalation).
2. **Coordination diff** — load Coordination Board (`memory/project/coordination.md`).
   Check current team state against Integration Plot's coordination section.
   Flag drift.
3. **Ticket diff** — re-query owned tickets via Linear MCP. Flag
   unexpected status changes.
4. **Branch state assessment:**
   ```
   a. Check for existing WO branch: git branch -a | grep {expected pattern}
   b. Check for existing PR: gh pr list --head {branch} --json number,state,mergeable

   Route based on findings:
   ├── No branch exists
   │   -> Create from dev (standard Receiving)
   │   -> Continue to Station Execution
   │
   ├── Branch exists, PR merged
   │   -> Log: COMPILE | WO_SKIPPED | IP-N already shipped
   │   -> Skip this WO entirely
   │
   ├── Branch exists, PR open + conflicting
   │   -> Log: COMPILE | WO_RESUMED | IP-N resuming at Conflict Routing
   │   -> Skip Station Execution
   │   -> Enter Conflict Routing (captain.md Docking Protocol)
   │   -> On resolution: return to Captain for docking
   │
   ├── Branch exists, PR open + clean
   │   -> Log: COMPILE | WO_RESUMED | IP-N resuming — ready for Captain docking
   │   -> Skip Station Execution
   │   -> Return INTEGRATION_RETURN with DOCKING_READY: true
   │
   └── Branch exists, no PR
       -> Log: COMPILE | WO_RESUMED | IP-N resuming at Station Execution
       -> Checkout existing branch
       -> Assess work state (uncommitted changes, commit history)
       -> Route to Station Execution with existing state
   ```
5. **DB sync** — run project-specific migration + seed
6. **Dev server** — verify it starts clean

If the Integration Plot is stale or invalid, it does not enter production.
Terminal escalation -> return to [PLOTTING].

### Routing

**Runs inline** — small, decision only.

**Input:** Verified Integration Plot
**Output:** Station count + scope assignments

Determine how many stations are needed. This is a context window
capacity decision, not an engineering one. Stations within a WO
are independent and run in parallel — if two deliverables depend
on each other, they go in the same station.

- <=10 deliverables -> 1 station
- 10-20 -> 2 stations
- 20+ -> 3 stations max, otherwise return to [PLOTTING]

### Station Execution

Each station runs as a sub-agent (BOUNDARY). The orchestrator dispatches
a Integration Engineer with a COMPILE_BRIEF, waits for COMPILE_RETURN, then
dispatches an Inspector with a VALIDATION_BRIEF, waits for VALIDATION_RETURN.

Station loop defined in `integration.md` (Station -> Validation Flow).
The orchestrator manages the cycle.

**Sub-agent I/O contracts:**

Integration Engineer:
- **Input:** COMPILE_BRIEF — Integration Plot (or portion), branch name, station scope
- **Output:** COMPILE_RETURN — status, branch, last commit, deliverables completed
- **Identity:** Integration Engineer (`afloat/integration/integration-engineer.md`)
  — orchestrator selects from available bunks (currently 2: Atlas B-008, Folio B-010).
- **Loads:** `compilation.md`, `memory/project/conventions.md`,
  `memory/project/context.md`

Inspector:
- **Input:** VALIDATION_BRIEF — branch, WO ID, dossier pointer, failure catalog
- **Output:** VALIDATION_RETURN — Validation Report with verdict per gate
- **Identity:** Inspector (`afloat/integration/inspector.md`)
- **Loads:** `validation.md`, `memory/project/failure-class-catalog.md`,
  `memory/project/conventions.md`

**Single-station:** One Integration Engineer builds on the WO branch. After
Validation pass, return INTEGRATION_RETURN to Captain (Captain handles
docking: Logistics Check, PR Creation, E2E).

**Multi-station:** Parallel Integration Engineers, each on its own station
branch. Each gets Validation after returning. After all Validation
passes, orchestrator merges station branches to WO branch, then returns
INTEGRATION_RETURN to Captain for docking.

**Station constraints:**
- Does NOT produce: artifacts without consumers. Every file
  created must be consumed within the station or by the existing
  codebase. Zero-consumer code is inventory, not foundation.

**Inline validation (run by Integration Engineer before commit):**
```
pnpm typecheck
pnpm exec oxfmt {modified files}
pnpm knip
```

### Orchestrator Validation

After receiving a VALIDATION_RETURN, the orchestrator MUST verify before
accepting the result.

**Validation steps:**
1. **Parse Validation Report** — extract from VALIDATION_RETURN. If missing
   -> reject, re-dispatch Inspector.
2. **Completeness check** — all 6 gates must have explicit verdicts.
   Gate 3 (Browser QA) must be PASS or FAIL, never N/A.
3. **Accept or reject** — if all checks pass, proceed to Captain docking.
   If any check fails, do NOT update the log or report success.

**After Validation pass (single-station):**
- Return INTEGRATION_RETURN to Captain with DOCKING_READY: true
- Captain handles docking (Logistics, PR, E2E)

**After Validation pass (multi-station):**
- After all stations converge, merge station branches to WO branch
- Return INTEGRATION_RETURN to Captain with DOCKING_READY: true

### Ship Gate

The orchestrator MUST verify that IP-N's dependency is MERGED before
dispatching IP-N+1 to Receiving.

**Gate check:**
1. Read IP-N+1's `depends_on` field
2. If not null: verify dependency PR is merged (`gh pr view --json state,mergedAt`)
   and `dev` contains the squash commit
3. If not merged: **HOLD** — do not dispatch. Log `COMPILE | WO_HELD`.
   Return focus to the held WO's pipeline.
4. If merged: proceed. Log `COMPILE | WO_RELEASED`.
5. Hold circuit breaker: 4 hours. Exceeding triggers terminal escalation
   `NEED: EXTERNAL_BLOCK`.

### Checkpoint (LIFECYCLE)

After each station completes (Validation passed), preserve
a stage-boundary checkpoint:

```
jobs/checkpoints/compile-ip{N}-s{M}-{timestamp}/
  diff.patch           # git diff of station work
  validation-report.md       # immutable copy of Validation Report
```

This enables rewind: "rewind to Compilation" -> re-run from checkpoint.

### Rework

When Validation fails, the orchestrator dispatches the Integration Engineer again
with INTEG.REWORK instruction and the VALIDATION_RETURN attached. The Integration Engineer
fixes the issues and returns a new COMPILE_RETURN. The
orchestrator then dispatches Datum again for re-inspection.

---

## Feed-Forward

Integration Engineer returns -> Validation -> Validation pass -> Captain docking

Sub-agent returns -> Orchestrator Validation -> Captain docking

Single-station: After Validation pass, return INTEGRATION_RETURN to Captain.
Captain creates PR to `dev`, runs E2E, then surfaces for Admiral's HQ intake.
Multi-station: station sub-agents build on station branches,
orchestrator merges to IP branch, returns INTEGRATION_RETURN to Captain.

Ship Gate enforces `depends_on` — next IP does not enter Receiving
until current IP is merged.
