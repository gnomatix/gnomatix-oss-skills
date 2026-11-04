// skill-vv — core
//
// Reads VV.md files (YAML frontmatter, schema in
// skills/skill-vv/references/vv-schema.md), checks requirements, and decides
// which procedures still need verification and validation for a model and
// platform. Pure Node; YAML parsing is js-yaml, made available with
// `mise use -g npm:js-yaml@4.1.0`.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.homedir(), '.local', 'state', 'skill-vv');
const RESULTS_FILE = path.join(STATE_DIR, 'results.jsonl');
const DECLINED_FILE = path.join(STATE_DIR, 'declined.json');
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

let yamlLib = null;
function yaml() {
  if (yamlLib) return yamlLib;
  try {
    // eslint-disable-next-line global-require
    yamlLib = require('js-yaml');
    return yamlLib;
  } catch { /* not on the module path */ }
  const dir = findInMise();
  if (dir) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    yamlLib = require(dir);
    return yamlLib;
  }
  const err = new Error(`js-yaml is not available. Install it with: ${JS_YAML_INSTALL}`);
  err.code = 'SKILL_VV_NO_YAML';
  throw err;
}

// ---------- files ----------

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function readJson(file, fallback) {
  const t = readText(file);
  if (t === null) return fallback;
  try { return JSON.parse(t); } catch { return fallback; }
}

function readJsonl(file) {
  const t = readText(file);
  if (!t) return [];
  return t.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); return true; } catch { return false; }
}

function atomicWrite(file, contents) {
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, contents, 'utf8');
    fs.renameSync(tmp, file);
    return true;
  } catch {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
    return false;
  }
}

function appendJsonl(file, obj) {
  if (!ensureDir(path.dirname(file))) return false;
  try { fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8'); return true; } catch { return false; }
}

// ---------- VV.md ----------

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseVv(text, file) {
  const m = FRONTMATTER.exec(text || '');
  if (!m) throw new Error(`${file}: no YAML frontmatter`);
  const data = yaml().load(m[1]) || {};
  const problems = [];
  if (data['skill-vv'] !== 1) problems.push('skill-vv must be 1');
  if (!data.name || typeof data.name !== 'string') problems.push('name is required');
  if (!Array.isArray(data.requirements)) problems.push('requirements must be a list');
  if (!Array.isArray(data.platforms)) problems.push('platforms must be a list');
  if (data.procedures !== undefined && !Array.isArray(data.procedures)) problems.push('procedures must be a list');
  if (data.results !== undefined && !Array.isArray(data.results)) problems.push('results must be a list');
  if (problems.length) throw new Error(`${file}: ${problems.join('; ')}`);
  return { data, body: m[2] };
}

function loadVv(file) {
  const text = readText(file);
  if (text === null) return null;
  const { data, body } = parseVv(text, file);
  return { file, root: path.dirname(file), data, body };
}

function writeVv(file, data, body) {
  const text = `---\n${yaml().dump(data, { lineWidth: 100, noRefs: true })}---\n${body || ''}`;
  return atomicWrite(file, text);
}

// ---------- platform and model ----------

const AGENTS = ['claude-code', 'gemini-cli', 'antigravity', 'codex', 'kiro'];

function detectOs(env) {
  const e = env || process.env;
  if (process.platform !== 'linux') return process.platform;
  if (e.WSL_DISTRO_NAME) return 'linux-wsl';
  try { if (/microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'))) return 'linux-wsl'; } catch { /* not WSL */ }
  return 'linux';
}

function platformKey(agent, env) {
  return `${agent || 'claude-code'}/${detectOs(env)}`;
}

function normalizeModel(m) {
  const s = typeof m === 'string' ? m : (m && m.id) || '';
  return s.replace(/\[[^\]]*\]$/, '').trim() || 'unknown-model';
}

// ---------- discovery ----------

function claudeInstalledRoots() {
  const reg = readJson(path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'), {});
  const roots = [];
  for (const entries of Object.values((reg && reg.plugins) || {})) {
    const e = Array.isArray(entries) ? entries[0] : entries;
    if (e && typeof e.installPath === 'string') roots.push(e.installPath);
  }
  return roots;
}

// VV.md files at a root or up to `depth` levels below it.
function findVvFiles(root, depth) {
  const out = [];
  const walk = (dir, d) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isFile() && e.name === 'VV.md') out.push(path.join(dir, e.name));
      else if (e.isDirectory() && d > 0 && !e.name.startsWith('.') && e.name !== 'node_modules') walk(path.join(dir, e.name), d - 1);
    }
  };
  walk(root, depth === undefined ? 3 : depth);
  return out;
}

function discover({ roots, env } = {}) {
  const e = env || process.env;
  const all = [...claudeInstalledRoots(), ...(roots || []), ...String(e.SKILL_VV_ROOTS || '').split(path.delimiter).filter(Boolean)];
  const seen = new Set();
  const files = [];
  for (const r of all) {
    for (const f of findVvFiles(r)) {
      const key = path.resolve(f).toLowerCase();
      if (!seen.has(key)) { seen.add(key); files.push(f); }
    }
  }
  return files;
}

// ---------- requirements ----------

function expandHome(p) {
  return typeof p === 'string' && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function commandOnPath(name, env) {
  const e = env || process.env;
  const dirs = String(e.PATH || e.Path || '').split(path.delimiter).filter(Boolean);
  const exts = process.platform === 'win32'
    ? ['', ...String(e.PATHEXT || '.EXE;.CMD;.BAT;.COM').toLowerCase().split(';').filter(Boolean), '.ps1']
    : [''];
  for (const d of dirs) {
    for (const x of exts) {
      try {
        const p = path.join(d, name + x);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
      } catch { /* unreadable entry */ }
    }
  }
  return null;
}

function requirementMet(r, env) {
  const e = env || process.env;
  if (r.kind === 'command') return Boolean(commandOnPath(r.name, e));
  if (r.kind === 'env') return Boolean(e[r.name]);
  if (r.kind === 'file') { try { return fs.existsSync(expandHome(r.name)); } catch { return false; } }
  if (r.kind === 'node-module') {
    if (r.name === 'js-yaml') { try { yaml(); return true; } catch { return false; } }
    try { require.resolve(r.name); return true; } catch { return false; }
  }
  return false;
}

// ---------- status ----------

function vvStatus(vv, { model, platform, localResults, declined, env } = {}) {
  const name = vv.data.name;
  const dec = declined || {};
  const missing = vv.data.requirements
    .filter((r) => r && r.name && !dec[`${name}:${r.name}`] && !requirementMet(r, env))
    .map((r) => Object.assign({ kind: 'command', optional: false }, r));

  const results = (vv.data.results || []).map((r) => Object.assign({ name }, r))
    .concat((localResults || []).filter((r) => r && r.name === name));
  const procedures = (vv.data.procedures || []).filter((p) => p && p.id).map((p) => {
    const mine = results.filter((r) => r.procedure === p.id && r.model === model && r.platform === platform);
    const latest = mine.slice().sort((a, b) => String(a.date || a.at || '').localeCompare(String(b.date || b.at || ''))).pop() || null;
    return {
      id: p.id,
      summary: p.summary || '',
      file: p.file ? path.join(vv.root, p.file) : null,
      inline: typeof p.steps === 'string',
      latest,
      needed: !latest || latest.result === 'fail',
    };
  });
  const claimed = vv.data.platforms.includes(platform);
  return { name, file: vv.file, missing, procedures, claimed, claimedPlatforms: vv.data.platforms };
}

function check({ model, agent, roots, env } = {}) {
  const mdl = normalizeModel(model);
  const platform = platformKey(agent, env);
  const localResults = readJsonl(RESULTS_FILE);
  const declined = readJson(DECLINED_FILE, {});
  const skills = [];
  const errors = [];
  for (const f of discover({ roots, env })) {
    try {
      const vv = loadVv(f);
      if (vv) skills.push(vvStatus(vv, { model: mdl, platform, localResults, declined, env }));
    } catch (err) {
      if (err.code === 'SKILL_VV_NO_YAML') throw err;
      errors.push(err.message);
    }
  }
  return { model: mdl, platform, skills, errors };
}

function needsAttention(s) {
  return s.missing.length > 0 || s.procedures.some((p) => p.needed);
}

function formatReport(report, cliPath) {
  const todo = report.skills.filter(needsAttention);
  if (!todo.length && !report.errors.length) return '';
  const cli = `node "${cliPath}"`;
  const lines = [
    '[skill-vv] Before other work, take these to the user in order: requirements first, then verification and validation (V&V).',
    `Model: ${report.model}. Platform: ${report.platform}.`,
  ];
  for (const s of todo) {
    lines.push('', `## ${s.name}  (${s.file})`);
    if (s.missing.length) {
      lines.push('Unmet requirements. Ask whether to install or configure each:');
      for (const r of s.missing) {
        lines.push(`- ${r.kind} ${r.name}${r.optional ? ' (optional)' : ''}: ${r.why || ''} How: ${r.install || r.configure || 'see the skill README'}`);
      }
      lines.push(`  Declined: ${cli} record decline ${s.name} <requirement>`);
    }
    const needed = s.procedures.filter((p) => p.needed);
    if (needed.length) {
      if (!s.claimed) lines.push(`This platform is not one the skill claims (${s.claimedPlatforms.join(', ') || 'none listed'}). Say so.`);
      lines.push('V&V not yet passed here. Ask whether to run each procedure now:');
      for (const p of needed) {
        const where = p.file || `${s.file} (procedures: ${p.id})`;
        const last = p.latest ? ` Last result: ${p.latest.result} on ${p.latest.date || p.latest.at}${p.latest.notes ? `: ${p.latest.notes}` : ''}.` : '';
        lines.push(`- ${p.id}: ${p.summary.replace(/\.?$/, '.')} Procedure: ${where}.${last}`);
      }
      lines.push(`  Record: ${cli} record result ${s.name} <procedure> pass|fail|deferred --model ${report.model} --agent ${report.platform.split('/')[0]} --notes "..."`);
      lines.push('  On fail: report it, and add a BUG and a matching TODO to the skill\'s main file.');
    }
  }
  if (report.errors.length) {
    lines.push('', 'VV.md files that could not be read (report these):');
    for (const e of report.errors) lines.push(`- ${e}`);
  }
  return lines.join('\n');
}

// ---------- recording ----------

function recordResult({ name, procedure, result, model, agent, notes, evidence, by, into, env }) {
  if (!['pass', 'fail', 'deferred'].includes(result)) throw new Error('result must be pass, fail or deferred');
  const entry = {
    name,
    procedure,
    model: normalizeModel(model),
    platform: platformKey(agent, env),
    result,
    date: new Date().toISOString().slice(0, 10),
    at: new Date().toISOString(),
    by: by || null,
    evidence: evidence || null,
    notes: notes || null,
  };
  if (!appendJsonl(RESULTS_FILE, entry)) throw new Error(`could not write ${RESULTS_FILE}`);
  if (into) {
    const vv = loadVv(into);
    if (!vv) throw new Error(`${into}: not found`);
    if (vv.data.name !== name) throw new Error(`${into} is for ${vv.data.name}, not ${name}`);
    const { name: _n, at: _a, ...shipped } = entry;
    vv.data.results = (vv.data.results || []).concat([shipped]);
    if (!writeVv(into, vv.data, vv.body)) throw new Error(`could not write ${into}`);
  }
  return entry;
}

function recordDecline(name, requirement) {
  if (!ensureDir(STATE_DIR)) throw new Error(`could not create ${STATE_DIR}`);
  const d = readJson(DECLINED_FILE, {});
  d[`${name}:${requirement}`] = new Date().toISOString();
  if (!atomicWrite(DECLINED_FILE, JSON.stringify(d, null, 2) + '\n')) throw new Error(`could not write ${DECLINED_FILE}`);
}

module.exports = {
  AGENTS,
  STATE_DIR,
  RESULTS_FILE,
  DECLINED_FILE,
  JS_YAML_INSTALL,
  yaml,
  parseVv,
  loadVv,
  writeVv,
  detectOs,
  platformKey,
  normalizeModel,
  discover,
  findVvFiles,
  commandOnPath,
  requirementMet,
  vvStatus,
  check,
  needsAttention,
  formatReport,
  recordResult,
  recordDecline,
};
