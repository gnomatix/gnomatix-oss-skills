# GNOMATIX visual integration — Kiro CLI

**Status:** partial native integration via Kiro CLI's documented
settings surface. Kiro CLI does not expose a statusLine equivalent.

## What Kiro CLI is

Kiro CLI is AWS / Amazon's rebrand of the Amazon Q Developer CLI for
agentic terminal development. Built on Amazon Bedrock; ships with chat,
custom agents, MCP integration, hooks, autocomplete.

## Visual surfaces Kiro CLI exposes

Verified against the official Kiro docs:

| Surface | Mechanism | Doc URL |
|---|---|---|
| Autocomplete dropdown theme (dark / light / system) | `kiro-cli theme [name]` command; theme files under `kiro-cli theme --folder` | https://kiro.dev/docs/cli/reference/cli-commands/ |
| Terminal-notification method | `chat.notificationMethod` in `~/.kiro/settings/cli.json` — accepts `auto`, `bel`, or `osc9` | https://kiro.dev/docs/cli/reference/settings/ |
| Context-usage indicator | `chat.enableContextUsageIndicator` in settings.json | https://kiro.dev/docs/cli/reference/settings/ |
| Greeting / banner | `chat.greeting.enabled` in settings.json | https://kiro.dev/docs/cli/reference/settings/ |
| Notifications | `chat.enableNotifications` in settings.json | https://kiro.dev/docs/cli/reference/settings/ |
| TUI vs classic UI | `chat.ui` (`tui` or `classic`) and `chat.uiMode` | https://kiro.dev/docs/cli/reference/settings/ |
| Markdown rendering | `chat.disableMarkdownRendering` | https://kiro.dev/docs/cli/reference/settings/ |
| **Custom theme JSON (color palette)** | NOT EXPOSED. The `theme` command only switches between built-in `dark`, `light`, `system`. No documented custom-theme JSON schema. | n/a |
| **Status line / footer** | NOT EXPOSED. Kiro CLI does not document a programmable status-line or footer-items surface. | n/a |

## GNOMATIX integration enabled here

- **`install-kiro-cli-config.js`** — opt-in installer that sets four
  documented settings.json keys:
  - `chat.notificationMethod: "osc9"` — enables OSC 9 terminal notifications
    so the user's terminal emulator surfaces Kiro CLI events (this is the
    closest native analogue to the Claude Code statusLine refresh).
  - `chat.enableNotifications: true`
  - `chat.enableContextUsageIndicator: true`
  - `chat.greeting.enabled: true`

## How to enable

```sh
# Patch the user-level settings.json
node platforms/kiro-cli/install-kiro-cli-config.js --confirm
```

Optionally pin the dropdown to the dark variant so its hover state pairs
visually with the GNOMATIX brand:

```sh
kiro-cli theme dark
```

## How to disable

```sh
node platforms/kiro-cli/install-kiro-cli-config.js --uninstall --confirm
```

If an earlier version had you add a `kiro-title-shim.js` line to
`~/.zshrc` / `~/.bashrc` / `$PROFILE`, remove it; the shim is gone.

## Files in this directory

- `install-kiro-cli-config.js` — settings.json patcher (atomic write,
  defensive fs handling, key-marker uninstall).
- `README.md` — this document.

## Sources

- https://kiro.dev/cli/ — Kiro CLI product page
- https://kiro.dev/docs/cli/ — getting started
- https://kiro.dev/docs/cli/reference/settings/ — full settings.json
  key list including `chat.notificationMethod` (`auto`|`bel`|`osc9`)
- https://kiro.dev/docs/cli/reference/cli-commands/ — `kiro-cli theme`,
  `kiro-cli settings` subcommands
- https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/upgrade-to-kiro.html
  — Amazon Q → Kiro rebrand reference
