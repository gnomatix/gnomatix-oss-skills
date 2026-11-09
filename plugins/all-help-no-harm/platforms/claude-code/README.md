# GNOMATIX visual integration — Claude Code (CLI)

**Status:** reference implementation. Already wired through
`plugins/all-help-no-harm/scripts/contract-active-indicator.js` +
`plugins/all-help-no-harm/scripts/install-statusline-config.js`.

This directory exists to document the integration as the reference template
that other platform sub-directories under `platforms/` model themselves on.

## Visual surfaces Claude Code exposes

| Surface | Mechanism | Doc URL |
|---|---|---|
| Status line (bottom of TUI) | `statusLine.command` in `~/.claude/settings.json` — script's stdout becomes the rendered line | https://docs.claude.com/en/docs/claude-code/statusline |
| Terminal window title | OSC 0 escape sequence `ESC ] 0 ; <text> BEL` emitted from any hook script that writes to stdout/stderr or from `statusLine` itself | terminal-emulator-level convention (xterm OSC) |
| Tray / dock / menubar | none — Claude Code is a TUI and exposes no native window-chrome surface | n/a |

## GNOMATIX integration enabled here

- **Status line:** `💗` (U+1F497 beating heart) in front of the user's own
  status line, which is kept. The installer saves the user's `statusLine` and
  sets the command to `node scripts/contract-active-indicator.js --mode=prefix;
  <the user's command>`. With no status line of the user's, the heart alone
  (`--mode=statusline`). One state only: no "pending" or "declined" text.
  Optional VS16 (`--vs16`) for force-emoji-presentation terminals.

## When it is enabled

Automatically, after the user answers "I Affirm": the PostToolUse hook
`hooks/posttooluse-contract-affirmation-record.js` runs the installer. It does
nothing if the heart is already there. To run it by hand:

```sh
node plugins/all-help-no-harm/scripts/install-statusline-config.js --confirm
```

## How to disable

Restores the user's own status line exactly as it was saved:

```sh
node plugins/all-help-no-harm/scripts/install-statusline-config.js --uninstall --confirm
```

## Files in this directory

- `README.md` — this document. Reference-only; no scripts ship here because
  the integration's source of truth lives at
  `plugins/all-help-no-harm/scripts/`.
