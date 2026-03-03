# Collection Department

> Capture raw evidence from target surfaces via browser automation.
> Manifest-driven, element-level capture with structured interaction recording.
>
> **Note:** Non-browser collection (SCOPE, LANDSCAPE, COORDINATION)
> is executed inline by the Chief Analyst — not routed through this
> department. See `intelligence.md` step 4.

---

## Department I/O

**Input:** Browser collection instruction (INTEL.COLLECT.REFERENCE | .IMPLEMENTATION | INTEL.AUTH.VERIFY) + target surface URLs
**Output:** Evidence artifacts at `~/.claude/agency-workspace/evidence/`

---

## Collection Types

### Auth Verification (INTEL.AUTH.VERIFY)

Verify reference app browser session is authenticated.

**Input:** None (navigates to reference app)
**Output:** Auth status

1. Connect via Chrome DevTools MCP: `list_pages` -> `select_page`
2. `take_snapshot` on current page
3. If snapshot shows app content (navigation, data) → return success
4. If snapshot shows login indicators (SSO form, "Sign in" heading,
   login redirect) → return ESCALATION with NEED: `REFERENCE_AUTH`

### Reference App Capture (INTEL.COLLECT.REFERENCE)

Capture element-level evidence from the reference app (HubSpot)
for a domain surface using the 3-phase capture protocol.

### Implementation Capture (INTEL.COLLECT.IMPLEMENTATION)

Capture the same evidence from our app (HubShot) for comparison.

---

## Granularity Model

```
Surface (page/view)
  └── Component (form, toolbar, panel, modal)
       └── Element (button, input, select, link, icon)
            └── Interaction (click, type, select, hover, submit)
```

Collection operates at **element** level. Analysis groups into
**component** level. Calibration tracks at **surface** level.

---

## Capture Protocol — 3 Phases

### Browser Setup

1. Connect via Chrome DevTools MCP:
   - `list_pages` -> identify target app page
   - `select_page` -> connect
   - `take_snapshot` -> verify content (also serves as auth check)
2. Collect navigation parameters: portalId, sample objectId, base URL

### Phase 1 — Breadth (Structural Capture)

Observation only. No clicking. Captures 62% of known bug categories.

1. Navigate to surface, wait for load
2. `take_snapshot(verbose: true)` — full ARIA tree
3. Enumerate every interactive element from snapshot: build manifest
4. Record for each element:
   - name, tag, role, type
   - placeholder, default value
   - ARIA attributes (label, expanded, selected, required)
   - options (for selects/comboboxes)
   - component grouping (which logical component contains this element)
5. Produces: **element manifest** + **resting-state snapshot**

### Phase 2 — Depth (Content + Behavioral Capture)

Per element in manifest, top-to-bottom. Captures 38% of known bug categories.

**Content mode** (info icons, tooltips, popovers):
1. Click/hover to reveal
2. Snapshot revealed content
3. Record text content verbatim
4. Dismiss, verify return to resting state

**Behavioral mode** (multi-step flows):
1. Define scenario in Given/When/Then:
   - Given: {precondition}
   - When: {action}
   - Then: {expected outcome}
2. Execute action
3. Snapshot result (includeSnapshot: true on click/fill)
4. Record: what happened vs what was expected
5. Capture network requests if relevant

After exercising each element, check it off in the manifest.

### Component-Type Interaction Matrix

Phase 2 MUST exercise the following interactions per component type.
Check each off in the manifest. If a behavior cannot be verified (e.g.,
iframe blocks access), flag as `unverifiable:{reason}` in the manifest.

| Component Type | Required Interactions |
|---|---|
| Select / Combobox | Open dropdown. Check for search/filter input inside. Scroll full option list. Record all options verbatim. Check for "no results" state. Close without selecting. |
| Text Input | Type valid value. Clear and type invalid value (if validation exists). Check placeholder vs label. Check character limit behavior. Tab away (blur) — record any validation message. |
| Textarea | Same as text input + check for auto-resize behavior. |
| Phone Input | Enter valid number. Enter invalid number. Check country code behavior. Check formatting on blur. |
| Date Picker | Open picker. Check for manual text entry. Check date format. Check range constraints. |
| Checkbox / Toggle | Click to toggle on. Click to toggle off. Check associated label/help text. Check if state persists across form interactions. |
| Button | Click. Record action. If disabled, record disabled state and conditions for enablement. |
| Link | Click. Record navigation target. Check if new tab/window. |
| Info Icon / Tooltip | Hover to reveal. Record full tooltip/popover text verbatim. Check dismiss behavior. |
| Modal / Dialog | Record trigger. Record all interactive elements within (recursive — treat as sub-surface). Record close/dismiss behavior. |
| Dropdown Menu | Open. Record all menu items. Click each item (or record expected action). Check for sub-menus. |

### Phase 2b — Edge Cases (Adversarial + Cross-Action)

After Phase 2 completes for all elements, exercise these mandatory
scenarios. Each scenario produces an interaction recording.

**Input Edge Cases (per input field in manifest):**

| Input Type | Mandatory Scenarios |
|---|---|
| Email | Empty submit, invalid format (no @), duplicate of existing record |
| Text (required) | Empty submit, whitespace-only, max length + 1 character |
| Text (optional) | Leave empty, verify form still submits |
| Phone | Invalid format, letters in number field, country code edge cases |
| Select (required) | Submit without selection, re-select after clearing |
| Numeric | Zero, negative, non-numeric characters, decimal where integer expected |

**Cross-Action Scenarios (per surface):**

| Scenario | What to Test |
|---|---|
| Duplicate submission | Submit valid form. Without resetting, submit same data again. Record: does it succeed, fail, warn? |
| Minimal submission | Submit with only required fields. Record: which fields are actually required? |
| Rapid submission | Click submit button twice quickly. Record: double-submission protection? |
| Cancel mid-form | Fill partial data, cancel. Re-open form. Record: is prior data retained or cleared? |
| Form reset | If a reset/clear button exists, fill form, reset, verify all fields return to default. |

**Error State Recording:**

For each validation error triggered:
1. Record the exact error message text
2. Record where the error appears (inline, toast, banner, field-level)
3. Record whether the field is highlighted/marked
4. Record recovery: what action clears the error?

### Phase 3 — Stateful (Post-Action Surfaces)

After submit, creation, or navigation: treat result as new surface.
Run Phase 1 + 2 on the resulting state. Forward-only — no undo/reset
between captures.

**Post-action verification checklist:**

1. **Success path:** Submit with valid data. Record success indicator
   (toast, redirect, list update, confirmation message). Treat the
   resulting surface as a new capture target (Phase 1 + 2).
2. **Created record verification:** If the action created a record,
   navigate to where that record should appear (list view, detail view).
   Verify it exists with correct data.
3. **Form state after submission:** Does the form clear? Does it close?
   Does it stay open with data? Record the behavior.
4. **Error path:** Submit with intentionally invalid data (from Phase 2b
   edge cases). Record error display, recovery path, and form state
   preservation.

---

## Core Interaction Loop

```
1. SNAPSHOT         → take_snapshot(verbose: true)
2. IDENTIFY         → Parse snapshot for target uid
3. INTERACT+OBSERVE → click(uid, includeSnapshot: true) or fill(uid, value)
4. RECORD           → Diff pre/post snapshots, capture network
5. CHECK OFF        → Mark element complete in manifest
6. REPEAT           → Next element in manifest
```

**Primary tool:** Chrome DevTools MCP (`includeSnapshot` saves round-trips).
**Secondary:** Playwright MCP (`browser_run_code` for edge cases,
`slowly: true` for search fields with key handlers).

---

## Auth Detection

See field agent identity for detection trigger. See `intelligence.md`
Auth Escalation Protocol for the full cascade.

---

## Evidence Artifacts

Evidence is written to `~/.claude/agency-workspace/evidence/{domain}/`:

```
~/.claude/agency-workspace/evidence/{domain}/
  manifest.yaml               # element manifest with capture status
  resting-state.md            # ARIA snapshot of surface at rest
  interactions/               # per-element interaction recordings
    {element-slug}.md         # snapshot diffs, network, notes
  screenshots/                # PNG per view/state
  snapshots/                  # full ARIA snapshots at key states
  network-behavior.md         # API call patterns (list views)
  timing-profile.md           # Interaction timing (interactive views)
```

---

## Reference App URL Patterns

| Domain | Object Code | List URL Pattern | Record URL Pattern |
|---|---|---|---|
| Contacts | 0-1 | /contacts/{portalId}/objects/0-1/views/all/list | /contacts/{portalId}/record/0-1/{objectId} |
| Companies | 0-2 | /contacts/{portalId}/objects/0-2/views/all/list | /contacts/{portalId}/record/0-2/{objectId} |
| Deals | 0-3 | /contacts/{portalId}/objects/0-3/views/all/list | /contacts/{portalId}/record/0-3/{objectId} |
| Tickets | 0-5 | /contacts/{portalId}/objects/0-5/views/all/list | /contacts/{portalId}/record/0-5/{objectId} |

---

## Network Behavior Capture (Mandatory for list views)

For each data operation (search, filter, sort, pagination, initial load):

1. Start network monitoring
2. Perform action, record what fires
3. Inspect request/response shapes
4. Note: client-side vs server-side, debounce delay, timing

---

## Verification

After capture, cross-check:
- Every element in manifest is marked captured or has notes explaining why not
- Every target surface has a resting-state snapshot
- List views have network behavior captured
- Interactive views have timing profiles
- All evidence artifacts exist at declared paths
- Manifest element count matches snapshot element count

---

## Troubleshooting

- **Dynamic content not loading:** Increase timeout, wait for specific last-loading element
- **Too much noise:** Use verbose snapshot filtering, focus on interactive elements
- **Shadow DOM / iframes:** Access via `document.querySelector('iframe').contentDocument`
- **Auth expired:** Checkpoint manifest, escalate per auth detection protocol
- **Large pages:** Capture sections individually, merge manifests
- **Iframe-blocked components in reference app:** When a component is
  inside an iframe that blocks inspection:
  1. Record what IS visible from the parent frame (label, visible state)
  2. Flag the component as `unverifiable:{iframe}` in the manifest
  3. In the IMPLEMENTATION capture, exercise the equivalent component
     fully (it's not iframe-blocked in our app)
  4. In the delta analysis, the Desk Analyst will flag these as
     "reference unverifiable" — they're neither MATCHED nor MISSING,
     they're UNKNOWN. The delta dossier should call these out explicitly
     so Production and QA can manually verify.
