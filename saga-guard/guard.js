#!/usr/bin/env node
'use strict';

/**
 * saga-guard — Boundary-crossing enforcement layer for the Agency system.
 *
 * Reads Claude Code hook JSON from stdin, validates payloads and log emissions
 * against the constitution (markdown contracts as source of truth).
 *
 * Exit codes:
 *   0 — valid (or Level 2 warnings emitted to stderr)
 *   2 — Level 1 violation (blocks the tool call)
 *
 * Hook configuration (for deployment):
 * {
 *   "hooks": {
 *     "PreToolUse": [
 *       { "matcher": "Agent", "hooks": [{ "type": "command", "command": "node {AGENCY_ROOT}/saga-guard/guard.js" }] }
 *     ],
 *     "PostToolUse": [
 *       { "matcher": "Agent", "hooks": [{ "type": "command", "command": "node {AGENCY_ROOT}/saga-guard/guard.js" }] },
 *       { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "node {AGENCY_ROOT}/saga-guard/guard.js" }] }
 *     ]
 *   }
 * }
 */

const { extract } = require('./lib/extractor');
const { extractBlock, detectType, parseFields } = require('./lib/payload-parser');
const { validatePayload } = require('./lib/payload-validator');
const { validateLog, isLogFile } = require('./lib/log-validator');
const { formatViolation } = require('./lib/violations');
const { parseLogRows, appendEvents, appendArtifactEvent } = require('./lib/event-writer');
const { matchArtifact } = require('./lib/artifact-paths');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  let input;
  try {
    const raw = await readStdin();
    input = JSON.parse(raw);
  } catch (e) {
    // Not valid JSON or empty stdin — pass through
    process.exit(0);
  }

  const { hook_event_name, tool_name, tool_input, tool_result } = input;
  if (!tool_name) process.exit(0);

  // Load symbol table (cached)
  const symbols = extract();

  // Route based on tool and hook event
  if (tool_name === 'Agent') {
    if (hook_event_name === 'PreToolUse') {
      return handleAgentDispatch(tool_input, symbols);
    }
    if (hook_event_name === 'PostToolUse') {
      return handleAgentReturn(tool_result, symbols);
    }
  }

  if (tool_name === 'Write' || tool_name === 'Edit') {
    if (hook_event_name === 'PostToolUse' || hook_event_name === 'PreToolUse') {
      return handleWriteEdit(tool_input, symbols);
    }
  }

  // No validation needed for this tool/event combination
  process.exit(0);
}

/**
 * Validate Agent dispatch (PreToolUse) — check LAUNCH_BRIEF or MISSION_BRIEF in prompt.
 */
function handleAgentDispatch(toolInput, symbols) {
  if (!toolInput || !toolInput.prompt) process.exit(0);

  const extracted = extractBlock(toolInput.prompt);
  if (!extracted) process.exit(0); // No payload found — not an agency dispatch

  const { block, usedDelimiters } = extracted;
  const payloadType = detectType(block);
  if (!payloadType) process.exit(0); // Unrecognized block — not our concern

  const fields = parseFields(block);
  const { level1, level2 } = validatePayload(payloadType, fields, symbols);

  // Missing delimiters is a Level 2 warning
  if (!usedDelimiters) {
    level2.unshift({
      code: 'MISSING_DELIMITER',
      field: null,
      expected: '<<<SAGA_PAYLOAD>>> delimiters',
      actual: 'payload detected via header scan',
    });
  }

  return emitResults(level1, level2, 'dispatch', payloadType);
}

/**
 * Validate Agent return (PostToolUse) — check RETURN in result.
 * PostToolUse can only warn (exit 0), not block.
 */
function handleAgentReturn(toolResult, symbols) {
  if (!toolResult) process.exit(0);

  const text = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
  const extracted = extractBlock(text);
  if (!extracted) process.exit(0);

  const { block, usedDelimiters } = extracted;
  const payloadType = detectType(block);
  if (!payloadType) process.exit(0);

  const fields = parseFields(block);
  const { level1, level2 } = validatePayload(payloadType, fields, symbols);

  if (!usedDelimiters) {
    level2.unshift({
      code: 'MISSING_DELIMITER',
      field: null,
      expected: '<<<SAGA_PAYLOAD>>> delimiters',
      actual: 'payload detected via header scan',
    });
  }

  // PostToolUse returns are warnings only — can't block after the fact
  const allViolations = [...level1, ...level2];
  if (allViolations.length > 0) {
    process.stderr.write(formatViolation(2, 'return', payloadType, allViolations) + '\n');
  }
  process.exit(0);
}

/**
 * Validate Write/Edit to log files.
 * After validation passes, append events to the canonical JSONL log.
 */
function handleWriteEdit(toolInput, symbols) {
  if (!toolInput) process.exit(0);

  // Determine the file being written
  const filePath = toolInput.file_path || toolInput.filePath || '';

  // Check for artifact registration (dossiers, missions, chart, etc.)
  const artifactInfo = matchArtifact(filePath);
  if (artifactInfo) {
    try { appendArtifactEvent(filePath, artifactInfo); } catch (e) { /* non-blocking */ }
  }

  if (!isLogFile(filePath)) process.exit(0);

  // Get the content being written
  const content = toolInput.content || toolInput.new_string || '';
  if (!content) process.exit(0);

  const { level1, level2 } = validateLog(content, filePath, symbols);

  // If validation passes (no Level 1 blocks), append events to JSONL
  if (level1.length === 0) {
    try {
      const records = parseLogRows(content, filePath);
      appendEvents(records);
    } catch (e) {
      // Event writing is non-blocking — don't fail the guard
      process.stderr.write(`saga-guard: event-writer error: ${e.message}\n`);
    }
  }

  return emitResults(level1, level2, 'log', 'EVENT_RECORD');
}

/**
 * Emit results and exit with appropriate code.
 */
function emitResults(level1, level2, phase, payloadType) {
  // Level 2 warnings
  if (level2.length > 0) {
    process.stderr.write(formatViolation(2, phase, payloadType, level2) + '\n');
  }

  // Level 1 blocks
  if (level1.length > 0) {
    process.stderr.write(formatViolation(1, phase, payloadType, level1) + '\n');
    process.exit(2);
  }

  process.exit(0);
}

main().catch(e => {
  process.stderr.write(`saga-guard error: ${e.message}\n`);
  process.exit(0); // Don't block on internal errors
});
