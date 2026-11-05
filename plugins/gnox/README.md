# gnox

One namespace for every skill in the gnomatix-oss-skills marketplace. Type `/gnox:` to
see them all.

| Command | Runs |
|---|---|
| `/gnox:<plugin>` | the plugin's main skill, the one named like the plugin (for example `/gnox:hidden-libel-check`); for a plugin without one, a list of its commands |
| `/gnox:<plugin>:<skill>` | any other skill of the plugin (for example `/gnox:python-elimination-program:zartan`) |
| `/gnox:<plugin>:<group>:<cmd>` | the plugin's own sub-command `/<plugin>:<group>:<cmd>`, from its `commands/<group>/<cmd>.md`, at any depth |

Each command hands its arguments to the plugin's own skill, so the plugin has to be
installed too. The plugins' own commands (`/<plugin>:<skill>`) keep working.

## Install

```
/plugin install gnox@gnomatix-oss-skills
/plugin install hidden-libel-check@gnomatix-oss-skills
```

Install `gnox` once, plus each plugin you want; each plugin still installs on its own.

## The mise MCP server

Installing `gnox` also registers mise's MCP server (`.mcp.json`): Claude Code starts
`mise --cd <project> mcp`, so the model can read the project's mise tools, tasks and config.
Its tools show up as `mcp__plugin_gnox_mise__*`. It runs in safe mode (`MISE_SAFE=1`): the
environment resource returns no real values, so no secrets reach the model, and `run_task`
refuses to run. `install_tool` still works for trusted projects (`mise trust`).

It needs `mise` on PATH. skill-vv checks for it (this plugin's `VV.md`) and offers the install,
which uses the marketplace's standard scripts in `deps/`:

```
curl -fsSL https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.ps1 | iex"
```

Both stop if mise is already installed, and ask before adding another copy.

## Naming convention

Claude Code builds every command from the plugin name first: a skill is
`/<plugin>:<skill>`, and a file `commands/<dir>/<name>.md` is `/<plugin>:<dir>:<name>`.
There is no alias or shared-prefix setting, and the marketplace name never appears in a
command (only in install ids, `<plugin>@gnomatix-oss-skills`). The `gnox` plugin is how
the marketplace gets one prefix: its commands are generated as
`/gnox:<plugin>[:<skill>]`.

Rules for every plugin in this marketplace, so the generated names stay regular:

- Plugin names: lowercase kebab-case (letters, digits, `-`). No `:`, `@`, spaces or path
  separators (Claude Code refuses them), and none of Claude Code's reserved names or
  prefixes (`claude-`, `anthropic-`, `cc-plugin-` and the rest).
- A plugin's main skill takes the plugin's own name, so `/gnox:<plugin>` runs it.
- Every other skill gets a short lowercase kebab-case name, unique within its plugin; it
  becomes `/gnox:<plugin>:<skill>`.
- A plugin with sub-commands routes them itself: `commands/<group>/<cmd>.md` is its own
  `/<plugin>:<group>:<cmd>`, and gnox mirrors it as `/gnox:<plugin>:<group>:<cmd>`.
  Group and command file names are lowercase kebab-case; a skill and a command don't
  share a name (if they do, the gnox command goes to the skill).
- Names never contain `:`; the colon is only the separator Claude Code adds.

## Keeping it current

The commands are generated from `.claude-plugin/marketplace.json`, each plugin's
`skills/<skill>/SKILL.md` (its `name` and the first sentence of its `description`) and
each plugin's `commands/**/*.md`:

```
node plugins/gnox/scripts/build-commands.js           # write plugins/gnox/commands/
node plugins/gnox/scripts/build-commands.js --check   # exit 1 if anything is out of date
```

Run it after adding, renaming or removing a plugin or a skill. A file under `commands/`
without the generated marker is left alone.

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
