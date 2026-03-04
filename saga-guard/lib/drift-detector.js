'use strict';

const { violation } = require('./violations');

// Patterns for ID-shaped tokens
const PATTERNS = {
  instruction: /\b[A-Z]{2,}(?:\.[A-Z_]+)+\b/g,   // DOT.SEPARATED (e.g., INTEL.COLLECT.SCOPE)
  need: /\b[A-Z]{2,}_[A-Z_]+\b/g,                 // SNAKE_CASE (e.g., SCOPE_DATA)
  bunk: /\bB-\d{3}\b/g,                            // Bunk IDs (e.g., B-001)
};

// Tokens to exclude from drift detection (common structural words)
const SKIP_TOKENS = new Set([
  'ISO', 'UTC', 'SAGA_PAYLOAD', 'END_SAGA_PAYLOAD',
  'RETURN_CONTRACT', 'PROJECT_CONTEXT', 'ARTIFACT_POINTERS',
  'SURFACE_URLS', 'MISSION_CONTEXT', 'EVIDENCE_OUTPUT',
  'SCOPE_DOC', 'BROWSER_TOOL', 'SURFACE_CONTEXT',
  'DOSSIER_POINTERS', 'CHART_POINTER', 'ARTIFACT_OUTPUT',
  'DELIVERABLES_COMPLETED', 'LAST_COMMIT', 'VALIDATION_REPORT',
  'NOTES', 'STATUS', 'STRATEGY', 'SEVERITY', 'NEED',
  'DOCKING_READY', 'PLOT_COMPLETED', 'PLOT_REMAINING',
  'RETURN', 'TRUE', 'FALSE', 'NULL', 'PRESENT',
  // Payload field names and constants
  'GUARD_VIOLATION', 'EVENT_RECORD', 'MISSION_BRIEF',
  'MISSION_RETURN', 'LAUNCH_BRIEF', 'INTEL_RETURN',
  'INTEGRATION_RETURN', 'ESCALATION', 'FIELD_BRIEF',
  'FIELD_RETURN', 'DESK_BRIEF', 'DESK_RETURN',
  'COMPILE_BRIEF', 'COMPILE_RETURN', 'VALIDATION_BRIEF',
  'VALIDATION_RETURN', 'BRIEFING',
]);

/**
 * Build a unified symbol set from extracted symbols for fast lookup.
 */
function buildLookup(symbols) {
  const known = new Set();

  // Instruction IDs
  for (const id of symbols.instruction_ids) known.add(id);

  // NEED IDs
  for (const id of symbols.need_ids) known.add(id);

  // Event codes (with source prefix for dot-separated)
  for (const [source, events] of Object.entries(symbols.events)) {
    for (const evt of events) known.add(evt);
    // Also add source.event form
    for (const evt of events) known.add(`${source}.${evt}`);
  }

  // Bunk IDs
  for (const bunkId of Object.keys(symbols.roster)) known.add(bunkId);

  // Callsigns (not ID-shaped, but useful)
  for (const entity of Object.values(symbols.roster)) {
    if (entity.callsign) known.add(entity.callsign);
  }

  // Violation codes
  for (const code of symbols.violation_codes) known.add(code);

  return known;
}

/**
 * Scan structured fields for unknown ID-shaped tokens.
 * Returns array of DRIFT_DETECTED violations.
 */
function detectDrift(fields, symbols) {
  const known = buildLookup(symbols);
  const violations = [];

  for (const [fieldName, value] of Object.entries(fields)) {
    const text = typeof value === 'string' ? value :
                 Array.isArray(value) ? value.join(' ') :
                 JSON.stringify(value);

    // Check each pattern
    for (const [patternName, regex] of Object.entries(PATTERNS)) {
      const re = new RegExp(regex.source, regex.flags);
      let match;
      while ((match = re.exec(text)) !== null) {
        const token = match[0];
        if (SKIP_TOKENS.has(token)) continue;
        if (known.has(token)) continue;

        violations.push(violation(
          'DRIFT_DETECTED',
          fieldName,
          `known ${patternName}-shaped token`,
          token
        ));
      }
    }
  }

  return violations;
}

module.exports = { detectDrift, buildLookup };
