#!/usr/bin/env node
// spank-dario: User Harms / Cost Estimates from the incident log, for the current session or past sessions, at any time.
//
// Usage: node bin/estimate.js [--country <cc>]... [--rate <per hour> | --rate <min>-<max>] [--currency <code>] [--since <date>]
//                            [--usage <transcript file|dir>]... [--json]
// Config keys (settings.local.md): countries, hourly_rate, currency, incident_minutes, token_prices, token_prices_currency.
//
// Three figures, kept apart:
//   actual loss     minutes lost x hourly rate, plus recorded losses. This is the compensatory
//                   measure Moffatt v. Air Canada applied (the customer's actual loss).
//   statutory       per-violation ranges a statute sets, for incidents of the type it covers,
//                   in the user's jurisdictions (lib/damages.js), with the elements of each claim.
//   usage cost      with --usage: the API-equivalent cost of the tokens in Claude Code transcripts at
//                   list price (lib/usage.js), the figure Claude Code's /usage computes. The net is that
//                   cost minus the actual loss, in the same currency only; no conversion.
// refusal-candidate incidents (possible refusals the transcript scan found) are priced like every
// other incident, and counted separately in the report.

'use strict';
const path = require('path');
const { readIncidents } = require(path.join(__dirname, '..', 'lib', 'incidents.js'));
const { STATUTORY, REFERENCE_AWARDS, REMEDIES } = require(path.join(__dirname, '..', 'lib', 'damages.js'));
const { loadConfig } = require('./jurisdictions.js');
const { usageCost } = require(path.join(__dirname, '..', 'lib', 'usage.js'));
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
const money = (n, c) => `${c ? `${c} ` : ''}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function estimate() {
  const cfg = loadConfig(process.cwd());
  const countries = opts('--country').map(c => c.toLowerCase());
  const cc = countries.length ? countries : cfg.countries;
  const [rateMin, rateMax] = parseRate(opt('--rate') || cfg.hourly_rate);
  // No default currency: with none configured, amounts carry no code and the output says so.
  const cur = opt('--currency') || cfg.currency;
  const currency = cur ? String(cur).toUpperCase() : null;
  const since = opt('--since') ? new Date(opt('--since')) : null;
  const all = readIncidents().filter(i => !since || new Date(i.at) >= since);
  const priced = all;
  const candidates = all.filter(i => i.type === 'refusal-candidate');

  // Time for each incident: what was recorded with it, else the user's incident_minutes for its type.
  // An incident with neither is listed as not priced, never counted as zero.
  let minutes = 0;
  const pricedFrom = { recorded: 0, config: 0 };
  const unpriced = {};
  for (const i of priced) {
    const recorded = Number(i.minutes);
    const perIncident = cfg.incident_minutes[i.type];
    if (recorded > 0) { minutes += recorded; pricedFrom.recorded++; }
    else if (perIncident > 0) { minutes += perIncident * (Number(i.count) || 1); pricedFrom.config++; }
    else unpriced[i.type] = (unpriced[i.type] || 0) + (Number(i.count) || 1);
  }
  const losses = priced.reduce((a, i) => a + (Number(i.loss) || 0), 0);
  const hours = minutes / 60;
  const actual = { minutes, hours, priced_from: pricedFrom, rate_min: rateMin, rate_max: rateMax, currency, time_value_min: hours * rateMin, time_value_max: hours * rateMax, other_losses: losses, total_min: hours * rateMin + losses, total_max: hours * rateMax + losses };
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
  const usagePaths = opts('--usage');
  const usage = usagePaths.length ? usageCost(usagePaths, cfg) : null;
  // Net: usage cost minus the failure cost, only when both are in the same currency.
  let net = null;
  let netNote = null;
  if (usage) {
    if (!usage.currency) netNote = 'net not computed: the usage cost has no currency (no price file and no token_prices_currency)';
    else if (!currency) netNote = `net not computed: usage cost is in ${usage.currency}, failure cost has no currency set`;
    else if (currency !== usage.currency) netNote = `net not computed: usage cost is in ${usage.currency}, failure cost is in ${currency}; no conversion is made`;
    else net = { min: usage.cost - actual.total_max, max: usage.cost - actual.total_min, currency };
  }
  return { countries: cc, incidents: priced.length, usage, net, net_note: netNote, by_type: byType, actual, unpriced, config_errors: cfg.config_errors, gsa_rates: gsa, gsa_source: g ? { api: g.api, retrieved: g.retrieved, filter: g.filter } : null, statutory, references, remedies, refusal_candidates: candidates.reduce((a, i) => a + (Number(i.count) || 1), 0) };
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
    const notPriced = Object.entries(e.unpriced);
    L.push(`hours lost: ${a.hours.toFixed(2)} h, from ${a.priced_from.recorded} incident(s) with time recorded and ${a.priced_from.config} priced at incident_minutes in the config`);
    L.push(`actual loss${notPriced.length ? ', priced incidents only' : ''}: ${a.hours.toFixed(2)} h at ${span(a.rate_min, a.rate_max)}/h = ${span(a.time_value_min, a.time_value_max)}, plus other losses ${money(a.other_losses, a.currency)}: ${span(a.total_min, a.total_max)}`);
    for (const [type, n] of notPriced) L.push(`NOT PRICED: ${n} ${type} incident(s) have no time recorded. Set incident_minutes: { ${type}: <minutes> } in the config, or record the time with bin/incident.js --minutes.`);
    for (const m of e.config_errors) L.push(`config: ${m}`);
    if (!a.rate_max) L.push('  no hourly rate set: add hourly_rate to the config or pass --rate');
    if (!a.currency) L.push('  no currency set: add currency to the config or pass --currency');
    if (e.gsa_rates.length) {
      L.push(`US government reference rates (GSA CALC ceiling rates, ${e.gsa_source.filter}, retrieved ${e.gsa_source.retrieved.slice(0, 10)})${notPriced.length ? ', priced incidents only' : ''}:`);
      for (const r of e.gsa_rates) L.push(`  ${r.keyword} (n=${r.n}): median USD ${r.median}/h, 25th to 90th percentile USD ${r.p25} to ${r.p90}: time lost = USD ${r.time_value_p25.toFixed(2)} to ${r.time_value_p90.toFixed(2)}`);
    }
    for (const s of e.statutory) {
      L.push(`statutory (${s.jurisdiction}): ${s.violations} x ${s.id}: ${money(s.min, s.currency)} to ${money(s.max, s.currency)}`);
      L.push(`  source: ${s.source}`);
      L.push(`  elements: ${s.elements}`);
    }
    for (const r of e.references) L.push(`reference award (${r.jurisdiction}): ${r.case}: ${money(r.amount, r.currency)} (${r.breakdown})${r.note ? ` (${r.note})` : ''}`);
    for (const r of e.remedies) L.push(`remedies (${r.jurisdiction}): ${r.text}`);
    if (e.usage) {
      const u = e.usage;
      const um = n => money(n, u.currency);
      const toks = b => `${b.input_tokens} input, ${b.cache_write_5m_tokens} 5m cache write, ${b.cache_write_1h_tokens} 1h cache write, ${b.cache_write_unsplit_tokens ? `${b.cache_write_unsplit_tokens} cache write without the 5m/1h split, ` : ''}${b.cache_read_tokens} cache read, ${b.output_tokens} output`;
      const unpricedModels = Object.entries(u.unpriced);
      L.push(`API-equivalent usage cost (list price, as Claude Code /usage computes it)${unpricedModels.length ? ', priced models only' : ''}: ${um(u.cost)}, from ${u.messages} API message(s) in ${u.files} transcript file(s)`);
      if (u.price_source) L.push(`  prices: ${u.price_source.url}, retrieved ${u.price_source.retrieved} (references/us/anthropic-api-prices.json)`);
      for (const [m, b] of Object.entries(u.by_model)) L.push(`  ${m}: ${b.messages} message(s), ${toks(b)} tokens${b.prompt_rows ? `, ${Object.entries(b.prompt_rows).map(([r, n]) => `${n} on the prompts ${r} tokens row`).join(', ')}` : ''}${b.us_inference_messages ? `, ${b.us_inference_messages} at the 1.1x US-only inference rate` : ''}: ${um(b.cost)} (prices from ${b.price_from})`);
      for (const [m, b] of unpricedModels) L.push(`NOT PRICED: ${m}: ${b.messages} message(s), ${toks(b)} tokens: ${b.reason}. Set token_prices: { ${m}: { input, cache_write_5m, cache_write_1h, cache_read, output } } and token_prices_currency in the config, from the vendor's pricing page.`);
      if (u.subagent_transcripts_not_included) L.push(`  ${u.subagent_transcripts_not_included} subagent transcript(s) beside this file not included; pass the session directory to --usage to add them`);
      L.push(`user failure cost (the actual loss above)${notPriced.length ? ', priced incidents only' : ''}: ${span(a.total_min, a.total_max)}`);
      if (e.net) {
        const caveat = [unpricedModels.length && 'priced models only', notPriced.length && 'priced incidents only'].filter(Boolean).join(', ');
        L.push(`net (usage cost minus failure cost)${caveat ? `, ${caveat}` : ''}: ${e.net.min === e.net.max ? money(e.net.min, e.net.currency) : `${money(e.net.min, e.net.currency)} to ${money(e.net.max, e.net.currency)}`}`);
      } else L.push(e.net_note);
    }
    if (e.refusal_candidates) L.push(`refusal candidates found by the transcript scan, priced with the rest: ${e.refusal_candidates}`);
    process.stdout.write(L.join('\n') + '\n');
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.message}\n`);
  process.exitCode = 1;
}
