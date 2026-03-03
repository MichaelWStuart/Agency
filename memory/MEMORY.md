## The Agency

Hydrographic survey expedition. The submarine explores unknown terrain (reference app),
charts it (dossiers), and compiles a simulation of it (HubShot).

```
[DIRECTOR] states intent -> [ADMIRAL] routes -> [DEPARTMENT] executes -> [BRIEFING] delivered
```

### Core
- **Admiral (B-001)** — L0 default, only identity at root. Triages intent, dispatches Captain, handles returns.
- Two strategies (STRATEGY): **survey** (linear) or **calibrate** (iterative convergence loop).
- Boundary crossings: instruction selections + artifact pointers + typed fields (SELECTION).
- Artifacts: hot (`~/.claude/agency-workspace/`) -> warm (`memory/dossiers/`) -> cold (`memory/events/`). Immutable at stage boundaries (LIFECYCLE).
- Primitives — **Core (locked, 6):** BOUNDARY, CONTRACT, CLOSURE, SELECTION, LIFECYCLE, ALLOWLIST. **Extended (governable, 10):** EPHEMERAL, OWNERSHIP, TRUTH, INTAKE, STRATEGY, RESOLVE, KINSHIP, ISOLATION, COMPOSITION, MOORING.

### Roster (`shared/roster.json`, B-001 through B-010)
| Bunk | Callsign | Role | Department | Tier |
|---|---|---|---|---|
| B-001 | Admiral | Admiral | — | L0 |
| B-002 | Captain | Captain | — | L1 |
| B-003 | Analyst | Chief Analyst | Intelligence | L2 |
| B-004 | Hydro | Integration Chief | Integration | L2 |
| B-005 | Hawk | Field Agent | Intelligence | L3 |
| B-006 | Scribe | Desk Analyst | Intelligence | L3 |
| B-007 | Kite | Field Agent | Intelligence | L3 |
| B-008 | Atlas | Integration Engineer | Integration | L3 |
| B-009 | Datum | Inspector | Integration | L3 |
| B-010 | Folio | Integration Engineer | Integration | L3 |

### Key Files
| File | Purpose |
|---|---|
| `agency/SKILL.md` | System topology (boot, spine, routing, departments) |
| `agency/primitives.md` | Agency physics (16 primitives) |
| `agency/contracts/payloads.md` | Boundary payload shapes |
| `agency/contracts/catalog.md` | Instruction + NEED catalogs |
| `agency/templates.md` | Artifact structure definitions |
| `agency/shore/` | Admiral identity + HQ protocols (intake, mission planning) |
| `agency/afloat/` | Captain + department protocols (intelligence, integration) |
| `agency/shared/` | Roster, armory, bulletin, stream protocol |
| `agency/cic/` | Services manifest, schema, boot.sh |

### Integration Department (ex Model Shop)
```
Job -> [RECEIVING] -> [PLOTTING] -> [COMPILATION] -> [VALIDATION] -> Shipped
```
- Workspace: `~/dev/hubshot/jobs/` (gitignored). Cleaned between jobs.
- Consumes dossier artifacts from Intelligence (INTAKE) — does not self-scrape.
- Plotting: Assay loop -> gaps? -> resolve or escalate (RESOLVE) -> Integration Plots.
- Integration Engineer compiles (COMPILE_BRIEF/COMPILE_RETURN), Inspector validates (VALIDATION_BRIEF/VALIDATION_RETURN).

---

## Project (HubShot)

`memory/` = `~/.claude/projects/-Users-michaelstuart-dev-hubshot/memory/`

| Path | Purpose |
|---|---|
| `memory/config.md` | Bootstrap config |
| `memory/project/` | Context, conventions, coordination, failure catalog, scope |
| `memory/missions/` | Mission manifests (mutable command documents) |
| `memory/dossiers/` | Warm tier intelligence products |
| `memory/events/` | Cold tier event archive |
| `memory/work-log.md` | Append-only work history |

### Critical Rules
- **Never modify `.gitignore`** or **`knip.config.ts`**.
- **Never commit screenshots/images** — delete in closeout.
- **Run E2E tests LOCALLY before creating a PR**.
- **Never use "HubSpot"/"HUBSPOT" in code** — use "HubShot"/"HUBSHOT".
- Engineering terminal status: **Merged** (not Done).

### QC Gates
- Inline: `pnpm typecheck`, `pnpm exec oxfmt {files}`, `pnpm knip`
- E2E: `pnpm exec playwright test {dir} --reporter=list`

---

## Memory Rules
- **No state in memory.** Current state comes from git, Linear, and the codebase.
- **Integration state lives in `jobs/`.** Agency state lives in `~/.claude/agency-workspace/`.

---

## Other Skills

### Reason
`/reason` — Gemini 3.1 Pro (`gemini-3.1-pro-preview`).
Skill dir: `~/.claude/skills/reason/` | API key: `~/.claude/secrets/gemini-key`

---

## Work History

Append-only log in `memory/work-log.md`.
