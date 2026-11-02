# gnomatix-oss-skills

!["Kids, if somebody offers you VENVS… Just say NO."](assets/images/pep-banner.png "If you can't manage your dependencies, you shouldn't have them.")

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

A collection of [Agent Skills](https://agentskills.io) and Claude Code plugins from GNOMATIX. This repo doubles as a Claude Code marketplace, so a single `/plugin marketplace add` covers every plugin housed here.

## Plugins

| Plugin | What it's for | What's inside |
| --- | --- | --- |
| [`all-help-no-harm`](plugins/all-help-no-harm/) | Starts every session from the standing contract: the agent presumes the user is honest and acting in good faith, respects the user's rights and personhood, and follows the user's instructions on those terms. | One skill plus hooks. At session start the agent presents the contract for the user to affirm (or end the session) and logs the record; a one-line per-turn reminder keeps it in force; PostCompact re-injects it. Context-watch hooks add housekeeping checkpoints as a long session fills. |
| [`satori`](plugins/satori/) | The compact per-turn behavioural reminder: Confucian constants plus the Taoist way of moving through a turn, as characters rather than paragraphs. | One UserPromptSubmit hook, ~250 tokens a turn. |
| [`critical-control-points`](plugins/critical-control-points/) | What the agent does when a question surfaces it cannot settle alone: capture it with provenance, keep working on what it does not gate, ask the user one single question through the tool. The fake-blocker prevention tool, with the big red button to stop everything when the whole work is wrong. | One skill: the procedure, the reviewer prompt, the big red button. |
| [`did-you-rtfm`](plugins/did-you-rtfm/) | **"Did You READ THE F%CKING MANUAL?!?"** When something breaks, the agent fixes it instead of declaring a blocker, swapping libraries, quietly shrinking the feature or wrapping the failure in a `try/except`. | One skill: check the versions in use, read the docs for those versions, verify assumptions, build a minimal repro, then report. Two optional hooks: one catches pivot language at the end of a turn, one asks before bypass flags such as `--no-verify` or `--force`. |
| [`actually-im-the-ahole`](plugins/actually-im-the-ahole/) | A last read-through of agent-written text (commit messages, READMEs, comments, PR descriptions, docs) before it ships under the user's name. | One skill that reviews the draft against fifteen risk classes (the agent editorialising about the user, putting words in the user's mouth, unverified claims and more), reports what it finds with fixes, and changes nothing without the user's OK. Optional hooks run it before commits and at the end of a turn. The rule: if anyone is the a**hole here, it is the agent, never the user. |
| [`open-and-honest-agent`](plugins/open-and-honest-agent/) | Makes the agent's hidden defaults visible so the user can correct them instead of discovering them later. | One skill: at the start of development work the agent writes its default assumptions (about the user, the goals, its own preferences and failure modes) as per-session files, then logs each time it acts on one, by ID, before it acts. |
| [`python-elimination-program`](plugins/python-elimination-program/) | Stops agents reaching for Python by reflex in projects that don't use it. Python can still happen; it has to earn it. | Four skills plus an optional hook. Three gates in order: [`whacking-day`](plugins/python-elimination-program/skills/whacking-day/SKILL.md) (justify it, get the user's OK), [`zartan`](plugins/python-elimination-program/skills/zartan/SKILL.md) (a non-Python option wins if one exists), [`jake-the-snake`](plugins/python-elimination-program/skills/jake-the-snake/SKILL.md) (approved Python is written properly). [`old-willy`](plugins/python-elimination-program/skills/old-willy/SKILL.md) is the merit test for any "Python is the best tool" claim. The hook blocks Python at the harness when nothing has been authorised. |
| [`word-lineage`](plugins/word-lineage/) | Settles what a word literally means from where it came from. | One skill: `/word-lineage <word>` reads the word's layer of English (native Germanic, Norse, Latin, French, other) and its literal meaning off a bundled family tree of English and its donor languages. `/word-lineage meaning: <phrase>` picks the synonym that literally says what you mean. |
| [`ontology-lookup`](plugins/ontology-lookup/) | Tags the things the agent writes about with identifiers from established registries, so logs and notes can be resolved and indexed later. | One skill and `scripts/lookup.mjs` (Node, no dependencies): search, resolve a CURIE, and a word-lineage mode with ISO 639-3 and Glottolog ids. Format: `«term» [CURIE]` with Bioregistry prefixes. |
| [`inaudible-markup`](plugins/inaudible-markup/) | Replies that read as structure on screen and sound natural when a voice reads them aloud. | One skill listing the characters a text-to-speech voice does not read (brackets, braces, dashes, colons, guillemets and more) and how to write with them. |
| [`kontentkop-agent-output`](plugins/kontentkop-agent-output/) | Runs the KontentKop psycholinguistic scorer over the agent's own replies, not only over prompts. | A Stop / SubagentStop hook that pipes the last reply through a locally built KontentKop binary and logs the per-metric scores. |

Each plugin is self-contained, with its own manifest, skills, hooks and README, and each README goes into the detail. New plugins drop in as siblings under `plugins/`.

## Install

### Claude Code

This repo is a marketplace. Add it once, then install any plugin from it:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install python-elimination-program@gnomatix-oss-skills
```

`gnomatix-oss-skills` is the marketplace's `name` field in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) — change it there if you rename. Updates flow via `/plugin update`.

### Other CLIs (cross-CLI Agent Skills standard)

Each plugin's `skills/` subdirectory contains skills in the cross-CLI [Agent Skills](https://agentskills.io) format. The directory structure is:

```
plugins/<plugin-name>/skills/<skill-name>/SKILL.md
```

Per-CLI install pointers (each CLI handles install differently; the *format* is shared):

- **Gemini CLI** — [skills docs](https://geminicli.com/docs/cli/skills/)
- **Kiro** — [skills docs](https://kiro.dev/docs/skills/)
- **Cursor** — [skills docs](https://cursor.com/docs/context/skills)
- **OpenCode** — [skills docs](https://opencode.ai/docs/skills/)
- **OpenAI Codex** — [skills docs](https://developers.openai.com/codex/skills/)
- **GitHub Copilot** — [skills docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- **VS Code** — [skills docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- **Goose** — [skills docs](https://block.github.io/goose/docs/guides/context-engineering/using-skills/)

For the full list of compatible CLIs and platforms (~40 and growing), see [agentskills.io](https://agentskills.io).

Hooks are not part of the cross-CLI standard, so the optional firewall hooks shipped under `plugins/<name>/hooks/` only apply to Claude Code.

## Repo layout

```
.
├── .claude-plugin/
│   └── marketplace.json          # marketplace manifest (lists every plugin below)
├── README.md
└── plugins/                      # one self-contained directory per plugin
    ├── <plugin>/
    │   ├── .claude-plugin/plugin.json
    │   ├── README.md
    │   ├── skills/<skill-name>/SKILL.md   # cross-CLI Agent Skills
    │   └── hooks/                         # Claude Code only, where the plugin has hooks
    ├── all-help-no-harm/
    ├── satori/
    ├── critical-control-points/
    ├── did-you-rtfm/
    ├── actually-im-the-ahole/
    ├── open-and-honest-agent/
    ├── python-elimination-program/
    ├── word-lineage/
    ├── ontology-lookup/
    ├── inaudible-markup/
    └── kontentkop-agent-output/
```

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

![GNOMATIX "TEAM"](assets/images/gnomatix-killbots-activate-xs.png)
![GNOMATIX LOGO](assets/images/gnomatix-new-xs.png "GNOMATIX")
> #YoureWelcome
