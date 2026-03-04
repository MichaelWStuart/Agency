'use strict';

const fs = require('fs');
const path = require('path');
const { tokenize, classify } = require('./vocabulary');

const AGENCY_ROOT = path.join(__dirname, '..', '..', 'agency');

/**
 * Recursively walk a directory, collecting .md and .json files.
 */
function walkDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Build a FileRecord for a file.
 */
function makeRecord(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(AGENCY_ROOT, filePath);
  const tokens = tokenize(content);
  const domains = classify(content);
  const lines = content.split('\n');

  // Extract sections (## and ### headers)
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,3})\s+(.+)/);
    if (match) {
      sections.push({ level: match[1].length, title: match[2], line: i + 1 });
    }
  }

  return {
    path: filePath,
    rel,
    content,
    tokens,
    domains,
    lines,
    sections,
    wordCount: tokens.length,
  };
}

/**
 * Scan agency/ directory, return array of FileRecords.
 * Skips .sh files (only .md and .json).
 */
function scan() {
  const files = walkDir(AGENCY_ROOT);
  return files.map(makeRecord);
}

module.exports = { scan, makeRecord, walkDir, AGENCY_ROOT };
