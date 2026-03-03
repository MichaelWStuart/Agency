# Saga Mooring Exploration

> Status: ACTIVE EXPLORATION — not yet ratified into the agency.
> Backup: `memory/archive/agency-backup-20260303-051121/`

---

## The Charter

**Moored: Deep-Sea Exploration Under Military Operational Discipline**
(SUBSAFE, Rickover Doctrine — civilian exploration purpose, military-grade
process discipline, because the environment demands it)

Two layers, symbiotic:

| Layer | Nature | What it provides |
|---|---|---|
| **The Charter** | Exploration / Research | The WHY. Chart the deep. Build the simulation. |
| **The Discipline** | Military doctrine (UCMJ-grade) | The HOW. Because the environment demands it. |

The waters are not hostile in the adversarial sense. They are **unforgiving**.
Vast, dark, expensive to explore. Deviation from procedure doesn't just
make things messy — it burns real resources, creates real rework. The
military layer exists because the consequences of deviation are severe
enough to warrant it. Primitives aren't guidelines — they're law aboard
this vessel. The brig is the failure state.

---

## The Metaphor Map

| Metaphor | What it is |
|---|---|
| **The Submarine** | The operational instance. The crew + vessel. Autonomous once submerged. |
| **HQ** | Remote GitHub. The facility maintaining the simulation. Persists independently. Receives products from all submarines. |
| **The Director** | The human authority. Not aboard the submarine. Sees the sub's state through the Agency UI (cross-section view). |
| **The Crew** | The agents aboard the submarine during a dive. All hands on deck — no rest when submerged. |
| **Uncharted Waters** | The reference domain (HubSpot). Vast, dark, resource-intensive to chart. Not enemy — uncharted. |
| **Submerging** | Starting an operation. Going under. No comms with other vessels. |
| **Surfacing / Returning to Port** | Operation complete. Return to HQ for physical hand-off. |
| **The Simulation** | The running app (not the codebase — the codebase produces the simulation when it runs). A high-fidelity model of what's underwater, so others can explore safely. |
| **Charting** | Intelligence collection. Building the map of what's down there. |
| **The Model Shop** | Production. The on-board lab/workshop that constructs terrain models from survey data. Aboard because the calibrate loop requires proximity to the observation point — you can't verify the model against reality from shore. ⚠️ NAMING TBD — see open questions. |
| **Friendly Vessels** | Teammates. Other submarines in the same theater. Invisible to us. |
| **Plotted Courses** | Linear tickets. Pre-dive check — where do we think they're going? |
| **Wake / Acoustic Traces** | Open PRs, recent merges. Evidence of other subs' movements. |
| **Silent Running** | No external comms during operations. Resource conservation. |
| **Periscope / Sonar** | Field Agents (Hawk, Kite). Observe, don't engage. Passive collection. |

---

## The Hierarchy

| Level | Submarine Term | Agency Term | What it means |
|---|---|---|---|
| **Theater** | The area of operations | **SAGA** | Why we exist. The charter. Chart the deep, build the simulation. |
| **Deployment** | The patrol | **CAMPAIGN** | Engagement with this theater (this repo). |
| **Objective** | The mission tasking | **MISSION** | A specific domain to chart (contacts, deals, etc). |
| **Sortie** | The dive | **OPERATION** | Submerge → chart → build → surface → hand off. |

---

## Git Mapping

| Git Concept | Submarine Equivalent |
|---|---|
| `origin/dev` | HQ's current state of the simulation |
| Local repo | The submarine's onboard copy |
| Feature branch | The submarine's work product, built during the dive |
| PR | Hand-off document. "We've charted this section, requesting integration." |
| Merge | HQ accepts and integrates the product |
| Other people's PRs | Other submarines' deliveries, arriving at HQ independently |
| Merge conflict | Two submarines charted overlapping waters differently |

---

## The Terrain

The uncharted waters are not featureless. The survey team observes
distinct elements, each of which must be faithfully reproduced in the
model for the simulation to be valid.

| Terrain Element | What it maps to | Why the model must get it right |
|---|---|---|
| **Formations** | UI components, page layouts | The visible structure. What you see when you look. |
| **Currents** | Data flow, network behavior, API calls | How things move through the terrain. Wrong currents = wrong physics = RL agents learn the wrong patterns. |
| **Channels** | Routes, navigation paths | The passages connecting formations. How you get from one place to another. |
| **Geological layers** | Data models, schema, database structure | The foundation beneath the visible surface. Determines what formations CAN exist. |
| **Pressure responses** | User interactions, form submissions, state changes | What happens when you press on something. The terrain reacts — the model must react identically. |
| **Ecosystems** | Feature interplay, cross-domain dependencies | Nothing exists in isolation. This formation affects that current which erodes this channel. |

The model is not a diorama. It is a **working simulation**. The currents
must actually flow. The pressure responses must actually respond. A model
that only looks right teaches the RL agents the wrong physics — they
won't transfer to the real terrain.

### Why Production Is Aboard

The round trip is the expensive part. If Production were shore-side:
- Submarine dives, observes, returns to HQ
- Shore team builds from charts
- Shore team needs verification → sends the submarine back out
- Each iteration of the calibrate loop is a full embarkation

With Production aboard:
- Submarine dives, Intelligence observes
- Production builds the model right there in the hull
- Intelligence does another periscope sweep: "does this match?"
- "No, that current flows differently" → Production adjusts → Intelligence re-checks
- The whole calibrate loop happens in ONE dive
- The submarine only surfaces when the model is verified against reality

The submarine is a **mobile lab**. You don't bring samples back to the
lab — you bring the lab to the samples. The iterative feedback between
observation and construction requires co-location in the uncharted waters.

### Production Through the Terrain Lens

Production's internal stages, reframed by the metaphor:

| Current Name | What it does (unchanged) | Terrain framing |
|---|---|---|
| **Loading Dock** | Receives dossiers from Intelligence | Survey data arrives at the model shop. The team receives the charts. |
| **Refinery** | Studies dossiers, breaks into work orders (Assay → Fractionate) | Studies the charts, identifies which terrain sections to model and in what order. "We need this ridge, this current channel, this pressure response." |
| **Shop Floor** | Builds the code, station by station | Constructs terrain sections. Each work order = a section of the model. |
| **QC** | Verifies quality against the dossier | Verifies the model against the original observations. Does this section match what we saw? |
| **Shipping** | ⚠️ ERADICATE. End state is: model verified, sub ready to return. | N/A — see open questions. |

The structure and function are preserved. The framing shifts from
industrial manufacturing to terrain modeling. The dossier is not "raw
material" — it is survey data. The work order is not a "product spec" —
it is a terrain section to reproduce. QC is not "inspection" — it is
verification against observed reality.

---

## Structural Implications (Crystallized)

### HQ vs Submarine Split

The Director is never aboard. The submarine is autonomous once submerged.
Work splits between shore-side (HQ) and aboard (submarine):

```
Director (civilian authority — commissions the survey)
  → Admiral (HQ, shore-side program commander)
      ├─ Pre-dive: shore-side intelligence, mission planning, collision detection
      ├─ Post-dock: HQ intake (CI, CursorBot, merge), re-embark decisions
      ├─ Institutional: Wardroom + Barracks (cadre is shore-side)
      └─ Memory, conventions, mission archives
      │
      └─ Captain (submarine CO — autonomous during dive)
           ├─ Intelligence: observation, analysis, cartography
           ├─ Production: model construction, verification
           └─ Captain's role: situational awareness + command decisions.
               Trusts departments. Validates completion against mission
               plan, not the work itself. If it was wrong, it would have
               escalated (RESOLVE). Doesn't inspect — commands.
```

### The Surfacing Sequence

What happens when the dive is complete:

| Phase | What happens | Who |
|---|---|---|
| **Departments report complete** | Intelligence: charts done. Production: model verified. | Department leads (aboard) |
| **Captain's review** | All departments complete? Any unresolved escalations? Checks completion against mission plan — does NOT validate the work itself. If something was wrong, it would have escalated through RESOLVE. | Captain (aboard) |
| **"Surface"** | Captain orders ascent. | Captain (aboard) |
| **Ascent** | Secure model for transport. Final commit, branch cleanup. | Crew (aboard) |
| **Docking** | Connect to HQ. git push + PR creation. Physical hand-off. | Captain (aboard) |
| **HQ intake** | Inspection (CI), review (CursorBot), integration (merge). | Admiral (shore-side) |
| **Re-embark?** | Issues found → Admiral dispatches sub back out. Same escalation patterns, different physical location. | Admiral (shore-side) |

### Physical Hand-Off Constraint

No mid-dive transmission. The submarine must physically return to HQ
to deliver the product. `git push` + PR creation = docking and hand-off.
Everything before push is aboard. Everything after is HQ's process.

### Collision Detection (Two Phases)

1. **Pre-dive (at port):** Check plotted courses (Linear) — what missions
   are other subs running? Check HQ's dock (open PRs) — what's waiting?
2. **Post-dock (at port):** Check what HQ accepted while we were under
   (rebase against `origin/dev`). Detect wake interference (merge conflicts).

Cannot detect mid-dive. Submarines are blind to each other underwater.

### Existing Moorings — All Strengthen

Every primitive mooring holds and tightens under the submarine framing:
- BOUNDARY (watertight integrity) — pressure hull, not just bulkheads
- RESOLVE (damage control) — hull breach is fatal underwater
- COMPOSITION (ship org / SORM) — tighter crew, every billet matters
- MOORING (nav fixing) — submarines navigate by internal reference when
  submerged; periodic periscope fixes calibrate. Our moorings = those fixes.
- SELECTION (brevity codes) — submarines are terse by necessity

---

## Open Questions

### 1. Command Structure — RESOLVED (by the metaphor)

Titles emerge from where they fall in the saga:

- **Admiral** — HQ, shore-side program commander. Director's point of
  contact. Prepares missions, dispatches the submarine, manages HQ intake,
  decides re-embark. The current XO's shore-side functions promoted to
  this role.
- **Captain** — Submarine CO. Commands the boat during the dive. The
  current XO's submarine-side functions. Autonomous once submerged.
  Maintains situational awareness, trusts departments, validates
  completion against mission plan. Does not inspect work — commands.
  If something was wrong, RESOLVE would have surfaced it.

```
Director → Admiral → Captain → Intelligence + Production
```

### 2. "Shipping" Eradication — RESOLVED (by the metaphor)

The metaphor dissolves "shipping" into its actual parts:

**The department:** There is no "Shipping" department. What existed there
splits between two locations:
- **Aboard (Captain's command):** Ascent + Docking (secure model, git push,
  PR creation). This is the submarine surfacing, not a department.
- **Shore-side (Admiral's command):** HQ intake (CI, CursorBot, merge,
  re-embark). This is an Admiral function, not a Production function.

**The strategy:** ~~Ship~~ → **Survey**. Single-pass: observe the terrain,
build the model, surface. "We surveyed that section." Calibrate remains
calibrate: iterative loop until the model matches reality.

**Blast radius for implementation:**
- `shipping.md` → splits between Captain protocol + Admiral protocol
- STRATEGY: `ship` → `survey`
- Instruction: `PROD.SHIP` → `PROD.SURVEY`
- Events: `WO_SHIPPED` → TBD, `SHIP_GATE` → TBD

### 3. Production Boundary Tension — MOSTLY RESOLVED

**Output boundary:** Resolved. No more "shipping." Production's end state
is "model verified." Production reports complete to the Captain. The
Captain doesn't re-verify — trusts RESOLVE. Orders "Surface."

**Escalation locations:** Same protocols, different physical locations:
- During the dive → Captain handles (RESOLVE)
- At HQ's dock → Admiral handles (re-embark or fix)

**Remaining tension:**
- Input boundary: "Loading Dock" language — factory idiom inside the
  submarine. May need renaming to match the model shop / terrain framing.
- The factory-as-nested-metaphor question: is "model shop" (or similar)
  a better framing than "factory" for Production's identity inside the hull?

### 4. Intelligence Split — RESOLVED (by the metaphor)

**Shore command prepares the mission. The submarine observes the deep.**

Shore-side intelligence (HQ orchestrator's domain):
- Review existing charts — what have we already mapped?
- Check what other submarines have found / are finding (collision detection)
- Identify the survey area — what's the objective?
- Receive feedback from HQ on previous deliveries (QA findings)
- Package all of this into the mission brief for the submarine

Submarine intelligence (aboard, during the dive):
- Direct observation — periscope sweeps, sonar readings (browser capture)
- Sample collection — gather data from the environment
- On-board analysis — process observations into charts (dossier synthesis)
- Update the master chart — add new observations (cartography)
- Verification sweeps — compare the model to reality (calibration)

The split follows real submarine operations: shore command does
intelligence preparation and packages the mission brief. The submarine
crew does on-station intelligence through direct observation.

### 5. Post-Dock Processing Ownership — RESOLVED

CI gate, review gate (CursorBot), merge = HQ's intake process. Owned by
the HQ orchestrator, not the submarine. The submarine is docked — HQ
inspects, reviews, integrates. If issues are found, HQ orchestrator
dispatches the submarine to re-embark (same escalation patterns, different
physical location). This is the CursorBot loop, CI fix cycles, etc.

### 6. Cadre Location — RESOLVED

Wardroom and Barracks are **shore-side at HQ**, not aboard the submarine.
All hands on deck when submerged — no institutional overhead during the
dive. Agents deploy FROM the cadre onto the submarine for a mission, and
return to cadre between deployments. This also resolves the "barracks on
a submarine" tension — barracks are at the base, where they belong.

---

## Design Principles (Established This Session)

### "Metaphor is sufficient for cognitive architecture"

The refactor is metaphor-down, not implementation-up. When the metaphor
is coherent, implementation details fall out of it naturally. Don't wire
first and name later — name first from the metaphor and the wiring
reveals itself. Every open question in this exploration was resolved by
asking "what does the metaphor say?" not "what does the code need?"

### The Telescope Principle

"This whole submarine reference app is simply a piece of an eventual much
larger metaphor that will continue to grow and coalesce." The Agency's
scope is larger than one submarine. Right now there is one vessel. The
architecture should know it can extend — the Admiral can command a fleet,
HQ can serve multiple programs — without requiring structural changes to
the submarine itself. Design for the collapsed telescope; don't prevent
it from extending.

### The Admiral Is New (Not a Rename)

The current XO (B-001) splits into two entities:
- **Admiral** — NEW entity at L0. Shore-side. Director's point of contact.
  Inherits the XO's triage, briefing, mission planning, and return
  processing functions.
- **Captain** — the current XO's submarine functions at L1. Dispatched as
  a sub-agent. Autonomous during the dive.

This adds a layer to the hierarchy:
```
Current:  L0: XO → L1: Chief Analyst, Foreman → L2: workers
New:      L0: Admiral → L1: Captain → L2: Chief Analyst, Foreman → L3: workers
```

The registry (B-001 through B-009) will need restructuring. This is not
a rename — it is a structural split that creates a new entity.

### The Re-Embark Pattern (New)

A new operational pattern that does not exist in the current agency.
Currently the Production Orchestrator handles CI/CursorBot inline while
aboard (in `shipping.md`). Under the saga mooring:

- The submarine surfaces and docks (git push, PR creation)
- HQ (Admiral) runs intake: CI gate, CursorBot review, merge
- If issues are found, the Admiral dispatches the submarine to **re-embark**
- The submarine goes back out with a targeted mission (fix CI failures,
  address review findings)
- Same escalation semantics (RESOLVE), different physical location

This means the CI/CursorBot loop is no longer a Production concern —
it is an Admiral concern that may trigger re-embarkation.

### The Director's View

The Director is never aboard. The Agency UI will be rebuilt as a
**cross-section view of the submarine** — an interactive nav showing the
sub's internal state. The scope of the UI IS the submarine. This is the
Director's only window into what's happening during a dive.

This has implications for what state the submarine exposes and how the
Admiral relays it to the UI. The agent streams, production logs, and
event emissions are the submarine's telemetry — transmitted to HQ when
docked, or available through the cross-section view.

---

## Continuation Notes

When picking this up in a future session:

1. **Read this file first.** It is the canonical state of the exploration.
2. **The live agency is untouched.** `~/.claude/skills/agency/` is the
   running system. `~/Agency/` is the isolated workspace for iteration.
3. **The backup exists** at the original memory location:
   `~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/archive/agency-backup-20260303-051121/`
4. **Next steps are likely:**
   - Resolve Production's internal identity (factory → model shop?)
   - Resolve the "Loading Dock" input boundary naming
   - Design the Admiral identity file
   - Design the Captain identity file (evolved from executive-officer.md)
   - Restructure the registry for the new hierarchy
   - Work through how re-embark patterns interact with existing RESOLVE
5. **Approach:** Always metaphor-first. If the name doesn't emerge from
   the saga, it's not ready yet. Let the metaphor resolve it.
