#!/usr/bin/env node
// spank-dario: rebuild references/us/rates-gsa-calc.json from GSA CALC ceiling rates
// (current_price, USD/hour), every record per keyword, filtered to 10+ years' experience.
// Sequential requests, 100 records each. A CLI, not a hook, so it runs curl with an argument list.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const keywords = ['software engineer', 'systems administrator', 'bioinformatics', 'data scientist'];
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return +(s[lo] + (s[hi] - s[lo]) * (i - lo)).toFixed(2); };
const out = { retrieved: new Date().toISOString(), api: 'https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/', filter: 'min_years_experience >= 10', results: {} };
for (const kw of keywords) {
  const prices = [];
  let total = null;
  for (let page = 1; page <= 60; page++) {
    const url = `https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/?keyword=${encodeURIComponent(kw)}&page=${page}&page_size=100`;
    const r = spawnSync('curl', ['-sL', '--max-time', '40', '-A', 'Mozilla/5.0', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    let j; try { j = JSON.parse(r.stdout); } catch { break; }
    const hits = (j.hits && j.hits.hits) || [];
    if (total === null) total = j.hits && j.hits.total && j.hits.total.value;
    for (const h of hits) { const s = h._source; if (s && typeof s.current_price === 'number' && (s.min_years_experience || 0) >= 10) prices.push(s.current_price); }
    if (hits.length < 100) break;
  }
  out.results[kw] = prices.length ? { n: prices.length, matched_total: total, p25: pct(prices, 0.25), median: pct(prices, 0.5), p75: pct(prices, 0.75), p90: pct(prices, 0.9), max: Math.max(...prices) } : { n: 0, matched_total: total };
  console.log(kw, JSON.stringify(out.results[kw]));
}
fs.writeFileSync(path.join(__dirname, '..', 'references', 'us', 'rates-gsa-calc.json'), JSON.stringify(out, null, 2) + '\n');
