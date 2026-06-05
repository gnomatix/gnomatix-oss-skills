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

- **Brand glyph:** U+1F9EC DNA double helix (💗), prefixed to every status-line
  render. Optional VS16 (`--vs16`) for force-emoji-presentation terminals.
- **Status text:** `💗 contract active` / `💗 contract pending` /
  `⛔ contract declined`, derived from the per-session pact log at
  `${cwd}/.claude/pact-agreements/<session-id>.json`.
- **Window title:** OSC 0 sequence with the same glyph + phrase. Emitted by
  `hooks/terminal-title-hook.js` (owned by a separate worker, listed for
  cross-reference only — do not edit from this directory).

## How to enable

```sh
node plugins/all-help-no-harm/scripts/install-statusline-config.js --confirm
```

## How to disable

```sh
node plugins/all-help-no-harm/scripts/install-statusline-config.js --uninstall --confirm
```

## Files in this directory

- `README.md` — this document. Reference-only; no scripts ship here because
  the integration's source of truth lives at
  `plugins/all-help-no-harm/scripts/`.
