// The calls recorded into fixtures/cache by record-fixtures.mjs and replayed
// offline by lookup.test.mjs. Changing an argument here changes the request
// URL, so re-record after any edit.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURE_CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'cache');

export const LOOKUPS = [
  { term: 'mitochondrion', opts: { limit: 3 } },
  { term: 'water', opts: { ontology: 'chebi', limit: 3 } },
  { term: 'brain', opts: { ontology: 'uberon', limit: 3 } },
  { term: 'Homo sapiens', opts: { ontology: 'ncbitaxon', limit: 3 } },
  { term: 'Old English', opts: { ontology: 'iso.639-3,glottolog', limit: 3 } },
  { term: 'Person', opts: { ontology: 'schema', limit: 3 } },
  { term: 'instant', opts: { ontology: 'time', limit: 3 } },
  { term: 'kilogram', opts: { ontology: 'qudt.unit', limit: 3 } },
];

// Wikidata through the query service (the fallback used when the search API
// answers 429 or is unreachable).
export const WIKIDATA_QS = { term: 'Douglas Adams', limit: 3, lang: 'en' };

export const RESOLVES = [
  'GO:0005739', 'go:0005739', 'wikidata:Q42', 'glottolog:stan1293',
  'iso639-3:eng', 'FOO:123', 'GO:12',
];

export const LINEAGES = [
  { word: 'water', opts: { lang: 'en' } },
  { word: 'beef', opts: { lang: 'en' } },
  { word: 'Wasser', opts: { lang: 'de' } },
];
