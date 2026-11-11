'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  STATE_FILENAME,
  loadMarketplaceCatalog,
  detectTagMigrations,
  loadMigrations,
  migrateClaudeCodeState,
  installSkills,
  updateSkills,
  migrateInstalls,
  uninstallSkills,
  inspectStatus,
} = require('../scripts/install-skills.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function git(cwd, args, extra = {}) {
  return execFileSync('git', args, Object.assign({ cwd, encoding: 'utf8' }, extra));
}

test('installSkills writes static regular files across Codex, Copilot, Kiro, and Antigravity with zero symlinks', (t) => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-inst-home-'));
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-inst-proj-'));
  t.after(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  // Install bear-loads and cui-bono into project skill dirs + user Antigravity plugins dir
  const projRes = installSkills({
    repoRoot: REPO_ROOT,
    homeDir,
    projectDir,
    scope: 'project',
    targets: ['codex', 'copilot', 'kiro'],
    requestedPlugins: ['bear-loads', 'cui-bono'],
  });

  assert.equal(projRes.containers.length, 3);
  for (const rel of ['.agents/skills', '.github/skills', '.kiro/skills']) {
    const dir = path.join(projectDir, ...rel.split('/'));
    assert.ok(fs.existsSync(path.join(dir, 'bear-loads', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(dir, 'cui-bono', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(dir, 'citation-farm-audit', 'SKILL.md')));
    assert.equal(fs.lstatSync(path.join(dir, 'bear-loads')).isSymbolicLink(), false);
    const st = JSON.parse(fs.readFileSync(path.join(dir, STATE_FILENAME), 'utf8'));
    assert.ok(st.skills['bear-loads'].treeHash);
    assert.equal(st.skills['citation-farm-audit'].plugin, 'cui-bono');
  }

  const agyRes = installSkills({
    repoRoot: REPO_ROOT,
    homeDir,
    scope: 'user',
    targets: ['antigravity'],
    requestedPlugins: ['bear-loads'],
  });
  assert.equal(agyRes.containers.length, 1);
  const agyDir = path.join(homeDir, '.gemini', 'config', 'plugins');
  assert.ok(fs.existsSync(path.join(agyDir, 'bear-loads', '.claude-plugin', 'plugin.json')));
  assert.equal(fs.lstatSync(path.join(agyDir, 'bear-loads')).isSymbolicLink(), false);

  // Uninstall removes managed entries cleanly
  const unRes = uninstallSkills({
    repoRoot: REPO_ROOT,
    homeDir,
    scope: 'user',
    targets: ['antigravity'],
    requestedPlugins: ['bear-loads'],
  });
  assert.deepEqual(unRes.containers[0].removed, ['bear-loads']);
  assert.equal(fs.existsSync(path.join(agyDir, 'bear-loads')), false);
});

test('updateSkills and migrateInstalls replace core.symlinks=false stubs and migrate renamed plugins/skills while preserving user custom skills', (t) => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-mig-home-'));
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-mig-proj-'));
  t.after(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  const skillsDir = path.join(projectDir, '.agents', 'skills');
  fs.mkdirSync(path.join(skillsDir, 'forbidden-output-guard'), { recursive: true });
  fs.writeFileSync(
    path.join(skillsDir, 'forbidden-output-guard', 'SKILL.md'),
    '---\nname: forbidden-output-guard\ndescription: Legacy\n---\n'
  );
  // Simulate a 1-line Windows core.symlinks=false text stub
  fs.writeFileSync(path.join(skillsDir, 'bear-loads'), '../../plugins/bear-loads/skills/bear-loads');
  // Simulate an unrelated user-authored skill that must never be touched
  fs.mkdirSync(path.join(skillsDir, 'my-custom-skill'), { recursive: true });
  fs.writeFileSync(path.join(skillsDir, 'my-custom-skill', 'SKILL.md'), '# Custom User Skill\n');

  const agyDir = path.join(homeDir, '.gemini', 'config', 'plugins');
  fs.mkdirSync(path.join(agyDir, 'actually-im-the-ahole', '.claude-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(agyDir, 'actually-im-the-ahole', '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'actually-im-the-ahole', version: '0.1.0' })
  );

  // inspectStatus reports both legacy items and the broken stub before migration
  const preStatus = inspectStatus({
    repoRoot: REPO_ROOT,
    homeDir,
    projectDir,
    scope: 'project',
    targets: ['codex'],
  });
  assert.equal(preStatus.containers.length, 1);
  assert.ok(preStatus.containers[0].brokenLinks.includes('bear-loads'));
  assert.ok(preStatus.containers[0].legacyItems.some((i) => i.from === 'forbidden-output-guard' && i.to === 'bear-loads'));

  // Run updateSkills on project codex dir
  const updRes = updateSkills({
    repoRoot: REPO_ROOT,
    homeDir,
    projectDir,
    scope: 'project',
    targets: ['codex'],
  });
  const codexSummary = updRes.containers[0];
  assert.ok(codexSummary.migrated.some((m) => m.from === 'forbidden-output-guard' && m.to === 'bear-loads'));
  assert.equal(fs.existsSync(path.join(skillsDir, 'forbidden-output-guard')), false);
  assert.equal(fs.lstatSync(path.join(skillsDir, 'bear-loads')).isDirectory(), true);
  assert.ok(fs.existsSync(path.join(skillsDir, 'bear-loads', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(skillsDir, 'my-custom-skill', 'SKILL.md')));

  // Run migrateInstalls on user Antigravity plugins dir
  const migRes = migrateInstalls({
    repoRoot: REPO_ROOT,
    homeDir,
    scope: 'user',
    targets: ['antigravity'],
  });
  assert.ok(migRes.containers[0].migrated.some((m) => m.from === 'actually-im-the-ahole' && m.to === 'hidden-libel-check'));
  assert.equal(fs.existsSync(path.join(agyDir, 'actually-im-the-ahole')), false);
  assert.ok(fs.existsSync(path.join(agyDir, 'hidden-libel-check', '.claude-plugin', 'plugin.json')));
});

test('migrateClaudeCodeState reconciles installed_plugins.json and settings.json enabledPlugins cleanly', (t) => {
  const claudeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-cc-state-'));
  t.after(() => fs.rmSync(claudeDir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(claudeDir, 'plugins'), { recursive: true });
  const oldCachePath = path.join(claudeDir, 'plugins', 'cache', 'gnomatix-oss-skills', 'citation-farm-audit', '0.1.5');
  fs.mkdirSync(oldCachePath, { recursive: true });
  fs.writeFileSync(path.join(oldCachePath, 'README.md'), 'legacy cache');

  fs.writeFileSync(
    path.join(claudeDir, 'plugins', 'installed_plugins.json'),
    JSON.stringify(
      {
        version: 2,
        plugins: {
          'citation-farm-audit@gnomatix-oss-skills': [
            {
              scope: 'user',
              installPath: oldCachePath,
              version: '0.1.5',
              installedAt: '2026-11-01T00:00:00.000Z',
              lastUpdated: '2026-11-01T00:00:00.000Z',
            },
          ],
          'kontentkop-agent-output@gnomatix-oss-skills': [
            {
              scope: 'user',
              installPath: path.join(claudeDir, 'plugins', 'cache', 'gnomatix-oss-skills', 'kontentkop-agent-output', '0.1.0'),
              version: '0.1.0',
              installedAt: '2026-10-20T00:00:00.000Z',
              lastUpdated: '2026-10-20T00:00:00.000Z',
            },
          ],
        },
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify(
      {
        enabledPlugins: {
          'citation-farm-audit@gnomatix-oss-skills': true,
          'kontentkop-agent-output@gnomatix-oss-skills': false,
        },
      },
      null,
      2
    )
  );

  const catalog = loadMarketplaceCatalog(REPO_ROOT);
  const migrations = loadMigrations(REPO_ROOT);

  const actions = migrateClaudeCodeState({
    claudeDir,
    catalog,
    migrations,
    stateOnly: true,
  });

  assert.equal(actions.length, 2);
  const nextReg = JSON.parse(fs.readFileSync(path.join(claudeDir, 'plugins', 'installed_plugins.json'), 'utf8'));
  assert.equal(Object.prototype.hasOwnProperty.call(nextReg.plugins, 'citation-farm-audit@gnomatix-oss-skills'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(nextReg.plugins, 'kontentkop-agent-output@gnomatix-oss-skills'), false);
  assert.ok(Array.isArray(nextReg.plugins['cui-bono@gnomatix-oss-skills']));
  assert.ok(Array.isArray(nextReg.plugins['agent-darktriad-check@gnomatix-oss-skills']));
  assert.ok(fs.existsSync(nextReg.plugins['cui-bono@gnomatix-oss-skills'][0].installPath));

  const nextSettings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
  assert.equal(nextSettings.enabledPlugins['cui-bono@gnomatix-oss-skills'], true);
  assert.equal(nextSettings.enabledPlugins['agent-darktriad-check@gnomatix-oss-skills'], false);
  assert.equal(Object.prototype.hasOwnProperty.call(nextSettings.enabledPlugins, 'citation-farm-audit@gnomatix-oss-skills'), false);
});

test('detectTagMigrations infers plugin and skill renames across git release tags automatically', (t) => {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-tag-diff-'));
  t.after(() => fs.rmSync(repoDir, { recursive: true, force: true }));

  git(repoDir, ['init', '-b', 'main']);
  git(repoDir, ['config', 'user.name', 'Test']);
  git(repoDir, ['config', 'user.email', 'test@example.com']);

  const v1Dir = path.join(repoDir, 'plugins', 'old-widget');
  fs.mkdirSync(path.join(v1Dir, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(v1Dir, 'skills', 'old-widget'), { recursive: true });
  fs.writeFileSync(
    path.join(v1Dir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'old-widget', version: '0.1.0', description: 'Shared widget description text for similarity.' }, null, 2)
  );
  fs.writeFileSync(
    path.join(v1Dir, 'skills', 'old-widget', 'SKILL.md'),
    '---\nname: old-widget\ndescription: Shared widget skill body text across versions so git rename detection triggers reliably.\n---\n\n# Widget\n\nDetailed invariant instructions preserved across rename.\n'
  );
  git(repoDir, ['add', '.']);
  git(repoDir, ['commit', '-m', 'Release v0.1.0']);
  git(repoDir, ['tag', 'v0.1.0']);

  // Rename old-widget -> new-widget in v0.2.0
  const v2Dir = path.join(repoDir, 'plugins', 'new-widget');
  fs.mkdirSync(path.join(v2Dir, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(v2Dir, 'skills', 'new-widget'), { recursive: true });
  fs.writeFileSync(
    path.join(v2Dir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'new-widget', version: '0.2.0', description: 'Shared widget description text for similarity.' }, null, 2)
  );
  fs.writeFileSync(
    path.join(v2Dir, 'skills', 'new-widget', 'SKILL.md'),
    '---\nname: new-widget\ndescription: Shared widget skill body text across versions so git rename detection triggers reliably.\n---\n\n# Widget\n\nDetailed invariant instructions preserved across rename.\n'
  );
  fs.rmSync(v1Dir, { recursive: true, force: true });
  git(repoDir, ['add', '-A']);
  git(repoDir, ['commit', '-m', 'Release v0.2.0']);
  git(repoDir, ['tag', 'v0.2.0']);

  const detected = detectTagMigrations(repoDir, 'v0.1.0', 'v0.2.0');
  assert.ok(detected.pluginMigrations.some((m) => m.from === 'old-widget' && m.to === 'new-widget'));
  assert.ok(detected.skillMigrations.some((m) => m.from_skill === 'old-widget' && m.to_skill === 'new-widget'));
});
