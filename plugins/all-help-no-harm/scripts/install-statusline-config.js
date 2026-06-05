// all-help-no-harm — one-shot statusLine installer
//
// Updates ~/.claude/settings.json so the Claude Code statusLine command
// invokes contract-active-indicator.js --mode=statusline.
//
// This is NOT a per-session hook. It is a manual installer the user runs once
// to opt into the visual indicator surface. Requires --confirm because it
// mutates user-level settings.
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

function buildStatusLineCommand() {
  const script = indicatorScriptPath();
  // Quote the path to tolerate spaces in the install location. Node accepts
  // quoted args on every supported platform when invoked through a shell;
  // statusLine.command is exec'd by Claude Code which handles quoting.
  return `node "${script}" --mode=statusline`;
}

(async () => {
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

  let settings;
  try {
    settings = readSettings(filePath);
  } catch (err) {
    process.stderr.write(`[install-statusline-config] could not read ${filePath}: ${err.message}\n`);
    process.exit(1);
  }

  const before = JSON.stringify(settings.statusLine || null);

  if (args.uninstall) {
    if (settings.statusLine) delete settings.statusLine;
  } else {
    // Preserve other top-level keys; only mutate statusLine.
    settings.statusLine = {
      type: 'command',
      command: buildStatusLineCommand(),
      padding: 0
    };
  }

  const after = JSON.stringify(settings.statusLine || null);
  if (before === after) {
    process.stdout.write(`[install-statusline-config] no change required (${filePath})\n`);
    process.exit(0);
  }

  const serialized = JSON.stringify(settings, null, 2) + '\n';

  if (args.dryRun) {
    process.stdout.write(`[install-statusline-config] DRY RUN — would write ${filePath}:\n`);
    process.stdout.write(serialized);
    process.exit(0);
  }

  try {
    atomicWrite(filePath, serialized);
    process.stdout.write(`[install-statusline-config] wrote ${filePath}\n`);
    if (!args.uninstall) {
      process.stdout.write(`[install-statusline-config] statusLine.command = ${settings.statusLine.command}\n`);
    } else {
      process.stdout.write(`[install-statusline-config] removed statusLine block\n`);
    }
  } catch (err) {
    process.stderr.write(`[install-statusline-config] write failed: ${err && err.message}\n`);
    process.exit(1);
  }
})();
