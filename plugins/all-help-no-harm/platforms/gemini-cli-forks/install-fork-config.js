// all-help-no-harm — Gemini CLI fork integration installer
//
// Reuses the GNOMATIX theme + extension manifest from
// platforms/gemini-cli/ and installs them into the documented config
// directories of known Gemini CLI forks. Default targets:
//
//   qwen-code      ~/.qwen/extensions/all-help-no-harm-gnomatix
//                  ~/.qwen/settings.json
//   llxprt-code    ~/.llxprt/extensions/all-help-no-harm-gnomatix
//                  ~/.llxprt/settings.json
//
// Either or both can be targeted via --target=qwen, --target=llxprt, or
// --target=all. The fork-CLI config-dir conventions follow upstream
// Gemini CLI's ~/.gemini pattern (verified for qwen-code via README:
// "based on Google Gemini CLI"; llxprt-code via docs cross-reference of
// .claude, .gcp, .gemini/commands directories).
//
// [unverified — needs platform access to confirm exact ~/.<name>/ path]
// If the fork uses a different directory, override with --extensions-dir
// and --settings.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, atomic writes.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const EXTENSION_NAME = 'all-help-no-harm-gnomatix';
const THEME_NAME_DARK = 'GNOMATIX dark';
const THEME_NAME_LIGHT = 'GNOMATIX light';

// Fork registry — sub-directory name under home that holds settings.json
// and extensions/. Confirmed for qwen-code via its docs site; llxprt's
// directory name is project-conventional and verifiable by running
// `llxprt --help` once on the user's machine.
const FORKS = {
  qwen: { dir: '.qwen', label: 'qwen-code' },
  llxprt: { dir: '.llxprt', label: 'llxprt-code' }
};

function parseArgs(argv) {
  const out = {
    confirm: false,
    uninstall: false,
    dryRun: false,
    light: false,
    target: 'all',
    extensionsDirOverride: null,
    settingsPathOverride: null
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--confirm') out.confirm = true;
    else if (a === '--uninstall') out.uninstall = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--light') out.light = true;
    else if (a.startsWith('--target=')) out.target = a.slice('--target='.length);
    else if (a === '--target' && i + 1 < argv.length) out.target = argv[++i];
    else if (a.startsWith('--extensions-dir=')) out.extensionsDirOverride = a.slice('--extensions-dir='.length);
    else if (a === '--extensions-dir' && i + 1 < argv.length) out.extensionsDirOverride = argv[++i];
    else if (a.startsWith('--settings=')) out.settingsPathOverride = a.slice('--settings='.length);
    else if (a === '--settings' && i + 1 < argv.length) out.settingsPathOverride = argv[++i];
  }
  return out;
}

function userHome() {
  return os.homedir() || process.env.HOME || process.env.USERPROFILE || null;
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
    if (err && err.code === 'ENOENT') return {};
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
    if (err && err.code !== 'EEXIST') throw new Error(`mkdir ${dir} failed: ${err.code || 'unknown'}`);
  }
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup */ }
    throw err;
  }
}

function copyAsset(srcPath, dstPath) {
  let contents;
  try {
    contents = fs.readFileSync(srcPath, 'utf8');
  } catch (err) {
    throw new Error(`source asset unreadable ${srcPath}: ${err && err.code}`);
  }
  atomicWrite(dstPath, contents);
}

function rmrfTolerant(target) {
  try {
    if (!fs.existsSync(target)) return;
    fs.rmSync(target, { recursive: true, force: true });
  } catch (err) {
    try { process.stderr.write(`[install-fork-config] cleanup of ${target} reported ${err && err.code}; continuing\n`); } catch { /* ignore */ }
  }
}

function applySettingsPatch(settings, themeNameFull, uninstall) {
  if (!settings.ui || typeof settings.ui !== 'object' || Array.isArray(settings.ui)) settings.ui = {};
  if (!settings.ui.footer || typeof settings.ui.footer !== 'object' || Array.isArray(settings.ui.footer)) settings.ui.footer = {};
  if (uninstall) {
    if (settings.ui.theme === themeNameFull) delete settings.ui.theme;
    return settings;
  }
  settings.ui.theme = themeNameFull;
  settings.ui.dynamicWindowTitle = true;
  settings.ui.showStatusInTitle = true;
  settings.ui.footer.showLabels = true;
  return settings;
}

function resolveTargets(args, home) {
  const list = [];
  const wanted = args.target === 'all'
    ? Object.keys(FORKS)
    : [args.target];
  for (const key of wanted) {
    const meta = FORKS[key];
    if (!meta) {
      process.stderr.write(`[install-fork-config] unknown --target=${key} (valid: qwen, llxprt, all)\n`);
      process.exit(2);
    }
    const baseDir = path.join(home, meta.dir);
    list.push({
      key,
      label: meta.label,
      extensionsDir: args.extensionsDirOverride
        || path.join(baseDir, 'extensions', EXTENSION_NAME),
      settingsPath: args.settingsPathOverride
        || path.join(baseDir, 'settings.json')
    });
  }
  return list;
}

(async () => {
  const args = parseArgs(process.argv);

  if (!args.confirm && !args.dryRun) {
    process.stderr.write(
      `[install-fork-config] mutates ~/.<fork>/settings.json + ~/.<fork>/extensions/${EXTENSION_NAME}/.\n` +
      `Re-run with --confirm to apply, --dry-run to preview, --uninstall --confirm to revert.\n` +
      `Default --target=all installs into both qwen-code and llxprt-code.\n`
    );
    process.exit(2);
  }

  const home = userHome();
  if (!home) {
    process.stderr.write('[install-fork-config] cannot resolve home dir\n');
    process.exit(2);
  }

  const targets = resolveTargets(args, home);
  const platformDir = __dirname;
  const themeChoice = args.light ? THEME_NAME_LIGHT : THEME_NAME_DARK;
  const themeNameFull = `${themeChoice} (${EXTENSION_NAME})`;

  // Reuse the canonical gemini-cli assets so we have a single source of
  // truth and no theme-content drift.
  const srcManifest = path.join(platformDir, '..', 'gemini-cli', 'gemini-extension.json');
  const srcThemeDark = path.join(platformDir, '..', 'gemini-cli', 'themes', 'gnomatix-helix.json');
  const srcThemeLight = path.join(platformDir, '..', 'gemini-cli', 'themes', 'gnomatix-helix-light.json');

  for (const target of targets) {
    let settings;
    try {
      settings = safeReadJson(target.settingsPath);
    } catch (err) {
      process.stderr.write(`[install-fork-config:${target.key}] settings read failed: ${err.message}\n`);
      continue;
    }
    const beforeUi = JSON.stringify(settings.ui || null);
    const patched = applySettingsPatch(settings, themeNameFull, args.uninstall);
    const afterUi = JSON.stringify(patched.ui || null);
    const serialized = JSON.stringify(patched, null, 2) + '\n';

    if (args.dryRun) {
      process.stdout.write(`[install-fork-config:${target.key}] DRY RUN\n`);
      process.stdout.write(`  extensions dir: ${target.extensionsDir}\n`);
      process.stdout.write(`  settings file:  ${target.settingsPath}\n`);
      process.stdout.write(`  theme to set:   ${themeNameFull}\n`);
      process.stdout.write(`  ui (before):    ${beforeUi}\n`);
      process.stdout.write(`  ui (after):     ${afterUi}\n`);
      continue;
    }

    if (args.uninstall) {
      rmrfTolerant(target.extensionsDir);
      if (beforeUi !== afterUi) {
        try { atomicWrite(target.settingsPath, serialized); } catch (err) {
          process.stderr.write(`[install-fork-config:${target.key}] settings write failed: ${err && err.message}\n`);
          continue;
        }
      }
      process.stdout.write(`[install-fork-config:${target.key}] uninstalled\n`);
      continue;
    }

    try {
      copyAsset(srcManifest, path.join(target.extensionsDir, 'gemini-extension.json'));
      copyAsset(srcThemeDark, path.join(target.extensionsDir, 'themes', 'gnomatix-helix.json'));
      copyAsset(srcThemeLight, path.join(target.extensionsDir, 'themes', 'gnomatix-helix-light.json'));
    } catch (err) {
      process.stderr.write(`[install-fork-config:${target.key}] asset copy failed: ${err && err.message}\n`);
      continue;
    }

    if (beforeUi !== afterUi) {
      try {
        atomicWrite(target.settingsPath, serialized);
      } catch (err) {
        process.stderr.write(`[install-fork-config:${target.key}] settings write failed: ${err && err.message}\n`);
        continue;
      }
    }

    process.stdout.write(`[install-fork-config:${target.key}] installed at ${target.extensionsDir}\n`);
    process.stdout.write(`[install-fork-config:${target.key}] theme = ${themeNameFull}\n`);
  }
})();
