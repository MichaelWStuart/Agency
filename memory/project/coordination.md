# Team Coordination Protocol

> Loaded on demand during Stage 3 (pre-flight) and Phase Start/End
> (coordination diffs). Not loaded at session start.

## Constants

```
Team: Romeo | ID: e4d03477-e5fe-4325-9cea-1ce7926a06e7 | Repo: g2i-ai/hubshot | Main: dev
```

Roster built dynamically from open PRs (see WIP Manifest).

## Pre-Flight Protocol

Run BEFORE the first agent session of a blueprint.

**PF-1: Run WIP Manifest (MANDATORY)** — Execute full WIP Manifest below, including notifications.

**PF-2: Check Open PRs for Upstream Changes (MANDATORY)** — Foundation paths: `prisma/schema.prisma`, `app/api/trpc/routers/`, `lib/state-api-adapters/`, `lib/hooks/`, `prisma/seed/`.
```
Open PR changes my foundations?
├── Approved / merging today → WAIT. Rebase after merge.
├── In review / unclear      → BUILD AGAINST THEIR BRANCH. Note: "Built against PR #{X}"
├── Draft / early            → BUILD CURRENT DEV + adapter. Document switch plan.
└── No                       → Proceed.
```

**PF-3: Preemption Check (MANDATORY)** — Search Linear: `mcp__linear__list_issues query: "{keywords}", team: "Romeo"`
```
Task assigned to someone else?
├── Started / has PR → DO NOT BUILD.
├── Assigned, not started → MESSAGE THEM first.
└── Unassigned → Proceed. Create ticket.
```

**PF-4: Phase Gate Hooks (RECOMMENDED)** — Add to blueprint for each phase boundary:
```
1. git fetch origin dev && git rev-list HEAD..origin/dev --count
   >10 commits or scope files touched → rebase
2. gh pr list --state open --json number,title,author --limit 20
3. Merge PR promptly after each phase
```

**PF-5: Sync Linear Tickets (RECOMMENDED)** — Ensure each phase ticket is assigned to you, correct state, correct parent epic.

**Post-Flight:**
- **POF-1:** Retrospective — unexpected conflicts? preemption? stale foundations?
- **POF-2:** Check teammates' open PRs for new conflicts from your changes. Notify proactively.

## WIP Manifest Protocol

GitHub-first: roster from open PRs, Linear only for overlap teammates.
~8-10 tool calls, ~3-5K tokens, ~30 seconds.

**Step 1 — Establish Scope:** Extract file list from plan deliverables.
```
git fetch origin dev
git merge-base HEAD origin/dev              # divergence point
git rev-list HEAD..origin/dev --count       # drift size
```

**Step 2 — GitHub Discovery (ALL PARALLEL):**
```
gh pr list --state open --json number,title,author,headRefName,baseRefName,createdAt,url --limit 50
git diff $(git merge-base HEAD origin/dev)..origin/dev --name-only
git log $(git merge-base HEAD origin/dev)..origin/dev --oneline
```
Then per open PR (PARALLEL): `gh pr diff {pr_number} --name-only`

**Step 3 — File Overlap Detection:** Compare each PR's files against plan:
- **INFRA OVERLAP:** schema, state-api-adapters, shared routers/hooks
- **OVERLAP:** PR touches a file in my plan
- **CLEAR:** No overlap

**Step 4 — Targeted Linear (ONLY overlap teammates):**
`mcp__linear__list_issues assignee: "{name}", team: "Romeo", state: "started", limit: 20`

**Step 5 — Preemption Check:** Flag plan tickets assigned to overlap teammates.

**Step 6 — Conflict Summary:**
```markdown
## WIP Manifest — {date}
**Branch:** {branch} | **Drift:** {N} commits
### {Name} — {level} — PR #{N}: {title} — Files: {list}
### Conflict Summary: CRITICAL: / HIGH: / MEDIUM:
### Preemption Risks: / Notifications Sent:
```

**Step 7 — Notify via Linear (MANDATORY for MEDIUM+):**
One comment per overlap. Do NOT re-comment at every phase boundary.
Ticket: find Linear ticket linked to PR (title/branch). Fallback: most relevant started ticket.
Required signature on every comment:
```
---
_Agency coordination notice_
```
Use `mcp__linear__create_comment` with issueId and body. Adapt to scenario:
file overlap (proceeding/waiting), infra overlap, preemption, phase boundary new overlap.

**Abbreviated Protocol (Phase Boundary):**
```
1. git fetch origin dev
2. gh pr list --state open --json number,title,author --limit 50
3. git rev-list HEAD..origin/dev --count  (>10 → check files)
4. New PRs: gh pr diff {N} --name-only
5. NEW overlap → Linear comment (phase boundary template)
```

## Coordination Diff Protocol

**Phase Start:**
```
1. git fetch origin dev
2. git rev-list {last_merge_sha}..origin/dev --count
3. gh pr list --state merged --json number,title,mergedAt --limit 20
4. Merged PRs touch scope → rebase. New open PRs overlap → assess via decision trees.
```

**Phase End:**
```
1. git fetch origin dev && rebase before merging
2. After merge: check teammates' open PRs for new conflicts. Notify if affected.
```

**Mid-Flight (>4h heads-down or conflict detected):**
```
Merged work conflict?  → Rebase. Fix. Update plan.
Open PR conflict?      → Coordinate merge order (closer PR goes first).
```

## Conflict Decision Trees

**Type 1: CRITICAL — Schema/Infrastructure Overlap**
```
Change in a PR?
├── Approved → WAIT. Rebase after merge.
├── In review → Adapter if possible, else COMMUNICATE merge order.
└── Not started → Urgent? PROCEED narrowly + message. Not urgent? WAIT.
```

**Type 2: HIGH — File Overlap**
```
├── 1-3 files, small → PROCEED. Rebase frequently.
├── 4+ files or >200 lines → Their PR close? WAIT. Else COORDINATE merge order.
└── Barrel/index only → PROCEED.
```

**Type 3: HIGH — Preemption Risk**
```
├── Actively working (In Progress) → DO NOT PROCEED.
├── Not started → COMMUNICATE, proceed if agreed. Offer narrow version.
└── Unclear → Ask. 30-second message prevents hours of rework.
```
Narrow Scope Rule: Build only what your phase needs. Don't generalize. Document what's left.

**Type 4: MEDIUM — Scope Overlap**
```
├── Producing shared artifacts → ALIGN interfaces before building.
├── Parallel/independent → LOW RISK. Check at phase boundaries.
└── Unclear → Review their code/tickets.
```

**Type 5: MEDIUM — Dependency Chain**
```
I depend on theirs: <1d → WAIT. 1-3d → Temp adapter + TODO. Unknown → Ask ETA.
They depend on mine: Prioritize merge. Ping reviewers.
```

## Key Tooling Recipes

**Linear MCP:**
```
mcp__linear__list_issues  assignee: "{name}", team: "Romeo", state: "started", limit: 50
mcp__linear__get_issue    id: "{ROM-XX}", includeRelations: true
mcp__linear__list_issues  query: "{term}", team: "Romeo", limit: 50
mcp__linear__create_comment  issueId: "{id}", body: "{markdown}"
```

**GitHub CLI:**
```bash
gh pr list --state open --json number,title,author,headRefName,baseRefName,createdAt,url --limit 50
gh pr diff {pr_number} --name-only
git log $(git merge-base HEAD origin/dev)..origin/dev --oneline
git diff $(git merge-base HEAD origin/dev)..origin/dev --name-only
gh pr view {pr_number} --json reviews,reviewRequests,mergeable,statusCheckRollup
gh pr list --state merged --json number,title,author,mergedAt --limit 20
git fetch origin dev && git rev-list HEAD..origin/dev --count
```
