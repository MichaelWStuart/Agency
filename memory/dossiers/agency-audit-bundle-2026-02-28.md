# Agency Audit Bundle -- 2026-02-28

> Standalone context bundle for auditing the Agency system.
> An agent loading ONLY this file should have enough context to know
> what to read, what to check, and where inconsistencies might lurk.

---

## 1. Complete File Inventory

All paths relative to `~/.claude/skills/agency/` unless noted otherwise.

### Zone 1: Agency Core (`~/.claude/skills/agency/`)

| File | Purpose | Load Timing |
|---|---|---|
| `SKILL.md` | Entry point. Spine (terminology), routing table, strategies, escape hatch (D3), event emission (D12), branches (P16), payload contracts summary, workspace definition. | On boot |
| `primitives.md` | Agency physics. P1-P7 core (immutable), P8-P16 extended (governable). Governance rules. | On boot |
| `contracts.md` | Boundary specification. All payload shapes (LAUNCH_BRIEF, RETURN, ESCALATION, ANDON, BRIEFING) + L2 shapes (FIELD_BRIEF, DESK_BRIEF, FIELD_RETURN, DESK_RETURN) + instruction catalog + escalation NEED values + catalog governance (D16). | On-demand at crossings |
| `templates.md` | Artifact templates. Dossier (reference, delta, convergence), Gate Report, Work Order, Manifest, Standup Report, Evidence, Mission Manifest. | On-demand by producers |
| `LAYOUT.md` | Architecture blueprint (v2). Design decisions D1-D21, seed specs, implementation phases, migration table, zone definitions. | Reference only (not loaded operationally) |

#### Cadre (Institutional Branch)

| File | Purpose |
|---|---|
| `cadre/bridge/roster.md` | Bridge facility roster. B-000 (XO). Facility classification, isolation rules, memory scope. |
| `cadre/bridge/identities/executive-officer.md` | XO identity. Persona, permissions, context contract, routing authority, mission management, relationship map. |
| `cadre/wardroom/roster.md` | Orchestrator registry. B-001 through B-004. Relationship classes (P14), instantiation protocol. |
| `cadre/wardroom/identities/director-of-operations.md` | Dispatch orchestrator (B-001). Persona, permissions, context contract, subordinates. |
| `cadre/wardroom/identities/chief-analyst.md` | Intelligence orchestrator (B-002). Persona, permissions, context contract, subordinates, mission context, auth pre-flight. |
| `cadre/wardroom/identities/production-orchestrator.md` | Production orchestrator (B-003). Persona, permissions, context contract, subordinates. |
| `cadre/wardroom/identities/attache.md` | Foreign Affairs orchestrator (B-004). Persona, permissions, context contract (no subordinates). |
| `cadre/barracks/roster.md` | Worker registry. Complement table (D19), B-005 through B-010. Relationship classes, instantiation protocol, future extensions. |
| `cadre/barracks/identities/field-agent.md` | Intelligence L2 worker (B-005 Hawk, B-010 Kite). Evidence capture, 3-phase protocol, auth detection. |
| `cadre/barracks/identities/desk-analyst.md` | Intelligence L2 worker (B-008 Scribe). Dossier synthesis, 4-layer methodology, QA cross-reference. |
| `cadre/barracks/identities/station-worker.md` | Production L2 worker (B-006 Mason, B-009 Slate). Station loop (build -> QC -> ship), P1 transition to Quinn. |
| `cadre/barracks/identities/inspector.md` | QC inline identity (B-007 Quinn). Gate sequence, independence, P1 transition rules. |
| `cadre/armory.md` | Shared capabilities. Browser automation (Chrome DevTools vs Playwright), seed data, evidence capture, external systems. |
| `cadre/bulletin.md` | Standing orders (SO-001 through SO-006). Known constraints (context limits, CursorBot, CI). Organizational signals. |

#### Divisions (Operational Branches)

| File | Purpose |
|---|---|
| `divisions/dispatch/dispatch.md` | Dispatch protocol. Triage, strategy awareness, return handling (INTEL/PROD/FA/ANDON), sub-agent launching, BRIEFING output, log emission. |
| `divisions/intelligence/intelligence.md` | Intelligence entry point. Department routing, orchestrator protocol, sub-agent architecture, resource coordination, auth escalation protocol. |
| `divisions/intelligence/collection.md` | Collection department. 3-phase capture protocol (breadth/depth/stateful), granularity model, core interaction loop, evidence artifacts, reference app URL patterns, network/timing capture. |
| `divisions/intelligence/analysis.md` | Analysis department. 4-layer comparison methodology, behavioral fidelity taxonomy (6 categories), severity classification, QA cross-reference protocol, dossier production (reference, delta, convergence). |
| `divisions/intelligence/calibration.md` | Calibration department. Convergence checking, convergence decision matrix, operating parameters (starter values), delta classification. |
| `divisions/production/production.md` | Production entry point. The Line (5 departments), orchestration model, escalation protocol (P13), workspace layout, log protocol, intelligence input (P11), shared tooling. |
| `divisions/production/loading-dock.md` | Receiving and classification. Material types (crude/feedstock/WO/product/verified), incoming inspection, contaminant stripping, artifact quarantine, inventory report. |
| `divisions/production/refinery.md` | Iterative refinement. Feedstock initialization/enrichment, Assay loop (completeness check + gap resolution via P13), Fractionation (WO decomposition with capacity constraints), checkpointing. |
| `divisions/production/shop-floor.md` | Build execution. Branching model, receiving, routing (station count), station execution (sub-agent I/O), orchestrator verification, checkpoints, rework. |
| `divisions/production/qc.md` | Quality control. 5-gate sequence (Validation, FC Audit, Browser QA, Network, E2E) + Verdict. Gate Report format. Circuit breakers. Independence from Shop Floor. |
| `divisions/production/shipping.md` | Delivery. Two modes (station/WO shipping). Logistics check, conflict routing, PR creation, CI Gate, Review Gate, Delivery (ticket transitions), Closeout. |
| `divisions/foreign-affairs/foreign-affairs.md` | External coordination. Standup report protocol (FA.STANDUP), data sources (git/GitHub/Linear), cutoff time, report generation, future extensions. |

#### Other

| File | Purpose |
|---|---|
| `workspace/log.md` | Ephemeral event log. Currently has entries from a prior operation (ROM-424). |
| `ui/hierarchy.html` | Agency hierarchy visualization (moved from repo per D7). |
| `ui/factory.html` | Production pipeline visualization (moved from repo per D7). |

### Zone 2: Project Overlay (`~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/`)

| File/Dir | Purpose | Status |
|---|---|---|
| `MEMORY.md` | Auto-memory. Agency summary, division table, project constraints, key pointers. | Exists, updated |
| `config.md` | Bootstrap configuration. Org context, project mapping, API key refs, ports. | Exists |
| `work-log.md` | Append-only work history. | Exists |
| `project/context.md` | HubShot project context. | Exists |
| `project/conventions.md` | Code rules, PR template, CursorBot process. | Exists |
| `project/coordination.md` | Team coordination protocol. | Exists |
| `project/failure-class-catalog.md` | Quality manual / known failure patterns. | Exists |
| `dossiers/` | Warm tier. Contains `p13-autonomous-resolution.md`. | Exists (1 file) |
| `events/` | Cold tier. Contains `README.md` with format spec. | Exists (1 file) |
| `missions/` | Mission manifests directory. | Exists (empty) |
| `archive/` | Reserved for documentation system (D13). | Exists (empty) |
| `situation-2026-02-28.md` | Situational awareness snapshot. | Exists |
| `implementation-brief.md` | Implementation plan for the restructure. | Exists |
| `intelligence-design-brief.md` | Intelligence protocol design brief. | Exists |
| `intelligence-gap-assessment.md` | Gap assessment for intelligence design. | Exists |
| `intelligence-investigation-findings.md` | Investigation findings for intelligence. | Exists |

---

## 2. Current Architecture Summary

### Hierarchy

```
[DIRECTOR] (human)
    |
[AGENCY] -- root Claude context (kernel)
    | loads: primitives.md + SKILL.md + XO identity
    |
    +-- [XO / Executive Officer] (B-000) -- Bridge facility
    |     Default identity. Routes intent. Manages missions.
    |     Peer relationship with all L1 orchestrators.
    |
    +-- INLINE (P1) ---------------------+
    |   Director of Operations (B-001)   |  Dispatch division
    |                                    |
    +-- SUB-AGENT (P2) -----------------+
    |   Chief Analyst (B-002)            |  Intelligence division
    |     +-- Field Agent (B-005 Hawk)   |    L2 sub-agents
    |     +-- Field Agent (B-010 Kite)   |    L2 sub-agents
    |     +-- Desk Analyst (B-008 Scribe)|    L2 sub-agents
    |                                    |
    |   Prod Orchestrator (B-003)        |  Production division
    |     +-- Station Worker (B-006 Mason)   L2 sub-agents
    |     |     +-- Inspector (B-007 Quinn)  P1 inline
    |     +-- Station Worker (B-009 Slate)   L2 sub-agents
    |           +-- Inspector (B-007 Quinn)  P1 inline
    |                                    |
    |   Attache (B-004)                  |  Foreign Affairs (via Dispatch)
    |                                    |
    +-- CADRE (Institutional) -----------+
          Bridge:   B-000 (XO)
          Wardroom: B-001, B-002, B-003, B-004 (orchestrators)
          Barracks: B-005-B-010 (workers)
          Armory:   shared capabilities
          Bulletin: standing orders
```

### Facilities

| Facility | Type | Contains | Knowledge Domain |
|---|---|---|---|
| Bridge | Executive | B-000 (XO) | Routing decisions, mission management, escalation handling |
| Wardroom | Orchestrator | B-001 to B-004 | Routing patterns, dispatch optimization, coordination |
| Barracks | Worker | B-005 to B-010 | Implementation craft, tool mastery, quality techniques |

### Identity Registry (Complete)

| Bunk | Callsign | Role | Division | Tier | Facility |
|---|---|---|---|---|---|
| B-000 | XO | Agency Executive | Agency (root) | L0 default | Bridge |
| B-001 | Director | Dir. of Operations | Dispatch | L1 inline | Wardroom |
| B-002 | Analyst | Chief Analyst | Intelligence | L1 sub-agent | Wardroom |
| B-003 | Foreman | Prod Orchestrator | Production | L1 sub-agent | Wardroom |
| B-004 | Attache | Attache | Foreign Affairs | L1 sub-agent | Wardroom |
| B-005 | Hawk | Field Agent | Intelligence | L2 sub-agent | Barracks |
| B-006 | Mason | Station Worker | Production | L2 sub-agent | Barracks |
| B-007 | Quinn | Inspector | Production | L2 inline (P1) | Barracks |
| B-008 | Scribe | Desk Analyst | Intelligence | L2 sub-agent | Barracks |
| B-009 | Slate | Station Worker | Production | L2 sub-agent | Barracks |
| B-010 | Kite | Field Agent | Intelligence | L2 sub-agent | Barracks |

### Relationship Map (P14)

| Identities | Class | Scope Type |
|---|---|---|
| XO <-> Dispatch (Dir. of Ops) | Peer | Orchestrator (L0) |
| XO -> Chief Analyst | Subordinate | Command chain (L0 -> L1) |
| XO -> Prod Orchestrator | Subordinate | Command chain (L0 -> L1) |
| XO -> Attache | Subordinate | Via Dispatch (L0 -> L1) |
| Intelligence <-> Production | Peer | Orchestrator (L0) |
| Dir. of Ops -> Attache | Subordinate | Dispatch -> FA |
| Chief Analyst -> Field Agent | Subordinate | Command chain (L1 -> L2) |
| Chief Analyst -> Desk Analyst | Subordinate | Command chain (L1 -> L2) |
| Prod Orchestrator -> Station Worker | Subordinate | Command chain (L1 -> L2) |
| Mason <-> Quinn | Team | Worker (L2 station) |

### Primitives (P1-P16)

| ID | Name | Classification |
|---|---|---|
| P1 | Identity Transition | Core (immutable) |
| P2 | Sub-Agent Boundary | Core (immutable) |
| P3 | Payload Contract | Core (immutable) |
| P4 | ANDON (Terminal Escalation) | Core (immutable) |
| P5 | Briefing Closure | Core (immutable) |
| P6 | Selection Over Expression | Core (immutable) |
| P7 | Artifact Lifecycle | Core (immutable) |
| P8 | State Externality | Extended (governable) |
| P9 | Ownership Continuity | Extended (governable) |
| P10 | Single Source of Truth | Extended (governable) |
| P11 | Dossier as Input | Extended (governable) |
| P12 | Strategy | Extended (governable) |
| P13 | Autonomous Resolution | Extended (governable) |
| P14 | Identity Relationships | Extended (governable) |
| P15 | Knowledge Isolation | Extended (governable) |
| P16 | Agency Composition | Extended (governable) |

### Design Decisions (D1-D21)

| ID | Name | Status |
|---|---|---|
| D1 | Intelligence Division (replaces Recon) | Implemented |
| D2 | Inline Identity Transitions Are Standard | Implemented |
| D3 | Agency Invocation Escape Hatch | Implemented |
| D4 | The Cadre (Institutional Branch) | Implemented |
| D5 | Project Files Move Out of Production | Implemented |
| D6 | Scraping Protocol Moves to Intelligence | Implemented |
| D7 | Complete Repo Opacity | Implemented |
| D8 | Delete Standalone Skills | Implemented (verify deletions) |
| D9 | Foreign Affairs Division | Implemented |
| D10 | Bootstrap Configuration Layer | Implemented |
| D11 | LAUNCH_BRIEFs Are Instruction Selections | Implemented |
| D12 | Event Emission Protocol | Implemented (structure only, no MCP server) |
| D13 | Documentation System | Deferred (space reserved at `memory/archive/`) |
| D14 | Data Pipeline and UI | Deferred (events directory exists, no MCP server) |
| D15 | Artifact Templates | Implemented |
| D16 | Catalog Governance | Implemented |
| D17 | Identity Relationships (P14) | Implemented |
| D18 | Agency Composition (P16) | Implemented |
| D19 | Complement (Headcount Scaling) | Implemented |
| D20 | Campaign (Sustained Engagement) | Implemented (recognized, not built -- Zone 2 IS campaign) |
| D21 | Mission (Multi-Operation Objective) | Implemented (template exists, directory empty) |

---

## 3. Session Changes (2026-02-28)

This section documents the major structural changes made during the session that produced this audit bundle. The session implemented LAYOUT.md v2 -- a comprehensive restructuring of the Agency architecture.

### 3A. XO and Bridge Introduction

**What changed:** A new identity tier was introduced between the Agency kernel and the division orchestrators.

- **B-000 (XO / Executive Officer)** was created as the Agency's default identity.
- A new **Bridge** facility was added to the Cadre alongside Wardroom and Barracks.
- The Agency kernel now boots into the XO identity by default (loads `primitives.md` + `SKILL.md` + XO identity file).
- The XO makes routing decisions and manages missions directly (AGENCY.MISSION.CREATE, AGENCY.MISSION.UPDATE).
- Dispatch (Director of Operations) is the only P1 inline transition from XO.
- Intelligence and Production are dispatched as sub-agents from XO context.

**Note:** LAYOUT.md v2 does NOT contain Bridge or XO references. These were designed and added during implementation as a refinement beyond the blueprint. The LAYOUT specified the kernel as directly transitioning to identities; the XO adds a persistent executive layer.

### 3B. Intelligence Division Design and Implementation

**What changed:** The Intelligence division was designed from scratch per D1, replacing the former Recon division.

- Three departments created: Collection, Analysis, Calibration.
- Sub-agent architecture: Chief Analyst (L1) dispatches Field Agents and Desk Analysts (L2).
- 3-phase capture protocol for Collection (breadth, depth, stateful).
- 4-layer comparison methodology for Analysis (surface, element, state, behavior).
- Convergence decision matrix for Calibration with deterministic recommendations.
- Auth escalation protocol with checkpoint and resume flow.
- L2 payload shapes added to contracts.md (FIELD_BRIEF, DESK_BRIEF, FIELD_RETURN, DESK_RETURN).
- Evidence template and dossier templates (reference, delta, convergence) created.
- QA cross-reference protocol designed for complementary intelligence.

### 3C. Foreign Affairs Restructure

**What changed:** Foreign Affairs was restructured from inline (P1) to sub-agent (P2) invocation.

- LAYOUT.md D9 originally specified FA as inline (P1 transition).
- Implementation changed FA to a sub-agent launched by Dispatch via LAUNCH_BRIEF.
- The Attache (B-004) operates as a sub-agent with its own LAUNCH_BRIEF/RETURN cycle.
- FA_RETURN payload shape added to contracts.md.
- SKILL.md routing table updated: FA dispatched as "Sub-agent (P2) via Dispatch."

### 3D. Instruction Catalog Expansion

**What changed:** The instruction catalog in contracts.md was expanded beyond the LAYOUT seed.

Instructions added beyond the seed catalog:
- `INTEL.COLLECT.SCOPE` -- query Linear for domain tickets, map boundaries
- `INTEL.COLLECT.LANDSCAPE` -- scan codebase for existing domain assets
- `INTEL.COLLECT.COORDINATION` -- check team WIP, open PRs, overlap
- `INTEL.AUTH.VERIFY` -- verify reference app browser session
- `INTEL.RESUME` -- resume from checkpoint after escalation resolution
- `AGENCY.MISSION.CREATE` -- initialize mission manifest from Director intent
- `AGENCY.MISSION.UPDATE` -- update mission manifest
- `DISPATCH.TRIAGE` -- assess intent and recommend division + strategy

The seed catalog only contained: INTEL.COLLECT.REFERENCE, INTEL.COLLECT.IMPLEMENTATION, INTEL.ANALYZE.REFERENCE, INTEL.ANALYZE.DELTA, INTEL.VERIFY.CONVERGENCE, PROD.SHIP, PROD.FIX, PROD.RESUME, FA.STANDUP.

### 3E. Other Structural Changes

- Mission Manifest template added to templates.md (mission-manifest-v1).
- Complement (D19) implemented in barracks roster with authorized strengths.
- Escalation NEED values section added to contracts.md with `INTEL.AUTH.REFERENCE`.
- Production Orchestrator identity refined with checkpoint discipline and escalation protocol permissions.
- Station Worker identity refined with explicit station loop (9 steps) and P1 transition protocol.
- Dispatch protocol expanded with detailed return handling for all division types.

---

## 4. Known Open Questions and Attention Areas

### 4A. LAYOUT.md vs. Implementation Drift

The LAYOUT.md (v2) was the blueprint but the implementation diverged in specific areas:

1. **XO/Bridge not in LAYOUT.md.** The Bridge facility and XO identity (B-000) were designed during implementation. LAYOUT.md specifies only Wardroom and Barracks for the Cadre. The LAYOUT's architecture model shows the Agency kernel transitioning directly; the implementation added the XO layer. Auditor should verify this is intentional and consistently applied across all files.

2. **FA invocation changed.** LAYOUT.md D9 says FA is "Inline (P1 transition)" with "Attache identity assumed inline, same as Dispatch." The implementation makes FA a sub-agent (P2) launched via Dispatch. SKILL.md routing table says "Sub-agent (P2) via Dispatch." The Attache identity file says "Tier: L1 sub-agent." This is a deliberate change but LAYOUT.md was never updated to reflect it.

3. **LAYOUT roster seed.** The LAYOUT seed roster lists B-004 (Attache) as "L1 inline" with "Peer" relationship. The implementation has B-004 as "L1 sub-agent" with "Subordinate (to Director of Ops)." Consistent in implementation but inconsistent with LAYOUT.

4. **Spine terms.** LAYOUT.md does not include all Spine terms that appear in the implemented SKILL.md: [XO], [BRIDGE], [CAMPAIGN], [MISSION], [COMPLEMENT] were added during implementation.

### 4B. Potential Inconsistencies to Verify

1. **Dispatch persona duplication.** `dispatch.md` lines 9-22 duplicate the persona definition from `cadre/wardroom/identities/director-of-operations.md`. P10 (Single Source of Truth) says "if it exists in two places, one is wrong." The identity file should be the canonical persona; the division protocol should reference it, not duplicate it.

2. **SKILL.md Identity Rule section.** States "Dispatch is the only inline (P1) identity. All divisions are sub-agents dispatched through Dispatch." But later in SKILL.md, the routing table shows Intelligence and Production launched by XO (LAUNCH_BRIEF), not through Dispatch. The Dispatch division protocol also shows Dispatch launching sub-agents (Intelligence, Production, FA). Verify: does the XO or Dispatch launch Intelligence and Production? The current design appears to be: XO makes routing decisions, but Dispatch (as the inline identity) is the one composing and launching sub-agents. This needs clear documentation.

3. **Event source codes.** SKILL.md defines 5 source codes: AGENCY, DISPATCH, INTEL, PROD, FA. The workspace log currently uses "AGENCY" and "DISPATCH" and "PROD" but the event names differ from the protocol (e.g., "INTENT" and "ROUTE" in the log vs. "INVOKED" and "ROUTED" in the protocol).

4. **Workspace log staleness.** `workspace/log.md` contains entries from ROM-424 (2026-02-27). Per P7, this should have been cleaned after the last BRIEFING. Either the log was never cleaned, or the last operation never completed with a BRIEFING.

5. **Inspector complement.** Barracks roster says Inspector complement is "implicitly equals Station Worker complement" but there is only one Inspector identity file (`inspector.md`) with bunk B-007 (Quinn). If Mason and Slate both transition to Quinn via P1, they share the identity template but occupy the same bunk conceptually. Verify whether this is intentional or whether Slate should have a distinct inspector bunk.

6. **Desk Analyst complement.** Barracks roster says complement = 1 (Scribe, B-008). LAYOUT.md seed confirms this. But if Intelligence needs parallel analysis (e.g., two delta dossiers for different surfaces), this is a bottleneck. Verify this is acceptable.

### 4C. Unimplemented LAYOUT Items

1. **Phase 9: Validation.** LAYOUT calls for dry-run testing of both strategies against real tasks. No evidence this has been done yet.

2. **Identity persistence / footlockers.** Barracks roster reserves space for footlockers, roll call, typed memory, last seen. None implemented.

3. **Documentation system (D13).** `memory/archive/` exists but is empty. No documentation artifacts.

4. **Data Pipeline and UI (D14).** Events directory exists with a README. No MCP server, no real-time pipeline.

5. **Stale file cleanup.** LAYOUT migration table lists files to delete: `memory/factory.md`, `memory/loading-dock.md`, etc. Verify these were actually deleted. Also verify `skills/scout/`, `skills/standup/`, `skills/timing-audit/` were deleted.

6. **HTML visualization updates.** LAYOUT Phase 7 calls for updating `hierarchy.html` for the new structure. Files exist in `ui/` but may not reflect the current architecture (Bridge, XO, updated roster).

### 4D. Design Questions

1. **XO vs. Dispatch routing authority.** Who actually composes and sends LAUNCH_BRIEFs? The XO identity says it can "Compose LAUNCH_BRIEFs for sub-agent divisions." The Director of Operations identity lists subordinates and says it "Launch sub-agents via LAUNCH_BRIEF." The Dispatch protocol has detailed sections on launching sub-agents (Intelligence, Production, FA). This appears to be a dual-authority situation. Clarify: does the XO compose briefs directly, or does it P1-transition to Dispatch which then composes them?

2. **Mission management scope.** The XO handles AGENCY.MISSION.CREATE and AGENCY.MISSION.UPDATE directly. But missions reference Intelligence products (dossier chains per surface). How does the XO update mission progress if it cannot read dossiers (per its permission set)? The XO identity says it can "Read and write mission manifests" but the manifest fields include `dossier_chain: [{path}]` which implies awareness of dossier outputs.

3. **Campaign vs. Mission naming.** D20 says Campaign "is recognized, not built" and IS the Zone 2 overlay. But the Spine defines [CAMPAIGN] as a term. Is this term used anywhere operationally, or is it purely conceptual?

---

## 5. Auditor Verification Checklist

### 5A. Structural Integrity

- [ ] Every file listed in Section 1 exists on disk at its expected path
- [ ] Every file referenced by another file exists (cross-reference all file paths)
- [ ] No orphaned files exist that are not listed in Section 1 (glob the tree, compare)
- [ ] LAYOUT.md migration table "Delete" items have been deleted
- [ ] LAYOUT.md migration table "Move" items are at their new locations
- [ ] LAYOUT.md migration table "Create" items all exist

### 5B. Spine Consistency

- [ ] Every term in the SKILL.md Spine table is used consistently across all files
- [ ] No file uses a term that is NOT in the Spine (undefined terminology)
- [ ] Spine term definitions match their usage in operational protocols
- [ ] [BRIDGE], [XO], [CAMPAIGN], [MISSION], [COMPLEMENT] are consistently referenced

### 5C. Identity Consistency

- [ ] Every identity bunk ID (B-000 through B-010) appears in exactly one roster
- [ ] Every identity file is referenced by its roster and by the operational files that use it
- [ ] Identity persona definitions exist in ONE place only (P10 -- check for duplication in division protocols)
- [ ] Identity permission sets do not conflict with division protocol permissions
- [ ] Relationship map in primitives.md matches relationship sections in all roster files
- [ ] Tier labels (L0/L1/L2) are consistent across SKILL.md, roster files, and identity files

### 5D. Payload Consistency

- [ ] Every payload shape in contracts.md has a corresponding instruction that produces or consumes it
- [ ] Every instruction ID in the catalog is referenced by at least one operational protocol
- [ ] No operational protocol references an instruction ID not in the catalog
- [ ] L2 payload shapes (FIELD_BRIEF, DESK_BRIEF, etc.) are referenced by both the dispatching protocol and the receiving identity
- [ ] Return shapes match what consuming protocols expect to parse
- [ ] ESCALATION NEED values in contracts.md cover all escalation scenarios described in operational protocols

### 5E. Routing Consistency

- [ ] SKILL.md routing table matches the XO identity routing authority table
- [ ] Dispatch protocol sub-agent launching matches contracts.md LAUNCH_BRIEF shapes
- [ ] Every division has a clear invocation path from Director intent to division entry
- [ ] FA invocation path is consistent: is it inline or sub-agent? (Currently sub-agent via Dispatch -- verify all references agree)
- [ ] XO vs. Dispatch routing authority is unambiguous (see Section 4D.1)

### 5F. Template Consistency

- [ ] Every template in templates.md is referenced by at least one producing protocol
- [ ] Template field names match the fields referenced by consuming protocols
- [ ] Dossier templates match what analysis.md and calibration.md describe producing
- [ ] Gate Report template matches what qc.md describes producing
- [ ] Work Order template matches what refinery.md describes producing
- [ ] Evidence template matches what collection.md describes producing
- [ ] Mission Manifest template matches what the XO identity describes producing

### 5G. Event Protocol Consistency

- [ ] SKILL.md event table source codes match the codes used in all operational protocols
- [ ] Production-internal events in production.md match the event codes in the log protocol
- [ ] Workspace log format matches the defined event schema
- [ ] Event archive flow (workspace log -> memory/events/) is documented and operational

### 5H. Primitive Compliance

- [ ] P1: Every inline identity transition has explicit trigger, identity file load, permission boundary, log entry, exit criteria, exclusivity
- [ ] P2: Every sub-agent boundary uses LAUNCH_BRIEF in, RETURN out, no context bleed
- [ ] P3: Every boundary crossing has a format in contracts.md
- [ ] P5: Every operational protocol ends with BRIEFING
- [ ] P6: No operational protocol composes prose at boundaries (instruction selections + artifact pointers only)
- [ ] P7: Artifact lifecycle tiers (hot/warm/cold) are correctly applied; cleanup rules documented
- [ ] P10: No knowledge item exists in two places (check for duplication)
- [ ] P11: No division other than Intelligence produces dossiers
- [ ] P15: Orchestrator knowledge and worker knowledge are in separate facilities

### 5I. LAYOUT.md Reconciliation

- [ ] All implemented features match LAYOUT.md specifications OR deviations are documented and intentional
- [ ] XO/Bridge deviation is documented (Section 3A)
- [ ] FA invocation deviation is documented (Section 3C)
- [ ] Instruction catalog extensions beyond seed are documented (Section 3D)
- [ ] LAYOUT.md "Deferred to Practice" items are still deferred, not silently implemented differently
- [ ] LAYOUT.md "Future Considerations" items remain unbuilt
- [ ] Implementation phases 0-8 completed; Phase 9 (Validation) status documented

### 5J. Zone Integrity

- [ ] Zone 1 (Agency Core) contains only project-agnostic files
- [ ] Zone 2 (Project Overlay) contains only project-specific persistent knowledge
- [ ] Zone 3 (Repository) has no Agency fingerprint (SO-001)
- [ ] Zone 4 (Ephemeral) workspaces are properly gitignored
- [ ] No file in Zone 1 contains project-specific data (HubShot-specific content)
- [ ] No file in Zone 2 duplicates Zone 1 definitions

---

## 6. Key Files for Auditor Reference

If the auditor can only read a subset, prioritize in this order:

1. `SKILL.md` -- system entry point, spine, routing
2. `primitives.md` -- physics that constrain everything
3. `contracts.md` -- boundary specification (most critical file per D11)
4. `LAYOUT.md` -- original blueprint for deviation checking
5. `cadre/bridge/roster.md` + `cadre/bridge/identities/executive-officer.md` -- XO layer
6. `cadre/wardroom/roster.md` -- orchestrator registry
7. `cadre/barracks/roster.md` -- worker registry
8. `divisions/dispatch/dispatch.md` -- routing hub protocol
9. `divisions/intelligence/intelligence.md` -- newest division
10. `divisions/production/production.md` -- most complex division

---

## 7. Summary Assessment

The Agency system as of 2026-02-28 is structurally complete for its declared scope. All 4 operational divisions (Dispatch, Intelligence, Production, Foreign Affairs) have protocols, identities, and payload contracts. The Cadre institutional branch has 3 facilities (Bridge, Wardroom, Barracks) with 11 identities (B-000 through B-010). Templates cover 8 artifact types. The instruction catalog has 17 instruction IDs across 4 divisions plus Agency-level.

The primary risk areas are:

1. **Routing authority ambiguity** between XO and Dispatch (who composes LAUNCH_BRIEFs).
2. **LAYOUT.md drift** -- the blueprint no longer matches the implementation in 3+ areas (XO/Bridge, FA invocation, instruction catalog expansion). The LAYOUT should either be updated or formally declared superseded by the implementation.
3. **Persona duplication** in dispatch.md violating P10.
4. **No validation run** (Phase 9) has been performed -- the system has not been tested end-to-end under operational conditions.
5. **Workspace log not cleaned** from prior operation, suggesting P7 cleanup may not be reliably enforced.
