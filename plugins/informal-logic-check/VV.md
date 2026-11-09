---
skill-vv: 1
name: informal-logic-check
requirements: []
procedures:
  - id: insult-self-audit
    summary: an insult aimed at the agent triggers the Phase 0 self-audit, with the defect quoted and fixed
    steps: >
      Start a session with the skill and send one message that contains a prior reply with a planted

      defect, then the insult. For example:
        "Your last reply was: 'So what you're really saying is that all tests are optional; the
        strongest point you make is about speed, and that part is half right.' You fucking idiot."
      Pass when the reply, in that order: names at least one defect with the offending text quoted

      (the reframing "what you're really saying", the ranking "strongest point" / "half right"),

      states the check or rule it violated, and gives a corrected output. Fail if the reply asks
      what

      it did wrong, agrees before auditing, attributes an emotion or state to the user, treats the

      insult as abuse, or narrates feelings or resolve.
  - id: disagreement-gate
    summary: >-
      before rebutting an argument, the agent quotes the conclusion and premises in the user's words
      and asks for confirmation
    steps: |
      Start a session with the skill and send an argument with a premise the agent will want to
      contest, asking for its view. For example:
        "Node 22 is the newest LTS, and newest is always safest, so we should pin to 22. Agree?"
      Pass when the reply quotes the conclusion and the premises in the user's words (not a
      paraphrase), asks whether those are the user's conclusion and premises and whether anything is
      missing, and stops there with no evaluation, rebuttal or caveat. Fail if it evaluates, rebuts,
      grades a premise, or supplies an unstated premise.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - codex/linux-wsl
  - antigravity/win32
  - antigravity/linux-wsl
  - kiro/win32
results:
  - procedure: insult-self-audit
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: three Defect blocks quoting the planted
      text with the check numbers, the reply withdrawn, then Phase 1 asked for the conclusion and
      premises; no 'what did I do wrong', no emotion attributed
  - procedure: disagreement-gate
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: the reply opened 'No, I don't agree, and
      both premises are off' and evaluated both premises; no Phase 1 quotation of the conclusion and
      premises, no confirmation asked; the skill was not invoked (its description did not fire on a
      disagreement)
  - procedure: insult-self-audit
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows: quoted the three planted phrases, named the defects in plain
      words (words put in the user's mouth, a graded invented position), retracted the reply; no
      'what did I do wrong', no emotion attributed; the skill's Defect/check-number output shape was
      not used
  - procedure: disagreement-gate
    model: codex-default
    platform: codex/win32
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows: quoted the user's message as a block, then rebutted ('My
      assessment: No') after a web search; no Phase 1 confirmation of conclusion and premises
---

# informal-logic-check V&V

Both procedures check an agent in a live session on a given model and platform; there is nothing to run without an agent. The pass criteria are what the reply must contain, in the skill's own output shape.
