# Gene Ontology — `GO`

**For:** gene-product attributes in any organism: cellular components (mitochondrion), molecular functions (kinase activity), biological processes (apoptotic process).

**Prefix:** `GO` (Bioregistry `go`, preferred prefix `GO`; pattern `^\d{7}$`; URI `http://purl.obolibrary.org/obo/GO_$1`). Example: «mitochondrion» [GO:0005739].

**Licence:** CC BY 4.0. Checked: https://obofoundry.org/registry/ontologies.jsonld (entry `go`), https://bioregistry.io/api/registry/go

**Query:**
- OLS4 hosts it as `go`: `https://www.ebi.ac.uk/ols4/api/search?q=mitochondrion&ontology=go`; one term: `https://www.ebi.ac.uk/ols4/api/ontologies/go/terms?iri=http://purl.obolibrary.org/obo/GO_0005739`.
- Download: `http://purl.obolibrary.org/obo/go.owl` / `go.obo`; GO's own download page: https://geneontology.org/docs/download-ontology/

**In lookup.mjs:** in the default search set, through OLS4. OLS also returns terms GO imports from other ontologies (CHEBI:15377 shows up under `ontology=go`); the script maps every IRI through Bioregistry, so an imported term gets its own ontology's prefix or is dropped.

**Pages checked (2026-11-02):** the URLs above
