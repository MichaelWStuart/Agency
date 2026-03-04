'use strict';

const { violation } = require('./violations');

// Log file path patterns
const LOG_FILE_PATTERNS = [
  /agency-workspace\/log\.md$/,
  /agency-workspace\/streams\/[^/]+\.md$/,
  /memory\/events\/[^/]+\.md$/,
  /jobs\/log\.md$/,
];

/**
 * Check if a file path is a log file.
 */
function isLogFile(filePath) {
  if (!filePath) return false;
  return LOG_FILE_PATTERNS.some(p => p.test(filePath));
}

/**
 * Detect if a file path is a stream log (3-column) vs agency/integration log (4-column).
 */
function isStreamLog(filePath) {
  return /agency-workspace\/streams\//.test(filePath);
}

/**
 * Validate EVENT_RECORD entries in content.
 * Returns { level1: [...], level2: [...] } violation arrays.
 */
function validateLog(content, filePath, symbols) {
  const level1 = [];
  const level2 = [];

  if (!content) return { level1, level2 };

  const lines = content.split('\n');
  const isStream = isStreamLog(filePath);
  const expectedCols = isStream ? 3 : 4;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headers (#), and separator rows (| --- |)
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.match(/^\|\s*-+/)) continue;

    // Skip known header rows
    if (line.match(/^\|\s*Time\s*\|/i)) {
      // Validate header format
      validateHeader(line, isStream, level1);
      continue;
    }

    // Parse table rows
    if (!line.startsWith('|')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length === 0) continue;

    // Column count check
    if (cells.length !== expectedCols) {
      level1.push(violation(
        'HEADER_MISMATCH',
        `line ${i + 1}`,
        `${expectedCols} columns`,
        `${cells.length} columns`
      ));
      continue;
    }

    if (isStream) {
      validateStreamRow(cells, i + 1, symbols, level1, level2);
    } else {
      validate4ColRow(cells, i + 1, symbols, level1, level2);
    }
  }

  return { level1, level2 };
}

/**
 * Validate header row format.
 */
function validateHeader(line, isStream, violations) {
  if (isStream) {
    if (!line.match(/^\|\s*Time\s*\|\s*Event\s*\|\s*Detail\s*\|$/i)) {
      violations.push(violation(
        'HEADER_MISMATCH',
        'header',
        '| Time | Event | Detail |',
        line
      ));
    }
  } else {
    if (!line.match(/^\|\s*Time\s*\|\s*Source\s*\|\s*Event\s*\|\s*Detail\s*\|$/i)) {
      violations.push(violation(
        'HEADER_MISMATCH',
        'header',
        '| Time | Source | Event | Detail |',
        line
      ));
    }
  }
}

/**
 * Validate a 4-column log row: Time | Source | Event | Detail
 */
function validate4ColRow(cells, lineNum, symbols, level1, level2) {
  const [time, source, event, detail] = cells;

  // Time: valid ISO-8601
  if (!isValidISO(time)) {
    level2.push(violation('INVALID_ENUM', `line ${lineNum} Time`, 'ISO-8601 UTC', time));
  }

  // Source: in log_sources
  if (!symbols.log_sources.includes(source)) {
    level1.push(violation('UNKNOWN_SOURCE', `line ${lineNum} Source`, `one of ${symbols.log_sources.join(', ')}`, source));
  }

  // Event: in events[source] (or any event namespace for flexibility)
  if (source && symbols.events[source]) {
    if (!symbols.events[source].includes(event)) {
      level1.push(violation('UNKNOWN_EVENT', `line ${lineNum} Event`, `valid ${source} event`, event));
    }
  }

  // Detail: <=100 chars
  if (detail && detail.length > 100) {
    level2.push(violation('LENGTH_EXCEEDED', `line ${lineNum} Detail`, '<=100 chars', `${detail.length} chars`));
  }
}

/**
 * Validate a 3-column stream row: Time | Event | Detail
 */
function validateStreamRow(cells, lineNum, symbols, level1, level2) {
  const [time, event, detail] = cells;

  // Time: valid ISO-8601
  if (!isValidISO(time)) {
    level2.push(violation('INVALID_ENUM', `line ${lineNum} Time`, 'ISO-8601 UTC', time));
  }

  // Event: we can't validate stream events against a fixed catalog
  // since each identity defines its own. Level 2 drift detection only.

  // Detail: <=100 chars
  if (detail && detail.length > 100) {
    level2.push(violation('LENGTH_EXCEEDED', `line ${lineNum} Detail`, '<=100 chars', `${detail.length} chars`));
  }
}

/**
 * Basic ISO-8601 check.
 */
function isValidISO(str) {
  if (!str) return false;
  // Accept common ISO formats: 2026-02-28T10:15:00Z, 2026-02-28T10:15:00.000Z
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(str);
}

module.exports = { validateLog, isLogFile, isStreamLog };
