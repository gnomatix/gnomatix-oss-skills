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
results: []
---

# skill-vv V&V

Two procedures.

- `cli-suite` checks the CLI itself.
- `check-in-session` checks that an agent on this model and platform follows the workflow: it runs `check`, asks about requirements first and V&V second, and records the outcome.
