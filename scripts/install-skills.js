// Cross-Platform Static Skill & Plugin Installer, Updater, and State Migrator
//
// Replaces non-portable Git mode-120000 symlink farms with deterministic static file copies
// (`100644` / `100755`) and tag-aware plugin/skill rename & consolidation state migration across:
//   - Claude Code (`~/.claude/plugins/installed_plugins.json`, `settings.json`, `.claude/skills/`)
//   - Antigravity CLI (`agy`) (`~/.gemini/config/plugins/`, `~/.gemini/skills/`, `.agents/skills/`)
//   - OpenAI Codex (`~/.codex/skills/`, `.agents/skills/`)
//   - GitHub Copilot & VS Code (`~/.copilot/skills/`, `.github/skills/`, `.agents/skills/`)
//   - Kiro (`~/.kiro/skills/`, `.kiro/skills/`)
//   - Cursor (`~/.cursor/skills/`, `.cursor/skills/`, `.agents/skills/`)
//   - OpenCode (`~/.config/opencode/skills/`, `.opencode/skills/`, `.agents/skills/`)
//
// Usage:
//   node scripts/install-skills.js [install|update|migrate|uninstall|status] [options]
//
// Options:
//   --scope <user|project>       Install/update scope (default: project if --project-dir given, else user)
//   --target <cli[,cli...]>      auto | all | agents | claude-code | claude-skills | antigravity |
//                                codex | copilot | kiro | cursor | opencode
//   --plugin <id[,id...]>        Limit install/uninstall to specific marketplace plugin ID(s)
//   --project-dir <dir>          Target project workspace directory (default: cwd when --scope project)
//   --home-dir <dir>             Override home directory (default: os.homedir())
//   --claude-dir <dir>           Override ~/.claude directory (default: <home>/.claude)
//   --repo-root <dir>            Override gnomatix-oss-skills repository root
//   --from-tag <vX.Y.Z>          Explicit prior release tag for git tag-diff rename/move detection
//   --to-tag <vX.Y.Z|HEAD>       Target release tag/ref for git tag-diff detection (default: HEAD)
//   --state-only                 Reconcile Claude Code JSON state directly without spawning `claude` CLI
//   --keep-bridges               Keep retained compatibility bridge plugins (e.g. citation-farm-audit) installed
//   --dry-run                    Report planned file and state changes without modifying disk
//   --json                       Emit structured JSON summary

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const { ensureDir, safeReadJson, atomicWrite } = require('../lib/fs-safe.js');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');
const STATE_FILENAME = '.gnox-install-state.json';
const MARKETPLACE_NAME = 'gnomatix-oss-skills';

function safeLstat(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function isBrokenOrRepoStub(entryPath) {
  const lst = safeLstat(entryPath);
  if (!lst) return false;
  if (lst.isSymbolicLink()) {
    try {
      const target = fs.readlinkSync(entryPath);
      if (target.includes('plugins/') || target.includes('plugins\\')) return true;
      return !fs.existsSync(entryPath);
    } catch {
      return true;
    }
  }
  if (lst.isFile() && lst.size > 0 && lst.size < 256) {
    try {
      const txt = fs.readFileSync(entryPath, 'utf8').trim();
      if (/^(\.\.\/)+plugins\/[a-z0-9-]+\/skills\/[a-z0-9-]+$/i.test(txt)) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

function removeEntrySafe(targetPath) {
  const lst = safeLstat(targetPath);
  if (!lst) return false;
  try {
    if (lst.isSymbolicLink() || lst.isFile()) {
      try {
        fs.unlinkSync(targetPath);
        return true;
      } catch {
        // Windows directory junctions report isSymbolicLink() === true and may require rmdirSync/rmSync
        fs.rmSync(targetPath, { recursive: true, force: true });
        return true;
      }
    }
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function hashDirectoryTree(dirPath) {
  const hash = crypto.createHash('sha256');
  const walk = (cur, relPrefix) => {
    const entries = fs.readdirSync(cur, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
    for (const ent of entries) {
      if (ent.name === STATE_FILENAME) continue;
      const full = path.join(cur, ent.name);
      const rel = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;
      const lst = safeLstat(full);
      if (!lst || lst.isSymbolicLink()) continue;
      if (lst.isDirectory()) {
        hash.update(`D:${rel}\n`);
        walk(full, rel);
      } else if (lst.isFile()) {
        hash.update(`F:${rel}:`);
        hash.update(fs.readFileSync(full));
        hash.update('\n');
      }
    }
  };
  walk(dirPath, '');
  return hash.digest('hex').slice(0, 16);
}

// Copies srcDir to destDir recursively as regular static files (zero symlinks),
// replacing any legacy symlink/junction or core.symlinks=false text stub and pruning
// stale files that were removed from srcDir.
function copyDirStatic(srcDir, destDir, opts) {
  const options = opts || {};
  const dryRun = options.dryRun === true;
  let filesWritten = 0;
  let filesRemoved = 0;

  const destStat = safeLstat(destDir);
  if (destStat && (destStat.isSymbolicLink() || destStat.isFile())) {
    if (!dryRun) removeEntrySafe(destDir);
  }

  if (!dryRun) ensureDir(destDir);

  const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  const wantedNames = new Set();

  for (const ent of srcEntries) {
    if (ent.name === '.git' || ent.name === 'node_modules') continue;
    const srcChild = path.join(srcDir, ent.name);
    const destChild = path.join(destDir, ent.name);
    const srcLst = safeLstat(srcChild);
    if (!srcLst) continue;

    // Resolve any symlink inside source to static file/dir content so zero symlinks are ever written
    let realStat = srcLst;
    if (srcLst.isSymbolicLink()) {
      try {
        realStat = fs.statSync(srcChild);
      } catch {
        continue;
      }
    }

    wantedNames.add(ent.name);

    if (realStat.isDirectory()) {
      const sub = copyDirStatic(srcChild, destChild, options);
      filesWritten += sub.filesWritten;
      filesRemoved += sub.filesRemoved;
    } else if (realStat.isFile()) {
      const destChildLst = safeLstat(destChild);
      const srcBuf = fs.readFileSync(srcChild);
      let same = false;
      if (destChildLst && destChildLst.isFile() && !destChildLst.isSymbolicLink() && destChildLst.size === srcBuf.length) {
        try {
          same = Buffer.compare(fs.readFileSync(destChild), srcBuf) === 0;
        } catch {
          same = false;
        }
      }
      if (!same) {
        if (!dryRun) {
          if (destChildLst && (destChildLst.isSymbolicLink() || destChildLst.isDirectory())) {
            removeEntrySafe(destChild);
          }
          ensureDir(path.dirname(destChild));
          const tmp = `${destChild}.tmp.${process.pid}.${Date.now()}`;
          fs.writeFileSync(tmp, srcBuf, { mode: realStat.mode });
          fs.renameSync(tmp, destChild);
        }
        filesWritten += 1;
      }
    }
  }

  if (destStat && destStat.isDirectory() && !destStat.isSymbolicLink()) {
    try {
      for (const existing of fs.readdirSync(destDir)) {
        if (existing === STATE_FILENAME) continue;
        if (!wantedNames.has(existing)) {
          if (!dryRun) removeEntrySafe(path.join(destDir, existing));
          filesRemoved += 1;
        }
      }
    } catch { /* ignore */ }
  }

  return { filesWritten, filesRemoved };
}

function readRepoReleaseVersion(repoRoot) {
  try {
    const vPath = path.join(repoRoot, 'VERSION');
    if (fs.existsSync(vPath)) {
      const v = fs.readFileSync(vPath, 'utf8').trim();
      if (v) return { version: v, releaseTag: v.startsWith('v') ? v : `v${v}` };
    }
  } catch { /* ignore */ }
  return { version: '0.0.0', releaseTag: 'v0.0.0' };
}

function loadMarketplaceCatalog(repoRoot) {
  const mpPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
  const mp = safeReadJson(mpPath);
  if (!mp || !Array.isArray(mp.plugins)) {
    throw new Error(`Invalid or missing marketplace manifest at ${mpPath}`);
  }
  const plugins = new Map();
  const skills = new Map();

  for (const entry of mp.plugins) {
    if (!entry || !entry.name || !entry.source) continue;
    const pluginDir = path.resolve(repoRoot, entry.source);
    const pj = safeReadJson(path.join(pluginDir, '.claude-plugin', 'plugin.json')) || {};
    if (!fs.existsSync(pluginDir)) continue;
    const pluginSkills = [];
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const sName of fs.readdirSync(skillsDir).sort()) {
        const sDir = path.join(skillsDir, sName);
        const skillMd = path.join(sDir, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          pluginSkills.push(sName);
          skills.set(sName, {
            skill: sName,
            plugin: entry.name,
            pluginVersion: pj.version || '0.1.0',
            skillDir: sDir,
          });
        }
      }
    }
    plugins.set(entry.name, {
      name: entry.name,
      version: pj.version || '0.1.0',
      description: entry.description || pj.description || '',
      pluginDir,
      skills: pluginSkills,
    });
  }

  return { marketplaceName: mp.name || MARKETPLACE_NAME, plugins, skills };
}

// Inspects git tag history (`git diff -M60% --name-status <fromTag>..<toTag> -- plugins/`)
// to automatically detect any renamed/moved plugin or skill between two release refs.
function detectTagMigrations(repoRoot, fromTag, toTag) {
  const detected = { pluginMigrations: [], skillMigrations: [] };
  if (!fromTag) return detected;
  const targetRef = toTag || 'HEAD';

  const runGit = (args) => {
    try {
      return execFileSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      });
    } catch {
      return null;
    }
  };

  if (!runGit(['rev-parse', '-q', '--verify', `${fromTag}^{commit}`])) return detected;
  if (!runGit(['rev-parse', '-q', '--verify', `${targetRef}^{commit}`])) return detected;

  const diffOut = runGit(['diff', '-M60%', '--name-status', `${fromTag}..${targetRef}`, '--', 'plugins/']);
  if (!diffOut) return detected;

  const deletedSkills = [];
  const addedSkills = [];
  const movedFromPlugins = new Map();

  for (const line of diffOut.split(/\r?\n/).filter(Boolean)) {
    const parts = line.split('\t');
    const status = parts[0] || '';
    if (status.startsWith('R') && parts.length >= 3) {
      const oldPath = parts[1];
      const newPath = parts[2];

      const pjOld = /^plugins\/([^/]+)\/\.claude-plugin\/plugin\.json$/.exec(oldPath);
      const pjNew = /^plugins\/([^/]+)\/\.claude-plugin\/plugin\.json$/.exec(newPath);
      if (pjOld && pjNew && pjOld[1] !== pjNew[1]) {
        detected.pluginMigrations.push({
          from: pjOld[1],
          to: pjNew[1],
          since: targetRef,
          reason: 'renamed',
          bridge_retained: fs.existsSync(path.join(repoRoot, 'plugins', pjOld[1], '.claude-plugin', 'plugin.json')),
        });
      }

      const skOld = /^plugins\/([^/]+)\/skills\/([^/]+)\/SKILL\.md$/.exec(oldPath);
      const skNew = /^plugins\/([^/]+)\/skills\/([^/]+)\/SKILL\.md$/.exec(newPath);
      if (skOld && skNew && (skOld[1] !== skNew[1] || skOld[2] !== skNew[2])) {
        detected.skillMigrations.push({
          from_plugin: skOld[1],
          from_skill: skOld[2],
          to_plugin: skNew[1],
          to_skill: skNew[2],
          since: targetRef,
          reason: skOld[2] !== skNew[2] ? 'renamed' : 'moved_plugin',
        });
        if (skOld[1] !== skNew[1]) {
          movedFromPlugins.set(skOld[1], skNew[1]);
        }
      }
    } else if (status === 'D' && parts[1]) {
      const skOld = /^plugins\/([^/]+)\/skills\/([^/]+)\/SKILL\.md$/.exec(parts[1]);
      if (skOld) deletedSkills.push({ plugin: skOld[1], skill: skOld[2] });
    } else if (status === 'A' && parts[1]) {
      const skNew = /^plugins\/([^/]+)\/skills\/([^/]+)\/SKILL\.md$/.exec(parts[1]);
      if (skNew) addedSkills.push({ plugin: skNew[1], skill: skNew[2] });
    }
  }

  // Catch same-named skills moved across plugins even if SKILL.md was simultaneously rewritten below -M60%
  for (const del of deletedSkills) {
    const matchAdd = addedSkills.find((a) => a.skill === del.skill && a.plugin !== del.plugin);
    if (matchAdd) {
      detected.skillMigrations.push({
        from_plugin: del.plugin,
        from_skill: del.skill,
        to_plugin: matchAdd.plugin,
        to_skill: matchAdd.skill,
        since: targetRef,
        reason: 'moved_plugin',
      });
      movedFromPlugins.set(del.plugin, matchAdd.plugin);
    }
  }

  // If a plugin lost all of its skills to another plugin (either removed or converted into a command-only bridge),
  // synthesize a plugin consolidation rule if not already present.
  for (const [oldPlugin, newPlugin] of movedFromPlugins.entries()) {
    const stillHasSkills = runGit(['ls-tree', '-r', '--name-only', targetRef, '--', `plugins/${oldPlugin}/skills`]);
    const hasSkillMd = Boolean(stillHasSkills && stillHasSkills.split(/\r?\n/).some((p) => p.endsWith('/SKILL.md')));
    if (!hasSkillMd && !detected.pluginMigrations.some((m) => m.from === oldPlugin)) {
      const stillInRepo = Boolean(
        runGit(['ls-tree', '--name-only', targetRef, '--', `plugins/${oldPlugin}/.claude-plugin/plugin.json`])
          ?.trim()
      );
      detected.pluginMigrations.push({
        from: oldPlugin,
        to: newPlugin,
        since: targetRef,
        reason: stillInRepo ? 'consolidated_into_parent' : 'renamed',
        bridge_retained: stillInRepo,
      });
    }
  }

  return detected;
}

function loadMigrations(repoRoot, opts) {
  const options = opts || {};
  const manifestPath = path.join(repoRoot, '.claude-plugin', 'migrations.json');
  const raw = safeReadJson(manifestPath) || { plugin_migrations: [], skill_migrations: [] };

  const pluginMap = new Map();
  for (const pm of raw.plugin_migrations || []) {
    if (pm && pm.from && pm.to) pluginMap.set(pm.from, Object.assign({}, pm));
  }

  const skillKey = (m) => `${m.from_plugin || '*'}:${m.from_skill}->${m.to_plugin}:${m.to_skill}`;
  const skillMap = new Map();
  for (const sm of raw.skill_migrations || []) {
    if (sm && sm.from_skill && sm.to_plugin && sm.to_skill) {
      skillMap.set(skillKey(sm), Object.assign({}, sm));
    }
  }

  if (options.fromTag) {
    const tagDetected = detectTagMigrations(repoRoot, options.fromTag, options.toTag || 'HEAD');
    for (const pm of tagDetected.pluginMigrations) {
      if (!pluginMap.has(pm.from)) pluginMap.set(pm.from, pm);
    }
    for (const sm of tagDetected.skillMigrations) {
      const k = skillKey(sm);
      if (!skillMap.has(k)) skillMap.set(k, sm);
    }
  }

  return {
    pluginMigrations: Array.from(pluginMap.values()),
    skillMigrations: Array.from(skillMap.values()),
  };
}

function resolveTargets(opts) {
  const scope = opts.scope;
  const homeDir = opts.homeDir;
  const projectDir = opts.projectDir;
  const rawTargets = (opts.targets && opts.targets.length ? opts.targets : ['auto'])
    .flatMap((t) => String(t).split(','))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const containers = [];
  const addSkillDir = (id, dirPath) => {
    if (!containers.some((c) => c.kind === 'skills' && path.resolve(c.dir) === path.resolve(dirPath))) {
      containers.push({ id, kind: 'skills', dir: path.resolve(dirPath) });
    }
  };
  const addPluginDir = (id, dirPath) => {
    if (!containers.some((c) => c.kind === 'plugins' && path.resolve(c.dir) === path.resolve(dirPath))) {
      containers.push({ id, kind: 'plugins', dir: path.resolve(dirPath) });
    }
  };

  let includeClaudeCode = false;

  for (const target of rawTargets) {
    if (scope === 'project') {
      if (!projectDir) throw new Error('--project-dir (or cwd) is required when --scope=project');
      if (target === 'auto') {
        addSkillDir('project:.agents/skills', path.join(projectDir, '.agents', 'skills'));
        for (const [rel, label] of [
          [['.github', 'skills'], 'project:.github/skills'],
          [['.kiro', 'skills'], 'project:.kiro/skills'],
          [['.cursor', 'skills'], 'project:.cursor/skills'],
          [['.opencode', 'skills'], 'project:.opencode/skills'],
          [['.gemini', 'skills'], 'project:.gemini/skills'],
          [['.claude', 'skills'], 'project:.claude/skills'],
        ]) {
          const cand = path.join(projectDir, ...rel);
          if (fs.existsSync(cand)) addSkillDir(label, cand);
        }
        includeClaudeCode = true;
      } else if (target === 'all') {
        addSkillDir('project:.agents/skills', path.join(projectDir, '.agents', 'skills'));
        addSkillDir('project:.github/skills', path.join(projectDir, '.github', 'skills'));
        addSkillDir('project:.kiro/skills', path.join(projectDir, '.kiro', 'skills'));
        includeClaudeCode = true;
      } else if (target === 'agents' || target === 'codex') {
        addSkillDir('project:.agents/skills', path.join(projectDir, '.agents', 'skills'));
      } else if (target === 'antigravity') {
        addSkillDir('project:.agents/skills', path.join(projectDir, '.agents', 'skills'));
      } else if (target === 'copilot' || target === 'github' || target === 'vscode') {
        addSkillDir('project:.github/skills', path.join(projectDir, '.github', 'skills'));
      } else if (target === 'kiro') {
        addSkillDir('project:.kiro/skills', path.join(projectDir, '.kiro', 'skills'));
      } else if (target === 'cursor') {
        addSkillDir('project:.cursor/skills', path.join(projectDir, '.cursor', 'skills'));
      } else if (target === 'opencode') {
        addSkillDir('project:.opencode/skills', path.join(projectDir, '.opencode', 'skills'));
      } else if (target === 'claude-skills') {
        addSkillDir('project:.claude/skills', path.join(projectDir, '.claude', 'skills'));
      } else if (target === 'claude-code') {
        includeClaudeCode = true;
      } else {
        throw new Error(`Unknown --target "${target}"`);
      }
    } else {
      if (!homeDir) throw new Error('Unable to resolve home directory for --scope=user');
      if (target === 'auto') {
        if (opts.onlyExisting) {
          for (const [cand, label, kind] of [
            [path.join(homeDir, '.agents', 'skills'), 'user:.agents/skills', 'skills'],
            [path.join(homeDir, '.codex', 'skills'), 'user:.codex/skills', 'skills'],
            [path.join(homeDir, '.kiro', 'skills'), 'user:.kiro/skills', 'skills'],
            [path.join(homeDir, '.copilot', 'skills'), 'user:.copilot/skills', 'skills'],
            [path.join(homeDir, '.cursor', 'skills'), 'user:.cursor/skills', 'skills'],
            [path.join(homeDir, '.config', 'opencode', 'skills'), 'user:.config/opencode/skills', 'skills'],
            [path.join(homeDir, '.gemini', 'skills'), 'user:.gemini/skills', 'skills'],
            [path.join(homeDir, '.claude', 'skills'), 'user:.claude/skills', 'skills'],
            [path.join(homeDir, '.gemini', 'config', 'plugins'), 'user:.gemini/config/plugins', 'plugins'],
          ]) {
            if (fs.existsSync(cand)) {
              if (kind === 'plugins') addPluginDir(label, cand);
              else addSkillDir(label, cand);
            }
          }
          if (projectDir) {
            for (const [rel, label] of [
              [['.agents', 'skills'], 'project:.agents/skills'],
              [['.github', 'skills'], 'project:.github/skills'],
              [['.kiro', 'skills'], 'project:.kiro/skills'],
              [['.cursor', 'skills'], 'project:.cursor/skills'],
              [['.opencode', 'skills'], 'project:.opencode/skills'],
              [['.gemini', 'skills'], 'project:.gemini/skills'],
              [['.claude', 'skills'], 'project:.claude/skills'],
            ]) {
              const cand = path.join(projectDir, ...rel);
              if (fs.existsSync(cand)) addSkillDir(label, cand);
            }
          }
        } else {
          addSkillDir('user:.agents/skills', path.join(homeDir, '.agents', 'skills'));
          for (const [cand, label, kind] of [
            [path.join(homeDir, '.codex', 'skills'), 'user:.codex/skills', 'skills'],
            [path.join(homeDir, '.kiro', 'skills'), 'user:.kiro/skills', 'skills'],
            [path.join(homeDir, '.copilot', 'skills'), 'user:.copilot/skills', 'skills'],
            [path.join(homeDir, '.cursor', 'skills'), 'user:.cursor/skills', 'skills'],
            [path.join(homeDir, '.gemini', 'config', 'plugins'), 'user:.gemini/config/plugins', 'plugins'],
          ]) {
            if (fs.existsSync(cand)) {
              if (kind === 'plugins') addPluginDir(label, cand);
              else addSkillDir(label, cand);
            }
          }
        }
        includeClaudeCode = true;
      } else if (target === 'all') {
        addSkillDir('user:.agents/skills', path.join(homeDir, '.agents', 'skills'));
        addSkillDir('user:.codex/skills', path.join(homeDir, '.codex', 'skills'));
        addSkillDir('user:.kiro/skills', path.join(homeDir, '.kiro', 'skills'));
        addSkillDir('user:.copilot/skills', path.join(homeDir, '.copilot', 'skills'));
        addSkillDir('user:.cursor/skills', path.join(homeDir, '.cursor', 'skills'));
        addPluginDir('user:.gemini/config/plugins', path.join(homeDir, '.gemini', 'config', 'plugins'));
        includeClaudeCode = true;
      } else if (target === 'agents') {
        addSkillDir('user:.agents/skills', path.join(homeDir, '.agents', 'skills'));
      } else if (target === 'codex') {
        addSkillDir('user:.codex/skills', path.join(homeDir, '.codex', 'skills'));
      } else if (target === 'antigravity') {
        addPluginDir('user:.gemini/config/plugins', path.join(homeDir, '.gemini', 'config', 'plugins'));
      } else if (target === 'copilot' || target === 'github' || target === 'vscode') {
        addSkillDir('user:.copilot/skills', path.join(homeDir, '.copilot', 'skills'));
      } else if (target === 'kiro') {
        addSkillDir('user:.kiro/skills', path.join(homeDir, '.kiro', 'skills'));
      } else if (target === 'cursor') {
        addSkillDir('user:.cursor/skills', path.join(homeDir, '.cursor', 'skills'));
      } else if (target === 'opencode') {
        addSkillDir('user:.config/opencode/skills', path.join(homeDir, '.config', 'opencode', 'skills'));
      } else if (target === 'claude-skills') {
        addSkillDir('user:.claude/skills', path.join(homeDir, '.claude', 'skills'));
      } else if (target === 'claude-code') {
        includeClaudeCode = true;
      } else {
        throw new Error(`Unknown --target "${target}"`);
      }
    }
  }

  return { containers, includeClaudeCode };
}

function findClaudeBinary(env) {
  const e = env || process.env;
  const dirs = String(e.PATH || e.Path || '').split(path.delimiter).filter(Boolean);
  const names = process.platform === 'win32' ? ['claude.exe', 'claude.cmd', 'claude'] : ['claude'];
  for (const d of dirs) {
    for (const n of names) {
      const cand = path.join(d, n);
      try {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
      } catch { /* ignore */ }
    }
  }
  return null;
}

function runClaudePluginCmd(claudeBin, subArgs, cwd) {
  const useCmd = process.platform === 'win32' && /\.(cmd|bat)$/i.test(claudeBin);
  if (useCmd) {
    const quoted = [claudeBin, ...subArgs].map((a) => `"${String(a).replace(/"/g, '""')}"`).join(' ');
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${quoted}"`], {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 45000,
      windowsHide: true,
    });
  }
  return spawnSync(claudeBin, subArgs, {
    cwd: cwd || process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 45000,
    shell: false,
    windowsHide: true,
  });
}

function settingsPathForScope(scope, claudeDir, projectPath) {
  if (scope === 'project' && projectPath) return path.join(projectPath, '.claude', 'settings.json');
  if (scope === 'local' && projectPath) return path.join(projectPath, '.claude', 'settings.local.json');
  return path.join(claudeDir, 'settings.json');
}

// Reconciles renamed or consolidated plugins inside Claude Code (`installed_plugins.json` and
// user/project/local `settings.json` `enabledPlugins`).
function migrateClaudeCodeState(opts) {
  const claudeDir = opts.claudeDir;
  const projectDir = opts.projectDir;
  const catalog = opts.catalog;
  const migrations = opts.migrations;
  const keepBridges = opts.keepBridges === true;
  const dryRun = opts.dryRun === true;
  const stateOnly = opts.stateOnly === true;

  const actions = [];
  if (!claudeDir || !fs.existsSync(claudeDir)) return actions;

  const activePluginMigrations = (migrations.pluginMigrations || []).filter(
    (pm) => !(keepBridges && pm.bridge_retained)
  );
  if (activePluginMigrations.length === 0) return actions;

  const mpName = catalog.marketplaceName || MARKETPLACE_NAME;
  const regPath = path.join(claudeDir, 'plugins', 'installed_plugins.json');
  const reg = safeReadJson(regPath);
  const claudeBin = stateOnly ? null : findClaudeBinary(opts.env);

  if (reg && reg.plugins && typeof reg.plugins === 'object') {
    let regMutated = false;

    for (const pm of activePluginMigrations) {
      const oldKey = `${pm.from}@${mpName}`;
      const newKey = `${pm.to}@${mpName}`;
      if (!Object.prototype.hasOwnProperty.call(reg.plugins, oldKey)) continue;
      const targetPlugin = catalog.plugins.get(pm.to);
      if (!targetPlugin) continue;

      const rawEntries = Array.isArray(reg.plugins[oldKey]) ? reg.plugins[oldKey] : [reg.plugins[oldKey]];
      const existingNew = Array.isArray(reg.plugins[newKey])
        ? reg.plugins[newKey]
        : reg.plugins[newKey]
          ? [reg.plugins[newKey]]
          : [];

      let handledViaCli = false;
      if (claudeBin && !dryRun) {
        let allSucceeded = true;
        for (const inst of rawEntries) {
          const instScope = (inst && inst.scope) || 'user';
          const instCwd = (inst && inst.projectPath) || projectDir || process.cwd();
          const alreadyInScope = existingNew.some(
            (e) => ((e && e.scope) || 'user') === instScope && (e.projectPath || '') === (inst.projectPath || '')
          );
          if (!alreadyInScope) {
            const rInst = runClaudePluginCmd(claudeBin, ['plugin', 'install', newKey, '--scope', instScope], instCwd);
            if (rInst.status !== 0) {
              allSucceeded = false;
              break;
            }
          }
          const rUninst = runClaudePluginCmd(claudeBin, ['plugin', 'uninstall', oldKey, '--scope', instScope], instCwd);
          if (rUninst.status !== 0) {
            allSucceeded = false;
            break;
          }
        }
        handledViaCli = allSucceeded;
      }

      if (!handledViaCli && !dryRun) {
        const nowIso = new Date().toISOString();
        for (const inst of rawEntries) {
          const instScope = (inst && inst.scope) || 'user';
          const alreadyInScope = existingNew.some(
            (e) => ((e && e.scope) || 'user') === instScope && (e.projectPath || '') === ((inst && inst.projectPath) || '')
          );
          const cacheDest = path.join(claudeDir, 'plugins', 'cache', mpName, pm.to, targetPlugin.version);
          copyDirStatic(targetPlugin.pluginDir, cacheDest, { dryRun: false });
          if (!alreadyInScope) {
            const migratedEntry = Object.assign({}, inst || {}, {
              scope: instScope,
              installPath: cacheDest,
              version: targetPlugin.version,
              installedAt: (inst && inst.installedAt) || nowIso,
              lastUpdated: nowIso,
            });
            existingNew.push(migratedEntry);
          }
          if (inst && inst.installPath && inst.installPath.includes(path.join('cache', mpName, pm.from))) {
            removeEntrySafe(inst.installPath);
          }
        }
        reg.plugins[newKey] = existingNew;
        delete reg.plugins[oldKey];
        regMutated = true;
      }

      // Reconcile enabledPlugins across every scope settings.json referenced by rawEntries
      for (const inst of rawEntries) {
        const instScope = (inst && inst.scope) || 'user';
        const sPath = settingsPathForScope(instScope, claudeDir, (inst && inst.projectPath) || projectDir);
        const settings = safeReadJson(sPath);
        if (settings && settings.enabledPlugins && typeof settings.enabledPlugins === 'object') {
          if (Object.prototype.hasOwnProperty.call(settings.enabledPlugins, oldKey)) {
            const prevEnabled = settings.enabledPlugins[oldKey];
            if (!Object.prototype.hasOwnProperty.call(settings.enabledPlugins, newKey)) {
              settings.enabledPlugins[newKey] = prevEnabled;
            } else if (prevEnabled === false) {
              settings.enabledPlugins[newKey] = false;
            }
            delete settings.enabledPlugins[oldKey];
            if (!dryRun) atomicWrite(sPath, JSON.stringify(settings, null, 2) + '\n');
          }
        }
      }

      actions.push({
        surface: 'claude-code',
        from: oldKey,
        to: newKey,
        since: pm.since || null,
        reason: pm.reason || 'migrated',
        via: handledViaCli ? 'claude-cli' : dryRun ? 'dry-run' : 'state-reconcile',
      });
    }

    if (regMutated && !dryRun) {
      atomicWrite(regPath, JSON.stringify(reg, null, 2) + '\n');
    }
  }

  // Also scrub any orphaned enabledPlugins keys in user/project/local settings.json even if installed_plugins.json already dropped oldKey
  const settingsCandidates = [path.join(claudeDir, 'settings.json')];
  if (projectDir) {
    settingsCandidates.push(
      path.join(projectDir, '.claude', 'settings.json'),
      path.join(projectDir, '.claude', 'settings.local.json')
    );
  }
  for (const sPath of settingsCandidates) {
    const settings = safeReadJson(sPath);
    if (!settings || !settings.enabledPlugins || typeof settings.enabledPlugins !== 'object') continue;
    let changed = false;
    for (const pm of activePluginMigrations) {
      const oldKey = `${pm.from}@${mpName}`;
      const newKey = `${pm.to}@${mpName}`;
      if (Object.prototype.hasOwnProperty.call(settings.enabledPlugins, oldKey)) {
        if (!Object.prototype.hasOwnProperty.call(settings.enabledPlugins, newKey)) {
          settings.enabledPlugins[newKey] = settings.enabledPlugins[oldKey];
        }
        delete settings.enabledPlugins[oldKey];
        changed = true;
        if (!actions.some((a) => a.surface === 'claude-code' && a.from === oldKey)) {
          actions.push({
            surface: 'claude-code-settings',
            from: oldKey,
            to: newKey,
            since: pm.since || null,
            reason: pm.reason || 'migrated',
            via: dryRun ? 'dry-run' : 'settings-reconcile',
          });
        }
      }
    }
    if (changed && !dryRun) {
      atomicWrite(sPath, JSON.stringify(settings, null, 2) + '\n');
    }
  }

  return actions;
}

function readContainerState(containerDir) {
  const state = safeReadJson(path.join(containerDir, STATE_FILENAME));
  if (state && typeof state === 'object') return state;
  return null;
}

function writeContainerState(containerDir, nextState, dryRun) {
  if (dryRun) return true;
  ensureDir(containerDir);
  return atomicWrite(path.join(containerDir, STATE_FILENAME), JSON.stringify(nextState, null, 2) + '\n');
}

function mapPluginThroughMigrations(pluginId, pluginMigrations, keepBridges) {
  let cur = pluginId;
  const visited = new Set();
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const hit = (pluginMigrations || []).find((m) => m.from === cur && !(keepBridges && m.bridge_retained));
    if (!hit) break;
    cur = hit.to;
  }
  return cur;
}

function syncContainer(container, opts) {
  const catalog = opts.catalog;
  const releaseInfo = opts.releaseInfo;
  const mode = opts.mode; // 'install' | 'update' | 'migrate' | 'uninstall'
  const dryRun = opts.dryRun === true;
  const keepBridges = opts.keepBridges === true;
  const requestedPlugins = opts.requestedPlugins; // null or Array<string>

  const prevState = readContainerState(container.dir);
  const effectiveFromTag = opts.fromTag || (prevState && prevState.releaseTag) || null;
  const migrations = loadMigrations(opts.repoRoot, {
    fromTag: effectiveFromTag,
    toTag: opts.toTag || 'HEAD',
  });

  const summary = {
    id: container.id,
    kind: container.kind,
    dir: container.dir,
    previousReleaseTag: (prevState && prevState.releaseTag) || null,
    releaseTag: releaseInfo.releaseTag,
    installed: [],
    updated: [],
    migrated: [],
    removed: [],
    replacedBrokenLinks: [],
  };

  if (mode === 'uninstall') {
    if (!fs.existsSync(container.dir)) return summary;
    const prevItems = (prevState && (container.kind === 'plugins' ? prevState.plugins : prevState.skills)) || {};
    const targetPluginSet = requestedPlugins ? new Set(requestedPlugins) : null;

    for (const [itemName, meta] of Object.entries(prevItems)) {
      const owningPlugin = container.kind === 'plugins' ? itemName : (meta && meta.plugin) || itemName;
      if (targetPluginSet && !targetPluginSet.has(owningPlugin)) continue;
      const itemPath = path.join(container.dir, itemName);
      if (safeLstat(itemPath)) {
        if (!dryRun) removeEntrySafe(itemPath);
        summary.removed.push(itemName);
      }
      delete prevItems[itemName];
    }

    if (prevState) {
      if (Object.keys(prevItems).length === 0) {
        if (!dryRun) removeEntrySafe(path.join(container.dir, STATE_FILENAME));
      } else {
        prevState.updatedAt = new Date().toISOString();
        writeContainerState(container.dir, prevState, dryRun);
      }
    }
    return summary;
  }

  // Determine which plugins apply to this container
  const selectedPlugins = new Set();

  if (mode === 'install') {
    const rawList = requestedPlugins && requestedPlugins.length
      ? requestedPlugins
      : Array.from(catalog.plugins.keys());
    // Carry forward previously installed plugins in this container when doing partial --plugin install
    if (prevState && Array.isArray(prevState.installedPlugins)) {
      for (const p of prevState.installedPlugins) {
        const mapped = mapPluginThroughMigrations(p, migrations.pluginMigrations, keepBridges);
        if (catalog.plugins.has(mapped)) selectedPlugins.add(mapped);
      }
    }
    for (const req of rawList) {
      const mapped = mapPluginThroughMigrations(req, migrations.pluginMigrations, keepBridges);
      if (!catalog.plugins.has(mapped)) {
        throw new Error(`Unknown plugin "${req}" (not in .claude-plugin/marketplace.json)`);
      }
      selectedPlugins.add(mapped);
    }
  } else if (mode === 'update' || mode === 'migrate') {
    if (!fs.existsSync(container.dir)) return summary;

    // 1) Inspect existing entries on disk for broken symlinks/stubs, legacy plugins/skills, or managed items
    const diskEntries = fs.readdirSync(container.dir);
    if (container.kind === 'plugins') {
      const prevPlugins = new Set((prevState && prevState.installedPlugins) || []);
      for (const p of prevPlugins) {
        const mapped = mapPluginThroughMigrations(p, migrations.pluginMigrations, keepBridges);
        if (mapped !== p) {
          summary.migrated.push({ from: p, to: mapped, reason: 'plugin-migration' });
          const oldPath = path.join(container.dir, p);
          if (safeLstat(oldPath)) {
            if (!dryRun) removeEntrySafe(oldPath);
            summary.removed.push(p);
          }
        }
        if (mode === 'update' && catalog.plugins.has(mapped)) selectedPlugins.add(mapped);
        if (mode === 'migrate' && mapped !== p && catalog.plugins.has(mapped)) selectedPlugins.add(mapped);
      }

      for (const dName of diskEntries) {
        if (dName.startsWith('.')) continue;
        const dPath = path.join(container.dir, dName);
        const pm = migrations.pluginMigrations.find((m) => m.from === dName && !(keepBridges && m.bridge_retained));
        if (pm && catalog.plugins.has(pm.to)) {
          if (!summary.migrated.some((x) => x.from === dName && x.to === pm.to)) {
            summary.migrated.push({ from: dName, to: pm.to, reason: pm.reason || 'plugin-migration' });
          }
          if (!dryRun) removeEntrySafe(dPath);
          if (!summary.removed.includes(dName)) summary.removed.push(dName);
          selectedPlugins.add(pm.to);
        } else if (mode === 'update' && catalog.plugins.has(dName)) {
          const pj = safeReadJson(path.join(dPath, '.claude-plugin', 'plugin.json'));
          if (pj && pj.name === dName) selectedPlugins.add(dName);
        }
      }
    } else {
      // kind === 'skills'
      const prevSkills = (prevState && prevState.skills) || {};
      if (prevState && Array.isArray(prevState.installedPlugins) && mode === 'update') {
        for (const p of prevState.installedPlugins) {
          const mapped = mapPluginThroughMigrations(p, migrations.pluginMigrations, keepBridges);
          if (mapped !== p && !summary.migrated.some((x) => x.from === p && x.to === mapped)) {
            summary.migrated.push({ from: p, to: mapped, reason: 'plugin-migration' });
          }
          if (catalog.plugins.has(mapped)) selectedPlugins.add(mapped);
        }
      }

      // Check every skill previously recorded in state: if it was renamed or dropped from its plugin, remove old folder
      for (const [oldSkill, meta] of Object.entries(prevSkills)) {
        const sm = migrations.skillMigrations.find(
          (m) => m.from_skill === oldSkill && (!m.from_plugin || !meta.plugin || m.from_plugin === meta.plugin)
        );
        if (sm) {
          if (!summary.migrated.some((x) => x.from === oldSkill && x.to === sm.to_skill)) {
            summary.migrated.push({
              from: oldSkill,
              to: sm.to_skill,
              fromPlugin: sm.from_plugin,
              toPlugin: sm.to_plugin,
              reason: sm.reason || 'skill-migration',
            });
          }
          if (sm.to_skill !== oldSkill) {
            const oldPath = path.join(container.dir, oldSkill);
            if (safeLstat(oldPath)) {
              if (!dryRun) removeEntrySafe(oldPath);
              if (!summary.removed.includes(oldSkill)) summary.removed.push(oldSkill);
            }
          }
          if (catalog.plugins.has(sm.to_plugin)) selectedPlugins.add(sm.to_plugin);
        } else if (mode === 'update' && !catalog.skills.has(oldSkill)) {
          // Skill tracked in .gnox-install-state.json was retired in the current release
          const oldPath = path.join(container.dir, oldSkill);
          if (safeLstat(oldPath)) {
            if (!dryRun) removeEntrySafe(oldPath);
            if (!summary.removed.includes(oldSkill)) summary.removed.push(oldSkill);
          }
        }
      }

      // Scan disk entries for legacy renamed skill folders or broken repo symlinks/stubs
      for (const sName of diskEntries) {
        if (sName.startsWith('.')) continue;
        const sPath = path.join(container.dir, sName);
        const sm = migrations.skillMigrations.find(
          (m) => m.from_skill === sName && m.to_skill !== sName
        );
        if (sm && catalog.skills.has(sm.to_skill)) {
          if (!summary.migrated.some((x) => x.from === sName && x.to === sm.to_skill)) {
            summary.migrated.push({
              from: sName,
              to: sm.to_skill,
              fromPlugin: sm.from_plugin,
              toPlugin: sm.to_plugin,
              reason: sm.reason || 'skill-migration',
            });
          }
          if (!dryRun) removeEntrySafe(sPath);
          if (!summary.removed.includes(sName)) summary.removed.push(sName);
          selectedPlugins.add(sm.to_plugin);
          continue;
        }

        const wasStubOrLink = isBrokenOrRepoStub(sPath) || Boolean(safeLstat(sPath) && safeLstat(sPath).isSymbolicLink());
        if (catalog.skills.has(sName)) {
          const catEntry = catalog.skills.get(sName);
          if (wasStubOrLink) {
            summary.replacedBrokenLinks.push(sName);
            selectedPlugins.add(catEntry.plugin);
          } else if (mode === 'update' && (prevSkills[sName] || fs.existsSync(path.join(sPath, 'SKILL.md')))) {
            selectedPlugins.add(catEntry.plugin);
          }
        } else if (isBrokenOrRepoStub(sPath)) {
          if (!dryRun) removeEntrySafe(sPath);
          if (!summary.removed.includes(sName)) summary.removed.push(sName);
        }
      }
    }
  }

  if (selectedPlugins.size === 0 && summary.migrated.length === 0 && summary.removed.length === 0) {
    return summary;
  }

  // Copy selected plugins/skills statically and write updated .gnox-install-state.json
  if (container.kind === 'plugins') {
    const nextPlugins = Object.assign({}, (prevState && prevState.plugins) || {});
    for (const r of summary.removed) delete nextPlugins[r];

    for (const pName of Array.from(selectedPlugins).sort()) {
      const pInfo = catalog.plugins.get(pName);
      if (!pInfo) continue;
      const destDir = path.join(container.dir, pName);
      const existed = Boolean(safeLstat(destDir));
      const res = copyDirStatic(pInfo.pluginDir, destDir, { dryRun });
      if (!existed) summary.installed.push(pName);
      else if (res.filesWritten > 0 || res.filesRemoved > 0) summary.updated.push(pName);
      nextPlugins[pName] = {
        version: pInfo.version,
        treeHash: hashDirectoryTree(pInfo.pluginDir),
      };
    }

    const nextState = {
      schemaVersion: 1,
      marketplace: catalog.marketplaceName,
      kind: 'plugins',
      version: releaseInfo.version,
      releaseTag: releaseInfo.releaseTag,
      updatedAt: new Date().toISOString(),
      installedPlugins: Object.keys(nextPlugins).sort(),
      plugins: nextPlugins,
    };
    writeContainerState(container.dir, nextState, dryRun);
  } else {
    const nextSkills = Object.assign({}, (prevState && prevState.skills) || {});
    for (const r of summary.removed) delete nextSkills[r];

    for (const pName of Array.from(selectedPlugins).sort()) {
      const pInfo = catalog.plugins.get(pName);
      if (!pInfo) continue;
      for (const sName of pInfo.skills) {
        const sInfo = catalog.skills.get(sName);
        if (!sInfo) continue;
        const destDir = path.join(container.dir, sName);
        const existed = Boolean(safeLstat(destDir) && !safeLstat(destDir).isSymbolicLink() && safeLstat(destDir).isDirectory());
        const res = copyDirStatic(sInfo.skillDir, destDir, { dryRun });
        if (!existed) summary.installed.push(sName);
        else if (res.filesWritten > 0 || res.filesRemoved > 0) summary.updated.push(sName);
        nextSkills[sName] = {
          plugin: pName,
          pluginVersion: pInfo.version,
          treeHash: hashDirectoryTree(sInfo.skillDir),
        };
      }
    }

    const pluginOwnerSet = new Set(Array.from(selectedPlugins));
    for (const meta of Object.values(nextSkills)) {
      if (meta && meta.plugin && catalog.plugins.has(meta.plugin)) pluginOwnerSet.add(meta.plugin);
    }

    const nextState = {
      schemaVersion: 1,
      marketplace: catalog.marketplaceName,
      kind: 'skills',
      version: releaseInfo.version,
      releaseTag: releaseInfo.releaseTag,
      updatedAt: new Date().toISOString(),
      installedPlugins: Array.from(pluginOwnerSet).sort(),
      skills: nextSkills,
    };
    writeContainerState(container.dir, nextState, dryRun);
  }

  return summary;
}

function inspectStatus(opts) {
  const options = normalizeOptions(opts, 'status');
  const catalog = loadMarketplaceCatalog(options.repoRoot);
  const releaseInfo = readRepoReleaseVersion(options.repoRoot);
  const migrations = loadMigrations(options.repoRoot, {
    fromTag: options.fromTag || null,
    toTag: options.toTag || 'HEAD',
  });
  const { containers, includeClaudeCode } = resolveTargets(Object.assign({}, options, { onlyExisting: true }));

  const containerReports = [];
  for (const c of containers) {
    if (!fs.existsSync(c.dir)) continue;
    const st = readContainerState(c.dir);
    const legacyItems = [];
    const brokenLinks = [];
    for (const entName of fs.readdirSync(c.dir)) {
      if (entName.startsWith('.')) continue;
      const entPath = path.join(c.dir, entName);
      if (isBrokenOrRepoStub(entPath)) brokenLinks.push(entName);
      if (c.kind === 'plugins') {
        const pm = migrations.pluginMigrations.find((m) => m.from === entName && !(options.keepBridges && m.bridge_retained));
        if (pm) legacyItems.push({ from: entName, to: pm.to });
      } else {
        const sm = migrations.skillMigrations.find((m) => m.from_skill === entName && m.to_skill !== entName);
        if (sm) legacyItems.push({ from: entName, to: sm.to_skill });
      }
    }
    containerReports.push({
      id: c.id,
      kind: c.kind,
      dir: c.dir,
      managedReleaseTag: (st && st.releaseTag) || null,
      installedCount: st
        ? Object.keys((c.kind === 'plugins' ? st.plugins : st.skills) || {}).length
        : 0,
      legacyItems,
      brokenLinks,
    });
  }

  const claudePending = includeClaudeCode
    ? migrateClaudeCodeState({
        claudeDir: options.claudeDir,
        projectDir: options.projectDir,
        catalog,
        migrations,
        keepBridges: options.keepBridges,
        dryRun: true,
        stateOnly: true,
        env: options.env,
      })
    : [];

  return {
    marketplace: catalog.marketplaceName,
    repoReleaseTag: releaseInfo.releaseTag,
    availablePlugins: catalog.plugins.size,
    availableSkills: catalog.skills.size,
    containers: containerReports,
    pendingClaudeCodeMigrations: claudePending,
  };
}

function normalizeOptions(opts, defaultMode) {
  const o = opts || {};
  const repoRoot = path.resolve(o.repoRoot || DEFAULT_REPO_ROOT);
  const homeDir = o.homeDir ? path.resolve(o.homeDir) : os.homedir();
  const scope = o.scope || (o.projectDir ? 'project' : 'user');
  const projectDir = o.projectDir
    ? path.resolve(o.projectDir)
    : scope === 'project'
      ? process.cwd()
      : null;
  const claudeDir = o.claudeDir ? path.resolve(o.claudeDir) : path.join(homeDir, '.claude');
  return {
    mode: o.mode || defaultMode || 'install',
    repoRoot,
    homeDir,
    scope,
    projectDir,
    claudeDir,
    targets: o.targets || ['auto'],
    requestedPlugins: o.requestedPlugins || null,
    fromTag: o.fromTag || null,
    toTag: o.toTag || 'HEAD',
    stateOnly: o.stateOnly === true,
    keepBridges: o.keepBridges === true,
    dryRun: o.dryRun === true,
    env: o.env || process.env,
  };
}

function runAction(mode, rawOpts) {
  const options = normalizeOptions(rawOpts, mode);
  const catalog = loadMarketplaceCatalog(options.repoRoot);
  const releaseInfo = readRepoReleaseVersion(options.repoRoot);
  const migrations = loadMigrations(options.repoRoot, {
    fromTag: options.fromTag,
    toTag: options.toTag,
  });

  const onlyExisting = mode === 'update' || mode === 'migrate' || mode === 'uninstall';
  const { containers, includeClaudeCode } = resolveTargets(Object.assign({}, options, { onlyExisting }));

  const containerResults = [];
  for (const container of containers) {
    containerResults.push(
      syncContainer(container, {
        repoRoot: options.repoRoot,
        catalog,
        releaseInfo,
        mode,
        dryRun: options.dryRun,
        keepBridges: options.keepBridges,
        requestedPlugins: options.requestedPlugins,
        fromTag: options.fromTag,
        toTag: options.toTag,
      })
    );
  }

  let claudeCodeMigrations = [];
  if (includeClaudeCode && (mode === 'update' || mode === 'migrate')) {
    claudeCodeMigrations = migrateClaudeCodeState({
      claudeDir: options.claudeDir,
      projectDir: options.projectDir,
      catalog,
      migrations,
      keepBridges: options.keepBridges,
      dryRun: options.dryRun,
      stateOnly: options.stateOnly,
      env: options.env,
    });
  }

  return {
    mode,
    dryRun: options.dryRun,
    releaseTag: releaseInfo.releaseTag,
    containers: containerResults,
    claudeCodeMigrations,
  };
}

function installSkills(opts) {
  return runAction('install', opts);
}

function updateSkills(opts) {
  return runAction('update', opts);
}

function migrateInstalls(opts) {
  return runAction('migrate', opts);
}

function uninstallSkills(opts) {
  return runAction('uninstall', opts);
}

function parseCliArgs(argv) {
  const out = {
    command: 'install',
    targets: [],
    requestedPlugins: [],
    json: false,
    help: false,
  };
  const commands = new Set(['install', 'update', 'migrate', 'uninstall', 'status']);

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (i === 0 && commands.has(a)) {
      out.command = a;
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else if (a === '--scope' && argv[i + 1]) {
      out.scope = argv[++i];
    } else if (a === '--target' && argv[i + 1]) {
      out.targets.push(argv[++i]);
    } else if (a === '--plugin' && argv[i + 1]) {
      out.requestedPlugins.push(...argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    } else if (a === '--project-dir' && argv[i + 1]) {
      out.projectDir = argv[++i];
    } else if (a === '--home-dir' && argv[i + 1]) {
      out.homeDir = argv[++i];
    } else if (a === '--claude-dir' && argv[i + 1]) {
      out.claudeDir = argv[++i];
    } else if (a === '--repo-root' && argv[i + 1]) {
      out.repoRoot = argv[++i];
    } else if (a === '--from-tag' && argv[i + 1]) {
      out.fromTag = argv[++i];
    } else if (a === '--to-tag' && argv[i + 1]) {
      out.toTag = argv[++i];
    } else if (a === '--state-only') {
      out.stateOnly = true;
    } else if (a === '--keep-bridges') {
      out.keepBridges = true;
    } else if (a === '--dry-run') {
      out.dryRun = true;
    } else if (a === '--json') {
      out.json = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }

  if (out.requestedPlugins.length === 0) out.requestedPlugins = null;
  if (out.targets.length === 0) out.targets = ['auto'];
  return out;
}

function formatHumanReport(command, report) {
  if (command === 'status') {
    const lines = [
      `${report.marketplace} (${report.repoReleaseTag}) — ${report.availablePlugins} plugins, ${report.availableSkills} skills available`,
    ];
    for (const c of report.containers) {
      lines.push(
        `  [${c.id}] ${c.dir}: ${c.installedCount} managed (${c.managedReleaseTag || 'untracked'})` +
          (c.legacyItems.length ? `, ${c.legacyItems.length} legacy item(s)` : '') +
          (c.brokenLinks.length ? `, ${c.brokenLinks.length} broken link(s)` : '')
      );
    }
    if (report.pendingClaudeCodeMigrations.length > 0) {
      for (const m of report.pendingClaudeCodeMigrations) {
        lines.push(`  [${m.surface}] pending migration: ${m.from} -> ${m.to}`);
      }
    }
    return lines.join('\n');
  }

  const prefix = report.dryRun ? '[dry-run] ' : '';
  const lines = [`${prefix}${command} @ ${report.releaseTag}:`];
  for (const c of report.containers) {
    if (
      c.installed.length === 0 &&
      c.updated.length === 0 &&
      c.migrated.length === 0 &&
      c.removed.length === 0 &&
      c.replacedBrokenLinks.length === 0
    ) {
      lines.push(`  [${c.id}] up to date (${c.dir})`);
      continue;
    }
    lines.push(
      `  [${c.id}] installed=${c.installed.length}, updated=${c.updated.length}, migrated=${c.migrated.length}, removed=${c.removed.length} (${c.dir})`
    );
    for (const m of c.migrated) {
      lines.push(`    migrated ${m.from} -> ${m.to} (${m.reason})`);
    }
  }
  for (const cm of report.claudeCodeMigrations) {
    lines.push(`  [${cm.surface}] migrated ${cm.from} -> ${cm.to} (${cm.via})`);
  }
  return lines.join('\n');
}

if (require.main === module) {
  try {
    const cli = parseCliArgs(process.argv.slice(2));
    if (cli.help) {
      const header = fs
        .readFileSync(__filename, 'utf8')
        .split(/\r?\n/)
        .slice(0, 30)
        .map((l) => l.replace(/^\/\/\s?/, ''))
        .join('\n');
      console.log(header);
      process.exit(0);
    }
    const report = cli.command === 'status' ? inspectStatus(cli) : runAction(cli.command, cli);
    if (cli.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatHumanReport(cli.command, report));
    }
  } catch (err) {
    console.error(`install-skills: ${(err && err.message) || err}`);
    process.exit(1);
  }
}

module.exports = {
  STATE_FILENAME,
  copyDirStatic,
  loadMarketplaceCatalog,
  detectTagMigrations,
  loadMigrations,
  migrateClaudeCodeState,
  installSkills,
  updateSkills,
  migrateInstalls,
  uninstallSkills,
  inspectStatus,
};
