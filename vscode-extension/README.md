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

## Repository & Licensing

`package.json` and `src/webviews/about.html` point to `https://github.com/gnomatix/gnomatix-oss-skills`, [GNOMATIX on LinkedIn](https://www.linkedin.com/company/gnomatix), and [Buy Me A Coffee (`gnomatix`)](https://www.buymeacoffee.com/gnomatix). `LICENSE` holds the same Business Source License 1.1 text as the marketplace root's `LICENSE`, and every plugin manifest declares `"license": "BUSL-1.1"`. The webview's About panel reads the license text from the marketplace root (`LICENSE`, `LICENSE.md`, or `LICENSE.txt`). The `package.json` `license` field is `SEE LICENSE IN LICENSE`, which defers to that file. The terms are summarized in the License section at the end of this README.

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

Brand decisions (glyph, tagline, copy) are owned by GNOMATIX. Do not author or modify brand content without explicit authorization from GNOMATIX.

<!-- BEGIN: gnomatix-license-include -->
## License

**[Business Source License 1.1](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE)** (`BUSL-1.1`). The source is available, but this is not OSI open source.

**Commercial use is strictly prohibited without a paid commercial licensing / usage agreement with GNOMATIX.** Use by or for any government, government agency or charity is commercial use. Contact GNOMATIX first to arrange either of these:
- an ongoing support & development agreement
- a reasonable one-time usage fee, paid via [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

Both support continued development work on GNOMATIX projects. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms, including the Additional Use Grant, the Change Date and the Change License, are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
