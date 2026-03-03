# CIC Service Manifest

> Infrastructure branch (COMPOSITION). Mechanism: automated protocols.
> Not Wardroom (orchestration) or Barracks (craft). CIC knowledge:
> service lifecycle, health monitoring, port management.
> Isolated from operational and institutional branches — runs independently.
> Admiral triggers CIC protocols at lifecycle moments (boot, operation close).

---

## Services

### Agency Dashboard

| Property | Value |
|---|---|
| Name | Agency Dashboard |
| Port | 4242 |
| Binary | `tsx` |
| Entry | `~/.claude/tools/agency-dashboard/server.ts` |
| Health Check | `curl -sf http://localhost:4242/ > /dev/null` |
| Boot Script | `cic/boot.sh` |

**Arguments:**
```
--port 4242
--jobs {repo}/jobs
--agency-workspace ~/.claude/agency-workspace
--missions {memory}/missions
--dossiers {memory}/dossiers
--bulletin {skill}/cadre/bulletin.md
--events {memory}/events
```

Where `{repo}` is the active project repository, `{memory}` is the
project overlay path (`~/.claude/projects/{hash}/memory`), and `{skill}`
is the agency skill path (`~/.claude/skills/agency`).

**Startup protocol:**
1. Check if port 4242 is already bound
2. If bound, verify it's the dashboard (health check)
3. If healthy, skip — already running
4. If not running, start in background with `nohup`
5. Wait for health check to pass (max 5s)
6. Report status

**Idempotency rule:** Running `boot.sh` multiple times must never
produce duplicate processes. Always check before starting.

---

## Protocols

### Boot Protocol

**Trigger:** Agency invocation (SKILL.md boot step 3).
**Executable:** `boot.sh`
**Purpose:** Start background services (idempotent).

### Lifecycle Protocol

**Trigger:** Admiral executes at two moments:
1. **On boot (orphan recovery)** — if workspace has stale state from a prior operation
2. **After BRIEFING (normal close)** — operation complete (CLOSURE)

#### Orphan Recovery

If `~/.claude/agency-workspace/log.md` is non-empty when the Agency boots, the prior
operation didn't close properly. Before processing new intent:

1. Extract operation identifier from first log entry (ticket ID or intent summary)
2. Archive `~/.claude/agency-workspace/log.md` to `memory/events/{identifier}-{date}.md`
3. Archive `~/.claude/agency-workspace/streams/` alongside log to events (if non-empty)
4. Clear `~/.claude/agency-workspace/log.md`
5. Clear `~/.claude/agency-workspace/evidence/`
6. Clear `~/.claude/agency-workspace/streams/` — remove all stream files
7. Clear Production workspace (`{repo}/jobs/`) — remove all job artifacts

#### Normal Close

After the Admiral delivers the final BRIEFING:

1. Archive `~/.claude/agency-workspace/log.md` to `memory/events/{identifier}-{date}.md`
2. Clear `~/.claude/agency-workspace/log.md`
3. Clear `~/.claude/agency-workspace/evidence/`
4. Clear `~/.claude/agency-workspace/streams/` — remove all stream files
5. Clear Production workspace (`{repo}/jobs/`) — remove all job artifacts

#### Naming Convention

Archive files: `{ticket-or-op-id}-{YYYY-MM-DD}.md`
Example: `ROM-424-2026-02-27.md`
Fallback (no ticket): `op-{YYYY-MM-DD-HHmm}.md`

#### Cold Tier Retention

Per LIFECYCLE primitive: events are subject to rolling retention.
Retention policy configurable in project config (default: preserve all).

---

## Managed Artifacts

### Entity Registry

| Property | Value |
|---|---|
| File | `cic/registry.json` |
| Schema | `cic/schema.md` |
| API | `GET /api/registry` (served by Agency Dashboard) |

Single source of truth for all Agency entities (B-001 through B-010, 10 entities).
Consumed by the dashboard server at startup; served to the UI via
`/api/registry`. See `schema.md` for field definitions and constraints.
