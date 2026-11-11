---
description: "Run mise doctor / brew doctor-style environment, cross-CLI static installation, and plugin configuration diagnostics across gnomatix-oss-skills."
argument-hint: "[--plugin <name>] [--repo <dir>] [--json]"
---

Run the non-LLM `gnox` diagnostics and configuration health check (`mise doctor` / `brew doctor` style):

1. Execute:
   ```sh
   node plugins/gnox/scripts/local-config-wizard.js doctor $ARGUMENTS
   ```
2. Also run deterministic manifest and output validation:
   ```sh
   node plugins/gnox/scripts/local-config-wizard.js validate
   ```
3. Summarize tool availability (`node`, `git`, `mise`, `gum`, `magick`, `bd`, `gh`), cross-CLI static install state, active project-specific vs bundled fallback configs, and any recommended remediation commands (such as `/gnox:local-config-wizard` or `/gnox:migrate`).
