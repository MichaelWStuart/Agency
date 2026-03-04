'use strict';

/**
 * Format a GUARD_VIOLATION payload for stderr output.
 */
function formatViolation(level, phase, payloadType, violations) {
  const action = level === 1 ? 'correct_and_redispatch' : 'review_warning';
  const lines = [
    'GUARD VIOLATION',
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
    `LEVEL: ${level}`,
    `PHASE: ${phase}`,
    `PAYLOAD_TYPE: ${payloadType}`,
    'VIOLATIONS:',
  ];

  for (const v of violations) {
    lines.push(`  - CODE: ${v.code}`);
    lines.push(`    FIELD: ${v.field || 'null'}`);
    lines.push(`    EXPECTED: ${(v.expected || '').substring(0, 100)}`);
    lines.push(`    ACTUAL: ${(v.actual || '').substring(0, 100)}`);
  }

  lines.push(`ACTION: ${action}`);
  return lines.join('\n');
}

/**
 * Create a violation entry.
 */
function violation(code, field, expected, actual) {
  return { code, field: field || null, expected: expected || '', actual: actual || '' };
}

module.exports = { formatViolation, violation };
