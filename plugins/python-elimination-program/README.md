# python-elimination-program

> A coordinated set of [Agent Skills](https://agentskills.io) plus a Claude Code firewall hook that prevent AI agents from defaulting to Python in projects where Python is a liability. Three gates — proposal → research → execution — and a `PreToolUse` hook for harness-level enforcement on Claude Code.

For experienced developers who already know Python is the wrong default for most modern application work and would rather not argue with their tools about it on every prompt.

## Skills

| Skill | Role |
|---|---|
| [`whacking-day`](skills/whacking-day/SKILL.md) | Detects Python proposals/mentions; forces a justification + user-approval gate; logs the authorization to `.claude/python-authorizations/log.jsonl` along with a proposal file. |
| [`zartan`](skills/zartan/SKILL.md) | The objective second gate. Researches whether credible non-Python alternatives exist (npm, crates.io, pkg.go.dev, native CLI, project's existing stack). Auto-rejects if any are found, regardless of prior approval. |
| [`jake-the-snake`](skills/jake-the-snake/SKILL.md) | Executes Python only after both gates have cleared. Enforces strict process: planning doc, full OOP, complete docstrings, type hints, step-by-step user approval, no scope creep. |

## Why

Python's well-known performance and maintainability problems make it a poor default for most modern web/application work. This plugin codifies that judgment as a procedural firewall: any agent considering Python in your codebase must surface the proposal, defend the choice, allow an objective second gate to verify no non-Python alternative exists, and then operate under tight bounds with full audit trail.

The plugin does not prohibit Python outright. It makes using it expensive enough that it only happens when it actually has to.

## Install

### Claude Code (with the firewall hook, recommended)

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install python-elimination-program@gnomatix-oss-skills
```

This installs the three skills AND auto-registers the `PreToolUse` firewall hook (defined in [`hooks/hooks.json`](hooks/hooks.json)). Updates flow via `/plugin update`.

### Manual Claude Code install (skills only, no hook)

```sh
mkdir -p ~/.claude/skills
cp -r plugins/python-elimination-program/skills/* ~/.claude/skills/
```

To enable the firewall hook without using the plugin install path, see [`hooks/README.md`](hooks/README.md).

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers, or each CLI's documentation. Hooks are Claude-Code-specific and do not apply.

## How the three gates interact

```
Python mention/proposal detected
            │
            ▼
   ┌────────────────┐    user declines    ┌──────────┐
   │  whacking-day  │────────────────────▶│  denied  │
   │  (gate 1: user │                     └──────────┘
   │   approval)    │
   └───────┬────────┘
           │ user approves
           │ proposal + log entry written
           ▼
   ┌────────────────┐  alternative found  ┌──────────┐
   │     zartan     │────────────────────▶│ revoked  │
   │  (gate 2:      │                     └──────────┘
   │   research)    │
   └───────┬────────┘
           │ no credible alternative; cleared
           ▼
   ┌────────────────┐
   │ jake-the-snake │  ← executes under the proposal,
   │   (executor)   │    OOP + docs + type hints,
   └────────────────┘    step-by-step approval, audit log
```

Authorization records (and proposals) live at `<project>/.claude/python-authorizations/`. The records are append-only JSONL plus per-authorization markdown proposal files — designed to be readable by humans, by the skills, and by the firewall hook.

## Layout

```
plugins/python-elimination-program/
├── .claude-plugin/
│   └── plugin.json           # plugin manifest (Claude Code)
├── README.md                 # this file
├── skills/                   # cross-CLI Agent Skills
│   ├── whacking-day/SKILL.md
│   ├── zartan/SKILL.md
│   └── jake-the-snake/SKILL.md
└── hooks/                    # Claude-Code-only firewall
    ├── hooks.json
    ├── whacking-day-firewall.js
    ├── settings.example.jsonc
    └── README.md
```

## Credits

Naming references:
- **Whacking Day** — *The Simpsons* (S4E20, 1993).
- **Saint Patrick** — patron of cast-out serpents.
- **Florida Fish & Wildlife Conservation Commission**, **Florida Department of Environmental Protection**, and the **South Florida Water Management District's [Python Elimination Program](https://www.sfwmd.gov/our-work/python-program)** — for the actual ongoing fight against the python in the Everglades.
- **Zartan** — master of disguise; killer of Serpentor in *G.I. Joe: A Real American Hero* #76 ("All's Fair", September 1988, Marvel, Larry Hama); joined the *Snake Hunt* arc (#266–275, IDW) to recover Snake-Eyes from Cobra; lairs in the Florida Everglades.
- **Jake "The Snake" Roberts** — professional wrestler, kept a python.

## License

(Add a LICENSE file, or inherit from the parent repo's LICENSE.)
