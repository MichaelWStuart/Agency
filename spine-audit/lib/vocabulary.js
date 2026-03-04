'use strict';

const fs = require('fs');
const path = require('path');

const VOCAB_PATH = path.join(__dirname, '..', 'domains', 'vocab.json');

let _vocab = null;
let _patterns = null;

function loadVocab() {
  if (_vocab) return _vocab;
  _vocab = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));
  return _vocab;
}

/**
 * Build compiled regex patterns for each domain.
 * Each term matched case-insensitively at word boundaries.
 */
function getPatterns() {
  if (_patterns) return _patterns;
  const vocab = loadVocab();
  _patterns = {};
  for (const [domain, terms] of Object.entries(vocab)) {
    _patterns[domain] = terms.map(term => ({
      term,
      regex: new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi'),
    }));
  }
  return _patterns;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenize text into words (lowercase, alpha-only, >=3 chars).
 */
function tokenize(text) {
  return text.toLowerCase().match(/[a-z]{3,}/g) || [];
}

/**
 * Classify text: for each domain, count matching tokens.
 * Returns { domain: count } map.
 */
function classify(text) {
  const patterns = getPatterns();
  const counts = {};
  for (const [domain, termPatterns] of Object.entries(patterns)) {
    let count = 0;
    for (const { regex } of termPatterns) {
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) counts[domain] = count;
  }
  return counts;
}

/**
 * Compute Shannon entropy from a domain count map.
 */
function entropy(counts) {
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const c of Object.values(counts)) {
    if (c === 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Get all domain terms as a flat set (for checking if a word is a known domain term).
 */
function allTerms() {
  const vocab = loadVocab();
  const set = new Set();
  for (const terms of Object.values(vocab)) {
    for (const t of terms) set.add(t.toLowerCase());
  }
  return set;
}

/**
 * For a given term, return which domains it belongs to.
 */
function domainsForTerm(term) {
  const vocab = loadVocab();
  const domains = [];
  const lower = term.toLowerCase();
  for (const [domain, terms] of Object.entries(vocab)) {
    if (terms.some(t => t.toLowerCase() === lower)) {
      domains.push(domain);
    }
  }
  return domains;
}

/**
 * Count metaphor-domain tokens (naval, military, refinery, surveying)
 * vs schema/software tokens in text.
 */
function metaphorRatio(text) {
  const counts = classify(text);
  const metaphor = (counts.naval || 0) + (counts.military || 0)
    + (counts.refinery || 0) + (counts.surveying || 0);
  const schema = (counts.schema || 0) + (counts.software || 0);
  const total = metaphor + schema;
  return { metaphor, schema, total, density: total > 0 ? metaphor / total : 0 };
}

module.exports = {
  loadVocab, getPatterns, tokenize, classify, entropy,
  allTerms, domainsForTerm, metaphorRatio, escapeRegex,
};
