#!/usr/bin/env node
'use strict';

/**
 * Spine Auditor — Static Coherence Scanner
 *
 * Usage:
 *   node spine-audit/audit.js              # Full audit
 *   node spine-audit/audit.js --axis lexical   # Single axis
 *   node spine-audit/audit.js --verbose        # Include green axis details
 */

const { scan } = require('./lib/scanner');
const { check: checkPortals } = require('./lib/portal');
const { format } = require('./lib/report');

// Axis checks
const lexical = require('./lib/checks/lexical');
const domainBleed = require('./lib/checks/domain-bleed');
const pathCoherence = require('./lib/checks/path-coherence');
const mooring = require('./lib/checks/mooring');
const structure = require('./lib/checks/structure');
const density = require('./lib/checks/density');
const closure = require('./lib/checks/closure');
const exceptions = require('./lib/checks/exceptions');

const AXIS_MAP = {
  lexical: { mod: lexical, axis: 1 },
  'domain-bleed': { mod: domainBleed, axis: 2 },
  bleed: { mod: domainBleed, axis: 2 },
  'path-coherence': { mod: pathCoherence, axis: 3 },
  path: { mod: pathCoherence, axis: 3 },
  mooring: { mod: mooring, axis: 4 },
  structure: { mod: structure, axis: 5 },
  density: { mod: density, axis: 6 },
  closure: { mod: closure, axis: 7 },
  exceptions: { mod: exceptions, axis: 8 },
  hedge: { mod: exceptions, axis: 8 },
};

// Parse CLI flags
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--axis' && args[i + 1]) {
    flags.axis = args[++i];
  } else if (args[i] === '--verbose') {
    flags.verbose = true;
  } else if (args[i] === '--json') {
    flags.json = true;
  }
}

// Scan agency files
const records = scan();

// Parse portals
const portalResult = checkPortals(records);
const portals = portalResult.portals;

// Run checks
let results;

if (flags.axis) {
  const entry = AXIS_MAP[flags.axis];
  if (!entry) {
    console.error(`Unknown axis: ${flags.axis}`);
    console.error(`Available: ${Object.keys(AXIS_MAP).join(', ')}`);
    process.exit(1);
  }
  const result = runCheck(entry.mod, records, portals);
  results = [result];
} else {
  results = [
    runCheck(lexical, records, portals),
    runCheck(domainBleed, records, portals),
    runCheck(pathCoherence, records, portals),
    runCheck(mooring, records, portals),
    runCheck(structure, records, portals),
    runCheck(density, records, portals),
    runCheck(closure, records, portals),
    runCheck(exceptions, records, portals),
  ];
}

// Output
if (flags.json) {
  console.log(JSON.stringify({ results, portals, fileCount: records.length }, null, 2));
} else {
  const date = new Date().toISOString().split('T')[0];
  console.log(format(results, {
    fileCount: records.length,
    portalCount: portals.length,
    date,
  }));
}

// Exit code: 0 = green/yellow, 1 = any red
const hasRed = results.some(r => r.status === 'RED');
process.exit(hasRed ? 1 : 0);

function runCheck(mod, records, portals) {
  // Checks that accept portals (domain-bleed, path-coherence)
  if (mod.check.length >= 2) {
    return mod.check(records, portals);
  }
  return mod.check(records);
}
