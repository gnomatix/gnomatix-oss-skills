# Glottolog — `glottolog`

**For:** languoids: languages, dialects and families, including historical languages (Old English `olde1238`, Middle English `midd1317`). Used by the word-lineage mode.

**Prefix:** `glottolog` (Bioregistry; URI `https://glottolog.org/resource/languoid/id/$1`). Example: «English» [glottolog:stan1293].

**Licence:** CC BY 4.0 ("is licensed under a Creative Commons Attribution 4.0 International License" on the home page). Checked: https://glottolog.org/

**Query:**
- One languoid as JSON: `https://glottolog.org/resource/languoid/id/<glottocode>.json` (fields include `name`, `hid` = the ISO 639-3 code, `level`, `newick`).
- Through Wikidata: property P1394 ("Glottolog code").
- Download: each release as a CLDF dataset archived on Zenodo, DOI 10.5281/zenodo.3260727; https://glottolog.org/meta/downloads

**In lookup.mjs:** `--ontology glottolog` finds languoids by name through Wikidata; `--resolve glottolog:<code>` reads the languoid JSON; `--lineage` attaches the glottocode to each language in the chain. Proto-languages that Wiktionary codes as `gem-pro`, `ine-pro` and the like have no ISO 639-3 code and no Wikidata P220/P1394 match through this route, so they stay untagged.

**Pages checked (2026-11-02):** the URLs above, https://glottolog.org/resource/languoid/id/stan1293.json, https://www.wikidata.org/wiki/Special:EntityData/P1394.json, https://bioregistry.io/api/registry/glottolog
