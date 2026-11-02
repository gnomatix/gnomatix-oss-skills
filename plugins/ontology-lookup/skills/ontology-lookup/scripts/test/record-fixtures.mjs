// Re-record the offline fixtures from the live APIs:
//   node test/record-fixtures.mjs
// Three large responses are trimmed after recording (each entry says so in
// its "trimmed" field): the schema.org JSON-LD (1.5 MB), the QUDT unit
// vocabulary (4 MB) and the Wikidata entity JSON for Q42 (0.3 MB).
import fs from 'node:fs';
import path from 'node:path';
import {
  createClient, lookup, resolve, lineage, searchWikidata, splitTurtleBlocks,
} from '../lookup.mjs';
import { FIXTURE_CACHE, LOOKUPS, WIKIDATA_QS, RESOLVES, LINEAGES } from './scenarios.mjs';

try { fs.rmSync(FIXTURE_CACHE, { recursive: true, force: true }); } catch (err) { console.error(err.message); }
const client = createClient({ cacheDir: FIXTURE_CACHE, refresh: true });

for (const { term, opts } of LOOKUPS) console.log('lookup', term, (await lookup(client, term, opts)).results.length);
console.log('wikidata-qs', (await searchWikidata(client, WIKIDATA_QS.term, WIKIDATA_QS.limit, WIKIDATA_QS.lang, { queryServiceOnly: true })).length);
for (const c of RESOLVES) console.log('resolve', c, (await resolve(client, c)).label);
for (const { word, opts } of LINEAGES) console.log('lineage', word, (await lineage(client, word, opts)).ok);

const KEEP_SCHEMA = new Set(['schema:Person', 'schema:Thing', 'schema:name', 'schema:accountablePerson', 'schema:Place', 'schema:birthPlace']);
const KEEP_UNITS = new Set(['unit:KiloGM', 'unit:KiloGM-M', 'unit:KiloGM_F', 'unit:GM', 'unit:M', 'unit:SEC']);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else if (e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

for (const file of walk(FIXTURE_CACHE)) {
  const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
  let trimmed = null;
  if (entry.url.startsWith('https://schema.org/version/latest/')) {
    const j = JSON.parse(entry.body);
    j['@graph'] = j['@graph'].filter((n) => KEEP_SCHEMA.has(n['@id']));
    entry.body = JSON.stringify(j);
    trimmed = `@graph cut to ${[...KEEP_SCHEMA].join(', ')}`;
  } else if (entry.url === 'https://qudt.org/vocab/unit/') {
    const lines = entry.body.split(/\r?\n/);
    const { blocks } = splitTurtleBlocks(entry.body);
    const keep = blocks.filter((b) => KEEP_UNITS.has(b.subject)).map((b) => b.lines.join('\n'));
    entry.body = `${lines.filter((l) => /^@prefix/i.test(l)).join('\n')}\n\n${keep.join('\n')}\n`;
    trimmed = `subject blocks cut to ${[...KEEP_UNITS].join(', ')}`;
  } else if (entry.url.includes('Special:EntityData/Q42.json')) {
    const j = JSON.parse(entry.body);
    const e = j.entities.Q42;
    const pick = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => ['en', 'mul', 'de'].includes(k)));
    entry.body = JSON.stringify({ entities: { Q42: { id: e.id, type: e.type, labels: pick(e.labels) } } });
    trimmed = 'entity cut to id, type and the en/mul/de labels';
  }
  if (trimmed) {
    entry.trimmed = trimmed;
    fs.writeFileSync(file, JSON.stringify(entry), 'utf8');
    console.log('trimmed', entry.url);
  }
}
