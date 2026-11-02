# OWL-Time — `time`

**For:** temporal concepts: `Instant`, `Interval`, `Duration`, `before`, `after`, `inside`, calendar descriptions. Tag the *kind* of time expression with it. A date itself is not a term: write it in ISO 8601 and leave it untagged, or tag the event it dates.

**Prefix:** `time` (Bioregistry `time`; URI `http://www.w3.org/2006/time#$1`). Example: «Time instant» [time:Instant] (the ontology's own label for `time:Instant`).

**Licence:** the ontology file declares `dct:license <https://creativecommons.org/licenses/by/4.0/>` and "Copyright © 2006-2017 W3C, OGC". Checked: https://www.w3.org/2006/time (Turtle) and the specification https://www.w3.org/TR/owl-time/

**Query:**
- No search API and not in OLS4 (checked against the OLS4 ontology list, https://www.ebi.ac.uk/ols4/api/ontologies?size=1000, on 2026-11-02).
- Download: `https://www.w3.org/2006/time` with `Accept: text/turtle` (about 100 KB).

**In lookup.mjs:** `--ontology time` downloads the Turtle once and matches `rdfs:label` / `skos:prefLabel`.

**Pages checked (2026-11-02):** the URLs above, https://bioregistry.io/api/registry/time
