// all-help-no-harm — Kiro CLI integration installer
//
// Patches the user's Kiro CLI settings.json so:
//   chat.notificationMethod              = "osc9"   (enables OSC 9 notifies)
//   chat.enableNotifications             = true
//   chat.enableContextUsageIndicator     = true
//   chat.greeting.enabled                = true
//
// Plus, optionally, writes a small wrapper-shim script the user can adopt
// as their PROMPT_COMMAND / preexec to inject the all-help-no-harm contract
// glyph (U+1F9EC) into the terminal title before each Kiro CLI session via
// the OSC 0 escape, mirroring the Claude Code integration's terminal-title
// behavior.
//
// Kiro CLI's documented theme command targets only the autocomplete
// dropdown (dark / light / system) — it does not expose a custom theme JSON
// surface. So this installer's color-theme contribution lives in the
// kiro-app/ directory instead (Code-OSS-based IDE theme).
//
// Doc sources verified during authoring:
//   https://kiro.dev/docs/cli/reference/settings/  (settings.json keys
//     including chat.notificationMethod = auto|bel|osc9)
//   https://kiro.dev/docs/cli/reference/cli-commands/  (kiro-cli theme,
//     kiro-cli settings commands)
//   https://kiro.dev/cli/  (CLI feature overview, settings.json location
//     under ~/.kiro/settings/cli.json)

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const out = {
    confirm: false,
    uninstall: false,
    dryRun: false,
    settingsPath: null
  };
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

function userHome() {
  return os.homedir() || process.env.HOME || process.env.USERPROFILE || null;
}

// Kiro CLI settings location, per kiro.dev/docs/cli/reference/settings/:
// "Settings are stored in ~/.kiro/settings/cli.json". On Windows the
// equivalent is %USERPROFILE%\.kiro\settings\cli.json.
function userSettingsPath(override) {
  if (override) return override;
  const home = userHome();
  if (!home) return null;
  return path.join(home, '.kiro', 'settings', 'cli.json');
}

function safeReadJson(filePath) {
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
  if (!raw || raw.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    throw new Error('cli.json root is not a JSON object');
  } catch (err) {
    throw new Error(`${filePath} is not valid JSON: ${err && err.message}`);
  }
}

function atomicWrite(targetPath, contents) {
  const dir = path.dirname(targetPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const code = err && err.code;
    if (code !== 'EEXIST') throw new Error(`mkdir ${dir} failed: ${code || 'unknown'}`);
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

// Marker keys we set. On --uninstall we only revert keys that still hold
// the value we previously wrote; we never clobber a user-edited value.
const PATCH = {
  'chat.notificationMethod': 'osc9',
  'chat.enableNotifications': true,
  'chat.enableContextUsageIndicator': true,
  'chat.greeting.enabled': true
};

function applyPatch(settings, uninstall) {
  if (uninstall) {
    for (const [key, expected] of Object.entries(PATCH)) {
      if (settings[key] === expected) delete settings[key];
    }
    return settings;
  }
  for (const [key, value] of Object.entries(PATCH)) {
    settings[key] = value;
  }
  return settings;
}

(async () => {
  const args = parseArgs(process.argv);

  if (!args.confirm && !args.dryRun) {
    process.stderr.write(
      `[install-kiro-cli-config] this script mutates ~/.kiro/settings/cli.json.\n` +
      `Re-run with --confirm to apply, --dry-run to preview, or --uninstall --confirm to revert.\n`
    );
    process.exit(2);
  }

  const settingsPath = userSettingsPath(args.settingsPath);
  if (!settingsPath) {
    process.stderr.write('[install-kiro-cli-config] cannot resolve user home (no HOME/USERPROFILE)\n');
    process.exit(2);
  }

  let settings;
  try {
    settings = safeReadJson(settingsPath);
  } catch (err) {
    process.stderr.write(`[install-kiro-cli-config] could not read ${settingsPath}: ${err.message}\n`);
    process.exit(1);
  }

  const before = JSON.stringify(settings);
  const patched = applyPatch(settings, args.uninstall);
  const after = JSON.stringify(patched);
  const serialized = JSON.stringify(patched, null, 2) + '\n';

  if (args.dryRun) {
    process.stdout.write(`[install-kiro-cli-config] DRY RUN.\n`);
    process.stdout.write(`  settings file: ${settingsPath}\n`);
    process.stdout.write(`  before: ${before}\n`);
    process.stdout.write(`  after:  ${after}\n`);
    process.exit(0);
  }

  if (before === after) {
    process.stdout.write(`[install-kiro-cli-config] no change required (${settingsPath})\n`);
    process.exit(0);
  }

  try {
    atomicWrite(settingsPath, serialized);
  } catch (err) {
    process.stderr.write(`[install-kiro-cli-config] settings write failed: ${err && err.message}\n`);
    process.exit(1);
  }

  if (args.uninstall) {
    process.stdout.write(`[install-kiro-cli-config] uninstalled (reverted GNOMATIX-set keys)\n`);
  } else {
    process.stdout.write(`[install-kiro-cli-config] wrote ${settingsPath}\n`);
    process.stdout.write(`[install-kiro-cli-config] chat.notificationMethod = osc9 (terminal will receive OSC 9 alerts)\n`);
    process.stdout.write(`[install-kiro-cli-config] consider running \`kiro-cli theme dark\` for brand-matching dropdown\n`);
  }
})();
