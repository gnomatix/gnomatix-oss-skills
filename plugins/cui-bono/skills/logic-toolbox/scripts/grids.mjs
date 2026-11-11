// logic-toolbox: the ASCII grids of methods 1, 11 and 12, empty or filled.
//
//   node grids.mjs logic-grid --premises P1="..." P2="..." --conclusions C1="..." C2="..."
//   node grids.mjs logic-grid --json cells.json
//   node grids.mjs matrix --premises h1="..." h2="..." [--assumptions A1="..."]
//   node grids.mjs matrix --json cells.json
//   node grids.mjs cross-grid --items A,B,C --attributes "evaluator=X,Y,Z" "funder=P,Q,R"
//   node grids.mjs cross-grid --items A,B,C --attributes "evaluator=X,Y,Z" --json marks.json
//
// Options: --width N   longest `id "quote"` label in the LOGIC GRID before it is truncated
//                      with … and listed in full under the grid (default 40)
//
// JSON for logic-grid (method 11):
//   { premises: {P1: "..."}, conclusions: {C1: "..."},
//     cells: {"P1|C1": {acc: true, rel: true, suf: false, note: "E5/S7"}} }
//   A conclusion is unsupported when no cell in its column has acc ✓ and rel ✓; a premise is
//   idle when its row has no cell.
// JSON for matrix (method 12):
//   { premises: {h1: "quote" | {quote: "...", formula: "Funded -> Voluntary"}},
//     assumptions: {A1: "text" | {text: "...", formula: "Pause -> /Voluntary"}},
//     cells: {"h1|h3": {status: "ok"|"incompatible"|"under"|"entailed"|"undecidable",
//                       under: "A1", reason: "..."}} }
//   Cells print as o, X, X|A1, =, ?; `status` may also be written as the mark (o, X, =, ?).
//   Any other status, and a cell key whose two ids are not both held premises, is an error
//   (exit 2). The `under` value of an X|A cell must be an id listed under assumptions, never
//   a held-premise id: a pairwise cell never cites a held premise (method 12), and a
//   conflict that needs three held premises belongs in the Joint section. Anything else
//   there is an error (exit 2). A reason prints after the row: as `(reason)` when its cell
//   is the row's last, otherwise as `(<column id>: reason)`, so the columns stay aligned.
//   The Joint lines come from the formulas when every held premise has one (a model search;
//   method 8, at most 16 atoms), because pairwise cells cannot prove joint satisfiability;
//   without formulas, or when a formula does not parse or is past 16 atoms, only the
//   pairwise X cells are reported there. The Verdict line names the assumptions the
//   verdict depends on: those whose addition changes satisfiability (H satisfiable as
//   stated, not with the assumption added); none when H is already not satisfiable.
// JSON for cross-grid (method 1):
//   { items: ["A","B"], attributes: {evaluator: ["X","Y"]}, cells: {"A|X": "•", "A|Y": "X"} }
//   ("O" or "•" is the dot; "X" is the exclusion.)
//
// Glyphs are the ones SKILL.md uses: ✓ U+2713, ✗ U+2717, — U+2014, • U+2022, … U+2026.
// Node 18+, no dependencies. Also importable: renderLogicGrid, renderMatrix, renderCrossGrid,
// jointCheck, parseArgs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, evaluate, atomsOf } from './truth-table.mjs';

export const CHECK = '✓';
export const CROSS = '✗';
export const DASH = '—';
export const DOT = '•';
export const ELLIPSIS = '…';
const SEP = ' | ';
const DEFAULT_WIDTH = 40;
const JOINT_MAX_ATOMS = 16;
const JOINT_MAX_SUBSET_SEARCH = 12;

// ---- shared -------------------------------------------------------------------

function pad(s, w) {
  s = String(s);
  return s.length >= w ? s : s + ' '.repeat(w - s.length);
}

const rtrim = (s) => s.replace(/\s+$/, '');

function joinRow(cells, widths) {
  return rtrim(cells.map((c, i) => (i === cells.length - 1 ? String(c) : pad(c, widths[i]))).join(SEP));
}

// `P1 "text"`, cut to `width` with … when longer.
export function label(id, text, width = DEFAULT_WIDTH) {
  const full = `${id} "${text}"`;
  if (full.length <= width) return { label: full, cut: false, full };
  const room = width - id.length - 4; // space, two quotes, ellipsis
  return { label: `${id} "${room > 0 ? text.slice(0, room) : ''}${ELLIPSIS}"`, cut: true, full };
}

// ---- method 11: premise logic grid ------------------------------------------------

function gridCell(cell) {
  if (!cell) return DASH;
  const parts = [];
  if (typeof cell.acc === 'boolean') parts.push(`acc ${cell.acc ? CHECK : CROSS}`);
  if (cell.note) parts.push(`(${cell.note})`);
  if (typeof cell.rel === 'boolean') parts.push(`rel ${cell.rel ? CHECK : CROSS}`);
  if (typeof cell.suf === 'boolean') parts.push(`suf ${cell.suf ? CHECK : CROSS}`);
  return parts.length ? parts.join(' ') : DASH;
}

// premises, conclusions: {id: text}. cells: {"P|C": {...}}, or null for the empty grid.
export function renderLogicGrid(premises, conclusions, cells = null, width = DEFAULT_WIDTH) {
  const pIds = Object.keys(premises);
  const cIds = Object.keys(conclusions);
  const rowLabels = pIds.map((id) => label(id, premises[id], width));
  const colLabels = cIds.map((id) => label(id, conclusions[id], width));
  const filled = cells !== null && cells !== undefined;
  const body = pIds.map((p) => cIds.map((c) => (filled ? gridCell(cells[`${p}|${c}`]) : '')));
  const widths = [Math.max(0, ...rowLabels.map((l) => l.label.length))];
  cIds.forEach((c, j) => widths.push(Math.max(colLabels[j].label.length, ...body.map((row) => row[j].length))));

  const lines = ['LOGIC GRID', joinRow(['', ...colLabels.map((l) => l.label)], widths)];
  pIds.forEach((p, i) => lines.push(joinRow([rowLabels[i].label, ...body[i]], widths)));
  if (!filled) {
    lines.push('Unsupported conclusions:', 'Idle premises:');
  } else {
    const unsupported = cIds.filter((c) => !pIds.some((p) => {
      const cell = cells[`${p}|${c}`];
      return cell && cell.acc === true && cell.rel === true;
    }));
    const idle = pIds.filter((p) => !cIds.some((c) => cells[`${p}|${c}`]));
    lines.push(`Unsupported conclusions: ${unsupported.length ? unsupported.join(', ') : 'none'}`);
    lines.push(`Idle premises: ${idle.length ? idle.join(', ') : 'none'}`);
  }
  const cut = [...rowLabels, ...colLabels].filter((l) => l.cut);
  if (cut.length) lines.push('Legend:', ...cut.map((l) => l.full));
  return lines.join('\n');
}

// ---- method 12: incompatibility matrix ---------------------------------------------

const STATUS_MARK = { ok: 'o', incompatible: 'X', entailed: '=', undecidable: '?', o: 'o', X: 'X', '=': '=', '?': '?' };
const VALID_STATUS = ['ok', 'incompatible', 'under', 'entailed', 'undecidable', 'o', 'X', '=', '?'];

function pairCell(cells, a, b) {
  if (!cells) return null;
  return cells[`${a}|${b}`] || cells[`${b}|${a}`] || null;
}

function matrixMark(cell) {
  if (!cell || !cell.status) return '';
  if (cell.status === 'under') return `X|${cell.under || '?'}`;
  return STATUS_MARK[cell.status] || String(cell.status);
}

function entry(v, textKey) {
  if (v && typeof v === 'object') return { text: String(v[textKey] ?? v.text ?? v.quote ?? ''), formula: v.formula ? String(v.formula) : '' };
  return { text: String(v ?? ''), formula: '' };
}

// Model search over propositional formulas (method 8). items: [{id, formula}].
// Returns {ran, satisfiable, witness, minimal, note}.
export function jointCheck(items) {
  let trees;
  try {
    trees = items.map((it) => ({ id: it.id, tree: parse(it.formula) }));
  } catch (err) {
    return { ran: false, note: `formula not readable: ${err.message}` };
  }
  const atoms = [...trees.reduce((s, t) => atomsOf(t.tree, s), new Set())].sort();
  if (atoms.length > JOINT_MAX_ATOMS) return { ran: false, note: `${atoms.length} atoms is past the ${JOINT_MAX_ATOMS}-atom model search; run method 8 by hand` };
  const n = atoms.length;
  const model = (subset) => {
    for (let k = 0; k < 2 ** n; k += 1) {
      const row = {};
      atoms.forEach((a, i) => { row[a] = ((k >> (n - 1 - i)) & 1) === 0; });
      if (subset.every((t) => evaluate(t.tree, row))) return row;
    }
    return null;
  };
  const witness = model(trees);
  if (witness) return { ran: true, satisfiable: true, witness: atoms.map((a) => `${a}=${witness[a] ? 'T' : 'F'}`).join(', '), minimal: [] };
  // Minimal inconsistent subsets, smallest first; a superset of one found is skipped.
  const minimal = [];
  if (trees.length <= JOINT_MAX_SUBSET_SEARCH) {
    const total = 2 ** trees.length;
    const masks = [];
    for (let m = 1; m < total; m += 1) masks.push(m);
    const size = (m) => m.toString(2).split('1').length - 1;
    masks.sort((a, b) => size(a) - size(b));
    const found = [];
    for (const m of masks) {
      if (found.some((f) => (f & m) === f)) continue;
      const subset = trees.filter((_, i) => (m >> i) & 1);
      if (!model(subset)) { found.push(m); minimal.push(`{${subset.map((t) => t.id).join(', ')}}`); }
    }
  } else {
    minimal.push(`{${trees.map((t) => t.id).join(', ')}} (subset search skipped past ${JOINT_MAX_SUBSET_SEARCH} premises)`);
  }
  return { ran: true, satisfiable: false, witness: null, minimal };
}

// premises: {id: "quote" | {quote, formula}}; assumptions: {id: "text" | {text, formula}};
// cells: {"hi|hj": {status, under, reason}}, or null for the empty matrix.
export function renderMatrix(premises, assumptions = {}, cells = null) {
  const ids = Object.keys(premises);
  const held = ids.map((id) => ({ id, ...entry(premises[id], 'quote') }));
  const aIds = Object.keys(assumptions || {});
  const assumed = aIds.map((id) => ({ id, ...entry(assumptions[id], 'text') }));
  const filled = cells !== null && cells !== undefined;

  // Every cell is a pair of held premises with a known status; an X|A cell cites a declared
  // assumption, never a held premise (method 12).
  if (filled) {
    for (const [key, cell] of Object.entries(cells)) {
      const pair = key.split('|');
      if (pair.length !== 2 || pair[0] === pair[1] || !pair.every((id) => ids.includes(id))) {
        const stray = pair.filter((id) => !ids.includes(id));
        throw new Error(`matrix cell ${key}: a cell is keyed by two different held-premise ids (${ids.join(', ')})${stray.length ? `; not a held premise: ${stray.join(', ')}` : ''}`);
      }
      const status = cell && cell.status != null ? String(cell.status) : '';
      if (!VALID_STATUS.includes(status)) {
        throw new Error(`matrix cell ${key}: status ${JSON.stringify(status)} is not one of ${VALID_STATUS.join(', ')}`);
      }
      if (status !== 'under') continue;
      const under = cell.under == null ? '' : String(cell.under);
      if (ids.includes(under)) {
        throw new Error(`matrix cell ${key}: "under" names held premise ${under}; a pairwise cell never cites a held premise (method 12). Declare the assumption separately (A1, A2, …) or report the conflict in the Joint section.`);
      }
      if (!aIds.includes(under)) {
        throw new Error(`matrix cell ${key}: "under" must be a declared assumption id (one listed under assumptions${aIds.length ? `: ${aIds.join(', ')}` : '; none is declared'}), got ${JSON.stringify(under)}`);
      }
    }
  }

  const lines = ['INCOMPATIBILITY MATRIX', ' Held premises (key; each with its quote in the decomposer output):'];
  const idW = Math.max(2, ...ids.map((s) => s.length), ...aIds.map((s) => s.length)) + 2;
  const quoteW = Math.max(0, ...held.map((h) => h.text.length + 2));
  for (const h of held) lines.push(rtrim(`  ${pad(h.id, idW)}${pad(`"${h.text}"`, quoteW)}      ${h.formula}`));
  lines.push(' Assumptions (declared separately):');
  if (assumed.length) {
    const textW = Math.max(0, ...assumed.map((a) => a.text.length));
    for (const a of assumed) lines.push(rtrim(`  ${pad(a.id, idW)}${pad(a.text, textW)}      ${a.formula}`));
  } else {
    lines.push('  (none declared)');
  }
  lines.push('');

  const colW = Math.max(6, ...ids.map((s) => s.length + 2));
  lines.push(rtrim(`${' '.repeat(2 + colW)}${ids.map((id) => pad(id, colW)).join('')}`));
  ids.forEach((row, i) => {
    let out = `  ${pad(row, colW)}`;
    const reasons = [];
    ids.forEach((col, j) => {
      let text = '';
      if (i === j) text = '=';
      else if (j > i && filled) {
        const cell = pairCell(cells, row, col);
        text = matrixMark(cell);
        if (cell && cell.reason) reasons.push({ col, reason: cell.reason, last: j === ids.length - 1 });
      }
      out += text.length >= colW ? `${text}  ` : pad(text, colW);
    });
    // Reasons go after the row's last cell, so they never push a later column right.
    if (reasons.length === 1 && reasons[0].last) out = `${rtrim(out)}  (${reasons[0].reason})`;
    else if (reasons.length) out = `${rtrim(out)}  (${reasons.map((r) => `${r.col}: ${r.reason}`).join('; ')})`;
    lines.push(rtrim(out));
  });

  // Joint section.
  if (!filled) {
    lines.push(' Joint: H as stated:');
    for (const a of assumed) lines.push(`        H under ${a.id}:`);
    lines.push(' Verdict:');
    return lines.join('\n');
  }

  const xPairs = [];
  const underPairs = {};
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const cell = pairCell(cells, ids[i], ids[j]);
      if (!cell) continue;
      const set = `{${ids[i]}, ${ids[j]}}`;
      if (cell.status === 'incompatible' || cell.status === 'X') xPairs.push(set);
      else if (cell.status === 'under') (underPairs[cell.under || '?'] = underPairs[cell.under || '?'] || []).push(set);
    }
  }
  const allFormulas = held.length > 0 && held.every((h) => h.formula);
  const heldItems = held.map((h) => ({ id: h.id, formula: h.formula }));
  // Satisfiability of H as stated: true, false, or null (not decided).
  let hSat = null;
  let formulaNote = '';

  if (allFormulas) {
    const r = jointCheck(heldItems);
    if (r.ran) {
      hSat = r.satisfiable;
      if (r.satisfiable) {
        let s = ` Joint: H as stated: satisfiable (witness: ${r.witness})`;
        if (xPairs.length) s += ` ${DASH} the pairwise X cells ${xPairs.join(', ')} are not reproduced by the formulas`;
        lines.push(s);
      } else {
        lines.push(` Joint: H as stated: not satisfiable ${DASH} minimal inconsistent subsets ${r.minimal.join(', ')}`);
      }
    } else {
      formulaNote = `formula check not run: ${r.note}`;
    }
  }
  if (hSat === null) {
    // No formulas, or a formula check that could not run: the pairwise X cells decide.
    if (xPairs.length) {
      hSat = false;
      lines.push(` Joint: H as stated: not satisfiable ${DASH} minimal inconsistent subsets ${xPairs.join(', ')} (from the pairwise X cells${formulaNote ? `; ${formulaNote}` : ''})`);
    } else if (formulaNote) {
      lines.push(` Joint: H as stated: not decided ${DASH} ${formulaNote}; no pairwise X, and pairwise is not joint`);
    } else {
      lines.push(` Joint: H as stated: not decided ${DASH} no pairwise X, and pairwise is not joint; give every held premise a formula, or run method 8`);
    }
  }

  // An assumption the verdict depends on is one whose addition changes satisfiability:
  // H satisfiable as stated, not satisfiable with the assumption added. When H as stated is
  // already not satisfiable, no addition changes that, and none is reported.
  const dependsOn = new Set();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const a of assumed) {
    let s = null;
    let note = '';
    if (allFormulas && a.formula) {
      const r = jointCheck([...heldItems, { id: a.id, formula: a.formula }]);
      if (!r.ran) note = `formula check not run: ${r.note}`;
      else if (r.satisfiable) s = `satisfiable (witness: ${r.witness})`;
      else {
        const withA = new RegExp(`[{ ]${esc(a.id)}(?=[,}])`);
        const own = r.minimal.filter((m) => withA.test(m)).map((m) => m.replace(new RegExp(`,? ?${esc(a.id)}(?=[,}])`), ''));
        if (hSat === true) dependsOn.add(a.id);
        s = own.length
          ? `X (minimal subset${own.length > 1 ? 's' : ''} ${own.join(', ')})`
          : `X (H is already not satisfiable as stated; ${a.id} adds no inconsistent subset)`;
      }
    }
    if (s === null && underPairs[a.id]) {
      // The X|A cells: each pair is satisfiable without A and not with it.
      if (hSat !== false) dependsOn.add(a.id);
      s = `X (minimal subset${underPairs[a.id].length > 1 ? 's' : ''} ${underPairs[a.id].join(', ')})${note ? ` (from the X|${a.id} cells; ${note})` : ''}`;
    }
    if (s === null) s = note ? `not decided ${DASH} ${note}` : `not decided ${DASH} no X|${a.id} cell, and pairwise is not joint`;
    lines.push(`        H under ${a.id}: ${s}`);
  }

  let verdict;
  if (hSat === false) verdict = 'inconsistent';
  else if (hSat === true) verdict = 'consistent as worded';
  else verdict = 'pairwise cells only; joint check pending';
  const dep = aIds.filter((id) => dependsOn.has(id));
  lines.push(` Verdict: ${verdict}; depends on: ${dep.length ? dep.join(', ') : 'none'}`);
  return lines.join('\n');
}

// ---- method 1: crosshatch logic grid ----------------------------------------------------

// Categories: items first, then each attribute. Column blocks are categories 2..n; row
// blocks are category 1 against every column block, then the last category against the
// column blocks before it, and so on down the staircase, so every pair has one sub-grid.
export function renderCrossGrid(items, attributes, cells = null) {
  const groups = [];
  if (Array.isArray(items)) groups.push({ name: 'item', values: items.map(String) });
  else if (items && Array.isArray(items.values)) groups.push({ name: items.name || 'item', values: items.values.map(String) });
  for (const [name, values] of Object.entries(attributes || {})) groups.push({ name, values: values.map(String) });
  if (groups.length < 2) throw new Error('cross-grid needs at least two categories');

  const colBlocks = groups.slice(1);
  const rowBlocks = [{ rows: groups[0], cols: colBlocks }];
  for (let k = groups.length - 1; k >= 2; k -= 1) rowBlocks.push({ rows: groups[k], cols: colBlocks.slice(0, k - 1) });

  const labelW = Math.max(...rowBlocks.flatMap((b) => b.rows.values.map((v) => v.length))) + 3;
  const indent = '   ';
  const blockHeader = (g) => ` ${g.values.join(' ')} `;
  const blockRow = (g, rowValue) => {
    const chars = Array.from(blockHeader(g), () => ' ');
    let at = 1;
    for (const v of g.values) {
      let mark = '';
      if (cells) {
        const m = cells[`${rowValue}|${v}`] ?? cells[`${v}|${rowValue}`];
        if (m !== undefined && m !== null && m !== '') mark = /^[oO•]$/.test(String(m)) ? DOT : String(m)[0];
      }
      if (mark) chars[at + Math.floor(v.length / 2)] = mark;
      at += v.length + 1;
    }
    return chars.join('');
  };

  const lines = ['CROSSHATCH GRID', rtrim(`${' '.repeat(indent.length + labelW)}|${colBlocks.map(blockHeader).join('|')}`)];
  for (const b of rowBlocks) {
    for (const rv of b.rows.values) {
      let s = `${indent}${pad(rv, labelW)}|`;
      // A bar follows every sub-grid except the last column block, so the staircase
      // edge keeps its bar and a full row does not end in one.
      b.cols.forEach((g, k) => { s += blockRow(g, rv); if (k < colBlocks.length - 1) s += '|'; });
      lines.push(rtrim(s));
    }
  }
  return lines.join('\n');
}

// ---- CLI ------------------------------------------------------------------------------------

function unquote(s) {
  s = String(s).trim();
  if (s.length >= 2 && ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === "'" && s[s.length - 1] === "'"))) return s.slice(1, -1);
  return s;
}

// `ID=text` pairs into {ID: text}.
function pairs(list, what) {
  const out = {};
  for (const item of list) {
    const eq = item.indexOf('=');
    if (eq <= 0) throw new Error(`${what}: expected ID="text", got ${JSON.stringify(item)}`);
    out[item.slice(0, eq).trim()] = unquote(item.slice(eq + 1));
  }
  return out;
}

const SINGLE = new Set(['json', 'width', 'items']);

export function parseArgs(argv) {
  const out = { command: argv[0] || '', opts: {}, lists: {} };
  let current = null;
  for (const a of argv.slice(1)) {
    if (a.startsWith('--')) {
      current = a.slice(2);
      if (SINGLE.has(current)) out.opts[current] = null; else out.lists[current] = out.lists[current] || [];
      continue;
    }
    if (current && SINGLE.has(current)) {
      if (out.opts[current] !== null) throw new Error(`--${current} takes one value`);
      out.opts[current] = a;
      continue;
    }
    if (current) { out.lists[current].push(a); continue; }
    throw new Error(`unexpected argument ${JSON.stringify(a)}`);
  }
  return out;
}

function readJson(file) {
  const p = path.resolve(process.cwd(), file);
  let text;
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${p}: ${err.code || err.message}`);
  }
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (err) {
    throw new Error(`${p} is not JSON: ${err.message}`);
  }
}

const USAGE = `usage:
  node grids.mjs logic-grid --premises P1="..." P2="..." --conclusions C1="..." [--width N]
  node grids.mjs logic-grid --json <file>
  node grids.mjs matrix --premises h1="..." h2="..." [--assumptions A1="..."]
  node grids.mjs matrix --json <file>
  node grids.mjs cross-grid --items A,B,C --attributes "evaluator=X,Y,Z" "funder=P,Q,R" [--json <file>]`;

function splitList(s) {
  return unquote(s).split(',').map((x) => x.trim()).filter(Boolean);
}

export function main(argv) {
  const args = parseArgs(argv);
  const width = args.opts.width ? Number(args.opts.width) : DEFAULT_WIDTH;
  if (!Number.isFinite(width) || width < 8) throw new Error('--width must be a number of at least 8');
  const json = args.opts.json ? readJson(args.opts.json) : null;

  if (args.command === 'logic-grid') {
    const premises = json ? (json.premises || {}) : pairs(args.lists.premises || [], '--premises');
    const conclusions = json ? (json.conclusions || {}) : pairs(args.lists.conclusions || [], '--conclusions');
    if (!Object.keys(premises).length || !Object.keys(conclusions).length) throw new Error(`logic-grid needs premises and conclusions\n${USAGE}`);
    return renderLogicGrid(premises, conclusions, json ? (json.cells || {}) : null, width);
  }
  if (args.command === 'matrix') {
    const premises = json ? (json.premises || {}) : pairs(args.lists.premises || [], '--premises');
    const assumptions = json ? (json.assumptions || {}) : pairs(args.lists.assumptions || [], '--assumptions');
    if (!Object.keys(premises).length) throw new Error(`matrix needs premises\n${USAGE}`);
    return renderMatrix(premises, assumptions, json ? (json.cells || {}) : null);
  }
  if (args.command === 'cross-grid') {
    let items = json && json.items ? json.items : null;
    const attributes = json && json.attributes ? { ...json.attributes } : {};
    if (args.opts.items) {
      const eq = args.opts.items.indexOf('=');
      items = eq > 0 ? { name: args.opts.items.slice(0, eq).trim(), values: splitList(args.opts.items.slice(eq + 1)) } : splitList(args.opts.items);
    }
    for (const a of args.lists.attributes || []) {
      const eq = a.indexOf('=');
      if (eq <= 0) throw new Error(`--attributes: expected name=V1,V2, got ${JSON.stringify(a)}`);
      attributes[a.slice(0, eq).trim()] = splitList(a.slice(eq + 1));
    }
    if (!items) throw new Error(`cross-grid needs --items\n${USAGE}`);
    return renderCrossGrid(items, attributes, json ? (json.cells || null) : null);
  }
  throw new Error(USAGE);
}

function isMain() {
  try {
    const self = fileURLToPath(import.meta.url);
    const entryPath = path.resolve(process.argv[1] || '');
    const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
    return norm(self) === norm(entryPath);
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
