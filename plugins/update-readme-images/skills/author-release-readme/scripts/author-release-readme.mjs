#!/usr/bin/env node
// author-release-readme.mjs — Generate or update versioned release README notes
// (`docs/releases/v<VERSION>.md`) with real marketplace & per-plugin version diffs,
// cross-CLI update/migration instructions, and release-specific 16:9 PSA panel
// imagery managed through `update-readme-images.mjs`, plus GitHub Release rendering.
//
// Usage:
//   node author-release-readme.mjs [--version <X.Y.Z>] [--prev-tag <vX.Y.Z>] [--subtitle "..."] [--psa-noun "SYMLINKS"] [--repo <dir>] [--banner-src <path>] [--apply-images] [--render-github-body] [--publish-github-release] [--json]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

export function buildReleaseMarkdown({
  version,
  prevTag,
  subtitle,
  psaNoun,
  highlights,
  diffs,
  migrations
}) {
  const bannerRel = `../../assets/images/releases/release-v${version}-banner.jpg`;
  const lines = [
    `# Release v${version} — "${subtitle}"`,
    '',
    `![Release v${version} — ${subtitle}](${bannerRel})`,
    '',
    `Marketplace release **\`v${version}\`**${prevTag ? ` (since \`${prevTag}\`)` : ''} publishes **${diffs.total} standalone/complementary plugins** across Claude Code, OpenAI Codex, Antigravity CLI (\`agy\`), GitHub Copilot, VS Code, Cursor, OpenCode, and Kiro with zero Git symlinks (\`120000\`).`,
    '',
    '## Headline Changes',
    ''
  ];

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
    lines.push('## Rename & Consolidation Migrations (`.claude-plugin/migrations.json`)', '');
    for (const m of migrations) {
      lines.push(`- \`${m.from}\` → **\`${m.to}\`** (${m.kind || 'rename'}${m.introduced_in ? `, \`${m.introduced_in}\`` : ''})`);
    }
    lines.push('');
  }

  lines.push(
    '## Install, Update, & Migrate',
    '',
    '```sh',
    '# Claude Code marketplace:',
    '/plugin marketplace add github:gnomatix/gnomatix-oss-skills',
    '/plugin update',
    '/gnox:migrate',
    '',
    '# Cross-CLI static installer & state migrator (Codex, Antigravity agy, Copilot, Cursor, OpenCode, Kiro):',
    'node scripts/install-skills.js update --scope user',
    'node scripts/install-skills.js migrate --scope user',
    'node plugins/gnox/scripts/local-config-wizard.js doctor',
    '```',
    '',
    `# Just say NO to ${psaNoun}!`,
    '',
    '## ... Knowing is half the battle.',
    ''
  );

  return lines.join('\n');
}

export function renderGitHubReleaseBody(markdownText, tag, repoSlug = 'gnomatix/gnomatix-oss-skills') {
  const rawBase = `https://raw.githubusercontent.com/${repoSlug}/${tag}/`;
  return markdownText.replace(
    /!\[([^\]]*)\]\((?:\.\.\/)+assets\/images\/releases\/([^)]+)\)/g,
    (_, alt, file) => `![${alt}](${rawBase}assets/images/releases/${file})`
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
  const tag = `v${versionRaw}`;
  const prevTag = args['prev-tag'] || findPreviousReleaseTag(repoRoot, versionRaw);
  const subtitle = args.subtitle || 'static cross-CLI installer, style-locked panels, & local config doctor';
  const psaNoun = args['psa-noun'] || 'SYMLINKS';

  const diffs = collectPluginVersionDiffs(repoRoot, prevTag);
  const migJson = safeReadJson(path.join(repoRoot, '.claude-plugin', 'migrations.json')) || {};
  const migrations = [
    ...(migJson.plugin_migrations || []).map((m) => ({ from: m.from, to: m.to, kind: m.type || 'plugin', introduced_in: m.since })),
    ...(migJson.skill_migrations || []).map((m) => ({ from: `${m.from_plugin}:${m.from_skill}`, to: `${m.to_plugin}:${m.to_skill}`, kind: 'skill', introduced_in: m.since }))
  ];

  const defaultHighlights = [
    '**Zero Git Symlinks (`120000` → `100644` Static Files)**: Eliminated all repository symlinks so Windows (`core.symlinks=false`), macOS, and Linux checkouts behave identically.',
    '**Cross-CLI Static Installer & Tag-Aware State Migrator**: Added `scripts/install-skills.js`, `.claude-plugin/migrations.json`, and `/gnox:migrate` across Claude Code, Codex, Antigravity (`agy`), GitHub Copilot, VS Code, Cursor, OpenCode, and Kiro.',
    '**Style-Locked Main `README.md` Category Sub-Panels & Reference Resolution**: Regenerated all seven categorized plugin section panels strictly from the GNOMATIX visual style guide with project-specific reference-document priority and automatic `1280×640` (`< 1 MB`) OG social cards.',
    '**Non-LLM `/gnox:local-config-wizard` & `/gnox:doctor`**: Added Charmbracelet `huh`/`gum`-compatible declarative plugin wizard manifests (`gnox-wizard/v1`), Interactive Design Mode for external repositories, and `doctor`/`validate` sanity checks.'
  ];

  const bannerRelRepo = `assets/images/releases/release-v${versionRaw}-banner.jpg`;
  const bannerAbsRepo = path.join(repoRoot, ...bannerRelRepo.split('/'));
  if (typeof args['banner-src'] === 'string' && safeExists(args['banner-src'])) {
    fs.mkdirSync(path.dirname(bannerAbsRepo), { recursive: true });
    fs.copyFileSync(args['banner-src'], bannerAbsRepo);
  }

  const releaseDocRel = `docs/releases/v${versionRaw}.md`;
  const releaseDocAbs = path.join(repoRoot, ...releaseDocRel.split('/'));
  const md = buildReleaseMarkdown({
    version: versionRaw,
    prevTag,
    subtitle,
    psaNoun,
    highlights: defaultHighlights,
    diffs,
    migrations
  });
  const skipWrite = Boolean(args['publish-only'] || (args['publish-github-release'] && safeExists(releaseDocAbs) && !args.write));
  if (!skipWrite) {
    atomicWrite(releaseDocAbs, md);
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
    banner_path: bannerRelRepo,
    banner_exists: safeExists(bannerAbsRepo),
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
