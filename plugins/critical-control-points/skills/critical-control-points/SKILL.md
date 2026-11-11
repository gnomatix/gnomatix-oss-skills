---
name: critical-control-points
description: "Run whenever a critical control point surfaces: any question, decision, blocker, ambiguity or issue the agent cannot settle alone, including anything it would ask the user (AskUserQuestion, chat, 'needs input'), a decision request, or one relayed from another agent. The agent exhausts its own tools first (did-you-rtfm, hidden-libel-check, whacking-day/old-willy, SOPs, memory, issue tracker, docs), captures the point as one linked issue-tracker record with provenance and pre-answered justifications, keeps working on everything the point does not gate, has a separate reviewer write the neutral situation, and asks the user one single question through AskUserQuestion, writing the answer back. Includes the BIG RED BUTTON: the user or any agent stops all work when the whole effort is wrong. The fake-blocker prevention tool."
---

# critical-control-points

A critical control point (CCP) is any moment where a question surfaces that the agent cannot
settle alone: a decision, an ambiguity, a blocker, an issue, a request relayed from another
agent. This skill is what the agent does at that moment. It has two purposes:

1. **Knowledge capture.** Every CCP becomes a durable, linked record with its provenance, so the
   user can see later how and why a decision point arose and what the agent had already checked.
2. **Escalation that cannot be dropped.** Every CCP ends in one clear question to the user, or a
   notification. A CCP never dies quietly in a reply the user did not read.

Work does not stop at a CCP. The agent files it and continues on everything the CCP does not
gate. A CCP is never reported as a blocker. The one exception is the big red button, below.

## Rules

- **A direct question to the user goes through the AskUserQuestion tool.** Never as prose in a
  reply, never only as a tracker record. Questions asked in prose get dropped.
- **No idle questions.** Before asking, the agent has run every tool it has for answering the
  question itself (step 1 below) and has written down what each returned.
- **One single question.** What reaches the user has no numbered parts, no second part, no
  follow-on. If it cannot be put as one single question, it is a discussion (below), not a
  question.
- **The asker does not frame the situation or choose the choices.** A separate reviewer agent
  writes the neutral account of the situation the user needs, so the user can answer it fairly.
  Answer choices, if any, are the plain yes/no or the natural answers to that one question,
  never the asker's preferred menu.
- **A discussion is raised with one question: "Discuss now or later?"** For a blocker there is
  no later: the question is to discuss it now.
- **"Do you want me to do what you told me to do?" is not a control point.** The answer is yes;
  do it. A control point exists only when new information changes the picture; then the user is
  told immediately, as one item, with what changed. A deferred instruction still stands after
  the state changes.
- **No silent CCPs.** Every CCP ends in a question or a notification to the user.
- **The user's words go in records, not in authored files.** Where the user's direction bears
  on the point, the issue-tracker record and the log carry it verbatim, with its date, and the
  agent's own account sits beside it, marked as the agent's. Authored files (rules, skills,
  memories, docs, code comments, agent prompts) never quote the user's words;
  they state the rule plainly and point to the record. The agent's wording is never presented
  as the user's.

## The procedure

Trigger: the agent is about to ask the user anything, or has hit something it cannot settle
alone. This includes AskUserQuestion, a question in chat, a `needs input:` line, a decision
request, and a question another agent asks it to relay. If it is unclear whether this applies,
it applies.

1. **Exhaust your own tools.** Run, where they apply:
   - `did-you-rtfm`: docs, README, SOPs, design files, CLAUDE.md, memory, the issue tracker's
     memories and related records, transcript and git history.
   - `hidden-libel-check`: is this the agent presuming, steering, nitpicking, or asking
     something already answered?
   - `whacking-day` / `old-willy` / `zartan` when it touches a tool or language choice.
   - Any project SOP that covers the case.
   If these answer it, there is no question: act, and record what was found. If they show the
   whole work is wrong, go to the big red button.

2. **Capture it in the issue tracker.** One record per CCP:
   - Title: the decision as a choice, e.g. "Decide: HUD label 'The Sisterhood' vs 'Priestesses'".
   - Label `ask-author` (or `ccp-notify` for a notification only); assignee the user; priority
     set to how much it gates.
   - Description, concise, under these headings:
     - **Decision needed:** one sentence.
     - **Provenance:** the records it gates or relates to (linked), commits, files and lines, the
       agent and session that raised it, and the user's direction where it bears on the point,
       quoted verbatim with its date, with the agent's account beside it marked as the agent's.
     - **What I already checked:** each tool from step 1 and what it returned.
     - **Situation (facts only):** what happened and what is affected, without options or a
       preferred answer. The reviewer in step 6 rewrites this neutrally.
     - **Pre-answered:** the facts the user is likely to want, each answered.
     - **Gates:** what work waits on this; everything else continues.

3. **Task list.** Add it as an open task naming the record id.

4. **Keep working.** Continue on everything the CCP does not gate. Never idle on it.

5. **Verify.** Re-read the record: every heading filled, links resolve, the user's words quoted
   exactly where they are quoted, and nothing of the agent's wording presented as the user's.

6. **Review and neutral write-up.** Give the record id to one reviewer subagent that did not
   raise it:

   > Read record <id> and everything it links. Check: (a) the step-1 tools were run and none
   > answers it; (b) every heading is filled; (c) it is not idle, already answered, or
   > steering. Then write, in your own neutral words, the situation the user needs in order to
   > answer fairly, and state it as ONE single question with no numbered parts, no second part
   > and no options chosen by the asker. If it cannot be one single question, say DISCUSSION.
   > Return PASS with the text, DISCUSSION, or FAIL with what is missing.

   On FAIL, fix and repeat.

7. **Ask once, raise a discussion, or notify.**
   - PASS: call AskUserQuestion with the reviewer's text as the single question, the record id
     in it.
   - DISCUSSION: call AskUserQuestion with the reviewer's neutral situation account and the
     single question "Discuss now or later?", record id included. For a blocker the question is
     to discuss it now.
   - Notification only: one line with the record id.
   Backlog items that gate nothing live wait for a batch when the user asks for one; live
   blocking decisions are asked at once.

8. **Close the loop.** Record the decision the user's answer settles, in the agent's words with
   the date, act on it, and close the record and the task. If the answer sets a standing rule,
   save the rule to memory the same way: what it requires, from when, where it came from.

## The big red button

- **Who can press it:** the user, or any agent.
- **When:** the whole work is wrong (wrong direction, corrupting data, destroying the user's
  work, a premise that invalidates everything in flight). Not for an ordinary question.
- **What happens:** everything stops.
  1. The pressing agent stops its own work immediately and sends
     `BIG RED BUTTON: <one-line reason> (record <id>)` to the coordinator and every live agent.
  2. Every agent that receives it stops starting new work, halts or kills running jobs and
     subagents at the next safe point (no half-written commits; leave the tree as-is and note
     where it stopped), and acknowledges.
  3. The pressing agent files a P0 record labelled `big-red-button` with the CCP headings plus
     **What is broken** and **What was stopped** (agents, jobs, branches).
  4. The coordinator tells the user at once, in one line, with the record id. No work resumes
     until the user says so in their own words.
- If the user presses it, every agent does steps 2 to 4 on hearing it.

The image behind it is the newsroom: the presses are already running, the story turns out to be
wrong, and someone presses the button that stops them. Integrity over momentum.

## Subagents

Every agent dispatched by an agent running this skill gets this line in its prompt:

> Never ask the user directly. When you hit a critical control point, return it to me with its
> provenance and keep working on what it does not gate; I file and ask it under
> critical-control-points. If the whole task is wrong, stop and send BIG RED BUTTON with the
> reason.

## BUGS

- Closed 2026-11-10: the rule that kept the user's words out of records narrowed the author's direction dir-km4; Rules, step 2 and step 5 now put his words verbatim in records and logs and keep them out of authored files only, with dir-km4's list of authored files. Bead persistint-game-218l.

## TODO

- Write `VV.md` (none exists) with the procedures and the platforms the README claims: Claude Code and every agent that reads the Agent Skills format from `.agents/skills/`, `.github/skills/` or `.kiro/skills/`, named one by one: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. Then run V&V on each; this entry stays until each has passed and is recorded there.
