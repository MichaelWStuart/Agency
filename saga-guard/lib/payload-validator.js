'use strict';

const { violation } = require('./violations');
const { detectDrift } = require('./drift-detector');

/**
 * Validate a parsed payload against the symbol table.
 * Returns { level1: [...], level2: [...] } violation arrays.
 */
function validatePayload(payloadType, fields, symbols) {
  const level1 = [];
  const level2 = [];

  // Check payload type is known
  if (!symbols.payload_types[payloadType]) {
    level1.push(violation('UNKNOWN_PAYLOAD', null, 'known payload type', payloadType));
    return { level1, level2 };
  }

  const schema = symbols.payload_types[payloadType];

  // Check required fields
  if (schema.requiredFields) {
    for (const rf of schema.requiredFields) {
      if (!(rf in fields)) {
        level1.push(violation('MISSING_FIELD', rf, 'field present', 'missing'));
      }
    }
  }

  // Validate STATUS enum
  if (fields.STATUS) {
    const validStatuses = getValidStatuses(payloadType, symbols);
    if (validStatuses.length > 0 && !validStatuses.includes(fields.STATUS)) {
      level1.push(violation('INVALID_ENUM', 'STATUS', `one of ${validStatuses.join(', ')}`, fields.STATUS));
    }
  }

  // Validate STRATEGY enum
  if (fields.STRATEGY) {
    const val = fields.STRATEGY.replace(/^.*→\s*/, '').trim();
    if (!symbols.strategies.includes(val)) {
      level1.push(violation('INVALID_ENUM', 'STRATEGY', `one of ${symbols.strategies.join(', ')}`, val));
    }
  }

  // Validate SEVERITY enum
  if (fields.SEVERITY) {
    if (!symbols.severities.includes(fields.SEVERITY)) {
      level1.push(violation('INVALID_ENUM', 'SEVERITY', `one of ${symbols.severities.join(', ')}`, fields.SEVERITY));
    }
  }

  // Validate INSTRUCTION fields against catalog
  validateInstructions(fields, symbols, level1);

  // Validate NEED against catalog
  if (fields.NEED) {
    if (!symbols.need_ids.includes(fields.NEED)) {
      level1.push(violation('UNKNOWN_NEED', 'NEED', `one of NEED catalog`, fields.NEED));
    }
  }

  // Validate invariants
  validateInvariants(payloadType, fields, symbols, level1);

  // Level 2: length checks
  validateLengths(fields, level2);

  // Level 2: drift detection
  const driftViolations = detectDrift(fields, symbols);
  level2.push(...driftViolations);

  return { level1, level2 };
}

/**
 * Get valid STATUS values for a payload type.
 */
function getValidStatuses(payloadType, symbols) {
  if (payloadType === 'VALIDATION_RETURN') {
    return ['pass', 'fail', 'escalation'];
  }
  if (payloadType === 'ESCALATION') {
    return ['escalation'];
  }
  // Most return types use the standard set
  if (payloadType.includes('RETURN') || payloadType === 'MISSION_RETURN') {
    return symbols.statuses; // complete, partial, escalation
  }
  return [];
}

/**
 * Validate instruction IDs in INSTRUCTION and INSTRUCTIONS fields.
 */
function validateInstructions(fields, symbols, violations) {
  // Single INSTRUCTION field
  if (fields.INSTRUCTION) {
    if (!symbols.instruction_ids.includes(fields.INSTRUCTION)) {
      violations.push(violation('UNKNOWN_INSTRUCTION', 'INSTRUCTION', 'instruction from catalog', fields.INSTRUCTION));
    }
  }

  // INSTRUCTIONS list
  if (Array.isArray(fields.INSTRUCTIONS)) {
    for (let i = 0; i < fields.INSTRUCTIONS.length; i++) {
      const instrLine = fields.INSTRUCTIONS[i];
      // Extract instruction ID (before any # comment)
      const instrId = instrLine.split('#')[0].trim();
      if (instrId && !symbols.instruction_ids.includes(instrId)) {
        violations.push(violation('UNKNOWN_INSTRUCTION', `INSTRUCTIONS[${i}]`, 'instruction from catalog', instrId));
      }
    }
  }
}

/**
 * Validate cross-field invariants.
 */
function validateInvariants(payloadType, fields, symbols, violations) {
  const schema = symbols.payload_types[payloadType];
  if (!schema || !schema.invariants) return;

  for (const inv of schema.invariants) {
    // Parse: IF STATUS == complete THEN DOCKING_READY == true
    const ifThen = inv.match(/^IF\s+(\w+)\s*==\s*(\w+)\s+THEN\s+(\w+)\s*==\s*(\w+)$/);
    if (ifThen) {
      const [, condField, condVal, thenField, thenVal] = ifThen;
      if (fields[condField] === condVal && fields[thenField] !== thenVal) {
        violations.push(violation(
          'INVARIANT_VIOLATED',
          `${condField}/${thenField}`,
          `${thenField} == ${thenVal} when ${condField} == ${condVal}`,
          `${thenField} == ${fields[thenField] || 'missing'}`
        ));
      }
      continue;
    }

    // Parse: IF STATUS == partial THEN PLOT_REMAINING > 0
    const ifGt = inv.match(/^IF\s+(\w+)\s*==\s*(\w+)\s+THEN\s+(\w+)\s*>\s*(\d+)$/);
    if (ifGt) {
      const [, condField, condVal, thenField, thenNum] = ifGt;
      if (fields[condField] === condVal) {
        const val = parseInt(fields[thenField], 10);
        if (isNaN(val) || val <= parseInt(thenNum, 10)) {
          violations.push(violation(
            'INVARIANT_VIOLATED',
            `${condField}/${thenField}`,
            `${thenField} > ${thenNum} when ${condField} == ${condVal}`,
            `${thenField} == ${fields[thenField] || 'missing'}`
          ));
        }
      }
      continue;
    }

    // Parse: IF STATUS == escalation THEN FIELDS(A, B, C) PRESENT
    const ifPresent = inv.match(/^IF\s+(\w+)\s*==\s*(\w+)\s+THEN\s+FIELDS\(([^)]+)\)\s+PRESENT$/);
    if (ifPresent) {
      const [, condField, condVal, fieldList] = ifPresent;
      if (fields[condField] === condVal) {
        const required = fieldList.split(',').map(f => f.trim());
        for (const rf of required) {
          if (!(rf in fields)) {
            violations.push(violation(
              'INVARIANT_VIOLATED',
              rf,
              `${rf} present when ${condField} == ${condVal}`,
              'missing'
            ));
          }
        }
      }
      continue;
    }

    // Parse: STATUS IN (val1, val2, ...)
    const inMatch = inv.match(/^(\w+)\s+IN\s+\(([^)]+)\)$/);
    if (inMatch) {
      const [, field, valList] = inMatch;
      if (fields[field]) {
        const allowed = valList.split(',').map(v => v.trim());
        if (!allowed.includes(fields[field])) {
          violations.push(violation(
            'INVALID_ENUM',
            field,
            `one of ${allowed.join(', ')}`,
            fields[field]
          ));
        }
      }
      continue;
    }

    // Parse: FIELD == value (direct assertion)
    const eqMatch = inv.match(/^(\w+)\s*==\s*(\w+)$/);
    if (eqMatch) {
      const [, field, expected] = eqMatch;
      if (fields[field] && fields[field] !== expected) {
        violations.push(violation(
          'INVARIANT_VIOLATED',
          field,
          expected,
          fields[field]
        ));
      }
      continue;
    }

    // Parse: NEED IN (NEED catalog)
    const catalogMatch = inv.match(/^(\w+)\s+IN\s+\((\w+)\s+catalog\)$/);
    if (catalogMatch) {
      const [, field, catalogName] = catalogMatch;
      if (fields[field] && catalogName === 'NEED') {
        if (!symbols.need_ids.includes(fields[field])) {
          violations.push(violation('UNKNOWN_NEED', field, 'valid NEED from catalog', fields[field]));
        }
      }
      continue;
    }

    // Parse: IF SEVERITY == terminal THEN ANNOTATION PRESENT
    const ifFieldPresent = inv.match(/^IF\s+(\w+)\s*==\s*(\w+)\s+THEN\s+(\w+)\s+PRESENT$/);
    if (ifFieldPresent) {
      const [, condField, condVal, thenField] = ifFieldPresent;
      if (fields[condField] === condVal && !(thenField in fields)) {
        violations.push(violation(
          'INVARIANT_VIOLATED',
          thenField,
          `${thenField} present when ${condField} == ${condVal}`,
          'missing'
        ));
      }
      continue;
    }
  }
}

/**
 * Check string length constraints (Level 2).
 */
function validateLengths(fields, violations) {
  // NOTES items: <=50 chars each
  if (Array.isArray(fields.NOTES)) {
    for (let i = 0; i < fields.NOTES.length; i++) {
      if (fields.NOTES[i].length > 50) {
        violations.push(violation(
          'LENGTH_EXCEEDED',
          `NOTES[${i}]`,
          '<=50 chars',
          `${fields.NOTES[i].length} chars`
        ));
      }
    }
  }

  // CONTEXT: <=25 words
  if (fields.CONTEXT && typeof fields.CONTEXT === 'string') {
    const wordCount = fields.CONTEXT.split(/\s+/).length;
    if (wordCount > 25) {
      violations.push(violation(
        'LENGTH_EXCEEDED',
        'CONTEXT',
        '<=25 words',
        `${wordCount} words`
      ));
    }
  }

  // ANNOTATION: <=25 words
  if (fields.ANNOTATION && typeof fields.ANNOTATION === 'string') {
    const wordCount = fields.ANNOTATION.split(/\s+/).length;
    if (wordCount > 25) {
      violations.push(violation(
        'LENGTH_EXCEEDED',
        'ANNOTATION',
        '<=25 words',
        `${wordCount} words`
      ));
    }
  }
}

module.exports = { validatePayload };
