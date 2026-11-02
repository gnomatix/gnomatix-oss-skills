# Wiktionary — source for the word-lineage mode

Wiktionary is not an identifier registry and gets no prefix. It is where the etymon chain comes from; the identifiers on that chain are ISO 639-3 and Glottolog codes for the languages ([iso-639-3.md](iso-639-3.md), [glottolog.md](glottolog.md)).

**Licence:** "The original texts of Wiktionary entries are dual-licensed to the public under both the Creative Commons Attribution-ShareAlike 4.0 International License (CC-BY-SA) and the GNU Free Documentation License (GFDL)." Checked: https://en.wiktionary.org/wiki/Wiktionary:Copyrights. Quote a chain with a link to the entry.

**Query:**
- Raw wikitext of an entry: `https://en.wiktionary.org/w/index.php?title=<word>&action=raw`. (On 2026-11-02 the `api.php` and REST endpoints answered HTTP 429 from the test machine while `index.php?action=raw` answered; Wikimedia rate-limits API clients, https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits.)
- Each language has a level-2 section (`==English==`); etymologies are level-3 or deeper (`===Etymology===`, `===Etymology 1===`).
- Etymology templates (https://en.wiktionary.org/wiki/Wiktionary:Etymology, https://en.wiktionary.org/wiki/Template:inherited): `{{inh|en|ang|wæter|t=water}}` = inherited; `{{der|...}}` = derived; `{{bor|...}}` = borrowed; `{{lbor|...}}` = learned borrowing. `inh+`, `der+`, `bor+` and `lbor` redirect to `inherited`, `derived`, `borrowed` and `learned borrowing`. First parameter: the language of the section; second: the source language; third: the source term; `t=`: gloss.
- Language codes (https://en.wiktionary.org/wiki/Wiktionary:Languages): "If the language has a two-letter code in the ISO 639-1 standard, then that code is used"; otherwise, "if the language has a three-letter code in the ISO 639-3 standard, then that code is used". Other codes are Wiktionary's own (`gem-pro` Proto-Germanic, `ine-pro` Proto-Indo-European, `la-vul` Vulgar Latin). The script maps two-letter codes through Wikidata P218 (ISO 639-1) and three-letter codes through P220 (ISO 639-3), then reads P1394 (Glottolog). Wiktionary's own codes do not map and stay untagged.

**How the chain is read:** templates in prose order, in the section's language only. Cognate lists (`{{cog|...}}`), bullet lines and `{{root}}` / `{{etymon}}` lines are skipped. Where the etymology names the parts of a compound, the parts appear as further steps in the order written (for `commence` the chain ends with Latin «com-»); the chain is Wiktionary's, not a reconstruction.

**Pages checked (2026-11-02):** the URLs above, the raw wikitext of `water`, `beef`, `commence`, `egg` and `Wasser`.
