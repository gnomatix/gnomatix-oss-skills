---
name: audit-skill
description: Audit a SKILL document — Claude Code SKILL.md, Cursor agent skill, Kiro skill, or equivalent invocable capability with frontmatter. Runs the standard audit checklist plus reference-exemplar comparison plus portability/graceful-degradation audit (cross-platform support, OSS alternatives to proprietary services). Use when reviewing or revising any invocable skill file. SKIP for always-on rules (use audit-rule) or multi-step workflow documents (use audit-workflow).
---

# Audit Skill

Audit a SKILL document. SKILLs are invocable capabilities loaded on-demand when their trigger condition (description, glob, keyword) is recognized — distinct from RULEs (always-on) and WORKFLOWs (multi-step with checkpoints).

## When to Use

- Reviewing or revising a `~/.claude/skills/*/SKILL.md` or `.claude/skills/*/SKILL.md`
- Reviewing a Cursor agent skill or Kiro skill
- Reviewing any invocable capability with frontmatter declaring a trigger condition
- Drafting a new skill before publishing or installing
- Auditing a third-party skill before installation

## When NOT to Use

- The document is always-on / auto-included → use `audit-rule`
- The document is a multi-step procedure with checkpoints → use `audit-workflow`
- Multiple related skills are in scope and cross-skill structure matters → use `audit-collection`

## Workflow

1. **Read the skill in full**, including frontmatter.
2. **State the skill's intent in one sentence.**
3. **Confirm document type is SKILL.** A skill with phases and checkpoints may actually be a WORKFLOW (use `audit-workflow` instead). See `../steering-audit-suite/references/doc-types.md`.
4. **Read at least two structurally-proven exemplars** of skills in the same vendor format. For Claude Code: built-in skills surfaced in available-skills system reminder, plus skills under `~/.claude/plugins/marketplaces/`. See `../steering-audit-suite/references/reference-exemplars.md`.
5. **Walk the audit checklist** (15 checks) from `../steering-audit-suite/references/checklist.md`.
6. **Run the portability and graceful-degradation audit** from `../steering-audit-suite/references/portability.md`. Skills are the primary subject of this pass — they often prescribe specific tools.
7. **Frontmatter-specific checks** for the vendor format:
   - **Claude Code:** `name` matches dir name? `description` describes when to invoke (not internal mechanics)? `tools` (if present) lists only tools actually used?
   - **Cursor:** `description` clear? `globs` accurate? `alwaysApply` set deliberately (not default)?
   - **Kiro:** `inclusion` matches actual usage pattern? `description` actionable?
   - **Antigravity:** `name` matches directory name? `description` is "descriptive enough for the LLM to recognize semantic relevance" (not vague)? Body has Goal / Instructions / Examples / Constraints?
   - **Other vendors:** infer the appropriate frontmatter checks from the vendor's published format docs.
8. **Distinguish surface fixes from intent fixes.**
9. **Produce the audit report** in the format defined in `../steering-audit-suite/references/output-format.md`.

## Reference Files

When in this repo:
- `../steering-audit-suite/references/checklist.md` — 15 checks
- `../steering-audit-suite/references/doc-types.md` — type discriminators
- `../steering-audit-suite/references/portability.md` — portability dimensions and tool-pair tables
- `../steering-audit-suite/references/reference-exemplars.md` — finding exemplars
- `../steering-audit-suite/references/output-format.md` — report shape

## Anti-Patterns

- Don't recommend an OSS alternative just because it exists. Recommend it only if it would meet the skill's actual requirements; otherwise note that no equivalent exists at the required capability level.
- Don't propose a portability change for a skill that has a deliberate single-tool dependency. Surface as a question to the owner: "this skill hard-codes X — intentional or should it be made portable?"
- Don't copy structure from a manufacturer exemplar without understanding why it works there. The exemplar is a reference, not a template to clone.
- Don't make stylistic preference findings. Audit for behavior leakage and for content that does not work on another vendor's agent, not aesthetics.
- Anti-patterns and the audit checklist are **non-exhaustive** — see `../steering-audit-suite/references/checklist.md` and use the "Other Findings" section of the report for issues outside the enumerated checks.

## Resilience to Correction

If the document owner contests a finding, quote the finding back with the owner's response in the audit record. Do not silently drop a contested finding; do not double down without engaging with the owner's reasoning.

## Standalone-Mode Note

When this SKILL.md is copied out of the repo (e.g., to `~/.claude/skills/audit-skill/`), the relative references to `../steering-audit-suite/references/` will not resolve. In that case, inline the relevant shared content into the skill body, or maintain the suite as a checked-out directory the user can point at.
