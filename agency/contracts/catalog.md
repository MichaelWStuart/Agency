# Instruction & NEED Catalogs

> Finite sets of valid instruction and NEED identifiers.
> Agents select from these catalogs — they do not compose instructions.
> If no entry fits, escalate (RESOLVE).
>
> See `contracts/payloads.md` for payload shapes.

---

## Instruction Catalog

Finite set of valid instruction IDs. Agents select from this catalog —
they do not compose instructions. If no instruction fits, escalate (RESOLVE).
If the escalation cascade is exhausted, return terminal escalation with
annotation naming the gap.

### Intelligence Instructions

| ID | Description | Required Artifacts | Return | Files to Load |
|---|---|---|---|---|
| `INTEL.COLLECT.SCOPE` | Query Linear for domain tickets, map boundaries. Load scope CSV (`memory/project/scope.csv`), filter to mission `scope_areas`, write filtered summary to evidence (Chief Analyst inline) | Domain keywords (in brief) + SCOPE_DOC pointer | Scope findings at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md` |
| `INTEL.COLLECT.LANDSCAPE` | Scan codebase for existing domain assets (Chief Analyst inline) | Domain keywords (in brief) | Landscape findings at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md` |
| `INTEL.COLLECT.COORDINATION` | Check team WIP, open PRs, overlap (Chief Analyst inline) | None (reads git/Linear/GitHub) | Coordination findings at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md` |
| `INTEL.COLLECT.QA_FINDINGS` | Query Linear for QA-generated tickets in mission domains, filter against scope CSV, cross-reference with existing dossier findings (Chief Analyst inline) | Domain keywords (in brief) + SCOPE_DOC pointer | QA findings artifact at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md` |
| `INTEL.COLLECT.REFERENCE` | Capture reference app behavior for a domain surface | Surface URLs (in brief) | Evidence artifacts at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md`, `collection.md` |
| `INTEL.COLLECT.IMPLEMENTATION` | Capture our app behavior for a domain surface | Surface URLs (in brief) | Evidence artifacts at `~/.claude/agency-workspace/evidence/` | `chief-analyst.md`, `intelligence.md`, `collection.md` |
| `INTEL.AUTH.VERIFY` | Verify reference app browser session is authenticated | None (navigates to reference app) | Auth status (valid or escalation) | `chief-analyst.md`, `intelligence.md`, `collection.md` |
| `INTEL.ANALYZE.REFERENCE` | Produce reference dossier from evidence | Evidence artifact pointers | Dossier (reference) at `~/.claude/agency-workspace/dossiers/` (promoted to `memory/dossiers/` by Chief Analyst) | `chief-analyst.md`, `intelligence.md`, `analysis.md`, `templates.md` |
| `INTEL.ANALYZE.DELTA` | Produce delta dossier comparing reference vs implementation | Evidence pointers (ref + impl) | Dossier (delta) at `~/.claude/agency-workspace/dossiers/` (promoted to `memory/dossiers/` by Chief Analyst) | `chief-analyst.md`, `intelligence.md`, `analysis.md`, `templates.md` |
| `INTEL.VERIFY.CONVERGENCE` | Verify calibration fixes resolved delta findings | Delta dossier pointer + branch ref | Dossier (convergence) at `~/.claude/agency-workspace/dossiers/` (promoted to `memory/dossiers/` by Chief Analyst) | `chief-analyst.md`, `intelligence.md`, `calibration.md`, `templates.md` |
| `INTEL.RESUME` | Resume Intelligence operation from checkpoint after escalation resolution | Checkpoint artifact pointer + enriched artifacts | INTEL_RETURN | `chief-analyst.md`, `intelligence.md` + department file per original instruction |
| `INTEL.CHART.UPDATE` | Enrich reference topology chart from evidence | Evidence artifact pointers + chart path | Updated chart at `memory/chart.yaml` | `chief-analyst.md`, `intelligence.md`, `cartography.md`, `templates.md` |

### Agency Instructions

| ID | Description | Required Artifacts | Return | Files to Load |
|---|---|---|---|---|
| `AGENCY.MISSION.CREATE` | Initialize a new mission manifest from Director intent | None (Admiral queries Linear, interprets Director intent) | Mission manifest at `memory/missions/` | `admiral.md`, `templates.md` |
| `AGENCY.MISSION.UPDATE` | Update mission manifest from Director intent | Mission manifest pointer (Admiral loads and interprets) | Updated mission manifest | `admiral.md` |

### Integration Instructions

| ID | Description | Required Artifacts | Return | Files to Load |
|---|---|---|---|---|
| `INTEG.SURVEY` | Standard survey: dossier -> plots -> compile -> validate | Dossier (reference) pointer | INTEGRATION_RETURN with Validation Reports | `integration-chief.md`, `integration.md`, `receiving.md`, `plotting.md`, `compilation.md`, `validation.md` |
| `INTEG.FIX` | Calibration fix: delta -> targeted plots -> fix -> validate | Dossier (delta) pointer | INTEGRATION_RETURN with Validation Reports | `integration-chief.md`, `integration.md`, `receiving.md`, `plotting.md`, `compilation.md`, `validation.md` |
| `INTEG.RESUME` | Resume job from a checkpoint | Checkpoint artifact pointer | INTEGRATION_RETURN | `integration-chief.md`, `integration.md` + department file per checkpoint stage |
| `INTEG.COMPILE` | Compile deliverables per Integration Plot at a station | Integration Plot pointer + branch | COMPILE_RETURN | `integration-engineer.md`, `compilation.md` |
| `INTEG.REWORK` | Rework station deliverables after validation failure | Integration Plot pointer + VALIDATION_RETURN | COMPILE_RETURN | `integration-engineer.md`, `compilation.md` |
| `INTEG.VALIDATE` | Run validation gate sequence on station output | Branch + dossier pointer | VALIDATION_RETURN with Validation Report | `inspector.md`, `validation.md`, `templates.md` |

---

## Instruction Spec Structure

Each instruction in the catalog has:
- **ID** — unique, namespaced by department
- **Department** — which department processes this
- **Description** — one sentence
- **Required Artifacts** — artifact pointers that must accompany this instruction
- **Return Contract** — which RETURN shape the agent must produce
- **Files to Load** — what the agent reads on launch. "Files to Load" lists instruction-specific files. The identity's Context Contract (ALLOWLIST) is authoritative for the complete file set.

---

## Catalog Governance

The catalog is finite and predefined. Agents cannot improvise instructions
that don't exist. When an agent encounters a situation where no instruction
fits:

1. Agent returns ESCALATION with terminal severity
2. Annotation (<=25 words) names the catalog gap
3. Director decides: extend catalog, reroute, or abandon

The catalog grows through escalation-driven feedback during real operations.

---

## Escalation NEED Catalog

Finite set of valid NEED identifiers for ESCALATION payloads. NEEDs are
declarative — the escalating agent names what it's missing, not which
instruction to execute. The Admiral reads the NEED, looks up the handler,
and selects the appropriate instruction when composing a MISSION_BRIEF
(or routes the Captain to compose a LAUNCH_BRIEF).

Agents select from this catalog. If no NEED fits, escalate with terminal
severity and annotation naming the gap.

| NEED | Description | Severity | Handler |
|---|---|---|---|
| `SCOPE_DATA` | Missing scope/boundary data for domain | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.SCOPE` |
| `LANDSCAPE_DATA` | Missing codebase landscape for domain | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.LANDSCAPE` |
| `COORDINATION_DATA` | Missing team coordination state | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.COORDINATION` |
| `REFERENCE_EVIDENCE` | Missing reference app evidence for surface | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.REFERENCE` |
| `IMPLEMENTATION_EVIDENCE` | Missing implementation evidence for surface | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.IMPLEMENTATION` |
| `REFERENCE_AUTH` | Reference app authentication required (human action) | routine | Admiral surfaces to Director via BRIEFING |
| `CIRCUIT_BREAKER` | Rework cycles exhausted | terminal | Admiral surfaces to Director via BRIEFING |
| `EXTERNAL_BLOCK` | CI/review/infra failure beyond agent scope | terminal | Admiral surfaces to Director via BRIEFING |
| `STRUCTURAL_CONFLICT` | Merge conflicts beyond rework scope | terminal | Admiral surfaces to Director via BRIEFING |
| `CONTEXT_EXHAUSTION` | Agent hit context capacity before completing protocol | routine | Admiral re-launches Captain with MISSION_BRIEF + checkpoint |
| `MERGE_BLOCKED` | PR cannot be merged (permissions, protected branch, conflicts) | terminal | Admiral surfaces to Director via BRIEFING |
| `QA_DATA` | Integration needs QA ticket reconciliation data | routine | Admiral routes via Captain to Intel with `INTEL.COLLECT.QA_FINDINGS` |
