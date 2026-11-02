// score-fixtures.js — run the fixture replies through a real KontentKop build.
//
//   KONTENTKOP_BIN=/abs/path/to/kontentkop node scripts/score-fixtures.js
//
// Prints, per fixture, whether KontentKop flagged it, the BC and the non-zero
// metrics, next to the reading from source recorded in the fixture file. Use
// it to check the metric mapping in the skill against the real scorer. It
// writes nothing; it is not part of the test suite because it needs the Go
// binary.
'use strict';

const fs = require('fs');
const path = require('path');
const hook = require(path.join(__dirname, '..', 'hooks', 'kontentkop-agent-output.js'));

const fixturesPath = path.join(__dirname, '..', 'tests', 'fixtures', 'replies.json');
let fixtures;
try {
  fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8')).fixtures;
} catch (err) {
  console.error(`cannot read ${fixturesPath}: ${err.message}`);
  process.exit(2);
}

const scorer = hook.resolveScorer(process.env);
if (scorer.status !== 'ok') {
  console.error(`KONTENTKOP_BIN: ${scorer.status}${scorer.bin ? ` (${scorer.bin})` : ''}`);
  process.exit(2);
}

for (const f of fixtures) {
  const res = hook.runScorer(scorer, f.reply, process.env);
  console.log(`\n== ${f.id}`);
  console.log(`   from source: ${f.kk_reading}`);
  if (res.status !== 'ran') { console.log(`   scorer: ${res.status} ${res.error || ''}`); continue; }
  const p = hook.parseScorerOutput(res.stdout);
  if (!p.flagged) { console.log('   scorer: below its threshold (no scores emitted)'); continue; }
  const nonZero = Object.entries(p.scores).filter(([, v]) => v > 0).map(([k, v]) => `${k}=${v.toFixed(2)}`);
  console.log(`   scorer: BC=${p.bc.toFixed(2)}  ${nonZero.join(' ') || '(all metrics 0.00)'}`);
  console.log(`   ${p.annotated}`);
}
