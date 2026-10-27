# word-lineage

> An [Agent Skill](https://agentskills.io) that traces an English word's lineage phylogenetically: which layer of English it came from (native Germanic, Norse, Latin, French, other), the evidence that decides it, and the literal meaning read off the family tree. Each word is placed on a bundled NEXUS network of English and its donor languages, with a cross-language synonym map grouped by shared root.

For anyone who wants a working definition of a word settled from its lineage, without a thesaurus or a dictionary argument.

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
| [`word-lineage`](skills/word-lineage/SKILL.md) | Invoked as `/word-lineage <word or words>`. Runs an eight-step procedure per word: core or new vocabulary, similarity to each candidate source language, conjugation and morphology, the synonym set broken into literal sources, fossils and drift, the historical wave, a cross-language literal synonym map placed on the network, and a working definition read off the lineage. A word-choice mode (`/word-lineage meaning: <phrase>`) lists candidate synonyms with their literal senses and picks the one that matches. |

## Why

English is a layered language. Each wave of contact (Roman and church Latin, Norse settlement, Norman French, later scholarly Latin and Greek, modern borrowings) left its own words beside the native ones, so most concepts have a synonym set whose members come from different layers: begin / commence / initiate, ask / inquire, kingly / royal / regal. Core vocabulary (air, water, egg, eat, die) stays native; words for the things a ruling group brought in come from that group's language. Verb conjugation and suffixes carry their layer too: strong vowel-changing verbs are Germanic, `-ate` / `-ize` / `-ment` / `-ity` are Latin or French, `-ness` / `-hood` / `-ship` are Germanic.

Breaking each synonym down to its literal source separates the set by literal meaning instead of letting it blur together. The skill does that systematically and gives one answer per word.

## How it works

```
/word-lineage <word>
        │
        ▼
 ┌──────────────────────────────────────┐
 │ Steps 1–6: core vs new, similarity,  │
 │ morphology, synonym set, drift,      │
 │ historical wave                      │
 └────────────────┬─────────────────────┘
                  ▼
 ┌──────────────────────────────────────┐
 │ Step 7: cross-language synonym map,  │
 │ root groups placed on the network,   │
 │ path to English via split or merge   │
 │ edge (R0–R7) with its date           │
 └────────────────┬─────────────────────┘
                  ▼
 ┌──────────────────────────────────────┐
 │ Step 8: working definition = the     │
 │ literal meaning read off the lineage │
 └──────────────────────────────────────┘
```

The network is [`reference/lineage-network.nex`](skills/word-lineage/reference/lineage-network.nex) (NEXUS, Newick tree, branch lengths in approximate centuries; a heuristic, not a measurement) with a terminal rendering in [`reference/lineage-network.txt`](skills/word-lineage/reference/lineage-network.txt). Merge edges R0–R7 mark the borrowing waves, including the back-loans from English into German, Dutch and French. The skill marks facts taken from recall as "recall" and cites any dictionary it checked. When an answer is wrong, the correction goes into the skill as a dated refinement.

## Install

### Claude Code

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install word-lineage@gnomatix-oss-skills
```

### Manual Claude Code install

```sh
mkdir -p ~/.claude/skills
cp -r plugins/word-lineage/skills/* ~/.claude/skills/
```

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers, or each CLI's documentation.

## Layout

```
plugins/word-lineage/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── skills/
    └── word-lineage/
        ├── SKILL.md
        └── reference/
            ├── lineage-network.nex
            └── lineage-network.txt
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
