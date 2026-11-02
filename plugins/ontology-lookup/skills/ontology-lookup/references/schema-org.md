# Schema.org — `schema`

**For:** types and properties of web-published things: `Person`, `Place`, `Event`, `CreativeWork`, `Product`, `name`, `birthPlace`. Use it for the *kind* of thing or the *relation*, not for the individual (an individual person is a Wikidata item).

**Prefix:** `schema` (Bioregistry `schema`; URI `https://schema.org/$1`). Example: «Person» [schema:Person].

**Licence:** "The Sponsors' copyrights in the schema are licensed to website publishers and other third parties under the Creative Commons Attribution-ShareAlike License (version 3.0)." Checked: https://schema.org/docs/terms.html

**Query:**
- No search API. The vocabulary is a download, in several RDF formats and CSV: https://schema.org/docs/developers.html
- Current JSON-LD: `https://schema.org/version/latest/schemaorg-current-https.jsonld` (about 1.5 MB, 3,256 graph nodes on 2026-11-02). Each node has `@id` (`schema:Person`) and `rdfs:label`.
- Term pages: `https://schema.org/<Term>`.

**In lookup.mjs:** `--ontology schema` downloads the JSON-LD once into the cache and matches `rdfs:label` and the local name.

**Pages checked (2026-11-02):** https://schema.org/docs/terms.html, https://schema.org/docs/developers.html, the JSON-LD file above, https://bioregistry.io/api/registry/schema
