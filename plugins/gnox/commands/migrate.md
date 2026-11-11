---
description: "Detect and migrate legacy renamed or consolidated gnomatix-oss-skills plugins and skills across Claude Code, Antigravity, and Agent Skills directories."
argument-hint: "[--dry-run] [--scope user|project]"
---

Check for any legacy renamed or consolidated `gnomatix-oss-skills` plugins or skills (`actually-im-the-ahole` -> `hidden-libel-check`, `kontentkop-agent-output` -> `agent-darktriad-check`, `forbidden-output-guard` -> `bear-loads`, `citation-farm-audit` -> `cui-bono`) and reconcile the installation state gracefully:

1. If running inside or alongside a local `gnomatix-oss-skills` clone, run:
   ```sh
   node scripts/install-skills.js migrate $ARGUMENTS
   ```
2. In Claude Code, if any legacy `<from>@gnomatix-oss-skills` plugin is still installed (`claude plugin list`), install its replacement in the same scope (`/plugin install <to>@gnomatix-oss-skills` or `claude plugin install <to>@gnomatix-oss-skills`) and remove the obsoleted plugin (`/plugin uninstall <from>@gnomatix-oss-skills` or `claude plugin uninstall <from>@gnomatix-oss-skills`), preserving enabled/disabled state.
3. Report each migrated plugin/skill and the resulting clean installation state concisely.
