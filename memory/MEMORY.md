## The Agency

Routing layer. Receives intent, dispatches branches. Physics in `primitives.md`.

```
[DIRECTOR] states intent -> [AGENCY] routes -> [DIVISION] executes -> [BRIEFING] delivered
```

### Core Principles
- Agency default and only L0 identity: **Executive Officer (XO, B-001)**. Director's primary point of contact. Triages intent, composes LAUNCH_BRIEFs, handles returns, delivers BRIEFINGs. No identity transitions at L0.
- Boundary crossings: instruction selections + artifact pointers + typed fields (SELECTION). No unbounded prose at boundaries.
- **RESOLVE (Autonomous Resolution) + De-escalation**: Agents escalate UP ONE LAYER with severity (routine | terminal). Parent routes to sibling or escalates further. **De-escalation is symmetric** — resolution flows back DOWN the same chain, through every layer, to the originating agent via RESUME + enriched artifacts.
- **Siblings**: Agents sharing a parent. All siblings are sub-agent siblings — communicate through parent via artifacts (BOUNDARY).
- **KINSHIP (Identity Relationships)**: One class: Subordinate (isolated, BOUNDARY). One structural concept: Sibling. Relationship determines pattern.
- **ISOLATION (Knowledge Isolation)**: Orchestrators (Wardroom) and workers (Barracks) managed separately in the Cadre.
- **COMPOSITION (Agency Composition)**: Branches = operational (divisions) + institutional (Cadre) + infrastructure (CIC). Each type has its own mechanism: sub-agent dispatch, facilities/resources, automated protocols.
- **ALLOWLIST**: Constraints as allowlists, not denylists. Identity files specify what IS loaded. Payload fields have explicit types.
- [BRIEFING] closes every operation (CLOSURE).
- Artifacts: hot (`~/.claude/agency-workspace/`) -> warm (`memory/dossiers/`) -> cold (`memory/events/`). Immutable at stage boundaries (LIFECYCLE).
- Strategies (STRATEGY): **ship** (linear) or **calibrate** (iterative loop).

### Primitives (Semantic Codes)

**Core (locked, 6):** BOUNDARY, CONTRACT, CLOSURE, SELECTION, LIFECYCLE, ALLOWLIST
**Extended (governable, 10):** EPHEMERAL, OWNERSHIP, TRUTH, INTAKE, STRATEGY, RESOLVE, KINSHIP, ISOLATION, COMPOSITION, MOORING

### Branches (COMPOSITION)

Canonical registry: `cic/registry.json` (B-001 through B-009).

- **Agency Root:** XO (B-001) — L0 default
- **Operational:** Intelligence (B-002 Analyst), Production (B-003 Foreman)
- **Institutional (Cadre):** Wardroom (B-001–B-003), Barracks (B-004–B-009)
- **Infrastructure (CIC):** Automated protocols (boot, lifecycle). XO triggers at lifecycle moments.

### Key Files (Agency Core)
| File | Purpose |
|---|---|
| `~/.claude/skills/agency/primitives.md` | Agency physics (6 core + 10 extended primitives) |
| `~/.claude/skills/agency/SKILL.md` | System topology (boot, spine, routing, branches, events) |
| `~/.claude/skills/agency/contracts/payloads.md` | Boundary payload shapes |
| `~/.claude/skills/agency/contracts/catalog.md` | Instruction + NEED catalogs |
| `~/.claude/skills/agency/templates.md` | Artifact structure definitions |
| `~/.claude/skills/agency/cadre/` | Wardroom + Barracks rosters, armory, bulletin |
| `~/.claude/skills/agency/cic/` | Services manifest, registry, boot.sh |

---

## Production Division

```
Job -> [LOADING DOCK] -> [REFINERY] -> [SHOP FLOOR] -> [QC] -> [SHIPPING] -> Shipped
```

- Production workspace: `~/dev/hubshot/jobs/` (gitignored). Cleaned between jobs.
- Consumes dossier artifacts from Intelligence (INTAKE) — does not self-scrape.
- Refinery: iterative Assay loop -> gaps? -> resolve inline or escalate (RESOLVE) -> loop -> Fractionate -> WOs.
- Station Worker builds (STATION_BRIEF/STATION_RETURN), Inspector QCs (QC_BRIEF/QC_RETURN) — both orchestrator-dispatched sub-agents.
- Sub-agents return proof (Gate Reports), not verdicts. Orchestrator verifies.
- External gates (CI, CursorBot) are orchestrator-owned.

---

## Campaign

| Path | Purpose |
|---|---|
| `memory/config.md` | Bootstrap config (team, repo, ports, API keys) |
| `memory/project/context.md` | HubShot project context |
| `memory/project/conventions.md` | Code rules, PR template, CursorBot process |
| `memory/project/coordination.md` | Team coordination protocol |
| `memory/project/failure-class-catalog.md` | Quality manual |
| `memory/missions/` | Mission manifests (directives — mutable command documents) |
| `memory/plans/` | Queued change plans (execute when conditions are met) |
| `memory/dossiers/` | Warm tier — intelligence products |
| `memory/events/` | Cold tier — event archive for UI pipeline |
| `memory/work-log.md` | Append-only work history |

`memory/` = `~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/`

---

## HubShot Project Constraints

### QC Gates
- Station inline: `pnpm typecheck`, `pnpm exec oxfmt {files}`, `pnpm knip`
- End-of-line: `pnpm typecheck`, `pnpm run format:check`, `pnpm knip`, `pnpm test`
- E2E: `pnpm exec playwright test {dir} --reporter=list`

### Critical Rules
- **Never modify `.gitignore`** or **`knip.config.ts`** — fix your code, not the tool.
- **Never commit screenshots/images** — unstage before every commit, delete in closeout.
- **Run E2E tests LOCALLY before creating a PR**.
- **Never use "HubSpot"/"HUBSPOT" in code** — use "HubShot"/"HUBSHOT" (exception: `docs/reference/`).
- **`create-handler.ts`** State API handler supports both string and number IDs.
- Engineering terminal status: **Merged** (not Done). QA owns Ready for QA -> Done.

### Research Defaults
- Use Linear MCP + `gh` CLI first for project context.
- Branch name -> Linear ticket (e.g., `feature/rom-365-lists` -> ROM-365).
- ADR dependencies = trace the code first, ask the user second.

---

## Memory Rules
- **No state in memory.** Current state comes from git, Linear, and the codebase.
- **Production state lives in `jobs/`.** Agency state lives in `~/.claude/agency-workspace/`. Memory is not a workspace.
- **Session retrospective:** Store correction principles as one-line rules.

---

## Architectural Principles (Beyond Agency)

Patterns that apply to system design generally, not just Agency internals.

- **Moorings as compression:** Naming a proven external referent IS the documentation. "Moored: PDCA (Deming)" compresses paragraphs of process description into a single line because the referent already embodies the pattern. Compression through grounding, not through deletion.
- **Action-based context:** Context enters through agent action (bulletin says "all agents read this on muster"), not through container loading (manifest says "load these files"). The convention instructs the behavior; the behavior creates the context.
- **Topology vs behavior separation:** System-level files define structure (what connects to what). Identity files define behavior (what the agent does). When a system file contains behavioral detail, it's a compression candidate — move it to the identity.
- **Generative framing over verification:** Asking "what would you improve?" produces deeper analysis than "what's broken?" The generative task requires understanding design intent; the deeper comprehension surfaces more gaps as a side effect.
- **Constraint as audit surface:** Explicit constraints are simultaneously audit capabilities. Vague guidelines can't be violated — only precise constraints can. Every constraint you add is a gap you can mechanically detect.
- **Inconsistency as incomplete compression:** When two files say the same thing differently, the concept hasn't reached its canonical location. The disagreement reveals the compression opportunity.
- **Seam analysis over interior analysis:** The most valuable gaps live between components, not inside them — at boundaries where one component's output becomes another's input. Seams are where compression opportunities concentrate.
- **Category purity through physical separation:** Convention enforcement is expensive (remember the rule). Directory separation is free (structure prevents the mistake). When categories blur in practice, the physical boundaries aren't enforcing the conceptual ones.
- **Consumer-driven artifact shape:** Artifacts should be shaped for their consumer, not their producer. If the consumer needs a subset, produce the subset. Producer-shaped artifacts create context pressure at consumption time.
- **Scaling trajectory as design input:** If you can predict an artifact will grow, design its consumption pattern for the grown version now. O(n) consumption of a growing artifact is a deferred bug.

### Refactor Principles (Agency-Tested)

Principles proven through the compression refactor. Apply to future Agency structural changes.

- **Mooring over mechanical labels:** Replace bare numbering/naming (Zone 2, complement) with moored terms (campaign, identity templates). If a concept carries meaning through its external referent, the label IS the documentation.
- **Complementary governance, not exceptions:** When two governance models coexist (LIFECYCLE for immutable artifacts, DIRECTIVE for mutable commands), frame them as peers with complementary domains — not as a rule and its exception.
- **Inline capability absorption:** When a sub-agent exists solely for one XO-executable task, absorb the capability into the XO identity. Sub-agent overhead only earns its keep for autonomous multi-step operations.
- **Split by consumer, not by size:** When a file serves two distinct consumers at distinct times (payload shapes at boundary crossings vs. instruction catalog at selection time), split it. Single-file-single-concern.
- **Pointer over duplication:** When system files duplicate knowledge owned by divisions (event catalogs, routing tables), replace the duplicate with a pointer to the canonical source. The pointer preserves awareness without creating a second source of truth.
- **Renumber highest-first:** When removing an entity and collapsing a numbering scheme, renumber from highest to lowest to avoid collisions during the renumbering pass.
- **Warm/cold tier immutability during refactors:** Historical artifacts (dossiers, event archives) that reference old terms (zone numbers, removed entities) remain as-is per LIFECYCLE. Only active system files get updated.

---

## Other Skills

### Reason
`/reason` — Gemini 3.1 Pro (`gemini-3.1-pro-preview`).
Skill dir: `~/.claude/skills/reason/` | API key: `~/.claude/secrets/gemini-key`

---

## Work History

Append-only log in `memory/work-log.md`.
