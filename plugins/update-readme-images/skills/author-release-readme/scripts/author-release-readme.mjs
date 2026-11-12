#!/usr/bin/env node
// author-release-readme.mjs — Generate or update versioned release README notes
// (`docs/releases/v<VERSION>.md`) with real marketplace & per-plugin version diffs,
// cross-CLI update/migration instructions, and release-specific 16:9 PSA panel
// imagery managed through `update-readme-images.mjs`, plus GitHub Release rendering.
//
// Usage:
//   node author-release-readme.mjs [--version <X.Y.Z>] [--prev-tag <vX.Y.Z>] [--subtitle "..."] [--highlights-file <file, one change per line>] [--repo <dir>] [--apply-images] [--render-github-body] [--publish-github-release] [--json]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveTarget } from '../../update-readme-images/scripts/update-readme-images.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..');
const UPDATE_IMAGES_SCRIPT = path.join(PLUGIN_ROOT, 'skills', 'update-readme-images', 'scripts', 'update-readme-images.mjs');

function safeExists(p) {
  try { return typeof p === 'string' && p.length > 0 && fs.existsSync(p); } catch { return false; }
}

function safeReadText(p) {
  try { return safeExists(p) ? fs.readFileSync(p, 'utf8') : null; } catch { return null; }
}

function safeReadJson(p) {
  const raw = safeReadText(p);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function atomicWrite(targetPath, contents) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmp = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, contents, 'utf8');
    fs.renameSync(tmp, targetPath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* cleanup */ }
    throw err;
  }
}

function gitOut(repoRoot, args) {
  const r = spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? String(r.stdout || '').trim() : null;
}

function findPreviousReleaseTag(repoRoot, currentVersion) {
  const raw = gitOut(repoRoot, ['tag', '--list', 'v*', '--sort=-version:refname']);
  if (!raw) return null;
  const tags = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const currentTag = `v${currentVersion}`;
  return tags.find((t) => t !== currentTag) || null;
}

function parseVvPublicGate(vvText) {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(vvText || '');
  if (!fmMatch) return { approved: true, hasApprovedList: false, approvedVersions: [] };
  const fm = fmMatch[1];
  let approved = true;
  const rs = /^review_status:\s*["']?([A-Za-z_]+)["']?/m.exec(fm);
  if (rs && ['PENDING', 'REQUIRES_REVISION', 'DRAFT', 'WIP', 'HOLD'].includes(rs[1].toUpperCase())) {
    approved = false;
  }
  const auth = /^authority:\s*["']?([^\r\n"']+)["']?/m.exec(fm);
  if (auth && /^pending\b/i.test(auth[1].trim())) {
    approved = false;
  }
  let hasApprovedList = false;
  const approvedVersions = [];
  const lines = fm.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^approved_versions:\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    hasApprovedList = true;
    const inline = m[1].trim();
    if (inline.startsWith('[') && inline.endsWith(']')) {
      const inner = inline.slice(1, -1).trim();
      if (inner) {
        for (const item of inner.split(',')) {
          const v = item.trim().replace(/^['"]|['"]$/g, '');
          if (v) approvedVersions.push(v);
        }
      }
    } else {
      while (i + 1 < lines.length && /^\s*-\s+(.+)$/.test(lines[i + 1])) {
        i += 1;
        const vm = /^\s*-\s+(.+)$/.exec(lines[i]);
        if (vm) approvedVersions.push(vm[1].trim().replace(/^['"]|['"]$/g, ''));
      }
    }
  }
  return { approved, hasApprovedList, approvedVersions };
}

function getPluginPublicGate(repoRoot, pluginName, gitRef = null) {
  const vvText = gitRef
    ? (gitOut(repoRoot, ['show', `${gitRef}:plugins/${pluginName}/VV.md`]) || '')
    : (safeReadText(path.join(repoRoot, 'plugins', pluginName, 'VV.md')) || '');
  return parseVvPublicGate(vvText);
}

function resolveEffectivePublicVersion(entryVersion, gate) {
  if (!entryVersion) return null;
  if (!gate.approved) {
    if (gate.hasApprovedList && gate.approvedVersions.length === 0) return null;
    if (gate.approvedVersions.length > 0) {
      return gate.approvedVersions[gate.approvedVersions.length - 1];
    }
    return null;
  }
  return entryVersion;
}

function collectPluginVersionDiffs(repoRoot, prevTag) {
  const currVersions = safeReadJson(path.join(repoRoot, '.VERSIONS.json')) || {};
  let prevVersions = {};
  if (prevTag) {
    const prevRaw = gitOut(repoRoot, ['show', `${prevTag}:.VERSIONS.json`]);
    if (prevRaw) {
      try { prevVersions = JSON.parse(prevRaw); } catch { prevVersions = {}; }
    }
  }

  const added = [];
  const updated = [];
  const unchanged = [];

  for (const [name, entry] of Object.entries(currVersions)) {
    if (name.startsWith('_') || !entry || typeof entry !== 'object') continue;
    const gate = getPluginPublicGate(repoRoot, name);
    const effectiveCurrVersion = resolveEffectivePublicVersion(entry.version, gate);
    if (!effectiveCurrVersion) continue;

    const prev = prevVersions[name];
    const prevGate = (prev && prevTag) ? getPluginPublicGate(repoRoot, name, prevTag) : null;
    const effectivePrevVersion = (prev && prevGate)
      ? resolveEffectivePublicVersion(prev.version, prevGate)
      : (prev ? prev.version : null);

    if (!effectivePrevVersion) {
      added.push({ name, version: effectiveCurrVersion });
    } else if (effectivePrevVersion !== effectiveCurrVersion) {
      updated.push({ name, from: effectivePrevVersion, to: effectiveCurrVersion });
    } else {
      unchanged.push({ name, version: effectiveCurrVersion });
    }
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  updated.sort((a, b) => a.name.localeCompare(b.name));
  unchanged.sort((a, b) => a.name.localeCompare(b.name));

  return { added, updated, unchanged, total: added.length + updated.length + unchanged.length };
}

// A view of one release's published files: the public snapshot at its tag when it can be fetched
// (exactly what was published), otherwise the local working tree.
function fetchPublishedRef(repoRoot, publicUrl, tag) {
  if (!publicUrl || !tag) return null;
  const ref = `refs/release-notes/public/${tag}`;
  if (gitOut(repoRoot, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])) return ref;
  const r = spawnSync('git', ['-C', repoRoot, 'fetch', '-q', '--no-tags', publicUrl, `+refs/tags/${tag}:${ref}`], { encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? ref : null;
}

function makeTreeView(repoRoot, ref) {
  if (ref) {
    const files = (gitOut(repoRoot, ['ls-tree', '-r', '--name-only', ref]) || '').split(/\r?\n/).filter(Boolean);
    const set = new Set(files);
    return { source: ref, files, exists: (p) => set.has(p), read: (p) => (set.has(p) ? gitOut(repoRoot, ['show', `${ref}:${p}`]) : null) };
  }
  return {
    source: 'working tree',
    repoRoot,
    files: null,
    exists: (p) => safeExists(path.join(repoRoot, ...p.split('/'))),
    read: (p) => safeReadText(path.join(repoRoot, ...p.split('/'))),
  };
}

// Plugins and skills one snapshot publishes: { name: { version, skills: [skill dir names] } }.
function publishedPlugins(view) {
  const mp = (() => { try { return JSON.parse(view.read('.claude-plugin/marketplace.json') || ''); } catch { return null; } })();
  const out = {};
  for (const entry of (mp && Array.isArray(mp.plugins) ? mp.plugins : [])) {
    if (!entry || !entry.name) continue;
    const pj = (() => { try { return JSON.parse(view.read(`plugins/${entry.name}/.claude-plugin/plugin.json`) || ''); } catch { return null; } })();
    const version = (pj && pj.version) || entry.version || null;
    if (!version) continue;
    const prefix = `plugins/${entry.name}/skills/`;
    const skills = view.files
      ? view.files.filter((f) => f.startsWith(prefix) && f.endsWith('/SKILL.md')).map((f) => f.slice(prefix.length).split('/')[0])
      : (() => { try { return fs.readdirSync(path.join(view.repoRoot || '', 'plugins', entry.name, 'skills')).filter((d) => !d.startsWith('.')); } catch { return []; } })();
    out[entry.name] = { version, skills: Array.from(new Set(skills)).sort() };
  }
  return out;
}

function diffPublished(prev, curr) {
  const added = [], updated = [], unchanged = [], addedSkills = [];
  for (const [name, c] of Object.entries(curr)) {
    const p = prev[name];
    if (!p) added.push({ name, version: c.version });
    else if (p.version !== c.version) updated.push({ name, from: p.version, to: c.version });
    else unchanged.push({ name, version: c.version });
    if (p) for (const s of c.skills) if (!p.skills.includes(s) && s !== name) addedSkills.push({ plugin: name, skill: s });
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  return { added: added.sort(byName), updated: updated.sort(byName), unchanged: unchanged.sort(byName), addedSkills, total: Object.keys(curr).length };
}

// Title banners of plugins and skills new in the release, where the snapshot has them.
function newTitleBanners(view, diffs) {
  const out = [];
  for (const p of diffs.added) {
    const rel = `plugins/${p.name}/assets/images/${p.name}-banner.jpg`;
    if (view.exists(rel)) out.push({ alt: p.name, rel });
  }
  for (const { plugin, skill } of diffs.addedSkills) {
    for (const rel of [`plugins/${plugin}/assets/images/${skill}-banner.jpg`, `plugins/${plugin}/skills/${skill}/assets/images/${skill}-banner.jpg`]) {
      if (view.exists(rel)) { out.push({ alt: `${plugin}: ${skill}`, rel }); break; }
    }
  }
  return out;
}

// One path segment: letters, digits, dot, underscore, hyphen, and never "." or "..". The
// workspace_root and the version each become part of a file path, so both must pass this.
function isSafeSegment(s) {
  return typeof s === 'string' && /^[A-Za-z0-9._-]+$/.test(s) && s !== '.' && s !== '..';
}

function isInside(root, p) {
  const rel = path.relative(root, p);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel));
}

function realPathOrNull(p) {
  try { return fs.realpathSync(p); } catch (_) { return null; }
}

// The workspace_root names the project's folder in the project-visuals directory. A configured
// value that is not one safe path segment is passed over for the next source.
function workspaceRootOf(repoRoot) {
  for (const p of [path.join(repoRoot, '.gnox', 'readme-images.json'), path.join(repoRoot, '.claude', 'readme-images.json'), path.join(repoRoot, 'readme-images.json')]) {
    const cfg = safeReadJson(p);
    if (cfg && typeof cfg.workspace_root === 'string' && isSafeSegment(cfg.workspace_root.trim())) return cfg.workspace_root.trim();
  }
  const mp = safeReadJson(path.join(repoRoot, '.claude-plugin', 'marketplace.json'));
  if (mp && typeof mp.name === 'string' && isSafeSegment(mp.name.trim())) return mp.name.trim();
  const base = path.basename(repoRoot);
  return isSafeSegment(base) ? base : 'project';
}

// The project's folder in the project-visuals directory, always inside that directory.
function releasePromptDir(repoRoot) {
  const visuals = path.resolve(process.env.GNOX_PROJECT_VISUALS_DIR || path.join(os.homedir(), 'work', 'project-visuals'));
  const dir = path.join(visuals, workspaceRootOf(repoRoot));
  if (!isInside(visuals, dir) || dir === visuals) throw new Error(`release prompt directory escapes the project-visuals directory: ${dir}`);
  return { visuals, dir };
}

// <visuals>/<workspace_root>/release-v<X>-banner-prompt.md (or release-<X>-...): YAML front matter
// for the release note, then the image prompt. A non-empty prompt body authorizes the release banner.
export function readReleasePrompt(repoRoot, version) {
  if (!isSafeSegment(version)) return null;
  const { dir } = releasePromptDir(repoRoot);
  for (const name of [`release-v${version}-banner-prompt.md`, `release-${version}-banner-prompt.md`]) {
    const p = path.join(dir, name);
    const text = safeReadText(p);
    if (text === null) continue;
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
    return { path: p, meta: m ? parseSimpleYaml(m[1]) : {}, prompt: (m ? m[2] : text).trim() };
  }
  return null;
}

// Commit subjects to release-note lines. Subjects typed EPIC / FEATURE / BUGFIX (also FEAT, FIX),
// optionally with a scope in parentheses, are listed one by one, epics first; every other commit
// (other types, untyped "<scope>: ..." subjects) is collapsed to one count per scope.
export function summarizeCommits(subjects) {
  const KEEP = { EPIC: 'Epic', FEATURE: 'Feature', FEAT: 'Feature', BUGFIX: 'Fix', FIX: 'Fix' };
  const order = { Epic: 0, Feature: 1, Fix: 2 };
  const kept = [];
  const collapsed = new Map();
  for (const s of subjects) {
    const typed = /^([A-Za-z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(s);
    const type = typed && typed[1].toUpperCase();
    if (typed && KEEP[type]) {
      kept.push({ k: KEEP[type], line: `${KEEP[type]}${typed[2] ? ` (${typed[2]})` : ''}: ${typed[3]}` });
      continue;
    }
    const isType = typed && /^(DOCS?|CHORE|REFACTOR|TEST|TESTS|PERF|STYLE|BUILD|CI|REVERT)$/.test(type);
    const scope = isType ? (typed[2] || 'other') : (/^([^:]{1,60}):\s/.exec(s) || [, 'other'])[1].trim();
    collapsed.set(scope, (collapsed.get(scope) || 0) + 1);
  }
  kept.sort((a, b) => order[a.k] - order[b.k]);
  return [
    ...kept.map((x) => x.line),
    ...Array.from(collapsed.entries()).map(([scope, n]) => `${scope}: ${n} smaller change${n === 1 ? '' : 's'}`),
  ];
}

// The section of a markdown file that starts at the heading matching `startRe`, up to the next
// heading of the same or a higher level.
function markdownSection(md, startRe) {
  const lines = String(md || '').split(/\r?\n/);
  const i = lines.findIndex((l) => startRe.test(l));
  if (i < 0) return '';
  const level = (/^(#+)\s/.exec(lines[i]) || [, '#'])[1].length;
  let j = i + 1;
  while (j < lines.length && !(new RegExp(`^#{1,${level}}\\s`).test(lines[j]))) j += 1;
  return lines.slice(i, j).join('\n').replace(/\n-{3,}\s*$/, '').trim();
}

// Render-agent instructions for the release banner: the resolved rule's panel (target, type,
// dimensions, OG companion), the namespace's reference images, and update-readme-images' own
// SKILL.md text for that panel type and for draft staging.
function renderInstructions(res, version) {
  const panels = (res.matched_rules || []).flatMap((r) => (r.panels || []).map((p) => ({ rule: r, p })));
  const hit = panels.find(({ p }) => /releases\/release-/.test(p.resolved_src || p.src_pattern || '')) || panels[0];
  const out = ['## Render instructions', ''];
  if (hit) {
    const { p } = hit;
    const d = p.dimensions || {};
    const target = String(p.resolved_src || '').replace(/^(\.\.\/)+/, '');
    out.push(
      `- Target: \`${target || `assets/images/releases/release-v${version}-banner.jpg`}\` (panel \`${p.id}\`, type \`${p.type}\`, placement \`${p.placement}\`, alt "${p.resolved_alt || ''}").`,
      `- Size: ${d.aspect_ratio || '?'} at ${d.width || '?'}x${d.height || '?'}, ${d.format || 'JPEG'}.`
    );
    const og = p.resolved_companion_og || p.companion_og_image;
    if (og && og.enabled !== false) {
      out.push(`- Companion social preview: \`${String(og.src || og.src_pattern || '').replace(/^(\.\.\/)+/, '')}\`, ${og.width}x${og.height}, under ${og.max_bytes} bytes.`);
    }
  }
  const refs = ((res.effective && res.effective.reference_images) || []).map((i) => (typeof i === 'string' ? i : i && i.path)).filter(Boolean);
  if (refs.length) out.push(`- Reference images to pass with the prompt (style anchors): ${refs.map((r) => `\`${r}\``).join(', ')}.`);
  out.push('');
  const skill = safeReadText(path.join(PLUGIN_ROOT, 'skills', 'update-readme-images', 'SKILL.md')) || '';
  const typeName = hit && hit.p.type ? hit.p.type : 'top-level-panel';
  for (const sec of [markdownSection(skill, new RegExp(`^###\\s.*\`${typeName}\``)), markdownSection(skill, /^##\s.*Non-Destructive Draft Staging/)]) {
    if (sec) out.push('From update-readme-images SKILL.md:', '', sec, '');
  }
  return out;
}

// Writes the template prompt for a release that has none: review front matter and content filled
// from the release, the instruction to draw the banner from the resolved style documents, the
// front matter and the changelog, the render instructions, and every document inlined.
// Never overwrites an existing prompt.
function writeReleasePromptTemplate(repoRoot, version, { subtitle, highlights, releaseDocRel }) {
  if (!isSafeSegment(version)) throw new Error(`not a usable version for a file name: ${version}`);
  const { visuals, dir } = releasePromptDir(repoRoot);
  const target = path.join(dir, `release-v${version}-banner-prompt.md`);
  if (safeExists(target)) return null;
  // Only documents under the repository, this plugin or the project-visuals directory are
  // inlined; any other configured document is named and left out.
  const inlineRoots = [repoRoot, PLUGIN_ROOT, visuals].map(realPathOrNull).filter(Boolean);
  const mayInline = (abs) => {
    const real = realPathOrNull(abs);
    return real !== null && inlineRoots.some((r) => isInside(r, real));
  };
  // update-readme-images' own resolver: the layered config and every document it applies to the
  // release note (config, owning style docs, style guides, rules).
  const res = resolveTarget(repoRoot, releaseDocRel);
  const refs = res.configured_reference_documents || {};
  const docPath = (d) => (d && (d.resolved_path || d.path)) || null;
  const styleDocs = [
    refs.config && refs.config.path,
    ...(refs.owning_style_docs || []).map(docPath),
    ...(refs.style_guide_docs || []).map(docPath),
    ...(refs.rules_docs || []).map(docPath),
  ].filter((p) => typeof p === 'string' && p.length > 0);
  const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const text = [
    '---',
    'type: WORKING-DRAFT (LLM-GENERATED)',
    'authority: PENDING MANUAL REVIEW',
    'review_status: PENDING',
    'auto-generated: true',
    'review_note: "needs review for QA/QC and possible revisions / re-render"',
    `title: ${q(subtitle || '')}`,
    'short-description: ""',
    `banner-alt: ${q(`Release v${version}`)}`,
    'highlights:',
    ...highlights.map((h) => `  - ${q(h)}`),
    '---',
    '',
    `Release banner for v${version} (assets/images/releases/release-v${version}-banner.jpg, 16:9).`,
    '',
    'Use these style documents, each given in full under "Style documents" at the end of this file:',
    ...(styleDocs.length ? Array.from(new Set(styleDocs)).map((d) => `- ${path.basename(d)}`) : ['- (none resolved; run update-readme-images --resolve on the release note)']),
    '',
    'and the information in the YAML front matter above, and any items from the changelog',
    `(${releaseDocRel}, inlined below) that map to engaging, humorous or fun visual elements`,
    'consistent with the style guide and the overall themes.',
    '',
    ...renderInstructions(res, version),
    '## Changelog',
    '',
    String(safeReadText(path.join(repoRoot, ...releaseDocRel.split('/'))) || '').trim(),
    '',
    '## Style documents (inlined)',
    '',
    ...Array.from(new Set(styleDocs)).flatMap((d) => {
      const abs = path.isAbsolute(d) ? d : path.join(repoRoot, ...d.split('/'));
      if (safeExists(abs) && !mayInline(abs)) {
        return [`### ${path.basename(d)}`, '', '(not inlined: outside the repository, the plugin and the project-visuals directory)', ''];
      }
      const body = safeReadText(abs);
      const fence = /\.json$/i.test(d) ? ['```json', body === null ? '' : body.trim(), '```'] : [body === null ? '(not readable at generation time)' : body.trim()];
      return [`### ${path.basename(d)}`, '', ...fence, '', `(end of ${path.basename(d)})`, ''];
    }),
    ''
  ].join('\n');
  atomicWrite(target, text);
  return target;
}

// Front-matter subset: `key: scalar` (plain or quoted) and `key:` followed by `  - item` lines.
export function parseSimpleYaml(src) {
  const out = {};
  const unq = (s) => {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
    return t;
  };
  let listKey = null;
  for (const line of String(src).split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) { out[listKey].push(unq(item[1])); continue; }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2] === '') { out[kv[1]] = []; listKey = kv[1]; } else { out[kv[1]] = unq(kv[2]); listKey = null; }
  }
  return out;
}

export function buildReleaseMarkdown({
  version,
  prevTag,
  subtitle,
  psaNoun,
  highlights,
  diffs,
  migrations,
  description,
  releaseBanner,
  titleBanners
}) {
  const img = (alt, rel) => `![${alt}](../../${rel})`;
  const lines = [`# Release v${version}${subtitle ? `: ${subtitle}` : ''}`, ''];
  if (releaseBanner) lines.push(img(releaseBanner.alt, releaseBanner.rel), '');
  if (description) lines.push(description, '');
  lines.push(
    `Marketplace release **\`v${version}\`**${prevTag ? ` (since \`${prevTag}\`)` : ''} publishes ${diffs.total} plugins.`,
    ''
  );
  if (Array.isArray(titleBanners) && titleBanners.length > 0) {
    lines.push('## New in this release', '');
    for (const b of titleBanners) lines.push(img(b.alt, b.rel), '');
  }
  lines.push('## Changes', '');

  for (const item of highlights) {
    lines.push(`- ${item}`);
  }

  lines.push('', '## Plugin Version Matrix', '');

  if (diffs.added.length > 0) {
    lines.push('### Newly Published Plugins', '');
    for (const p of diffs.added) {
      lines.push(`- \`${p.name}\` — **\`v${p.version}\`**`);
    }
    lines.push('');
  }

  if (diffs.updated.length > 0) {
    lines.push(`### Updated Plugins${prevTag ? ` (since \`${prevTag}\`)` : ''}`, '');
    lines.push('| Plugin | Previous | Released |');
    lines.push('| :--- | :--- | :--- |');
    for (const p of diffs.updated) {
      lines.push(`| \`${p.name}\` | \`v${p.from}\` | **\`v${p.to}\`** |`);
    }
    lines.push('');
  }

  if (Array.isArray(migrations) && migrations.length > 0) {
    lines.push('## Marketplace Plugin Renames (`.claude-plugin/marketplace.json#renames`)', '');
    for (const m of migrations) {
      lines.push(`- \`${m.from}\` → **\`${m.to}\`**`);
    }
    lines.push('');
  }

  lines.push(
    '## Install & Update',
    '',
    '```',
    '/plugin marketplace add gnomatix/gnomatix-oss-skills',
    '/plugin marketplace update gnomatix-oss-skills',
    '```',
    '',
    "Other agents: install a plugin's `skills/<name>/` folder the way your agent reads skills (see the repository README).",
    ''
  );

  return lines.join('\n');
}

export function renderGitHubReleaseBody(markdownText, tag, repoSlug = 'gnomatix/gnomatix-oss-skills') {
  const rawBase = `https://raw.githubusercontent.com/${repoSlug}/${tag}/`;
  return markdownText.replace(
    /!\[([^\]]*)\]\((?:\.\.\/)+([^)]+)\)/g,
    (_, alt, rel) => `![${alt}](${rawBase}${rel})`
  );
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const k = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[k] = next;
        i += 1;
      } else {
        out[k] = true;
      }
    } else {
      out._.push(tok);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(args.repo || process.cwd());
  const versionRaw = (args.version || safeReadText(path.join(repoRoot, 'VERSION')) || '0.1.0').trim().replace(/^v/, '');
  if (!isSafeSegment(versionRaw)) {
    console.error(`author-release-readme: --version must be letters, digits, ".", "_" or "-" (got "${versionRaw}")`);
    process.exit(2);
  }
  const tag = `v${versionRaw}`;
  const prevTag = args['prev-tag'] || findPreviousReleaseTag(repoRoot, versionRaw);
  const tagExists = Boolean(gitOut(repoRoot, ['rev-parse', '--verify', '--quiet', `${tag}^{commit}`]));
  const rangeEnd = tagExists ? tag : 'HEAD';

  // What was published: the public snapshots at the two tags when they can be fetched,
  // otherwise this tree against the previous tag's .VERSIONS.json and VV.md gates.
  const publicUrl = args.public || process.env.RELEASE_PUBLIC || null;
  const currRef = fetchPublishedRef(repoRoot, publicUrl, tag);
  const prevRef = currRef && prevTag ? fetchPublishedRef(repoRoot, publicUrl, prevTag) : null;
  const view = makeTreeView(repoRoot, currRef);
  let diffs;
  if (currRef && (prevRef || !prevTag)) {
    diffs = diffPublished(prevRef ? publishedPlugins(makeTreeView(repoRoot, prevRef)) : {}, publishedPlugins(view));
  } else {
    diffs = { ...collectPluginVersionDiffs(repoRoot, prevTag), addedSkills: [] };
  }
  const mpJson = (() => { try { return JSON.parse(view.read('.claude-plugin/marketplace.json') || ''); } catch { return {}; } })();
  const renamesObj = mpJson.renames && typeof mpJson.renames === 'object' ? mpJson.renames : {};
  const migrations = Object.entries(renamesObj).map(([from, to]) => ({
    from,
    to: to === null ? '(removed)' : to,
  }));

  // Release-note content: <visuals>/<workspace_root>/release-v<X>-banner-prompt.md front matter.
  const promptFile = readReleasePrompt(repoRoot, versionRaw);
  const meta = (promptFile && promptFile.meta) || {};
  const subtitle = typeof args.subtitle === 'string' ? args.subtitle : (meta.title || '');

  // The changes come from the release itself: --highlights-file, else the front matter's
  // highlights, else the commit subjects in the range, minus version-bump commits.
  let highlights;
  if (typeof args['highlights-file'] === 'string' && safeExists(args['highlights-file'])) {
    highlights = String(safeReadText(args['highlights-file']) || '').split(/\r?\n/).map((s) => s.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean);
  } else if (Array.isArray(meta.highlights) && meta.highlights.length > 0) {
    highlights = meta.highlights;
  } else {
    // Only commits that change published files: release.sh leaves dev/, assets/review and
    // assets/drafts out of every public release.
    const log = gitOut(repoRoot, ['log', '--no-merges', '--format=%s (%h)', prevTag ? `${prevTag}..${rangeEnd}` : rangeEnd, '--', '.', ':(exclude)dev', ':(exclude)assets/review', ':(exclude)assets/drafts']) || '';
    highlights = summarizeCommits(log.split(/\r?\n/).filter((s) => s && !/^Release v\d|bump versions/i.test(s)));
  }
  if (highlights.length === 0) highlights = ['No changes beyond version bumps.'];

  // Panels: the title banners of plugins and skills new in this release, and the release banner
  // rendered from this release's prompt file (the prompt file is the banner's authorization).
  const releaseBannerRel = `assets/images/releases/release-v${versionRaw}-banner.jpg`;
  const releaseBanner = promptFile && view.exists(releaseBannerRel)
    ? { alt: meta['banner-alt'] || `Release v${versionRaw}`, rel: releaseBannerRel }
    : null;
  const titleBanners = newTitleBanners(view, diffs);

  const releaseDocRel = `docs/releases/v${versionRaw}.md`;
  const releaseDocAbs = path.join(repoRoot, ...releaseDocRel.split('/'));
  const md = buildReleaseMarkdown({
    version: versionRaw,
    prevTag,
    subtitle,
    highlights,
    diffs,
    migrations,
    description: meta['short-description'] || '',
    releaseBanner,
    titleBanners
  });
  const skipWrite = Boolean(args['publish-only'] || (args['publish-github-release'] && safeExists(releaseDocAbs) && !args.write));
  if (!skipWrite) {
    atomicWrite(releaseDocAbs, md);
    if (!promptFile) writeReleasePromptTemplate(repoRoot, versionRaw, { subtitle, highlights, releaseDocRel });
  }

  let updateImagesResult = null;
  if (args['apply-images'] && safeExists(UPDATE_IMAGES_SCRIPT)) {
    const rApply = spawnSync(process.execPath, [UPDATE_IMAGES_SCRIPT, '--repo', repoRoot, '--apply', releaseDocRel, '--json'], { encoding: 'utf8', windowsHide: true });
    const rOg = spawnSync(process.execPath, [UPDATE_IMAGES_SCRIPT, '--repo', repoRoot, '--sync-og-images', '--json'], { encoding: 'utf8', windowsHide: true });
    updateImagesResult = {
      apply_status: rApply.status,
      og_status: rOg.status
    };
  }

  const ghBody = renderGitHubReleaseBody(safeReadText(releaseDocAbs) || md, tag);

  if (args['render-github-body']) {
    process.stdout.write(ghBody);
    return;
  }

  let publishedUrl = null;
  if (args['publish-github-release']) {
    if (tag === 'v0.1.0') {
      throw new Error('Refusing to overwrite historic draft release v0.1.0');
    }
    const repoSlug = args['github-repo'] || 'gnomatix/gnomatix-oss-skills';
    const title = `Release ${tag} - "${subtitle}"`;
    const bodyTmp = path.join(os.tmpdir(), `gnox-release-body-${tag}-${process.pid}.md`);
    fs.writeFileSync(bodyTmp, ghBody, 'utf8');
    try {
      const view = spawnSync('gh', ['release', 'view', tag, '--repo', repoSlug], { encoding: 'utf8', windowsHide: true });
      const ghArgs = view.status === 0
        ? ['release', 'edit', tag, '--repo', repoSlug, '--title', title, '--notes-file', bodyTmp]
        : ['release', 'create', tag, '--repo', repoSlug, '--verify-tag', '--title', title, '--notes-file', bodyTmp];
      const pub = spawnSync('gh', ghArgs, { encoding: 'utf8', windowsHide: true });
      if (pub.status !== 0) {
        throw new Error(`gh release failed: ${pub.stderr || pub.stdout}`);
      }
      publishedUrl = String(pub.stdout || '').trim() || `https://github.com/${repoSlug}/releases/tag/${tag}`;
    } finally {
      try { fs.unlinkSync(bodyTmp); } catch { /* cleanup */ }
    }
  }

  const payload = {
    version: versionRaw,
    tag,
    previous_tag: prevTag,
    release_doc: releaseDocRel,
    plugin_counts: {
      total: diffs.total,
      added: diffs.added.length,
      updated: diffs.updated.length,
      unchanged: diffs.unchanged.length
    },
    update_images: updateImagesResult,
    published_github_release_url: publishedUrl
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else {
    process.stdout.write(`Authored ${releaseDocRel} (${diffs.updated.length} updated, ${diffs.added.length} new plugin(s) vs ${prevTag || 'initial'}).\n`);
    if (publishedUrl) process.stdout.write(`Published GitHub Release: ${publishedUrl}\n`);
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  main();
}
