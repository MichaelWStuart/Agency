# Mission Planning

> Admiral's pre-dive preparation protocol. Loaded on-demand when
> the Admiral is composing a MISSION_BRIEF for the Captain.

---

## Pre-Dive Protocol

Before dispatching the Captain, the Admiral prepares the mission:

### 1. Strategy Selection

Determine strategy based on Director intent (see STRATEGY primitive):
- **Survey:** Linear. Intelligence once → Integration once → done.
- **Calibrate:** Iterative. Intelligence sweep → Integration fix →
  Intelligence verify → loop until convergence.

### 2. Collision Detection

**Plotted courses:** Check Linear for in-flight tickets that overlap
with the intended mission scope. If overlap found, present to Director.

**Wake traces:** Check for open PRs that touch the same areas:
```bash
gh pr list --state open --json number,title,headRefName,files --limit 20
```
Flag any PR whose changed files overlap with the mission's expected scope.

### 3. MISSION_BRIEF Composition

Compose per `contracts/payloads.md` MISSION_BRIEF shape:
1. Set strategy (survey or calibrate)
2. Attach all artifact pointers (dossier, scope, landscape, coordination, mission)
3. Set constraints (tickets, branch, scope description)
4. Include project context paths
5. Set return contract: MISSION_RETURN

### 4. Mission Manifest Update

After dispatching, update the mission manifest:
- Set operation status to `active`
- Record dispatch timestamp
- Note strategy and scope

---

## Dispatch

Launch Captain via Agent tool (`subagent_type: general-purpose`) with
the composed MISSION_BRIEF. The Captain is autonomous once dispatched —
the Admiral waits for MISSION_RETURN.
