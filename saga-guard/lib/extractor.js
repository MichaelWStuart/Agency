'use strict';

const fs = require('fs');
const path = require('path');
const { computeHash, loadCache, writeCache } = require('./cache');

// Resolve agency root relative to this file
const AGENCY_ROOT = path.join(__dirname, '..', '..', 'agency');

// Source files in deterministic parse order
const SOURCE_FILES = [
  path.join(AGENCY_ROOT, 'contracts', 'catalog.md'),
  path.join(AGENCY_ROOT, 'contracts', 'payloads.md'),
  path.join(AGENCY_ROOT, 'shared', 'roster.json'),
  path.join(AGENCY_ROOT, 'afloat', 'intelligence', 'intelligence.md'),
  path.join(AGENCY_ROOT, 'afloat', 'integration', 'integration.md'),
  path.join(AGENCY_ROOT, 'SKILL.md'),
];

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract backtick-wrapped IDs from the first column of markdown tables.
 * Pattern: | `SOME.ID` | ... |
 */
function extractBacktickIdsFromTable(text, sectionHeader) {
  const ids = [];
  const lines = text.split('\n');
  let inSection = false;
  let pastHeader = false;

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (line.includes(sectionHeader)) {
        inSection = true;
        pastHeader = false;
        continue;
      } else if (inSection) {
        // Hit next section header — stop
        break;
      }
    }
    if (!inSection) continue;

    // Skip table header row and separator
    if (line.match(/^\|\s*-+/)) {
      pastHeader = true;
      continue;
    }
    if (!pastHeader && line.match(/^\|\s*ID\s*\|/i)) continue;
    if (!pastHeader && line.match(/^\|\s*NEED\s*\|/i)) continue;
    if (!pastHeader && line.match(/^\|\s*Event\s*\|/i)) continue;

    const match = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (match) {
      ids.push(match[1]);
    }
  }
  return ids;
}

/**
 * Extract event codes from a markdown table section.
 * Handles both backtick-wrapped and plain event codes.
 */
function extractEventCodes(text, sectionHeader) {
  const codes = [];
  const lines = text.split('\n');
  let inSection = false;
  let pastSeparator = false;

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (line.includes(sectionHeader)) {
        inSection = true;
        pastSeparator = false;
        continue;
      } else if (inSection) {
        break;
      }
    }
    if (!inSection) continue;

    if (line.match(/^\|\s*-+/)) {
      pastSeparator = true;
      continue;
    }
    if (!pastSeparator) continue;

    // Match: | `EVENT_CODE` | ... | or | EVENT_CODE | ... |
    const match = line.match(/^\|\s*`?([A-Z][A-Z0-9_.]+)`?\s*\|/);
    if (match) {
      codes.push(match[1]);
    }
  }
  return codes;
}

/**
 * Extract integration event codes from integration.md.
 * These use Dept | Event | Meaning format — need Dept.Event composite.
 */
function extractIntegEventCodes(text) {
  const codes = [];
  const lines = text.split('\n');
  let inSection = false;
  let pastSeparator = false;

  for (const line of lines) {
    if (line.startsWith('### ') && line.includes('Event Codes')) {
      inSection = true;
      pastSeparator = false;
      continue;
    }
    if (inSection && (line.startsWith('## ') || (line.startsWith('### ') && !line.includes('Event Codes')))) {
      break;
    }
    if (!inSection) continue;

    if (line.match(/^\|\s*-+/)) {
      pastSeparator = true;
      continue;
    }
    if (!pastSeparator) continue;

    // | RECV | RECEIVED | ... | -> RECV.RECEIVED
    const match = line.match(/^\|\s*([A-Z]+)\s*\|\s*([A-Z][A-Z0-9_.]+)\s*\|/);
    if (match) {
      codes.push(`${match[1]}.${match[2]}`);
    }
  }
  return codes;
}

/**
 * Parse payload schemas from payloads.md.
 * Extracts type name, header string, fields, and invariants.
 */
function extractPayloadSchemas(text) {
  const schemas = {};
  const lines = text.split('\n');
  let currentType = null;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let invariantLines = [];
  let readingInvariants = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect variant headers first: ### [LAUNCH_BRIEF] -> Integration
    // Must check before plain header match since plain regex is a subset
    const variantMatch = line.match(/^###\s+\[([A-Z_]+)\]\s*->\s*(\w+)/);
    if (variantMatch) {
      if (currentType) {
        finalizePayload(schemas, currentType, codeBlockLines, invariantLines);
      }
      currentType = `${variantMatch[1]}_${variantMatch[2].toUpperCase()}`;
      codeBlockLines = [];
      invariantLines = [];
      inCodeBlock = false;
      readingInvariants = false;
      continue;
    }

    // Detect payload section headers: ### [TYPE_NAME]
    const headerMatch = line.match(/^###\s+\[([A-Z_]+)\]/);
    if (headerMatch) {
      // Save previous payload if any
      if (currentType) {
        finalizePayload(schemas, currentType, codeBlockLines, invariantLines);
      }
      currentType = headerMatch[1];
      codeBlockLines = [];
      invariantLines = [];
      inCodeBlock = false;
      readingInvariants = false;
      continue;
    }

    if (!currentType) continue;

    // Track code blocks
    if (line.trim() === '```' || line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Track INVARIANTS block
    if (line.match(/^INVARIANTS:/)) {
      readingInvariants = true;
      continue;
    }
    if (readingInvariants) {
      if (line.match(/^\s+-\s/)) {
        invariantLines.push(line.trim().replace(/^-\s*/, ''));
      } else if (line.trim() === '' || line.startsWith('#') || line.startsWith('When') || line.startsWith('---')) {
        readingInvariants = false;
      }
    }

    // Stop at next ## section
    if (line.startsWith('## ') && !line.startsWith('## L')) {
      if (currentType) {
        finalizePayload(schemas, currentType, codeBlockLines, invariantLines);
        currentType = null;
      }
    }
  }

  // Finalize last
  if (currentType) {
    finalizePayload(schemas, currentType, codeBlockLines, invariantLines);
  }

  return schemas;
}

function finalizePayload(schemas, type, codeBlockLines, invariantLines) {
  if (codeBlockLines.length === 0) return;

  const header = codeBlockLines[0] ? codeBlockLines[0].trim() : '';
  const fields = {};
  const requiredFields = [];

  for (const line of codeBlockLines) {
    // Parse field lines: FIELD_NAME: {type_spec}
    const fieldMatch = line.match(/^([A-Z][A-Z_]+):\s*(.+)/);
    if (fieldMatch) {
      const fname = fieldMatch[1];
      const spec = fieldMatch[2].trim();
      fields[fname] = spec;
      // Fields without "| null" in spec are required
      if (!spec.includes('| null') && !spec.includes('| N/A')) {
        requiredFields.push(fname);
      }
    }
    // Nested fields under a parent (indented)
    const nestedMatch = line.match(/^\s{2,}([a-z_]+):\s*(.+)/);
    if (nestedMatch) {
      // Store as parent.child notation — informational
    }
  }

  schemas[type] = {
    header,
    fields,
    requiredFields,
    invariants: invariantLines.length > 0 ? invariantLines : [],
  };
}

/**
 * Parse roster.json into entity map.
 */
function extractRoster(rosterPath) {
  try {
    const raw = fs.readFileSync(rosterPath, 'utf8');
    const data = JSON.parse(raw);
    return data.entities || {};
  } catch (e) {
    return {};
  }
}

/**
 * Extract source codes from SKILL.md (line ~121 area).
 */
function extractSourceCodes(text) {
  // Look for the source codes pattern in the logging section
  const match = text.match(/Source codes?:\s*(.+)/i);
  if (match) {
    const backtickIds = match[1].match(/`([^`]+)`/g);
    if (backtickIds && backtickIds.length > 0) {
      return backtickIds.map(s => s.replace(/`/g, ''));
    }
  }
  // Fallback: known canonical set
  return ['AGENCY', 'INTEL', 'INTEG'];
}

// ---------------------------------------------------------------------------
// Main extraction
// ---------------------------------------------------------------------------

function extract() {
  const hash = computeHash(SOURCE_FILES);
  const cached = loadCache(hash);
  if (cached.hit) return cached.symbols;

  // Read all sources
  const catalogText = fs.readFileSync(SOURCE_FILES[0], 'utf8');
  const payloadsText = fs.readFileSync(SOURCE_FILES[1], 'utf8');
  const intelText = fs.readFileSync(SOURCE_FILES[3], 'utf8');
  const integText = fs.readFileSync(SOURCE_FILES[4], 'utf8');
  const skillText = fs.readFileSync(SOURCE_FILES[5], 'utf8');

  // 1. Instruction IDs from catalog.md
  const intelInstructions = extractBacktickIdsFromTable(catalogText, 'Intelligence Instructions');
  const agencyInstructions = extractBacktickIdsFromTable(catalogText, 'Agency Instructions');
  const integInstructions = extractBacktickIdsFromTable(catalogText, 'Integration Instructions');
  const instruction_ids = [...intelInstructions, ...agencyInstructions, ...integInstructions];

  // 2. NEED IDs from catalog.md
  const need_ids = extractBacktickIdsFromTable(catalogText, 'Escalation NEED Catalog');

  // 3. Event codes from catalog.md (canonical)
  const agencyEvents = extractEventCodes(catalogText, 'Agency Events');
  const intelEvents = extractEventCodes(catalogText, 'Intel Events');
  const integEvents = extractEventCodes(catalogText, 'Integ Events');

  // 4. Payload schemas
  const payload_types = extractPayloadSchemas(payloadsText);

  // 5. Source codes
  const log_sources = extractSourceCodes(skillText);

  // 6. Roster
  const roster = extractRoster(SOURCE_FILES[2]);

  // 7. Static enums (from payload definitions)
  const strategies = ['survey', 'calibrate'];
  const statuses = ['complete', 'partial', 'escalation'];
  const severities = ['routine', 'terminal'];
  const briefing_categories = ['SITUATIONAL', 'TRIAGE', 'INVESTIGATION', 'INTEGRATION', 'CALIBRATION', 'ESCALATION', 'DEBRIEF'];
  const briefing_types = ['progress', 'escalation', 'debrief'];
  const violation_codes = [
    'MISSING_FIELD', 'INVALID_ENUM', 'INVARIANT_VIOLATED',
    'UNKNOWN_INSTRUCTION', 'UNKNOWN_NEED', 'UNKNOWN_SOURCE',
    'UNKNOWN_EVENT', 'POINTER_MISSING', 'UNKNOWN_PAYLOAD',
    'MISSING_DELIMITER', 'HEADER_MISMATCH', 'LENGTH_EXCEEDED',
    'DRIFT_DETECTED',
  ];

  const symbols = {
    hash,
    generated: new Date().toISOString(),
    instruction_ids,
    need_ids,
    payload_types,
    log_sources,
    events: {
      AGENCY: agencyEvents,
      INTEL: intelEvents,
      INTEG: integEvents,
    },
    roster,
    strategies,
    statuses,
    severities,
    briefing_categories,
    briefing_types,
    violation_codes,
  };

  writeCache(symbols);
  return symbols;
}

// If run directly, extract and print summary
if (require.main === module) {
  const symbols = extract();
  console.log('Symbol extraction complete.');
  console.log(`  Instructions: ${symbols.instruction_ids.length}`);
  console.log(`  NEEDs: ${symbols.need_ids.length}`);
  console.log(`  Payload types: ${Object.keys(symbols.payload_types).length}`);
  console.log(`  Agency events: ${symbols.events.AGENCY.length}`);
  console.log(`  Intel events: ${symbols.events.INTEL.length}`);
  console.log(`  Integ events: ${symbols.events.INTEG.length}`);
  console.log(`  Roster entities: ${Object.keys(symbols.roster).length}`);
  console.log(`  Hash: ${symbols.hash.substring(0, 16)}...`);
}

module.exports = { extract, SOURCE_FILES };
