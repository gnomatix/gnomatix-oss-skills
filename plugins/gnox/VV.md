---
skill-vv: 1
name: gnox
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: command
    name: node
    why: >-
      runs the command router generator and the SessionStart/PostCompact GNOMATIX namespacing and
      topology hook
    install: mise use -g node@22
    optional: false
  - kind: command
    name: mise
    why: starts the safe-mode mise MCP server registered in .mcp.json (mise --cd <project> mcp)
    unlocks: safe-mode MCP inspection of project mise tools/tasks and trusted install_tool provisioning
    install: >-
      Linux/macOS: curl -fsSL
      https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh ;
      Windows: powershell -NoProfile -ExecutionPolicy Bypass -Command "irm
      https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.ps1 | iex"
    optional: true
complements:
  - plugin: skill-vv
    when_installed: >-
      Combines session topology discovery with per-plugin VV.md requirement checks and
      model/platform verification records.
    when_absent: >-
      Injects GNOMATIX Namespacing Convention, active plugin pairings, and detected PATH/mise tools
      standalone.
  - plugin: update-readme-images
    when_installed: >-
      Supplies the session's workspace_root:subdir:... inheritance root and [NS]{@target}
      draft-approval callout format.
    when_absent: Establishes workspace_root:subdir:... scoping for any project config or skill that adopts it.
  - plugin: inaudible-markup
    when_installed: >-
      Aligns CLI-safe [NS]{@target} callouts and silent delimiters with voice-safe structured reply
      formatting.
    when_absent: Applies [NS]{@target} 4-step namespace resolution across standard text replies.
  - plugin: ontology-lookup
    when_installed: Grounds first-mention entities inline using verified Bioregistry «term» [CURIE] tags.
    when_absent: Keeps the «term» [CURIE] syntax reserved for verified identifiers only.
  - plugin: satori
    when_installed: >-
      Pairs Atomic Git-Flow River Steering (short-lived feature/*/bugfix/* branches and
      high-priority merge to develop/main) with per-turn symbolic flow reminders, flagging
      long-lived branches, unpushed worktrees, and unauthorized PRs as observable satori rocks.
    when_absent: Applies Atomic Git-Flow River Steering standalone across session git workflows.
procedures:
  - id: router-in-sync
    summary: every generated /gnox command matches the marketplace's plugins and skills
    steps: |
      From the repository root run node plugins/gnox/scripts/build-commands.js --check. Pass when it
      prints "0 change(s)" and exits 0; fail on any other output or exit code.
  - id: session-namespace-hook
    summary: >-
      hooks/session-namespace.js emits valid GNOMATIX Namespacing Convention and Active Marketplace
      Topology context (both dovetailed and standalone modes) on SessionStart and PostCompact with
      zero child_process usage
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
    notes: 'node plugins/gnox/test/run.js: all passed on Windows 11'
  - procedure: router-in-sync
    model: gemini-4-carbon
    platform: antigravity/win32
    result: pass
    date: 2026-11-11
    by: agy-win11
    evidence: null
    notes: >-
      node plugins/gnox/scripts/build-commands.js --check on Windows 11: 0 change(s); 41 command
      file(s) expected, exit 0
  - procedure: session-namespace-hook
    model: gemini-4-carbon
    platform: antigravity/win32
    result: pass
    date: 2026-11-11
    by: agy-win11
    evidence: null
    notes: >-
      node plugins/gnox/test/run.js on Windows 11: 12/12 checks passed across dovetailed
      multi-plugin, isolated Tier 0 standalone, and cross-CLI .agents/skills modes
  - procedure: session-namespace-hook
    model: gemini-4-carbon
    platform: antigravity/win32
    result: pass
    date: 2026-11-11
    by: agy-win11
    evidence: null
    notes: >-
      13/13 checks passed in plugins/gnox/test/run.js including Atomic Git-Flow River Steering (Be
      the River, Not the Rock) and gnox<->satori complementary pairing
---

# gnox: verification and validation

Two procedures:
- `router-in-sync`: the generated `/gnox:<plugin>` commands match the marketplace, checked by `scripts/build-commands.js --check`.
- `session-namespace-hook`: `hooks/session-namespace.js` injects the GNOMATIX Namespacing Convention and Active Marketplace Topology (both complementary-dovetailed and standalone modes) on `SessionStart` and `PostCompact`, and `skills/gnox/SKILL.md` provides the cross-platform equivalent, checked by `node plugins/gnox/test/run.js`.
