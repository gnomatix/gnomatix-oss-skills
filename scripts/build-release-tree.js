// GNOMATIX YAML-Frontmatter Release Tree Builder & Continuity Gate
//
// Invoked by scripts/release.sh when constructing a public GitHub snapshot from private Gitea main:
//   node scripts/build-release-tree.js --index <git-index-path> [--parent <public-release-commit>]
//
// Enforces the GNOMATIX Documentation Lifecycle frontmatter schema (`authority`, `review_status`,
// `approved_versions` across plugins/*/VV.md, README.md, skills/*/VV.md, skills/*/SKILL.md):
// 1. Any net-new plugin whose YAML frontmatter is unapproved (`review_status: PENDING | REQUIRES_REVISION | DRAFT`,
//    `authority: PENDING MANUAL REVIEW`, or `approved_versions` not matching plugin.json#version) and
//    that has never shipped in `--parent` is HELD BACK from the public GitHub release snapshot
//    (excluded from plugins/, .claude-plugin/marketplace.json, .VERSIONS.json, README.md,
//    lib/gnox-discovery.js, and plugins/gnox/commands/).
// 2. Any already-released plugin (`--parent` has plugins/<p>/) whose HEAD frontmatter is unapproved
//    is PINNED back to its exact last-approved tree from `--parent` (verifying `--parent`'s version
//    matches `approved_versions` when `approved_versions` is specified).
// 3. Strips any residual mode-120000 Git symlinks from the release index, hard-blocks any release
//    snapshot that drops ANY plugin present in `--parent` or in RELEASED_MARKETPLACE_PLUGIN_IDS,
//    runs `auditMarketplace` against the materialized snapshot, and runs `claude plugin validate`
//    (when `claude` is on PATH) before emitting the tree SHA.

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const {
  RELEASED_MARKETPLACE_PLUGIN_IDS,
  auditMarketplace,
  parseFrontmatterBlock,
  parseLifecycleFrontmatter,
} = require('./audit-marketplace-integrity.js');

const DEFAULT_ROOT = path.resolve(__dirname, '..');

const UNAPPROVED_STATUSES = new Set([
  'PENDING',
  'REQUIRES_REVISION',
  'DRAFT',
  'WIP',
  'IN_PROGRESS',
  'UNAPPROVED',
  'HOLD',
  'BLOCKED',
]);

function versionMatchesPattern(version, pattern) {
  const v = String(version || '').trim().replace(/^v/i, '');
  const p = String(pattern || '').trim().replace(/^v/i, '');
  if (!v || !p || /^none$/i.test(p) || /^null$/i.test(p)) return false;
  if (p === '*') return true;
  const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(v);
}

function evaluatePluginApproval({ pluginName, version, frontmatters }) {
  const reasons = [];
  let hasExplicitApprovedVersions = false;
  const approvedPatterns = [];

  for (const item of frontmatters || []) {
    const parsed = parseLifecycleFrontmatter(item.frontmatter);
    if (parsed.authority && /^pending\b/i.test(parsed.authority)) {
      reasons.push(`${item.file}: authority is "${parsed.authority}"`);
    }
    if (parsed.reviewStatus && UNAPPROVED_STATUSES.has(parsed.reviewStatus.toUpperCase())) {
      reasons.push(`${item.file}: review_status is "${parsed.reviewStatus}"`);
    }
    if (parsed.hasApprovedVersions) {
      hasExplicitApprovedVersions = true;
      for (const pat of parsed.approvedVersions) {
        if (!approvedPatterns.includes(pat)) approvedPatterns.push(pat);
      }
      if (!parsed.approvedVersions.some((pat) => versionMatchesPattern(version, pat))) {
        reasons.push(
          `${item.file}: version "${version}" is not in approved_versions ${JSON.stringify(parsed.approvedVersions)}`
        );
      }
    }
  }

  return {
    pluginName,
    version,
    approved: reasons.length === 0,
    reasons,
    hasExplicitApprovedVersions,
    approvedPatterns,
  };
}

function pruneGnoxDiscoverySource(sourceText, { allowedPlugins, allowedSkills }) {
  let out = String(sourceText || '').replace(/\r\n/g, '\n');

  out = out.replace(
    /(const KNOWN_MARKETPLACE_PLUGINS = \[\n)([\s\S]*?)(\n\];)/,
    (_m, head, body, tail) => {
      const kept = body
        .split('\n')
        .filter((line) => {
          const m = /^\s*'([^']+)',\s*$/.exec(line);
          return !m || allowedPlugins.has(m[1]);
        })
        .join('\n');
      return `${head}${kept}${tail}`;
    }
  );

  out = out.replace(
    /(const SKILL_TO_PLUGIN = \{\n)([\s\S]*?)(\n\};)/,
    (_m, head, body, tail) => {
      const kept = body
        .split('\n')
        .filter((line) => {
          const m = /^\s*'([^']+)':\s*'([^']+)',\s*$/.exec(line);
          if (!m) return true;
          return allowedPlugins.has(m[2]) && allowedSkills.has(m[1]);
        })
        .join('\n');
      return `${head}${kept}${tail}`;
    }
  );

  out = out.replace(
    /(const MARKETPLACE_COMPLEMENTS = \[\n)([\s\S]*?)(\n\];)/,
    (_m, head, body, tail) => {
      const blockRe = /  \{\n[\s\S]*?\n  \},?\n?/g;
      const keptBlocks = [];
      let bm;
      while ((bm = blockRe.exec(body)) !== null) {
        const block = bm[0];
        const srcMatch = /\bsource:\s*'([^']+)'/.exec(block);
        const tgtMatch = /\btarget:\s*'([^']+)'/.exec(block);
        const src = srcMatch ? srcMatch[1] : null;
        const tgt = tgtMatch ? tgtMatch[1] : null;
        if (src && !allowedPlugins.has(src)) continue;
        if (tgt && tgt !== '*' && !allowedPlugins.has(tgt)) continue;
        keptBlocks.push(block.trimEnd());
      }
      return `${head}${keptBlocks.join('\n')}${tail}`;
    }
  );

  return out;
}

function updateReadmeForRelease(readmeText, parentReadmeText, { excludedPlugins, pinnedPlugins, pinnedHasZeroSkills }) {
  let out = String(readmeText || '').replace(/\r\n/g, '\n');
  const parentNorm = parentReadmeText ? String(parentReadmeText).replace(/\r\n/g, '\n') : '';

  for (const p of excludedPlugins) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`^- \\[\`${escaped}\`\\]\\(plugins\\/${escaped}\\/\\):.*\\n`, 'gm'), '');
    out = out.replace(new RegExp(`\\[\`${escaped}\`\\]\\(plugins\\/${escaped}\\/[^)]*\\),\\s*`, 'g'), '');
    out = out.replace(new RegExp(`,\\s*(?:and\\s+)?\\[\`${escaped}\`\\]\\(plugins\\/${escaped}\\/[^)]*\\)`, 'g'), '');
    out = out.replace(new RegExp(`, ${escaped}(?=[.,\\n])`, 'g'), '');
    out = out.replace(new RegExp(`${escaped}, `, 'g'), '');
  }

  for (const p of pinnedPlugins.keys()) {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bulletRe = new RegExp(`^- \\[\`${escaped}\`\\]\\(plugins\\/${escaped}\\/\\):.*$`, 'm');
    const parentBullet = parentNorm ? bulletRe.exec(parentNorm) : null;
    if (parentBullet) {
      out = out.replace(bulletRe, parentBullet[0]);
    }
  }

  if (pinnedHasZeroSkills.has('satori') && !out.includes('(`satori` is hooks-only; every other plugin ships Agent Skills)')) {
    out = out.replace(
      'with zero lock-in to sibling plugins.',
      'with zero lock-in to sibling plugins (`satori` is hooks-only; every other plugin ships Agent Skills).'
    );
  }

  return out;
}

function findClaudeBinary(env) {
  const e = env || process.env;
  const dirs = String(e.PATH || e.Path || '').split(path.delimiter).filter(Boolean);
  const names = process.platform === 'win32' ? ['claude.exe', 'claude.cmd', 'claude'] : ['claude'];
  for (const d of dirs) {
    for (const n of names) {
      const candidate = path.join(d, n);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
      } catch { /* ignore */ }
    }
  }
  return null;
}

function buildReleaseTree(opts) {
  const options = opts || {};
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_ROOT);
  const indexPath = path.resolve(options.indexPath);
  const parentCommit = options.parentCommit ? String(options.parentCommit).trim() : '';
  const skipClaudeValidate = options.skipClaudeValidate === true;

  if (!indexPath || !fs.existsSync(indexPath)) {
    throw new Error(`build-release-tree: index file does not exist: ${indexPath}`);
  }

  const idxEnv = Object.assign({}, process.env, { GIT_INDEX_FILE: indexPath });
  const git = (args, extra = {}) =>
    execFileSync('git', args, Object.assign({ cwd: repoRoot, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }, extra));
  const gitIdx = (args, extra = {}) => git(args, Object.assign({ env: idxEnv }, extra));
  const tryGit = (args, extra = {}) => {
    try {
      return git(args, Object.assign({ stdio: ['pipe', 'pipe', 'ignore'] }, extra));
    } catch {
      return null;
    }
  };
  const tryGitIdx = (args, extra = {}) => tryGit(args, Object.assign({ env: idxEnv }, extra));

  const stageText = (relPosixPath, text, mode = '100644') => {
    const blob = git(['hash-object', '-w', '--stdin', `--path=${relPosixPath}`], { input: text }).trim();
    gitIdx(['update-index', '--add', '--cacheinfo', `${mode},${blob},${relPosixPath}`]);
    return blob;
  };

  // Strip any residual mode-120000 symlink entries from --index unconditionally
  const initialStageEntries = gitIdx(['ls-files', '-s', '-z']).split('\0').filter(Boolean);
  for (const entry of initialStageEntries) {
    const m = /^120000\s+[0-9a-f]{40}\s+\d+\t(.+)$/.exec(entry);
    if (m) {
      gitIdx(['rm', '-q', '--cached', '--ignore-unmatch', '--', m[1]]);
    }
  }

  // Load --parent marketplace metadata if --parent is supplied
  let parentMp = null;
  const parentPluginEntries = new Map();
  let parentReadme = null;
  let parentManifest = null;

  if (parentCommit) {
    const parentMpRaw = tryGit(['show', `${parentCommit}:.claude-plugin/marketplace.json`]);
    if (parentMpRaw) {
      parentMp = JSON.parse(parentMpRaw);
      for (const entry of parentMp.plugins || []) {
        if (entry && entry.name) parentPluginEntries.set(entry.name, entry);
      }
    }
    parentReadme = tryGit(['show', `${parentCommit}:README.md`]);
    const parentVersionsRaw = tryGit(['show', `${parentCommit}:.VERSIONS.json`]);
    if (parentVersionsRaw) {
      try { parentManifest = JSON.parse(parentVersionsRaw); } catch { parentManifest = null; }
    }
  }

  // Inspect all plugins currently staged in --index
  const allStagedPaths = gitIdx(['ls-files', '-z']).split('\0').filter(Boolean);
  const pluginDirs = new Set();
  for (const p of allStagedPaths) {
    const m = /^plugins\/([^/]+)\/\.claude-plugin\/plugin\.json$/.exec(p);
    if (m) pluginDirs.add(m[1]);
  }

  const excludedPlugins = new Set();
  const pinnedPlugins = new Map();
  const pinnedHasZeroSkills = new Set();

  for (const pName of Array.from(pluginDirs).sort()) {
    const pjRaw = tryGitIdx(['show', `:plugins/${pName}/.claude-plugin/plugin.json`]);
    if (!pjRaw) continue;
    const pj = JSON.parse(pjRaw);
    const mdPaths = allStagedPaths.filter(
      (fp) =>
        fp === `plugins/${pName}/VV.md` ||
        fp === `plugins/${pName}/README.md` ||
        (fp.startsWith(`plugins/${pName}/skills/`) && (fp.endsWith('/SKILL.md') || fp.endsWith('/VV.md'))) ||
        (fp.startsWith(`plugins/${pName}/commands/`) && fp.endsWith('.md'))
    );
    const frontmatters = [];
    for (const mdPath of mdPaths) {
      const mdText = tryGitIdx(['show', `:${mdPath}`]);
      const fm = parseFrontmatterBlock(mdText);
      if (fm) frontmatters.push({ file: mdPath, frontmatter: fm });
    }

    const decision = evaluatePluginApproval({
      pluginName: pName,
      version: pj.version,
      frontmatters,
    });

    if (decision.approved) continue;

    if (parentCommit && parentPluginEntries.has(pName)) {
      const parentPjRaw = tryGit(['show', `${parentCommit}:plugins/${pName}/.claude-plugin/plugin.json`]);
      if (!parentPjRaw) {
        throw new Error(`build-release-tree: parent ${parentCommit} lists "${pName}" in marketplace.json without plugins/${pName}/.claude-plugin/plugin.json`);
      }
      const parentPj = JSON.parse(parentPjRaw);
      if (
        decision.hasExplicitApprovedVersions &&
        !decision.approvedPatterns.some((pat) => versionMatchesPattern(parentPj.version, pat))
      ) {
        throw new Error(
          `build-release-tree: plugin "${pName}" HEAD (${pj.version}) is unapproved (${decision.reasons.join('; ')}) ` +
          `and parent version "${parentPj.version}" does not match approved_versions ${JSON.stringify(decision.approvedPatterns)}`
        );
      }
      pinnedPlugins.set(pName, { headVersion: pj.version, pinnedVersion: parentPj.version, reasons: decision.reasons });
    } else {
      const enforceContinuity =
        options.checkReleasedPlugins === true ||
        (options.checkReleasedPlugins !== false && RELEASED_MARKETPLACE_PLUGIN_IDS.includes(pName));
      if (enforceContinuity && RELEASED_MARKETPLACE_PLUGIN_IDS.includes(pName)) {
        throw new Error(
          `build-release-tree: historically released plugin "${pName}" cannot be excluded without a prior approved parent tree (${decision.reasons.join('; ')})`
        );
      }
      excludedPlugins.add(pName);
    }
  }

  // Apply exclusions and pins to --index
  if (excludedPlugins.size > 0 || pinnedPlugins.size > 0) {
    for (const pName of excludedPlugins) {
      gitIdx(['rm', '-r', '-q', '--cached', '--ignore-unmatch', '--', `plugins/${pName}`]);
      process.stderr.write(`release-gate: holding back unapproved plugin "${pName}" from public snapshot\n`);
    }

    for (const [pName, info] of pinnedPlugins.entries()) {
      gitIdx(['rm', '-r', '-q', '--cached', '--ignore-unmatch', '--', `plugins/${pName}`]);
      gitIdx(['read-tree', `--prefix=plugins/${pName}/`, `${parentCommit}:plugins/${pName}`]);
      const parentSkills = (tryGit(['ls-tree', '-r', '-z', parentCommit, '--', `plugins/${pName}/skills`]) || '')
        .split('\0')
        .filter((x) => /\/SKILL\.md$/.test(x));
      if (parentSkills.length === 0) pinnedHasZeroSkills.add(pName);
      process.stderr.write(
        `release-gate: pinning "${pName}" to approved release ${info.pinnedVersion} (holding back HEAD ${info.headVersion})\n`
      );
    }

    // Update .claude-plugin/marketplace.json
    const mpRaw = gitIdx(['show', ':.claude-plugin/marketplace.json']);
    const mp = JSON.parse(mpRaw);
    mp.plugins = (mp.plugins || [])
      .filter((entry) => entry && !excludedPlugins.has(entry.name))
      .map((entry) => (pinnedPlugins.has(entry.name) ? parentPluginEntries.get(entry.name) : entry));
    stageText('.claude-plugin/marketplace.json', JSON.stringify(mp, null, 2) + '\n');

    // Update README.md if present
    const readmeRaw = tryGitIdx(['show', ':README.md']);
    if (readmeRaw !== null) {
      const updatedReadme = updateReadmeForRelease(readmeRaw, parentReadme, {
        excludedPlugins,
        pinnedPlugins,
        pinnedHasZeroSkills,
      });
      stageText('README.md', updatedReadme);
    }

    // Update lib/gnox-discovery.js if present
    const gdRaw = tryGitIdx(['show', ':lib/gnox-discovery.js']);
    if (gdRaw !== null) {
      const postPaths = gitIdx(['ls-files', '-z']).split('\0').filter(Boolean);
      const allowedPlugins = new Set((mp.plugins || []).map((e) => e.name));
      const allowedSkills = new Set();
      for (const fp of postPaths) {
        const sm = /^plugins\/([^/]+)\/skills\/([^/]+)\/SKILL\.md$/.exec(fp);
        if (sm && allowedPlugins.has(sm[1])) allowedSkills.add(sm[2]);
      }
      const prunedGd = pruneGnoxDiscoverySource(gdRaw, { allowedPlugins, allowedSkills });
      stageText('lib/gnox-discovery.js', prunedGd);
    }

    // Update plugins/update-readme-images/config/readme-images.json if excluded plugins are present
    const riPath = 'plugins/update-readme-images/config/readme-images.json';
    const riRaw = tryGitIdx(['show', `:${riPath}`]);
    if (riRaw !== null && excludedPlugins.size > 0 && !pinnedPlugins.has('update-readme-images')) {
      try {
        const riObj = JSON.parse(riRaw);
        if (riObj && riObj.style_guides) {
          for (const pName of excludedPlugins) {
            delete riObj.style_guides[`gnomatix-oss-skills:plugins:${pName}`];
          }
        }
        stageText(riPath, JSON.stringify(riObj, null, 2) + '\n');
      } catch { /* ignore */ }
    }
  }

  // Materialize --index into a temporary directory to regenerate synced files, verify integrity,
  // and run `claude plugin validate` against the exact public snapshot!
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-release-snap-'));
  try {
    const prefixSlash = tmpDir.endsWith(path.sep) ? tmpDir : tmpDir + path.sep;
    gitIdx(['-c', 'core.symlinks=false', 'checkout-index', '-a', '-f', `--prefix=${prefixSlash}`]);

    // Regenerate synced lib copies and gnox router commands inside tmpDir ONLY when target plugins are not pinned
    const syncLibScript = path.join(tmpDir, 'scripts', 'sync-lib.js');
    if (fs.existsSync(syncLibScript) && (!pinnedPlugins.has('gnox') || !pinnedPlugins.has('skill-vv'))) {
      const rSync = spawnSync(process.execPath, [syncLibScript], {
        cwd: tmpDir,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      });
      if (rSync.status !== 0) {
        throw new Error(`build-release-tree: sync-lib.js failed:\n${rSync.stderr || rSync.stdout}`);
      }
      for (const relDest of [
        'plugins/gnox/hooks/lib/fs-safe.js',
        'plugins/gnox/hooks/lib/gnox-discovery.js',
        'plugins/skill-vv/lib/fs-safe.js',
        'plugins/skill-vv/lib/gnox-discovery.js',
      ]) {
        const destPlugin = relDest.split('/')[1];
        const diskFile = path.join(tmpDir, ...relDest.split('/'));
        if (pinnedPlugins.has(destPlugin)) {
          if (fs.existsSync(diskFile) && tryGitIdx(['show', ':' + relDest]) === null) {
            fs.unlinkSync(diskFile);
          }
          continue;
        }
        if (fs.existsSync(diskFile)) {
          stageText(relDest, fs.readFileSync(diskFile, 'utf8'));
        }
      }
    }

    const gnoxBuildScript = path.join(tmpDir, 'plugins', 'gnox', 'scripts', 'build-commands.js');
    if (!pinnedPlugins.has('gnox') && fs.existsSync(gnoxBuildScript)) {
      const rGnox = spawnSync(process.execPath, [gnoxBuildScript], {
        cwd: tmpDir,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      });
      if (rGnox.status !== 0) {
        throw new Error(`build-release-tree: gnox build-commands.js failed:\n${rGnox.stderr || rGnox.stdout}`);
      }
      // Sync plugins/gnox/commands/** back into --index
      const oldCmdEntries = gitIdx(['ls-files', '-z', '--', 'plugins/gnox/commands'])
        .split('\0')
        .filter(Boolean);
      const diskCmdFiles = new Map();
      const walkCmds = (dir, prefix) => {
        if (!fs.existsSync(dir)) return;
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, ent.name);
          const rel = `${prefix}/${ent.name}`;
          if (ent.isDirectory()) walkCmds(full, rel);
          else if (ent.isFile()) diskCmdFiles.set(rel, fs.readFileSync(full, 'utf8'));
        }
      };
      walkCmds(path.join(tmpDir, 'plugins', 'gnox', 'commands'), 'plugins/gnox/commands');

      for (const oldRel of oldCmdEntries) {
        if (!diskCmdFiles.has(oldRel)) {
          gitIdx(['rm', '-q', '--cached', '--ignore-unmatch', '--', oldRel]);
        }
      }
      for (const [relCmd, text] of diskCmdFiles.entries()) {
        stageText(relCmd, text);
      }
    }

    // Recompute .VERSIONS.json directly from --index so every released plugin's git_hash and
    // _marketplace.plugins_fingerprint match the public snapshot tree
    if (tryGitIdx(['show', ':.VERSIONS.json']) !== null || fs.existsSync(path.join(tmpDir, 'VERSION'))) {
      const releasedPjs = gitIdx(['ls-files', '-z', '--', ':(glob)plugins/*/.claude-plugin/plugin.json'])
        .split('\0')
        .filter(Boolean)
        .sort();
      const versionsMap = {};
      const newManifest = {};
      for (const pjRel of releasedPjs) {
        const relDir = pjRel.split('/').slice(0, 2).join('/');
        const pName = relDir.split('/')[1];
        const pj = JSON.parse(gitIdx(['show', `:${pjRel}`]));
        const subtreeHash = gitIdx(['write-tree', `--prefix=${relDir}/`]).trim();
        newManifest[pName] = { version: pj.version, git_hash: subtreeHash, path: relDir };
        versionsMap[pName] = pj.version;
      }
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify(versionsMap)).digest('hex');
      const curVersion = (tryGitIdx(['show', ':VERSION']) || '').trim() || '0.1.0';
      newManifest._marketplace = { version: curVersion, plugins_fingerprint: fingerprint };
      const manifestJson = JSON.stringify(newManifest, null, 2) + '\n';
      stageText('.VERSIONS.json', manifestJson);
      fs.writeFileSync(path.join(tmpDir, '.VERSIONS.json'), manifestJson, 'utf8');

      // If nothing in the public snapshot changed relative to --parent except VERSION / .VERSIONS.json,
      // preserve --parent's VERSION and .VERSIONS.json so release.sh recognizes a no-op release.
      if (
        parentCommit &&
        parentManifest &&
        parentManifest._marketplace &&
        parentManifest._marketplace.plugins_fingerprint === fingerprint
      ) {
        const diffAgainstParent = gitIdx(['diff-index', '--cached', '--name-only', parentCommit])
          .split(/\r?\n/)
          .filter(Boolean)
          .filter((f) => f !== 'VERSION' && f !== '.VERSIONS.json');
        if (diffAgainstParent.length === 0) {
          const parentVersionText = tryGit(['show', `${parentCommit}:VERSION`]);
          const parentManifestText = tryGit(['show', `${parentCommit}:.VERSIONS.json`]);
          if (parentVersionText !== null && parentManifestText !== null) {
            stageText('VERSION', parentVersionText);
            stageText('.VERSIONS.json', parentManifestText);
            fs.writeFileSync(path.join(tmpDir, 'VERSION'), parentVersionText, 'utf8');
            fs.writeFileSync(path.join(tmpDir, '.VERSIONS.json'), parentManifestText, 'utf8');
          }
        }
      }
    }

    // Gate 1: Verify zero plugins from --parent were removed in the release snapshot
    const finalMp = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude-plugin', 'marketplace.json'), 'utf8'));
    const finalPluginNames = new Set((finalMp.plugins || []).map((e) => e.name));
    for (const parentPluginName of parentPluginEntries.keys()) {
      if (!finalPluginNames.has(parentPluginName)) {
        throw new Error(
          `build-release-tree: release snapshot removed previously released plugin "${parentPluginName}" present in parent ${parentCommit}`
        );
      }
    }

    // Gate 2: Verify zero unapproved plugins remain in tmpDir
    for (const entry of finalMp.plugins || []) {
      const pDir = path.join(tmpDir, 'plugins', entry.name);
      const pj = JSON.parse(fs.readFileSync(path.join(pDir, '.claude-plugin', 'plugin.json'), 'utf8'));
      const fms = [];
      for (const candidate of [path.join(pDir, 'VV.md'), path.join(pDir, 'README.md')]) {
        if (fs.existsSync(candidate)) {
          const fm = parseFrontmatterBlock(fs.readFileSync(candidate, 'utf8'));
          if (fm) fms.push({ file: path.relative(tmpDir, candidate), frontmatter: fm });
        }
      }
      const checkApproval = evaluatePluginApproval({
        pluginName: entry.name,
        version: pj.version,
        frontmatters: fms,
      });
      if (!checkApproval.approved) {
        throw new Error(
          `build-release-tree: unapproved plugin "${entry.name}" leaked into release snapshot: ${checkApproval.reasons.join('; ')}`
        );
      }
    }

    // Gate 3: Run auditMarketplace against the materialized release snapshot
    const auditReport = auditMarketplace(tmpDir, {
      checkReleasedPlugins: options.checkReleasedPlugins,
      requiredPluginIds: options.requiredPluginIds,
      skipPinnedPlugins: Array.from(pinnedPlugins.keys()),
      checkTagCoverage: false,
    });
    if (!auditReport.ok) {
      const details = auditReport.findings.map((f) => `  - [${f.rule}] ${f.file}: ${f.message}`).join('\n');
      throw new Error(`build-release-tree: release snapshot failed marketplace integrity audit:\n${details}`);
    }

    // Gate 4: Run `claude plugin validate <tmpDir>` when available
    if (!skipClaudeValidate) {
      const claudeBin = findClaudeBinary(process.env);
      if (claudeBin) {
        const useCmd = process.platform === 'win32' && /\.(cmd|bat)$/i.test(claudeBin);
        const rVal = useCmd
          ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${claudeBin}" plugin validate "${tmpDir}"`], {
              cwd: tmpDir,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
              timeout: 45000,
              windowsHide: true,
            })
          : spawnSync(claudeBin, ['plugin', 'validate', tmpDir], {
              cwd: tmpDir,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
              timeout: 45000,
              shell: false,
              windowsHide: true,
            });
        if (rVal.status !== 0) {
          throw new Error(
            `build-release-tree: claude plugin validate failed on release snapshot (exit ${rVal.status}):\n${rVal.stdout || ''}\n${rVal.stderr || ''}`
          );
        }
      }
    }

    const treeSha = gitIdx(['write-tree']).trim();
    return {
      treeSha,
      excludedPlugins: Array.from(excludedPlugins),
      pinnedPlugins: Object.fromEntries(pinnedPlugins.entries()),
      releasedPluginCount: finalPluginNames.size,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch { /* best effort cleanup */ }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let indexPath = '';
  let parentCommit = '';
  let repoRoot = DEFAULT_ROOT;
  let skipClaudeValidate = false;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--index' && args[i + 1]) {
      indexPath = args[++i];
    } else if (args[i] === '--parent' && args[i + 1]) {
      parentCommit = args[++i];
    } else if (args[i] === '--repo' && args[i + 1]) {
      repoRoot = args[++i];
    } else if (args[i] === '--skip-claude-validate') {
      skipClaudeValidate = true;
    } else {
      process.stderr.write(`build-release-tree: unknown argument ${args[i]}\n`);
      process.exit(2);
    }
  }

  if (!indexPath) {
    process.stderr.write('usage: node scripts/build-release-tree.js --index <git-index-file> [--parent <commit>]\n');
    process.exit(2);
  }

  try {
    const res = buildReleaseTree({ repoRoot, indexPath, parentCommit, skipClaudeValidate });
    process.stdout.write(`${res.treeSha}\n`);
  } catch (err) {
    process.stderr.write(`${(err && err.message) || err}\n`);
    process.exit(1);
  }
}

module.exports = {
  versionMatchesPattern,
  evaluatePluginApproval,
  pruneGnoxDiscoverySource,
  buildReleaseTree,
};
