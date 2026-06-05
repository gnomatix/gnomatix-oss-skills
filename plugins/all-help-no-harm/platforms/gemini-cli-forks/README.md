# GNOMATIX visual integration — Gemini CLI forks (qwen-code, llxprt-code)

**Status:** native integration via the upstream Gemini CLI extension and
theme surface, which the forks inherit.

## What these forks are

Both projects are documented forks of Google Gemini CLI:

- **qwen-code** — Alibaba Cloud / QwenLM. The project's README states:
  *"This project is based on Google Gemini CLI. We acknowledge and
  appreciate the excellent work of the Gemini CLI team. Our main
  contribution focuses on parser-level adaptations to better support
  Qwen-Coder models."*
- **llxprt-code** — Vybestack / Alex Coliver. Documents a
  `docs/gemini-cli-tips.md` migration guide, indicating a fork lineage.
  Multi-provider extension layer on top of Gemini CLI's runtime.

Because both forks inherit Gemini CLI's UI architecture — including the
`ui.theme`, `ui.footer.*`, `ui.dynamicWindowTitle`, and
`ui.showStatusInTitle` settings as well as the `gemini-extension.json`
auto-discovery in `~/.<fork>/extensions/` — the upstream theme JSON
and extension manifest are reusable verbatim. The only fork-specific bit
is the config-directory name.

## Visual surfaces (inherited from Gemini CLI)

Same as `platforms/gemini-cli/README.md`. The forks' fidelity to upstream
`ui.*` settings is **[unverified — confirm via `qwen-code --help` /
`llxprt --help` on your installed version]**, but the upstream surfaces
are stable v0.43+.

## Config directory conventions

| Fork | Settings file | Extensions dir |
|---|---|---|
| qwen-code | `~/.qwen/settings.json` | `~/.qwen/extensions/<extension-name>/` |
| llxprt-code | `~/.llxprt/settings.json` | `~/.llxprt/extensions/<extension-name>/` |

Both paths follow the upstream `~/.gemini/...` convention with the
`gemini` segment replaced by the fork's brand. **[unverified — needs
platform access to confirm directory name exactly]** If the fork uses a
different name on your installation, override with `--extensions-dir`
and `--settings` flags.

## Integration enabled here

A single installer that copies the canonical Gemini CLI assets from
`../gemini-cli/` (single source of truth — no content drift) into either
or both forks' config dirs, then patches their `settings.json` to select
the upstream theme.

The installer reuses files from `../gemini-cli/` directly so the theme
JSON, colors, and extension manifest stay synchronized. If upstream
Gemini CLI evolves the theme schema, the fix lands in `../gemini-cli/`
once and propagates.

## How to enable

```sh
# Install into both qwen-code and llxprt-code
node platforms/gemini-cli-forks/install-fork-config.js --confirm

# Install into qwen-code only
node platforms/gemini-cli-forks/install-fork-config.js --confirm --target=qwen

# Install into llxprt-code only with the light theme as the default
node platforms/gemini-cli-forks/install-fork-config.js --confirm --target=llxprt --light

# Preview
node platforms/gemini-cli-forks/install-fork-config.js --dry-run --target=all

# Override paths if the fork uses a different convention
node platforms/gemini-cli-forks/install-fork-config.js --confirm \
  --target=qwen \
  --extensions-dir=$HOME/.qwen-code/extensions/all-help-no-harm-gnomatix \
  --settings=$HOME/.qwen-code/settings.json
```

After install, restart the fork and run `/theme` to confirm the
installed theme is listed.

## How to disable

```sh
node platforms/gemini-cli-forks/install-fork-config.js --uninstall --confirm
```

## Files in this directory

- `install-fork-config.js` — multi-target installer. Pulls source assets
  from `../gemini-cli/` to keep a single source of truth.
- `README.md` — this document.

(No theme JSON files live here intentionally — they live one directory
up at `../gemini-cli/themes/` and are reused.)

## Sources

- https://github.com/QwenLM/qwen-code — qwen-code README confirms
  *"based on Google Gemini CLI"*
- https://github.com/acoliver/llxprt-code — llxprt-code repository,
  includes `docs/gemini-cli-tips.md` migration guide
- https://github.com/dinoanderson/qwen_cli_coder — community fork of
  Gemini CLI for Qwen models (additional precedent)
- https://github.com/Piebald-AI/awesome-gemini-cli — curated index of
  Gemini CLI tools and extensions
- https://geminicli.com/docs/extensions/reference/ — upstream extension
  manifest schema the forks inherit
