---
description: "Run the non-LLM gnox local configuration wizard (Charmbracelet huh/gum dialogue chaining + Node fallback) for post-install setup, Interactive Design Mode, review, and config validation."
argument-hint: "[run [plugin] | list | validate [plugin] | doctor] [--repo <dir>]"
---

Run the non-LLM `gnox` local configuration wizard CLI to inspect, create, update, or sanity-check project-specific plugin configuration assets (`gnox-wizard/v1` declarative `Form -> Group -> Field` manifests, compatible with Charmbracelet `gum` TUI, Node `readline`, `--answers`, and Charmbracelet `vhs` `.tape` scripts):

1. Execute the non-LLM CLI tool directly (prefer running the CLI tool for structured dialogue rather than ad-hoc LLM prompting):
   ```sh
   node plugins/gnox/scripts/local-config-wizard.js ${ARGUMENTS:-list}
   ```
   Common invocations:
   - List all available plugin config wizards:
     `node plugins/gnox/scripts/local-config-wizard.js list`
   - Enter Interactive Design Mode for `update-readme-images` (uses `gum` TUI when installed via `mise use -g gum`, or Node `readline` fallback):
     `node plugins/gnox/scripts/local-config-wizard.js run update-readme-images`
   - Non-interactive / scripted setup:
     `node plugins/gnox/scripts/local-config-wizard.js run update-readme-images --answers '{"workspace_root":"my-repo"}' --non-interactive`
2. After the non-LLM wizard writes or updates project config assets, run the deterministic sanity-check validator as a verification pass:
   ```sh
   node plugins/gnox/scripts/local-config-wizard.js validate
   ```
3. Report the written/updated configuration files and validation status concisely.
