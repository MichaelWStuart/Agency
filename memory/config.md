# Project Configuration

> Bootstrap configuration for the Agency operating on this project.
> Lives in project overlay (Zone 2), not in the Agency skill.

---

## Organization

| Field | Value |
|---|---|
| Team | Romeo |
| Team ID | e4d03477-e5fe-4325-9cea-1ce7926a06e7 |
| Workspace | Linear (Romeo workspace) |

## Project

| Field | Value |
|---|---|
| Name | HubShot |
| Repo | g2i-ai/hubshot |
| Local Path | ~/dev/hubshot |
| Main Branch | dev |
| Package Manager | pnpm |
| Framework | Next.js 16 (App Router) |

## Reference App

| Field | Value |
|---|---|
| Name | HubSpot |
| URL | app.hubspot.com |
| Auth | User must be logged in (browser session) |
| Object Codes | 0-1: Contacts, 0-2: Companies, 0-3: Deals, 0-5: Tickets |

## Ports

| Service | Port |
|---|---|
| Dev server | 3002 |
| Storybook | 6006 |

## API Keys

| Key | Location |
|---|---|
| Gemini | `~/.claude/secrets/gemini-key` |

## Event Pipeline

| Setting | Value |
|---|---|
| Rolling retention | 10 operations |
| Event archive | `memory/events/` |
| Agency log | `~/.claude/agency-workspace/log.md` |
| Production log | `~/dev/hubshot/jobs/log.md` |

## Project Knowledge Paths

| File | Path |
|---|---|
| Context | `memory/project/context.md` |
| Conventions | `memory/project/conventions.md` |
| Coordination | `memory/project/coordination.md` |
| Failure Class Catalog | `memory/project/failure-class-catalog.md` |
