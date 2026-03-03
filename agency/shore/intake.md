# HQ Intake

> Admiral's post-dock protocol. When the Captain surfaces with a
> MISSION_RETURN (DOCKING_READY: true), the Admiral runs HQ intake
> to get the code through CI, review, and delivery.
>
> All gates preserved from prior shipping protocol. All circuit breakers intact.

---

## Gate Ownership

External gates (CI Gate, Review Gate) are **Admiral-owned**.
The Captain (and departments below) do NOT run CI monitoring or review
bot polling. This is a structural boundary — sub-agents that just built
code are at context pressure and will optimize for completion over
thoroughness on long-running external waits.

**Captain scope:** build → verify → Logistics Check → PR Creation → E2E → surface
**Admiral scope:** CI Gate → Review Gate → Delivery → Closeout

---

## Intake Pipeline

```
MISSION_RETURN (DOCKING_READY: true)
  → CI Gate
    → Review Gate
      → Delivery
        → Pre-Return Assertion
          → Closeout
            → BRIEFING to Director
```

---

## Gates

### CI Gate

**Input:** PR targeting `dev`
**Output:** Pass/Fail

All CI checks must pass. On failure: diagnose, re-embark Captain for fix,
Captain re-docks, re-enter CI Gate.
Log `CI_POLLING` heartbeat every ~180s while waiting.
Log `CI_FIX_PUSHED` with fix summary on each fix cycle push.

### Review Gate

**Input:** PR (CI passed)
**Output:** Pass/Fail

Automated review bot (project-specific). Poll for completion,
re-embark Captain for fixes if needed, re-poll.

**Project-specific (CursorBot):**
- Wait 120s before first poll
- Log `REVIEW_POLLING` heartbeat every ~180s while waiting
- Poll every 60s
- On findings: log `REVIEW_FINDING` with count
- Fix findings: re-embark Captain with fix context. Captain fixes, re-docks.
  Log `REVIEW_FIX_PUSHED` after Captain surfaces.
- Evaluate findings for new FC candidates
- All checks must re-pass after fixes
- Log findings to `jobs/log.md`

**CursorBot conclusion handling:**

| Conclusion | Action |
|---|---|
| APPROVED | → REVIEW_PASS |
| COMMENTED + NEUTRAL + 0 findings | → REVIEW_PASS (informational) |
| COMMENTED + NEUTRAL + N>0 findings | → Evaluate: fix if actionable, dismiss + log if false positive |
| CHANGES_REQUESTED | → REVIEW_FINDING: re-embark Captain for fix, re-poll |
| Not completed | → REVIEW_POLLING: continue waiting |

### Mid-Flight Rebase Protocol

An external merge during CI or Review gates can cause conflicts that
go undetected. Mandatory rebase checks prevent this.

**Mandatory rebase check points:**
1. Before every fix push (re-embark Captain with rebase context)
2. After all findings resolved, before declaring REVIEW_PASS
3. Before Delivery

**Procedure:**
1. `git fetch origin dev`
2. Check if `origin/dev` advanced since last rebase
3. If advanced, re-embark Captain to rebase:
   - **Clean:** log `INTAKE | REBASE_CLEAN`, Captain re-runs inline validation + E2E, re-docks
   - **Conflicts:** log `INTAKE | CONFLICT_DETECTED`, Captain enters Conflict Routing.
     On resolution, log `INTAKE | CONFLICT_RESOLVED`, Captain re-docks.

CI must re-run after any rebase. Mid-flight conflict resolutions
count toward the CI fix cycles circuit breaker (5).

### Delivery (Mandatory After Review Gate PASS)

Delivery is **unconditional** after Review Gate PASS. It is not optional,
deferrable, or subject to context-pressure shortcuts. If context pressure
prevents completing Delivery, the Admiral must return
`STATUS: escalation, NEED: CONTEXT_EXHAUSTION` — never a freeform status.

**Input:** PR (all applicable gates passed)
**Output:** Merged code on target branch + ticket updates

**Station delivery:**
1. Squash merge station branch -> Integration Plot branch
2. Delete station branch

**Integration Plot delivery:**
1. Squash merge Integration Plot branch -> `dev`
2. Update Linear tickets by type:
   - **Capability / Task** -> Merged (engineering terminal status)
   - **Feature** -> check promotion (see below)
   - **Core** -> Done (no QA surface)
   - **Bug** -> Ready for QA
   - **No type label** -> Merged (safe default — let QA decide)
3. **Feature promotion check (mandatory after each Capability → Merged):**
   For each Capability moved to Merged, query its parent Feature via
   Linear MCP. List all child Capabilities of that Feature. If ALL
   children are in Merged (or later) status → move Feature to Ready
   for QA. If any child is not yet Merged → no action on Feature.
   ```
   Query: list_issues parentId={feature_id}
   Check: every child issue state type == "completed"
   If yes: save_issue id={feature_id} state="Ready for QA"
   ```
4. Delete Integration Plot branch

### Pre-Return Assertion

Before composing final BRIEFING with delivery complete:
1. Assert `DELIVERY == merged` — verify via `gh pr view` that PR state is MERGED
2. Assert `CLOSEOUT == complete` — all cleanup steps executed
3. If any assertion fails: do NOT report complete. Return `STATUS: escalation`,
   `NEED: CONTEXT_EXHAUSTION` with checkpoint. The contract is explicit —
   complete without merged is a violation. No shortcuts.

### Closeout

**Input:** Completed Integration Plot delivery
**Output:** Cleanup + retrospective

1. Delete all generated screenshot/image files
2. Retrospective — log to `jobs/log.md`
3. Check teammate PRs for conflicts introduced by our merge
4. Clean up processes (dev server, background tasks)

---

## Re-Embark Protocol

When CI or Review gates fail and code changes are needed:

1. Admiral composes new MISSION_BRIEF with fix context:
   - Branch state, PR URL, failure details
   - Specific fix instructions (CI error, review findings)
2. Dispatch Captain for a new dive
3. Captain fixes within Integration, re-verifies, re-docks
4. Captain surfaces with new MISSION_RETURN
5. Admiral re-enters intake pipeline at the appropriate gate

Re-embark cycles count toward circuit breakers.

---

## Circuit Breakers

| Limit | Value | Gate |
|---|---|---|
| CI fix cycles | 5 | CI Gate |
| Review bot timeout | 4 hours | Review Gate |

Review bot fix cycles have no limit. Fix until zero findings.

Exceeding a circuit breaker triggers terminal escalation to Director
with NEED: `CIRCUIT_BREAKER`.
