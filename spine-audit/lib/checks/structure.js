'use strict';

/**
 * Axis 5: Structural Congruence (prescriptive)
 *
 * Rules:
 * - shore/   = shore command only (naval + military dominant)
 * - afloat/  = operational only (naval + military + department-specific)
 * - shared/  = domain-neutral (low metaphor density)
 * - contracts/ = schema-heavy (schema domain dominant)
 * - cic/     = infrastructure (software + schema dominant)
 *
 * Check actual domain distribution vs directory expectation.
 */

const RULES = {
  'shore': {
    description: 'Shore command — naval/military dominant',
    expected: ['naval', 'military'],
    forbidden: ['refinery'],
  },
  'afloat/captain.md': {
    description: 'Submarine CO — naval/military dominant',
    expected: ['naval', 'military'],
    forbidden: [],
  },
  'afloat/intelligence': {
    description: 'Intelligence department — naval/military/surveying',
    expected: ['naval', 'military', 'surveying'],
    forbidden: ['refinery'],
  },
  'afloat/integration': {
    description: 'Integration department — refinery metaphor expected',
    expected: ['refinery'],
    forbidden: [],
  },
  'shared': {
    description: 'Shared resources — parent frame allowed',
    expected: ['naval', 'military'],
    forbidden: ['refinery'],
  },
  'contracts': {
    description: 'Contracts — schema dominant',
    expected: ['schema'],
    forbidden: [],
  },
  'cic': {
    description: 'Infrastructure — software/schema',
    expected: ['software', 'schema'],
    forbidden: ['refinery'],
  },
};

function check(records) {
  const issues = [];
  let misplaced = 0;

  for (const record of records) {
    const rel = record.rel;
    const rule = findRule(rel);
    if (!rule) continue;

    const domains = record.domains;
    const total = Object.values(domains).reduce((s, c) => s + c, 0);
    if (total === 0) continue;

    // Check forbidden domains
    if (rule.forbidden) {
      for (const forbidden of rule.forbidden) {
        const count = domains[forbidden] || 0;
        const ratio = count / total;
        if (ratio > 0.15) {
          misplaced++;
          issues.push({
            severity: 'error',
            file: rel,
            message: `Forbidden domain "${forbidden}" at ${(ratio * 100).toFixed(0)}% in ${rule.description}`,
          });
        }
      }
    }

    // Check max metaphor density for neutral zones
    if (rule.maxMetaphor !== undefined) {
      const metaphor = (domains.naval || 0) + (domains.military || 0)
        + (domains.refinery || 0) + (domains.surveying || 0);
      const metaphorRatio = metaphor / total;
      if (metaphorRatio > rule.maxMetaphor) {
        misplaced++;
        issues.push({
          severity: 'error',
          file: rel,
          message: `Metaphor density ${(metaphorRatio * 100).toFixed(0)}% exceeds ${(rule.maxMetaphor * 100).toFixed(0)}% max for ${rule.description}`,
        });
      }
    }
  }

  const status = misplaced === 0 ? 'GREEN' : misplaced <= 2 ? 'YELLOW' : 'RED';

  return {
    axis: 5,
    name: 'Structural Congruence',
    score: String(misplaced),
    status,
    issues,
    misplaced,
  };
}

function findRule(rel) {
  // Most specific match first
  for (const [prefix, rule] of Object.entries(RULES)) {
    if (rel === prefix || rel.startsWith(prefix + '/') || rel.startsWith(prefix)) {
      return rule;
    }
  }
  return null;
}

module.exports = { check };
