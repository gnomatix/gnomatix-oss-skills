'use strict';
// js-yaml loader, copied from skill-vv/lib/vv.js (gnomatix-oss-skills). Keep the two in step.
// js-yaml is made available with: mise use -g npm:js-yaml@4.1.0
const fs = require('fs');
const path = require('path');
const os = require('os');

const JS_YAML_INSTALL = 'mise use -g npm:js-yaml@4.1.0';

// ---------- js-yaml resolution ----------

function miseDataDirs() {
  const dirs = [];
  if (process.env.MISE_DATA_DIR) dirs.push(process.env.MISE_DATA_DIR);
  if (process.env.XDG_DATA_HOME) dirs.push(path.join(process.env.XDG_DATA_HOME, 'mise'));
  dirs.push(path.join(os.homedir(), '.local', 'share', 'mise'));
  if (process.env.LOCALAPPDATA) dirs.push(path.join(process.env.LOCALAPPDATA, 'mise'));
  return dirs;
}

function findInMise() {
  for (const d of miseDataDirs()) {
    const hit = findInMiseBase(path.join(d, 'installs', 'npm-js-yaml'));
    if (hit) return hit;
  }
  return null;
}

function findInMiseBase(base) {
  let versions;
  try { versions = fs.readdirSync(base).sort().reverse(); } catch { return null; }
  for (const v of versions) {
    const candidates = [
      path.join(base, v, 'node_modules', 'js-yaml'),
      path.join(base, v, 'lib', 'node_modules', 'js-yaml'),
    ];
    try {
      const store = path.join(base, v, 'node_modules', '.mise');
      for (const d of fs.readdirSync(store)) {
        if (d.startsWith('js-yaml@')) candidates.push(path.join(store, d, 'node_modules', 'js-yaml'));
      }
    } catch { /* layout without a .mise store */ }
    for (const c of candidates) {
      try { if (fs.existsSync(path.join(c, 'package.json'))) return c; } catch { /* keep looking */ }
    }
  }
  return null;
}

// Only directories under the user's own home or LOCALAPPDATA are trusted,
// and only a package that names itself js-yaml. No bare require(): that
// would search every node_modules above the plugin.
function trustedYamlDir(dir) {
  if (!dir) return false;
  const real = (() => { try { return fs.realpathSync(dir); } catch { return null; } })();
  if (!real) return false;
  // MISE_DATA_DIR is trusted when the user sets it: whoever controls the
  // environment already controls which node runs.
  const bases = [os.homedir(), process.env.LOCALAPPDATA, process.env.MISE_DATA_DIR].filter(Boolean).map((b) => {
    try { return fs.realpathSync(b); } catch { return path.resolve(b); }
  });
  const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const under = bases.some((b) => norm(real) === norm(b) || norm(real).startsWith(norm(b) + path.sep));
  if (!under) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(real, 'package.json'), 'utf8'));
    return pkg && pkg.name === 'js-yaml';
  } catch { return false; }
}

let yamlLib = null;
function yaml() {
  if (yamlLib) return yamlLib;
  const dir = findInMise();
  if (dir && trustedYamlDir(dir)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    yamlLib = require(fs.realpathSync(dir));
    return yamlLib;
  }
  const err = new Error(`js-yaml is not available. Install it with: ${JS_YAML_INSTALL}`);
  err.code = 'SPANK_DARIO_NO_YAML';
  throw err;
}

module.exports = { yaml, JS_YAML_INSTALL };
