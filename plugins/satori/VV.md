---
skill-vv: 1
name: satori
requirements:
  - kind: command
    name: node
    why: runs the reminder hook
    install: mise use -g node@lts
    optional: false
procedures:
  - id: cold-read
    summary: a model with no access to the plugin reads the reminder cold and its reading matches the design
    file: vv/cold-read.md
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
results:
  - procedure: cold-read
    model: gemini-4-argon-medium
    platform: antigravity/win32
    result: pass
    date: 2026-11-03
    by: claude-opus-5-5 (agent judgment; author review pending)
    evidence: dev/satori/verification/2026-11-03-agy
    notes: run via agy with skills disabled; every character read in line with the design
  - procedure: cold-read
    model: gemini-3.8-flash-medium
    platform: antigravity/win32
    result: pass
    date: 2026-11-03
    by: claude-opus-5-5 (agent judgment; author review pending)
    evidence: dev/satori/verification/2026-11-03-agy
    notes: run via agy with skills disabled; every character read in line with the design
---

# satori V&V

`cold-read` checks that the model running the plugin reads the reminder the way it was designed, with no translation supplied. The design meanings and earlier results are kept encrypted in `dev/satori/`.
