// Version bump for the marketplace, run by .githooks/pre-commit on main.
//
// The npm-packages model: each plugin keeps its own version, and a plugin's patch number
// goes up only when its content changes. A change is a new git tree hash for the
// plugin's folder in the commit being made (`git write-tree --prefix=plugins/<p>/`),
// compared with the hash recorded in .VERSIONS.json. The root VERSION file is the
// marketplace's own version; its patch goes up whenever any plugin's does.
//
//   node scripts/version-bump.js          bump what changed and stage it (the hook)
//   node scripts/version-bump.js --init   record the current hashes as the baseline, bump nothing
//
// Outside main it does nothing.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, '.VERSIONS.json');
const VERSION_FILE = path.join(ROOT, 'VERSION');

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const bumpPatch = (v) => { const p = String(v).split('.').map(Number); p[2] = (p[2] || 0) + 1; return p.join('.'); };

const init = process.argv.includes('--init');
if (!init && git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main') process.exit(0);

const manifest = fs.existsSync(MANIFEST) ? readJson(MANIFEST) : {};
let bumped = 0;

for (const name of fs.readdirSync(path.join(ROOT, 'plugins')).sort()) {
  const rel = `plugins/${name}`;
  const pluginJson = path.join(ROOT, rel, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(pluginJson)) continue;
  const hash = git('write-tree', `--prefix=${rel}/`);
  if (!init && manifest[name] && manifest[name].git_hash === hash) continue;
  const pj = readJson(pluginJson);
  if (!init) {
    const old = pj.version;
    pj.version = bumpPatch(pj.version || '0.0.0');
    writeJson(pluginJson, pj);
    git('add', path.relative(ROOT, pluginJson));
    console.log(`version-bump: ${name} ${old} -> ${pj.version}`);
    bumped++;
  }
  manifest[name] = { version: pj.version, git_hash: git('write-tree', `--prefix=${rel}/`), path: rel };
}

if (bumped) {
  const v = bumpPatch(fs.readFileSync(VERSION_FILE, 'utf8').trim());
  fs.writeFileSync(VERSION_FILE, v + '\n');
  console.log(`version-bump: VERSION -> ${v}`);
}
writeJson(MANIFEST, manifest);
git('add', 'VERSION', '.VERSIONS.json');
