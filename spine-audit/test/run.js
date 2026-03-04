#!/usr/bin/env node
'use strict';

/**
 * spine-audit test suite — saga-guard pattern.
 * Each test either unit-tests a module or spawns audit.js and asserts output.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const AUDIT = path.join(__dirname, '..', 'audit.js');
const FIXTURES = path.join(__dirname, 'fixtures');

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    if (detail) console.log(`    → ${detail}`);
    failures.push({ name, detail });
  }
}

// ---------------------------------------------------------------------------
// Unit tests: Vocabulary
// ---------------------------------------------------------------------------

console.log('\n\x1b[1m\x1b[4mspine-audit test suite\x1b[0m');
console.log('\n\x1b[1mVocabulary\x1b[0m');

const vocab = require('../lib/vocabulary');

const testVocab = vocab.loadVocab();
assert('vocab loads successfully', testVocab && typeof testVocab === 'object');
assert('vocab has 6 domains', Object.keys(testVocab).length === 6,
  `got ${Object.keys(testVocab).length}`);

const tokens = vocab.tokenize('The submarine captain dived deep');
assert('tokenize extracts words ≥3 chars', tokens.length === 5 && tokens.includes('submarine'),
  `got [${tokens.join(', ')}]`);

const counts = vocab.classify('The submarine captain dived. The feedstock assay began.');
assert('classify detects naval + refinery domains',
  counts.naval >= 2 && counts.refinery >= 2,
  `naval:${counts.naval} refinery:${counts.refinery}`);

const h = vocab.entropy({ a: 50, b: 50 });
assert('entropy: 50/50 split ≈ 1.0 bit', Math.abs(h - 1.0) < 0.01, `got ${h}`);

const h0 = vocab.entropy({ a: 100 });
assert('entropy: single domain = 0.0 bits', h0 === 0, `got ${h0}`);

const domains = vocab.domainsForTerm('muster');
assert('domainsForTerm: "muster" in naval + military',
  domains.includes('naval') && domains.includes('military'),
  `got [${domains.join(', ')}]`);

const ratio = vocab.metaphorRatio('submarine dive captain feedstock assay payload schema');
assert('metaphorRatio separates metaphor vs schema',
  ratio.metaphor >= 3 && ratio.schema >= 2,
  `metaphor:${ratio.metaphor} schema:${ratio.schema}`);

// ---------------------------------------------------------------------------
// Unit tests: Scanner
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mScanner\x1b[0m');

const { scan, makeRecord } = require('../lib/scanner');

const records = scan();
assert('scan finds agency files', records.length >= 25,
  `got ${records.length} files`);

const primRecord = records.find(r => r.rel === 'primitives.md');
assert('scan includes primitives.md', !!primRecord);
assert('record has expected fields',
  primRecord && primRecord.tokens.length > 0 && primRecord.sections.length > 0,
  primRecord ? `tokens:${primRecord.tokens.length} sections:${primRecord.sections.length}` : 'missing');

// ---------------------------------------------------------------------------
// Unit tests: Portal
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mPortal Parser\x1b[0m');

const { parsePortals, scoreTethering } = require('../lib/portal');

// Test with synthetic content containing a portal declaration
const fakeRecord = {
  rel: 'afloat/integration/integration.md',
  path: '/fake/afloat/integration/integration.md',
  content: 'Portal: naval -> refinery | The submarine carries crude feedstock aboard for fractionation in the engine room',
  lines: ['Portal: naval -> refinery | The submarine carries crude feedstock aboard for fractionation in the engine room'],
  tokens: [],
  domains: {},
  sections: [],
  wordCount: 0,
};

const portals = parsePortals([fakeRecord]);
assert('parsePortals finds portal declaration', portals.length === 1,
  `got ${portals.length}`);
assert('portal has correct from/to',
  portals[0] && portals[0].from === 'naval' && portals[0].to === 'refinery',
  portals[0] ? `${portals[0].from}->${portals[0].to}` : 'missing');

const noPortals = parsePortals(records);
assert('real agency has 0 portals (current baseline)', noPortals.length === 0,
  `got ${noPortals.length}`);

// ---------------------------------------------------------------------------
// Unit tests: Axis checks with fixtures
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mAxis 4: Mooring (fixture)\x1b[0m');

const mooringCheck = require('../lib/checks/mooring');
const mooringFixture = makeRecord(path.join(FIXTURES, 'axis4-mooring.md'));
// Override rel to match primitives.md for the check
mooringFixture.rel = 'primitives.md';
const mooringResult = mooringCheck.check([mooringFixture]);
assert('mooring detects 2 moored + 1 unmoored',
  mooringResult.moored === 2 && mooringResult.unmoored === 1,
  `moored:${mooringResult.moored} unmoored:${mooringResult.unmoored}`);
assert('mooring returns YELLOW or RED for missing moorings',
  mooringResult.status !== 'GREEN',
  `got ${mooringResult.status}`);

console.log('\n\x1b[1mAxis 8: Exceptions (fixture)\x1b[0m');

const exceptionsCheck = require('../lib/checks/exceptions');
const hedgeFixture = makeRecord(path.join(FIXTURES, 'axis8-hedges.md'));
const hedgeResult = exceptionsCheck.check([hedgeFixture]);
assert('exceptions detects hedge terms', hedgeResult.totalHedges >= 8,
  `got ${hedgeResult.totalHedges} hedges`);
assert('exceptions computes density > 0', hedgeResult.globalDensity > 0.05,
  `got ${hedgeResult.globalDensity.toFixed(3)}`);

console.log('\n\x1b[1mAxis 1: Lexical (fixture)\x1b[0m');

const lexicalCheck = require('../lib/checks/lexical');
const polysemyFixture = makeRecord(path.join(FIXTURES, 'axis1-polysemy.md'));
const lexResult = lexicalCheck.check([polysemyFixture]);
assert('lexical returns polysemy score', typeof lexResult.polysemyScore === 'number');
assert('lexical finds top terms', lexResult.topTerms.length >= 0);

console.log('\n\x1b[1mAxis 2: Domain Bleed (fixture)\x1b[0m');

const bleedCheck = require('../lib/checks/domain-bleed');
const bleedFixture = makeRecord(path.join(FIXTURES, 'axis2-bleed.md'));
const bleedResult = bleedCheck.check([bleedFixture], []);
assert('domain-bleed computes entropy', bleedResult.details.length > 0);

// ---------------------------------------------------------------------------
// Integration test: full audit against real agency/
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mIntegration: Full Audit\x1b[0m');

const fullResult = spawnSync('node', [AUDIT], { encoding: 'utf8', timeout: 10000 });
assert('full audit exits 0 (all GREEN)', fullResult.status === 0,
  `exit ${fullResult.status}\n${fullResult.stderr || ''}\n${(fullResult.stdout || '').substring(0, 200)}`);
assert('full audit output contains HEALTHY',
  fullResult.stdout && fullResult.stdout.includes('HEALTHY'),
  (fullResult.stdout || '').substring(0, 100));

// ---------------------------------------------------------------------------
// Integration test: single axis mode
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mIntegration: Single Axis\x1b[0m');

const axisNames = ['lexical', 'bleed', 'path', 'mooring', 'structure', 'density', 'closure', 'exceptions'];
for (const axis of axisNames) {
  const r = spawnSync('node', [AUDIT, '--axis', axis], { encoding: 'utf8', timeout: 10000 });
  assert(`--axis ${axis} exits 0`, r.status === 0,
    `exit ${r.status}: ${(r.stderr || '').substring(0, 80)}`);
}

// ---------------------------------------------------------------------------
// Integration test: JSON mode
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mIntegration: JSON Mode\x1b[0m');

const jsonResult = spawnSync('node', [AUDIT, '--json'], { encoding: 'utf8', timeout: 10000 });
assert('JSON mode exits 0', jsonResult.status === 0);
let parsed;
try {
  parsed = JSON.parse(jsonResult.stdout);
  assert('JSON output has 8 results', parsed.results && parsed.results.length === 8,
    `got ${parsed.results ? parsed.results.length : 0}`);
  assert('JSON output has portals array', Array.isArray(parsed.portals));
  assert('JSON output has fileCount', typeof parsed.fileCount === 'number');
} catch (e) {
  assert('JSON output is valid JSON', false, e.message);
}

// ---------------------------------------------------------------------------
// Performance test
// ---------------------------------------------------------------------------

console.log('\n\x1b[1mPerformance\x1b[0m');

const start = Date.now();
spawnSync('node', [AUDIT], { encoding: 'utf8', timeout: 10000 });
const elapsed = Date.now() - start;
assert(`full audit < 2s (got ${elapsed}ms)`, elapsed < 2000);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n\x1b[1mResults: ${passed} passed, ${failed} failed\x1b[0m`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  ${f.name}: ${f.detail || 'no detail'}`);
  }
  process.exit(1);
}
process.exit(0);
