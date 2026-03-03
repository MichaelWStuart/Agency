# Analysis Department

> Synthesize raw evidence into structured dossier artifacts.
> Evidence in, intelligence out.
>
> **Executor:** Desk Analyst (B-005, Scribe). This protocol is loaded
> by the Desk Analyst on launch — not executed inline by the Chief Analyst.

---

## Department I/O

**Input:** Evidence artifact pointers (from Collection) or direct analysis instruction
**Output:** Dossier artifact at `~/.claude/agency-workspace/dossiers/` (hot tier — promoted to warm by Chief Analyst)

---

## Dossier Production

### Dossier Types

| Type | Instruction | Input | Output |
|---|---|---|---|
| Reference | `INTEL.ANALYZE.REFERENCE` | Evidence from reference app capture | Dossier (reference) — what the reference app does |
| Delta | `INTEL.ANALYZE.DELTA` | Evidence from both reference + implementation | Dossier (delta) — gaps between reference and our app |
| Convergence | `INTEL.VERIFY.CONVERGENCE` | Delta dossier + branch state | Dossier (convergence) — verification of calibration fixes |

---

## 4-Layer Comparison Methodology

Comparison proceeds through four layers. Each layer produces verdicts
per item: **MATCHED** | **MISSING** | **EXTRA** | **MISMATCHED**

```
Layer 1: Surface Inventory  — Do the same surfaces exist?
Layer 2: Element Inventory  — Do they contain the same elements?
Layer 3: Element State      — Do elements have the same defaults/content/options?
Layer 4: Interaction Behavior — Do triggers produce the same outcomes?
```

**Layer 1** uses surface names/URLs.
**Layer 2** uses element manifests from evidence.
**Layer 3** uses resting-state snapshots.
**Layer 4** uses behavioral sequence recordings from interaction captures.

### Enhanced Evidence Types

When evidence includes Phase 2b (edge case) and Phase 3 (cross-action)
recordings, incorporate them into the 4-layer comparison:

- **Layer 4 (Interaction Behavior)** now includes:
  - Validation behavior (error messages, field highlighting, recovery)
  - Edge case responses (invalid input handling, boundary behavior)
  - Cross-action behavior (duplicate handling, form state persistence)
  - Component-internal behavior (dropdown search, typeahead, scroll)

If edge case evidence is missing from one side (reference unverifiable
due to iframe), flag the gap as `unverifiable` — neither confirmed nor
denied. These go in a separate section of the dossier for manual QA
verification.

---

## Behavioral Fidelity Taxonomy

6 categories for gap classification:

| Category | Definition | Example |
|---|---|---|
| `missing` | Feature in reference, entirely absent in ours | Search in dropdown, info icon |
| `type_mismatch` | Same feature, different component type | Popup instead of drawer |
| `content_mismatch` | Same component, different text/options | Wrong placeholder, wrong popup text |
| `behavior_mismatch` | Same content, different interaction result | Invalid phone defaults to US instead of error |
| `state_mismatch` | Same element, different default/initial state | Contact owner not pre-populated |
| `cosmetic` | Visual differences that don't affect function | Label wording, spacing |

---

## Reference Dossier Production

1. **Load evidence** artifacts at pointer paths
2. **For each surface** in the evidence:
   a. Extract structural patterns (element manifest, resting-state snapshot)
   b. Extract behavioral patterns (network behavior, timing)
   c. Identify key components, interactions, data flows
3. **Classify findings** by severity and category:
   - Severity: critical, major, minor, info
   - Category: missing, type_mismatch, content_mismatch, behavior_mismatch, state_mismatch, cosmetic
4. **Produce dossier** per template (`templates.md`: dossier-reference-v1)
5. **Write** to `~/.claude/agency-workspace/dossiers/{domain}-reference-{timestamp}.yaml`

---

## Delta Dossier Production

1. **Load evidence** from both reference and implementation captures
2. **Layer 1 — Surface Inventory:** Compare surface lists. Flag MISSING
   or EXTRA surfaces.
3. **Layer 2 — Element Inventory:** For each matched surface, compare
   element manifests. Flag MISSING or EXTRA elements.
4. **Layer 3 — Element State:** For each matched element, compare
   resting-state properties (defaults, content, options, ARIA attributes).
   Flag MISMATCHED elements.
5. **Layer 4 — Interaction Behavior:** For each matched element with
   interaction recordings, compare behavioral sequences. Flag
   MISMATCHED behaviors.
6. **Classify gaps** using structured finding format:
   - Surface, component, element, layer
   - Category (from 6-category taxonomy)
   - Severity: critical, major, minor, cosmetic
   - Expected (reference) vs actual (implementation)
   - Fix scope: S (single file), M (2-5 files), L (6+ files)
7. **QA cross-reference** (if prior findings provided — see below)
8. **Produce dossier** per template (`templates.md`: dossier-delta-v1)
9. **Write** to `~/.claude/agency-workspace/dossiers/{domain}-delta-{timestamp}.yaml`

---

## Severity Classification

| Severity | Definition | Example |
|---|---|---|
| Critical | Core functionality broken or missing | Search doesn't work, data not loading |
| Major | Significant behavioral mismatch | Client-side filtering where reference uses server-side |
| Minor | Noticeable but functional difference | Column width, spacing, secondary element |
| Cosmetic | Visual differences that don't affect function | Font weight, icon style, hover effect |

---

## QA Cross-Reference (Optional)

If supplementary awareness (prior QA findings) was provided in the
LAUNCH_BRIEF, a cross-reference can be appended to the delta dossier
as optional metadata. This is not a step in the analysis — it's a
downstream check on methodology effectiveness. It never drives or
constrains the analysis itself.

```yaml
cross_reference:
  confirmed: [{gap_id, finding}]    # Intel found independently
  missed: [{finding, summary}]      # Prior QA found, Intel didn't
  new: [{gap_id}]                   # Intel found, prior QA didn't
```

---

## Convergence Dossier Production

Convergence production is defined in `calibration.md`.

---

## Pattern Recognition

When analyzing evidence, identify recurring patterns:
- **Data flow patterns** — how data moves from API to UI
- **Interaction patterns** — user action sequences
- **Loading patterns** — skeleton, spinner, progressive
- **Error patterns** — how errors are displayed and recovered from

Patterns inform the dossier's recommendation section — they help
Production understand the "shape" of the implementation, not just
individual findings.

---

## Artifact Immutability (LIFECYCLE)

Once a dossier is written, it is never modified. If new evidence
changes the analysis, produce a new dossier with a new timestamp.
The old dossier remains valid for operations that already consumed it.

---

## Warm Tier Promotion

Desk Analysts write dossiers to hot tier (`~/.claude/agency-workspace/dossiers/`).
Promotion to warm tier is Chief Analyst-owned (see `intelligence.md` step 12).
