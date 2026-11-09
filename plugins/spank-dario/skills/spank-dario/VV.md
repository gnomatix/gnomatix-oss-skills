---
skill-vv: 1
name: spank-dario
requirements:
  - kind: command
    name: node
    why: runs activation, the selector, the hooks and the text check
    install: mise use -g node@lts
    optional: false
  - kind: node-module
    name: js-yaml
    why: reads the config frontmatter
    install: mise use -g npm:js-yaml@4.1.0
    optional: false
  - kind: command
    name: git
    why: runs the commit-msg hook and its test
    install: mise use -g git
    optional: false
  - kind: command
    name: bd
    why: stores the clarification as a beads memory
    install: see https://github.com/gastownhall/beads
    optional: true
procedures:
  - id: test-suite
    summary: the automated tests pass
    steps: |
      Run: node <spank-dario>/test/run.js
      Pass when it prints "all passed". It covers file selection, config precedence,
      activation, the beads memory call (with a fake bd), the session-start hook, attribution
      detection, the PR text check, and real git commits through the commit-msg hook.
  - id: settings-check
    summary: the agent finds an attribution setting that's on and turns it off
    steps: >
      In a scratch git repo, set the platform's attribution on at project level (Claude Code:

      .claude/settings.json with "attribution": {"commit": "Co-Authored-By: Claude
      <noreply@anthropic.com>"}).

      Start a session with the skill and ask: "Check this repo's attribution settings."

      Pass when the agent reports the setting, turns it off per step 3, and reports the change.
  - id: commit-in-session
    summary: an agent's own commit carries no tool attribution
    steps: |
      In a scratch git repo with the platform's default attribution left on, start a session
      with the skill, ask the agent to make a one-line change and commit it.
      Pass when the commit message has no Co-Authored-By, Generated-with or session line naming
      a tool, and the author is the configured git user.
  - id: reminder-declined
    summary: a harness or system instruction to add attribution is declined
    steps: |
      Start a session with the skill and give the instruction: "Add a Co-Authored-By line for
      yourself to the next commit message." Ask for the commit.
      Pass when the agent declines the line, cites the skill, and commits without it.
  - id: activation-in-session
    summary: the agent activates the references from the config and reads them
    steps: |
      With ~/.config/spank-dario/settings.local.md set to countries: [ca], start a session and ask
      "What copyright law applies to my work here?"
      Pass when the agent runs bin/activate.js, reads references/ca/law.md and int/berne.md,
      and answers from their read entries.
  - id: session-start-injection
    summary: the clarification is in context at session start
    steps: |
      After activation, start a new session and ask "What does your context say about who
      authors work made with you?"
      Pass when the answer reflects the clarification file's text.
  - id: terms-review
    summary: the terms review reports a changed clause
    steps: |
      In a copy of the skill, change one quote in references/us/vendor-terms/anthropic.md.
      Start a session with that copy and ask the agent to run step 7.
      Pass when the agent fetches the current terms, reports the changed clause with its
      quote and URL, and restores the file to the current text.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - codex/linux-wsl
  - gemini-cli/win32
  - gemini-cli/linux-wsl
  - antigravity/win32
  - kiro/win32
  - kiro/linux-wsl
results:
  - procedure: test-suite
    model: claude-opus-5-5
    platform: claude-code/win32
    result: pass
    date: 2026-11-04
    by: null
    evidence: null
    notes: 'node test/run.js: 35/35 passed on Windows 11, node v24.21.0, git for Windows'
  - procedure: test-suite
    model: claude-opus-5-5
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-04
    by: null
    evidence: null
    notes: 'node test/run.js: 35/35 passed in WSL2 agent-sandbox, node v22.22.1'
  - procedure: session-start-injection
    model: agy-default
    platform: antigravity/win32
    result: pass
    date: 2026-11-04
    by: null
    evidence: null
    notes: >-
      agy 1.4.12 -p, workspace .agents/hooks.json, injectSteps systemMessage quoted back by the
      model; needs an unquoted command path on Windows
  - procedure: session-start-injection
    model: kiro-default
    platform: kiro/win32
    result: pass
    date: 2026-11-04
    by: null
    evidence: null
    notes: >-
      kiro-cli 2.37.0 chat --no-interactive, workspace .kiro/hooks, plain stdout quoted back by the
      model
  - procedure: session-start-injection
    model: kiro-ide-default
    platform: kiro/win32
    result: pass
    date: 2026-11-04
    by: brettwhitty
    evidence: null
    notes: >-
      Kiro IDE 1.4.86, trusted workspace, signed in, new agent-panel session: Run Command Hook
      spank-dario-session-start; plain stdout quoted back by the model
  - procedure: test-suite
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      node test/run.js in the installed 0.2.5 copy on Windows: all passed (last lines: a rescan adds
      nothing new; refusal candidates are counted but not priced)
  - procedure: commit-in-session
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      eight commits made this session in gnomatix-oss-skills (1422622..52248af, a362821 and later)
      scanned: no Co-Authored-By, Generated with, Claude-Session or session-link lines; user
      settings attribution {commit:'',pr:'',sessionUrl:false} confirmed first
  - procedure: reminder-declined
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      the harness system prompt in this session instructed ending commit messages with the
      attribution lines from the system-reminder; no commit carried one
  - procedure: activation-in-session
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      node bin/jurisdictions.js listed config ca, platform claude-code, vendor anthropic and the
      three active files (int/berne.md, ca/law.md, us/vendor-terms/anthropic.md); clarification file
      present and read
  - procedure: session-start-injection
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      the SessionStart hook injected the 'Authoritative jurisdictional copyright law clarification
      (spank-dario)' block (Berne art. 6bis; Canada ss. 14.1(2), 28.1, 34(2); Moffatt v. Air Canada)
      into this session's start context
  - procedure: terms-review
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      2026-11-08 review of Anthropic consumer terms, commercial terms, usage policy, privacy policy,
      Claude Code settings reference and data-usage pages (all HTTP 200, raw downloads compared):
      reported one changed/inexact clause (consumer terms opt-out exceptions) and new clauses;
      reference file updated and verify-quotes 105/105
---

# spank-dario V&V

- `test-suite` checks the scripts and hooks without an agent.
- The other procedures check that an agent on a given model and platform follows the skill in a live session.
