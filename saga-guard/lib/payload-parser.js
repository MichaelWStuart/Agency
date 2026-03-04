'use strict';

const DELIMITER_START = '<<<SAGA_PAYLOAD>>>';
const DELIMITER_END = '<<<END_SAGA_PAYLOAD>>>';

/**
 * Known payload headers mapped to type IDs.
 * Used for fallback detection when delimiters are missing.
 */
const HEADER_MAP = {
  'MISSION BRIEF': 'MISSION_BRIEF',
  'MISSION RETURN': 'MISSION_RETURN',
  'LAUNCH BRIEF: INTELLIGENCE': 'LAUNCH_BRIEF_INTELLIGENCE',
  'LAUNCH BRIEF: INTEGRATION': 'LAUNCH_BRIEF_INTEGRATION',
  'INTEL RETURN': 'INTEL_RETURN',
  'INTEGRATION RETURN': 'INTEGRATION_RETURN',
  'ESCALATION': 'ESCALATION',
  'FIELD BRIEF': 'FIELD_BRIEF',
  'FIELD RETURN': 'FIELD_RETURN',
  'DESK BRIEF': 'DESK_BRIEF',
  'DESK RETURN': 'DESK_RETURN',
  'COMPILE BRIEF': 'COMPILE_BRIEF',
  'COMPILE RETURN': 'COMPILE_RETURN',
  'VALIDATION BRIEF': 'VALIDATION_BRIEF',
  'VALIDATION RETURN': 'VALIDATION_RETURN',
  'GUARD VIOLATION': 'GUARD_VIOLATION',
  'BRIEFING': 'BRIEFING',
};

/**
 * Extract payload block from text using delimiters.
 * Returns { block, usedDelimiters } or null if no payload found.
 */
function extractBlock(text) {
  if (!text) return null;

  // Try delimiter extraction first
  const startIdx = text.indexOf(DELIMITER_START);
  if (startIdx !== -1) {
    const contentStart = startIdx + DELIMITER_START.length;
    const endIdx = text.indexOf(DELIMITER_END, contentStart);
    if (endIdx !== -1) {
      return {
        block: text.substring(contentStart, endIdx).trim(),
        usedDelimiters: true,
      };
    }
  }

  // Fallback: scan for known payload header strings
  for (const header of Object.keys(HEADER_MAP)) {
    const idx = text.indexOf(header);
    if (idx !== -1) {
      // Found a header — extract from here to end of payload
      // Look for the box-drawing separator line
      const fromHeader = text.substring(idx);
      const block = extractToEnd(fromHeader);
      if (block) {
        return { block, usedDelimiters: false };
      }
    }
  }

  return null;
}

/**
 * Extract from a payload header to end of the structured block.
 * Ends at empty line followed by non-payload content, or end of text.
 */
function extractToEnd(text) {
  const lines = text.split('\n');
  const result = [];
  let foundSeparator = false;

  for (const line of lines) {
    // Box-drawing separator (unicode)
    if (line.match(/^[\u2500\u2501\u2502\u2503\u250c\u2510\u2514\u2518\u251c\u2524\u252c\u2534\u253c\u2550-\u256c]+$/)) {
      foundSeparator = true;
      result.push(line);
      continue;
    }
    // Dashes as separator
    if (line.match(/^-{3,}$/) && result.length <= 2) {
      foundSeparator = true;
      result.push(line);
      continue;
    }

    result.push(line);
  }

  return result.join('\n').trim();
}

/**
 * Detect payload type from a block by matching the first non-empty line
 * against known headers.
 */
function detectType(block) {
  if (!block) return null;
  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip separator lines
    if (trimmed.match(/^[\u2500\u2501]+$/)) continue;

    // Check against known headers (longest match first)
    const sortedHeaders = Object.keys(HEADER_MAP).sort((a, b) => b.length - a.length);
    for (const header of sortedHeaders) {
      if (trimmed === header || trimmed.startsWith(header)) {
        return HEADER_MAP[header];
      }
    }
    // First real line didn't match
    return null;
  }
  return null;
}

/**
 * Parse fields from a payload block.
 * Returns { fieldName: value } map.
 */
function parseFields(block) {
  if (!block) return {};

  const fields = {};
  const lines = block.split('\n');
  let currentField = null;
  let currentList = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip header line, separator lines, empty lines
    if (!trimmed) continue;
    if (trimmed.match(/^[\u2500\u2501]+$/)) continue;
    if (trimmed.match(/^-{3,}$/)) continue;
    // Skip the payload type header (all caps words, no colon unless it's a field)
    if (Object.keys(HEADER_MAP).some(h => trimmed === h || trimmed.startsWith(h + '\n'))) continue;

    // Skip directive lines
    if (trimmed.startsWith('Load ') || trimmed.startsWith('Identity:') || trimmed.startsWith('Protocol:') || trimmed.startsWith('Templates:')) continue;
    // Skip comment lines
    if (trimmed.startsWith('#')) continue;

    // Top-level field: FIELD_NAME: value
    const fieldMatch = line.match(/^([A-Z][A-Z_]+(?:\s[A-Z_]+)*):\s*(.*)/);
    if (fieldMatch) {
      currentField = fieldMatch[1].replace(/\s+/g, '_');
      const val = fieldMatch[2].trim();
      if (val) {
        fields[currentField] = val;
      }
      currentList = null;
      continue;
    }

    // Nested field (indented): key: value
    const nestedMatch = line.match(/^\s{2,}([a-z_]+):\s*(.*)/);
    if (nestedMatch && currentField) {
      if (typeof fields[currentField] !== 'object' || Array.isArray(fields[currentField])) {
        fields[currentField] = {};
      }
      fields[currentField][nestedMatch[1]] = nestedMatch[2].trim();
      continue;
    }

    // List item: - value
    const listMatch = line.match(/^\s*-\s+(.*)/);
    if (listMatch && currentField) {
      if (!Array.isArray(fields[currentField])) {
        fields[currentField] = [];
      }
      fields[currentField].push(listMatch[1].trim());
      continue;
    }
  }

  return fields;
}

module.exports = { extractBlock, detectType, parseFields, HEADER_MAP, DELIMITER_START, DELIMITER_END };
