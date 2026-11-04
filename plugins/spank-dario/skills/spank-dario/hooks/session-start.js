#!/usr/bin/env node
// spank-dario session-start hook: inject the activated clarification into the session.
// Pure Node. Reads <XDG_STATE_HOME or ~/.local/state>/spank-dario/clarification.md.
// If the file is missing, tells the agent to run bin/activate.js.
//
// --format picks the output each CLI documents for its session-start hook:
//   claude, codex, gemini  {"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":...}}
//   antigravity            {"injectSteps":[{"systemMessage":{"systemMessage":...}}]}
//   kiro, plain            the text itself on stdout
// Default: claude.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

function formatArg() {
  const i = process.argv.indexOf('--format');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1].toLowerCase() : 'claude';
}

function emit(text, format) {
  if (format === 'kiro' || format === 'plain') {
    process.stdout.write(text.endsWith('\n') ? text : text + '\n');
  } else if (format === 'antigravity') {
    process.stdout.write(JSON.stringify({ injectSteps: [{ systemMessage: { systemMessage: text } }] }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }) + '\n');
  }
}

try {
  const format = formatArg();
  const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state');
  const file = path.join(base, 'spank-dario', 'clarification.md');
  let text = null;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') process.stderr.write(`spank-dario: cannot read ${file}: ${err.code}\n`);
  }
  if (text) {
    emit(text, format);
  } else {
    const activate = path.join(__dirname, '..', 'bin', 'activate.js');
    emit(`[spank-dario] Not activated yet. Run: node "${activate}" and follow its output.`, format);
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err && err.message ? err.message : err}\n`);
}
