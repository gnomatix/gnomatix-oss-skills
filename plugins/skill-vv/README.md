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

## Requirements

- `node`: `mise use -g node@lts`
- `js-yaml`: `mise use -g npm:js-yaml@4.1.0`

## Tests

```
node --test plugins/skill-vv/test/skill-vv.test.js
```

## TODO

- **Verification and validation on every claimed platform.** Run the `cli-suite` and `check-in-session` procedures in `VV.md` on each platform it claims, and record the results:
  - `claude-code`: `win32`, `linux-wsl` on the `agent-sandbox` distro, `linux`, `darwin`
  - `win32` on `gemini-cli`, `antigravity`, `codex` and `kiro`
- **Wire the check into the other vendors.** Add a line to each vendor's instruction file (`AGENTS.md`, `GEMINI.md`, the Kiro and Antigravity rules) that runs `skill-vv check` at session start. Claude Code is the only one with a hook.
- **Add `VV.md` to the other plugins** in this marketplace, starting with all-help-no-harm. Its requirements are `node`, `dotenvx`, `bash` for context-watch, and the optional `ANTHROPIC_CONTRACT_LOG_KEY`.
