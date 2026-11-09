// logic-toolbox method 7: truth tables.
//
//   node truth-table.mjs "A -> B" "~B" "~A"         argument: the last formula is the conclusion
//   node truth-table.mjs --set "A -> B" "B -> C" "~C"  consistency of the whole set
//   node truth-table.mjs "A v ~A"                     one formula: tautology / contradiction / contingent
//
// Connectives: ~ or / (not), & (and), v (or), -> (if), <-> (iff), parentheses. Atoms are
// [A-Za-z][A-Za-z0-9_]* (a lone `v` is the connective). Also read: ¬ ! ∧ && ∨ || → ↔ ≡.
// Precedence ~ > & > v > -> > <->; -> is right-associative. At most 6 atoms (64 rows); more
// is refused with a message.
// Node 18+, no dependencies. Also importable: parse, evaluate, atomsOf, truthTable, render.

import path from 'path';
import { fileURLToPath } from 'url';

export const MAX_ATOMS = 6;

// ---- lexer / parser -----------------------------------------------------------

function tokenize(src) {
  const s = String(src)
    .replace(/¬|!|\//g, '~').replace(/∧|&&/g, '&').replace(/∨|\|\|/g, 'v')
    .replace(/↔|≡|<=>/g, '<->').replace(/→|=>/g, '->');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (s.startsWith('<->', i)) { tokens.push({ t: '<->' }); i += 3; continue; }
    if (s.startsWith('->', i)) { tokens.push({ t: '->' }); i += 2; continue; }
    if ('~&()'.includes(ch)) { tokens.push({ t: ch }); i += 1; continue; }
    if (ch === 'v' && !/[A-Za-z0-9_]/.test(s[i + 1] || '')) { tokens.push({ t: 'v' }); i += 1; continue; }
    const m = /^[A-Za-z][A-Za-z0-9_]*/.exec(s.slice(i));
    if (m) { tokens.push({ t: 'atom', name: m[0] }); i += m[0].length; continue; }
    throw new Error(`cannot read ${JSON.stringify(ch)} at position ${i + 1} in ${JSON.stringify(src)}`);
  }
  return tokens;
}

export function parse(src) {
  const toks = tokenize(src);
  let pos = 0;
  const peek = () => toks[pos];
  const take = (t) => {
    const tok = toks[pos];
    if (!tok || (t && tok.t !== t)) throw new Error(`expected ${t || 'a formula'} in ${JSON.stringify(src)}, found ${tok ? tok.t : 'end of input'}`);
    pos += 1;
    return tok;
  };
  const iff = () => {
    let left = imp();
    while (peek() && peek().t === '<->') { take(); left = { op: '<->', l: left, r: imp() }; }
    return left;
  };
  const imp = () => {
    const left = or();
    if (peek() && peek().t === '->') { take(); return { op: '->', l: left, r: imp() }; }
    return left;
  };
  const or = () => {
    let left = and();
    while (peek() && peek().t === 'v') { take(); left = { op: 'v', l: left, r: and() }; }
    return left;
  };
  const and = () => {
    let left = not();
    while (peek() && peek().t === '&') { take(); left = { op: '&', l: left, r: not() }; }
    return left;
  };
  const not = () => {
    if (peek() && peek().t === '~') { take(); return { op: '~', r: not() }; }
    return atom();
  };
  const atom = () => {
    const tok = take();
    if (tok.t === 'atom') return { op: 'atom', name: tok.name };
    if (tok.t === '(') { const e = iff(); take(')'); return e; }
    throw new Error(`unexpected ${tok.t} in ${JSON.stringify(src)}`);
  };
  const tree = iff();
  if (pos < toks.length) throw new Error(`unexpected ${toks[pos].t} after a complete formula in ${JSON.stringify(src)}`);
  return tree;
}

export function atomsOf(tree, into = new Set()) {
  if (tree.op === 'atom') into.add(tree.name);
  if (tree.l) atomsOf(tree.l, into);
  if (tree.r) atomsOf(tree.r, into);
  return into;
}

export function evaluate(tree, row) {
  switch (tree.op) {
    case 'atom': return Boolean(row[tree.name]);
    case '~': return !evaluate(tree.r, row);
    case '&': return evaluate(tree.l, row) && evaluate(tree.r, row);
    case 'v': return evaluate(tree.l, row) || evaluate(tree.r, row);
    case '->': return !evaluate(tree.l, row) || evaluate(tree.r, row);
    case '<->': return evaluate(tree.l, row) === evaluate(tree.r, row);
    default: throw new Error(`unknown operator ${tree.op}`);
  }
}

// ---- table ------------------------------------------------------------------------

function clean(src) {
  return String(src).trim().replace(/\s+/g, ' ');
}

// formulas: strings. mode: 'argument' (last is the conclusion), 'set', or 'formula'.
export function truthTable(formulas, mode) {
  const trees = formulas.map(parse);
  const atoms = [...trees.reduce((s, t) => atomsOf(t, s), new Set())].sort();
  if (atoms.length > MAX_ATOMS) {
    throw new Error(`too many atoms: ${atoms.length} > ${MAX_ATOMS} (${atoms.join(', ')}); a table of ${2 ** atoms.length} rows is past what this method is for. Split the problem or use method 5 (constraint propagation).`);
  }
  const rows = [];
  const n = atoms.length;
  for (let k = 0; k < 2 ** n; k += 1) {
    const row = {};
    // T first: row 0 is all true, as the textbook tables run.
    atoms.forEach((a, i) => { row[a] = ((k >> (n - 1 - i)) & 1) === 0; });
    rows.push({ values: row, results: trees.map((t) => evaluate(t, row)) });
  }
  const describe = (row) => atoms.map((a) => `${a}=${row.values[a] ? 'T' : 'F'}`).join(', ');

  let verdict;
  if (mode === 'argument') {
    const bad = rows.find((r) => r.results.slice(0, -1).every(Boolean) && !r.results[r.results.length - 1]);
    verdict = bad ? `invalid (counterexample row: ${describe(bad)})` : 'valid';
  } else if (mode === 'set') {
    const good = rows.find((r) => r.results.every(Boolean));
    verdict = good ? `consistent (row: ${describe(good)})` : 'inconsistent';
  } else {
    const vals = rows.map((r) => r.results[0]);
    verdict = vals.every(Boolean) ? 'tautology' : vals.every((v) => !v) ? 'contradiction' : 'contingent';
  }
  return { atoms, formulas: formulas.map(clean), rows, mode, verdict };
}

export function render(table) {
  const headers = [...table.atoms, ...table.formulas];
  const widths = headers.map((h) => h.length);
  const line = (cells) => cells.map((c, i) => (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join(' | ').replace(/\s+$/, '');
  const out = ['TRUTH TABLE', line(headers)];
  for (const r of table.rows) {
    const cells = [...table.atoms.map((a) => (r.values[a] ? 'T' : 'F')), ...r.results.map((v) => (v ? 'T' : 'F'))];
    out.push(line(cells));
  }
  if (table.mode === 'argument') {
    const premises = table.formulas.slice(0, -1);
    out.push(`Argument: ${premises.join(', ')} ∴ ${table.formulas[table.formulas.length - 1]}`);
  } else if (table.mode === 'set') {
    out.push(`Set: ${table.formulas.join(', ')}`);
  } else {
    out.push(`Formula: ${table.formulas[0]}`);
  }
  out.push(`Verdict: ${table.verdict}`);
  return out.join('\n');
}

// ---- CLI ----------------------------------------------------------------------------

const USAGE = `usage:
  node truth-table.mjs "<premise>" ... "<conclusion>"   argument (last formula is the conclusion)
  node truth-table.mjs --set "<formula>" ...            consistency of the set
  node truth-table.mjs "<formula>"                      tautology / contradiction / contingent
connectives: ~ (or /) & v -> <-> and parentheses; atoms [A-Za-z][A-Za-z0-9_]*; at most ${MAX_ATOMS} atoms`;

export function main(argv) {
  const set = argv.includes('--set');
  const formulas = argv.filter((a) => a !== '--set');
  if (formulas.length === 0 || formulas.some((f) => f.startsWith('--'))) throw new Error(USAGE);
  const mode = set ? 'set' : formulas.length === 1 ? 'formula' : 'argument';
  return render(truthTable(formulas, mode));
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
