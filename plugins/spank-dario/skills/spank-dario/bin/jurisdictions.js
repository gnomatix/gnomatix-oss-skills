#!/usr/bin/env node
// spank-dario: activate the reference files that apply to this user, platform and models.
//
// Usage:
//   node bin/jurisdictions.js [--country <cc>]... [--platform <id>] [--model-vendor <id>]... [--json]
//
// Config, YAML frontmatter, read with js-yaml (CORE_SCHEMA). Later files override earlier ones:
//   1. user:    <XDG_CONFIG_HOME or ~/.config>/spank-dario/settings.local.md
//   2. project: <cwd>/.claude/spank-dario.local.md
// Keys:
//   countries:      list of ISO 3166-1 alpha-2 codes, primary first, e.g. [us, ca]
//   platform:       claude-code | codex | gemini-cli | antigravity | kiro
//   model_vendors:  list, e.g. [anthropic, google]
//   hourly_rate:    the user's rate, for bin/estimate.js: a number, or [min, max]
//   currency:       ISO 4217 code for hourly_rate and recorded losses, e.g. CAD
// Command-line options override the config. SPANK_DARIO_COUNTRY (comma-separated) overrides
// the config countries. With no country anywhere, the system locale's region is used and
// reported as "detected", for the agent to confirm and save.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { yaml, JS_YAML_INSTALL } = require(path.join(__dirname, '..', 'lib', 'yaml.js'));

const SKILL_ROOT = path.resolve(__dirname, '..');
const REF = path.join(SKILL_ROOT, 'references');

// ISO 3166-1 alpha-2 codes.
const EU = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se'];
const EEA_CH_UK = [...EU, 'is', 'li', 'no', 'ch', 'gb'];
// Where each vendor's contract for EEA, Swiss and UK customers is governed, from its own terms
// (references/<cc>/vendor-terms/<vendor>.md).
const EEA_CONTRACT_LAW = { anthropic: 'ie', openai: 'ie', google: 'ie', aws: 'lu' };
const PLATFORM_VENDOR = {
  'claude-code': 'anthropic',
  'codex': 'openai',
  'gemini-cli': 'google',
  'antigravity': 'google',
  'kiro': 'aws',
};
// Only these values may reach a reference path or the clarification text.
const KNOWN_VENDORS = new Set(Object.values(PLATFORM_VENDOR));
const COUNTRY_RE = /^[a-z]{2}$/;
function keepValid(values, test, label, rejected) {
  return values.filter(v => {
    if (test(v)) return true;
    rejected.push(`${label} ${JSON.stringify(String(v).slice(0, 40))}`);
    return false;
  });
}

function configFiles(cwd) {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return [
    { scope: 'user', file: path.join(base, 'spank-dario', 'settings.local.md') },
    { scope: 'project', file: path.join(cwd, '.claude', 'spank-dario.local.md') },
  ];
}

function readFrontmatter(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') process.stderr.write(`spank-dario: cannot read ${file}: ${err.code}\n`);
    return null;
  }
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const y = yaml();
  const data = y.load(m[1], { schema: y.CORE_SCHEMA });
  return data && typeof data === 'object' ? data : {};
}

const asList = v => (v == null ? [] : Array.isArray(v) ? v : [v]).map(x => String(x).trim().toLowerCase()).filter(Boolean);

function loadConfig(cwd) {
  const cfg = { countries: [], platform: null, model_vendors: [], hourly_rate: null, currency: null, sources: [] };
  for (const { scope, file } of configFiles(cwd)) {
    const d = readFrontmatter(file);
    if (d === null) continue;
    cfg.sources.push(`${scope}: ${file}`);
    const c = asList(d.countries != null ? d.countries : d.country);
    if (c.length) cfg.countries = c;
    if (d.platform) cfg.platform = String(d.platform).toLowerCase();
    const v = asList(d.model_vendors);
    if (v.length) cfg.model_vendors = v;
    if (Array.isArray(d.hourly_rate) && d.hourly_rate.length === 2 && d.hourly_rate.every(x => Number.isFinite(Number(x)))) cfg.hourly_rate = d.hourly_rate.map(Number);
    else if (d.hourly_rate != null && Number.isFinite(Number(d.hourly_rate))) cfg.hourly_rate = Number(d.hourly_rate);
    if (d.currency) cfg.currency = String(d.currency).toUpperCase();
  }
  return cfg;
}

function parseArgs(argv) {
  const out = { countries: [], platform: null, vendors: [], json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--country') { const v = argv[++i]; if (v) out.countries.push(v.toLowerCase()); }
    else if (a === '--platform') out.platform = (argv[++i] || '').toLowerCase() || null;
    else if (a === '--model-vendor') { const v = argv[++i]; if (v) out.vendors.push(v.toLowerCase()); }
    else if (a === '--json') out.json = true;
  }
  return out;
}

function localeCountry() {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const m = loc.match(/[-_]([A-Za-z]{2})\b/);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function select(args, cwd) {
  const cfg = loadConfig(cwd);

  let countries = args.countries;
  let countrySource = 'argument';
  if (!countries.length && process.env.SPANK_DARIO_COUNTRY) { countries = asList(process.env.SPANK_DARIO_COUNTRY.split(',')); countrySource = 'environment'; }
  if (!countries.length && cfg.countries.length) { countries = cfg.countries; countrySource = 'config'; }
  if (!countries.length) { const l = localeCountry(); if (l) { countries = [l]; countrySource = 'detected'; } }
  const rejected = [];
  countries = keepValid(countries, c => COUNTRY_RE.test(c), 'country', rejected);
  if (!countries.length) countrySource = 'none';

  let platform = args.platform || cfg.platform || (process.env.CLAUDECODE ? 'claude-code' : 'unknown');
  if (platform !== 'unknown' && !PLATFORM_VENDOR[platform]) { rejected.push(`platform ${JSON.stringify(String(platform).slice(0, 40))}`); platform = 'unknown'; }
  const vendors = new Set(keepValid([...cfg.model_vendors, ...args.vendors], v => KNOWN_VENDORS.has(v), 'model vendor', rejected));
  for (const r of rejected) process.stderr.write(`spank-dario: ignored unknown ${r}\n`);
  if (PLATFORM_VENDOR[platform]) vendors.add(PLATFORM_VENDOR[platform]);

  const want = [['int/berne.md', 'Berne Convention']];
  for (const cc of countries) {
    want.push([`${cc}/law.md`, `country ${cc}`]);
    if (EU.includes(cc)) want.push(['eu/law.md', `${cc} is an EU member`]);
  }
  for (const v of vendors) {
    want.push([`us/vendor-terms/${v}.md`, `${v} terms, US-published documents`]);
    for (const cc of countries) {
      want.push([`${cc}/vendor-terms/${v}.md`, `${v} terms for ${cc}`]);
      const region = EEA_CONTRACT_LAW[v];
      if (region && EEA_CH_UK.includes(cc)) {
        want.push([`${region}/vendor-terms/${v}.md`, `${v} terms for EEA, Switzerland and UK customers`]);
        want.push([`${region}/law.md`, `${v}'s terms for EEA, Swiss and UK customers name a company or governing law in ${region}`]);
      }
    }
  }

  // Each selected law file brings its folder's skill.md and strawmen.md.
  for (const [rel, reason] of [...want]) {
    const m = rel.match(/^(\w+)\/(law|berne)\.md$/);
    if (!m) continue;
    for (const f of ['skill.md', 'strawmen.md']) {
      if (f === 'strawmen.md' && !isFile(path.join(REF, m[1], f))) continue;
      want.push([`${m[1]}/${f}`, reason]);
    }
  }
  const seen = new Set();
  const active = [];
  const missing = [];
  for (const [rel, reason] of want) {
    if (seen.has(rel)) continue;
    seen.add(rel);
    const abs = path.resolve(REF, ...rel.split('/'));
    if (!abs.startsWith(path.resolve(REF) + path.sep)) { rejected.push(`path ${JSON.stringify(rel)}`); continue; }
    (isFile(abs) ? active : missing).push({ file: abs, reason });
  }

  return { countries, country_source: countrySource, platform, vendors: [...vendors], config: cfg.sources, active, missing, rejected };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = select(args, process.cwd());
  const { countries, platform, active, missing } = result;
  const countrySource = result.country_source;
  const cfg = { sources: result.config };
  const vendors = result.vendors;
  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }
  const lines = [];
  lines.push(`config: ${cfg.sources.length ? cfg.sources.join('; ') : 'none'}`);
  lines.push(`countries: ${countries.join(', ') || 'unknown'} (${countrySource})`);
  if (countrySource === 'detected') lines.push('  detected from the system locale: confirm with the user and save it to the config');
  lines.push(`platform: ${platform}`);
  lines.push(`vendors: ${vendors.join(', ') || 'none'}`);
  lines.push('read:');
  for (const a of active) lines.push(`  ${a.file}  (${a.reason})`);
  if (missing.length) {
    lines.push('no reference yet (report as a gap):');
    for (const m of missing) lines.push(`  ${m.file}  (${m.reason})`);
  }
  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { select, parseArgs, loadConfig, REF };

if (require.main === module) try {
  main();
} catch (err) {
  if (err && err.code === 'SPANK_DARIO_NO_YAML') process.stderr.write(`spank-dario: ${err.message}\n`);
  else process.stderr.write(`spank-dario: ${err && err.message ? err.message : err}\n  js-yaml install: ${JS_YAML_INSTALL}\n`);
  process.exitCode = 1;
}
