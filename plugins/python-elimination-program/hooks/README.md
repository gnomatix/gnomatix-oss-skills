# Claude Code firewall hook

Hooks are not part of the cross-CLI [Agent Skills](https://agentskills.io) standard. This directory contains the Claude-Code-specific harness-level enforcement that complements the three skills.

## What it does

`whacking-day-firewall.js` runs as a `PreToolUse` hook on every `Bash` and `PowerShell` tool call. If the command invokes Python (`python`, `python3`, `pip`, `pipx`, `uv`, `poetry`, `conda`, `*.py`, etc.) and the current project has no open authorization at `.claude/python-authorizations/log.jsonl` (status `approved` or `in-progress`), the hook **denies the tool call** with a message routing the agent back to the `whacking-day` skill.

This is enforcement at the harness level — independent of the skills' procedural checks. Even if an agent ignored its skill instructions, the hook still refuses Python.

## Activation

### Plugin install (automatic)

When the plugin is installed via Claude Code's marketplace mechanism, [`hooks.json`](hooks.json) auto-registers the hook. The `${CLAUDE_PLUGIN_ROOT}` placeholder resolves to the plugin's installation directory, so the hook runs from wherever Claude Code put the plugin.

No manual settings edit is needed.

### Manual install (no plugin)

If installing skills manually rather than via plugin, wire the hook by hand:

1. Copy the script:
   ```sh
   mkdir -p ~/.claude/hooks
   cp whacking-day-firewall.js ~/.claude/hooks/
   ```

2. Open [`settings.example.jsonc`](settings.example.jsonc) and merge its `hooks` block into either:
   - `~/.claude/settings.json` — applies in every project
   - `<your-project>/.claude/settings.local.json` — applies only in that project

## Requirements

- **Node.js** (no npm dependencies; uses only `fs` and `path` from the standard library)

## How authorization records work

The skills (`whacking-day`, `zartan`, `jake-the-snake`) author and consume entries in `<project>/.claude/python-authorizations/log.jsonl` and proposal files under `<project>/.claude/python-authorizations/proposals/<id>.md`. The hook reads `log.jsonl` to decide whether to allow Python invocations.

The hook only checks the *latest* status per authorization id, so a normal lifecycle (`approved` → `in-progress` → `completed`) lets Python through during `approved` and `in-progress` phases and blocks again once `completed` or `revoked`.

## What the hook does NOT do

- Does not author or modify authorizations — only reads them.
- Does not log denied attempts (today).
- Does not block writes to `.py` source files, only execution. The skills handle source-creation discipline; the hook is the runtime gate.

## Bypassing

There is no built-in bypass. Two intentional paths:

1. **Use the skills.** Run `whacking-day` to author a proposal; `zartan` to clear it; then Python invocations will pass.
2. **Disable the hook.** Remove the `hooks` block from your settings file or uninstall the plugin. Visible, deliberate, and recorded in source control.
