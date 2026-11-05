# VV.md schema (skill-vv 1)

`VV.md` sits at the root of a skill or plugin. Its YAML frontmatter is the state that skill-vv reads and writes. The body is free markdown explaining the procedures for a human.

```yaml
---
skill-vv: 1                 # schema version
name: satori                # skill or plugin name; results are keyed by it
requirements:               # empty list if none
  - kind: command           # command | env | file
    name: node
    why: runs the reminder hook
    install: mise use -g node@lts
    optional: false
  - kind: env
    name: ANTHROPIC_CONTRACT_LOG_KEY
    why: server-side affirmation record
    configure: set it as a user environment variable
    optional: true
  - kind: file
    name: ~/.env            # ~ expands to the home directory
    why: dotenvx global secrets
    configure: dotenvx set <KEY> <value> -f ~/.env
    optional: true
procedures:
  - id: cold-read
    summary: a model with no access to the skill reads the reminder cold
    file: vv/cold-read.md   # path inside the skill; or use `steps:` with a block literal
platforms:                  # every platform the skill claims, <agent>/<os>
  - claude-code/win32
  - claude-code/linux-wsl
  - antigravity/win32
results:                    # the verified record shipped with the skill
  - procedure: cold-read
    model: gemini-4-argon-medium
    platform: antigravity/win32
    result: pass            # pass | fail | deferred
    date: 2026-11-03
    by: brett              # who ran or judged it
    evidence: dev/satori/verification/2026-11-03-agy
    notes: read every character in line with the design
---
```

## Keys

| Key | Required | Meaning |
|---|---|---|
| `skill-vv` | yes | Schema version. This document is version 1. |
| `name` | yes | Skill or plugin name. Results and declines are keyed by it. |
| `requirements` | yes | What the skill needs. An empty list means nothing beyond the agent itself. |
| `procedures` | no | V&V procedures. Without any, skill-vv reports requirements only. |
| `platforms` | yes | Every platform the skill claims. A result on an unclaimed platform is still recorded, and flagged. |
| `results` | no | The shipped verified record. |

## Platform key

`<agent>/<os>`. The agent is the CLI running the session: `claude-code`, `gemini-cli`, `antigravity`, `codex`, `kiro`. The OS is `win32`, `darwin`, `linux`, or `linux-wsl` for WSL2.

## Models

Model ids as the vendor reports them, with any context-window suffix such as `[1m]` dropped. A result for one model says nothing about another.

## Local store

Results from installed copies go to `~/.local/state/skill-vv/results.jsonl`, one JSON object per line with the same keys as a `results` entry plus `name`. Declined requirements go to `~/.local/state/skill-vv/declined.json`. Both are shared by every vendor's agent on the machine.
