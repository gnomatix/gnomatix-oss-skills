'use strict';

// lib/fs-safe.js: ensureFile, deepMerge and loadLayeredJson (the -default / -user config rule).
// Run: node --test test/lib-fs-safe.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureFile, deepMerge, loadLayeredJson } = require('../lib/fs-safe');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fs-safe-'));

test('ensureFile creates a missing file (and its directory) with the skeleton', () => {
  const dir = tmp();
  const p = path.join(dir, 'sub', '.env');
  assert.equal(ensureFile(p, '# skeleton\n'), true);
  assert.equal(fs.readFileSync(p, 'utf8'), '# skeleton\n');
});

test('ensureFile leaves an existing file\'s content alone and updates its mtime', () => {
  const dir = tmp();
  const p = path.join(dir, 'cfg.json');
  fs.writeFileSync(p, '{"a":1}');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(p, old, old);
  assert.equal(ensureFile(p, '{}\n'), false);
  assert.equal(fs.readFileSync(p, 'utf8'), '{"a":1}');
  assert.ok(fs.statSync(p).mtimeMs > old.getTime());
});

test('deepMerge: objects merge key by key, user arrays and scalars replace the default', () => {
  const merged = deepMerge(
    { a: 1, nested: { x: 1, y: 2 }, list: [1, 2], keep: 'k' },
    { a: 2, nested: { y: 3, z: 4 }, list: [9] }
  );
  assert.deepEqual(merged, { a: 2, nested: { x: 1, y: 3, z: 4 }, list: [9], keep: 'k' });
});

test('loadLayeredJson merges <name>-user.json over <name>-default.json and creates a missing user file', () => {
  const dir = tmp();
  const def = path.join(dir, 'tool-default.json');
  const user = path.join(dir, 'tool-user.json');
  fs.writeFileSync(def, JSON.stringify({ a: 1, b: { c: 2 } }));
  assert.deepEqual(loadLayeredJson(def, user), { a: 1, b: { c: 2 } });
  assert.equal(fs.readFileSync(user, 'utf8'), '{}\n');
  fs.writeFileSync(user, JSON.stringify({ b: { d: 3 } }));
  assert.deepEqual(loadLayeredJson(def, user), { a: 1, b: { c: 2, d: 3 } });
});

test('loadLayeredJson reports a malformed user file instead of silently ignoring it', () => {
  const dir = tmp();
  const def = path.join(dir, 'x-default.json');
  const user = path.join(dir, 'x-user.json');
  fs.writeFileSync(def, '{}');
  fs.writeFileSync(user, '{ not json');
  assert.throws(() => loadLayeredJson(def, user), /x-user\.json/);
});
