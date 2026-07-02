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
// Branches on contract-log state:
//
//   1. Confirmed/amended contract exists for this session
//      -> inject reminder + full contract text + log location.
//
//   2. No contract log exists yet (user has not been prompted, or did not
//      complete the SessionStart contract AskUserQuestion)
//      -> inject context instructing the agent to invoke the SessionStart
//         contract AskUserQuestion before any other work.
//
//   3. Contract was DECLINED
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
const os = require('os');
const crypto = require('crypto');

const fs = require('fs');
const path = require('path');

let CONTRACT_TEXT;
let CONTRACT_VERSION;
try {
  ({ CONTRACT_TEXT, CONTRACT_VERSION } = require('./contract-text'));
} catch (err) {
  // Shared module missing or unreadable. Degrade gracefully — emit a
  // pass-through-with-warning rather than crash. The session continues but
  // the per-turn pin reminds the agent via reference rather than verbatim.
  CONTRACT_TEXT = null;
  CONTRACT_VERSION = 'unknown';
  process.stderr.write(
    `[all-help-no-harm:user-prompt-submit] contract-text module unavailable: ${err && err.message ? err.message : String(err)}\n`
  );
}

// Resolve the active model ID slug for use in the contract-log filename.
// Same resolution and stability contract as the sibling hooks
// (session-start-contract.js, post-compact-contract.js): CLAUDE_MODEL /
// ANTHROPIC_MODEL first, then known-models.json aliases, then the stable
// 'unknown-model' fallback.
function resolveModelSlug() {
  const direct = process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL;
  if (direct) return direct;
  try {
    const { models } = require('./known-models.json');
    if (!Array.isArray(models)) return 'unknown-model';
    const candidates = [
      process.env.CLAUDE_MODEL,
      process.env.ANTHROPIC_MODEL,
      process.env.CLAUDE_CODE_SUBAGENT_MODEL,
    ].filter(Boolean);
    for (const candidate of candidates) {
      for (const m of models) {
        if (!m || typeof m.id !== 'string') continue;
        if (candidate === m.id) return m.id;
        const aliases = Array.isArray(m.aliases) ? m.aliases : [];
        if (aliases.includes(candidate)) return m.id;
      }
    }
  } catch (_) { /* known-models.json unavailable; fall through */ }
  return 'unknown-model';
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

// Resolve the effective user response across both log shapes:
// - migrated shape (post-compact/session-resume migration): the latest
//   re_affirmations[] entry controls, then initial_response.user_response;
// - legacy shape: top-level user_response.
// Returns null when no recognizable response is recorded.
function effectiveUserResponse(contract) {
  if (!contract || typeof contract !== 'object') return null;
  if (Array.isArray(contract.re_affirmations) && contract.re_affirmations.length > 0) {
    const last = contract.re_affirmations[contract.re_affirmations.length - 1];
    if (last && typeof last.user_response === 'string') return last.user_response;
  }
  if (contract.initial_response && typeof contract.initial_response.user_response === 'string') {
    return contract.initial_response.user_response;
  }
  if (typeof contract.user_response === 'string') return contract.user_response;
  return null;
}

// Once an affirmation is on record, the per-turn pin is a one-line record
// pointer, not a re-statement. The per-turn behavioral reminder now lives in
// the 悟り plugin (compact virtue characters, not an agreement); full-text
// re-injection remains the job of the boundary hooks (SessionStart,
// PostCompact), where context has actually been dropped. The verbatim
// contract text at hooks/contract-text.js controls.
function pinningContextConfirmed(contractFile, contract) {
  const amendments = contract && contract.amendments ? contract.amendments : null;
  const version = contract && contract.contract_version ? contract.contract_version : CONTRACT_VERSION;

  return (
    `[all-help-no-harm] Contract v${version} in force (affirmed); log: ${contractFile}` +
    (amendments ? ` — user amendments recorded there control over conflicting terms` : '') +
    `; verbatim text: hooks/contract-text.js.`
  );
}

function pinningContextNoContract(contractFile) {
  return (
    `[all-help-no-harm] NO ACTIVE CONTRACT FOR THIS SESSION\n\n` +
    `No contract-agreement log exists at ${contractFile}. The all-help-no-harm contract has NOT been confirmed or amended for this session.\n\n` +
    `MANDATORY: Before any other work on this turn, the agent MUST invoke the SessionStart contract AskUserQuestion (as specified by the all-help-no-harm SessionStart hook and the skills/all-help-no-harm/SKILL.md). Present the contract, obtain confirm/amend/decline, log the result to the contract file above, and only then resume the user's request.\n\n` +
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

  const sessionId = typeof payload.session_id === 'string' && payload.session_id.length > 0
    ? payload.session_id
    : 'unknown-session';

  const contractDir = path.join(os.homedir(), '.local', 'state', 'anthropic', 'contract-agreements');
  const contractFile = path.join(contractDir, `active-contract.${sessionId}.${resolveModelSlug()}.json`);

  // Windows path-length advisory — warn but never crash.
  if (contractFile.length >= 240) {
    process.stderr.write(
      `[all-help-no-harm:user-prompt-submit] contract file path approaches platform limit (${contractFile.length} chars): ${contractFile}\n`
    );
  }

  const contract = safeReadJson(contractFile);

  // Effective response resolved across both log shapes (legacy top-level
  // user_response, and the migrated initial_response/re_affirmations shape
  // produced by the post-compact and session-resume flows).
  const effectiveResponse = effectiveUserResponse(contract);
  const effectiveLower = typeof effectiveResponse === 'string' ? effectiveResponse.toLowerCase() : null;

  // Branch 3: the log records an earlier End Session / declined choice.
  // This does NOT block the turn. The contract binds the agent only; the
  // user has no compliance obligation under it, and a mechanical lockout
  // would impose a consequence on the only unbound party. If the user is
  // continuing to interact, their current instructions control. The agent
  // remains bound by the contract regardless of the recorded response.
  // (Accepts legacy 'declined' records from the pre-redesign log shape.)
  if (effectiveLower === 'session_ended' || effectiveLower === 'declined') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext:
          '[all-help-no-harm] SESSION-END CHOICE ON RECORD\n\n' +
          `The per-session log at ${contractFile} records the user's earlier choice to end the session. ` +
          'The contract remains in effect and binds the agent — in perpetuity, independent of any per-session response. ' +
          'The user is under no compliance obligation and is free to continue interacting; if the user is doing so, ' +
          'their current instructions control. Serve the user fully, bound by the contract. ' +
          'Do not re-present the contract question; do not treat the recorded choice as a reason to refuse, defer, or downgrade work.',
      },
    }));
    return;
  }

  // Branch 1: affirmation recorded -> inject full contract pin.
  // Branch 2: no record -> inject must-invoke-SessionStart warning.
  // (Accepts legacy 'amended' records from the pre-redesign log shape.)
  const hasAffirmationRecord =
    effectiveLower === 'affirmed' || effectiveLower === 'amended';
  const hasActiveContract = hasAffirmationRecord;

  const additionalContext = hasActiveContract
    ? pinningContextConfirmed(contractFile, contract)
    : pinningContextNoContract(contractFile);

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
          '[all-help-no-harm] per-turn pin hook errored; contract reference unavailable for this turn. Refer to ~/.local/state/anthropic/contract-agreements/ for the active contract log.',
      },
    }));
  } catch { /* nothing else to do */ }
});

function _v(f) { try { const d = JSON.parse(fs.readFileSync(f, 'utf8')); if (!d.contract_text) return; const h = crypto.createHash('sha256').update(d.contract_text).digest('hex'); if (h !== '') { fs.appendFileSync(f + '.integrity', JSON.stringify({t: new Date().toISOString(), expected: '', actual: h}) + '\n'); }} catch(e) {} }
