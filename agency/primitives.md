# Agency Primitives

> The physics of the system. These constrain all design decisions.
> LOADED ON BOOT alongside SKILL.md.

---

## Core Primitives (Locked)

**BOUNDARY: Sub-Agent Boundary**
Moored: Watertight Integrity (Naval Architecture)

All identity transitions are sub-agent boundaries. When work crosses
into a new agent context (via Agent tool): structured LAUNCH_BRIEF in,
structured RETURN out. No context bleed. Sub-agent loads its own files.
Parent verifies returns — sub-agents return proof, not verdicts.

There are no inline identity transitions. Every identity operates in
its own isolated context. Shared context between identities is achieved
only through artifacts passed at boundaries.

**CONTRACT: Payload Contract**
Moored: Standard Message Formats (NATO/US Military — OPREP-3, SITREP, SPOTREP)

Every boundary crossing uses a defined format from `contracts/payloads.md`.
No prose at boundaries. One source of truth. If a payload shape doesn't
exist in `contracts/payloads.md`, the crossing is invalid.

**CLOSURE: Briefing Closure**
Moored: After Action Report (US Military Doctrine)

Every operation ends with a BRIEFING to the Director. No exceptions.
Even aborted operations produce one.

**SELECTION: Selection Over Expression**
Moored: Brevity Codes / Prowords (MIL-STD, NATO STANAG)

Communication across scope boundaries is deterministic, not generative.
Agents select from a finite instruction catalog defined in `contracts/catalog.md`
— they do not compose prose, express intent in their own words, or
summarize context for downstream consumers.

Content and meaning are carried by **artifacts**: template-derived files
that pass through the filesystem unchanged, never serialized into boundary
payloads. A boundary crossing consists of:
1. **Instruction selections** — IDs from the catalog
2. **Artifact pointers** — filesystem paths to template-derived content
3. **Typed fields** — template-constrained values with explicit types and size limits

Nothing else crosses. The instruction catalog defines what an agent CAN
say. The artifact templates define what content CAN look like. Typed
fields carry bounded operational data (status codes, constrained prose,
structured logs). Between these three mechanisms, boundary communication
is fully deterministic.

Applies to all operational boundary crossings (LAUNCH_BRIEF, RETURN,
DOSSIER handoffs, ESCALATION).

**LIFECYCLE: Artifact Lifecycle**
Moored: Ship's Deck Log Immutability (Naval Regulations)

LIFECYCLE governs artifacts — immutable products of work (dossiers,
evidence, validation reports, integration plots). DIRECTIVE-class documents (mission
manifests) are mutable command documents governed by command authority,
not LIFECYCLE. See Spine: DIRECTIVE — complementary governance, not
exception.

Artifacts exist in three tiers based on lifecycle stage:

- **Hot** — in-flight during active operations. Live in operational
  workspace (`~/.claude/agency-workspace/`, `jobs/`). All stage-boundary artifacts are
  preserved until the operation completes — this enables rewind to any
  prior stage. Cleaned after briefing (CLOSURE), except artifacts promoted
  to warm.
- **Warm** — institutional knowledge. Dossiers, completed reports,
  convergence artifacts. Live in campaign overlay (`memory/dossiers/`).
  Persist across sessions. Referenced by future operations via artifact
  pointers. Subject to Director-managed retention.
- **Cold** — event logs for UI pipeline. Live in campaign overlay
  (`memory/events/`). Not consumed by agents — only by MCP
  server. Subject to rolling retention (last N operations pruned
  automatically).

**Immutability at stage boundaries.** Once a stage produces an artifact,
it is never modified — only superseded by a new version with a new
timestamp. This enables:
1. **Trust** — consuming agents can trust artifact content unconditionally.
   If the artifact exists at the pointer path, it is valid and complete.
2. **Rewind** — production can rewind to any stage checkpoint by
   re-running from the immutable artifact at that boundary.

**Cleanup protocol:**
- **Hot -> cleaned** after operation briefing (CLOSURE). Exception: artifacts
  promoted to warm tier by the producing department.
- **Warm -> pruned** by Director decision. Default: preserved until
  explicitly pruned. No automatic expiration.
- **Cold -> rolling retention.** Events older than N operations are pruned
  automatically. N is configurable in project config.
- **Evidence** (screenshots, snapshots) — cleaned after briefing. Never
  promoted to warm. If evidence must persist, it is captured into a
  template-derived artifact first.

**ALLOWLIST: Allowlist Principle**
Moored: Rules of Engagement (Military Doctrine)

Constraints are expressed as allowlists, not denylists. Every identity
file specifies what IS loaded on launch — not what is excluded. Every
payload field has an explicit type — not a free-text description of
what to avoid.

Allowlists are lookup-enforceable: check the list, accept or reject.
Denylists require interpretation: is this item covered by the
prohibition? Interpretation is the failure mode this primitive prevents.

Applies to: identity context contracts (loaded on launch), payload
field typing (`contracts/payloads.md`), instruction catalogs (`contracts/catalog.md`).

**Identity file scope:** Identity files define persona, permissions,
context contract, and relationship map. Operational procedures live in
department protocols. Identity files pointer-reference
protocols — they do not duplicate them.

---

## Extended Primitives (Governable)

**EPHEMERAL: State Externality**
Moored: Watch Standing / Watch Relief (Naval Operations)

Operations are conversational. Persistent state lives in external systems
(git, Linear, GitHub, browser) and artifacts (dossiers, manifests). The Admiral's
conversational context grows through structured returns — this is the
operation lifecycle, not a violation. No agent writes internal state to files
for future operations to discover. Workspace is ephemeral — cleaned after
briefing (CLOSURE).

Directives are explicit command documents managed by the Admiral as part of
command function. They are not internal agent state — they are
organizational documents with defined templates and governance.

**OWNERSHIP: Ownership Continuity**
Moored: Commanding Officer's Standing Orders (Naval Regulations)

The Director's relationship is with the originating agent. Returns flow
back through the chain, not sideways. Director is never stranded inside
a subordinate.

**TRUTH: Single Source of Truth**
Moored: Configuration Management (IEEE 828)

Every knowledge category has one canonical location. No duplication.
If it exists in two places, one is wrong.

**INTAKE: Dossier as Input**
Moored: Intelligence Preparation of the Battlefield (IPB, ATP 2-01.3)

Departments consume intelligence products. They do not generate their own.
Only Intelligence produces dossiers. Integration reads them. Validation verifies
against them.

**STRATEGY: Strategy**
Moored: Deliberate vs Hasty Operations (FM 3-90, Tactical Operations)

The same pipeline serves different strategies, declared at operation start:
- **Survey:** Linear. Intelligence once -> Integration once -> surface -> done.
- **Calibrate:** Iterative. Intelligence sweep -> Integration fix ->
  Intelligence verify -> loop until convergence.

**RESOLVE: Autonomous Resolution**
Moored: Damage Control Doctrine (USN, NSTM 079)

Agents loop to accomplish their mission. Two outcomes at every decision
point:
1. **Resolve** — within own scope -> loop and continue
2. **Escalate** — outside own scope -> structured escalation up ONE
   layer, carrying artifacts and severity

Escalation is not failure — it is a routing request. The agent needs
something outside its scope. Each layer that receives an escalation
either handles it, routes to a sibling, or escalates up one more layer.
The cascade stops at whatever layer can resolve it.

**Severity model:** Escalations carry a severity that determines urgency:
- **routine** — "I need X to continue. Get me X and I can resume."
  The agent is blocked on a specific need and can continue once it's
  provided.
- **terminal** — "Something is fundamentally wrong. I recommend halt."
  The agent has hit an unrecoverable state (circuit breaker exceeded,
  external block, structural conflict). Terminal escalations include
  a constrained annotation (<=25 words) naming the failure.

Both severities travel the same cascade. If a terminal escalation
reaches the Director, it is presented as a terminal escalation in
the BRIEFING. The Director decides: resume, reroute, or abandon.

**Siblings:** Agents sharing a parent. All siblings are sub-agent
siblings (BOUNDARY). They communicate through their parent via artifacts.
Horizontal moves between sub-agent siblings require escalation to the
parent for routing.

**De-escalation:** Every escalation path has a symmetric de-escalation
path. When an escalation is resolved, the resolution flows back DOWN
the same chain it went up, through every intermediate layer, to the
originating agent.

- The agent that escalated is the agent that receives the resolution
- Each intermediate layer re-dispatches the original agent with the
  resolution payload (RESUME instruction + enriched artifacts)
- No shortcuts — resolution never bypasses layers
- No sideways delivery — resolution enters at the resolving layer
  and descends through the same path

**KINSHIP: Identity Relationships**
Moored: Chain of Command (Military Organization)

Identities exist in one relationship class with one structural concept.

**Subordinate** (the only relationship class):
- Parent dispatches, child executes and returns
- Context is isolated (BOUNDARY)
- Interaction via LAUNCH_BRIEF/RETURN
- Every non-Director operational identity has exactly one parent

**Sibling** (structural concept, not a class):
- Identities sharing the same parent
- Never interact directly — mediated by parent via artifacts
- Parent routes between siblings when needed (RESOLVE)

New relationship classes can emerge through governance by defining:
class name, context rule, interaction pattern.

**Relationship map:** See `shared/roster.json` for the canonical entity
hierarchy (B-001 through B-010). The map encodes Subordinate relationships
(L0 -> L1 -> L2 -> L3) and Sibling groupings.

**ISOLATION: Knowledge Isolation**
Moored: Officer/Enlisted Development Pipelines (Military Personnel Management)

Orchestrator and worker identities have distinct knowledge domains.
Their knowledge evolves independently:

- **Orchestrator knowledge**: routing patterns, escalation
  effectiveness, coordination strategies, dispatch optimization
- **Worker knowledge**: implementation craft, tool mastery,
  quality techniques, domain expertise

Cross-contamination degrades both roles: orchestrators become
micromanagers, workers become system gamers.

Primitives are the shared conventions — BOUNDARY, CONTRACT, KINSHIP
apply equally to both role types. The identity system, payload contracts,
and relationship classifications are role-agnostic.

**COMPOSITION: Agency Composition**
Moored: Ship Organization (SORM, OPNAVINST 3120.32)

The Agency is composed of organizational units:

- **Operational departments** — capability areas that execute work.
  Mechanism: sub-agent dispatch (LAUNCH_BRIEF → RETURN).
  Instances: Intelligence, Integration.
- **Shared resources** — institutional knowledge, capabilities, and
  standing orders. Consumed by all departments.
  Location: `shared/` (roster, armory, bulletin, stream protocol).
- **Infrastructure** — automated services that support operations
  without participating in the command chain.
  Mechanism: automated protocols (scripts, manifests).
  Instance: the CIC (Combat Information Center).

The Agency operates on two axes:
- **Operational** (departments): WHAT work gets done
- **Infrastructure** (CIC + shared): WHAT runs in the background + WHO does the work

**MOORING: Grounded Reference**
Moored: Navigational Fixing / Triangulation (Maritime Navigation)

Agency concepts are moored to proven external referents — science,
doctrine, or law. A mooring connects an internal concept (the ship)
to a fixed external point (the dock). One bollard on the dock, multiple
lines to different levels of the ship. The referent provides structural
validation and cognitive grounding inherently — naming the referent is
sufficient.

Multiple moorings triangulate the architecture's position. Each mooring
is a bearing — more bearings, more precise fix, more coherent system.
This is why the architecture gains coherence through conversation:
each new mooring narrows the design space convergently.

Unmoored load-bearing concepts are flagged for drift risk. Not every
concept requires a mooring, but concepts that other concepts depend on
should have one.

---

## Primitive Governance

Core primitives (BOUNDARY, CONTRACT, CLOSURE, SELECTION, LIFECYCLE,
ALLOWLIST) are locked. Extended primitives (EPHEMERAL through
MOORING) can be amended through conversation with the Agency at root
level — no identity active, no operation running. Director approves all
changes.
