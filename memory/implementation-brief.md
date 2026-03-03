# Agency Refactor — Implementation Brief

> Hand this to the implementing agent at session start.
> Written 2026-02-28 after the full planning session and one iteration pass.

---

## Start Here

Read `~/.claude/skills/agency/LAYOUT.md`. This is the single source of
truth. It contains primitives, design decisions, seed specifications,
directory layout, migration table, and phased implementation order.

Everything below is context that LAYOUT.md assumes you understand. Read
this brief first, then LAYOUT.md, then execute.

---

## The Mental Model

### What the Agency IS

The Agency is a recursive sub-agent orchestration system built on top of
Claude Code. It routes the Director's (human's) intent to specialized
divisions, each running in isolated context. The Agency itself is NOT an
identity — it's the root Claude context (the kernel). It loads two files
on boot (`primitives.md` + `SKILL.md`), reads intent, and transitions to
the right identity.

### Why It Works: Context Engineering

This is the core architectural insight. Understand this or you'll build
the wrong thing.

The system has ~35 protocol files. They do NOT load into one context.
Each agent loads 2-5 files in an isolated context window. The LAUNCH_BRIEF
is the boundary between contexts. It carries:

1. **Identity reference** — path to the identity file the agent loads
2. **Instruction selections** — IDs from a finite catalog in `contracts.md`
3. **Artifact pointers** — filesystem paths to template-derived content
4. **Return contract reference** — which RETURN shape to produce

That's it. No context summaries, no prose explanations, no upstream history.
The parent's job is *selection*, not *composition*. The quality of an L1
agent is measured by the precision of its selections, not the eloquence
of its briefs. This is P6 (Selection Over Expression) — the single most
important design principle in the system.

Content passes through the filesystem unchanged. Artifacts are never
summarized, compressed, or interpreted by the parent. The instruction
catalog defines what an agent CAN say. The artifact templates define
what content CAN look like. Between these two constraints, all boundary
communication is fully deterministic.

### The Two Critical Files

- **`contracts.md`** — boundary payloads (LAUNCH_BRIEF shapes, RETURN
  shapes, ANDON format) AND the instruction catalog (finite set of valid
  instruction IDs with full definitions). This is the API of the system.
- **`templates.md`** — artifact structure definitions. Every artifact
  type has a template. Agents fill templates, not compose freeform content.

Together: contracts define what crosses boundaries, templates define what
sits on the filesystem. They are the complete boundary specification.

### Four Zones

| Zone | Location | Contents | Visibility |
|---|---|---|---|
| 1: Agency Core | `~/.claude/skills/agency/` | Protocols, contracts, templates, barracks | Project-agnostic, portable |
| 2: Project Overlay | `~/.claude/projects/{hash}/memory/` | Project knowledge, dossiers, events, config | Project-specific, persistent |
| 3: Repository | `~/dev/hubshot/` | Code, reference docs — NO agency fingerprint | Team-visible |
| 4: Ephemeral | `~/dev/hubshot/jobs/` + `agency/workspace/` | In-flight work, evidence | Cleaned between operations |

**Repo opacity is non-negotiable.** The team cannot know the Agency exists.
Nothing in the repo reveals it. PRs and Linear ticket updates are the only
team-visible output.

### Artifact Lifecycle (P7)

Three tiers:
- **Hot** — in-flight during operations. Lives in Zone 4. Cleaned after briefing.
- **Warm** — institutional knowledge (dossiers, reports). Lives in Zone 2 (`memory/dossiers/`). Persists across sessions.
- **Cold** — event logs for UI pipeline. Lives in Zone 2 (`memory/events/`). Rolling retention.

Immutability at stage boundaries: once a stage produces an artifact, it's
never modified — only superseded. This enables trust (artifact at pointer
path = valid and complete) and rewind (Director says "rewind to Refinery,"
the WO artifacts are still there).

### Strategy (P12)

Same pipeline, different strategy declared at operation start:
- **Ship:** Linear. Intelligence once → Production once → done.
- **Calibrate:** Iterative. Intelligence sweep → Production fix → Intelligence verify → loop until convergence.

The pipeline doesn't change. The strategy changes how many times and in
what order you pass through it.

### The Barracks

Infrastructure for identity management. NOT a division. Sits at agency
root. Contains:
- **Roster** — agent registry with bunk mapping (8 bunks seeded)
- **Armory** — shared capabilities catalog
- **Bulletin** — standing orders
- **Identities** — per-agent definition files

**Important:** The Barracks is a concept seed, not gospel. The structure
in LAYOUT.md is the starting point. Build what's specified. Don't
over-engineer the metaphor — future iterations will extend it (footlockers,
identity memory, roll call). For now: roster + identities + armory +
bulletin, that's it.

### Event Pipeline (D14)

**This is infrastructure, NOT a division.** There is no observer agent.
Agents emit structured events → workspace log → archive to `memory/events/`
→ future MCP server → future UI. The Director observes the system through
the UI and triggers external ANDON manually via P4.

Build now: event format, log directory, archive structure.
Build later: MCP server, UI app.

### Calibration Internals — Deferred

The calibration strategy's shape is defined (P12, `calibration.md`).
The internal mechanics — loop termination criteria, convergence thresholds,
delta classification granularity — are deliberately deferred. These will
be honed through practice during actual QA calibration work. Build the
shape. Leave the tuning for load.

---

## Pipeline Context

Three documents, sequential:

1. **LAYOUT.md** (`~/.claude/skills/agency/LAYOUT.md`) — BUILD this system.
   Follow phases 0-9 in order. This is your current task.
2. **Situation Report** (`memory/situation-2026-02-28.md`) — USE the built
   system on this. The first calibration operation consumes this file as
   intake. Do NOT start calibration until the build is complete and
   validated (Phase 9).
3. **Calibration** — Fix the Contacts and Lists epics using the calibrate
   strategy. This is AFTER implementation, not part of it.

---

## Critical Gotchas

### Things to Ignore

- **`PLAN.md`** in the skill directory — old architecture. Phase 0 deletes it.
- **`agency.zip`** in `~/.claude/skills/` — backup artifact.
- **`agency/divisions/recon/`** — old division. Phase 0 deletes it. Don't
  copy patterns from it into Intelligence. Intelligence has a different
  architecture (3 departments, instruction-based dispatch).

### Things to NOT Rewrite

- **`loading-dock.md`** — No Change in migration table. Don't touch it.
- **`shipping.md`** — No Change. Don't touch it.
- **`shop-floor.md`** — listed as both No Change and Modify In-Place.
  The pipeline is unchanged. Only add checkpoint writes (P7) and station
  worker identity references.
- **`refinery.md`** — Modify In-Place. ONE change: reads dossier artifact
  at pointer path instead of self-scraping. Don't rewrite the fractionation
  logic, WO cutting, or any other protocol.
- **`qc.md`** — Modify In-Place. Add dossier artifact reference for Gates
  3-4 and updated project file paths. Don't restructure the gate protocol.
- **`production/SKILL.md`** — Modify In-Place. Add dossier reference,
  remove scraping ref, update project file paths.

The existing factory pipeline is battle-tested. You're integrating it
into the new architecture, not rebuilding it.

### Things That Already Exist

- **`contracts.md`** has old payload shapes (LAUNCH_BRIEF → Factory,
  LAUNCH_BRIEF → Recon, FACTORY_RETURN, RECON_RETURN, ANDON, BRIEFING,
  DOSSIER). Phase 5 REWRITES it. Read the existing one first to understand
  the shapes you're replacing and extending.
- **`dispatch.md`** has a working persona, triage protocol, and return
  handling. Phase 5 updates it — don't rewrite the personality or the
  execution protocol. Add INTEL_RETURN handling and strategy awareness.
- **`SKILL.md`** has the current spine and routing table (3 divisions).
  Phase 5 updates it to 4 divisions + strategies + escape hatch + event
  emission. Preserve what works.

### Phase Sequencing

Phases are sequential. Phase 0 deletes `recon/` before Phase 3 creates
Intelligence. No investigation capability during Phases 1-2. This is
expected — don't try to use recon patterns during those phases.

### Seed Specs Are Starters

The instruction catalog, templates, event schema, and roster in LAYOUT.md
are seed specifications. They will be extended through use (D16: Catalog
Governance). Build what's specified. Expect gaps during Phase 9 validation.
When an instruction doesn't exist for a situation, that's the D16 feedback
loop — ANDON → Director extends catalog.

### Memory Rules Still Apply

No state in memory. Memory files store stable patterns and architecture.
Current state comes from git, Linear, and the codebase. Factory state
lives in `jobs/`. Agency state lives in `workspace/`. Memory is not a
workspace.

---

## Key File Locations

| What | Path |
|---|---|
| Master blueprint | `~/.claude/skills/agency/LAYOUT.md` |
| This brief | `memory/implementation-brief.md` |
| Situation report | `memory/situation-2026-02-28.md` |
| Existing agency skill | `~/.claude/skills/agency/` |
| Project memory | `~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/` |
| Production workspace | `~/dev/hubshot/jobs/` (gitignored) |
| Repo root | `~/dev/hubshot/` |

---

## Phase Checklist (Quick Reference)

| Phase | Summary | Key Output |
|---|---|---|
| 0 | Cleanup | Deletions complete, clean starting state |
| 1 | Foundations | `primitives.md`, barracks (roster, armory, bulletin, 8 identities) |
| 2 | Project Overlay | `memory/project/` populated, `config.md`, reserved dirs |
| 3 | Intelligence Division | `intelligence/` with SKILL.md, collection, analysis, calibration |
| 4 | Foreign Affairs | `foreign-affairs/` with protocol |
| 5 | Contracts, Catalog & Templates | `contracts.md` rewrite, `templates.md`, SKILL.md update, dispatch update |
| 6 | Production Adjustments | Surgical changes to refinery, qc, production SKILL |
| 7 | UI & Event Pipeline | HTML files moved, `memory/events/` created, event format spec |
| 8 | Memory Rewrite | MEMORY.md updated for new architecture |
| 9 | Validation | Dry-run ship + calibrate, catalog gap discovery, iterate |

Consult the Migration Table in LAYOUT.md for the definitive list of
every file that is deleted, moved, created, modified, or left unchanged.
