# Planning
Moored: Fractional Distillation (Petroleum Refining)

> Iterative refinement engine. Takes intelligence artifacts, assays for
> completeness, resolves gaps through escalation (RESOLVE), and decomposes
> into Integration Plots.

---

## Department I/O

**Input:** Intelligence artifacts (dossier, scope, landscape, coordination findings) via `jobs/inventory.md`
**Output:** Sequential Integration Plots (`jobs/ip-{N}.md`)
**Enrichment artifact:** `jobs/feedstock.md` — accumulates resolved findings across Assay loops

### Log Events

| Event | When | Detail |
|---|---|---|
| OP_START | Planning operations begin | — |
| ASSAY_START | Assay begins | Loop iteration N |
| ASSAY_PASS | All gaps resolved, feedstock is pure | — |
| ASSAY_FAIL | Gaps found | What's missing + resolution path |
| OP_COMPLETE | Gap resolved inline | What was resolved |
| FRAC_START | Fractionation begins | — |
| FRAC_COMPLETE | WOs cut | N WOs produced |

---

## Flow

```
Intelligence artifacts (dossier, scope, landscape, coordination)
  -> Receiving (classify, inventory)
    -> Planning reads inventory + intelligence artifacts
      -> Initialize feedstock.md from intelligence artifacts
      -> Assay loop:
          -> Assay: complete?
            -> gaps resolvable inline? -> resolve, enrich feedstock -> loop
            -> gaps need Intelligence? -> Orchestrator escalates (RESOLVE) -> resume with enriched data -> loop
            -> no gaps? -> ASSAY_PASS
      -> Fractionate pure feedstock -> WOs
```

Planning is inline. No sub-agents. Escalation flows through the
Integration Chief, who checkpoints and returns ESCALATION to Captain.

---

## Feedstock

`jobs/feedstock.md` is the enrichment artifact. It starts as a synthesis
of all intelligence inputs and is enriched through Assay iterations.

**Initialization:** On first Planning entry, synthesize intelligence
artifacts into feedstock. Resolve dossier pointers via
`memory/dossiers/index.yaml` when multiple dossiers exist for a domain.
Three primary input sources:
- Dossier findings (domain knowledge, behavioral reference)
- Scope-filtered summary (from scope CSV, filtered to mission scope_areas — "In Scope" rows only)
- QA findings artifact (cross-referenced tickets from INTEL.COLLECT.QA_FINDINGS)

Plus supplementary inputs:
- Scope findings (ticket boundaries, acceptance criteria)
- Landscape findings (existing code assets, patterns)
- Coordination findings (team WIP, overlap risks)

**Enrichment:** Each Assay iteration that resolves a gap updates
feedstock with the new data. Feedstock grows monotonically — data is
added, never removed.

**Produces:** `jobs/feedstock.md`

---

## Assay

Feedstock, Assay, and Fractionation are sub-concepts of the Fractional
Distillation mooring (Planning header).

**Runs inline** — iterative completeness check with resolution loop.

**Input:** Intelligence artifact pointers from `jobs/inventory.md` + `jobs/feedstock.md`
**Output:** "pure" signal OR gap identification with resolution path

### Scope Authority

Integration does not make independent scope decisions. Scope is
determined by three sources: (1) scope CSV "In Scope" rows,
(2) mission `exclusions`, (3) mission `overrides`. Size estimates
(`fix_scope: S/M/L`) affect fractionation — how work is split into
WOs — never scope — what work is done. A large item that is in scope
stays in scope.

**Finding interpretation:** Planning consumes dossier gap severity and
priority as-is. It does not re-classify severity. Priority bands
(P0-P3) drive fractionation order. Severity drives nothing in
Integration — it is Intelligence's assessment, consumed by Validation.

### Assay Checks

1. **Dossier** — does the dossier artifact exist at the pointer path?
2. **Scope CSV loaded?** — filtered scope summary exists in evidence?
   If not, NEED: `SCOPE_DATA` (routine — Captain routes to Intel)
3. **QA findings collected?** — qa-findings artifact exists in evidence?
   If not, NEED: `QA_DATA` (routine — Captain routes to Intel for INTEL.COLLECT.QA_FINDINGS)
4. **Scope findings** — do scope findings exist (if applicable)?
5. **Landscape findings** — do landscape findings exist (if applicable)?
6. **Coordination findings** — do coordination findings exist (if applicable)?
7. **Merge and deduplicate** — merge dossier gaps + QA tickets. Deduplicate
   overlapping items (same surface, same gap description → single entry).
   Filter: exclude items outside scope CSV "In Scope" rows.
   **Override rule:** If the mission manifest contains an `overrides` section,
   items listed there are IN SCOPE regardless of size estimates, fix_scope
   classifications, or any other Integration-internal judgment. Mission
   overrides are Director-authorized and binding — do not exclude them.
8. **Completeness** — does the feedstock contain everything needed
   to cut WOs? Are there domain gaps, unclear boundaries, missing
   acceptance criteria, or unresolved dependencies?

### Gap Resolution (RESOLVE)

When Assay finds gaps, three resolution paths:

| Gap Type | Resolution | Mechanism |
|---|---|---|
| Resolvable within Integration | Orchestrator resolves inline | Re-read dossier, cross-reference artifacts, infer from landscape |
| Needs Intelligence collection | Orchestrator escalates to Captain | ESCALATION with NEED: `REFERENCE_EVIDENCE` or `IMPLEMENTATION_EVIDENCE` |
| Needs additional scope data | Orchestrator escalates to Captain | ESCALATION with NEED: `SCOPE_DATA` |

**Inline resolution:** The Orchestrator reads existing artifacts more
carefully, cross-references findings, or infers missing data from the
landscape. The feedstock is enriched with the resolution. Loop continues.

**Escalation:** The Orchestrator cannot resolve the gap within Integration's
scope (INTAKE — only Intelligence produces intelligence). The Orchestrator:
1. Writes current feedstock state to checkpoint
2. Returns ESCALATION to Captain: `NEED: {need_id}`, `CONTEXT: {gap description}`, `CHECKPOINT: jobs/checkpoints/planning-{timestamp}/`
3. Captain routes to Intelligence (sibling department)
4. Intelligence returns findings
5. Captain re-launches Integration with `INTEG.RESUME` + enriched artifacts
6. Orchestrator resumes, Planning re-runs Assay with new data
7. Loop continues until Assay passes

---

## Calibration-Mode Fractionation (`INTEG.FIX`)

When the instruction is `INTEG.FIX` and the dossier is a delta (gaps
with severity + fix_scope), the Assay loop is minimal — the delta
already has the decomposition. Skip the generic "discover the
landscape" Assay flow and cut directly:

1. **Initialize feedstock** from delta dossier gaps + any scope/landscape
   findings provided
2. **Assay** — verify dossier exists and gaps have severity + fix_scope.
   If not, escalate (malformed delta)
3. **Fractionate by priority band:**
   - P0: critical gaps → first WO(s)
   - P1: major gaps → next WO(s)
   - P2: minor + cosmetic gaps → final WO(s)
   - **Double-marked terrain:** Items with both a dossier gap AND a QA ticket
     receive a priority boost within their band (processed first in band).
   - **QA-only items** (new markers not in dossier) → normal priority within band.
   - **Dossier-only items** → normal priority within band.
4. **Within each band:** group by fix_scope proximity. S-scope gaps on
   the same component cluster into one WO. M/L-scope gaps get their
   own WO if they exceed capacity limits.
5. **Station count estimation:** S → 1 station, M → 1-2 stations,
   L → 2 stations (split at component boundary)

All capacity constraints from generic Fractionation still apply.

---

## Fractionation

**Runs inline** — needs the full picture.

**Input:** Pure feedstock (`jobs/feedstock.md`)
**Output:** Sequential Integration Plots

Integration Plots are sequential — WO N depends on WO N-1 being merged
to `dev`. Each WO is self-contained with everything [COMPILATION]
needs to execute.

Fractionation is independent analysis. If the incoming material
contained WO outlines, they were stripped at Receiving.
Planning cuts based on intelligence artifacts and production
capacity — not on anyone's prior plan.

**Production capacity constraints:**

| Limit | Value | Rationale |
|---|---|---|
| Tickets per WO | 5-10 | More than 10 tickets = too much scope for one review cycle |
| Deliverables per WO | 3-6 | Each deliverable needs full QC including Browser QA |
| Stations per WO | 1-2 | More than 2 = return to Planning and split the WO |

A sub-agent must build AND fully verify every deliverable — including
starting a dev server, navigating pages, checking console output.
A 9-deliverable WO will exhaust context before QC runs. Cut smaller.

**How to cut:**

1. Cut for production capacity first. Each WO must fit within the
   constraints above. If a natural feature seam produces a WO that
   exceeds limits, split along dependency boundaries within the seam.
2. Cut vertical slices — each WO delivers a complete increment
   (schema through UI for its slice), independently shippable.
3. Within each WO, ensure deliverables are parallelizable — any
   two pieces of work that share a dependency (B needs A's output)
   must land in the same station or in separate sequential WOs.
4. Order for dependency: WO N can depend on WO N-1 being merged.
   Foundation layers (schema, API) before consumer layers (UI, flows).
5. Balance the ledger. The manifest is the source of truth for scope.
   Every item in the manifest must appear in exactly one WO.
   If any item is unassigned, fractionation is incomplete.

**Produces:** `jobs/ip-{N}.md`

---

## Checkpoint (LIFECYCLE)

After Fractionation completes (or before escalation), preserve
artifacts as a stage-boundary checkpoint:

```
jobs/checkpoints/planning-{timestamp}/
  feedstock.md       # immutable copy of feedstock at this point
  ip-1.md            # immutable copy of IP-1 (post-fractionation only)
  ip-N.md            # immutable copy of IP-N (post-fractionation only)
```

This enables:
- **Rewind:** "rewind to Planning" -> re-run from checkpoint
- **Escalation resume:** Integration resumes from checkpoint after
  Captain routes to Intelligence and returns enriched artifacts

---

## Feed-Forward

Integration Plots produced -> IP-1 dispatches to [COMPILATION] immediately.
No human gate between Plotting and Compilation. The protocol is the
approval — if fractionation completed, production starts.
Integration Plot N depends on Integration Plot N-1. Ship Gate (`compilation.md`)
enforces this — IP-N+1 does not enter Receiving until IP-N is merged.
