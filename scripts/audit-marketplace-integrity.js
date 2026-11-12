// Mechanical Marketplace Architecture, Release Continuity, & Anti-Context-Pollution Gate
//
// Verifies across gnomatix-oss-skills (or a target --root fixture):
// 1. Marketplace manifest consistency: every entry in .claude-plugin/marketplace.json resolves to a
//    self-contained plugin directory with matching .claude-plugin/plugin.json.
// 2. Released Plugin Continuity: every historically released plugin ID in RELEASED_MARKETPLACE_PLUGIN_IDS
//    remains present in .claude-plugin/marketplace.json so marketplace updates never orphan existing user installs.
// 3. Tier 0 Stand-Alone Installability: no plugin declares hard `dependencies` in .claude-plugin/plugin.json
//    that keep standalone installations disabled (unless explicitly listed in AUTHORIZED_HARD_DEPENDENCIES).
// 4. Zero-node_modules & Pure-Node Hook Portability: no committed node_modules/ under plugins/, and no
//    unapproved child_process imports inside plugins/*/hooks/*.js.
// 5. Canonical lib/ Synchronization: synced copies of lib/fs-safe.js and lib/gnox-discovery.js match root lib/.
// 6. gnox Router Synchronization: plugins/gnox/scripts/build-commands.js --check passes (when present).
// 7. Zero Git Symlinks (`no-git-symlinks`): zero mode-120000 Git symlink entries in the Git index and zero
//    filesystem symlinks/junctions anywhere in the repository tree (all tracked files are regular static blobs).
// 8. Native Marketplace Renames & Tag Coverage (`marketplace-renames-and-tags`): validates top-level
//    `renames` and `forceRemoveDeletedPlugins` in .claude-plugin/marketplace.json, prohibits bespoke
//    .claude-plugin/migrations.json files, and verifies across all `v*` Git release tags that every
//    historically shipped plugin either remains in `plugins` or is mapped in `marketplace.json#renames`.
// 9. VV.md Complementary Topology & Lifecycle Frontmatter Integrity: every `complements:` entry in
//    plugins/*/VV.md names a real marketplace plugin (never itself) and provides both `when_installed`
//    and `when_absent` behaviors; optional GNOMATIX release-gating fields (`authority`, `review_status`,
//    `approved_versions`) follow valid schema values.
// 10. Anti-Context-Pollution Scanner: blocks re-introduction of unauthorized isolationist disclaimers,
//     npm hooks/node_modules vendoring instructions, live sibling plugin names inside `ignore: [...]`
//     config examples, stale "not yet in this repository" notices on live plugins, and Claude-Code-only
//     siloing claims across READMEs and manifests.
//
// Usage:
//   node scripts/audit-marketplace-integrity.js [--root <dir>] [--json]

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { checkHostedSyncLimits } = require('./hosted-sync-limits.js');

const DEFAULT_ROOT = path.resolve(__dirname, '..');

// Explicit maintainer-reviewed exceptions only.
const AUTHORIZED_HARD_DEPENDENCIES = new Set([]);
const AUTHORIZED_HOOK_SUBPROCESS = new Set([
  'plugins/agent-darktriad-check/hooks/agent-darktriad-check.js',
  'plugins/all-help-no-harm/hooks/coordinator-launcher.js',
]);

// Union of every plugin ID ever published to the public gnomatix-oss-skills marketplace.
// Removing any released plugin ID breaks `claude plugin update` for existing user installations.
const RELEASED_MARKETPLACE_PLUGIN_IDS = [
  'agent-darktriad-check',
  'all-help-no-harm',
  'bear-loads',
  'citation-farm-audit',
  'critical-control-points',
  'cui-bono',
  'did-you-rtfm',
  'dont-be-hitler',
  'gnox',
  'goal-compliant-task-queue',
  'hidden-libel-check',
  'inaudible-markup',
  'informal-logic-check',
  'log-session',
  'og-social-image',
  'ontology-lookup',
  'open-and-honest-agent',
  'pony',
  'python-elimination-program',
  'satori',
  'skill-vv',
  'spank-dario',
  'staleness-guard',
  'steering-audit-suite',
  'update-readme-images',
  'word-lineage',
];

const VALID_REVIEW_STATUSES = new Set([
  'APPROVED',
  'PENDING',
  'REQUIRES_REVISION',
  'DRAFT',
]);

const SYNCED_LIB_TARGETS = [
  { src: 'lib/fs-safe.js', dest: 'plugins/gnox/hooks/lib/fs-safe.js' },
  { src: 'lib/gnox-discovery.js', dest: 'plugins/gnox/hooks/lib/gnox-discovery.js' },
  { src: 'lib/fs-safe.js', dest: 'plugins/skill-vv/lib/fs-safe.js' },
  { src: 'lib/gnox-discovery.js', dest: 'plugins/skill-vv/lib/gnox-discovery.js' },
];

function relPosix(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function stripJsComments(source) {
  return String(source || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function parseFrontmatterBlock(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text || '');
  return m ? m[1] : null;
}

// Pure-Node parser for GNOMATIX lifecycle frontmatter keys (`authority`, `review_status`,
// `status`, `approved_versions`) so both audit-marketplace-integrity.js and build-release-tree.js
// run in bare Node environments without requiring external YAML packages.
function parseLifecycleFrontmatter(frontmatter) {
  const out = {
    authority: null,
    reviewStatus: null,
    hasApprovedVersions: false,
    approvedVersions: [],
  };
  if (!frontmatter) return out;
  const lines = String(frontmatter).split(/\r?\n/);

  const unquote = (s) => {
    const t = String(s || '').replace(/\s+#.*$/, '').trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1).trim();
    }
    return t;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const authMatch = /^authority:\s*(.*)$/.exec(line);
    if (authMatch) {
      out.authority = unquote(authMatch[1]);
      continue;
    }
    const revMatch = /^(review_status|status):\s*(.*)$/.exec(line);
    if (revMatch) {
      const val = unquote(revMatch[2]);
      if (revMatch[1] === 'review_status' || out.reviewStatus === null) {
        out.reviewStatus = val;
      }
      continue;
    }
    const avMatch = /^approved_versions:\s*(.*)$/.exec(line);
    if (avMatch) {
      out.hasApprovedVersions = true;
      const raw = avMatch[1].replace(/\s+#.*$/, '').trim();
      if (raw === '[]' || raw === '~' || /^null$/i.test(raw) || /^none$/i.test(raw)) {
        out.approvedVersions = [];
      } else if (raw.startsWith('[') && raw.endsWith(']')) {
        out.approvedVersions = raw
          .slice(1, -1)
          .split(',')
          .map((x) => unquote(x))
          .filter((x) => x && !/^none$/i.test(x) && !/^null$/i.test(x));
      } else if (raw.length > 0) {
        const single = unquote(raw);
        out.approvedVersions = single && !/^none$/i.test(single) ? [single] : [];
      } else {
        const seq = [];
        while (i + 1 < lines.length) {
          const next = lines[i + 1];
          if (/^\s*$/.test(next) || /^\s*#/.test(next)) {
            i += 1;
            continue;
          }
          const itemMatch = /^\s+-\s*(.+)$/.exec(next);
          if (!itemMatch) break;
          i += 1;
          const v = unquote(itemMatch[1]);
          if (v && !/^none$/i.test(v) && !/^null$/i.test(v)) seq.push(v);
        }
        out.approvedVersions = seq;
      }
    }
  }
  return out;
}

// Pure-Node parser for the `complements:` YAML list in VV.md frontmatter so this
// gate runs in bare Node environments without requiring external YAML packages.
function extractVvComplements(frontmatter) {
  const lines = String(frontmatter || '').split(/\r?\n/);
  const items = [];
  let inComplements = false;
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!inComplements) {
      if (/^complements:\s*(\[\s*\])?\s*(#.*)?$/.test(line)) {
        if (/\[\s*\]/.test(line)) return [];
        inComplements = true;
      }
      continue;
    }
    if (/^[A-Za-z0-9_-]+:/.test(line)) {
      break;
    }
    const itemStart = /^\s*-\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (itemStart) {
      if (current) items.push(current);
      current = {};
      current[itemStart[1]] = itemStart[2].trim().replace(/^['"]|['"]$/g, '');
      continue;
    }
    const kv = /^(\s+)([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv && current) {
      const keyIndent = kv[1].length;
      let val = kv[3].trim();
      if (val === '>-' || val === '>' || val === '|' || val === '|-') {
        const blockLines = [];
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (/^\s*$/.test(nextLine)) {
            i += 1;
            continue;
          }
          const nextIndent = /^(\s*)/.exec(nextLine)[1].length;
          if (nextIndent <= keyIndent) break;
          i += 1;
          blockLines.push(nextLine.trim());
        }
        val = blockLines.join(' ');
      } else {
        val = val.replace(/^['"]|['"]$/g, '');
        const wrapped = [val];
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (/^\s*$/.test(nextLine)) break;
          const nextIndent = /^(\s*)/.exec(nextLine)[1].length;
          if (nextIndent <= keyIndent || /^\s*-\s+/.test(nextLine)) break;
          i += 1;
          wrapped.push(nextLine.trim());
        }
        val = wrapped.join(' ').trim();
      }
      current[kv[2]] = val;
    }
  }
  if (current) items.push(current);
  return items;
}

function walkForNodeModules(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') {
        found.push(full);
      } else if (!e.name.startsWith('.')) {
        walkForNodeModules(full, found);
      }
    }
  }
}

function walkForSymlinks(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === '.git' || e.name === '.beads' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    let lst = null;
    try {
      lst = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (lst.isSymbolicLink()) {
      found.push(full);
    } else if (lst.isDirectory()) {
      walkForSymlinks(full, found);
    }
  }
}

function auditMarketplace(repoRoot, opts) {
  const options = opts || {};
  const root = path.resolve(repoRoot || DEFAULT_ROOT);
  const skipPinned = new Set(options.skipPinnedPlugins || []);
  const findings = [];
  const checks = [];

  function recordCheck(id, ok, detail) {
    checks.push({ id, ok, detail });
  }
  function fail(rule, file, message) {
    findings.push({
      rule,
      file: file ? relPosix(root, file) : '.',
      message,
    });
  }

  // 1. Marketplace manifest & Tier 0 Stand-Alone check
  const mpPath = path.join(root, '.claude-plugin', 'marketplace.json');
  let mp = null;
  const pluginNames = new Set();
  const expectedSkills = [];
  const skillKeySet = new Set();

  if (!fs.existsSync(mpPath)) {
    fail('marketplace-manifest', mpPath, 'missing .claude-plugin/marketplace.json');
    recordCheck('marketplace-manifest', false, 'missing marketplace.json');
    return { ok: false, root, checks, findings };
  }

  try {
    mp = JSON.parse(fs.readFileSync(mpPath, 'utf8'));
  } catch (err) {
    fail('marketplace-manifest', mpPath, `invalid JSON: ${err.message}`);
    recordCheck('marketplace-manifest', false, 'invalid JSON');
    return { ok: false, root, checks, findings };
  }

  const beforeManifestFindings = findings.length;
  for (const entry of mp.plugins || []) {
    if (!entry || !entry.name || !entry.source) {
      fail('marketplace-manifest', mpPath, `invalid plugin entry: ${JSON.stringify(entry)}`);
      continue;
    }
    pluginNames.add(entry.name);
    const pluginDir = path.resolve(root, entry.source);
    const pjPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
    if (!fs.existsSync(pjPath)) {
      fail('marketplace-manifest', pjPath, `missing plugin.json for ${entry.name}`);
      continue;
    }
    let pj;
    try {
      pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
    } catch (err) {
      fail('marketplace-manifest', pjPath, `invalid JSON: ${err.message}`);
      continue;
    }
    if (pj.name !== entry.name) {
      fail('marketplace-manifest', pjPath, `plugin.json name "${pj.name}" does not match marketplace "${entry.name}"`);
    }

    // Tier 0 Stand-Alone check: prohibit hard dependencies in plugin.json
    const deps = pj.dependencies;
    const hasHardDeps =
      (Array.isArray(deps) && deps.length > 0) ||
      (deps && typeof deps === 'object' && !Array.isArray(deps) && Object.keys(deps).length > 0);
    if (hasHardDeps && !AUTHORIZED_HARD_DEPENDENCIES.has(entry.name)) {
      fail(
        'standalone-no-hard-dependencies',
        pjPath,
        `hard "dependencies" (${JSON.stringify(deps)}) keep "${entry.name}" disabled when installed stand-alone; declare optional complementary plugins in VV.md "complements:" and SKILL.md instead`
      );
    }

    // Collect skills in this plugin
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const sName of fs.readdirSync(skillsDir)) {
        const skillMd = path.join(skillsDir, sName, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          expectedSkills.push({ plugin: entry.name, skill: sName, skillMd });
          skillKeySet.add(`${entry.name}/${sName}`);
        }
      }
    }
  }
  recordCheck(
    'standalone-and-manifest',
    findings.length === beforeManifestFindings,
    `${pluginNames.size} plugin(s), ${expectedSkills.length} skill(s) checked`
  );

  // 1b. Released plugin continuity check (enforced automatically on gnomatix-oss-skills or when checkReleasedPlugins: true)
  const enforceReleasedContinuity =
    options.checkReleasedPlugins === true ||
    (options.checkReleasedPlugins !== false && mp && mp.name === 'gnomatix-oss-skills');
  if (enforceReleasedContinuity) {
    const requiredIds = Array.isArray(options.requiredPluginIds)
      ? options.requiredPluginIds
      : RELEASED_MARKETPLACE_PLUGIN_IDS;
    const beforeContinuity = findings.length;
    for (const reqId of requiredIds) {
      if (!pluginNames.has(reqId)) {
        fail(
          'released-plugin-removed',
          mpPath,
          `historically released plugin "${reqId}" is missing from .claude-plugin/marketplace.json; removing released plugins breaks existing Claude Code installations`
        );
      }
    }
    recordCheck(
      'released-plugin-continuity',
      findings.length === beforeContinuity,
      `${requiredIds.length} released plugin ID(s) verified`
    );
  }

  // 2. Zero node_modules inside plugins/
  const pluginsRoot = path.join(root, 'plugins');
  const foundNodeModules = [];
  if (fs.existsSync(pluginsRoot)) {
    walkForNodeModules(pluginsRoot, foundNodeModules);
  }
  for (const nm of foundNodeModules) {
    fail('zero-plugin-node-modules', nm, 'committed or vendored node_modules directory inside plugins/ is prohibited');
  }
  recordCheck('zero-plugin-node-modules', foundNodeModules.length === 0, `${foundNodeModules.length} node_modules dir(s)`);

  // 3. Hook portability: no unapproved child_process in plugins/*/hooks/*.js
  const beforeHooks = findings.length;
  if (fs.existsSync(pluginsRoot)) {
    for (const pName of fs.readdirSync(pluginsRoot)) {
      const hooksDir = path.join(pluginsRoot, pName, 'hooks');
      if (!fs.existsSync(hooksDir)) continue;
      const walkHooks = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          if (e.isSymbolicLink()) continue;
          const fp = path.join(d, e.name);
          if (e.isDirectory() && e.name !== 'bin' && e.name !== 'test' && e.name !== 'tests') walkHooks(fp);
          else if (
            e.isFile() &&
            (e.name.endsWith('.js') || e.name.endsWith('.mjs')) &&
            !e.name.endsWith('.test.js') &&
            !e.name.endsWith('.test.mjs')
          ) {
            const rel = relPosix(root, fp);
            if (AUTHORIZED_HOOK_SUBPROCESS.has(rel)) continue;
            const code = stripJsComments(fs.readFileSync(fp, 'utf8'));
            if (/\bchild_process\b/.test(code)) {
              fail('hook-portability-no-child-process', fp, 'unapproved child_process import in hook script');
            }
          }
        }
      };
      walkHooks(hooksDir);
    }
  }
  recordCheck('hook-portability-no-child-process', findings.length === beforeHooks, 'all hook scripts checked');

  // 4. Synced lib/ files match canonical root lib/ (when root lib/ exists)
  const libDir = path.join(root, 'lib');
  if (fs.existsSync(libDir) && options.checkSyncedLib !== false) {
    const beforeSync = findings.length;
    for (const item of SYNCED_LIB_TARGETS) {
      const destPlugin = item.dest.split('/')[1];
      if (skipPinned.has(destPlugin)) continue;
      const srcPath = path.join(root, item.src);
      const destPath = path.join(root, item.dest);
      if (!fs.existsSync(srcPath)) continue;
      const expected =
        `// GENERATED COPY — DO NOT EDIT DIRECTLY.\n` +
        `// Source: ${item.src} (sync with: node scripts/sync-lib.js)\n\n` +
        fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
      const actual = fs.existsSync(destPath)
        ? fs.readFileSync(destPath, 'utf8').replace(/\r\n/g, '\n')
        : null;
      if (actual !== expected) {
        fail('synced-lib-up-to-date', destPath, `out of sync with ${item.src}; run: node scripts/sync-lib.js`);
      }
    }
    recordCheck('synced-lib-up-to-date', findings.length === beforeSync, `${SYNCED_LIB_TARGETS.length} synced file(s) checked`);
  }

  // 5. gnox router command synchronization (when build-commands.js exists)
  const gnoxBuild = path.join(root, 'plugins', 'gnox', 'scripts', 'build-commands.js');
  if (!skipPinned.has('gnox') && fs.existsSync(gnoxBuild) && options.checkGnoxRouter !== false) {
    const r = spawnSync(process.execPath, [gnoxBuild, '--check'], {
      cwd: root,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    if (r.status !== 0) {
      fail(
        'gnox-router-in-sync',
        gnoxBuild,
        `gnox command stubs out of sync: ${(r.stderr || r.stdout || '').trim()}`
      );
    }
    recordCheck('gnox-router-in-sync', r.status === 0, (r.stdout || '').trim() || 'checked');
  }

  // 6. Zero Git symlinks & zero filesystem symlinks (`no-git-symlinks`)
  if (options.checkNoSymlinks !== false) {
    const beforeSymlinks = findings.length;
    const fsSymlinks = [];
    walkForSymlinks(root, fsSymlinks);
    for (const sym of fsSymlinks) {
      fail(
        'no-git-symlinks',
        sym,
        'filesystem symlink/junction is prohibited in repository; commit regular static files (100644/100755) instead'
      );
    }
    if (fs.existsSync(path.join(root, '.git')) && options.checkGitIndexSymlinks !== false) {
      const rLs = spawnSync('git', ['-C', root, 'ls-files', '-s', '-z'], {
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      });
      if (rLs.status === 0 && rLs.stdout) {
        const entries = rLs.stdout.split('\0').filter(Boolean);
        for (const line of entries) {
          const m = /^120000\s+[0-9a-f]{40}\s+\d+\t(.+)$/.exec(line);
          if (m) {
            fail(
              'no-git-symlinks',
              path.join(root, ...m[1].split('/')),
              `mode-120000 Git symlink "${m[1]}" is prohibited (breaks Windows core.symlinks=false checkouts)`
            );
          }
        }
      }
    }
    recordCheck(
      'no-git-symlinks',
      findings.length === beforeSymlinks,
      findings.length === beforeSymlinks ? '0 symlinks in working tree and Git index' : 'symlinks detected'
    );
  }

  // 6b. Native Claude Code marketplace.json `renames` + `forceRemoveDeletedPlugins` & Git release-tag coverage
  const legacyMigPath = path.join(root, '.claude-plugin', 'migrations.json');
  const enforceRenames =
    options.checkMigrations !== false && Boolean(mp);
  if (enforceRenames) {
    const beforeMig = findings.length;
    if (fs.existsSync(legacyMigPath)) {
      fail(
        'marketplace-renames-and-tags',
        legacyMigPath,
        'bespoke .claude-plugin/migrations.json is prohibited; declare native top-level "renames" and "forceRemoveDeletedPlugins" in .claude-plugin/marketplace.json'
      );
    }
    if (mp.name === 'gnomatix-oss-skills') {
      if (mp.forceRemoveDeletedPlugins !== true) {
        fail(
          'marketplace-renames-and-tags',
          mpPath,
          'expected top-level "forceRemoveDeletedPlugins": true in .claude-plugin/marketplace.json'
        );
      }
      if (!mp.renames || typeof mp.renames !== 'object' || Array.isArray(mp.renames)) {
        fail(
          'marketplace-renames-and-tags',
          mpPath,
          'missing top-level "renames" object in .claude-plugin/marketplace.json'
        );
      }
      const rootVersionPath = path.join(root, 'VERSION');
      if (fs.existsSync(rootVersionPath)) {
        const expectedMarketVersion = fs.readFileSync(rootVersionPath, 'utf8').trim();
        if (expectedMarketVersion && mp.version !== expectedMarketVersion) {
          fail(
            'marketplace-renames-and-tags',
            mpPath,
            `expected top-level "version": "${expectedMarketVersion}" in .claude-plugin/marketplace.json to match VERSION (got ${JSON.stringify(mp.version)})`
          );
        }
      }
    }

    const renamesMap = mp.renames && typeof mp.renames === 'object' && !Array.isArray(mp.renames) ? mp.renames : {};
    if (mp.renames !== undefined && (typeof mp.renames !== 'object' || mp.renames === null || Array.isArray(mp.renames))) {
      fail('marketplace-renames-and-tags', mpPath, '"renames" in marketplace.json must be a JSON object');
    }

    for (const [fromName, rawTarget] of Object.entries(renamesMap)) {
      if (rawTarget !== null && (typeof rawTarget !== 'string' || !rawTarget.trim())) {
        fail(
          'marketplace-renames-and-tags',
          mpPath,
          `renames.${fromName}: target must be a plugin name string or null, got ${JSON.stringify(rawTarget)}`
        );
        continue;
      }
      let cur = rawTarget;
      const seen = new Set([fromName]);
      let cyclic = false;
      while (typeof cur === 'string' && Object.prototype.hasOwnProperty.call(renamesMap, cur)) {
        if (seen.has(cur)) {
          fail('marketplace-renames-and-tags', mpPath, `renames.${fromName}: rename chain contains a cycle at "${cur}"`);
          cyclic = true;
          break;
        }
        seen.add(cur);
        cur = renamesMap[cur];
      }
      if (!cyclic && cur !== null && !pluginNames.has(cur)) {
        fail(
          'marketplace-renames-and-tags',
          mpPath,
          `renames.${fromName}: chain target "${cur}" does not resolve to null or an entry in marketplace.json#plugins`
        );
      }
    }

    if (fs.existsSync(path.join(root, '.git')) && options.checkTagCoverage !== false) {
      const rTags = spawnSync('git', ['-C', root, 'tag', '-l', 'v*'], {
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      });
      if (rTags.status === 0 && rTags.stdout) {
        const tags = rTags.stdout.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
        const seenMissingPlugins = new Set();
        for (const tag of tags) {
          const rTree = spawnSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', tag, '--', 'plugins/'], {
            encoding: 'utf8',
            shell: false,
            windowsHide: true,
            maxBuffer: 20 * 1024 * 1024,
          });
          if (rTree.status !== 0 || !rTree.stdout) continue;
          for (const p of rTree.stdout.split(/\r?\n/)) {
            const pm = /^plugins\/([^/]+)\/\.claude-plugin\/plugin\.json$/.exec(p);
            if (pm) {
              const oldPlugin = pm[1];
              if (
                !pluginNames.has(oldPlugin) &&
                !Object.prototype.hasOwnProperty.call(renamesMap, oldPlugin) &&
                !seenMissingPlugins.has(oldPlugin)
              ) {
                seenMissingPlugins.add(oldPlugin);
                fail(
                  'marketplace-renames-and-tags',
                  mpPath,
                  `plugin "${oldPlugin}" shipped in tag ${tag} is absent from marketplace.json#plugins without an entry in marketplace.json#renames`
                );
              }
            }
          }
        }
      }
    }

    recordCheck(
      'marketplace-renames-and-tags',
      findings.length === beforeMig,
      findings.length === beforeMig ? 'marketplace.json renames and release-tag coverage verified' : 'marketplace renames coverage issues found'
    );
  }

  // 7. VV.md `complements:` & GNOMATIX lifecycle frontmatter integrity
  const beforeVv = findings.length;
  if (fs.existsSync(pluginsRoot)) {
    for (const pName of fs.readdirSync(pluginsRoot)) {
      if (skipPinned.has(pName)) continue;
      const vvPath = path.join(pluginsRoot, pName, 'VV.md');
      if (!fs.existsSync(vvPath)) continue;
      const text = fs.readFileSync(vvPath, 'utf8');
      const fm = parseFrontmatterBlock(text);
      if (!fm) {
        fail('vv-complements-valid', vvPath, 'missing YAML frontmatter in VV.md');
        continue;
      }
      const lifecycle = parseLifecycleFrontmatter(fm);
      if (lifecycle.reviewStatus !== null && !VALID_REVIEW_STATUSES.has(lifecycle.reviewStatus.toUpperCase())) {
        fail(
          'vv-lifecycle-frontmatter-valid',
          vvPath,
          `invalid review_status "${lifecycle.reviewStatus}" (expected APPROVED, PENDING, REQUIRES_REVISION, or DRAFT)`
        );
      }
      if (lifecycle.authority !== null && !lifecycle.authority.trim()) {
        fail('vv-lifecycle-frontmatter-valid', vvPath, 'authority in VV.md frontmatter cannot be empty');
      }
      const comps = extractVvComplements(fm);
      for (const c of comps) {
        if (!c.plugin) {
          fail('vv-complements-valid', vvPath, 'complements entry missing "plugin" key');
          continue;
        }
        if (c.plugin === pName) {
          fail('vv-complements-valid', vvPath, `plugin "${pName}" lists itself in complements`);
        }
        if (!pluginNames.has(c.plugin)) {
          fail('vv-complements-valid', vvPath, `complements target "${c.plugin}" is not a plugin in marketplace.json`);
        }
        if (!c.when_installed || !c.when_absent) {
          fail('vv-complements-valid', vvPath, `complements target "${c.plugin}" must specify both when_installed and when_absent`);
        }
      }
    }
  }
  recordCheck('vv-complements-valid', findings.length === beforeVv, 'VV.md complements and lifecycle frontmatter checked');

  // 7b. Hosted-sync limits (description lengths, angle brackets, top-level bin/, stray skill.md)
  if (options.checkHostedSyncLimits !== false) {
    const beforeHosted = findings.length;
    const hostedPlugins = [];
    for (const entry of mp.plugins || []) {
      if (!entry || !entry.name || !entry.source || skipPinned.has(entry.name)) continue;
      hostedPlugins.push({
        name: entry.name,
        dir: path.resolve(root, entry.source),
        marketplaceFile: mpPath,
        marketplaceDescription: entry.description,
      });
    }
    for (const problem of checkHostedSyncLimits(hostedPlugins)) {
      fail('hosted-sync-limits', problem.file, problem.message);
    }
    recordCheck('hosted-sync-limits', findings.length === beforeHosted, `${hostedPlugins.length} plugin(s) checked`);
  }

  // 8. Anti-context-pollution scan across steering, READMEs, hooks/README.md, platforms/*/README.md, VV.md, and SKILL.md
  const docsToScan = [];
  for (const topDoc of ['CLAUDE.md', 'AGENTS.md', 'README.md', '.claude-plugin/marketplace.json']) {
    const fp = path.join(root, ...topDoc.split('/'));
    if (fs.existsSync(fp)) docsToScan.push(fp);
  }
  if (fs.existsSync(pluginsRoot)) {
    for (const pName of fs.readdirSync(pluginsRoot)) {
      if (skipPinned.has(pName)) continue;
      const pDir = path.join(pluginsRoot, pName);
      for (const f of ['README.md', 'CLAUDE.md', 'AGENTS.md', 'VV.md']) {
        const fp = path.join(pDir, f);
        if (fs.existsSync(fp)) docsToScan.push(fp);
      }
      const hooksReadme = path.join(pDir, 'hooks', 'README.md');
      if (fs.existsSync(hooksReadme)) docsToScan.push(hooksReadme);
      const platformsDir = path.join(pDir, 'platforms');
      if (fs.existsSync(platformsDir)) {
        for (const plat of fs.readdirSync(platformsDir)) {
          const platReadme = path.join(platformsDir, plat, 'README.md');
          if (fs.existsSync(platReadme)) docsToScan.push(platReadme);
        }
      }
      const libVv = path.join(pDir, 'lib', 'vv.js');
      if (fs.existsSync(libVv)) docsToScan.push(libVv);
    }
  }
  for (const s of expectedSkills) {
    if (!skipPinned.has(s.plugin)) docsToScan.push(s.skillMd);
  }

  const beforePollution = findings.length;
  for (const docPath of docsToScan) {
    const content = fs.readFileSync(docPath, 'utf8');
    const rel = relPosix(root, docPath);

    // 8a. Unauthorized isolationist escape hatches
    if (
      /^##\s+Per-plugin scope\b/im.test(content) ||
      /do not assume that any one plugin's directives apply across other plugins/i.test(content) ||
      /or that the plugins in this marketplace form a unified system/i.test(content)
    ) {
      fail('context-pollution-isolation-escape', docPath, 'unauthorized per-plugin isolation disclaimer detected');
    }

    // 8b. Contradictory npm node_modules vendoring directive
    if (
      /Vendor these into the plugin's `hooks\/node_modules\/`/i.test(content) ||
      /Commit the vendored `node_modules\/` to the repo/i.test(content)
    ) {
      fail('context-pollution-node-modules-vendoring', docPath, 'contradictory hooks/node_modules vendoring instruction detected');
    }

    // 8c. Live sibling plugin planted inside `ignore: [...]` config examples
    if (!rel.endsWith('.json')) {
      const ignoreRegex = /\bignore:\s*\[([^\]]+)\]/g;
      let m;
      while ((m = ignoreRegex.exec(content)) !== null) {
        const items = m[1]
          .split(',')
          .map((x) => x.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        for (const item of items) {
          if (pluginNames.has(item)) {
            fail(
              'context-pollution-sibling-ignore-example',
              docPath,
              `config example places live marketplace plugin "${item}" inside ignore: [...]`
            );
          }
        }
      }
    }

    // 8d. Stale "not yet in this repository" / "not in the repository when this skill was written" claims
    if (
      /is not yet in this repository/i.test(content) ||
      /was not in the repository when this skill was written/i.test(content)
    ) {
      fail(
        'context-pollution-stale-missing-companion',
        docPath,
        'stale claim that a companion skill/plugin is not in this repository'
      );
    }

    // 8e. Blanket Claude-Code-only siloing claims across READMEs and marketplace manifest
    if (rel === 'README.md' && /Hooks\b[^\n]*apply to Claude Code only/i.test(content)) {
      fail('context-pollution-false-hook-silo', docPath, 'false blanket claim that hooks apply to Claude Code only');
    }
    if (
      (rel === 'README.md' || rel.endsWith('/README.md')) &&
      (/^##\s+Hooks\s*\(Claude[- ]Code[- ]only\)/im.test(content) ||
        /\bThe hooks? (?:is|are) Claude[- ]Code[- ]only\b/i.test(content) ||
        /\bHooks are Claude[- ]Code[- ]specific\b/i.test(content))
    ) {
      fail('context-pollution-false-hook-silo', docPath, 'misleading Claude-Code-only hook heading/statement in README');
    }
    if (
      (rel === '.claude-plugin/marketplace.json' || rel === 'README.md' || rel === 'AGENTS.md') &&
      (/\bOpen-source skills and plugins for Claude Code\b/i.test(content) ||
        /\bClaude Code installs from it\b/i.test(content))
    ) {
      fail('context-pollution-claude-only-claim', docPath, 'Claude-Code-exclusive framing violates cross-vendor marketplace rules');
    }
  }
  recordCheck('anti-context-pollution-scan', findings.length === beforePollution, `${docsToScan.length} file(s) scanned`);

  return {
    ok: findings.length === 0,
    root,
    checks,
    findings,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let root = DEFAULT_ROOT;
  let json = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--root' && args[i + 1]) {
      root = args[i + 1];
      i += 1;
    } else if (args[i] === '--json') {
      json = true;
    }
  }

  const report = auditMarketplace(root);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const c of report.checks) {
      console.log(`${c.ok ? 'ok  ' : 'FAIL'} [${c.id}] ${c.detail}`);
    }
    if (!report.ok) {
      console.error(`\nmarketplace-integrity: ${report.findings.length} violation(s):`);
      for (const f of report.findings) {
        console.error(`  - [${f.rule}] ${f.file}: ${f.message}`);
      }
    } else {
      console.log('marketplace-integrity: all checks passed');
    }
  }
  process.exit(report.ok ? 0 : 1);
}

module.exports = {
  RELEASED_MARKETPLACE_PLUGIN_IDS,
  auditMarketplace,
  extractVvComplements,
  parseFrontmatterBlock,
  parseLifecycleFrontmatter,
};
