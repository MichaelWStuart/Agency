# Receiving

> Receive & Classify. Every job enters the Integration here.

---

## Department I/O

**Input:** Job (any form — instruction, artifact path, branch state, or combination)
**Output:** Inventory report (`jobs/inventory.md`)

---

## Classification

Determine what the material is and what state it is in.

### Material Types

| Type | What It Is | Enters At |
|---|---|---|
| Crude | Unstructured input — idea, request, raw context | [PLANNING] |
| Feedstock | Partially refined — has structure, contains impurities | [PLANNING] |
| Integration Plot | Fully refined — complete, ready for production | [COMPILATION] |
| Product | Code on a branch — built, not verified | [VERIFICATION] |
| Verified Product | Code that passed Verification — ready for Captain docking | Captain |

### Signals

- **Artifact on disk?** Read it. Structure reveals type.
- **Branch state?** Uncommitted work, existing PRs, CI status.
- **User instruction?** Parse intent against material types.
- **Combination?** Most specific material wins.

### Ambiguity

If the material type is unclear, ask the human. This is not an
escalation — it is classification doing its job.

---

## Incoming Inspection

After classification, before writing the inventory report, inspect
the material for contaminants. Contaminants are embedded production
output that will bias Planning — Planning must discover
the landscape and cut WOs independently, not transcribe a plan
someone already wrote.

**Contaminant types:**

| Contaminant | Example | Action |
|---|---|---|
| WO outlines | "IP-1: CRUD, IP-2: Filters" | Strip. Plotting cuts IPs. |
| Implementation plans | Schema change plans, tRPC procedure specs, code inventory | Strip. Planning discovers the landscape. |
| Prior production artifacts | Superseded WOs, old plans, accumulated structure from previous runs | Strip. Prior runs are not verified feedstock. |
| Scope data | Tickets, features, capabilities, acceptance criteria | Keep. This is the job. |
| Reference paths | ADR paths, scrape report paths, spec paths | Keep. These are inputs. |
| Architectural constraints | "Must use server-side filtering", "State API required" | Keep. These are real constraints, not plans. |

**Procedure:**
1. Read the artifact. Identify each section.
2. For each section: is it scope data, a reference path, a real
   constraint, or production output (plans, structure, implementation)?
3. Strip production output. Record what was stripped in the inventory
   report under **Stripped contaminants** with a one-line summary
   of each (so the human can verify nothing essential was lost).
4. If stripping would lose essential scope data that's entangled
   with plans, ask the human to separate them.

An inventory is scope context — what to build. It is not a production
plan — how to build it or how to cut it. That's Planning's job.

---

## Artifact Quarantine

After Incoming Inspection passes, quarantine planning artifacts.
They live on disk for reference but must never enter a PR. Unstage
them here so downstream departments can't accidentally commit them.

**Procedure:**
```bash
git reset HEAD -- docs/plans/ docs/reference/ docs/decisions/ jobs/
```

Run this once at Receiving. The files stay on disk — Planning
and Construction can read them. But they are excluded from
the git index, so no commit or PR will include them.

**What to quarantine:** anything under `docs/plans/`, `docs/reference/`,
`docs/decisions/`, `jobs/`, or any manifest/spec file referenced in
the artifact index.

**What NOT to quarantine:** source code, tests, config — these are
deliverables, not planning artifacts.

---

## Inventory Report

Write `jobs/inventory.md` with:

1. **Material type** — what it is
2. **Entry department** — where on the line this enters
3. **Summary** — one sentence describing the job
4. **Artifact index** — paths to all input artifacts (manifests,
   branch names, file paths, reference material)
5. **Current state** — branch state, uncommitted work, open PRs
6. **Stripped contaminants** — what was removed during Incoming
   Inspection and why (omit section if nothing was stripped)

This report is the standardized reference for the entire job.
All departments read from it. The orchestrator references it
for dispatch decisions.

Initialize `jobs/log.md` with the header from the Log Protocol
(see SKILL.md). Log events: see `integration.md` Event Codes (RECV department).

Then feed forward to the entry department.
