# Failure Class Catalog

> **Purpose:** A growing catalog of bug classes discovered through PR reviews
> (Cursor bot, human review, QA). Each class has a check procedure that an
> agent can mechanically evaluate against modified files. Referenced at three
> points in Production:
>
> 1. **Stage 4 (Plan Creation):** Read the full catalog. Annotate each
>    deliverable with applicable FC-N classes.
> 2. **Phase End step 2b (Failure Class Audit):** Audit modified files
>    against every applicable class before Browser QA.
> 3. **Phase End step 6b (FC Upsert):** After every Cursor bot bug fix,
>    evaluate whether the bug is a new failure class and add it.
>
> **Analytics:** Each class tracks severity, detection layer, sub-classes,
> related FCs, and an occurrence log. This data enables vigilance scoring
> (frequent classes get more audit attention) and trend analysis (declining
> classes = validation is working; rising classes = need architectural fix).

---

## Schema Reference

Each FC entry has these fields:

| Field | Type | Purpose |
|-------|------|---------|
| **Pattern** | prose | What goes wrong and why |
| **Check procedure** | checklist | What the agent mechanically verifies |
| **Severity** | `silent` / `visible` / `crash` | Impact when the bug slips to production |
| **Detection layer** | ordered list | Where this is typically catchable, from cheapest to most expensive: `typescript` → `lint/format` → `unit-test` → `e2e` → `browser-qa` → `cursor-bot` → `manual-review` → `production` |
| **Applicability** | `universal` / scope description | Which file types or patterns this applies to |
| **Sub-classes** | named variants | Distinct manifestations of the same root cause |
| **Related FCs** | FC-N list | Classes that tend to co-occur or share root causes |
| **Originating PR** | PR # | Where the class was first identified |
| **Occurrences** | append-only log | Every time this class is caught or slips through |

**Occurrence log entry format:**
```
- PR#NNN Phase N `file.ts` | caught-by: audit|cursor-bot|e2e|browser-qa|human | slipped: yes|no
```
- `caught-by`: which detection method actually found it
- `slipped`: `yes` if it was NOT caught by the Phase End audit (step 2b)
  and was instead found downstream (cursor-bot, browser-qa, etc.)

**Derived metrics (computed on demand, not stored):**
- **Frequency:** total occurrence count
- **Slip-through rate:** occurrences where `slipped: yes` / total
- **Vigilance score:** `frequency × severity-weight × slip-through-rate`
  (severity weights: silent=3, visible=2, crash=1 — silent bugs are
  hardest to catch so they get the highest vigilance multiplier)
- **Trend:** compare last-5 vs prior-5 occurrences — rising/stable/declining

---

## Catalog

### FC-1: Single Source of Truth

**Pattern:** A value→label map, constant array, or config object is duplicated
across multiple files. The copies drift out of sync.

**Check procedure:**
- For every value→label map or constant array introduced or modified in this
  phase, `grep` for the map name or its literal values across the codebase.
- If the same mapping exists in more than one file, consolidate to a single
  source in `lib/constants/` and import everywhere else.

**Severity:** `silent` — drifted copies produce wrong labels or broken lookups
with no error.

**Detection layer:** `cursor-bot` (typically caught in review, not by tooling)

**Applicability:** universal — any file that defines or consumes value→label
maps, constant arrays, or config objects.

**Sub-classes:**
- **FC-1a: Map duplication** — same value→label map copy-pasted in two files
- **FC-1b: Inline literals** — raw string values hardcoded instead of
  imported from the canonical constant (e.g., `'lead'` instead of
  `LIFECYCLE_STAGES[0]`)
- **FC-1c: Parallel key mapping** — two separate maps that must stay in sync
  (e.g., `COLUMN_TO_PROPERTY` in one file and `buildContactProperties` in
  another both mapping the same form fields to the same API keys)

**Related FCs:** FC-2 (case mismatch amplifies duplication bugs), FC-3 (wrong
source leads to wrong Select values)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 1 `contact-list-table.tsx` | caught-by: human | slipped: yes
- PR#108 Phase 1 `record-to-contact-list.ts` | caught-by: human | slipped: yes

---

### FC-2: Case-Insensitive Lookup

**Pattern:** A label lookup uses exact key match, but DB values arrive in
inconsistent casing (e.g., `"OPEN"` vs `"open"`). The lookup silently fails
and falls through to a raw value or empty display.

**Check procedure:**
- Every `map[key]` lookup where `key` comes from API/DB data must use
  `.toLowerCase()` (or equivalent normalization) on the key.
- Check: `map[value.toLowerCase()]`, not `map[value]`.

**Severity:** `silent` — wrong display text, no error thrown.

**Detection layer:** `browser-qa` (only visible when real data has mixed casing)

**Applicability:** any file that does `map[value]` where `value` originates
from API response or database query.

**Sub-classes:**
- **FC-2a: Display lookup** — value→label lookup for rendering (shows raw
  value instead of label)
- **FC-2b: Filter comparison** — filter logic compares user selection
  (normalized) against DB value (unnormalized), silently excluding matches
- **FC-2c: Reverse lookup** — label→value reverse map fails because the
  label was stored in a different case than expected

**Related FCs:** FC-1 (if the map is duplicated, one copy might normalize
and the other might not), FC-4 (draft normalization is a special case)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 1 `record-to-contact-list.ts` | caught-by: human | slipped: yes

---

### FC-3: Select Value = Map Key

**Pattern:** A `<Select>` component's `<SelectItem value={...}>` uses display
labels instead of raw map keys. Saving writes the label to the DB instead of
the raw value. Or the reverse: `value` uses raw keys but the comparison logic
expects labels.

**Check procedure:**
- For every `<Select>` / `<SelectItem>`: `value` prop must be the map key
  (the raw value stored in DB), and the displayed text must be the map value
  (the human-readable label).
- Verify: what gets written to the API on save is the raw key, not the label.

**Severity:** `silent` — wrong data written to DB, no error. May corrupt data
that's hard to recover.

**Detection layer:** `browser-qa` (only visible when you save and re-fetch,
seeing wrong values in DB or wrong display after refresh)

**Applicability:** any file containing `<Select>`, `<SelectItem>`,
`<SearchableCombobox>`, or equivalent controlled select components.

**Sub-classes:**
- **FC-3a: Label-as-value** — `<SelectItem value="Lead">` writes "Lead" to
  DB instead of "lead"
- **FC-3b: Key-as-display** — shows raw key "marketingqualifiedlead" instead
  of "Marketing Qualified Lead"
- **FC-3c: Mixed source** — Select options come from display labels array
  but save path expects raw keys (requires reverse mapping like
  `displayToRawValue`)

**Related FCs:** FC-1 (wrong source map → wrong values), FC-4 (draft
normalization failure makes Select show placeholder instead of current value)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 1 `contact-list-table.tsx` | caught-by: human | slipped: yes

---

### FC-4: Draft Normalization

**Pattern:** A form field's initial value comes from the DB in a different
format than the `<SelectItem value={...}>` keys. The Select shows a
placeholder instead of the current value because `"OPEN" !== "open"`.

**Check procedure:**
- For every `<Select>` that displays a DB value: trace the value from API
  response → state/draft → `<Select value={...}>`.
- The draft initialization must normalize the raw DB value to match the
  option key format (usually `.toLowerCase()`).

**Severity:** `visible` — Select shows "Select..." placeholder instead of
current value. User sees something is wrong but data isn't corrupted.

**Detection layer:** `browser-qa` (visible when opening an edit form)

**Applicability:** any file that initializes a form/draft state from DB data
and uses that state as a `<Select value={...}>` prop.

**Sub-classes:**
- **FC-4a: Case mismatch** — DB returns "OPEN", Select expects "open"
- **FC-4b: Format mismatch** — DB returns "2024-01-15T00:00:00Z", date
  picker expects "2024-01-15"
- **FC-4c: ID vs display** — DB returns owner ID "12345", Select expects
  display name "Nolan Pierce" (or vice versa)

**Related FCs:** FC-2 (same root cause — case inconsistency), FC-3 (if
Select values are labels, normalization target is wrong)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 1 `contact-key-info.tsx` | caught-by: human | slipped: yes

---

### FC-5: Test Layer Mismatch

**Pattern:** An E2E or integration test asserts against a raw DB value
(e.g., `'customer'`) but the UI renders a mapped label (e.g., `'Customer'`).
The test passes when skipped and fails when enabled.

**Check procedure:**
- For every test assertion on a field that has a value→label map: the
  assertion must match what the user sees in the DOM (the label), not the
  raw DB value.
- Ask: "What does `getByText(...)` or `toHaveText(...)` actually match in
  the rendered output?"

**Severity:** `visible` — test failure blocks CI, but no production impact.

**Detection layer:** `e2e` (test itself catches the mismatch as a failure)

**Applicability:** E2E and integration test files (`*.spec.ts`, `*.test.ts`)
that assert on fields with value→label mappings.

**Sub-classes:**
- **FC-5a: Raw value assertion** — `expect(cell).toHaveText('customer')`
  but UI shows "Customer"
- **FC-5b: Fixture mismatch** — test fixture uses display labels but API
  expects raw keys (or vice versa)
- **FC-5c: Stale snapshot** — test snapshot was captured before a label
  mapping was added, now the snapshot is wrong

**Related FCs:** FC-1 (if test hardcodes values instead of importing from
single source), FC-2 (case mismatch between test and UI)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 1 `view-contacts-list.spec.ts` | caught-by: e2e | slipped: no

---

### FC-6: Unstable Hook Return

**Pattern:** A custom hook returns a function as a plain closure. The function
reference changes on every render, causing infinite re-renders when consumers
place it in a `useEffect`, `useCallback`, or `useMemo` dependency array.

**Check procedure:**
- For every function returned from a custom hook: verify it is wrapped in
  `useCallback` with appropriate dependencies.
- Check the hook's return statement — every function in the return object
  must be memoized.
- Values (non-functions) derived from state/props should use `useMemo`.

**Severity:** `crash` — infinite re-render loop, page freezes or React
throws "Maximum update depth exceeded."

**Detection layer:** `browser-qa` (page freezes or console floods with
re-render warnings)

**Applicability:** any file in `lib/hooks/` or any component file that
defines and returns a custom hook.

**Sub-classes:**
- **FC-6a: Bare closure** — `return { save: (id) => mutation.mutate(id) }`
  without `useCallback`
- **FC-6b: Missing dependency** — `useCallback` wraps the function but
  omits a dependency, causing stale closures
- **FC-6c: Derived object** — hook returns `{ data, computed }` where
  `computed` is a new object every render (needs `useMemo`)

**Related FCs:** none (distinct class)

**Originating PR:** #108

**Occurrences:**
- PR#108 Phase 2 `use-owners.ts` | caught-by: human | slipped: yes

---

### FC-7: Nullable Property Fallback

**Pattern:** A data mapping switches from a guaranteed-present field
(e.g., `r.updatedAt`) to a nullable property (e.g., `p.hs_last_activity_date`)
without providing a fallback. Downstream code that uses the value for
filtering, sorting, or date comparisons receives `null`/`'--'`, which
produces `Invalid Date` or `NaN`. Comparisons like `date < start` silently
evaluate to `false`, so records pass through filters they should be excluded by.

**Check procedure:**
- For every property read from a nullable source (property bag field like
  `p.hs_*`): trace the value downstream to every consumer.
- **Display path:** let `'--'` render as-is — don't inject a semantically
  wrong fallback value (e.g., don't show `updatedAt` as "last activity"
  when there's no activity data).
- **Filter/sort/comparison path:** guard against `'--'`/`null`/`undefined`
  BEFORE parsing. e.g., `if (value === '--') return false` before
  `new Date(value)`. Do NOT rely on a data-layer fallback to mask the
  absence — fix the consumer instead.
- Check: does any filter do `new Date('--')`? That's `Invalid Date` —
  a silent bug (comparisons always evaluate to `false`).

**Severity:** `silent` — records silently pass through filters, wrong results
displayed with no error.

**Detection layer:** `cursor-bot` (caught in code review, not by any
automated tooling)

**Applicability:** any file that reads from a record's `properties` bag
(e.g., `p.hs_*`, `p.lifecyclestage`) and feeds the value into date parsing,
numeric comparison, or filter logic.

**Sub-classes:**
- **FC-7a: Date filter passthrough** — `new Date('--')` → `Invalid Date` →
  comparison is always `false` → record passes filter
- **FC-7b: Sort NaN** — `NaN` in sort comparator breaks ordering, may
  push records to arbitrary positions
- **FC-7c: Numeric aggregation** — `NaN` in sum/average silently corrupts
  the result
- **FC-7d: Semantic fallback pollution** — a data-layer fallback (e.g.,
  `?? r.updatedAt`) prevents the crash but makes the column display a
  wrong-source value, hiding the absence from the user

**Related FCs:** FC-2 (case mismatch can also cause lookup to return
`undefined`, triggering the same downstream issue)

**Originating PR:** #113

**Occurrences:**
- PR#113 Phase 1 `record-to-contact-list.ts` | caught-by: cursor-bot | slipped: yes
- PR#113 Phase 1 `record-to-contact-list.ts` + `contacts-content.tsx` | caught-by: cursor-bot | slipped: yes | sub-class: FC-7d

---

### FC-8: Optimistic Rollback on Error

**Pattern:** A mutation handler optimistically updates local state before
calling the API. The success path invalidates/re-syncs from the server,
but the error path only shows an error toast — it doesn't reverse the
local state change or invalidate the query. The UI stays out of sync with
the server until the user manually refreshes or navigates away.

**Check procedure:**
- For every optimistic local state update (`setState(prev => ...)`) that
  precedes an API call: trace both the success and error handlers.
- **Success path:** must invalidate the relevant query OR explicitly
  re-sync state (already correct if query invalidation triggers a
  `useEffect` that re-derives state).
- **Error path:** must ALSO invalidate the query (to re-sync from server)
  OR explicitly reverse the local state change (e.g., `setState(prev =>
  revert(prev))`).
- If the error path only shows a toast/notification, the optimistic
  update is stranded.

**Severity:** `visible` — user sees the "saved" value in the UI but it
isn't actually saved. Confusing but not data-corrupting (server has the
correct value).

**Detection layer:** `cursor-bot` (requires reasoning about success vs
error paths; not catchable by static analysis or tests without mocking
API failures)

**Applicability:** any file that does optimistic local state updates
before API mutations — list views with inline editing, form saves with
local preview, drag-and-drop reordering, etc.

**Sub-classes:**
- **FC-8a: Missing error invalidation** — error handler shows toast but
  doesn't invalidate the query, so the `useEffect` that re-derives
  local state from query data never fires
- **FC-8b: Missing error reversal** — error handler doesn't explicitly
  undo the local state change (alternative to invalidation when query
  re-sync is not available)
- **FC-8c: Partial rollback** — error handler reverts some fields but
  not all (e.g., reverts the cell value but not a related loading state)

**Related FCs:** FC-6 (unstable hook returns can cause re-renders that
mask the stale state), FC-7 (if the fallback value is wrong, the
"rolled back" value is also wrong)

**Originating PR:** #113

**Occurrences:**
- PR#113 Phase 1 `use-inline-save.ts` | caught-by: cursor-bot | slipped: yes

---

### FC-9: Reverse Lookup Fallback

**Pattern:** A reverse-lookup function (label→ID, display→raw) falls back
to the input string when the map lookup fails (`reverseMap[key] ?? key`).
If the map is empty (data hasn't loaded yet), stale, or the key doesn't
match exactly, the display value (e.g., `"Nolan Pierce"`) is sent to the
API as if it were a raw ID (e.g., `hubspot_owner_id`). The API receives
a human-readable name instead of a numeric identifier, resulting in a
failed or corrupt save.

**Check procedure:**
- For every `reverseMap[key] ?? fallback` pattern: verify the fallback
  is `null` (or a known-safe value), never the raw input `key`.
- Check: is the map guaranteed to be populated at call time? If it
  depends on async data (e.g., `useOwners()`), consider what happens
  when the map is `{}`.
- Verify the caller handles `null` return gracefully (e.g., skips the
  save, shows validation error).

**Severity:** `silent` — wrong data written to DB (name stored as ID),
no error thrown. May corrupt data that's hard to recover.

**Detection layer:** `cursor-bot` (requires reasoning about async data
loading race conditions and fallback semantics)

**Applicability:** any file that builds a reverse map (label→value,
name→ID) from async data and uses it in a save/submit path.

**Sub-classes:**
- **FC-9a: Async map empty** — reverse map built from `useOwners()` or
  similar hook starts as `{}`, so all lookups fail and fall through
  to the display name
- **FC-9b: Name mismatch** — static dropdown options use different
  names than the dynamic owner map (e.g., `CONTACT_OWNERS` constant
  vs `ownerMap` from API), so reverse lookup fails on exact match
- **FC-9c: Stale map** — reverse map was built from a previous data
  fetch and doesn't include newly added entries

**Related FCs:** FC-2 (case mismatch causes reverse lookup to fail),
FC-3 (Select value/key confusion amplifies the problem), FC-4 (draft
normalization — if the draft is wrong, the reverse lookup input is wrong)

**Originating PR:** #113

**Occurrences:**
- PR#113 Phase 1 `contacts-content.tsx` | caught-by: cursor-bot | slipped: yes

---

### FC-10: Client-Side Data Ceiling

**Pattern:** A data operation (search, filter, sort, or pagination) is
implemented entirely on the client — fetching all records in a single
API call and then using `.filter()`, `.sort()`, or `.slice()` in
JavaScript. The UI works correctly on seeded data, but the architecture
diverges from the reference app (HubSpot), which performs these
operations server-side via API calls with query parameters.

This matters because HubShot is an RL training environment. RL agents
learn from the full interaction loop: action → network request →
response → state change → UI update. A client-side search that filters
50 in-memory records teaches the agent fundamentally different patterns
than a server-side search with loading states, debounce, and paginated
responses. Agents trained on the wrong pattern won't transfer to the
real app.

**Check procedure:**
- For every deliverable that implements search, filter, sort, or
  pagination:
  1. Read `docs/reference/{domain}/network-behavior.md` — does the
     reference app make an API call for this operation?
  2. If yes: verify the HubShot implementation triggers an API call
     (tRPC procedure, REST endpoint) with the relevant parameters —
     not a client-side `.filter()` / `.sort()` / `.slice()` on data
     already fetched.
  3. Grep for these patterns in the component/hook files:
     - `data.filter(` or `.filter(record =>` after a query hook
     - `sortedRecords.slice(` for client-side pagination
     - `matchesWordPrefix(` or similar client-side search utilities
     - A single `useQuery` with a large `limit` (e.g., 500) and no
       query parameters for search/filter/sort
  4. If the reference app does NOT make an API call for the operation
     (documented as "client-side, no API call" in the network behavior
     spec), then client-side is the correct pattern — no violation.
- If no `network-behavior.md` exists for the domain, flag it as a gap
  in the PR description. The operation cannot be verified but may still
  be wrong.

**Severity:** `silent` — the UI works correctly on seeded data. No
error is thrown. The bug is architectural: the trained RL agent learns
interaction patterns that won't transfer to the real app.

**Detection layer:** `browser-qa` (network behavior verification in
Phase End step 3c-ii catches this at runtime) → `manual-review` (code
review can spot the pattern statically via the grep checks above)

**Applicability:** any file that implements search, filter, sort, or
pagination for a list view or data table. Typically:
- `components/{domain}/{domain}-content/` (main list component)
- `lib/hooks/` (data fetching hooks)
- `lib/list-search.ts` (client-side search utilities)
- `app/api/trpc/routers/` (tRPC procedures — check if they accept
  query/filter/sort/pagination parameters)

**Sub-classes:**
- **FC-10a: Client-side search** — search query filtered in-memory
  using string matching (e.g., `matchesWordPrefix()`), no API call
  with `query` parameter. The user searches for a record not in the
  pre-fetched set — gets no results even though the record exists.
- **FC-10b: Client-side filtering** — filter applied via `.filter()`
  on pre-fetched array. Works on small datasets, misses records beyond
  the fetch limit.
- **FC-10c: Client-side pagination** — `.slice(start, end)` on the
  full pre-fetched array. The user can never navigate past the fetch
  limit (e.g., 500 records). The tRPC procedure may support cursor
  pagination but the client doesn't use it.
- **FC-10d: Client-side sorting** — `.sort()` on pre-fetched array.
  Less impactful than search/filter/pagination (sort order is still
  correct within the fetched set), but may produce different results
  than server-side sort for records near page boundaries.
- **FC-10e: Fetch ceiling** — a single query fetches all records with
  a hard `limit` (e.g., `limit: 500`). All downstream operations
  operate on this fixed set. This is the root cause that enables
  FC-10a through FC-10d.

**Related FCs:** none (distinct architectural class — other FCs are
about data mapping correctness within a working data flow; FC-10 is
about the data flow architecture itself)

**Originating PR:** N/A (identified during team code review of
contacts list implementation, 2026-02-24)

**Occurrences:**
- Contacts list `contacts-content.tsx` + `lib/list-search.ts` + `app/api/trpc/routers/basic.ts` | caught-by: manual-review | slipped: yes | sub-classes: FC-10a, FC-10b, FC-10c, FC-10d, FC-10e

---

### FC-11: Phantom Route

**Pattern:** A sub-agent needs data for the frontend and creates a new
tRPC procedure/route that doesn't exist in the reference app API. CI
runs an API compatibility check that diffs HubShot's routes against
the reference app schema — any route not in the reference API fails
the check, including `/internal/` prefixed routes.

**Check procedure:**
- For every new tRPC procedure or route registration in a deliverable:
  1. Does this route already exist in `app/api/trpc/routers/`? If yes,
     it's a modification, not a new route — safe.
  2. If new: does the route path exist in the reference app API? Check
     against `docs/reference/{domain}/network-behavior.md` or the
     OpenAPI spec.
  3. If the route is not in the reference API → do not create it. Find
     an alternative: use an existing route, inline the data, or serve
     it through an existing endpoint.
- Grep for new `router({` or `.query(` / `.mutation(` registrations
  in modified files. Cross-reference each against existing routers.

**Severity:** `visible` — CI fails with API compatibility check error.
Build is blocked but no data corruption.

**Detection layer:** `ci` (API compatibility check runs in CI only —
not catchable locally)

**Applicability:** any file in `app/api/trpc/routers/` that registers
new procedures, or any new router file.

**Sub-classes:**
- **FC-11a: Internal route** — route prefixed with `/internal/` created
  for frontend data needs. Seems safe but still fails compatibility.
- **FC-11b: Convenience duplicate** — new procedure duplicates data
  already available through an existing route (e.g., creating
  `listMembers` when `memberships.getByIdById` already serves it).
- **FC-11c: Aggregate endpoint** — new route combines data from
  multiple existing routes for convenience. Reference app makes
  separate calls; HubShot should too (behavioral fidelity).

**Related FCs:** FC-10 (client-side data ceiling — both involve
architectural decisions about how data reaches the frontend)

**Originating PR:** #167

**Occurrences:**
- PR#167 WO-3 `app/api/trpc/routers/filters.ts` | caught-by: ci | slipped: yes | sub-class: FC-11a

---

## Occurrence Summary

| FC | Name | Severity | Total | Slipped | Slip Rate | Trend |
|----|------|----------|-------|---------|-----------|-------|
| FC-1 | Single Source of Truth | silent | 2 | 2 | 100% | new |
| FC-2 | Case-Insensitive Lookup | silent | 1 | 1 | 100% | new |
| FC-3 | Select Value = Map Key | silent | 1 | 1 | 100% | new |
| FC-4 | Draft Normalization | visible | 1 | 1 | 100% | new |
| FC-5 | Test Layer Mismatch | visible | 1 | 0 | 0% | new |
| FC-6 | Unstable Hook Return | crash | 1 | 1 | 100% | new |
| FC-7 | Nullable Property Fallback | silent | 2 | 2 | 100% | new |
| FC-8 | Optimistic Rollback on Error | visible | 1 | 1 | 100% | new |
| FC-9 | Reverse Lookup Fallback | silent | 1 | 1 | 100% | new |
| FC-10 | Client-Side Data Ceiling | silent | 1 | 1 | 100% | new |
| FC-11 | Phantom Route | visible | 1 | 1 | 100% | new |

**Vigilance priority** (frequency × severity-weight × slip-rate):
1. FC-1 (2 × 3 × 1.0 = 6.0) — tied highest
2. FC-7 (2 × 3 × 1.0 = 6.0) — tied highest
3. FC-2 (1 × 3 × 1.0 = 3.0)
4. FC-3 (1 × 3 × 1.0 = 3.0)
5. FC-9 (1 × 3 × 1.0 = 3.0)
6. FC-10 (1 × 3 × 1.0 = 3.0) — architectural, high RL impact
7. FC-8 (1 × 2 × 1.0 = 2.0)
8. FC-4 (1 × 2 × 1.0 = 2.0)
9. FC-11 (1 × 2 × 1.0 = 2.0) — CI-only detection, preventive constraint in context.md
10. FC-6 (1 × 1 × 1.0 = 1.0)
11. FC-5 (1 × 2 × 0.0 = 0.0) — lowest (caught by E2E, never slips)

---

## Adding New Failure Classes

When adding a new class:

1. Assign the next `FC-N` number
2. Name the class concisely (2-4 words)
3. Write the **Pattern** (what goes wrong and why)
4. Write the **Check procedure** (what the agent mechanically verifies)
5. Assign **Severity:** `silent` / `visible` / `crash`
6. Assign **Detection layer:** where this is typically catchable
7. Define **Applicability:** universal or scoped
8. List **Sub-classes:** at least 2 named variants (helps agents recognize
   the pattern in different manifestations)
9. List **Related FCs:** which other classes share root causes or co-occur
10. Note the **Originating PR**
11. Add the first **Occurrence** log entry
12. Update the **Occurrence Summary** table
13. Update the Phase End step 2b inline list in `divisions/production/qc.md`
14. Update the failure cases table in `divisions/production/qc.md` Rule 11 (if
    applicable to enum/option field patterns)
15. Scan remaining phases of the current plan for deliverables that the
    new FC class applies to — add annotations

When logging a new occurrence of an EXISTING class:

1. Append the occurrence to the class's **Occurrences** section
2. Update the **Occurrence Summary** table (total, slipped, slip rate)
3. If the occurrence reveals a new sub-class, add it
4. Recalculate vigilance priority if rankings change

When a bug does NOT meet FC criteria (not generalizable, not mechanically
checkable, or too context-specific), log it in the **Miscellaneous Bug
Log** below. Every CursorBot bug must be recorded somewhere — either as
an FC occurrence or as a misc entry. This ensures no signal is lost and
allows pattern detection over time (if 3+ misc entries share a theme,
they may warrant a new FC class).

---

## Miscellaneous Bug Log

Bugs that were real and fixed but did not meet the 3 FC criteria
(generalizable, mechanically checkable, not already covered). Tracked
for completeness and pattern detection. If 3+ entries share a theme,
evaluate whether they warrant a new FC class.

Each entry uses a rich format — these aren't throwaway notes, they're
the raw signal that might become future FC classes.

---

### MISC-1: Saving indicator points to wrong cell

**PR:** #113
**File:** `contacts-content.tsx` L187-189
**Severity:** visible
**Caught by:** cursor-bot

**What happened:** `savingCellRef.current` was set unconditionally
before calling `inlineSave()`. But `inlineSave`'s inner `save` function
has an early return (`if (previousValue === value) return`) that skips
the mutation entirely. If a prior mutation is still in flight when a
no-op commit occurs, `isSavingInline` is true (from the prior mutation)
but `savingCellRef.current` now points to the no-op cell — so the
saving indicator appears on the wrong cell.

**Fix applied:** Guard `savingCellRef.current = {contactId, column}`
behind the same `prevRaw !== newRawValue` check that `inlineSave` uses,
so the ref only updates when a real mutation will fire.

**Why not an FC:**
- **Not generalizable enough:** This is specific to the pattern of using
  a `useRef` to shadow which mutation is in flight, combined with a
  separate hook that has its own early-return guard. The two layers need
  to stay in sync but there's no general rule for "check if your ref
  update matches your hook's early-return" — it's contextual.
- **Not mechanically checkable:** An agent can't systematically audit
  "every ref assignment before a function call where the function might
  early-return" — it requires understanding the specific function's
  internal control flow.

**Theme tags:** `race-condition`, `ref-tracking`, `state-sync`
