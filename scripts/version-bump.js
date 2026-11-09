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
//
// Only --ci and --bump-version write VERSION, so the hook never changes it. Whether
// plugin versions changed is a fingerprint of every plugin's version, kept in
// .VERSIONS.json under "_marketplace".

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, '.VERSIONS.json');
const VERSION_FILE = path.join(ROOT, 'VERSION');
const MARKET = '_marketplace';

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const bumpPatch = (v) => { const p = String(v).split('.').map(Number); p[2] = (p[2] || 0) + 1; return p.join('.'); };

const init = process.argv.includes('--init');
const ci = process.argv.includes('--ci');
const bumpVersion = process.argv.includes('--bump-version');
if (!init && !ci && !bumpVersion && git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main') process.exit(0);

const manifest = fs.existsSync(MANIFEST) ? readJson(MANIFEST) : {};

if (bumpVersion) {
  const current = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  const v = bumpPatch(current);
  fs.writeFileSync(VERSION_FILE, v + '\n');
  manifest[MARKET] = Object.assign({}, manifest[MARKET], { version: v });
  writeJson(MANIFEST, manifest);
  git('add', 'VERSION', '.VERSIONS.json');
  console.log(`version-bump: VERSION ${current} -> ${v}`);
  process.exit(0);
}
const versions = {};

for (const name of fs.readdirSync(path.join(ROOT, 'plugins')).sort()) {
  const rel = `plugins/${name}`;
  const pluginJson = path.join(ROOT, rel, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(pluginJson)) continue;
  const pj = readJson(pluginJson);
  // A plugin directory with nothing in the index yet (new, not staged) has no tree to hash; skip it.
  let hash;
  try { hash = git('write-tree', `--prefix=${rel}/`); } catch { console.log(`version-bump: ${name} is not in the index; skipped`); continue; }
  if (init || !manifest[name] || manifest[name].git_hash !== hash) {
    if (!init) {
      const old = pj.version;
      pj.version = bumpPatch(pj.version || '0.0.0');
      writeJson(pluginJson, pj);
      git('add', path.relative(ROOT, pluginJson));
      console.log(`version-bump: ${name} ${old} -> ${pj.version}`);
    }
    manifest[name] = { version: pj.version, git_hash: git('write-tree', `--prefix=${rel}/`), path: rel };
  }
  versions[name] = pj.version;
}

if (ci || init) {
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify(versions)).digest('hex');
  const current = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  const market = manifest[MARKET] || {};
  if (init) {
    manifest[MARKET] = { version: current, plugins_fingerprint: fingerprint };
  } else if (market.plugins_fingerprint !== fingerprint) {
    const v = bumpPatch(current);
    fs.writeFileSync(VERSION_FILE, v + '\n');
    manifest[MARKET] = { version: v, plugins_fingerprint: fingerprint };
    console.log(`version-bump: VERSION ${current} -> ${v}`);
  }
}

writeJson(MANIFEST, manifest);
git('add', 'VERSION', '.VERSIONS.json');
