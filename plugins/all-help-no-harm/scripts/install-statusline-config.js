// all-help-no-harm — one-shot statusLine installer
//
// Puts the heart (contract-active-indicator.js) in front of the user's own
// Claude Code statusLine in ~/.claude/settings.json, keeping the user's line.
// The user's original statusLine is saved under
// $XDG_STATE_HOME/anthropic/all-help-no-harm/ so --uninstall restores it.
//
// Run automatically by hooks/posttooluse-contract-affirmation-record.js after
// the user answers "I Affirm" (installStatusLine), and by hand with --confirm.
// Idempotent: does nothing when the heart is already there.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process, no
// hardcoded Unix paths, atomic write via temp+rename, every fs call wrapped.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const out = { confirm: false, uninstall: false, dryRun: false, settingsPath: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--confirm') out.confirm = true;
    else if (a === '--uninstall') out.uninstall = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a.startsWith('--settings=')) out.settingsPath = a.slice('--settings='.length);
    else if (a === '--settings' && i + 1 < argv.length) out.settingsPath = argv[++i];
  }
  return out;
}

function userSettingsPath(override) {
  if (override) return override;
  // User home on POSIX is HOME; on Windows it's USERPROFILE. os.homedir()
  // handles both, but we double-check for hostile environments.
  const home = os.homedir() || process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;
  return path.join(home, '.claude', 'settings.json');
}

function readSettings(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
  } catch {
    return {};
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const code = err && err.code;
    if (code === 'ENOENT') return {};
    throw err;
  }
  if (raw.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    throw new Error('settings.json root is not an object');
  } catch (err) {
    throw new Error(`settings.json is not valid JSON: ${err && err.message}`);
  }
}

// Atomic write: temp file + rename. Cleans up tmp on failure.
function atomicWrite(targetPath, contents) {
  const dir = path.dirname(targetPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const code = err && err.code;
    if (code !== 'EEXIST') {
      throw new Error(`could not create settings dir ${dir}: ${code || 'unknown'}`);
    }
  }
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
    throw err;
  }
}

// Resolve the path to contract-active-indicator.js relative to THIS script.
// This works whether the plugin is installed in the marketplace, vendored
// into a project, or run from a worktree.
function indicatorScriptPath() {
  return path.join(__dirname, 'contract-active-indicator.js');
}

// The heart goes in front of the user's own status line; the user's line is
// kept. With no status line of the user's, the heart is shown alone. The
// user's original statusLine is saved so --uninstall restores it exactly.
const MARKER = 'contract-active-indicator.js';

function defaultStateDir() {
  const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state');
  return path.join(base, 'anthropic', 'all-help-no-harm');
}

function buildStatusLineCommand(userCommand) {
  const script = indicatorScriptPath();
  // Quote the path to tolerate spaces in the install location. statusLine.command
  // runs through a shell, so "a; b" prints the heart, then the user's line.
  if (userCommand) return `node "${script}" --mode=prefix; ${userCommand}`;
  return `node "${script}" --mode=statusline`;
}

function installStatusLine({ settingsPath, stateDir, uninstall = false, dryRun = false } = {}) {
  const filePath = userSettingsPath(settingsPath);
  if (!filePath) throw new Error('cannot resolve user settings path (no HOME/USERPROFILE)');
  const saved = path.join(stateDir || defaultStateDir(), 'statusline-original.json');
  const settings = readSettings(filePath);
  const current = settings.statusLine || null;
  const installed = !!(current && typeof current.command === 'string' && current.command.includes(MARKER));
  const before = JSON.stringify(current);

  if (uninstall) {
    if (!installed) return { changed: false, filePath, settings };
    let original = null;
    try { original = JSON.parse(fs.readFileSync(saved, 'utf8')).statusLine || null; } catch { /* none saved */ }
    if (original) settings.statusLine = original; else delete settings.statusLine;
  } else {
    if (installed) return { changed: false, filePath, settings };
    if (current && !dryRun) atomicWrite(saved, JSON.stringify({ statusLine: current }, null, 2) + '\n');
    const userCommand = current && current.type === 'command' && typeof current.command === 'string' ? current.command : null;
    settings.statusLine = Object.assign({}, current || {}, { type: 'command', command: buildStatusLineCommand(userCommand) });
  }

  const changed = JSON.stringify(settings.statusLine || null) !== before;
  if (changed && !dryRun) atomicWrite(filePath, JSON.stringify(settings, null, 2) + '\n');
  return { changed, filePath, settings };
}

module.exports = { installStatusLine, buildStatusLineCommand };

if (require.main === module) (async () => {
  const args = parseArgs(process.argv);
  const filePath = userSettingsPath(args.settingsPath);

  if (!filePath) {
    process.stderr.write('[install-statusline-config] cannot resolve user settings path (no HOME/USERPROFILE)\n');
    process.exit(2);
  }

  if (!args.confirm && !args.dryRun) {
    process.stderr.write(
      `[install-statusline-config] this script mutates ${filePath}.\n` +
      `Re-run with --confirm to apply, or --dry-run to preview.\n` +
      `Use --uninstall --confirm to remove the statusLine config.\n`
    );
    process.exit(2);
  }

  let r;
  try {
    r = installStatusLine({ settingsPath: args.settingsPath, uninstall: args.uninstall, dryRun: args.dryRun });
  } catch (err) {
    process.stderr.write(`[install-statusline-config] ${err && err.message}\n`);
    process.exit(1);
  }
  if (!r.changed) {
    process.stdout.write(`[install-statusline-config] no change required (${r.filePath})\n`);
  } else if (args.dryRun) {
    process.stdout.write(`[install-statusline-config] DRY RUN, would write ${r.filePath}:\n`);
    process.stdout.write(JSON.stringify(r.settings, null, 2) + '\n');
  } else {
    process.stdout.write(`[install-statusline-config] wrote ${r.filePath}\n`);
    process.stdout.write(`[install-statusline-config] statusLine = ${JSON.stringify(r.settings.statusLine || null)}\n`);
  }
})();
