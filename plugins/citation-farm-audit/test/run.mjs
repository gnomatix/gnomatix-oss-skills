// Live test of scripts/openalex-profile.mjs against the OpenAlex API (https://api.openalex.org/,
// or OPENALEX_BASE). Runs the script for a real author and checks that every section of the
// profile is present and well formed, and that a bad id is refused.
// usage: node test/run.mjs [author id, default A5046940339: Brett R. Whitty, ORCID 0000-0001-5776-5424]
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../scripts/openalex-profile.mjs', import.meta.url));
const id = process.argv[2] || 'A5046940339';
const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 120000 });

const r = run([id]);
let o = {};
try { o = JSON.parse(r.stdout); } catch { }
const list = (a, n) => Array.isArray(a) && a.length >= n;
const bad = run(['not-an-id']);
const checks = {
  'exit 0, nothing on stderr': r.status === 0 && !r.stderr.trim(),
  'author and retrieved date': o.author === id && /^\d{4}-\d{2}-\d{2}$/.test(o.retrieved || ''),
  'top works: "year | cited N | title | doi"': list(o.top, 1) && o.top.every((t) => /^\d{4} \| cited \d+ \| .+ \| /.test(t)),
  'co-authors listed, without the author': list(o.coauthors, 1) && o.coauthors.every((c) => /\(\d+\)$/.test(c)),
  'citing works counted': Number.isInteger(o.citingWorks) && o.citingWorks > 0,
  'self-citing counted, not above citing': Number.isInteger(o.selfCiting) && o.selfCiting <= o.citingWorks,
  'top citers listed': list(o.topCiters, 1) && o.topCiters.every((c) => /\(\d+\)$/.test(c)),
  'citer fields listed': list(o.citerFields, 1) && o.citerFields.every((f) => / \d+$/.test(f)),
  'funders listed, "unknown" left out': Array.isArray(o.funders) && !o.funders.some((f) => /^unknown\b/i.test(f)),
  'bad id refused with usage, exit 2': bad.status === 2 && /usage/.test(bad.stderr),
};
for (const [k, v] of Object.entries(checks)) console.log(`${v ? 'ok  ' : 'FAIL'} ${k}`);
if (r.stderr.trim()) console.log('stderr: ' + r.stderr.trim());
const pass = Object.values(checks).every(Boolean);
console.log(pass ? 'all passed' : 'FAILED');
process.exit(pass ? 0 : 1);
