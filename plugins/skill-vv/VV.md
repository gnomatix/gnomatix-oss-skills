---
skill-vv: 1
name: skill-vv
requirements:
  - kind: command
    name: node
    why: runs the CLI and the hook
    install: mise use -g node@lts
    optional: false
  - kind: node-module
    name: js-yaml
    why: reads and writes VV.md frontmatter
    install: mise use -g npm:js-yaml@4.1.0
    optional: false
procedures:
  - id: cli-suite
    summary: the CLI's automated tests pass
    steps: |
      Run: node --test <skill-vv>/test/skill-vv.test.js
      Pass when every test passes.
  - id: check-in-session
    summary: the agent finds, surfaces and records VV.md state in a live session
    file: vv/check-in-session.md
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - gemini-cli/win32
  - antigravity/win32
  - codex/win32
  - kiro/win32
results:
  - procedure: check-in-session
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      user-invoked /gnox:skill-vv in session 75792833: ran check, surfaced the report (satori
      cold-read; skill-vv cli-suite and check-in-session; spank-dario seven procedures; gnox VV.md
      unreadable), ran the spank-dario test suite and recorded five evidenced results into the
      source VV.md with --into, and recorded this result
  - procedure: cli-suite
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      node --test plugins/skill-vv/test/skill-vv.test.js from the repo source tree on Windows, Node
      24.21.0: 14 tests, all pass. The same suite run from the installed copy
      (~/.claude/plugins/cache/.../skill-vv/0.2.4) fails 2 of 14 because the test resolves the
      sibling satori VV.md as ../satori/VV.md, a source-tree path that the cache layout
      (gnomatix-oss-skills/satori/<version>/) does not have; defect recorded in beads and
      dev/skill-vv/bugs/
---

# skill-vv V&V

Two procedures.

- `cli-suite` checks the CLI itself.
- `check-in-session` checks that an agent on this model and platform follows the workflow: it runs `check`, asks about requirements first and V&V second, and records the outcome.
