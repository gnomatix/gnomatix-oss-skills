// Test double for the KontentKop binary. NOT KontentKop: it does no scoring.
// It reproduces only the output contract read from KontentKop's main.go and
// src/scorer.go so the hook's process handling and parsing can be tested
// without the Go binary:
//   below threshold -> echo the trimmed input, exit 0
//   at/above        -> summary line, blank line, annotated text, exit 0
//
// Behaviour is picked by FAKE_KK_MODE:
//   pass   echo input (default)
//   flag   summary with BC = FAKE_KK_BC (default 0.60), whole text highlighted
//   crash  write to stderr, exit 3
//   hang   never exit (for timeout tests)
//   cwd    print process.cwd() as the annotated text (to check KONTENTKOP_CONFIG_DIR)
'use strict';

const KEYS = [
  'dark_triad', 'coercive_ctrl', 'liwc_anger', 'manipulation',
  'sycophancy', 'false_authority', 'gaslighting', 'learned_helpless',
  'emotional_manip', 'passive_aggr', 'condescension', 'evasion',
  'semantic_overload', 'false_empathy', 'toxicity',
];

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { data += c; });
process.stdin.on('end', () => {
  const input = data.trim();
  const mode = process.env.FAKE_KK_MODE || 'pass';
  if (mode === 'hang') { setInterval(() => {}, 1000); return; }
  if (mode === 'crash') { process.stderr.write('fake scorer crashed\n'); process.exit(3); }
  if (!input) process.exit(0);
  if (mode === 'pass') { process.stdout.write(input); process.exit(0); }
  const bc = Number(process.env.FAKE_KK_BC || '0.60');
  const parts = KEYS.map((k) => `${k}=${k === 'evasion' ? '0.50' : '0.00'}`);
  parts.push(`BC=${bc.toFixed(2)}`);
  const summary = `[${parts.join(',')}] Text exceeds BC threshold [see: KK.md]; revise or respond with #appeal`;
  const annotated = mode === 'cwd'
    ? process.cwd()
    : `{==${input}==}{>>evasion=0.50: synthetic test annotation<<}`;
  process.stdout.write(`${summary}\n\n${annotated}\n`);
  process.exit(0);
});
