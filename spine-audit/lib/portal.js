'use strict';

const { classify, tokenize } = require('./vocabulary');

/**
 * Portal Declaration Parser + Tethering Scorer
 *
 * Format: Portal: naval -> refinery | [tether narrative in parent-frame terms]
 * Regex: /^Portal:\s*(\w+)\s*->\s*(\w+)\s*\|\s*(.+)$/m
 */

const PORTAL_REGEX = /^Portal:\s*(\w+)\s*->\s*(\w+)\s*\|\s*(.+)$/gm;

/**
 * Parse portal declarations from all records.
 */
function parsePortals(records) {
  const portals = [];

  for (const record of records) {
    let match;
    PORTAL_REGEX.lastIndex = 0;
    const content = record.content;

    while ((match = PORTAL_REGEX.exec(content)) !== null) {
      const from = match[1].toLowerCase();
      const to = match[2].toLowerCase();
      const tether = match[3].trim();

      // Derive scope from file's directory
      const parts = record.rel.split('/');
      const scope = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

      portals.push({
        from,
        to,
        tether,
        file: record.rel,
        scope,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  return portals;
}

/**
 * Score a portal's tethering.
 *
 * tethering = (parent_terms_in_tether / total_tether_tokens) * min(child_unique_terms, 10) / 10
 * Range 0.0 to 1.0.
 */
function scoreTethering(portal, records) {
  const parentDomain = portal.from;
  const childDomain = portal.to;

  // Score tether narrative by parent-domain term density
  const tetherCounts = classify(portal.tether);
  const tetherTokens = tokenize(portal.tether);
  const parentTermsInTether = tetherCounts[parentDomain] || 0;
  const tetherDensity = tetherTokens.length > 0 ? parentTermsInTether / tetherTokens.length : 0;

  // Count unique child-domain terms in scope
  const childTerms = new Set();
  for (const record of records) {
    if (portal.scope && !record.rel.startsWith(portal.scope)) continue;
    const counts = classify(record.content);
    if (counts[childDomain]) {
      // Count unique terms
      const { loadVocab, escapeRegex } = require('./vocabulary');
      const vocab = loadVocab();
      const terms = vocab[childDomain] || [];
      for (const term of terms) {
        const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
        if (regex.test(record.content)) {
          childTerms.add(term.toLowerCase());
        }
      }
    }
  }

  const childComplexity = Math.min(childTerms.size, 10) / 10;
  const tethering = tetherDensity * childComplexity;

  return {
    tethering: Math.min(tethering, 1.0),
    tetherDensity,
    childUniqueTerms: childTerms.size,
    childComplexity,
    status: tethering >= 0.6 ? 'well-tethered' : tethering >= 0.3 ? 'weak' : 'untethered',
  };
}

/**
 * Check all portals: parse, score, validate.
 */
function check(records) {
  const portals = parsePortals(records);
  const results = [];
  const issues = [];

  for (const portal of portals) {
    const score = scoreTethering(portal, records);
    results.push({ ...portal, ...score });

    if (score.status === 'untethered') {
      issues.push({
        severity: 'error',
        file: portal.file,
        line: portal.line,
        message: `Portal ${portal.from}->${portal.to} untethered (${score.tethering.toFixed(2)})`,
      });
    } else if (score.status === 'weak') {
      issues.push({
        severity: 'warning',
        file: portal.file,
        line: portal.line,
        message: `Portal ${portal.from}->${portal.to} weakly tethered (${score.tethering.toFixed(2)})`,
      });
    }

    // Validate child complexity threshold
    if (score.childUniqueTerms < 10) {
      issues.push({
        severity: 'warning',
        file: portal.file,
        line: portal.line,
        message: `Portal ${portal.from}->${portal.to} child domain has only ${score.childUniqueTerms} unique terms (minimum 10)`,
      });
    }
  }

  return { portals: results, issues };
}

module.exports = { parsePortals, scoreTethering, check };
