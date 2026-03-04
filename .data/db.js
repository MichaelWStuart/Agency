'use strict';

/**
 * db.js — Thin sqlite3 CLI wrapper. Zero npm dependencies.
 * Uses macOS system sqlite3 with -json output.
 *
 * Single store: .data/agency.db with WAL mode for crash safety.
 * Schema created lazily on first write via init().
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'agency.db');

let initialized = false;

const SCHEMA = `
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  src TEXT NOT NULL,
  evt TEXT NOT NULL,
  detail TEXT,
  op TEXT,
  refs_json TEXT
);

CREATE TABLE IF NOT EXISTS missions (
  name TEXT PRIMARY KEY,
  domain TEXT,
  strategy TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  manifest_json TEXT,
  created TEXT,
  updated TEXT
);

CREATE TABLE IF NOT EXISTS artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  domain TEXT,
  path TEXT,
  summary TEXT,
  mission TEXT,
  created TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_op ON events(op);
CREATE INDEX IF NOT EXISTS idx_events_src ON events(src);
CREATE INDEX IF NOT EXISTS idx_events_evt ON events(evt);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
`;

/**
 * Initialize the database: create file, schema, WAL mode.
 * Idempotent — safe to call multiple times.
 */
function init() {
  if (initialized && fs.existsSync(DB_PATH)) return;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  execSync(`sqlite3 "${DB_PATH}"`, {
    input: SCHEMA,
    encoding: 'utf8',
    timeout: 10000,
  });

  initialized = true;
}

/**
 * Execute a SQL query and return parsed JSON results.
 * @param {string} sql - SQL query to execute
 * @returns {object[]} Array of row objects
 */
function query(sql) {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }

  const escapedSql = sql.replace(/'/g, "'\\''");
  const result = execSync(
    `sqlite3 "${DB_PATH}" -json '${escapedSql}'`,
    { encoding: 'utf8', timeout: 5000 }
  );

  return result.trim() ? JSON.parse(result) : [];
}

/**
 * Execute a SQL statement (no results expected).
 * @param {string} sql - SQL statement to execute
 */
function exec(sql) {
  const escapedSql = sql.replace(/'/g, "'\\''");
  execSync(
    `sqlite3 "${DB_PATH}" '${escapedSql}'`,
    { encoding: 'utf8', timeout: 10000 }
  );
}

/**
 * Execute multiple SQL statements from a string.
 * Uses stdin pipe to avoid shell escaping issues.
 */
function execMulti(sql) {
  execSync(`sqlite3 "${DB_PATH}"`, {
    input: sql,
    encoding: 'utf8',
    timeout: 10000,
  });
}

/**
 * Insert a row into a table.
 * Calls init() lazily to ensure schema exists.
 *
 * @param {string} table - Table name
 * @param {object} row - Column name -> value mapping
 */
function insert(table, row) {
  init();
  const cols = Object.keys(row);
  const vals = cols.map(c => esc(row[c]));
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
  execMulti(sql);
}

/**
 * Insert multiple rows across one or more tables in a single transaction.
 * Each entry is { table, row } — all succeed or all fail.
 *
 * @param {{ table: string, row: object }[]} operations
 */
function insertBatch(operations) {
  if (!operations || operations.length === 0) return;
  init();
  let sql = 'BEGIN;\n';
  for (const { table, row } of operations) {
    const cols = Object.keys(row);
    const vals = cols.map(c => esc(row[c]));
    sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
  }
  sql += 'COMMIT;\n';
  execMulti(sql);
}

/**
 * Upsert (INSERT OR REPLACE) a row into a table.
 * Calls init() lazily to ensure schema exists.
 *
 * @param {string} table - Table name
 * @param {object} row - Column name -> value mapping
 */
function upsert(table, row) {
  init();
  const cols = Object.keys(row);
  const vals = cols.map(c => esc(row[c]));
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
  execMulti(sql);
}

/**
 * Check if the database exists.
 */
function dbExists() {
  return fs.existsSync(DB_PATH);
}

/**
 * Escape a value for SQL insertion.
 */
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

module.exports = { init, query, exec, execMulti, insert, insertBatch, upsert, dbExists, DB_PATH };
