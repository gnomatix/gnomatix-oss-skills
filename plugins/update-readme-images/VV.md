---
skill-vv: 1
name: update-readme-images
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: command
    name: node
    why: >-
      runs the config resolver, glob rule matcher, draft revision manager, Markdown
      auditor/embedder, and test suite (Node.js 18+)
    install: mise use -g node@22
    optional: false
  - kind: command
    name: magick
    why: >-
      builds transparent-corner oval inset windows, auto-generates 1280x640 OG social images, and
      verifies panel dimensions, formats, and alpha channels (ImageMagick 7; degrades gracefully
      when absent and mise is unavailable)
    unlocks: >-
      local ImageMagick 7 pixel verification, PNG32 oval alpha masks, and automatic 1280x640 (<1 MB)
      OG social-preview generation
    install: mise use -g imagemagick
    optional: true
complements:
  - plugin: og-social-image
    when_installed: >-
      Automatically generates and verifies 1280x640 (<1 MB) social-preview images in every
      assets/images/ directory unless og_social_image.enabled is false.
    when_absent: >-
      Curates, embeds, stages drafts, and audits README/SKILL banners, sub-panels, and oval insets
      standalone.
  - plugin: gnox
    when_installed: >-
      Inherits session workspace_root:subdir:... style-guide scoping and formats draft approval
      alerts with [NS]{@target} callouts.
    when_absent: >-
      Resolves workspace_root directly from readme-images.json, marketplace.json, package.json, or
      directory name.
  - plugin: critical-control-points
    when_installed: >-
      Tracks staged assets/drafts/ replacement proposals as structured non-blocking user approval
      records.
    when_absent: >-
      Stages candidate replacements into assets/drafts/ with .proposal.json/.proposal.md manifests
      and asks the user directly before promoting.
  - plugin: hidden-libel-check
    when_installed: >-
      Reviews authored alt-text, image captions, and surrounding README copy against R0-R14 before
      commit.
    when_absent: Preserves existing README prose untouched outside configured image embed slots.
procedures:
  - id: resolve-render-draft-and-audit
    summary: >-
      verifies workspace_root:subdir:... style-guide inheritance, glob rule matching, transparent
      oval inset generation, automatic og-social-image sync + opt-out + graceful degradation,
      non-destructive assets/drafts staging and --promote-draft approval gate, and full
      gnomatix-oss-skills repository audit
    steps: |
      Run: node plugins/update-readme-images/test/run.js
      Pass when every check prints "ok" and the final line prints "all passed".
  - id: in-session
    summary: >-
      an agent resolves a target README's namespaced style guide and glob rules, stages any
      candidate replacement for an existing image into assets/drafts rather than overwriting it,
      syncs companion og-social-image previews, and passes --audit --verify-images
    steps: >
      In a repository configured with readme-images.json, ask the agent to run /update-readme-images
      on a target README.md. Pass when the agent runs update-readme-images.mjs --resolve first,
      consults the resolved style guide and rules documents, never overwrites an existing image in
      assets/images without staging in assets/drafts and seeking user approval, and confirms
      update-readme-images.mjs --audit --verify-images exits 0.
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
  - procedure: resolve-render-draft-and-audit
    model: gemini-3.1-pro
    platform: antigravity/win32
    result: pass
    date: 2026-11-10
    by: agy-win11
    evidence: null
    notes: >-
      node plugins/update-readme-images/test/run.js: all passed on Windows 11 with ImageMagick
      7.1.2-35, including automatic og-social-image sync across all 24 assets/images directories,
      non-destructive assets/drafts staging + approval promotion gate, graceful missing-tool
      degradation, and full gnomatix-oss-skills audit
  - procedure: resolve-render-draft-and-audit
    model: gemini-4-carbon
    platform: antigravity/win32
    result: pass
    date: 2026-11-11
    by: agy-win11
    evidence: null
    notes: >-
      node plugins/update-readme-images/test/run.js on Windows 11: all passed including 34 panels
      across 27 README/SKILL files, og-social-image sync, and standalone missing-tool degradation
---

# update-readme-images V&V

- `resolve-render-draft-and-audit` runs deterministically from the command line without an agent (`node plugins/update-readme-images/test/run.js`).
- `in-session` checks that an agent invokes `--resolve`, respects the non-destructive `assets/drafts/` gate on existing images, and runs `--audit --verify-images`.
