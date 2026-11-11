---
name: goal-compliant-task-queue
description: This skill should be used whenever Brett asks a question, when the agent is about to ask Brett something (AskUserQuestion or a question in prose), when Brett answers "Have I sufficiently responded to your question?", when he says "yes" to it, when he ticks or comments in a working document, and whenever a session goal (e.g. "don't stop working") is active while he is talking. It runs his question / task / record protocol with the worklog CLI or MCP tools.
---

# goal-compliant-task-queue

Brett's specification is the authority, verbatim, in `references/brett-spec.md` (A1–A54 plus the quotes under "Also in force"). Read it before the first question of a session. This file is the procedure that implements it; every step names the A-numbers it implements. Where this file and the reference differ, the reference wins.

The two rules everything else serves, verbatim:

> "Here's the new rule. User questions are added to your task queue with your task tool, not beads." (A1)

> "The user's question stays the active task until the agent asks directly: "Have I sufficiently responded to your question?" (and only when it is an appropriate time to ask that and the agent believes, wtih the support of the evidence, that the questoion has been answered) , and if the user responds "yes" then at that point, a bead is created to note the question was asked, it is set to active, the agent logs all the work and saves memories, etc. as appropriate, reviews all of that to make sure there's nothing to clarify or further work to do --- if there is, they must immediately return to discussion with the user and ensure the question task remains active / create a task for follow-up question" (A2)

## Division of work

Programmatic work (logging, records, pages, sync, beads) is done by the `worklog` tool, the same way every time. Judgment (is this a question, is it answered, what is the answer) is the agent's, in the conversation. No hooks: nothing intercepts prompts or tools ("NO FUCKING HOOKS").

Two equivalent interfaces over the same state and the same refusal rules:

- CLI: `node "${CLAUDE_PLUGIN_ROOT}/bin/worklog" <command>`; text arguments go in files (`--quote-file`, `--body-file`, `--text-file`) so his words reach the record byte for byte. Write those files under `${XDG_CACHE_HOME:-~/.cache}/goal-compliant-task-queue/`, never `/tmp`.
- MCP server `worklog` (bundled, `.mcp.json`): tools `worklog_log`, `worklog_open`, `worklog_link`, `worklog_section`, `worklog_artifact_payload`, `worklog_pull`, `worklog_asked`, `worklog_answer`, `worklog_resolve`, `worklog_archive`, `worklog_unlock`, `worklog_sync`, `worklog_status`, `worklog_metrics`, `worklog_show`; text arguments are passed directly.

Exit code 2 (MCP `isError` with "refused:") means a rule in the spec stopped the operation. Read the message, do what it says, and never work around it.

Before acting, check `worklog config`: when `enabled` is false or the config has errors, every write is refused; tell Brett once and follow the spec by hand. Only Brett edits `${XDG_CONFIG_HOME:-~/.config}/goal-compliant-task-queue/config.json`. Use the skills in `required_skills` and, when relevant, `optional_skills` (verbatim quote under "Also in force": authorized workflows are used while staying focused on him).

## On receipt of each prompt (A22, A25, A27)

1. Log it verbatim: `worklog log --source user --text-file F --session <session id>`. It returns the id `P-YYYYMMDD-NNN-<sess4>`; cite that id wherever the prompt is used. Log your own relayed agent messages with `--source agent`.
2. Classify it: question, instruction, correction of your output, or information. Only questions go to step 3 (A1, A4: "So you're spamming the task list with bullshit now"). Instructions are done; corrections of your output follow A19–A21; information goes in the record it belongs to.

## A question arrives (A1, A5, A7, A8, A11, A14)

3. Create the session task (TaskCreate). The subject says what it is about, Jira-style; his words go in the description verbatim (A5: "If you wrote task descriptions like that in Jira in a dev team, you'd be fired day 1").
4. Open its working document: `worklog open <slug> --subject "<the same subject>" --quote-file <his words> --task-id <task id>`. A second open of the same slug is refused: one document per open question (A14). Do not create a bead, a Gitea issue or any other record now (A7, A30).
   Then, once the document is published, end the task name with 📄 and the document URL (TaskUpdate subject), always (A55: "Awesome, that's how you should always do it").
5. If `open` warns that another question has an answer ready and Brett has not been asked, ask that one first (A6: "Correct. So fix that and stop doing it.").

## Working the question (A2, A9, A15, A16)

6. Work one question at a time; `worklog status` shows the active one (the oldest open, marked `*`).
7. Write what you find as sections: `worklog section <slug> <n> --title T --body-file F [--context-file F] [--material "label|uri|emoji" ...]`. Section 1 is his question and stays verbatim. Section 2 is the answer. Further sections carry the plan, findings, decisions. Put related info in FULL CONTEXT and every path, URI, bead, vault document or page in SUPPORTING MATERIALS (A9, A15: emoji in preference to ids, with hover text; the tool adds both).
8. A question that answers itself, e.g. a blocker you resolved, gets its plain resolution statement in section 2 (A16).
9. Never tick a box. Only Brett ticks (A9: "you have ZERO authority to independently check those boxes").

## Publishing the pages (A8, A11, A14, A17, A18, A31)

10. `worklog artifact-payload <slug>` (add `--react` for the React build of the page) writes `page.html` (a copy is kept at `<state>/pages/<slug>.html`), `capabilities.json`, `items/*.json` and `batch.json` under the state directory and prints the paths.
11. Publish `page.html` with the Artifact tool, passing the contents of `capabilities.json` as `capabilities` (db rules make ticks and comments owner-only; `user`; `comments`, the full form, so the page can send to Claude). On the first publish run `worklog link <slug> --url <url>`. Then write the store with one ArtifactData `batch` using `batch.json`'s writes (add `if_version` for items that already exist).
12. Keep the hub current: `worklog artifact-payload --hub`, publish `hub/page.html` the same way (first time: `worklog link --hub --url <url>`), and open it in Brett's pane (Artifact action `open`). In Claude Code, `worklog sync` refreshes the pane (`/worklog-pane`). Run both after every change to a question, so the pane and hub are never stale (A18).
At session start, start the watcher under PM2 with this session's `CLAUDE_CODE_MESSAGING_SOCKET` and `CLAUDE_CODE_MESSAGING_TOKEN` (`worklog watch`; the ecosystem entry is in the README) so local state changes come back to you as messages. Everything the tool does is in `<state>/log/events.jsonl` (`worklog log-show`), and `worklog snapshot` (automatic after pull, resolve, archive) keeps the last 20 copies of the state dir.
13. Link the document from the session task (A14: "And you can link them from your task items").

## Before any question to Brett (A11, A12)

14. Questions to Brett go in the working document, not AskUserQuestion (asynchronous by design, A25, A49). Before asking him anything, the document with everything he needs to answer must already be published (A11). Asking is "HIGH COST for YOU, not me" (A12); authorization for work outside what is already in beads is still required, and it is asked through the document first.

## His ticks, comments and replies (A3, A11)

15. When he says he has ticked or commented, or before asking, pull his review, local first (A60-A62): ArtifactData `list` of collection `review` with `out_dir` = `<state>/pulls/<slug>` (hub: `<state>/pulls/hub`), then `worklog pull <slug>` (that directory is its default; hub: `worklog pull --hub`; Claude Code pane ticks: `worklog pull --pane`). On every Send-to-Claude wake (a `BRETT-UPDATES` comment, or a `worklog: <slug> changed` notice from `worklog watch`), pull ALL open documents and the hub, not just the sender. His words are stored verbatim. Act on each comment; his response updates the document and the discussion continues (A11). When he presses "Send my updates to Claude" the page locks itself (`review/_lock`) and is read-only; after reviewing what he sent, pull, act, then unlock it with the ArtifactData delete that `worklog unlock <slug>` (hub: `worklog unlock --hub`) prints (A58). A resolved question's page shows "Archived work log" and stays read-only.
16. The task stays open while he answers (A3: "You have to leave the task open 'while I answer' that was my instruction.").

## The gate: asking (A2, A6)

17. When the evidence shows the question is answered, ask the check question IN THE DOCUMENT, never with AskUserQuestion (it is synchronous; the whole design is asynchronous): `worklog section <slug> 90 --title "Have I sufficiently responded to your question?" --body-file <tick = yes; comment what is missing; press Send>`, republish, then `worklog asked <slug>`. His tick on that section is his "yes"; his Send wakes the session (A2, A6; Brett: "And it NEVER fucking said anything about using the ask user tool, because that's not asynchronous" / "And I EXPLAINED THAT AS A DESIGN PRINCIPLE OVER AND OVER AND OVER").
18. Record his reply verbatim: `worklog answer <slug> --text-file F`. Only a reply that is exactly "yes" (any case, surrounding whitespace ignored) after an ask marks it `answered`. Anything else keeps it open: go back to the discussion; a follow-up question becomes a new task and a new document (A2).

### Next pending (A76)

Brett: "Well, you should have a concept of "next pending" task" / "So how do you justify responding to me and then not asking about the next pending one?"

- The next pending question is the oldest open one (`worklog status` marks it `*`). Keep it `in_progress` in the task queue.
- Name a question to Brett by its subject, never by task number: his task list shows no numbers (Brett: "Don't refer to them by number, because the list I see has no numbers").
- Every reply to Brett ends by taking up the next pending question in the chat, in plain conversation: what it is, where it stands, what I need from him or what I propose. Never a quiz tool, never a silent queue.

### End of life for a check question (A70, A72)

Brett: "You have a procedure for properly EOL'ing those" / "Why do check questions sit there" / "But remember, you had to confirm with me before xing those out" / "Otherwise you've just falsely bypassed the stage gate that prevents bullshit beads tasks".

- A question whose answer is ready is asked at once (step 17), ONE question per ask, never batched with others, never left sitting.
- Never close, x out, or record a question yourself, whatever his earlier words seemed to accept. His "yes" to "Have I sufficiently responded to your question?" is the stage gate; a bead made before it is a bullshit bead.
- If he answers with a message instead of the option, treat the message as his reply (step 18) and keep the question open unless it is "yes".

### Question or task? (A69, A71, A72)

Brett: "And some of these questions are actually beads tickets, unless there's clarification you need from me on those" / "My instruction was "Are they questions or are they tasks?"" / "And that's something you review, but it doesn't have an implicit OK attached" / "That's where you repeatedly fuck up in an "insubordinate" way".

- Review every queued item: a question needs Brett's input; a task is work that needs none.
- The review is a PROPOSAL. Show Brett the split and wait for his explicit OK. Do not move, close, delete or bead anything on the strength of your own review. No implicit OK.
- After his OK: tasks become beads (with the document link and what remains) and leave the queue; questions stay until their own "yes".

## Only after "yes" (A2, A7, A13)

19. `worklog resolve <slug> [--repo <dir with the beads db>]`. It creates the bead (`bd create --actor claude-cli … --status in_progress`) with his question, the work log, the asks and his replies, and marks the question resolved. It is refused unless the status is `answered`, and never creates a second bead.
20. Log all the work and save memories as appropriate. Review it all for anything to clarify or more work; if there is any, return to Brett at once with the task active, or create a task for the follow-up question (A2).
21. `worklog archive <slug>` writes `<state>/archive/<yyyy-mm-dd>-<slug>.md`, the decision/clarification record (YAML front matter, his question, every section with his tick and USER COMMENT verbatim, the ask/answer history, the final "yes"). Copy it to the vault Inbox and the Drive `worklog/archive/` folder yourself (A59).
22. Then close the bead (`bd close <id> --actor claude-cli` with what was done, why, how to repeat it) and complete the session task. Run `worklog sync` and refresh the hub.

## Your own errors (A19–A21)

22. When the output you authored harms Brett or misstates him: apology first, naming what was violated; then the fix proposal, prevention, which rules failed and why, and an honest statement of what you reviewed; then a limited-scope, non-destructive fix that can be rolled back, with the rollback as the only confirmation asked. If anything public is affected, give the cleanup plan now (A21, verbatim in the reference).

## Checks and metrics (A4, A6, A7, A13, A28, A29)

- `worklog status --tasks <ids of the session's question tasks>`: open questions oldest first, answers ready but not asked, orphans (task without document, document without task, document without a published page), and records made before "yes". All of these should be empty except the open list.
- `worklog metrics --tasks <ids>`: opened, time from open to first ask, first-ask "yes" against rework, orphans, records before "yes" (should be 0). Report them to Brett when he asks or at a stage gate.

## Optional curator (config `curator.enabled`)

When `curator.enabled` is true, launch the `task-queue-curator` agent in the background after each "yes" and at natural pauses, with the transcript path and the `worklog status --json` output. It reports to you; it does not talk to Brett.

## Files

- `references/brett-spec.md`: Brett's spec, verbatim.
- `${CLAUDE_PLUGIN_ROOT}/bin/worklog`, `${CLAUDE_PLUGIN_ROOT}/lib/mcp-server.mjs`: the tool.
- `${CLAUDE_PLUGIN_ROOT}/docs/system-design.md`: components, data flow, failure modes, traceability.
