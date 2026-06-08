#!/usr/bin/env node
// did-you-rtfm-user-reviewed-trigger-confirmation — PreToolUse hook on Bash / PowerShell
//
// HARD enforcement of the did-you-rtfm user-review gate.
//
// A command matching a signal-suppression / workaround pattern is DENIED and stays
// denied UNLESS the session transcript proves the user was prompted about THIS exact
// command via the AskUserQuestion tool AND explicitly chose the override option.
//   - The review is bound to a fingerprint of the exact command, so reusing another
//     command's review — or restructuring the command to dodge the matcher — re-locks it.
//   - The user's ANSWER governs: an explicit "proceed/override" selection clears the
//     gate; a "stop" answer, or no answer, keeps it blocked. The agent cannot clear the
//     gate itself, because it cannot fabricate the user's answer in the transcript.
//
// Project owner's spec (verbatim intent): "THE USER IS PROMPTED VIA THE ASKUSER TOOL.
// NOT OPTIONAL." Block automatically if the AskUser tool was not invoked; do not run if
// the user did not authorize.
//
// Hook contract: read JSON from stdin; write a JSON decision to stdout.
// `permissionDecision: "deny"` blocks the tool call.

'use strict';
const fs = require('fs');

const TRIGGER_PATTERNS = [
  // ── Signal-suppression flags whose role is to silence a check / verification / refusal ──
  { name: '--no-verify',       re: /(?<![A-Za-z0-9_-])--no-verify\b/ },
  { name: '--force flag',      re: /(?<![A-Za-z0-9_-])--force\b/ },
  { name: '--skip-* family',   re: /(?<![A-Za-z0-9_-])--skip-[a-z][a-z0-9-]*/ },
  { name: '--allow-* family',  re: /(?<![A-Za-z0-9_-])--allow-[a-z][a-z0-9-]*/ },
  { name: '--ignore-* family', re: /(?<![A-Za-z0-9_-])--ignore-[a-z][a-z0-9-]*/ },

  // ── TTY-faking / interactive-prompt workarounds ──
  { name: 'script(1) TTY-faking',             re: /\bscript\s+(?:-q\s+|-qc\s+|-c\s+)/ },
  { name: 'expect(1) interactive automation', re: /\bexpect\s+(?:-c\b|-f\b|<<)/ },
  { name: 'echo|sudo -S password piping',     re: /\becho\s+[^|]{1,200}\|\s*sudo\s+-S\b/ },
  { name: 'unbuffer / stdbuf TTY workaround', re: /\b(?:unbuffer|stdbuf)\s+(?:-[oeiL0]|-[oeiL]\s)/ },
];

// Tokens the agent MUST embed in the AskUserQuestion it raises:
//   - REVIEW_MARKER + the command fingerprint go in the QUESTION text (binds to this command).
//   - PROCEED_TOKEN goes ONLY in the override option's LABEL — never in the question — so the
//     user's recorded answer contains it iff the user actually selected the override option.
const REVIEW_MARKER = 'did-you-rtfm-review';
const PROCEED_TOKEN = 'RTFM-USER-OVERRIDE-PROCEED';

// Deterministic, dependency-free fingerprint of the exact command (FNV-1a 32-bit, salted
// with length). Pure JS per the repo's pure-Node hook requirement — no crypto/child_process.
function fingerprint(cmd) {
  let h = 0x811c9dc5;
  for (let i = 0; i < cmd.length; i++) { h ^= cmd.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return `${(h >>> 0).toString(16).padStart(8, '0')}-${cmd.length}`;
}

function readStdin() {
  return new Promise((resolve) => {
    let d = '';
    process.stdin.on('data', (c) => { d += c; });
    process.stdin.on('end', () => resolve(d));
    process.stdin.on('error', () => resolve(''));
  });
}

// Returns 'proceed' | 'blocked' | 'none'.
//   'proceed' — an AskUserQuestion carrying REVIEW_MARKER + fp was answered by the user
//               with a selection containing PROCEED_TOKEN (explicit override).
//   'blocked' — such a question was answered, but NOT with the override selection (user said stop).
//   'none'    — no such question was asked (or transcript unreadable). Fails CLOSED.
function reviewState(transcriptPath, fp) {
  if (!transcriptPath || typeof transcriptPath !== 'string') return 'none';
  let raw;
  try {
    if (!fs.existsSync(transcriptPath)) return 'none';
    raw = fs.readFileSync(transcriptPath, 'utf8');
  } catch (err) {
    try { process.stderr.write(`[did-you-rtfm] transcript read failed: ${err && err.code}\n`); } catch (_) {}
    return 'none';
  }
  const lines = raw.split(/\r?\n/);
  const askIds = new Set();
  // Pass 1 — AskUserQuestion calls that reference THIS exact command.
  for (const line of lines) {
    if (!line) continue;
    let rec; try { rec = JSON.parse(line); } catch (_) { continue; }
    if (!rec || rec.type !== 'assistant' || !rec.message) continue;
    const content = rec.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c && c.type === 'tool_use' && c.name === 'AskUserQuestion' && c.id) {
        let blob = ''; try { blob = JSON.stringify(c.input || {}); } catch (_) {}
        if (blob.indexOf(REVIEW_MARKER) !== -1 && blob.indexOf(fp) !== -1) askIds.add(c.id);
      }
    }
  }
  if (askIds.size === 0) return 'none';
  // Pass 2 — the user's ANSWER to one of those calls decides.
  let answered = false;
  for (const line of lines) {
    if (!line) continue;
    let rec; try { rec = JSON.parse(line); } catch (_) { continue; }
    if (!rec || rec.type !== 'user' || !rec.message) continue;
    const content = rec.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c && c.type === 'tool_result' && askIds.has(c.tool_use_id)) {
        answered = true;
        let txt = '';
        try { txt = typeof c.content === 'string' ? c.content : JSON.stringify(c.content); } catch (_) {}
        if (txt.indexOf(PROCEED_TOKEN) !== -1) return 'proceed';
      }
    }
  }
  return answered ? 'blocked' : 'none';
}

function pass() {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse' } }));
}

function deny(matchName, command, fp, state) {
  const cmdShown = command.length > 200 ? command.slice(0, 200) + '…' : command;
  const why = state === 'blocked'
    ? `The user was asked about this command and did NOT authorize it. Do not run it — surface the underlying problem with evidence instead.`
    : `The user has not been prompted about this command yet.`;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `RTFM trigger matched (${matchName}). BLOCKED. ${why}\n\n` +
        `Command: ${cmdShown}\n\n` +
        `You may NOT self-clear this, and rewriting the command to dodge the matcher re-locks it ` +
        `(the fingerprint changes). The user must be prompted via the AskUserQuestion tool — mandatory.\n\n` +
        `To obtain a decision, invoke AskUserQuestion now:\n` +
        `  - the QUESTION text MUST contain both tokens: "${REVIEW_MARKER}   fp:${fp}"\n` +
        `  - offer two options; the override option's LABEL MUST contain "${PROCEED_TOKEN}" ` +
        `(e.g. "Proceed — I authorize this exact command (${PROCEED_TOKEN})"), and the other option ` +
        `MUST NOT contain it (e.g. "Stop — do not run").\n` +
        `This gate clears for this exact command ONLY if the user selects the override option; ` +
        `any other answer keeps it blocked. There is no other way past it.`,
    },
  }));
}

(async () => {
  let payload;
  try { payload = JSON.parse(await readStdin()); } catch (_) { return pass(); }
  const tool = payload && payload.tool_name;
  if (tool !== 'Bash' && tool !== 'PowerShell') return pass();
  const command = payload.tool_input && payload.tool_input.command;
  if (!command || typeof command !== 'string') return pass();

  for (const { name, re } of TRIGGER_PATTERNS) {
    if (re.test(command)) {
      const fp = fingerprint(command);
      const state = reviewState(payload.transcript_path, fp);
      if (state === 'proceed') return pass();
      return deny(name, command, fp, state);
    }
  }
  return pass();
})();
