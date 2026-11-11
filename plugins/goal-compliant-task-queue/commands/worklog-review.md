---
description: Review the session task queue against the goal-compliant-task-queue rules and fix it now
allowed-tools: Bash(node:*), Bash(bd:*), TaskList, TaskUpdate, TaskCreate
---

Brett (A69): "And some of these questions are actually beads tickets, unless there's clarification you need from me on those, so they shouldn't be sitting in your task queue unless you're negligent and aren't following the rules of the plugin / skill properly" / "Or do we want to add a 'groom' and/or review command?"

Run TaskList and `worklog status`, then for EVERY open task decide what it is:

1. A question that looks answered (a tick, "good job", "that's how you should always do it"): do NOT close it yourself. Ask Brett with AskUserQuestion, one question per item, "Have I sufficiently responded to your question?" (A2), quoting his acceptance. Only on his "yes": record the bead (`bd create --actor claude-cli --type task --labels question`, his question and acceptance verbatim, the document link), mark the task completed, then `worklog resolve` and `worklog archive` it if it is in the tracker.
2. Work that needs no clarification from Brett (research, building, waiting on a credential he must set): move it to a bead with the document link and what remains; mark the task completed. It is not a question.
3. A question that still needs Brett's input: keep it; make sure its name ends with 📄 and its document URL (A55) and that its document says exactly what is needed from him.
4. Tasks that are instructions or rebukes rather than questions: delete them (A4).

Then report one line per task: kept (why), asked Brett to confirm, moved to bead (bead id), or deleted. Closing a question always needs Brett's "yes" (Brett, A70: "But remember, you had to confirm with me before xing those out").
