// node --test plugins/all-help-no-harm/scripts/test/install-statusline.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process'); // test harness only, not hook code

const SCRIPTS = path.join(__dirname, '..');
const { installStatusLine } = require(path.join(SCRIPTS, 'install-statusline-config'));
const INDICATOR = path.join(SCRIPTS, 'contract-active-indicator.js');

function tmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahnh-statusline-'));
  return { settingsPath: path.join(dir, 'settings.json'), stateDir: path.join(dir, 'state') };
}
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

test('the heart goes in front of the user\'s own status line, which is kept', () => {
  const t = tmp();
  fs.writeFileSync(t.settingsPath, JSON.stringify({ statusLine: { type: 'command', command: "printf 'pwsh | x'", padding: 0 }, model: 'm' }));
  const r = installStatusLine(t);
  assert.strictEqual(r.changed, true);
  const s = read(t.settingsPath);
  assert.strictEqual(s.model, 'm');
  assert.strictEqual(s.statusLine.padding, 0);
  assert.match(s.statusLine.command, /contract-active-indicator\.js" --mode=prefix; printf 'pwsh \| x'$/);
});

test('installing twice does not prefix twice', () => {
  const t = tmp();
  fs.writeFileSync(t.settingsPath, JSON.stringify({ statusLine: { type: 'command', command: 'echo hi' } }));
  installStatusLine(t);
  const once = read(t.settingsPath).statusLine.command;
  const r = installStatusLine(t);
  assert.strictEqual(r.changed, false);
  assert.strictEqual(read(t.settingsPath).statusLine.command, once);
});

test('with no status line of the user\'s, the heart alone', () => {
  const t = tmp();
  fs.writeFileSync(t.settingsPath, '{}');
  installStatusLine(t);
  assert.match(read(t.settingsPath).statusLine.command, /contract-active-indicator\.js" --mode=statusline$/);
});

test('uninstall restores the user\'s own status line exactly', () => {
  const t = tmp();
  const original = { type: 'command', command: "printf 'pwsh | x'", padding: 0 };
  fs.writeFileSync(t.settingsPath, JSON.stringify({ statusLine: original }));
  installStatusLine(t);
  installStatusLine(Object.assign({ uninstall: true }, t));
  assert.deepStrictEqual(read(t.settingsPath).statusLine, original);
});

test('prefix mode prints the heart and a space, no newline, no state text', () => {
  const r = spawnSync(process.execPath, [INDICATOR, '--mode=prefix'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '\u{1F497} ');
});

test('statusline mode prints the heart alone', () => {
  const r = spawnSync(process.execPath, [INDICATOR, '--mode=statusline'], { encoding: 'utf8' });
  assert.strictEqual(r.stdout, '\u{1F497}\n');
});
