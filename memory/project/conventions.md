# Project Conventions
> Reference data loaded on demand. Not held in agent context at startup.

---

## Tech Stack & CI Commands

**Framework:** Next.js 16 (App Router), TypeScript
**UI:** shadcn/ui, Tailwind CSS
**Data:** Prisma + SQLite (LibSQL), tRPC routers
**Component dev:** Storybook 10 (nextjs-vite)
**Testing:** Vitest (unit), Playwright (E2E)
**CI enforcement:** oxfmt formatting, knip dead-code detection, conventional commit PR titles

### Commands

| Command | Purpose |
|---------|---------|
| `pnpm typecheck` | Runs `tsgo --noEmit` (NOT `tsc`) |
| `pnpm test` | Runs Vitest |
| `pnpm run format:check` | oxfmt check (CI enforced) |
| `pnpm exec oxfmt {file}` | Format a specific file |
| `pnpm knip` | Dead code/export detection (CI enforced) |
| `pnpm storybook` | Starts Storybook on port 6006 |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:push` | Sync database schema |
| `pnpm prisma:seed` | Seed database |
| `pnpm prisma:migrate` | Push schema changes (accepts data loss) |

---

## Code Rules

1. **Naming:** Never use "HubSpot" or "HUBSPOT" in code. Use "HubShot" / "HUBSHOT". Exception: files under `docs/reference/`.
2. **Format before commit:** Run `pnpm exec oxfmt {file}` on every modified file before committing.
3. **Format before push:** Run `pnpm run format:check` before pushing. CI rejects unformatted code.
4. **Dead code before push:** Run `pnpm knip` before pushing. CI rejects unused exports/files.
5. **PR titles:** Must use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`). Enforced by `amannn/action-semantic-pull-request`.
6. **Never modify `.gitignore`** -- it is shared repo-level config and changes require team coordination.
7. **Never modify `knip.config.ts`** -- CODEOWNERS-protected. If knip flags unused exports from plumbing that ships ahead of its consumers, export from an already-imported index file or accept the warning until the consumer WO lands. Fix your code, not the tool.

---

## Dev Server Lifecycle

- **Start:** `pnpm dev` (port 3002 default)
- **Shutdown (MANDATORY after every QA session):**
  ```bash
  lsof -ti:3002 | xargs kill -9
  lsof -ti:3000 | xargs kill -9
  ```
- **Why:** If the server is not killed, Next.js auto-increments to 3003, 3004, etc. Stale servers accumulate and waste resources.
- **Port check before starting:** `lsof -i:3002` to verify the port is free.
- **Also close Playwright browser** after QA: `browser_close`.

---

## Screenshot & Image Policy

- **NEVER stage or commit** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.tiff`, `.heic`, `.heif` files.
- Screenshots from Storybook validation and reference app scraping are for visual inspection only.
- **Before every commit:** Unstage all image files:
  ```bash
  git reset HEAD -- '*.png' '*.jpg' '*.jpeg' '*.gif' '*.webp' '*.avif' '*.bmp' '*.tiff' '*.heic' '*.heif'
  ```
- **Post-flight cleanup:** Delete all generated screenshot files.
- `.gitignore` covers `**/screenshots/**` but NOT stray images in the repo root or component dirs.

---

## Enum/Option Field Protocol

1. **Single source of truth:** Value-to-label maps live in ONE file (e.g., `lib/constants/contact-fields.ts`). Never duplicate.
2. **Case-insensitive lookup:** All lookups use `.toLowerCase()`. DB values arrive in any casing.
3. **Select components:** `value` = map key (raw value), displayed text = map value (label).
4. **Draft initialization:** Normalize the raw DB value to match option keys.
5. **Tests:** Assert rendered labels, not raw DB values.

---

## Linear Ticket Lifecycle

### Romeo Team Statuses

| Status | Type | Meaning |
|--------|------|---------|
| Triage | triage | Incoming bugs/QA issues, not yet categorized |
| Backlog | backlog | Not yet planned |
| Todo | unstarted | Planned, not started |
| In Progress | started | Engineer actively working |
| Merged | completed | Code merged, engineering complete |
| Ready for QA | completed | Awaiting QA engineer pickup |
| In QA | started | QA engineer actively testing |
| Done | completed | QA passed, verified |
| Canceled | canceled | Out of scope |
| Duplicate | canceled | Duplicate of another ticket |

### Hierarchy

```
Epics (highest-level, major functional areas)
 └─ Features (sets of related capabilities, t-shirt sized)
      └─ Capabilities (specific implementable work items, t-shirt sized)
           └─ Tasks (granular implementation tasks, created by engineers)

Core (foundational/cross-cutting, outside hierarchy)
```

- Epics group related features (e.g., Document Management).
- Features group related capabilities (e.g., Creating Documents).
- Capabilities are specific work items, organized as separate tickets within features.
- Tasks are created by engineers during development, within Capabilities.
- Core work is outside the hierarchy — foundational or cross-cutting work that blocks Features or Capabilities across multiple Epics. Can contain arbitrary subtasks.

**Labels:** `Type: Epic`, `Type: Feature`, `Type: Capability`, `Type: Core`, `Type: Design`, `Bug`

### Creation Rules

**Do:**
- Create Tasks under Capabilities to organize your own work (or just use the checklist inside the Capability description).
- Create Core work for cross-cutting items.

**Do NOT:**
- Create Epics, Features, or Capabilities (set from project start, reflect client-facing Task List).
- Add/remove/change estimation points on Capabilities (they track total scope completion).
- Add estimation points to Epics, Features, Tasks, or Core work.

### Status Lifecycle

**Capabilities & Tasks:**
```
Todo/Backlog → In Progress → Merged
```
- Engineer assigns themselves and moves to In Progress when starting.
- When code is merged, move to Merged.
- QA engineer assigns and moves to Ready for QA → In QA → Done.

**Features & Epics:**
```
Todo/Backlog → In Progress → Ready for QA → In QA → Done
```
- When all Capabilities in a Feature are Merged, Feature moves to Ready for QA.
- QA engineer assigns and moves to In QA.
- When Feature passes QA, it moves to Done.
- When all Features in an Epic are Done, Epic moves to Done.

**Bugs:**
```
Triage → In Progress → Ready for QA → In QA → Done
```
- Create through Triage flow (see below). Bugs go through QA once fixed.

**Core:**
```
Todo/Backlog → In Progress → Done
```
- Core work typically does not produce an end-to-end testable feature, so no QA.
- For Core work relevant to QA, it can follow the Capability lifecycle.

**Key rule:** Engineering terminal status is **Merged**, not Done. QA owns the path from Ready for QA → Done.

**Canceled = out of scope.** All task list items are documented in Linear even if out of scope. Items with Canceled status are out of scope.

### Bug Tracking (Triage)

All bugs and QA-related tasks go through **Triage**, not directly into the project:
- Bug reports, QA findings, edge cases, tech debt discovered during development.

**Triage workflow:**
1. Create in Triage view with appropriate labels (`Bug`, `qa`, `regression`, etc.).
2. Review with team/TPM: Is this a bug in existing scope or new scope? Severity? Priority? Should it block current work?
3. Accept (move into project, link to relevant capability/feature/epic) or Reject (close with reasoning, or move to backlog).

### Core Work

Foundational work that must be done upfront to enable smooth implementation of downstream Epics, Features, and Capabilities.

- Create at the root level of the project with label `Type: Core`.
- Can have subtasks as needed, or no subtasks at all.
- Core work items are high priority.

### Epic Structure Instability

Epic hierarchy is maintained by QA team and may be rearranged at any time.
Epics may be dissolved into subtasks. Do NOT rely on parent-epic queries
to discover tickets. Instead, discover by: team + domain labels + state.

### QA Ticket Discovery Protocol

QA-generated fix tickets appear under various parents (epics, features).
Discovery method:
1. Query Linear: team=Romeo, state != Done/Cancelled
2. Filter by area labels matching mission scope_areas
3. Filter against scope CSV (`memory/project/scope.csv`)
4. Cross-reference with existing dossier findings

### Comment Hygiene

After updating ticket statuses, review existing comments for stale content:
- Resolved `@mentions` from planning -- mark resolved.
- Stale calls to action -- note resolution.
- Open questions answered by implementation -- add brief answer.
- Draft/WIP notes from earlier passes -- clean up or archive.

---

## PR Template

Derived from repo template (`.github/pull_request_template.md`).
The repo defines Summary + Test Plan. We add Linear Tickets,
Changes, and a production provenance stamp. PR title and branch name
are production-agnostic — provenance lives in the body only.

### Title

Conventional commit prefix required: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`. CI enforced.

### Structure

```markdown
<!-- PR_TEMPLATE_ID: DEFAULT -->
<!-- DO NOT REMOVE: Template identifier for CI validation -->

## Summary

<!-- 1-3 sentences: what does this PR do and why? -->

## Linear Tickets

- [ROM-XXX](https://linear.app/romeo/issue/ROM-XXX) -- description
- [ROM-YYY](https://linear.app/romeo/issue/ROM-YYY) -- description

## Test Plan

- **Validation gate:** typecheck pass, format pass, knip pass, test pass (N/N)
- **Browser QA:** pages verified (list), console clean
- **E2E tests:** pass (N/N) / N/A -- reason

## Changes

- **Area** (`file.ts`): What changed and why
- **Area** (`file.ts`): What changed and why

## Production State

- `WO-1` Lists Index + Navigation
- **`WO-2` Create Static List + List Detail <<<**
- `WO-3` Filter Editor + Create Active List
- `WO-4` Manage Membership + Delete Lists
- `WO-5` Edit Lists
```

**Production State** — always the last section in the PR body.
Every PR in a production run carries the same map. Only the position
marker varies between PRs. Uses a bullet list, NOT a blockquote
(blockquotes render grey on GitHub).

**Rules:**
- All WOs listed, every PR. The map is the full run.
- Current WO line is **bold** with `<<<` marker.
- Single-station WOs (default): just the WO line, no station detail.
- Multi-station WOs: expand stations under the current WO, mark current with `<<<`.

**Single-station example** (WO-2 PR):
```markdown
## Production State

- `WO-1` Lists Index + Navigation
- **`WO-2` Create Static List + List Detail <<<**
- `WO-3` Filter Editor + Create Active List
- `WO-4` Manage Membership + Delete Lists
- `WO-5` Edit Lists
```

**Multi-station example** (WO-2, Station 2 PR):
```markdown
## Production State

- `WO-1` Lists Index + Navigation
- **`WO-2` Create Static List + List Detail**
  - `S1` API + Hooks
  - **`S2` UI + Pages <<<**
- `WO-3` Filter Editor + Create Active List
- `WO-4` Manage Membership + Delete Lists
- `WO-5` Edit Lists
```

### Section Rules

| Section | Required | Notes |
|---------|----------|-------|
| Summary | Yes | 1-3 sentences. What and why, not a file list. |
| Linear Tickets | Yes | Clickable markdown links. Plain text `ROM-123` is not acceptable. |
| Test Plan | Yes | Must include validation gate + Browser QA + E2E results. |
| Changes | Yes | Meaningful summary, not a git log. Group by area with file refs. |
| Production State | Yes | `## Production State` section. Bullet list, not blockquote. Bold + `<<<` on current WO. |

### Anti-Patterns

- Raw ticket IDs without links (`ROM-123`) -- use clickable markdown links.
- Ad-hoc sections (`## Coordination Diff`, `## Plan Amendments Needed`) -- don't invent sections.
- Empty optional sections left in -- delete the section header entirely.
- Screenshot embeds in PR body -- never.
- Debug logs or investigation notes in body -- remove before PR creation.
- Replacing `## Summary` with a custom header -- keep team template headers exactly.
- Preserve the `PR_TEMPLATE_ID` comment -- CI may validate it.
- Production jargon in PR title or branch name -- provenance stays in the body stamp only.

---

## CursorBot Review Process

### Hard Gates

1. **DO NOT MERGE until CursorBot check-run status is `completed`.** `queued` and `in_progress` mean NOT done. "No findings yet" means CursorBot has not finished -- NOT that it is clean.
2. **CursorBot takes 10-20 minutes PER RUN.** Full loop: 60-90 minutes (3-5 bugs found in series). Wait minimum 2 minutes before first poll.
3. **ALL bugs must be fixed and CursorBot must re-run clean before merge.** Clean = `status: completed` AND (`conclusion: success` OR (`conclusion: neutral` AND no NEW comments after last push)).

### Constants

```
CI_POLL_INTERVAL_SECONDS  = 30
CI_MAX_FIX_CYCLES         = 3
POLL_INTERVAL_SECONDS     = 60
MIN_INITIAL_WAIT_SECONDS  = 120
MAX_SINGLE_RUN_MINUTES    = 30
MAX_TOTAL_LOOP_MINUTES    = 90
MAX_FIX_ITERATIONS        = unlimited
CURSORBOT_LOGIN           = "cursor[bot]"
CHECK_RUN_NAME            = "Cursor Bugbot"
```

### Phase A: Setup (once per PR)

1. Get **PR number** from `gh pr create` output.
2. Get **HEAD SHA:** `gh api repos/{owner}/{repo}/pulls/{pr_number} --jq '.head.sha'`
3. Record cycle start time. Max iterations: 6.

### Phase A.5: CI Gate (HARD GATE — before CursorBot polling)

All CI checks (excluding CursorBot) must pass before entering Phase B.
CI checks typically complete in 2-5 minutes — much faster than CursorBot.

**Poll CI status:**
```bash
gh pr checks {pr_number} 2>&1 | grep -v "Cursor Bugbot"
```

| All non-CursorBot checks | Action |
|--------------------------|--------|
| All `pass` | Proceed to Phase B |
| Any `pending` | Sleep 30s, re-poll |
| Any `fail` | Read failure logs, fix, push, re-wait (see below) |

**On CI failure:**
1. Identify which check failed: `gh pr checks {pr_number}`
2. Read failure logs: `gh run view {run_id} --log-failed`
3. Fix the issue, validate locally (`pnpm typecheck`, `pnpm knip`, `pnpm run format:check`)
4. Commit + push. Get new HEAD SHA.
5. Re-enter CI Gate polling.

**Circuit breaker:** Max 3 CI fix cycles. If exceeded → ANDON (`ci_failure`).

### Phase B: Polling Loop

Initial wait: `sleep 120` before first poll.

**Poll command:**
```bash
gh api repos/{owner}/{repo}/commits/{head_sha}/check-runs \
  --jq '.check_runs[] | select(.name == "Cursor Bugbot") | {status: .status, conclusion: .conclusion}'
```

| status | conclusion | Action |
|--------|-----------|--------|
| `queued` | `null` | Sleep 60s, re-poll |
| `in_progress` | `null` | Sleep 60s, re-poll |
| `completed` | `success` | Exit to Phase D |
| `completed` | `neutral` | Findings exist -- go to Phase C |
| `completed` | `failure` | CursorBot itself failed -- notify user, fall back to manual |

If no "Cursor Bugbot" check-run found: wait 60s, retry up to 5 times, then ANDON.

### Phase C: Fix Findings

1. **Extract findings:**
   ```bash
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
     --jq '.[] | select(.user.login == "cursor[bot]") | {id: .id, path: .path, line: .line, body: .body, created_at: .created_at}'
   ```
   Filter to comments created AFTER last push (`git log -1 --format='%aI' origin/{branch}`).

2. **Fix all findings**, then validate once:
   ```bash
   pnpm exec oxfmt {all modified files}
   pnpm typecheck
   ```

3. **Evaluate findings for Failure Class catalog** (`failure-class-catalog.md`): Is it generalizable? Mechanically checkable? Not already covered? If yes to all, add new FC entry.

4. **Single commit + push** for all fixes in a cycle:
   ```bash
   git add {specific files}
   git commit -m "fix: address CursorBot review findings

   - Finding 1: {brief}
   - Finding 2: {brief}"
   git push
   ```

5. **Resume polling:** Get new HEAD SHA, `sleep 30`, then re-enter Phase A.5 (CI Gate) before Phase B. CursorBot fixes may break CI.

### Phase D: Clean Exit

1. **Cleanup:** Delete generated artifacts (screenshots, images). Verify no images staged.
2. **All-checks verification (HARD GATE):** Before merge, verify ALL checks pass:
   ```bash
   gh pr checks {pr_number}
   ```
   Every check must show `pass`. If any check shows `fail`, do NOT merge — fix, push, and re-enter Phase A.5.
3. **Merge:**
   ```bash
   gh pr merge {pr_number} --squash --delete-branch
   git checkout dev && git pull origin dev && git branch -d {branch_name}
   ```
4. **Update Linear tickets by type:**
   - Capability / Task → Merged
   - Feature (all child capabilities Merged) → Ready for QA
   - Core → Done (no QA surface)
   - Bug → Ready for QA
   - No type label → Merged (safe default)
   Add PR comment. Run comment hygiene.
5. **Notify:** "CursorBot passed clean. PR #{N} merged to dev. Linear tickets updated."

### Timeouts

- **Single CursorBot run:** 30 min max. If exceeded, ANDON (`cursorbot_timeout`).
- **Total loop (all cycles):** 90 min max. If exceeded, ANDON (`cursorbot_timeout`).
- **Max fix iterations:** Unlimited. Keep fixing until CursorBot returns clean.
- **ANDON = do NOT merge.** Return `STATUS: ANDON`, `FAILURE_MODE: {type}` to orchestrator.
