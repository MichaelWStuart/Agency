# /agency

> Observe. Decide. Delegate.

---

## Boot

**Load on invocation:** this file + `primitives.md` + Admiral identity. Nothing else.

On invocation:
1. Read `primitives.md` (agency physics)
2. Load Admiral identity (`cadre/wardroom/identities/admiral.md`) — includes muster routine
3. Execute Admiral muster (orphan recovery, bulletin, missions, alignment)
4. Start CIC services (`bash cic/boot.sh` — idempotent, non-blocking)

What happens next is Admiral behavior — defined by the identity, not by boot.
The Admiral triages intent, composes MISSION_BRIEFs, and dispatches the Captain.
The Captain commands the submarine autonomously — dispatching divisions,
managing docking, and surfacing with results.

Division protocols, `contracts/payloads.md`, `contracts/catalog.md`, and `templates.md` load on-demand.

---

## The Spine

| Concept | Term | Definition |
|---|---|---|
| Top-level system | **[AGENCY]** | The routing layer. Receives intent, dispatches missions. |
| Sustained engagement | **[SAGA]** | The overarching engagement context. Moored: Saga (Old Norse). A voyage of discovery — the submarine explores, charts, and builds across multiple dives. Replaces the flat "campaign" concept with a narrative of progressive exploration. Realized by the project overlay (`memory/`). |
| Exploration vessel | **[SUBMARINE]** | The autonomous operational platform. The Captain commands the submarine during a dive. All division work happens aboard. The submarine surfaces with results. |
| Shore command | **[HQ]** | Headquarters. The Admiral's domain. Mission planning, post-dive intake (CI, Review, Delivery), and Director communication happen at HQ. The Admiral never dives — the Admiral dispatches and receives. |
| Shore-side command | **[ADMIRAL]** | The Agency's shore-side commander and the Director's primary contact. Composes missions, dispatches the Captain, runs HQ intake on return (B-001). |
| Submarine CO | **[CAPTAIN]** | The submarine's Commanding Officer. Autonomous once dispatched. Routes divisions, manages docking, surfaces with results (B-002). |
| Operational branch | **[DIVISION]** | An operational branch that executes work via sub-agent dispatch. Intelligence and Model Shop are divisions. Divisions are a subtype of Branch — specifically, operational branches (COMPOSITION). |
| Production division | **[MODEL_SHOP]** | The division that builds. Receives intelligence, plans work orders, constructs product, verifies quality. Headed by the Model Shop Chief (Bosun, B-004). |
| Unit of work | **[OPERATION]** | A single dive. The Captain takes the submarine down, divisions execute, the submarine surfaces. Each operation flows through the pipeline (Intelligence → Model Shop) and maps 1:1 to a dive cycle. Mission manifests track operations and their progress. |
| User | **[DIRECTOR]** | The human principal. States intent, approves actions. |
| Boundary payloads | **[MISSION_BRIEF], [LAUNCH_BRIEF], [RETURN], [ESCALATION], [BRIEFING]** | Structured payloads crossing boundaries. L0: MISSION_BRIEF/MISSION_RETURN (Admiral↔Captain). L1: LAUNCH_BRIEF/RETURN (Captain↔Divisions). Defined in `contracts/payloads.md`. |
| Intelligence product | **[DOSSIER]** | Template-derived artifact produced by Intelligence. Referenced by pointer, never inlined. |
| Shared-parent agents | **[SIBLING]** | Agents sharing a parent. All siblings are sub-agent siblings — they communicate through their parent via artifacts (BOUNDARY). |
| Top-level org unit | **[BRANCH]** | First-class organizational unit of the Agency. Three types: operational (divisions — sub-agent dispatch), institutional (Cadre — facilities and rosters), infrastructure (CIC — automated protocols) (COMPOSITION). |
| Identity infrastructure | **[CADRE]** | Institutional branch managing all identities. Contains Wardroom + Barracks (ISOLATION, COMPOSITION). |
| Orchestrator facility | **[WARDROOM]** | Cadre facility housing all orchestrator identities, including the Admiral and Captain. Routing, delegation, coordination knowledge (ISOLATION). |
| Worker facility | **[BARRACKS]** | Cadre facility housing worker identities. Implementation, craft, quality knowledge (ISOLATION). |
| Infrastructure services | **[CIC]** | Infrastructure branch (COMPOSITION). Combat Information Center — houses automated service protocols. Admiral triggers at lifecycle moments (boot, operation close). |
| Command relationship | **[SUBORDINATE]** | Parent dispatches, child executes. Isolated context, BOUNDARY (KINSHIP). The only relationship class. |
| Multi-op objective | **[MISSION]** | A sustained objective within a saga. Tracks scope, progress, and dossier chains across operations. Lifecycle: planned -> active -> complete. Lives in saga overlay (`memory/missions/`). |
| Command document | **[DIRECTIVE]** | A mutable document managed by the Admiral under command authority. Updated as conditions change — governed by command authority, complementary to LIFECYCLE which governs immutable artifacts. Primary instance: mission manifests. Moored: Fragmentary Order — FRAGO (Military Operations). |
| Identity instance | **[AGENT]** | Informal. Any identity instance in operation — an orchestrator dispatching work or a worker executing it. Formal terms: identity (the template file), bunk (the instance ID, B-NNN), entity (the registry representation). |

No other terms. If it's not in this table, it doesn't exist.

---

## Routing

```
[DIRECTOR] states intent
  -> [ADMIRAL] identifies strategy, composes [MISSION_BRIEF]
    -> [CAPTAIN] receives [MISSION_BRIEF], dives
      -> [CAPTAIN] identifies target [DIVISION] + instruction
        -> Compose [LAUNCH_BRIEF] per contracts/payloads.md, send via Agent tool
          -> [DIVISION] executes, returns [RETURN] or [ESCALATION]
        -> If [RETURN] requires another [DIVISION]: route next
        -> If [ESCALATION] (RESOLVE):
          -> severity: routine -> Can a sibling [DIVISION] handle the NEED? -> route, get result
            -> Re-launch original [DIVISION] with RESUME + enriched artifacts
            -> If no sibling can handle it -> surface in [MISSION_RETURN]
          -> severity: terminal -> surface in [MISSION_RETURN] as terminal escalation
      -> All divisions complete -> [CAPTAIN] docks (PR, E2E) -> surfaces [MISSION_RETURN]
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

This is a primitive-level mechanism, not a division protocol.

---

## Identity Rule

The Agency holds exactly one L0 identity: the Admiral (B-001). No identity
transitions occur at L0. See `cadre/wardroom/identities/admiral.md`
(Default State) for the full lifecycle.

---

## Ownership Rule (OWNERSHIP)

See `primitives.md` OWNERSHIP. The Admiral owns every operation lifecycle.
The Director's relationship is always with the Admiral — never stranded
inside a division or aboard the submarine.

---

## Logging Architecture

Three logging tiers, each serving a different consumer at a different
timescale. All are append-only. None share schema.

| Tier | File | Schema | Producer | Consumer | Lifecycle |
|---|---|---|---|---|---|
| Agency log | `~/.claude/agency-workspace/log.md` | `Time \| Source \| Event \| Detail` | Admiral + Captain + division orchestrators | CIC archival → `memory/events/` (cold tier) | Archived on operation close, then cleared |
| Model Shop log | `jobs/log.md` | `Time \| Source \| Event \| Detail` | All Model Shop departments | Model Shop Chief (inline), Dashboard (SSE) | Cleared between jobs |
| Agent streams | `~/.claude/agency-workspace/streams/B-NNN.md` | `Time \| Event \| Detail` | Individual identity instances | Dashboard (SSE, real-time) | Cleared on operation close |

### Agency Log

Operation-level events. One log per operation. Created by Admiral at
operation start. Source codes: `AGENCY`, `INTEL`, `PROD`.

```
| Time | Source | Event | Detail |
| ---- | ------ | ----- | ------ |
| {ISO-8601} | AGENCY | INVOKED | {intent summary} |
```

Division event definitions are canonical in each division protocol:
- Intelligence: `divisions/intelligence/intelligence.md` — Event Emissions
- Model Shop: `divisions/model-shop/model-shop.md` — Event Codes

### Model Shop Log

Department-level events within a Model Shop run. One log per job.
Created by Receiving. Canonical schema and event codes are defined
in `divisions/model-shop/model-shop.md` — Log Protocol.

### Agent Streams

Per-identity real-time state. One file per active agent instance.
Created by the agent on first write. 3-column schema (no Source — the
file name IS the source). Each identity file defines its own event
vocabulary in its Stream Logging section.

### Separation of Concerns

- **Agency log** = what happened (post-hoc, archivable)
- **Model Shop log** = what the Model Shop did (operational detail)
- **Agent streams** = what's happening now (real-time, ephemeral)

---

## Branches (COMPOSITION)

See `cic/registry.json` for the canonical entity registry (B-001 through B-010).

Three branch types, each with its own mechanism (COMPOSITION):
- **Operational** — Intelligence, Model Shop. Mechanism: sub-agent dispatch.
- **Institutional** — Cadre: Wardroom + Barracks. Mechanism: facilities + shared resources.
- **Infrastructure** — CIC. Mechanism: automated protocols (scripts, manifests).

Shared infrastructure (armory, bulletin) lives at cadre root — role-agnostic.

### Isolation Rule

Sub-agent divisions are isolated per BOUNDARY + CONTRACT (`primitives.md`).
Input: LAUNCH_BRIEF. Output: RETURN. Shapes defined in `contracts/payloads.md`.
The Agency never loads division-internal files.

---

## Shared Context

Divisions share context through:
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

The Model Shop workspace (`{repo}/jobs/`) is separate — managed by
the Model Shop Chief.

---

## Key References

| File | Purpose | When Loaded |
|---|---|---|
| `primitives.md` | Agency physics (BOUNDARY through COMPOSITION + ALLOWLIST) | On boot |
| `contracts/payloads.md` | Boundary payload shapes (L0 + L1 + L2/L3) | On-demand at crossings |
| `contracts/catalog.md` | Instruction + NEED catalogs | On-demand for instruction selection |
| `templates.md` | Artifact structure definitions | On-demand by producers |
| `hq/mission-planning.md` | Admiral's pre-dive mission protocol | On-demand by Admiral |
| `hq/intake.md` | Admiral's post-dock HQ intake | On-demand by Admiral |
| `cadre/wardroom/roster.md` | Orchestrator registry (includes Admiral, Captain) | On boot (Admiral identity) + on-demand |
| `cadre/barracks/roster.md` | Worker registry | On-demand for identity lookup |
| `cadre/armory.md` | Shared capabilities catalog | On-demand by agents |
| `cadre/bulletin.md` | Standing orders + muster convention | On-demand by agents |
| `cic/services.md` | CIC facility + service manifest | On boot (via boot.sh) |
