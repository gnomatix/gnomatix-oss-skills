---
description: Report the question-queue checks and metrics (A28) without changing anything
argument-hint: "[--tasks 1,3,7]"
allowed-tools: Bash(node:*)
---

Brett ran /worklog-status. Read-only report.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/bin/worklog" status $ARGUMENTS` and `node "${CLAUDE_PLUGIN_ROOT}/bin/worklog" metrics $ARGUMENTS`. If no `--tasks` was given, add `--tasks` with the ids of this session's question tasks.
2. Reply with both outputs exactly as printed, in one code block each.
3. Under them, one line per non-zero problem count (answer ready but not asked, orphans, records made before "yes"), naming the question slugs.

Make no changes: no sync, no publish, no records.
