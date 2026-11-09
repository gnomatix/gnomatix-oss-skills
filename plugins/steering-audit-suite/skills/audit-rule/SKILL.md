---
name: audit-rule
description: Audit a behavioral RULE document — CLAUDE.md, steering file, system prompt directive, project convention, .cursorrules, .cursor/rules/*.mdc, .kiro/steering/*.md. Catches behavior-vs-surface failures, embedded biases, escape hatches, and other ways the rule can be technically followed while violating its intent. Use when reviewing or revising any document that prescribes always-on or auto-included agent behavior. SKIP for invocable skill files (use audit-skill) or multi-step workflow documents (use audit-workflow).
---

# Audit Rule

Audit a behavioral RULE document. RULEs are always-loaded (or auto-included) prescriptions of agent behavior — distinct from SKILLs (invocable on-demand) and WORKFLOWs (multi-step procedures with checkpoints).

## When to Use

- Reviewing or revising a CLAUDE.md, steering file, system prompt, or behavioral spec
- Drafting new agent rules or organizational standards
- Diagnosing why a rule that appears clear is producing unwanted behavior
- Before adopting a rule wholesale from another project or person

## When NOT to Use

- The document is an invocable skill with frontmatter trigger conditions → use `audit-skill`
- The document is a multi-step procedure with phases and checkpoints → use `audit-workflow`
- The document is one of many related documents and the cross-document structure is in scope → use `audit-collection`

## Workflow

1. **Read the rule in full.** Don't paraphrase. The exact wording is what's enforced.
2. **State the rule's intent in one sentence.** If you can't, the rule has a clarity problem before any of the other checks apply.
3. **Identify the document type.** Confirm it's a RULE (not a SKILL or WORKFLOW). See `../steering-audit-suite/references/doc-types.md` for discriminators.
4. **Read at least two structurally-proven exemplars** of rules in the same vendor format. See `../steering-audit-suite/references/reference-exemplars.md`.
5. **Walk the audit checklist** (15 checks) from `../steering-audit-suite/references/checklist.md`. For each, note specific evidence — line references, exact phrases. Mark "no finding" explicitly for each check applied.
6. **Distinguish surface fixes from intent fixes.** Some findings are wording issues; some indicate the rule's intent is unclear or contested.
7. **Produce the audit report** in the format defined in `../steering-audit-suite/references/output-format.md`.
8. **Do not rewrite without authorization.** Present findings; let the author decide.

## Skip the Portability Pass

RULEs prescribe behavior, not tools. Skip the portability/graceful-degradation audit (that's for SKILLs and tool-prescribing WORKFLOWs).

## Reference Files

When in this repo, read the shared/ content for full details:
- `../steering-audit-suite/references/checklist.md` — the 15 checks
- `../steering-audit-suite/references/doc-types.md` — RULE vs SKILL vs WORKFLOW
- `../steering-audit-suite/references/reference-exemplars.md` — finding exemplars per vendor
- `../steering-audit-suite/references/output-format.md` — report shape

When installed standalone (copied out of the repo), the SKILL.md is the canonical reference. Inline the shared content if needed.

## Anti-Patterns

- Don't audit your own session behavior into the rule. If the rule applies to you and you've been violating it, the audit isn't the place to confess.
- Don't gut the original wording in the audit output. Quote it; don't replace it.
- Don't make stylistic preference findings. Audit for behavior leakage, not aesthetics.
- Don't add new rules. The audit surfaces findings about the existing rule, not new rules to adopt.
- Anti-patterns and the audit checklist are **non-exhaustive** — see `../steering-audit-suite/references/checklist.md` and use the "Other Findings" section of the report for issues outside the enumerated checks.

## Resilience to Correction

If the document owner contests a finding, quote the finding back with the owner's response in the audit record. Do not silently drop a contested finding; do not double down without engaging with the owner's reasoning.
