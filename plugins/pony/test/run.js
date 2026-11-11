// pony tests: node plugins/pony/test/run.js
// Dependency-free; spawns the script with process.execPath and also imports it as a module.
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'skills', 'pony', 'scripts', 'epithets.mjs');
const LEXICON = path.join(ROOT, 'skills', 'pony', 'references', 'lexicon.rules');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
function run(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', ...opts });
}
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

(async () => {
  check('the script exists', () => assert.ok(fs.existsSync(SCRIPT), SCRIPT));
  check('the lexicon exists', () => assert.ok(fs.existsSync(LEXICON), LEXICON));

  check('the shipped lexicon holds no plaintext expletive', () => {
    const text = fs.readFileSync(LEXICON, 'utf8').toLowerCase();
    for (const w of ['prick', 'asshole', 'cocksucker', 'idiot', 'stupid', 'sycophant', 'assfuckery', 'asshattery']) {
      assert.ok(!text.includes(w), `plaintext "${w}" found in lexicon.rules`);
    }
  });

  check('the shipped SKILL.md and README hold no plaintext expletive', () => {
    for (const f of [path.join(ROOT, 'skills', 'pony', 'SKILL.md'), path.join(ROOT, 'README.md')]) {
      const text = fs.readFileSync(f, 'utf8').toLowerCase();
      for (const w of ['cocksucker', 'assfuckery', 'asshattery', 'asshole', 'prick']) {
        assert.ok(!text.includes(w), `plaintext "${w}" in ${path.basename(f)}`);
      }
    }
  });

  check('decode prints the eight epithet rows with their tags', () => {
    const r = run(['decode']);
    assert.strictEqual(r.status, 0, r.stderr);
    const lines = r.stdout.trim().split(/\r?\n/).filter((l) => l.startsWith('epithet'));
    assert.strictEqual(lines.length, 8, r.stdout);
    assert.ok(/epithet\s+asshole\s+#ego\/#lazy/.test(r.stdout), r.stdout);
    assert.ok(/epithet\s+load bearing\s+#pomp/.test(r.stdout), r.stdout);
  });

  check('decode prints the three terms with their roles', () => {
    const r = run(['decode']);
    const terms = r.stdout.split(/\r?\n/).filter((l) => l.startsWith('term'));
    assert.strictEqual(terms.length, 3, r.stdout);
    assert.ok(terms.some((l) => /flagged-agent-term/.test(l)), r.stdout);
  });

  check('term <role> prints the decoded term alone', () => {
    const r = run(['term', 'strong-grep-token']);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(r.stdout.trim(), Buffer.from('YXNzZnVja2VyeQ==', 'base64').toString('utf8'));
  });

  check('term with an unknown role exits 1 and names it', () => {
    const r = run(['term', 'nope']);
    assert.strictEqual(r.status, 1);
    assert.ok(/nope/.test(r.stderr), r.stderr);
  });

  check('match reads stdin and prints the tags of each epithet found, in order of first appearance', () => {
    const text = 'You stupid fucking asshole. Load-bearing? That was a load bearing claim.';
    const r = run(['match', '-'], { input: text });
    assert.strictEqual(r.status, 0, r.stderr);
    const lines = r.stdout.trim().split(/\r?\n/);
    assert.deepStrictEqual(lines.map((l) => l.split('\t')[0]), ['stupid', 'asshole', 'load bearing'], r.stdout);
    assert.ok(/#wrong/.test(lines[0]) && /#ego\/#lazy/.test(lines[1]) && /#pomp/.test(lines[2]), r.stdout);
  });

  check('match is case-insensitive and whole-word (no hit inside a longer word)', () => {
    const r = run(['match', '-'], { input: 'IDIOT. pricked my finger. Laziness. lazy.' });
    const words = r.stdout.trim().split(/\r?\n/).map((l) => l.split('\t')[0]);
    assert.deepStrictEqual(words, ['idiot', 'lazy'], r.stdout);
  });

  check('match --tags prints the union of tags, one line, in first-seen order', () => {
    const r = run(['match', '--tags', '-'], { input: 'asshole, then idiot, then asshole again' });
    assert.strictEqual(r.stdout.trim(), '#ego #lazy #wrong', r.stdout);
  });

  check('match with no epithet exits 1 and prints nothing on stdout', () => {
    const r = run(['match', '-'], { input: 'Keep the snapshots.' });
    assert.strictEqual(r.status, 1);
    assert.strictEqual(r.stdout, '');
  });

  check('encode prints the base64 form of a word, for adding a row', () => {
    const r = run(['encode', 'load bearing']);
    assert.strictEqual(r.stdout.trim(), b64('load bearing'));
  });

  check('PONY_EPITHETS in the environment overrides the shipped rows', () => {
    const r = run(['match', '--tags', '-'], { input: 'frack', env: { ...process.env, PONY_EPITHETS: `${b64('frack')}:#test` } });
    assert.strictEqual(r.stdout.trim(), '#test', r.stdout + r.stderr);
  });

  check('a malformed rule part is reported on stderr and skipped, the rest still load', () => {
    const r = run(['decode'], { env: { ...process.env, PONY_EPITHETS: `garbage,${b64('frack')}:#test` } });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(/garbage/.test(r.stderr), r.stderr);
    assert.ok(/epithet\s+frack\s+#test/.test(r.stdout), r.stdout);
  });

  check('match reads a file path as well as stdin', () => {
    const f = path.join(os.tmpdir(), `pony-test-${process.pid}.txt`);
    fs.writeFileSync(f, 'sycophant');
    try {
      const r = run(['match', '--tags', f]);
      assert.strictEqual(r.stdout.trim(), '#syco', r.stdout + r.stderr);
    } finally { fs.rmSync(f, { force: true }); }
  });

  check('usage error exits 2', () => {
    const r = run(['frobnicate']);
    assert.strictEqual(r.status, 2);
  });

  let mod = null;
  try { mod = await import(pathToFileURL(SCRIPT).href); } catch (e) { /* reported below */ }
  check('module exports loadLexicon and matchEpithets', () => {
    assert.ok(mod && typeof mod.loadLexicon === 'function' && typeof mod.matchEpithets === 'function');
  });
  check('module: matchEpithets returns word, tags and index', () => {
    const lex = mod.loadLexicon({});
    const hits = mod.matchEpithets('a sycophant reply', lex);
    assert.deepStrictEqual(hits.map((h) => [h.word, h.tags]), [['sycophant', ['#syco']]]);
    assert.strictEqual(typeof hits[0].index, 'number');
  });

  console.log(failed ? `${failed} failed` : 'all passed');
  process.exit(failed ? 1 : 0);
})();
