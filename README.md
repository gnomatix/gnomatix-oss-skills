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

### Session ground rules

How every session starts and what stays in force through it.

- [`all-help-no-harm`](plugins/all-help-no-harm/): The agent treats you as honest and acting in good faith, respects your rights, and follows your instructions, from the first turn of every session to the last.
- [`satori`](plugins/satori/): Keeps the agent working with you, and with the task, on every turn of a long session, instead of resisting either. It does this with one short line added to each prompt, not paragraphs of reminder text.

### Doing the work properly

What the agent does when work gets hard: investigate instead of pivoting, raise real questions once, and choose tools on merit.

- [`did-you-rtfm`](plugins/did-you-rtfm/): **"Did You READ THE F%CKING MANUAL?!?"** When something breaks, the agent fixes it instead of telling you it can't be done, swapping your libraries, quietly shrinking the feature or hiding the failure.
- [`critical-control-points`](plugins/critical-control-points/): When the agent hits a question only you can answer, it keeps working on everything else and asks you once, clearly, instead of stopping or inventing a blocker. The big red button lets you stop all work at any time.
- [`python-elimination-program`](plugins/python-elimination-program/): Stops agents reaching for Python by reflex in projects that don't use it. Python can still happen; it has to earn it.

### Honest, reviewed output

Making the agent's defaults visible, and checking what it writes before it ships under the user's name.

- [`open-and-honest-agent`](plugins/open-and-honest-agent/): Shows you the agent's built-in assumptions up front and logs each time it acts on one, so you can correct them early instead of discovering them later.
- [`actually-im-the-ahole`](plugins/actually-im-the-ahole/): Checks what the agent writes under your name (commit messages, READMEs, comments, PR descriptions, docs) before it ships, so nothing goes out that misrepresents you.
- [`kontentkop-agent-output`](plugins/kontentkop-agent-output/): Scores the agent's own replies with the KontentKop psycholinguistic scorer, so you can see how it is talking to you.

### Skill quality and bug reports

Whether a skill works on this model and platform, and what happens when it does not.

- [`skill-vv`](plugins/skill-vv/): Before you first use a skill, tells you what it needs and whether it has been verified on your model and platform. `/<skill> #bug <report>` sends a bug report to the right place.

### Writing, language and knowledge

Words, identifiers and output that read and sound right.

- [`word-lineage`](plugins/word-lineage/): Tells you what a word literally means, from where it came from, and helps you pick the word that literally says what you mean.
- [`ontology-lookup`](plugins/ontology-lookup/): Tags the things the agent writes about with standard registry identifiers, so your logs and notes can be searched and linked later.
- [`inaudible-markup`](plugins/inaudible-markup/): The agent's replies read well on screen and sound natural when a text-to-speech voice reads them aloud.

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

Plugins: all-help-no-harm, satori, skill-vv, critical-control-points, did-you-rtfm, actually-im-the-ahole, open-and-honest-agent, python-elimination-program, word-lineage, ontology-lookup, inaudible-markup, kontentkop-agent-output.

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
