'use strict';

const path = require('path');

const AGENCY_ROOT = path.resolve(__dirname, '..', '..');
const db = require(path.join(AGENCY_ROOT, '.data', 'db'));

/**
 * Parse markdown table rows from validated log content into event records.
 * Handles 4-column (Time | Source | Event | Detail) format.
 *
 * @param {string} content - Validated log file content (markdown table)
 * @param {string} filePath - Path of the log file being written
 * @returns {object[]} Array of event record objects
 */
function parseLogRows(content, filePath) {
  if (!content) return [];

  const records = [];
  const lines = content.split('\n');
  const op = deriveOpId(filePath);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('|')) continue;
    if (trimmed.match(/^\|\s*-+/)) continue;               // separator
    if (trimmed.match(/^\|\s*Time\s*\|/i)) continue;        // header

    const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 3) continue;

    // 4-column: Time | Source | Event | Detail
    if (cells.length >= 4) {
      const [ts, src, evt, detail] = cells;
      if (!isISO(ts)) continue;
      records.push(makeRecord(ts, src, evt, detail, op));
    }
  }

  return records;
}

/**
 * Append event records to SQLite in a single transaction.
 * All records succeed or all fail — no half-written sequences.
 *
 * @param {object[]} records - Array of event record objects
 */
function appendEvents(records) {
  if (!records || records.length === 0) return;

  const ops = records.map(r => ({
    table: 'events',
    row: {
      ts: r.ts,
      src: r.src,
      evt: r.evt,
      detail: r.detail || null,
      op: r.op || null,
      refs_json: r.refs ? JSON.stringify(r.refs) : null,
    },
  }));

  db.insertBatch(ops);
}

/**
 * Create and append an artifact registration event.
 * Writes event + artifact row atomically in one transaction.
 *
 * @param {string} filePath - Path of the artifact being written
 * @param {object} artifactInfo - { type, domain } from matchArtifact()
 */
function appendArtifactEvent(filePath, artifactInfo) {
  const ts = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const record = makeRecord(
    ts,
    'AGENCY',
    'ARTIFACT_REGISTERED',
    `${artifactInfo.type}: ${path.basename(filePath)}`,
    null,
    { artifact: filePath }
  );

  db.insertBatch([
    {
      table: 'events',
      row: {
        ts: record.ts,
        src: record.src,
        evt: record.evt,
        detail: record.detail || null,
        op: record.op || null,
        refs_json: record.refs ? JSON.stringify(record.refs) : null,
      },
    },
    {
      table: 'artifacts',
      row: {
        type: artifactInfo.type,
        domain: artifactInfo.domain || null,
        path: filePath,
        summary: `${artifactInfo.type}: ${path.basename(filePath)}`,
        mission: null,
        created: ts,
      },
    },
  ]);
}

/**
 * Build a v1 event record.
 */
function makeRecord(ts, src, evt, detail, op, refs) {
  return {
    v: 1,
    ts: ts,
    src: src,
    evt: evt,
    detail: (detail || '').substring(0, 200),
    op: op || null,
    refs: refs || {},
  };
}

/**
 * Derive operation ID from the log file path.
 * agency-workspace/log.md -> live-session
 * jobs/log.md -> integration-job
 * streams/{name}.md -> stream-{name}
 */
function deriveOpId(filePath) {
  if (!filePath) return 'unknown';

  // agency-workspace logs
  if (filePath.includes('agency-workspace')) return 'live-session';

  // jobs logs
  if (filePath.includes('jobs/')) return 'integration-job';

  // streams/{name}.md
  const streamMatch = filePath.match(/streams\/([^/]+)\.md$/);
  if (streamMatch) return `stream-${streamMatch[1]}`;

  return 'unknown';
}

function isISO(str) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(str);
}

module.exports = {
  parseLogRows,
  appendEvents,
  appendArtifactEvent,
  makeRecord,
  deriveOpId,
};
