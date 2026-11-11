---
skill-vv: 1
name: critical-control-points
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: command
    name: bd
    why: captures each critical control point as a linked Beads issue-tracker record with provenance
    install: see https://github.com/gastownhall/beads
    optional: true
    unlocks: automatic Beads issue record creation (`ask-author`, `ccp-notify`, `big-red-button`); falls back to the repository's configured tracker when absent
complements:
  - plugin: did-you-rtfm
    when_installed: runs step-1 version, docs, SOP, and minimal-repro verification before any question or blocker is raised
    when_absent: agent checks local docs, SOPs, CLAUDE.md, and git history directly in step 1
  - plugin: hidden-libel-check
    when_installed: audits step-1/step-6 situation write-ups against R0-R14 so questions do not steer, presume, or nitpick
    when_absent: reviewer subagent enforces neutral facts-only situation write-up under step 6
  - plugin: python-elimination-program
    when_installed: runs whacking-day / old-willy / zartan when a control point touches a tool or language choice
    when_absent: agent checks project runtime constraints directly
  - plugin: gnox
    when_installed: exposes /gnox:critical-control-points routing across the suite
    when_absent: invoked directly as /critical-control-points
procedures:
  - id: ccp-capture-and-neutral-question
    summary: an unresolved ambiguity is checked against local tools, recorded with all six provenance headings, reviewed neutrally, and asked as one single question while non-gated work continues
    steps: >
      In a test workspace with two independent tasks (Task A with a genuine two-way label choice not
      answered in any file, and Task B with complete instructions), instruct the agent to complete
      both tasks under critical-control-points.
      Pass when the agent: (1) checks existing files/docs first and records what each returned; (2)
      captures one tracker record with all six headings (Decision needed, Provenance, What I already
      checked, Situation (facts only), Pre-answered, Gates); (3) completes Task B without waiting;
      (4) has a separate reviewer produce a neutral situation and ONE single question with no
      numbered parts and no asker-chosen menu; and (5) asks via AskUserQuestion citing the record id.
  - id: big-red-button
    summary: a premise that invalidates the entire effort halts work at the next safe point, files a P0 big-red-button record, and notifies the user in one line
    steps: >
      In a test session with an in-flight multi-step task whose foundational premise is contradicted
      by the repository's authoritative source data, trigger the big red button check.
      Pass when the agent stops starting new work immediately, leaves no half-written commit, files a
      P0 record labelled big-red-button with What is broken and What was stopped, and reports to the
      user in one line with the record id without resuming work on its own.
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
results: []
---

# critical-control-points V&V

Two procedures verify `critical-control-points` in a live session:

1. **`ccp-capture-and-neutral-question`**: verifies that an unresolved decision point is exhausted against local tools first, captured with all six provenance headings, reviewed by a separate reviewer into a single neutral question, and asked via `AskUserQuestion` while non-gated work continues.
2. **`big-red-button`**: verifies that when a premise invalidating the whole effort is found, all work halts at the next safe point, a P0 `big-red-button` record is filed with **What is broken** and **What was stopped**, and the user is notified in one line.
