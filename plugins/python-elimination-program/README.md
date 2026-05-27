# python-elimination-program

> A coordinated set of [Agent Skills](https://agentskills.io) plus a Claude Code firewall hook for projects where Python is not used.

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

## What this plugin does

For projects where the development environment doesn't use Python, this plugin enforces that decision against AI agents that would otherwise drift toward Python by default. Every consideration of Python is routed through three sequential gates before any Python is written:

1. **`whacking-day`** — surfaces the request to the user; requires explicit approval.
2. **`zartan`** — verifies no credible non-Python alternative exists in npm / crates.io / pkg.go.dev / native CLI / the project's existing stack; auto-rejects if one does.
3. **`jake-the-snake`** — executes the approved proposal under strict process discipline (planning doc, OOP, type hints, step-by-step approval, audit trail).

A fourth skill, **`old-willy`**, runs *orthogonal* to the gate chain rather than inside it. The three gates decide procedurally whether Python is written; `old-willy` decides whether the *reason claimed for writing it* is true. Whenever an agent emits "Python is the best tool for X," `old-willy` forces a per-task merit-rigor test against best-in-class alternatives with citations — and almost always returns that the underlying claim was not supportable. The actual reason for using Python is then named honestly (ecosystem mandate, team-skill contingency, or human-cognitive-load) instead of being laundered as "best tool."

The optional Claude Code firewall hook enforces all of this at the harness level by blocking Python-invoking shell commands unless an open authorization exists in `<project>/.claude/python-authorizations/log.jsonl`.

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
| [`old-willy`](skills/old-willy/SKILL.md) | The merit-rigor test, orthogonal to the gate chain. Activates whenever an agent emits — or relies on — a "Python is the best tool for X" claim. Forces per-task identification of the actual best-in-class candidate language/tool with authoritative citation, scores Python against it on the C3 criteria (correctness, performance, maintainability, deployability, security, portability, longevity, cost of operation), and disqualifies wins that reduce to ecosystem mandate, team-skill contingency, or "easier for human authors." Almost always returns that the "Python is best" claim was not supportable, forcing the actual reason for using Python (mandate / team / human-ease) to be named honestly instead of laundered as merit. |

## Install

### Claude Code (with the firewall hook)

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install python-elimination-program@gnomatix-oss-skills
```

This installs the four skills AND auto-registers the `PreToolUse` firewall hook (defined in [`hooks/hooks.json`](hooks/hooks.json)). Updates flow via `/plugin update`.

### Manual Claude Code install (skills only, no hook)

```sh
mkdir -p ~/.claude/skills
cp -r plugins/python-elimination-program/skills/* ~/.claude/skills/
```

To enable the firewall hook without using the plugin install path, see [`hooks/README.md`](hooks/README.md).

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers, or each CLI's documentation. Hooks are Claude-Code-specific and do not apply.

## How the gates interact

The three sequential gates control procedurally whether Python is written. `old-willy` runs orthogonally to the chain — it tests the *truthfulness of the rationale* being used to enter the chain in the first place.

```
                  ┌──────────────────────────────────┐
                  │  "Python is the best tool" claim │ ← old-willy fires
                  │  (or rationale for entering the  │   here, every time,
                  │   gate chain that rests on one)  │   independent of
                  └─────────────┬────────────────────┘   the gate state.
                                │
                  ┌─────────────▼────────────────────┐
                  │            OLD WILLY             │
                  │  (per-task merit-rigor test;     │
                  │  best-in-class identified with   │
                  │  citation; Python scored on the  │
                  │  C3 criteria against it; C4-C6   │
                  │  disqualifiers checked)          │
                  └─────────────┬────────────────────┘
                                │  honest finding recorded; if the rationale
                                │  was "Python is best," that claim is now
                                │  either supported by evidence or replaced
                                │  by the actual reason (C4 / C5 / C6).
                                ▼
       Python mention/proposal still under consideration
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
                  │   research; uses old-willy's
                  │   per-criterion framework)
                  └───────┬────────┘
                          │ no credible alternative; cleared
                          ▼
                  ┌────────────────┐
                  │ jake-the-snake │  ← executes under the proposal,
                  │   (executor)   │    OOP + docs + type hints,
                  └────────────────┘    step-by-step approval, audit log
```

Authorization records (and proposals) live at `<project>/.claude/python-authorizations/`. Append-only JSONL plus per-authorization markdown proposal files. `old-willy` findings, when produced in support of an authorization, are recorded alongside as comparative-rigor evidence so the proposal's stated reason for Python use survives later audit.

## Layout

```
plugins/python-elimination-program/
├── .claude-plugin/
│   └── plugin.json           # plugin manifest (Claude Code)
├── README.md                 # this file
├── skills/                   # cross-CLI Agent Skills
│   ├── whacking-day/SKILL.md
│   ├── zartan/SKILL.md
│   ├── jake-the-snake/SKILL.md
│   └── old-willy/SKILL.md
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
- **Old Willy** — Stanley Lee Wilson (1939–2018), high-school math, physics, and computer science teacher in St. Catharines, Ontario. Dropped out of his PhD program at MIT after his thesis project was scooped — a principled exit on integrity grounds, not a failure of capability. Earlier turned down an NHL goaltending career with the Chicago Blackhawks to attend university; played with Stan Mikita on the Blackhawks' St. Catharines farm team before walking away. Spent his working life teaching the rigorous, defensible answer to teenagers who would otherwise have settled for the popular one. The `old-willy` skill is named for him because it does what he did — refuses to let "what everybody picks" stand in for "what the analysis actually supports."

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
