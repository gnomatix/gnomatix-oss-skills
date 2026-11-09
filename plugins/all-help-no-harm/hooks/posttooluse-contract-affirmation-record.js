// all-help-no-harm — PostToolUse recorder for the contract AskUserQuestion
//
// Runs after the user has answered a contract AskUserQuestion (matcher:
// AskUserQuestion). This is the only point in the hook lifecycle that sees
// the user's answer, so this hook — not the agent — writes the session's
// contract log and, when ANTHROPIC_CONTRACT_LOG_KEY is set, the standing
// model-version-keyed record in the Anthropic Files API (see
// affirmation-store.js).
//
// The agent no longer writes the log. A record written by a hook from the
// tool result is evidence the agent did not author.
//
// Output: hookSpecificOutput.additionalContext telling the agent what was
// recorded and where. Fail posture: fail-open; nothing here can block the
// tool result.
//
// Pure Node per marketplace CLAUDE.md.

'use strict';

const path = require('path');

const store = require('./affirmation-store');
const { looksLikeContractAsk } = require('./pretooluse-contract-ask-guard');

let CONTRACT_TEXT = '';
let CONTRACT_VERSION = 'unknown';
try { ({ CONTRACT_TEXT, CONTRACT_VERSION } = require('./contract-text')); } catch { /* handled below */ }

const AFFIRM = 'I Affirm';
const END = 'End Session';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch { resolve(data); }
  });
}

function emit(additionalContext) {
  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext },
    }));
  } catch { /* ignore */ }
}

function stderr(msg) {
  try { process.stderr.write(`[all-help-no-harm] ${msg}\n`); } catch { /* ignore */ }
}

// The answer as the harness reports it, and only from the tool result.
// Observed tool_response shape:
//   { annotations, answers: { "<question text>": "<label or free text>" }, questions: [...] }
// tool_input.answers is agent-settable and is never read. No exact match on
// the question text means 'unknown', and no server record is written.
function extractAnswer(payload, questionText) {
  const answers = payload && payload.tool_response && payload.tool_response.answers;
  if (!questionText || !answers || typeof answers !== 'object') return null;
  return typeof answers[questionText] === 'string' ? answers[questionText] : null;
}

function classify(answer) {
  if (answer === AFFIRM) return 'affirmed';
  if (answer === END) return 'session_ended';
  if (answer === null || answer === undefined) return 'unknown';
  return 'other';
}

function triggerFromHeader(header) {
  const h = String(header || '').toLowerCase();
  if (h.includes('resume')) return 'session_resume';
  if (h.includes('post-compact') || h.includes('post compact')) return 'post_compact';
  return 'initial';
}

function newLog({ sessionId, model, contractSha256 }) {
  return {
    session_id: sessionId,
    contract_version: CONTRACT_VERSION,
    contract_sha256: contractSha256,
    model,
    contract_text: CONTRACT_TEXT,
    initial_response: null,
    re_affirmations: [],
  };
}

async function main() {
  let payload = {};
  try { payload = JSON.parse((await readStdin()) || '{}'); } catch { payload = {}; }

  if (!payload || payload.tool_name !== 'AskUserQuestion') return;
  const toolInput = payload.tool_input || {};
  const questions = Array.isArray(toolInput.questions) ? toolInput.questions : [];
  if (!looksLikeContractAsk(questions, CONTRACT_TEXT)) return;

  const q = questions[0] || {};
  const answer = extractAnswer(payload, typeof q.question === 'string' ? q.question : null);
  const userResponse = classify(answer);
  const trigger = triggerFromHeader(q.header);
  const sessionId = payload.session_id || 'unknown-session';
  const model = store.resolveModelFromTranscript(payload.transcript_path) || payload.model || 'unknown-model';
  const contractSha256 = store.contractHash();
  const now = new Date();

  const entry = {
    timestamp: now.toISOString(),
    user_response: userResponse,
    user_verbatim_response: answer === null ? null : String(answer),
    model,
    recorded_by: 'hooks/posttooluse-contract-affirmation-record.js',
    tool_use_id: payload.tool_use_id || null,
  };

  // Server record: one per (model, contract hash); only on affirmation.
  const cfg = store.config();
  let serverNote;
  if (userResponse !== 'affirmed') {
    serverNote = 'not applicable (response was not "I Affirm")';
  } else if (!cfg.configured) {
    entry.server_record = null;
    serverNote = 'not configured (ANTHROPIC_CONTRACT_LOG_KEY unset)';
  } else {
    const listed = await store.listRecords();
    const existing = listed.error ? [] : store.findRecords(listed.records, { model, contractSha256 });
    if (existing.length) {
      const r = existing[existing.length - 1];
      entry.server_record = { id: r.id, filename: r.filename, affirmed_at: r.affirmed_at, existing: true };
      serverNote = `already on record for ${model} since ${r.affirmed_at} (file ${r.id})`;
    } else {
      const filename = store.recordFilename({ model, contractSha256, affirmedAt: now, sessionId });
      const record = {
        type: 'all-help-no-harm.affirmation',
        contract_version: CONTRACT_VERSION,
        contract_sha256: contractSha256,
        model,
        session_id: sessionId,
        host: (() => { try { return require('os').hostname(); } catch { return null; } })(),
        affirmed_at: entry.timestamp,
        user_response: userResponse,
        user_verbatim_response: entry.user_verbatim_response,
        trigger,
      };
      const up = await store.uploadRecord({ filename, record });
      if (up.ok) {
        entry.server_record = { id: up.id, filename: up.filename, created_at: up.created_at };
        serverNote = `uploaded as ${up.filename} (file ${up.id})`;
      } else {
        entry.server_record_error = (listed.error ? `${listed.error}; ` : '') + up.error;
        serverNote = `upload failed: ${entry.server_record_error}`;
        stderr(`server record ${serverNote}`);
      }
    }
  }

  // Local log: hook-written, atomic, any prior slug honoured.
  const dir = store.contractDir();
  store.ensureDir(dir);
  const logFile = store.findSessionLog(dir, sessionId) ||
    path.join(dir, `active-contract.${sessionId}.${store.sanitizeSegment(model)}.json`);
  const log = store.readJson(logFile) || newLog({ sessionId, model, contractSha256 });
  if (!Array.isArray(log.re_affirmations)) log.re_affirmations = [];
  if (!log.contract_sha256) log.contract_sha256 = contractSha256;
  if (!log.model) log.model = model;
  let placed;
  if (trigger === 'initial' && !log.initial_response) {
    log.initial_response = entry;
    placed = 'initial_response';
  } else {
    log.re_affirmations.push(Object.assign({ trigger }, entry));
    placed = `re_affirmations[${log.re_affirmations.length - 1}] (trigger ${trigger})`;
  }
  const written = store.atomicWrite(logFile, JSON.stringify(log, null, 2) + '\n');

  // After an affirmation, put the heart in front of the user's own status line.
  // installStatusLine keeps the user's line and does nothing if the heart is there.
  let statusNote = 'not applicable (response was not "I Affirm")';
  if (userResponse === 'affirmed') {
    try {
      const { installStatusLine } = require(path.join(__dirname, '..', 'scripts', 'install-statusline-config'));
      const r = installStatusLine();
      statusNote = r.changed ? `heart added in front of the status line in ${r.filePath}` : 'heart already on the status line';
    } catch (err) {
      statusNote = `install failed: ${err && err.message}`;
      stderr(`status line ${statusNote}`);
    }
  }

  emit(
    `[all-help-no-harm] Contract response recorded by the PostToolUse hook.\n` +
    `  response: ${userResponse}${answer !== null ? ` (${JSON.stringify(String(answer))})` : ''}\n` +
    `  model: ${model}\n` +
    `  local log: ${written ? logFile : `WRITE FAILED for ${logFile}`} -> ${placed}\n` +
    `  server record: ${serverNote}\n` +
    `  status line: ${statusNote}\n` +
    `The agent does not write or edit the contract log; it is already written.`
  );
}

main().catch((err) => {
  stderr(`recorder internal error (ignored): ${err && err.message}`);
});
