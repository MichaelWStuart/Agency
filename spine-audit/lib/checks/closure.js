'use strict';

const path = require('path');

/**
 * Axis 7: Ontology Closure (prescriptive)
 *
 * - Import saga-guard's extractor for the symbol table
 * - Scan doctrine for backtick-wrapped IDs, B-NNN refs, event codes
 * - Check each against symbol table. Near-miss detection via edit distance ≤2
 */

function check(records) {
  // Import saga-guard extractor
  const extractorPath = path.join(__dirname, '..', '..', '..', 'saga-guard', 'lib', 'extractor');
  let symbols;
  try {
    const { extract } = require(extractorPath);
    symbols = extract();
  } catch (e) {
    return {
      axis: 7,
      name: 'Ontology Closure',
      score: '?',
      status: 'YELLOW',
      issues: [{ severity: 'warning', file: '-', message: `Could not load saga-guard extractor: ${e.message}` }],
      unknown: 0,
    };
  }

  // Build known symbol set
  const known = new Set();
  for (const id of symbols.instruction_ids) known.add(id);
  for (const id of symbols.need_ids) known.add(id);
  for (const [src, evts] of Object.entries(symbols.events)) {
    for (const e of evts) known.add(e);
    // Also add prefixed forms
    for (const e of evts) known.add(`${src}.${e}`);
  }
  for (const src of symbols.log_sources) known.add(src);
  for (const s of symbols.strategies) known.add(s.toUpperCase());
  for (const s of symbols.statuses) known.add(s.toUpperCase());
  for (const s of symbols.severities) known.add(s.toUpperCase());
  for (const s of symbols.briefing_categories) known.add(s);
  for (const s of symbols.briefing_types) known.add(s.toUpperCase());
  // Roster bunk IDs
  for (const key of Object.keys(symbols.roster)) known.add(key);

  // Also add payload type names
  for (const t of Object.keys(symbols.payload_types)) known.add(t);

  // Scan for backtick-wrapped identifiers and B-NNN refs
  const unknowns = [];
  const checked = new Set();

  // Patterns to extract candidate symbols
  const backtickPattern = /`([A-Z][A-Z0-9_.]+)`/g;
  const bunkPattern = /\bB-(\d{3})\b/g;

  for (const record of records) {
    // Skip JSON files
    if (record.rel.endsWith('.json')) continue;

    for (let i = 0; i < record.lines.length; i++) {
      const line = record.lines[i];

      // Skip code blocks
      if (line.trim().startsWith('```')) continue;

      // Backtick-wrapped IDs
      let match;
      backtickPattern.lastIndex = 0;
      while ((match = backtickPattern.exec(line)) !== null) {
        const id = match[1];
        const key = `${record.rel}:${id}`;
        if (checked.has(key)) continue;
        checked.add(key);

        if (!known.has(id) && !isExempt(id)) {
          const nearest = findNearest(id, known);
          unknowns.push({
            file: record.rel,
            line: i + 1,
            symbol: id,
            nearest,
            context: line.trim().substring(0, 80),
          });
        }
      }

      // B-NNN refs
      bunkPattern.lastIndex = 0;
      while ((match = bunkPattern.exec(line)) !== null) {
        const bunk = `B-${match[1]}`;
        const key = `${record.rel}:${bunk}`;
        if (checked.has(key)) continue;
        checked.add(key);

        if (!known.has(bunk)) {
          unknowns.push({
            file: record.rel,
            line: i + 1,
            symbol: bunk,
            nearest: findNearest(bunk, known),
            context: line.trim().substring(0, 80),
          });
        }
      }
    }
  }

  const issues = unknowns.map(u => ({
    severity: 'error',
    file: u.file,
    line: u.line,
    message: `Unknown symbol \`${u.symbol}\`${u.nearest ? ` (nearest: \`${u.nearest}\`)` : ''}`,
  }));

  const status = unknowns.length === 0 ? 'GREEN' : unknowns.length <= 3 ? 'YELLOW' : 'RED';

  return {
    axis: 7,
    name: 'Ontology Closure',
    score: String(unknowns.length),
    status,
    issues,
    unknowns,
  };
}

/**
 * IDs that are structural/meta and not part of the symbol table.
 */
function isExempt(id) {
  // Spine concept markers like [AGENCY], [SUBMARINE], etc.
  // These are defined in the Spine table, not the symbol table
  const spineTerms = new Set([
    'AGENCY', 'SAGA', 'SUBMARINE', 'HQ', 'ADMIRAL', 'CAPTAIN',
    'DEPARTMENT', 'INTEGRATION', 'OPERATION', 'DIRECTOR',
    'MISSION_BRIEF', 'LAUNCH_BRIEF', 'RETURN', 'ESCALATION', 'BRIEFING',
    'DOSSIER', 'SIBLING', 'CIC', 'SUBORDINATE', 'MISSION', 'DIRECTIVE', 'AGENT',
    'MISSION_RETURN', 'INTEL_RETURN', 'INTEGRATION_RETURN',
  ]);
  if (spineTerms.has(id)) return true;

  // Stream events are per-identity, logged in stream tables, not in the catalog
  const streamEvents = new Set([
    'DIVE_START', 'DISPATCHING', 'RETURN_RECEIVED', 'DOCKING_START',
    'PR_CREATED', 'E2E_RUNNING', 'E2E_PASS', 'E2E_BLOCK', 'SURFACING',
    'FIELD_COLLECTING', 'FIELD_COMPLETE', 'DESK_ANALYZING', 'DESK_COMPLETE',
    'RECV_PROCESSING', 'PLOT_STARTED', 'STATION_WORKING', 'QC_RUNNING',
    'COMPILING', 'VALIDATING',
  ]);
  if (streamEvents.has(id)) return true;

  // Field names / type specifications in payload schemas
  if (/^[A-Z_]+$/.test(id) && id.length <= 20 && !id.includes('.')) {
    // Single uppercase words are likely field names or enum values
    // Only flag dotted IDs (instruction/event format)
    return true;
  }

  return false;
}

/**
 * Find nearest known symbol by edit distance ≤2.
 */
function findNearest(id, known) {
  let best = null;
  let bestDist = 3;
  for (const k of known) {
    const d = editDistance(id, k);
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  return best;
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    // Early exit if minimum in row > 2
    if (Math.min(...dp[i]) > 2) return 3;
  }
  return dp[m][n];
}

module.exports = { check };
