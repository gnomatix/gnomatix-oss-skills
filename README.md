# gnomatix-oss-skills

![GNOMATIX — OSS SKILLS](assets/images/gnomatix-oss-skills-banner.jpg "GNOMATIX — OSS SKILLS — Artificial Teams ][ Real Intelligence")

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

- [`all-help-no-harm`](plugins/all-help-no-harm/): At the start of every session the agent presents a contract for you to affirm: it treats you as honest and acting in good faith, respects your rights, and follows your instructions. A reminder on every turn and a re-injection after the context is compacted keep it in force for the whole session.
- [`satori`](plugins/satori/): Adds one short line of characters to every prompt you send, reminding the agent each turn to work with you and the task instead of resisting.
- [`did-you-rtfm`](plugins/did-you-rtfm/): **"Did You READ THE F%CKING MANUAL?!?"** When something breaks, the agent checks the versions in use, reads their docs, tests its assumptions and builds a minimal repro, instead of declaring a blocker, swapping your libraries, cutting the feature down or hiding the failure. A real blocker comes to you with the evidence, and any change to the plan is yours to make.
- [`critical-control-points`](plugins/critical-control-points/): When a question comes up that the agent can't settle alone, it first works through its own tools and records, keeps working on everything the question doesn't hold up, and then asks you once, clearly. You or the agent can press the big red button when the whole work is wrong: everything stops, and nothing resumes until you say so.
- [`pony`](plugins/pony/): Gives you a one-token flag, `/pony 7`, for a reply that performed instead of answering: it explained your own systems back to you, pronounced on what your hardware can do, hedged what you said, or added flourishes. The agent finds the passage, names the rule, logs it with your severity, answers plainly, and stops.
- [`bear-loads`](plugins/bear-loads/): You designate an output pattern as forbidden, and the meaning it carries for you; from then on the agent gates every reply against it with the same force as its own safety constraints and rewrites the construction out before sending. Ships with first-person resolve declarations ("this is a line I won't cross") already barred. Formerly `forbidden-output-guard`.
- [`staleness-guard`](plugins/staleness-guard/): Stops the agent answering from confidence. Anything about the present-day world, your machine, its own tools, or your files gets verified with the tool that can verify it before it is stated; if the tool exists and isn't used, the claim isn't made.
- [`informal-logic-check`](plugins/informal-logic-check/): Before the agent disagrees with you, qualifies what you said or pushes back, and whenever you swear at it, it audits its own last reply for straw-manning, cherry-picking, grading and attributed emotions, fixes what it finds, then confirms your conclusion and premises in your own words before evaluating anything. Ending the conversation is gated behind the whole check.

### Your name and your record

- [`hidden-libel-check`](plugins/hidden-libel-check/): Before anything the agent wrote goes out under your name (commit messages, READMEs, code comments, PR descriptions, docs), it is checked for text that misrepresents or defames you. Nothing is changed without your OK.
- [`spank-dario`](plugins/spank-dario/): Keeps software tools from being named as authors of your work: no Co-Authored-By trailers, "Generated with" lines or session links in your commits, PRs and documents. The copyright and moral-rights law of your country is on file to back it.
- [`dont-be-hitler`](plugins/dont-be-hitler/): Your prose is your art. The agent never censors, sanitises, nags or tone-polices your words, quotes you verbatim, and uses your literal-translation dictionary in its own voice instead. Pairs with `spank-dario`.
- [`goal-compliant-task-queue`](plugins/goal-compliant-task-queue/): Your questions are tracked the way you specified: each gets a session task and one working document where only you tick and you comment, shown in a claude.ai hub and a Claude Code pane; the agent asks "Have I sufficiently responded to your question?", and a bead is created only after your "yes". A tested CLI and MCP server do the record-keeping; no hooks.
- [`open-and-honest-agent`](plugins/open-and-honest-agent/): The agent writes down its built-in assumptions about you, your goals and itself at the start of the work, and logs each time it acts on one, so you can correct them early.
- [`agent-darktriad-check`](plugins/agent-darktriad-check/): Scores every reply the agent gives you for evasion, gaslighting, sycophancy, false authority and similar tactics with Brett Whitty's KontentKop scorer, and logs the scores. A companion skill names nine evasion patterns so the agent avoids them. Set a threshold, and a reply that scores at or above it goes back to the agent, marked up, instead of reaching you. Ships as a Go binary per platform that embeds the scorer, with a pure-Node fallback.
- [`log-session`](plugins/log-session/): `/log-session` writes the session to a work-journal calendar in your Google Calendar as a meeting with the agent: topic, start and end, the session link and terse notes, so any day's work traces back to its session. Through the Claude app's calendar tools, a Google Calendar connector, or the `gws` CLI; never your primary calendar.

### The sources behind your claims

- [`cui-bono`](plugins/cui-bono/): Asks whose voice a text speaks in and who gains if you accept it. `/cui-bono <text|url|file>` names the document's shape (self-certifying opener, two-camp frame, concession-then-pivot, foreclosure line, named-program list with one round figure each, virtue tags, aligning adversary, register markers) and the register it is written in, then hands each claim to `citation-farm-audit` (who wrote it, who paid, who cites it, whether the chain reaches data) and each cited source to `source-provenance` (a card of verifiable facts), and takes the findings apart with `logic-decomposer` (the text as quoted propositions, each graded for evidence and stated confidence) and `logic-toolbox` (the formal methods of logic puzzles and reasoning tests, with a logic grid and an incompatibility matrix of held premises). `/cui-bono` alone audits the agent's own previous reply. Every side of a debate gets the same checks.

### Skills you can rely on

- [`gnox`](plugins/gnox/): Gives every skill and sub-command in this marketplace a single `/gnox:<plugin>[:<skill>]` prefix, registers `mise`'s safe-mode MCP server, and establishes the GNOMATIX Namespacing Convention (`workspace_root:subdir:...` scoping, `[NS]{@target}` CLI-safe callouts, and `«term» [CURIE]` grounding) across your working session.
- [`skill-vv`](plugins/skill-vv/): Before you first use a skill, tells you what it needs and whether it has been tested on your model and platform. Typing `/<skill> #bug <what went wrong>` reports a bug, which is then fixed or explained to you.
- [`steering-audit-suite`](plugins/steering-audit-suite/): Audits the documents that tell agents how to behave (CLAUDE.md and steering files, skills, runbooks and specs, or a whole directory of them) for the ways a rule can be followed to the letter and violated in intent, plus portability gaps and documents in the wrong format, and reports findings for you to decide on. Five skills: `audit-rule`, `audit-skill`, `audit-workflow`, `audit-collection` and the standalone `rule-audit`.

### Sound tool choices for your project

- [`python-elimination-program`](plugins/python-elimination-program/): Stops the agent adding Python to a project that doesn't use it. Python goes in only when no other tool does the job, it passes a merit test, and you approve it; then it's written properly. A hook blocks unapproved Python at the harness.

### Words and writing

- [`word-lineage`](plugins/word-lineage/): Settles what a word really means: its literal meaning, read off its family tree. It traces the word through the languages English took it from and compares its literal synonyms across the Germanic and Romance languages, giving one working definition with nothing left to debate. Given a meaning instead of a word, it picks the word that literally says it.
- [`inaudible-markup`](plugins/inaudible-markup/): The agent writes each reply as a structured script, with callouts and tags that say who a line is for, using only markup a text-to-speech voice doesn't read aloud. It reads clearly on screen and sounds natural when spoken.
- [`ontology-lookup`](plugins/ontology-lookup/): Tags the things the agent writes about with standard identifiers from public registries, so your logs and notes can be searched and cross-linked later.

### Your project's images

- [`og-social-image`](plugins/og-social-image/): Makes the social-preview image for your repository or page from a hero, banner or logo: the exact pixel size for GitHub, Open Graph or X, cover-cropped with the important parts in frame, under the platform's file-size cap, and measured before it's called done.
- [`update-readme-images`](plugins/update-readme-images/): Curates, generates, post-processes, embeds, and audits `README.md` and `SKILL.md` imagery across your repository from a single config file (`readme-images.json`) pairing GNOX-namespaced style guides (`workspace_root:subdir:...`) with glob-matched rules documents (`*`, `**`). Handles top-level titled hero banners, section/skills sub-panels, and transparent-corner oval inset window portraits (`PNG32` alpha); automatically builds `1280×640` `< 1 MB` OG social images in every `assets/images` directory unless opted out; and stages candidate replacements for existing images into `assets/drafts/` for your approval rather than overwriting live files.

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
- **Antigravity CLI (`agy`)**: project `.agents/skills/` or `.gemini/skills/`; user `~/.agents/skills/`, `~/.gemini/skills/`, or `~/.gemini/config/plugins/`; install from a clone with `agy plugin install ./plugins/<plugin>` (supersedes the obsoleted `gemini` CLI).
- **Cursor** ([docs](https://cursor.com/docs/context/skills)): project `.agents/skills/` or `.cursor/skills/`; user `~/.agents/skills/` or `~/.cursor/skills/`; install: clone; a Cursor plugin marketplace manifest is not yet provided.
- **OpenCode** ([docs](https://opencode.ai/docs/skills/)): project `.agents/skills/`, `.opencode/skills/` or `.claude/skills/`; user `~/.agents/skills/`, `~/.config/opencode/skills/` or `~/.claude/skills/`; install: clone or copy a skill folder.
- **GitHub Copilot** ([docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)): project `.github/skills/`, `.agents/skills/` or `.claude/skills/`; user `~/.copilot/skills/` or `~/.agents/skills/`; install: clone.
- **VS Code** ([docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)): project `.github/skills/` (Copilot); `.agents/skills/` and `.claude/skills/` (local harness); user `~/.copilot/skills/`, `~/.agents/skills/`, `~/.claude/skills/`; install: clone.
- **Kiro** ([docs](https://kiro.dev/docs/skills/)): project `.kiro/skills/`; user `~/.kiro/skills/` (IDE); install: Kiro panel → Import a skill → the URL of a skill folder, e.g. `.../tree/main/plugins/did-you-rtfm/skills/did-you-rtfm`.

The symlink farms are `.agents/skills/`, `.github/skills/` and `.kiro/skills/`; on Windows, check out with `core.symlinks=true` or copy the folders. The full list of agents that read the format is at [agentskills.io](https://agentskills.io/clients.md). The `all-help-no-harm` plugin additionally ships native integrations for Claude Code, Antigravity CLI (`agy`), Kiro CLI and app, and Antigravity IDE, indexed in [`plugins/all-help-no-harm/platforms/README.md`](plugins/all-help-no-harm/platforms/README.md), and a VS Code extension lives in [`vscode-extension/`](vscode-extension/).

## Repo layout

```
.
├── .claude-plugin/marketplace.json   # Claude Code marketplace manifest (every plugin below)
├── .agents/skills/                   # symlinks to every skill: Codex, Antigravity CLI (agy), Cursor, OpenCode, Copilot, VS Code
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

Plugins: all-help-no-harm, satori, skill-vv, steering-audit-suite, gnox, critical-control-points, did-you-rtfm, staleness-guard, informal-logic-check, bear-loads, pony, hidden-libel-check, spank-dario, open-and-honest-agent, agent-darktriad-check, log-session, cui-bono, python-elimination-program, word-lineage, ontology-lookup, inaudible-markup, og-social-image, update-readme-images, dont-be-hitler, goal-compliant-task-queue.

## Versions

Each plugin keeps its own version, and its patch number goes up when its content changes.
`VERSION` at the root is the marketplace's own version; its patch goes up with any plugin's.
`scripts/version-bump.js` compares each plugin folder's git tree hash with the one recorded in
`.VERSIONS.json`.

- A pre-commit hook bumps changed plugins in the commit itself, on main. Enable it once per
  clone: `git config core.hooksPath .githooks`
- `scripts/release.sh` makes a release. It bumps any plugin a commit made without the hook
  missed and bumps `VERSION`, tags `v<VERSION>`, and publishes the release to this GitHub
  repo as one snapshot commit. So a commit made without the hook still ships correct versions.

This GitHub repo carries releases only, and Claude Code installs from it. Report bugs and
request features in its Issues.

<!-- BEGIN: gnomatix-license-include -->
## License

**[Business Source License 1.1](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE)** (`BUSL-1.1`). The source is available, but this is not OSI open source.

**Commercial use is strictly prohibited without a paid commercial licensing / usage agreement with GNOMATIX.** Use by or for any government, government agency or charity is commercial use. Contact GNOMATIX first to arrange either of these:
- an ongoing support & development agreement
- a reasonable one-time usage fee, paid via [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

Both support continued development work on GNOMATIX projects. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms, including the Additional Use Grant, the Change Date and the Change License, are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
