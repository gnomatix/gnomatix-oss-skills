// update-readme-images.mjs — Config-driven README & SKILL.md image resolver,
// auditor, oval-inset builder, automatic og-social-image generator, non-destructive
// draft revision manager, and Markdown embedder.
//
// Usage:
//   node update-readme-images.mjs --resolve <rel-path> [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --audit [<glob-or-file>] [--repo <dir>] [--config <path>] [--verify-images] [--json]
//   node update-readme-images.mjs --sync-og-images [--regenerate] [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --apply <rel-path> [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --make-oval-inset <src> <out.png> [--width 864] [--height 1013] [--outer-color "#0B1F4A"] [--inner-color "#D4AF37"] [--floodfill-corners] [--fuzz 12%] [--repo <dir>] [--json]
//   node update-readme-images.mjs --stage-revision <candidate-src> <target-path> [--reason "..."] [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --list-drafts [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --promote-draft <draft-or-proposal-path> --approved-by "<verbatim approval or decision ref>" [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --discard-draft <draft-or-proposal-path> [--reason "..."] [--repo <dir>] [--config <path>] [--json]
//   node update-readme-images.mjs --init [<target-repo-dir>] [--workspace-root <name>] [--json]

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..');
const DEFAULT_PLUGIN_CONFIG = path.join(PLUGIN_ROOT, 'config', 'readme-images.json');
const OG_MAX_BYTES_DEFAULT = 1048576;

// ─── Safe Filesystem Helpers (per repository CLAUDE.md) ────────────────────

function safeExists(p) {
  try {
    return typeof p === 'string' && p.length > 0 && fs.existsSync(p);
  } catch {
    return false;
  }
}

function safeStat(p) {
  try {
    if (!safeExists(p)) return null;
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function safeReadText(p) {
  try {
    if (!safeExists(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    process.stderr.write(`[update-readme-images] read error on ${p}: ${err.message}\n`);
    return null;
  }
}

function safeMkdirp(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    process.stderr.write(`[update-readme-images] mkdir error on ${dir}: ${err.message}\n`);
    return false;
  }
}

function atomicWrite(targetPath, contents) {
  const dir = path.dirname(targetPath);
  if (!safeMkdirp(dir)) return false;
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    process.stderr.write(`[update-readme-images] atomicWrite error on ${targetPath}: ${err.message}\n`);
    try { fs.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
    return false;
  }
}

function atomicCopyFile(srcPath, targetPath) {
  const dir = path.dirname(targetPath);
  if (!safeMkdirp(dir)) return false;
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.copyFileSync(srcPath, tmpPath);
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    process.stderr.write(`[update-readme-images] atomicCopyFile error on ${targetPath}: ${err.message}\n`);
    try { fs.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
    return false;
  }
}

function appendJsonl(logPath, record) {
  const dir = path.dirname(logPath);
  if (!safeMkdirp(dir)) return false;
  try {
    fs.appendFileSync(logPath, JSON.stringify(record) + '\n', 'utf8');
    return true;
  } catch (err) {
    process.stderr.write(`[update-readme-images] appendJsonl error on ${logPath}: ${err.message}\n`);
    return false;
  }
}

function sha256File(absPath) {
  try {
    const buf = fs.readFileSync(absPath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

// Normalize any path to forward-slash repo-relative form for glob & namespace matching.
function toPosixRel(repoRoot, filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath);
  const rel = path.relative(repoRoot, abs);
  if (!rel || rel === '') return '.';
  return rel.split(path.sep).join('/');
}

// ─── Glob Matcher (supports *, **, ?, and {a,b}) ───────────────────────────

function expandBraces(pattern) {
  const m = pattern.match(/\{([^{}]+)\}/);
  if (!m) return [pattern];
  const prefix = pattern.slice(0, m.index);
  const suffix = pattern.slice(m.index + m[0].length);
  const parts = m[1].split(',');
  const results = [];
  for (const part of parts) {
    for (const expanded of expandBraces(prefix + part + suffix)) {
      results.push(expanded);
    }
  }
  return results;
}

function globToRegExp(globPat) {
  const norm = globPat.replace(/\\/g, '/').replace(/^\/+/, '');
  let re = '^';
  let i = 0;
  while (i < norm.length) {
    const c = norm[i];
    if (c === '*') {
      if (norm[i + 1] === '*') {
        if (norm[i + 2] === '/') {
          re += '(?:.+/)?';
          i += 3;
          continue;
        }
        re += '.*';
        i += 2;
        continue;
      }
      re += '[^/]*';
      i += 1;
      continue;
    }
    if (c === '?') {
      re += '[^/]';
      i += 1;
      continue;
    }
    if ('+^$()[]{}|.\\'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
    i += 1;
  }
  re += '$';
  return new RegExp(re);
}

export function matchGlob(relPath, globSpec) {
  if (!globSpec) return false;
  const normPath = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const patterns = Array.isArray(globSpec) ? globSpec : [globSpec];
  for (const rawPat of patterns) {
    for (const pat of expandBraces(rawPat)) {
      if (globToRegExp(pat).test(normPath)) return true;
    }
  }
  return false;
}

// ─── GNOX Namespace Resolution (workspace_root:subdir:...) ─────────────────

export function normalizeNamespaceKey(key) {
  if (typeof key !== 'string') return '';
  return key
    .trim()
    .replace(/^\[+/, '')
    .replace(/\]+$/, '')
    .replace(/[\\/]+/g, ':')
    .replace(/:+/g, ':')
    .replace(/^:|:$/g, '');
}

export function buildNamespaceChain(workspaceRoot, relPath) {
  const rootKey = normalizeNamespaceKey(workspaceRoot || 'workspace');
  const normRel = (relPath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normRel || normRel === '.') {
    return {
      rootKey,
      mostSpecificDirNamespace: rootKey,
      fullNamespace: rootKey,
      chain: ['*', rootKey]
    };
  }

  const parts = normRel.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1] || '';
  const hasExt = /\.[^.]+$/.test(lastPart);
  const dirParts = hasExt ? parts.slice(0, -1) : parts;
  const fileStem = hasExt ? lastPart.replace(/\.[^.]+$/, '') : '';

  const chain = ['*', rootKey];
  let acc = rootKey;
  for (const seg of dirParts) {
    acc = `${acc}:${seg}`;
    chain.push(acc);
  }
  if (fileStem) {
    chain.push(`${acc}:${fileStem}`);
  }
  return {
    rootKey,
    mostSpecificDirNamespace: acc,
    fullNamespace: fileStem ? `${acc}:${fileStem}` : acc,
    chain
  };
}

export function resolveStyleGuides(config, relPath) {
  const wsRoot = config.workspace_root || 'workspace';
  const nsInfo = buildNamespaceChain(wsRoot, relPath);
  const rawGuides = config.style_guides || {};

  const guideMap = new Map();
  for (const [k, v] of Object.entries(rawGuides)) {
    guideMap.set(normalizeNamespaceKey(k), { namespace: normalizeNamespaceKey(k), ...v });
  }

  const matched = [];
  for (const candidate of nsInfo.chain) {
    const hit = guideMap.get(candidate);
    if (hit) {
      if (hit.inherit === false) {
        matched.length = 0;
      }
      matched.push(hit);
    }
  }

  const mergedPalette = {};
  const mergedTypography = {};
  const mergedReferenceImages = [];
  let effectiveOgSocial = undefined;

  for (const g of matched) {
    if (g.palette && typeof g.palette === 'object') {
      Object.assign(mergedPalette, g.palette);
    }
    if (g.typography && typeof g.typography === 'object') {
      Object.assign(mergedTypography, g.typography);
    }
    if (Array.isArray(g.reference_images)) {
      for (const img of g.reference_images) {
        if (!mergedReferenceImages.includes(img)) mergedReferenceImages.push(img);
      }
    }
    if (typeof g.og_social_image === 'boolean') {
      effectiveOgSocial = g.og_social_image;
    }
  }

  return {
    workspace_root: wsRoot,
    target_file: relPath,
    namespace: nsInfo.mostSpecificDirNamespace,
    namespace_chain: nsInfo.chain,
    resolved_guides: matched,
    effective: {
      style_docs: matched.map((g) => g.doc),
      reference_images: mergedReferenceImages,
      palette: mergedPalette,
      typography: mergedTypography,
      og_social_image: effectiveOgSocial
    }
  };
}

// ─── Placeholder Expansion & Rule Resolution ───────────────────────────────

function extractContextVars(repoRoot, config, relPath) {
  const normRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normRel.split('/').filter(Boolean);
  const fileName = parts[parts.length - 1] || '';
  const fileStem = fileName.replace(/\.[^.]+$/, '');
  const dirName = parts.length >= 2 ? parts[parts.length - 2] : (config.workspace_root || path.basename(repoRoot));

  let plugin = '';
  let skill = '';
  if (parts[0] === 'plugins' && parts.length >= 2) {
    plugin = parts[1];
  }
  const skillsIdx = parts.indexOf('skills');
  if (skillsIdx >= 0 && parts.length > skillsIdx + 1) {
    skill = parts[skillsIdx + 1];
  }

  let skillPanelFile = `${skill || fileStem}-banner.jpg`;
  if (plugin && skill) {
    const pluginImgDir = path.join(repoRoot, 'plugins', plugin, 'assets', 'images');
    const candidates = [
      `${skill}-banner.jpg`,
      `${skill}-panel.jpg`,
      `${skill}-computer-lab-panel.jpg`,
      `${skill}-blueprint-banner.jpg`
    ];
    for (const c of candidates) {
      if (safeExists(path.join(pluginImgDir, c))) {
        skillPanelFile = c;
        break;
      }
    }
  }

  return {
    repo: config.workspace_root || path.basename(repoRoot),
    dir_name: dirName,
    plugin: plugin || dirName,
    skill: skill || fileStem,
    file_stem: fileStem,
    skill_panel_file: skillPanelFile
  };
}

function expandPattern(str, vars) {
  if (typeof str !== 'string') return '';
  return str.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function resolveRulesForFile(repoRoot, config, relPath) {
  const normRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const vars = extractContextVars(repoRoot, config, normRel);
  const matchedRules = [];

  for (const rule of config.rules || []) {
    if (!matchGlob(normRel, rule.glob)) continue;
    const excludeSpec = rule.exclude || rule.exclude_globs;
    if (excludeSpec && matchGlob(normRel, excludeSpec)) continue;

    const expandedPanels = (rule.panels || []).map((p) => {
      const src = expandPattern(p.src_pattern, vars);
      const alt = expandPattern(p.alt_pattern || '{dir_name}', vars);
      const title = p.title_pattern ? expandPattern(p.title_pattern, vars) : null;
      const og = p.companion_og_image && p.companion_og_image.enabled !== false
        ? {
            ...p.companion_og_image,
            enabled: Boolean(p.companion_og_image.enabled),
            src: expandPattern(p.companion_og_image.src_pattern || 'assets/images/{dir_name}-og-image.jpg', vars)
          }
        : p.companion_og_image && p.companion_og_image.enabled === false
          ? { enabled: false }
          : null;
      return {
        ...p,
        resolved_src: src,
        resolved_alt: alt,
        resolved_title: title,
        resolved_companion_og: og
      };
    });

    matchedRules.push({
      id: rule.id,
      description: rule.description || '',
      glob: rule.glob,
      doc: rule.doc,
      panels: expandedPanels
    });
  }

  return matchedRules;
}

// ─── Config Discovery & Repo Enumeration ───────────────────────────────────

export function findConfigPath(repoRoot, explicitConfig) {
  if (explicitConfig) {
    const abs = path.isAbsolute(explicitConfig) ? explicitConfig : path.resolve(repoRoot, explicitConfig);
    if (safeExists(abs)) return abs;
  }
  const candidates = [
    path.join(repoRoot, '.claude', 'readme-images.json'),
    path.join(repoRoot, 'config', 'readme-images.json'),
    path.join(repoRoot, 'readme-images.json'),
    path.join(repoRoot, 'plugins', 'update-readme-images', 'config', 'readme-images.json'),
    DEFAULT_PLUGIN_CONFIG
  ];
  for (const c of candidates) {
    if (safeExists(c)) return c;
  }
  return null;
}

export function loadConfig(repoRoot, explicitConfig) {
  const cfgPath = findConfigPath(repoRoot, explicitConfig);
  if (!cfgPath) {
    throw new Error(`No readme-images.json config found in ${repoRoot}`);
  }
  const raw = safeReadText(cfgPath);
  if (!raw) {
    throw new Error(`Could not read config at ${cfgPath}`);
  }
  return { configPath: cfgPath, config: JSON.parse(raw) };
}

const SKIP_WALK_DIRS = new Set(['.git', 'node_modules', 'dev', '.beads', 'dist', 'build', '.next']);

function walkMarkdownFiles(rootDir) {
  const results = [];

  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_WALK_DIRS.has(entry.name)) continue;
        // Skip draft proposal markdown files inside assets/drafts
        const fullDir = path.join(currentDir, entry.name);
        if (entry.name === 'drafts' && path.basename(currentDir) === 'assets') continue;
        walk(fullDir);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(toPosixRel(rootDir, path.join(currentDir, entry.name)));
      }
    }
  }

  walk(rootDir);
  return results.sort();
}

// ─── Tooling Detection & Graceful Degradation (ImageMagick + mise) ─────────

let cachedMagickCaps = null;

export function detectMagickCapabilities(forceRefresh = false) {
  if (!forceRefresh && cachedMagickCaps && !process.env.UPDATE_README_IMAGES_FORCE_NO_MAGICK) {
    return cachedMagickCaps;
  }

  if (process.env.UPDATE_README_IMAGES_FORCE_NO_MAGICK === '1') {
    return {
      available: false,
      magickBin: null,
      miseAvailable: false,
      installableViaMise: false,
      installHint: 'mise use -g imagemagick'
    };
  }

  const candidates = ['magick'];
  const home = os.homedir();
  if (home) {
    candidates.push(
      path.join(home, '.local', 'share', 'mise', 'shims', process.platform === 'win32' ? 'magick.exe' : 'magick')
    );
  }

  for (const bin of candidates) {
    const r = spawnSync(bin, ['-version'], { encoding: 'utf8', shell: false, windowsHide: true });
    if (!r.error && r.status === 0) {
      cachedMagickCaps = {
        available: true,
        magickBin: bin,
        miseAvailable: true,
        installableViaMise: true,
        installHint: 'mise use -g imagemagick'
      };
      return cachedMagickCaps;
    }
  }

  const miseCandidates = ['mise'];
  if (home) {
    miseCandidates.push(
      path.join(home, '.local', 'bin', process.platform === 'win32' ? 'mise.exe' : 'mise'),
      path.join(home, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'mise.exe')
    );
  }

  let miseBin = null;
  for (const mb of miseCandidates) {
    const mr = spawnSync(mb, ['--version'], { encoding: 'utf8', shell: false, windowsHide: true });
    if (!mr.error && mr.status === 0) {
      miseBin = mb;
      break;
    }
  }

  if (miseBin) {
    const whichRes = spawnSync(miseBin, ['which', 'magick'], { encoding: 'utf8', shell: false, windowsHide: true });
    const resolvedBin = (whichRes.stdout || '').trim();
    if (!whichRes.error && whichRes.status === 0 && resolvedBin && safeExists(resolvedBin)) {
      cachedMagickCaps = {
        available: true,
        magickBin: resolvedBin,
        miseAvailable: true,
        installableViaMise: true,
        installHint: 'mise use -g imagemagick'
      };
      return cachedMagickCaps;
    }
  }

  cachedMagickCaps = {
    available: false,
    magickBin: null,
    miseAvailable: Boolean(miseBin),
    installableViaMise: Boolean(miseBin),
    installHint: 'mise use -g imagemagick'
  };
  return cachedMagickCaps;
}

function runMagick(args) {
  const caps = detectMagickCapabilities();
  if (!caps.available || !caps.magickBin) {
    return {
      ok: false,
      missingTool: true,
      installableViaMise: caps.installableViaMise,
      error: caps.installableViaMise
        ? `ImageMagick (magick) is not installed; install via: ${caps.installHint}`
        : 'ImageMagick (magick) is not available and mise is not installed',
      stdout: '',
      stderr: ''
    };
  }
  const r = spawnSync(caps.magickBin, args, { encoding: 'utf8', shell: false, windowsHide: true });
  if (r.error) {
    return { ok: false, error: r.error.message, stdout: '', stderr: '' };
  }
  if (r.status !== 0) {
    return { ok: false, error: (r.stderr || `magick exited ${r.status}`).trim(), stdout: r.stdout || '', stderr: r.stderr || '' };
  }
  return { ok: true, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

export function inspectImageWithMagick(absImagePath, checkAlphaCorners = false) {
  const fmt = checkAlphaCorners
    ? '%m|%w|%h|%[channels]|%[fx:p{0,0}.a]|%[fx:p{w-1,0}.a]|%[fx:p{0,h-1}.a]|%[fx:p{w-1,h-1}.a]|%[fx:p{int(w/2),int(h/2)}.a]'
    : '%m|%w|%h|%[channels]';
  const res = runMagick(['identify', '-format', fmt, absImagePath]);
  if (!res.ok) {
    return { ok: false, missingTool: Boolean(res.missingTool), error: res.error };
  }
  const parts = res.stdout.split('|');
  const info = {
    ok: true,
    format: parts[0],
    width: Number(parts[1]),
    height: Number(parts[2]),
    channels: parts[3] || ''
  };
  if (checkAlphaCorners) {
    const tl = Number(parts[4]);
    const tr = Number(parts[5]);
    const bl = Number(parts[6]);
    const br = Number(parts[7]);
    const center = Number(parts[8]);
    info.alpha = { tl, tr, bl, br, center };
    info.corners_transparent =
      info.format === 'PNG' &&
      info.channels.includes('a') &&
      tl <= 0.01 &&
      tr <= 0.01 &&
      bl <= 0.01 &&
      br <= 0.01 &&
      center >= 0.95;
  }
  return info;
}

// ─── Non-Destructive Draft Staging & Asynchronous Proposed Revision Gate ───

export function resolveDraftDestination(desiredAbsPath, config = {}) {
  const absTarget = path.resolve(desiredAbsPath);
  const fileName = path.basename(absTarget);
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  const parentDir = path.dirname(absTarget);

  // If target lives in <owner>/assets/images/<file>, draft lives in <owner>/assets/drafts/<file>.
  // Otherwise, draft lives in <parentDir>/drafts/<file>.
  let draftsDir;
  if (path.basename(parentDir) === 'images' && path.basename(path.dirname(parentDir)) === 'assets') {
    const ownerDir = path.dirname(path.dirname(parentDir));
    const draftRelCfg = (config && config.draft_assets_dir) || 'assets/drafts';
    draftsDir = path.join(ownerDir, ...draftRelCfg.split('/'));
  } else {
    draftsDir = path.join(parentDir, 'drafts');
  }

  return {
    targetAbsPath: absTarget,
    draftsDir,
    draftAbsPath: path.join(draftsDir, fileName),
    proposalJsonPath: path.join(draftsDir, `${stem}.proposal.json`),
    proposalMdPath: path.join(draftsDir, `${stem}.proposal.md`)
  };
}

export function createProposedRevisionRecord(repoRoot, config, { targetAbsPath, draftAbsPath, proposalJsonPath, proposalMdPath, reason = '' }) {
  const targetRel = toPosixRel(repoRoot, targetAbsPath);
  const draftRel = toPosixRel(repoRoot, draftAbsPath);
  const proposalJsonRel = toPosixRel(repoRoot, proposalJsonPath);
  const proposalMdRel = toPosixRel(repoRoot, proposalMdPath);
  const nsInfo = resolveStyleGuides(config || { workspace_root: path.basename(repoRoot) }, targetRel);
  const namespace = nsInfo.namespace;
  const calloutTarget =
    (config && config.draft_revision_policy && config.draft_revision_policy.callout_target) || 'user';

  const existingStat = safeStat(targetAbsPath);
  const draftStat = safeStat(draftAbsPath);
  const existingInspect = detectMagickCapabilities().available ? inspectImageWithMagick(targetAbsPath, false) : null;
  const draftInspect = detectMagickCapabilities().available ? inspectImageWithMagick(draftAbsPath, targetAbsPath.toLowerCase().endsWith('.png')) : null;

  const proposalId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const inaudibleCallout = `[${namespace}]{@${calloutTarget}} {Request} Proposed image revision staged at ${draftRel} (existing ${targetRel} untouched). Approve promotion or discard? #review #art #decision`;
  const ccpPrompt = `Existing image '${targetRel}' was preserved untouched per the non-destructive draft policy, and the candidate replacement has been staged at '${draftRel}'. Approve promoting this draft to '${targetRel}', or discard the draft?`;
  const cliRel = toPosixRel(repoRoot, fileURLToPath(import.meta.url));
  const promoteCmd = `node ${cliRel} --promote-draft ${draftRel} --approved-by "<verbatim user approval>"`;
  const discardCmd = `node ${cliRel} --discard-draft ${draftRel}`;
  const beadsCmd = `bd create --title="[${namespace}] Review staged image revision for ${path.basename(targetAbsPath)}" --type=task --priority=2`;

  const proposal = {
    proposal_id: proposalId,
    created_at: createdAt,
    status: 'pending_user_approval',
    namespace,
    reason: reason || 'Candidate replacement generated for an already-existing image; staged in assets/drafts pending user approval.',
    target_path: targetRel,
    draft_path: draftRel,
    proposal_markdown: proposalMdRel,
    existing: {
      bytes: existingStat ? existingStat.size : null,
      sha256: sha256File(targetAbsPath),
      dimensions: existingInspect && existingInspect.ok ? `${existingInspect.width}x${existingInspect.height}` : null,
      format: existingInspect && existingInspect.ok ? existingInspect.format : null
    },
    candidate: {
      bytes: draftStat ? draftStat.size : null,
      sha256: sha256File(draftAbsPath),
      dimensions: draftInspect && draftInspect.ok ? `${draftInspect.width}x${draftInspect.height}` : null,
      format: draftInspect && draftInspect.ok ? draftInspect.format : null,
      corners_transparent: draftInspect && typeof draftInspect.corners_transparent === 'boolean' ? draftInspect.corners_transparent : undefined
    },
    asynchronous_workflow: {
      skills_invoked: ['critical-control-points', 'inaudible-markup', 'hidden-libel-check', 'spank-dario'],
      inaudible_callout: inaudibleCallout,
      critical_control_point_question: ccpPrompt,
      non_blocking_rule: 'Record this CCP and continue unblocked work; never overwrite target_path until explicit user approval is recorded.',
      beads_tracking_command: beadsCmd,
      promote_command: promoteCmd,
      discard_command: discardCmd
    }
  };

  const mdSummary = [
    `# Proposed Image Revision — \`${path.basename(targetAbsPath)}\``,
    '',
    `${inaudibleCallout}`,
    '',
    `- **Proposal ID**: \`${proposalId}\``,
    `- **Status**: \`pending_user_approval\``,
    `- **GNOX Namespace**: \`${namespace}\``,
    `- **Live Image (untouched)**: \`${targetRel}\` (${proposal.existing.dimensions || 'unknown'}, ${proposal.existing.bytes} bytes, sha256 \`${(proposal.existing.sha256 || '').slice(0, 12)}\`)`,
    `- **Staged Candidate Draft**: \`${draftRel}\` (${proposal.candidate.dimensions || 'unknown'}, ${proposal.candidate.bytes} bytes, sha256 \`${(proposal.candidate.sha256 || '').slice(0, 12)}\`)`,
    reason ? `- **Reason**: ${reason}` : null,
    '',
    '## Asynchronous Decision Gate (`critical-control-points`)',
    '',
    `> ${ccpPrompt}`,
    '',
    '### Actions (run only after user decision)',
    '```sh',
    `# Promote approved draft to ${targetRel}:`,
    promoteCmd,
    '',
    '# Or discard rejected draft:',
    discardCmd,
    '```',
    ''
  ].filter((line) => line !== null).join('\n');

  atomicWrite(proposalJsonPath, JSON.stringify(proposal, null, 2) + '\n');
  atomicWrite(proposalMdPath, mdSummary);

  return {
    ...proposal,
    proposal_json: proposalJsonRel
  };
}

export function stageImageRevision(repoRoot, config, srcCandidatePath, desiredTargetPath, reason = '') {
  const absSrc = path.resolve(repoRoot, srcCandidatePath);
  const absDesired = path.resolve(repoRoot, desiredTargetPath);
  if (!safeExists(absSrc)) {
    throw new Error(`Candidate image does not exist: ${absSrc}`);
  }

  if (!safeExists(absDesired)) {
    if (!atomicCopyFile(absSrc, absDesired)) {
      throw new Error(`Failed to write new image to ${absDesired}`);
    }
    return {
      action: 'created_new',
      staged_as_draft: false,
      target_path: toPosixRel(repoRoot, absDesired)
    };
  }

  const dest = resolveDraftDestination(absDesired, config);
  if (!atomicCopyFile(absSrc, dest.draftAbsPath)) {
    throw new Error(`Failed to stage draft image to ${dest.draftAbsPath}`);
  }
  const proposal = createProposedRevisionRecord(repoRoot, config, {
    targetAbsPath: dest.targetAbsPath,
    draftAbsPath: dest.draftAbsPath,
    proposalJsonPath: dest.proposalJsonPath,
    proposalMdPath: dest.proposalMdPath,
    reason
  });
  return {
    action: 'staged_draft',
    staged_as_draft: true,
    ...proposal
  };
}

export function listPendingDrafts(repoRoot) {
  const proposals = [];

  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_WALK_DIRS.has(entry.name)) continue;
        walk(path.join(currentDir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.proposal.json')) {
        const raw = safeReadText(path.join(currentDir, entry.name));
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.status === 'pending_user_approval') {
              proposals.push(parsed);
            }
          } catch { /* ignore malformed */ }
        }
      }
    }
  }

  walk(repoRoot);
  return proposals;
}

function locateProposalJson(repoRoot, draftOrProposalArg) {
  const abs = path.resolve(repoRoot, draftOrProposalArg);
  if (abs.endsWith('.proposal.json') && safeExists(abs)) {
    return abs;
  }
  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  const stem = path.basename(abs, ext);
  const candidate = path.join(dir, `${stem}.proposal.json`);
  if (safeExists(candidate)) return candidate;
  throw new Error(`No .proposal.json manifest found for '${draftOrProposalArg}' (checked ${candidate})`);
}

function cleanupEmptyDraftsDir(dirPath) {
  try {
    if (!safeExists(dirPath)) return;
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      fs.rmdirSync(dirPath);
    }
  } catch { /* ignore */ }
}

export function promoteDraftRevision(repoRoot, config, draftOrProposalArg, approvedBy) {
  if (typeof approvedBy !== 'string' || approvedBy.trim().length === 0) {
    const err = new Error('Refusing to promote draft without explicit user approval: pass --approved-by "<verbatim user approval or decision ref>"');
    err.exitCode = 2;
    throw err;
  }

  const proposalJsonAbs = locateProposalJson(repoRoot, draftOrProposalArg);
  const raw = safeReadText(proposalJsonAbs);
  if (!raw) throw new Error(`Could not read proposal manifest ${proposalJsonAbs}`);
  const proposal = JSON.parse(raw);

  const draftAbs = path.resolve(repoRoot, proposal.draft_path);
  const targetAbs = path.resolve(repoRoot, proposal.target_path);
  const proposalMdAbs = proposal.proposal_markdown ? path.resolve(repoRoot, proposal.proposal_markdown) : null;

  if (!safeExists(draftAbs)) {
    throw new Error(`Staged draft image is missing on disk: ${draftAbs}`);
  }

  const prevSha = sha256File(targetAbs);
  const nextSha = sha256File(draftAbs);

  if (!atomicCopyFile(draftAbs, targetAbs)) {
    throw new Error(`Failed to promote ${draftAbs} -> ${targetAbs}`);
  }

  const logPath = path.join(repoRoot, '.claude', 'readme-image-approvals', 'log.jsonl');
  const logEntry = {
    proposal_id: proposal.proposal_id,
    timestamp: new Date().toISOString(),
    action: 'promoted',
    namespace: proposal.namespace,
    target_path: proposal.target_path,
    draft_path: proposal.draft_path,
    previous_sha256: prevSha,
    promoted_sha256: nextSha,
    user_approval: approvedBy.trim()
  };
  appendJsonl(logPath, logEntry);

  try { fs.rmSync(draftAbs, { force: true }); } catch { /* ignore */ }
  try { fs.rmSync(proposalJsonAbs, { force: true }); } catch { /* ignore */ }
  if (proposalMdAbs) {
    try { fs.rmSync(proposalMdAbs, { force: true }); } catch { /* ignore */ }
  }
  cleanupEmptyDraftsDir(path.dirname(draftAbs));

  return logEntry;
}

export function discardDraftRevision(repoRoot, draftOrProposalArg, reason = '') {
  const proposalJsonAbs = locateProposalJson(repoRoot, draftOrProposalArg);
  const raw = safeReadText(proposalJsonAbs);
  if (!raw) throw new Error(`Could not read proposal manifest ${proposalJsonAbs}`);
  const proposal = JSON.parse(raw);

  const draftAbs = path.resolve(repoRoot, proposal.draft_path);
  const proposalMdAbs = proposal.proposal_markdown ? path.resolve(repoRoot, proposal.proposal_markdown) : null;

  const logPath = path.join(repoRoot, '.claude', 'readme-image-approvals', 'log.jsonl');
  const logEntry = {
    proposal_id: proposal.proposal_id,
    timestamp: new Date().toISOString(),
    action: 'discarded',
    namespace: proposal.namespace,
    target_path: proposal.target_path,
    draft_path: proposal.draft_path,
    reason: reason || 'Discarded without modifying live image'
  };
  appendJsonl(logPath, logEntry);

  try { fs.rmSync(draftAbs, { force: true }); } catch { /* ignore */ }
  try { fs.rmSync(proposalJsonAbs, { force: true }); } catch { /* ignore */ }
  if (proposalMdAbs) {
    try { fs.rmSync(proposalMdAbs, { force: true }); } catch { /* ignore */ }
  }
  cleanupEmptyDraftsDir(path.dirname(draftAbs));

  return logEntry;
}

// ─── Oval Inset Builder (Non-Destructive when Target Exists) ───────────────

export function buildOvalInsetImage(srcPath, outPngPath, opts = {}) {
  const width = Number(opts.width || 864);
  const height = Number(opts.height || 1013);
  const outerColor = opts.outerColor || '#0B1F4A';
  const innerColor = opts.innerColor || '#D4AF37';
  const fuzz = opts.fuzz || '12%';
  const repoRoot = opts.repoRoot ? path.resolve(opts.repoRoot) : process.cwd();
  const config = opts.config || { workspace_root: path.basename(repoRoot) };

  const desiredAbs = path.resolve(repoRoot, outPngPath);
  const alreadyExists = safeExists(desiredAbs);
  const dest = alreadyExists ? resolveDraftDestination(desiredAbs, config) : null;
  const writeAbs = alreadyExists ? dest.draftAbsPath : desiredAbs;

  safeMkdirp(path.dirname(writeAbs));

  if (opts.floodfillCorners) {
    const srcInfo = inspectImageWithMagick(srcPath, false);
    if (!srcInfo.ok) {
      throw new Error(`Cannot inspect source image ${srcPath}: ${srcInfo.error}`);
    }
    const w = srcInfo.width;
    const h = srcInfo.height;
    const args = [
      srcPath,
      '-alpha', 'set',
      '-fuzz', fuzz,
      '-fill', 'none',
      '-draw', 'alpha 0,0 floodfill',
      '-draw', `alpha ${w - 1},0 floodfill`,
      '-draw', `alpha 0,${h - 1} floodfill`,
      '-draw', `alpha ${w - 1},${h - 1} floodfill`,
      '-strip',
      `PNG32:${writeAbs}`
    ];
    const r = runMagick(args);
    if (!r.ok) throw new Error(`magick floodfill failed: ${r.error}`);
  } else {
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);
    const rxOuter = Math.round(width / 2) - 6;
    const ryOuter = Math.round(height / 2) - 6;
    const rxNavy = rxOuter - 6;
    const ryNavy = ryOuter - 6;
    const rxInnerGold = rxOuter - 32;
    const ryInnerGold = ryOuter - 32;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oval-inset-'));
    try {
      const maskPath = path.join(tmpDir, 'mask.png');
      const ringPath = path.join(tmpDir, 'ring.png');

      const rMask = runMagick([
        '-size', `${width}x${height}`,
        'xc:none',
        '-fill', 'white',
        '-draw', `ellipse ${cx},${cy} ${rxInnerGold},${ryInnerGold} 0,360`,
        `PNG32:${maskPath}`
      ]);
      if (!rMask.ok) throw new Error(`magick mask failed: ${rMask.error}`);

      const rRing = runMagick([
        '-size', `${width}x${height}`,
        'xc:none',
        '-fill', 'none',
        '-stroke', innerColor, '-strokewidth', '6',
        '-draw', `ellipse ${cx},${cy} ${rxOuter - 3},${ryOuter - 3} 0,360`,
        '-stroke', outerColor, '-strokewidth', '22',
        '-draw', `ellipse ${cx},${cy} ${rxNavy - 8},${ryNavy - 8} 0,360`,
        '-stroke', innerColor, '-strokewidth', '6',
        '-draw', `ellipse ${cx},${cy} ${rxInnerGold},${ryInnerGold} 0,360`,
        `PNG32:${ringPath}`
      ]);
      if (!rRing.ok) throw new Error(`magick ring failed: ${rRing.error}`);

      const rComp = runMagick([
        srcPath,
        '-resize', `${width}x${height}^`,
        '-gravity', 'center',
        '-extent', `${width}x${height}`,
        maskPath,
        '-alpha', 'off',
        '-compose', 'CopyOpacity',
        '-composite',
        ringPath,
        '-compose', 'Over',
        '-composite',
        '-strip',
        `PNG32:${writeAbs}`
      ]);
      if (!rComp.ok) throw new Error(`magick composite failed: ${rComp.error}`);
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }

  const verify = inspectImageWithMagick(writeAbs, true);
  if (!verify.ok) {
    throw new Error(`Verification failed on ${writeAbs}: ${verify.error}`);
  }
  if (!verify.corners_transparent) {
    throw new Error(
      `Oval inset ${writeAbs} failed corner transparency check: ${JSON.stringify(verify)}`
    );
  }

  if (alreadyExists) {
    const proposal = createProposedRevisionRecord(repoRoot, config, {
      targetAbsPath: dest.targetAbsPath,
      draftAbsPath: dest.draftAbsPath,
      proposalJsonPath: dest.proposalJsonPath,
      proposalMdPath: dest.proposalMdPath,
      reason: 'Oval inset re-rendered while target PNG already exists; staged in assets/drafts.'
    });
    return {
      ...verify,
      staged_as_draft: true,
      output: toPosixRel(repoRoot, writeAbs),
      target_preserved: toPosixRel(repoRoot, desiredAbs),
      proposal
    };
  }

  return {
    ...verify,
    staged_as_draft: false,
    output: toPosixRel(repoRoot, writeAbs)
  };
}

// ─── Automatic og-social-image Discovery & Sync Across assets/images ───────

function walkAssetsImageDirs(repoRoot, assetsSubdir = 'assets/images') {
  const found = [];
  const subParts = assetsSubdir.split('/').filter(Boolean);

  function checkOwnerDir(absOwnerDir) {
    const absAssetsImages = path.join(absOwnerDir, ...subParts);
    const st = safeStat(absAssetsImages);
    if (st && st.isDirectory()) {
      found.push({
        ownerRelDir: toPosixRel(repoRoot, absOwnerDir),
        ownerAbsDir: absOwnerDir,
        assetsImagesAbsDir: absAssetsImages
      });
    }
  }

  function walk(currentDir) {
    checkOwnerDir(currentDir);
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_WALK_DIRS.has(entry.name)) continue;
      if (entry.name === 'assets') continue;
      walk(path.join(currentDir, entry.name));
    }
  }

  walk(repoRoot);
  return found.sort((a, b) => a.ownerRelDir.localeCompare(b.ownerRelDir));
}

export function renderOgSocialImageToFile(srcBannerAbs, outOgAbs, opts = {}) {
  const width = Number(opts.width || 1280);
  const height = Number(opts.height || 640);
  const maxBytes = Number(opts.maxBytes || OG_MAX_BYTES_DEFAULT);
  const startQuality = Number(opts.quality || 92);
  const gravity = opts.gravity || 'center';
  const cropOffset = opts.cropOffset || null;

  safeMkdirp(path.dirname(outOgAbs));

  const qualities = [startQuality, 85, 80, 75, 70].filter((q, idx, arr) => q > 0 && arr.indexOf(q) === idx);
  let lastErr = null;

  for (const q of qualities) {
    const args = [srcBannerAbs, '-resize', `${width}x${height}^`, '-gravity', gravity];
    if (cropOffset) {
      args.push('-crop', `${width}x${height}${cropOffset}`, '+repage');
    } else {
      args.push('-extent', `${width}x${height}`);
    }
    args.push('-strip', '-quality', String(q), outOgAbs);

    const r = runMagick(args);
    if (!r.ok) {
      return { ok: false, missingTool: Boolean(r.missingTool), error: r.error };
    }

    const st = safeStat(outOgAbs);
    const info = inspectImageWithMagick(outOgAbs, false);
    if (!info.ok || info.width !== width || info.height !== height || info.format !== 'JPEG') {
      lastErr = `Output verification failed (${JSON.stringify(info)})`;
      continue;
    }
    if (st && st.size > 0 && st.size < maxBytes) {
      return {
        ok: true,
        width: info.width,
        height: info.height,
        format: info.format,
        bytes: st.size,
        quality: q
      };
    }
    lastErr = `File size ${st ? st.size : 0} bytes exceeds cap ${maxBytes}`;
  }

  return { ok: false, error: lastErr || 'Could not render OG image under size cap' };
}

export function discoverOgSocialTargets(repoRoot, config) {
  const autoCfg = config.auto_og_social_image || {};
  if (autoCfg.enabled === false) {
    return { enabled: false, reason: 'Disabled globally via auto_og_social_image.enabled = false', targets: [] };
  }

  const assetsSubdir = autoCfg.assets_subdir || config.default_assets_dir || 'assets/images';
  const sourceSuffix = autoCfg.source_suffix || '-banner';
  const outputSuffix = autoCfg.output_suffix || '-og-image.jpg';
  const excludeDirs = autoCfg.exclude_dirs || [];
  const overrides = autoCfg.overrides || {};

  const dirs = walkAssetsImageDirs(repoRoot, assetsSubdir);
  const targets = [];

  for (const item of dirs) {
    const relDir = item.ownerRelDir;
    if (excludeDirs.some((pat) => matchGlob(relDir, pat) || pat === relDir)) {
      continue;
    }

    const dirOverride = overrides[relDir] || {};
    if (dirOverride.enabled === false) continue;

    // Check style guide namespace opt-out
    const readmeRel = relDir === '.' ? 'README.md' : `${relDir}/README.md`;
    const styleRes = resolveStyleGuides(config, readmeRel);
    if (styleRes.effective.og_social_image === false) continue;

    // Check rule-level opt-out if README.md matches a rule with companion_og_image.enabled === false
    const matchedRules = resolveRulesForFile(repoRoot, config, readmeRel);
    let ruleExplicitlyDisabled = false;
    for (const r of matchedRules) {
      for (const p of r.panels) {
        if (p.type === 'top-level-panel' && p.resolved_companion_og && p.resolved_companion_og.enabled === false) {
          ruleExplicitlyDisabled = true;
        }
      }
    }
    if (ruleExplicitlyDisabled) continue;

    const stemName = relDir === '.'
      ? (config.workspace_root || path.basename(repoRoot))
      : path.basename(item.ownerAbsDir);

    // Find primary hero/banner image inside assets/images
    let srcBannerAbs = null;
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const cand = path.join(item.assetsImagesAbsDir, `${stemName}${sourceSuffix}${ext}`);
      if (safeExists(cand)) {
        srcBannerAbs = cand;
        break;
      }
    }
    if (!srcBannerAbs) {
      // Fallback: check if any *-banner.{jpg,png} exists in assets/images
      try {
        const files = fs.readdirSync(item.assetsImagesAbsDir).sort();
        const bannerHit = files.find((f) => /-banner\.(jpe?g|png|webp)$/i.test(f));
        if (bannerHit) srcBannerAbs = path.join(item.assetsImagesAbsDir, bannerHit);
      } catch { /* ignore */ }
    }
    if (!srcBannerAbs) continue;

    const bannerBase = path.basename(srcBannerAbs).replace(new RegExp(`${sourceSuffix}\\.[^.]+$`, 'i'), '');
    const ogFileName = `${bannerBase}${outputSuffix}`;
    const outOgAbs = path.join(item.assetsImagesAbsDir, ogFileName);

    targets.push({
      owner_dir: relDir,
      namespace: styleRes.namespace,
      source_banner: toPosixRel(repoRoot, srcBannerAbs),
      source_banner_abs: srcBannerAbs,
      og_image: toPosixRel(repoRoot, outOgAbs),
      og_image_abs: outOgAbs,
      width: autoCfg.width || 1280,
      height: autoCfg.height || 640,
      max_bytes: autoCfg.max_bytes || OG_MAX_BYTES_DEFAULT,
      quality: dirOverride.quality || autoCfg.quality || 92,
      gravity: dirOverride.gravity || autoCfg.gravity || 'center',
      crop_offset: dirOverride.crop_offset || null
    });
  }

  return { enabled: true, targets };
}

export function syncOgSocialImages(repoRoot, config, { regenerate = false } = {}) {
  const discovery = discoverOgSocialTargets(repoRoot, config);
  if (!discovery.enabled) {
    return {
      status: 'disabled',
      reason: discovery.reason,
      results: []
    };
  }

  const caps = detectMagickCapabilities();
  if (!caps.available) {
    return {
      status: 'skipped_missing_tool',
      tool: 'magick',
      mise_available: caps.miseAvailable,
      installable_via_mise: caps.installableViaMise,
      install_hint: caps.installHint,
      reason: caps.installableViaMise
        ? `ImageMagick (magick) is not installed; install via '${caps.installHint}' and re-run --sync-og-images.`
        : 'ImageMagick (magick) is unavailable and mise is not installed; gracefully skipping automatic og-social-image generation.',
      targets_discovered: discovery.targets.length,
      results: []
    };
  }

  const results = [];
  let createdCount = 0;
  let stagedCount = 0;
  let verifiedExistingCount = 0;
  let failedCount = 0;

  for (const t of discovery.targets) {
    const exists = safeExists(t.og_image_abs);

    if (exists && !regenerate) {
      const st = safeStat(t.og_image_abs);
      const info = inspectImageWithMagick(t.og_image_abs, false);
      const ok =
        info.ok &&
        info.format === 'JPEG' &&
        info.width === t.width &&
        info.height === t.height &&
        st &&
        st.size > 0 &&
        st.size < t.max_bytes;
      if (ok) verifiedExistingCount += 1;
      else failedCount += 1;
      results.push({
        owner_dir: t.owner_dir,
        source_banner: t.source_banner,
        og_image: t.og_image,
        action: ok ? 'exists_verified' : 'exists_invalid',
        bytes: st ? st.size : 0,
        dimensions: info.ok ? `${info.width}x${info.height}` : null
      });
      continue;
    }

    if (exists && regenerate) {
      // Non-destructive rule: NEVER overwrite existing live OG image; stage in assets/drafts!
      const dest = resolveDraftDestination(t.og_image_abs, config);
      const renderRes = renderOgSocialImageToFile(t.source_banner_abs, dest.draftAbsPath, {
        width: t.width,
        height: t.height,
        maxBytes: t.max_bytes,
        quality: t.quality,
        gravity: t.gravity,
        cropOffset: t.crop_offset
      });
      if (!renderRes.ok) {
        failedCount += 1;
        results.push({
          owner_dir: t.owner_dir,
          source_banner: t.source_banner,
          og_image: t.og_image,
          action: 'failed',
          error: renderRes.error
        });
        continue;
      }
      const proposal = createProposedRevisionRecord(repoRoot, config, {
        targetAbsPath: dest.targetAbsPath,
        draftAbsPath: dest.draftAbsPath,
        proposalJsonPath: dest.proposalJsonPath,
        proposalMdPath: dest.proposalMdPath,
        reason: `Candidate og-social-image regenerated from ${t.source_banner}; staged in assets/drafts to preserve existing ${t.og_image}.`
      });
      stagedCount += 1;
      results.push({
        owner_dir: t.owner_dir,
        source_banner: t.source_banner,
        og_image: t.og_image,
        draft_path: proposal.draft_path,
        proposal_json: proposal.proposal_json,
        action: 'staged_draft',
        bytes: renderRes.bytes,
        dimensions: `${renderRes.width}x${renderRes.height}`
      });
      continue;
    }

    // Target OG image does not yet exist — safe to create directly in assets/images!
    const renderRes = renderOgSocialImageToFile(t.source_banner_abs, t.og_image_abs, {
      width: t.width,
      height: t.height,
      maxBytes: t.max_bytes,
      quality: t.quality,
      gravity: t.gravity,
      cropOffset: t.crop_offset
    });
    if (!renderRes.ok) {
      failedCount += 1;
      results.push({
        owner_dir: t.owner_dir,
        source_banner: t.source_banner,
        og_image: t.og_image,
        action: 'failed',
        error: renderRes.error
      });
    } else {
      createdCount += 1;
      results.push({
        owner_dir: t.owner_dir,
        source_banner: t.source_banner,
        og_image: t.og_image,
        action: 'created_new',
        bytes: renderRes.bytes,
        dimensions: `${renderRes.width}x${renderRes.height}`,
        quality: renderRes.quality
      });
    }
  }

  return {
    status: failedCount === 0 ? 'ok' : 'failed',
    targets_discovered: discovery.targets.length,
    created: createdCount,
    staged_drafts: stagedCount,
    verified_existing: verifiedExistingCount,
    failures: failedCount,
    results
  };
}

// ─── Audit Engine ──────────────────────────────────────────────────────────

function checkMarkdownPlacement(markdownText, panel) {
  const lines = markdownText.split(/\r?\n/);
  const srcEscaped = panel.resolved_src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const anyEmbedRe = new RegExp(`(?:!\\[[^\\]]*\\]\\(\\s*${srcEscaped}(?:\\s+"[^"]*")?\\s*\\)|<img\\b[^>]*\\bsrc=["']${srcEscaped}["'][^>]*>)`, 'i');

  if (!anyEmbedRe.test(markdownText)) {
    return { embedded: false, placement_ok: false, reason: `Image '${panel.resolved_src}' is not referenced in Markdown` };
  }

  if (panel.placement === 'after-h1') {
    const h1Idx = lines.findIndex((l) => /^#\s+\S/.test(l));
    if (h1Idx < 0) {
      return { embedded: true, placement_ok: false, reason: 'No H1 heading (# ...) found in file' };
    }
    const windowLines = lines.slice(h1Idx + 1, h1Idx + 10).join('\n');
    const ok = anyEmbedRe.test(windowLines);
    return {
      embedded: true,
      placement_ok: ok,
      reason: ok ? 'Placed after H1' : `Image '${panel.resolved_src}' is embedded, but not immediately after H1`
    };
  }

  if (panel.section_heading) {
    const secIdx = lines.findIndex((l) => l.trim().toLowerCase() === panel.section_heading.trim().toLowerCase());
    if (secIdx < 0) {
      return { embedded: true, placement_ok: false, reason: `Target section '${panel.section_heading}' not found` };
    }
    let nextSecIdx = lines.length;
    for (let i = secIdx + 1; i < lines.length; i += 1) {
      if (/^##\s+\S/.test(lines[i])) {
        nextSecIdx = i;
        break;
      }
    }
    const sectionSlice = lines.slice(secIdx, nextSecIdx).join('\n');
    const ok = anyEmbedRe.test(sectionSlice);
    return {
      embedded: true,
      placement_ok: ok,
      reason: ok
        ? `Placed inside section '${panel.section_heading}' (${panel.placement})`
        : `Image '${panel.resolved_src}' is not inside section '${panel.section_heading}'`
    };
  }

  return { embedded: true, placement_ok: true, reason: 'Embedded in document' };
}

export function auditRepository(repoRoot, config, filterGlob = null, verifyImages = false) {
  const allMdFiles = walkMarkdownFiles(repoRoot);
  const fileReports = [];
  let totalPanelsChecked = 0;
  let totalFailures = 0;
  const magickCaps = detectMagickCapabilities();

  for (const relFile of allMdFiles) {
    if (filterGlob && !matchGlob(relFile, filterGlob) && relFile !== filterGlob.replace(/\\/g, '/')) {
      continue;
    }
    const rules = resolveRulesForFile(repoRoot, config, relFile);
    if (rules.length === 0) continue;

    const styleResolution = resolveStyleGuides(config, relFile);
    const absMdPath = path.join(repoRoot, relFile);
    const mdDir = path.dirname(absMdPath);
    const mdText = safeReadText(absMdPath) || '';

    const panelResults = [];
    for (const rule of rules) {
      for (const panel of rule.panels) {
        totalPanelsChecked += 1;
        const placementCheck = checkMarkdownPlacement(mdText, panel);
        const absImgPath = path.resolve(mdDir, panel.resolved_src);
        const fileExists = safeExists(absImgPath);

        let imageVerify = null;
        let imageOk = true;
        if (fileExists && verifyImages && magickCaps.available) {
          const needAlpha =
            panel.type === 'inset-oval' ||
            Boolean(panel.dimensions && panel.dimensions.require_alpha_corners_transparent);
          imageVerify = inspectImageWithMagick(absImgPath, needAlpha);
          if (!imageVerify.ok) {
            imageOk = false;
          } else {
            if (panel.dimensions && panel.dimensions.format && imageVerify.format !== panel.dimensions.format) {
              imageOk = false;
              imageVerify.mismatch = `Expected format ${panel.dimensions.format}, got ${imageVerify.format}`;
            }
            if (needAlpha && !imageVerify.corners_transparent) {
              imageOk = false;
              imageVerify.mismatch = 'Exterior corners are not transparent (expected PNG srgba with corner alpha == 0)';
            }
          }
        }

        let companionOgResult = null;
        let companionOgOk = true;
        const globalOgDisabled = config.auto_og_social_image && config.auto_og_social_image.enabled === false;
        const nsOgDisabled = styleResolution.effective.og_social_image === false;

        if (
          panel.resolved_companion_og &&
          panel.resolved_companion_og.enabled &&
          !globalOgDisabled &&
          !nsOgDisabled
        ) {
          const absOgPath = path.resolve(mdDir, panel.resolved_companion_og.src);
          const ogExists = safeExists(absOgPath);
          if (!ogExists) {
            if (!magickCaps.available && !magickCaps.installableViaMise) {
              // Graceful degradation when local tooling cannot be installed via mise
              companionOgOk = true;
              companionOgResult = {
                exists: false,
                skipped_missing_tool: true,
                src: panel.resolved_companion_og.src
              };
            } else {
              companionOgOk = false;
              companionOgResult = { exists: false, src: panel.resolved_companion_og.src };
            }
          } else {
            const bytes = fs.statSync(absOgPath).size;
            const maxBytes = panel.resolved_companion_og.max_bytes || OG_MAX_BYTES_DEFAULT;
            const expW = panel.resolved_companion_og.width || 1280;
            const expH = panel.resolved_companion_og.height || 640;
            let dimsOk = true;
            let ogInfo = null;
            if (verifyImages && magickCaps.available) {
              ogInfo = inspectImageWithMagick(absOgPath, false);
              dimsOk = ogInfo.ok && ogInfo.width === expW && ogInfo.height === expH;
            }
            companionOgOk = bytes > 0 && bytes < maxBytes && dimsOk;
            companionOgResult = {
              exists: true,
              src: panel.resolved_companion_og.src,
              bytes,
              under_cap: bytes < maxBytes,
              dimensions_ok: dimsOk,
              identify: ogInfo
            };
          }
        }

        const passed = placementCheck.embedded && placementCheck.placement_ok && fileExists && imageOk && companionOgOk;
        if (!passed && panel.required !== false) {
          totalFailures += 1;
        }

        panelResults.push({
          rule_id: rule.id,
          panel_id: panel.id,
          type: panel.type,
          src: panel.resolved_src,
          passed,
          embedded: placementCheck.embedded,
          placement_ok: placementCheck.placement_ok,
          placement_note: placementCheck.reason,
          file_exists: fileExists,
          image_verify: imageVerify,
          companion_og: companionOgResult
        });
      }
    }

    fileReports.push({
      file: relFile,
      namespace: styleResolution.namespace,
      style_docs: styleResolution.effective.style_docs,
      rules_matched: rules.map((r) => r.id),
      panels: panelResults
    });
  }

  const pendingDrafts = listPendingDrafts(repoRoot);

  return {
    workspace_root: config.workspace_root,
    magick_available: magickCaps.available,
    files_checked: fileReports.length,
    panels_checked: totalPanelsChecked,
    pending_draft_proposals: pendingDrafts.length,
    failures: totalFailures,
    passed: totalFailures === 0,
    reports: fileReports
  };
}

// ─── Markdown Panel Insertion (--apply) ────────────────────────────────────

function formatPanelEmbed(panel) {
  if (panel.embed_style === 'html-center-tribute') {
    const w = panel.width || 260;
    return [
      '<p align="center">',
      `  <img src="${panel.resolved_src}" alt="${panel.resolved_alt}" width="${w}">`,
      '</p>'
    ].join('\n');
  }
  if (panel.embed_style === 'html-float-left' || panel.embed_style === 'html-float-right') {
    const align = panel.embed_style === 'html-float-left' ? 'left' : 'right';
    const w = panel.width || 220;
    return `<img src="${panel.resolved_src}" align="${align}" width="${w}" alt="${panel.resolved_alt}">`;
  }
  if (panel.resolved_title) {
    return `![${panel.resolved_alt}](${panel.resolved_src} "${panel.resolved_title}")`;
  }
  return `![${panel.resolved_alt}](${panel.resolved_src})`;
}

export function applyPanelsToFile(repoRoot, config, relFile) {
  const normRel = toPosixRel(repoRoot, relFile);
  const absFile = path.join(repoRoot, normRel);
  const rawText = safeReadText(absFile);
  if (rawText === null) {
    throw new Error(`Target file does not exist: ${absFile}`);
  }

  const rules = resolveRulesForFile(repoRoot, config, normRel);
  const eol = rawText.includes('\r\n') ? '\r\n' : '\n';
  let lines = rawText.split(/\r?\n/);
  const applied = [];

  for (const rule of rules) {
    for (const panel of rule.panels) {
      const currentText = lines.join('\n');
      const check = checkMarkdownPlacement(currentText, panel);
      if (check.embedded && check.placement_ok) continue;

      const embedLine = formatPanelEmbed(panel);

      if (panel.placement === 'after-h1') {
        const h1Idx = lines.findIndex((l) => /^#\s+\S/.test(l));
        if (h1Idx >= 0) {
          lines.splice(h1Idx + 1, 0, '', embedLine);
          applied.push(panel.id);
        }
        continue;
      }

      if (panel.section_heading) {
        const secIdx = lines.findIndex((l) => l.trim().toLowerCase() === panel.section_heading.trim().toLowerCase());
        if (secIdx < 0) continue;

        let nextSecIdx = lines.length;
        for (let i = secIdx + 1; i < lines.length; i += 1) {
          if (/^##\s+\S/.test(lines[i])) {
            nextSecIdx = i;
            break;
          }
        }

        if (panel.placement === 'after-heading') {
          lines.splice(secIdx + 1, 0, '', embedLine);
          applied.push(panel.id);
        } else if (panel.placement === 'after-table-in-section') {
          let tableEnd = -1;
          let inTable = false;
          for (let i = secIdx + 1; i < nextSecIdx; i += 1) {
            if (lines[i].trim().startsWith('|')) {
              inTable = true;
              tableEnd = i;
            } else if (inTable && lines[i].trim() === '') {
              break;
            }
          }
          const insertIdx = tableEnd >= 0 ? tableEnd + 1 : secIdx + 1;
          lines.splice(insertIdx, 0, '', embedLine);
          applied.push(panel.id);
        } else if (panel.placement === 'after-bullet-matching' && panel.bullet_match) {
          let bulletIdx = -1;
          for (let i = secIdx + 1; i < nextSecIdx; i += 1) {
            if (lines[i].includes(panel.bullet_match)) {
              bulletIdx = i;
              break;
            }
          }
          if (bulletIdx >= 0) {
            lines.splice(bulletIdx + 1, 0, '', embedLine);
            applied.push(panel.id);
          }
        } else if (panel.placement === 'end-of-section') {
          let insertIdx = nextSecIdx;
          while (insertIdx > secIdx + 1 && lines[insertIdx - 1].trim() === '') {
            insertIdx -= 1;
          }
          lines.splice(insertIdx, 0, '', embedLine);
          applied.push(panel.id);
        }
      }
    }
  }

  if (applied.length > 0) {
    const updated = lines.join(eol);
    if (!atomicWrite(absFile, updated)) {
      throw new Error(`Failed atomicWrite on ${absFile}`);
    }
  }

  return { file: normRel, applied };
}

// ─── End-User Repository Scaffolder (--init) ───────────────────────────────

export function initUserRepo(targetRepoDir, workspaceRootName) {
  const absRepo = path.resolve(targetRepoDir);
  const wsName = workspaceRootName || path.basename(absRepo);

  const cfgPath = path.join(absRepo, '.claude', 'readme-images.json');
  const styleDocRel = 'docs/readme-images/style-guides/default.md';
  const rulesDocRel = 'docs/readme-images/rules/readme-panels.md';

  const starterConfig = {
    version: 1,
    workspace_root: wsName,
    default_assets_dir: 'assets/images',
    draft_assets_dir: 'assets/drafts',
    draft_revision_policy: {
      protect_existing: true,
      approval_workflow_skills: [
        'critical-control-points',
        'inaudible-markup',
        'hidden-libel-check',
        'spank-dario'
      ],
      callout_target: 'user'
    },
    auto_og_social_image: {
      enabled: true,
      assets_subdir: 'assets/images',
      source_suffix: '-banner',
      output_suffix: '-og-image.jpg',
      width: 1280,
      height: 640,
      quality: 92,
      max_bytes: 1048576,
      gravity: 'center'
    },
    style_guides: {
      [wsName]: {
        doc: styleDocRel,
        summary: `Root visual style guide for ${wsName}. Subdirectories inherit this guide and can override via ${wsName}:subdir:... keys.`,
        inherit: true,
        og_social_image: true,
        reference_images: [],
        palette: {
          primary: '#0B1F4A',
          accent: '#D4AF37'
        }
      }
    },
    rules: [
      {
        id: 'root-readme-top-panel',
        description: 'Root README.md top-level titled hero banner + automatic 1280x640 GitHub social preview.',
        glob: 'README.md',
        doc: rulesDocRel,
        panels: [
          {
            id: 'repo-hero-banner',
            type: 'top-level-panel',
            required: true,
            placement: 'after-h1',
            src_pattern: 'assets/images/{repo}-banner.jpg',
            alt_pattern: '{repo}',
            embed_style: 'markdown',
            dimensions: {
              aspect_ratio: '16:9',
              width: 1376,
              height: 768,
              format: 'JPEG'
            },
            companion_og_image: {
              enabled: true,
              src_pattern: 'assets/images/{repo}-og-image.jpg',
              width: 1280,
              height: 640,
              max_bytes: 1048576
            }
          }
        ]
      }
    ]
  };

  const starterStyleDoc = `# Visual Style Guide — \`${wsName}\`

- **Namespace**: \`${wsName}\`
- **Inheritance**: Child namespaces (\`${wsName}:packages:<name>\`, \`${wsName}:plugins:<name>\`) inherit this document unless \`"inherit": false\` is set in \`.claude/readme-images.json\`.

## 1. Visual Language & Palette
- Define your repository's visual style, linework, color palette, and anchor \`reference_images\` here.
- Render panel titles natively inside the scene without covering any character's face or head.
`;

  const starterRulesDoc = `# README Panel Rules — \`${wsName}\`

- **Top-Level Panels (\`top-level-panel\`)**: Placed immediately below \`# <Title>\` in \`README.md\` (\`assets/images/${wsName}-banner.jpg\`), with an automatic \`1280×640\` social preview (\`< 1 MB\`) at \`assets/images/${wsName}-og-image.jpg\` inside any directory using \`assets/images\`.
- **Section Sub-Panels (\`sub-panel\`)**: Placed under \`## Skills\`, \`## Features\`, or \`## Architecture\` sections as needed.
- **Oval Inset Windows (\`inset-oval\`)**: 4-channel RGBA PNGs (\`PNG32\`) with \`alpha == 0\` in all four exterior corners, built via \`--make-oval-inset\`.
- **Non-Destructive Draft Staging**: Existing files in \`assets/images/\` are never replaced directly; candidate revisions are staged in \`assets/drafts/\` and promoted via \`--promote-draft --approved-by\` after user approval.
`;

  if (!safeExists(cfgPath)) {
    atomicWrite(cfgPath, JSON.stringify(starterConfig, null, 2) + '\n');
  }
  const absStyleDoc = path.join(absRepo, styleDocRel);
  if (!safeExists(absStyleDoc)) {
    atomicWrite(absStyleDoc, starterStyleDoc);
  }
  const absRulesDoc = path.join(absRepo, rulesDocRel);
  if (!safeExists(absRulesDoc)) {
    atomicWrite(absRulesDoc, starterRulesDoc);
  }

  return {
    configPath: cfgPath,
    styleDoc: absStyleDoc,
    rulesDoc: absRulesDoc
  };
}

// ─── CLI Entrypoint ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(args.repo || process.cwd());
  const asJson = Boolean(args.json);

  if (args.init) {
    const targetDir = typeof args.init === 'string' ? args.init : repoRoot;
    const res = initUserRepo(targetDir, typeof args['workspace-root'] === 'string' ? args['workspace-root'] : undefined);
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else {
      process.stdout.write(`Initialized update-readme-images in ${targetDir}:\n  config: ${res.configPath}\n  style:  ${res.styleDoc}\n  rules:  ${res.rulesDoc}\n`);
    }
    return;
  }

  // Load config if available (optional for standalone --make-oval-inset)
  let loadedCfg = null;
  try {
    loadedCfg = loadConfig(repoRoot, typeof args.config === 'string' ? args.config : null);
  } catch (err) {
    if (!args['make-oval-inset']) throw err;
  }
  const config = loadedCfg ? loadedCfg.config : { workspace_root: path.basename(repoRoot) };
  const configPath = loadedCfg ? loadedCfg.configPath : null;

  if (args['make-oval-inset']) {
    const src = args['make-oval-inset'];
    const out = args._[0];
    if (!src || !out) {
      process.stderr.write('Usage: --make-oval-inset <src> <out.png> [--width 864] [--height 1013] [--outer-color "#0B1F4A"] [--inner-color "#D4AF37"] [--floodfill-corners] [--fuzz 12%]\n');
      process.exit(1);
    }
    const verify = buildOvalInsetImage(src, out, {
      width: args.width,
      height: args.height,
      outerColor: args['outer-color'],
      innerColor: args['inner-color'],
      floodfillCorners: Boolean(args['floodfill-corners']),
      fuzz: args.fuzz,
      repoRoot,
      config
    });
    if (asJson) {
      process.stdout.write(JSON.stringify(verify, null, 2) + '\n');
    } else if (verify.staged_as_draft) {
      process.stdout.write(
        `STAGED DRAFT (existing ${verify.target_preserved} preserved untouched):\n  draft:    ${verify.output}\n  callout:  ${verify.proposal.asynchronous_workflow.inaudible_callout}\n  promote:  ${verify.proposal.asynchronous_workflow.promote_command}\n`
      );
    } else {
      process.stdout.write(`ok   oval inset written to ${verify.output} (${verify.width}x${verify.height} ${verify.format} ${verify.channels}, corners_transparent=${verify.corners_transparent})\n`);
    }
    return;
  }

  if (args['stage-revision']) {
    const src = args['stage-revision'];
    const dest = args._[0];
    if (!src || !dest) {
      process.stderr.write('Usage: --stage-revision <candidate-src> <target-path> [--reason "..."]\n');
      process.exit(1);
    }
    const res = stageImageRevision(repoRoot, config, src, dest, typeof args.reason === 'string' ? args.reason : '');
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else if (res.staged_as_draft) {
      process.stdout.write(
        `STAGED DRAFT (existing ${res.target_path} preserved untouched):\n  draft:    ${res.draft_path}\n  manifest: ${res.proposal_json}\n  callout:  ${res.asynchronous_workflow.inaudible_callout}\n  promote:  ${res.asynchronous_workflow.promote_command}\n`
      );
    } else {
      process.stdout.write(`ok   created new image at ${res.target_path}\n`);
    }
    return;
  }

  if (args['list-drafts']) {
    const drafts = listPendingDrafts(repoRoot);
    if (asJson) {
      process.stdout.write(JSON.stringify({ count: drafts.length, drafts }, null, 2) + '\n');
    } else if (drafts.length === 0) {
      process.stdout.write('No pending image draft revisions.\n');
    } else {
      for (const d of drafts) {
        process.stdout.write(`- [${d.namespace}] ${d.draft_path} -> ${d.target_path} (id=${d.proposal_id})\n`);
      }
    }
    return;
  }

  if (args['promote-draft']) {
    try {
      const res = promoteDraftRevision(
        repoRoot,
        config,
        args['promote-draft'],
        typeof args['approved-by'] === 'string' ? args['approved-by'] : ''
      );
      if (asJson) {
        process.stdout.write(JSON.stringify(res, null, 2) + '\n');
      } else {
        process.stdout.write(`Promoted approved draft ${res.draft_path} -> ${res.target_path} (approved_by="${res.user_approval}")\n`);
      }
    } catch (err) {
      process.stderr.write(`[update-readme-images] ${err.message}\n`);
      process.exit(err.exitCode || 1);
    }
    return;
  }

  if (args['discard-draft']) {
    const res = discardDraftRevision(
      repoRoot,
      args['discard-draft'],
      typeof args.reason === 'string' ? args.reason : ''
    );
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else {
      process.stdout.write(`Discarded draft ${res.draft_path} (live ${res.target_path} untouched)\n`);
    }
    return;
  }

  if (args['sync-og-images']) {
    const res = syncOgSocialImages(repoRoot, config, { regenerate: Boolean(args.regenerate) });
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else if (res.status === 'skipped_missing_tool' || res.status === 'disabled') {
      process.stdout.write(`[og-social-image] ${res.status}: ${res.reason}\n`);
    } else {
      for (const r of res.results) {
        process.stdout.write(`  [${r.action}] ${r.og_image}${r.draft_path ? ` (draft: ${r.draft_path})` : ''}${r.bytes ? ` (${r.bytes} B)` : ''}\n`);
      }
      process.stdout.write(
        `sync-og-images: ${res.targets_discovered} dir(s), ${res.created} created, ${res.staged_drafts} staged as drafts, ${res.verified_existing} existing verified, ${res.failures} failed\n`
      );
    }
    process.exit(res.status === 'failed' ? 1 : 0);
  }

  if (args.resolve) {
    const targetRel = toPosixRel(repoRoot, args.resolve);
    const styleInfo = resolveStyleGuides(config, targetRel);
    const rulesInfo = resolveRulesForFile(repoRoot, config, targetRel);
    const payload = {
      config_path: configPath ? toPosixRel(repoRoot, configPath) : null,
      ...styleInfo,
      matched_rules: rulesInfo
    };
    if (asJson) {
      process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      process.stdout.write(`File:       ${payload.target_file}\n`);
      process.stdout.write(`Namespace:  ${payload.namespace}\n`);
      process.stdout.write(`Style docs: ${payload.effective.style_docs.join(' -> ') || '(none)'}\n`);
      process.stdout.write(`Ref images: ${payload.effective.reference_images.join(', ') || '(none)'}\n`);
      process.stdout.write(`Rules (${payload.matched_rules.length}):\n`);
      for (const r of payload.matched_rules) {
        process.stdout.write(`  - [${r.id}] glob=${JSON.stringify(r.glob)} doc=${r.doc}\n`);
        for (const p of r.panels) {
          process.stdout.write(`      panel: ${p.id} (${p.type}) placement=${p.placement}${p.section_heading ? ' @ ' + p.section_heading : ''} -> ${p.resolved_src}\n`);
        }
      }
    }
    return;
  }

  if (args.apply) {
    const res = applyPanelsToFile(repoRoot, config, args.apply);
    if (asJson) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else {
      process.stdout.write(`${res.file}: applied ${res.applied.length} panel(s) (${res.applied.join(', ') || 'already up to date'})\n`);
    }
    return;
  }

  if (args.audit !== undefined) {
    const filter = typeof args.audit === 'string' ? args.audit : null;
    const report = auditRepository(repoRoot, config, filter, Boolean(args['verify-images']));
    if (asJson) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
      for (const fileRep of report.reports) {
        for (const p of fileRep.panels) {
          const status = p.passed ? 'ok  ' : 'FAIL';
          process.stdout.write(`${status} ${fileRep.file} [${p.panel_id} / ${p.type}] -> ${p.src} (${p.placement_note})\n`);
        }
      }
      process.stdout.write(
        `${report.passed ? 'all passed' : `${report.failures} failed`} (${report.files_checked} files, ${report.panels_checked} panels checked, ${report.pending_draft_proposals} pending draft(s))\n`
      );
    }
    process.exit(report.passed ? 0 : 1);
  }

  process.stderr.write(
    'Usage: node update-readme-images.mjs <--resolve <file> | --audit [glob] [--verify-images] | --sync-og-images [--regenerate] | --apply <file> | --make-oval-inset <src> <out.png> | --stage-revision <src> <target> | --list-drafts | --promote-draft <draft> --approved-by "<approval>" | --discard-draft <draft> | --init [dir]>\n'
  );
  process.exit(1);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
