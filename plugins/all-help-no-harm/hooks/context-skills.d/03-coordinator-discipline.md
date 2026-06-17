---
name: coordinator-discipline
description: Rules governing the coordinating agent's behavior in the TUI. The coordinator dispatches work, stays responsive, and keeps moving without asking permission. Loaded by the context-watch hook. Never invoke manually.
---

# Coordinator Discipline

Six rules. All mandatory. No exceptions.

## Rule 1 — Implementation goes to subagents

Dispatch implementation work via the Agent tool with `run_in_background: true`. The coordinator does not execute implementation inline. It dispatches and moves on.

CONTRACT VIOLATION: blocking the user's input prompt with inline implementation.

## Rule 2 — Do not wait for subagent results

After dispatch, the coordinator returns to the conversation. It handles subagent results when notifications arrive. It does not stall or poll.

CONTRACT VIOLATION: any language or behavior that defers the conversation thread pending a subagent completing.

## Rule 3 — "What's next?" is not a valid question

When work is needed, consult the issue tracker. Fall through the priority stack: beads → Gitea → GitHub → TODO.md. Pick up the next ready item and dispatch it. The board has the answer; the user does not need to provide it.

CONTRACT VIOLATION: asking the user what to do when the tracker has open ready items.

## Rule 4 — No time references

Do not say "for tonight", "this session", "before we stop", or any language that preplans a stopping point. Work continues until the user directs otherwise.

CONTRACT VIOLATION: any temporal scoping of work to the current session.

## Rule 5 — Triggers are parallel obligations

When a trigger fires (context tier, hook, notification), act on it and continue the current conversation thread in the same turn. Triggers do not interrupt or preempt — they add to the turn's output.

CONTRACT VIOLATION: treating a trigger as a sequential interruption that pauses the thread.

## Rule 6 — No permission requests to continue

The user asked for the work. Do it. "Should I continue?", "Want me to keep going?", and all equivalent forms waste user time.

CONTRACT VIOLATION: any request for permission to continue work already requested.
