// logic-decomposer: the numbered sentence list and the empty tables of steps 1, 3, 4, 6 and 7.
//
//   node skeleton.mjs <textfile>            print the skeleton
//   node skeleton.mjs <textfile> --json     the same structure as JSON
//   node skeleton.mjs - [--json]            read the text from stdin
//   options: --wrap N   wrap the quoted columns at N characters (off by default)
//
// Splits the text into sentences (abbreviations such as "e.g.", "Dr.", "vs.", initials and
// decimals do not end a sentence; a period inside a closing quote or bracket does; every
// bullet or numbered list item is one sentence), numbers them S1…Sn, and prints the
// SENTENCES list, an empty P-TABLE with one placeholder row per sentence (the step 3
// columns: formal, supports, cites, K and h), a CONDITIONALS table pre-filled with every
// sentence that carries a conditional indicator and the indicator found, an empty GRADES
// table (the step 6 columns, with the starting certainty), and the VALIDITY checklist with
// the coverage count pre-computed. The agent fills in the ids, roles, forms and grades.
// Empty input (or input with no sentence) gives zero sentences, the table headers with no
// rows and "coverage: 0 sentences, 0 dispositions", exit 0. A leading BOM and CRLF line
// ends are read; the output is LF. A file that cannot be read, or a bad option, exits 2.
// Node 18+, no dependencies. Also importable: splitSentences, findIndicators, skeleton, render.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---- sentence splitting ---------------------------------------------------------------

// A period after one of these never ends a sentence.
const ABBREV = new Set([
  'dr', 'mr', 'mrs', 'ms', 'mx', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'cf', 'al', 'fig', 'figs',
  'eq', 'eqs', 'approx', 'ca', 'inc', 'ltd', 'co', 'corp', 'gen', 'gov', 'sen', 'rep', 'rev', 'hon',
  'mt', 'ft', 'pp', 'vol', 'vols', 'ch', 'sec', 'ed', 'eds', 'trans', 'dept', 'univ', 'est', 'viz',
  'resp', 'i.e', 'e.g', 'u.s', 'u.k', 'u.n', 'a.m', 'p.m', 'ph.d', 'm.d', 'b.c', 'a.d', 'jan', 'feb',
  'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
]);
// A period after one of these does not end a sentence when a digit follows ("No. 5", "p. 3").
const ABBREV_BEFORE_DIGIT = new Set(['no', 'nos', 'p', 'pp', 'fig', 'vol', 'ch', 'sec', 'eq', 'art', 'para']);

const BULLET = /^\s*(?:[-*•‣◦⁃]|\d{1,3}[.)]|\(\d{1,3}\))\s+(.*\S)\s*$/;

function isAbbreviation(word, nextChar) {
  const w = word.replace(/^[("'“‘[]+/, '').toLowerCase();
  if (!w) return false;
  if (ABBREV.has(w)) return true;
  if (ABBREV_BEFORE_DIGIT.has(w) && /\d/.test(nextChar)) return true;
  if (/^[a-z]$/.test(w)) return true; // an initial: "J. Smith"
  if (/^(?:[a-z]\.)+[a-z]$/.test(w)) return true; // dotted: "N.Y.", "U.S."
  return false;
}

// One paragraph (no line breaks) into sentences.
function splitParagraph(text) {
  const out = [];
  const re = /([.!?]+)(["'”’)\]]*)(?=\s|$)/g;
  let start = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const rest = text.slice(end);
    const nextChar = (rest.match(/^\s*(\S)/) || [])[1] || '';
    let boundary = true;
    if (!/[!?]/.test(m[1])) {
      if (nextChar && /[a-z]/.test(nextChar)) boundary = false; // "e.g. about", "N.Y. from"
      const before = text.slice(start, m.index);
      const word = (before.match(/(\S+)$/) || [])[1] || '';
      if (nextChar && isAbbreviation(word, nextChar)) boundary = false;
    }
    if (!boundary) continue;
    const s = text.slice(start, end).trim();
    if (s) out.push(s);
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

export function splitSentences(input) {
  const lines = String(input).replace(/^﻿/, '').split(/\r?\n/);
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join(' ').replace(/\s+/g, ' ').trim() });
    para = [];
  };
  for (const line of lines) {
    const b = BULLET.exec(line);
    if (b) { flush(); blocks.push({ kind: 'bullet', text: b[1].replace(/\s+/g, ' ').trim() }); continue; }
    if (!line.trim()) { flush(); continue; }
    para.push(line.trim());
  }
  flush();
  const out = [];
  for (const blk of blocks) {
    if (blk.kind === 'bullet') { if (blk.text) out.push(blk.text); } else out.push(...splitParagraph(blk.text));
  }
  return out;
}

// ---- conditional indicators (logic-decomposer step 4) ---------------------------------

// The indicator words of SKILL.md step 4 and logic-toolbox method 2, longest first so
// "if and only if" is not also read as "only if" and "if", "the only" and "only if" are not
// also bare "only", and "none but" is not also "none".
const INDICATORS = [
  ['if and only if', /\bif\s+and\s+only\s+if\b/gi],
  ['if but only if', /\bif\s+but\s+only\s+if\b/gi],
  ['but not both', /\bbut\s+not\s+both\b/gi],
  ['in order to', /\bin\s+order\s+to\b/gi],
  ['people who', /\bpeople\s+who\b/gi],
  ['depends on', /\bdepend(?:s|ed|ing)?\s+on\b/gi],
  ['none except', /\bnone\s+except\b/gi],
  ['none but', /\bnone\s+but\b/gi],
  ['only when', /\bonly\s+when\b/gi],
  ['only if', /\bonly\s+if\b/gi],
  ['the only', /\bthe\s+only\b/gi],
  ['only', /\bonly\b/gi],
  ['then', /\bthen\b/gi],
  ['whenever', /\bwhenever\b/gi],
  ['requires', /\brequire[sd]?\b/gi],
  ['without', /\bwithout\b/gi],
  ['unless', /\bunless\b/gi],
  ['except', /\bexcept\b/gi],
  ['either', /\beither\b/gi],
  ['until', /\buntil\b/gi],
  ['every', /\bevery\b/gi],
  ['none', /\bnone\b/gi],
  ['each', /\beach\b/gi],
  ['must', /\bmust\b/gi],
  ['when', /\bwhen\b/gi],
  ['all', /\ball\b/gi],
  ['any', /\bany\b/gi],
  ['if', /\bif\b/gi],
  ['no', /\bno\b/gi],
  ['or', /\bor\b/gi],
];

export function findIndicators(sentence) {
  let s = String(sentence);
  const found = [];
  for (const [name, re] of INDICATORS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      found.push({ name, at: m.index });
      // Mask the match so a shorter indicator cannot match inside it.
      s = s.slice(0, m.index) + ' '.repeat(m[0].length) + s.slice(m.index + m[0].length);
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.name);
}

// ---- quantifiers (logic-decomposer step 5) & hedge/booster markers (step 6) ------------

const QUANTIFIERS = [
  ['a small number', 'proportion, unquantified', /\ba\s+small\s+number\b/gi],
  ['not all', 'existential (negated universal)', /\bnot\s+all\b/gi],
  ['the one', 'universal (unique)', /\bthe\s+one\b/gi],
  ['a share', 'proportion, unquantified', /\ba\s+share\b/gi],
  ['every', 'universal', /\bevery\b/gi],
  ['none', 'universal (negative)', /\bnone\b/gi],
  ['some', 'existential', /\bsome\b/gi],
  ['most', 'proportion (>50%)', /\bmost\b/gi],
  ['many', 'proportion, unquantified', /\bmany\b/gi],
  ['each', 'universal', /\beach\b/gi],
  ['all', 'universal', /\ball\b/gi],
  ['few', 'proportion, unquantified', /\bfew\b/gi],
  ['any', 'universal', /\bany\b/gi],
  ['no', 'universal (negative)', /\bno\b/gi],
];

export function findQuantifiers(sentence) {
  let s = String(sentence);
  const found = [];
  for (const [quantifier, kind, re] of QUANTIFIERS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      found.push({ quantifier, kind, at: m.index });
      s = s.slice(0, m.index) + ' '.repeat(m[0].length) + s.slice(m.index + m[0].length);
    }
  }
  return found.sort((a, b) => a.at - b.at).map(({ quantifier, kind }) => ({ quantifier, kind }));
}

const MARKERS = [
  ['almost no chance', 'hedge', 'S1', /\balmost\s+no\s+chance\b/gi],
  ['highly improbable', 'hedge', 'S2', /\bhighly\s+improbable\b/gi],
  ['very unlikely', 'hedge', 'S2', /\bvery\s+unlikely\b/gi],
  ['may or may not', 'hedge', 'S4', /\bmay\s+or\s+may\s+not\b/gi],
  ['roughly even', 'hedge', 'S4', /\broughly\s+even\b/gi],
  ['some evidence', 'hedge', 'S?', /\bsome\s+evidence\b/gi],
  ['we believe', 'hedge', 'S5', /\bwe\s+believe\b/gi],
  ['very likely', 'booster', 'S6', /\bvery\s+likely\b/gi],
  ['highly probable', 'booster', 'S6', /\bhighly\s+probable\b/gi],
  ['well established', 'booster', 'S6', /\bwell\s+established\b/gi],
  ['almost certain', 'booster', 'S7', /\balmost\s+certain\b/gi],
  ['it is clear that', 'booster', 'S7', /\bit\s+is\s+clear\s+that\b/gi],
  ['the evidence shows', 'booster', 'S7', /\bthe\s+evidence\s+shows\b/gi],
  ['everyone knows', 'booster', 'S7', /\beveryone\s+knows\b/gi],
  ['in fact', 'booster', 'S7', /\bin\s+fact\b/gi],
  ['at all', 'booster', 'S7', /\bat\s+all\b/gi],
  ['definitely', 'booster', 'S7', /\bdefinitely\b/gi],
  ['certain', 'booster', 'S7', /\bcertain\b/gi],
  ['halved', 'booster', 'S7', /\bhalved\b/gi],
  ['unlikely', 'hedge', 'S3', /\bunlikely\b/gi],
  ['doubtful', 'hedge', 'S3', /\bdoubtful\b/gi],
  ['probably', 'hedge', 'S5', /\bprobably\b/gi],
  ['roughly', 'hedge', 'S5', /\broughly\b/gi],
  ['possible', 'hedge', 'S?', /\bpossible\b/gi],
  ['perhaps', 'hedge', 'S?', /\bperhaps\b/gi],
  ['suggests', 'hedge', 'S?', /\bsuggests\b/gi],
  ['likely', 'hedge', 'S5', /\blikely\b/gi],
  ['about', 'hedge', 'S5', /\babout\b/gi],
  ['might', 'hedge', 'S?', /\bmight\b/gi],
  ['could', 'hedge', 'S?', /\bcould\b/gi],
  ['mixed', 'hedge', 'S4', /\bmixed\b/gi],
  ['remote', 'hedge', 'S1', /\bremote\b/gi],
];

export function findMarkers(sentence) {
  let s = String(sentence);
  const found = [];
  for (const [marker, kind, band, re] of MARKERS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      found.push({ marker, kind, band, at: m.index });
      s = s.slice(0, m.index) + ' '.repeat(m[0].length) + s.slice(m.index + m[0].length);
    }
  }
  return found.sort((a, b) => a.at - b.at).map(({ marker, kind, band }) => ({ marker, kind, band }));
}

// ---- the skeleton -----------------------------------------------------------------------

export const CHECKS = ['coverage', 'traceability', 'nothing added', 'conditional direction', 'quantifier scope', 'entity consistency', 'round trip', 'grades complete'];

export function skeleton(text) {
  const sentences = splitSentences(text).map((t, i) => ({
    id: `S${i + 1}`,
    text: t,
    quantifiers: findQuantifiers(t),
    markers: findMarkers(t),
  }));
  const quoted = (t) => `"${t}"`;
  const ptable = sentences.map((s) => ({ id: '', sentence: s.id, role: '', proposition: quoted(s.text), formal: '', supports: '', cites: '', k: '', h: '' }));
  const conditionals = [];
  const quantifiers = [];
  for (const s of sentences) {
    const ind = findIndicators(s.text);
    if (ind.length) conditionals.push({ id: '', sentence: s.id, quoted: quoted(s.text), indicators: ind, form: '', contrapositive: '', kind: '' });
    for (const q of s.quantifiers) {
      quantifiers.push({ sentence: s.id, quantifier: q.quantifier, kind: q.kind, scope: '' });
    }
  }
  const grades = sentences.map((s) => ({
    id: '',
    proposition: quoted(s.text),
    evidence: '',
    certainty: '',
    basisCited: '',
    stated: '',
    markers: s.markers.map((m) => `"${m.marker}"`).join(', '),
    licensed: '',
    gradeDifference: '',
    verdict: '',
  }));
  const coverage = `${sentences.length} sentence${sentences.length === 1 ? '' : 's'}, 0 dispositions`;
  const checks = CHECKS.map((name) => ({ name, value: name === 'coverage' ? coverage : '' }));
  return { sentences, ptable, conditionals, quantifiers, grades, validity: { coverage, checks } };
}

// ---- rendering ------------------------------------------------------------------------------

function wrapCell(text, width) {
  if (!width || text.length <= width) return [text];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const prefix = lines.length ? ' ' : '';
    const candidate = cur ? `${cur} ${w}` : `${prefix}${w}`;
    if (cur && candidate.length > width) { lines.push(cur); cur = ` ${w}`; } else cur = candidate;
  }
  if (cur) lines.push(cur);
  return lines;
}

// rows: arrays of strings. wrapCols: indexes of columns to wrap at `wrap`.
function table(headers, rows, minWidths, wrapCols = [], wrap = 0) {
  const cellLines = rows.map((r) => r.map((c, j) => (wrapCols.includes(j) ? wrapCell(String(c), wrap) : [String(c)])));
  const widths = headers.map((h, j) => Math.max(minWidths[j] || 0, h.length, ...cellLines.map((r) => Math.max(...r[j].map((l) => l.length)))));
  const line = (cells) => cells.map((c, j) => (j === cells.length - 1 ? c : c.padEnd(widths[j]))).join(' | ').replace(/\s+$/, '');
  const out = [line(headers)];
  for (const r of cellLines) {
    const height = Math.max(...r.map((c) => c.length));
    for (let k = 0; k < height; k += 1) out.push(line(r.map((c) => c[k] || '')));
  }
  return out;
}

export function render(sk, wrap = 0) {
  const out = ['SENTENCES'];
  for (const s of sk.sentences) out.push(`${s.id}  ${s.text}`);
  out.push('', 'P-TABLE');
  // Column minimums are the widths of the SKILL.md examples, so an empty table has their shape.
  out.push(...table(
    ['id', 'sentence', 'role', 'proposition (quoted)', 'formal', 'supports', 'cites', 'K', 'h'],
    sk.ptable.map((p) => [p.id, p.sentence, p.role, p.proposition, p.formal, p.supports, p.cites, p.k, p.h]),
    [3, 8, 11, 37, 28, 8, 7, 2, 2], [3], wrap,
  ));
  out.push('', 'CONDITIONALS');
  out.push(...table(
    ['id', 'sentence', 'quoted', 'indicator', 'form', 'contrapositive', 'kind'],
    sk.conditionals.map((c) => [c.id, c.sentence, c.quoted, c.indicators.join(', '), c.form, c.contrapositive, c.kind]),
    [3, 8, 40, 9, 13, 15, 4], [2], wrap,
  ));
  out.push('', 'GRADES');
  out.push(...table(
    ['id', 'proposition (quoted)', 'evidence', 'certainty', 'basis cited', 'stated', 'markers', 'licensed', 'grade difference', 'verdict'],
    sk.grades.map((g) => [g.id, g.proposition, g.evidence, g.certainty, g.basisCited, g.stated, g.markers, g.licensed, g.gradeDifference, g.verdict]),
    [3, 33, 8, 22, 20, 6, 17, 8, 16, 7], [1], wrap,
  ));
  out.push('', 'VALIDITY');
  for (const c of sk.validity.checks) out.push(`${c.name}:${c.value ? ` ${c.value}` : ''}`);
  return out.join('\n');
}

// ---- CLI --------------------------------------------------------------------------------------

const USAGE = 'usage: node skeleton.mjs <textfile>|- [--json] [--wrap N]';

function readText(file) {
  try {
    if (file === '-') return fs.readFileSync(0, 'utf8');
    const p = path.resolve(process.cwd(), file);
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${file === '-' ? 'stdin' : file}: ${err.code || err.message}`);
  }
}

export function main(argv) {
  let file = null;
  let json = false;
  let wrap = 0;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--wrap') { wrap = Number(argv[i + 1]); i += 1; if (!Number.isFinite(wrap) || wrap < 10) throw new Error('--wrap must be a number of at least 10'); } else if (a.startsWith('--') && a !== '-') throw new Error(USAGE);
    else if (file === null) file = a;
    else throw new Error(USAGE);
  }
  if (file === null) throw new Error(USAGE);
  const sk = skeleton(readText(file));
  return json ? JSON.stringify(sk, null, 2) : render(sk, wrap);
}

function isMain() {
  try {
    const self = fileURLToPath(import.meta.url);
    const entry = path.resolve(process.argv[1] || '');
    const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
    return norm(self) === norm(entry);
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    process.stdout.write(`${main(process.argv.slice(2))}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
}
