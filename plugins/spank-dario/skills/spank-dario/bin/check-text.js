#!/usr/bin/env node
// spank-dario: check a PR title and body, or any text, for tool attribution.
//
// Usage: node bin/check-text.js <file>      (or "-" to read stdin)
//        node bin/check-text.js --fix <file> (write the text without the lines to stdout)
// Exit 1 when attribution lines are found (without --fix).

'use strict';
const fs = require('fs');
const path = require('path');
const { findAttribution, stripAttribution } = require(path.join(__dirname, '..', 'lib', 'attribution.js'));

function readInput(arg) {
  if (!arg || arg === '-') return fs.readFileSync(0, 'utf8');
  return fs.readFileSync(arg, 'utf8');
}

try {
  const args = process.argv.slice(2);
  const fix = args[0] === '--fix';
  const text = readInput(fix ? args[1] : args[0]);
  if (fix) {
    process.stdout.write(stripAttribution(text));
  } else {
    const hits = findAttribution(text);
    for (const h of hits) process.stdout.write(`line ${h.line} (${h.rule}): ${h.text}\n`);
    process.exitCode = hits.length ? 1 : 0;
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.code || err.message}\n`);
  process.exitCode = 2;
}
