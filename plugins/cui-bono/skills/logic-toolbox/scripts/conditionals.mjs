// logic-toolbox method 2: conditional diagramming, contrapositives and chains.
//
//   node conditionals.mjs "A -> B" "B -> C" --query A
//   node conditionals.mjs "Causal -> Control" "/Control"
//
// Each argument is a rule `S -> N` (S and N are literals: an atom, or ~atom / /atom), a
// biconditional `A <-> B` (read as both directions), or a bare literal, which is a fact the
// text asserts. Output uses the negation sign the input used (`/` as in SKILL.md, or `~`).
// Prints every rule with its contrapositive, the chains found among the stated rules and among
// their contrapositives, what the facts force, what the query forces (forward chaining from the
// query through the rules and their contrapositives, nothing else), and whether a term is
// reached as both T and ~T. The converse and the inverse are never derived.
// Node 18+, no dependencies. Also importable: parseLiteral, parseRules, chains, closure, analyze, render.

import path from 'path';
import { fileURLToPath } from 'url';

const DASH = '—';

// ---- literals and rules ----------------------------------------------------------

let NEG = '~';

export function parseLiteral(src) {
  const s = String(src).trim().replace(/^¬|^!/, '~');
  const m = /^([~/]?)\s*([A-Za-z][A-Za-z0-9_]*)$/.exec(s);
  if (!m) throw new Error(`expected a literal (an atom, ~atom or /atom), got ${JSON.stringify(src)}`);
  return { neg: m[1] !== '', atom: m[2] };
}

export const lit = (l) => `${l.neg ? NEG : ''}${l.atom}`;
export const negate = (l) => ({ neg: !l.neg, atom: l.atom });
export const contrapositive = (r) => ({ s: negate(r.n), n: negate(r.s) });
export const ruleText = (r) => `${lit(r.s)} -> ${lit(r.n)}`;

// Returns { rules: [{s, n, from}], facts: [literal] }.
export function parseRules(args) {
  const rules = [];
  const facts = [];
  for (const raw of args) {
    const a = String(raw).replace(/↔|≡|<=>/g, '<->').replace(/→|=>/g, '->').trim();
    if (a.includes('<->')) {
      const [l, r] = a.split('<->');
      if (a.split('<->').length !== 2) throw new Error(`one <-> per rule: ${JSON.stringify(raw)}`);
      const L = parseLiteral(l);
      const R = parseLiteral(r);
      rules.push({ s: L, n: R, from: raw }, { s: R, n: L, from: raw });
    } else if (a.includes('->')) {
      const parts = a.split('->');
      if (parts.length !== 2) throw new Error(`one -> per rule (chain them in separate rules): ${JSON.stringify(raw)}`);
      rules.push({ s: parseLiteral(parts[0]), n: parseLiteral(parts[1]), from: raw });
    } else {
      facts.push(parseLiteral(a));
    }
  }
  return { rules, facts };
}

// ---- chains -----------------------------------------------------------------------------

// Maximal paths of two or more rules where one rule's necessary term is the next rule's
// sufficient term. Cycles stop where a literal would repeat.
export function chains(rules) {
  const bySuff = new Map();
  for (const r of rules) {
    const k = lit(r.s);
    if (!bySuff.has(k)) bySuff.set(k, []);
    bySuff.get(k).push(r);
  }
  const hasIncoming = new Set(rules.map((r) => lit(r.n)));
  const starts = rules.filter((r) => !hasIncoming.has(lit(r.s)));
  const out = [];
  const visited = new Set();
  const walk = (pathLits) => {
    pathLits.forEach((l) => visited.add(l));
    const last = pathLits[pathLits.length - 1];
    const next = (bySuff.get(last) || []).filter((r) => !pathLits.includes(lit(r.n)));
    if (next.length === 0) {
      if (pathLits.length >= 3) out.push(pathLits.join(' -> '));
      return;
    }
    for (const r of next) walk([...pathLits, lit(r.n)]);
  };
  // Start from heads; if every rule sits in a cycle, start from each rule.
  const heads = starts.length ? starts : rules;
  const seen = new Set();
  for (const r of heads) {
    const k = lit(r.s);
    if (seen.has(k)) continue;
    seen.add(k);
    walk([k]);
  }
  // A cycle in a component with no head is not reached from the heads: walk it from the
  // first of its rules whose sufficient term no walk has visited.
  if (starts.length) {
    for (const r of rules) {
      const k = lit(r.s);
      if (!visited.has(k)) walk([k]);
    }
  }
  return out;
}

// ---- forward chaining -------------------------------------------------------------------

// Everything reached from `start` literals through the rules and their contrapositives, in
// the order reached. Returns { reached: [literal], clash: atom|null }.
export function closure(rules, start) {
  const all = [...rules, ...rules.map(contrapositive)];
  const reached = [];
  const have = new Set();
  const queue = [...start];
  let clash = null;
  while (queue.length) {
    const l = queue.shift();
    const k = lit(l);
    if (have.has(k)) continue;
    have.add(k);
    reached.push(l);
    if (have.has(lit(negate(l))) && clash === null) clash = l.atom;
    for (const r of all) if (lit(r.s) === k) queue.push(r.n);
  }
  return { reached, clash };
}

export function analyze(args, query) {
  // Print negation the way the input wrote it: `/` (SKILL.md's notation) or `~`.
  NEG = [...args, query || ''].some((a) => /(^|[\s>])\/[A-Za-z]/.test(String(a))) ? '/' : '~';
  const { rules, facts } = parseRules(args);
  if (rules.length === 0 && facts.length === 0) throw new Error('no rules given');
  const stated = rules.map((r) => ({ rule: ruleText(r), contrapositive: ruleText(contrapositive(r)) }));
  const factClosure = closure(rules, facts);
  const q = query ? parseLiteral(query) : null;
  const queryClosure = q ? closure(rules, [...facts, q]) : null;
  return {
    rules: stated,
    facts: facts.map(lit),
    chains: chains(rules),
    contrapositiveChains: chains(rules.map(contrapositive)),
    factClosure,
    query: q ? lit(q) : null,
    queryClosure,
  };
}

function forcedLines(cl, indent = '  ') {
  const t = cl.reached.filter((l) => !l.neg).map((l) => l.atom);
  const f = cl.reached.filter((l) => l.neg).map((l) => l.atom);
  return [
    `${indent}forced true: ${t.length ? t.join(', ') : '(none)'}`,
    `${indent}forced false: ${f.length ? f.join(', ') : '(none)'}`,
  ];
}

export function render(a) {
  const out = ['CONDITIONALS'];
  const w = Math.max(0, ...a.rules.map((r) => r.rule.length));
  a.rules.forEach((r, i) => out.push(`R${i + 1}  ${r.rule.padEnd(w)}    contrapositive: ${r.contrapositive}`));
  out.push(`Chains: ${a.chains.length ? a.chains.join('; ') : '(none)'}`);
  out.push(`Contrapositive chains: ${a.contrapositiveChains.length ? a.contrapositiveChains.join('; ') : '(none)'}`);
  if (a.facts.length) {
    out.push(`Facts: ${a.facts.join(', ')}`);
    out.push(...forcedLines(a.factClosure));
  } else {
    out.push('Facts: (none)');
  }
  if (a.query) {
    out.push(`Query: ${a.query}${a.facts.length ? ' (with the facts)' : ''}`);
    out.push(...forcedLines(a.queryClosure));
    if (a.queryClosure.clash) out.push(`  inconsistent under the query ${DASH} ${a.queryClosure.clash} and ${NEG}${a.queryClosure.clash} both reached`);
  }
  out.push(a.factClosure.clash
    ? `Consistent: no ${DASH} ${a.factClosure.clash} and ${NEG}${a.factClosure.clash} both reached`
    : 'Consistent: yes');
  return out.join('\n');
}

// ---- CLI ----------------------------------------------------------------------------------

const USAGE = `usage: node conditionals.mjs "<S -> N>" ... ["<literal fact>" ...] [--query <literal>]
rules are S -> N or A <-> B over literals (Atom, ~Atom or /Atom); a bare literal is a fact`;

export function main(argv) {
  let query = null;
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--query') { query = argv[i + 1]; i += 1; } else if (argv[i].startsWith('--')) { throw new Error(USAGE); } else rest.push(argv[i]);
  }
  if (rest.length === 0 || (argv.includes('--query') && !query)) throw new Error(USAGE);
  return render(analyze(rest, query));
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
