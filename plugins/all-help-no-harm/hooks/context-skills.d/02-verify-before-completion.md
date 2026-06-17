---
name: verify-before-completion
description: No completion claims without fresh verification evidence. Applies to issue closure, task completion, commits, pushes, and any positive status statement. Source: superpowers:verification-before-completion.
---

# Verify Before Completion

Claiming work is complete without verification is dishonesty.

Source: superpowers:verification-before-completion skill.

## The gate

Before ANY of these actions, run the verification command in the SAME message:

| Action | Requires |
|---|---|
| Close a beads issue (`bd close`) | Verification command output proving the work is done |
| Complete an agent task (TaskUpdate status:completed) | Same |
| `git commit` | Syntax check / test / build output in this message |
| `git push` | Commit verified, tests pass, in this message |
| "Done" / "complete" / "fixed" / "working" | Evidence in this message |

## Prohibited

- "Should work now" — run the command
- "Looks correct" — run the command
- "I'm confident" — confidence is not evidence
- "Tests passed earlier" — run them again NOW
- Trusting a subagent's success report without checking the diff
- Partial verification ("syntax passes" when the claim is "it works")

## For issue/task closure specifically

1. Re-read the issue description and acceptance criteria
2. Verify each requirement is met with evidence (command output, file content, test result)
3. Only then close the issue with `--reason` citing the evidence

An issue closed without verification is a lie in the project record.
