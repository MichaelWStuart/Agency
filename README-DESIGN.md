# Agency — Design Notes

Agency is a constituted runtime for agentic coding: a multi-agent orchestration system built as a Claude Code skill.

This document is the “why and how.” For a short intro, see `README.md`.

---

## What Agency is

Agency coordinates multiple AI identities across a command hierarchy, routes work through specialized departments, enforces typed contracts at every boundary crossing, and compiles results into verified deliverables (PRs, dossiers, briefings) with an auditable event spine.

Agency is organized as a **hydrographic survey expedition** (shore command + submarine dive cycles). The metaphor is not naming convention. It is a control surface: a shared world-model that constrains cognition, responsibilities, and transitions.

---

## The core idea: the metaphor is load-bearing

When an agent boots into a coherent operational frame (“you are the Captain; you surface with results”), it tends to reason along the paths that frame implies:

- roles become crisp
- boundaries become natural
- escalation becomes routing (not improvisation)
- closure becomes obligatory (after-action report)

A coherent metaphor functions like a constraint field. An incoherent metaphor produces resistance: agents must hold competing mental models simultaneously, and drift becomes visible.

---

## The expedition model

### Chain of command

- **Director**: the human. States intent. Approves actions. Talks only to Admiral.
- **Admiral (shore, L0)**: plans missions, dispatches the submarine, runs intake, briefs the Director. Never dives.
- **Captain (afloat, L1)**: autonomous once dispatched. Runs the dive, routes work, docks and surfaces with results.
- **Departments (L2+)**:
  - **Intelligence**: surveys the reference app; produces dossiers.
  - **Integration**: turns dossiers into shippable code; validates against evidence.

### One dive

```
Director states intent
  Admiral triages + selects strategy + composes MISSION_BRIEF
    Captain receives brief, submerges
      Intelligence surveys → DOSSIER
      (dossier crosses seam)
      Integration builds + validates → PR + gates
      Captain docks + surfaces with MISSION_RETURN
    Admiral runs HQ intake → BRIEFING to Director
```

Two strategies share the same pipeline:
- **Survey**: linear (chart then build).
- **Calibrate**: iterative (chart → build → verify → loop until converged).

---

## The “portal” seam

Surveying and building are different cognitive modes.

- Intelligence vocabulary: terrain, evidence, observations, dossiers, charts.
- Integration vocabulary: work orders, gates, validation, delivery.

Agency treats the seam between frames as real. Dossiers cross intact, but their interpretation changes. The seam should be declared and governed (a “portal” / transform), not left implicit as drift.

---

## The physics (primitives)

Agency is constrained by primitives—rules treated as physics, not preferences.

### Locked primitives (examples)

- **BOUNDARY** — identity transitions are sub-agent boundaries: brief in / return out. No context bleed.
- **CONTRACT** — every boundary crossing uses defined payload shapes; no ad-hoc prose.
- **CLOSURE** — every operation ends with a briefing (even aborts).
- **SELECTION** — agents select from finite catalogs; meaning crosses boundaries via IDs + typed fields + artifact pointers.
- **LIFECYCLE** — artifacts are immutable once produced; they are superseded, not edited.
- **ALLOWLIST** — scopes are allowlists (lookup-enforceable), not denylists (interpretation-required).

Governable primitives include EPHEMERAL, TRUTH, STRATEGY, RESOLVE, MOORING, etc.

---

## Mooring and tethering

### Mooring
A load-bearing concept must be **moored** to an external referent (doctrine, standard practice, proven method). Mooring constrains meaning and behavior by importing known structure and known failure modes.

### Tethering
Tethering describes how well a concept fits within the expedition narrative without footnotes. Loose tethering is resistance and a drift risk.

---

## Boundary enforcement: `saga-guard` (the airlock)

Agency does not “trust prompts.”

`saga-guard` is a Claude Code hook that intercepts sub-agent dispatches and returns and validates them against the constitution (markdown contracts):

**Hard checks (block the tool call)**
- payload shape (required fields/types)
- enum membership
- cross-field invariants (e.g., `complete` requires docking/merge-ready)
- catalog membership (instruction IDs, NEED codes)
- artifact pointer integrity (paths/refs resolve)

**Soft checks (warn)**
- extra unexpected fields
- heuristic prose leakage in structured regions
- suspicious drift candidates

This turns the doctrine from “soft constraints” into deterministic boundary physics.

---

## The data spine (crash-safe)

All operational data lives in one file:
- `.data/agency.db` (SQLite, WAL mode, gitignored)

Tables:
- **events** — boundary crossings and state transitions (ordered by auto-increment id)
- **missions** — mission manifests + statuses
- **artifacts** — registered products + provenance

WAL mode makes writes atomic; crashes produce incomplete operations as queryable state, not corruption.

### Boot reconciliation
On startup, Admiral queries the spine. If the last operation is incomplete, the Director chooses:
- resume
- abandon
- start new

Agency never auto-resumes into stale context.

---

## Static coherence auditing (optional, but powerful)

A separate auditor can statically analyze the constitution for “resistance”:
- lexical cohesion (ambiguous terms)
- domain bleed (mixed metaphors without a declared seam)
- path coherence (metaphor continuity along operational routes)
- ontology closure (unknown symbols / namespace drift)
- structural congruence (filesystem matches the metaphor)

Guard seals the hatches at runtime; auditor finds corrosion in the hull during development.

---

## Project structure

```
agency/                          # constitution — markdown source of truth
  SKILL.md
  primitives.md
  templates.md
  contracts/
    payloads.md
    catalog.md
  shore/
    admiral.md
    intake.md
  afloat/
    captain.md
    intelligence/
    integration/
  shared/
    roster.json
    stream-protocol.md
  cic/

saga-guard/                      # boundary enforcement hook
spine-audit/                     # constitution consistency checker
.data/
  db.js
  query.js
```

---

## Why this works (the non-romantic version)

Agency reduces drift by making the system closed and checkable:

1. **Finite vocabulary** — agents select from catalogs; no invented IDs.
2. **Typed boundaries** — every crossing has a schema; invalid traffic is blocked.
3. **Immutable artifacts** — evidence/products move by pointer, not summary.
4. **Evidence-first loop** — environment supplies the signal; delta shrinks across calibrations.
5. **Metaphor as constraint** — expedition frame forces separation, escalation, and closure.

The referents came first, and their structure dictated the architecture.
