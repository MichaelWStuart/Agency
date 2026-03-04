# Agency

**Agency** is a constituted runtime for agentic coding: a multi‑agent orchestration system built as a **Claude Code skill**.

It coordinates multiple AI identities across a command hierarchy, routes work through specialized departments, enforces **typed contracts at every boundary crossing**, and surfaces **verified deliverables** (PRs, dossiers, briefings) with an auditable event spine.

Agency is organized as a hydrographic survey expedition (shore command + submarine dive cycles). That metaphor is not branding. It’s the architecture.

---

## Why this exists

Most “agent systems” fail the same way:

- boundaries are advisory (“please follow this format”)
- vocabulary drifts across time and roles
- prose mutates across handoffs
- context accumulates and rots
- humans become the validator and the memory

Agency is an attempt to make agentic coding **stable under recursion and repetition** by treating it like operations: finite vocabulary, typed messages, immutable artifacts, and command discipline.

---

## How it works

Three phases. The dive is the autonomous middle — but significant work happens on shore before and after it.

### The mission (full lifecycle)

```
Director states intent
  │
  ▼
Admiral — shore (plan)
  triage → strategy → collision detection → MISSION_BRIEF
  │
  ▼
Captain — autonomous (dive)
  Intelligence → DOSSIER → Integration → PR + gates
  │
  ▼
Admiral — shore (intake)
  CI gate → review gate → delivery → closeout → BRIEFING
  │
  ▼
Director receives briefing
```

The Admiral never dives. The Director never talks to anyone below Admiral. Shore-side intake (CI, review, merge, ticket updates) is Admiral-owned — the Captain and departments below never touch it.

Two strategies run on the same pipeline:
- **Survey**: chart once, build once.
- **Calibrate**: chart → build → re‑chart → refine until convergence.

### Inside the dive

```
Captain receives brief, submerges
  → Intelligence (survey)  → DOSSIER
    (dossier crosses seam)
  → Integration (build + validate) → PR + gates
  → Captain docks, surfaces with MISSION_RETURN
```

### Inside Intelligence

```
Chief Analyst receives LAUNCH_BRIEF
  → Inline collection (scope, landscape, coordination — no browser)
  → Auth pre-flight
  → Field Agent (browser capture) → raw evidence
  → Desk Analyst (synthesis) → DOSSIER
  → Chart enrichment
  → Promote to warm tier, return
```

### Inside Integration

```
Integration Chief receives dossier pointer
  → Receiving (classify + quarantine artifacts)
  → Plotting (fractionate dossier into work orders)
  → Compilation (per-station: branch → build → commit)
  → Validation (gate sequence: type-check, lint, test, build)
  → Ship or rework loop
  → Return with PR + validation reports
```

---

## What makes it different

### Metaphor is load-bearing
A coherent operational frame (the expedition) gives agents a shared world model at boot. It narrows the space of “reasonable next actions” and reduces drift.

### Boundaries are real
Every identity transition is a sub‑agent boundary: brief in, return out. No context bleed.

### The airlock enforces contracts
`saga-guard` is a Claude Code hook that intercepts dispatch/return traffic and blocks invalid crossings (schema/enum/invariant violations, unknown IDs, invalid artifact pointers).

### Evidence comes from the environment
The reference app is the ground truth. Intelligence produces dossiers from captures; Integration builds and validates against those dossiers.

---

## Repository map

```
agency/          # constitution (markdown source of truth)
saga-guard/      # boundary airlock (validator + ingestion)
spine-audit/     # static auditor (constitution consistency + drift detection)
.data/           # sqlite wrapper + query CLI (gitignored DB)
```

---

## Quickstart (minimal)

1. Install as a Claude Code skill (see `agency/SKILL.md`)
2. Enable `saga-guard` hooks (see `saga-guard/`)
3. Start a mission by speaking only to **Admiral**
4. Review the briefing + artifacts + PR
5. Check status via `node .data/query.js status`

---

## Deeper design

See **README-DESIGN.md**.
