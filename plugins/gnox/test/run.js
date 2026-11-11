// gnox — automated V&V suite for router command generation and the
// SessionStart / PostCompact GNOMATIX Namespacing Convention hook.
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
const HOOK_SCRIPT = path.join(PLUGIN_DIR, 'hooks', 'session-namespace.js');
const HOOKS_JSON = path.join(PLUGIN_DIR, 'hooks', 'hooks.json');

let failures = 0;

function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

// 1. Check hooks.json structure & CLAUDE.md cross-platform hook compliance
{
  const hooksCfg = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
  check(
    Boolean(hooksCfg.hooks && hooksCfg.hooks.SessionStart && hooksCfg.hooks.PostCompact),
    'hooks/hooks.json registers both SessionStart and PostCompact'
  );
  const hookSrc = fs.readFileSync(HOOK_SCRIPT, 'utf8').replace(/\/\/.*$/gm, '');
  check(
    !hookSrc.includes('child_process'),
    'hooks/session-namespace.js uses pure Node with zero child_process imports'
  );
}

// 2. Check SessionStart hook execution against gnomatix-oss-skills root
{
  const r = spawnSync(
    process.execPath,
    [HOOK_SCRIPT],
    {
      input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: REPO_ROOT }),
      encoding: 'utf8',
      shell: false,
      windowsHide: true
    }
  );
  check(r.status === 0, 'session-namespace.js exits 0 on SessionStart');
  const parsed = JSON.parse(r.stdout);
  const out = parsed.hookSpecificOutput || {};
  check(
    out.hookEventName === 'SessionStart' &&
      typeof out.additionalContext === 'string' &&
      out.additionalContext.includes('workspace_root = "gnomatix-oss-skills"') &&
      out.additionalContext.includes('workspace_root:subdir:...') &&
      out.additionalContext.includes('[NS]{@target}') &&
      out.additionalContext.includes('[UNRESOLVED] #needs-namespace'),
    'SessionStart output injects GNOMATIX Namespacing Convention with resolved workspace_root'
  );
}

// 3. Check PostCompact hook execution on an end-user workspace with .claude/readme-images.json
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-hook-test-'));
  try {
    fs.mkdirSync(path.join(tmp, '.claude'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '.claude', 'readme-images.json'),
      JSON.stringify({ workspace_root: 'orbit-lab' }),
      'utf8'
    );
    const r = spawnSync(
      process.execPath,
      [HOOK_SCRIPT],
      {
        input: JSON.stringify({ hook_event_name: 'PostCompact', cwd: tmp }),
        encoding: 'utf8',
        shell: false,
        windowsHide: true
      }
    );
    const out = JSON.parse(r.stdout).hookSpecificOutput || {};
    check(
      r.status === 0 &&
        out.hookEventName === 'PostCompact' &&
        out.additionalContext.includes('workspace_root = "orbit-lab"'),
      'PostCompact output re-injects GNOMATIX Namespacing Convention and reads .claude/readme-images.json workspace_root'
    );
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// 4. Check fail-open behavior on malformed stdin
{
  const r = spawnSync(process.execPath, [HOOK_SCRIPT], {
    input: '{malformed-json',
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });
  check(r.status === 0, 'session-namespace.js fails open (exit 0) on malformed stdin JSON');
}

// 5. Verify router command files are up to date with .claude-plugin/marketplace.json
{
  const r = spawnSync(process.execPath, [BUILD_SCRIPT, '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });
  check(r.status === 0, `build-commands.js --check passes (${(r.stdout || '').trim()})`);
}

console.log(failures === 0 ? 'all passed' : `${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
