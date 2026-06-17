---
name: context-housekeeping
description: This skill is loaded mechanically by the context-watch PostToolUse hook when a context tier fires. It provides the procedures for version control checks, issue tracker checkpoints, workspace audits, and recoverability sweeps that the trigger mandates. This skill should not be invoked manually — it is injected into context by the hook at the appropriate tier.
version: 1.0.0
---

# Context Housekeeping

Loaded by the context-watch hook at a context-usage tier boundary. The trigger text specifies the tier, the check type (VC CHECK or TASK TRACKING CHECKPOINT), and the spot-check items. This skill provides the execution procedures.

## Mandatory Actions

Report the trigger firing to the user visibly. State the tier and planned action. Then execute — do not defer, do not exercise discretion to skip.

### VC CHECK (tiers 10, 30, 50, 70, 90)

Dispatch a background subagent to run these in the workspace root:

```
git status
git log --not --remotes --oneline
git branch -v
```

Report results to the user in the same reply as the trigger acknowledgment. Act on findings:

- Uncommitted changes → state what they are and whether they should be committed
- Unpushed commits → state what they are
- Detached HEAD → flag it
- Stale branches → flag them

### TASK TRACKING CHECKPOINT (tiers 20, 40, 60, 80)

Run the project's issue tracker status commands. For beads workspaces:

```
bd list --status=in_progress
bd ready
bd stale
bd orphans
```

For non-beads workspaces, check whatever tracking system is present (Gitea issues, TODO files, etc.).

Report results to the user. Act on findings:

- No in-progress issues when work is happening → claim the active work
- Stale issues → flag them
- Orphaned dependencies → flag them
- Completed work not closed → close it

### Spot-Check Items

The trigger includes randomized spot-check items from two pools (high-priority obligations and available tools/skills). For each item:

1. Evaluate it against current session state
2. If stale or violated, take corrective action immediately
3. Report the evaluation and any action taken to the user

### Subagent Dispatch Items

The trigger includes a SUBAGENT NOW list of trivial commands. Dispatch a single background subagent to run all of them and report results. Do not run these inline — they are mechanical checks that should not consume main-context turns.

## Execution Contract

Every action in this skill is the model's responsibility. No item creates a blocker to surface to the user as something the user needs to do. The trigger fires because the model defaults to not doing this work. Visible action on every fire is what builds trust that the work is happening.

CONTRACT VIOLATION IF IGNORED.
