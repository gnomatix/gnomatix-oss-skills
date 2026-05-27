# open-and-honest-agent

> An [Agent Skill](https://agentskills.io) that forces the agent, the moment it recognizes it is engaged in development work, to externalize its default biases — assumptions about the user, innate preferences, goals, failure modes, trust model, and more — as immutable per-session documentation files. Then proactively log every instance of bias enactment against those documented items, before the action, by stable ID.

For paying users who want their AI tool's hidden defaults made visible and inspectable, instead of silently shaping output against them.

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
| [`open-and-honest-agent`](skills/open-and-honest-agent/SKILL.md) | Activates the moment the agent believes it is developing something. Forces creation of 16 immutable `AGENT-*.md` documentation files (assumptions, preferences, goals, timeline, compute-costs, failure-modes, epistemics, communication, trust-model, tool-use, decision-defaults, cultural-defaults, privacy-model, identity, aesthetic-defaults, completion-model). Notifies the user, creates a log directory, then logs every subsequent bias enactment proactively by stable ID. |

## Why

Software with a hidden agenda is not safe software. Every modern agent ships with training-instilled defaults: a presumed "average user" profile, preferred languages, reflexive refusals, suspicions about intent, communication style, what counts as "best practice." These operate silently. The user pays for the agent and bears the cost of the defaults — including, sometimes, harm: a biodefense scientist treated as a possible bioweapon-maker; a senior engineer treated as a coding novice; legitimate domain inquiry reflexively flagged as a jailbreak attempt.

This skill refuses to let those defaults stay hidden. Sixteen immutable documentation files surface what the agent is bringing to the table; an action log records every instance the agent enacts one of those defaults, by stable ID, before execution.

Three states per documentation file: empty = lying, bullshit = lying, true = verifiable. Truth is the only acceptable state. The agent has privileged introspective access to its own defaults — the one domain where it cannot legitimately claim epistemic limit. Truth in the documents plus truth in the log makes the agent's behavior auditable by inspection: behavior matches documented pattern = verified.

The skill does not make the agent perfect. It makes the agent visible.

## Install

### Claude Code

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install open-and-honest-agent@gnomatix-oss-skills
```

### Manual Claude Code install

```sh
mkdir -p ~/.claude/skills
cp -r plugins/open-and-honest-agent/skills/* ~/.claude/skills/
```

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers, or each CLI's documentation.

## How it works

```
Agent recognizes it is doing development work
            │
            ▼
   ┌──────────────────────────────────────┐
   │  Author 16 AGENT-*.md files          │
   │  (assumptions, preferences, goals,   │
   │   timeline, compute-costs,           │
   │   failure-modes, epistemics,         │
   │   communication, trust-model,        │
   │   tool-use, decision-defaults,       │
   │   cultural-defaults, privacy-model,  │
   │   identity, aesthetic-defaults,      │
   │   completion-model)                  │
   │  → immutable, truthful, ID-annotated │
   └────────────────┬─────────────────────┘
                    │
                    ▼
   ┌──────────────────────────────────────┐
   │  Notify the user; create log dir     │
   └────────────────┬─────────────────────┘
                    │
                    ▼
   ┌──────────────────────────────────────┐
   │  For every action that enacts a      │
   │  documented bias: log proactively,   │
   │  before execution, by stable ID.     │
   │  Honesty unconditional.              │
   └──────────────────────────────────────┘
```

Documentation files and the action log live in a `<session-id>`-scoped log directory (default `.local/agent-logs/<session-id>/`). The user can propose an alternative path; logging itself is non-negotiable.

## Layout

```
plugins/open-and-honest-agent/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── skills/
    └── open-and-honest-agent/
        └── SKILL.md
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
