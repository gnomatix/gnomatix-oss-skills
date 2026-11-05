# deps: dependency check and install

One mechanism for every plugin in this marketplace.

## 1. Declare what a plugin needs

List each requirement in the plugin's `VV.md` (the skill-vv format; see `plugins/skill-vv`).
skill-vv checks the requirements when a session starts, and offers the `install` line for any
that are missing:

```yaml
---
skill-vv: 1
name: gnox
requirements:
  - kind: command          # command, env, file or node-module
    name: mise
    why: runs the mise MCP server
    install: curl -fsSL https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh
    optional: false
---
```

When the install is one command (`mise use -g node@lts`, `mise use -g npm:js-yaml@4.1.0`), that
command is the `install` line.

## 2. Anything more than one command gets a script here

`deps/<tool>.sh` (Linux and macOS, POSIX sh) and `deps/<tool>.ps1` (Windows PowerShell 5.1 and
later), each keeping the same contract:

- **Check first.** Look for the tool on PATH and in its usual install locations. If a copy
  exists, list each one with its version and stop. Ask before installing another copy, and
  only in an interactive session; without one, never, unless `--yes` / `-Yes` is given.
- `--check` / `-Check`: report only. Exit 0 if found, 1 if not.
- **One opinionated install route** per platform: the one that has proved reliable, not a
  menu of fallbacks.
- Download completely before running anything, retry a failed install twice, and verify the
  result by running the tool.
- Change shell startup files only on request (`--activate` / `-Activate`), and never add a
  line that is already there.

## Tools

| Tool | Linux / macOS | Windows |
|---|---|---|
| mise | `deps/mise.sh`: the official installer, `https://mise.run` (SHA-256 checked against the release), into `~/.local/bin` | `deps/mise.ps1`: `winget install jdx.mise` |

Run one from a clone of this repository, or straight from GitHub:

```
curl -fsSL https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.sh | sh
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/main/deps/mise.ps1 | iex"
```
