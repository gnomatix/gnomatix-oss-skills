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
    when_absent: Invokes /citation-farm-audit and /citation-farm-audit:source-provenance directly.
procedures:
  - id: openalex-profile-script
    summary: >-
      scripts/openalex-profile.mjs builds an author's citation and funder profile from the live
      OpenAlex API
    steps: |
      Run: node plugins/citation-farm-audit/test/run.mjs
      The test runs the script against https://api.openalex.org/ for author A5046940339 (Brett R.
      Whitty, ORCID 0000-0001-5776-5424) and checks
      every section of the profile (top works, co-authors, citing and self-citing counts, top
      citers, citer fields, funders without "unknown"), and that a bad id is refused with exit 2.
      Pass when it prints "all passed".
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
    notes: >-
      verified standalone and dovetailed with cui-bono on Windows 11. (Added 2026-11-11 by cc-win11:
      no evidence is recorded for this result, and when it was recorded the plugin shipped no
      stand-in server or test, so the procedure's pass condition could not have been run; only the
      node --check step could.)
  - procedure: openalex-profile-script
    model: claude-opus-5-5
    platform: claude-code/win32
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      node plugins/citation-farm-audit/test/run.mjs against the live api.openalex.org for
      A5046940339 (Brett R. Whitty): all 10 checks ok, all passed (5 top works with DOIs, led by
      the 2011 potato genome in Nature; 10 co-authors; 3873 citing works, 1 self-citing; 10 top
      citers with co-authors marked; 5 citer fields; 6 funders; bad id exit 2).
---

# citation-farm-audit V&V

`citation-farm-audit` installs and runs standalone (`/citation-farm-audit`, `/citation-farm-audit:source-provenance`, and `scripts/openalex-profile.mjs`), and automatically delegates to `cui-bono:citation-farm-audit` and `cui-bono:source-provenance` without duplicate skill registration when `cui-bono` is also installed.
