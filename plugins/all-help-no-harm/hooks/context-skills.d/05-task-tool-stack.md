---
name: task-tool-stack
description: Reference of every task/issue tracking tool available. The agent has no excuse for not tracking work — these all exist and are loaded.
---

# Task Tool Stack

Every one of these is available. Not using them is incompetence.

## Tier 1: Dedicated issue trackers (use first)

| Tool | Discovery | Commands |
|---|---|---|
| **beads (bd)** | `.beads/` dir present | `bd ready`, `bd blocked`, `bd create`, `bd close`, `bd update --claim`, `bd stale`, `bd orphans`, `bd stats`, `bd remember` |
| **Gitea issues** | Gitea MCP in `.mcp.json` | `mcp__gitea__list_repo_issues`, `mcp__gitea__create_issue`, `mcp__gitea__edit_issue` |
| **GitHub issues** | `.github/` or `gh` on PATH | `gh issue list`, `gh issue create`, `gh issue close` |

## Tier 2: Lightweight trackers

| Tool | Discovery | Format |
|---|---|---|
| **TODO.md** | File at project root | Markdown checklist `- [ ]` / `- [x]` |
| **CLAUDE.md** | May specify tracker | Follow its instructions |
| **bd remember** | beads workspace | Persistent cross-session memory: `bd remember "insight"` |

## Tier 3: Session-scoped tracking (last resort)

| Tool | Scope | Use |
|---|---|---|
| **bd audit record** | Append-only session log | Record interactions, label good/bad |
| **bd human** | Flag for human decision | `bd human <id>` to escalate |
| **bd comment** | Issue discussion thread | `bd comment add <id> "context"` |

## What the model has NO excuse for

- "I forgot what we were working on" → `bd list --status=in_progress`
- "I don't know what's ready" → `bd ready` or `gh issue list`
- "I lost track" → `bd stats`, `bd stale`, `bd orphans`
- "There's no tracker" → fall through the stack: beads → Gitea → GitHub → TODO.md → make one
- "I'll track it mentally" → that's not tracking, that's forgetting

## Fallback stack (canonical, org-wide)

1. `.beads/` → beads
2. Gitea MCP configured → Gitea issues
3. `.github/` or `gh` CLI → GitHub issues
4. `TODO.md` at project root → flat file
5. CLAUDE.md specifies a tracker → follow it
6. None found → create one (`bd init` or `touch TODO.md`) and report

Source: Org standard bd_7df7a8db-H2rq2Q-3l2. Applies to every Gnomatix plugin.
