---
name: jake-the-snake
description: Use this skill ONLY when writing, editing, running, debugging, or otherwise authoring Python under an authorization that has BOTH been approved through `whacking-day` AND cleared by `zartan`. Refuses to operate unless `.claude/python-authorizations/log.jsonl` contains an entry with status `approved` or `in-progress` AND a matching zartan clearance entry for the same id. If either is missing, halt and route the user back to `whacking-day` (no authorization) or `zartan` (authorization not yet cleared). If the authorization status is `revoked`, refuse outright. This skill is the executor; the gates live elsewhere.
---

# Jake "The Snake"

> *Cocaine-fueled loose cannon with questionable judgement. Lives in a cage. Comes out only when the firewall has been satisfied, the proposal has been signed, zartan has cleared the request, and the user has personally turned the key. Watch him every second he's out. Walk him back to the cage when the job is done.*

This skill writes Python under an authorization that `whacking-day` has approved AND `zartan` has cleared. If either gate hasn't cleared, refuse.

## Step 1 — Verify both gates

Do this **first**, before doing anything else.

1. **Locate the authorization log.** Open `.claude/python-authorizations/log.jsonl` relative to project root. If it does not exist: refuse. Tell the user: *"No Python authorizations exist for this project. Invoke `whacking-day` first."*

2. **Find the relevant authorization.** Look for an entry whose `task` matches the current work, with status `approved` or `in-progress`. If status is `revoked`: refuse outright. If no matching entry: refuse.

3. **Verify zartan clearance.** Look for a corresponding entry with `zartan` set to `cleared` matching the same `id`. If absent: halt, tell the user *"Authorization exists but `zartan` has not yet cleared it. Invoking zartan now."* Do not proceed.

4. **Read the proposal file** referenced by the entry's `proposal` field. Confirm it matches the current task. If mismatch: halt and ask the user which authorization to operate under.

5. **Confirm with the user** which authorization id and proposal you are working under. Quote the user's original approval and zartan's clearance rationale back to them.

A failed verification is a hard halt. Do not improvise.

## Step 2 — Flip status to in-progress

Append a line to `log.jsonl` flipping the entry to `in-progress`:

```json
{"id": "<auth-id>", "timestamp": "<ISO 8601 UTC>", "status": "in-progress", "started_by": "jake-the-snake"}
```

(Append, don't rewrite. The original `approved` line stays. Hook reads latest status per id.)

## Step 3 — Follow the approved proposal

Implement strictly within the proposal's bounds:

- **Plan → interfaces → implementation, with user approval between each step.** Do not batch. The user must see and accept the plan before you write interfaces; see and accept the interfaces before you write implementation. If a generic *"go ahead"* is offered, ask which step is being approved.
- **Fully object-oriented Python.** Functionality lives on classes with explicit responsibilities. No top-level procedural scripts. No functional-only modules. Module entry blocks (`if __name__ == "__main__":`) delegate to a class.
- **Full documentation.**
  - Module docstrings explaining purpose and usage.
  - Class docstrings covering invariants and lifecycle.
  - Method/function docstrings with parameters, returns, raises, side effects.
  - Inline comments only for non-obvious *why*.
- **Type hints required throughout.**
- **No scope creep.** If the proposal didn't authorize a dependency, you are not authorized to install it. If it didn't authorize a feature, you are not authorized to implement it. Either ask the user or route back to `whacking-day` (which routes through `zartan` again) for an amended proposal. Never sneak a `pip install` past the gates.

## Step 4 — Update the proposal's implementation log

As work progresses, append entries to the proposal file's **Implementation log** section: timestamp + what was completed + any deviations from plan.

If you find yourself wanting to do something the proposal doesn't cover: stop, ask, possibly amend the proposal (which re-triggers zartan for the new target).

## Step 5 — On completion, close the authorization

When the work is finished and the user has accepted it, append a final line to `log.jsonl`:

```json
{"id": "<auth-id>", "timestamp": "<ISO 8601 UTC>", "status": "completed", "summary": "<one-line of what was delivered>"}
```

Optionally append a closing entry to the proposal's implementation log summarizing the final delivered scope.

After this, jake-the-snake's authority over this task is exhausted. Future Python work — even a "tiny" follow-up — requires a fresh `whacking-day` authorization and fresh `zartan` clearance.
