// Canonical zero-dependency peer-plugin and optional-tool discovery for gnomatix-oss-skills.
//
// Authoritative source: lib/gnox-discovery.js at the marketplace root.
// Synced into individual plugins via: node scripts/sync-lib.js
//
// Architectural contract:
// - Tier 0 (Stand-Alone Core): every plugin installs and runs independently with zero sibling lock-in.
// - Tier 1 (Complementary Plugin Dovetailing): when companion marketplace plugins are installed,
//   paired capabilities activate automatically; when absent, standalone paths run cleanly.
// - Tier 2 (Optional Local-Execution Tooling): optional local CLI tools unlock deterministic local
//   execution when detected on PATH or mise shims, and degrade cleanly when absent.
//
// Cross-platform contract (CLAUDE.md): pure Node built-ins only (fs, path, os), zero child_process.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const KNOWN_MARKETPLACE_PLUGINS = [
  'agent-darktriad-check',
  'all-help-no-harm',
  'bear-loads',
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

const KNOWN_SET = new Set(KNOWN_MARKETPLACE_PLUGINS);

// Maps multi-skill sub-skill folder names back to their owning marketplace plugin
// so Agent Skills symlink/copy installations (.agents/skills, .kiro/skills, etc.)
// resolve accurately to their marketplace plugin.
const SKILL_TO_PLUGIN = {
  'whacking-day': 'python-elimination-program',
  'zartan': 'python-elimination-program',
  'jake-the-snake': 'python-elimination-program',
  'old-willy': 'python-elimination-program',
  'citation-farm-audit': 'cui-bono',
  'source-provenance': 'cui-bono',
  'logic-decomposer': 'cui-bono',
  'logic-toolbox': 'cui-bono',
  'audit-rule': 'steering-audit-suite',
  'audit-skill': 'steering-audit-suite',
  'audit-workflow': 'steering-audit-suite',
  'audit-collection': 'steering-audit-suite',
  'rule-audit': 'steering-audit-suite',
  'bug-report': 'skill-vv',
};

const MARKETPLACE_COMPLEMENTS = [
  {
    source: 'gnox',
    target: '*',
    whenInstalled: 'Routes installed plugins under /gnox:<plugin>[:<skill>] and shares session-wide workspace_root:subdir:..., [NS]{@target}, and «term» [CURIE] conventions.',
    whenAbsent: 'Every plugin remains directly invocable under its own /<plugin> command and standalone SKILL.md.',
  },
  {
    source: 'skill-vv',
    target: '*',
    whenInstalled: 'Surfaces each installed plugin\'s required and optional local tools plus per-model/platform V&V status from VV.md.',
    whenAbsent: 'Plugins execute directly using their documented standalone defaults and graceful tool fallbacks.',
  },
  {
    source: 'update-readme-images',
    target: 'og-social-image',
    whenInstalled: 'Automatically generates and verifies 1280x640 (<1 MB) social-preview cards in every assets/images/ directory unless disabled in readme-images.json.',
    whenAbsent: 'Curates, audits, and stages README/SKILL banners, sub-panels, and oval insets standalone.',
  },
  {
    source: 'update-readme-images',
    target: 'critical-control-points',
    whenInstalled: 'Routes staged assets/drafts/ image replacement proposals through structured CCP user approval records.',
    whenAbsent: 'Stages replacements into assets/drafts/ with .proposal.json/.proposal.md manifests and requests direct user approval.',
  },
  {
    source: 'inaudible-markup',
    target: 'ontology-lookup',
    whenInstalled: 'Pairs TTS-silent structured callouts with verified Bioregistry «term» [CURIE] inline grounding.',
    whenAbsent: 'Applies TTS-silent structure, [NS]{@target} callouts, and passage role labels standalone.',
  },
  {
    source: 'ontology-lookup',
    target: 'word-lineage',
    whenInstalled: 'Combines Wiktionary Glottolog/ISO-639-3 language CURIE chains with phylogenetic layer and literal-meaning analysis.',
    whenAbsent: 'Resolves ontology CURIEs and Wiktionary language chains standalone via scripts/lookup.mjs.',
  },
  {
    source: 'spank-dario',
    target: 'dont-be-hitler',
    whenInstalled: 'Pairs statutory human-authorship enforcement with verbatim preservation of the user\'s prose and register.',
    whenAbsent: 'Enforces human-only authorship and blocks AI co-authorship trailers standalone.',
  },
  {
    source: 'hidden-libel-check',
    target: 'spank-dario',
    whenInstalled: 'Combines pre-commit/PR R0-R14 reputational discretion review with human-byline authorship protection.',
    whenAbsent: 'Runs R0-R14 reputational review over agent-authored repo text standalone.',
  },
  {
    source: 'did-you-rtfm',
    target: 'critical-control-points',
    whenInstalled: 'Hands verified post-RTFM minimal-repro blockers into structured non-blocking CCP escalation.',
    whenAbsent: 'Enforces version check, authoritative doc review, and minimal repro before presenting evidence directly to the user.',
  },
  {
    source: 'did-you-rtfm',
    target: 'staleness-guard',
    whenInstalled: 'Reinforces error-time RTFM verification with turn-wide live tool verification of environment and version claims.',
    whenAbsent: 'Verifies versions and authoritative docs whenever implementation errors or pivot impulses arise.',
  },
  {
    source: 'cui-bono',
    target: 'informal-logic-check',
    whenInstalled: 'Runs full Phase 0-2 premise confirmation and fallacy auditing inside Step 3 deconstruction.',
    whenAbsent: 'Marks informal-logic-check incomplete on the card if unavailable and completes all remaining steps.',
  },
  {
    source: 'cui-bono',
    target: 'staleness-guard',
    whenInstalled: 'Checks every cited or uncited figure against current primary records for supersession.',
    whenAbsent: 'Marks staleness-guard incomplete on the card if unavailable and completes all remaining steps.',
  },
  {
    source: 'cui-bono',
    target: 'word-lineage',
    whenInstalled: 'Replaces loaded rhetorical terms with literal phylogenetic working definitions in Step 3.',
    whenAbsent: 'Marks word-lineage incomplete on the card if unavailable and completes all remaining steps.',
  },
  {
    source: 'cui-bono',
    target: 'hidden-libel-check',
    whenInstalled: 'Audits every sentence naming a person or organization before emitting the cui-bono card.',
    whenAbsent: 'Marks hidden-libel-check incomplete on the card if unavailable and completes all remaining steps.',
  },
  {
    source: 'all-help-no-harm',
    target: 'satori',
    whenInstalled: 'Pairs explicit session-level non-adversarial contract affirmation with per-turn symbolic flow reminders.',
    whenAbsent: 'Maintains session contract affirmation, per-turn contract reminder, and PostCompact re-injection standalone.',
  },
  {
    source: 'gnox',
    target: 'satori',
    whenInstalled: 'Pairs session-wide Atomic Git-Flow River Steering (short-lived feature/*/bugfix/* branches, high-priority merge to develop/main, zero unpushed worktree or unauthorized PR rocks) with per-turn symbolic flow reminders.',
    whenAbsent: 'Applies Atomic Git-Flow River Steering standalone across session git workflows.',
  },
];

const OPTIONAL_LOCAL_TOOLS = [
  { name: 'mise', unlocks: 'Safe-mode MCP tool inspection (gnox) and one-command cross-platform tool provisioning (skill-vv)' },
  { name: 'magick', unlocks: 'Local ImageMagick 7 banner cropping, PNG32 oval alpha masks, and <1 MB OG social-preview cards (og-social-image, update-readme-images)' },
  { name: 'bd', unlocks: 'Durable Dolt-backed Beads issue and Critical Control Point records (critical-control-points, goal-compliant-task-queue)' },
  { name: 'gws', unlocks: 'CLI-based Google Calendar work-journal logging when app/MCP connectors are absent (log-session)' },
  { name: 'git-crypt', unlocks: 'Encrypted dev/ private record storage for maintainer and developer bug/origin logs (skill-vv)' },
];

function safeReadJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function miseShimDirs(env, homeDir) {
  const e = env || process.env;
  const home = homeDir || os.homedir();
  const dirs = [];
  if (e.MISE_DATA_DIR) dirs.push(path.join(e.MISE_DATA_DIR, 'shims'));
  if (e.XDG_DATA_HOME) dirs.push(path.join(e.XDG_DATA_HOME, 'mise', 'shims'));
  if (home) dirs.push(path.join(home, '.local', 'share', 'mise', 'shims'));
  if (e.LOCALAPPDATA) dirs.push(path.join(e.LOCALAPPDATA, 'mise', 'shims'));
  return dirs;
}

function commandOnPath(name, opts) {
  const options = opts || {};
  const e = options.env || process.env;
  const includeMise = options.includeMiseShims !== false;
  const pathDirs = String(e.PATH || e.Path || '').split(path.delimiter).filter(Boolean);
  const dirs = includeMise ? pathDirs.concat(miseShimDirs(e, options.homeDir)) : pathDirs;
  const exts = process.platform === 'win32'
    ? ['', ...String(e.PATHEXT || '.EXE;.CMD;.BAT;.COM').toLowerCase().split(';').filter(Boolean), '.ps1']
    : [''];

  for (const d of dirs) {
    for (const x of exts) {
      try {
        const candidate = path.join(d, name + x);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch { /* unreadable PATH entry */ }
    }
  }
  return null;
}

function recordPlugin(map, skillsSet, rawName, sourceLabel) {
  if (!rawName || typeof rawName !== 'string') return;
  const clean = rawName.trim().toLowerCase();
  if (KNOWN_SET.has(clean)) {
    if (!map.has(clean)) map.set(clean, []);
    const list = map.get(clean);
    if (!list.includes(sourceLabel)) list.push(sourceLabel);
    skillsSet.add(clean);
    return;
  }
  const mapped = SKILL_TO_PLUGIN[clean];
  if (mapped) {
    skillsSet.add(clean);
    if (!map.has(mapped)) map.set(mapped, []);
    const list = map.get(mapped);
    if (!list.includes(sourceLabel)) list.push(sourceLabel);
  }
}

function scanSkillContainer(dirPath, sourceLabel, pluginMap, skillsSet) {
  try {
    if (!dirPath || !fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const entryPath = path.join(dirPath, entry.name);
      try {
        // Accept directories or symlinks/junctions pointing to a directory containing SKILL.md or .claude-plugin/plugin.json
        const hasSkillMd = fs.existsSync(path.join(entryPath, 'SKILL.md'));
        const pluginJsonPath = path.join(entryPath, '.claude-plugin', 'plugin.json');
        const hasPluginJson = fs.existsSync(pluginJsonPath);
        if (hasSkillMd) {
          recordPlugin(pluginMap, skillsSet, entry.name, sourceLabel);
        } else if (hasPluginJson) {
          const pj = safeReadJson(pluginJsonPath);
          recordPlugin(pluginMap, skillsSet, (pj && pj.name) || entry.name, sourceLabel);
        }
      } catch { /* ignore broken link */ }
    }
  } catch { /* ignore unreadable container */ }
}

function scanClaudeRegistry(homeDir, pluginMap, skillsSet) {
  const regPath = path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json');
  const reg = safeReadJson(regPath);
  if (!reg || typeof reg.plugins !== 'object' || !reg.plugins) return;
  for (const [key, val] of Object.entries(reg.plugins)) {
    const atIdx = key.indexOf('@');
    const pluginName = atIdx > 0 ? key.slice(0, atIdx) : key;
    const marketName = atIdx > 0 ? key.slice(atIdx + 1) : '';
    const entries = Array.isArray(val) ? val : [val];
    const active = entries.some((e) => e && typeof e.installPath === 'string' && fs.existsSync(e.installPath));
    if (!active) continue;
    if (!marketName || marketName === 'gnomatix-oss-skills' || KNOWN_SET.has(pluginName)) {
      recordPlugin(pluginMap, skillsSet, pluginName, 'claude-code');
    }
  }
}

function discoverMarketplace(opts) {
  const options = opts || {};
  const env = options.env || process.env;
  const homeDir = options.homeDir || os.homedir();
  const projectDir = options.projectDir ? path.resolve(options.projectDir) : null;
  const includeUser = options.includeUser !== false;

  const pluginMap = new Map();
  const skillsSet = new Set();

  if (includeUser && homeDir) {
    scanClaudeRegistry(homeDir, pluginMap, skillsSet);
    const userSkillDirs = [
      [path.join(homeDir, '.agents', 'skills'), 'user:.agents/skills'],
      [path.join(homeDir, '.gemini', 'config', 'plugins'), 'user:.gemini/config/plugins'],
      [path.join(homeDir, '.gemini', 'skills'), 'user:.gemini/skills'],
      [path.join(homeDir, '.kiro', 'skills'), 'user:.kiro/skills'],
      [path.join(homeDir, '.copilot', 'skills'), 'user:.copilot/skills'],
      [path.join(homeDir, '.cursor', 'skills'), 'user:.cursor/skills'],
      [path.join(homeDir, '.claude', 'skills'), 'user:.claude/skills'],
    ];
    for (const [dir, label] of userSkillDirs) {
      scanSkillContainer(dir, label, pluginMap, skillsSet);
    }
  }

  if (projectDir) {
    // Workspace plugins/ directory if this project houses Claude/GNOX plugins
    scanSkillContainer(path.join(projectDir, 'plugins'), 'workspace:plugins', pluginMap, skillsSet);
    const projSkillDirs = [
      [path.join(projectDir, '.agents', 'skills'), 'project:.agents/skills'],
      [path.join(projectDir, '.github', 'skills'), 'project:.github/skills'],
      [path.join(projectDir, '.kiro', 'skills'), 'project:.kiro/skills'],
      [path.join(projectDir, '.gemini', 'skills'), 'project:.gemini/skills'],
      [path.join(projectDir, '.cursor', 'skills'), 'project:.cursor/skills'],
      [path.join(projectDir, '.opencode', 'skills'), 'project:.opencode/skills'],
      [path.join(projectDir, '.claude', 'skills'), 'project:.claude/skills'],
    ];
    for (const [dir, label] of projSkillDirs) {
      scanSkillContainer(dir, label, pluginMap, skillsSet);
    }
  }

  const extraRoots = []
    .concat(options.extraRoots || [])
    .concat(String(env.GNOX_PLUGIN_ROOTS || '').split(path.delimiter).filter(Boolean))
    .concat(String(env.SKILL_VV_ROOTS || '').split(path.delimiter).filter(Boolean));
  for (const root of extraRoots) {
    scanSkillContainer(root, `root:${root}`, pluginMap, skillsSet);
  }

  const installedPlugins = Array.from(pluginMap.keys()).sort();
  const installedSet = new Set(installedPlugins);

  const activeComplements = [];
  const standaloneFallbacks = [];
  for (const rel of MARKETPLACE_COMPLEMENTS) {
    if (!installedSet.has(rel.source)) continue;
    if (rel.target === '*') {
      if (installedPlugins.length > 1) {
        activeComplements.push({
          source: rel.source,
          target: 'installed-marketplace-plugins',
          summary: rel.whenInstalled,
        });
      } else {
        standaloneFallbacks.push({
          source: rel.source,
          missingTarget: 'companion-marketplace-plugins',
          summary: rel.whenAbsent,
        });
      }
      continue;
    }
    if (installedSet.has(rel.target)) {
      activeComplements.push({
        source: rel.source,
        target: rel.target,
        summary: rel.whenInstalled,
      });
    } else {
      standaloneFallbacks.push({
        source: rel.source,
        missingTarget: rel.target,
        summary: rel.whenAbsent,
      });
    }
  }

  const availableTools = [];
  const missingOptionalTools = [];
  for (const tool of OPTIONAL_LOCAL_TOOLS) {
    const binPath = commandOnPath(tool.name, {
      env,
      homeDir,
      includeMiseShims: options.includeMiseShims !== false && includeUser,
    });
    if (binPath) {
      availableTools.push({ name: tool.name, path: binPath, unlocks: tool.unlocks });
    } else {
      missingOptionalTools.push({ name: tool.name, unlocks: tool.unlocks });
    }
  }

  const pluginSources = {};
  for (const [k, v] of pluginMap.entries()) pluginSources[k] = v;

  return {
    installedPlugins,
    installedSkills: Array.from(skillsSet).sort(),
    pluginSources,
    activeComplements,
    standaloneFallbacks,
    availableTools,
    missingOptionalTools,
  };
}

function formatTopologySummary(topology) {
  const t = topology || { installedPlugins: [], activeComplements: [], availableTools: [], missingOptionalTools: [] };
  const pluginList = t.installedPlugins.length
    ? t.installedPlugins.join(', ')
    : 'gnox (standalone)';
  const pairList = t.activeComplements
    .filter((c) => c.target !== 'installed-marketplace-plugins')
    .map((c) => `${c.source}<->${c.target}`);
  const toolList = t.availableTools.map((x) => x.name);

  return [
    `5. Active GNOX Marketplace Topology (Three-Tier Stand-Alone + Complementary Synergy):`,
    `   - Installed plugins (${t.installedPlugins.length}): ${pluginList}.`,
    `   - Active complementary pairings: ${pairList.length ? pairList.join(', ') : 'none (each installed plugin runs its Tier 0 standalone path cleanly)'}.`,
    `   - Detected optional local tools: ${toolList.length ? toolList.join(', ') : 'none detected on PATH/mise shims (Tier 0 standalone fallbacks active)'}.`,
    `   - Execution rule: activate complementary integrations for every installed sibling plugin above; for any companion plugin or optional tool not present, run the documented standalone fallback without failing or refusing.`,
  ].join('\n');
}

module.exports = {
  KNOWN_MARKETPLACE_PLUGINS,
  SKILL_TO_PLUGIN,
  MARKETPLACE_COMPLEMENTS,
  OPTIONAL_LOCAL_TOOLS,
  commandOnPath,
  discoverMarketplace,
  formatTopologySummary,
};
