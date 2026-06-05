// all-help-no-harm — Gemini CLI integration installer
//
// One-shot installer that:
//   1. Copies the GNOMATIX theme files (+ extension manifest) into the
//      user's Gemini CLI extensions directory.
//   2. Patches ~/.gemini/settings.json (or platform equivalent) so:
//        ui.theme                 = "GNOMATIX (all-help-no-harm-gnomatix)"
//        ui.dynamicWindowTitle    = true   (lets terminal-title-hook.js win)
//        ui.showStatusInTitle     = true
//        ui.footer.showLabels     = true
//
// Behavior is opt-in: requires --confirm. Supports --uninstall, --dry-run,
// --light (install light variant as default), and --settings=<path> override.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process, no
// hardcoded Unix paths, atomic write via temp+rename, every fs call wrapped.
//
// Doc sources verified during authoring:
//   https://geminicli.com/docs/reference/configuration/  (ui.theme,
//     ui.dynamicWindowTitle, ui.showStatusInTitle, ui.footer.* settings)
//   https://geminicli.com/docs/cli/themes/  (custom-theme JSON schema and
//     the "<name> (<extension-name>)" reference convention)
//   https://geminicli.com/docs/extensions/  (themes array in
//     gemini-extension.json; auto-discovery on extension install)

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const EXTENSION_NAME = 'all-help-no-harm-gnomatix';
const THEME_NAME_DARK = 'GNOMATIX dark';
const THEME_NAME_LIGHT = 'GNOMATIX light';

function parseArgs(argv) {
  const out = {
    confirm: false,
    uninstall: false,
    dryRun: false,
    light: false,
    settingsPath: null,
    extensionsDir: null
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--confirm') out.confirm = true;
    else if (a === '--uninstall') out.uninstall = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--light') out.light = true;
    else if (a.startsWith('--settings=')) out.settingsPath = a.slice('--settings='.length);
    else if (a === '--settings' && i + 1 < argv.length) out.settingsPath = argv[++i];
    else if (a.startsWith('--extensions-dir=')) out.extensionsDir = a.slice('--extensions-dir='.length);
    else if (a === '--extensions-dir' && i + 1 < argv.length) out.extensionsDir = argv[++i];
  }
  return out;
}

function userHome() {
  return os.homedir() || process.env.HOME || process.env.USERPROFILE || null;
}

// Gemini CLI's user settings location is platform-conventional. The CLI
// reads ~/.gemini/settings.json on POSIX; on Windows it's the equivalent
// %USERPROFILE%\.gemini\settings.json. Both are covered by joining
// os.homedir() with '.gemini'.
function userSettingsPath(override) {
  if (override) return override;
  const home = userHome();
  if (!home) return null;
  return path.join(home, '.gemini', 'settings.json');
}

function userExtensionsDir(override) {
  if (override) return override;
  const home = userHome();
  if (!home) return null;
  return path.join(home, '.gemini', 'extensions', EXTENSION_NAME);
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
    throw new Error('settings root is not a JSON object');
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

function copyAsset(srcPath, dstPath) {
  let contents;
  try {
    contents = fs.readFileSync(srcPath, 'utf8');
  } catch (err) {
    throw new Error(`could not read source asset ${srcPath}: ${err && err.code}`);
  }
  atomicWrite(dstPath, contents);
}

// Recursive directory removal that tolerates non-existent paths and per-entry
// permission errors. Used on --uninstall only.
function rmrfTolerant(target) {
  try {
    if (!fs.existsSync(target)) return;
    fs.rmSync(target, { recursive: true, force: true });
  } catch (err) {
    try { process.stderr.write(`[install-gemini-config] cleanup of ${target} reported ${err && err.code}; continuing\n`); } catch { /* ignore */ }
  }
}

function applySettingsPatch(settings, themeNameFull, uninstall) {
  // Defensive: ensure ui sub-object exists; do not clobber unrelated keys.
  if (!settings.ui || typeof settings.ui !== 'object' || Array.isArray(settings.ui)) {
    settings.ui = {};
  }
  if (!settings.ui.footer || typeof settings.ui.footer !== 'object' || Array.isArray(settings.ui.footer)) {
    settings.ui.footer = {};
  }

  if (uninstall) {
    // Only revert the keys we previously set, and only if they still hold
    // our value. Never clobber a value the user has since changed.
    if (settings.ui.theme === themeNameFull) delete settings.ui.theme;
    return settings;
  }

  settings.ui.theme = themeNameFull;
  settings.ui.dynamicWindowTitle = true;
  settings.ui.showStatusInTitle = true;
  settings.ui.footer.showLabels = true;
  return settings;
}

(async () => {
  const args = parseArgs(process.argv);

  if (!args.confirm && !args.dryRun) {
    process.stderr.write(
      `[install-gemini-config] this script mutates the user's Gemini CLI extensions dir + settings.json.\n` +
      `Re-run with --confirm to apply, --dry-run to preview, or --uninstall --confirm to revert.\n`
    );
    process.exit(2);
  }

  const settingsPath = userSettingsPath(args.settingsPath);
  const extDir = userExtensionsDir(args.extensionsDir);
  if (!settingsPath || !extDir) {
    process.stderr.write('[install-gemini-config] cannot resolve user home (no HOME/USERPROFILE)\n');
    process.exit(2);
  }

  const platformDir = __dirname;
  const themeChoice = args.light ? THEME_NAME_LIGHT : THEME_NAME_DARK;
  const themeNameFull = `${themeChoice} (${EXTENSION_NAME})`;

  let settings;
  try {
    settings = safeReadJson(settingsPath);
  } catch (err) {
    process.stderr.write(`[install-gemini-config] could not read ${settingsPath}: ${err.message}\n`);
    process.exit(1);
  }

  const beforeUi = JSON.stringify(settings.ui || null);
  const patched = applySettingsPatch(settings, themeNameFull, args.uninstall);
  const afterUi = JSON.stringify(patched.ui || null);

  const serialized = JSON.stringify(patched, null, 2) + '\n';

  if (args.dryRun) {
    process.stdout.write(`[install-gemini-config] DRY RUN.\n`);
    process.stdout.write(`  extensions dir: ${extDir}\n`);
    process.stdout.write(`  settings file:  ${settingsPath}\n`);
    process.stdout.write(`  theme to set:   ${themeNameFull}\n`);
    process.stdout.write(`  settings.ui (before): ${beforeUi}\n`);
    process.stdout.write(`  settings.ui (after):  ${afterUi}\n`);
    process.exit(0);
  }

  if (args.uninstall) {
    rmrfTolerant(extDir);
    if (beforeUi !== afterUi) {
      try { atomicWrite(settingsPath, serialized); } catch (err) {
        process.stderr.write(`[install-gemini-config] settings write failed: ${err && err.message}\n`);
        process.exit(1);
      }
    }
    process.stdout.write(`[install-gemini-config] uninstalled (removed ${extDir}; reverted ui.theme if matched)\n`);
    process.exit(0);
  }

  // Install: copy theme + manifest into the extensions directory.
  try {
    copyAsset(path.join(platformDir, 'gemini-extension.json'), path.join(extDir, 'gemini-extension.json'));
    copyAsset(path.join(platformDir, 'themes', 'gnomatix-helix.json'), path.join(extDir, 'themes', 'gnomatix-helix.json'));
    copyAsset(path.join(platformDir, 'themes', 'gnomatix-helix-light.json'), path.join(extDir, 'themes', 'gnomatix-helix-light.json'));
  } catch (err) {
    process.stderr.write(`[install-gemini-config] asset copy failed: ${err && err.message}\n`);
    process.exit(1);
  }

  if (beforeUi !== afterUi) {
    try {
      atomicWrite(settingsPath, serialized);
    } catch (err) {
      process.stderr.write(`[install-gemini-config] settings write failed: ${err && err.message}\n`);
      process.exit(1);
    }
  }

  process.stdout.write(`[install-gemini-config] installed extension at ${extDir}\n`);
  process.stdout.write(`[install-gemini-config] settings.ui.theme = ${themeNameFull}\n`);
  process.stdout.write(`[install-gemini-config] run \`/theme\` in Gemini CLI to verify\n`);
})();
