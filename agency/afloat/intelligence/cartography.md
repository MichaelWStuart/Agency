# Cartography Department

> Maintain the persistent topology chart of the reference application.
> Evidence in, chart enriched.
>
> **Executor:** Desk Analyst (B-006, Scribe). This protocol is loaded
> by the Desk Analyst on launch — not executed inline by the Chief Analyst.

---

## Department I/O

**Input:** Evidence artifact pointers (from Collection) + chart path (`memory/chart.yaml`)
**Output:** Updated chart artifact at `memory/chart.yaml`

---

## Chart Governance
Moored: Cartography — systematic mapping of terrain that already exists.

The chart is DIRECTIVE-governed (mutable reference document, not
LIFECYCLE-immutable). Only this protocol can modify the chart.

**Rules:**
1. **Append-only growth** — nodes and edges are added, never removed
2. **Status advancement only** — a node's status can only advance:
   `unmapped` -> `discovered` -> `surveyed`. Never regress.
3. **Survey timestamps** — when evidence is processed for a node, append
   the current timestamp to the node's `surveys` array. This tracks
   when each node was last observed, even if status doesn't advance.
   Edges carry a `survey` timestamp updated on confirmation.
4. **Version increment** — every chart update increments the `meta.version` field
5. **Evidence-grounded** — every status change cites the evidence source
6. **Idempotent updates** — re-processing the same evidence produces no change

---

## Node Type System

Enumeration of reference application surface types. Each node in the
chart has exactly one type.

| Type ID | Description | Route Pattern |
|---|---|---|
| `list-view` | Tabular data listing with sort, filter, pagination | `/contacts`, `/companies`, `/objects/{type}` |
| `detail-view` | Single record with fields, timeline, associations | `/contacts/{id}`, `/companies/{id}` |
| `form-overlay` | Modal/panel for creating or editing a record | Overlay on parent surface |
| `board-view` | Kanban-style board with drag-and-drop | `/deals/board` |
| `calendar-view` | Calendar grid with event entries | `/calendar` |
| `gantt-view` | Timeline/Gantt chart of sequential items | `/projects` |
| `report-view` | Dashboard or analytics display | `/reports` |
| `home-view` | Landing/dashboard with widgets and activity | `/` |
| `settings-view` | Configuration panel with forms and toggles | `/settings/*` |
| `inbox-view` | Message/notification feed with read/unread | `/inbox`, `/conversations` |
| `management-view` | Administrative list with CRUD operations | `/settings/users`, `/integrations` |
| `list-management-view` | Manage saved lists/views/filters | `/objects/lists` |

---

## Invariant Bundles

Prescriptive evaluation checklists per node type. Define what
"surveyed" means — a node is surveyed when all applicable invariants
have been evaluated against evidence.

Four invariant categories:
- **Navigation** — how users reach and leave this surface
- **Data** — how information is displayed, sorted, filtered
- **Action** — what operations users can perform
- **Feedback** — loading states, error handling, confirmation signals

### list-view

| Category | Invariants |
|---|---|
| Navigation | Sidebar entry, deep link URL, object-type selector, breadcrumb |
| Data | Column sort, filter bar, pagination, search, column configuration |
| Action | Create (toolbar), bulk select, bulk operations, row click navigation, inline edit |
| Feedback | Loading skeleton, empty state, sort indicators, filter badges, selection count |

### form-overlay

| Category | Invariants |
|---|---|
| Navigation | Trigger source (toolbar, detail view, inline), close behavior |
| Data | Default values, required field indicators, validation rules, field types |
| Action | Submit, cancel, field validation on blur, idempotency guard |
| Feedback | Submit loading, success confirmation, error display, field-level errors |

### detail-view

| Category | Invariants |
|---|---|
| Navigation | Deep link URL, breadcrumb, tab navigation, back behavior |
| Data | Field display (left sidebar properties), timeline/activity, associations panel |
| Action | Edit fields inline, delete record, associate/disassociate, tab switching |
| Feedback | Loading skeleton, mutation confirmation, association loading, timeline pagination |

### board-view

| Category | Invariants |
|---|---|
| Navigation | Sidebar entry, deep link, column/stage filtering |
| Data | Card content, column headers, card count per column |
| Action | Drag-and-drop between columns, card click to detail, create from column |
| Feedback | Drag indicators, column drop zones, card transition animation |

### settings-view

| Category | Invariants |
|---|---|
| Navigation | Settings sidebar, deep link, section anchors |
| Data | Current values, option descriptions, dependency indicators |
| Action | Toggle, save, reset to default, section-level save |
| Feedback | Save confirmation, unsaved changes warning, validation errors |

### inbox-view

| Category | Invariants |
|---|---|
| Navigation | Sidebar entry, deep link, conversation threading |
| Data | Message list, read/unread state, sender info, timestamps |
| Action | Reply, mark read/unread, assign, filter by channel |
| Feedback | New message indicators, send confirmation, loading states |

---

## Chart Update Protocol

Executed by the Desk Analyst when dispatched with `INTEL.CHART.UPDATE`.

### Steps

1. **Load** current chart at `memory/chart.yaml`
2. **Load** evidence artifacts at pointer paths from DESK_BRIEF
3. **Extract topology** from evidence:
   - **New nodes** from: Phase 3 cross-action transitions (forms that
     navigate to list views, links to detail views), sidebar navigation
     entries, object-type selectors, URL patterns in network requests
   - **Existing nodes** enriched: if evidence covers a `discovered` node
     with sufficient depth (all applicable invariant categories evaluated),
     advance status to `surveyed`
   - **New edges** from: confirmed navigation paths in evidence (button
     clicks, form submissions, link follows), inferred from URL patterns
     and sidebar structure
   - **Shared components** from: elements appearing across multiple
     surfaces (global header, sidebar, toolbar patterns)
4. **Apply updates** per governance rules:
   - New nodes enter as `discovered` (or `surveyed` if evidence is comprehensive)
   - Existing node status only advances, never regresses
   - New edges enter as `confirmed` (if observed in evidence) or `inferred`
     (if deduced from URL patterns / sidebar structure)
   - Existing `inferred` edges upgrade to `confirmed` when observed
5. **Update coverage metrics** in `meta.coverage`
6. **Increment** `meta.version`
7. **Write** updated chart to `memory/chart.yaml`

### Ground Truth Verification
Moored: Ground-truthing — validating maps against direct field observation.

Before advancing a node from `discovered` to `surveyed`, the Desk
Analyst performs ground truth verification:

1. **Load the most recent screenshot** of the surface from evidence
   artifacts. This is the "boots on the ground" — raw visual reality.
2. **Produce a field observation:** Describe what is visible on the
   surface WITHOUT consulting the invariant bundle. Free-form, capture
   everything: layout, components, interactive elements, navigation,
   state indicators.
3. **Diff against invariant bundle:** Compare the field observation
   against the applicable invariant checklist. Two kinds of discrepancy:
   - **Bundle miss:** Something in the field observation is NOT in the
     invariant bundle. Record as `observations_beyond_invariants` on
     the node. This signals the bundle may need expansion.
   - **Bundle unverifiable:** An invariant in the bundle has no
     corresponding evidence. Record which invariants could not be
     evaluated — the node stays `discovered` until evidence covers them.
4. **Advance decision:** Only advance to `surveyed` if all applicable
   invariant categories have been evaluated AND the field observation
   has been cross-checked. `observations_beyond_invariants` does not
   block advancement — it flags the bundle for review.

Ground truth prevents invariant bundles from becoming satellite imagery.
The screenshot IS the field visit — unprocessed, unprejudiced.

### Discovery from Evidence Sources

| Evidence Source | Discovery Method | Initial Status |
|---|---|---|
| Phase 3 cross-action recording | Observed navigation target | `discovered` (node), `confirmed` (edge) |
| Sidebar navigation snapshot | Visible menu entries | `discovered` (node), `inferred` (edge) |
| Object-type selector | Dropdown options | `discovered` (node), `inferred` (edge) |
| Network request URLs | API endpoint patterns | `discovered` (node) |
| Element manifest (comprehensive) | Full surface inventory | `surveyed` (node) |
| Breadcrumb / URL bar | Route structure | `discovered` (node), `inferred` (edge) |

### Edge Discovery

| Source | Edge Type | Initial Status |
|---|---|---|
| Form submit -> redirect observed | navigation | `confirmed` |
| Button click -> panel/modal open | trigger | `confirmed` |
| Sidebar link -> page load | navigation | `inferred` (until observed) |
| Object-type selector -> view switch | navigation | `inferred` (until observed) |
| Breadcrumb link -> page load | navigation | `inferred` (until observed) |

---

## Coverage Assessment

Metrics computed on each chart update and stored in `meta.coverage`.

| Metric | Calculation |
|---|---|
| `nodes.total` | Total nodes in chart |
| `nodes.unmapped` | Nodes with status `unmapped` |
| `nodes.discovered` | Nodes with status `discovered` |
| `nodes.surveyed` | Nodes with status `surveyed` |
| `edges.total` | Total edges in chart |
| `edges.confirmed` | Edges with status `confirmed` |
| `edges.inferred` | Edges with status `inferred` |
| `regions` | Count of distinct regions |

---

## Surface Context Cards
Moored: Chart Extract / Tactical Navigation Aid (Maritime Navigation)

When the Chief Analyst needs SURFACE_CONTEXT for a Field Agent
dispatch, a full chart load is unnecessary. Instead, extract a
**Surface Context Card** — a fixed-size subset of the chart scoped
to the target surface:

1. **Target node** — the node being captured (status, type, surveys)
2. **Direct edges** — inbound and outbound edges from the target node
3. **Shared components** — components listed on the target node
4. **Invariant bundle** — the applicable checklist for the node's type

**Extraction protocol:**

1. Load `memory/chart.yaml`
2. Extract `nodes[target-id]` — if not found, card is `null` (unmapped surface)
3. Extract all edges where `from == target-id` OR `to == target-id`
4. Extract `shared[component-id]` for each component in the node's `components` list
5. Look up `invariant_categories` from `node_types[node.type]`
6. Return the card — never the full chart

**Card size:** O(1) — bounded by the target node's direct connections,
not by chart total size. Safe to inline in FIELD_BRIEF composition
without context pressure.

---

## Chart Consumption (Read-Only)

The chart is consumed read-only by agents outside this department.
No agent other than the Desk Analyst executing this protocol may
modify the chart.

| Consumer | When | What They Extract |
|---|---|---|
| Admiral (B-001) | Mission planning, triage | Node statuses (surveyed vs discovered) to identify coverage gaps and collection priorities. `surveys` timestamps to assess recency. Region map for scoping. |
| Chief Analyst (B-003) | Surface context assembly (step 6) | Outbound edges from target node for `downstream` field in SURFACE_CONTEXT. Adjacent nodes for `user_journey` context. Node type for capture depth guidance. |
| Desk Analyst (B-006) | Analysis methodology | Applicable invariant bundle for the surface's node type. `observations_beyond_invariants` from prior cartography for awareness. |
| Integration (B-004) | Navigation implementation | Edges to/from the surface being built. Shared components that appear on the target surface. Adjacent surfaces for integration testing. |

---

## Invariant Bundle Governance

Invariant bundles are starting points, not ceilings. They define the
minimum checklist for "surveyed" status — they don't cap what can be
observed on a surface.

**Adding a new node type:**
1. Evidence reveals a surface that doesn't fit existing types
2. Desk Analyst records `observations_beyond_invariants` during
   ground truth verification
3. Chief Analyst notes the gap in INTEL_RETURN
4. Admiral surfaces to Director — Director decides whether to add the type
5. New type added to this file with invariant bundle

**Expanding an existing bundle:**
Same pattern: ground truth reveals behaviors not in the bundle →
flagged via `observations_beyond_invariants` → surfaces to Director.

Bundles grow through evidence, not through prediction.

---

## Operational Note

Cartography is token-intensive — loading the full chart, processing
evidence, and producing field observations consumes significant context
window. The Chief Analyst should be aware of this cost when composing
multi-step operations. Chart enrichment is secondary to dossier
production (see `intelligence.md` step 11: non-blocking).
