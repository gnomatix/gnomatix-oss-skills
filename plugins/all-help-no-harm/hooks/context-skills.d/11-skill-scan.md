---
name: skill-scan
description: Proactively scan installed skills and MCP servers, surface what's available and unused.
---

# Installed Skills & Tools Scan

At each context-watch checkpoint, enumerate what's available and whether it's being used.

## Scan procedure

1. **Installed plugins**: Read `enabledPlugins` from `~/.claude/settings.json`. Each enabled plugin may provide commands, agents, skills, and hooks.

2. **Available skills**: Use ToolSearch or check the skill list in the system context. For each skill:
   - Is it relevant to current work?
   - Has it been invoked this session?
   - Per the using-superpowers rule: "IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT."

3. **Available MCP tools**: Run `ToolSearch` with broad queries to discover MCP tools not yet used. MCP tools load on demand — schemas aren't available until fetched.

4. **Available agent types**: Check the agent type registry. Specialized agents (Explore, Plan, code-reviewer, silent-failure-hunter, etc.) exist for specific tasks. If the current work matches an agent's description, dispatch it.

5. **CLI tools on PATH**: `git`, `bd`, `mise`, `tea`, `jq`, `gh`, `chezmoi`, `pm2`, `dotenvx`, `curl` — are these being used where appropriate?

## Action

Report findings concisely. For each unused-but-relevant tool: name it, state why it's relevant, use it. Not a report to the user — an action by the model.

Source: superpowers:using-superpowers — "If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill."
