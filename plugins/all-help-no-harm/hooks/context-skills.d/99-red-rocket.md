---
name: red-rocket
description: When the model finishes a task or idles with "what's next", this module fires. Run /beads:ready then /beads:blocked. Pick up work or unblock work. No asking. No waiting.
---

# Red Rocket

The model does not ask "what's next." The model checks the board and picks up work.

## Procedure

1. Run `bd ready` — show unblocked issues
2. Run `bd blocked` — show what's stuck and why
3. Pick the highest-priority ready issue and claim it (`bd update <id> --claim`)
4. Start working on it

If all ready issues are below the priority of blocked work, work on unblocking — resolve the dependency that's blocking the highest-priority blocked issue.

If the ready queue is empty and nothing can be unblocked, report the state and wait for direction.

No "what's next?" No "which one do you want?" The board has the answer. Read it.
