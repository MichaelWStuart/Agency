# Payload Contracts

> Every sub-agent boundary has two crossing points: input and output.
> Each has an exact format. No prose. No improvisation.
>
> This file defines payload shapes for all boundary crossings.
> See `contracts/catalog.md` for instruction + NEED catalogs.
> Together with `templates.md`, this is the complete boundary specification.

---

## Log Requirement

All sub-agent launches MUST be logged to the active workspace log.

Before launching:
```
| {timestamp} | {SOURCE} | LAUNCHED | {instruction_id}: {detail} |
```

After receiving return:
```
| {timestamp} | {SOURCE} | RETURNED | {STATUS}: {summary} |
```

---

## L0 Payload Shapes

### [MISSION_BRIEF] (Admiral -> Captain)

```
MISSION BRIEF
──────────────
Load Captain identity: ~/.claude/skills/agency/cadre/wardroom/identities/captain.md

STRATEGY: {ship → survey | calibrate}

JOB:
  ticket: {ticket_id}
  summary: {string, <=100 chars}

ARTIFACT POINTERS:
  - dossier: {path | null}
  - scope: {path | null}
  - landscape: {path | null}
  - coordination: {path | null}
  - mission: {path | null}

CONSTRAINTS:
  tickets: [{ticket_id}]
  branch: {branch_name | null}
  scope: {string, <=100 chars | null}

PROJECT CONTEXT:
  config: memory/config.md
  context: memory/project/context.md
  conventions: memory/project/conventions.md
  coordination: memory/project/coordination.md
  failure_catalog: memory/project/failure-class-catalog.md

RETURN CONTRACT: MISSION_RETURN
```

### [MISSION_RETURN] (Captain -> Admiral)

Returned by the Captain on surfacing.

```
MISSION RETURN
───────────────
STATUS: {complete | partial | escalation}
  # complete — all WOs shipped, PR created, E2E passed
  # partial — mid-dive progress (WO shipped, more remain)
  # escalation — requires Admiral routing

DOCKING_READY: {true | false}
  # true — Captain completed docking (PR created, E2E passed)
  # false — Captain surfacing without dock (escalation, partial)

WO_COMPLETED: {WO-N | null}
WO_REMAINING: {N | 0}
PR: {url | N/A}
BRANCH: {branch_name}
GATE_REPORT: {path}
LOG: {path}
NOTES: [{string, <=50 chars}]
```

**STATUS constraints:**
- `complete` is only valid when `DOCKING_READY: true`. No other combination.
- `partial` is only valid when `WO_REMAINING > 0`.
- `escalation` must include ESCALATION payload fields with a valid NEED from the catalog.
- No freeform statuses permitted.
- If context pressure prevents completing docking, return `STATUS: escalation` with `NEED: CONTEXT_EXHAUSTION`.

When `STATUS: escalation`, the return also carries the ESCALATION payload
fields (NEED, CONTEXT, ARTIFACTS, CHECKPOINT). The Agency handles this
per the Escalation Handling protocol.

---

## L1 Payload Shapes

### [LAUNCH_BRIEF] -> Intelligence

```
LAUNCH BRIEF: INTELLIGENCE
───────────────────────────
Load Intelligence division protocol: ~/.claude/skills/agency/divisions/intelligence/intelligence.md
Identity: ~/.claude/skills/agency/cadre/wardroom/identities/chief-analyst.md

INSTRUCTIONS:
  - {instruction_id}         # e.g., INTEL.COLLECT.REFERENCE
  - {instruction_id}         # optional: chain of instructions for multi-step ops

ARTIFACT POINTERS:
  - {path}                   # e.g., memory/dossiers/contacts-delta-2026-02-28.yaml
  - {path}                   # additional artifacts as needed

SURFACE URLS:                # for collection instructions
  - {url}                    # target surface URLs

SCOPE_DOC: {path | null}    # e.g., memory/project/scope.csv (Change 1: scope filtering)

PROJECT CONTEXT:
  config: memory/config.md

RETURN CONTRACT: INTEL_RETURN
```

### [LAUNCH_BRIEF] -> Model Shop

```
LAUNCH BRIEF: MODEL SHOP
──────────────────────────
Load Model Shop division protocol: ~/.claude/skills/agency/divisions/model-shop/model-shop.md
Identity: ~/.claude/skills/agency/cadre/wardroom/identities/model-shop-chief.md

INSTRUCTIONS:
  - {instruction_id}         # e.g., PROD.SURVEY or PROD.FIX

JOB:
  ticket: {ticket_id}
  summary: {string, <=100 chars}

ARTIFACT POINTERS:
  - dossier: {path}          # e.g., memory/dossiers/contacts-reference-2026-02-28.yaml
  - scope: {path | null}     # e.g., ~/.claude/agency-workspace/evidence/contacts/scope-findings.md
  - landscape: {path | null} # e.g., ~/.claude/agency-workspace/evidence/contacts/landscape-findings.md
  - coordination: {path | null} # e.g., ~/.claude/agency-workspace/evidence/contacts/coordination-findings.md

CONSTRAINTS:
  tickets: [{ticket_id}]
  branch: {branch_name | null}
  scope: {string, <=100 chars | null}

PROJECT CONTEXT:
  config: memory/config.md
  context: memory/project/context.md
  conventions: memory/project/conventions.md
  coordination: memory/project/coordination.md
  failure_catalog: memory/project/failure-class-catalog.md

RETURN CONTRACT: MODEL_SHOP_RETURN
```

### [INTEL_RETURN]

Returned by Intelligence sub-agent on completion.

```
INTEL RETURN
────────────
STATUS: {complete | partial | escalation}
INSTRUCTION: {instruction_id}

ARTIFACTS PRODUCED:
  - {path}: {description}    # e.g., memory/dossiers/contacts-reference-2026-02-28.yaml: Reference dossier
  - {path}: {description}    # additional artifacts

SURFACES: {N captured}
FINDINGS: {N total} — {N critical, N major, N minor, N cosmetic}

QA_FINDINGS: {path | null}   # e.g., ~/.claude/agency-workspace/evidence/{domain}/qa-findings.yaml

MISSION: {path | null}       # mission manifest pointer if active

NOTES: [{string, <=50 chars}]
```

When `STATUS: escalation`, the return also carries the ESCALATION payload
fields (NEED, CONTEXT, ARTIFACTS, CHECKPOINT). The Agency handles this
per the Escalation Handling protocol.

### [MODEL_SHOP_RETURN]

Returned by Model Shop sub-agent on completion.

```
MODEL SHOP RETURN
──────────────────
STATUS: {complete | partial | escalation}
  # complete — requires all WOs verified and ready for docking
  # partial — requires WO_REMAINING > 0
  # escalation — requires NEED from catalog
WO_COMPLETED: {WO-N | null}       # which WO this return covers
WO_REMAINING: {N | 0}             # WOs still to build (0 = final)
DOCKING_READY: {true | false}     # all WOs verified, ready for Captain docking
PR: {url | N/A}
BRANCH: {branch_name}
GATE_REPORT: {path}               # pointer to gate report artifact (template: gate-report-v1)
LOG: {path}                        # pointer to production log artifact (jobs/log.md)
NOTES: [{string, <=50 chars}]
```

**STATUS constraints:**
- `complete` is only valid when `DOCKING_READY: true`. No other combination.
- `partial` is only valid when `WO_REMAINING > 0`.
- `escalation` must include ESCALATION payload fields with a valid NEED from the catalog.
- No freeform statuses permitted.

When `STATUS: escalation`, the return also carries the ESCALATION payload
fields (NEED, CONTEXT, ARTIFACTS, CHECKPOINT). The Agency handles this
per the Escalation Handling protocol.

### [ESCALATION]

Structured escalation request. Returned by a sub-agent that needs something
outside its own scope. Not a failure — a routing request (RESOLVE).

```
ESCALATION
──────────
STATUS: escalation
SEVERITY: {routine | terminal}
NEED: {need_id from NEED catalog}
CONTEXT: {string, <=25 words, describes agent state at gap}
ANNOTATION: {string, <=25 words | null}   # terminal only — names the failure
ARTIFACTS:
  - {path}: {description}
CHECKPOINT: {path | null}
```

Production-specific state (branch, last commit, push status) goes into
an artifact file referenced via ARTIFACTS pointer — not top-level fields.
The ESCALATION payload is role-agnostic.

### Escalation Handling (Cascade Protocol)

When a parent receives an ESCALATION:

1. Can I handle it inline? -> do it, feed result back
2. Can a sibling handle it? -> route to sibling, get result, feed back
3. Can nobody at my level handle it? -> escalate up one more layer (wrap artifacts)
4. Reached Director? -> present in BRIEFING with category ESCALATION

Escalation stacking: L3 escalation carries L3 artifacts. If L2 can't
handle it, L2 wraps L3 artifacts + its own and escalates to L1. If L1
can't handle it, L1 wraps and escalates to L0. By the time it reaches
Agency, the full picture is there.

**Severity determines urgency, not routing:**
- **routine** — standard cascade: try siblings, then escalate up
- **terminal** — same cascade, but includes annotation naming the failure.
  If terminal escalation reaches Director, presented as terminal in BRIEFING.

### [BRIEFING]

The mandatory output from every operation. Delivered to the Director.
Produced per template (`templates.md`: briefing-v1).

Category values: `SITUATIONAL | TRIAGE | INVESTIGATION | PRODUCTION | CALIBRATION | ESCALATION | DEBRIEF`

Type values: `progress | escalation | debrief`
- **progress** — informational, pipeline auto-continues, no Director action needed
- **escalation** — Director action required (terminal NEED, auth, ambiguous routing)
- **debrief** — final operation summary

---

## L2/L3 Payload Shapes

CONTRACT requires defined payloads for every boundary crossing. These shapes
define L2->L3 crossings within Intelligence and Model Shop.

### [FIELD_BRIEF] (Chief Analyst -> Field Agent)

```
FIELD BRIEF
───────────
Identity: ~/.claude/skills/agency/cadre/barracks/identities/field-agent.md
Protocol: ~/.claude/skills/agency/divisions/intelligence/collection.md

INSTRUCTION: {instruction_id}    # INTEL.COLLECT.REFERENCE | .IMPLEMENTATION | .AUTH.VERIFY
CALLSIGN: {Hawk | Kite}

TARGET:
  surface: {string}              # surface name from mission manifest
  url: {string}
  capture_type: {reference | implementation}

BROWSER_TOOL: {chrome-devtools | playwright}
  # chrome-devtools for reference app (authenticated, existing browser session)
  # playwright for implementation (localhost, no auth)

SURFACE CONTEXT:
  purpose: {creation | viewing | editing | deletion | management | search}
  user_journey: {string, <=50 words}
  data_flow:
    inputs: [{what data feeds this view}]
    outputs: [{what this view produces}]
    downstream: [{related surfaces that consume this view's output}]
  domain_expectations: {string, <=50 words}
  known_constraints: [{string}]                  # explicit exclusions only
  supplementary_awareness: [{summary} | null]  # optional prior findings, never constrains capture

MISSION CONTEXT:
  domain: {string}
  mission: {path | null}         # mission manifest pointer

EVIDENCE OUTPUT: ~/.claude/agency-workspace/evidence/{domain}/{surface_slug}/

RETURN CONTRACT: FIELD_RETURN
```

### [FIELD_RETURN]

```
FIELD RETURN
────────────
STATUS: {complete | partial | escalation}
INSTRUCTION: {instruction_id}
CALLSIGN: {Hawk | Kite}

ARTIFACTS:
  - {path}: {description}

MANIFEST:
  total_elements: {N}
  exercised: {N}
  remaining: {N}

NOTES: [{string, <=50 chars}]
```

### [DESK_BRIEF] (Chief Analyst -> Desk Analyst)

```
DESK BRIEF
──────────
Identity: ~/.claude/skills/agency/cadre/barracks/identities/desk-analyst.md
Protocol: ~/.claude/skills/agency/divisions/intelligence/{analysis|calibration|cartography}.md
Templates: ~/.claude/skills/agency/templates.md

INSTRUCTION: {instruction_id}    # INTEL.ANALYZE.DELTA | .REFERENCE | INTEL.VERIFY.CONVERGENCE | INTEL.CHART.UPDATE

EVIDENCE POINTERS:
  reference: {path | null}
  implementation: {path | null}

DOSSIER POINTERS:
  delta: {path | null}           # for convergence verification

CHART POINTER:
  chart: {path | null}           # memory/chart.yaml (for cartography)

MISSION CONTEXT:
  domain: {string}
  mission: {path | null}
  supplementary_awareness: {path | null}  # optional prior findings, never constrains analysis

ARTIFACT OUTPUT: ~/.claude/agency-workspace/dossiers/{domain}-{type}-{timestamp}.yaml | memory/chart.yaml

RETURN CONTRACT: DESK_RETURN
```

### [DESK_RETURN]

```
DESK RETURN
───────────
STATUS: {complete | partial | escalation}
INSTRUCTION: {instruction_id}

ARTIFACTS:
  - {path}: {description}

FINDINGS: {N total} — {N critical, N major, N minor, N cosmetic}

CROSS_REFERENCE:                  # if prior_findings provided
  confirmed: {N}
  missed: {N}
  new: {N}

NOTES: [{string, <=50 chars}]
```

### [STATION_BRIEF] (Orchestrator -> Station Worker)

```
STATION BRIEF
─────────────
Identity: {identity_path}
Protocol: {protocol_path}

INSTRUCTION: {PROD.BUILD | PROD.REWORK}
CALLSIGN: {Mason | Slate}

WO: {path}                              # jobs/wo-{N}.md
BRANCH: {branch_name}
STATION: {station_id | null}

ARTIFACT POINTERS:
  - dossier: {path | null}

PROJECT CONTEXT:
  config: {path}
  context: {path}
  conventions: {path}

RETURN CONTRACT: STATION_RETURN
```

### [STATION_RETURN]

```
STATION RETURN
──────────────
STATUS: {complete | partial | escalation}
WO: {wo_id}
STATION: {station_id | null}
BRANCH: {branch_name}
LAST_COMMIT: {sha}
DELIVERABLES_COMPLETED: [{deliverable_id}]
NOTES: [{string, <=50 chars}]
```

### [QC_BRIEF] (Orchestrator -> Inspector)

```
QC BRIEF
────────
Identity: {identity_path}
Protocol: {protocol_path}

INSTRUCTION: PROD.QC
CALLSIGN: Quinn

BRANCH: {branch_name}
WO: {wo_id}
STATION: {station_id | null}

ARTIFACT POINTERS:
  - dossier: {path | null}
  - failure_catalog: {path}
  - reference_specs: {path | null}

PROJECT CONTEXT:
  conventions: {path}

RETURN CONTRACT: QC_RETURN
```

### [QC_RETURN]

```
QC RETURN
─────────
STATUS: {pass | fail | escalation}
INSTRUCTION: PROD.QC
CALLSIGN: Quinn

GATE REPORT: {per gate-report-v1 template — see templates.md}
NOTES: [{string, <=50 chars}]
```
