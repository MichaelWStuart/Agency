# Event Archive

> Cold tier (P7) — persistent event archive for UI data pipeline.
> Source data for future MCP server -> UI.

---

## Archive Structure

Each operation's events are archived as a single file:

```
events/
  {timestamp}-{operation-summary}.md    # archived from workspace/log.md
  README.md                             # this file
```

## Event Format

```
| Timestamp    | Source  | Event            | Detail        |
|--------------|--------|------------------|---------------|
| {ISO-8601}   | {code} | {event_code}     | {<=50 chars}  |
```

### Source Codes

| Code | Origin |
|---|---|
| AGENCY | Agency kernel |
| INTEL | Intelligence division |
| PROD | Production division |

### Event Codes

See `~/.claude/skills/agency/SKILL.md` for agency-level event codes.
See `~/.claude/skills/agency/divisions/production/shop-floor.md` (Log Events section) for factory-level event codes.

## Rolling Retention

- **Policy:** Last 10 operations retained (configurable in `memory/config.md`)
- **Pruning:** Automatic. Oldest files deleted when archive exceeds retention limit.
- **Never consumed by agents** — only by MCP server / UI pipeline.

## Archive Protocol

After each operation's BRIEFING is delivered (P5):

1. Copy `~/.claude/agency-workspace/log.md` to `events/{timestamp}-{summary}.md`
2. Clear `~/.claude/agency-workspace/log.md`
3. If archive exceeds retention limit, prune oldest files
