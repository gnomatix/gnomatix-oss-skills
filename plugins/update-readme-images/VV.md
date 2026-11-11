---
skill-vv: 1
name: update-readme-images
requirements:
  - kind: command
    name: node
    why: runs the config resolver, glob rule matcher, draft revision manager, Markdown auditor/embedder, and test suite (Node.js 18+)
    install: mise use -g node@22
    optional: false
  - kind: command
    name: magick
    why: builds transparent-corner oval inset windows, auto-generates 1280x640 OG social images, and verifies panel dimensions, formats, and alpha channels (ImageMagick 7; degrades gracefully when absent and mise is unavailable)
    install: mise use -g imagemagick
    optional: true
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
      node plugins/update-readme-images/test/run.js: all passed on Windows 11 with ImageMagick 7.1.2-35,
      including automatic og-social-image sync across all 24 assets/images directories, non-destructive
      assets/drafts staging + approval promotion gate, graceful missing-tool degradation, and full
      gnomatix-oss-skills audit
---

# update-readme-images V&V

- `resolve-render-draft-and-audit` runs deterministically from the command line without an agent (`node plugins/update-readme-images/test/run.js`).
- `in-session` checks that an agent invokes `--resolve`, respects the non-destructive `assets/drafts/` gate on existing images, and runs `--audit --verify-images`.
