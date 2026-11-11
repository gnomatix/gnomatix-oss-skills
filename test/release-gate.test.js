'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { parseLifecycleFrontmatter, auditMarketplace } = require('../scripts/audit-marketplace-integrity.js');
const {
  versionMatchesPattern,
  evaluatePluginApproval,
  buildReleaseTree,
} = require('../scripts/build-release-tree.js');

function git(cwd, args, extra = {}) {
  return execFileSync('git', args, Object.assign({ cwd, encoding: 'utf8' }, extra));
}

function writePluginInRepo(repoDir, { name, version, vvExtra = '', hasSkill = true }) {
  const pDir = path.join(repoDir, 'plugins', name);
  fs.mkdirSync(path.join(pDir, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(pDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name, version, description: `Desc ${name} ${version}` }, null, 2) + '\n'
  );
  fs.writeFileSync(
    path.join(pDir, 'README.md'),
    `# ${name}\n\nVersion ${version}.\n`
  );
  fs.writeFileSync(
    path.join(pDir, 'VV.md'),
    [
      '---',
      'skill-vv: 1',
      `name: ${name}`,
      ...(vvExtra ? vvExtra.split('\n') : []),
      'requirements: []',
      'platforms:',
      '  - claude-code/win32',
      'results: []',
      '---',
      '',
      `# ${name} V&V`,
      '',
    ].join('\n')
  );
  if (hasSkill) {
    fs.mkdirSync(path.join(pDir, 'skills', name), { recursive: true });
    fs.writeFileSync(
      path.join(pDir, 'skills', name, 'SKILL.md'),
      `---\nname: ${name}\ndescription: Skill ${name} ${version}\n---\n\n# ${name}\n`
    );
  }
}

test('parseLifecycleFrontmatter and evaluatePluginApproval handle APPROVED, PENDING, and approved_versions patterns', () => {
  assert.equal(versionMatchesPattern('0.2.5', '0.2.5'), true);
  assert.equal(versionMatchesPattern('0.2.7', '0.2.5'), false);
  assert.equal(versionMatchesPattern('0.1.5', '0.1.*'), true);
  assert.equal(versionMatchesPattern('0.2.0', '0.1.*'), false);
  assert.equal(versionMatchesPattern('0.1.0', 'None'), false);

  const pendingNew = parseLifecycleFrontmatter(
    'skill-vv: 1\nname: draft-plugin\nauthority: PENDING MANUAL REVIEW\nreview_status: PENDING\napproved_versions: []'
  );
  assert.equal(pendingNew.authority, 'PENDING MANUAL REVIEW');
  assert.equal(pendingNew.reviewStatus, 'PENDING');
  assert.equal(pendingNew.hasApprovedVersions, true);
  assert.deepEqual(pendingNew.approvedVersions, []);

  const evalPending = evaluatePluginApproval({
    pluginName: 'draft-plugin',
    version: '0.1.2',
    frontmatters: [{ file: 'plugins/draft-plugin/VV.md', frontmatter: 'review_status: PENDING\napproved_versions: []' }],
  });
  assert.equal(evalPending.approved, false);

  const evalPinned = evaluatePluginApproval({
    pluginName: 'satori',
    version: '0.2.7',
    frontmatters: [
      {
        file: 'plugins/satori/VV.md',
        frontmatter: 'authority: PENDING MANUAL REVIEW\nreview_status: PENDING\napproved_versions:\n  - 0.2.5',
      },
    ],
  });
  assert.equal(evalPinned.approved, false);
  assert.deepEqual(evalPinned.approvedPatterns, ['0.2.5']);

  const evalApproved = evaluatePluginApproval({
    pluginName: 'citation-farm-audit',
    version: '0.1.5',
    frontmatters: [
      {
        file: 'plugins/citation-farm-audit/VV.md',
        frontmatter: 'authority: Brett Whitty\nreview_status: APPROVED\napproved_versions:\n  - 0.1.*',
      },
    ],
  });
  assert.equal(evalApproved.approved, true);
});

test('buildReleaseTree holds back net-new PENDING plugins, pins PENDING edits on released plugins, strips any 120000 symlinks, and ships APPROVED updates', (t) => {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-rel-gate-'));
  t.after(() => fs.rmSync(repoDir, { recursive: true, force: true }));

  git(repoDir, ['init', '-b', 'main']);
  git(repoDir, ['config', 'user.name', 'Test Maintainer']);
  git(repoDir, ['config', 'user.email', 'test@example.com']);

  fs.mkdirSync(path.join(repoDir, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(repoDir, 'VERSION'), '0.1.11\n');
  fs.writeFileSync(path.join(repoDir, 'CLAUDE.md'), '# Instructions\n');
  fs.writeFileSync(path.join(repoDir, 'AGENTS.md'), '# Agents\n');
  fs.writeFileSync(
    path.join(repoDir, 'README.md'),
    [
      '# Test Marketplace',
      '',
      '- [`steady-plugin`](plugins/steady-plugin/): Steady 0.1.0.',
      '- [`pinned-plugin`](plugins/pinned-plugin/): Pinned 0.2.5 approved.',
      '',
      'Plugins: steady-plugin, pinned-plugin.',
      '',
    ].join('\n')
  );

  writePluginInRepo(repoDir, {
    name: 'steady-plugin',
    version: '0.1.0',
    vvExtra: 'authority: Brett Whitty\nreview_status: APPROVED\napproved_versions:\n  - 0.1.*',
  });
  writePluginInRepo(repoDir, {
    name: 'pinned-plugin',
    version: '0.2.5',
    vvExtra: 'authority: Brett Whitty\nreview_status: APPROVED\napproved_versions:\n  - 0.2.5',
  });

  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(
      {
        name: 'synthetic-marketplace',
        plugins: [
          { name: 'steady-plugin', description: 'Steady 0.1.0', source: './plugins/steady-plugin' },
          { name: 'pinned-plugin', description: 'Pinned 0.2.5 approved', source: './plugins/pinned-plugin' },
        ],
      },
      null,
      2
    ) + '\n'
  );
  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'migrations.json'),
    JSON.stringify(
      {
        schema_version: 1,
        marketplace: 'synthetic-marketplace',
        plugin_migrations: [],
        skill_migrations: [],
      },
      null,
      2
    ) + '\n'
  );

  git(repoDir, ['add', '.']);
  // Simulate a historical parent release that had a legacy 120000 symlink
  const legacySymBlob = git(repoDir, ['hash-object', '-w', '--stdin'], {
    input: '../../plugins/steady-plugin/skills/steady-plugin',
  }).trim();
  git(repoDir, ['update-index', '--add', '--cacheinfo', `120000,${legacySymBlob},.agents/skills/steady-plugin`]);
  git(repoDir, ['commit', '-m', 'Release v0.1.11']);
  const parentSha = git(repoDir, ['rev-parse', 'HEAD']).trim();

  // Advance main with clean zero-symlink state + approved & pending changes
  git(repoDir, ['rm', '-q', '--cached', '--ignore-unmatch', '--', '.agents/skills/steady-plugin']);
  fs.writeFileSync(path.join(repoDir, 'VERSION'), '0.1.12\n');
  writePluginInRepo(repoDir, {
    name: 'steady-plugin',
    version: '0.1.1',
    vvExtra: 'authority: Brett Whitty\nreview_status: APPROVED\napproved_versions:\n  - 0.1.*',
  });
  writePluginInRepo(repoDir, {
    name: 'pinned-plugin',
    version: '0.2.7',
    vvExtra: 'authority: PENDING MANUAL REVIEW\nreview_status: PENDING\napproved_versions:\n  - 0.2.5',
  });
  fs.mkdirSync(path.join(repoDir, 'plugins', 'pinned-plugin', 'skills', 'pinned-extra'), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, 'plugins', 'pinned-plugin', 'skills', 'pinned-extra', 'SKILL.md'),
    '---\nname: pinned-extra\ndescription: In-progress skill\n---\n\n# pinned-extra\n'
  );
  writePluginInRepo(repoDir, {
    name: 'wip-plugin',
    version: '0.1.0',
    vvExtra: 'authority: PENDING MANUAL REVIEW\nreview_status: PENDING\napproved_versions: []',
  });

  fs.writeFileSync(
    path.join(repoDir, 'README.md'),
    [
      '# Test Marketplace',
      '',
      '- [`steady-plugin`](plugins/steady-plugin/): Steady 0.1.1.',
      '- [`pinned-plugin`](plugins/pinned-plugin/): Pinned 0.2.7 in-progress.',
      '- [`wip-plugin`](plugins/wip-plugin/): WIP 0.1.0.',
      '',
      'Plugins: steady-plugin, pinned-plugin, wip-plugin.',
      '',
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(
      {
        name: 'synthetic-marketplace',
        plugins: [
          { name: 'steady-plugin', description: 'Steady 0.1.1', source: './plugins/steady-plugin' },
          { name: 'pinned-plugin', description: 'Pinned 0.2.7 in-progress', source: './plugins/pinned-plugin' },
          { name: 'wip-plugin', description: 'WIP 0.1.0', source: './plugins/wip-plugin' },
        ],
      },
      null,
      2
    ) + '\n'
  );

  git(repoDir, ['add', '.']);
  git(repoDir, ['commit', '-m', 'Advance main with approved and pending changes']);

  const idxPath = path.join(repoDir, '.git', 'test-release-index');
  git(repoDir, ['read-tree', 'HEAD'], { env: Object.assign({}, process.env, { GIT_INDEX_FILE: idxPath }) });
  // Even if an accidental 120000 entry were injected into the candidate index, buildReleaseTree strips it
  git(
    repoDir,
    ['update-index', '--add', '--cacheinfo', `120000,${legacySymBlob},.kiro/skills/steady-plugin`],
    { env: Object.assign({}, process.env, { GIT_INDEX_FILE: idxPath }) }
  );

  const result = buildReleaseTree({
    repoRoot: repoDir,
    indexPath: idxPath,
    parentCommit: parentSha,
    skipClaudeValidate: true,
    checkReleasedPlugins: true,
    requiredPluginIds: ['steady-plugin', 'pinned-plugin'],
  });

  assert.deepEqual(result.excludedPlugins, ['wip-plugin']);
  assert.equal(result.pinnedPlugins['pinned-plugin'].pinnedVersion, '0.2.5');
  assert.equal(result.releasedPluginCount, 2);

  // Verify exact snapshot tree contents and zero 120000 entries
  const rawTreeModes = git(repoDir, ['ls-tree', '-r', result.treeSha]).split(/\r?\n/).filter(Boolean);
  assert.equal(
    rawTreeModes.some((line) => line.startsWith('120000 ')),
    false,
    'release tree must contain zero mode-120000 symlinks'
  );

  const snapMp = JSON.parse(git(repoDir, ['show', `${result.treeSha}:.claude-plugin/marketplace.json`]));
  assert.deepEqual(snapMp.plugins.map((p) => p.name), ['steady-plugin', 'pinned-plugin']);
  assert.equal(snapMp.plugins[1].description, 'Pinned 0.2.5 approved');

  const steadyPj = JSON.parse(git(repoDir, ['show', `${result.treeSha}:plugins/steady-plugin/.claude-plugin/plugin.json`]));
  assert.equal(steadyPj.version, '0.1.1');

  const pinnedPj = JSON.parse(git(repoDir, ['show', `${result.treeSha}:plugins/pinned-plugin/.claude-plugin/plugin.json`]));
  assert.equal(pinnedPj.version, '0.2.5');

  const treeFiles = git(repoDir, ['ls-tree', '-r', '--name-only', result.treeSha]).split(/\r?\n/).filter(Boolean);
  assert.equal(treeFiles.some((f) => f.includes('wip-plugin')), false, 'wip-plugin must not appear anywhere in release tree');
  assert.equal(treeFiles.some((f) => f.includes('pinned-extra')), false, 'in-progress skill on pinned-plugin must not appear in release tree');

  const snapReadme = git(repoDir, ['show', `${result.treeSha}:README.md`]);
  assert.equal(snapReadme.includes('wip-plugin'), false);
  assert.equal(snapReadme.includes('Pinned 0.2.5 approved.'), true);
});

test('buildReleaseTree and auditMarketplace hard-block removal of any previously released plugin', (t) => {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-rel-drop-'));
  t.after(() => fs.rmSync(repoDir, { recursive: true, force: true }));

  git(repoDir, ['init', '-b', 'main']);
  git(repoDir, ['config', 'user.name', 'Test Maintainer']);
  git(repoDir, ['config', 'user.email', 'test@example.com']);

  fs.mkdirSync(path.join(repoDir, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(repoDir, 'VERSION'), '0.1.8\n');
  fs.writeFileSync(path.join(repoDir, 'CLAUDE.md'), '# Instructions\n');
  fs.writeFileSync(path.join(repoDir, 'AGENTS.md'), '# Agents\n');
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test Marketplace\n');

  writePluginInRepo(repoDir, { name: 'alpha-plugin', version: '0.1.0' });
  writePluginInRepo(repoDir, { name: 'citation-farm-audit', version: '0.1.4' });

  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(
      {
        name: 'synthetic-marketplace',
        plugins: [
          { name: 'alpha-plugin', description: 'Alpha', source: './plugins/alpha-plugin' },
          { name: 'citation-farm-audit', description: 'CFA', source: './plugins/citation-farm-audit' },
        ],
      },
      null,
      2
    ) + '\n'
  );

  git(repoDir, ['add', '.']);
  git(repoDir, ['commit', '-m', 'Release v0.1.8']);
  const parentSha = git(repoDir, ['rev-parse', 'HEAD']).trim();

  // Simulate dropping citation-farm-audit on main
  fs.rmSync(path.join(repoDir, 'plugins', 'citation-farm-audit'), { recursive: true, force: true });
  fs.writeFileSync(
    path.join(repoDir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(
      {
        name: 'synthetic-marketplace',
        plugins: [{ name: 'alpha-plugin', description: 'Alpha', source: './plugins/alpha-plugin' }],
      },
      null,
      2
    ) + '\n'
  );
  git(repoDir, ['add', '-A']);
  git(repoDir, ['commit', '-m', 'Drop citation-farm-audit']);

  const auditRes = auditMarketplace(repoDir, {
    checkReleasedPlugins: true,
    requiredPluginIds: ['alpha-plugin', 'citation-farm-audit'],
  });
  assert.equal(auditRes.ok, false);
  assert.ok(auditRes.findings.some((f) => f.rule === 'released-plugin-removed'));

  const idxPath = path.join(repoDir, '.git', 'drop-release-index');
  git(repoDir, ['read-tree', 'HEAD'], { env: Object.assign({}, process.env, { GIT_INDEX_FILE: idxPath }) });

  assert.throws(
    () =>
      buildReleaseTree({
        repoRoot: repoDir,
        indexPath: idxPath,
        parentCommit: parentSha,
        skipClaudeValidate: true,
        checkReleasedPlugins: false,
      }),
    /removed previously released plugin "citation-farm-audit"/
  );
});
