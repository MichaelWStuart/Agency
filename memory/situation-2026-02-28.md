# Work Situation Report — 2026-02-28

> Captured at end of planning session. To be consumed by the first
> calibration operation after the Agency refactor is implemented.

---

## The Problem

We shipped two epics (Contacts, Lists) believing the scope was the
Linear tickets. The actual scope is **everything inside the contacts
view** — all nested functionality, not pixel-perfect but close to the
reference app in position, hierarchy, and size. We built what tickets
said, not what the reference app shows.

---

## Contacts Epic (ROM-6)

### Status: Ready for QA (all 7 child features)

| Feature | Ticket | Status |
|---|---|---|
| Creating Contacts | ROM-7 | **In QA** — 13 bugs filed |
| Viewing Contacts | ROM-29 | Ready for QA |
| Editing Contacts | ROM-46 | Ready for QA |
| Deleting Contacts | ROM-60 | Ready for QA |
| Contact Filtering and Search | ROM-66 | Ready for QA |
| Contact Sorting | ROM-79 | Ready for QA |
| Contact Column Customization | ROM-85 | Ready for QA |

### QA Bug Flood (13 triage bugs on ROM-7 alone)

Filed by Aan Arakal on 2026-02-28, all under Creating Contacts:

- ROM-779: Duplicate email should fail
- ROM-777: Info icon popup content different
- ROM-776: Lead Status placeholder wrong
- ROM-775: Lead Status search missing in dropdown
- ROM-774: Info icon missing in phone number popup
- ROM-773: Invalid phone number defaults to US (+1)
- ROM-772: Contact creation overlay helper text missing
- ROM-768: Life Cycle Stage search missing in dropdown
- ROM-767: Life Cycle Stage placeholder wrong
- ROM-766: "Edit this form" link missing
- ROM-765: Contact owner not pre-populated
- ROM-764: Create Contact opens popup instead of drawer
- ROM-763: Creation fails with only email

**Pattern:** These are all behavioral fidelity issues — the reference app
does X, we do Y. Not crashes or missing features, but wrong UX details.
Every one of these was discoverable by comparing our implementation to
the reference app. This is exactly what the calibration strategy is for.

### Completely Skipped

- **Advanced Filters** — the full modal/drawer filter experience from
  the reference app. We have FilterEditor (inline AND/OR groups) but
  not the advanced filter panel/modal.
- **RANGE filter operators** — BETWEEN is explicitly skipped in code
- **Quick filter pills** — framework exists, contacts doesn't use them

### Placeholder Features Shipped as "Done"

| Feature | Status |
|---|---|
| Revenue tab | Placeholder (UI only, no data) |
| Intelligence tab | Placeholder (AI insights "coming soon") |
| Breeze record summary | Placeholder (non-functional) |
| Attachments association section | Placeholder |
| Merge duplicates | Partially stubbed |

### Backlog Items

- ROM-735: Audit & fix behavioral timing gaps — Contacts (Backlog)
- Various cross-entity association tickets in Backlog

---

## Lists Epic (ROM-365)

### Status: Ready for QA (all 5 child features)

| Feature | Ticket | Status |
|---|---|---|
| Viewing Lists | ROM-383 | Ready for QA |
| Creating Lists | ROM-366 | Ready for QA |
| Editing Lists | ROM-399 | Ready for QA |
| Managing List Membership | ROM-393 | Ready for QA |
| Deleting Lists | ROM-405 | Ready for QA |

### Not Started

- QA hasn't begun on any Lists feature
- No QA assignee for Lists
- ROM-736: Audit & fix behavioral timing gaps — Lists (Backlog)

### Missing/Partial

- Folder management (endpoints exist, no UI)
- List-to-list membership copying
- DYNAMIC → SNAPSHOT conversion
- Saved filter views ("My Lists", "Recently Updated")

---

## Filter Architecture — Analysis Needed

Three distinct filter surfaces exist in the reference app:

1. **Quick Filters (pills bar)** — toolbar row of filter pills (Owner,
   Lead Status, Lifecycle Stage, Date Range). Framework exists in our
   codebase with dedicated dropdown components. Contacts doesn't use them.

2. **FilterEditor (inline)** — AND/OR group-based filter builder in the
   toolbar area. This is what we shipped. It's the base infrastructure.

3. **Advanced Filters (modal/panel)** — full-screen or drawer-based
   filter experience. `AdvancedFiltersPanel` exists as a legacy component
   but isn't wired up. **Completely skipped.**

**Action needed:** Scrape the reference app to definitively map:
- Which is the "main" filter (hypothesis: quick filter pills)
- Which is the "advanced" filter (hypothesis: the full modal experience)
- How they interact with each other
- What operators/features exist in advanced that we don't support

---

## Mock Data Gap

Current seed data is tiny — a handful of contacts. Cannot test:
- Pagination behavior (25/50/100 records)
- Empty state handling
- Performance with realistic data volumes
- Filter behavior with diverse data

Need: seed data generation strategy for various test scenarios.
The `contacts-100.json` seed file exists but may not cover all cases.

---

## Recent Team Activity

### Open Deals PRs (v2 rewrite staged)
PRs #200-209 are all open Deals epic PRs awaiting review. Large batch.

### Recent Merged (infrastructure)
- PR #213: Collapsible side nav
- PR #212: Extract DashboardLayout, fix icons, unify colors
- PR #211: Add view picker to tasks page
- PR #210: Replace TaskActivityOverlayForm with CreateTaskModal
- PR #199: DraggableModal with context
- PR #196: Column resize, reorder, sort

### Project Timeline
- Start: 2026-02-09
- Integration milestone: 2026-03-09 (66% progress)
- Delivery milestone: 2026-04-13 (27% progress)

---

## Deferred: Calibration Loop Internals

The calibration strategy's shape and structure are defined in the Agency
LAYOUT.md (P11, calibration.md). The internal mechanics — loop termination
criteria, convergence thresholds, delta classification granularity — are
deliberately deferred. These will be honed through practice during actual
QA calibration work below. The system must scale and the shape must be
complete, but tuning happens under load, not in a blueprint.

---

## Recommended Calibration Order

After Agency refactor is implemented:

1. **Contacts Creating (ROM-7)** — 13 bugs already identified. Fix these
   first as they're blocking QA progression. Use calibration strategy:
   Intelligence sweep → Production fix → Intelligence verify.

2. **Contacts Remaining Features** — Sweep the other 6 features before
   QA gets to them. Proactive calibration prevents another bug flood.

3. **Advanced Filters** — Reference app scrape first (Intelligence/Collection),
   then build. This is net-new scope, not calibration of existing work.

4. **Lists Epic** — QA hasn't started. Proactive calibration before QA
   assignment prevents the same pattern.

5. **Timing Audits (ROM-735, ROM-736)** — These measure behavioral timing
   for RL agent training fidelity. Important but lower urgency than
   functional gaps.

---

## Key Codebase Locations

### Contacts
- List view: `components/contacts/contacts-content/`
- Record detail: `components/contacts/contact-record-content/`
- Create form: `components/contacts/create-contact-sheet/`
- Preview panel: `components/contacts/contact-preview/`

### Filters
- FilterEditor: `components/filters/`
- CRM list layout: `components/crm-list-layout/`
- Filter hooks: `components/filters/hooks/`
- Bridge: `lib/filters/bridge.ts`

### Lists (Segments)
- List view: `components/segments/list/`
- Detail view: `components/segments/detail/`
- Create dialog: `components/segments/create-list-dialog.tsx`

### Associations
- Panel: `components/records/associations-panel.tsx`
- Cards: `components/records/association-card.tsx`

### E2E Tests
- Specs: `app/e2e/specs/`
- Fixtures: `app/e2e/fixtures/`
- Seed data: `prisma/seed/json/`
