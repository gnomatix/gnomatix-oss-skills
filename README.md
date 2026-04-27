# gnomatix-oss-skills

!["Kids, if somebody offers you VENVS… Just say NO."](assets/images/pep-banner.png "If you can't manage your dependencies, you shouldn't have them."")

A collection of [Agent Skills](https://agentskills.io) and Claude Code plugins from GNOMATIX. This repo doubles as a Claude Code marketplace, so a single `/plugin marketplace add` covers every plugin housed here.

## Plugins

| Plugin                                                                                          | Description                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`python-elimination-program`](plugins/python-elimination-program/) | Three coordinated skills + `PreToolUse` firewall hook that prevent AI agents from defaulting to Python in projects where Python is a liability.                                                                                                                       |
| [`open-and-honest-agent`](plugins/open-and-honest-agent/)                                       | Agent Skill that forces the agent to externalize its default biases (assumptions, preferences, goals, failure modes, trust model, etc.) as immutable per-session documentation, and log every bias enactment against those documented items proactively by stable ID. |

Future plugins drop in as siblings under `plugins/`. Each plugin is self-contained — its own manifest, skills, hooks, and README — so plugins can be lifted into their own repos later without surgery.

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
│   └── marketplace.json          # marketplace manifest (lists all plugins below)
├── README.md
├── .gitignore
└── plugins/                      # one self-contained subdir per plugin
    └── python-elimination-program/
        ├── .claude-plugin/
        │   └── plugin.json
        ├── README.md
        ├── skills/                # cross-CLI Agent Skills
        │   └── <skill-name>/SKILL.md
        └── hooks/                 # Claude-Code-only
            ├── hooks.json
            ├── whacking-day-firewall.js
            ├── settings.example.jsonc
            └── README.md
```

## Adding a new plugin

1. Create a new subdirectory under `plugins/<plugin-name>/` with the standard layout (`.claude-plugin/plugin.json`, `skills/`, optional `hooks/`, `README.md`).
2. Add an entry to `plugins[]` in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) with `source: "./plugins/<plugin-name>"`.

No file collisions with existing plugins; each plugin's `skills/` and `hooks/` are scoped to its own directory.

## 📝 License

Each plugin includes (or should include) its own `LICENSE` file. A repo-wide `LICENSE` may also live at the root if all plugins share licensing.

![GNOMATIX "TEAM"](assets/images/gnomatix-killbots-activate-xs.png)
![GNOMATIX LOGO](assets/images/gnomatix-new-xs.png "GNOMATIX")
