# QUDT — `qudt.unit`, `qudt.quantitykind`

**For:** units of measure (kilogram, metre per second) and the quantities they measure (mass, velocity).

**Prefixes:** `qudt.unit` (URI `http://qudt.org/vocab/unit/$1`) and `qudt.quantitykind` (URI `http://qudt.org/vocab/quantitykind/$1`), both registered at Bioregistry. Bioregistry also registers `qudt` for the QUDT schema classes themselves. Examples: «Kilogram» [qudt.unit:KiloGM], «Mass» [qudt.quantitykind:Mass].

**Licence:** "QUDT is licensed under CC BY 4.0" (repository README); the qudt.org home page carries the same CC BY 4.0 notice. Checked: https://github.com/qudt/qudt-public-repo, https://qudt.org/

**Query:**
- No search API and not in OLS4 (OLS4 ontology list checked 2026-11-02).
- Download: `https://qudt.org/vocab/unit/` and `https://qudt.org/vocab/quantitykind/` with `Accept: text/turtle` (the unit file is about 4 MB).

**In lookup.mjs:** `--ontology qudt.unit` (alias `qudt`) or `--ontology qudt.quantitykind`; downloads the Turtle once and matches `rdfs:label`.

**Pages checked (2026-11-02):** the URLs above, https://bioregistry.io/api/registry/qudt.unit, https://bioregistry.io/api/registry/qudt.quantitykind
