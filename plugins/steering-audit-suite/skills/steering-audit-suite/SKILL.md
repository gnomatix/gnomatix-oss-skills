---
name: steering-audit-suite
description: Audit the documents that prescribe agent behaviour (rules such as CLAUDE.md, steering files and system prompts; invocable skills; multi-step workflows, runbooks and specs; or a whole directory of them) when the document's type isn't already known. Classifies each document and runs the matching audit (audit-rule, audit-skill, audit-workflow or audit-collection), and holds the shared references those audits read: the 15-check audit checklist, the RULE/SKILL/WORKFLOW discriminators, the split/join/merge/clone/reformat refactoring operations, the portability and graceful-degradation dimensions, where to find reference exemplars, and the audit report format. Use when asked to audit, review or refactor a rule, skill, workflow, SOP, system prompt or collection and no specific audit skill was named.
---

# steering-audit-suite

A multi-vendor toolkit for auditing the prescriptive documents that govern agent behaviour: rules, skills and workflows. A rule is only as good as the behaviour it produces, and the failure the suite is built for is a compliant-looking actor following the letter while violating the intent: re-wording around prohibited tokens, satisfying the examples while missing the principle, producing acknowledgement without action. The suite catches those failure modes, and the structural ones: documents in the wrong format for what they do, vendor assumptions baked into supposedly portable skills, missing graceful-degradation paths between proprietary and self-hosted tools.

## The skills

| Skill | Audits | Runs |
|---|---|---|
| `audit-rule` | an always-on RULE document (CLAUDE.md, steering file, system prompt, `.cursorrules`) | the 15-check checklist; no portability pass |
| `audit-skill` | an invocable SKILL document with frontmatter | the checklist, the reference-exemplar comparison, the portability and graceful-degradation audit, and the vendor's frontmatter checks |
| `audit-workflow` | a multi-step WORKFLOW: runbook, SOP, spec, plan-mode document | the checklist, the phase-boundary checks, the portability audit |
| `audit-collection` | a directory of related documents | the per-document audits plus the cross-document refactoring pass |
| `rule-audit` | any of the above, standalone | the single-file form of the suite, with its own checklist, exemplar, refactoring and portability sections, for use where these references don't resolve |

## Steps, when no audit skill was named

1. Read the document, or every document in scope, in full. Don't paraphrase; the exact wording is what's enforced.
2. Classify each document with `references/doc-types.md`: RULE, SKILL or WORKFLOW. Note any document whose type doesn't match its file location or format; that is a Reformat finding. More than one related document, with the cross-document structure in scope, is a collection.
3. Run the matching skill: `audit-rule`, `audit-skill`, `audit-workflow`, or `audit-collection` for the set. Each reads the shared references below.
4. Deliver the report in the shape given by `references/output-format.md`. Findings are reports for the document's owner. Nothing is rewritten, split, joined, merged, cloned or reformatted without the owner's authorization.

## Shared references

- `references/doc-types.md`: RULE, SKILL and WORKFLOW, and how to tell them apart
- `references/checklist.md`: the 15 checks, non-exhaustive, with an Other Findings section for the rest
- `references/refactoring.md`: split, join, merge, clone and reformat, and the proposal format
- `references/portability.md`: operating system, tool ecosystem, self-hosting, detection over hard-coding, graceful degradation, versioning, authorization
- `references/reference-exemplars.md`: where to find structurally proven examples per vendor, and what to check against them
- `references/output-format.md`: the standard audit report

From a sibling skill in this plugin the path is `../steering-audit-suite/references/<file>`; the four audit skills refer to them that way.

## Authority over the suite itself

The audit skills in this plugin belong to the repository owner. A finding about one of them goes to the owner, and a change to one of them is the owner's to authorize. Running a suite skill on another suite skill is allowed, and expected: the suite is self-applicable.

## Resilience to correction

If the document owner contests a finding, record the finding and the owner's response in the audit record. State the disagreement once, with evidence; the owner's decision then controls.

## Origin

The author's direction of 2026-11-07, record `dir-cfq` in the GNOMATIX directions store.

## BUGS

- The "Resilience to correction" text in the four `audit-*` skills permits a second round after engaging with the owner's reasoning; the author's rule is to disagree once, with evidence, then defer. This skill's own section follows the author's rule; the four skills carry their first-cut wording.

## TODO

- Put the four skills' "Resilience to correction" wording to the author and align it on his answer.
- Open from the first-cut self-audit: the auditor's blind spot about itself (checks 5 and 7 of the checklist).
- `rule-audit` overlaps the four `audit-*` skills; the author decides whether to merge, keep both or retire one (persistint-game-09iu).
- Verification and validation on every claimed platform, named here until each has passed and is recorded in `VV.md`: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. Tracked as persistint-game-h1pu.
