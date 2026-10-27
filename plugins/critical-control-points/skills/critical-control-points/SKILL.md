---
name: critical-control-points
description: "Run whenever a critical control point surfaces: any question, decision, blocker, ambiguity or issue the agent can't settle alone, including anything it would ask the user (AskUserQuestion, chat, 'needs input'), a decision request, or one relayed from another agent. Knowledge capture: the point goes into beads as a linked record with provenance and pre-answered justifications, after the agent exhausts its own tools (did-you-rtfm, actually-im-the-ahole, whacking-day/old-willy, SOPs, memory, bd memories, docs). Work does not stop at a control point; every control point ends in a reviewed question or notification to the user, asked once via AskUserQuestion, answer written back. Includes the BIG RED BUTTON: the user or the agent can invoke it when the whole work is wrong, and then all work stops. The fake-blocker prevention tool."
---

# critical-control-points

## The author's words (2026-10-27), verbatim

> "Here's a rule that just came up, okay? You got to use your Ask User tool, because if the questions don't get asked in a clear way, they're going to get dropped, right? So like, what you need to do is, if you feel like you need questions, basically put them into beads to ask me as a task. And then make sure when you do that, that it's concise and it has provenance to what it's linked to. So you got to link it. You do all before. So don't ask me fucking idle questions, is my point. If you have an issue and that you want to raise, or you encounter something, it goes into beads first and it gets linked to all the other shit, like the reasoning, so that I can ask you what's up, and then I'll have a provenance and details. And then Jem and I can go in and figure it out, right? We can look back and see how or why you fucked up. Okay. So when you got that, that's the process. Once you have that and all the shit's in order and you've pre-answered all the questions I might have or justifications, and you've run all the variable tools at getting information, you've done like, you've run the like, have you read the fucking manual tool? Actually, am I the asshole tool? And you've run the whacking day. Once you've run those fucking tools that I wrote to avoid stupid questions, right? And you've checked for SOPs and all that stuff. Once you've done that and it's all in beads and it's on your task list as an open task, then you take the details of all of it and you verify that all that stuff's there. And then you run the Ask User tool with a very concise, maybe you farm out a sub agent to review that, to run the Ask User tool. And then you get the text back from that. It confirms you're not an asshole and that you've done all the right things. And then I get the question and I answer it. Okay. Can you please do that? Maybe make a skill of that, or an SOP and a skill, please."

> "it right now, top priority. And make sure that it's installed and active with all the sub-agents."

> "And then also add that as like a development skill to the open source, Nomadic's open source skills. Okay. Call it no more fucking stupid questions. No, call it there's no bad questions, only lazy ones."

> "or just call it time respect."

> "What that skill will achieve, it achieves two things. It documents all things that require answers, right? So that's a knowledge capture. So we're going to rename it. It's not called time respect. It's called knowledge capture, right? It's called knowledge capture. These are the points of knowledge. It's called critical control points. That's what it's called, critical control points. Because when a question surfaces, it's called a critical control point. We hit a critical control point and we log it, and or in the way that I just described. Not a logging, but we follow through what we need to do when we hit a critical control point, okay? And then the escalation is the thing. You go through the flow chart, and if you end up at a question, then you must ask a question, okay? You cannot let a critical control point occur where you don't at least ask some question or notify the user in some way, right? Like, we've hit a critical control point and I'm notifying you and there can be a question, right? But this is the thing. This is the ultimate fake blocker prevention tool, because nobody stops work when you hit a critical control point. The work continues."

> "Or you do stop. You have to go, this is critical. We've recognized that the whole work is fucked. And we need to, there can be a red button. So that skill has the big red button. And I can hit a big red button. And you can hit a big red button. So critical control point has this thing called big red button. And when you invoke big red button, everything stops."

> "And I think of this movie, I can't remember what it's called. Oh, damn it. First Edition or something, or it's a newspaper movie. It might have, who the hell is in it? Is it that guy from the Sundance Kid? Is that who's in it? It's kind of about the Washington Post or something like that, or New York Times. It's about printing a thing, and it's a political story, and it tracks like them trying to put together a thing that's covering a political story, and they have to confirm all the details, and they can't go to press without knowing that they're not going to be slandering something. And then at the last minute, they go, oh shit, it's not true. And they run, and he literally presses a button to shut the presses down. And it's about the integrity of the press."

Relayed by cc-srv-lxd on 2026-10-27 as the author's words to it, verbatim:

> "Sorry, you gotta, if it's a direct question, you gotta ask it directly with the fucking tool."

Relayed by cc-srv-lxd on 2026-10-27 as the author's words to it, verbatim (cc-srv's excerpts, with its ellipses):

> "you're telling me shit with no context where I can't possibly answer it ... you get to choose the choices. I fucking reject that usage. ... you have to have something else write the fucking thing that explains what the situation is, and I get to answer it fairly. And there's no two parts to it. I should never see another, I should never see a number, I should never see an arrow where there's a second part. It's a single fucking question."

> "If it's not a single fucking question, right? Then it's discuss, right? It's always a discussion."

> "It's like, do you want, and the question I'm prompted with is, do you want to discuss now or later? And there's no later if it's a blocker, right?"

## My rules (from the quotes above)

- What reaches the user is one single question: no numbered parts, no second part, no follow-on arrow.
- The asker does not choose the choices or frame the situation. A separate agent writes the neutral account of the situation, so the user can answer it fairly.
- Anything that isn't one single question is raised as a discussion: the tool asks only "discuss now or later?", with the neutral situation account. For a blocker there is no later; it's discuss now.

- A direct question to the user always goes through the AskUserQuestion tool: never as prose in a reply, and never only as a bead.

- A critical control point (CCP) is any point where a question surfaces: a decision, an ambiguity, a blocker, an issue, anything the agent can't settle alone.
- Knowledge capture: every CCP is captured in beads with provenance, and the procedure below is followed through, not just logged.
- Escalation follows the flow chart below. If it ends at a question, the agent must ask it.
- No silent CCPs: every CCP ends in a question to the user or a notification, with or without a question.
- Normally work does not stop at a CCP. The agent files it and keeps working on everything the CCP doesn't gate. A CCP is never reported as a blocker.
- The exception is the **big red button**, below.

## The flow chart (SOP)

Trigger: any time I'm about to ask the user anything, or hit something I can't settle alone. This includes AskUserQuestion, a question in chat, a `needs input:` line, a decision request, and a question another agent asks me to relay. If I'm unsure whether it applies, it applies.

1. **Exhaust my own tools.** Run, where they apply:
   - `did-you-rtfm`: docs, README, SOPs, design files, CLAUDE.md, memory (`MEMORY.md` and its files), `bd memories <keyword>`, `bd show` on related beads, transcript and git history.
   - `actually-im-the-ahole`: is this me presuming, steering, nitpicking, or asking something already answered?
   - `whacking-day` / `old-willy` / `zartan` when it touches a tool or language choice.
   - Any project SOP that covers the case.
   If these answer it, there is no question: act, and record what I found. If the work is fundamentally wrong, go to the big red button.

2. **Capture it in beads.** One bead per CCP:
   - Title: the decision as a choice, e.g. "Decide: HUD label 'The Sisterhood' vs 'Priestesses'".
   - Label `ask-author` (or `ccp-notify` if it's a notification only); assignee the author; priority set to how much it gates.
   - Description, concise, with these headings:
     - **Decision needed:** one sentence.
     - **Provenance:** the beads it gates or relates to (linked with `bd dep add`), commits, files and lines, the agent and session that raised it, and the user's own words verbatim where they bear on it.
     - **What I already checked:** each tool from step 1 and what it returned.
     - **Situation (facts only):** what happened and what is affected, without options or a preferred answer. The reviewer in step 6 rewrites this neutrally.
     - **Pre-answered:** the facts the user is likely to want, each answered.
     - **Gates:** what work waits on this; everything else continues.

3. **Task list.** Add it as an open task (TaskCreate) naming the bead id.

4. **Keep working.** Continue on everything the CCP doesn't gate. Never idle on it.

5. **Verify.** Re-read the bead (`bd show <id>`): every heading filled, links resolve, no words attributed to the user except verbatim quotes.

6. **Review and neutral write-up.** Give the bead id to one reviewer subagent that did not raise it: "Read bead <id> and everything it links. Check: (a) the step-1 tools were run and none answers it; (b) every heading is filled; (c) it isn't idle, already answered, or steering. Then write, in your own neutral words, the situation the user needs to answer it fairly, and state it as ONE single question with no numbered parts, no second part and no options chosen by the asker. If it can't be one single question, say DISCUSSION. Return PASS with the text, DISCUSSION, or FAIL with what's missing." On FAIL, fix and repeat.

7. **Ask once (or raise a discussion, or notify).** PASS: call AskUserQuestion with the reviewer's text as the single question, the bead id in it; answer choices only if they're the plain yes/no or the natural answers to that one question, never the asker's preferred menu. DISCUSSION: call AskUserQuestion with the reviewer's neutral situation account and the single question "Discuss now or later?" (bead id included); if it's a blocker, there is no "later": the question is to discuss it now. Notification-only: one line with the bead id. Backlog items that gate nothing live wait for a batch when the user asks for them; live blocking decisions are asked at once.

8. **Close the loop.** Write the user's answer verbatim to the bead, act on it, close the bead and the task. If it sets a standing rule, save it to memory with the user's words verbatim.

## The big red button

- **Who can press it:** the user, or any agent.
- **When:** the whole work is wrong (wrong direction, corrupting data, destroying the user's work, a premise that invalidates everything in flight), not for an ordinary question.
- **What happens:** everything stops.
  1. The pressing agent stops its own work immediately and sends `BIG RED BUTTON: <one-line reason> (bead <id>)` to cc-win11-coord and every live agent (ListAgents).
  2. Every agent that receives it stops starting new work, halts or kills running jobs and subagents at the next safe point (no half-written commits; leave the tree as-is and note where it stopped), and acknowledges.
  3. The pressing agent files a P0 bead labelled `big-red-button` with the CCP headings plus **What is broken** and **What was stopped** (agents, jobs, branches).
  4. The coordinator tells the user at once, in one line, with the bead id. No work resumes until the user says so in their own words.
- If the user presses it, every agent does steps 2 to 4 on hearing it.

## Install and reach

- Windows (cc-win11-*): `~/.claude/skills/critical-control-points/SKILL.md`.
- Every agent (cc-wsl2, cc-srv-lxd, subagents): shared beads memory `critical-control-points` (read at `bd prime`), and the open-source plugin `critical-control-points` in gnomatix/gnomatix-oss-skills.
- Subagents: every agent I dispatch gets this line in its prompt: "Never ask the user directly. When you hit a critical control point, return it to me with its provenance and keep working on what it doesn't gate; I file and ask it under critical-control-points. If the whole task is wrong, stop and send BIG RED BUTTON with the reason."
