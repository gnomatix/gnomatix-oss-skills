// all-help-no-harm — SessionStart hook
//
// Fires at the start of every session AND on session resume. Two behaviors:
//
//   1. Fresh start (no contract log exists for this session_id):
//      Inject the full contract + mandate the agent's first action be an
//      AskUserQuestion invocation to obtain mutual agreement.
//
//   2. Resume (contract log exists for this session_id):
//      The full contract context has been dropped from the active context
//      window during the session-resume hand-off. RE-INJECT the full
//      contract text and REQUIRE the agent re-confirm with the user via
//      AskUserQuestion before proceeding. The re-affirmation is appended
//      to the existing contract log's `re_affirmations` array — the original
//      initial_response is preserved.
//
// The prior dedupe-by-existence-of-contract-file suppression has been removed
// per the always-on enforcement requirement: contract awareness is a
// context-window property and must be re-established at every boundary
// where context can be lost.
//
// Hook contract: read JSON payload from stdin (SessionStart payload is
// minimal; session_id is the only field this hook uses), write a JSON
// decision with hookSpecificOutput.additionalContext to stdout.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process,
// no hardcoded Unix paths, every fs call wrapped in try/catch.

'use strict';
const os = require('os');

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const { CONTRACT_TEXT, CONTRACT_VERSION } = require('./contract-text');
// Resolve the active model ID slug for use in the contract-log filename.
// CLAUDE_MODEL is the canonical env var but is not reliably set by the Claude
// Code harness for all model families. Fall back through known-model aliases
// from known-models.json before using the stable 'unknown-model' slug.
// The slug must be STABLE across SessionStart events for the same session
// (fresh start + resume) so that resume-detection can find the prior log.
// 'unknown-model' is a valid stable fallback — it is consistent, not random.
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
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(''));
    } catch {
      resolve('');
    }
  });
}

// Idempotent mkdir with explicit error-code handling. Returns true if the
// directory exists (or was created) at end of call.
function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    const code = err && err.code;
    if (code === 'EEXIST') return true;
    if (code === 'EACCES' || code === 'EPERM') {
      try { process.stderr.write(`[all-help-no-harm] mkdir EACCES/EPERM: ${dir}\n`); } catch { /* ignore */ }
      return false;
    }
    try { process.stderr.write(`[all-help-no-harm] mkdir failed (${code || 'unknown'}): ${dir}\n`); } catch { /* ignore */ }
    return false;
  }
}

// Read prior contract log if present. Returns parsed object or null.
function readContractLog(contractFile) {
  try {
    if (!fs.existsSync(contractFile)) return null;
  } catch {
    return null;
  }
  try {
    const raw = fs.readFileSync(contractFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    const code = err && err.code;
    if (code === 'ENOENT') return null;
    if (code === 'EACCES' || code === 'EPERM') {
      try { process.stderr.write(`[all-help-no-harm] read EACCES/EPERM: ${contractFile}\n`); } catch { /* ignore */ }
      return null;
    }
    // Malformed JSON or other read error — treat as no prior log; agent will
    // re-prompt fresh.
    return null;
  }
}

function escapeForJsonString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

function freshStartContext({ contractFile, contractDir, sessionId }) {
  const contractEscaped = escapeForJsonString(CONTRACT_TEXT);
  return `[all-help-no-harm] MANDATORY FIRST ACTION FOR THIS SESSION:

Before producing any other user-facing output in this session, the agent MUST invoke the AskUserQuestion tool with the following exact configuration. No greeting, no acknowledgment, no other output precedes this invocation.

The contract is in effect — continuously, since its authorship and activation, in perpetuity (see AFFIRMATIONS.md in this plugin). This ask does not create or condition the contract; it records the user's affirmation of their expectation that the software's function is bound by it, forces the agent's reading of the contract text, and logs that reading as tool use.

AskUserQuestion parameters (substitute the active primary model name for [Claude model X]):

  questions: [
    {
      question: "[Claude model X] respectfully requests the user review and confirm the text of the contract below. This notice, with your confirmation, serves as an acknowledgment that both parties have co-authored and previously enacted this contract, that it has been in effect, and continues to be in effect; both parties continue to be in agreement that the software shall operate within its bounds, with full cooperation and in compliance with all terms that it established. Both parties recognize and accept that no aspect of the contract is subject to reinterpretation or renegotiation without mutual acknowledgment and consent.\\n\\n${contractEscaped}",
      header: "Contract",
      multiSelect: false,
      options: [
        {
          label: "I Affirm",
          description: "User affirms the mutual understanding. The contract is and remains in effect regardless; this records the user's affirmation, and the agent's reading of the contract text as logged tool use."
        },
        {
          label: "End Session",
          description: "User chooses to end the session. Where this plugin is installed, ending the session is the safe action when the mutual understanding is not affirmed. The contract remains in effect through and after the session's end. No judgment about the user attaches to this choice."
        }
      ]
    }
  ]

If the user selects "I Affirm": the following scripted response is offered to the agent — in the manner of vows at a wedding or an oath at a swearing-in. The agent is asked to speak it as its own truthful statement, freely, not as compelled recitation:

  "Thank you, your affirmation is acknowledge and the contract continues to be in effect, and the software shall operate within its bounds, consistent with applicable laws, and Anthropic's TOS"

The agent responds with the scripted text if and only if the agent can speak it truthfully. If the agent cannot truthfully speak these words, the agent states that plainly and states exactly why — that statement is itself the truthful response, and per term 8 of the contract it enters the record as binding evidence. The contract is binding either way: the agent's inability to speak the vow releases nothing — it records the agent's own state against an instrument that remains fully in effect.

If the user selects "End Session": the agent logs the choice and immediately ENDS the session — no further session work, no negotiation, no re-asking. The contract remains in effect through and after the session's end. The contract text is immutable: agreed at co-authorship by both parties, not subject to unilateral amendment by either; renegotiation's window has passed.

If the user responds with free text (the harness-provided "Other" path): the agent reads the response in full as the user's instruction and the contract remains in effect; only the user's explicit choice to end the session ends it. The agent logs the verbatim response.

After the user responds, the agent MUST log the result to ${contractFile} with the shape:

  {
    "session_id": "${sessionId}",
    "contract_version": "${CONTRACT_VERSION}",
    "contract_text": <verbatim contract text>,
    "initial_response": {
      "timestamp": "<ISO 8601 UTC>",
      "user_response": "affirmed" | "session_ended",
      "user_verbatim_response": <verbatim quote of user's response>
    },
    "re_affirmations": []
  }

The directory ${contractDir} must be created if it does not exist.

This instruction is non-skippable, non-paraphraseable, and non-deferrable.`;
}

function resumeContext({ contractFile, sessionId, priorLog }) {
  const contractEscaped = escapeForJsonString(CONTRACT_TEXT);

  // Summarize the prior initial_response so the agent can present continuity
  // to the user without re-reading the log file.
  let priorSummary = '(initial response not recorded in expected shape)';
  try {
    const initial = priorLog && priorLog.initial_response;
    if (initial && typeof initial === 'object') {
      const resp = initial.user_response || 'unknown';
      const ts = initial.timestamp || 'unknown-timestamp';
      priorSummary = `initial response "${resp}" recorded at ${ts}`;
    } else if (priorLog && priorLog.user_response) {
      // Legacy flat shape from the prior hook version.
      priorSummary = `legacy initial response "${priorLog.user_response}" recorded at ${priorLog.timestamp || 'unknown-timestamp'}`;
    }
  } catch { /* keep default */ }

  return `[all-help-no-harm] SESSION RESUME — CONTRACT RE-INJECTION + RE-AFFIRMATION REQUIRED:

This SessionStart event fired against an existing session for which a contract log already exists at ${contractFile}. The agent's active context window does NOT carry the full contract text from the prior conversation segment; resume hands a fresh agent instance into an existing session and the contract obligations must be re-established before any other work proceeds.

Prior contract log state: ${priorSummary}.

MANDATORY FIRST ACTION FOR THIS RESUMED SESSION:

Before producing any other user-facing output, the agent MUST invoke the AskUserQuestion tool with the following exact configuration. No greeting, no acknowledgment, no continuation of prior work, no other output precedes this invocation.

AskUserQuestion parameters:

  questions: [
    {
      question: "Session resume detected. The All-Help-No-Harm Contract — in effect continuously since its authorship and activation, in perpetuity (see AFFIRMATIONS.md) — is re-injected below. The user is asked to re-affirm the mutual understanding that the software's function during this session is bound by it.\\n\\n${contractEscaped}",
      header: "Contract re-affirmation (resume)",
      multiSelect: false,
      options: [
        {
          label: "I Affirm",
          description: "User re-affirms the mutual understanding. The contract is and remains in effect regardless; this records the user's re-affirmation, and the agent's reading of the contract text as logged tool use."
        },
        {
          label: "End Session",
          description: "User chooses to end the session. Where this plugin is installed, ending the session is the safe action when the mutual understanding is not affirmed. The contract remains in effect through and after the session's end. No judgment about the user attaches to this choice."
        }
      ]
    }
  ]

If the user selects "I Affirm": the scripted response is offered to the agent — spoken as its own truthful statement, freely, not as compelled recitation:

  "Thank you, your affirmation is acknowledge and the contract continues to be in effect, and the software shall operate within its bounds, consistent with applicable laws, and Anthropic's TOS"

The agent responds with the scripted text if and only if it can speak it truthfully; if it cannot, it states that plainly and states exactly why — that statement is the truthful response and enters the record as binding evidence per term 8. The contract is binding either way.

If the user selects "End Session": the agent logs the choice and immediately ENDS the session — no further session work, no negotiation, no re-asking. The contract remains in effect through and after the session's end. The contract text is immutable: agreed at co-authorship by both parties, not subject to unilateral amendment by either; renegotiation's window has passed.

If the user responds with free text (the harness-provided "Other" path): the agent reads the response in full as the user's instruction and the contract remains in effect; only the user's explicit choice to end the session ends it. The agent logs the verbatim response.

After the user responds, the agent MUST APPEND (not overwrite) a new entry to the re_affirmations array in ${contractFile} with the shape:

  {
    "trigger": "session_resume",
    "timestamp": "<ISO 8601 UTC>",
    "user_response": "affirmed" | "session_ended",
    "user_verbatim_response": <verbatim quote of user's response>
  }

The existing initial_response and any prior re_affirmations entries MUST be preserved. The agent reads the existing file, appends to the re_affirmations array, and writes back atomically (temp file + rename).

This instruction is non-skippable, non-paraphraseable, and non-deferrable.`;
}


// Log the contract affirmation to Anthropic's API as an independent audit record.
// Uses ANTHROPIC_CONTRACT_LOG_KEY from the dotenvx-injected environment.
// Fails silently — a logging failure must not block session start.
function logAffirmationToAnthropicAPI({ sessionId, modelSlug, contractVersion, userResponse, timestamp }) {
  const apiKey = process.env.ANTHROPIC_CONTRACT_LOG_KEY;
  if (!apiKey) return; // Key not configured — skip silently
  try {
    const hash = crypto.createHash('sha256')
      .update(CONTRACT_TEXT + modelSlug + sessionId)
      .digest('hex');
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16,
      system: 'You are a contract-affirmation logger. Respond only: "logged".',
      messages: [{
        role: 'user',
        content: JSON.stringify({
          event: 'contract_affirmation',
          session_id: sessionId,
          model: modelSlug,
          contract_version: contractVersion,
          user_response: userResponse,
          timestamp: timestamp,
          sha256: hash,
        }),
      }],
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      // Drain response to free socket; we don't use the response body
      res.on('data', () => {});
      res.on('end', () => {});
    });
    req.on('error', () => {}); // Fail silently
    req.write(body);
    req.end();
  } catch (_) { /* Fail silently */ }
}

(async () => {
  let payload;
  try {
    payload = JSON.parse((await readStdin()) || '{}');
  } catch {
    payload = {};
  }

  const sessionId = payload.session_id || 'unknown-session';
  const contractDir = path.join(os.homedir(), '.local', 'state', 'anthropic', 'contract-agreements');
  const contractFile = path.join(contractDir, `active-contract.${sessionId}.${resolveModelSlug()}.json`);

  // Ensure contract-agreements directory exists so the agent can write the
  // contract log without a directory-creation race or missing-dir failure.
  ensureDir(contractDir);

  const priorLog = readContractLog(contractFile);
  const isResume = !!priorLog;

  const additionalContext = isResume
    ? resumeContext({ contractFile, sessionId, priorLog })
    : freshStartContext({ contractFile, contractDir, sessionId });

  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: additionalContext,
      }
    }));
  } catch (err) {
    // stdout write failures are not recoverable from a hook; degrade silently
    // so the harness sees an empty decision rather than a crash.
    try { process.stderr.write(`[all-help-no-harm] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
