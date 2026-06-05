# GNOMATIX visual integration — Google Antigravity

**Status:** native integration via Antigravity's VS Code-engine theme
extension surface.

## What Antigravity is

Antigravity is Google's "agentic development platform" — an IDE built on
the **VS Code engine** ("Code OSS"), shipped alongside Gemini's agent
backend. Because the editor surface is VS Code under the hood, it accepts
standard VS Code color themes and extensions.

## Visual surfaces Antigravity exposes

Verified at:
- https://antigravity.google/ (product page; states Antigravity is the
  next-gen agentic IDE)
- https://docs.cloud.google.com/data-cloud-extension/antigravity/use-cli-plugins
  (CLI plugins & extensions documentation)
- https://medium.com/@agurindapalli/how-to-install-vs-code-marketplace-extensions-in-googles-antigravity-ide-example-deepblue-theme-689cdcd735eb
  (community guide confirming Antigravity uses `.vsix` extension format
  installable via the Antigravity CLI; theme picker is at
  **Antigravity → Settings → Themes → Color Theme**)

| Surface | Mechanism |
|---|---|
| Color theme (editor + chrome) | Standard VS Code color theme extension; `.vsix` installed via Antigravity CLI; picker at Settings → Themes → Color Theme |
| Status bar customization | Standard VS Code `workbench.colorCustomizations` keys (`statusBar.background`, `statusBar.foreground`, etc.) |
| Activity bar / side bar | Standard VS Code keys (`activityBar.*`, `sideBar.*`) |
| Title bar | Standard VS Code keys (`titleBar.*`) |
| Token colors | Standard `tokenColors` array in the color theme JSON |
| Mission Control widgets | Not documented as an extension point. The Antigravity agent surface (Mission Control) does not have a documented public theming or widget API — only the editor pane does. |

## Integration enabled here

A standard VS Code color-theme extension. The theme name, colors,
gradient, and overall palette are owned by GNOMATIX and live in the
JSON files in this directory — see `themes/` for the authoritative
source. Do not author or modify brand content without explicit
authorization from the owner.

## How to enable

The marketplace ships the theme files; users install via either path.

### Path A — manual install (no build step)

1. Open `~/.antigravity/extensions/` (macOS / Linux) or
   `%USERPROFILE%\.antigravity\extensions\` (Windows).
2. Create a sub-directory named `gnomatix.gnomatix-helix-theme-0.1.0/`.
3. Copy `package.json` and `themes/gnomatix-helix-color-theme.json` into
   it (preserving the `themes/` sub-directory).
4. Restart Antigravity.
5. Open Settings → Themes → Color Theme → pick the installed theme.

### Path B — package into a `.vsix` and install via CLI

Per the community guide, Antigravity CLI accepts the standard VS Code
`.vsix` packaging format. Once packaged, install with:

```sh
antigravity --install-extension gnomatix-helix-theme-0.1.0.vsix
```

(The exact CLI flag name is documented as community-confirmed; verify
with `antigravity --help` on your installed version.
**[unverified — needs platform access to confirm flag spelling]**)

## How to disable

In Antigravity: Settings → Themes → Color Theme → revert to your prior
theme. Optionally remove the extension via the Extensions panel
(`Ctrl+Shift+X`) or by deleting the directory created in Path A.

## Files in this directory

- `package.json` — VS Code extension manifest declaring the theme
  contribution.
- `themes/gnomatix-helix-color-theme.json` — the color theme JSON itself
  (editor, activity bar, side bar, title bar, status bar, terminal ANSI,
  tab states, scrollbar, notifications, list, badge, progress, git
  decoration, diff editor, token colors).
- `README.md` — this document.

## Cross-reference

The `vscode-extension/` directory at the marketplace root is a separate
deliverable (runtime-VS-Code extension that includes the
all-help-no-harm contract logic). This directory ships ONLY the theme
JSON so it remains decoupled.

## Sources

- https://antigravity.google/ — product page
- https://medium.com/@agurindapalli/how-to-install-vs-code-marketplace-extensions-in-googles-antigravity-ide-example-deepblue-theme-689cdcd735eb
  — community-verified `.vsix` install workflow on Antigravity
- https://agentpedia.codes/blog/change-antigravity-theme-guide — confirms
  Settings → Themes → Color Theme picker path
- https://github.com/MichaelZelbel/awesome-antigravity — community
  extension index (precedent for plugin / theme distribution)
- https://code.visualstudio.com/api/extension-guides/color-theme —
  upstream VS Code color theme JSON schema reference
