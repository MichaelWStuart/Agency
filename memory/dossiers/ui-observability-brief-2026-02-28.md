# UI Observability Layer — Next Phase Brief

## Context

The Intelligence protocol is designed and implemented. The Agency now
has a multi-layer hierarchy: XO (Bridge) → Dispatch (P1) → divisions
(P2 sub-agents) → L2 workers (P2 sub-agents). Intelligence alone has
3 layers of sub-agent dispatch. The Director has no visibility into
what's happening inside these operations.

## Problem

With nested sub-agents, the Director cannot see:
- What agents are active and what they're doing
- Every boundary crossing (LAUNCH_BRIEF, RETURN, ESCALATION)
- Artifact production and promotion
- Where an operation is in its lifecycle
- What went wrong when something fails

The event emission protocol (D12) exists in SKILL.md — events are
defined, log format is specified, workspace log is the collection
point. But nothing consumes these events visually.

## What Needs to Happen

Build a UI dashboard that surfaces every exchange between Agency
components in real-time:
- Every P1 transition (XO → Dispatch)
- Every P2 LAUNCH_BRIEF and RETURN
- Every L2 dispatch (FIELD_BRIEF/RETURN, DESK_BRIEF/RETURN)
- Every ESCALATION and its resolution path
- Every artifact created, promoted, or cleaned
- Every event emitted to the workspace log

The UI should give the Director a live view of Agency operations —
who's active, what they're doing, what they've produced, where
things are stuck.

## Sequencing

This must happen BEFORE the first real mission (Contacts Calibration,
ROM-7). The intelligence protocol is ready, but running a multi-layer
calibrate operation blind — with Field Agents capturing evidence,
Desk Analysts producing dossiers, and the Chief Analyst orchestrating
— without being able to see what's happening is not viable.

```
[NOW]  UI observability layer
[THEN] AGENCY.MISSION.CREATE — Contacts Calibration (ROM-7)
[THEN] First calibrate run using Intelligence protocol
```

## Existing Infrastructure

- Event emission protocol defined in SKILL.md (D12)
- Event format: `| Timestamp | Source | Event | Detail |`
- Event codes defined per division (AGENCY, DISPATCH, INTEL, PROD, FA)
- `workspace/log.md` is the hot-tier collection point
- `memory/events/` is the cold-tier archive
- `agency/ui/` directory exists (hierarchy visualization files)
- D14 in LAYOUT.md sketches the data pipeline concept (MCP server → UI)

## For the Next Agent

Explore what exists in `agency/ui/`, review D12 and D14 in LAYOUT.md,
and figure out how to wire the event stream into a visual dashboard
the Director can watch during operations. The goal is full
observability across every layer of the Agency hierarchy.
