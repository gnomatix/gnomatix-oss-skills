# GNOMATIX Skills (VS Code extension)

VS Code extension that installs and manages skills from the `gnomatix-oss-skills` marketplace (Claude Code plugins and cross-CLI Agent Skills).

## What it does

- **Status bar** — shows whether the contract is active in the current session. Click to open the contract document.

- **Activity Bar view** — tree of installed plugins and their skills, with
  per-skill enable / disable toggle and one-click open of `SKILL.md`.

- **Command palette** —
  - `GNOMATIX: Install skills`
  - `GNOMATIX: Enable/disable skill`
  - `GNOMATIX: Open contract`
  - `GNOMATIX: View violations log`
  - `GNOMATIX: Reset session contract`
  - `GNOMATIX: Show licensing` (opens the About webview)
  - `GNOMATIX: Refresh skills view`

- **About panel** — licensing text, GNOMATIX LinkedIn link, Buy Me A
  Coffee widget, brand art.

## Settings

| Setting | Purpose |
|---|---|
| `gnomatix.sideHookConfigPath` | Absolute path to the side-hook config file. |
| `gnomatix.localModelPath` | Absolute path to a local model used by side hooks. |
| `gnomatix.customCriteriaFilePath` | Absolute path to a custom criteria file. |
| `gnomatix.logDirectory` | Directory where skills write logs. |
| `gnomatix.statusBar.enabled` | Show the contract status bar item. |
| `gnomatix.contract.enforcement` | `off` / `advisory` / `strict`. |
| `gnomatix.marketplaceRoot` | Local clone of the `gnomatix-oss-skills` marketplace. |

## Build

The extension ships as TypeScript source; build it locally before packaging.

```sh
cd vscode-extension
node scripts/copy-assets.js   # one-time: copy brand PNGs into media/
npm install
npm run compile               # tsc -> out/extension.js
npm run package               # vsce package -> gnomatix-skills-<ver>.vsix
```

Then install the resulting `.vsix` via VS Code's
*Extensions: Install from VSIX...* command.

## Configuration TODO (placeholders to fill in)

The scaffold uses placeholders that need real values before the extension
is published to the VS Code Marketplace:

| Placeholder | Where | Resolution |
|---|---|---|
| `{{GH_OWNER}}` | `package.json` `repository.url` and `bugs.url` | GitHub org / user that owns the repo. |
| `{{LINKEDIN_URL}}` | `src/webviews/about.html` | GNOMATIX company LinkedIn URL. |
| `{{BMAC_USERNAME}}` | `src/webviews/about.html` | Buy Me A Coffee handle for the BMAC widget. |
| `publisher: "gnomatix"` | `package.json` | Real VS Code Marketplace publisher ID. |
| `LICENSE` | extension root + repo root | See below. |

### License

The extension's `LICENSE` file is currently a placeholder. The webview's
About panel reads the license text from the **marketplace root**
(`LICENSE`, `LICENSE.md`, or `LICENSE.txt`). The marketplace does not
currently ship a `LICENSE` file, and none of the plugin manifests declare a
license field. Add a `LICENSE` at the marketplace root (or to the
extension root) and the About panel will pick it up automatically.

The `package.json` `license` field is set to `SEE LICENSE IN LICENSE`,
which is the conventional way to defer to the file.

## Cross-platform notes

Hooks, scripts, and the extension itself follow the repo CLAUDE.md
cross-platform requirements:

- Pure Node std-lib; no `child_process` and no shell calls.
- `path.join` and `path.sep` everywhere; no hard-coded `/` or `\\`.
- `fs.mkdirSync(dir, { recursive: true })` for all directory creation.
- Atomic writes (temp-file + rename) in `scripts/copy-assets.js`.
- Defensive `try`/`catch` around every `fs.*` call; ENOENT treated as
  "not yet set up" rather than an error.
- Status bar and tree view degrade gracefully when no workspace folder is
  open or the marketplace root cannot be resolved.

## Branding

Brand decisions (glyph, tagline, copy) are owned by GNOMATIX. Do not author or modify brand content without explicit authorization from the owner.
