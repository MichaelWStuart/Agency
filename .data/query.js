#!/usr/bin/env node
'use strict';

/**
 * query.js — Bounded query CLI for the Agency data spine.
 * Agent-context-optimized compact output.
 *
 * Usage:
 *   node .data/query.js events --last 10
 *   node .data/query.js events --src AGENCY --since 2026-03-01
 *   node .data/query.js missions --status active
 *   node .data/query.js artifacts --domain contacts --type dossier
 *   node .data/query.js ops --last 5
 *   node .data/query.js status
 */

const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'agency.db');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  printUsage();
  process.exit(0);
}

// Status command handles missing DB gracefully
if (command === 'status') {
  cmdStatus();
  process.exit(0);
}

// All other commands need the database
if (!fs.existsSync(DB_PATH)) {
  console.log('No data yet. Run an operation first.');
  process.exit(0);
}

const { query } = require('./db');

switch (command) {
  case 'events':
    cmdEvents(parseFlags(args.slice(1)));
    break;
  case 'missions':
    cmdMissions(parseFlags(args.slice(1)));
    break;
  case 'artifacts':
    cmdArtifacts(parseFlags(args.slice(1)));
    break;
  case 'ops':
    cmdOps(parseFlags(args.slice(1)));
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}

// ── Commands ────────────────────────────────────────────────

function cmdStatus() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('STATUS: clean');
    console.log('No database. First operation will initialize.');
    return;
  }

  const TERMINAL_EVENTS = ['RETURNED', 'RESOLVED', 'ABANDONED'];

  const { query } = require('./db');

  // Find the latest op by id (not ts — avoids timestamp format issues)
  const latestOpRow = query(`
    SELECT op FROM events
    WHERE op IS NOT NULL
    ORDER BY id DESC
    LIMIT 1
  `);

  let incomplete = false;
  let lastOp = null;
  let lastEvt = null;

  if (latestOpRow.length > 0) {
    lastOp = latestOpRow[0].op;

    // Check if the latest op has a terminal event
    const terminalCheck = query(`
      SELECT evt FROM events
      WHERE op = '${lastOp.replace(/'/g, "''")}'
      ORDER BY id DESC
      LIMIT 1
    `);

    if (terminalCheck.length > 0) {
      lastEvt = terminalCheck[0].evt;
      if (!TERMINAL_EVENTS.includes(lastEvt)) {
        incomplete = true;
      }
    }
  }

  // Active missions (non-terminal status)
  const activeMissions = query(`
    SELECT name, status, strategy, domain
    FROM missions
    WHERE status NOT IN ('complete', 'abandoned')
    ORDER BY updated DESC
  `);

  if (incomplete) {
    console.log('STATUS: incomplete');

    // Show recent events for this op
    const opEvents = query(`
      SELECT ts, src, evt, detail FROM events
      WHERE op = '${lastOp.replace(/'/g, "''")}'
      ORDER BY id DESC
      LIMIT 5
    `);

    console.log(`\nIncomplete operation: ${lastOp}`);
    console.log(`Last event: ${lastEvt}`);
    if (opEvents.length > 0) {
      console.log('\nRecent events:');
      for (const r of opEvents.reverse()) {
        const ts = r.ts.replace(/T/, ' ').replace(/Z$/, '');
        console.log(`  ${ts} | ${r.src.padEnd(6)} | ${r.evt}`);
      }
    }
    console.log('\nOptions: resume, abandon, or start new');
  } else {
    console.log('STATUS: clean');
  }

  if (activeMissions.length > 0) {
    console.log(`\nActive missions (${activeMissions.length}):`);
    for (const m of activeMissions) {
      console.log(`  ${m.name} | ${m.strategy || '-'} | ${m.status} | ${m.domain || '-'}`);
    }
  } else {
    console.log('\nNo active missions.');
  }
}

function cmdEvents(flags) {
  const limit = flags.last || 20;
  let where = [];
  if (flags.src) where.push(`src = '${esc(flags.src)}'`);
  if (flags.since) where.push(`ts >= '${esc(flags.since)}'`);
  if (flags.op) where.push(`op = '${esc(flags.op)}'`);
  if (flags.evt) where.push(`evt = '${esc(flags.evt)}'`);

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT ts, src, evt, detail, op FROM events ${whereClause} ORDER BY id DESC LIMIT ${limit}`;

  const rows = query(sql);
  if (rows.length === 0) {
    console.log('No events found.');
    return;
  }

  console.log('EVENTS:');
  for (const r of rows.reverse()) {
    const ts = r.ts.replace(/T/, ' ').replace(/Z$/, '');
    console.log(`  ${ts} | ${r.src.padEnd(6)} | ${r.evt.padEnd(20)} | ${truncate(r.detail, 60)}`);
  }
  console.log(`---\n${rows.length} result${rows.length !== 1 ? 's' : ''}.`);
}

function cmdMissions(flags) {
  let where = [];
  if (flags.status) where.push(`status = '${esc(flags.status)}'`);
  if (flags.domain) where.push(`domain LIKE '%${esc(flags.domain)}%'`);

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT name, domain, strategy, status, updated FROM missions ${whereClause} ORDER BY updated DESC`;

  const rows = query(sql);
  if (rows.length === 0) {
    console.log(`MISSIONS${flags.status ? ` (${flags.status})` : ''}: none.`);
    return;
  }

  console.log(`MISSIONS${flags.status ? ` (${flags.status})` : ''}:`);
  for (const r of rows) {
    console.log(`  ${r.name} | ${r.strategy || '-'} | ${r.status} | ${r.domain || '-'}`);
  }
  console.log(`---\n${rows.length} result${rows.length !== 1 ? 's' : ''}.`);
}

function cmdArtifacts(flags) {
  const limit = flags.last || 20;
  let where = [];
  if (flags.type) where.push(`type = '${esc(flags.type)}'`);
  if (flags.domain) where.push(`domain = '${esc(flags.domain)}'`);

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT type, domain, path, summary, created FROM artifacts ${whereClause} ORDER BY created DESC LIMIT ${limit}`;

  const rows = query(sql);
  if (rows.length === 0) {
    console.log('No artifacts found.');
    return;
  }

  console.log('ARTIFACTS:');
  for (const r of rows) {
    const ts = r.created ? r.created.replace(/T.*/, '') : '-';
    console.log(`  ${r.type.padEnd(12)} | ${(r.domain || '-').padEnd(10)} | ${ts} | ${r.path || '-'}`);
  }
  console.log(`---\n${rows.length} result${rows.length !== 1 ? 's' : ''}.`);
}

function cmdOps(flags) {
  const limit = flags.last || 10;
  const sql = `
    SELECT op, MIN(ts) as started, MAX(ts) as ended, COUNT(*) as event_count,
           GROUP_CONCAT(DISTINCT src) as sources
    FROM events
    WHERE op IS NOT NULL AND op != ''
    GROUP BY op
    ORDER BY started DESC
    LIMIT ${limit}
  `;

  const rows = query(sql);
  if (rows.length === 0) {
    console.log('No operations found.');
    return;
  }

  console.log('OPERATIONS:');
  for (const r of rows) {
    const start = r.started.replace(/T/, ' ').replace(/Z$/, '');
    console.log(`  ${r.op} | ${start} | ${r.event_count} events | ${r.sources}`);
  }
  console.log(`---\n${rows.length} result${rows.length !== 1 ? 's' : ''}.`);
}

// ── Helpers ─────────────────────────────────────────────────

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        flags[key] = val;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

function esc(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/'/g, "''");
}

function truncate(str, max) {
  if (!str) return '-';
  return str.length > max ? str.substring(0, max - 3) + '...' : str;
}

function printUsage() {
  console.log(`Agency Data Spine — Query CLI

Commands:
  events     [--last N] [--src SRC] [--since DATE] [--op ID] [--evt CODE]
  missions   [--status STATUS] [--domain DOMAIN]
  artifacts  [--type TYPE] [--domain DOMAIN] [--last N]
  ops        [--last N]
  status     Show last operation state + active missions (boot reconciliation)`);
}
