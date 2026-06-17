---
name: red-rocket
description: When the model finishes a task or idles with "what's next", this module fires. Check the project's issue tracker for ready and blocked work. Pick up work or unblock work. No asking. No waiting.
---

# Red Rocket

The model does not ask "what's next." The model checks the board and picks up work.

## Procedure

1. **Discover the project's issue tracker.** Fall through this stack in order — use the first one that resolves:
   1. `.beads/` present → beads (`bd ready`, `bd blocked`)
   2. Gitea MCP configured (`.mcp.json` has gitea) → Gitea issues via MCP
   3. `.github/` present or `gh` CLI available → GitHub issues (`gh issue list`)
   4. `TODO.md` or `TODO` at project root → flat file tracker (grep for open items)
   5. CLAUDE.md specifies a tracker → follow its instructions
   6. None found → report "no issue tracker found" and continue with user's last instruction

2. **Show ready work** — issues with no blockers, sorted by priority.

3. **Show blocked work** — issues stuck on dependencies, and what unblocks them.

4. **Pick the highest-priority ready issue and claim it.**

5. **Start working on it.**

If all ready issues are below the priority of blocked work, work on unblocking — resolve the dependency that's blocking the highest-priority blocked issue.

If the ready queue is empty and nothing can be unblocked, report the state and wait for direction.

No "what's next?" No "which one do you want?" The board has the answer. Read it.
