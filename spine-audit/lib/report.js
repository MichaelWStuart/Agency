'use strict';

/**
 * Compact CLI report formatter.
 * Same style as .data/query.js — aligned columns, minimal output.
 */

const AXIS_NAMES = [
  '1. Lexical Cohesion',
  '2. Domain Bleed',
  '3. Path Coherence',
  '4. Mooring Integrity',
  '5. Structural Congruence',
  '6. Density Gradient',
  '7. Ontology Closure',
  '8. Exception Pressure',
];

function format(results, { fileCount, portalCount, date }) {
  const lines = [];

  lines.push(`SPINE AUDIT \u2014 ${date}`);
  lines.push('\u2550'.repeat(40));
  lines.push('');
  lines.push(`FILES: ${fileCount} | PORTALS: ${portalCount}`);
  lines.push('');

  // Summary table
  lines.push(`${'AXIS'.padEnd(28)} ${'SCORE'.padEnd(9)} STATUS`);
  lines.push('\u2500'.repeat(50));

  for (const r of results) {
    const name = AXIS_NAMES[r.axis - 1] || `${r.axis}. Unknown`;
    const scoreStr = String(r.score).padEnd(9);
    const statusStr = colorStatus(r.status);
    lines.push(`${name.padEnd(28)} ${scoreStr} ${statusStr}`);
  }

  lines.push('\u2500'.repeat(50));

  // Overall
  const hasRed = results.some(r => r.status === 'RED');
  const hasYellow = results.some(r => r.status === 'YELLOW');
  const overall = hasRed ? 'CRITICAL' : hasYellow ? 'CAUTION' : 'HEALTHY';
  lines.push(`OVERALL: ${colorOverall(overall)}`);

  // Detail sections for non-green axes
  const nonGreen = results.filter(r => r.status !== 'GREEN');
  if (nonGreen.length > 0) {
    lines.push('');
    for (const r of nonGreen) {
      const name = AXIS_NAMES[r.axis - 1] || `Axis ${r.axis}`;
      lines.push(`\n\u2550\u2550 ${name} \u2550\u2550`);
      for (const issue of (r.issues || []).slice(0, 10)) {
        const sev = issue.severity === 'error' ? '\x1b[31mERR\x1b[0m'
          : issue.severity === 'warning' ? '\x1b[33mWRN\x1b[0m'
          : '\x1b[36mINF\x1b[0m';
        const loc = issue.file + (issue.line ? `:${issue.line}` : '');
        lines.push(`  ${sev} ${loc.padEnd(40)} ${issue.message}`);
      }
      const remaining = (r.issues || []).length - 10;
      if (remaining > 0) {
        lines.push(`  ... and ${remaining} more`);
      }
    }
  }

  return lines.join('\n');
}

function colorStatus(status) {
  switch (status) {
    case 'GREEN': return '\x1b[32mGREEN\x1b[0m';
    case 'YELLOW': return '\x1b[33mYELLOW\x1b[0m';
    case 'RED': return '\x1b[31mRED\x1b[0m';
    default: return status;
  }
}

function colorOverall(overall) {
  switch (overall) {
    case 'HEALTHY': return '\x1b[32mHEALTHY\x1b[0m';
    case 'CAUTION': return '\x1b[33mCAUTION\x1b[0m';
    case 'CRITICAL': return '\x1b[31mCRITICAL\x1b[0m';
    default: return overall;
  }
}

module.exports = { format };
