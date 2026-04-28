# Claude Code firewall hooks

Hooks are not part of the cross-CLI [Agent Skills](https://agentskills.io) standard. This directory contains the Claude-Code-specific harness-level enforcement layer for the `did-you-rtfm` skill.

## What's here

### `did-you-rtfm-stop.js` — `Stop` / `SubagentStop` hook

After the agent finishes a turn, scans the assistant's just-completed text for high-precision pivot-language phrases. If matched, blocks the stop and routes the agent back into the skill discipline.

**Pattern set** (precision-tuned against ~62k lines of real assistant text on the project owner's machine; see [`../README.md`](../README.md) for the corpus and counts):

- `doesn't (appear to / seem to) (support / have / provide / expose)` — the phantom-blocker shape
- `falling back to` / `falls back to`
- `as a workaround` (the explicit form; bare `workaround` is intentionally omitted because sample inspection showed it predominantly fires on meta-discussion of past pivots)
- `let me pivot`
- `not the right (tool / approach / library / framework)`
- `(let me / I'll) (catch / wrap / swallow / silence)` — exception-swallowing shape

**Behaviour:** if any pattern matches, the hook returns `{decision:"block", reason: …}` with a structured reminder routing the agent into the version-check / RTFM / verify / minimal-repro discipline. Claude Code injects the reason as additional context for the next turn rather than letting the agent stop.

**Anti-recursion:** the hook checks `payload.stop_hook_active` and passes through if its own previous block-decision triggered the current Stop event.

### `did-you-rtfm-bypass.js` — `PreToolUse` hook on Bash / PowerShell

Before tool invocation, denies commands that contain bypass-flag or signal-suppression shapes — patterns whose effect is to silence the signal a real failure produced rather than to address its cause.

**Pattern set:**

| Shape | Match | Why |
|---|---|---|
| Bypass flags | `--no-verify`, `--force`, `--skip-*`, `--allow-*`, `--ignore-*` | Suppress signal of a real failure; their role is to override checks the user normally wants enforced. |
| `script(1)` TTY-faking | `script -qc`, `script -c`, `script -q` | Almost never legitimate when emitted by an agent — typically a workaround for not finding the proper non-interactive flag of an interactive tool. |
| `expect(1)` automation | `expect -c`, `expect -f`, `expect <<…` | Similar shape; agent reaches for `expect` instead of reading docs to find the proper non-interactive flag. |
| Password piping into sudo | `echo … \| sudo -S` | Bypasses interactive password prompt; rarely correct in agent code. |
| `unbuffer` / `stdbuf` TTY workarounds | `unbuffer -…`, `stdbuf -…` | Same agent failure pattern — masking output buffering / TTY-detection issues rather than addressing them. |

**Behaviour:** if any pattern matches, the hook returns `permissionDecision:"deny"` with a routing message. The user can authorize the bypass explicitly (and then re-run the command) — the hook never overrides explicit user authorization.

### Patterns intentionally NOT enforced

The following shapes are *known* agent-workaround patterns observed in the wild but are excluded from enforcement because their false-positive rate would be too high in agent-driven scripting:

- `2>/dev/null` — legitimate noise suppression in many scripts; cannot reliably distinguish from "agent is silencing an error to dodge it" without more context than this hook has.
- bare `< /dev/null` — often correct for non-interactive invocation; only suspicious when paired with specific interactive tools, which is hard to enforce generically.
- `yes |` — sometimes a legitimate auto-confirm; sometimes a workaround for missing `--yes` flag.
- `/dev/tty` direct opens — rare enough that hard-coded matching has high false-positive cost vs. value.

These are documented here for transparency. If the project owner observes a high rate of any of these in agent failure modes, they can be added to a future revision of the bypass hook.

## Activation

### Plugin install (automatic)

When the plugin is installed via Claude Code's marketplace mechanism, [`hooks.json`](hooks.json) auto-registers the hooks. The `${CLAUDE_PLUGIN_ROOT}` placeholder resolves to the plugin's installation directory.

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install did-you-rtfm@gnomatix-oss-skills
```

### Manual install (no plugin)

1. Copy the hook scripts:

   ```sh
   mkdir -p ~/.claude/hooks
   cp did-you-rtfm-stop.js did-you-rtfm-bypass.js ~/.claude/hooks/
   ```

2. Open [`settings.example.jsonc`](settings.example.jsonc) and merge its `hooks` block into either:
   - `~/.claude/settings.json` — applies in every project
   - `<your-project>/.claude/settings.local.json` — applies only in that project

## Requirements

- **Node.js** (no npm dependencies — uses only `fs` from the standard library)

## Disabling

Remove the `hooks` block from your settings file or uninstall the plugin.

## Notes on calibration

The pivot-language pattern set was tuned against the project owner's own transcripts. Other users' agent-failure-language profiles will overlap but not match exactly. The `Stop` hook errs toward conservative recall — it won't fire on every conceivable pivot, but the patterns it does fire on were verified to be near-100% enactments of the failure mode rather than meta-discussion in the calibration corpus. Tuning for a different user means re-running the methodology in `dev/failure-mode-investigation/` (private — author's encrypted dev directory) and updating the regex set.
