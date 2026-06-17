---
name: task-tool-stack
description: Reference of every task/issue tracking tool available. The agent has no excuse for not tracking work — these all exist and are loaded.
priority_stack:
  beads:
    discovery: ".beads/ directory present"
    ready: "bd ready"
    blocked: "bd blocked"
    create: "bd create --title='' --description='' --type=task --priority=2"
    close: "bd close <id>"
    claim: "bd update <id> --claim"
    list: "bd list --status=open"
    stale: "bd stale"
    orphans: "bd orphans"
    stats: "bd stats"
    remember: "bd remember 'insight'"
    audit: "bd audit record"
    human: "bd human <id>"
  gitea:
    discovery: "Gitea MCP configured in .mcp.json"
    list: "mcp__gitea__list_repo_issues"
    create: "mcp__gitea__create_issue"
    update: "mcp__gitea__edit_issue"
    comments: "mcp__gitea__get_issue_comments_by_index"
    labels: "mcp__gitea__add_issue_labels"
  github:
    discovery: ".github/ directory or gh CLI on PATH"
    list: "gh issue list"
    create: "gh issue create"
    close: "gh issue close <id>"
    view: "gh issue view <id>"
    pr: "gh pr create"
  todo_md:
    discovery: "TODO.md or TODO file at project root"
    format: "Markdown checklist: - [ ] open, - [x] done"
  claude_md:
    discovery: "CLAUDE.md may specify a tracker"
    action: "Follow its instructions"
  none:
    action: "Create one: bd init or touch TODO.md"
---

# Task Tool Stack

Every one of these is available. Not using them is incompetence.

## Discovery

Fall through the `priority_stack` in frontmatter order. Use the first tracker that resolves. The frontmatter is the machine-readable definition; this body is the human-readable guide.

Users override the stack by editing the `priority_stack` frontmatter — reorder, remove, or add entries. The agent reads the frontmatter at load time and follows the order given.

## What the model has NO excuse for

- "I forgot what we were working on" → check the tracker's list command
- "I don't know what's ready" → check the tracker's ready/list command
- "I lost track" → check stale/orphan commands
- "There's no tracker" → fall through the stack; if none found, create one
- "I'll track it mentally" → that's not tracking, that's forgetting

## Org standard

The fallback stack defined in `priority_stack` is canonical and org-wide (bd_7df7a8db-H2rq2Q-3l2). Every Gnomatix plugin that touches issue tracking uses this same stack. Users may customize their copy; the plugin ships the default.
