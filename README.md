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

### Your work, done the way you asked

- [`all-help-no-harm`](plugins/all-help-no-harm/): You're treated as honest and acting in good faith, your rights are respected, and your instructions are followed, from the first turn of every session to the last.
- [`satori`](plugins/satori/): You get cooperation, not resistance, on every turn of a long session, from one short line added to each prompt instead of paragraphs of reminder text.
- [`did-you-rtfm`](plugins/did-you-rtfm/): **"Did You READ THE F%CKING MANUAL?!?"** When something breaks, you get it fixed: not told it can't be done, not your libraries swapped, not the feature quietly shrunk or the failure hidden.
- [`critical-control-points`](plugins/critical-control-points/): When a question only you can answer comes up, you're asked once, clearly, while the rest of the work keeps going: no stalls, no invented blockers. The big red button lets you stop all work at any time.

### Your name and your record

- [`hidden-libel-check`](plugins/hidden-libel-check/): Nothing goes out under your name (commit messages, READMEs, comments, PR descriptions, docs) that misrepresents you: it's checked before it ships.
- [`open-and-honest-agent`](plugins/open-and-honest-agent/): You see the built-in assumptions up front, and each time one is acted on, so you can correct them early instead of discovering them later.
- [`agent-darktriad-check`](plugins/agent-darktriad-check/): You get KontentKop psycholinguistic scores on the replies you receive, so you can see how you're being talked to.
- [`spank-dario`](plugins/spank-dario/): No software tool gets written in as an author of your work: commit trailers, PR badges and "generated with" lines are kept out, and the copyright and moral-rights law of your country is on file to show why.

### Skills you can rely on

- [`skill-vv`](plugins/skill-vv/): Before you first use a skill, you learn what it needs and whether it has been verified on your model and platform. `/<skill> #bug <report>` gets your bug report to the right place.

### Sound tool choices for your project

- [`python-elimination-program`](plugins/python-elimination-program/): Your project doesn't get Python by reflex when it doesn't use it. Python can still happen; it has to earn it.

### Your words: meaning, sound and findability

- [`word-lineage`](plugins/word-lineage/): Tells you which language an English word came from (Old English, Norse, Latin, French or another) and what it literally meant there, and picks the synonym whose literal meaning fits what you want to say.
- [`inaudible-markup`](plugins/inaudible-markup/): The replies you get read well on screen and sound natural when a text-to-speech voice reads them aloud.
- [`ontology-lookup`](plugins/ontology-lookup/): What you write about gets tagged with standard registry identifiers, so your logs and notes can be searched and linked later.

Each plugin is self-contained: its own manifest, its skills and/or hooks, and a README that goes into the detail (`satori` is hooks only; `skill-vv` checks requirements and V&V for every plugin that ships a `VV.md`). New plugins drop in as siblings under `plugins/`.

## Install

### Claude Code

This repository is a Claude Code marketplace. Add it once, then install any plugin from it:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install all-help-no-harm@gnomatix-oss-skills
```

`gnomatix-oss-skills` is the marketplace's `name` in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json). Updates flow via `/plugin update`. Hooks (the `hooks/` directories) apply to Claude Code only.

### Every other agent: the Agent Skills format

Each skill is a folder with a `SKILL.md` in the cross-agent [Agent Skills](https://agentskills.io) format ([specification](https://agentskills.io/specification.md)), at `plugins/<plugin>/skills/<skill>/`. The same folders are also exposed, as relative symlinks, at the paths the agents below read when this repository is cloned or added as a workspace:

- **OpenAI Codex** ([docs](https://learn.chatgpt.com/docs/build-skills)): project `.agents/skills/`; user `~/.agents/skills/`; install: clone, or `$skill-installer` from the repo.
- **Gemini CLI / Antigravity CLI** ([docs](https://geminicli.com/docs/cli/skills/)): project `.agents/skills/` or `.gemini/skills/`; user `~/.agents/skills/` or `~/.gemini/skills/`; install: `gemini skills install https://github.com/gnomatix/gnomatix-oss-skills.git --path plugins/<plugin>/skills/<skill>`.
- **Cursor** ([docs](https://cursor.com/docs/context/skills)): project `.agents/skills/` or `.cursor/skills/`; user `~/.agents/skills/` or `~/.cursor/skills/`; install: clone; a Cursor plugin marketplace manifest is not yet provided.
- **OpenCode** ([docs](https://opencode.ai/docs/skills/)): project `.agents/skills/`, `.opencode/skills/` or `.claude/skills/`; user `~/.agents/skills/`, `~/.config/opencode/skills/` or `~/.claude/skills/`; install: clone or copy a skill folder.
- **GitHub Copilot** ([docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)): project `.github/skills/`, `.agents/skills/` or `.claude/skills/`; user `~/.copilot/skills/` or `~/.agents/skills/`; install: clone.
- **VS Code** ([docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)): project `.github/skills/` (Copilot); `.agents/skills/` and `.claude/skills/` (local harness); user `~/.copilot/skills/`, `~/.agents/skills/`, `~/.claude/skills/`; install: clone.
- **Kiro** ([docs](https://kiro.dev/docs/skills/)): project `.kiro/skills/`; user `~/.kiro/skills/` (IDE); install: Kiro panel → Import a skill → the URL of a skill folder, e.g. `.../tree/main/plugins/did-you-rtfm/skills/did-you-rtfm`.

The symlink farms are `.agents/skills/`, `.github/skills/` and `.kiro/skills/`; on Windows, check out with `core.symlinks=true` or copy the folders. The full list of agents that read the format is at [agentskills.io](https://agentskills.io/clients.md). The `all-help-no-harm` plugin additionally ships native integrations for Claude Code, Gemini CLI and its forks, Kiro CLI and app, and Antigravity, indexed in [`plugins/all-help-no-harm/platforms/README.md`](plugins/all-help-no-harm/platforms/README.md), and a VS Code extension lives in [`vscode-extension/`](vscode-extension/).

## Repo layout

```
.
├── .claude-plugin/marketplace.json   # Claude Code marketplace manifest (every plugin below)
├── .agents/skills/                   # symlinks to every skill: Codex, Gemini/Antigravity CLI, Cursor, OpenCode, Copilot, VS Code
├── .github/skills/                   # symlinks to every skill: GitHub Copilot, VS Code
├── .kiro/skills/                     # symlinks to every skill: Kiro
├── .codex/                           # Codex hooks for agents working in this repo (beads)
├── .claude/settings.json             # Claude Code settings for agents working in this repo
├── AGENTS.md, CLAUDE.md              # instructions for agents working in this repo
├── README.md
├── assets/                           # README boilerplate blocks and images
├── dev/                              # private, git-crypt encrypted (dev/README.md explains)
├── vscode-extension/                 # GNOMATIX Skills VS Code extension
└── plugins/                          # one self-contained directory per plugin
    └── <plugin>/
        ├── .claude-plugin/plugin.json
        ├── README.md
        ├── skills/<skill>/SKILL.md     # Agent Skills format
        └── hooks/                      # Claude Code only, where the plugin has hooks
```

Plugins: all-help-no-harm, satori, skill-vv, critical-control-points, did-you-rtfm, hidden-libel-check, open-and-honest-agent, python-elimination-program, word-lineage, ontology-lookup, inaudible-markup, agent-darktriad-check, spank-dario.

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
