'use strict';

/**
 * Artifact path matching — identifies artifacts by type from file paths.
 * Matches against project workspace paths (not memory/ paths).
 */

const ARTIFACT_PATTERNS = [
  { type: 'dossier',  pattern: /dossiers?\/[^/]+\.(yaml|md)$/ },
  { type: 'mission',  pattern: /missions?\/[^/]+\.(yaml|md)$/ },
  { type: 'chart',    pattern: /chart\.(yaml|json)$/ },
  { type: 'evidence', pattern: /evidence\/[^/]+/ },
  { type: 'config',   pattern: /config\.(md|yaml|json)$/ },
  { type: 'report',   pattern: /reports?\/[^/]+\.(md|yaml)$/ },
];

/**
 * Match a file path against known artifact patterns.
 * Returns { type, domain } or null if not an artifact.
 */
function matchArtifact(filePath) {
  if (!filePath) return null;

  for (const { type, pattern } of ARTIFACT_PATTERNS) {
    if (pattern.test(filePath)) {
      const domain = extractDomain(filePath, type);
      return { type, domain };
    }
  }
  return null;
}

/**
 * Extract domain hint from artifact path.
 */
function extractDomain(filePath, type) {
  if (type === 'dossier' || type === 'mission') {
    const basename = filePath.split('/').pop().replace(/\.(yaml|md|json)$/, '');
    const match = basename.match(/^([a-z]+)/);
    return match ? match[1] : null;
  }
  return null;
}

module.exports = { matchArtifact, ARTIFACT_PATTERNS };
