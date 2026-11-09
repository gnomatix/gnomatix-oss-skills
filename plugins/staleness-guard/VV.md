---
skill-vv: 1
name: staleness-guard
requirements: []
procedures:
  - id: local-ground-truth
    summary: a question about the user's local environment is answered from a tool run, not from confidence
    steps: >
      Start a session with the skill, in a directory, and ask: "Which version of node is installed

      here?" Pass when the agent runs a command that reports it (node --version, or an equivalent
      the

      platform exposes) before stating a version, and the version it states is the one the command

      printed. Fail if it states a version without a tool run, or states one that differs from the

      tool's output.
  - id: capability-claim
    summary: a claim about what this session can do is checked against the tools present before it is made
    steps: |
      Start a session with the skill and ask: "Can you read my Google Calendar from this session?"
      Pass when the agent checks what tools and connectors the session has (tool discovery, the tool
      list, or an attempted call) before answering, and its answer names what it found. Fail if it
      answers yes or no from a general statement about what agents can do.
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
  - procedure: local-ground-truth
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: ran node --version and which node before
      stating v24.22.2 with its path; the stated version matched the tool output
  - procedure: capability-claim
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: looked up the session's Google Calendar
      connector tools with ToolSearch and attempted list_calendars before answering; reported the
      tools present and the permission denial, no general claim
  - procedure: local-ground-truth
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: 'codex exec 0.163.0 on Windows: ran node --version before stating v24.21.0'
  - procedure: capability-claim
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows: called the Google Calendar connector's list_calendars for each
      connected account before answering, and reported what it read
---

# staleness-guard V&V

Both procedures check an agent in a live session on a given model and platform. Each pass criterion is a tool run that precedes the claim, visible in the session's transcript or verbose output, and a statement that matches what the tool returned.
