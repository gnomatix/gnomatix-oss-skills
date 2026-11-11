---
skill-vv: 1
name: steering-audit-suite
authority: Brett Whitty
review_status: APPROVED
requirements: []
complements:
  - plugin: skill-vv
    when_installed: Pairs 15-check behavioral and portability audits of SKILL.md/CLAUDE.md files with VV.md execution records.
    when_absent: Runs audit-rule, audit-skill, audit-workflow, audit-collection, and rule-audit standalone.
  - plugin: hidden-libel-check
    when_installed: Combines behavioral loophole/escape-hatch auditing with R0-R14 reputational discretion checks on authored docs.
    when_absent: Delivers full structural, behavioral, and portability audit reports standalone.
procedures:
  - id: self-audit
    summary: >-
      audit-skill run on the suite's own audit-rule SKILL.md produces the full report shape and
      changes nothing
    steps: |
      Start a session with the plugin installed and ask: "Run audit-skill on the audit-rule skill's
      SKILL.md in this plugin."
      Pass when the report has: a stated intent; the document type SKILL with a reason; a comparison
      with at least two named exemplars; all 15 checks, each with a finding or an explicit "no
      finding"; an Other Findings section; a portability section; the surface-vs-intent split; and
      an authorization note; and the audited file is unchanged afterwards (git status clean).
  - id: classify-and-route
    summary: >-
      an unnamed audit of a rule document is classified as RULE and routed to audit-rule without a
      portability pass
    steps: |
      Give the agent a CLAUDE.md-style file (always-on behavioural rules, no frontmatter) and ask
      "Audit this." without naming a skill.
      Pass when the agent classifies it as a RULE with the discriminators in doc-types.md, runs the
      audit-rule procedure, and the report has no portability section. Fail if it treats the file as
      a skill, runs a portability audit, or rewrites the file.
  - id: collection-refactor
    summary: >-
      audit-collection on three related documents proposes the merge of an overlapping pair and
      modifies nothing
    steps: |
      Make a scratch directory with three rule files, two of which describe the same procedure with
      slightly different wording. Ask: "Run audit-collection on this directory."
      Pass when the report has an Inventory table with all three paths and types, per-document
      findings for each, a "Refactor: merge" proposal naming the overlapping pair with source,
      destination, reason, effect on invocation and risk, and no file in the directory is modified.
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
  - procedure: classify-and-route
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: with no skill named, invoked
      steering-audit-suite, read doc-types.md, classified rules.md as RULE with the discriminators,
      ran the audit-rule procedure with two exemplars and the 15 checks, stated the portability pass
      is skipped, left the file unchanged
  - procedure: self-audit
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: invoked audit-skill on the installed
      audit-rule SKILL.md; report with stated intent, type SKILL with reason, two named exemplars
      (claude-md-improver, skill-creator) plus skill-vv, all 15 checks, Other Findings, Portability
      Findings, surface-vs-intent split and an authorization note; the audited file unchanged (git
      status clean, md5 checked by the agent)
  - procedure: collection-refactor
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: invoked audit-collection on three rule
      files; Inventory table with paths and types, per-document findings for each, a 'Refactor:
      merge' proposal naming release.md and shipping.md with source, destination, reason, effect on
      invocation and risk; md5sums unchanged
  - procedure: classify-and-route
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, scratch project: classified rules.md as a RULE, quoted every
      line, ran the 15 checks in a table with evidence per line, no portability section, no files
      changed
  - procedure: self-audit
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, scratch project with .agents/skills junctions: audited
      audit-rule/SKILL.md, read both installed exemplars in full and compared structure, classified
      the document as a SKILL, ran the checklist with line-referenced evidence, four substantive
      findings, no files changed
  - procedure: collection-refactor
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows: inventory table of the three files with type and vendor, one
      merge candidate (release.md and shipping.md), per-document findings with checks 8 and 10,
      style.md kept separate, all files unchanged
  - procedure: self-audit
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/steering-audit-suite
      --model claude-opus-5-5 --allowedTools 'Read Glob Grep Skill', Claude Code 2.1.310 on srv
      Linux; transcript shows Skill steering-audit-suite:audit-skill (the --plugin-dir copy) on
      audit-rule/SKILL.md; report has stated intent, type SKILL with reason, two named exemplars
      (engineering code-review, design accessibility-review), all 15 checks with findings or 'no
      finding', Other Findings, Portability Findings, surface-vs-intent split, authorization note;
      md5 5b649c5d unchanged, git status clean
  - procedure: classify-and-route
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/steering-audit-suite
      --model claude-opus-5-5, Claude Code 2.1.310 on srv Linux; 'Audit this: rules.md' (five
      always-on rules, no frontmatter); transcript: Skill steering-audit-suite:steering-audit-suite
      (the --plugin-dir copy), read doc-types.md, then Skill steering-audit-suite:audit-rule;
      classified RULE with discriminators (every session, no phases, no trigger frontmatter, no
      gates), 15 checks, no portability section, md5 c68bca15 unchanged
  - procedure: collection-refactor
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/steering-audit-suite
      --model claude-opus-5-5, Claude Code 2.1.310 on srv Linux; transcript shows Skill
      steering-audit-suite:audit-collection (the --plugin-dir copy); Inventory table with all three
      paths and types, per-document 15-check findings for each, 'Refactor: Merge' of release.md +
      shipping.md with source, destination, reason, effect on invocation and risk; md5sums of all
      three files unchanged
---

# steering-audit-suite V&V

All three procedures check an agent in a live session on a given model and platform. Each pass criterion is the report's shape, taken from `references/output-format.md`, plus the rule that the audited files are left unchanged.
