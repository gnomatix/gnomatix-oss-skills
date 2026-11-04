// skill-vv — bug-report support
//
// locate(skill): finds where the skill lives and which mode applies.
//   developer mode: the skill's files are in a git working tree outside the
//                   Claude plugin cache. Logs go to <repo>/dev/<skill>/bugs/,
//                   which is git-crypt encrypted in GNOMATIX repos.
//   user mode:      an installed copy. The installed skill is never edited.
//                   Logs go to ~/.local/dev/<skill>/bugs/.
// log(...): writes one bug record, as markdown with YAML frontmatter.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const vv = require('./vv');

const PLUGIN_CACHE = path.join(os.homedir(), '.claude', 'plugins', 'cache');

function norm(p) { return process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p); }

function gitRoot(start) {
  let d = path.resolve(start);
  for (;;) {
    try { if (fs.existsSync(path.join(d, '.git'))) return d; } catch { /* keep walking */ }
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

// gitdir and commondir pointers come from the repo, so they're untrusted.
// Each is resolved first, then the absolute result is checked, before any
// filesystem access. UNC and device paths could reach network shares. On
// Windows the result must sit on a drive root such as C:\.
function safeResolve(base, ptr) {
  if (typeof ptr !== 'string' || !ptr.trim()) return null;
  const raw = ptr.trim();
  if (/^[\\/]{2}/.test(raw)) return null;
  const resolved = path.resolve(base, raw);
  if (process.platform === 'win32') {
    const unified = resolved.replace(/\//g, '\\');
    if (unified.startsWith('\\\\')) return null;
    if (!/^[A-Za-z]:\\/.test(unified)) return null;
  } else if (resolved.startsWith('//')) {
    return null;
  }
  return resolved;
}

function originUrl(repo) {
  // Reads .git/config directly (a file, or a gitdir pointer in a worktree).
  let gitDir = path.join(repo, '.git');
  try {
    if (fs.lstatSync(gitDir).isSymbolicLink()) return null;
    if (fs.statSync(gitDir).isFile()) {
      const m = /gitdir:\s*(.+)/.exec(fs.readFileSync(gitDir, 'utf8'));
      if (m) {
        gitDir = safeResolve(repo, m[1]);
        if (!gitDir) return null;
        const common = path.join(gitDir, 'commondir');
        if (fs.existsSync(common)) {
          gitDir = safeResolve(gitDir, fs.readFileSync(common, 'utf8'));
          if (!gitDir) return null;
        }
      }
    }
    const cfg = fs.readFileSync(path.join(gitDir, 'config'), 'utf8');
    const m = /\[remote "origin"\][^[]*?url\s*=\s*(\S+)/.exec(cfg);
    return m ? m[1] : null;
  } catch { return null; }
}

function githubSlug(url) {
  const m = /github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/.exec(url || '');
  return m ? `${m[1]}/${m[2]}` : null;
}

function mainFile(root) {
  for (const n of ['SKILL.md', 'README.md']) {
    const f = path.join(root, n);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

// A skill without a VV.md: an installed plugin of that name, a skill of that
// name inside an installed plugin (skills/<name>/SKILL.md), or a directory of
// that name under a --root.
function findInstalledRoot(skill) {
  const reg = vv.claudeRegistry();
  for (const [key, root] of Object.entries(reg)) {
    if (key.split('@')[0] === skill) return root;
  }
  for (const root of Object.values(reg)) {
    const s = path.join(root, 'skills', skill);
    if (fs.existsSync(path.join(s, 'SKILL.md'))) return s;
  }
  return null;
}

function findRootCandidate(skill, roots) {
  for (const r of roots) {
    for (const cand of [path.join(r, skill), path.join(r, skill, 'skills', skill)]) {
      if (fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

// Creates base/<rel...>, refusing any existing component that is a symlink or
// junction, so a planted link can't send the write to another place or share.
function safeMkdirUnder(base, target) {
  const rel = path.relative(base, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`log directory is not under ${base}`);
  let cur = base;
  for (const part of rel.split(path.sep).filter(Boolean)) {
    cur = path.join(cur, part);
    let st = null;
    try { st = fs.lstatSync(cur); } catch { /* does not exist yet */ }
    if (st) {
      if (st.isSymbolicLink()) throw new Error(`refusing to write through a symlink or junction: ${cur}`);
      if (!st.isDirectory()) throw new Error(`not a directory: ${cur}`);
    } else {
      fs.mkdirSync(cur);
    }
  }
}

// Finds the skill by its VV.md name, then by plugin or skill directory name.
function locate(skill, { roots, projectDir, developer } = {}) {
  const report = vv.check({ roots, projectDir });
  // Trusted sources first, so a same-named skill in a project or --root can
  // never shadow an installed one:
  //   1. a trusted VV.md hit (an installed plugin)
  //   2. an installed plugin or skill of that name, from the registry
  //   3. an untrusted VV.md hit, then a --root or project candidate
  const hits = report.skills.filter((s) => s.name === skill);
  const trustedHit = hits.find((s) => s.trusted);
  const installed = trustedHit ? null : findInstalledRoot(skill);
  const untrustedHit = hits.find((s) => !s.trusted);
  let root = null;
  let trusted = false;
  if (trustedHit) { root = path.dirname(trustedHit.file); trusted = true; }
  else if (installed) { root = installed; trusted = true; }
  else if (untrustedHit) { root = path.dirname(untrustedHit.file); }
  else { root = findRootCandidate(skill, roots || []); }
  if (!root) return { skill, found: false };

  const inCache = norm(root).startsWith(norm(PLUGIN_CACHE) + path.sep);
  const repo = inCache ? null : gitRoot(root);
  // Developer mode is an explicit opt-in, given only after the author confirms
  // the role. A repo is never trusted to grant it just by being a checkout.
  const mode = developer && repo ? 'developer' : 'user';
  const fromRepo = githubSlug(repo ? originUrl(repo) : null);
  const slug = (mode === 'developer' && fromRepo) || 'gnomatix/gnomatix-oss-skills';
  const logDir = mode === 'developer'
    ? path.join(repo, 'dev', skill, 'bugs')
    : path.join(os.homedir(), '.local', 'dev', skill, 'bugs');
  return {
    skill,
    found: true,
    mode,
    source: trusted ? 'installed' : 'project-or-root',
    developerAvailable: Boolean(repo),
    root,
    mainFile: mainFile(root),
    repo,
    github: slug,
    repoOrigin: fromRepo,
    logDir,
    logBase: mode === 'developer' ? repo : os.homedir(),
    logEncrypted: mode === 'developer' ? encryptedPath(repo, 'dev') : false,
  };
}

function encryptedPath(repo, rel) {
  try {
    const attrs = fs.readFileSync(path.join(repo, '.gitattributes'), 'utf8');
    return new RegExp(`^${rel}/\\*\\*\\s+.*filter=git-crypt`, 'm').test(attrs);
  } catch { return false; }
}

function slugify(s) {
  return String(s || 'bug').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'bug';
}

// Writes a bug record. `fields` become frontmatter; `body` is the documented bug.
function log(loc, { title, report, model, agent, body, status }) {
  if (!loc || !loc.found) throw new Error('skill not found');
  safeMkdirUnder(loc.logBase, loc.logDir);
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(loc.logDir, `${stamp}-${slugify(title || report)}.md`);
  const fm = {
    'skill-vv-bug': 1,
    skill: loc.skill,
    mode: loc.mode,
    status: status || 'open',
    title: title || null,
    reported: now.toISOString(),
    model: vv.normalizeModel(model),
    platform: vv.platformKey(agent),
    report: report || null,
  };
  const text = `---\n${vv.yaml().dump(fm, { schema: vv.yaml().CORE_SCHEMA, lineWidth: 100 })}---\n\n${body || ''}\n`;
  // Exclusive create: never overwrite or follow an existing path.
  fs.writeFileSync(file, text, { encoding: 'utf8', flag: 'wx' });
  return file;
}

// Matches "/<skill> #bug <text>" or "/<plugin>:<skill> #bug <text>".
const BUG_PROMPT = /^\s*\/([A-Za-z0-9_.:-]+)\s+#bug\b[ \t]*([\s\S]*)$/i;

function parseBugPrompt(prompt) {
  const m = BUG_PROMPT.exec(prompt || '');
  if (!m) return null;
  const name = m[1].includes(':') ? m[1].split(':').pop() : m[1];
  return { command: m[1], skill: name, report: m[2].trim() };
}

module.exports = { locate, log, parseBugPrompt, githubSlug, originUrl, gitRoot, encryptedPath };
