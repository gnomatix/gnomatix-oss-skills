// Tests for scripts/version-bump.js as the pre-commit hook (.githooks/pre-commit).
//
//   node scripts/test/version-bump.test.js
//
// Each case builds a throwaway repo under os.tmpdir() with a copy of the hook and two
// plugins, then commits the way people do and checks HEAD, the index and the working tree.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// VERSION_BUMP_ROOT points the test at another copy of the script and hooks (e.g. an older revision).
const REPO_ROOT = process.env.VERSION_BUMP_ROOT ? path.resolve(process.env.VERSION_BUMP_ROOT) : path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'version-bump.js');
const HOOK_DIR = path.join(REPO_ROOT, '.githooks');
const HOOKS = fs.readdirSync(HOOK_DIR).filter((h) => ['pre-commit', 'post-commit'].includes(h));

let failures = 0;
function check(ok, what, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok || detail === undefined ? '' : `\n     got: ${JSON.stringify(detail)}`}`);
  if (!ok) failures += 1;
}

// Run git in the temp repo with no GIT_* variables leaking in from a calling hook.
const cleanEnv = {};
for (const [k, v] of Object.entries(process.env)) if (!k.startsWith('GIT_')) cleanEnv[k] = v;
function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: cleanEnv });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${r.stdout}${r.stderr}`);
  return r.stdout;
}
const put = (dir, rel, text) => {
  const p = path.join(dir, ...rel.split('/'));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};
const get = (dir, rel) => fs.readFileSync(path.join(dir, ...rel.split('/')), 'utf8');
const json = (v) => JSON.stringify(v, null, 2) + '\n';
const headJson = (dir, rel) => JSON.parse(git(dir, 'show', `HEAD:${rel}`));
const PJ = (p) => `plugins/${p}/.claude-plugin/plugin.json`;

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-bump-test-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 'version-bump test');
  git(dir, 'config', 'user.email', 'test@example.invalid');
  git(dir, 'config', 'commit.gpgsign', 'false');
  put(dir, 'scripts/version-bump.js', fs.readFileSync(SCRIPT, 'utf8'));
  for (const h of HOOKS) {
    put(dir, `.githooks/${h}`, fs.readFileSync(path.join(HOOK_DIR, h), 'utf8'));
    try { fs.chmodSync(path.join(dir, '.githooks', h), 0o755); } catch { /* Windows */ }
  }
  put(dir, 'VERSION', '0.1.0\n');
  put(dir, '.claude-plugin/marketplace.json', json({ name: 'test-marketplace', version: '0.1.0', owner: { name: 'test' }, plugins: [] }));
  for (const p of ['alpha', 'beta']) {
    put(dir, PJ(p), json({ name: p, description: `${p} plugin`, version: '0.1.0' }));
    put(dir, `plugins/${p}/README.md`, `${p}\n`);
  }
  git(dir, 'add', '-A');
  const r = spawnSync(process.execPath, [path.join('scripts', 'version-bump.js'), '--init'], { cwd: dir, encoding: 'utf8', env: cleanEnv });
  if (r.status !== 0) throw new Error(`--init failed: ${r.stderr}`);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'init');
  git(dir, 'config', 'core.hooksPath', '.githooks');
  return dir;
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
}

// 1. A pathspec commit with something else staged: the bump lands in the commit, and the
//    main index ends up matching HEAD for the bumped files (no MM), the other staged file
//    stays staged, and the next plain commit keeps the bump.
{
  const dir = makeRepo();
  try {
    check(headJson(dir, PJ('alpha')).version === '0.1.0', 'case 1 setup: init commit made no bump');
    put(dir, 'plugins/alpha/README.md', 'alpha changed\n');
    put(dir, 'unrelated.txt', 'staged, not part of the pathspec commit\n');
    git(dir, 'add', 'unrelated.txt');
    git(dir, 'commit', '-q', '-m', 'alpha only', '--', 'plugins/alpha/README.md');

    check(headJson(dir, PJ('alpha')).version === '0.1.1', 'case 1: the commit carries alpha 0.1.1', headJson(dir, PJ('alpha')).version);
    check(headJson(dir, '.VERSIONS.json').alpha.version === '0.1.1', 'case 1: the commit carries .VERSIONS.json alpha 0.1.1');
    const st = git(dir, 'status', '--porcelain', '--', '.VERSIONS.json', PJ('alpha'), 'VERSION');
    check(st === '', 'case 1: git status is clean for the bumped files after the commit', st);
    const staged = git(dir, 'diff', '--cached', '--name-only').trim();
    check(staged === 'unrelated.txt', 'case 1: unrelated.txt is still staged, and only it', staged);
    const inHead = git(dir, 'ls-tree', '--name-only', 'HEAD', '--', 'unrelated.txt').trim();
    check(inHead === '', 'case 1: unrelated.txt is not in the pathspec commit', inHead);

    git(dir, 'commit', '-q', '-m', 'the staged file');
    check(headJson(dir, PJ('alpha')).version === '0.1.1', 'case 1: the next plain commit keeps alpha 0.1.1', headJson(dir, PJ('alpha')).version);
    check(headJson(dir, '.VERSIONS.json').alpha.version === '0.1.1', 'case 1: the next plain commit keeps .VERSIONS.json alpha 0.1.1');
    const st2 = git(dir, 'status', '--porcelain');
    check(st2 === '', 'case 1: the tree is clean after both commits', st2);
  } finally { cleanup(dir); }
}

// 2. A working-tree .VERSIONS.json that is out of date with the index (unstaged) must not
//    make the hook bump a plugin whose content did not change.
{
  const dir = makeRepo();
  try {
    const stale = JSON.parse(get(dir, '.VERSIONS.json'));
    stale.alpha.git_hash = '0000000000000000000000000000000000000000';
    put(dir, '.VERSIONS.json', json(stale));
    put(dir, 'plugins/beta/README.md', 'beta changed\n');
    git(dir, 'add', 'plugins/beta/README.md');
    git(dir, 'commit', '-q', '-m', 'beta only');
    check(headJson(dir, PJ('alpha')).version === '0.1.0', 'case 2: alpha (unchanged) is not bumped by a stale working-tree manifest', headJson(dir, PJ('alpha')).version);
    check(headJson(dir, PJ('beta')).version === '0.1.1', 'case 2: beta (changed) is bumped once', headJson(dir, PJ('beta')).version);
    check(headJson(dir, '.VERSIONS.json').alpha.git_hash !== stale.alpha.git_hash, 'case 2: the stale working-tree hash is not committed');
  } finally { cleanup(dir); }
}

// 3. A working-tree plugin.json with unstaged edits: the commit gets the staged content
//    plus the bump, not the unstaged edits; the working tree keeps its edits and gets the bump.
{
  const dir = makeRepo();
  try {
    const wt = JSON.parse(get(dir, PJ('alpha')));
    wt.description = 'unstaged edit';
    put(dir, PJ('alpha'), json(wt));
    put(dir, 'plugins/alpha/README.md', 'alpha changed\n');
    git(dir, 'add', 'plugins/alpha/README.md');
    git(dir, 'commit', '-q', '-m', 'alpha readme');
    const head = headJson(dir, PJ('alpha'));
    check(head.version === '0.1.1', 'case 3: alpha is bumped', head.version);
    check(head.description === 'alpha plugin', 'case 3: the unstaged plugin.json edit is not committed', head.description);
    const now = JSON.parse(get(dir, PJ('alpha')));
    check(now.description === 'unstaged edit' && now.version === '0.1.1', 'case 3: the working tree keeps the edit and has the bump', now);
  } finally { cleanup(dir); }
}

// 4. A plain commit still bumps, stages and leaves a clean tree.
{
  const dir = makeRepo();
  try {
    put(dir, 'plugins/beta/README.md', 'beta changed\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'beta');
    check(headJson(dir, PJ('beta')).version === '0.1.1', 'case 4: plain commit bumps beta');
    check(headJson(dir, PJ('alpha')).version === '0.1.0', 'case 4: plain commit leaves alpha');
    const st = git(dir, 'status', '--porcelain');
    check(st === '', 'case 4: tree clean after a plain commit', st);
  } finally { cleanup(dir); }
}

// 5. git commit -a bumps once and leaves a clean tree.
{
  const dir = makeRepo();
  try {
    put(dir, 'plugins/alpha/README.md', 'alpha changed\n');
    git(dir, 'commit', '-q', '-a', '-m', 'alpha -a');
    check(headJson(dir, PJ('alpha')).version === '0.1.1', 'case 5: commit -a bumps alpha');
    check(headJson(dir, '.VERSIONS.json').alpha.version === '0.1.1', 'case 5: commit -a records alpha 0.1.1');
    const st = git(dir, 'status', '--porcelain');
    check(st === '', 'case 5: tree clean after commit -a', st);
  } finally { cleanup(dir); }
}

// 6. A pathspec commit that names the plugin's plugin.json itself (with an edit to it)
//    and something else staged: the edit and the bump are committed, the index matches.
{
  const dir = makeRepo();
  try {
    const wt = JSON.parse(get(dir, PJ('beta')));
    wt.description = 'beta edited';
    put(dir, PJ('beta'), json(wt));
    put(dir, 'unrelated.txt', 'staged\n');
    git(dir, 'add', 'unrelated.txt');
    git(dir, 'commit', '-q', '-m', 'beta manifest', '--', PJ('beta'));
    const head = headJson(dir, PJ('beta'));
    check(head.version === '0.1.1' && head.description === 'beta edited', 'case 6: the commit carries the edit and the bump', head);
    const st = git(dir, 'status', '--porcelain', '--', '.VERSIONS.json', PJ('beta'));
    check(st === '', 'case 6: git status is clean for the bumped files', st);
    const staged = git(dir, 'diff', '--cached', '--name-only').trim();
    check(staged === 'unrelated.txt', 'case 6: unrelated.txt is still staged, and only it', staged);
  } finally { cleanup(dir); }
}

// 7. A pathspec commit with a plugin file that changes nothing in any plugin leaves no
//    record behind for post-commit, and a later plain commit makes no bump.
{
  const dir = makeRepo();
  try {
    put(dir, 'notes.txt', 'n\n');
    git(dir, 'add', 'notes.txt');
    put(dir, 'other.txt', 'o\n');
    git(dir, 'add', 'other.txt');
    git(dir, 'commit', '-q', '-m', 'notes', '--', 'notes.txt');
    check(!fs.existsSync(path.join(dir, '.git', 'version-bump-pending.json')), 'case 7: no pending record after a commit with no bump');
    git(dir, 'commit', '-q', '-m', 'other');
    check(headJson(dir, PJ('alpha')).version === '0.1.0' && headJson(dir, PJ('beta')).version === '0.1.0', 'case 7: no plugin bumped');
  } finally { cleanup(dir); }
}

// 8. release.sh's --ci catches a plugin a commit made without the hook missed: it bumps
//    the plugin and VERSION, stages both, and the working tree matches the index.
{
  const dir = makeRepo();
  try {
    git(dir, 'config', '--unset', 'core.hooksPath');
    put(dir, 'plugins/alpha/README.md', 'alpha changed\n');
    git(dir, 'commit', '-q', '-a', '-m', 'without the hook');
    const r = spawnSync(process.execPath, [path.join('scripts', 'version-bump.js'), '--ci'], { cwd: dir, encoding: 'utf8', env: cleanEnv });
    check(r.status === 0, 'case 8: --ci exits 0', r.stderr);
    const staged = git(dir, 'diff', '--cached', '--name-only').trim().split(/\r?\n/).sort().join(',');
    check(staged === `.VERSIONS.json,.claude-plugin/marketplace.json,VERSION,${PJ('alpha')}`, 'case 8: --ci stages the manifest, marketplace.json, VERSION and alpha plugin.json', staged);
    const unstaged = git(dir, 'diff', '--name-only').trim();
    check(unstaged === '', 'case 8: working tree matches the index after --ci', unstaged);
    check(get(dir, 'VERSION') === '0.1.1\n', 'case 8: VERSION bumped to 0.1.1', get(dir, 'VERSION'));
    check(JSON.parse(get(dir, '.claude-plugin/marketplace.json')).version === '0.1.1', 'case 8: marketplace.json version bumped to 0.1.1');
    check(JSON.parse(get(dir, PJ('alpha'))).version === '0.1.1', 'case 8: alpha bumped to 0.1.1');
  } finally { cleanup(dir); }
}

// 9. A clone the old hook left with pre-bump blobs staged (MM): the next plain commit
//    puts HEAD's version back in the index instead of bumping again, and with a real
//    change bumps from HEAD's version, never from the stale one.
{
  const dir = makeRepo();
  try {
    put(dir, 'plugins/alpha/README.md', 'alpha changed\n');
    git(dir, 'commit', '-q', '-a', '-m', 'alpha 0.1.1');
    git(dir, 'restore', '--staged', '--source=HEAD~1', '--', '.VERSIONS.json', PJ('alpha'));
    put(dir, 'unrelated.txt', 'u\n');
    git(dir, 'add', 'unrelated.txt');
    git(dir, 'commit', '-q', '-m', 'plain');
    check(headJson(dir, PJ('alpha')).version === '0.1.1', 'case 9: a stale staged plugin.json is put back to HEAD, not bumped', headJson(dir, PJ('alpha')).version);
    check(headJson(dir, '.VERSIONS.json').alpha.version === '0.1.1', 'case 9: the manifest keeps alpha 0.1.1');
    const st = git(dir, 'status', '--porcelain');
    check(st === '', 'case 9: tree clean', st);
    git(dir, 'restore', '--staged', '--source=HEAD~2', '--', '.VERSIONS.json', PJ('alpha'));
    put(dir, 'plugins/alpha/README.md', 'alpha changed again\n');
    git(dir, 'add', 'plugins/alpha/README.md');
    git(dir, 'commit', '-q', '-m', 'alpha again');
    check(headJson(dir, PJ('alpha')).version === '0.1.2', 'case 9: a real change bumps from HEAD (0.1.1 -> 0.1.2), not from the stale 0.1.0', headJson(dir, PJ('alpha')).version);
  } finally { cleanup(dir); }
}

// 10. release.sh's --bump-version bumps VERSION and the manifest's _marketplace version,
//     staged and in the working tree.
{
  const dir = makeRepo();
  try {
    const r = spawnSync(process.execPath, [path.join('scripts', 'version-bump.js'), '--bump-version'], { cwd: dir, encoding: 'utf8', env: cleanEnv });
    check(r.status === 0, 'case 10: --bump-version exits 0', r.stderr);
    check(get(dir, 'VERSION') === '0.1.1\n' && git(dir, 'show', ':VERSION') === '0.1.1\n', 'case 10: VERSION 0.1.1 in the working tree and the index');
    check(JSON.parse(git(dir, 'show', ':.claude-plugin/marketplace.json')).version === '0.1.1', 'case 10: staged marketplace.json has version 0.1.1');
    check(JSON.parse(git(dir, 'show', ':.VERSIONS.json'))._marketplace.version === '0.1.1', 'case 10: staged manifest has _marketplace 0.1.1');
    const unstaged = git(dir, 'diff', '--name-only').trim();
    check(unstaged === '', 'case 10: working tree matches the index', unstaged);
  } finally { cleanup(dir); }
}

console.log(failures ? `\n${failures} failure(s)` : '\nall passed');
process.exit(failures ? 1 : 0);
