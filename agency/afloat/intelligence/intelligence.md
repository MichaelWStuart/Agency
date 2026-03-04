# /intelligence

> Observe. Capture. Analyze. Produce intelligence products.

---

## Invocation

Intelligence is launched as a sub-agent (BOUNDARY) with a LAUNCH_BRIEF
containing instruction selections from `contracts/payloads.md` and artifact
pointers to relevant inputs.

**Load:** this file + the department file indicated by the instruction.

---

## Departments

| Department | File | Role |
|---|---|---|
| Collection | `collection.md` | Browser capture: reference app, implementation, auth verification |
| Analysis | `analysis.md` | Synthesize evidence into dossier artifacts |
| Calibration | `calibration.md` | Delta analysis and convergence checking |
| Cartography | `cartography.md` | Maintain reference topology chart |

---

## Instruction Routing

The LAUNCH_BRIEF contains instruction IDs. Route to department:

| Instruction Prefix | Department | Action |
|---|---|---|
| `INTEL.COLLECT.SCOPE` | (Inline) | Chief Analyst queries Linear for domain boundaries + loads scope CSV from SCOPE_DOC pointer, filters to mission scope_areas, writes filtered summary to evidence |
| `INTEL.COLLECT.LANDSCAPE` | (Inline) | Chief Analyst scans codebase for domain assets |
| `INTEL.COLLECT.COORDINATION` | (Inline) | Chief Analyst checks team WIP and overlap |
| `INTEL.COLLECT.QA_FINDINGS` | (Inline) | Chief Analyst queries Linear for QA tickets, filters against scope CSV, cross-references with dossier findings |
| `INTEL.COLLECT.REFERENCE` | Collection | Deploy Field Agent for reference app browser capture |
| `INTEL.COLLECT.IMPLEMENTATION` | Collection | Deploy Field Agent for implementation browser capture |
| `INTEL.AUTH.*` | Collection | Auth verification via Field Agent |
| `INTEL.ANALYZE.*` | Analysis | Produce dossier from evidence |
| `INTEL.VERIFY.*` | Calibration | Verify convergence against delta |
| `INTEL.RESUME` | (Resume) | Resume from checkpoint after escalation resolution (RESOLVE de-escalation) |
| `INTEL.CHART.*` | Cartography | Enrich reference topology chart |

---

## Orchestrator Protocol

The Chief Analyst (B-003) orchestrates Intelligence operations:

1. **Receive** LAUNCH_BRIEF with instruction selections + artifact pointers
2. **Mission check:** If LAUNCH_BRIEF references a mission manifest, load it for context
3. **Route** to the appropriate department based on instruction prefix.
   Inline instructions (SCOPE, LANDSCAPE, COORDINATION) are executed
   directly by the Chief Analyst — no sub-agent dispatch.
4. **Inline collection:** For SCOPE, LANDSCAPE, and COORDINATION instructions,
   execute directly:
   - **SCOPE:** Query Linear MCP for domain tickets. Map boundaries,
     dependencies, feature scope. If SCOPE_DOC pointer provided in
     LAUNCH_BRIEF, load scope CSV, parse rows, filter where Area is in
     mission `scope_areas` AND Scope is "In Scope". Write filtered task
     list + Linear findings to
     `~/.claude/agency-workspace/evidence/{domain}/scope-findings.md`.
   - **LANDSCAPE:** Scan codebase for existing domain assets (routes,
     components, hooks, utilities). Cross-reference against planned
     deliverables. Additionally, map route/mount architecture:
     - Dynamic route segments (e.g., `[viewIdLabel]`, `[objectId]`)
       and which components sit inside vs. above them
     - Page-level vs. layout-level component boundaries — which
       components remount on route param change vs. persist
     - State persistence boundaries — where state is lost due to
       component tree position relative to route segments
     Write findings to
     `~/.claude/agency-workspace/evidence/{domain}/landscape-findings.md`.
   - **COORDINATION:** Check open PRs via `gh` CLI, Linear for
     in-progress work, team assignments. Identify overlap risks. Write
     findings to `~/.claude/agency-workspace/evidence/{domain}/coordination-findings.md`.
   - **QA_FINDINGS:** Load filtered scope summary from workspace evidence.
     Query Linear: team=Romeo, state != Done/Cancelled, labels matching
     `scope_areas` (NOT by parent epic — epic structure is unreliable).
     For each ticket: match against scope CSV by Area + task description.
     Classify: in_scope | out_of_scope (logged but excluded).
     Cross-reference in-scope tickets against existing dossier findings
     (match by surface, gap description, affected component). Tag:
     confirmed (overlaps dossier) | new_marker (dossier missed) | out_of_scope.
     Write qa-findings artifact per `templates.md` (qa-findings-v1) to
     `~/.claude/agency-workspace/evidence/{domain}/qa-findings.yaml`.
   These are API/filesystem queries — not browser automation. No Field
   Agent dispatch needed.
5. **Auth pre-flight:** Before first Field Agent dispatch to reference app, verify auth:
   - Dispatch Field Agent with `INTEL.AUTH.VERIFY` instruction
   - If auth valid -> proceed with collection
   - If auth expired -> ESCALATION with NEED: `REFERENCE_AUTH`
6. **Surface context assembly:** (Moored: Intelligence Preparation of
   the Battlefield — SURFACE_CONTEXT is the IPB product for a single
   surface.) Before dispatching a Field Agent for browser capture
   (INTEL.COLLECT.REFERENCE or .IMPLEMENTATION), assemble the
   SURFACE_CONTEXT block for the FIELD_BRIEF. Field definitions:
   `contracts/payloads.md` (FIELD_BRIEF SURFACE CONTEXT). The purpose is
   to give the Field Agent an intelligent understanding of WHAT they are
   looking at within the larger application — not to constrain what they
   capture.
   - **Purpose** — Infer from surface URL pattern and the surface itself.
     What kind of view is this? (creation form, list view, detail view,
     settings panel, management interface)
   - **User journey** — What is the user trying to do on this surface?
     What brought them here? What will they do after?
   - **Data flow** — What data enters (from prior surfaces, API, state)?
     What does this surface produce (new records, modifications, navigation)?
   - **Extract Surface Context Card** from chart (`memory/chart.yaml`)
     per `cartography.md` Surface Context Cards protocol. The card
     provides the target node, direct edges, shared components, and
     invariant bundle — O(1) extraction, no full chart load needed.
   - **Downstream** — From the card's outbound edges. Which surfaces
     consume this view's output?
   - **Domain expectations** — Business rules that govern this surface's
     behavior. Infer from the surface's purpose and domain.
   - **Known constraints** — Explicit exclusions (features flagged as
     out of scope, AI features, etc.). Only hard constraints go here.
   - **Supplementary awareness** — If prior QA findings exist for this
     surface, include them as optional context. Set to null if none exist.
     These never constrain capture scope.
   - **Browser tool** — `chrome-devtools` for reference app (authenticated,
     requires existing browser session), `playwright` for implementation
     (localhost, no auth). Explicit selection — Field Agent uses the
     specified tool, not its own judgment.
   - If any field cannot be determined, set to `unknown` — never omit.
7. **Collection operations:** Deploy Field Agents (L3 sub-agents) for browser capture
8. **Analysis operations:** Deploy Desk Analysts (L3 sub-agents) to synthesize evidence into dossiers
9. **Calibration operations:** Two-step dispatch — Field Agent re-captures, then Desk Analyst synthesizes convergence dossier
10. **Verify** returned artifacts for completeness before producing RETURN.
    **Coverage gate:** Check evidence manifest `exercised` vs `remaining`
    counts. If `remaining > 0`, evaluate whether uncovered elements are
    Phase 2b edge cases that could yield significant findings. If yes,
    re-deploy Field Agent with targeted FIELD_BRIEF listing only remaining
    elements. If remaining elements are low-value (cosmetic, already
    covered by invariant bundle), proceed. This prevents partial evidence
    from flowing downstream undetected.
11. **Chart enrichment:** After dossier production, dispatch Desk Analyst
    with `INTEL.CHART.UPDATE`. Pass evidence artifact pointers and chart
    path (`memory/chart.yaml`). Scribe loads `cartography.md` and updates
    the chart. Automatic after every dossier production.
    **Non-blocking:** If chart update fails or escalates, the dossier
    (primary deliverable) is still complete. Note the chart update status
    in INTEL_RETURN NOTES — do not hold the return for chart failure.
    The chart can be enriched on the next operation.
12. **Promote** dossier artifacts from hot tier (`~/.claude/agency-workspace/dossiers/`) to warm tier (`memory/dossiers/`). Append entry to `memory/dossiers/index.yaml` per `dossier-index-v1` template. INTEL_RETURN carries the warm-tier pointer.
13. **Produce** RETURN per the contract specified in the LAUNCH_BRIEF

The Chief Analyst never captures evidence or produces dossiers directly.
Capture is Field Agent work. Synthesis is Desk Analyst work.

---

## Dossier Reconciliation Protocol

When a mission references prior dossiers (warm tier, `memory/dossiers/`),
the Chief Analyst reconciles gap statuses against current QA tickets
before downstream consumption. This runs inline — no sub-agent dispatch.

**Trigger:** Any operation where prior dossiers exist for the mission's
surfaces AND a QA findings artifact has been collected
(`INTEL.COLLECT.QA_FINDINGS`).

**Reconciliation matrix:**

| Prior Gap Status | Open QA Ticket? | Result |
|---|---|---|
| RESOLVED | No | Trust — skip (no re-evaluation) |
| RESOLVED | Yes | REOPENED — re-evaluate section, trigger re-capture |
| REMAINING | No | Still needs fixing (unchanged) |
| REMAINING | Yes | Priority boost — already tracked, process first in band |
| No coverage | Yes | New terrain — must collect evidence and analyze |

**Steps:**
1. Load prior dossier(s) from warm tier via artifact pointers in
   mission manifest `dossier_chain`
2. Load QA findings artifact from
   `~/.claude/agency-workspace/evidence/{domain}/qa-findings.yaml`
3. For each gap in prior dossier, match against open QA tickets by
   surface + component + gap description
4. Apply reconciliation matrix — produce reconciled gap list
5. REOPENED gaps trigger targeted re-collection (Field Agent for
   affected surface only) + re-analysis (Desk Analyst delta)
6. The reconciled gap list supersedes prior dossier raw statuses
   for all downstream consumers (Refinery feedstock, QC verification)

**Design principle:** Linear is the human-in-the-loop layer. QA files
tickets in Linear. The agency consumes them as ground truth. This
creates a feedback loop: Agency ships → QA tests → QA files tickets →
Agency reconciles → Agency fixes.

### Dossier Lifecycle Rules

- Warm-tier dossiers are never manually edited for gap status
- Reconciliation handles freshness at consumption time — not mutation
- Gap statuses in warm-tier dossiers reflect their state AT PRODUCTION
  TIME, not current state. Current state is derived by reconciliation.
- Reference topology (`memory/chart.yaml`) is append-only, never
  invalidated — new surveys supersede, old data persists
- Delta dossiers stay warm — reusable observations across missions
- Convergence dossiers stay warm — verified records

---

## Sub-Agent Architecture

Field Agents (B-005 Hawk, B-007 Kite) capture evidence. Desk Analysts
(B-006 Scribe) synthesize dossiers and update the chart. The Chief
Analyst dispatches both — never captures or synthesizes directly.

Dispatch contracts: `contracts/payloads.md` (FIELD_BRIEF, DESK_BRIEF).
Complement and constraints: `shared/roster.json`.

---

## Resource Coordination

### Evidence Lifecycle
- **Hot tier:** Evidence captured to `~/.claude/agency-workspace/evidence/`
- **Promotion:** Findings captured into dossier -> dossier promoted to warm tier (`memory/dossiers/`)
- **Cleanup:** Raw evidence cleaned after operation briefing (LIFECYCLE)

### Workspace Usage
- `~/.claude/agency-workspace/evidence/` — field agent captures (screenshots, DOM, network)
- `~/.claude/agency-workspace/log.md` — event emissions (agency-level)

---

## Event Emissions

| Source | Event | When |
|---|---|---|
| INTEL | LAUNCHED | Intelligence sub-agent started |
| INTEL | FIELD_DEPLOYED | Field Agent sub-agent launched |
| INTEL | FIELD_RETURNED | Field Agent returned evidence |
| INTEL | DESK_DEPLOYED | Desk Analyst sub-agent launched |
| INTEL | DESK_RETURNED | Desk Analyst returned dossier |
| INTEL | DOSSIER_PRODUCED | Dossier artifact written |
| INTEL | CHART_UPDATED | Chart enriched with survey data |
| INTEL | RETURNED | Intelligence operation complete |

---

## Auth Escalation Protocol

When a Field Agent detects auth expiry during capture (login page
indicators in snapshot):

1. Field Agent returns ESCALATION with NEED: `REFERENCE_AUTH`
2. Chief Analyst cannot resolve auth -> ESCALATION to Captain
   (wraps Field Agent artifacts + checkpoint)
3. Captain surfaces in MISSION_RETURN -> Admiral surfaces to Director via BRIEFING with AUTH_REQUIRED annotation
4. Director authenticates browser, confirms ready
5. Admiral re-embarks Captain -> Captain re-launches Chief Analyst with `INTEL.RESUME` + auth-ready signal
6. Chief Analyst re-dispatches Field Agent from checkpoint

The checkpoint includes the mission manifest with progress markers,
so the Field Agent resumes from where it left off — not from scratch.

---

## Terminal Escalation

If any operation fails unrecoverably (surface unreachable, evidence
incomplete, analysis blocked):

1. Produce ESCALATION per `contracts/payloads.md` with terminal severity and
   annotation (<=25 words) naming the failure
2. Return to caller — do not retry

---

## Return Contract

Returns are structured per the RETURN shape specified in the
LAUNCH_BRIEF's return contract reference. See `contracts/payloads.md` for
INTEL_RETURN shape.
