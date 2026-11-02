// Offline tests: every network answer comes from fixtures/cache (recorded by
// record-fixtures.mjs). Run from the scripts directory:
//   node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createClient, lookup, resolve, lineage, searchWikidata, main,
  curieFromIri, formatTag, parseTurtleLabels, splitTurtleBlocks, parseJsonLdLabels,
  extractEtymologies, languageSections, languageCurie, plainWikiText, resolveSourceList,
  scoreLabel, cachePath, OfflineMiss,
} from '../lookup.mjs';
import { FIXTURE_CACHE, WIKIDATA_QS } from './scenarios.mjs';

const client = () => createClient({ cacheDir: FIXTURE_CACHE, offline: true });

// --- pure functions ---------------------------------------------------------

test('formatTag puts the term in guillemets and the CURIE in square brackets', () => {
  assert.equal(formatTag('mitochondrion', 'GO:0005739'), '«mitochondrion» [GO:0005739]');
});

test('curieFromIri uses the longest Bioregistry URI prefix and checks the pattern', () => {
  const go = { prefix: 'go', preferred_prefix: 'GO', uri_format: 'http://purl.obolibrary.org/obo/GO_$1', pattern: '^\\d{7}$' };
  const mesh = { prefix: 'mesh', uri_format: 'https://meshb.nlm.nih.gov/record/ui?ui=$1', rdf_uri_format: 'http://id.nlm.nih.gov/mesh/$1' };
  assert.equal(curieFromIri('http://purl.obolibrary.org/obo/GO_0005739', [go, mesh]), 'GO:0005739');
  assert.equal(curieFromIri('https://purl.obolibrary.org/obo/GO_0005739', [go]), 'GO:0005739', 'http/https agnostic');
  assert.equal(curieFromIri('http://id.nlm.nih.gov/mesh/D008928', [go, mesh]), 'mesh:D008928', 'rdf_uri_format used');
  assert.equal(curieFromIri('http://purl.obolibrary.org/obo/GO_12', [go]), null, 'pattern mismatch gives no CURIE');
  assert.equal(curieFromIri('http://purl.obolibrary.org/obo/NCIT_C1', [go, mesh]), null, 'unknown namespace gives no CURIE');
});

test('resolveSourceList knows the starter set and rejects anything else', () => {
  assert.ok(resolveSourceList().includes('wikidata'));
  assert.ok(resolveSourceList('all').includes('qudt.unit'));
  assert.deepEqual(resolveSourceList('iso639-3,qudt'), ['iso.639-3', 'qudt.unit']);
  assert.throws(() => resolveSourceList('snomedct'), /unknown ontology/);
});

test('scoreLabel ranks exact, local-name, prefix and substring matches', () => {
  assert.equal(scoreLabel('Kilogram', 'kilogram'), 100);
  assert.equal(scoreLabel('KiloGM', 'Kilogram', 'KiloGM'), 90);
  assert.equal(scoreLabel('kilo', 'Kilogram'), 60);
  assert.equal(scoreLabel('gram', 'Kilogram'), 40);
  assert.equal(scoreLabel('litre', 'Kilogram'), 0);
});

test('Turtle reader: prefixes, blocks, long strings and language tags', () => {
  const ttl = [
    '@prefix : <http://example.org/v#> .',
    '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
    '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
    ':A',
    '  rdfs:comment """first line',
    'col-0 line inside a long string',
    '  """ ;',
    '  rdfs:label "Alpha"@en, "Alfa"@es ;',
    '  skos:altLabel "A thing" .',
    ':B rdfs:label "Beta" .',
  ].join('\r\n');
  const { blocks } = splitTurtleBlocks(ttl);
  assert.deepEqual(blocks.map((b) => b.subject), [':A', ':B']);
  assert.deepEqual(parseTurtleLabels(ttl), [
    { iri: 'http://example.org/v#A', labels: ['Alpha', 'A thing'], type: '' },
    { iri: 'http://example.org/v#B', labels: ['Beta'], type: '' },
  ]);
});

test('JSON-LD reader expands compact ids from the context', () => {
  const doc = JSON.stringify({
    '@context': { schema: 'https://schema.org/' },
    '@graph': [{ '@id': 'schema:Person', '@type': 'rdfs:Class', 'rdfs:label': 'Person' }, { '@id': 'schema:x' }],
  });
  assert.deepEqual(parseJsonLdLabels(doc), [{ iri: 'https://schema.org/Person', labels: ['Person'], type: 'rdfs:Class' }]);
});

test('etymology extraction follows inh/der/bor in the section language only', () => {
  const wikitext = [
    '==English==', '===Etymology 1===',
    "From {{inh|en|enm|water}}, from {{inh|en|ang|wæter|t=water}}; compare {{cog|de|Wasser}} and {{bor|fr|en|x}}.",
    '* {{cog|sco|watter}}', '===Noun===', '{{en-noun}}',
    '==German==', '===Etymology===', 'From {{inh|de|goh|waȥȥar}}.',
  ].join('\n');
  const secs = languageSections(wikitext);
  assert.deepEqual(secs.map((s) => s.name), ['English', 'German']);
  const ety = extractEtymologies(secs[0].text, 'en');
  assert.equal(ety.length, 1);
  assert.deepEqual(ety[0].steps.map((s) => [s.relation, s.code, s.term, s.gloss]), [
    ['inherited from', 'enm', 'water', null],
    ['inherited from', 'ang', 'wæter', 'water'],
  ]);
});

test('plainWikiText strips links and quote markup', () => {
  assert.equal(plainWikiText("(''reflexive'') to [[bestir]] [[one|oneself]]"), '(reflexive) to bestir oneself');
});

test('languageCurie prefers Glottolog unless Wikidata gives several', () => {
  assert.equal(languageCurie({ iso3: 'eng', glottolog: 'stan1293' }), 'glottolog:stan1293');
  assert.equal(languageCurie({ iso3: 'xno', glottolog: 'norm1245', ambiguous: ['angl1258', 'norm1245'] }), 'iso.639-3:xno');
  assert.equal(languageCurie({ iso3: null, glottolog: null }), null);
  assert.equal(languageCurie(null), null);
});

// --- cache ------------------------------------------------------------------

test('cache: atomic write, reuse, offline miss, cached 404', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ontology-lookup-test-'));
  try {
    let calls = 0;
    const fakeFetch = async (url) => {
      calls++;
      if (url.endsWith('/missing')) return new Response('', { status: 404 });
      return new Response('{"ok":true}', { status: 200 });
    };
    const c = createClient({ cacheDir: dir, fetch: fakeFetch });
    assert.deepEqual(await c.getJson('https://example.org/a'), { ok: true });
    assert.deepEqual(await c.getJson('https://example.org/a'), { ok: true });
    assert.equal(calls, 1, 'second read served from cache');
    const file = cachePath(dir, 'https://example.org/a', 'application/json');
    assert.ok(fs.existsSync(file));
    assert.equal(fs.readdirSync(path.dirname(file)).filter((f) => f.includes('.tmp.')).length, 0, 'no temp files left');
    await assert.rejects(c.getJson('https://example.org/missing'), /HTTP 404/);
    await assert.rejects(c.getJson('https://example.org/missing'), /HTTP 404/);
    assert.equal(calls, 2, '404 cached too');
    const off = createClient({ cacheDir: dir, offline: true, fetch: fakeFetch });
    await assert.rejects(off.getJson('https://example.org/b'), OfflineMiss);
    assert.equal(calls, 2, 'offline never fetches');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- recorded API responses ---------------------------------------------------

test('lookup (default set): GO and Wikidata candidates for "mitochondrion"', async () => {
  const r = await lookup(client(), 'mitochondrion', { limit: 3 });
  assert.deepEqual(r.errors, []);
  const curies = r.results.map((x) => x.curie);
  assert.equal(curies[0], 'GO:0005739');
  assert.ok(curies.includes('wikidata:Q39572'));
  const go = r.results.find((x) => x.curie === 'GO:0005739');
  assert.equal(go.tag, '«mitochondrion» [GO:0005739]');
  assert.equal(go.via, 'ols4');
  assert.equal(r.results.find((x) => x.curie === 'wikidata:Q39572').via, 'wbsearchentities');
});

for (const [term, ontology, expected] of [
  ['water', 'chebi', 'CHEBI:15377'],
  ['brain', 'uberon', 'UBERON:0000955'],
  ['Homo sapiens', 'ncbitaxon', 'NCBITaxon:9606'],
  ['Person', 'schema', 'schema:Person'],
  ['instant', 'time', 'time:Instant'],
  ['kilogram', 'qudt.unit', 'qudt.unit:KiloGM'],
]) {
  test(`lookup ${ontology}: "${term}" → ${expected}`, async () => {
    const r = await lookup(client(), term, { ontology, limit: 3 });
    assert.deepEqual(r.errors, []);
    assert.equal(r.results[0].curie, expected);
  });
}

test('lookup languages: "Old English" → iso.639-3:ang and glottolog:olde1238', async () => {
  const r = await lookup(client(), 'Old English', { ontology: 'iso.639-3,glottolog', limit: 3 });
  const curies = r.results.map((x) => x.curie);
  assert.ok(curies.includes('iso.639-3:ang'));
  assert.ok(curies.includes('glottolog:olde1238'));
});

test('Wikidata through the query service (search-API fallback)', async () => {
  const r = await searchWikidata(client(), WIKIDATA_QS.term, WIKIDATA_QS.limit, WIKIDATA_QS.lang, { queryServiceOnly: true });
  assert.ok(r.some((x) => x.curie === 'wikidata:Q42' && x.label === 'Douglas Adams'));
  assert.ok(r.every((x) => x.via === 'wdqs-entitysearch'));
});

test('resolve GO:0005739: URL, label, tag', async () => {
  const r = await resolve(client(), 'GO:0005739');
  assert.equal(r.ok, true);
  assert.equal(r.url, 'http://purl.obolibrary.org/obo/GO_0005739');
  assert.equal(r.resolver, 'https://bioregistry.io/GO:0005739');
  assert.equal(r.label, 'mitochondrion');
  assert.equal(r.tag, '«mitochondrion» [GO:0005739]');
});

test('resolve normalises the prefix to the Bioregistry preferred form', async () => {
  const r = await resolve(client(), 'go:0005739');
  assert.equal(r.curie, 'GO:0005739');
  assert.match(r.note, /canonical Bioregistry prefix is "GO"/);
  const iso = await resolve(client(), 'iso639-3:eng');
  assert.equal(iso.curie, 'iso.639-3:eng');
  assert.equal(iso.label, 'English');
  assert.equal(iso.url, 'https://iso639-3.sil.org/code/eng');
});

test('resolve wikidata:Q42 reads the "mul" label', async () => {
  const r = await resolve(client(), 'wikidata:Q42');
  assert.equal(r.label, 'Douglas Adams');
});

test('resolve glottolog:stan1293', async () => {
  const r = await resolve(client(), 'glottolog:stan1293');
  assert.equal(r.label, 'English');
  assert.equal(r.url, 'https://glottolog.org/resource/languoid/id/stan1293');
});

test('resolve refuses an unregistered prefix and an invalid identifier', async () => {
  const r = await resolve(client(), 'FOO:123');
  assert.equal(r.ok, false);
  assert.match(r.reason, /not registered at Bioregistry/);
  const bad = await resolve(client(), 'GO:12');
  assert.equal(bad.patternOk, false);
  assert.equal(bad.label, null);
  assert.equal(bad.tag, undefined);
});

test('lineage water: English, then Middle English and Old English with ids', async () => {
  const r = await lineage(client(), 'water', { lang: 'en' });
  assert.equal(r.ok, true);
  assert.equal(r.language.iso3, 'eng');
  assert.equal(r.language.glottolog, 'stan1293');
  assert.equal(r.curie, 'glottolog:stan1293');
  const steps = r.etymologies[0].steps;
  assert.deepEqual(steps.slice(0, 2).map((s) => [s.code, s.term, s.language.iso3, s.language.glottolog]), [
    ['enm', 'water', 'enm', 'midd1317'],
    ['ang', 'wæter', 'ang', 'olde1238'],
  ]);
  const proto = steps.find((s) => s.code === 'gem-pro');
  assert.equal(proto.language, null, 'proto-languages have no ISO 639-3 or Glottolog id');
  assert.equal(proto.curie, null);
});

test('lineage beef: borrowed through Anglo-Norman and Old French from Latin', async () => {
  const r = await lineage(client(), 'beef', { lang: 'en' });
  const codes = r.etymologies[0].steps.map((s) => s.code);
  assert.deepEqual(codes.slice(0, 4), ['enm', 'xno', 'fro', 'la']);
  const la = r.etymologies[0].steps.find((s) => s.code === 'la');
  assert.equal(la.language.iso3, 'lat');
  assert.equal(la.curie, 'glottolog:lati1261');
});

test('lineage Wasser --lang de reads the German section', async () => {
  const r = await lineage(client(), 'Wasser', { lang: 'de' });
  assert.equal(r.section, 'German');
  assert.equal(r.language.iso3, 'deu');
  assert.equal(r.etymologies[0].steps[0].code, 'gmh');
});

test('CLI: --resolve exit codes and text output', async () => {
  const out = [];
  const io = { out: (s) => out.push(s) };
  assert.equal(await main(['--resolve', 'GO:0005739', '--offline', '--cache-dir', FIXTURE_CACHE], io), 0);
  assert.match(out.join('\n'), /tag: {6}«mitochondrion» \[GO:0005739\]/);
  assert.equal(await main(['--resolve', 'FOO:123', '--offline', '--cache-dir', FIXTURE_CACHE], io), 1);
  assert.equal(await main(['x', '--ontology', 'snomedct', '--offline', '--cache-dir', FIXTURE_CACHE], io), 2);
  assert.equal(await main([], io), 2);
});

test('CLI: offline cache miss is a clean error, not a crash', async () => {
  const out = [];
  const code = await main(['--resolve', 'CHEBI:15377', '--offline', '--cache-dir', FIXTURE_CACHE], { out: (s) => out.push(s) });
  // bioregistry/chebi is cached; the OLS term page is not, so the label lookup fails and is reported.
  assert.equal(code, 1);
  assert.match(out.join('\n'), /offline: no cached response/);
});
