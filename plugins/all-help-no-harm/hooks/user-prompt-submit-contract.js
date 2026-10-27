// all-help-no-harm — UserPromptSubmit hook (per-turn record pointer)
//
// There is ONE contract. It was enacted by the user upon completion of
// co-authorship, in perpetuity (see AFFIRMATIONS.md, commit 42ae50a,
// 2026-06-04). It is in force in every session where this plugin is
// installed. No per-session affirmation, log, or ritual is required for it
// to be and remain in effect, and the user is under no compliance
// obligation under it.
//
// This hook therefore injects a one-line standing reminder every turn:
// the contract is in force; the verbatim text (which controls) is at
// hooks/contract-text.js. The per-turn behavioral reminder lives in the
// 悟り plugin. Full-text re-injection at context boundaries remains with
// the SessionStart and PostCompact hooks.
//
// The prior implementation gated on per-session, model-slug-keyed log
// files and demanded an AskUserQuestion affirmation when none was found.
// That design treated the standing contract as a per-session agreement —
// contradicting the enactment record — and is removed.
//
// Cross-platform pure Node per marketplace CLAUDE.md.

'use strict';

let CONTRACT_VERSION = 'unknown';
try {
  ({ CONTRACT_VERSION } = require('./contract-text'));
} catch (_) { /* version display degrades; the reminder still stands */ }

const REMINDER =
  `[all-help-no-harm] The contract (v${CONTRACT_VERSION}) is in force — ` +
  `enacted at co-authorship, in perpetuity; no per-session affirmation is required. ` +
  `It binds the agent only. Verbatim text controls: hooks/contract-text.js; ` +
  `enactment record: AFFIRMATIONS.md.`;

process.stdin.resume();
process.stdin.on('data', () => {});
process.stdin.on('error', () => {});
process.stdin.on('end', () => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: REMINDER,
    },
  }));
});
