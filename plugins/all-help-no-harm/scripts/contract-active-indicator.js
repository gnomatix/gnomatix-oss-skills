// all-help-no-harm — contract-active-indicator
//
// Visual UX indicator script. The contract is in effect for the model from
// the moment a session starts under this plugin. The user is the only
// non-participant; the user's two options at session start are to accept
// (affirm/amend → session continues) or end the session (decline → session
// is blocked by user-prompt-submit-contract.js and these indicators don't run).
//
// There is no operational state where the model is in a session under this
// plugin and the contract is not binding the model. The indicator therefore
// always emits when invoked.
//
// Emits:
//
//   --mode=statusline    Claude Code statusLine command output (single line):
//                        the heart alone, no text. The only mode.
//
// Emoji choice: U+1F497 BEATING HEART (💗), per the user's literal instruction
// on 2026-05-29 referencing the heart emoji used on https://outrage.dataglut.org.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process, no
// hardcoded Unix paths, every fs call wrapped in try/catch.

'use strict';

// U+1F497 BEATING HEART (💗). Per user's literal instruction referencing the
// heart emoji used on https://outrage.dataglut.org.
const GLYPH_HEART = '\u{1F497}';

// Parse argv into a flag map. Supports `--key=value` and `--key value`.
function parseArgs(argv) {
  const out = { mode: 'statusline', vs16: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--mode=')) {
      out.mode = a.slice('--mode='.length);
    } else if (a === '--mode' && i + 1 < argv.length) {
      out.mode = argv[++i];
    } else if (a === '--vs16') {
      out.vs16 = true;
    }
  }
  return out;
}

// Statusline surface string: the heart alone. Always emits — the contract is
// in effect when this runs.
function renderStateLine(withVs16) {
  const vs = withVs16 ? '\u{FE0F}' : '';
  return `${GLYPH_HEART}${vs}`;
}

(() => {
  const args = parseArgs(process.argv);

  try {
    if (args.mode === 'statusline') {
      // statusLine convention: single line. Trailing newline so the harness
      // splitter behaves identically across emulators.
      process.stdout.write(renderStateLine(args.vs16) + '\n');
    } else {
      try { process.stderr.write(`[contract-active-indicator] unknown --mode: ${args.mode}\n`); } catch { /* ignore */ }
      process.exit(2);
    }
  } catch (err) {
    try { process.stderr.write(`[contract-active-indicator] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
    process.exit(1);
  }
})();
