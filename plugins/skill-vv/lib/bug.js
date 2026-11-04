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

function originUrl(repo) {
  // Reads .git/config directly (a file, or a gitdir pointer in a worktree).
  let gitDir = path.join(repo, '.git');
  try {
    if (fs.statSync(gitDir).isFile()) {
      const m = /gitdir:\s*(.+)/.exec(fs.readFileSync(gitDir, 'utf8'));
      if (m) {
        gitDir = path.resolve(repo, m[1].trim());
        const common = path.join(gitDir, 'commondir');
        if (fs.existsSync(common)) gitDir = path.resolve(gitDir, fs.readFileSync(common, 'utf8').trim());
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
function findSkillRoot(skill, roots) {
  const reg = vv.claudeRegistry();
  for (const [key, root] of Object.entries(reg)) {
    if (key.split('@')[0] === skill) return root;
  }
  for (const root of Object.values(reg)) {
    const s = path.join(root, 'skills', skill);
    if (fs.existsSync(path.join(s, 'SKILL.md'))) return s;
  }
  for (const r of roots) {
    for (const cand of [path.join(r, skill), path.join(r, skill, 'skills', skill)]) {
      if (fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

// Finds the skill by its VV.md name, then by plugin or skill directory name.
function locate(skill, { roots, projectDir, developer } = {}) {
  const report = vv.check({ roots, projectDir });
  let root = null;
  const hit = report.skills.find((s) => s.name === skill);
  if (hit) root = path.dirname(hit.file);
  if (!root) root = findSkillRoot(skill, roots || []);
  if (!root) return { skill, found: false };

  const inCache = norm(root).startsWith(norm(PLUGIN_CACHE) + path.sep);
  const repo = inCache ? null : gitRoot(root);
  const mode = (developer || (repo && !inCache)) ? 'developer' : 'user';
  const slug = githubSlug(repo ? originUrl(repo) : null) || 'gnomatix/gnomatix-oss-skills';
  const logDir = mode === 'developer' && repo
    ? path.join(repo, 'dev', skill, 'bugs')
    : path.join(os.homedir(), '.local', 'dev', skill, 'bugs');
  return {
    skill,
    found: true,
    mode,
    root,
    mainFile: mainFile(root),
    repo,
    github: slug,
    logDir,
    logEncrypted: mode === 'developer' && repo ? encryptedPath(repo, 'dev') : false,
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
  fs.mkdirSync(loc.logDir, { recursive: true });
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
  const text = `---\n${vv.yaml().dump(fm, { lineWidth: 100 })}---\n\n${body || ''}\n`;
  const tmp = `${file}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
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
