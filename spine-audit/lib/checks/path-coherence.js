'use strict';

const { classify } = require('../vocabulary');

/**
 * Axis 3: Path Coherence (killer feature)
 *
 * - Extract instruction IDs from catalog.md as graph nodes
 * - Build edges from Captain routing sequences
 * - Classify each edge: stable (same domain), acceptable (through portal), resistant (undeclared shift)
 */

// Captain routing sequences (from captain.md Instruction Selection)
const ROUTING_SEQUENCES = {
  survey: [
    'INTEL.COLLECT.REFERENCE',
    'INTEL.ANALYZE.REFERENCE',
    'INTEG.SURVEY',
  ],
  calibrate_initial: [
    'INTEL.COLLECT.REFERENCE',
    'INTEL.COLLECT.IMPLEMENTATION',
    'INTEL.ANALYZE.DELTA',
    'INTEG.FIX',
  ],
  calibrate_verify: [
    'INTEL.VERIFY.CONVERGENCE',
  ],
};

// Map instruction prefixes to handler files
const INSTRUCTION_FILES = {
  'INTEL.COLLECT': 'afloat/intelligence/collection.md',
  'INTEL.ANALYZE': 'afloat/intelligence/analysis.md',
  'INTEL.VERIFY': 'afloat/intelligence/calibration.md',
  'INTEL.AUTH': 'afloat/intelligence/intelligence.md',
  'INTEL.CHART': 'afloat/intelligence/cartography.md',
  'INTEL.RESUME': 'afloat/intelligence/intelligence.md',
  'INTEG.SURVEY': 'afloat/integration/integration.md',
  'INTEG.FIX': 'afloat/integration/integration.md',
  'INTEG.COMPILE': 'afloat/integration/compilation.md',
  'INTEG.VALIDATE': 'afloat/integration/validation.md',
  'INTEG.REWORK': 'afloat/integration/integration.md',
  'INTEG.RESUME': 'afloat/integration/integration.md',
  'AGENCY.MISSION': 'shore/admiral.md',
};

function check(records, portals) {
  const edges = [];
  const issues = [];
  let resistant = 0;

  // Build instruction → primary domain map from handler files
  const instrDomains = {};
  for (const [prefix, file] of Object.entries(INSTRUCTION_FILES)) {
    const record = records.find(r => r.rel === file);
    if (record) {
      const domains = record.domains;
      const primary = getPrimaryDomain(domains);
      instrDomains[prefix] = primary;
    }
  }

  // Build edges from routing sequences
  for (const [strategy, sequence] of Object.entries(ROUTING_SEQUENCES)) {
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i];
      const to = sequence[i + 1];
      const fromDomain = findDomain(from, instrDomains);
      const toDomain = findDomain(to, instrDomains);

      let edgeType = 'stable';
      if (fromDomain && toDomain && fromDomain !== toDomain) {
        // Check if there's a portal covering this transition
        const portalExists = portals && portals.some(p =>
          p.from === fromDomain && p.to === toDomain
        );
        if (portalExists) {
          edgeType = 'acceptable';
        } else {
          // Naval/military → refinery is expected (integration department)
          // The parent frame (naval+military) transitioning to refinery in integration is structural
          if (isFrameTransition(fromDomain, toDomain)) {
            edgeType = 'acceptable';
          } else {
            edgeType = 'resistant';
            resistant++;
          }
        }
      }

      edges.push({
        from,
        to,
        strategy,
        fromDomain,
        toDomain,
        type: edgeType,
      });
    }
  }

  // Flag resistant edges
  for (const edge of edges.filter(e => e.type === 'resistant')) {
    issues.push({
      severity: 'error',
      file: 'afloat/captain.md',
      message: `Resistant edge: ${edge.from} (${edge.fromDomain}) → ${edge.to} (${edge.toDomain}) in ${edge.strategy}`,
    });
  }

  const total = edges.length;
  const status = resistant === 0 ? 'GREEN' : resistant <= 2 ? 'YELLOW' : 'RED';

  return {
    axis: 3,
    name: 'Path Coherence',
    score: `${resistant}/${total}`,
    status,
    issues,
    edges,
    resistant,
    total,
  };
}

function findDomain(instruction, instrDomains) {
  // Match longest prefix
  const parts = instruction.split('.');
  for (let len = parts.length; len >= 1; len--) {
    const prefix = parts.slice(0, len).join('.');
    if (instrDomains[prefix]) return instrDomains[prefix];
  }
  return null;
}

function getPrimaryDomain(domains) {
  // Merge naval+military as parentFrame for comparison
  const merged = { ...domains };
  const frame = (merged.naval || 0) + (merged.military || 0);
  delete merged.naval;
  delete merged.military;
  if (frame > 0) merged.parentFrame = frame;

  let max = 0;
  let primary = null;
  for (const [domain, count] of Object.entries(merged)) {
    if (count > max) { max = count; primary = domain; }
  }
  return primary;
}

/**
 * parentFrame → refinery is a structural transition (Intelligence → Integration).
 * This is expected, not resistance.
 */
function isFrameTransition(from, to) {
  // parentFrame <-> refinery or surveying transitions are structural
  if (from === 'parentFrame' && (to === 'refinery' || to === 'surveying')) return true;
  if (to === 'parentFrame' && (from === 'refinery' || from === 'surveying')) return true;
  // surveying <-> refinery is also structural (Intelligence survey → Integration)
  if ((from === 'surveying' && to === 'refinery') || (from === 'refinery' && to === 'surveying')) return true;
  return false;
}

module.exports = { check };
