# Artifact Templates

> Every artifact type has a defined template. Agents produce artifacts
> by filling templates, not composing freeform content.
>
> Template compliance is the minimum bar. An artifact that doesn't
> match its template is invalid.

---

## Dossier — Reference (dossier-reference-v1)

```yaml
# DOSSIER — REFERENCE
# Template: dossier-reference-v1
---
metadata:
  domain: {string}              # e.g., "contacts", "lists"
  timestamp: {ISO-8601}
  strategy: survey
  producer: intelligence/analysis

surfaces:
  - name: {string}              # e.g., "Contact List View"
    url: {string}               # reference app URL
    evidence:
      dom_hierarchy: {path}     # pointer to evidence artifact
      network_behavior: {path}
      timing_profile: {path | null}
      screenshots: [{path}]

findings:
  - id: {F-NNN}
    severity: {critical | major | minor | info}
    surface: {string}
    category: {layout | behavior | data | timing}
    observation: {string}       # what the reference app does
    evidence_ref: {path}

summary:
  total_findings: {number}
  by_severity: {critical: N, major: N, minor: N, info: N}
  recommendation: {string}     # one sentence
```

---

## Dossier — Delta (dossier-delta-v1)

```yaml
# DOSSIER — DELTA
# Template: dossier-delta-v1
---
metadata:
  domain: {string}
  surface: {string}                  # specific surface within domain (e.g., "create-contact-form")
  timestamp: {ISO-8601}
  strategy: calibrate
  producer: intelligence/analysis
  mission: {string | null}           # mission manifest name if part of a mission
  iteration: {number}                # calibrate loop position (1 = first pass)
  reference_dossier: {path | null}   # pointer to reference dossier if exists

surfaces:
  - name: {string}
    reference_url: {string}
    implementation_url: {string}
    evidence:
      reference: {path}
      implementation: {path}

fidelity_score: {number | null}      # percent (0-100) — overall behavioral match. null if not assessed

gaps:
  - id: {D-NNN}
    surface: {string}
    component: {string}             # logical group (e.g., "Contact Form", "Search Toolbar")
    element: {string | null}        # specific element (e.g., "Phone Input", "Search Icon")
    layer: {1 | 2 | 3 | 4}         # comparison layer: 1=surface, 2=element, 3=state, 4=behavior
    category: {missing | type_mismatch | content_mismatch | behavior_mismatch | state_mismatch | cosmetic}
    severity: {critical | major | minor | cosmetic}
    priority: {P0 | P1 | P2 | P3}  # P0=ship-blocking, P1=significant, P2=completeness, P3=polish
    expected: {string}              # what the reference app does
    actual: {string}                # what our app does
    evidence:
      reference: {path}
      implementation: {path}
    fix_scope: {S | M | L}

summary:
  total_gaps: {number}
  by_severity: {critical: N, major: N, minor: N, cosmetic: N}
  by_priority: {P0: N, P1: N, P2: N, P3: N}
  by_fix_scope: {S: N, M: N, L: N}
  recommendation: {string}

matches:                             # components that match reference well — prevents false negatives
  - component: {string}
    note: {string}

cross_reference:                    # only if prior_findings provided
  confirmed: [{gap_id, ticket}]     # Intel found independently (validates methodology)
  missed: [{ticket, summary}]       # QA found, Intel didn't (methodology gap)
  new: [{gap_id}]                   # Intel found, QA didn't (Intel value)
```

---

## Dossier — Convergence (dossier-convergence-v1)

```yaml
# DOSSIER — CONVERGENCE
# Template: dossier-convergence-v1
---
metadata:
  domain: {string}
  timestamp: {ISO-8601}
  strategy: calibrate
  producer: intelligence/calibration
  delta_dossier: {path}         # pointer to the delta dossier being verified
  iteration: {number}           # calibration loop iteration count

verifications:
  - gap_id: {D-NNN}            # from delta dossier
    status: {RESOLVED | REMAINING | REGRESSED}
    evidence_ref: {path}
    notes: {string | null}

regressions:                    # new gaps introduced by fixes
  - id: {R-NNN}
    severity: {critical | major | minor | cosmetic}
    surface: {string}
    description: {string}
    evidence_ref: {path}

summary:
  total_verified: {number}
  resolved: {number}
  remaining: {number}
  regressed: {number}
  recommendation: {accept | loop_targeted | loop_regressions | escalate}
  rationale: {string}
```

---

## Gate Report (gate-report-v1)

```yaml
# GATE REPORT
# Template: gate-report-v1
---
metadata:
  wo: {WO-N}
  station: {S-M | null}
  timestamp: {ISO-8601}
  producer: model-shop/verification

gates:
  - id: 1
    name: Validation
    verdict: {PASS | FAIL}
    detail: {string}           # commands run, results
  - id: 2
    name: FC Audit
    verdict: {PASS | FAIL}
    detail: {string}
  - id: 3
    name: Browser QA
    verdict: {PASS | FAIL}     # never N/A
    detail: {string}
  - id: 4
    name: Network
    verdict: {PASS | FAIL | N/A}
    detail: {string}
  - id: 5
    name: E2E
    verdict: {PASS | FAIL | N/A}
    detail: {string}

overall_verdict: {PASS | FAIL}
failure_details: [{gate_id, reason}] | null
```

---

## Work Order (work-order-v1)

```yaml
# WORK ORDER
# Template: work-order-v1
---
metadata:
  id: {WO-N}
  job: {ticket ID}
  timestamp: {ISO-8601}
  producer: model-shop/planning
  depends_on: {WO-N-1 | null}

scope:
  title: {string}
  tickets: [{ticket_id: string, title: string, status: string}]
  deliverables:
    - id: {D-N}
      description: {string}
      files: [{path}]           # expected files to create/modify
      acceptance: {string}      # how to verify this deliverable

constraints:
  coordination: {string | null}
  dependencies: [{string}]
  branch: {string}              # branch name for this WO

station_count: {1 | 2}
stations:                       # only if station_count > 1
  - id: {S-M}
    deliverables: [{D-N}]       # deliverable IDs assigned to this station
```

---

## Inventory (inventory-v1)

```yaml
# INVENTORY
# Template: inventory-v1
---
metadata:
  job: {ticket ID or description}
  timestamp: {ISO-8601}
  producer: model-shop/receiving
  material_type: {crude | feedstock | work_order | product | verified_product}
  entry_department: {string}

summary: {string}               # one sentence describing the job

artifact_index:
  - path: {string}
    type: {inventory | spec | reference | branch | dossier}
    description: {string}

current_state:
  branch: {string | null}
  uncommitted_work: {boolean}
  open_prs: [{number: N, url: string}]

stripped_contaminants:           # omit if nothing stripped
  - type: {wo_outline | implementation_plan | prior_artifact}
    summary: {string}
```

---

## Evidence (evidence-v1)

```yaml
# EVIDENCE
# Template: evidence-v1
---
metadata:
  domain: {string}
  surface: {string}
  capture_type: {reference | implementation}
  timestamp: {ISO-8601}
  producer: intelligence/collection

artifacts:
  dom_hierarchy: {path | null}        # resting-state a11y tree (single)
  network_behavior: {path | null}
  timing_profile: {path | null}
  screenshots: [{path}]
  snapshots: [{path}]                 # interaction-state a11y snapshots (multiple)

manifest:
  total_elements: {number}
  exercised: {number}
  remaining: {number}
  elements:
    - name: {string}
      component: {string}
      type: {string}
      mode: {structural | content | behavioral}
      captured: {boolean}
      notes: {string | null}

capture_metadata:
  url: {string}
  portal_id: {string | null}
  setup_steps: [{string}]       # clicks/navigation to reach this state
```

---

## Briefing (briefing-v1)

```yaml
# BRIEFING
# Template: briefing-v1
---
metadata:
  division: {Intelligence | Model Shop | Agency}
  operation: {string, <=100 chars}
  strategy: {survey | calibrate | N/A}
  category: {SITUATIONAL | TRIAGE | INVESTIGATION | PRODUCTION | CALIBRATION | ESCALATION | DEBRIEF}
  type: {progress | escalation | debrief}
    # progress — informational, pipeline auto-continues
    # escalation — Director action required
    # debrief — final operation summary

situation: {string, <=500 chars}        # what prompted the operation
assessment: {string, <=500 chars}       # analysis of findings
actions_taken:                          # what was done
  - action: {string, <=200 chars}
    result: {string, <=100 chars}
results:
  artifacts: [{path}]                   # produced artifacts
  summary: {string, <=300 chars}        # outcome in one paragraph
recommendations:
  - recommendation: {string, <=200 chars}
    priority: {immediate | next | backlog}
```

---

## Mission Manifest (mission-manifest-v1)

```yaml
# MISSION MANIFEST
# Template: mission-manifest-v1
---
metadata:
  name: {string}                  # e.g., "Sales Hub Calibration — Contacts & Lists"
  domain: [{string}]              # e.g., [contacts, lists]
  strategy: {survey | calibrate}
  scope_doc: {path | null}        # e.g., memory/project/scope.csv
  scope_areas: [{string}]         # e.g., [Contacts, Lists] — filter keys for scope CSV
  created: {ISO-8601}
  status: {planned | active | complete}

objectives:                       # generalized goals, not ticket-specific
  - {string}                      # e.g., "Cover all in-scope gaps for Contacts surfaces"

exclusions:                       # surfaces/features explicitly out of scope
  - {string}                      # e.g., "AI/Breeze features", "Advanced Filters"

overrides:                        # Director-authorized items that must not be cut
  - {string}                      # e.g., "LV-D-010: Quick Filters"

operations:                       # sequential phases within this mission
  - id: {number}                  # e.g., 1
    name: {string}                # e.g., "Quick Filters"
    ticket: {ticket_id}           # Linear ticket for this operation
    pr: {number | null}           # PR number when shipped
    status: {planned | active | complete}
    surfaces: [{string}]          # surfaces this operation covers
    gaps_resolved: {number | null}

surfaces:
  - name: {string}
    sub_surfaces: [{string}]      # e.g., [contacts-list-view, create-contact-form]
    captured: {boolean}
    delta_analyzed: {boolean}
    fixes_applied: {boolean}
    convergence_verified: {boolean}
    dossier_chain: [{path}]       # ordered: reference → delta → convergence
    note: {string | null}         # optional context (e.g., "Baseline components")

prior_intelligence:               # valid dossiers from prior runs — omit if none
  note: {string | null}           # context about validity
  dossier_chain: [{path}]         # ordered list of valid dossier paths
  chart: {path | null}            # reference topology chart

discovery:                        # how tickets are found for this mission
  method: {string}                # e.g., "scope-doc + linear-query (label/domain-based)"
  note: {string | null}           # caveats about discovery

progress:
  total_surfaces: {number}
  captured: {number}
  analyzed: {number}
  converged: {number}
```

---

## QA Findings (qa-findings-v1)

```yaml
# QA FINDINGS
# Template: qa-findings-v1
---
metadata:
  domain: {string}
  timestamp: {ISO-8601}
  scope_doc_version: {scope CSV mtime}
  linear_query: {query description}

in_scope:
  - ticket_id: {ROM-XXX}
    title: {string}
    area: {string}                # Area from scope CSV
    scope_task: {string | null}   # matching task from scope CSV, or null
    dossier_overlap: {string | null}  # dossier file + finding ID, or null
    status: {pending | shipped | verified}

out_of_scope:
  - ticket_id: {ROM-XXX}
    title: {string}
    area: {string}
    reason: {string}

reconciliation:
  confirmed: {number}            # overlaps dossier findings
  new_markers: {number}          # dossier missed these
  out_of_scope: {number}         # excluded by scope CSV
```

---

## Dossier Index (dossier-index-v1)

```yaml
# DOSSIER INDEX
# Template: dossier-index-v1
# Location: memory/dossiers/index.yaml
# Maintained by Chief Analyst during promotion (intelligence.md step 12)
# Consumed by Admiral (mission planning) and Planning (feedstock initialization)
---
entries:
  - domain: {string}              # e.g., "contacts"
    surface: {string}             # e.g., "create-contact-form"
    type: {reference | delta | convergence}
    strategy: {survey | calibrate}
    timestamp: {ISO-8601}
    file: {string}                # filename relative to memory/dossiers/
```

---

## Chart Topology (chart-topology-v1)

```yaml
# CHART — REFERENCE TOPOLOGY
# Template: chart-topology-v1
---
meta:
  version: {number}
  last_survey: {ISO-8601}
  coverage:
    nodes:
      total: {number}
      unmapped: {number}
      discovered: {number}
      surveyed: {number}
    edges:
      total: {number}
      confirmed: {number}
      inferred: {number}
    regions: {number}

node_types:
  {type-id}:                        # e.g., "list-view", "form-overlay"
    description: {string}
    route_pattern: {string}
    invariant_categories: [{navigation | data | action | feedback}]

nodes:
  {node-id}:                        # e.g., "contacts-list-view"
    name: {string}
    route: {string}
    type: {type-id}
    region: {string}                # e.g., "CRM", "Marketing"
    status: {unmapped | discovered | surveyed}
    parent: {node-id | null}
    surveys: [{ISO-8601}]           # dates of evidence passes
    components: [{component-id}]    # shared components on this surface
    notes: {string | null}

edges:
  - from: {node-id}
    to: {node-id}
    trigger: {string}              # e.g., "toolbar create button", "name link click"
    type: {navigation | trigger | association}
    status: {confirmed | inferred}
    survey: {ISO-8601 | null}

shared:
  {component-id}:                   # e.g., "global-header", "left-sidebar"
    name: {string}
    elements: [{string}]            # key elements within the component
    appears_on: [{node-id}]
```
