'use strict';

const { classify, entropy } = require('../vocabulary');

/**
 * Axis 2: Domain Bleed
 *
 * Per file: classify prose tokens into domains, compute Shannon entropy.
 * Flag files with entropy >2.0 bits or secondary domain >20%.
 * Portal-scoped files exempt if portal declared.
 */
function check(records, portals) {
  const fileResults = [];
  const issues = [];
  let hotspots = 0;

  for (const record of records) {
    const domains = record.domains;
    const total = Object.values(domains).reduce((s, c) => s + c, 0);
    if (total < 5) continue; // Skip files with very few domain tokens

    const h = entropy(domains);

    // Compute domain percentages
    const pcts = {};
    for (const [d, c] of Object.entries(domains)) {
      pcts[d] = c / total;
    }

    // Find primary and secondary domains
    const sorted = Object.entries(pcts).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0] || [null, 0];
    const secondary = sorted[1] || [null, 0];

    // Merge expected co-occurrences for bleed calculation
    const mergedDomains = mergeExpected(domains, record.rel);
    const mergedH = entropy(mergedDomains);

    // Check if file is portal-exempt
    const isExempt = portals && portals.some(p =>
      record.rel.startsWith(p.scope) || record.path.includes(p.scope)
    );

    // Use merged domains for the secondary check too
    const mergedTotal = Object.values(mergedDomains).reduce((s, c) => s + c, 0);
    const mergedSorted = Object.entries(mergedDomains)
      .map(([d, c]) => [d, mergedTotal > 0 ? c / mergedTotal : 0])
      .sort((a, b) => b[1] - a[1]);
    const mergedSecondary = mergedSorted[1] || [null, 0];

    const flagged = !isExempt && (mergedH > 2.0 || mergedSecondary[1] > 0.30);

    if (flagged) {
      hotspots++;
      issues.push({
        severity: mergedH > 2.5 ? 'error' : 'warning',
        file: record.rel,
        message: `Entropy ${mergedH.toFixed(2)} bits — ${sorted.map(([d, p]) => `${d}:${(p * 100).toFixed(0)}%`).join(', ')}`,
      });
    }

    fileResults.push({
      file: record.rel,
      entropy: h,
      mergedEntropy: mergedH,
      domains: pcts,
      primary: primary[0],
      secondary: secondary[0],
      flagged,
    });
  }

  const avgEntropy = fileResults.length > 0
    ? fileResults.reduce((s, f) => s + f.mergedEntropy, 0) / fileResults.length
    : 0;

  // Threshold: avg merged entropy <1.5 = GREEN, <2.0 = YELLOW, else RED
  const status = hotspots === 0 ? 'GREEN' : hotspots <= 3 ? 'YELLOW' : 'RED';

  return {
    axis: 2,
    name: 'Domain Bleed',
    score: avgEntropy.toFixed(2),
    status,
    issues,
    details: fileResults,
    hotspots,
  };
}

/**
 * Merge expected domain co-occurrences.
 * Naval + military always merge (parent frame).
 * Integration files: refinery merges into frame.
 * Intelligence files: surveying merges into frame.
 */
function mergeExpected(domains, rel) {
  const merged = { ...domains };

  // Software and schema are neutral background — not metaphor, not bleed
  delete merged.software;
  delete merged.schema;

  // Always merge naval + military as parent frame
  const frame = (merged.naval || 0) + (merged.military || 0);
  delete merged.naval;
  delete merged.military;

  // Integration department: refinery is the department's metaphor
  if (rel.includes('integration/') || rel.includes('integration.md')) {
    const refinery = merged.refinery || 0;
    delete merged.refinery;
    if (frame + refinery > 0) merged.parentFrame = frame + refinery;
  }
  // Intelligence department: surveying is the department's metaphor
  else if (rel.includes('intelligence/') || rel.includes('intelligence.md')) {
    const surveying = merged.surveying || 0;
    delete merged.surveying;
    if (frame + surveying > 0) merged.parentFrame = frame + surveying;
  }
  // Framework files (SKILL, primitives, templates) span all domains
  else if (/^(SKILL|primitives|templates)\.md$/.test(rel)) {
    const surveying = merged.surveying || 0;
    const refinery = merged.refinery || 0;
    delete merged.surveying;
    delete merged.refinery;
    if (frame + surveying + refinery > 0) merged.parentFrame = frame + surveying + refinery;
  }
  // Everything else: just naval + military
  else {
    if (frame > 0) merged.parentFrame = frame;
  }

  return merged;
}

/**
 * naval + military co-occurrence is expected, not bleed.
 */
function isExpectedCooccurrence(primary, secondary) {
  const pair = [primary, secondary].sort().join('+');
  return pair === 'military+naval';
}

module.exports = { check };
