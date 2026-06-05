# GNOMATIX visual integration — Gemini CLI

**Status:** native integration via Gemini CLI's documented extension and
settings surface.

## Visual surfaces Gemini CLI exposes

Verified against the Gemini CLI v0.43+ documentation:

| Surface | Config key | Doc URL |
|---|---|---|
| Custom color theme | `ui.theme` (selector); themes loaded from extensions via `themes` array in `gemini-extension.json` | https://geminicli.com/docs/cli/themes/ , https://geminicli.com/docs/extensions/reference/ |
| Footer items / status line | `ui.footer.items`, `ui.footer.showLabels`, `ui.footer.hideCWD`, `ui.footer.hideSandboxStatus`, `ui.footer.hideModelInfo`, `ui.footer.hideContextPercentage` | https://geminicli.com/docs/reference/configuration/ |
| Terminal window title | `ui.dynamicWindowTitle` (Ready: ◇ / Action Required: ✋ / Working: ✦) + `ui.showStatusInTitle` (working-phase model thoughts) | https://geminicli.com/docs/reference/configuration/ |
| Background-color toggle | `ui.useBackgroundColor`, `ui.autoThemeSwitching` | https://geminicli.com/docs/reference/configuration/ |
| Banner / tips / spinner / shortcut hint | `ui.hideBanner`, `ui.hideTips`, `ui.showSpinner`, `ui.showShortcutsHint` | https://geminicli.com/docs/reference/configuration/ |

## Integration enabled here

- **Window title** is delegated to `terminal-title-hook.js` in the plugin's
  `hooks/` directory, which emits the `💗 contract <state>` OSC 0 sequence.
  The installer sets `ui.dynamicWindowTitle: true` and `ui.showStatusInTitle: true`
  so the Gemini CLI's own state icons compose with the hook-emitted title —
  both surfaces show through.
- **Color themes** are packaged as a Gemini CLI extension
  (`all-help-no-harm-gnomatix`); theme names and colors are owned by GNOMATIX
  and live in the JSON files under `themes/`. Do not author or modify brand
  content without explicit authorization from the owner.

## How to enable

```sh
# default — installs both themes, sets dark variant as default
node platforms/gemini-cli/install-gemini-config.js --confirm

# install with the light variant as the active theme
node platforms/gemini-cli/install-gemini-config.js --confirm --light

# preview the changes without writing
node platforms/gemini-cli/install-gemini-config.js --dry-run
```

After install, restart Gemini CLI and run `/theme` to confirm the
installed theme appears in the picker.

## How to disable

```sh
node platforms/gemini-cli/install-gemini-config.js --uninstall --confirm
```

Removes the extension directory and reverts `ui.theme` (only if it still
holds the GNOMATIX value — the uninstaller never clobbers a value the user
has changed since install).

## Files in this directory

- `gemini-extension.json` — Gemini CLI extension manifest (declares the
  `themes` array, per the v0.43+ extension reference).
- `themes/gnomatix-helix.json` — dark theme, deep purple (`#5b2e8f`).
- `themes/gnomatix-helix-light.json` — light variant for users on light
  terminals.
- `install-gemini-config.js` — installer / uninstaller. Pure Node, atomic
  writes, defensive fs handling per marketplace CLAUDE.md.

## Sources

- https://geminicli.com/docs/extensions/ — extension overview (themes,
  MCP servers, custom commands, hooks, sub-agents, agent skills)
- https://geminicli.com/docs/extensions/reference/ — `gemini-extension.json`
  manifest schema; theme reference convention
  `<theme-name> (<extension-name>)`
- https://geminicli.com/docs/cli/themes/ — full custom theme JSON schema
  (`background`, `text`, `border`, `status`, `ui`)
- https://geminicli.com/docs/reference/configuration/ — full `ui.*`
  settings reference (`ui.theme`, `ui.footer.*`, `ui.dynamicWindowTitle`,
  `ui.showStatusInTitle`, etc.)
- https://github.com/google-gemini/gemini-cli/pull/17327 — feature PR
  introducing extension-provided custom themes
