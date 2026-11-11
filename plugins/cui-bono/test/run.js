// cui-bono — automated check of the logic scripts.
//
//   node plugins/cui-bono/test/run.js
//
// Runs the grid printer (grids.mjs), the truth-table generator, the conditionals
// chainer, the decomposer skeleton and the OpenAlex profile script (against a local
// stand-in server, no network) as a user would, from the command line, and compares
// the grids line for line against the fixtures in test/fixtures/, after normalising
// CRLF to LF and removing a leading BOM and trailing newlines on both sides. Plain
// Node 18+, no dependencies. child_process is used here because this is a test
// harness, not a hook.

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync, spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures');
const GRIDS = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'grids.mjs');
const TRUTH = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'truth-table.mjs');
const COND = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'conditionals.mjs');
const SKEL = path.join(ROOT, 'skills', 'logic-decomposer', 'scripts', 'skeleton.mjs');
const PROFILE = path.join(ROOT, 'skills', 'citation-farm-audit', 'scripts', 'openalex-profile.mjs');
const SHIELD = path.join(ROOT, 'skills', 'missile-command', 'scripts', 'shield-audit.mjs');

let failures = 0;

function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

function norm(s) {
  return String(s).replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\n+$/, '');
}

function fixture(name) {
  try {
    return norm(fs.readFileSync(path.join(FIX, name), 'utf8'));
  } catch (err) {
    check(false, `fixture ${name} unreadable: ${err.message}`);
    return null;
  }
}

function run(script, args, input) {
  const opts = { encoding: 'utf8' };
  if (input !== undefined) opts.input = input;
  const r = spawnSync(process.execPath, [script, ...args], opts);
  if (r.error) return { status: -1, stdout: '', stderr: String(r.error.message) };
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// Asynchronous run, for a script that talks to a server in this process.
function runAsync(script, args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => resolve({ status: -1, stdout, stderr: String(err.message) }));
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

// Lines of `text` from the line `start` up to (not including) the line `stop`.
function section(text, start, stop) {
  const lines = norm(text).split('\n');
  const a = lines.indexOf(start);
  const b = stop === undefined ? lines.length : lines.indexOf(stop, a + 1);
  return a < 0 ? [] : lines.slice(a + 1, b < 0 ? lines.length : b);
}

function firstDiff(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  for (let i = 0; i < Math.max(al.length, bl.length); i += 1) {
    if (al[i] !== bl[i]) return `line ${i + 1}\n    got:  ${JSON.stringify(al[i])}\n    want: ${JSON.stringify(bl[i])}`;
  }
  return 'no line differs';
}

function checkExact(what, got, wantName) {
  const want = fixture(wantName);
  if (want === null) return;
  const g = norm(got);
  const ok = g === want;
  check(ok, `${what} matches ${wantName}`);
  if (!ok) console.log(`    ${firstDiff(g, want).replace(/\n/g, '\n')}`);
}

// A rule "X -> Y" is present only as itself; the converse and inverse are anchored so
// "~B -> ~A" does not read as "B -> A".
function hasRule(text, rule) {
  const esc = rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^~A-Za-z0-9])${esc}(?![A-Za-z0-9])`, 'm').test(text);
}

async function main() {
  // ---- 1. grids.mjs -------------------------------------------------------
  {
    const r = run(GRIDS, ['logic-grid',
      '--premises', 'P1=all of it is voluntary', 'P2=Pause has LARC as the condition',
      '--conclusions', 'C1=Pause is voluntary', 'C2=none of that needs a board']);
    check(r.status === 0, `logic-grid (empty) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('logic-grid (empty)', r.stdout, 'logic-grid-empty.txt');
  }
  {
    const r = run(GRIDS, ['logic-grid', '--json', path.join(FIX, 'logic-grid-filled.json')]);
    check(r.status === 0, `logic-grid (filled) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('logic-grid (filled, footer, legend)', r.stdout, 'logic-grid-filled.txt');
  }
  {
    // Quoted labels, as a shell that keeps the quotes would pass them.
    const r = run(GRIDS, ['logic-grid',
      '--premises', 'P1="all of it is voluntary"', 'P2="Pause has LARC as the condition"',
      '--conclusions', 'C1="Pause is voluntary"', 'C2="none of that needs a board"']);
    checkExact('logic-grid (empty, quoted labels)', r.stdout, 'logic-grid-empty.txt');
  }
  {
    const r = run(GRIDS, ['matrix', '--premises', 'h1=all of it is voluntary', 'h2=offered proactively', 'h3=Pause has LARC as the condition',
      '--assumptions', 'A1=a condition of entry is not voluntary']);
    check(r.status === 0, `matrix (empty) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('matrix (empty: key, assumptions, = diagonal, bare Joint and Verdict)', r.stdout, 'matrix-empty.txt');
  }
  {
    const r = run(GRIDS, ['matrix', '--json', path.join(FIX, 'matrix-filled.json')]);
    check(r.status === 0, `matrix (filled) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('matrix (filled with formulas: witness, X under A1 with minimal subset, verdict)', r.stdout, 'matrix-filled.txt');
  }
  {
    const r = run(GRIDS, ['matrix', '--json', path.join(FIX, 'matrix-cells-only.json')]);
    check(r.status === 0, `matrix (cells only) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('matrix (cells only: X pairs reported, no joint claim from o cells)', r.stdout, 'matrix-cells-only.txt');
  }
  {
    // Method 12: a pairwise X|A cell never cites a held premise; "under" must be a declared assumption.
    const r = run(GRIDS, ['matrix', '--json', path.join(FIX, 'matrix-under-premise.json')]);
    check(r.status === 2 && /P1\|P2/.test(r.stderr) && /held premise P3/.test(r.stderr), `matrix: "under" naming held premise P3 exits 2 with the cell and the id named (exit ${r.status}: ${r.stderr.trim().split('\n')[0]})`);
    check(r.stdout === '', 'matrix: no grid is printed when "under" cites a held premise');
  }
  {
    // Input errors exit 2 with a message and no grid.
    const bad = run(GRIDS, ['matrix', '--json', path.join(FIX, 'not-json.json')]);
    check(bad.status === 2 && /is not JSON/.test(bad.stderr) && bad.stdout === '', `malformed JSON exits 2 (exit ${bad.status}: ${bad.stderr.trim().split('\n')[0]})`);
    const missing = run(GRIDS, ['logic-grid', '--json', path.join(FIX, 'no-such-file.json')]);
    check(missing.status === 2 && /cannot read/.test(missing.stderr) && missing.stdout === '', `a missing --json file exits 2 (exit ${missing.status}: ${missing.stderr.trim().split('\n')[0]})`);
    const status = run(GRIDS, ['matrix', '--json', path.join(FIX, 'matrix-bad-status.json')]);
    check(status.status === 2 && /incompatable/.test(status.stderr) && status.stdout === '', `an unknown cell status exits 2 naming the value (exit ${status.status}: ${status.stderr.trim().split('\n')[0]})`);
  }
  {
    // --width cuts long labels with … and lists them in full under the grid.
    const r = run(GRIDS, ['logic-grid', '--width', '20', '--premises', 'P1=all of it is voluntary', '--conclusions', 'C1=Pause is voluntary']);
    check(r.status === 0 && /^P1 "all of it is v…"/m.test(r.stdout) && /^Legend:$/m.test(r.stdout) && /^P1 "all of it is voluntary"$/m.test(r.stdout), `--width 20 cuts the label and adds the legend (${JSON.stringify(norm(r.stdout).split('\n')[2])})`);
    const tooSmall = run(GRIDS, ['logic-grid', '--width', '3', '--premises', 'P1=a', '--conclusions', 'C1=b']);
    check(tooSmall.status === 2 && /--width/.test(tooSmall.stderr), '--width below 8 exits 2');
  }
  {
    const r = run(GRIDS, ['cross-grid', '--items', 'A,B,C', '--attributes', 'evaluator=X,Y,Z', 'funder=P,Q,R']);
    check(r.status === 0, `cross-grid exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('cross-grid (crosshatch staircase, three sub-grids)', r.stdout, 'cross-grid.txt');
  }
  {
    // Module use: the joint check and the crosshatch marks.
    try {
      const m = await import(pathToFileURL(GRIDS).href);
      const sat = m.jointCheck([{ id: 'h1', formula: 'A -> B' }, { id: 'h2', formula: 'A' }]);
      check(sat.ran && sat.satisfiable && sat.witness === 'A=T, B=T', `jointCheck finds a witness (${sat.witness})`);
      const unsat = m.jointCheck([{ id: 'h1', formula: 'P' }, { id: 'h2', formula: 'Q' }, { id: 'h3', formula: '/(P & Q)' }, { id: 'h4', formula: 'R' }]);
      check(unsat.ran && !unsat.satisfiable && unsat.minimal.join(';') === '{h1, h2, h3}', `jointCheck: pairwise-ok triple is jointly unsatisfiable with the minimal subset (${unsat.minimal.join(';')})`);
      const allOk = m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: 'ok' } });
      check(/Joint: H as stated: not decided/.test(allOk) && /Verdict: pairwise cells only; joint check pending/.test(allOk), 'o cells without formulas never claim joint satisfiability');
      let threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b', h3: 'c' }, { A1: 'x' }, { 'h1|h2': { status: 'under', under: 'h3' } }); } catch (err) { threw = err.message; }
      check(/held premise h3/.test(threw), `renderMatrix throws when "under" names a held premise (${threw.split('.')[0]})`);
      threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: 'under', under: 'Z9' } }); } catch (err) { threw = err.message; }
      check(/declared assumption id/.test(threw), 'renderMatrix throws when "under" is not a declared assumption');
      threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b' }, { A1: 'x' }, { 'h1|h2': { status: 'under', under: 'A2' } }); } catch (err) { threw = err.message; }
      check(/declared assumption id/.test(threw) && /A2/.test(threw), `an A-prefixed "under" not listed under assumptions is refused (${threw.split('.')[0]})`);
      threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: 'under', under: 'A' } }); } catch (err) { threw = err.message; }
      check(/declared assumption id/.test(threw), 'a bare "A" as "under" is refused');
      threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: 'incompatable' } }); } catch (err) { threw = err.message; }
      check(/incompatable/.test(threw), `an unknown status is refused (${threw.split('.')[0]})`);
      threw = '';
      try { m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h9': { status: 'ok' } }); } catch (err) { threw = err.message; }
      check(/h9/.test(threw), `a cell keyed to an id that is not a held premise is refused (${threw.split('.')[0]})`);
      for (const s of ['ok', 'incompatible', 'entailed', 'undecidable', 'o', 'X', '=', '?']) {
        let t = '';
        try { m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: s } }); } catch (err) { t = err.message; }
        check(t === '', `status ${JSON.stringify(s)} is accepted${t ? `: ${t}` : ''}`);
      }
      // I2: a formula that does not parse falls back to the pairwise X cells.
      const unparsed = m.renderMatrix({ h1: { quote: 'a', formula: 'P &' }, h2: { quote: 'b', formula: 'Q' } }, {}, { 'h1|h2': { status: 'incompatible' } });
      check(/^ Joint: H as stated: not satisfiable — minimal inconsistent subsets \{h1, h2\} \(from the pairwise X cells; formula check not run: formula not readable/m.test(unparsed) && /^ Verdict: inconsistent; depends on: none$/m.test(unparsed), `an unreadable formula does not hide an X cell (${JSON.stringify(unparsed.split('\n').slice(-2))})`);
      // I4: an assumption is reported only when adding it changes satisfiability.
      const already = m.renderMatrix({ h1: { quote: 'a', formula: 'P' }, h2: { quote: 'b', formula: '/P' } }, { A1: { text: 'unrelated', formula: 'R' } }, { 'h1|h2': { status: 'incompatible' } });
      check(/^ Verdict: inconsistent; depends on: none$/m.test(already) && !/H under A1: X \(minimal subset \{h1, h2\}\)/.test(already), `an unrelated assumption on an already inconsistent H is not reported (${JSON.stringify(already.split('\n').slice(-2))})`);
      const changes = m.renderMatrix({ h1: { quote: 'a', formula: 'P' }, h2: { quote: 'b', formula: 'Q' } }, { A1: { text: 'not both', formula: '/(P & Q)' }, A2: { text: 'unrelated', formula: 'R' } }, { 'h1|h2': { status: 'under', under: 'A1' } });
      check(/^ Verdict: consistent as worded; depends on: A1$/m.test(changes) && /^        H under A1: X \(minimal subset \{h1, h2\}\)$/m.test(changes) && /^        H under A2: satisfiable/m.test(changes), `only the assumption whose addition changes satisfiability is reported (${JSON.stringify(changes.split('\n').slice(-3))})`);
      const manyAtoms = Array.from({ length: 17 }, (_, i) => `Q${i + 1}`).join(' & ');
      const past = m.jointCheck([{ id: 'h1', formula: manyAtoms }]);
      check(past.ran === false && /17 atoms is past the 16-atom/.test(past.note), `jointCheck refuses past 16 atoms (${past.note})`);
      const unreadable = m.jointCheck([{ id: 'h1', formula: 'P &' }]);
      check(unreadable.ran === false && /formula not readable/.test(unreadable.note), `jointCheck reports an unparsable formula (${unreadable.note})`);
      const orSet = m.jointCheck([{ id: 'h1', formula: 'P∨Q' }, { id: 'h2', formula: '/P' }, { id: 'h3', formula: '/Q' }]);
      check(orSet.ran && !orSet.satisfiable, 'jointCheck reads P∨Q as a disjunction (with /P and /Q it is unsatisfiable)');
      const marks = m.renderCrossGrid(['A', 'B'], { evaluator: ['X', 'Y', 'Z'] }, { 'A|X': 'O', 'A|Y': 'X' });
      check(/^   A   \| • X$/m.test(marks) && /^   B   \|$/m.test(marks), `crosshatch marks: dot for O, X for X (${JSON.stringify(marks.split('\n')[2])})`);
      const wide = m.renderCrossGrid(['Anne', 'Cathy'], { men: ['Paul', 'Rob', 'Stan'] }, { 'Anne|Paul': '•', 'Anne|Rob': 'X', 'Anne|Stan': 'X' });
      check(/^           \| Paul Rob Stan$/m.test(wide) && /^   Anne    \|   •   X    X$/m.test(wide), `crosshatch marks sit under their column words (${JSON.stringify(wide.split('\n').slice(1, 3))})`);
    } catch (err) {
      check(false, `grids.mjs imports as a module: ${err.message}`);
    }
  }

  // ---- 2. truth-table.mjs -------------------------------------------------
  {
    const r = run(TRUTH, ['A -> B', 'A', 'B']);
    check(r.status === 0 && /^Verdict: valid$/m.test(r.stdout), `modus ponens is valid${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    check(/^A \| B \| A -> B \| A \| B$/m.test(r.stdout), 'truth table header lists atoms then formulas');
    check((r.stdout.match(/^[TF] \| [TF] \|/gm) || []).length === 4, 'truth table has 2^2 rows');
  }
  {
    const r = run(TRUTH, ['A -> B', 'B', 'A']);
    check(/^Verdict: invalid \(counterexample row: A=F, B=T\)$/m.test(r.stdout), `affirming the consequent is invalid with the counterexample row (${(r.stdout.match(/^Verdict:.*$/m) || [''])[0]})`);
  }
  {
    const r = run(TRUTH, ['--set', 'A -> B', 'B -> C', '~C']);
    check(/^Verdict: consistent \(row: A=F, B=F, C=F\)$/m.test(r.stdout), `3-atom set is consistent with the row (${(r.stdout.match(/^Verdict:.*$/m) || [''])[0]})`);
    const r2 = run(TRUTH, ['--set', 'A', '~A']);
    check(/^Verdict: inconsistent$/m.test(r2.stdout), 'contradictory set is inconsistent');
  }
  {
    check(/^Verdict: tautology$/m.test(run(TRUTH, ['A v ~A']).stdout), 'A v ~A is a tautology');
    check(/^Verdict: contradiction$/m.test(run(TRUTH, ['A & ~A']).stdout), 'A & ~A is a contradiction');
    check(/^Verdict: contingent$/m.test(run(TRUTH, ['(A <-> B) & ~C']).stdout), 'a contingent formula is reported as such');
  }
  {
    const r = run(TRUTH, ['A & B & C & D & E & F & G', 'A']);
    check(r.status !== 0 && /6/.test(r.stderr + r.stdout) && /7/.test(r.stderr + r.stdout), `7 atoms refused with a message naming the cap (exit ${r.status}: ${(r.stderr + r.stdout).trim().split('\n')[0]})`);
    const r6 = run(TRUTH, ['A & B & C & D & E & F', 'A']);
    check(r6.status === 0 && (r6.stdout.match(/^[TF] \| /gm) || []).length === 64, '6 atoms allowed (64 rows)');
  }
  {
    const r = run(TRUTH, ['A -> (B']);
    check(r.status !== 0, 'unbalanced parenthesis is a parse error');
  }
  {
    // The other spellings of the connectives, written without spaces.
    for (const f of ['A∨B', 'A||B', 'A∧B', 'A&&B']) {
      const r = run(TRUTH, [f]);
      const rows = (r.stdout.match(/^[TF] \| [TF] \|/gm) || []).length;
      check(r.status === 0 && rows === 4 && /^Verdict: contingent$/m.test(r.stdout), `${f} is read as two atoms and a connective (exit ${r.status}, ${rows} rows, ${(r.stdout.match(/^Verdict:.*$/m) || [''])[0]})`);
    }
  }
  {
    // SKILL.md's own notation: `/` for not, lowercase atoms.
    const r = run(TRUTH, ['p -> q', '/q', '/p']);
    check(/^Verdict: valid$/m.test(r.stdout) && /^p \| q \| p -> q \| \/q \| \/p$/m.test(r.stdout), 'slash negation and lowercase atoms are read; the header keeps the input spelling');
    const r2 = run(TRUTH, ['p -> q', 'q', 'p']);
    check(/^Verdict: invalid \(counterexample row: p=F, q=T\)$/m.test(r2.stdout), 'mistaken reversal is invalid on row p=F, q=T');
  }

  // ---- 3. conditionals.mjs ------------------------------------------------
  {
    const r = run(COND, ['A -> B', 'B -> C', '--query', 'A']);
    const out = r.stdout;
    check(r.status === 0, `conditionals exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    check(hasRule(out, '~B -> ~A') && hasRule(out, '~C -> ~B'), 'contrapositives are printed');
    check(/^Chains: A -> B -> C$/m.test(out), 'chain A -> B -> C is found');
    check(/forced true: A, B, C$/m.test(out), 'query A forces A, B, C true');
    check(!hasRule(out, 'B -> A') && !hasRule(out, 'C -> B') && !hasRule(out, 'A -> C -> B'), 'no converse is derived');
    check(!hasRule(out, '~A -> ~B') && !hasRule(out, '~B -> ~C'), 'no inverse is derived');
    check(!/^R\d+\s+A -> C\b/m.test(out), 'A -> C is not printed as a rule; it appears only inside the chain');
  }
  {
    // A cycle in its own component is walked even when another component has a head.
    const r = run(COND, ['A -> B', 'B -> C', 'C -> A', 'D -> E', 'E -> F']);
    check(/^Chains: D -> E -> F; A -> B -> C$/m.test(r.stdout), `a headless cycle beside a headed chain is reported (${(r.stdout.match(/^Chains:.*$/m) || [''])[0]})`);
  }
  {
    const r = run(COND, ['A -> B', '--query']);
    check(r.status === 2 && /usage/.test(r.stderr) && r.stdout === '', `--query with no value exits 2 with the usage (exit ${r.status})`);
  }
  {
    const r = run(COND, ['A -> B', 'B -> C', '--query', '~C']);
    check(/forced false: C, B, A$/m.test(r.stdout), 'query ~C forces C, B, A false via contrapositives');
    check(/forced true: \(none\)$/m.test(r.stdout), 'query ~C forces nothing true');
  }
  {
    const r = run(COND, ['Causal -> Control', '~Control']);
    check(/^Facts: ~Control$/m.test(r.stdout), 'a bare literal is a fact');
    check(/forced false: Control, Causal$/m.test(r.stdout), 'fact ~Control forces ~Causal');
    check(/^Consistent: yes$/m.test(r.stdout), 'consistent set reported');
  }
  {
    const r = run(COND, ['A -> B', 'A -> ~B', 'A']);
    check(/^Consistent: no — B and ~B both reached$/m.test(r.stdout), `inconsistent set detected (${(r.stdout.match(/^Consistent:.*$/m) || [''])[0]})`);
  }
  {
    const r = run(COND, ['A <-> B', '--query', 'B']);
    check(/forced true: B, A$/m.test(r.stdout), 'biconditional is split into both directions');
  }
  {
    const r = run(COND, ['SafeTravel -> SUV', '/SUV']);
    check(hasRule(r.stdout, '/SUV -> /SafeTravel') && /forced false: SUV, SafeTravel$/m.test(r.stdout) && !/~/.test(r.stdout), 'slash negation is read and written back as slash');
  }

  // ---- 4. skeleton.mjs ----------------------------------------------------
  {
    const r = run(SKEL, [path.join(FIX, 'skeleton-input.txt'), '--json']);
    check(r.status === 0, `skeleton --json exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    let j = null;
    try { j = JSON.parse(r.stdout); } catch (err) { check(false, `skeleton --json is JSON: ${err.message}`); }
    if (j) {
      const texts = j.sentences.map((s) => s.text);
      check(j.sentences.length === 9, `paragraph splits into 9 sentences (got ${j.sentences.length})`);
      check(texts[0] === 'Dr. Olds ran the trial in Elmira, N.Y. from 1978 to 1982.', `S1 keeps "Dr." and "N.Y." (${JSON.stringify(texts[0])})`);
      check(texts[1] === 'The program cost $3.5 million, i.e. about 12.5 percent of the budget.', `S2 keeps decimals and "i.e." (${JSON.stringify(texts[1])})`);
      check(texts[2] === 'Pause works only if it is voluntary, and it funds three things:', `S3 ends at the list (${JSON.stringify(texts[2])})`);
      check(texts[3] === 'counselling for every mother on the list' && texts[4] === 'LARC as the condition of entry' && texts[5] === 'no outreach without a referral', 'each bullet is its own sentence, marker stripped');
      check(texts[6] === 'The director said "the figure roughly halved."', `S7 ends at the closing quote (${JSON.stringify(texts[6])})`);
      check(texts[7] === 'Critics disagreed (see Smith vs. Jones, 2019).', `S8 keeps "vs." (${JSON.stringify(texts[7])})`);
      check(texts[8] === 'Either the figure is causal or it is before/after.', `S9 (${JSON.stringify(texts[8])})`);
      check(j.sentences.every((s, i) => s.id === `S${i + 1}`), 'sentences numbered S1..Sn');
      check(j.ptable.length === 9 && j.ptable.every((p, i) => p.id === '' && p.sentence === `S${i + 1}` && p.role === '' && p.proposition === `"${texts[i]}"`), 'P-TABLE has one placeholder row per sentence, proposition quoted');
      check(j.ptable.every((p) => 'formal' in p && 'k' in p && 'h' in p), 'P-TABLE rows carry the formal, K and h columns of step 3');
      check(j.grades.every((g) => 'certainty' in g), 'GRADES rows carry the starting-certainty column of step 6');
      const cond = Object.fromEntries(j.conditionals.map((c) => [c.sentence, c.indicators]));
      check(Object.keys(cond).join(',') === 'S3,S4,S6,S9', `conditionals pre-filled for S3, S4, S6, S9 (got ${Object.keys(cond).join(',')})`);
      check(JSON.stringify(cond.S3) === '["only if"]', `S3 indicator is "only if", not also "if" (${JSON.stringify(cond.S3)})`);
      check(JSON.stringify(cond.S4) === '["every"]', `S4 indicator is "every" (${JSON.stringify(cond.S4)})`);
      check(JSON.stringify(cond.S6) === '["no","without"]', `S6 indicators are "no" and "without" (${JSON.stringify(cond.S6)})`);
      check(JSON.stringify(cond.S9) === '["either","or"]', `S9 indicators are "either" and "or" (${JSON.stringify(cond.S9)})`);
      check(j.grades.length === 9 && j.grades.every((g) => 'basisCited' in g && 'markers' in g && 'licensed' in g && 'gradeDifference' in g &&'verdict' in g), 'GRADES has one row per sentence with the step-6 columns');
      check(j.grades[1].markers === '"about"' && j.grades[6].markers === '"roughly", "halved"', `GRADES pre-fills hedge/booster markers per sentence (S2=${j.grades[1].markers}, S7=${j.grades[6].markers})`);
      check(Array.isArray(j.quantifiers) && j.quantifiers.some((q) => q.sentence === 'S4' && q.quantifier === 'every') && j.quantifiers.some((q) => q.sentence === 'S6' && q.quantifier === 'no'), 'skeleton pre-fills quantifier list per sentence');
      check(j.validity.coverage === '9 sentences, 0 dispositions', `coverage pre-computed (${j.validity.coverage})`);
      check(Array.isArray(j.validity.checks) && j.validity.checks.length === 8, 'eight validity checks listed');
    }
  }
  {
    const r = run(SKEL, [path.join(FIX, 'skeleton-small-input.txt')]);
    check(r.status === 0, `skeleton (text) exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    checkExact('skeleton text output', r.stdout, 'skeleton-small-expected.txt');
  }
  {
    // stdin, with a BOM and CRLF line ends: the same skeleton, and none of either in the output.
    const r = run(SKEL, ['-'], '﻿All of it is voluntary.\r\nPause works.\r\n');
    check(r.status === 0 && !/\r/.test(r.stdout) && !r.stdout.startsWith('﻿'), `skeleton from stdin with BOM and CRLF exits 0 with LF output (exit ${r.status})`);
    checkExact('skeleton from stdin (BOM, CRLF)', r.stdout, 'skeleton-small-expected.txt');
  }
  {
    // Empty input: zero sentences, empty tables, exit 0.
    const r = run(SKEL, ['-'], '');
    check(r.status === 0 && /^coverage: 0 sentences, 0 dispositions$/m.test(r.stdout) && section(r.stdout, 'SENTENCES', '')[0] === undefined, `empty input exits 0 with 0 sentences (exit ${r.status})`);
    check(section(r.stdout, 'P-TABLE', '').length === 1, 'empty input: the P-TABLE has its header and no rows');
  }
  {
    // --wrap N wraps the quoted columns; a value under 10 is refused.
    const long = 'This sentence is long enough that the proposition column has to wrap over several lines.';
    const r = run(SKEL, ['-', '--wrap', '20'], long);
    const ptable = section(r.stdout, 'P-TABLE', '');
    check(r.status === 0 && ptable.length > 2 && ptable.slice(1).every((l) => l.split(' | ')[3].trim().length <= 20), `--wrap 20 wraps the proposition over ${ptable.length - 1} lines`);
    const small = run(SKEL, ['-', '--wrap', '5'], long);
    check(small.status === 2 && /--wrap/.test(small.stderr), '--wrap below 10 exits 2');
    const missing = run(SKEL, [path.join(FIX, 'no-such-file.txt')]);
    check(missing.status === 2 && /cannot read/.test(missing.stderr), 'a missing text file exits 2');
  }
  {
    try {
      const m = await import(pathToFileURL(SKEL).href);
      const s = m.splitSentences('See Fig. 2 and p. 3 of Smith et al. (2019). It says "yes." Then it stops! Why? Because.');
      check(s.length === 5, `module splitSentences handles Fig., p., et al., quotes, ! and ? (got ${s.length}: ${JSON.stringify(s)})`);
      const n = m.splitSentences('1. First item.\r\n2. Second item.\r\n(3) Third item.\r\n3) Fourth item.');
      check(n.length === 4 && n[0] === 'First item.' && n[2] === 'Third item.', `numbered list items are sentences, CRLF tolerated (${JSON.stringify(n)})`);
      const ind = m.findIndicators('It holds if and only if the board agrees, and any member may object.');
      check(JSON.stringify(ind) === '["if and only if","any"]', `"if and only if" wins over "only if"/"if" (${JSON.stringify(ind)})`);
      check(JSON.stringify(m.findIndicators('Nothing here, nor there, for now.')) === '[]', 'no false positive on "nor", "for", "not", "now"');
      const m2 = m.findIndicators('Only members may vote, and people who vote then leave in order to eat.');
      check(JSON.stringify(m2) === '["only","people who","then","in order to"]', `method-2 indicators bare "only", "people who", "then", "in order to" (${JSON.stringify(m2)})`);
      const m3 = m.findIndicators('It works only if it is voluntary; the only road is this one.');
      check(JSON.stringify(m3) === '["only if","the only"]', `bare "only" is not also read inside "only if" or "the only" (${JSON.stringify(m3)})`);
      check(JSON.stringify(m.findIndicators('None but the brave deserve the fair; the only road is this one, until it closes.')) === '["none but","the only","until"]', `step-4 indicators "none but", "the only", "until" (${JSON.stringify(m.findIndicators('None but the brave deserve the fair; the only road is this one, until it closes.'))})`);
    } catch (err) {
      check(false, `skeleton.mjs imports as a module: ${err.message}`);
    }
  }

  // ---- 5. openalex-profile.mjs (local stand-in server; no network) ---------------
  {
    const usage = run(PROFILE, ['not-an-id']);
    check(usage.status === 2 && /usage/.test(usage.stderr), 'openalex-profile: a bad author id exits 2 with the usage');
    // A port that was free a moment ago and is closed now: a connection error, not a stack trace.
    const probe = http.createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const closedPort = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const down = await runAsync(PROFILE, ['A1'], { OPENALEX_BASE: `http://127.0.0.1:${closedPort}/` });
    check(down.status === 2 && /OpenAlex/.test(down.stderr) && !/\n\s+at /.test(down.stderr) && down.stdout === '', `openalex-profile: a network error exits 2 with one message (exit ${down.status}: ${down.stderr.trim().split('\n')[0]})`);
    const seen = [];
    const server = http.createServer((req, res) => {
      seen.push(req.url);
      const status = /\/fail\//.test(req.url) ? 503 : 200;
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ meta: { count: 0 }, results: [], group_by: [] }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    try {
      const empty = await runAsync(PROFILE, ['A1'], { OPENALEX_BASE: `http://127.0.0.1:${port}/` });
      let j = null;
      try { j = JSON.parse(empty.stdout); } catch { /* checked below */ }
      check(empty.status === 0 && j && Array.isArray(j.top) && j.top.length === 0 && /no works/.test(j.note || ''), `openalex-profile: an author with no works exits 0 with an empty profile (exit ${empty.status}: ${empty.stderr.trim().split('\n')[0] || (j && j.note)})`);
      check(!seen.some((u) => /cites:(?:&|,|$)/.test(decodeURIComponent(u))), `openalex-profile: no query with an empty cites: filter is sent (${seen.length} requests)`);
      const fail = await runAsync(PROFILE, ['A1'], { OPENALEX_BASE: `http://127.0.0.1:${port}/fail/` });
      check(fail.status === 2 && /OpenAlex 503/.test(fail.stderr) && !/\n\s+at /.test(fail.stderr), `openalex-profile: an HTTP error exits 2 with the status (exit ${fail.status}: ${fail.stderr.trim().split('\n')[0]})`);
    } finally {
      server.close();
    }
  }

  // ---- 6. shield-audit.mjs (missile-command) ------------------------------
  {
    const bad = run(SHIELD, []);
    check(bad.status === 2 && /usage/.test(bad.stderr), 'shield-audit: missing target exits 2 with usage');
    const missing = run(SHIELD, [path.join(FIX, 'no-such-readme.md')]);
    check(missing.status === 2 && /cannot read/.test(missing.stderr), 'shield-audit: unreadable target exits 2');

    // Canonical reference implementation: plugins/dont-be-hitler/README.md
    const dbhDir = path.join(ROOT, '..', 'dont-be-hitler');
    const r = run(SHIELD, [dbhDir, '--json']);
    check(r.status === 0, `shield-audit on dont-be-hitler exits 0${r.status === 0 ? '' : `: ${r.stderr.trim()}`}`);
    let j = null;
    try { j = JSON.parse(r.stdout); } catch (err) { check(false, `shield-audit --json parses: ${err.message}`); }
    if (j) {
      check(j.verdict === 'SHIELDED', `dont-be-hitler/README.md verdict is SHIELDED (got ${j.verdict}: ${j.reason})`);
      check(j.primaryCitationsCount >= 20, `dont-be-hitler/README.md has >= 20 primary citations (got ${j.primaryCitationsCount})`);
      check(j.federalEeoMarkersCount >= 8, `dont-be-hitler/README.md has >= 8 Federal EEO/HR markers (got ${j.federalEeoMarkersCount})`);
      check(j.defensiveCrouchLeaks.length === 0, 'dont-be-hitler/README.md has 0 R1/R2 defensive-crouch leaks');
    }

    // Module check: bare exposed quote -> UNSHIELDED; defensive crouch -> CROUCH_LEAK
    try {
      const sm = await import(pathToFileURL(SHIELD).href);
      const bare = sm.auditMarkdown('# dont-be-hitler\n\n> "Degenerate art censorship."\n\n(Jane Roe, 2026-11-05)\n', 'bare.md');
      check(bare.verdict === 'UNSHIELDED' && bare.exposed === true && bare.namedQuotes === 1, `bare tripwire quote scores UNSHIELDED (got ${bare.verdict})`);
      const crouch = sm.auditMarkdown('# demo\n\nWhile the name may shock readers, we apologize if anyone misreads this satire.\n', 'crouch.md');
      check(crouch.verdict === 'CROUCH_LEAK' && crouch.defensiveCrouchLeaks.length >= 1, `defensive-crouch disclaimer scores CROUCH_LEAK (got ${crouch.verdict})`);
      const card = sm.formatCard(bare);
      check(/^### SHIELD AUDIT: bare\.md$/m.test(card) && /\[observed\]/.test(card) && /\[not found\]/.test(card), 'formatCard tags body lines with [observed] / [not found]');
    } catch (err) {
      check(false, `shield-audit.mjs imports as a module: ${err.message}`);
    }
  }

  console.log(failures === 0 ? 'all passed' : `${failures} failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.log(`FAIL runner crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
