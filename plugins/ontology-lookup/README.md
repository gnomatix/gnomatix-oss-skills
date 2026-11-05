# ontology-lookup

> An [Agent Skill](https://agentskills.io) for tagging the things an agent writes about with identifiers from established registries. The first mention of a thing in a passage gets its identifier inline, as a CURIE with a Bioregistry prefix: «mitochondrion» [GO:0005739], «water» [CHEBI:15377], «English» [glottolog:stan1293]. Logs written this way can be resolved and indexed later.

For anyone who wants agent-written logs, notes and reports to be machine-indexable by the things they mention, without a separate annotation pass over everything the agent wrote.

<!-- BEGIN: gnomatix-promo-include -->
<p>
  <a href="https://www.buymeacoffee.com/gnomatix">
    <img src="https://img.buymeacoffee.com/button-api/?text=Buy+me+a+coffee&emoji=&slug=gnomatix&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" alt="Buy Me A Coffee — gnomatix">
  </a>
</p>

<!-- For JS-rendering contexts (the BMC-supplied script tag, preserved as authored):
<script type="text/javascript"
  src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
  data-name="bmc-button"
  data-slug="gnomatix"
  data-color="#BD5FFF"
  data-emoji=""
  data-font="Cookie"
  data-text="Buy me a coffee"
  data-outline-color="#000000"
  data-font-color="#ffffff"
  data-coffee-color="#FFDD00"></script>
-->
<!-- END: gnomatix-promo-include -->

## Skills

| Skill | Role |
|---|---|
| [`ontology-lookup`](skills/ontology-lookup/SKILL.md) | Defines the tagging format `«term» [CURIE]` and the rules (first mention per passage; never tag what could not be resolved; most specific ontology; one CURIE per thing; Bioregistry prefixes only). Carries a starter set of seventeen open ontologies and registries with a reference file each, and a lookup script with search, `--resolve CURIE` and a `--lineage` word mode. |

## Why

An identifier is only useful if someone else can follow it. Bioregistry prefixes resolve: `https://bioregistry.io/GO:0005739` redirects to the Gene Ontology term, and the same prefixes are used by the ontologies themselves, by EMBL-EBI's OLS and by the literature. Tagging at write time is cheap for the agent, which already knows what it meant; a separate pipeline (not part of this plugin) tags human-written text and anything the agent missed, in the same format.

## How it works

```
agent writes about a thing
        │
        ▼
 node scripts/lookup.mjs "<term>" [--ontology <key>]
        │  OLS4 (OBO + W3C vocabularies), Wikidata,
        │  schema.org / OWL-Time / QUDT files, Bioregistry
        ▼
 candidate CURIEs with labels ──► pick the most specific match
        │                         (or none: then no tag)
        ▼
 «term» [CURIE] at the first mention in the passage
```

`node scripts/lookup.mjs --resolve <CURIE>` checks a CURIE: canonical prefix, label, resolving URL. `node scripts/lookup.mjs --lineage <word>` gives a word's language and its Wiktionary etymon chain, each language with its ISO 639-3 and Glottolog codes.

### Starter set

Wikidata, schema.org, SKOS, Dublin Core, PROV-O, OWL-Time, BFO, Gene Ontology, ChEBI, UBERON, NCBI Taxonomy, Sequence Ontology, EDAM, QUDT, ISO 639-3, Glottolog, MeSH. Each has a file under [`skills/ontology-lookup/references/`](skills/ontology-lookup/references/) saying what it is for, its prefix, how to query it (API or download), and its licence, with the page each fact was checked on. SNOMED CT is excluded because its use is subject to a licence agreement ([`excluded.md`](skills/ontology-lookup/references/excluded.md)).

### The script

`skills/ontology-lookup/scripts/lookup.mjs`: Node 20 or later, standard library only (`fetch`, `fs`, `path`, `os`, `crypto`, `util.parseArgs`), no `child_process`, no npm dependencies.

- **Cache.** Responses are cached under a directory the user controls: `--cache-dir`, else `$ONTOLOGY_LOOKUP_CACHE`, else the platform cache directory. Paths are built with `path.join` from `os.homedir()` or the platform's cache variables.
- **Filesystem handling.** The script is not a hook, but it follows the patterns of this repository's filesystem-robustness rules (written for hooks): every cache read and write is wrapped in try/catch; writes go to a temp file and are renamed into place; directories are created with `mkdirSync({ recursive: true })`; a failed cache write is reported on stderr and the lookup carries on. The script makes two kinds of filesystem call (read a cache entry, write a cache entry), so these patterns are inline rather than a vendored package, which the repository rules allow for one or two `fs` calls.
- **Network.** One retry after a second on a network error or HTTP 5xx; an HTTP 404 is cached as an answer; on network failure a stale cached copy is used with a warning. Wikidata's search API falls back to the Wikidata Query Service on HTTP 429.
- **Tests.** `cd skills/ontology-lookup/scripts && node --test test/lookup.test.mjs` runs offline against responses recorded from the live APIs on 2026-11-02 (`test/fixtures/cache`); `node test/record-fixtures.mjs` re-records them. Three large responses are trimmed after recording, and each trimmed entry says so.

## Install

### Claude Code

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install ontology-lookup@gnomatix-oss-skills
```

### Manual Claude Code install

```sh
mkdir -p ~/.claude/skills
cp -r plugins/ontology-lookup/skills/* ~/.claude/skills/
```

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers, or each CLI's documentation.

## Layout

```
plugins/ontology-lookup/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── skills/
    └── ontology-lookup/
        ├── SKILL.md
        ├── references/            # one file per starter-set source, plus
        │   ├── wikidata.md        # bioregistry-and-ols.md, wiktionary.md,
        │   ├── go.md              # excluded.md
        │   └── ...
        └── scripts/
            ├── lookup.mjs
            └── test/
                ├── lookup.test.mjs
                ├── scenarios.mjs
                ├── record-fixtures.mjs
                └── fixtures/cache/   # recorded API responses
```

<!-- BEGIN: gnomatix-license-include -->
## License

**Business Source License 1.1** (BUSL-1.1) — *source-available, not OSI open source*.

The *Additional Use Grant* — the only free-use carve-out — covers:

- **Individual scientists and researchers in the natural sciences, mathematics, engineering, and computer science**, for personal, academic, or non-commercial scientific research use. Social sciences and humanities are *not* covered.
- **Researchers funded by the U.S. NIH (excluding NIAID), NSF, or USDA**, in the course of that funded research. NIAID-funded researchers, other government employees, and other government-funded researchers are *not* covered.
- **Minors** (individuals under the age of 18, or the local age of majority where lower) — any non-commercial personal use.

**All other use requires a commercial license.** This includes any commercial use; organizational, team, or production use; integration into a commercial product; internal use within a for-profit entity; government use outside the NIH-non-NIAID / NSF / USDA carve-out above; NIAID-funded research; social-science or humanities research use; and any adult individual use that is not personal/academic research in the covered disciplines.

Contact [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or reach out via [LinkedIn](https://www.linkedin.com/company/gnomatix) for commercial licensing. General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

On the *Change Date* defined in the LICENSE, this code converts automatically to the *Change License* (an OSI-approved open source license) at no further cost to anyone.

See [`LICENSE`](LICENSE) for the full text, including the exact *Additional Use Grant* wording, the covered-disciplines definition, the agency-specific carve-outs and exclusions, the minor-use carve-out, the *Change Date*, and the *Change License* parameters.
<!-- END: gnomatix-license-include -->
