#!/usr/bin/env node
// Set one plugin's description in both manifests that carry it:
// .claude-plugin/marketplace.json (the plugin's entry) and
// plugins/<name>/.claude-plugin/plugin.json.
//
//   node scripts/set-plugin-description.js <plugin> --text-file <file>
//   node scripts/set-plugin-description.js <plugin> --from marketplace|plugin
//
// --from copies the description one manifest already has into the other.
// Refuses a description longer than the claude.ai hosted sync limit
// (scripts/hosted-sync-limits.js), and writes nothing when it refuses.
'use strict';

const fs = require('fs');
const path = require('path');
const { PLUGIN_DESCRIPTION_MAX } = require('./hosted-sync-limits.js');

const toJson = (v) => JSON.stringify(v, null, 2) + '\n';

function setPluginDescription(repoRoot, plugin, description) {
  if (description.length > PLUGIN_DESCRIPTION_MAX) {
    throw new Error(`${plugin}: description is ${description.length} characters; the limit is ${PLUGIN_DESCRIPTION_MAX}`);
  }
  const marketplacePath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
  const pluginPath = path.join(repoRoot, 'plugins', plugin, '.claude-plugin', 'plugin.json');
  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
  const entry = (marketplace.plugins || []).find((p) => p.name === plugin);
  if (!entry) throw new Error(`${plugin}: no entry in .claude-plugin/marketplace.json`);
  entry.description = description;
  manifest.description = description;
  fs.writeFileSync(marketplacePath, toJson(marketplace), 'utf8');
  fs.writeFileSync(pluginPath, toJson(manifest), 'utf8');
  return { plugin, length: description.length };
}

function currentDescription(repoRoot, plugin, source) {
  if (source === 'marketplace') {
    const marketplace = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf8'));
    const entry = (marketplace.plugins || []).find((p) => p.name === plugin);
    if (!entry) throw new Error(`${plugin}: no entry in .claude-plugin/marketplace.json`);
    return entry.description || '';
  }
  if (source === 'plugin') {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, 'plugins', plugin, '.claude-plugin', 'plugin.json'), 'utf8')).description || '';
  }
  throw new Error(`--from takes "marketplace" or "plugin", not "${source}"`);
}

function main(argv) {
  const [plugin, flag, value] = argv;
  if (!plugin || !value || (flag !== '--text-file' && flag !== '--from')) {
    process.stderr.write('usage: set-plugin-description.js <plugin> --text-file <file> | --from marketplace|plugin\n');
    return 2;
  }
  const repoRoot = path.resolve(__dirname, '..');
  try {
    const description = flag === '--from'
      ? currentDescription(repoRoot, plugin, value)
      : fs.readFileSync(value, 'utf8').trim();
    const done = setPluginDescription(repoRoot, plugin, description);
    process.stdout.write(`${done.plugin}: description set in both manifests (${done.length} characters)\n`);
    return 0;
  } catch (err) {
    process.stderr.write(`refused: ${err.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { setPluginDescription, currentDescription };
