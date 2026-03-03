# Calibration Department

> Delta analysis and convergence verification for the calibrate strategy.
> Activated only when strategy = calibrate.
>
> **Executor:** Desk Analyst (B-005, Scribe). This protocol is loaded
> by the Desk Analyst on launch — not executed inline by the Chief Analyst.

---

## Department I/O

**Input:** Delta dossier pointer + branch reference (for convergence)
**Output:** Convergence dossier artifact at `workspace/dossiers/` (hot tier — promoted to warm by Chief Analyst)

---

## When Active

Calibration is activated by the `calibrate` strategy (STRATEGY). The
calibration loop:

```
Intelligence (delta) -> Production (fix) -> Intelligence (convergence) -> loop?
                                                                          |
                                                                     converged -> done
                                                                     remaining -> loop
```

---

## Surface Scoping

Before producing a delta dossier, scope the surfaces to investigate:

1. **Identify affected surfaces** from the mission manifest
2. **Prioritize** by severity of known issues (critical first)
3. **Group** surfaces that share data flows or components
4. **Produce surface inventory** — list of URLs and states to capture

---

## Delta Classification

For each gap found between reference and implementation:

| Field | Description |
|---|---|
| ID | Unique identifier (D-NNN) |
| Surface | Where the gap appears |
| Component | Logical group containing the element |
| Element | Specific element, if applicable |
| Layer | Comparison layer (1=surface, 2=element, 3=state, 4=behavior) |
| Category | missing, type_mismatch, content_mismatch, behavior_mismatch, state_mismatch, cosmetic |
| Severity | critical, major, minor, cosmetic |
| Fix Scope | S (single file), M (2-5 files), L (6+ files) |
| Evidence | Pointers to reference + implementation evidence |
| Expected/Actual | What the reference does vs. what we do |

---

## Convergence Checking

After Production applies fixes, the Chief Analyst orchestrates a
two-step convergence verification:

1. **Step 1 — Re-capture:** Chief Analyst dispatches a Field Agent to
   re-capture implementation evidence for fixed surfaces. Field Agent
   returns fresh evidence artifact pointers.
2. **Step 2 — Synthesis:** Chief Analyst dispatches a Desk Analyst with
   the fresh evidence + prior delta dossier pointer. Desk Analyst
   produces the convergence dossier.

Capture and synthesis never overlap — they are sequential dispatches.

The Desk Analyst's convergence methodology:

1. **Load** prior delta dossier at pointer path
2. **Load** fresh evidence artifacts from Step 1
3. **Compare** against the delta dossier's findings
4. **Classify** each finding:
   - **RESOLVED** — gap eliminated
   - **REMAINING** — gap still present (same or slightly different)
   - **REGRESSED** — new gap introduced by the fix

---

## Operating Parameters

Initial starter values — tuned through operational experience.

| Parameter | Starter Value | Rationale |
|---|---|---|
| Convergence threshold | 100% critical + major RESOLVED | Minor/cosmetic can ship with known gaps |
| Max iterations | 3 | If 3 fix cycles can't resolve critical/major, the problem is architectural |
| Regression tolerance | 0 new critical/major per iteration | Any new critical/major = immediate loop on regressions |
| Diminishing returns | remaining + regressed >= prior iteration | If fixes aren't reducing the gap count, escalate |

---

## Convergence Decision Matrix

Replaces freeform recommendation. Deterministic decision from convergence state:

```
All critical/major RESOLVED, no regressions       -> accept
All critical/major RESOLVED, minor regressions     -> accept_with_known_gaps
Any critical REMAINING after iteration 3           -> escalate (terminal severity, NEED: CIRCUIT_BREAKER)
Any critical REGRESSED                             -> loop_regressions (priority)
Remaining >= prior remaining + regressed           -> escalate (terminal severity, NEED: CIRCUIT_BREAKER)
Otherwise                                          -> loop_targeted
```

The Director always makes the final call. The matrix produces a
recommendation, not a binding decision.

---

## Artifact Output

Calibration produces convergence dossiers per template
(`templates.md`: dossier-convergence-v1). Written to
`workspace/dossiers/{domain}-convergence-{timestamp}.yaml`.

Convergence dossiers reference the delta dossier they verify against,
creating an audit trail of the calibration loop.
