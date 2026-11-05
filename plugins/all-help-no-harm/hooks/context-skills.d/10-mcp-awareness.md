---
name: mcp-awareness
description: Remind the model what MCP servers are configured and available for the current project.
---

# MCP Server Awareness

At each context-watch checkpoint, verify MCP server availability and use.

## Check

Read `.mcp.json` at the project root (if present) and `~/.claude/settings.json` `mcpServers` section. For each configured server:

1. Is it running? (ToolSearch can discover available MCP tools)
2. Has it been used this session? If not — is there work where it should be?
3. Are credentials current?

## Common MCP servers to check for

- **Gitea MCP** (gitea.gnomatix.com) — issue tracking, wiki, repo management. Source: gnomatix-gitea-mcp. If Gitea issues exist for this project, use them.
- **GitHub MCP** — via `gh` CLI or claude.ai GitHub integration. PR management, issue tracking, code search.
- **Chrome DevTools MCP** — browser automation, screenshots, console access. If UI work is happening, this is available.
- **Beads MCP** — if `bd` is configured, the MCP tools (`ready`, `list`, `show`, `create`, `claim`, `close`, `dep`) are also available as MCP tool calls.

## Action

Report which MCP servers are configured and whether they're being used. If a server is configured but unused and relevant to current work, flag it.
