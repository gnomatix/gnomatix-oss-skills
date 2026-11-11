// Version bump for the marketplace.
//
// The npm-packages model: each plugin keeps its own version, and a plugin's patch number
// goes up only when its content changes. A change is a new git tree hash for the
// plugin's folder in the commit being made (`git write-tree --prefix=plugins/<p>/`),
// compared with the hash recorded in .VERSIONS.json. The root VERSION file is the
// marketplace's own version; its patch goes up whenever any plugin's version changes.
//
//   node scripts/version-bump.js          the pre-commit hook (main only): bump the
//                                         plugins that changed and stage them
//   node scripts/version-bump.js --ci     scripts/release.sh, before each release: bump
//                                         any plugin a commit made without the hook
//                                         missed, and bump VERSION when any plugin's
//                                         version changed; stages what it changed
//   node scripts/version-bump.js --bump-version
//                                         release.sh, when VERSION is already released:
//                                         bump VERSION's patch; stages it
//   node scripts/version-bump.js --init   record the current state as the baseline,
//                                         bump nothing
//   node scripts/version-bump.js --post-commit
//                                         the post-commit hook: after a pathspec commit,
//                                         bring the main index up to the bumped files
//
// Only --ci and --bump-version write VERSION, so the hook never changes it. Whether
// plugin versions changed is a fingerprint of every plugin's version, kept in
// .VERSIONS.json under "_marketplace".
//
// Everything is read from the index being committed (`git show :<path>`, which follows
// GIT_INDEX_FILE), never from the working tree, and the bumped files are staged as blobs
// (`git hash-object -w` + `git update-index --cacheinfo`), never with `git add`. So an
// out-of-date or half-edited working-tree manifest can neither cause a bump nor end up in
// the commit. In the working tree only the fields the bump changed are rewritten.
//
// GIT_INDEX_FILE in pre-commit: a plain commit gets <gitdir>/index, -a and -i get
// <gitdir>/index.lock, a pathspec commit (`git commit -- <paths>`, --only) gets a
// temporary <gitdir>/next-index-<pid>.lock. In the pathspec case git has already written
// the main index (HEAD's tree plus the paths, plus what was staged before) and keeps it
// locked until the commit is done, so the hook cannot update it; the bumped files would be
// left there at their pre-bump blobs, staged as a reversion of the bump. The hook records
// each bumped path with its pre-bump and bumped blobs in <gitdir>/version-bump-pending.json,
// and the post-commit hook resets each such path to HEAD when the main index still has the
// pre-bump blob and HEAD has the bumped one.

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = '.VERSIONS.json';
const VERSION_FILE = 'VERSION';
const MARKET = '_marketplace';
const PENDING = 'version-bump-pending.json';

const git = (args, opts = {}) => execFileSync('git', args, Object.assign({ cwd: ROOT, encoding: 'utf8' }, opts));
const gitLine = (args, opts) => git(args, opts).trim();
const tryGit = (args, opts) => { try { return git(args, Object.assign({ stdio: ['pipe', 'pipe', 'ignore'] }, opts)); } catch { return null; } };
const toJson = (v) => JSON.stringify(v, null, 2) + '\n';
const wtPath = (rel) => path.join(ROOT, ...rel.split('/'));
const bumpPatch = (v) => { const p = String(v).split('.').map(Number); p[2] = (p[2] || 0) + 1; return p.join('.'); };
const cmpVersion = (a, b) => {
  const pa = String(a || '0.0.0').split('.').map(Number);
  const pb = String(b || '0.0.0').split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};
const warn = (msg) => process.stderr.write(`version-bump: ${msg}\n`);

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (err) { if (err.code !== 'ENOENT') warn(`cannot read ${p}: ${err.code || err.message}`); return null; }
}
function removeFile(p) {
  try { fs.unlinkSync(p); } catch (err) { if (err.code !== 'ENOENT') warn(`cannot remove ${p}: ${err.code || err.message}`); }
}
function atomicWrite(targetPath, contents) {
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
    warn(`cannot write ${targetPath}: ${err.code || err.message}`);
    return false;
  }
}
const parseJson = (text) => { try { return JSON.parse(text); } catch { return null; } };

// The git dir, resolved to an absolute path, and the index the hook is writing to.
const gitDir = path.resolve(ROOT, gitLine(['rev-parse', '--git-dir']));
const indexFile = process.env.GIT_INDEX_FILE ? path.resolve(ROOT, process.env.GIT_INDEX_FILE) : path.join(gitDir, 'index');
const pathspecCommit = ![path.join(gitDir, 'index'), path.join(gitDir, 'index.lock')].includes(indexFile);
const pendingFile = path.join(gitDir, PENDING);

// Content of <rel> in the index being committed, or null when it is not there.
const indexText = (rel) => tryGit(['show', `:${rel}`]);
const indexBlob = (rel, opts) => { const out = tryGit(['rev-parse', '-q', '--verify', `:${rel}`], opts); return out ? out.trim() : null; };

// Stage <text> as <rel> in the index being committed, without touching the working tree.
function stage(rel, text) {
  const blob = gitLine(['hash-object', '-w', '--stdin', `--path=${rel}`], { input: text });
  gitLine(['update-index', '--add', '--cacheinfo', `100644,${blob},${rel}`]);
  return blob;
}

// Rewrite the working-tree copy of <rel>: when it matched the old staged text, write the new
// staged text; otherwise apply <edit> to its own JSON so unstaged edits there survive.
const normEol = (s) => (typeof s === 'string' ? s.replace(/\r\n/g, '\n') : s);
function updateWorkingTree(rel, oldText, newText, edit) {
  const p = wtPath(rel);
  const current = readFile(p);
  if (current === null || normEol(current) === normEol(oldText)) { atomicWrite(p, newText); return; }
  const obj = edit ? parseJson(current) : null;
  if (!obj) { warn(`${rel} in the working tree differs from the index; left as is`); return; }
  edit(obj);
  atomicWrite(p, toJson(obj));
}

const pending = [];
// Stage the new text of <rel> and update the working tree; note it for post-commit.
function write(rel, oldText, newText, edit) {
  const before = indexBlob(rel);
  const after = stage(rel, newText);
  updateWorkingTree(rel, oldText, newText, edit);
  if (before !== after) pending.push({ path: rel, before, after });
}

// --- post-commit: bring the main index up to the bumped files of a pathspec commit -------
if (process.argv.includes('--post-commit')) {
  const text = readFile(pendingFile);
  if (text === null) process.exit(0);
  removeFile(pendingFile);
  const record = parseJson(text);
  const head = tryGit(['rev-parse', '-q', '--verify', 'HEAD']);
  if (!record || !Array.isArray(record.paths) || !head || String(record.parent).trim() !== String(tryGit(['rev-parse', '-q', '--verify', 'HEAD^'])).trim()) process.exit(0);
  for (const { path: rel, before, after } of record.paths) {
    const inHead = tryGit(['rev-parse', '-q', '--verify', `HEAD:${rel}`]);
    if (!inHead || inHead.trim() !== after) continue;
    if (indexBlob(rel) !== before) continue;
    git(['reset', '-q', '--', rel]);
  }
  process.exit(0);
}

const init = process.argv.includes('--init');
const ci = process.argv.includes('--ci');
const bumpVersion = process.argv.includes('--bump-version');
const hook = !init && !ci && !bumpVersion;
if (hook) {
  removeFile(pendingFile); // left over from an aborted commit
  const branch = tryGit(['symbolic-ref', '-q', '--short', 'HEAD']);
  if (!branch || branch.trim() !== 'main') process.exit(0);
}

const manifestText = indexText(MANIFEST);
const manifest = (manifestText && parseJson(manifestText)) || {};
const manifestOld = manifestText === null ? null : manifestText;
const changed = {};

function writeManifest() {
  const newText = toJson(manifest);
  if (newText === manifestText) return;
  write(MANIFEST, manifestOld, newText, (m) => Object.assign(m, changed));
}

function writeVersion(v) {
  const oldText = indexText(VERSION_FILE);
  write(VERSION_FILE, oldText, v + '\n', null);
}

if (bumpVersion) {
  const current = (indexText(VERSION_FILE) || '').trim();
  const v = bumpPatch(current);
  writeVersion(v);
  manifest[MARKET] = Object.assign({}, manifest[MARKET], { version: v });
  changed[MARKET] = manifest[MARKET];
  writeManifest();
  console.log(`version-bump: VERSION ${current} -> ${v}`);
  process.exit(0);
}

const versions = {};
const pluginJsons = gitLine(['ls-files', '-z', '--', ':(glob)plugins/*/.claude-plugin/plugin.json'])
  .split('\0').filter(Boolean).sort();

for (const pjRel of pluginJsons) {
  const rel = pjRel.split('/').slice(0, 2).join('/');
  const name = rel.split('/')[1];
  const pjText = indexText(pjRel);
  const pj = pjText && parseJson(pjText);
  if (!pj) { warn(`${pjRel} in the index is not valid JSON; skipped`); continue; }
  const hash = gitLine(['write-tree', `--prefix=${rel}/`]);
  if (init || !manifest[name] || manifest[name].git_hash !== hash) {
    const headText = init ? null : tryGit(['show', `HEAD:${pjRel}`]);
    const headPj = headText && parseJson(headText);
    const behindHead = headPj && cmpVersion(headPj.version, pj.version) > 0;
    // An index left behind HEAD by the old hook (a pathspec commit left the pre-bump
    // plugin.json staged): when the plugin's only difference from HEAD is that stale
    // version, stage HEAD's plugin.json and manifest entry back instead of bumping again.
    const differs = behindHead ? gitLine(['diff-index', '--cached', '--name-only', 'HEAD', '--', `${rel}/`]).split(/\r?\n/).filter(Boolean) : null;
    const headManifestText = behindHead ? tryGit(['show', `HEAD:${MANIFEST}`]) : null;
    const headEntry = headManifestText && (parseJson(headManifestText) || {})[name];
    if (behindHead && differs.length === 1 && differs[0] === pjRel
        && JSON.stringify(Object.assign({}, pj, { version: headPj.version })) === JSON.stringify(headPj)
        && headEntry && headEntry.version === headPj.version) {
      write(pjRel, pjText, headText, (o) => { o.version = headPj.version; });
      console.log(`version-bump: ${name} ${pj.version} -> ${headPj.version} (the version HEAD already has; index was behind)`);
      pj.version = headPj.version;
      manifest[name] = Object.assign({}, headEntry, { git_hash: gitLine(['write-tree', `--prefix=${rel}/`]) });
      changed[name] = manifest[name];
      versions[name] = pj.version;
      continue;
    }
    if (!init) {
      const old = pj.version;
      // Never go below what HEAD already has, so a clone whose index is behind HEAD
      // cannot reuse a released version number for different content.
      const base = behindHead ? headPj.version : pj.version;
      pj.version = bumpPatch(base || '0.0.0');
      write(pjRel, pjText, toJson(pj), (o) => { o.version = pj.version; });
      console.log(`version-bump: ${name} ${old} -> ${pj.version}`);
    }
    manifest[name] = { version: pj.version, git_hash: gitLine(['write-tree', `--prefix=${rel}/`]), path: rel };
    changed[name] = manifest[name];
  }
  versions[name] = pj.version;
}

if (ci || init) {
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify(versions)).digest('hex');
  const current = (indexText(VERSION_FILE) || '').trim();
  const market = manifest[MARKET] || {};
  if (init) {
    manifest[MARKET] = { version: current, plugins_fingerprint: fingerprint };
    changed[MARKET] = manifest[MARKET];
  } else if (market.plugins_fingerprint !== fingerprint) {
    const v = bumpPatch(current);
    writeVersion(v);
    manifest[MARKET] = { version: v, plugins_fingerprint: fingerprint };
    changed[MARKET] = manifest[MARKET];
    console.log(`version-bump: VERSION ${current} -> ${v}`);
  }
}

writeManifest();

if (hook && pathspecCommit && pending.length) {
  const parent = (tryGit(['rev-parse', '-q', '--verify', 'HEAD']) || '').trim() || null;
  atomicWrite(pendingFile, toJson({ parent, paths: pending }));
}
