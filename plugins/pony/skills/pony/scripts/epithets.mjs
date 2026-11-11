#!/usr/bin/env node
// pony lexicon: the author's epithets (each mapped to its subgenre tags) and terms, kept
// compressed as BASE64(word):value pairs, the form of the GNOMATIX sanitization skill.
//
//   node epithets.mjs decode                 print every epithet and term, decoded
//   node epithets.mjs match [--tags] <file|-> the epithets in a text, with their tags
//   node epithets.mjs term <role>            print the term recorded under a role
//   node epithets.mjs encode <word>          the base64 form of a word, for a new row
//
// The rows come from ../references/lexicon.rules; PONY_EPITHETS and PONY_TERMS in the
// environment override the file's lines. Exit codes: 0 found; 1 nothing found or unknown
// role; 2 usage error. Node 18+, no dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEXICON = path.join(HERE, '..', 'references', 'lexicon.rules');

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// KEY = "b64:value,b64:value" lines from the rules file.
function fileVars(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*"(.*)"\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function parseRules(spec, warn) {
  const rows = [];
  for (const part of String(spec || '').split(',')) {
    const p = part.trim();
    if (!p) continue;
    const i = p.indexOf(':');
    if (i <= 0 || i === p.length - 1) { warn(`skipped malformed rule part: ${p}`); continue; }
    const word = Buffer.from(p.slice(0, i), 'base64').toString('utf8');
    if (!word || Buffer.from(word, 'utf8').toString('base64') !== p.slice(0, i)) {
      warn(`skipped rule part that is not base64: ${p}`);
      continue;
    }
    rows.push({ word, value: p.slice(i + 1) });
  }
  return rows;
}

export function loadLexicon(env = process.env, warn = (m) => process.stderr.write(m + '\n')) {
  const vars = fileVars(readText(LEXICON));
  const epithets = parseRules(env.PONY_EPITHETS ?? vars.PONY_EPITHETS, warn)
    .map(({ word, value }) => ({ word, tags: value.split('/').filter(Boolean) }));
  const terms = parseRules(env.PONY_TERMS ?? vars.PONY_TERMS, warn)
    .map(({ word, value }) => ({ word, role: value }));
  return { epithets, terms };
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Every epithet present in the text, whole-word and case-insensitive, in order of first appearance.
export function matchEpithets(text, lexicon) {
  const hits = [];
  for (const e of lexicon.epithets) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(e.word).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu');
    const m = re.exec(text);
    if (m) hits.push({ word: e.word, tags: e.tags, index: m.index });
  }
  return hits.sort((a, b) => a.index - b.index);
}

function readInput(arg) {
  if (arg === '-') { try { return fs.readFileSync(0, 'utf8'); } catch { return ''; } }
  const t = readText(arg);
  if (!t && !fs.existsSync(arg)) { process.stderr.write(`no such file: ${arg}\n`); process.exit(2); }
  return t;
}

function usage(msg) {
  if (msg) process.stderr.write(msg + '\n');
  process.stderr.write('usage: epithets.mjs decode | match [--tags] <file|-> | term <role> | encode <word>\n');
  process.exit(2);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'encode') {
    if (!rest.length) usage('encode needs a word');
    process.stdout.write(Buffer.from(rest.join(' '), 'utf8').toString('base64') + '\n');
    return 0;
  }
  const lex = loadLexicon();
  if (cmd === 'decode') {
    for (const e of lex.epithets) process.stdout.write(`epithet\t${e.word}\t${e.tags.join('/')}\n`);
    for (const t of lex.terms) process.stdout.write(`term\t${t.role}\t${t.word}\n`);
    return 0;
  }
  if (cmd === 'term') {
    if (rest.length !== 1) usage('term needs one role');
    const found = lex.terms.filter((t) => t.role === rest[0]);
    if (!found.length) {
      process.stderr.write(`no term recorded under role: ${rest[0]} (roles: ${[...new Set(lex.terms.map((t) => t.role))].join(', ')})\n`);
      return 1;
    }
    for (const t of found) process.stdout.write(t.word + '\n');
    return 0;
  }
  if (cmd === 'match') {
    const tagsOnly = rest[0] === '--tags';
    const src = tagsOnly ? rest[1] : rest[0];
    if (!src) usage('match needs a file or -');
    const hits = matchEpithets(readInput(src), lex);
    if (!hits.length) return 1;
    if (tagsOnly) {
      const seen = [];
      for (const h of hits) for (const t of h.tags) if (!seen.includes(t)) seen.push(t);
      process.stdout.write(seen.join(' ') + '\n');
    } else {
      for (const h of hits) process.stdout.write(`${h.word}\t${h.tags.join('/')}\n`);
    }
    return 0;
  }
  usage(cmd ? `unknown command: ${cmd}` : '');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
