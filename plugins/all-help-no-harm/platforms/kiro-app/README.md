# GNOMATIX visual integration — Kiro App (IDE)

**Status:** native integration via Kiro's Code-OSS-based color theme
surface (full theme extension) AND via `workbench.colorCustomizations`
overrides (lightweight settings.json snippet).

## What Kiro App is

Kiro is AWS / Amazon's agentic IDE — the desktop / IDE companion to
Kiro CLI. Built on Code OSS (the same upstream as VS Code), so it
accepts VS Code-format color theme extensions installable from the
Open VSX registry.

## Visual surfaces Kiro App exposes

Verified at:
- https://kiro.dev/docs/getting-started/installation/ — confirms "Kiro
  is based on Code OSS, so you can import your VS Code settings,
  themes, and Open VSX compatible plugins"
- https://kiro.dev/docs/editor/interface/ — confirms five-element
  interface (Editor, Chat Panel, Views/Sidebar, Status Bar, Command
  Palette)
- https://kiro.dev/docs/editor/extension-registry/ — confirms Open VSX
  is the default registry
- https://kiro.dev/docs/guides/migrating-from-vscode/ — confirms VS
  Code settings JSON keys including `workbench.colorCustomizations`
  apply

| Surface | Mechanism |
|---|---|
| Color theme (editor + chrome) | Open VSX-compatible VS Code color theme extension; installed via Extensions panel (Ctrl/Cmd+Shift+X) or by dropping into `~/.kiro/extensions/` |
| Status bar customization | `workbench.colorCustomizations` keys (`statusBar.background`, `statusBar.foreground`, etc.) |
| Activity bar / side bar | `activityBar.*`, `sideBar.*` keys |
| Title bar | `titleBar.*` keys |
| Token colors | Standard `tokenColors` array; also `editor.tokenColorCustomizations` for per-user overrides |
| Settings file | `~/.kiro/User/settings.json` (Code-OSS convention) — accessible via Command Palette → "Preferences: Open User Settings (JSON)" |
| Chat panel customization | NOT documented as a separate theming surface. Inherits the editor's color theme; no Kiro-specific keys documented. |
| Spec / Steering / Hooks sidebar entries | NOT documented as themeable. Rendered with the activity bar palette. |

## Integration enabled here

Two delivery paths, user picks based on whether they want a full theme
or just accent overrides on top of their existing theme.

### Path A — full theme extension

The standard VS Code color-theme extension (same JSON the
`platforms/antigravity/` directory ships, since both IDEs share the
Code-OSS chrome). Install:

1. Open `~/.kiro/extensions/` (macOS / Linux) or
   `%USERPROFILE%\.kiro\extensions\` (Windows).
2. Create a sub-directory for the extension (use the name declared in
   the `package.json` here, e.g.
   `<extension-id>-<version>/`).
3. Copy `package.json` and the theme JSON from this directory into it
   (preserve the `themes/` sub-directory).
4. Restart Kiro.
5. Command Palette → "Preferences: Color Theme" → pick the installed
   theme.

Or package as a `.vsix` and install via the Extensions panel's
"Install from VSIX" command.

### Path B — accent overrides only

For users who already have a theme they want to keep but want the
status-bar / activity-bar / focus-border accents from this extension,
merge the keys in `settings-snippet.json` into their settings.json
under `workbench.colorCustomizations`. Only the accent surfaces are
overridden; the rest of their theme is untouched.

## How to disable

- Path A: Command Palette → "Preferences: Color Theme" → revert to your
  prior choice. Optionally remove the extension directory.
- Path B: Delete the accent-override entries from
  `workbench.colorCustomizations` in your settings.json.

## Files in this directory

- `package.json` — VS Code-format extension manifest (theme
  contribution).
- `themes/gnomatix-helix-color-theme.json` — full color theme JSON,
  identical to the Antigravity sibling for brand consistency.
- `settings-snippet.json` — brand-accent-only overrides for users who
  prefer to keep their existing theme.
- `README.md` — this document.

## Sources

- https://kiro.dev/docs/getting-started/installation/ — Kiro
  installation; Code-OSS-base statement
- https://kiro.dev/docs/editor/interface/ — five interface elements
- https://kiro.dev/docs/editor/extension-registry/ — Open VSX is the
  default extension registry
- https://kiro.dev/docs/guides/migrating-from-vscode/ — VS Code-style
  settings JSON keys, including `workbench.colorCustomizations`
- https://kiro.dev/changelog/ — confirms Kiro Dark and Kiro Light as
  shipped baseline themes
- https://code.visualstudio.com/api/extension-guides/color-theme —
  upstream VS Code color theme reference
