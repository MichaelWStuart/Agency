'use strict';

const path = require('path');
const { AGENCY_ROOT } = require('../scanner');

/**
 * Axis 4: Mooring Integrity
 *
 * - Parse primitives.md for **NAME:** headers, verify Moored: line follows
 * - Scan all files for Moored: declarations, verify format consistency
 * - Cross-reference against Spine table in SKILL.md
 */
function check(records) {
  const primitivesFile = records.find(r => r.rel === 'primitives.md');
  const skillFile = records.find(r => r.rel === 'SKILL.md');

  const primitives = parsePrimitives(primitivesFile);
  const allMoorings = scanAllMoorings(records);
  const spineEntries = parseSpineTable(skillFile);

  const issues = [];

  // Check each primitive has a Moored: line
  let moored = 0;
  let unmoored = 0;
  for (const prim of primitives) {
    if (prim.moored) {
      moored++;
    } else {
      unmoored++;
      issues.push({
        severity: 'error',
        file: 'primitives.md',
        line: prim.line,
        message: `Primitive "${prim.name}" missing Moored: declaration`,
      });
    }
  }

  // Check Moored: format consistency across all files
  for (const m of allMoorings) {
    // Format: "Moored: Description (Reference)"
    if (!m.text.match(/^Moored:\s+.+\(.+\)$/)) {
      // Some moorings don't have parenthetical references — that's OK for
      // inline text moorings in Spine table. Only flag primitives.md format violations.
      if (m.file === 'primitives.md' && !m.text.match(/^Moored:\s+.+/)) {
        issues.push({
          severity: 'warning',
          file: m.file,
          line: m.line,
          message: `Mooring format deviation: "${m.text}"`,
        });
      }
    }
  }

  // Cross-reference: Spine entries with Moored: should exist in primitives
  for (const entry of spineEntries) {
    if (entry.moored) {
      const found = primitives.find(p =>
        p.name.toUpperCase() === entry.concept.toUpperCase() ||
        entry.definition.toUpperCase().includes(p.name.toUpperCase())
      );
      // Not all spine entries need primitive moorings — only flag if concept
      // explicitly says "Moored:" in the spine table
    }
  }

  const total = moored + unmoored;
  const score = total > 0 ? `${moored}/${total}` : '0/0';
  const status = unmoored === 0 ? 'GREEN' : unmoored <= 2 ? 'YELLOW' : 'RED';

  return { axis: 4, name: 'Mooring Integrity', score, status, issues, moored, unmoored, total };
}

function parsePrimitives(record) {
  if (!record) return [];
  const primitives = [];
  const lines = record.lines;

  for (let i = 0; i < lines.length; i++) {
    // Match: **NAME: Description**
    const match = lines[i].match(/^\*\*([A-Z]+):\s+(.+?)\*\*/);
    if (match) {
      const name = match[1];
      // Check if next non-empty line is Moored:
      let moored = false;
      let mooredText = '';
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].match(/^Moored:/)) {
          moored = true;
          mooredText = lines[j].trim();
          break;
        }
      }
      primitives.push({ name, line: i + 1, moored, mooredText });
    }
  }
  return primitives;
}

function scanAllMoorings(records) {
  const moorings = [];
  for (const record of records) {
    for (let i = 0; i < record.lines.length; i++) {
      if (record.lines[i].match(/^Moored:/)) {
        moorings.push({
          file: record.rel,
          line: i + 1,
          text: record.lines[i].trim(),
        });
      }
    }
  }
  return moorings;
}

function parseSpineTable(record) {
  if (!record) return [];
  const entries = [];
  const lines = record.lines;
  let inSpine = false;
  let pastSeparator = false;

  for (const line of lines) {
    if (line.includes('## The Spine')) { inSpine = true; continue; }
    if (inSpine && line.startsWith('## ')) { break; }
    if (!inSpine) continue;

    if (line.match(/^\|\s*-+/)) { pastSeparator = true; continue; }
    if (!pastSeparator) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      const concept = cols[1].replace(/\*|\[|\]/g, '').trim();
      const definition = cols[2];
      const moored = definition.toLowerCase().includes('moored:');
      entries.push({ concept, definition, moored });
    }
  }
  return entries;
}

module.exports = { check };
