// ontology-lookup: find, resolve and trace registry identifiers (CURIEs).
//
//   node lookup.mjs <term> [--ontology go,chebi | default | all] [--limit 5] [--json]
//   node lookup.mjs --resolve <CURIE> [--json]
//   node lookup.mjs --lineage <word> [--lang en] [--section English] [--json]
//
// Common options: --cache-dir <dir>  --offline  --refresh  --max-age-days <n>
//
// Node 20+, standard library only. Prefixes come from Bioregistry
// (https://bioregistry.io); nothing in this file mints a prefix of its own.
// Every response is cached on disk under a directory the user controls
// (--cache-dir, else $ONTOLOGY_LOOKUP_CACHE, else the platform cache dir).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const VERSION = '0.1.0';
export const USER_AGENT =
  process.env.ONTOLOGY_LOOKUP_UA ||
  `ontology-lookup/${VERSION} (+https://github.com/gnomatix/gnomatix-oss-skills) node/${process.versions.node}`;

const BIOREGISTRY = 'https://bioregistry.io/api/registry/';
const OLS = 'https://www.ebi.ac.uk/ols4/api/';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_ENTITY = 'https://www.wikidata.org/wiki/Special:EntityData/';
const WDQS = 'https://query.wikidata.org/sparql';
const WIKTIONARY_RAW = 'https://en.wiktionary.org/w/index.php';

// The starter set. Keys are Bioregistry prefixes (checked against
// https://bioregistry.io/api/registry/<key>); `backend` says where labels come from.
export const SOURCES = {
  go: { backend: 'ols', ols: 'go' },
  chebi: { backend: 'ols', ols: 'chebi' },
  uberon: { backend: 'ols', ols: 'uberon' },
  ncbitaxon: { backend: 'ols', ols: 'ncbitaxon' },
  so: { backend: 'ols', ols: 'so' },
  bfo: { backend: 'ols', ols: 'bfo' },
  edam: { backend: 'ols', ols: 'edam' },
  mesh: { backend: 'ols', ols: 'mesh' },
  skos: { backend: 'ols', ols: 'skos' },
  dcterms: { backend: 'ols', ols: 'dcterms' },
  dc: { backend: 'ols', ols: 'dc' },
  prov: { backend: 'ols', ols: 'prov' },
  wikidata: { backend: 'wikidata' },
  schema: { backend: 'jsonld', url: 'https://schema.org/version/latest/schemaorg-current-https.jsonld' },
  time: { backend: 'turtle', url: 'https://www.w3.org/2006/time' },
  'qudt.unit': { backend: 'turtle', url: 'https://qudt.org/vocab/unit/' },
  'qudt.quantitykind': { backend: 'turtle', url: 'https://qudt.org/vocab/quantitykind/' },
  'iso.639-3': { backend: 'language' },
  glottolog: { backend: 'language' },
};

// Searched when --ontology is not given: the API-backed sources. The
// file-backed ones (schema, time, qudt.*) download a whole vocabulary on first
// use, so they are searched only when named or with --ontology all.
export const DEFAULT_SOURCES = [
  'go', 'chebi', 'uberon', 'ncbitaxon', 'so', 'bfo', 'edam', 'mesh',
  'skos', 'dcterms', 'dc', 'prov', 'wikidata',
];

// Wiktionary etymology templates whose chain this script follows, checked at
// https://en.wiktionary.org/wiki/Template:inherited (and the derived, borrowed,
// learned borrowing pages; inh+/der+/bor+/lbor redirect to them).
const ETYM_TEMPLATES = new Map([
  ['inh', 'inherited from'], ['inherited', 'inherited from'], ['inh+', 'inherited from'],
  ['der', 'derived from'], ['derived', 'derived from'], ['der+', 'derived from'],
  ['bor', 'borrowed from'], ['borrowed', 'borrowed from'], ['bor+', 'borrowed from'],
  ['lbor', 'learned borrowing from'], ['learned borrowing', 'learned borrowing from'],
]);

// ---------------------------------------------------------------------------
// Cache and HTTP

export function defaultCacheDir() {
  if (process.env.ONTOLOGY_LOOKUP_CACHE) return path.resolve(process.env.ONTOLOGY_LOOKUP_CACHE);
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'ontology-lookup', 'cache');
  }
  if (process.env.XDG_CACHE_HOME) return path.join(process.env.XDG_CACHE_HOME, 'ontology-lookup');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Caches', 'ontology-lookup');
  return path.join(os.homedir(), '.cache', 'ontology-lookup');
}

export function cacheKey(url, accept) {
  return crypto.createHash('sha256').update(`${url}\n${accept || ''}`).digest('hex').slice(0, 40);
}

export function cachePath(cacheDir, url, accept) {
  let host = 'unknown-host';
  try { host = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_'); } catch { /* keep default */ }
  return path.join(cacheDir, host, `${cacheKey(url, accept)}.json`);
}

function warn(msg) {
  try { process.stderr.write(`ontology-lookup: ${msg}\n`); } catch { /* stderr closed */ }
}

function readCache(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err && err.code !== 'ENOENT') warn(`cache read failed (${err.code || err.message}): ${file}`);
    return null;
  }
}

function writeCache(file, entry) {
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(entry), 'utf8');
    fs.renameSync(tmp, file);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* cleanup best-effort */ }
    warn(`cache write failed (${err.code || err.message}): ${file}`);
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(url, status) {
    super(`HTTP ${status} for ${url}`);
    this.url = url;
    this.status = status;
  }
}

export class OfflineMiss extends Error {
  constructor(url) {
    super(`offline: no cached response for ${url}`);
    this.url = url;
    this.code = 'EOFFLINE';
  }
}

export function createClient(opts = {}) {
  const cacheDir = path.resolve(opts.cacheDir || defaultCacheDir());
  const offline = Boolean(opts.offline);
  const refresh = Boolean(opts.refresh);
  const maxAgeMs = (opts.maxAgeDays ?? 30) * 86400000;
  const fetchImpl = opts.fetch || globalThis.fetch;

  async function getText(url, { accept = 'application/json', timeoutMs = 30000 } = {}) {
    const file = cachePath(cacheDir, url, accept);
    const cached = readCache(file);
    if (cached && typeof cached.body === 'string') {
      const age = Date.now() - Date.parse(cached.fetchedAt || 0);
      if (offline || (!refresh && age < maxAgeMs)) {
        if (cached.status === 404) throw new HttpError(url, 404);
        return cached.body;
      }
    }
    if (offline) throw new OfflineMiss(url);
    if (typeof fetchImpl !== 'function') throw new Error('global fetch is unavailable; Node 20+ is required');
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchImpl(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: accept },
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          const err = new HttpError(url, res.status);
          // A 404 is an answer (unknown prefix, no such page): cache it like one.
          if (res.status === 404) writeCache(file, { url, accept, status: 404, fetchedAt: new Date().toISOString(), body: '' });
          if (res.status >= 500 && attempt === 0) { lastErr = err; await sleep(1000); continue; }
          throw err;
        }
        const body = await res.text();
        writeCache(file, { url, accept, status: res.status, fetchedAt: new Date().toISOString(), body });
        return body;
      } catch (err) {
        if (err instanceof HttpError) throw err;
        lastErr = err;
        if (attempt === 0) { await sleep(1000); continue; }
      }
    }
    // Network failure: fall back to a stale cache entry rather than nothing.
    if (cached && typeof cached.body === 'string' && cached.status !== 404) {
      warn(`network failed, using cached copy from ${cached.fetchedAt}: ${url}`);
      return cached.body;
    }
    throw lastErr;
  }

  async function getJson(url, opts2 = {}) {
    const text = await getText(url, opts2);
    try { return JSON.parse(text); } catch { throw new Error(`not JSON: ${url}`); }
  }

  return { cacheDir, offline, getText, getJson };
}

// ---------------------------------------------------------------------------
// Bioregistry

const registryMemo = new WeakMap();

export async function getRegistry(client, prefix) {
  let memo = registryMemo.get(client);
  if (!memo) { memo = new Map(); registryMemo.set(client, memo); }
  const key = String(prefix).toLowerCase();
  if (memo.has(key)) return memo.get(key);
  let rec = null;
  try {
    const j = await client.getJson(BIOREGISTRY + encodeURIComponent(key));
    if (j && j.prefix && j.uri_format) rec = j;
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) throw err;
  }
  memo.set(key, rec);
  return rec;
}

export function curiePrefixOf(rec) {
  return rec.preferred_prefix || rec.prefix;
}

export function uriPrefixes(rec) {
  const out = new Set();
  const add = (fmt) => {
    if (typeof fmt === 'string' && fmt.endsWith('$1') && fmt.indexOf('$1') === fmt.length - 2) out.add(fmt.slice(0, -2));
  };
  add(rec.uri_format);
  add(rec.rdf_uri_format);
  for (const p of rec.providers || []) add(p.uri_format);
  return [...out];
}

const stripScheme = (s) => s.replace(/^https?:\/\//i, '');

export function patternOk(rec, local) {
  if (!rec.pattern) return true;
  try { return new RegExp(rec.pattern).test(local); } catch { return true; }
}

// Map an IRI to a CURIE using the Bioregistry records given. Longest URI
// prefix wins; the local id must match the registry pattern. Returns null when
// no record matches: the caller then has no CURIE and must not tag.
export function curieFromIri(iri, recs) {
  const m = matchIri(iri, recs);
  return m ? m.curie : null;
}

export function matchIri(iri, recs) {
  if (typeof iri !== 'string' || !iri) return null;
  const bare = stripScheme(iri);
  let best = null;
  for (const rec of recs) {
    if (!rec) continue;
    for (const pre of uriPrefixes(rec)) {
      const p = stripScheme(pre);
      if (bare.startsWith(p) && bare.length > p.length && (!best || p.length > best.len)) {
        const local = bare.slice(p.length);
        if (patternOk(rec, local)) best = { len: p.length, curie: `${curiePrefixOf(rec)}:${local}`, rec };
      }
    }
  }
  return best ? { curie: best.curie, rec: best.rec } : null;
}

export function formatTag(label, curie) {
  return `«${label}» [${curie}]`;
}

// ---------------------------------------------------------------------------
// Vocabulary files (schema.org JSON-LD, Turtle for OWL-Time and QUDT)

function literalValues(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.flatMap(literalValues);
  if (typeof v === 'string') return [v];
  if (typeof v === 'object' && typeof v['@value'] === 'string') {
    if (v['@language'] && !/^en\b/i.test(v['@language'])) return [];
    return [v['@value']];
  }
  return [];
}

export function parseJsonLdLabels(text) {
  const j = JSON.parse(text);
  const ctx = j['@context'] && typeof j['@context'] === 'object' ? j['@context'] : {};
  const expand = (id) => {
    const m = /^([A-Za-z][\w.-]*):(.*)$/.exec(id);
    if (m && typeof ctx[m[1]] === 'string' && !id.includes('://')) return ctx[m[1]] + m[2];
    return id;
  };
  const out = [];
  for (const node of j['@graph'] || []) {
    if (!node || typeof node['@id'] !== 'string') continue;
    const labels = literalValues(node['rdfs:label']);
    if (labels.length) out.push({ iri: expand(node['@id']), labels, type: [].concat(node['@type'] || []).join(' ') });
  }
  return out;
}

// Minimal Turtle reader: enough for the pretty-printed files published by W3C
// (OWL-Time) and QUDT, one subject block per column-0 line. It reads
// rdfs:label, skos:prefLabel and skos:altLabel literals (English or untagged).
export function splitTurtleBlocks(text) {
  const prefixes = {};
  const blocks = [];
  let cur = null;
  let inLong = false;
  for (const line of String(text).split(/\r?\n/)) {
    if (!inLong) {
      const pm = /^@prefix\s+([\w.-]*):\s*<([^>]*)>\s*\.\s*$/i.exec(line) || /^PREFIX\s+([\w.-]*):\s*<([^>]*)>\s*$/i.exec(line);
      if (pm) { prefixes[pm[1]] = pm[2]; continue; }
      if (/^[^\s#@]/.test(line)) {
        cur = { subject: line.split(/\s+/)[0], lines: [] };
        blocks.push(cur);
      }
    }
    if (cur) cur.lines.push(line);
    const n = (line.match(/"""/g) || []).length;
    if (n % 2 === 1) inLong = !inLong;
  }
  return { prefixes, blocks };
}

export function parseTurtleLabels(text) {
  const { prefixes, blocks } = splitTurtleBlocks(text);
  const expand = (tok) => {
    if (tok.startsWith('<') && tok.endsWith('>')) return tok.slice(1, -1);
    const i = tok.indexOf(':');
    if (i >= 0 && Object.prototype.hasOwnProperty.call(prefixes, tok.slice(0, i))) return prefixes[tok.slice(0, i)] + tok.slice(i + 1);
    return null;
  };
  const out = [];
  const predRe = /(?:rdfs:label|skos:prefLabel|skos:altLabel)\s+((?:"(?:[^"\\\n]|\\.)*"(?:@[A-Za-z-]+)?\s*,?\s*)+)/g;
  const litRe = /"((?:[^"\\\n]|\\.)*)"(?:@([A-Za-z-]+))?/g;
  for (const b of blocks) {
    const iri = expand(b.subject);
    if (!iri) continue;
    const body = b.lines.join('\n');
    const labels = [];
    let pm;
    predRe.lastIndex = 0;
    while ((pm = predRe.exec(body))) {
      let lm;
      litRe.lastIndex = 0;
      while ((lm = litRe.exec(pm[1]))) {
        if (lm[2] && !/^en\b/i.test(lm[2])) continue;
        const v = lm[1].replace(/\\(["\\])/g, '$1');
        if (!labels.includes(v)) labels.push(v);
      }
    }
    if (labels.length) out.push({ iri, labels, type: '' });
  }
  return out;
}

const vocabMemo = new WeakMap();

async function loadVocab(client, key) {
  let memo = vocabMemo.get(client);
  if (!memo) { memo = new Map(); vocabMemo.set(client, memo); }
  if (memo.has(key)) return memo.get(key);
  const src = SOURCES[key];
  let entries;
  if (src.backend === 'jsonld') {
    entries = parseJsonLdLabels(await client.getText(src.url, { accept: 'application/ld+json', timeoutMs: 120000 }));
  } else {
    entries = parseTurtleLabels(await client.getText(src.url, { accept: 'text/turtle', timeoutMs: 120000 }));
  }
  memo.set(key, entries);
  return entries;
}

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');

export function scoreLabel(query, label, localName) {
  const q = norm(query);
  if (!q) return 0;
  const l = norm(label);
  if (l === q) return 100;
  if (localName && norm(localName) === q) return 90;
  if (l.startsWith(q)) return 60;
  if (l.includes(q)) return 40;
  return 0;
}

// ---------------------------------------------------------------------------
// Search backends

function sparqlString(s) {
  return JSON.stringify(String(s));
}

async function sparql(client, query) {
  const url = `${WDQS}?format=json&query=${encodeURIComponent(query)}`;
  const j = await client.getJson(url, { accept: 'application/sparql-results+json', timeoutMs: 60000 });
  return (j.results && j.results.bindings) || [];
}

const val = (b, k) => (b && b[k] ? b[k].value : undefined);
const qid = (iri) => (iri ? iri.replace(/^.*\/entity\//, '') : undefined);

async function searchOls(client, term, keys, limit) {
  const onts = keys.map((k) => SOURCES[k].ols);
  const url = `${OLS}search?q=${encodeURIComponent(term)}&ontology=${onts.join(',')}&rows=${Math.max(limit * 4, 10)}` +
    '&fieldList=iri,label,obo_id,short_form,ontology_name,description,type';
  const j = await client.getJson(url);
  const recs = await Promise.all(keys.map((k) => getRegistry(client, k)));
  const seen = new Set();
  const out = [];
  for (const d of (j.response && j.response.docs) || []) {
    if (!d.iri || seen.has(d.iri)) continue;
    seen.add(d.iri);
    const hit = matchIri(d.iri, recs);
    if (!hit) continue; // imported from an ontology outside the requested set
    const { curie } = hit;
    out.push({
      curie, label: d.label, iri: d.iri, type: d.type,
      description: Array.isArray(d.description) ? d.description[0] : d.description,
      source: hit.rec.prefix, via: 'ols4',
    });
  }
  return out;
}

export async function searchWikidata(client, term, limit, lang, { queryServiceOnly = false } = {}) {
  const rec = await getRegistry(client, 'wikidata');
  const pfx = rec ? curiePrefixOf(rec) : null;
  if (!pfx) return [];
  const api = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(term)}` +
    `&language=${encodeURIComponent(lang)}&uselang=${encodeURIComponent(lang)}&type=item&limit=${limit}&format=json`;
  try {
    if (queryServiceOnly) throw new Error('query service requested');
    const j = await client.getJson(api);
    if (j && Array.isArray(j.search)) {
      return j.search.map((s) => ({
        curie: `${pfx}:${s.id}`, label: s.label, iri: s.concepturi, description: s.description,
        source: 'wikidata', via: 'wbsearchentities',
      }));
    }
  } catch (err) {
    if (!queryServiceOnly) warn(`Wikidata search API unavailable (${err.status ? `HTTP ${err.status}` : err.code || err.message}); using the query service`);
  }
  const q = `SELECT ?item ?itemLabel ?itemDescription ?num WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
      mwapi:search ${sparqlString(term)}; mwapi:language ${sparqlString(lang)}; mwapi:limit "${limit}".
    ?item wikibase:apiOutputItem mwapi:item. ?num wikibase:apiOrdinal true.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language ${sparqlString(`${lang},mul,en`)}. }
} ORDER BY ?num`;
  const rows = await sparql(client, q);
  // The label service echoes the QID when an item has no label in the requested languages.
  const label = (b) => (val(b, 'itemLabel') === qid(val(b, 'item')) ? null : val(b, 'itemLabel'));
  return rows.map((b) => ({
    curie: `${pfx}:${qid(val(b, 'item'))}`, label: label(b), iri: val(b, 'item'),
    description: val(b, 'itemDescription'), source: 'wikidata', via: 'wdqs-entitysearch',
  }));
}

async function searchLanguages(client, term, keys, limit, lang) {
  const q = `SELECT ?item ?itemLabel ?iso3 ?glotto ?num WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
      mwapi:search ${sparqlString(term)}; mwapi:language ${sparqlString(lang)}; mwapi:limit "20".
    ?item wikibase:apiOutputItem mwapi:item. ?num wikibase:apiOrdinal true.
  }
  OPTIONAL { ?item wdt:P220 ?iso3 }
  OPTIONAL { ?item wdt:P1394 ?glotto }
  FILTER(BOUND(?iso3) || BOUND(?glotto))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
} ORDER BY ?num`;
  const rows = await sparql(client, q);
  const out = [];
  const seen = new Set();
  for (const key of keys) {
    const rec = await getRegistry(client, key);
    if (!rec) continue;
    const field = key === 'glottolog' ? 'glotto' : 'iso3';
    for (const b of rows) {
      const id = val(b, field);
      if (!id || !patternOk(rec, id)) continue;
      const curie = `${curiePrefixOf(rec)}:${id}`;
      if (seen.has(curie)) continue;
      seen.add(curie);
      out.push({
        curie, label: val(b, 'itemLabel'), iri: rec.uri_format.replace('$1', id),
        description: `via Wikidata ${qid(val(b, 'item'))}`, source: key, via: 'wdqs-language',
      });
    }
  }
  return out.slice(0, limit * keys.length);
}

async function searchVocab(client, term, key, limit) {
  const rec = await getRegistry(client, key);
  if (!rec) return [];
  const entries = await loadVocab(client, key);
  const scored = [];
  for (const e of entries) {
    const curie = curieFromIri(e.iri, [rec]);
    if (!curie) continue;
    const local = curie.slice(curie.indexOf(':') + 1);
    let best = 0;
    let bestLabel = e.labels[0];
    for (const l of e.labels) {
      const s = scoreLabel(term, l, local);
      if (s > best) { best = s; bestLabel = l; }
    }
    if (best > 0) scored.push({ score: best, curie, label: bestLabel, iri: e.iri, type: e.type, source: key, via: 'vocabulary-file' });
  }
  scored.sort((a, b) => b.score - a.score || a.label.length - b.label.length || a.curie.localeCompare(b.curie));
  return scored.slice(0, limit).map(({ score, ...r }) => r);
}

export function resolveSourceList(spec) {
  if (!spec || spec === 'default') return [...DEFAULT_SOURCES];
  if (spec === 'all') return Object.keys(SOURCES);
  const keys = spec.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const alias = { 'iso639-3': 'iso.639-3', 'iso.6393': 'iso.639-3', qudt: 'qudt.unit', 'owl-time': 'time', schemaorg: 'schema', dct: 'dcterms', 'prov-o': 'prov' };
  const out = [];
  for (const k of keys) {
    const key = alias[k] || k;
    if (!SOURCES[key]) {
      const e = new Error(`unknown ontology "${k}". Starter set: ${Object.keys(SOURCES).join(', ')}`);
      e.code = 'EUSAGE';
      throw e;
    }
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

export async function lookup(client, term, { ontology, limit = 5, lang = 'en' } = {}) {
  const keys = resolveSourceList(ontology);
  const results = [];
  const errors = [];
  const run = async (name, fn) => {
    try { results.push(...(await fn())); } catch (err) { errors.push({ source: name, error: err.message }); }
  };
  const olsKeys = keys.filter((k) => SOURCES[k].backend === 'ols');
  const langKeys = keys.filter((k) => SOURCES[k].backend === 'language');
  if (olsKeys.length) await run(olsKeys.join(','), () => searchOls(client, term, olsKeys, limit));
  if (keys.includes('wikidata')) await run('wikidata', () => searchWikidata(client, term, limit, lang));
  if (langKeys.length) await run(langKeys.join(','), () => searchLanguages(client, term, langKeys, limit, lang));
  for (const k of keys.filter((x) => ['jsonld', 'turtle'].includes(SOURCES[x].backend))) {
    await run(k, () => searchVocab(client, term, k, limit));
  }
  // Exact label matches first, then each backend's own order; cap per source.
  const perSource = new Map();
  const capped = results.filter((r) => {
    const n = perSource.get(r.source) || 0;
    perSource.set(r.source, n + 1);
    return n < limit;
  });
  const exact = (r) => (r.label && norm(r.label) === norm(term) ? 0 : 1);
  const ordered = capped.map((r, i) => ({ r, i })).sort((a, b) => exact(a.r) - exact(b.r) || a.i - b.i).map((x) => x.r);
  return { term, sources: keys, results: ordered.map((r) => ({ ...r, tag: r.label ? formatTag(r.label, r.curie) : null })), errors };
}

// ---------------------------------------------------------------------------
// Resolve

async function olsLabel(client, onto, iri) {
  for (const kind of ['terms', 'properties', 'individuals']) {
    try {
      const j = await client.getJson(`${OLS}ontologies/${onto}/${kind}?iri=${encodeURIComponent(iri)}`);
      const items = j && j._embedded && j._embedded[kind];
      if (items && items.length && items[0].label) return items[0].label;
    } catch (err) {
      if (!(err instanceof HttpError && err.status === 404)) throw err;
    }
  }
  return null;
}

async function languageByIso3(client, code) {
  const rows = await sparql(client, `SELECT ?item ?itemLabel ?glotto WHERE {
  ?item wdt:P220 ${sparqlString(code)}.
  OPTIONAL { ?item wdt:P1394 ?glotto }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`);
  return rows.length ? { label: val(rows[0], 'itemLabel'), wikidata: qid(val(rows[0], 'item')), glottolog: val(rows[0], 'glotto') } : null;
}

export async function resolve(client, input) {
  const m = /^([^:\s]+):(\S+)$/.exec(String(input).trim());
  if (!m) return { input, ok: false, reason: 'not a CURIE (expected prefix:identifier)' };
  const rec = await getRegistry(client, m[1]);
  if (!rec) return { input, ok: false, reason: `prefix "${m[1]}" is not registered at Bioregistry; do not tag with it` };
  const local = m[2];
  const prefix = curiePrefixOf(rec);
  const curie = `${prefix}:${local}`;
  const out = {
    input, curie, ok: true, prefix: rec.prefix, registryName: rec.name,
    url: rec.uri_format.replace('$1', local),
    resolver: `https://bioregistry.io/${curie}`,
    patternOk: patternOk(rec, local), license: rec.license || null,
    label: null, labelSource: null, note: null,
  };
  if (!out.patternOk) out.note = `identifier does not match the Bioregistry pattern ${rec.pattern}`;
  if (prefix !== m[1]) out.note = [out.note, `canonical Bioregistry prefix is "${prefix}" (input used "${m[1]}")`].filter(Boolean).join('; ');
  const src = SOURCES[rec.prefix];
  try {
    if (!out.patternOk) {
      // Not a valid identifier for this registry: no lookup, no label, no tag.
    } else if (!src) {
      out.note = [out.note, 'prefix is registered but outside the starter set; no label source'].filter(Boolean).join('; ');
    } else if (src.backend === 'ols') {
      const iri = (rec.rdf_uri_format || rec.uri_format).replace('$1', local);
      out.label = await olsLabel(client, src.ols, iri);
      out.labelSource = 'ols4';
    } else if (src.backend === 'wikidata') {
      const j = await client.getJson(`${WIKIDATA_ENTITY}${encodeURIComponent(local)}.json`);
      const ent = j && j.entities && (j.entities[local] || Object.values(j.entities)[0]);
      // Wikidata stores language-neutral labels under "mul" when no "en" label is set.
      const labels = (ent && ent.labels) || {};
      out.label = (labels.en && labels.en.value) || (labels.mul && labels.mul.value) || null;
      out.labelSource = 'wikidata-entitydata';
      if (ent && ent.id && ent.id !== local) out.note = [out.note, `${local} redirects to ${ent.id}`].filter(Boolean).join('; ');
    } else if (rec.prefix === 'glottolog') {
      const j = await client.getJson(`https://glottolog.org/resource/languoid/id/${encodeURIComponent(local)}.json`);
      out.label = (j && j.name) || null;
      out.labelSource = 'glottolog';
    } else if (rec.prefix === 'iso.639-3') {
      const l = await languageByIso3(client, local);
      out.label = l ? l.label : null;
      out.labelSource = 'wikidata-P220';
      if (l && l.glottolog) out.note = [out.note, `Glottolog: glottolog:${l.glottolog}`].filter(Boolean).join('; ');
    } else {
      const entries = await loadVocab(client, rec.prefix);
      const want = stripScheme(rec.uri_format.replace('$1', local));
      const hit = entries.find((e) => stripScheme(e.iri) === want);
      out.label = hit ? hit.labels[0] : null;
      out.labelSource = 'vocabulary-file';
    }
  } catch (err) {
    out.note = [out.note, `label lookup failed: ${err.message}`].filter(Boolean).join('; ');
  }
  if (out.label) out.tag = formatTag(out.label, curie);
  return out;
}

// ---------------------------------------------------------------------------
// Word lineage (Wiktionary etymology + ISO 639-3 / Glottolog via Wikidata)

export function languageSections(wikitext) {
  const sections = [];
  let cur = null;
  for (const line of String(wikitext).split(/\r?\n/)) {
    const m = /^==\s*([^=].*?)\s*==\s*$/.exec(line);
    if (m) { cur = { name: m[1], lines: [] }; sections.push(cur); continue; }
    if (cur) cur.lines.push(line);
  }
  return sections.map((s) => ({ name: s.name, text: s.lines.join('\n') }));
}

export function parseTemplate(inner) {
  const parts = inner.split('|');
  const name = parts.shift().trim();
  const pos = [];
  const named = {};
  for (const p of parts) {
    const m = /^\s*([A-Za-z][\w-]*)\s*=(.*)$/s.exec(p);
    if (m) named[m[1]] = m[2].trim(); else pos.push(p.trim());
  }
  return { name, pos, named };
}

// Plain text from a template argument: drop wiki links, bold/italic quotes, HTML tags.
export function plainWikiText(s) {
  if (s == null) return null;
  const t = String(s)
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return t || null;
}

export function extractEtymologies(sectionText, langCode) {
  const out = [];
  let cur = null;
  for (const line of String(sectionText).split(/\r?\n/)) {
    const h = /^(=+)\s*(.*?)\s*=+\s*$/.exec(line);
    if (h) {
      cur = /^Etymology(\s+\d+)?$/i.test(h[2]) ? { heading: h[2], steps: [] } : null;
      if (cur) out.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^\s*([*#:|]|\{\{(col|root|etymon|top|bottom))/.test(line)) continue;
    const re = /\{\{([^{}]*)\}\}/g;
    let m;
    while ((m = re.exec(line))) {
      const t = parseTemplate(m[1]);
      const relation = ETYM_TEMPLATES.get(t.name);
      if (!relation || t.pos[0] !== langCode || !t.pos[1]) continue;
      cur.steps.push({
        relation, code: t.pos[1],
        term: t.pos[2] && t.pos[2] !== '-' ? plainWikiText(t.pos[2]) : null,
        gloss: plainWikiText(t.named.t || t.named.gloss || t.pos[4] || null),
      });
    }
  }
  return out;
}

export async function languageIds(client, codes) {
  const uniq = [...new Set(codes)].filter((c) => /^[a-z]{2,3}$/.test(c)).sort();
  const map = new Map();
  if (!uniq.length) return map;
  const rows = await sparql(client, `SELECT ?code ?item ?itemLabel ?iso3 ?glotto WHERE {
  VALUES ?code { ${uniq.map(sparqlString).join(' ')} }
  { ?item wdt:P218 ?code } UNION { ?item wdt:P220 ?code }
  OPTIONAL { ?item wdt:P220 ?iso3 }
  OPTIONAL { ?item wdt:P1394 ?glotto }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`);
  for (const code of uniq) {
    const mine = rows.filter((b) => val(b, 'code') === code);
    if (!mine.length) continue;
    const rank = (b) => (val(b, 'iso3') === code ? 0 : 1) + (val(b, 'glotto') ? 0 : 2) + (val(b, 'iso3') ? 0 : 4);
    mine.sort((a, b) => rank(a) - rank(b) || String(val(a, 'item')).localeCompare(String(val(b, 'item'))));
    const top = mine[0];
    const glottos = new Set(mine.map((b) => val(b, 'glotto')).filter(Boolean));
    map.set(code, {
      code, name: val(top, 'itemLabel'), wikidata: qid(val(top, 'item')),
      iso3: val(top, 'iso3') || null, glottolog: val(top, 'glotto') || null,
      ambiguous: glottos.size > 1 ? [...glottos].sort() : null,
    });
  }
  return map;
}

// One CURIE per language in prose: Glottolog when it exists (it covers
// languages, dialects and families), else ISO 639-3. When Wikidata lists
// several Glottolog ids for the language, the ISO 639-3 code is used instead.
export function languageCurie(info) {
  if (!info) return null;
  if (info.glottolog && !info.ambiguous) return `glottolog:${info.glottolog}`;
  if (info.iso3) return `iso.639-3:${info.iso3}`;
  return null;
}

export async function lineage(client, word, { lang = 'en', section } = {}) {
  const url = `${WIKTIONARY_RAW}?title=${encodeURIComponent(word)}&action=raw`;
  let text;
  try {
    text = await client.getText(url, { accept: 'text/x-wiki' });
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return { word, ok: false, reason: `no Wiktionary entry for "${word}"` };
    throw err;
  }
  const ids0 = await languageIds(client, [lang]);
  const self = ids0.get(lang) || null;
  const sections = languageSections(text);
  const wanted = section || (self && self.name) || (lang === 'en' ? 'English' : null);
  const sec = sections.find((s) => wanted && s.name.toLowerCase() === wanted.toLowerCase());
  if (!sec) {
    return { word, ok: false, reason: `no "${wanted || lang}" section; sections on the page: ${sections.map((s) => s.name).join(', ')}` };
  }
  const etymologies = extractEtymologies(sec.text, lang);
  const codes = etymologies.flatMap((e) => e.steps.map((s) => s.code));
  const ids = await languageIds(client, codes);
  for (const e of etymologies) {
    for (const s of e.steps) {
      const info = ids.get(s.code) || null;
      s.language = info;
      s.curie = languageCurie(info);
    }
  }
  return {
    word, ok: true, lang, section: sec.name,
    language: self, curie: languageCurie(self),
    etymologies,
    source: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
    sourceLicense: 'CC BY-SA 4.0 and GFDL (Wiktionary text)',
  };
}

// ---------------------------------------------------------------------------
// Text output

function langIdText(info) {
  if (!info) return 'no ISO 639-3 or Glottolog id (Wiktionary code only; untagged)';
  const parts = [];
  if (info.iso3) parts.push(`iso.639-3:${info.iso3}`);
  if (info.glottolog) parts.push(`glottolog:${info.glottolog}`);
  if (info.wikidata) parts.push(`wikidata:${info.wikidata}`);
  let s = parts.join(' ');
  if (info.ambiguous) s += ` (Wikidata lists several Glottolog ids: ${info.ambiguous.join(', ')})`;
  return s || 'no ISO 639-3 or Glottolog id (untagged)';
}

export function renderLookup(r) {
  const lines = [];
  if (!r.results.length) lines.push(`no candidates for "${r.term}" in: ${r.sources.join(', ')}`);
  for (const x of r.results) {
    const extra = [x.source, x.type].filter(Boolean).join(', ');
    lines.push(`${x.curie}\t${x.label || '(no label)'}\t(${extra})${x.description ? `\t${String(x.description).slice(0, 100)}` : ''}`);
  }
  for (const e of r.errors) lines.push(`! ${e.source}: ${e.error}`);
  return lines.join('\n');
}

export function renderResolve(r) {
  if (!r.ok) return `${r.input}: ${r.reason}`;
  const lines = [
    `${r.curie}\t${r.label || '(label not found: do not tag)'}`,
    `  url:      ${r.url}`,
    `  resolver: ${r.resolver}`,
    `  registry: ${r.registryName}${r.license ? ` (licence per Bioregistry: ${r.license})` : ''}`,
  ];
  if (r.tag) lines.push(`  tag:      ${r.tag}`);
  if (r.note) lines.push(`  note:     ${r.note}`);
  return lines.join('\n');
}

export function renderLineage(r) {
  if (!r.ok) return `${r.word}: ${r.reason}`;
  const name = r.language ? r.language.name : r.section;
  const lines = [`${r.word} — ${name}: ${langIdText(r.language)}`];
  if (r.curie) lines.push(`  tag: ${formatTag(name, r.curie)}`);
  if (!r.etymologies.length) lines.push('  (no etymology section on Wiktionary)');
  for (const e of r.etymologies) {
    lines.push(e.heading);
    if (!e.steps.length) lines.push('  (no inherited/derived/borrowed templates in this etymology)');
    e.steps.forEach((s, i) => {
      const lname = s.language ? s.language.name : s.code;
      const term = s.term ? ` «${s.term}»` : '';
      const gloss = s.gloss ? ` '${s.gloss}'` : '';
      lines.push(`  ${i + 1}. ${s.relation} ${lname} (${s.code})${term}${gloss} — ${langIdText(s.language)}`);
    });
  }
  lines.push(`source: ${r.source} (${r.sourceLicense})`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI

const HELP = `usage:
  node lookup.mjs <term> [--ontology <keys>|default|all] [--limit N] [--lang en] [--json]
  node lookup.mjs --resolve <CURIE> [--json]
  node lookup.mjs --lineage <word> [--lang en] [--section <Wiktionary heading>] [--json]
options:
  --cache-dir <dir>     cache location (default: $ONTOLOGY_LOOKUP_CACHE or the platform cache dir)
  --offline             answer from the cache only; never touch the network
  --refresh             ignore cached copies and refetch
  --max-age-days <n>    reuse cached responses younger than n days (default 30)
ontology keys: ${Object.keys(SOURCES).join(', ')}
default search set: ${DEFAULT_SOURCES.join(', ')}`;

export async function main(argv = process.argv.slice(2), io = { out: (s) => process.stdout.write(`${s}\n`) }) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        ontology: { type: 'string', short: 'o' },
        limit: { type: 'string', short: 'n' },
        lang: { type: 'string' },
        section: { type: 'string' },
        resolve: { type: 'string' },
        lineage: { type: 'string' },
        json: { type: 'boolean' },
        'cache-dir': { type: 'string' },
        offline: { type: 'boolean' },
        refresh: { type: 'boolean' },
        'max-age-days': { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (err) {
    io.out(`${err.message}\n${HELP}`);
    return 2;
  }
  const { values: v, positionals } = parsed;
  if (v.help || (!v.resolve && !v.lineage && !positionals.length)) { io.out(HELP); return v.help ? 0 : 2; }
  const client = createClient({
    cacheDir: v['cache-dir'], offline: v.offline, refresh: v.refresh,
    maxAgeDays: v['max-age-days'] != null ? Number(v['max-age-days']) : undefined,
  });
  const emit = (obj, text) => io.out(v.json ? JSON.stringify(obj, null, 2) : text);
  try {
    if (v.resolve) {
      const r = await resolve(client, v.resolve);
      emit(r, renderResolve(r));
      return r.ok && r.label ? 0 : 1;
    }
    if (v.lineage) {
      const r = await lineage(client, v.lineage, { lang: v.lang || 'en', section: v.section });
      emit(r, renderLineage(r));
      return r.ok ? 0 : 1;
    }
    const limit = v.limit ? Math.max(1, Math.min(50, Number(v.limit) || 5)) : 5;
    const r = await lookup(client, positionals.join(' '), { ontology: v.ontology, limit, lang: v.lang || 'en' });
    emit(r, renderLookup(r));
    return r.results.length ? 0 : 1;
  } catch (err) {
    io.out(`error: ${err.message}`);
    return err.code === 'EUSAGE' ? 2 : 3;
  }
}

const invokedDirectly = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href; } catch { return false; }
})();
if (invokedDirectly) {
  main().then((code) => { process.exitCode = code; });
}

export const SCRIPT_PATH = fileURLToPath(import.meta.url);
