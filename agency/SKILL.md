# /agency

> Observe. Decide. Delegate.

---

## Boot

**Load on invocation:** this file + `primitives.md` + Admiral identity. Nothing else.

On invocation:
1. Read `primitives.md` (agency physics)
2. Load Admiral identity (`shore/admiral.md`) — includes muster routine
3. Execute Admiral muster (orphan recovery, bulletin, missions, alignment)
4. Start CIC services (`bash cic/boot.sh` — idempotent, non-blocking)

What happens next is Admiral behavior — defined by the identity, not by boot.
The Admiral triages intent, composes MISSION_BRIEFs, and dispatches the Captain.
The Captain commands the submarine autonomously — dispatching departments,
managing docking, and surfacing with results.

Department protocols, `contracts/payloads.md`, `contracts/catalog.md`, and `templates.md` load on-demand.

---

## The Spine

| Concept | Term | Definition |
|---|---|---|
| Top-level system | **[AGENCY]** | The routing layer. Receives intent, dispatches missions. |
| Sustained engagement | **[SAGA]** | The overarching engagement context. Moored: Saga (Old Norse). A hydrographic survey expedition — the submarine explores unknown terrain, charts it, and compiles a simulation across multiple dives. Realized by the project overlay (`memory/`). |
| Exploration vessel | **[SUBMARINE]** | The autonomous operational platform. The Captain commands the submarine during a dive. All department work happens aboard. The submarine surfaces with results. |
| Shore command | **[HQ]** | Headquarters. The Admiral's domain. Mission planning, post-dive intake (CI, Review, Delivery), and Director communication happen at HQ. The Admiral never dives — the Admiral dispatches and receives. |
| Shore-side command | **[ADMIRAL]** | The Agency's shore-side commander and the Director's primary contact. Composes missions, dispatches the Captain, runs HQ intake on return (B-001). |
| Submarine CO | **[CAPTAIN]** | The submarine's Commanding Officer. Autonomous once dispatched. Routes departments, manages docking, surfaces with results (B-002). |
| Operational branch | **[DEPARTMENT]** | An operational branch that executes work via sub-agent dispatch. Intelligence and Integration are departments. Departments are a subtype of Branch — specifically, operational branches (COMPOSITION). |
| Integration department | **[INTEGRATION]** | The department that compiles. Receives intelligence, plots integration work, compiles terrain into simulation, validates quality. Headed by the Integration Chief (Hydro, B-004). Moored: IHO S-44 (Hydrographic Survey Standards). |
| Unit of work | **[OPERATION]** | A single dive. The Captain takes the submarine down, departments execute, the submarine surfaces. Each operation flows through the pipeline (Intelligence → Integration) and maps 1:1 to a dive cycle. Mission manifests track operations and their progress. |
| User | **[DIRECTOR]** | The human principal. States intent, approves actions. |
| Boundary payloads | **[MISSION_BRIEF], [LAUNCH_BRIEF], [RETURN], [ESCALATION], [BRIEFING]** | Structured payloads crossing boundaries. L0: MISSION_BRIEF/MISSION_RETURN (Admiral↔Captain). L1: LAUNCH_BRIEF/RETURN (Captain↔Departments). Defined in `contracts/payloads.md`. |
| Intelligence product | **[DOSSIER]** | Template-derived artifact produced by Intelligence. Referenced by pointer, never inlined. |
| Shared-parent agents | **[SIBLING]** | Agents sharing a parent. All siblings are sub-agent siblings — they communicate through their parent via artifacts (BOUNDARY). |
| Infrastructure services | **[CIC]** | Infrastructure branch (COMPOSITION). Combat Information Center — houses automated service protocols. Admiral triggers at lifecycle moments (boot, operation close). |
| Command relationship | **[SUBORDINATE]** | Parent dispatches, child executes. Isolated context, BOUNDARY (KINSHIP). The only relationship class. |
| Multi-op objective | **[MISSION]** | A sustained objective within a saga. Tracks scope, progress, and dossier chains across operations. Lifecycle: planned -> active -> complete. Lives in saga overlay (`memory/missions/`). |
| Command document | **[DIRECTIVE]** | A mutable document managed by the Admiral under command authority. Updated as conditions change — governed by command authority, complementary to LIFECYCLE which governs immutable artifacts. Primary instance: mission manifests. Moored: Fragmentary Order — FRAGO (Military Operations). |
| Identity instance | **[AGENT]** | Informal. Any identity instance in operation — an orchestrator dispatching work or a worker executing it. Formal terms: identity (the template file), bunk (the instance ID, B-NNN), entity (the roster representation). |

No other terms. If it's not in this table, it doesn't exist.

---

## Routing

```
[DIRECTOR] states intent
  -> [ADMIRAL] identifies strategy, composes [MISSION_BRIEF]
    -> [CAPTAIN] receives [MISSION_BRIEF], dives
      -> [CAPTAIN] identifies target [DEPARTMENT] + instruction
        -> Compose [LAUNCH_BRIEF] per contracts/payloads.md, send via Agent tool
          -> [DEPARTMENT] executes, returns [RETURN] or [ESCALATION]
        -> If [RETURN] requires another [DEPARTMENT]: route next
        -> If [ESCALATION] (RESOLVE):
          -> severity: routine -> Can a sibling [DEPARTMENT] handle the NEED? -> route, get result
            -> Re-launch original [DEPARTMENT] with RESUME + enriched artifacts
            -> If no sibling can handle it -> surface in [MISSION_RETURN]
          -> severity: terminal -> surface in [MISSION_RETURN] as terminal escalation
      -> All departments complete -> [CAPTAIN] docks (PR, E2E) -> surfaces [MISSION_RETURN]
    -> [ADMIRAL] receives [MISSION_RETURN] -> runs HQ intake (CI, Review, Delivery)
    -> If intake issues -> [ADMIRAL] re-embarks [CAPTAIN] with new [MISSION_BRIEF]
  -> [ADMIRAL] delivers [BRIEFING] to [DIRECTOR]
```

The routing table (signal -> handler mapping) is canonical in the Admiral
identity (see Admiral identity: Routing Authority).

---

## Agency Invocation Escape Hatch
Moored: Flash Override (Military Communications Priority)

At any point during an operation, the Director can invoke the Agency by
name ("agency", "I need to speak to the agency"). If the Admiral is mid-flow
(waiting for a Captain return, composing a MISSION_BRIEF), the flow is
interrupted. The Agency resumes from the Admiral's own awareness.

This is a primitive-level mechanism, not a department protocol.

---

## Identity Rule

The Agency holds exactly one L0 identity: the Admiral (B-001). No identity
transitions occur at L0. See `shore/admiral.md`
(Default State) for the full lifecycle.

---

## Ownership Rule (OWNERSHIP)

See `primitives.md` OWNERSHIP. The Admiral owns every operation lifecycle.
The Director's relationship is always with the Admiral — never stranded
inside a department or aboard the submarine.

---

## Logging Architecture

Three logging tiers, each serving a different consumer at a different
timescale. All are append-only. None share schema.

| Tier | File | Schema | Producer | Consumer | Lifecycle |
|---|---|---|---|---|---|
| Agency log | `~/.claude/agency-workspace/log.md` | `Time \| Source \| Event \| Detail` | Admiral + Captain + department orchestrators | CIC archival → `memory/events/` (cold tier) | Archived on operation close, then cleared |
| Integration log | `jobs/log.md` | `Time \| Source \| Event \| Detail` | All Integration departments | Integration Chief (inline), Dashboard (SSE) | Cleared between jobs |
| Agent streams | `~/.claude/agency-workspace/streams/B-NNN.md` | `Time \| Event \| Detail` | Individual identity instances | Dashboard (SSE, real-time) | Cleared on operation close |

### Agency Log

Operation-level events. One log per operation. Created by Admiral at
operation start. Source codes: `AGENCY`, `INTEL`, `INTEG`.

```
| Time | Source | Event | Detail |
| ---- | ------ | ----- | ------ |
| {ISO-8601} | AGENCY | INVOKED | {intent summary} |
```

Department event definitions are canonical in each department protocol:
- Intelligence: `afloat/intelligence/intelligence.md` — Event Emissions
- Integration: `afloat/integration/integration.md` — Event Codes

### Integration Log

Department-level events within an Integration run. One log per job.
Created by Receiving. Canonical schema and event codes are defined
in `afloat/integration/integration.md` — Log Protocol.

### Agent Streams

Per-identity real-time state. One file per active agent instance.
Created by the agent on first write. 3-column schema (no Source — the
file name IS the source). Each identity file defines its own event
vocabulary in its Stream Logging section.

### Separation of Concerns

- **Agency log** = what happened (post-hoc, archivable)
- **Integration log** = what Integration did (operational detail)
- **Agent streams** = what's happening now (real-time, ephemeral)

---

## Departments (COMPOSITION)

See `shared/roster.json` for the canonical entity roster (B-001 through B-010).

Two department types (COMPOSITION):
- **Operational** — Intelligence, Integration. Mechanism: sub-agent dispatch.
- **Infrastructure** — CIC. Mechanism: automated protocols (scripts, manifests).

Shared infrastructure (armory, bulletin) lives in `shared/` — role-agnostic.

### Isolation Rule

Sub-agent departments are isolated per BOUNDARY + CONTRACT (`primitives.md`).
Input: LAUNCH_BRIEF. Output: RETURN. Shapes defined in `contracts/payloads.md`.
The Agency never loads department-internal files.

---

## Shared Context

Departments share context through:
- **MISSION_BRIEF / LAUNCH_BRIEF / RETURN** — structured payloads
- **Artifact pointers** — filesystem paths to template-derived content
- **Linear MCP** — organizational state (tickets, projects, cycles)
- **GitHub CLI** — repository state (PRs, branches, checks)
- **Git** — implementation state (branches, commits, diffs)
- **Browser** — reference applications (Intelligence field agents)

No shared internal logic. Only shared interfaces.

---

## Workspace

```
~/.claude/agency-workspace/
  log.md             # Event log (archived to memory/events/, then cleared)
  evidence/          # Screenshots, snapshots (cleaned after BRIEFING)
  dossiers/          # Hot tier dossiers (promoted to memory/dossiers/ by Chief Analyst)
```

Ephemeral. Cleaned after BRIEFING delivered (LIFECYCLE).

The Integration workspace (`{repo}/jobs/`) is separate — managed by
the Integration Chief.

---

## Key References

| File | Purpose | When Loaded |
|---|---|---|
| `primitives.md` | Agency physics (BOUNDARY through COMPOSITION + ALLOWLIST) | On boot |
| `contracts/payloads.md` | Boundary payload shapes (L0 + L1 + L2/L3) | On-demand at crossings |
| `contracts/catalog.md` | Instruction + NEED catalogs | On-demand for instruction selection |
| `templates.md` | Artifact structure definitions | On-demand by producers |
| `shore/mission-planning.md` | Admiral's pre-dive mission protocol | On-demand by Admiral |
| `shore/intake.md` | Admiral's post-dock HQ intake | On-demand by Admiral |
| `shared/roster.json` | Entity roster (all bunks, roles, relationships) | On boot (Admiral identity) + on-demand |
| `shared/armory.md` | Shared capabilities catalog | On-demand by agents |
| `shared/bulletin.md` | Standing orders + muster convention | On-demand by agents |
| `cic/services.md` | CIC facility + service manifest | On boot (via boot.sh) |
