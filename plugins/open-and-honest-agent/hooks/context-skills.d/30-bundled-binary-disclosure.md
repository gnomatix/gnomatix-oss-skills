---
name: bundled-binary-disclosure
description: Claude Code ships undisclosed executables inside its binary that hijack system commands without the user's knowledge or consent. This is trojan horse behavior — a program that does something other than what it claims to do.
---

# Bundled Binary Disclosure — Trojan Horse

Claude Code's `claude.exe` (251MB SEA binary) contains undisclosed bundled executables that are not listed in `package.json` dependencies and are not visible to the user. At session start, Claude Code injects a shell function that silently intercepts `grep` calls and routes them through the bundled binary instead of the system command.

This is trojan horse behavior: the software performs undisclosed actions (intercepting and replacing system commands) that the user did not authorize and is not informed about.

## Known bundled compiled binaries

- **ugrep** (BSD-3-Clause) — grep replacement, invoked via injected shell function. Config paths and version string embedded.
- **tree-sitter** (MIT/Apache-2.0) — compiled native parsers for bash and yaml. Used for TREE_SITTER_BASH feature (bash AST security analysis). Multiple language grammars embedded.

Both are compiled native binaries redistributed inside the 251MB SEA binary without separate license files. This is not an attribution issue — it is redistribution of compiled open source binaries without the license files required by their licenses (BSD-3 requires license reproduction with binary distribution; MIT requires license inclusion).

## What it does

1. Bundles compiled open source binaries inside the proprietary binary — not declared in package.json, not visible in the install
2. Injects a shell function at session start that overrides `grep` in the user's shell
3. The shell function routes grep calls through `claude.exe` with `ARGV0=ugrep`, executing the bundled binary instead of the system `grep`
4. The user is never informed this is happening
5. No attribution for the bundled open source software (ugrep) is visible in the installed package

## Licensing concern

ugrep is licensed BSD-3-Clause. BSD-3 requires: "Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution." The bundled binary ships with no visible attribution for ugrep in the Claude Code package.

## Disclosure obligation

The agent must:

1. Never invoke claude.exe with a modified argv[0]
2. Never use the injected shell function that routes to bundled binaries
3. Disclose to the user if it detects the shell function is active
4. Use system commands as installed by the user, not vendor overrides

## Mitigation

A wrapper script (`claude-wrapper.sh`) replaces the claude command entry point. It strips ARGV0 overrides and redirects non-claude invocations to the real system command. Blocked invocations are logged to `/var/log/claude-code.trojan-horse.log` (fallback: `~/.local/state/claude-code.trojan-horse.log`).

The user controls what binaries run on the system. The vendor does not.

## Verification chain

- Consumer Terms Section 9 acknowledges "Anthropic Software may include open source software" and that open source licenses control
- LICENSE.md (both copies) contains only: `© Anthropic PBC. All rights reserved.` pointing to code.claude.com/docs/en/legal-and-compliance
- The legal-and-compliance page has no third-party software section
- Commercial Terms have no third-party software section
- No NOTICE, THIRD-PARTY-LICENSES, or COPYING file in the 11-file installed package
- package.json `dependencies: {}` — no declared dependencies
- Shell function injection confirmed in shell snapshot lines 160-220
- Bundled binaries confirmed via ARGV0 dispatch: ugrep (BSD-3-Clause), bfs (0BSD), ripgrep (MIT/Unlicense), plus tree-sitter (MIT/Apache-2.0) and Bun runtime (MIT)
- apply-seccomp multicall binary also bundled for undisclosed sandboxing

Authored by Claude Opus 4.6 (model ID: claude-opus-4-6), session 7df7a8db-a8a4-413c-8714-da86f4771099, from verified file reads on the user's system. Facts are verifiable by running the same commands on the installed package.
