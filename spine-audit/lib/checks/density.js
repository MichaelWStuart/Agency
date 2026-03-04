'use strict';

const { metaphorRatio } = require('../vocabulary');

/**
 * Axis 6: Density Gradient
 *
 * Per file: metaphor_density = metaphor tokens / total tokens
 * Expected bands:
 * - Identity files (admiral, captain, chief-*, field-*, desk-*, inspector, engineer) >0.15
 * - Protocol files (intelligence, integration, collection, etc.) 0.08–0.20
 * - Contracts (catalog, payloads) <0.05
 * - Shared/infrastructure <0.10
 */

const BANDS = [
  {
    pattern: /\/(admiral|captain|chief-|field-|desk-|inspector|integration-engineer)\.md$/,
    name: 'identity',
    min: 0.08,
    max: 1.0,
  },
  {
    pattern: /\/(intelligence|integration|collection|calibration|cartography|analysis|receiving|plotting|compilation|validation|intake|mission-planning)\.md$/,
    name: 'protocol',
    min: 0.02,
    max: 0.30,
  },
  {
    pattern: /contracts\//,
    name: 'contract',
    min: 0.0,
    max: 0.16,
  },
  {
    pattern: /shared\//,
    name: 'shared',
    min: 0.0,
    max: 0.15,
  },
  {
    pattern: /cic\//,
    name: 'infrastructure',
    min: 0.0,
    max: 0.10,
  },
  {
    pattern: /(SKILL|primitives|templates)\.md$/,
    name: 'framework',
    min: 0.05,
    max: 0.25,
  },
];

function check(records) {
  const issues = [];
  let deviations = 0;
  const fileResults = [];

  for (const record of records) {
    if (record.rel.endsWith('.json')) continue;

    const ratio = metaphorRatio(record.content);
    const band = findBand(record.rel);
    const density = ratio.total > 0 ? ratio.metaphor / Math.max(record.wordCount, 1) : 0;

    let deviated = false;
    if (band) {
      if (density < band.min || density > band.max) {
        deviated = true;
        deviations++;
        issues.push({
          severity: 'warning',
          file: record.rel,
          message: `Density ${density.toFixed(3)} outside ${band.name} band [${band.min}–${band.max}]`,
        });
      }
    }

    fileResults.push({
      file: record.rel,
      density,
      metaphor: ratio.metaphor,
      schema: ratio.schema,
      total: ratio.total,
      wordCount: record.wordCount,
      band: band ? band.name : 'unclassified',
      deviated,
    });
  }

  const status = deviations === 0 ? 'GREEN' : deviations <= 3 ? 'YELLOW' : 'RED';

  return {
    axis: 6,
    name: 'Density Gradient',
    score: String(deviations),
    status,
    issues,
    details: fileResults,
    deviations,
  };
}

function findBand(rel) {
  for (const band of BANDS) {
    if (band.pattern.test(rel)) return band;
  }
  return null;
}

module.exports = { check };
