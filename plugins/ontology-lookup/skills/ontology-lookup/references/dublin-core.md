# Dublin Core — `dcterms` (and legacy `dc`)

**For:** bibliographic and document metadata: `creator`, `title`, `date`, `license`, `subject`, `rights`. Prefer `dcterms` (`/terms/`); `dc` (`/elements/1.1/`) is the older namespace, which DCMI supports indefinitely but "gently encourages" users to move off (Bioregistry's description of `dc` quotes the deprecation notice).

**Prefix:** `dcterms` (URI `http://purl.org/dc/terms/$1`), `dc` (URI `http://purl.org/dc/elements/1.1/$1`). Example: «Creator» [dcterms:creator].

**Licence:** "Unless indicated otherwise, DCMI documents are licensed under a Creative Commons Attribution 4.0 International License (CC BY 4.0)", and the same for RDF and XML schemas on the DCMI site. Checked: https://www.dublincore.org/about/copyright/

**Query:**
- OLS4 hosts both, as `dcterms` and `dc`.
- Specification and downloads: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/ (OLS4 loads `dublin_core_terms.rdf` and `dublin_core_elements.rdf` from there).

**In lookup.mjs:** both in the default search set, through OLS4.

**Pages checked (2026-11-02):** the two DCMI pages above, https://bioregistry.io/api/registry/dcterms, https://bioregistry.io/api/registry/dc
