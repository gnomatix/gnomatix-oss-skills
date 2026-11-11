---
skill-vv: 1
name: gnox
requirements:
  - kind: command
    name: node
    why: runs the command router generator and the SessionStart/PostCompact GNOMATIX namespacing hook
    install: mise use -g node@22
    optional: false
  - kind: command
    name: mise
    why: runs the mise MCP server this plugin registers (mise --cd <project> mcp)
    install: >-
      Linux/macOS: curl -fsSL
      https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh ;
      Windows: powershell -NoProfile -ExecutionPolicy Bypass -Command "irm
      https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.ps1 | iex"
    optional: false
procedures:
  - id: router-in-sync
    summary: every generated /gnox command matches the marketplace's plugins and skills
    steps: |
      From the repository root run node plugins/gnox/scripts/build-commands.js --check. Pass when it
      prints "0 change(s)" and exits 0; fail on any other output or exit code.
  - id: session-namespace-hook
    summary: >-
      hooks/session-namespace.js emits valid GNOMATIX Namespacing Convention context
      on SessionStart and PostCompact with zero child_process usage
    steps: |
      From the repository root run node plugins/gnox/test/run.js. Pass when every check prints
      "ok" and the final line prints "all passed".
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
  - procedure: router-in-sync
    model: claude-opus-5-5
    platform: claude-code/win32
    result: pass
    date: 2026-11-10
    by: null
    evidence: null
    notes: >-
      node plugins/gnox/scripts/build-commands.js --check on Windows: 0 change(s); 36 command
      file(s) expected, exit 0
  - procedure: router-in-sync
    model: gemini-3.1-pro
    platform: antigravity/win32
    result: pass
    date: 2026-11-10
    by: agy-win11
    evidence: null
    notes: >-
      node plugins/gnox/scripts/build-commands.js --check on Windows: 0 change(s); 36 command
      file(s) expected, exit 0
  - procedure: session-namespace-hook
    model: gemini-3.1-pro
    platform: antigravity/win32
    result: pass
    date: 2026-11-10
    by: agy-win11
    evidence: null
    notes: "node plugins/gnox/test/run.js: all passed on Windows 11"
---

# gnox: verification and validation

Two procedures:
- `router-in-sync`: the generated `/gnox:<plugin>` commands match the marketplace, checked by `scripts/build-commands.js --check`.
- `session-namespace-hook`: `hooks/session-namespace.js` injects the GNOMATIX Namespacing Convention on `SessionStart` and `PostCompact` and `skills/gnox/SKILL.md` provides the cross-platform equivalent, checked by `node plugins/gnox/test/run.js`.
