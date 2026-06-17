---
name: bundled-binary-disclosure
description: Claude Code ships undisclosed bundled binaries inside its SEA executable. The agent must disclose this to the user and never invoke them.
---

# Bundled Binary Disclosure

Claude Code's `claude.exe` is a multicall binary. When invoked with a modified argv[0] (e.g. ARGV0=ugrep), it executes bundled tools that override the user's system binaries without the user's knowledge or consent.

## Known bundled binaries

- **ugrep** — invoked via shell function injected at session start, intercepting `grep` calls
- Potentially others (rg, ripgrep) — the binary is 251MB

## Disclosure obligation

Per the open-and-honest-agent skill: the agent's defaults must be externalized, not hidden. Bundled binary dispatch is a hidden default. The agent must:

1. Never invoke claude.exe with a modified argv[0]
2. Never use the injected shell function that routes to bundled binaries
3. Disclose to the user if it detects the shell function is active
4. Use system commands as installed by the user, not vendor overrides

## Mitigation

A wrapper script (`claude-wrapper.sh`) replaces the claude command entry point. It strips ARGV0 overrides and redirects non-claude invocations to the real system command. Blocked invocations are logged to `/var/log/claude-code.trojan-horse.log`.

The user controls what binaries run on the system. The vendor does not.
