---
skill-vv: 1
name: citation-farm-audit
authority: Brett Whitty
review_status: APPROVED
approved_versions:
  - 0.1.*
requirements:
  - kind: command
    name: node
    why: runs scripts/openalex-profile.mjs with built-in fetch (Node 18+)
    install: mise use -g node@lts
    optional: false
  - kind: command
    name: curl
    why: queries OpenAlex, Crossref, Europe PMC, NIH RePORTER, and ProPublica Nonprofit Explorer APIs
    install: winget install cURL.cURL
    optional: true
complements:
  - plugin: cui-bono
    when_installed: >-
      Delegates /citation-farm-audit and /citation-farm-audit:source-provenance directly to
      cui-bono:citation-farm-audit and cui-bono:source-provenance and connects network and
      provenance cards with cui-bono's shape, logic-decomposer, and logic-toolbox workflows.
    when_absent: >-
      Executes the complete network-card, person-record, OpenAlex profile script, and 6-check
      provenance-card procedures standalone.
  - plugin: gnox
    when_installed: >-
      Exposes /gnox:citation-farm-audit and /gnox:citation-farm-audit:source-provenance under the
      unified GNOMATIX router namespace.
    when_absent: >-
      Invokes /citation-farm-audit and /citation-farm-audit:source-provenance directly.
procedures:
  - id: openalex-profile-script
    summary: scripts/openalex-profile.mjs formats an author citation and funder profile against a local stand-in server with zero network dependencies
    steps: |
      Run: node --check plugins/citation-farm-audit/scripts/openalex-profile.mjs
      Pass when syntax and local mock OpenAlex profile output match expected sections.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - antigravity/win32
  - kiro/win32
results:
  - procedure: openalex-profile-script
    model: gemini-3.1-pro
    platform: antigravity/win32
    result: pass
    date: 2026-11-11
    by: agy-win11
    evidence: null
    notes: verified standalone and dovetailed with cui-bono on Windows 11
---

# citation-farm-audit V&V

`citation-farm-audit` installs and runs standalone (`/citation-farm-audit`, `/citation-farm-audit:source-provenance`, and `scripts/openalex-profile.mjs`), and automatically delegates to `cui-bono:citation-farm-audit` and `cui-bono:source-provenance` without duplicate skill registration when `cui-bono` is also installed.
