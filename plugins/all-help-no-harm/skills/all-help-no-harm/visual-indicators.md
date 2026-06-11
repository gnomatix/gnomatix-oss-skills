# all-help-no-harm — visual UX indicators

This document describes the visual surfaces that signal whether the
all-help-no-harm contract is in force for the current session. The
indicators are read-only views of the per-session contract log; they do NOT
constitute or replace the contract — the contract text itself, its
mutual-agreement step, and its enforcement remain in
`hooks/contract-text.js`, `hooks/session-start-contract.js`,
`hooks/user-prompt-submit-contract.js`, and `hooks/post-compact-contract.js`.

## The glyph

The active-contract glyph is U+1F497 — beating heart (💗), per the
indicator-emoji ask referencing https://outrage.dataglut.org.

Encoding: the glyph is used bare (no variation selector). On terminals
that need forced emoji presentation, append U+FE0F (VS16). The indicator
script accepts a `--vs16` flag for this.

## Surfaces

### 1. Claude Code `statusLine`

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
the status line. When the script runs the contract is in force; output
is `💗 contract active`.

(Glyph shown literally; the script emits the U+1F497 bytes.)

### 2. Terminal window title (ANSI OSC 0)

A SessionStart + PostCompact hook (`hooks/terminal-title-hook.js`)
injects `additionalContext` instructing the agent to emit a single
ANSI OSC 0 escape sequence on its first turn:

```
ESC ] 0 ; 💗 all-help-no-harm contract active BEL
```

byte form: `0x1B 0x5D 0x30 0x3B <text-utf8> 0x07`.

OSC 0 sets both the icon name and the window title; OSC 1 sets icon-only
and OSC 2 sets title-only. OSC 0 is the safest cross-emulator choice.

The BEL terminator (`0x07`) is used over ST (`ESC \`) for maximum
compatibility with older emulators.

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

The terminal-title hook activates automatically when this plugin is
enabled (registered in `hooks/hooks.json`). No separate opt-in is
needed for that surface.

## Opt-out

Remove the `statusLine` block from `~/.claude/settings.json`, or run:

```
node plugins/all-help-no-harm/scripts/install-statusline-config.js --uninstall --confirm
```

To disable the terminal-title surface specifically, unregister
`terminal-title-hook.js` from `hooks/hooks.json` or disable the plugin
entirely.

## Platform support matrix

### Agent harnesses

| Harness | Status-line surface | Title surface | Notes |
|---|---|---|---|
| Claude Code | supported via `statusLine` in settings.json | supported via OSC 0 emitted by agent | primary target |
| Gemini CLI | unknown — no documented persistent UI element comparable to statusLine | OSC 0 works if Gemini CLI passes agent stdout through to the host TTY unmodified | research item |
| Codex CLI / Copilot CLI | unknown | likely OSC 0 if agent stdout reaches terminal | research item |
| Kiro | unknown | unknown | research item |

If a harness is unknown, the safe default is to ship the OSC 0 surface
and let the host terminal decide whether to render it. The statusLine
surface is Claude-Code-specific and is configured per-harness.

### Terminal emulators (OSC 0 + emoji rendering)

| Emulator | OSC 0 | Multi-codepoint emoji (U+1F497) | Notes |
|---|---|---|---|
| xterm | yes | depends on font | requires emoji-capable font |
| gnome-terminal / VTE | yes | yes (with Noto Color Emoji or similar) | |
| konsole | yes | yes | |
| iTerm2 | yes | yes | |
| Apple Terminal.app | yes | yes | |
| Windows Terminal | yes | yes | |
| ConEmu | yes | partial — older builds may strip non-BMP glyphs | upgrade recommended |
| tmux | passes through OSC 0 with `set-option -g set-titles on` | rendering deferred to outer terminal | |
| screen | requires `defhstatus` configuration | rendering deferred to outer terminal | |
| Linux console (no X) | OSC 0 silently absorbed | emoji not rendered | text-only context |

Terminals that do not support OSC 0 silently absorb the sequence; the
indicator degrades to "invisible" rather than to garbage on every
mainstream emulator on the matrix above.

Terminals that lack an emoji-capable font render U+1F497 as a placeholder
glyph (typically a box or `?`). The text "contract active" remains
readable regardless, so the indicator is comprehensible even when the
glyph fails to render.

## Source-of-truth contract integrity

These visual indicators are observational. The contract log at
`${cwd}/.claude/contract-agreements/<session-id>.json` is the single source
of truth; the indicator scripts read it without modification. They MUST
NOT and DO NOT write to it.

If the indicator and the contract log disagree, the bug is in the indicator
path or the log read, not in the contract state. Investigate the read
path; the contract itself is unaffected.
