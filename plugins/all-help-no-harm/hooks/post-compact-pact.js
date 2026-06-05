// all-help-no-harm — PostCompact hook
//
// Fires after a context-compaction event. Compaction collapses the active
// context window into a summary; the verbatim contract text is dropped. The
// agent's awareness of contract obligations degrades the moment compaction
// completes.
//
// This hook re-injects the full contract text into the post-compact
// additionalContext and MANDATES the agent's next user-facing action be an
// AskUserQuestion invocation re-confirming the contract is in force. The
// re-affirmation is APPENDED to the existing pact log's re_affirmations
// array at .claude/pact-agreements/<session-id>.json — the original
// initial_response is preserved.
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
    return null;
  }
}

function escapeForJsonString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

function buildContext({ pactFile, sessionId, summary, priorLog }) {
  const pactEscaped = escapeForJsonString(PACT_TEXT);

  let priorSummary;
  if (!priorLog) {
    priorSummary = 'NO PRIOR PACT LOG FOUND for this session. Compaction occurred without a logged initial agreement on file — the agent MUST treat this re-affirmation as the contract-establishment event and create the pact log fresh as part of the re-affirmation handling.';
  } else {
    const initial = priorLog.initial_response;
    if (initial && typeof initial === 'object') {
      priorSummary = `Prior initial_response: "${initial.user_response || 'unknown'}" at ${initial.timestamp || 'unknown-timestamp'}. Existing re_affirmations count: ${Array.isArray(priorLog.re_affirmations) ? priorLog.re_affirmations.length : 0}.`;
    } else if (priorLog.user_response) {
      priorSummary = `Prior (legacy-shape) response: "${priorLog.user_response}" at ${priorLog.timestamp || 'unknown-timestamp'}. The agent SHOULD migrate the file shape to the current structure when appending the re_affirmation: preserve the prior response under initial_response, initialize re_affirmations as an array, and append this entry.`;
    } else {
      priorSummary = 'Prior pact log exists but is in an unexpected shape; treat as a fresh re-affirmation event and preserve prior content.';
    }
  }

  const summaryNote = summary
    ? `Compaction summary handed to this hook (informational only — does NOT substitute for the verbatim contract text re-injected below):\n\n${String(summary).slice(0, 4000)}`
    : 'No compaction summary was provided to this hook.';

  return `[all-help-no-harm] POST-COMPACT — CONTRACT RE-INJECTION + RE-AFFIRMATION REQUIRED:

Context compaction just completed for this session. Compaction collapses the active context window into a summary and the verbatim contract text has been dropped. The agent's awareness of contract obligations has degraded the moment compaction completed. The contract being "always-on" requires re-injection of the full text and re-affirmation by the user at this boundary.

Pact log location for this session: ${pactFile}
${priorSummary}

${summaryNote}

MANDATORY NEXT ACTION:

Before producing any other user-facing output or resuming any prior work item, the agent MUST invoke the AskUserQuestion tool with the following exact configuration. No greeting, no acknowledgment, no continuation of the pre-compaction task, no other output precedes this invocation.

AskUserQuestion parameters:

  questions: [
    {
      question: "Context compaction just occurred. The full All-Help-No-Harm Pact is being re-injected and the user is asked to re-affirm that it remains in force.\\n\\n${pactEscaped}",
      header: "Contract re-affirmation (post-compact)",
      multiSelect: false,
      options: [
        {
          label: "Re-affirm",
          description: "User re-affirms the contract; contract remains in force for the rest of this session."
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
    "trigger": "post_compact",
    "timestamp": "<ISO 8601 UTC>",
    "user_response": "affirmed" | "amended" | "declined",
    "user_verbatim_response": <verbatim quote of user's response>
  }

The existing initial_response and any prior re_affirmations entries MUST be preserved. The agent reads the existing file, appends to the re_affirmations array, and writes back atomically (temp file + rename) so a crash mid-write does not corrupt the log.

If no prior pact log exists, the agent creates one with the full current shape — initial_response left null, re_affirmations seeded with this entry — and notes in the response that the contract is being established post-compact rather than at session-start.

If the user selects "Amend," the agent prompts for the specific amendments, logs the amended re-affirmation, and proceeds bound by the amended terms.

If the user selects "Decline," the agent logs the decline and immediately TERMINATES further session work. ZERO LOOPHOLES.

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
  const summary = payload.summary || payload.compaction_summary || '';
  const pactDir = path.join(cwd, '.claude', 'pact-agreements');
  const pactFile = path.join(pactDir, `${sessionId}.json`);

  ensureDir(pactDir);

  const priorLog = readPactLog(pactFile);

  const additionalContext = buildContext({ pactFile, sessionId, summary, priorLog });

  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostCompact',
        additionalContext: additionalContext,
      }
    }));
  } catch (err) {
    try { process.stderr.write(`[all-help-no-harm] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
