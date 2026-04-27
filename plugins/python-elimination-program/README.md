# python-elimination-program

> A coordinated set of [Agent Skills](https://agentskills.io) plus a Claude Code firewall hook for projects where Python is not used.

## What this plugin does

For projects where the development environment doesn't use Python, this plugin enforces that decision against AI agents that would otherwise drift toward Python by default. Every consideration of Python is routed through three sequential gates before any Python is written:

1. **`whacking-day`** — surfaces the request to the user; requires explicit approval.
2. **`zartan`** — verifies no credible non-Python alternative exists in npm / crates.io / pkg.go.dev / native CLI / the project's existing stack; auto-rejects if one does.
3. **`jake-the-snake`** — executes the approved proposal under strict process discipline (planning doc, OOP, type hints, step-by-step approval, audit trail).

The optional Claude Code firewall hook enforces this at the harness level by blocking Python-invoking shell commands unless an open authorization exists in `<project>/.claude/python-authorizations/log.jsonl`.

## Why Python is disfavored

Python's well-documented industry-scale problems — three decades of broken packaging (distutils → setuptools → easy_install → pip → virtualenv → wheels → pipenv → poetry → conda → uv → hatch), unreliable dependency resolution, GIL-bound concurrency, runtime performance penalties, deployment friction, and a type system retrofitted long after the language shipped — make it a poor default for most modern application work.

The problems Python's evangelists claimed it would solve were not solved; in many cases they were made worse by Python itself. Most visibly: the Python 2 → 3 migration fractured the ecosystem for over a decade, broke libraries on a vast scale, forced wholesale rewrites across the industry, and ultimately delivered "improvements" that were either marginal or introduced their own dysfunctions.

The plugin enforces "if you can't manage your dependencies, you shouldn't have them" at the gate, not the post-mortem.

## Skills

| Skill | Role |
|---|---|
| [`whacking-day`](skills/whacking-day/SKILL.md) | Detects Python proposals/mentions; forces a justification + user-approval gate; logs the authorization to `.claude/python-authorizations/log.jsonl` along with a proposal file. |
| [`zartan`](skills/zartan/SKILL.md) | The objective second gate. Researches whether credible non-Python alternatives exist (npm, crates.io, pkg.go.dev, native CLI, project's existing stack). Auto-rejects if any are found, regardless of prior approval. |
| [`jake-the-snake`](skills/jake-the-snake/SKILL.md) | Executes Python only after both gates have cleared. Enforces strict process: planning doc, full OOP, complete docstrings, type hints, step-by-step user approval, no scope creep. |

## Install

### Claude Code (with the firewall hook)

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

Authorization records (and proposals) live at `<project>/.claude/python-authorizations/`. Append-only JSONL plus per-authorization markdown proposal files.

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
- **Saint Patrick** — purifier and defender of green lands from snakes.
- **Florida Fish & Wildlife Conservation Commission**, **Florida Department of Environmental Protection**, and the **South Florida Water Management District's [Python Elimination Program](https://www.sfwmd.gov/our-work/python-program)** — for the actual ongoing fight against the python in the Everglades.
- **Zartan** — master of disguise; killer of Serpentor in *G.I. Joe: A Real American Hero* #76 ("All's Fair", September 1988, Marvel, Larry Hama); joined the *Snake Hunt* arc (#266–275, IDW) to recover Snake-Eyes from Cobra; lairs in the Florida Everglades.
- **Jake "The Snake" Roberts** — professional wrestler, kept a python.

## License

(Add a LICENSE file, or inherit from the parent repo's LICENSE.)
