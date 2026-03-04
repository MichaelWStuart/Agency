# Payload Contracts

> Every sub-agent boundary has two crossing points: input and output.
> Each has an exact format. No prose. No improvisation.
>
> This file defines payload shapes for all boundary crossings.
> See `contracts/catalog.md` for instruction + NEED catalogs.
> Together with `templates.md`, this is the complete boundary specification.

---

## EVENT_RECORD

### Agency Log / Integration Log (4-column)

```
| Time | Source | Event | Detail |
| {ISO-8601 UTC} | {source_enum} | {event_enum} | {string, <=100 chars} |
```

Source enum: `AGENCY` | `INTEL` | `INTEG`
Event enum: per Event Catalog in `contracts/catalog.md`

### Agent Stream (3-column)

```
| Time | Event | Detail |
| {ISO-8601 UTC} | {event_enum} | {string, <=100 chars} |
```

Event enum: per identity file Stream Logging section

---

## Payload Delimiters

Payloads embedded in Agent tool prompts are wrapped:

```
<<<SAGA_PAYLOAD>>>
{payload block}
<<<END_SAGA_PAYLOAD>>>
```

Returns embedded in Agent tool output use the same delimiters.

---

## L0 Payload Shapes

### [MISSION_BRIEF] (Admiral -> Captain)

```
MISSION BRIEF
──────────────
Load Captain identity: ~/.claude/skills/agency/afloat/captain.md

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
  # complete — all integration plots shipped, PR created, E2E passed
  # partial — mid-dive progress (plot shipped, more remain)
  # escalation — requires Admiral routing

DOCKING_READY: {true | false}
  # true — Captain completed docking (PR created, E2E passed)
  # false — Captain surfacing without dock (escalation, partial)

PLOT_COMPLETED: {IP-N | null}
PLOT_REMAINING: {N | 0}
PR: {url | N/A}
BRANCH: {branch_name}
VALIDATION_REPORT: {path}
LOG: {path}
NOTES: [{string, <=50 chars}]
```

INVARIANTS:
  - IF STATUS == complete THEN DOCKING_READY == true
  - IF STATUS == partial THEN PLOT_REMAINING > 0
  - IF STATUS == escalation THEN FIELDS(NEED, CONTEXT, ARTIFACTS, CHECKPOINT) PRESENT
  - STATUS IN (complete, partial, escalation)
  - IF context pressure prevents docking THEN STATUS == escalation AND NEED == CONTEXT_EXHAUSTION

When `STATUS: escalation`, the return also carries the ESCALATION payload
fields (NEED, CONTEXT, ARTIFACTS, CHECKPOINT). The Agency handles this
per the Escalation Handling protocol.

---

## L1 Payload Shapes

### [LAUNCH_BRIEF] -> Intelligence

```
LAUNCH BRIEF: INTELLIGENCE
───────────────────────────
Load Intelligence department protocol: ~/.claude/skills/agency/afloat/intelligence/intelligence.md
Identity: ~/.claude/skills/agency/afloat/intelligence/chief-analyst.md

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

### [LAUNCH_BRIEF] -> Integration

```
LAUNCH BRIEF: INTEGRATION
──────────────────────────
Load Integration department protocol: ~/.claude/skills/agency/afloat/integration/integration.md
Identity: ~/.claude/skills/agency/afloat/integration/integration-chief.md

INSTRUCTIONS:
  - {instruction_id}         # e.g., INTEG.SURVEY or INTEG.FIX

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

RETURN CONTRACT: INTEGRATION_RETURN
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

### [INTEGRATION_RETURN]

Returned by Integration sub-agent on completion.

```
INTEGRATION RETURN
──────────────────
STATUS: {complete | partial | escalation}
  # complete — requires all plots validated and ready for docking
  # partial — requires PLOT_REMAINING > 0
  # escalation — requires NEED from catalog
PLOT_COMPLETED: {IP-N | null}       # which integration plot this return covers
PLOT_REMAINING: {N | 0}             # plots still to compile (0 = final)
DOCKING_READY: {true | false}       # all plots validated, ready for Captain docking
PR: {url | N/A}
BRANCH: {branch_name}
VALIDATION_REPORT: {path}           # pointer to validation report artifact (template: validation-report-v1)
LOG: {path}                          # pointer to integration log artifact (jobs/log.md)
NOTES: [{string, <=50 chars}]
```

INVARIANTS:
  - IF STATUS == complete THEN DOCKING_READY == true
  - IF STATUS == partial THEN PLOT_REMAINING > 0
  - IF STATUS == escalation THEN FIELDS(NEED, CONTEXT, ARTIFACTS, CHECKPOINT) PRESENT
  - STATUS IN (complete, partial, escalation)

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

INVARIANTS:
  - STATUS == escalation
  - SEVERITY IN (routine, terminal)
  - NEED IN (NEED catalog)
  - IF SEVERITY == terminal THEN ANNOTATION PRESENT

Integration-specific state (branch, last commit, push status) goes into
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

Category values: `SITUATIONAL | TRIAGE | INVESTIGATION | INTEGRATION | CALIBRATION | ESCALATION | DEBRIEF`

Type values: `progress | escalation | debrief`
- **progress** — informational, pipeline auto-continues, no Director action needed
- **escalation** — Director action required (terminal NEED, auth, ambiguous routing)
- **debrief** — final operation summary

---

## L2/L3 Payload Shapes

CONTRACT requires defined payloads for every boundary crossing. These shapes
define L2->L3 crossings within Intelligence and Integration.

### [FIELD_BRIEF] (Chief Analyst -> Field Agent)

```
FIELD BRIEF
───────────
Identity: ~/.claude/skills/agency/afloat/intelligence/field-agent.md
Protocol: ~/.claude/skills/agency/afloat/intelligence/collection.md

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
Identity: ~/.claude/skills/agency/afloat/intelligence/desk-analyst.md
Protocol: ~/.claude/skills/agency/afloat/intelligence/{analysis|calibration|cartography}.md
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

### [COMPILE_BRIEF] (Orchestrator -> Integration Engineer)

```
COMPILE BRIEF
─────────────
Identity: {identity_path}
Protocol: {protocol_path}

INSTRUCTION: {INTEG.COMPILE | INTEG.REWORK}
CALLSIGN: {Atlas | Folio}

PLOT: {path}                              # jobs/ip-{N}.md
BRANCH: {branch_name}
STATION: {station_id | null}

ARTIFACT POINTERS:
  - dossier: {path | null}

PROJECT CONTEXT:
  config: {path}
  context: {path}
  conventions: {path}

RETURN CONTRACT: COMPILE_RETURN
```

### [COMPILE_RETURN]

```
COMPILE RETURN
──────────────
STATUS: {complete | partial | escalation}
PLOT: {plot_id}
STATION: {station_id | null}
BRANCH: {branch_name}
LAST_COMMIT: {sha}
DELIVERABLES_COMPLETED: [{deliverable_id}]
NOTES: [{string, <=50 chars}]
```

### [VALIDATION_BRIEF] (Orchestrator -> Inspector)

```
VALIDATION BRIEF
────────────────
Identity: {identity_path}
Protocol: {protocol_path}

INSTRUCTION: INTEG.VALIDATE
CALLSIGN: Datum

BRANCH: {branch_name}
PLOT: {plot_id}
STATION: {station_id | null}

ARTIFACT POINTERS:
  - dossier: {path | null}
  - failure_catalog: {path}
  - reference_specs: {path | null}

PROJECT CONTEXT:
  conventions: {path}

RETURN CONTRACT: VALIDATION_RETURN
```

### [VALIDATION_RETURN]

```
VALIDATION RETURN
─────────────────
STATUS: {pass | fail | escalation}
INSTRUCTION: INTEG.VALIDATE
CALLSIGN: Datum

VALIDATION REPORT: {per validation-report-v1 template — see templates.md}
NOTES: [{string, <=50 chars}]
```

---

## Guard Payloads

### [GUARD_VIOLATION]

```
GUARD VIOLATION
───────────────
LEVEL: {1 | 2}
PHASE: {dispatch | return | log}
PAYLOAD_TYPE: {payload_type_enum}
VIOLATIONS:
  - CODE: {violation_code}
    FIELD: {field_name | null}
    EXPECTED: {string, <=100 chars}
    ACTUAL: {string, <=100 chars}
ACTION: {correct_and_redispatch | review_warning}
```

Violation codes: `MISSING_FIELD`, `INVALID_ENUM`, `INVARIANT_VIOLATED`,
`UNKNOWN_INSTRUCTION`, `UNKNOWN_NEED`, `UNKNOWN_SOURCE`, `UNKNOWN_EVENT`,
`POINTER_MISSING`, `UNKNOWN_PAYLOAD`, `MISSING_DELIMITER`, `HEADER_MISMATCH`,
`LENGTH_EXCEEDED`, `DRIFT_DETECTED`.
