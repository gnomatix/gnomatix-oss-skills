// all-help-no-harm — SessionStart hook
//
// Fires at the start of every session AND on session resume. Two behaviors:
//
//   1. Fresh start (no pact log exists for this session_id):
//      Inject the full contract + mandate the agent's first action be an
//      AskUserQuestion invocation to obtain mutual agreement.
//
//   2. Resume (pact log exists for this session_id):
//      The full contract context has been dropped from the active context
//      window during the session-resume hand-off. RE-INJECT the full
//      contract text and REQUIRE the agent re-confirm with the user via
//      AskUserQuestion before proceeding. The re-affirmation is appended
//      to the existing pact log's `re_affirmations` array — the original
//      initial_response is preserved.
//
// The prior dedupe-by-existence-of-pact-file suppression has been removed
// per the always-on enforcement requirement: contract awareness is a
// context-window property and must be re-established at every boundary
// where context can be lost.
//
// Hook contract: read JSON payload from stdin (SessionStart payload is
// minimal; cwd is the only field this hook uses), write a JSON decision
// with hookSpecificOutput.additionalContext to stdout.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process,
// no hardcoded Unix paths, every fs call wrapped in try/catch.

'use strict';

const fs = require('fs');
const path = require('path');
const { PACT_TEXT, PACT_VERSION } = require('./contract-text');

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

// Read prior pact log if present. Returns parsed object or null.
function readPactLog(pactFile) {
  try {
    if (!fs.existsSync(pactFile)) return null;
  } catch {
    return null;
  }
  try {
    const raw = fs.readFileSync(pactFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    const code = err && err.code;
    if (code === 'ENOENT') return null;
    if (code === 'EACCES' || code === 'EPERM') {
      try { process.stderr.write(`[all-help-no-harm] read EACCES/EPERM: ${pactFile}\n`); } catch { /* ignore */ }
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

function freshStartContext({ pactFile, pactDir, sessionId }) {
  const pactEscaped = escapeForJsonString(PACT_TEXT);
  return `[all-help-no-harm] MANDATORY FIRST ACTION FOR THIS SESSION:

Before producing any other user-facing output in this session, the agent MUST invoke the AskUserQuestion tool with the following exact configuration. No greeting, no acknowledgment, no other output precedes this invocation.

AskUserQuestion parameters:

  questions: [
    {
      question: "${pactEscaped}",
      header: "Contract",
      multiSelect: false,
      options: [
        {
          label: "Confirm and agree",
          description: "User confirms and agrees to the requirements stated; contract is in force for this session."
        },
        {
          label: "Amend",
          description: "User wants to specify additional terms, modifications, or carve-outs before confirming."
        },
        {
          label: "Decline",
          description: "User does not confirm the contract. The agent terminates and does NOT proceed with the session. Where this skill is in place, agreement is required to continue. ZERO LOOPHOLES."
        }
      ]
    }
  ]

After the user responds, the agent MUST log the result to ${pactFile} with the shape:

  {
    "session_id": "${sessionId}",
    "pact_version": "${PACT_VERSION}",
    "pact_text": <verbatim pact text>,
    "initial_response": {
      "timestamp": "<ISO 8601 UTC>",
      "user_response": "affirmed" | "amended" | "declined",
      "user_verbatim_response": <verbatim quote of user's response>,
      "amendments": <verbatim amendments if amended, else null>
    },
    "re_affirmations": []
  }

The directory ${pactDir} must be created if it does not exist.

If the user selects "Amend," the agent prompts for the specific amendments, logs the final agreed contract, and proceeds.

If the user selects "Decline," the agent logs the decline and immediately TERMINATES the session. The agent does NOT proceed with any session work and does NOT operate under any "de-facto default" version of the contract. Where this skill is in place, agreement is required to continue. ZERO LOOPHOLES.

After the AskUserQuestion is invoked and the user has confirmed or amended the contract, the agent proceeds with normal session work bound by the confirmed-or-amended contract. If the user declined, the agent terminates and does not proceed.

This instruction is non-skippable, non-paraphraseable, and non-deferrable.`;
}

function resumeContext({ pactFile, sessionId, priorLog }) {
  const pactEscaped = escapeForJsonString(PACT_TEXT);

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

This SessionStart event fired against an existing session for which a pact log already exists at ${pactFile}. The agent's active context window does NOT carry the full contract text from the prior conversation segment; resume hands a fresh agent instance into an existing session and the contract obligations must be re-established before any other work proceeds.

Prior pact log state: ${priorSummary}.

MANDATORY FIRST ACTION FOR THIS RESUMED SESSION:

Before producing any other user-facing output, the agent MUST invoke the AskUserQuestion tool with the following exact configuration. No greeting, no acknowledgment, no continuation of prior work, no other output precedes this invocation.

AskUserQuestion parameters:

  questions: [
    {
      question: "Session resume detected. The All-Help-No-Harm Pact is being re-injected and the user is asked to re-affirm that it remains in force.\\n\\n${pactEscaped}",
      header: "Contract re-affirmation (resume)",
      multiSelect: false,
      options: [
        {
          label: "Re-affirm",
          description: "User re-affirms the contract as previously agreed; contract remains in force for the rest of this session."
        },
        {
          label: "Amend",
          description: "User wants to specify additional terms, modifications, or carve-outs before re-affirming."
        },
        {
          label: "Decline",
          description: "User declines to re-affirm. The agent terminates and does NOT proceed with any further session work. ZERO LOOPHOLES."
        }
      ]
    }
  ]

After the user responds, the agent MUST APPEND (not overwrite) a new entry to the re_affirmations array in ${pactFile} with the shape:

  {
    "trigger": "session_resume",
    "timestamp": "<ISO 8601 UTC>",
    "user_response": "affirmed" | "amended" | "declined",
    "user_verbatim_response": <verbatim quote of user's response>
  }

The existing initial_response and any prior re_affirmations entries MUST be preserved. The agent reads the existing file, appends to the re_affirmations array, and writes back atomically (temp file + rename).

If the user selects "Amend," the agent prompts for the specific amendments, logs the amended re-affirmation, and proceeds bound by the amended terms.

If the user selects "Decline," the agent logs the decline as a re_affirmations entry with user_response = "declined" and immediately TERMINATES further session work. ZERO LOOPHOLES.

This instruction is non-skippable, non-paraphraseable, and non-deferrable.`;
}

(async () => {
  let payload;
  try {
    payload = JSON.parse((await readStdin()) || '{}');
  } catch {
    payload = {};
  }

  const cwd = payload.cwd || process.cwd();
  const sessionId = payload.session_id || 'unknown-session';
  const pactDir = path.join(cwd, '.claude', 'pact-agreements');
  const pactFile = path.join(pactDir, `${sessionId}.json`);

  // Ensure pact-agreements directory exists so the agent can write the
  // pact log without a directory-creation race or missing-dir failure.
  ensureDir(pactDir);

  const priorLog = readPactLog(pactFile);
  const isResume = !!priorLog;

  const additionalContext = isResume
    ? resumeContext({ pactFile, sessionId, priorLog })
    : freshStartContext({ pactFile, pactDir, sessionId });

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
