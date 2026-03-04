# Admiral Muster Protocol — Data Spine Patch

## Overview

Replaces directory scanning in the admiral muster protocol with bounded queries
from the Agency data spine. This eliminates context bloat from loading full
mission/dossier files on every invocation.

## Patched Muster Protocol

On every invocation, before processing Director intent:

1. **Workspace check** — orphan recovery (unchanged)
2. **Read bulletin** (unchanged)
3. **Query operational state:**
   ```bash
   node /Users/michaelstuart/Agency/.data/query.js missions --status active
   node /Users/michaelstuart/Agency/.data/query.js ops --last 3
   node /Users/michaelstuart/Agency/.data/query.js artifacts --type dossier --last 5
   ```
4. **Assess mission alignment** from query results (metadata only)
5. **Load specific files** ONLY when dispatch requires them
6. **Proceed with triage**

## What Changes

### Before (directory scan)
- Read all files in `memory/missions/` to find active missions
- Read all files in `memory/dossiers/` for context
- Read recent `memory/events/*.md` for operational state
- ~50KB+ of context loaded on every invocation

### After (bounded queries)
- 3 CLI queries returning compact metadata (~1KB total)
- Load full files only when a specific mission is dispatched
- Event history accessed through indexed queries, not file reads

## Application Instructions

Edit `agency/shore/admiral.md`, replacing the muster section that scans
directories with the query-based protocol above.
