---
skill-vv: 1
name: gnox
requirements:
  - kind: command
    name: mise
    why: runs the mise MCP server this plugin registers (mise --cd <project> mcp)
    install: "Linux/macOS: curl -fsSL https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh ; Windows: powershell -NoProfile -ExecutionPolicy Bypass -Command \"irm https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.ps1 | iex\""
    optional: false
---

# gnox: verification and validation

Requirements only, for now; skill-vv offers the install line above when `mise` is missing.
