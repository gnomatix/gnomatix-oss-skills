#!/usr/bin/env node
// spank-dario: check every quotation in SKILL.md and in each references/<cc>/skill.md against the
// source files (every other file under references/). Usage: node bin/verify-quotes.js [--quiet]
// A quotation is a double-quoted span of 15 or more characters. Spans that are only the text
// between two separate quotations (starting or ending with a space, starting with punctuation, or holding ** or `) are skipped.
// Whitespace and curly versus straight quote marks are ignored. Exit 1 if any is missing.
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const norm = s => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/\\"/g, '"');
const sources = [], checked = [path.join(root, 'SKILL.md')];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'skill.md') checked.push(p);
    else if (/\.(md|json)$/.test(e.name)) sources.push(norm(fs.readFileSync(p, 'utf8')));
  }
})(path.join(root, 'references'));
let found = 0; const missing = [];
for (const f of checked) {
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(/"([^"]{15,}?)"/g)) {
      const span = m[1];
      if (/^\s|\s$/.test(span) || /^[).,:;!?]/.test(span) || span.includes('**') || span.includes('`')) continue;
      const pieces = norm(span).replace(/\.$/, '').split(/\s*(?:\[\.\.\.\]|…)\s*/).filter(p => p.length > 6);
      if (sources.some(c => pieces.every(p => c.includes(p)))) found++;
      else missing.push(`${path.relative(root, f)} line ${i + 1}: "${span.slice(0, 110)}"`);
    }
  });
}
if (!process.argv.includes('--quiet')) for (const m of missing) console.log('NOT IN SOURCES', m);
console.log(`quotations checked: ${found + missing.length}, found: ${found}, missing: ${missing.length}`);
process.exitCode = missing.length ? 1 : 0;
