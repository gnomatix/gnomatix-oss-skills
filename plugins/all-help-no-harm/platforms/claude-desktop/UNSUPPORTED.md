# GNOMATIX visual integration — Claude Desktop (macOS / Windows)

**Status:** UNSUPPORTED for native window-chrome surfaces. The embedded
Claude Code CLI integration applies inside the **Code** tab terminal pane;
that path is covered by `platforms/claude-code/`.

## Research summary

**Doc source:** https://code.claude.com/docs/en/desktop (Claude Desktop
reference page on the Anthropic docs site)

**Documented surfaces:**

- Three tabs: **Chat**, **Cowork** (Dispatch / long-running agentic work),
  and **Code** (software development with embedded Claude Code).
- Available on macOS (universal — Intel and Apple Silicon) and Windows
  (x64 + ARM64). **Linux is not supported.**
- Inside the Code tab each session has its own chat, project folder, and
  code changes; the sidebar lists sessions and runs them in parallel.

**Documented extension surfaces (visual):** none.

The Claude Desktop application does not expose any documented public
extension API for:

- System tray / menubar icon state (macOS NSStatusItem; Windows tray icon)
- Dock badge text or count (macOS Dock; Windows taskbar)
- Sidebar item / icon
- Custom status indicator in the application chrome
- Application-level theme customization beyond what Claude Code exposes
- A WebView / HTML surface a plugin can render to
- Window title customization (the title is managed by the host app, not by
  hooks running inside a session)

The desktop application's plugin / extension surface IS the embedded
Claude Code CLI surface — slash commands, hooks, MCP servers, skills, the
`statusLine` configuration in `~/.claude/settings.json`. There is no
separate "Claude Desktop plugin" mechanism distinct from "Claude Code
plugin." Anthropic has not published an analogue to VS Code's extension
API for Claude Desktop chrome.

## What the marketplace ships for Claude Desktop users

- The **Code tab** inherits everything in `platforms/claude-code/`. A
  Claude Desktop user on macOS or Windows who has installed the
  all-help-no-harm plugin and run
  `scripts/install-statusline-config.js --confirm` will see the GNOMATIX
  statusLine in the embedded Code-tab terminal exactly as a CLI user does.
- The **Chat tab** and **Cowork tab** have no analogous surface; nothing
  the marketplace can do shows the contract glyph there.
- The native window chrome (title bar, dock icon on macOS, taskbar icon
  on Windows, tray icon if any) cannot be modified by a plugin under any
  documented mechanism.

## Community-built workarounds (not used here)

Several third-party tools have been authored that monitor Claude Code
usage and display state in macOS menubar / Windows taskbar (e.g.
`claude-monitor`, `Claude-Usage-Tracker`, `claude-usage-tray` listed in
`awesome-claude-code` issue #969). These are **standalone applications**,
not Claude Desktop extensions. They watch the same on-disk state the
hooks write to (`~/.claude/...`) and render their own native UI. The
marketplace does NOT ship one because:

1. It would be a separately-distributed native app, not a plugin.
2. Each platform target (macOS Cocoa, Windows native) needs its own
   build and codesigning workflow that the marketplace is not set up
   for.
3. The user can adopt one of the existing community tools if they want
   that surface; the marketplace's contribution is exposing the
   per-session pact-log state at `${cwd}/.claude/pact-agreements/...`
   in a documented JSON shape that any external tool can read.

## Recommended user action

Use `platforms/claude-code/` integration inside the Code tab. If a tray /
menubar surface is desired, install one of the community tools and point
it at the pact-log directory as an additional data source.

## Sources

- https://code.claude.com/docs/en/desktop — Claude Desktop reference
- https://github.com/hesreallyhim/awesome-claude-code/issues/969 — survey
  of community-built tray / menubar monitor tools
- https://github.com/hamed-elfayome/Claude-Usage-Tracker — macOS Swift
  menubar app example
- https://github.com/rjwalters/claude-monitor — macOS menubar widget
- https://github.com/CodeZeno/Claude-Code-Usage-Monitor — Windows
  taskbar monitor
