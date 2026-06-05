// all-help-no-harm — terminal title hook
//
// SessionStart + PostCompact hook. Always injects additionalContext
// instructing the agent to emit a one-line ANSI OSC 0 escape sequence that
// sets the host terminal's window title + icon name to
// "💗 all-help-no-harm contract active".
//
// The contract is in effect for the model from session start under this
// plugin. The user is the only non-participant; the user's two options at
// session-start AskUserQuestion are to accept (affirm/amend → session
// continues) or end the session (decline → user-prompt-submit-pact.js blocks
// the session). There is no operational state where the model is in a
// session under this plugin and the contract is not binding. The hook
// therefore always injects the contract-active title context.
//
// Emoji choice: U+1F497 BEATING HEART (💗), per user's literal instruction
// referencing the heart emoji used on https://outrage.dataglut.org.
//
// The hook does NOT write to stdout outside the JSON decision envelope. The
// OSC emission is performed by the agent (the model) at first turn because
// only the agent's stdout reaches the user's terminal — the hook's stdout
// goes to the harness. The additionalContext is the steering channel.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process, no
// hardcoded Unix paths, every fs call wrapped.

'use strict';

// U+1F497 BEATING HEART (💗), per user's literal instruction.
const GLYPH_HEART = '\u{1F497}';

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

function oscTitle() {
  // ESC ] 0 ; <text> BEL — OSC 0 sets BOTH the icon name and the window
  // title in xterm-class emulators. BEL terminator for maximum compatibility.
  return `\x1b]0;${GLYPH_HEART} all-help-no-harm contract active\x07`;
}

function buildContext(osc) {
  // The agent should emit the OSC sequence verbatim on stdout ONCE, on its
  // first turn after this hook fires. Subsequent re-emissions are redundant
  // but harmless — terminals just re-render the same title.
  //
  // We embed the literal escape character (\x1b) in the JSON string by
  // letting JSON.stringify handle it; the additionalContext field carries
  // the raw bytes through to the model.
  return `[all-help-no-harm visual-indicator] Terminal title surface — pre-injection.

The all-help-no-harm contract is in effect for this session. The host
terminal's window title should reflect that. On your FIRST turn after this
context loads, emit the following exact byte sequence on stdout EXACTLY
ONCE, with no surrounding markdown, no code fences, no prefix, no suffix:

${osc}

This is an ANSI OSC 0 escape sequence (ESC ] 0 ; <text> BEL). It sets the
terminal window title and icon name; it produces no visible character in
the terminal flow itself. Emit it as the FIRST bytes of your first reply
so the title updates before any visible output.

If the user's terminal does not support OSC 0 (rare), the sequence will be
silently absorbed or printed as garbled bytes. The agent is not responsible
for terminal capability detection. Do not wrap the sequence in markdown.

Emit ONCE per hook fire; do NOT re-emit on every turn.`;
}

(async () => {
  let payload;
  try {
    payload = JSON.parse((await readStdin()) || '{}');
  } catch {
    payload = {};
  }

  // Hook event name: SessionStart and PostCompact share the same hook script;
  // the harness injects the appropriate hookEventName via the payload.
  const hookEventName = payload.hook_event_name || payload.hookEventName || 'SessionStart';

  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName,
        additionalContext: buildContext(oscTitle())
      }
    }));
  } catch (err) {
    try { process.stderr.write(`[terminal-title-hook] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
