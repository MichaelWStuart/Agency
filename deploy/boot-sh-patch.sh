#!/usr/bin/env bash
# CIC Boot — Idempotent startup of Agency infrastructure services
# Usage: bash /Users/michaelstuart/Agency/agency/cic/boot.sh
#
# Services:
#   - Agency Dashboard (port 4242)
#   - Data spine rebuild (SQLite index)

set -euo pipefail

PORT=4242
AGENCY_HOME="/Users/michaelstuart/Agency"
DASHBOARD_DIR="$HOME/.claude/tools/agency-dashboard"
SERVER="$DASHBOARD_DIR/server.ts"

# Derived paths (from AGENCY_HOME)
MEMORY_DIR="$AGENCY_HOME/memory"
MISSIONS_DIR="$MEMORY_DIR/missions"
DOSSIERS_DIR="$MEMORY_DIR/dossiers"
EVENTS_DIR="$MEMORY_DIR/events"

WORKSPACE_DIR="$HOME/.claude/agency-workspace"
BULLETIN_PATH="$AGENCY_HOME/agency/shared/bulletin.md"
JOBS_DIR="$HOME/dev/hubshot/jobs"
LOG_FILE="$DASHBOARD_DIR/.dashboard.log"

# ── Rebuild data spine ──────────────────────────────────────
if [ -f "$AGENCY_HOME/.data/rebuild.js" ]; then
  node "$AGENCY_HOME/.data/rebuild.js" 2>/dev/null || true
fi

# ── Check if already running ──────────────────────────────
if lsof -ti :"$PORT" >/dev/null 2>&1; then
  if curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; then
    echo "CIC: Dashboard already running on :$PORT"
    exit 0
  else
    echo "CIC: Stale process on :$PORT — killing"
    lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
fi

# ── Verify dashboard exists ──────────────────────────────
if [ ! -f "$SERVER" ]; then
  echo "CIC: ERROR — Dashboard server not found at $SERVER"
  exit 1
fi

# ── Ensure directories exist ─────────────────────────────
mkdir -p "$JOBS_DIR" "$WORKSPACE_DIR" "$MISSIONS_DIR" "$DOSSIERS_DIR" "$EVENTS_DIR"

# ── Start dashboard ──────────────────────────────────────
echo "CIC: Starting Agency Dashboard on :$PORT"
nohup npx tsx "$SERVER" \
  --port "$PORT" \
  --jobs "$JOBS_DIR" \
  --agency-workspace "$WORKSPACE_DIR" \
  --missions "$MISSIONS_DIR" \
  --dossiers "$DOSSIERS_DIR" \
  --bulletin "$BULLETIN_PATH" \
  --events "$EVENTS_DIR" \
  > "$LOG_FILE" 2>&1 &

# ── Wait for health ──────────────────────────────────────
for i in $(seq 1 10); do
  if curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; then
    echo "CIC: Dashboard online at http://localhost:$PORT"
    exit 0
  fi
  sleep 0.5
done

echo "CIC: WARNING — Dashboard started but health check failed after 5s"
echo "CIC: Check logs at $LOG_FILE"
exit 1
