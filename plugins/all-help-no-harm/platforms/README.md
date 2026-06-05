# GNOMATIX visual integration — per-platform index

This directory contains the per-platform native visual integrations for
the `all-help-no-harm` plugin. Each sub-directory targets one platform
that the gnomatix-oss-skills marketplace claims to support, documents
the platform's exposed UI surface, ships the integration files, and
includes a README citing the upstream docs that establish what is and
isn't possible.

**Status-line / window-name glyph:** U+1F497 beating heart (💗), per the indicator-emoji ask referencing https://outrage.dataglut.org.

Brand glyphs, colors, taglines, theme names, and other brand content are owned by GNOMATIX and live in the relevant asset files (`vscode-extension/media/`, per-platform `themes/`). Do not author or modify brand content without explicit authorization from the owner.

## Per-platform status

| Platform | Visual surface available | What's implemented | Doc source |
|---|---|---|---|
| `claude-code/` | YES — statusLine command + OSC 0 title | Reference impl (already wired through `scripts/contract-active-indicator.js`); README only. | https://docs.claude.com/en/docs/claude-code/statusline |
| `claude-desktop/` | NO native chrome surface; inherits Code-tab statusLine | `UNSUPPORTED.md` documenting why; the Code tab inherits Claude Code integration automatically. | https://code.claude.com/docs/en/desktop |
| `gemini-cli/` | YES — custom themes + ui.* settings | Two-variant color theme (dark + light), `gemini-extension.json` manifest, opt-in installer. | https://geminicli.com/docs/cli/themes/ , https://geminicli.com/docs/reference/configuration/ |
| `antigravity/` | YES — VS Code color theme (Code-OSS engine) | Color theme JSON + `package.json` extension manifest, installable as `.vsix` or as a directory drop. | https://antigravity.google/ , https://medium.com/@agurindapalli/how-to-install-vs-code-marketplace-extensions-in-googles-antigravity-ide-689cdcd735eb |
| `kiro-cli/` | PARTIAL — settings.json keys (no custom theme JSON, no statusLine) | `install-kiro-cli-config.js` (OSC 9 notifies + context indicator + greeting); `kiro-title-shim.js` for shell-side OSC 0 terminal title. | https://kiro.dev/docs/cli/reference/settings/ , https://kiro.dev/docs/cli/reference/cli-commands/ |
| `kiro-app/` | YES — VS Code color theme (Code-OSS engine) + `workbench.colorCustomizations` | Full theme extension AND an accent-only settings snippet for users who want to keep their existing theme. | https://kiro.dev/docs/getting-started/installation/ , https://kiro.dev/docs/guides/migrating-from-vscode/ |
| `gemini-cli-forks/` | YES — inherits Gemini CLI | Multi-target installer for qwen-code and llxprt-code; reuses upstream `gemini-cli/` assets as single source of truth. | https://github.com/QwenLM/qwen-code , https://github.com/acoliver/llxprt-code |

## Install summary

```sh
# Claude Code
node plugins/all-help-no-harm/scripts/install-statusline-config.js --confirm

# Gemini CLI
node plugins/all-help-no-harm/platforms/gemini-cli/install-gemini-config.js --confirm

# Kiro CLI
node plugins/all-help-no-harm/platforms/kiro-cli/install-kiro-cli-config.js --confirm

# Gemini CLI forks (qwen-code + llxprt-code)
node plugins/all-help-no-harm/platforms/gemini-cli-forks/install-fork-config.js --confirm

# Antigravity / Kiro App: manual color-theme install per platform README
```

## Constraints respected

Per marketplace `CLAUDE.md`:

- All installer scripts are pure Node — no `child_process`, no shell
  invocations, no Python.
- Path handling is via `path.join` — no hardcoded `/` or `\`.
- Every `fs.*` call is wrapped in try/catch with explicit ENOENT /
  EACCES handling.
- All writes use the atomic temp-file-plus-rename pattern with cleanup
  on failure.
- Uninstallers only revert values that still match what was installed —
  user edits since install are preserved.
- Pre-flight path-length checks; Windows MAX_PATH conservatism.

## Files not modified

Per the task brief, these sibling-owned files were left untouched:

- `skills/all-help-no-harm/SKILL.md` — owned by other work.
- `hooks/*` — owned by other workers.
- `contract.md` — pending refactor.
- `vscode-extension/*` — owned by separate worker (UI polish task #44).
- `scripts/contract-active-indicator.js` — reference implementation;
  not modified, only documented as the Claude Code template.
