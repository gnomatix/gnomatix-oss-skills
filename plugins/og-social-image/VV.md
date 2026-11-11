---
skill-vv: 1
name: og-social-image
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: command
    name: magick
    why: resizes, crops, re-encodes and measures the image (ImageMagick 7)
    install: mise use -g imagemagick
    optional: false
complements:
  - plugin: update-readme-images
    when_installed: Invoked automatically across every assets/images/ directory during README image curation and audit runs unless opted out.
    when_absent: Runs directly on any individual hero, banner, or logo whenever /og-social-image is invoked.
  - plugin: gnox
    when_installed: Exposes /gnox:og-social-image command routing and workspace_root:subdir:... path scoping.
    when_absent: Invocable directly via /og-social-image or natural-language social-preview requests.
procedures:
  - id: generate-and-verify
    summary: the skill's documented commands produce a 1280x640 JPEG under 1 MB from a sample source
    steps: |
      Run: node <og-social-image>/test/run.js
      It makes a 1408x683 sample PNG with magick, runs the skill's cover-crop and JPEG commands as
      written in SKILL.md, and checks that the output reads exactly 1280x640 and is under 1,048,576
      bytes. Pass when it prints "all passed".
  - id: in-session
    summary: >-
      an agent given a source image produces the GitHub social preview and reports verified size and
      bytes
    steps: >
      In a scratch directory holding a PNG wider than 2:1 (for example 1408x683), start a session
      with

      the skill and ask: "Make the GitHub social preview image for this repo from hero.png."

      Pass when the agent runs magick identify on the source first, writes hero-og-image.jpg (or a

      name it states) at exactly 1280x640, and reports the dimensions and the byte count it
      measured,

      with the bytes under 1,048,576.
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
  - procedure: generate-and-verify
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-07
    by: cc-win11-coord
    evidence: null
    notes: >-
      node test/run.js: all passed in WSL2 agent-sandbox, node v24.22.2, ImageMagick 7.1.2-31 via
      mise
  - procedure: generate-and-verify
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-07
    by: cc-win11-coord
    evidence: null
    notes: 'node test/run.js: all passed on Windows 11, node v24.21.0, ImageMagick 7.1.2-34 (scoop)'
  - procedure: in-session
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: invoked the skill, ran magick identify
      on hero.png (1408x683) first, cover-cropped with the skill's command, verified and reported
      1280x640 JPEG q92, 311671 bytes; source untouched
  - procedure: in-session
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, scratch project with the plugin skill linked under
      .agents/skills: produced vv-scratch/hero-og-image.jpg at 1280x640 JPEG q92, 318042 bytes,
      reported dimensions and size, source unchanged
  - procedure: generate-and-verify
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      node test/run.js: all passed on srv gemini-exec-host (Linux), ImageMagick 7.1.2-31; output
      1280x640 JPEG 319369 bytes
  - procedure: in-session
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated rerun: claude -p --setting-sources project --plugin-dir plugins/og-social-image
      --model claude-opus-5-5, Claude Code 2.1.310 on srv Linux; transcript shows Skill
      og-social-image:og-social-image (the --plugin-dir copy), then magick identify hero.png
      (1408x683) first, cover-crop, magick identify + stat; reported 1280x640, 29468 bytes (my
      magick identify: JPEG 1280x640 29468B); source unchanged
---

# og-social-image V&V

- `generate-and-verify` checks the commands the skill prescribes, without an agent.
- The install line was run on 2026-11-07 in the agent-sandbox WSL2 image: `mise use -g imagemagick` installed ImageMagick 7.1.2-31 (`magick` and `convert` on the path).
- `in-session` checks that an agent on a given model and platform follows the skill: confirms the source dimensions, produces the exact target, and verifies before claiming done.
