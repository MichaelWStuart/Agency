# Agency Compression Plan

5 waves, each completable in one focused pass. Each wave builds on
the prior — terminology fixes before deduplication, deduplication
before seam alignment, seams before constraints.

After all waves: agency is structurally compressed. Resume operations
with queued missions (`plans/next-missions.md`).

---

## Wave 1: Spine & Terminology — COMPLETE

Fix the terms everything else depends on. If the vocabulary is
ambiguous, every downstream fix risks using the wrong word.

| ID | Finding | File(s) | Change |
|---|---|---|---|
| T-02 | Division/Branch overlap — same instances, two terms | `SKILL.md` | Resolve: Division = operational sub-system (Intel, Production). Branch = any top-level org unit (operational, institutional, infrastructure). Division is a subtype of Branch. Add one clarifying line to Spine. |
| T-04 | "Manifest" overloaded (4 meanings) | `templates.md`, `loading-dock.md` | Rename Loading Dock artifact from "manifest" to "inventory" in both template and department file. Preserves `manifest-v1` template ID for backwards compat but adds `alias: inventory-v1`. |
| T-05 | Log/Stream/Events — three systems, no unified description | `SKILL.md` | Add "Logging Architecture" section defining all three tiers: Agency log (operation-level), Production log (department-level), Agent streams (real-time per-identity). Schema, lifecycle, consumers for each. |
| T-03 | Bunk/Entity/Agent/Identity — four words for related concepts | `SKILL.md` | Add "Agent" to the Spine as an informal alias: "Agent is the colloquial term for any identity instance in operation." |
| U-05 | Inventory Report vs Manifest naming | `loading-dock.md` | Resolved by T-04 rename |

**Deliverable:** Clean vocabulary. Every term in the system has one meaning.

---

## Wave 2: Deduplication

Establish canonical locations. Replace copies with pointers. Largest
volume of changes but each is mechanical — find the duplicate, delete
it, insert a pointer.

| ID | Finding | Canonical Location | Duplicates to Remove |
|---|---|---|---|
| R-01 | Operation close (5 steps) | `cic/services.md` | `executive-officer.md` lines 271-277 — already has pointer, remove restated steps |
| R-10 + C-01 | Inline collection procedures (SCOPE, LANDSCAPE, COORDINATION, QA_FINDINGS) | `intelligence.md` steps 4a-4d | `chief-analyst.md` lines 89-113 — replace with pointer to `intelligence.md` |
| R-03 | Escalation cascade | `primitives.md` RESOLVE | `payloads.md` Cascade Protocol — keep (adds stacking detail, legitimate specialization). `production.md` Escalation Protocol — keep (adds checkpoint behavior). No action needed — these are specializations, not copies. |
| R-04 + C-07 | PRODUCTION_RETURN STATUS constraints | `payloads.md` lines 144-149 | `production-orchestrator.md` lines 76-83 — replace enforcement detail with reference + procedural addition only. `shipping.md` Pre-Return Assertion — keep (adds `gh pr view` mechanical check, legitimate specialization). |
| R-07 + C-02 | Station-QC-Ship loop | `production.md` lines 48-55 | `shop-floor.md` lines 120-131 — replace with pointer + identity-specific additions only |
| R-08 | Event emissions in department files | Each department file (canonical per department) | `production.md` event code table duplicates department-level tables. Keep `production.md` as the master registry. Remove department-level tables and pointer-reference `production.md`. |
| R-06 | Inline validation commands | Campaign MEMORY (QC Gates) | `bulletin.md` partial restatement — replace with pointer |
| R-09 | Dossier promotion | `intelligence.md` step 12 | `analysis.md` Warm Tier Promotion section — replace with pointer |
| C-06 | Wardroom roster nearly empty | Evaluate | If all content is pointer-references to `registry.json` and identity files, absorb into `cadre/` root or remove. |

**Deliverable:** Each concept lives in one place. Downstream files pointer-reference.

---

## Wave 3: Seam Alignment — COMPLETE

Fix shapes at boundaries where one component's output becomes
another's input. These are where compression opportunities concentrate.

| ID | Finding | Seam | Change |
|---|---|---|---|
| S-03 + C-05 | Gate Report — 3 competing shapes | QC → Orchestrator | Unify: `qc.md` produces per `gate-report-v1` template. `payloads.md` QC_RETURN references template by pointer. Remove inline text format from `qc.md`. |
| S-06 | Missing BROWSER_TOOL field in FIELD_BRIEF | Chief Analyst → Field Agent | Add `BROWSER_TOOL: {chrome-devtools \| playwright}` to FIELD_BRIEF payload in `payloads.md`. |
| S-02 | Agency log vs Production log schema mismatch | Operation → Archive | Align column names: both use `Time \| Source \| Event \| Detail`. Update `production.md` log format header. |
| S-04 | Dossier index produced but never consumed by name | Intelligence → XO/Refinery | Add explicit consumption reference in `executive-officer.md` Mission Protocol and `refinery.md` Feedstock Initialization. |
| S-01 | SURFACE_CONTEXT assembly is prose, not schema | Chief Analyst → Field Agent | The payload already has typed fields. The prose in `intelligence.md` step 6 is the assembly procedure. No template needed — but add a cross-reference from the prose to the payload field definitions in `payloads.md`. |
| S-05 | Chart governance underspecified at consumer | Desk Analyst | Change `desk-analyst.md` "DIRECTIVE-mutable chart updates" to "DIRECTIVE-governed chart updates (append-only, status-advance-only per `cartography.md`)." |

**Deliverable:** Every boundary crossing has aligned shapes on both sides.

---

## Wave 4: Moorings & Constraints — COMPLETE

Add moorings to load-bearing concepts. Add missing constraints that
create audit surfaces.

| ID | Finding | Change |
|---|---|---|
| U-01 | Stream Logging unmoored | Add mooring: "Moored: Ship's Status Board / EOOW Log (Naval Engineering Watch)" — real-time operational state for the watch officer. |
| U-04 | Assay unmoored | Absorb under Refinery mooring: "Feedstock, Assay, and Fractionation are sub-concepts of the Fractional Distillation mooring." One line in `refinery.md`. |
| U-03 | SURFACE_CONTEXT unmoored | Add mooring to `intelligence.md` step 6: "Moored: Intelligence Preparation of the Battlefield — SURFACE_CONTEXT is the IPB product for a single surface." Connects to existing INTAKE mooring. |
| M-02 | Identity files can accumulate division logic | Add constraint to `primitives.md` ALLOWLIST or to a cadre-level rule: "Identity files define persona, permissions, context contract, and relationship map. Operational procedures live in division/department protocols. Identity files pointer-reference protocols — they do not duplicate them." (Wave 2 deduplication enforces this mechanically; this adds the stated constraint.) |
| M-04 | Bulletin signals have no expiry mechanism | Add to `bulletin.md`: "Organizational Signals are reviewed on mission close. The XO clears resolved signals and updates active ones as part of Operation Close." Add step to XO Operation Close. |
| M-01 | XO approval boundary is distributed | Add explicit rule to `executive-officer.md`: "Director approval is required for: triage actions, strategy selection, mission creation, escalation responses. Director approval is NOT required for: return processing, Ship Gate auto-launch, CIC lifecycle protocols." |
| M-05 | No constraint on Production reinterpreting dossier findings | Add to `refinery.md` below Scope Authority: "Finding interpretation: Refinery consumes dossier gap severity and priority as-is. It does not re-classify severity. Priority bands (P0-P3) drive fractionation order. Severity drives nothing in Production — it is Intelligence's assessment, consumed by QC." |
| M-07 | Stream file creation doesn't handle stale state | Add to CIC Lifecycle Protocol normal close: "Clear `~/.claude/agency-workspace/streams/`" (already present in XO Operation Close but not in CIC services.md). Ensure both locations agree. |
| G-05 | Bulletin standing orders SO-002-006 are blank references | Inline the actual critical rules from campaign MEMORY into the bulletin, or restructure: SO-001 is the only standing order, the rest are campaign-loaded context via the muster routine (action-based context, not container loading). |

**Deliverable:** Load-bearing concepts are moored. Implicit rules are explicit constraints.

---

## Wave 5: Cleanup — COMPLETE

Remove complexity that doesn't earn its keep. Finalize.

| ID | Finding | Action |
|---|---|---|
| X-01 | Timing profiles — defined capability, no consumer | Remove from `collection.md` Phase 3. Keep `timing_profile: {path \| null}` in evidence template (null is valid). Remove the 10-line capture protocol. If timing becomes needed later, re-add with a consumer. |
| X-04 | Unused chart node types (6 of 12) | Remove invariant bundle stubs for types with no instances. Keep the type definitions (they're 1-line forward declarations, low cost). Remove empty invariant bundles that add 20+ lines each of template. |
| X-02 | Manifest template and Loading Dock prose overlap | Resolved by Wave 1 T-04 (rename) + Wave 2 deduplication. Verify no residual overlap. |
| X-03 | Evidence template snapshots vs dom_hierarchy | Clarify in template: `dom_hierarchy` = resting-state a11y snapshot, `snapshots` = interaction-state a11y snapshots (multiple). Add one comment line to template. |
| G-01 | Critical rules in campaign only, not agency-enforced | Resolved by Wave 4 G-05 (bulletin restructure). Verify the bulletin now carries actionable constraints, not blank pointers. |
| G-06 | Evidence cleanup timing ambiguous | Resolved by Wave 4 M-07 (CIC services alignment). Verify both cleanup paths (XO Operation Close + CIC normal close) agree. |
| — | Final coherence check | Re-read all modified files. Verify no new redundancies introduced by the compression itself. |

**Deliverable:** System is lean. No dead mechanisms. Ready for operations.

---

## Execution Notes

- Each wave is one session pass. Start fresh, read the files, execute, verify.
- Waves are sequential — don't start Wave 2 until Wave 1 terms are settled.
- After Wave 5: update `memory/work-log.md`, update MEMORY.md if agency structure changed.
- Then: resume operations with `plans/next-missions.md`.
