'use strict';

/**
 * Axis 8: Exception Pressure
 *
 * Regex scan for hedge terms. Per-file density: hedge_count / total_words.
 */

const HEDGE_TERMS = [
  'except', 'special case', 'for now', 'temporary', 'override',
  'unless', 'manual', 'workaround', 'hack', 'todo',
];

const HEDGE_REGEX = new RegExp(
  `\\b(${HEDGE_TERMS.map(t => t.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'gi'
);

function check(records) {
  const fileResults = [];
  let totalHedges = 0;
  let totalWords = 0;

  for (const record of records) {
    const matches = [];
    for (let i = 0; i < record.lines.length; i++) {
      const lineMatches = record.lines[i].match(HEDGE_REGEX);
      if (lineMatches) {
        for (const m of lineMatches) {
          matches.push({ line: i + 1, term: m.toLowerCase(), context: record.lines[i].trim() });
        }
      }
    }

    const density = record.wordCount > 0 ? matches.length / record.wordCount : 0;
    totalHedges += matches.length;
    totalWords += record.wordCount;

    if (matches.length > 0) {
      fileResults.push({
        file: record.rel,
        hedgeCount: matches.length,
        wordCount: record.wordCount,
        density,
        matches,
      });
    }
  }

  // Sort by density descending
  fileResults.sort((a, b) => b.density - a.density);

  const globalDensity = totalWords > 0 ? totalHedges / totalWords : 0;

  // Thresholds: <0.01 = GREEN, 0.01–0.03 = YELLOW, >0.03 = RED
  const status = globalDensity < 0.01 ? 'GREEN' : globalDensity < 0.03 ? 'YELLOW' : 'RED';

  const issues = fileResults
    .filter(f => f.density > 0.02)
    .map(f => ({
      severity: f.density > 0.05 ? 'error' : 'warning',
      file: f.file,
      message: `Hedge density ${f.density.toFixed(3)} (${f.hedgeCount} hedges / ${f.wordCount} words)`,
      matches: f.matches.slice(0, 5),
    }));

  return {
    axis: 8,
    name: 'Exception Pressure',
    score: globalDensity.toFixed(3),
    status,
    issues,
    details: fileResults,
    globalDensity,
    totalHedges,
  };
}

module.exports = { check };
