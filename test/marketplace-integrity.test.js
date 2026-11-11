'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { auditMarketplace, extractVvComplements } = require('../scripts/audit-marketplace-integrity.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function git(cwd, args, extra = {}) {
  return execFileSync('git', args, Object.assign({ cwd, encoding: 'utf8' }, extra));
}

function makeFixtureRepo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gnox-mp-audit-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(
      {
        name: 'test-marketplace',
        plugins: [
          { name: 'alpha-plugin', source: './plugins/alpha-plugin' },
          { name: 'beta-plugin', source: './plugins/beta-plugin' },
        ],
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(dir, '.claude-plugin', 'migrations.json'),
    JSON.stringify(
      {
        schema_version: 1,
        marketplace: 'test-marketplace',
        plugin_migrations: [
          {
            from: 'legacy-alpha',
            to: 'alpha-plugin',
            since: 'v0.1.0',
            reason: 'renamed',
            bridge_retained: false,
          },
        ],
        skill_migrations: [
          {
            from_plugin: 'legacy-alpha',
            from_skill: 'legacy-alpha',
            to_plugin: 'alpha-plugin',
            to_skill: 'alpha-plugin',
            since: 'v0.1.0',
            reason: 'renamed',
          },
        ],
      },
      null,
      2
    )
  );

  for (const name of ['alpha-plugin', 'beta-plugin']) {
    const pDir = path.join(dir, 'plugins', name);
    fs.mkdirSync(path.join(pDir, '.claude-plugin'), { recursive: true });
    fs.mkdirSync(path.join(pDir, 'skills', name), { recursive: true });
    fs.mkdirSync(path.join(pDir, 'hooks'), { recursive: true });
    fs.writeFileSync(
      path.join(pDir, '.claude-plugin', 'plugin.json'),
      JSON.stringify({ name, version: '0.1.0' }, null, 2)
    );
    fs.writeFileSync(
      path.join(pDir, 'skills', name, 'SKILL.md'),
      `---\nname: ${name}\ndescription: Test skill ${name}\n---\n\n# ${name}\n`
    );
    fs.writeFileSync(
      path.join(pDir, 'README.md'),
      `# ${name}\n\nInstalls stand-alone and dovetails with companion plugins.\n`
    );
    fs.writeFileSync(
      path.join(pDir, 'hooks', 'check.js'),
      `'use strict';\nconst fs = require('fs');\nvoid fs;\n`
    );
  }

  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'VV.md'),
    [
      '---',
      'plugin: alpha-plugin',
      'version: 0.1.0',
      'complements:',
      '  - plugin: beta-plugin',
      '    when_installed: Coordinates with beta-plugin.',
      '    when_absent: Runs standalone fallback cleanly.',
      '---',
      '',
      '# V&V',
      '',
    ].join('\n')
  );

  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Repo Instructions\n');
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Agent Instructions\n');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Marketplace README\n');

  return dir;
}

test('live gnomatix-oss-skills repository passes all marketplace integrity checks', () => {
  const report = auditMarketplace(REPO_ROOT);
  assert.equal(
    report.ok,
    true,
    `expected 0 violations on live repo, got:\n${JSON.stringify(report.findings, null, 2)}`
  );
  assert.equal(report.findings.length, 0);
});

test('clean minimal fixture passes auditMarketplace', (t) => {
  const dir = makeFixtureRepo(t);
  const report = auditMarketplace(dir);
  assert.equal(report.ok, true, JSON.stringify(report.findings));
});

test('flags hard plugin.json dependencies that break Tier 0 standalone installability', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'alpha-plugin', version: '0.1.0', dependencies: ['beta-plugin'] }, null, 2)
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'standalone-no-hard-dependencies'));
});

test('flags committed or vendored node_modules inside plugins/', (t) => {
  const dir = makeFixtureRepo(t);
  fs.mkdirSync(path.join(dir, 'plugins', 'alpha-plugin', 'hooks', 'node_modules', 'graceful-fs'), {
    recursive: true,
  });
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'zero-plugin-node-modules'));
});

test('flags unapproved child_process import in runtime hook scripts while ignoring hooks/test/', (t) => {
  const dir = makeFixtureRepo(t);
  fs.mkdirSync(path.join(dir, 'plugins', 'alpha-plugin', 'hooks', 'test'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'hooks', 'test', 'runner.test.js'),
    `const { spawnSync } = require('child_process'); void spawnSync;\n`
  );
  const cleanWithTest = auditMarketplace(dir);
  assert.equal(cleanWithTest.ok, true, JSON.stringify(cleanWithTest.findings));

  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'hooks', 'check.js'),
    `const { execSync } = require('child_process'); void execSync;\n`
  );
  const failing = auditMarketplace(dir);
  assert.equal(failing.ok, false);
  assert.ok(failing.findings.some((f) => f.rule === 'hook-portability-no-child-process'));
});

test('flags filesystem symlinks/junctions and mode-120000 Git symlinks (no-git-symlinks)', (t) => {
  const dir = makeFixtureRepo(t);
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Test']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['add', '.']);
  const blob = git(dir, ['hash-object', '-w', '--stdin'], {
    input: '../../plugins/alpha-plugin/skills/alpha-plugin',
  }).trim();
  git(dir, ['update-index', '--add', '--cacheinfo', `120000,${blob},.agents/skills/alpha-plugin`]);

  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'no-git-symlinks'));
});

test('flags undocumented tag-shipped plugin/skill removals in migrations-manifest-and-tags', (t) => {
  const dir = makeFixtureRepo(t);
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Test']);
  git(dir, ['config', 'user.email', 'test@example.com']);

  // Create an unmigrated old plugin in tag v0.0.9
  const oldDir = path.join(dir, 'plugins', 'forgotten-plugin');
  fs.mkdirSync(path.join(oldDir, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(oldDir, 'skills', 'forgotten-skill'), { recursive: true });
  fs.writeFileSync(
    path.join(oldDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'forgotten-plugin', version: '0.0.9' }, null, 2)
  );
  fs.writeFileSync(
    path.join(oldDir, 'skills', 'forgotten-skill', 'SKILL.md'),
    '---\nname: forgotten-skill\ndescription: Old\n---\n'
  );
  git(dir, ['add', '.']);
  git(dir, ['commit', '-m', 'Release v0.0.9']);
  git(dir, ['tag', 'v0.0.9']);

  // Remove forgotten-plugin without recording it in migrations.json
  fs.rmSync(oldDir, { recursive: true, force: true });
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-m', 'Drop forgotten-plugin without migration']);

  const failing = auditMarketplace(dir);
  assert.equal(failing.ok, false);
  assert.ok(failing.findings.some((f) => f.rule === 'migrations-manifest-and-tags' && f.message.includes('forgotten-plugin')));

  // Recording it in migrations.json resolves the violation
  fs.writeFileSync(
    path.join(dir, '.claude-plugin', 'migrations.json'),
    JSON.stringify(
      {
        schema_version: 1,
        marketplace: 'test-marketplace',
        plugin_migrations: [
          { from: 'legacy-alpha', to: 'alpha-plugin', since: 'v0.1.0', reason: 'renamed', bridge_retained: false },
          { from: 'forgotten-plugin', to: 'beta-plugin', since: 'v0.1.0', reason: 'renamed', bridge_retained: false },
        ],
        skill_migrations: [
          {
            from_plugin: 'legacy-alpha',
            from_skill: 'legacy-alpha',
            to_plugin: 'alpha-plugin',
            to_skill: 'alpha-plugin',
            since: 'v0.1.0',
            reason: 'renamed',
          },
          {
            from_plugin: 'forgotten-plugin',
            from_skill: 'forgotten-skill',
            to_plugin: 'beta-plugin',
            to_skill: 'beta-plugin',
            since: 'v0.1.0',
            reason: 'renamed',
          },
        ],
      },
      null,
      2
    )
  );
  const passing = auditMarketplace(dir);
  assert.equal(passing.ok, true, JSON.stringify(passing.findings));
});

test('flags unauthorized per-plugin isolationist escape hatch in steering docs', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'CLAUDE.md'),
    `# CLAUDE\n\n## Per-plugin scope\n\nDo not assume that any one plugin's directives apply across other plugins.\n`
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-isolation-escape'));
});

test('flags hooks/node_modules vendoring instructions', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'AGENTS.md'),
    `# AGENTS\n\nVendor these into the plugin's \`hooks/node_modules/\` and Commit the vendored \`node_modules/\` to the repo.\n`
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-node-modules-vendoring'));
});

test('flags live marketplace sibling plugin placed inside ignore: [...] config examples', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'README.md'),
    `# alpha-plugin\n\n\`\`\`yaml\nignore: [beta-plugin]\n\`\`\`\n`
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-sibling-ignore-example'));
});

test('flags stale "not yet in this repository" claims and false Claude-Code-exclusive hook/marketplace claims', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'skills', 'alpha-plugin', 'SKILL.md'),
    `---\nname: alpha-plugin\ndescription: Test\n---\n\nThe beta-plugin skill is not yet in this repository.\n`
  );
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'hooks', 'README.md'),
    `# Hooks\n\nHooks are Claude-Code-specific.\n`
  );
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    `# Marketplace\n\nClaude Code installs from it.\n`
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-stale-missing-companion'));
  assert.ok(
    report.findings.some(
      (f) => f.rule === 'context-pollution-false-hook-silo' && f.file === 'plugins/alpha-plugin/hooks/README.md'
    )
  );
  assert.ok(
    report.findings.some((f) => f.rule === 'context-pollution-claude-only-claim' && f.file === 'README.md')
  );
});

test('flags invalid VV.md complements entries', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'VV.md'),
    [
      '---',
      'plugin: alpha-plugin',
      'version: 0.1.0',
      'complements:',
      '  - plugin: nonexistent-plugin',
      '    when_installed: Uses nonexistent-plugin.',
      '---',
      '',
      '# V&V',
      '',
    ].join('\n')
  );

  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'vv-complements-valid'));
});

test('extractVvComplements parses js-yaml folded (>-) and wrapped multi-line scalars accurately', () => {
  const fm = [
    'skill-vv: 1',
    'name: gnox',
    'complements:',
    '  - plugin: skill-vv',
    '    when_installed: >-',
    '      Combines session topology discovery with per-plugin VV.md requirement checks and',
    '      model/platform verification records.',
    '    when_absent: >-',
    '      Injects GNOMATIX Namespacing Convention, active plugin pairings, and detected PATH/mise tools',
    '      standalone.',
    '  - plugin: update-readme-images',
    '    when_installed: Supplies workspace_root inheritance',
    '      across nested subdirectories.',
    '    when_absent: Runs standalone.',
    'procedures: []',
  ].join('\n');

  const comps = extractVvComplements(fm);
  assert.equal(comps.length, 2);
  assert.equal(comps[0].plugin, 'skill-vv');
  assert.match(comps[0].when_installed, /Combines session topology discovery/);
  assert.match(comps[0].when_absent, /Injects GNOMATIX Namespacing Convention/);
  assert.equal(comps[1].plugin, 'update-readme-images');
  assert.equal(comps[1].when_installed, 'Supplies workspace_root inheritance across nested subdirectories.');
  assert.equal(comps[1].when_absent, 'Runs standalone.');
});
