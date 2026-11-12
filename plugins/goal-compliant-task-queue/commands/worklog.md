---
description: Show Brett's open questions and bring the pane and the claude.ai hub up to date
argument-hint: "[slug]"
allowed-tools: Bash(node:*)
---

Brett ran /worklog. Show him where his open questions stand, and make both views current.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/worklog" sync` and `node "${CLAUDE_PLUGIN_ROOT}/scripts/worklog" status --tasks <ids of this session's question tasks>`.
2. If an argument was given ($ARGUMENTS), also run `node "${CLAUDE_PLUGIN_ROOT}/scripts/worklog" show $ARGUMENTS` and summarise that question's sections, his ticks and USER COMMENTs (quote his words exactly).
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/worklog" artifact-payload --hub`, publish the hub page it names (with its capabilities.json) to the hub URL if one is linked, and open it in his pane with the Artifact tool's `open` action. In Claude Code, `/worklog-pane` shows the same data.
4. Reply with the status lines as printed, then one line for each problem it reports (answer ready but not asked, orphans, records before "yes"), with what you will do about it now, following the goal-compliant-task-queue skill.

Do not tick anything, create beads or change any question here.
