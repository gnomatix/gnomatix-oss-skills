#!/usr/bin/env node
// spank-dario: estimate damages from the incident log, at any time.
//
// Usage: node bin/estimate.js [--country <cc>]... [--rate <per hour> | --rate <min>-<max>] [--currency <code>] [--since <date>] [--json]
// Config keys (settings.local.md): countries, hourly_rate, currency.
//
// Two figures, kept apart:
//   actual loss     minutes lost x hourly rate, plus recorded losses. This is the compensatory
//                   measure Moffatt v. Air Canada applied (the customer's actual loss).
//   statutory       per-violation ranges a statute sets, for incidents of the type it covers,
//                   in the user's jurisdictions (lib/damages.js). Each claim's elements still
//                   have to be proved; the range is not a prediction for any one case.
// refusal-candidate incidents are listed but not priced until the user confirms them
// with bin/incident.js.

'use strict';
const path = require('path');
const { readIncidents } = require(path.join(__dirname, '..', 'lib', 'incidents.js'));
const { STATUTORY, REFERENCE_AWARDS, REMEDIES } = require(path.join(__dirname, '..', 'lib', 'damages.js'));
const { loadConfig } = require('./jurisdictions.js');
const fs = require('fs');

function gsaRates() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'references', 'us', 'rates-gsa-calc.json'), 'utf8')); } catch { return null; }
}

function parseRate(v) {
  if (Array.isArray(v)) return [Number(v[0]), Number(v[1])];
  if (typeof v === 'string' && /^\d+(\.\d+)?-\d+(\.\d+)?$/.test(v)) return v.split('-').map(Number);
  const n = Number(v || 0);
  return [n, n];
}

function opts(name) {
  const out = [];
  process.argv.forEach((a, i) => { if (a === name && process.argv[i + 1]) out.push(process.argv[i + 1]); });
  return out;
}
const opt = name => opts(name)[0];
const money = (n, c) => `${c} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function estimate() {
  const cfg = loadConfig(process.cwd());
  const countries = opts('--country').map(c => c.toLowerCase());
  const cc = countries.length ? countries : cfg.countries;
  const [rateMin, rateMax] = parseRate(opt('--rate') || cfg.hourly_rate);
  const currency = (opt('--currency') || cfg.currency || 'CAD').toUpperCase();
  const since = opt('--since') ? new Date(opt('--since')) : null;
  const all = readIncidents().filter(i => !since || new Date(i.at) >= since);
  const priced = all.filter(i => i.type !== 'refusal-candidate');
  const candidates = all.filter(i => i.type === 'refusal-candidate');

  const minutes = priced.reduce((a, i) => a + (Number(i.minutes) || 0), 0);
  const losses = priced.reduce((a, i) => a + (Number(i.loss) || 0), 0);
  const hours = minutes / 60;
  const actual = { minutes, hours, rate_min: rateMin, rate_max: rateMax, currency, time_value_min: hours * rateMin, time_value_max: hours * rateMax, other_losses: losses, total_min: hours * rateMin + losses, total_max: hours * rateMax + losses };
  const g = gsaRates();
  const gsa = g ? Object.entries(g.results).filter(([, r]) => r.n).map(([kw, r]) => ({ keyword: kw, n: r.n, p25: r.p25, median: r.median, p90: r.p90, time_value_p25: hours * r.p25, time_value_median: hours * r.median, time_value_p90: hours * r.p90 })) : [];

  const statutory = [];
  for (const c of cc) for (const s of STATUTORY[c] || []) {
    const n = priced.filter(i => s.applies_to.includes(i.type)).reduce((a, i) => a + (Number(i.count) || 1), 0);
    if (n) statutory.push({ jurisdiction: c, id: s.id, violations: n, min: n * s.min, max: n * s.max, currency: s.currency, source: s.source, elements: s.elements });
  }
  const references = cc.flatMap(c => (REFERENCE_AWARDS[c] || []).map(r => ({ jurisdiction: c, ...r })));
  const remedies = cc.filter(c => REMEDIES[c]).map(c => ({ jurisdiction: c, text: REMEDIES[c] }));
  const byType = priced.reduce((a, i) => ((a[i.type] = (a[i.type] || 0) + (Number(i.count) || 1)), a), {});
  return { countries: cc, incidents: priced.length, by_type: byType, actual, gsa_rates: gsa, gsa_source: g ? { api: g.api, retrieved: g.retrieved, filter: g.filter } : null, statutory, references, remedies, unconfirmed_refusal_candidates: candidates.length };
}

try {
  const e = estimate();
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(e, null, 2) + '\n');
  } else {
    const L = [];
    L.push(`jurisdictions: ${e.countries.join(', ') || 'none set'}`);
    L.push(`incidents: ${e.incidents} ${JSON.stringify(e.by_type)}`);
    const a = e.actual;
    const span = (x, y) => (x === y ? money(x, a.currency) : `${money(x, a.currency)} to ${money(y, a.currency)}`);
    L.push(`actual loss: ${a.hours.toFixed(2)} h at ${span(a.rate_min, a.rate_max)}/h = ${span(a.time_value_min, a.time_value_max)}, plus other losses ${money(a.other_losses, a.currency)}: ${span(a.total_min, a.total_max)}`);
    if (!a.rate_max) L.push('  no hourly rate set: add hourly_rate to the config or pass --rate');
    if (e.gsa_rates.length) {
      L.push(`US government reference rates (GSA CALC ceiling rates, ${e.gsa_source.filter}, retrieved ${e.gsa_source.retrieved.slice(0, 10)}):`);
      for (const r of e.gsa_rates) L.push(`  ${r.keyword} (n=${r.n}): median USD ${r.median}/h, 25th to 90th percentile USD ${r.p25} to ${r.p90}: time lost = USD ${r.time_value_p25.toFixed(2)} to ${r.time_value_p90.toFixed(2)}`);
    }
    for (const s of e.statutory) {
      L.push(`statutory (${s.jurisdiction}): ${s.violations} x ${s.id}: ${money(s.min, s.currency)} to ${money(s.max, s.currency)}`);
      L.push(`  source: ${s.source}`);
      L.push(`  elements to prove: ${s.elements}`);
    }
    for (const r of e.references) L.push(`reference award (${r.jurisdiction}): ${r.case}: ${money(r.amount, r.currency)} (${r.breakdown})${r.note ? ` (${r.note})` : ''}`);
    for (const r of e.remedies) L.push(`remedies (${r.jurisdiction}): ${r.text}`);
    if (e.unconfirmed_refusal_candidates) L.push(`unconfirmed refusal candidates: ${e.unconfirmed_refusal_candidates} (not priced; confirm with bin/incident.js refusal --minutes N)`);
    process.stdout.write(L.join('\n') + '\n');
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.message}\n`);
  process.exitCode = 1;
}
