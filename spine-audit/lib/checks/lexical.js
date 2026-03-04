'use strict';

const { loadVocab, escapeRegex } = require('../vocabulary');

/**
 * Axis 1: Lexical Cohesion
 *
 * - Build global term index: term -> [{file, line, context}]
 * - Polysemy score: terms appearing in multiple domain vocab lists / total terms
 * - Collision score: cross-domain uses without qualifying context / total uses
 */
function check(records) {
  const vocab = loadVocab();

  // 1. Find terms that appear in multiple domain vocab lists (polysemous terms)
  const termDomains = {};
  for (const [domain, terms] of Object.entries(vocab)) {
    for (const term of terms) {
      const lower = term.toLowerCase();
      if (!termDomains[lower]) termDomains[lower] = [];
      termDomains[lower].push(domain);
    }
  }
  const polysemousTerms = Object.entries(termDomains)
    .filter(([, domains]) => domains.length > 1)
    .map(([term, domains]) => ({ term, domains }));

  // 2. Build global term index — where each polysemous term appears
  const termIndex = {};
  for (const { term } of polysemousTerms) {
    termIndex[term] = [];
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
    for (const record of records) {
      for (let i = 0; i < record.lines.length; i++) {
        if (regex.test(record.lines[i])) {
          termIndex[term].push({
            file: record.rel,
            line: i + 1,
            context: record.lines[i].trim().substring(0, 80),
          });
        }
        regex.lastIndex = 0;
      }
    }
  }

  // 3. Score
  const totalVocabTerms = Object.keys(termDomains).length;
  const polysemyScore = totalVocabTerms > 0
    ? polysemousTerms.length / totalVocabTerms
    : 0;

  // Collision: count cross-domain uses of polysemous terms
  let totalUses = 0;
  let crossDomainUses = 0;
  for (const { term, domains } of polysemousTerms) {
    const uses = termIndex[term] || [];
    totalUses += uses.length;
    // A use is cross-domain if the file's primary domain differs from one of the term's domains
    for (const use of uses) {
      const fileRecord = records.find(r => r.rel === use.file);
      if (fileRecord) {
        const filePrimaryDomain = getPrimaryDomain(fileRecord.domains);
        if (filePrimaryDomain && !domains.includes(filePrimaryDomain)) {
          crossDomainUses++;
        }
      }
    }
  }
  const collisionScore = totalUses > 0 ? crossDomainUses / totalUses : 0;

  // Thresholds: polysemy <0.10 = GREEN, <0.20 = YELLOW, else RED
  const status = polysemyScore < 0.10 ? 'GREEN' : polysemyScore < 0.20 ? 'YELLOW' : 'RED';

  // Top 20 ambiguous terms
  const topTerms = polysemousTerms
    .map(({ term, domains }) => ({
      term,
      domains,
      uses: (termIndex[term] || []).length,
      locations: (termIndex[term] || []).slice(0, 3),
    }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 20);

  const issues = topTerms
    .filter(t => t.uses > 0)
    .map(t => ({
      severity: 'info',
      file: t.locations[0]?.file || '-',
      message: `"${t.term}" shared by [${t.domains.join(', ')}] — ${t.uses} uses`,
    }));

  return {
    axis: 1,
    name: 'Lexical Cohesion',
    score: polysemyScore.toFixed(2),
    status,
    issues,
    polysemyScore,
    collisionScore,
    topTerms,
  };
}

function getPrimaryDomain(domains) {
  let max = 0;
  let primary = null;
  for (const [domain, count] of Object.entries(domains)) {
    if (count > max) { max = count; primary = domain; }
  }
  return primary;
}

module.exports = { check };
