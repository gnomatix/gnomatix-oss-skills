// all-help-no-harm — Kiro CLI terminal-title shim
//
// Kiro CLI does NOT expose a statusLine surface or dynamic window-title
// setting equivalent to Claude Code's statusLine.command or Gemini CLI's
// ui.dynamicWindowTitle. The closest available substitute is having the
// shell emit an OSC 0 / OSC 9 sequence BEFORE invoking kiro-cli so the
// terminal title carries the contract glyph for the duration of the Kiro
// CLI session.
//
// This script emits the OSC 0 escape for the all-help-no-harm contract
// active state. The user wires it into their shell's preexec / PROMPT_COMMAND
// (zsh / bash) or PSReadLine ($Function:PSConsoleHostReadLine on PowerShell)
// to set the terminal title before each `kiro-cli chat` invocation.
//
// The script intentionally has no dependency on Kiro CLI's own runtime; it
// reads the same per-session contract log the Claude Code statusLine reads
// (${cwd}/.claude/contract-agreements/<id>.json or env override).
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process,
// no hardcoded Unix paths, every fs call wrapped in try/catch.

'use strict';

const fs = require('fs');
const path = require('path');

const GLYPH_DNA = '\u{1F9EC}';
const GLYPH_STOP = '\u{26D4}';

function parseArgs(argv) {
  const out = { log: null, vs16: false, label: 'kiro-cli' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--log=')) out.log = a.slice('--log='.length);
    else if (a === '--log' && i + 1 < argv.length) out.log = argv[++i];
    else if (a === '--vs16') out.vs16 = true;
    else if (a.startsWith('--label=')) out.label = a.slice('--label='.length);
    else if (a === '--label' && i + 1 < argv.length) out.label = argv[++i];
  }
  return out;
}

function resolveLogPath(args) {
  if (args.log && typeof args.log === 'string') return args.log;
  const envPath = process.env.CLAUDE_SESSION_LOG_PATH;
  if (envPath && typeof envPath === 'string' && envPath.length > 0) return envPath;
  // No session id available outside Claude Code's statusLine payload, so
  // fall back to the most-recently-modified contract log in the project's
  // .claude/contract-agreements/ directory.
  try {
    const dir = path.join(process.cwd(), '.claude', 'contract-agreements');
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => {
        const p = path.join(dir, d.name);
        let mtime = 0;
        try { mtime = fs.statSync(p).mtimeMs; } catch { /* ignore */ }
        return { path: p, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return entries.length > 0 ? entries[0].path : null;
  } catch {
    return null;
  }
}

function readState(logPath) {
  if (!logPath) return 'pending';
  try {
    if (!fs.existsSync(logPath)) return 'pending';
  } catch {
    return 'pending';
  }
  let raw;
  try {
    raw = fs.readFileSync(logPath, 'utf8');
  } catch {
    return 'pending';
  }
  let log;
  try {
    log = JSON.parse(raw);
  } catch {
    return 'pending';
  }
  const reAff = Array.isArray(log.re_affirmations) ? log.re_affirmations : [];
  const last = reAff.length > 0 ? reAff[reAff.length - 1] : null;
  const effective = (last && last.user_response) || (log.initial_response && log.initial_response.user_response) || log.user_response;
  if (effective === 'affirmed' || effective === 'amended' || effective === 're-affirmed') return 'active';
  if (effective === 'declined') return 'declined';
  return 'pending';
}

(function main() {
  const args = parseArgs(process.argv);
  const state = readState(resolveLogPath(args));
  const glyph = state === 'declined' ? GLYPH_STOP : GLYPH_DNA;
  const vs = args.vs16 ? '\u{FE0F}' : '';
  const text = `${glyph}${vs} ${args.label} — contract ${state}`;
  // OSC 0 (set icon name AND window title), BEL-terminated for max compat.
  try {
    process.stdout.write(`\x1b]0;${text}\x07`);
  } catch {
    // If stdout write fails (orphaned process, broken pipe), exit silently.
    process.exit(0);
  }
})();
