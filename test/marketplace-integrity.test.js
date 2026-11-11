'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { auditMarketplace, extractVvComplements } = require('../scripts/audit-marketplace-integrity.js');

const REPO_ROOT = path.resolve(__dirname, '..');

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

  for (const farm of ['.agents/skills', '.github/skills', '.kiro/skills']) {
    for (const name of ['alpha-plugin', 'beta-plugin']) {
      const targetDir = path.join(dir, farm, name);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'SKILL.md'), `# ${name}\n`);
    }
  }

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

test('flags stale "not yet in this repository" claims and false "Hooks apply to Claude Code only" claims', (t) => {
  const dir = makeFixtureRepo(t);
  fs.writeFileSync(
    path.join(dir, 'plugins', 'alpha-plugin', 'skills', 'alpha-plugin', 'SKILL.md'),
    `---\nname: alpha-plugin\ndescription: Test\n---\n\nThe beta-plugin skill is not yet in this repository.\n`
  );
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    `# Marketplace\n\nHooks apply to Claude Code only.\n`
  );
  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-stale-missing-companion'));
  assert.ok(report.findings.some((f) => f.rule === 'context-pollution-false-hook-silo'));
});

test('flags invalid or self-referential VV.md complements entries and missing symlink farm entries', (t) => {
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
  fs.rmSync(path.join(dir, '.github', 'skills', 'beta-plugin'), { recursive: true, force: true });

  const report = auditMarketplace(dir);
  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === 'vv-complements-valid'));
  assert.ok(report.findings.some((f) => f.rule === 'symlink-farms-complete'));
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

