# Agency V2 Plan: Scope Reset + System Upgrades

**Created:** 2026-03-02
**Status:** EXECUTED — 2026-03-02
**Trigger:** Execute after Director confirms. Do NOT execute during an active agency run.

---

## Overview

Six system changes + cleanup + new mission. The current agency run is abandoned due to a shipping/return-processing bug. Nothing merged to `dev`, so all intelligence products (dossiers, chart) remain valid.

**Changes:**
1. Scope Document — filter work by living scope CSV
2. QA Ticket Ingestion — collect, scope-filter, reconcile QA tickets
3. Mission Generalization — dissolve epic coupling, scope-doc-driven
4. Real-Time Streaming — every agent logs in real-time to dashboard
5. Pre-Push E2E Gate — E2E must pass immediately before every git push
6. Delivery + Return Processing Fix — Production must merge before returning; XO auto-continues

---

## Step 0: Cleanup

**Goal:** Clean slate. Agency muster sees: empty workspace, new mission, valid warm-tier intelligence.

### 0a. Close PR and delete branches

```bash
# Close PR #242
gh pr close 242 --repo g2i-ai/hubshot --comment "Abandoning: scope reset per agency v2 plan"

# Switch to dev
cd ~/dev/hubshot
git checkout dev
git pull origin dev

# Delete local branches
git branch -D fix/rom-365-contact-detail-calibration
git branch -D fix/rom-365-contact-detail-calibration-v2
git branch -D fix/rom-365-object-lists-calibration

# Delete remote branches
git push origin --delete fix/rom-365-contact-detail-calibration
git push origin --delete fix/rom-365-contact-detail-calibration-v2
# Note: fix/rom-365-object-lists-calibration has no remote
```

### 0b. Archive agency log to cold tier

Copy `~/.claude/agency-workspace/log.md` to `memory/events/ROM-365-calibrate-abandoned-2026-03-02.md` with a header note: "Abandoned: scope reset per agency v2 plan."

### 0c. Clear hot tier

```
~/.claude/agency-workspace/log.md        → reset to empty header only
~/.claude/agency-workspace/evidence/     → rm -rf contents
~/.claude/agency-workspace/dossiers/     → rm -rf contents
~/.claude/agency-workspace/streams/      → rm -rf (if exists)
~/dev/hubshot/jobs/                       → rm -rf contents (wo-1..5, checkpoints, log)
```

### 0d. Preserve warm tier (DO NOT DELETE)

These are valid — nothing merged to dev since collection:

```
memory/dossiers/index.yaml                                    ← keep (7 entries, all accurate)
memory/dossiers/contacts-delta-20260301T2100Z.yaml            ← keep
memory/dossiers/contacts-listview-delta-20260301T2327Z.yaml   ← keep
memory/dossiers/contacts-listview-delta-20260302T1930Z.yaml   ← keep
memory/dossiers/contacts-create-form-delta-20260302T1945Z.yaml ← keep
memory/dossiers/contacts-detail-view-delta-20260302T2130Z.yaml ← keep
memory/dossiers/lists-object-lists-view-delta-20260302T2300Z.yaml ← keep
memory/dossiers/lists-advanced-filters-delta-20260303T0100Z.yaml  ← keep
memory/dossiers/*.md (audit bundles, briefs)                  ← keep (institutional)
memory/chart.yaml                                              ← keep (reference topology)
memory/events/*                                                ← keep (cold archive)
```

### 0e. Clear bulletin signal

Remove the `## Organizational Signals` content in `cadre/bulletin.md`. Keep Standing Orders and Known Constraints. Signal will be repopulated in Step 7.

### 0f. Archive old mission manifest

Move `memory/missions/contacts-lists-calibration.yaml` to `memory/events/contacts-lists-calibration-abandoned-2026-03-02.yaml`. This prevents the XO from finding an active mission during muster.

### 0g. Verify clean state

After cleanup, the agency should see on muster:
- Workspace log: empty (no orphan recovery triggered)
- Bulletin: standing orders only, no active mission signal
- Missions directory: no active manifests
- Dossiers: 7 valid delta dossiers in warm tier
- Chart: reference topology intact
- Local branch: dev (clean)

---

## Step 1: Store Scope Document

**File:** `memory/project/scope.csv`
**Source:** `~/Hubshot Sales Tub Task List - Sheet1.csv`

```bash
cp ~/Hubshot\ Sales\ Tub\ Task\ List\ -\ Sheet1.csv \
   ~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/project/scope.csv
```

**Format:** Raw CSV, ~741 rows. Columns: (header), Task, Area, Scope, Completed, Manual QA, E2E Tested, Notes

**In-scope areas (16):** Contacts, Companies, Deals, Pipelines, Tasks, Activities, Lists, Associations, Properties, Import/Export, Dashboards, Search, Bulk Actions, Navigation, Users

**Out-of-scope areas (10):** Account, Marketing, Sales (advanced), Service, Automation, Reporting, Integrations, Chatflows, Calling, Documents, Accessibility, Keyboard, Mobile, Enterprise

**Update protocol:** Director pastes new CSV text → overwrite `memory/project/scope.csv`. Pointers remain stable. No format conversion.

---

## Step 2: Agency System File Changes

Organized by file. Each file may be touched by multiple changes.

### contracts/catalog.md

**Add instruction:**
```
INTEL.COLLECT.QA_FINDINGS — Query Linear for QA-generated tickets in mission domains,
  filter against scope CSV, cross-reference with existing dossier findings.
  Chief Analyst inline. (Change 2)
```

**Update instruction:**
```
INTEL.COLLECT.SCOPE — (existing) Query Linear for domain boundaries.
  ADD: Load scope CSV (memory/project/scope.csv), filter to mission scope_areas,
  write filtered scope summary to workspace evidence. (Change 1)
```

**Add NEEDs:**
```
CONTEXT_EXHAUSTION — Agent hit context capacity before completing protocol.
  Severity: routine. Handler: XO re-launches with RESUME + checkpoint. (Change 6)

MERGE_BLOCKED — PR cannot be merged (permissions, protected branch, conflicts).
  Severity: terminal. Handler: XO surfaces to Director. (Change 6)

QA_DATA — Production needs QA ticket reconciliation data.
  Severity: routine. Handler: XO → INTEL.COLLECT.QA_FINDINGS. (Change 2)
```

### contracts/payloads.md

**LAUNCH_BRIEF → Intelligence:**
```
Add optional field: SCOPE_DOC: {path to scope CSV} (Change 1)
```

**INTEL_RETURN:**
```
Add optional field: QA_FINDINGS: {path to qa-findings artifact} (Change 2)
```

**PRODUCTION_RETURN:**
```
Clarify: STATUS must be one of: complete | partial | escalation
  - complete requires DELIVERY: merged (Change 6)
  - partial requires WO_REMAINING > 0 (Change 6)
  - escalation requires NEED from catalog (Change 6)
  - No freeform statuses. No "awaiting approval." (Change 6)
```

**BRIEFING template:**
```
Add field: type: progress | escalation | debrief (Change 6)
  - progress: informational, no Director action needed
  - escalation: Director action required
  - debrief: final operation summary
```

### divisions/intelligence/intelligence.md

**Add to instruction routing table:**
```
INTEL.COLLECT.QA_FINDINGS → inline (Chief Analyst) (Change 2)
```

**Update INTEL.COLLECT.SCOPE routing:**
```
Add step: Load scope CSV from SCOPE_DOC pointer in LAUNCH_BRIEF.
  Filter to mission scope_areas. Write filtered summary to
  ~/.claude/agency-workspace/evidence/{domain}/scope-filtered.md (Change 1)
```

### cadre/wardroom/identities/chief-analyst.md

**Add to inline execution protocol (after SCOPE/LANDSCAPE/COORDINATION):**

```
INTEL.COLLECT.QA_FINDINGS (inline):
  1. Load filtered scope summary from workspace evidence
  2. Query Linear: team=Romeo, state != Done/Cancelled, labels matching scope_areas
     (NOT by parent epic — epic structure is unreliable)
  3. For each ticket: match against scope CSV by Area + task description
  4. Classify: in_scope | out_of_scope (logged but excluded)
  5. Cross-reference in-scope tickets against existing dossier findings:
     - Match by surface, gap description, affected component
     - Tag: confirmed (overlaps dossier) | new_marker (dossier missed) | out_of_scope
  6. Write qa-findings artifact to ~/.claude/agency-workspace/evidence/{domain}/qa-findings.yaml
  (Change 2)
```

**Update INTEL.COLLECT.SCOPE inline execution:**
```
Add: Load scope CSV from SCOPE_DOC pointer. Parse CSV, filter rows where
  Area is in mission scope_areas AND Scope is "In Scope". Write filtered
  task list to evidence directory. (Change 1)
```

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/B-002.md
Format: | {ISO-8601} | {EVENT} | {Detail <=100 chars} |
Create file with header on first write. Append immediately on each step.
Events: SCOPE_START, SCOPE_COMPLETE, LANDSCAPE_START, LANDSCAPE_COMPLETE,
  COORDINATION_START, COORDINATION_COMPLETE, QA_SWEEP_START, QA_SWEEP_COMPLETE,
  AUTH_CHECK, ROUTING, FIELD_DEPLOYING, DESK_DEPLOYING
```

### cadre/wardroom/identities/production-orchestrator.md

**Wire factory event codes into protocol steps (Change 4):**
```
Emit to ~/.claude/agency-workspace/streams/B-003.md at each step:
  DOCK_RECEIVED, DOCK_CLASSIFIED, DOCK_DISPATCHED
  ASSAY_START, ASSAY_LOOP, ASSAY_PASS, ASSAY_FAIL
  FRAC_START, FRAC_COMPLETE
  WO_START, RECEIVING, STATION_DEPLOYING
  CI_PENDING, CI_POLLING, CI_PASS, CI_FAIL, CI_FIX_PUSHED
  REVIEW_WAIT, REVIEW_POLLING, REVIEW_PASS, REVIEW_FINDING, REVIEW_FIX_PUSHED
  E2E_RUNNING, E2E_PASS, E2E_BLOCK
  DELIVERY_START, DELIVERY_COMPLETE, DELIVERY_BLOCKED
  MERGED, CLOSEOUT, JOB_DONE
```

**Enforce delivery completion (Change 6):**
```
After Review Gate PASS:
  → Delivery is MANDATORY. Execute immediately.
  → Valid return states only: complete (DELIVERY: merged), partial, escalation
  → If context pressure detected before Delivery: checkpoint, return
    STATUS: escalation, NEED: CONTEXT_EXHAUSTION
  → Never return a non-contract status.
```

**Pre-push E2E gate at every push point (Change 5):**
```
Before every git push (station shipping, WO shipping, CI fix push, review fix push):
  1. Run: pnpm exec playwright test {affected dirs} --reporter=list
  2. PASS → proceed to push
  3. FAIL → HALT. Do not push. Route to rework.
  Log: E2E_RUNNING / E2E_PASS / E2E_BLOCK
```

### cadre/wardroom/identities/executive-officer.md

**Separate Triage Protocol from Return Processing Protocol (Change 6):**

```
## Triage Protocol (initial Director intent)
Steps 1-8 with Confirm gate at Step 5.
Director approval required before execution.
Used ONLY for initial intent triage — not for mid-operation returns.

## Return Processing Protocol (mid-operation returns)
No Confirm gate. Auto-process based on return STATUS:

STATUS: complete + DELIVERY: merged
  → Log WO_SHIPPED to agency log
  → Check Ship Gate: is next WO unblocked?
  → If unblocked: auto-launch Production for next WO (no Director pause)
  → Deliver BRIEFING with type: progress (informational — no action needed)

STATUS: partial + WO_REMAINING > 0
  → Log partial return
  → Wait for next return (existing protocol)

STATUS: escalation
  → Handle per RESOLVE:
    → routine: route to sibling division
    → terminal: deliver BRIEFING with type: escalation (Director action required)
  → This is the ONLY case where Director confirmation is needed mid-operation.
```

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/B-001.md
Events: MUSTER_START, MUSTER_COMPLETE, TRIAGE_START, BRIEF_READY,
  CONFIRMED, EXECUTING, DELEGATING, RETURN_RECEIVED, RETURN_PROCESSED
```

### cadre/barracks/identities/field-agent.md

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/{B-004|B-006}.md
Events: NAVIGATING, CAPTURING, SNAPSHOT_TAKEN, EVIDENCE_WRITTEN, CAPTURE_COMPLETE
```

### cadre/barracks/identities/desk-analyst.md

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/B-005.md
Events: LOADING_EVIDENCE, ANALYZING, DOSSIER_DRAFTED, CHART_UPDATING, ANALYSIS_COMPLETE
```

### cadre/barracks/identities/station-worker.md

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/{B-007|B-009}.md
Events: READING_WO, CODING, COMMITTED, VALIDATING, BUILD_COMPLETE
```

### cadre/barracks/identities/inspector.md

**Add stream logging protocol (Change 4):**
```
## Stream Logging
Log to: ~/.claude/agency-workspace/streams/B-008.md
Events: GATE_START, GATE_RUNNING, GATE_PASS, GATE_FAIL, REPORT_WRITTEN, VERDICT
```

### divisions/production/shipping.md

**Add pre-push E2E gate (Change 5):**
```
Insert before every git push point (station shipping + WO shipping + mid-flight rebase):

  PRE-PUSH E2E GATE (mandatory):
    1. Identify affected E2E directories from WO deliverables
    2. Run: pnpm exec playwright test {dirs} --reporter=list
    3. PASS → proceed to git push
    4. FAIL → HALT. Do not push. Return to Shop Floor for rework.
```

**Enforce mandatory Delivery (Change 6):**
```
After Review Gate PASS, Delivery is unconditional:
  → Execute squash merge
  → Transition Linear tickets per conventions
  → Delete branch
  → Return PRODUCTION_RETURN with STATUS: complete, DELIVERY: merged
  → If merge fails: return STATUS: escalation, NEED: MERGE_BLOCKED
```

**Clarify CursorBot exit conditions (Change 6):**
```
Review Gate — CursorBot conclusion handling:
  APPROVED                              → REVIEW_PASS
  COMMENTED + NEUTRAL + 0 findings      → REVIEW_PASS (informational)
  COMMENTED + NEUTRAL + N>0 findings    → Evaluate: fix if actionable, dismiss + log if false positive
  CHANGES_REQUESTED                     → REVIEW_FINDING: fix, push, re-poll
  Not completed                         → REVIEW_POLLING: continue waiting
```

### divisions/production/refinery.md

**Assay loop — add scope + QA consumption (Changes 1, 2):**
```
INITIALIZE FEEDSTOCK:
  Synthesize from: dossier findings + scope-filtered summary + QA findings artifact
  (Three input sources, not just dossier)

ASSAY LOOP additions:
  - Check: scope CSV loaded? → if not, NEED: SCOPE_DATA
  - Check: QA findings collected? → if not, NEED: QA_DATA (routine, XO routes to Intel)
  - Merge: dossier gaps + QA tickets (deduplicate overlapping items)
  - Filter: exclude items outside scope CSV "In Scope" rows

FRACTIONATE:
  - Items with both dossier gap AND QA ticket → priority boost (double-marked terrain)
  - Items from QA only (new markers) → normal priority within their band
  - Items from dossier only → normal priority
```

### templates.md

**Add qa-findings-v1 template (Change 2):**
```yaml
# qa-findings-v1
metadata:
  domain: {domain}
  timestamp: {ISO-8601}
  scope_doc_version: {scope CSV mtime}
  linear_query: {query description}

in_scope:
  - ticket_id: {ROM-XXX}
    title: {title}
    area: {Area from scope CSV}
    scope_task: {matching task from scope CSV, or null}
    dossier_overlap: {dossier file + finding ID, or null}
    status: {pending | shipped | verified}

out_of_scope:
  - ticket_id: {ROM-XXX}
    title: {title}
    area: {area}
    reason: {string}

reconciliation:
  confirmed: {N}
  new_markers: {N}
  out_of_scope: {N}
```

**Add BRIEFING type field (Change 6):**
```
briefing-v1 additions:
  type: progress | escalation | debrief
  - progress: informational, pipeline auto-continues
  - escalation: Director action required
  - debrief: final operation summary
```

### cic/services.md

**Document streams/ lifecycle (Change 4):**
```
Add to CIC Lifecycle Protocol:
  Normal close: clear ~/.claude/agency-workspace/streams/ (alongside evidence, log, jobs)
  Orphan recovery: archive streams/ alongside log to events/
```

### Dashboard files (Change 4)

**~/.claude/tools/agency-dashboard/server.ts:**
- Add file watcher on `~/.claude/agency-workspace/streams/` directory
- Same 200ms debounce pattern as existing watchers
- On change: trigger state refresh + SSE broadcast

**~/.claude/tools/agency-dashboard/parsers/streams.ts (NEW):**
- Read all `*.md` files in `streams/` directory
- Parse each: extract markdown table rows
- Prepend bunk-id from filename (e.g., `B-007.md` → entity B-007)
- Return `StreamEntry[]` with: timestamp, bunkId, event, detail

**~/.claude/tools/agency-dashboard/parsers/index.ts:**
- `parseAgencyState()` calls new `parseStreams()`
- Merge stream entries chronologically with agency + factory entries
- Add `activity` field to entity state: most recent stream event for each entity

**~/.claude/tools/agency-dashboard/ui/index.html:**
- Unified timeline shows stream events with entity badges
- Entity cards show current activity (not just idle/active/complete)
- e.g., "B-007 Mason: active — CODING contact-detail-view"

---

## Step 3: Update Conventions

### memory/project/conventions.md

**Add under Linear Ticket Lifecycle:**
```
### Epic Structure Instability
Epic hierarchy is maintained by QA team and may be rearranged at any time.
Epics may be dissolved into subtasks. Do NOT rely on parent-epic queries
to discover tickets. Instead, discover by: team + domain labels + state.

### QA Ticket Discovery Protocol
QA-generated fix tickets appear under various parents (epics, features).
Discovery method:
  1. Query Linear: team=Romeo, state != Done/Cancelled
  2. Filter by area labels matching mission scope_areas
  3. Filter against scope CSV (memory/project/scope.csv)
  4. Cross-reference with existing dossier findings
```

---

## Step 4: New Mission Manifest

**File:** `memory/missions/sales-hub-calibration.yaml`

```yaml
# MISSION MANIFEST
# Template: mission-manifest-v1
---
metadata:
  name: "Sales Hub Calibration — Contacts & Lists"
  domain: [contacts, lists]
  strategy: calibrate
  scope_doc: memory/project/scope.csv
  scope_areas: [Contacts, Lists]
  created: {execution timestamp}
  status: active

objectives:
  - Cover all in-scope gaps between reference app and HubShot for Contacts surfaces
  - Cover all in-scope gaps for Lists surfaces
  - Build advanced filter slide-out as shared baseline component (reusable by team)
  - Integrate quick filters across applicable views
  - Reconcile and close QA-generated tickets within scope

exclusions:
  - AI/Breeze features (record summaries, intelligence tab, AI-powered suggestions)
  - Placeholder features documented as intentionally stubbed
  - Timing audits (separate mission)
  - Areas marked "Out of Scope" in scope CSV
  - Non-Contacts/Lists scope areas (Companies, Deals, etc. are in scope CSV
    but not in this mission's scope_areas)

surfaces:
  - name: "Contacts"
    sub_surfaces:
      - contacts-list-view
      - create-contact-form
      - contact-detail-view
    captured: false
    delta_analyzed: false
    fixes_applied: false
    convergence_verified: false

  - name: "Lists"
    sub_surfaces:
      - object-lists-view
      - advanced-filters
    captured: false
    delta_analyzed: false
    fixes_applied: false
    convergence_verified: false

  - name: "Shared Components"
    sub_surfaces:
      - quick-filters
      - advanced-filter-slideout
    captured: false
    delta_analyzed: false
    fixes_applied: false
    convergence_verified: false
    note: "Baseline components — built for reuse across team"

prior_intelligence:
  note: |
    Valid delta dossiers from prior run (nothing merged to dev since collection).
    Intelligence should consume these as baseline — no re-capture needed for
    already-mapped terrain unless Director requests verification.
  dossier_chain:
    - memory/dossiers/contacts-listview-delta-20260302T1930Z.yaml
    - memory/dossiers/contacts-create-form-delta-20260302T1945Z.yaml
    - memory/dossiers/contacts-detail-view-delta-20260302T2130Z.yaml
    - memory/dossiers/lists-object-lists-view-delta-20260302T2300Z.yaml
    - memory/dossiers/lists-advanced-filters-delta-20260303T0100Z.yaml
  chart: memory/chart.yaml

discovery:
  method: "scope-doc + linear-query (label/domain-based, not epic-based)"
  note: "Epic structure unreliable — QA team rearranged hierarchy"

progress:
  total_surfaces: 3
  captured: 0
  analyzed: 0
  converged: 0
```

**Key differences from old manifest:**
- No `epic:` field (dissolved)
- No specific ticket IDs (discovered dynamically via Linear query)
- `scope_doc` and `scope_areas` fields (new)
- `prior_intelligence` section references existing dossiers as input (not as "completed work")
- `surfaces` all reset to `false` (fresh operation)
- `objectives` are generalized ("cover all gaps within scope")
- New "Shared Components" surface for quick filters + filter slideout

---

## Step 5: Update Bulletin

### cadre/bulletin.md — Organizational Signals section

```markdown
## Organizational Signals

**MISSION ACTIVE: Sales Hub Calibration — Contacts & Lists**
- Manifest: `memory/missions/sales-hub-calibration.yaml`
- Strategy: calibrate
- Scope: 3 surfaces — Contacts (3 sub), Lists (2 sub), Shared Components (2 sub)
- Scope doc: `memory/project/scope.csv` (task-level In Scope / Out of Scope)
- Phase: FRESH START. Prior intelligence available (5 delta dossiers, chart).
- New capabilities: QA ticket ingestion, scope filtering, real-time streaming
- Exclusions: AI/Breeze features, placeholder stubs, timing audits, out-of-scope areas
```

---

## Step 6: Execution Readiness Checklist

Before invoking the agency on the new mission, verify:

```
[ ] PR #242 closed, branches deleted (local + remote)
[ ] On dev branch, clean working tree
[ ] Hot tier empty: workspace/log.md (header only), evidence/, dossiers/, streams/
[ ] jobs/ directory empty
[ ] Old mission archived to memory/events/
[ ] memory/dossiers/ intact (7 dossiers + index.yaml)
[ ] memory/chart.yaml intact
[ ] memory/project/scope.csv stored
[ ] All agency system files updated (catalog, payloads, intelligence, chief-analyst,
    production-orchestrator, executive-officer, shipping, refinery, templates,
    all 7 identity files, cic/services)
[ ] memory/project/conventions.md updated (epic instability, QA discovery)
[ ] Dashboard files updated (server, parsers/streams, parsers/index, ui)
[ ] New mission manifest at memory/missions/sales-hub-calibration.yaml
[ ] Bulletin updated with new organizational signal
[ ] Dashboard server restartable (kill old process, boot.sh will restart)
```

**Expected agency muster behavior after all steps:**
1. XO boots → workspace log empty (no orphan)
2. XO reads bulletin → sees new mission signal
3. XO checks missions → finds sales-hub-calibration.yaml (active)
4. XO loads manifest → sees prior_intelligence, scope_doc, objectives
5. XO triages → recommends: Intelligence (SCOPE + QA_FINDINGS) then Production
6. Director confirms → agency executes with all new capabilities

---

## File Change Summary

| File | Changes |
|---|---|
| `contracts/catalog.md` | +INTEL.COLLECT.QA_FINDINGS, update INTEL.COLLECT.SCOPE, +3 NEEDs |
| `contracts/payloads.md` | +SCOPE_DOC, +QA_FINDINGS, PRODUCTION_RETURN clarification, BRIEFING type |
| `divisions/intelligence/intelligence.md` | +QA_FINDINGS routing, update SCOPE routing |
| `divisions/production/shipping.md` | +pre-push E2E gate, mandatory Delivery, CursorBot exits |
| `divisions/production/refinery.md` | +scope filtering, +QA consumption in Assay+Fractionate |
| `cadre/wardroom/identities/chief-analyst.md` | +QA collection protocol, update SCOPE, +streaming |
| `cadre/wardroom/identities/production-orchestrator.md` | +factory events, +delivery enforcement, +E2E gate, +streaming |
| `cadre/wardroom/identities/executive-officer.md` | +separate Return Processing, +streaming |
| `cadre/barracks/identities/field-agent.md` | +streaming |
| `cadre/barracks/identities/desk-analyst.md` | +streaming |
| `cadre/barracks/identities/station-worker.md` | +streaming |
| `cadre/barracks/identities/inspector.md` | +streaming |
| `templates.md` | +qa-findings-v1, +BRIEFING type field |
| `cic/services.md` | +streams/ lifecycle |
| `~/.claude/tools/agency-dashboard/server.ts` | +streams/ watcher |
| `~/.claude/tools/agency-dashboard/parsers/streams.ts` | NEW: stream parser |
| `~/.claude/tools/agency-dashboard/parsers/index.ts` | +merge streams into state |
| `~/.claude/tools/agency-dashboard/ui/index.html` | +entity activity timeline |
| `memory/project/scope.csv` | NEW: scope document |
| `memory/project/conventions.md` | +epic instability, +QA discovery protocol |
| `memory/missions/sales-hub-calibration.yaml` | NEW: mission manifest |
| `cadre/bulletin.md` | Update organizational signal |

**Total: 22 files (20 modified, 2 new)**
