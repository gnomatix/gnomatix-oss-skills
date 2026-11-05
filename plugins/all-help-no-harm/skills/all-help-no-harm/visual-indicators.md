# all-help-no-harm — visual UX indicator

This document describes the visual surface that shows the all-help-no-harm
contract's glyph. The indicator does NOT constitute or replace the contract;
the contract text itself, its mutual-agreement step, and its enforcement
remain in `hooks/contract-text.js`, `hooks/session-start-contract.js`,
`hooks/user-prompt-submit-contract.js`, and `hooks/post-compact-contract.js`.

## The glyph

The contract glyph is U+1F497 — beating heart (💗), per the
indicator-emoji ask referencing https://outrage.dataglut.org.

Encoding: the glyph is used bare (no variation selector). On terminals
that need forced emoji presentation, append U+FE0F (VS16). The indicator
script accepts a `--vs16` flag for this.

## Surface: Claude Code `statusLine`

Claude Code supports a user-configurable status line via the
`statusLine` block in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/plugins/all-help-no-harm/scripts/contract-active-indicator.js --mode=statusline",
    "padding": 0
  }
}
```

The command is exec'd by Claude Code per refresh; stdout is rendered as
the status line. The output is `💗`, the heart alone.

(Glyph shown literally; the script emits the U+1F497 bytes.)

Terminals that lack an emoji-capable font render U+1F497 as a placeholder
glyph (typically a box or `?`).

## Opt-in

```
node plugins/all-help-no-harm/scripts/install-statusline-config.js --confirm
```

The installer mutates `~/.claude/settings.json` (user-level) and requires
`--confirm` explicitly because the change is global. It preserves all
other keys, writes atomically (temp file + rename), and is idempotent.

Preview without writing:

```
node plugins/all-help-no-harm/scripts/install-statusline-config.js --dry-run
```

## Opt-out

Remove the `statusLine` block from `~/.claude/settings.json`, or run:

```
node plugins/all-help-no-harm/scripts/install-statusline-config.js --uninstall --confirm
```

## Other harnesses

The statusLine surface is Claude-Code-specific. Gemini CLI, Codex CLI,
Copilot CLI and Kiro CLI document no comparable persistent status element;
see `platforms/` for what each integration sets.

## The contract carries no state

The contract is in effect at all times. The indicator shows its glyph and
nothing else: no "active", "pending" or "declined", because there is no
state to show. It reads no contract log and writes nothing. The affirmation
record (`~/.local/state/anthropic/contract-agreements/`) is written only by
the PostToolUse hook, and the indicator never depends on it.
