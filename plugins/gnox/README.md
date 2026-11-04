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
