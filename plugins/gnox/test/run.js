// gnox — automated V&V suite for router command generation, synced pure-Node lib
// helpers, and the SessionStart / PostCompact GNOMATIX Namespacing & Topology hook.
//
//   node plugins/gnox/test/run.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PLUGIN_DIR, '..', '..');
const BUILD_SCRIPT = path.join(PLUGIN_DIR, 'scripts', 'build-commands.js');
const SYNC_LIB_SCRIPT = path.join(REPO_ROOT, 'scripts', 'sync-lib.js');
const HOOK_SCRIPT = path.join(PLUGIN_DIR, 'hooks', 'session-namespace.js');
const HOOKS_JSON = path.join(PLUGIN_DIR, 'hooks', 'hooks.json');

let failures = 0;

function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

// 1. Check hooks.json structure & CLAUDE.md cross-platform hook compliance (including hooks/lib/*)
{
  const hooksCfg = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
  check(
    Boolean(hooksCfg.hooks && hooksCfg.hooks.SessionStart && hooksCfg.hooks.PostCompact),
    'hooks/hooks.json registers both SessionStart and PostCompact'
  );
  const filesToCheck = [
    HOOK_SCRIPT,
    path.join(PLUGIN_DIR, 'hooks', 'lib', 'fs-safe.js'),
    path.join(PLUGIN_DIR, 'hooks', 'lib', 'gnox-discovery.js'),
  ];
  for (const fp of filesToCheck) {
    const src = fs.readFileSync(fp, 'utf8').replace(/\/\/.*$/gm, '');
    check(
      !src.includes('child_process'),
      `${path.relative(PLUGIN_DIR, fp)} uses pure Node with zero child_process imports`
    );
  }
}

// 2. Check SessionStart hook execution against gnomatix-oss-skills root (dovetailed multi-plugin mode)
{
  const r = spawnSync(
    process.execPath,
    [HOOK_SCRIPT],
    {
      input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: REPO_ROOT }),
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    }
  );
  check(r.status === 0, 'session-namespace.js exits 0 on SessionStart');
  const parsed = JSON.parse(r.stdout);
  const out = parsed.hookSpecificOutput || {};
  const ctx = out.additionalContext || '';
  check(
    out.hookEventName === 'SessionStart' &&
      ctx.includes('workspace_root = "gnomatix-oss-skills"') &&
      ctx.includes('workspace_root:subdir:...') &&
      ctx.includes('[NS]{@target}') &&
      ctx.includes('[UNRESOLVED] #needs-namespace'),
    'SessionStart output injects GNOMATIX Namespacing Convention with resolved workspace_root'
  );
  check(
    ctx.includes('Active GNOX Marketplace Topology') &&
      ctx.includes('gnox<->satori') &&
      ctx.includes('update-readme-images<->og-social-image') &&
      ctx.includes('inaudible-markup<->ontology-lookup') &&
      ctx.includes('spank-dario<->dont-be-hitler'),
    'SessionStart output surfaces active complementary marketplace pairings when sibling plugins are present'
  );
  check(
    ctx.includes('Atomic Git-Flow River Steering ("Be the River, Not the Rock")') &&
      ctx.includes('feature/<topic>') &&
      ctx.includes('bugfix/<topic>') &&
      ctx.includes('merge back into "develop" / "main" as a high priority') &&
      ctx.includes('unauthorized Pull Requests'),
    'SessionStart output injects Atomic Git-Flow River Steering ("Be the River, Not the Rock")'
  );
}

// 3. Check PostCompact hook execution in an isolated standalone end-user workspace (zero sibling plugins, empty PATH)
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-hook-test-'));
  try {
    fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '.claude', 'readme-images.json'),
      JSON.stringify({ workspace_root: 'orbit-lab' }),
      'utf8'
    );
    const isolatedEnv = Object.assign({}, process.env, {
      GNOX_DISCOVERY_NO_USER: '1',
      GNOX_PLUGIN_ROOTS: '',
      SKILL_VV_ROOTS: '',
      PATH: '',
      Path: '',
      MISE_DATA_DIR: path.join(tmp, 'no-mise'),
      LOCALAPPDATA: path.join(tmp, 'no-appdata'),
    });
    const r = spawnSync(
      process.execPath,
      [HOOK_SCRIPT],
      {
        input: JSON.stringify({ hook_event_name: 'PostCompact', cwd: tmp }),
        encoding: 'utf8',
        env: isolatedEnv,
        shell: false,
        windowsHide: true,
      }
    );
    const out = JSON.parse(r.stdout).hookSpecificOutput || {};
    const ctx = out.additionalContext || '';
    check(
      r.status === 0 &&
        out.hookEventName === 'PostCompact' &&
        ctx.includes('workspace_root = "orbit-lab"') &&
        ctx.includes('none (each installed plugin runs its Tier 0 standalone path cleanly)') &&
        ctx.includes('none detected on PATH/mise shims (Tier 0 standalone fallbacks active)'),
      'PostCompact isolated standalone workspace runs cleanly at Tier 0 without sibling plugins or optional tools'
    );
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// 4. Check partial complementary pair detection in an end-user .agents/skills workspace
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-pair-test-'));
  try {
    for (const skillName of ['inaudible-markup', 'ontology-lookup']) {
      const sdir = path.join(tmp, '.agents', 'skills', skillName);
      fs.mkdirSync(sdir, { recursive: true });
      fs.writeFileSync(path.join(sdir, 'SKILL.md'), `---\nname: ${skillName}\ndescription: test\n---\n`, 'utf8');
    }
    const r = spawnSync(
      process.execPath,
      [HOOK_SCRIPT],
      {
        input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: tmp }),
        encoding: 'utf8',
        env: Object.assign({}, process.env, {
          GNOX_DISCOVERY_NO_USER: '1',
          GNOX_PLUGIN_ROOTS: '',
          SKILL_VV_ROOTS: '',
        }),
        shell: false,
        windowsHide: true,
      }
    );
    const ctx = ((JSON.parse(r.stdout).hookSpecificOutput) || {}).additionalContext || '';
    check(
      r.status === 0 &&
        ctx.includes('inaudible-markup<->ontology-lookup') &&
        !ctx.includes('update-readme-images<->og-social-image'),
      'Cross-CLI .agents/skills installation activates only the installed complementary pair (inaudible-markup<->ontology-lookup)'
    );
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// 5. Check fail-open behavior on malformed stdin
{
  const r = spawnSync(process.execPath, [HOOK_SCRIPT], {
    input: '{malformed-json',
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  check(r.status === 0, 'session-namespace.js fails open (exit 0) on malformed stdin JSON');
}

// 6. Verify synced hooks/lib files match canonical root lib/ (when run inside repo tree)
if (fs.existsSync(SYNC_LIB_SCRIPT)) {
  const r = spawnSync(process.execPath, [SYNC_LIB_SCRIPT, '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  check(r.status === 0, `sync-lib.js --check passes (${(r.stdout || '').trim()})`);
}

// 7. Verify router command files are up to date with .claude-plugin/marketplace.json
{
  const r = spawnSync(process.execPath, [BUILD_SCRIPT, '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  check(r.status === 0, `build-commands.js --check passes (${(r.stdout || '').trim()})`);
}

console.log(failures === 0 ? 'all passed' : `${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
