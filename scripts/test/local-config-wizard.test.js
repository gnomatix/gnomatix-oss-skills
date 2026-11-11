// Automated tests for plugins/gnox/scripts/local-config-wizard.js (gnox-wizard/v1).
//
//   node scripts/test/local-config-wizard.test.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const WIZARD_CLI = path.join(REPO_ROOT, 'plugins', 'gnox', 'scripts', 'local-config-wizard.js');

let failures = 0;
function check(ok, what, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok || detail === undefined ? '' : `\n     got: ${JSON.stringify(detail)}`}`);
  if (!ok) failures += 1;
}

function runWizardCli(args, extraEnv = {}) {
  const r = spawnSync(process.execPath, [WIZARD_CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    windowsHide: true,
    env: Object.assign({}, process.env, extraEnv)
  });
  return {
    status: r.status,
    stdout: String(r.stdout || '').trim(),
    stderr: String(r.stderr || '').trim()
  };
}

// 1. `list --json` discovers update-readme-images gnox-wizard/v1 manifest
{
  const res = runWizardCli(['list', '--json']);
  check(res.status === 0, 'local-config-wizard.js list --json exits 0', res.stderr);
  const data = JSON.parse(res.stdout);
  check(
    data.count >= 1 && data.wizards.some((w) => w.plugin === 'update-readme-images' && w.schema === 'gnox-wizard/v1'),
    'discovers update-readme-images gnox-wizard/v1 manifest',
    data
  );
}

// 2. `doctor --json` on gnomatix-oss-skills root exits 0 with 0 errors
{
  const res = runWizardCli(['doctor', '--repo', REPO_ROOT, '--json']);
  check(res.status === 0, 'local-config-wizard.js doctor exits 0 on marketplace root', res.stderr);
  const rep = JSON.parse(res.stdout);
  check(rep.errors === 0, 'doctor reports 0 errors on marketplace root', rep);
}

// 3. External-user repo: `doctor` warns when falling back to defaults, `run --answers --non-interactive` scaffolds `.gnox/*`, and `validate` passes
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-wizard-test-'));
try {
  const extRepo = path.join(tmpDir, 'ext-starship');
  fs.mkdirSync(extRepo, { recursive: true });

  const docBefore = runWizardCli(['doctor', '--repo', extRepo, '--json'], {
    GNOX_ASSUME_EXTERNAL_USER: '1'
  });
  const repBefore = JSON.parse(docBefore.stdout);
  check(
    docBefore.status === 0 && repBefore.warnings >= 1,
    'doctor emits warning recommending Interactive Design Mode for external user without project config',
    repBefore
  );

  const answers = JSON.stringify({
    workspace_root: 'ext-starship',
    config_location: '.gnox/readme-images.json',
    art_direction: 'custom',
    custom_art_direction: 'Crisp maritime technical blueprint linework with brass signage.',
    primary_palette: '#102A43, #D9E2EC, #F0B429',
    in_scene_typography: 'Engraved brass nameplate in upper border.',
    enable_section_subpanels: true,
    enable_og_social: true,
    protect_existing_assets: true
  });

  const runRes = runWizardCli(
    ['run', 'update-readme-images', '--repo', extRepo, '--answers', answers, '--non-interactive', '--json'],
    { GNOX_ASSUME_EXTERNAL_USER: '1' }
  );
  check(runRes.status === 0, 'non-interactive wizard run with --answers exits 0', runRes.stderr);
  const runData = JSON.parse(runRes.stdout);
  check(
    runData.written_files.length === 3 &&
      fs.existsSync(path.join(extRepo, '.gnox', 'readme-images.json')) &&
      fs.existsSync(path.join(extRepo, '.gnox', 'style-guides', 'ext-starship.md')) &&
      fs.existsSync(path.join(extRepo, '.gnox', 'rules', 'readme-panels.md')),
    'wizard writes .gnox/readme-images.json, style guide markdown, and rules markdown',
    runData
  );

  const valRes = runWizardCli(['validate', 'update-readme-images', '--repo', extRepo, '--json']);
  const valData = JSON.parse(valRes.stdout);
  check(valRes.status === 0 && valData.passed === true, 'validate confirms generated config and markdown outputs are valid', valData);

  const docAfter = runWizardCli(['doctor', '--repo', extRepo, '--json'], {
    GNOX_ASSUME_EXTERNAL_USER: '1'
  });
  const repAfter = JSON.parse(docAfter.stdout);
  check(
    docAfter.status === 0 && repAfter.warnings === 0,
    'doctor reports 0 warnings after project-specific config is generated',
    repAfter
  );
} finally {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

if (failures > 0) {
  console.error(`${failures} test(s) failed`);
  process.exit(1);
}
console.log('all passed');
