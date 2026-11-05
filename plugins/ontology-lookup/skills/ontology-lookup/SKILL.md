---
name: ontology-lookup
description: "Use when writing about a specific thing (a gene product, a chemical, an anatomical part, an organism, a person or place, a language, a unit, a metadata or provenance relation) in text that will be logged, indexed or read back later. Looks the thing up in an established registry and tags its first mention inline as «term» [CURIE], with Bioregistry prefixes (GO:0005739, CHEBI:15377, UBERON:0000955, NCBITaxon:9606, wikidata:Q42, glottolog:stan1293, iso.639-3:eng). Ships scripts/lookup.mjs (Node 20+, no dependencies) for search, --resolve CURIE, and a --lineage word mode giving a word's language and its etymon chain with ISO 639-3 and Glottolog ids. Never invents a prefix, never tags what it could not resolve."
---

# ontology-lookup — tagging things with registry identifiers

## What this is

A lookup. When I write about a thing, I add that thing's identifier from an established registry, inline, as a CURIE, so the log can be resolved and indexed later. I tag the first mention of each thing in a passage, nothing else.

This is the agent-side half. Human-written text, and anything I missed, is tagged afterwards by a separate pipeline that is not part of this skill. Both halves use the one format defined here, so a reader or an indexer cannot tell, and does not need to tell, which half wrote a tag.

## When to use it

- Writing a log, note, report, commit message body or summary that names specific things someone may want to look up or index: a cellular component, a compound, an organ, a species, a person, a place, a work, a unit, a language.
- Asked to tag, annotate, ground or link the terms in a text.
- Asked where a word comes from (word-lineage mode, below).

Not for: generic words used generically ("the process took an hour"), the agent's own variables and file names, or text quoted verbatim from someone else (tagging inside a quote changes the quote).

## The format

```
«term» [CURIE]
```

- The term as written in the sentence, in guillemets `«` `»`; one space; the CURIE in square brackets.
- The CURIE is `prefix:identifier`, with the prefix exactly as Bioregistry gives it (its `preferred_prefix`, else its `prefix`): `GO:0005739`, `CHEBI:15377`, `NCBITaxon:9606`, `wikidata:Q42`, `iso.639-3:eng`. Case and punctuation are part of the prefix.
- Example: The «mitochondria» [GO:0005739] of «Homo sapiens» [NCBITaxon:9606] cells oxidise «pyruvate» [CHEBI:15361] in the presence of «water» [CHEBI:15377].
- The term keeps its own form in the sentence (plural, capitalised); the CURIE says what it is.
- A pipeline finds tags with: `«([^»]+)» \[([A-Za-z][A-Za-z0-9_.-]*:[^\]\s]+)\]`

**Voice mode.** Guillemets and square brackets are silent in voice mode, so a tagged sentence reads aloud as the plain sentence. The companion `inaudible-markup` skill in this repository is the authority on which characters are silent; if it is installed and its list differs from `«` `»` `[` `]`, follow it and raise the mismatch with the author. (It was not in the repository when this skill was written.)

**Why Bioregistry prefixes and not short codes.** Three-letter codes (`GEN:`, `CHM:`, `LNG:`) read better and are uniform. But they resolve nowhere: every reader and every tool would need our private table to turn one into a URL, and two projects' tables would collide. Bioregistry prefixes are longer and irregular (`GO`, `NCBITaxon`, `iso.639-3`), but every one of them resolves at `https://bioregistry.io/<CURIE>`, and the same prefixes are used by the ontologies, OLS, identifiers.org and the literature. This skill uses Bioregistry prefixes.

## My rules

1. **Tag the first mention of a thing in a passage, not every mention.** A passage is one message, or one section of a document. Later mentions in the same passage stay plain.
2. **Never tag a thing I could not resolve.** Resolved means: the CURIE came back from the registry (the script, or the API it calls) and its label names the thing I mean. A CURIE recalled from memory is checked with `--resolve` before it is written. No match, no tag; the text stays plain.
3. **Prefer the most specific ontology.** A mitochondrion is GO, not Wikidata; water as a chemical is CHEBI; the brain is UBERON; a species is NCBITaxon. Wikidata is for things no domain ontology in the starter set covers (people, places, works, events). See "Choosing the ontology".
4. **One CURIE per thing.** Never `[GO:0005739, wikidata:Q39572]`. Pick the one rule 3 picks.
5. **Never invent a prefix.** Only prefixes registered at Bioregistry; only from the starter set unless the author adds one. `--resolve` refuses an unregistered prefix.
6. **Restrictive licences stay out.** No SNOMED CT tags ([references/excluded.md](references/excluded.md)).
7. **The meaning decides the branch.** "Sequence alignment" the data is `edam:data_0863`; the operation is `edam:operation_0292`. If I can't tell which one the sentence means, I don't tag.

## Choosing the ontology

| The thing is... | Use |
|---|---|
| a cellular component, molecular function, biological process | GO |
| a chemical entity or chemical role | CHEBI |
| an anatomical part, any species | UBERON |
| an organism or taxon | NCBITaxon |
| a genomic feature (gene, exon, promoter, variant) | SO |
| a bioinformatics operation, data type, format, topic | EDAM |
| a disease, clinical concept, literature-indexing heading | MeSH (when GO/CHEBI/UBERON don't have it) |
| a unit of measure / a quantity | QUDT (`qudt.unit`, `qudt.quantitykind`) |
| a language, dialect or language family | Glottolog; ISO 639-3 when there is no Glottolog id or Wikidata gives several |
| a type of web thing or a property (Person, Event, birthPlace) | schema.org |
| a metadata relation (creator, title, licence) | Dublin Core `dcterms` |
| a provenance relation (generated by, derived from) | PROV-O |
| a label or mapping relation (preferred label, broader) | SKOS |
| a kind of time expression (instant, interval, duration) | OWL-Time |
| an upper-level category, when the category itself is the subject | BFO |
| a person, place, organisation, work, event, anything else | Wikidata |

Dates: write them in ISO 8601 (2026-11-02) and leave them untagged; OWL-Time is for the *kind* of temporal thing, not for a date value.

## The starter set

| Ontology / registry | Prefix | Example | For | Licence | Reference |
|---|---|---|---|---|---|
| Wikidata | `wikidata` | «Douglas Adams» [wikidata:Q42] | general items | CC0 (structured data) | [wikidata.md](references/wikidata.md) |
| Schema.org | `schema` | «Person» [schema:Person] | web types and properties | CC BY-SA 3.0 | [schema-org.md](references/schema-org.md) |
| SKOS | `skos` | «preferred label» [skos:prefLabel] | labelling and mapping | W3C document licence | [skos.md](references/skos.md) |
| Dublin Core | `dcterms` (`dc`) | «Creator» [dcterms:creator] | document metadata | CC BY 4.0 | [dublin-core.md](references/dublin-core.md) |
| PROV-O | `prov` | «Activity» [prov:Activity] | provenance | W3C document licence | [prov-o.md](references/prov-o.md) |
| OWL-Time | `time` | «Time instant» [time:Instant] | temporal concepts | CC BY 4.0 | [owl-time.md](references/owl-time.md) |
| BFO | `BFO` | «continuant» [BFO:0000002] | upper-level categories | CC BY 4.0 | [bfo.md](references/bfo.md) |
| Gene Ontology | `GO` | «mitochondrion» [GO:0005739] | gene-product attributes | CC BY 4.0 | [go.md](references/go.md) |
| ChEBI | `CHEBI` | «water» [CHEBI:15377] | chemical entities | CC BY 4.0 | [chebi.md](references/chebi.md) |
| UBERON | `UBERON` | «brain» [UBERON:0000955] | anatomy | CC BY 3.0 | [uberon.md](references/uberon.md) |
| NCBI Taxonomy | `NCBITaxon` | «Homo sapiens» [NCBITaxon:9606] | organisms | CC0 | [ncbitaxon.md](references/ncbitaxon.md) |
| Sequence Ontology | `SO` | «promoter» [SO:0000167] | genomic features | CC BY 4.0 | [so.md](references/so.md) |
| EDAM | `edam` | «Sequence alignment» [edam:data_0863] | bioinformatics | CC BY-SA 4.0 | [edam.md](references/edam.md) |
| QUDT | `qudt.unit`, `qudt.quantitykind` | «Kilogram» [qudt.unit:KiloGM] | units, quantities | CC BY 4.0 | [qudt.md](references/qudt.md) |
| ISO 639-3 | `iso.639-3` | «English» [iso.639-3:eng] | languages | SIL terms of use (no redistribution of the code set) | [iso-639-3.md](references/iso-639-3.md) |
| Glottolog | `glottolog` | «English» [glottolog:stan1293] | languages, dialects, families | CC BY 4.0 | [glottolog.md](references/glottolog.md) |
| MeSH | `mesh` | «Mitochondria» [mesh:D008928] | biomedical headings | NLM terms (acknowledge NLM) | [mesh.md](references/mesh.md) |

Every example above was resolved with `lookup.mjs --resolve` on 2026-11-02. How each source is queried (API, download) and the page its licence was checked on are in its reference file. Prefix resolution and the OLS4 search service: [bioregistry-and-ols.md](references/bioregistry-and-ols.md). The etymology source for word lineage: [wiktionary.md](references/wiktionary.md).

**Excluded:** SNOMED CT, because its use is subject to a licence agreement (IHTSDO Affiliate licence, via the UMLS licence), so a log tagged with it would be readable in full only by licensees. Details and sources: [references/excluded.md](references/excluded.md).

## Running the script

`scripts/lookup.mjs`, Node 20 or later, standard library only. Run it with `node`; paths below are relative to this skill's directory.

```sh
node scripts/lookup.mjs mitochondrion                      # default set: the OLS4 ontologies + Wikidata
node scripts/lookup.mjs water --ontology chebi --limit 3
node scripts/lookup.mjs kilogram --ontology qudt.unit       # file-backed: downloads the vocabulary once
node scripts/lookup.mjs "Old English" --ontology iso.639-3,glottolog
node scripts/lookup.mjs Person --ontology all               # every source in the starter set
node scripts/lookup.mjs --resolve GO:0005739
node scripts/lookup.mjs --lineage water
node scripts/lookup.mjs --lineage Wasser --lang de
```

Search output is one candidate per line: `CURIE  label  (source, type)  description`. Exact label matches come first. `--json` gives the same as JSON, with a ready-made `tag` field per candidate.

`--resolve CURIE` prints the canonical CURIE, the label, the resolving URL from Bioregistry's `uri_format`, the `https://bioregistry.io/<CURIE>` resolver and the tag:

```
GO:0005739	mitochondrion
  url:      http://purl.obolibrary.org/obo/GO_0005739
  resolver: https://bioregistry.io/GO:0005739
  registry: Gene Ontology (licence per Bioregistry: CC-BY-4.0)
  tag:      «mitochondrion» [GO:0005739]
```

It rewrites a prefix to Bioregistry's preferred form (`go:` → `GO:`, `iso639-3:` → `iso.639-3:`) and says so; refuses an unregistered prefix; and gives no label, and so no tag, for an identifier that fails the registry's pattern.

Where it looks:

- OLS4 (EMBL-EBI) for GO, ChEBI, UBERON, NCBITaxon, SO, BFO, EDAM, MeSH, SKOS, Dublin Core and PROV-O. IRIs are mapped to CURIEs through Bioregistry's URI formats, so a term OLS returns from outside the requested set is dropped, not mislabelled.
- Wikidata's `wbsearchentities` API; on HTTP 429 or a network error, the Wikidata Query Service's `EntitySearch`. Labels are read in `en`, then `mul`.
- Vocabulary files for schema.org (JSON-LD), OWL-Time and QUDT (Turtle), downloaded once.
- Wikidata properties P220 (ISO 639-3) and P1394 (Glottolog) for languages.
- Bioregistry for every prefix.

Cache: every response is stored under a directory you choose, `--cache-dir <dir>`, else `$ONTOLOGY_LOOKUP_CACHE`, else the platform cache directory (`~/.cache/ontology-lookup`, `$XDG_CACHE_HOME/ontology-lookup`, `~/Library/Caches/ontology-lookup`, or `%LOCALAPPDATA%\ontology-lookup\cache`). Entries are reused for 30 days (`--max-age-days`); `--refresh` refetches; `--offline` answers from the cache only. Writes are atomic (temp file and rename). If the network fails, a stale cached copy is used and a warning goes to stderr.

Exit codes: 0 found; 1 nothing found, unresolved, or no label; 2 usage error (including an ontology outside the starter set); 3 network or offline-cache failure.

Tests (offline, from recorded responses):

```sh
cd scripts && node --test test/lookup.test.mjs
node test/record-fixtures.mjs     # re-record the fixtures from the live APIs
```

## Word-lineage mode

`--lineage <word> [--lang <Wiktionary code>] [--section <heading>]` reads the word's Wiktionary entry and returns:

- the word's language with its ISO 639-3 code, Glottolog code and Wikidata item;
- for each etymology on the page, the chain of `inherited` / `derived` / `borrowed` / `learned borrowing` steps, in the order Wiktionary writes them, each with its source language's ISO 639-3 and Glottolog codes.

```
water — English: iso.639-3:eng glottolog:stan1293 wikidata:Q1860
  tag: «English» [glottolog:stan1293]
Etymology 1
  1. inherited from Middle English (enm) «water» — iso.639-3:enm glottolog:midd1317 wikidata:Q36395
  2. inherited from Old English (ang) «wæter» 'water' — iso.639-3:ang glottolog:olde1238 wikidata:Q42365
  3. inherited from gmw-pro (gmw-pro) «*watar» — no ISO 639-3 or Glottolog id (Wiktionary code only; untagged)
  ...
source: https://en.wiktionary.org/wiki/water (CC BY-SA 4.0 and GFDL (Wiktionary text))
```

In prose, the language is the thing tagged; the word form is written plain:

> English *water* comes from «Old English» [glottolog:olde1238] *wæter*, by way of «Middle English» [glottolog:midd1317] *water*.

- One CURIE per language, by rule 4: the Glottolog code; the ISO 639-3 code when there is no Glottolog code or Wikidata lists more than one (Anglo-Norman `xno` has two, so it is tagged «Anglo-Norman» [iso.639-3:xno]).
- Reconstructed proto-languages (`gem-pro`, `ine-pro`, `gmw-pro`) and other Wiktionary-only codes have neither id. They stay untagged (rule 2).
- The chain is Wiktionary's, cited by URL; Wiktionary text is CC BY-SA 4.0 / GFDL.
- `--lang` takes Wiktionary's code for the word's language (`en`, `de`, `fr`, `la`); the section heading is found through Wikidata's name for that language, or given with `--section`.

The `word-lineage` plugin in this repository reasons about a word's layer and literal meaning; this mode supplies the identifiers for the languages on the chain. They can be used together.
