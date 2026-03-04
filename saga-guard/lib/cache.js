'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'symbols.json');

/**
 * Compute SHA-256 hash of concatenated source file contents.
 * Files are read in deterministic order (as provided).
 */
function computeHash(sourcePaths) {
  const hash = crypto.createHash('sha256');
  for (const p of sourcePaths) {
    try {
      hash.update(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      // File missing — hash changes, triggering re-extract
      hash.update(`MISSING:${p}`);
    }
  }
  return hash.digest('hex');
}

/**
 * Load cached symbols if hash matches.
 * Returns { symbols, hit: true } or { symbols: null, hit: false }.
 */
function loadCache(currentHash) {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const cached = JSON.parse(raw);
    if (cached.hash === currentHash) {
      return { symbols: cached, hit: true };
    }
  } catch (e) {
    // No cache or corrupt — miss
  }
  return { symbols: null, hit: false };
}

/**
 * Write symbols to cache file.
 */
function writeCache(symbols) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(symbols, null, 2), 'utf8');
}

module.exports = { computeHash, loadCache, writeCache, CACHE_FILE };
