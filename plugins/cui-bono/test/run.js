// cui-bono — automated check of the logic scripts.
//
//   node plugins/cui-bono/test/run.js
//
// Runs the grid printer (grids.mjs), the truth-table generator, the conditionals
// chainer and the decomposer skeleton as a user would, from the command line, and
// compares the grids byte for byte against the fixtures in test/fixtures/. Plain
// Node 18+, no dependencies. child_process is used here because this is a test
// harness, not a hook.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures');
const GRIDS = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'grids.mjs');
const TRUTH = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'truth-table.mjs');
const COND = path.join(ROOT, 'skills', 'logic-toolbox', 'scripts', 'conditionals.mjs');
const SKEL = path.join(ROOT, 'skills', 'logic-decomposer', 'scripts', 'skeleton.mjs');

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

function run(script, args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  if (r.error) return { status: -1, stdout: '', stderr: String(r.error.message) };
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
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
      check(/declared assumption id/.test(threw), 'renderMatrix throws when "under" is neither declared nor A-prefixed');
      const aPrefixed = m.renderMatrix({ h1: 'a', h2: 'b' }, {}, { 'h1|h2': { status: 'under', under: 'A2' } });
      check(/X\|A2/.test(aPrefixed), 'an A-prefixed "under" not listed under assumptions is accepted');
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
    check(hasRule(out, 'A -> C') === false || /^Chains:/m.test(out), 'A -> C appears only as the chain');
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
      const cond = Object.fromEntries(j.conditionals.map((c) => [c.sentence, c.indicators]));
      check(Object.keys(cond).join(',') === 'S3,S4,S6,S9', `conditionals pre-filled for S3, S4, S6, S9 (got ${Object.keys(cond).join(',')})`);
      check(JSON.stringify(cond.S3) === '["only if"]', `S3 indicator is "only if", not also "if" (${JSON.stringify(cond.S3)})`);
      check(JSON.stringify(cond.S4) === '["every"]', `S4 indicator is "every" (${JSON.stringify(cond.S4)})`);
      check(JSON.stringify(cond.S6) === '["no","without"]', `S6 indicators are "no" and "without" (${JSON.stringify(cond.S6)})`);
      check(JSON.stringify(cond.S9) === '["either","or"]', `S9 indicators are "either" and "or" (${JSON.stringify(cond.S9)})`);
      check(j.grades.length === 9 && j.grades.every((g) => 'basisCited' in g && 'markers' in g && 'licensed' in g && 'verdict' in g), 'GRADES has one row per sentence with the step-6 columns');
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
    try {
      const m = await import(pathToFileURL(SKEL).href);
      const s = m.splitSentences('See Fig. 2 and p. 3 of Smith et al. (2019). It says "yes." Then it stops! Why? Because.');
      check(s.length === 5, `module splitSentences handles Fig., p., et al., quotes, ! and ? (got ${s.length}: ${JSON.stringify(s)})`);
      const n = m.splitSentences('1. First item.\r\n2. Second item.\r\n(3) Third item.\r\n3) Fourth item.');
      check(n.length === 4 && n[0] === 'First item.' && n[2] === 'Third item.', `numbered list items are sentences, CRLF tolerated (${JSON.stringify(n)})`);
      const ind = m.findIndicators('It holds if and only if the board agrees, and any member may object.');
      check(JSON.stringify(ind) === '["if and only if","any"]', `"if and only if" wins over "only if"/"if" (${JSON.stringify(ind)})`);
      check(JSON.stringify(m.findIndicators('Nothing here, nor there, for now.')) === '[]', 'no false positive on "nor", "for", "not", "now"');
      check(JSON.stringify(m.findIndicators('None but the brave deserve the fair; the only road is this one, until it closes.')) === '["none but","the only","until"]', `step-4 indicators "none but", "the only", "until" (${JSON.stringify(m.findIndicators('None but the brave deserve the fair; the only road is this one, until it closes.'))})`);
    } catch (err) {
      check(false, `skeleton.mjs imports as a module: ${err.message}`);
    }
  }

  console.log(failures === 0 ? 'all passed' : `${failures} failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.log(`FAIL runner crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
