# P13: Autonomous Resolution — Design Dossier

> Status: Approved design. Ready for implementation.
> Origin: 2026-02-28 session. Director-approved primitive.

---

## The Primitive

**P13: Autonomous Resolution**

Agents loop to accomplish their mission. Three outcomes at every decision point:

1. **Resolve** — within own scope → loop and continue
2. **Escalate** — outside own scope → structured escalation up ONE layer, carrying artifacts
3. **ANDON** — only when escalation reaches Agency and no division can handle it → Director (P4)

This is the general mechanism. P4 (ANDON) becomes the terminal case — when the cascade reaches the top and the Agency itself can't resolve. P13 governs everything before that.

**Principle:** Like a real org chart. You escalate things up that you can't handle. Each layer either handles it or passes it up one more. The escalation cascades up organically, stopping at whatever layer can resolve it.

---

## Siblings

Agents that share a parent are **siblings**. Inline identity transitions (P1) create sibling relationships by definition.

Two kinds of horizontal moves between siblings:

| Move | Mechanism | Context |
|---|---|---|
| Between **inline siblings** | P1 identity transition | Shared — same context window |
| Between **sub-agent siblings** | Escalate to parent → parent routes to sibling | Carried via artifacts + escalation payload |

### Sibling Map

```
Director (human)
  └── Agency (L0)
        ├── Dispatch ──────┐
        ├── Foreign Affairs │ siblings (all children of Agency)
        ├── Intelligence ──┤
        └── Production ────┘
              ├── Loading Dock ──┐
              ├── Refinery       │ siblings (inline, share L1 context)
              ├── Shop Floor     │
              ├── QC             │
              └── Shipping ──────┘
                    └── Station Worker (L2)
                          └── Inspector (inline sibling within L2)
```

- Inline siblings share context naturally (P1 transition within same context window)
- Sub-agent siblings share context through artifact pointers via parent (P2 boundary)
- Horizontal moves between inline siblings need no escalation — context carries over
- Horizontal moves between sub-agent siblings require escalation to parent for routing

---

## Escalation Protocol

### Escalation Payload (new boundary crossing type)

Not ANDON (failure), not RETURN (success). Third type:

```
ESCALATION
──────────
STATUS: escalation
NEED: {instruction_id from catalog}
CONTEXT: {<=25 words — what the agent was doing when it hit the gap}
ARTIFACTS:
  - {path}: {description}
CHECKPOINT: {path | null}
```

### Parent Handling

When a parent receives an escalation:

1. Can I handle it inline? → do it, feed result back
2. Can a sibling handle it? → route to sibling, get result, feed back
3. Can nobody at my level handle it? → escalate up one more layer (wrap artifacts)
4. Reached Director? → ANDON ESCALATION briefing (P4)

### Escalation Stacking

L2 escalation carries L2 artifacts. If L1 can't handle it, L1 wraps L2 artifacts + its own and escalates to L0. By the time it reaches Agency, the full picture is there.

---

## Refinery Example (Canonical Case)

**Refinery hits a scope gap:**

1. Refinery (inline within Production) runs Assay, finds missing scope data
2. Refinery can't resolve — scope collection is outside Production's capability (P11)
3. Production Orchestrator receives this inline (Refinery is an inline sibling). Can any Production department handle it? No — it's intelligence work.
4. Production Orchestrator checkpoints, then returns ESCALATION to Agency: "Need `INTEL.COLLECT.SCOPE`, here are my artifacts, here's my checkpoint"
5. Agency receives escalation. Can a sibling division handle it? Yes — Intelligence.
6. Agency routes to Intelligence with scope request + forwarded artifacts
7. Intelligence returns scope findings
8. Agency re-launches Production with `PROD.RESUME` + enriched artifacts
9. Production resumes from checkpoint, Refinery re-runs Assay with new data
10. Loop continues until Assay passes → Fractionate → WOs

**Station Worker escalation:**

1. Station Worker tries to resolve (loops on rework from QC)
2. After N failures, escalates to Production Orchestrator
3. Orchestrator can route to sibling department? Maybe — re-examine WO, adjust station scope, re-dispatch. Handled without leaving Production.
4. If Orchestrator can't handle → escalates to Agency
5. Agency routes to Intelligence for more context, or if truly stuck → ANDON to Director

---

## Implementation Changes Required

### Primitives (primitives.md)
- Add P13 to Extended Primitives section
- Modify P4 description: ANDON is now the terminal case of the escalation cascade, not the only escalation mechanism

### Contracts (contracts.md)
- Add ESCALATION payload shape (third boundary crossing type alongside RETURN and ANDON)
- Update PRODUCTION_RETURN: add `escalation` as STATUS alongside `shipped | andon`
- Or: ESCALATION is a separate payload type, not a PRODUCTION_RETURN status

### SKILL.md (root)
- Add Sibling concept to The Spine terminology table
- Update routing flow to show escalation handling (Agency as escalation handler between division siblings)
- Update ANDON Cascade section to reference P13 as the general mechanism

### Refinery (divisions/production/refinery.md)
- RESTORE the iterative refining loop (Assay → impurities? → targeted resolution → loop)
- Assay checks feedstock completeness
- Gaps resolvable within Production → Orchestrator handles inline (e.g., re-reading dossier, cross-referencing)
- Gaps needing Intelligence → Orchestrator escalates (STATUS: escalation, NEED: INTEL.COLLECT.*)
- Restore feedstock.md as the enrichment artifact
- Restore log events: OP_START, OP_COMPLETE, ASSAY_START, ASSAY_PASS, ASSAY_FAIL

### Production (divisions/production/production.md)
- Update Orchestration section: Orchestrator handles escalation protocol
- Restore Refinery operations in the inline work list
- Restore feedstock.md in workspace layout

### Roster (barracks/roster.md)
- No new identities needed — Refinery operations that were scout work are now Intelligence collection
- Orchestrator handles the loop inline (Assay + Fractionation were always inline)

### LAYOUT.md
- Update for P13, siblings concept, escalation protocol
- Update Production section to reflect restored Refinery loop

### MEMORY.md
- Add P13 to core principles
- Add sibling concept

---

## Key Design Decisions

1. **Escalation ≠ failure.** It's a routing request. The agent is saying "I need something I can't produce" — not "I broke."

2. **ANDON is terminal.** P4 still exists but only fires when the entire escalation cascade is exhausted. The Director only sees problems no division can handle.

3. **Siblings are structural.** Any agents sharing a parent are siblings. Inline siblings share context (P1). Sub-agent siblings communicate through parent via artifacts.

4. **The loop lives at the right level.** Within Production, the Refinery loop is inline — the Orchestrator sees everything. Between divisions, the loop is at the Agency level — checkpoint, escalate, route, resume.

5. **Context flows with escalation.** Artifacts are carried in the escalation payload. When a parent routes to a sibling, it forwards relevant artifacts. No information is lost.

6. **P7 enables cross-division loops.** Checkpoints preserve state at stage boundaries. When Production escalates and later resumes, it picks up from checkpoint with enriched artifacts. The sub-agent context is gone (P2), but the artifacts aren't.
