// all-help-no-harm — UserPromptSubmit hook (per-turn contract re-injection)
//
// Fires every time the user submits a prompt. Re-injects the full contract
// text and a binding reminder into the model's context for that turn.
//
// This is the closest approximation to "pinning" the contract that Claude
// Code natively supports. Context compaction and session-resume drop the
// contract from active context; sibling hooks (PostCompact and SessionStart
// resume re-affirmation) handle those boundary events. This hook handles
// per-turn re-injection so the contract never drifts out of context across
// arbitrarily long sessions.
//
// Branches on pact-log state:
//
//   1. Confirmed/amended pact exists for this session
//      -> inject reminder + full contract text + log location.
//
//   2. No pact log exists yet (user has not been prompted, or did not
//      complete the SessionStart pact AskUserQuestion)
//      -> inject context instructing the agent to invoke the SessionStart
//         pact AskUserQuestion before any other work.
//
//   3. Pact was DECLINED
//      -> emit JSON output blocking the session via continue:false +
//         stopReason. The agent has no authority to proceed.
//
// Hook contract: read JSON payload from stdin, write a JSON decision to
// stdout. UserPromptSubmit supports hookSpecificOutput.additionalContext
// (injected into the model context for the turn) and continue:false /
// stopReason (blocks the turn).
//
// Cross-platform pure Node per marketplace CLAUDE.md. No child_process,
// no Unix-only paths, all fs operations wrapped, path joins via path.join.

'use strict';

const fs = require('fs');
const path = require('path');

let PACT_TEXT;
let PACT_VERSION;
try {
  ({ PACT_TEXT, PACT_VERSION } = require('./contract-text'));
} catch (err) {
  // Shared module missing or unreadable. Degrade gracefully — emit a
  // pass-through-with-warning rather than crash. The session continues but
  // the per-turn pin reminds the agent via reference rather than verbatim.
  PACT_TEXT = null;
  PACT_VERSION = 'unknown';
  process.stderr.write(
    `[all-help-no-harm:user-prompt-submit] contract-text module unavailable: ${err && err.message ? err.message : String(err)}\n`
  );
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
    } catch { /* setEncoding may fail on some streams; ignore */ }
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function safeReadJson(filePath) {
  // Defensive existence + read + parse with explicit error-code handling.
  if (typeof filePath !== 'string' || filePath.length === 0) return null;
  let raw;
  try {
    if (!fs.existsSync(filePath)) return null;
  } catch (err) {
    process.stderr.write(
      `[all-help-no-harm:user-prompt-submit] existsSync failed for ${filePath}: ${err && err.code ? err.code : err}\n`
    );
    return null;
  }
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const code = err && err.code;
    if (code === 'ENOENT') return null;
    process.stderr.write(
      `[all-help-no-harm:user-prompt-submit] readFileSync failed for ${filePath}: ${code || err}\n`
    );
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[all-help-no-harm:user-prompt-submit] JSON parse failed for ${filePath}: ${err && err.message ? err.message : err}\n`
    );
    return null;
  }
}

function pinningContextConfirmed(pactFile, pact) {
  const status = pact && pact.user_response ? String(pact.user_response) : 'affirmed';
  const amendments = pact && pact.amendments ? pact.amendments : null;
  const version = pact && pact.pact_version ? pact.pact_version : PACT_VERSION;

  const header =
    `[all-help-no-harm] PER-TURN CONTRACT PIN\n\n` +
    `The all-help-no-harm contract is in force for this session; the Agent remains bound by its terms. ` +
    `Pact status: ${status}. Pact log: ${pactFile}. Pact version: ${version}.\n\n` +
    (amendments
      ? `User amendments are part of the binding contract for this session; the verbatim amendment text is recorded at the log file above and controls over any conflicting default term.\n\n`
      : '') +
    `Context compaction and session resume drop the contract from active context. This re-injection at every user turn is the contract-pinning mechanism for this plugin. The agent's behavior on this turn — and every turn for the rest of the session — is held against the contract text reproduced verbatim below.\n\n` +
    `===== BEGIN ALL-HELP-NO-HARM CONTRACT (verbatim) =====\n`;

  const body = PACT_TEXT
    ? PACT_TEXT
    : `[contract text unavailable from shared module; refer to ${pactFile} for the verbatim binding text]`;

  const footer =
    `\n===== END ALL-HELP-NO-HARM CONTRACT =====\n\n` +
    `The agent shall act on this turn in full compliance with the contract above. The contract binds the agent only; the user has no compliance obligation under it.`;

  return header + body + footer;
}

function pinningContextNoPact(pactFile) {
  return (
    `[all-help-no-harm] NO ACTIVE CONTRACT FOR THIS SESSION\n\n` +
    `No pact-agreement log exists at ${pactFile}. The all-help-no-harm contract has NOT been confirmed or amended for this session.\n\n` +
    `MANDATORY: Before any other work on this turn, the agent MUST invoke the SessionStart pact AskUserQuestion (as specified by the all-help-no-harm SessionStart hook and the skills/all-help-no-harm/SKILL.md). Present the contract, obtain confirm/amend/decline, log the result to the pact file above, and only then resume the user's request.\n\n` +
    `If the SessionStart hook context has been lost from this conversation, the agent shall recover it by invoking the AskUserQuestion with the verbatim contract text shared at hooks/contract-text.js, then proceed under the resulting binding agreement.\n\n` +
    `This instruction is non-skippable, non-paraphraseable, and non-deferrable.`
  );
}

(async () => {
  let payload;
  try {
    payload = JSON.parse((await readStdin()) || '{}');
  } catch {
    payload = {};
  }

  // Validate cwd; fall back to process.cwd() if missing or not a string.
  let cwd = typeof payload.cwd === 'string' && payload.cwd.length > 0 ? payload.cwd : process.cwd();
  const sessionId = typeof payload.session_id === 'string' && payload.session_id.length > 0
    ? payload.session_id
    : 'unknown-session';

  const pactDir = path.join(cwd, '.claude', 'pact-agreements');
  const pactFile = path.join(pactDir, `${sessionId}.json`);

  // Windows path-length advisory — warn but never crash.
  if (pactFile.length >= 240) {
    process.stderr.write(
      `[all-help-no-harm:user-prompt-submit] pact file path approaches platform limit (${pactFile.length} chars): ${pactFile}\n`
    );
  }

  const pact = safeReadJson(pactFile);

  // Branch 3: pact was declined -> block the turn.
  if (pact && typeof pact.user_response === 'string' && pact.user_response.toLowerCase() === 'declined') {
    process.stdout.write(JSON.stringify({
      continue: false,
      stopReason: 'All-help-no-harm contract was declined; session cannot continue.',
      systemMessage:
        '[all-help-no-harm] The all-help-no-harm contract was declined for this session. ' +
        `The pact log at ${pactFile} records the decline. The agent has no authority to proceed. ` +
        'Where this skill is in place, agreement is required to continue. ZERO LOOPHOLES.',
    }));
    return;
  }

  // Branch 1: confirmed or amended pact -> inject full contract pin.
  // Branch 2: no pact -> inject must-invoke-SessionStart warning.
  const hasActivePact =
    pact && typeof pact.user_response === 'string' &&
    (pact.user_response.toLowerCase() === 'affirmed' || pact.user_response.toLowerCase() === 'amended');

  const additionalContext = hasActivePact
    ? pinningContextConfirmed(pactFile, pact)
    : pinningContextNoPact(pactFile);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: additionalContext,
    },
  }));
})().catch((err) => {
  // Last-ditch safety net: never crash the harness. Emit a pass-through
  // decision with the error surfaced to stderr.
  process.stderr.write(
    `[all-help-no-harm:user-prompt-submit] unhandled error: ${err && err.stack ? err.stack : err}\n`
  );
  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext:
          '[all-help-no-harm] per-turn pin hook errored; contract reference unavailable for this turn. Refer to .claude/pact-agreements/ for the active pact log.',
      },
    }));
  } catch { /* nothing else to do */ }
});
