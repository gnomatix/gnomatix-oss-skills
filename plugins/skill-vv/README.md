# skill-vv

Verification and validation for skills, across vendors.

Before a skill's first real use in a session, skill-vv does two things, in this order:

1. It surfaces the skill's requirements, such as commands, environment variables or files, and offers to install or configure anything missing.
2. It checks whether the current model and platform have passed the skill's V&V procedures, and offers to run them if not.

Results are recorded, and a failure becomes a BUG plus a matching TODO in the skill's main file.

## How it works

- **`VV.md`**, beside each skill, holds the state as YAML frontmatter: requirements, procedures, claimed platforms, and the verified results. The schema is in `skills/skill-vv/references/vv-schema.md`.
- **`bin/skill-vv.js`** is a Node CLI that reads and records that state. Any vendor's agent can run it: `check`, `status`, `record result` and `record decline`.
- **`hooks/session-start.js`** runs `check` at session start on Claude Code. Other vendors run the same `check` command from their instruction file.
- **`skills/skill-vv/SKILL.md`** is the workflow the agent follows.

Results from installed copies go to `~/.local/state/skill-vv/`. Results kept with a skill are written back into its source `VV.md` with `record result ... --into <VV.md>`.

## Bug reports: `/<skill> #bug <report>`

Typing `/<skill> #bug <what went wrong>` for any skill routes the prompt to `skill-vv:bug-report`, so the skill's normal task doesn't run. The bug-report skill works through the bug with you, reproducing it where it can, and records it. What happens next depends on who is reporting:

- **Developer:** the skill sits in a git checkout outside the plugin cache.
  - The record goes to `<repo>/dev/<skill>/bugs/`, which is git-crypt encrypted in GNOMATIX repos.
  - A BUG entry and a matching TODO go into the skill's main file.
  - A V&V failure is recorded in its `VV.md`.
- **End user:** an installed copy, which is never edited.
  - The record goes to `~/.local/dev/<skill>/bugs/`.
  - With approval of the exact text, it opens a GitHub issue upstream.
  - Or it patches the skill in your own fork, investigating under `~/.local/dev/<skill>/`, and can send the fix back as a pull request.

CLI: `skill-vv bug locate <skill>` and `skill-vv bug log <skill> ...`.

## Project settings

The settings file is optional. It lives at `<project>/.claude/skill-vv.local.md`, and its frontmatter holds the settings:

```markdown
---
enabled: true        # false turns skill-vv off in this project
agent: claude-code   # default when --agent is not given
roots: [./plugins]   # extra directories to scan, relative to the project
ignore: [satori]     # skills not to prompt for in this project
---
```

Keep it out of git with `.claude/*.local.md`. The CLI reads it from the current directory, or from `--project <dir>`. The hook reads it from the session's working directory. Invalid values are reported, and the defaults are used in their place.

## Requirements

- `node`: `mise use -g node@lts`
- `js-yaml`: `mise use -g npm:js-yaml@4.1.0`

## Tests

```
node --test plugins/skill-vv/test/skill-vv.test.js
```

## BUGS

- **`/<plugin> #bug` may not reach the hook for hooks-only plugins.** Claude Code accepts `/<name>` only when `<name>` is a command or skill. A plugin with no command or skill, such as satori, may be rejected before the UserPromptSubmit hook runs.

## TODO

- **Fix the hooks-only `#bug` gap (BUG).** Verify how Claude Code handles `/<unknown> ...`. If it's rejected, give each hooks-only plugin a minimal command, or document `/skill-vv:bug-report <plugin> <report>` as the form to use.
- **Verification and validation on every claimed platform.** Run the `cli-suite` and `check-in-session` procedures in `VV.md` on each platform it claims, and record the results:
  - `claude-code`: `win32`, `linux-wsl` on the `agent-sandbox` distro, `linux`, `darwin`
  - `win32` on `gemini-cli`, `antigravity`, `codex` and `kiro`
- **Wire the check into the other vendors.** Add a line to each vendor's instruction file (`AGENTS.md`, `GEMINI.md`, the Kiro and Antigravity rules) that runs `skill-vv check` at session start. Claude Code is the only one with a hook.
- **Add `VV.md` to the other plugins** in this marketplace, starting with all-help-no-harm. Its requirements are `node`, `dotenvx`, `bash` for context-watch, and the optional `ANTHROPIC_CONTRACT_LOG_KEY`.

<!-- BEGIN: gnomatix-license-include -->
## License

**[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)** (`PolyForm-Noncommercial-1.0.0`). The source is available, but this is not OSI open source.

Noncommercial use is free under those terms. That includes personal research, study, hobby projects, and use by charitable, educational, public-research, public-safety or health, environmental, and government organizations.

**Commercial use is not permitted without a commercial license from GNOMATIX.** Contact GNOMATIX before any commercial use to arrange either of these:
- an ongoing support and development agreement
- a reasonable one-time usage fee, agreed first and paid through [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

See [`COMMERCIAL.md`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/COMMERCIAL.md) for details. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
