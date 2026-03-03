# Construction

> All the doing. Receives a Work Order and builds the product.
> Pure production.

---

## Department I/O

**Input:** Work Order (`jobs/wo-{N}.md`)
**Output:** Product (code on Work Order branch)

Log events: see `model-shop.md` Event Codes (CONSTR department).

---

## Branching Model

```
dev
 └─ feature/{ticket}-{name}-wo{N}              (work order branch)
     ├─ feature/{ticket}-{name}-wo{N}-s{M}     (station branch, if multi-station)
     │   squash merge -> work order branch
     └─ ...
         squash merge -> dev
```

Each Work Order produces exactly one branch and one PR. Sequential
WOs are independent branches from `dev`, linked only by the Ship
Gate dependency. Single-station WOs build directly on the WO branch.
Multi-station WOs use parallel station branches off the same WO
branch state.

---

## Operations

### Receiving

**Runs inline** — small, verification only.

**Input:** Work Order
**Output:** Verified Work Order + environment

1. **Completeness check** — scan for impurities. If found, reject
   back to [PLANNING] (terminal escalation).
2. **Coordination diff** — load Coordination Board (`memory/project/coordination.md`).
   Check current team state against Work Order's coordination section.
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
   │   -> Log: CONSTR | WO_SKIPPED | WO-N already shipped
   │   -> Skip this WO entirely
   │
   ├── Branch exists, PR open + conflicting
   │   -> Log: CONSTR | WO_RESUMED | WO-N resuming at Conflict Routing
   │   -> Skip Station Execution
   │   -> Enter Conflict Routing (captain.md Docking Protocol)
   │   -> On resolution: return to Captain for docking
   │
   ├── Branch exists, PR open + clean
   │   -> Log: CONSTR | WO_RESUMED | WO-N resuming — ready for Captain docking
   │   -> Skip Station Execution
   │   -> Return MODEL_SHOP_RETURN with DOCKING_READY: true
   │
   └── Branch exists, no PR
       -> Log: CONSTR | WO_RESUMED | WO-N resuming at Station Execution
       -> Checkout existing branch
       -> Assess work state (uncommitted changes, commit history)
       -> Route to Station Execution with existing state
   ```
5. **DB sync** — run project-specific migration + seed
6. **Dev server** — verify it starts clean

If the Work Order is stale or invalid, it does not enter production.
Terminal escalation -> return to [PLANNING].

### Routing

**Runs inline** — small, decision only.

**Input:** Verified Work Order
**Output:** Station count + scope assignments

Determine how many stations are needed. This is a context window
capacity decision, not an engineering one. Stations within a WO
are independent and run in parallel — if two deliverables depend
on each other, they go in the same station.

- <=10 deliverables -> 1 station
- 10-20 -> 2 stations
- 20+ -> 3 stations max, otherwise return to [PLANNING]

### Station Execution

Each station runs as a sub-agent (BOUNDARY). The orchestrator dispatches
a Station Worker with a STATION_BRIEF, waits for STATION_RETURN, then
dispatches an Inspector with a QC_BRIEF, waits for QC_RETURN.

Station loop defined in `model-shop.md` (Station -> Verification Flow).
The orchestrator manages the cycle.

**Sub-agent I/O contracts:**

Station Worker:
- **Input:** STATION_BRIEF — Work Order (or portion), branch name, station scope
- **Output:** STATION_RETURN — status, branch, last commit, deliverables completed
- **Identity:** Station Worker (`cadre/barracks/identities/station-worker.md`)
  — orchestrator selects from available bunks (currently 2: Mason B-008, Slate B-010).
- **Loads:** `construction.md`, `memory/project/conventions.md`,
  `memory/project/context.md`

Inspector:
- **Input:** QC_BRIEF — branch, WO ID, dossier pointer, failure catalog
- **Output:** QC_RETURN — Gate Report with verdict per gate
- **Identity:** Inspector (`cadre/barracks/identities/inspector.md`)
- **Loads:** `verification.md`, `memory/project/failure-class-catalog.md`,
  `memory/project/conventions.md`

**Single-station:** One Station Worker builds on the WO branch. After
Verification pass, return MODEL_SHOP_RETURN to Captain (Captain handles
docking: Logistics Check, PR Creation, E2E).

**Multi-station:** Parallel Station Workers, each on its own station
branch. Each gets Verification after returning. After all Verification
passes, orchestrator merges station branches to WO branch, then returns
MODEL_SHOP_RETURN to Captain for docking.

**Station constraints:**
- Does NOT produce: artifacts without consumers. Every file
  created must be consumed within the station or by the existing
  codebase. Zero-consumer code is inventory, not foundation.

**Inline validation (run by Station Worker before commit):**
```
pnpm typecheck
pnpm exec oxfmt {modified files}
pnpm knip
```

### Orchestrator Verification

After receiving a QC_RETURN, the orchestrator MUST verify before
accepting the result.

**Verification steps:**
1. **Parse Gate Report** — extract from QC_RETURN. If missing
   -> reject, re-dispatch Inspector.
2. **Completeness check** — all 6 gates must have explicit verdicts.
   Gate 3 (Browser QA) must be PASS or FAIL, never N/A.
3. **Accept or reject** — if all checks pass, proceed to Captain docking.
   If any check fails, do NOT update the log or report success.

**After Verification pass (single-station):**
- Return MODEL_SHOP_RETURN to Captain with DOCKING_READY: true
- Captain handles docking (Logistics, PR, E2E)

**After Verification pass (multi-station):**
- After all stations converge, merge station branches to WO branch
- Return MODEL_SHOP_RETURN to Captain with DOCKING_READY: true

### Ship Gate

The orchestrator MUST verify that WO-N's dependency is MERGED before
dispatching WO-N+1 to Receiving.

**Gate check:**
1. Read WO-N+1's `depends_on` field
2. If not null: verify dependency PR is merged (`gh pr view --json state,mergedAt`)
   and `dev` contains the squash commit
3. If not merged: **HOLD** — do not dispatch. Log `CONSTR | WO_HELD`.
   Return focus to the held WO's pipeline.
4. If merged: proceed. Log `CONSTR | WO_RELEASED`.
5. Hold circuit breaker: 4 hours. Exceeding triggers terminal escalation
   `NEED: EXTERNAL_BLOCK`.

### Checkpoint (LIFECYCLE)

After each station completes (Verification passed), preserve
a stage-boundary checkpoint:

```
jobs/checkpoints/constr-wo{N}-s{M}-{timestamp}/
  diff.patch           # git diff of station work
  gate-report.md       # immutable copy of Gate Report
```

This enables rewind: "rewind to Construction" -> re-run from checkpoint.

### Rework

When Verification fails, the orchestrator dispatches the Station Worker again
with PROD.REWORK instruction and the QC_RETURN attached. The Station
Worker fixes the issues and returns a new STATION_RETURN. The
orchestrator then dispatches Quinn again for re-inspection.

---

## Feed-Forward

Station Worker returns -> Verification -> Verification pass -> Captain docking

Sub-agent returns -> Orchestrator Verification -> Captain docking

Single-station: After Verification pass, return MODEL_SHOP_RETURN to Captain.
Captain creates PR to `dev`, runs E2E, then surfaces for Admiral's HQ intake.
Multi-station: station sub-agents build on station branches,
orchestrator merges to WO branch, returns MODEL_SHOP_RETURN to Captain.

Ship Gate enforces `depends_on` — next WO does not enter Receiving
until current WO is merged.
