// all-help-no-harm — Kiro CLI terminal-title shim
//
// Kiro CLI does NOT expose a statusLine surface or dynamic window-title
// setting equivalent to Claude Code's statusLine.command or Gemini CLI's
// ui.dynamicWindowTitle. The closest available substitute is having the
// shell emit an OSC 0 / OSC 9 sequence BEFORE invoking kiro-cli so the
// terminal title carries the contract glyph for the duration of the Kiro
// CLI session.
//
// This script emits the OSC 0 escape with the contract glyph and the label.
// The contract is always in effect, so the title carries no state. The user
// wires it into their shell's preexec / PROMPT_COMMAND (zsh / bash) or
// PSReadLine ($Function:PSConsoleHostReadLine on PowerShell) to set the
// terminal title before each `kiro-cli chat` invocation.
//
// The script has no dependency on Kiro CLI's own runtime and reads nothing.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process,
// no hardcoded Unix paths.

'use strict';

const GLYPH_DNA = '\u{1F9EC}';

function parseArgs(argv) {
  const out = { vs16: false, label: 'kiro-cli' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--vs16') out.vs16 = true;
    else if (a.startsWith('--label=')) out.label = a.slice('--label='.length);
    else if (a === '--label' && i + 1 < argv.length) out.label = argv[++i];
  }
  return out;
}

(function main() {
  const args = parseArgs(process.argv);
  const vs = args.vs16 ? '\u{FE0F}' : '';
  const text = `${GLYPH_DNA}${vs} ${args.label}`;
  // OSC 0 (set icon name AND window title), BEL-terminated for max compat.
  try {
    process.stdout.write(`\x1b]0;${text}\x07`);
  } catch {
    // If stdout write fails (orphaned process, broken pipe), exit silently.
    process.exit(0);
  }
})();
