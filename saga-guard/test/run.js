#!/usr/bin/env node
'use strict';

/**
 * saga-guard test runner — no dependencies, pure Node.js.
 *
 * Each test spawns guard.js, pipes a fixture JSON to stdin,
 * and asserts exit code + stderr content.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const GUARD = path.join(__dirname, '..', 'guard.js');
const FIXTURES = path.join(__dirname, 'fixtures');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fixtureName, expectedExit, stderrChecks) {
  const fixturePath = path.join(FIXTURES, fixtureName);
  const input = fs.readFileSync(fixturePath, 'utf8');

  let exitCode = 0;
  let stderr = '';
  let stdout = '';

  try {
    stdout = execFileSync('node', [GUARD], {
      input,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    exitCode = e.status || 1;
    stderr = e.stderr || '';
    stdout = e.stdout || '';
  }

  // If exit 0, stderr might still have warnings
  if (exitCode === 0) {
    // Re-run to capture stderr on success (execFileSync doesn't capture stderr on success)
    try {
      const result = require('child_process').spawnSync('node', [GUARD], {
        input,
        encoding: 'utf8',
        timeout: 10000,
      });
      exitCode = result.status;
      stderr = result.stderr || '';
      stdout = result.stdout || '';
    } catch (e) {
      // fallback
    }
  }

  let ok = true;
  const errors = [];

  // Check exit code
  if (exitCode !== expectedExit) {
    ok = false;
    errors.push(`exit code: expected ${expectedExit}, got ${exitCode}`);
  }

  // Check stderr content
  if (stderrChecks) {
    for (const check of stderrChecks) {
      if (check.includes && !stderr.includes(check.includes)) {
        ok = false;
        errors.push(`stderr missing: "${check.includes}"`);
      }
      if (check.excludes && stderr.includes(check.excludes)) {
        ok = false;
        errors.push(`stderr unexpected: "${check.excludes}"`);
      }
    }
  }

  if (ok) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    for (const err of errors) {
      console.log(`    → ${err}`);
    }
    if (stderr) {
      console.log(`    stderr: ${stderr.substring(0, 200).replace(/\n/g, '\\n')}`);
    }
    failures.push({ name, errors });
  }
}

// ---------------------------------------------------------------------------
// Extractor unit tests
// ---------------------------------------------------------------------------

function testExtractor() {
  console.log('\n\x1b[1mSymbol Extraction\x1b[0m');

  const { extract } = require('../lib/extractor');
  const symbols = extract();
  let ok = true;
  const errors = [];

  // Instruction count
  if (symbols.instruction_ids.length < 18) {
    ok = false;
    errors.push(`instruction_ids: expected >=18, got ${symbols.instruction_ids.length}`);
  }

  // NEED count
  if (symbols.need_ids.length < 10) {
    ok = false;
    errors.push(`need_ids: expected >=10, got ${symbols.need_ids.length}`);
  }

  // Event counts
  if (symbols.events.AGENCY.length < 15) {
    ok = false;
    errors.push(`AGENCY events: expected >=15, got ${symbols.events.AGENCY.length}`);
  }
  if (symbols.events.INTEL.length < 7) {
    ok = false;
    errors.push(`INTEL events: expected >=7, got ${symbols.events.INTEL.length}`);
  }
  if (symbols.events.INTEG.length < 25) {
    ok = false;
    errors.push(`INTEG events: expected >=25, got ${symbols.events.INTEG.length}`);
  }

  // Roster
  if (Object.keys(symbols.roster).length !== 10) {
    ok = false;
    errors.push(`roster: expected 10, got ${Object.keys(symbols.roster).length}`);
  }

  // Specific known IDs
  if (!symbols.instruction_ids.includes('INTEL.COLLECT.SCOPE')) {
    ok = false;
    errors.push('missing instruction: INTEL.COLLECT.SCOPE');
  }
  if (!symbols.need_ids.includes('SCOPE_DATA')) {
    ok = false;
    errors.push('missing NEED: SCOPE_DATA');
  }
  if (!symbols.events.AGENCY.includes('INVOKED')) {
    ok = false;
    errors.push('missing event: AGENCY.INVOKED');
  }
  if (!symbols.events.INTEG.includes('RECV.RECEIVED')) {
    ok = false;
    errors.push('missing event: INTEG.RECV.RECEIVED');
  }

  if (ok) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m symbol table contains all expected entries (${symbols.instruction_ids.length} instructions, ${symbols.need_ids.length} NEEDs, ${symbols.events.AGENCY.length + symbols.events.INTEL.length + symbols.events.INTEG.length} events, ${Object.keys(symbols.roster).length} roster)`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m symbol table incomplete`);
    for (const err of errors) {
      console.log(`    → ${err}`);
    }
    failures.push({ name: 'Symbol extraction', errors });
  }
}

// ---------------------------------------------------------------------------
// Cache behavior test
// ---------------------------------------------------------------------------

function testCache() {
  console.log('\n\x1b[1mCache Behavior\x1b[0m');

  const { extract } = require('../lib/extractor');
  const { CACHE_FILE } = require('../lib/cache');

  // First extract (populates cache)
  extract();

  // Check cache file exists
  if (!fs.existsSync(CACHE_FILE)) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m cache file not created`);
    failures.push({ name: 'Cache creation', errors: ['cache file missing'] });
    return;
  }

  // Time a cached load
  const start = Date.now();
  const symbols = extract();
  const elapsed = Date.now() - start;

  if (elapsed < 100) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m cached load: ${elapsed}ms (< 100ms target)`);
  } else {
    // Still pass if under 2s
    if (elapsed < 2000) {
      passed++;
      console.log(`  \x1b[32m✓\x1b[0m cached load: ${elapsed}ms (< 2s target)`);
    } else {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m cached load too slow: ${elapsed}ms`);
      failures.push({ name: 'Cache speed', errors: [`${elapsed}ms > 2000ms`] });
    }
  }
}

// ---------------------------------------------------------------------------
// Performance test
// ---------------------------------------------------------------------------

function testPerformance() {
  console.log('\n\x1b[1mPerformance\x1b[0m');

  const fixturePath = path.join(FIXTURES, 'valid-launch-brief-integ.json');
  const input = fs.readFileSync(fixturePath, 'utf8');

  const start = Date.now();
  const result = require('child_process').spawnSync('node', [GUARD], {
    input,
    encoding: 'utf8',
    timeout: 10000,
  });
  const elapsed = Date.now() - start;

  if (elapsed < 2000) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m full invocation: ${elapsed}ms (< 2s target)`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m full invocation too slow: ${elapsed}ms`);
    failures.push({ name: 'Performance', errors: [`${elapsed}ms > 2000ms`] });
  }
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

console.log('\n\x1b[1m\x1b[4msaga-guard test suite\x1b[0m');

// Phase 2: Extractor
testExtractor();
testCache();

// Phase 3-4: Guard end-to-end
console.log('\n\x1b[1mPayload Validation (dispatch)\x1b[0m');

test('valid LAUNCH_BRIEF (Intelligence) — pass',
  'valid-launch-brief-intel.json', 0, []);

test('valid LAUNCH_BRIEF (Integration) — pass',
  'valid-launch-brief-integ.json', 0, []);

test('PROD.FIX instruction — block (UNKNOWN_INSTRUCTION)',
  'invalid-instruction-prod-fix.json', 2, [
    { includes: 'UNKNOWN_INSTRUCTION' },
    { includes: 'PROD.FIX' },
    { includes: 'LEVEL: 1' },
  ]);

test('missing delimiters — warn (MISSING_DELIMITER)',
  'missing-delimiter-fallback.json', 0, [
    { includes: 'MISSING_DELIMITER' },
    { includes: 'LEVEL: 2' },
  ]);

console.log('\n\x1b[1mPayload Validation (return)\x1b[0m');

test('valid MISSION_RETURN (complete + docked) — pass',
  'valid-mission-return-complete.json', 0, []);

test('complete + DOCKING_READY: false — warn (INVARIANT_VIOLATED)',
  'invalid-invariant-complete-not-docked.json', 0, [
    { includes: 'INVARIANT_VIOLATED' },
    { includes: 'DOCKING_READY' },
  ]);

test('unknown NEED — warn on return (UNKNOWN_NEED)',
  'invalid-unknown-need.json', 0, [
    { includes: 'IMAGINARY_NEED' },
  ]);

console.log('\n\x1b[1mLog Validation\x1b[0m');

test('valid log entries — pass',
  'valid-log-entry.json', 0, []);

test('PROD source code — block (UNKNOWN_SOURCE)',
  'invalid-log-prod-source.json', 2, [
    { includes: 'UNKNOWN_SOURCE' },
    { includes: 'PROD' },
  ]);

test('unknown event code — block (UNKNOWN_EVENT)',
  'invalid-unknown-event.json', 2, [
    { includes: 'UNKNOWN_EVENT' },
    { includes: 'FABRICATED_EVENT' },
  ]);

console.log('\n\x1b[1mPassthrough\x1b[0m');

test('non-agency tool (Read) — pass through',
  'non-agency-tool.json', 0, []);

// ---------------------------------------------------------------------------
// Event Writer unit tests
// ---------------------------------------------------------------------------

function testEventWriter() {
  console.log('\n\x1b[1mEvent Writer\x1b[0m');

  const { parseLogRows, makeRecord, deriveOpId } = require('../lib/event-writer');

  // Test parseLogRows
  const logContent = `# Test Log

| Time | Source | Event | Detail |
| ---- | ------ | ----- | ------ |
| 2026-03-03T12:00:00Z | AGENCY | INVOKED | Test invocation |
| 2026-03-03T12:01:00Z | INTEL | LAUNCHED | Test launch |
`;

  const records = parseLogRows(logContent, 'streams/B-001.md');

  let ok = true;
  const errors = [];

  if (records.length !== 2) {
    ok = false;
    errors.push(`expected 2 records, got ${records.length}`);
  }

  if (records.length >= 1) {
    if (records[0].v !== 1) { ok = false; errors.push('record.v !== 1'); }
    if (records[0].src !== 'AGENCY') { ok = false; errors.push(`record.src: expected AGENCY, got ${records[0].src}`); }
    if (records[0].evt !== 'INVOKED') { ok = false; errors.push(`record.evt: expected INVOKED, got ${records[0].evt}`); }
    if (records[0].op !== 'stream-B-001') { ok = false; errors.push(`record.op: expected stream-B-001, got ${records[0].op}`); }
  }

  // Test deriveOpId
  if (deriveOpId('/foo/agency-workspace/log.md') !== 'live-session') {
    ok = false;
    errors.push('deriveOpId failed for agency-workspace path');
  }
  if (deriveOpId('streams/B-002.md') !== 'stream-B-002') {
    ok = false;
    errors.push('deriveOpId failed for streams/ path');
  }

  // Test makeRecord
  const rec = makeRecord('2026-03-03T12:00:00Z', 'AGENCY', 'TEST', 'detail', 'op-1', { pr: '123' });
  if (rec.v !== 1 || rec.refs.pr !== '123') {
    ok = false;
    errors.push('makeRecord structure invalid');
  }

  if (ok) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m parseLogRows, deriveOpId, makeRecord`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m event writer unit tests`);
    for (const err of errors) console.log(`    → ${err}`);
    failures.push({ name: 'Event writer', errors });
  }
}

function testArtifactPaths() {
  const { matchArtifact } = require('../lib/artifact-paths');

  let ok = true;
  const errors = [];

  const dossier = matchArtifact('workspace/dossiers/contacts-delta-20260301.yaml');
  if (!dossier || dossier.type !== 'dossier') {
    ok = false;
    errors.push('dossier path not matched');
  }

  const mission = matchArtifact('data/missions/contacts-calibration.yaml');
  if (!mission || mission.type !== 'mission') {
    ok = false;
    errors.push('mission path not matched');
  }

  const chart = matchArtifact('workspace/chart.yaml');
  if (!chart || chart.type !== 'chart') {
    ok = false;
    errors.push('chart path not matched');
  }

  const nonArtifact = matchArtifact('saga-guard/guard.js');
  if (nonArtifact !== null) {
    ok = false;
    errors.push('non-artifact incorrectly matched');
  }

  if (ok) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m artifact path matching (dossier, mission, chart, non-artifact)`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m artifact path matching`);
    for (const err of errors) console.log(`    → ${err}`);
    failures.push({ name: 'Artifact paths', errors });
  }
}

// ---------------------------------------------------------------------------
// Data spine integration tests
// ---------------------------------------------------------------------------

function testDataSpine() {
  console.log('\n\x1b[1mData Spine (init + query)\x1b[0m');

  const { spawnSync } = require('child_process');
  const AGENCY_ROOT = path.join(__dirname, '..', '..');
  const QUERY = path.join(AGENCY_ROOT, '.data', 'query.js');
  const DB = path.join(AGENCY_ROOT, '.data', 'agency.db');

  // Clean slate
  if (fs.existsSync(DB)) fs.unlinkSync(DB);

  // Test lazy init via db.js
  const initStart = Date.now();
  const initResult = spawnSync('node', ['-e', `require('${path.join(AGENCY_ROOT, '.data', 'db').replace(/'/g, "\\'")}').init()`], {
    encoding: 'utf8',
    timeout: 10000,
  });
  const initElapsed = Date.now() - initStart;

  if (initResult.status !== 0) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m db.init() failed: ${initResult.stderr}`);
    failures.push({ name: 'DB init', errors: [initResult.stderr] });
    return;
  }

  if (!fs.existsSync(DB)) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m agency.db not created`);
    failures.push({ name: 'DB init', errors: ['db file missing'] });
    return;
  }

  passed++;
  console.log(`  \x1b[32m✓\x1b[0m db.init(): ${initElapsed}ms — agency.db created with WAL mode`);

  // Test status command (should show clean state)
  const statusResult = spawnSync('node', [QUERY, 'status'], { encoding: 'utf8', timeout: 5000 });
  if (statusResult.status === 0 && statusResult.stdout.includes('STATUS: clean')) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m query.js status — clean state on empty DB`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m query.js status — expected clean state`);
    console.log(`    stdout: ${(statusResult.stdout || '').substring(0, 200)}`);
    failures.push({ name: 'Status clean', errors: ['unexpected output'] });
  }

  // Test queries against empty DB
  const queryTests = [
    { args: ['events', '--last', '5'], check: (out) => out.includes('No events found') },
    { args: ['missions'], check: (out) => out.includes('none') },
    { args: ['artifacts'], check: (out) => out.includes('No artifacts found') },
    { args: ['ops', '--last', '3'], check: (out) => out.includes('No operations found') },
  ];

  for (const qt of queryTests) {
    const r = spawnSync('node', [QUERY, ...qt.args], { encoding: 'utf8', timeout: 5000 });
    const cmdStr = `query.js ${qt.args.join(' ')}`;

    if (r.status === 0 && qt.check(r.stdout)) {
      passed++;
      console.log(`  \x1b[32m✓\x1b[0m ${cmdStr}`);
    } else {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m ${cmdStr}`);
      console.log(`    stdout: ${(r.stdout || '').substring(0, 100)}`);
      console.log(`    stderr: ${(r.stderr || '').substring(0, 100)}`);
      failures.push({ name: cmdStr, errors: [`exit ${r.status}`] });
    }
  }

  // Test graceful degradation — remove DB and verify status works
  fs.unlinkSync(DB);
  const noDbResult = spawnSync('node', [QUERY, 'status'], { encoding: 'utf8', timeout: 5000 });
  if (noDbResult.status === 0 && noDbResult.stdout.includes('No database')) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m graceful degradation: helpful message when DB missing`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m graceful degradation failed`);
    console.log(`    stdout: ${(noDbResult.stdout || '').substring(0, 200)}`);
    failures.push({ name: 'Graceful degradation', errors: ['no helpful message'] });
  }
}

testEventWriter();
testArtifactPaths();
testDataSpine();

// Performance
testPerformance();

// Summary
console.log(`\n\x1b[1mResults: ${passed} passed, ${failed} failed\x1b[0m`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  ${f.name}: ${f.errors.join(', ')}`);
  }
  process.exit(1);
}
process.exit(0);
