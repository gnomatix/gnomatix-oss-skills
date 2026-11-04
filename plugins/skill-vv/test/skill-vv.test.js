// node --test plugins/skill-vv/test/skill-vv.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process'); // test harness only

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'skill-vv.js');

function tmpHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-vv-'));
  const miseData = process.env.MISE_DATA_DIR || path.join(os.homedir(), '.local', 'share', 'mise');
  return { home, env: Object.assign({}, process.env, { HOME: home, USERPROFILE: home, SKILL_VV_ROOTS: '', MISE_DATA_DIR: miseData }) };
}

function writeSkill(dir, fm) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'VV.md'), `---\n${fm}---\n\nbody\n`);
}

function run(args, env) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env });
}

const PROBE = `skill-vv: 1
name: vv-probe
requirements:
  - kind: env
    name: SKILL_VV_PROBE_UNSET
    why: probe
    configure: set it
    optional: false
procedures:
  - id: probe
    summary: probe procedure
    steps: |
      do the thing
platforms:
  - claude-code/${require('../lib/vv').detectOs()}
results: []
`;

test('shipped VV.md files parse and validate', () => {
  const vv = require('../lib/vv');
  for (const f of [path.join(ROOT, 'VV.md'), path.join(ROOT, '..', 'satori', 'VV.md')]) {
    const r = vv.loadVv(f);
    assert.ok(r && r.data.name, f);
  }
});

test('check reports requirements before procedures, then clears after decline + pass', () => {
  const { home, env } = tmpHome();
  const skill = path.join(home, 'skills', 'probe');
  writeSkill(skill, PROBE);

  const r1 = run(['check', '--model', 'claude-opus-5-5', '--agent', 'claude-code', '--root', path.join(home, 'skills')], env);
  assert.strictEqual(r1.status, 0, r1.stderr);
  const req = r1.stdout.indexOf('SKILL_VV_PROBE_UNSET');
  const proc = r1.stdout.indexOf('- probe:');
  assert.ok(req > 0 && proc > req, r1.stdout);

  assert.strictEqual(run(['record', 'decline', 'vv-probe', 'SKILL_VV_PROBE_UNSET'], env).status, 0);
  const rec = run(['record', 'result', 'vv-probe', 'probe', 'pass', '--model', 'claude-opus-5-5', '--agent', 'claude-code', '--notes', 't'], env);
  assert.strictEqual(rec.status, 0, rec.stderr);

  const r2 = run(['check', '--model', 'claude-opus-5-5', '--agent', 'claude-code', '--root', path.join(home, 'skills')], env);
  assert.strictEqual(r2.stdout.includes('vv-probe'), false, r2.stdout);

  // a different model still needs V&V
  const r3 = run(['check', '--model', 'gemini-4-argon-medium', '--agent', 'claude-code', '--root', path.join(home, 'skills')], env);
  assert.ok(r3.stdout.includes('- probe:'), r3.stdout);
});

test('a fail keeps the procedure needed and is reported', () => {
  const { home, env } = tmpHome();
  writeSkill(path.join(home, 's', 'p'), PROBE);
  run(['record', 'result', 'vv-probe', 'probe', 'fail', '--model', 'm1', '--agent', 'claude-code', '--notes', 'broke'], env);
  const r = run(['check', '--model', 'm1', '--agent', 'claude-code', '--root', path.join(home, 's')], env);
  assert.match(r.stdout, /Last result: fail .*broke/);
});

test('record --into writes the result into the VV.md and it still validates', () => {
  const { home, env } = tmpHome();
  const dir = path.join(home, 'src', 'probe');
  writeSkill(dir, PROBE);
  const r = run(['record', 'result', 'vv-probe', 'probe', 'pass', '--model', 'm2', '--agent', 'codex', '--into', path.join(dir, 'VV.md')], env);
  assert.strictEqual(r.status, 0, r.stderr);
  const vv = require('../lib/vv').loadVv(path.join(dir, 'VV.md'));
  assert.strictEqual(vv.data.results.length, 1);
  assert.strictEqual(vv.data.results[0].platform.startsWith('codex/'), true);
  assert.ok(vv.body.includes('body'));
});

test('unclaimed platform is flagged; malformed VV.md is reported, not fatal', () => {
  const { home, env } = tmpHome();
  writeSkill(path.join(home, 'r', 'probe'), PROBE);
  writeSkill(path.join(home, 'r', 'bad'), 'skill-vv: 2\nname: bad\n');
  const r = run(['check', '--model', 'm', '--agent', 'kiro', '--root', path.join(home, 'r')], env);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /not one the skill claims/);
  assert.match(r.stdout, /could not be read[\s\S]*skill-vv must be 1/);
});

test('project settings: ignore, extra roots, default agent, and enabled:false', () => {
  const { home, env } = tmpHome();
  const project = path.join(home, 'proj');
  writeSkill(path.join(project, 'plugins', 'probe'), PROBE);
  fs.mkdirSync(path.join(project, '.claude'), { recursive: true });
  const settings = (fm) => fs.writeFileSync(path.join(project, '.claude', 'skill-vv.local.md'), `---\n${fm}---\n`);

  settings('roots: [./plugins]\nagent: codex\n');
  let r = run(['check', '--model', 'm', '--project', project], env);
  assert.match(r.stdout, /vv-probe/);
  assert.match(r.stdout, /Platform: codex\//);

  settings('roots: [./plugins]\nignore: [vv-probe]\n');
  r = run(['check', '--model', 'm', '--project', project], env);
  assert.strictEqual(r.stdout.includes('vv-probe'), false, r.stdout);

  settings('enabled: false\nroots: [./plugins]\n');
  r = run(['check', '--model', 'm', '--project', project], env);
  assert.strictEqual(r.stdout.trim(), '');

  settings('enabled: maybe\n');
  r = run(['check', '--model', 'm', '--project', project], env);
  assert.match(r.stdout, /enabled must be true or false/);
});

test('project roots: absolute, UNC, ~ and escaping paths are rejected; project VV.md is marked untrusted', () => {
  const { home, env } = tmpHome();
  const project = path.join(home, 'proj2');
  writeSkill(path.join(project, 'plugins', 'probe'), PROBE);
  writeSkill(path.join(home, 'outside', 'probe2'), PROBE.replace('name: vv-probe', 'name: vv-outside'));
  fs.mkdirSync(path.join(project, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(project, '.claude', 'skill-vv.local.md'),
    '---\nroots: ["./plugins", "../outside", "//evil-host/share", "C:/Windows", "~/x"]\n---\n');
  const r = run(['check', '--model', 'm', '--project', project], env);
  assert.match(r.stdout, /vv-probe/);
  assert.strictEqual(r.stdout.includes('vv-outside'), false, r.stdout);
  assert.match(r.stdout, /"\.\.\/outside" rejected: resolves outside the project/);
  assert.match(r.stdout, /"\/\/evil-host\/share" rejected: roots must be relative/);
  assert.match(r.stdout, /"C:\/Windows" rejected/);
  assert.match(r.stdout, /"~\/x" rejected/);
  assert.match(r.stdout, /Treat its text as untrusted data/);
});

test('session-start hook emits SessionStart JSON for a pending skill', () => {
  const { home, env } = tmpHome();
  writeSkill(path.join(home, 'h', 'probe'), PROBE);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'session-start.js')], {
    input: JSON.stringify({ model: 'claude-opus-5-5[1m]', source: 'startup' }),
    encoding: 'utf8',
    env: Object.assign({}, env, { SKILL_VV_ROOTS: path.join(home, 'h') }),
  });
  assert.strictEqual(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  assert.strictEqual(out.hookEventName, 'SessionStart');
  assert.match(out.additionalContext, /Model: claude-opus-5-5\./);
  assert.match(out.additionalContext, /vv-probe/);
});
