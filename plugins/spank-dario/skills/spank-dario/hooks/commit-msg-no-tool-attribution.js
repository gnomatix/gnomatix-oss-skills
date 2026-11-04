#!/usr/bin/env node
// spank-dario git commit-msg hook: reject a commit whose message carries tool attribution.
//
// Git calls the commit-msg hook with the path of the message file. The sh wrapper
// hooks/git/commit-msg runs this script with node, so it works with Git for Windows too.
// Install for one repo:   git config core.hooksPath <skill>/hooks/git
// or copy hooks/git/commit-msg into .git/hooks/ and point it at this file.
//
// Exit 1 rejects the commit and lists the lines. Set SPANK_DARIO_FIX=1 to remove the
// lines from the message instead and let the commit proceed.

'use strict';
const fs = require('fs');
const path = require('path');
const { findAttribution, stripAttribution } = require(path.join(__dirname, '..', 'lib', 'attribution.js'));
const { logIncident } = require(path.join(__dirname, '..', 'lib', 'incidents.js'));

// Log each blocked line as an attribution incident, for bin/estimate.js. Never block on a log error.
function logHits(hits, action) {
  try {
    for (const h of hits) logIncident({ type: 'attribution', count: 1, note: `commit-msg hook ${action} in ${process.cwd()}: ${h.text.trim().slice(0, 160)}` });
  } catch (err) {
    process.stderr.write(`spank-dario commit-msg: incident log: ${err.code || err.message}\n`);
  }
}

function main() {
  const file = process.argv[2];
  if (!file) {
    process.stderr.write('spank-dario commit-msg: no message file given\n');
    return 0;
  }
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`spank-dario commit-msg: cannot read ${file}: ${err.code || err.message}\n`);
    return 0;
  }
  const hits = findAttribution(text);
  if (!hits.length) return 0;

  logHits(hits, process.env.SPANK_DARIO_FIX === '1' ? 'removed' : 'rejected');
  if (process.env.SPANK_DARIO_FIX === '1') {
    const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
    try {
      fs.writeFileSync(tmp, stripAttribution(text), 'utf8');
      fs.renameSync(tmp, file);
    } catch (err) {
      try { fs.unlinkSync(tmp); } catch { /* best effort */ }
      process.stderr.write(`spank-dario commit-msg: cannot rewrite ${file}: ${err.code || err.message}\n`);
      return 1;
    }
    process.stderr.write(`spank-dario commit-msg: removed ${hits.length} tool-attribution line(s)\n`);
    return 0;
  }

  process.stderr.write('spank-dario commit-msg: the message claims authorship for a software tool. Remove these lines:\n');
  for (const h of hits) process.stderr.write(`  line ${h.line} (${h.rule}): ${h.text}\n`);
  return 1;
}

process.exitCode = main();
