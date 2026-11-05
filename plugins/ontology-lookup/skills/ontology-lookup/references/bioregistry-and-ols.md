# Infrastructure: Bioregistry and OLS4

## Bioregistry — prefixes and resolution

Every prefix this skill writes is a Bioregistry prefix, in Bioregistry's preferred form (`preferred_prefix` when the record has one, else `prefix`).

- Record: `https://bioregistry.io/api/registry/<prefix>` (JSON: `prefix`, `preferred_prefix`, `name`, `pattern`, `uri_format`, `rdf_uri_format`, `providers`, `license`). The lookup is forgiving about case and punctuation (`go`, `GO`, `iso639-3` all answer), so take the canonical prefix from the record, not from your input.
- Resolve a CURIE to its URLs: `https://bioregistry.io/api/reference/<CURIE>` (returns `providers.default`, `providers.bioregistry`, `providers.miriam`, ...).
- Redirect: `https://bioregistry.io/<CURIE>` answers 302 to the resolving page (checked for `GO:0005739`, `iso.639-3:eng`, `glottolog:stan1293`).
- Unknown prefix: HTTP 404. A prefix that is not registered is not used.
- Licence of the registry data: "Available under the CC0 1.0 Universal License." (https://bioregistry.io/)

## OLS4 — search across the OBO and W3C vocabularies

EMBL-EBI's Ontology Lookup Service hosts GO, ChEBI, UBERON, NCBITaxon, SO, BFO, EDAM, MeSH, SKOS, Dublin Core (`dcterms`, `dc`) and PROV-O (`prov`). It does not host schema.org, OWL-Time or QUDT (ontology list checked 2026-11-02).

- Search: `https://www.ebi.ac.uk/ols4/api/search?q=<term>&ontology=go,chebi&rows=10` (parameters per the OpenAPI document: `q`, `ontology`, `type`, `exact`, `rows`, `start`, `fieldList`, `queryFields`, `obsoletes`, `local`, `lang`, ...).
- One term: `https://www.ebi.ac.uk/ols4/api/ontologies/<ontology>/terms?iri=<IRI>`; properties are under `/properties`, individuals under `/individuals`.
- OpenAPI document: https://www.ebi.ac.uk/ols4/v3/api-docs (its `info.license` is CC0 1.0; terms of use https://www.ebi.ac.uk/about/terms-of-use/).
- OLS's `obo_id` field is not a Bioregistry CURIE for the non-OBO vocabularies (it gives `SKOS:prefLabel`, `DCTERMS:creator`). The script ignores it and maps the IRI through Bioregistry's URI formats instead.

**Pages checked (2026-11-02):** https://bioregistry.io/, the API URLs above, https://www.ebi.ac.uk/ols4/api/ontologies?size=1000
