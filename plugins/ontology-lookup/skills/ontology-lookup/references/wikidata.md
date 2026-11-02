# Wikidata — `wikidata`

**For:** anything with no better domain ontology: people, places, organisations, works, events, general concepts. Wikidata is the fallback registry, not the first choice when a domain ontology below has the thing.

**Prefix:** `wikidata` (Bioregistry `wikidata`; pattern `^(Q|P|E|L)\d+$`; URI `http://www.wikidata.org/entity/$1`). Example: «Douglas Adams» [wikidata:Q42].

**Licence:** structured data (the main, Property, Lexeme and EntitySchema namespaces) is released under CC0. Checked: https://www.wikidata.org/wiki/Wikidata:Licensing

**Query:**
- Search: `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=<term>&language=en&type=item&format=json` ("Searches for entities using labels and aliases", https://www.mediawiki.org/wiki/Wikibase/API).
- One entity: `https://www.wikidata.org/wiki/Special:EntityData/<Q-id>.json`.
- SPARQL: `https://query.wikidata.org/sparql`; the MWAPI `EntitySearch` service runs the same label search inside a query (https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual/MWAPI).
- Download: full dumps, https://www.wikidata.org/wiki/Wikidata:Database_download
- Wikimedia requires a `User-Agent` header on every request (https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy) and rate-limits API clients (https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits).

**Labels:** some items carry their label only under the language-neutral code `mul` (Q42 does: no `en` label, `mul` = "Douglas Adams"). Read `en`, then `mul`.

**In lookup.mjs:** in the default search set. Tries `wbsearchentities` first; on HTTP 429 or a network failure it falls back to the query service's `EntitySearch`. `--resolve wikidata:Q42` reads `Special:EntityData`.

**Pages checked (2026-11-02):** the five URLs above; https://bioregistry.io/api/registry/wikidata
