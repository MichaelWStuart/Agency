# Queued Missions

Extracted from `post-mission-changes.md` before archival.
Execute after agency compression is complete.

---

## Next: Contacts Comprehensive

> "Close all remaining gaps on the Contacts views. Compare every Contacts surface
> against the reference app, pull in all open QA tickets for Contacts, and resolve
> everything. Reconcile prior dossier findings against QA tickets — anything QA
> says is still broken gets re-evaluated even if a prior dossier marked it resolved.
> Only things out of scope: AI/Breeze features and shared shell components."

## After: Lists & Filters

> "Build out advanced filtering and quick filters as shared components, then
> implement the Lists view. Pull in QA tickets for Lists and Filters. The filter
> components should be reusable — Contacts already has quick filters as a reference
> pattern. Extend to support advanced filter slide-out and make available for team
> adoption on other views."

---

## Context From Contacts Calibration (for next mission planning)

- **Prior intelligence:** 5 delta dossiers + chart exist in warm tier (`memory/dossiers/`)
- **Surfaces covered:** contacts-list-view, create-contact-form, contact-detail-view
- **PRs shipped:** #251 (quick filters), #256 (list view polish), #260 (create form + detail view)
- **Total gaps resolved:** 49 across 3 operations
- **Known remaining (excluded by design):** progressive disclosure, iframe vs dialog, About tab layout redesign, sidebar nav, account section, global toolbar, AI/Breeze features
- **QA reconciliation protocol** now implemented in Intelligence — first mission to use it

## Scoping System Summary

How scope flows through the agency:

1. **Scope CSV** (`memory/project/scope.csv`) — master list of all tasks, In Scope / Out of Scope
2. **Mission manifest** — narrows to specific `scope_areas` and surfaces. `overrides` for must-not-cut items. `exclusions` for deliberate skips.
3. **Intelligence** — collects within mission scope. Reconciles prior dossiers against QA tickets (T-1 implemented).
4. **Refinery** — filters gaps against scope CSV. Respects overrides. Fractionates into WOs.
5. **QA tickets** — filed by QA in Linear. Discovered via `INTEL.COLLECT.QA_FINDINGS`. Merged with dossier gaps in Assay.
