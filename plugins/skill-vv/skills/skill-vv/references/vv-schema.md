# VV.md schema (skill-vv 1)

`VV.md` sits at the root of a skill or plugin. Its YAML frontmatter is the state that skill-vv reads and writes. The body is free markdown explaining the procedures for a human.

```yaml
---
skill-vv: 1                 # schema version
name: update-readme-images  # skill or plugin name; results are keyed by it
requirements:               # empty list if none
  - kind: command           # command | env | file | node-module
    name: node
    why: runs the config resolver and auditor
    install: mise use -g node@lts
    optional: false
  - kind: command
    name: magick
    why: resizes, crops, composites oval PNG32 alpha masks, and measures bytes
    unlocks: local ImageMagick post-processing and automatic 1280x640 OG card generation
    install: mise use -g imagemagick
    optional: true
complements:                # optional list of complementary marketplace plugins
  - plugin: og-social-image
    when_installed: Automatically builds verified 1280x640 (<1 MB) social-preview images in assets/images/.
    when_absent: Runs README banner, sub-panel, and oval-inset curation standalone and skips OG card generation.
procedures:
  - id: resolve-render-draft-and-audit
    summary: automated suite checks style-guide inheritance, oval insets, draft staging, and audit
    steps: |
      Run: node plugins/update-readme-images/test/run.js
      Pass when it prints "all passed".
platforms:                  # every platform the skill claims, <agent>/<os>
  - claude-code/win32
  - claude-code/linux-wsl
  - antigravity/win32
results:                    # the verified record shipped with the skill
  - procedure: resolve-render-draft-and-audit
    model: gemini-3.1-pro
    platform: antigravity/win32
    result: pass            # pass | fail | deferred
    date: 2026-11-10
    by: agy-win11           # who ran or judged it
    evidence: null
    notes: all passed on Windows 11
---
```

## Keys

| Key | Required | Meaning |
|---|---|---|
| `skill-vv` | yes | Schema version. This document is version 1. |
| `name` | yes | Skill or plugin name. Results and declines are keyed by it. |
| `authority` | no | GNOMATIX Documentation Lifecycle sign-off (`Brett Whitty` when approved, or `PENDING MANUAL REVIEW` while unreviewed). |
| `review_status` | no | Release gate status: `APPROVED`, `PENDING`, `REQUIRES_REVISION`, or `DRAFT`. `scripts/build-release-tree.js` holds back net-new non-`APPROVED` plugins and pins non-`APPROVED` edits on already-released plugins to their last approved release tree. |
| `approved_versions` | no | Version pattern(s) cleared for public GitHub release (e.g. `["0.1.*"]`, `["0.2.5"]`, or `[]` / `None`). |
| `requirements` | yes | What the skill needs (`optional: false`) and what optional local tools extend it (`optional: true`, with optional `unlocks` string stating what local functionality is enabled when present). An empty list means nothing beyond the agent itself. |
| `complements` | no | Complementary marketplace plugins (`plugin`, `when_installed`, `when_absent`). `skill-vv status <skill>` resolves each entry against installed peer plugins/skills and reports `mode: "dovetailed"` when installed or `mode: "standalone"` when absent. |
| `procedures` | no | V&V procedures. Without any, skill-vv reports requirements only. |
| `platforms` | yes | Every platform the skill claims. A result on an unclaimed platform is still recorded, and flagged. |
| `results` | no | The shipped verified record. |

## Platform key

`<agent>/<os>`. The agent is the CLI running the session: `claude-code`, `gemini-cli`, `antigravity`, `codex`, `kiro`. The OS is `win32`, `darwin`, `linux`, or `linux-wsl` for WSL2.

## Models

Model ids as the vendor reports them, with any context-window suffix such as `[1m]` dropped. A result for one model says nothing about another.

## Local store

Results from installed copies go to `~/.local/state/skill-vv/results.jsonl`, one JSON object per line with the same keys as a `results` entry plus `name`. Declined requirements go to `~/.local/state/skill-vv/declined.json`. Both are shared by every vendor's agent on the machine.
