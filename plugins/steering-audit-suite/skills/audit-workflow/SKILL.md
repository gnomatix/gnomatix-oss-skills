---
name: audit-workflow
description: Audit a WORKFLOW document — multi-step procedure, runbook, SOP, Kiro spec, Antigravity workflow, plan-mode document. Runs the standard audit checklist plus phase-boundary checks (are checkpoints meaningful, are approval gates correctly placed) plus portability audit (workflows often invoke specific tools). Use when reviewing or revising any document that prescribes a multi-step procedure with phases. SKIP for always-on rules (use audit-rule) or single-pass invocable skills (use audit-skill).
---

# Audit Workflow

Audit a WORKFLOW document. WORKFLOWs are multi-step procedures with explicit phases, often with human-approval checkpoints between phases — distinct from RULEs (always-on, no procedure) and SKILLs (invocable, single-pass).

## When to Use

- Reviewing or revising a runbook, SOP, or operational procedure
- Reviewing a Kiro spec document (`.kiro/specs/<feature>/`)
- Reviewing an Antigravity workflow definition
- Reviewing a plan-mode document with explicit phases
- Drafting a new workflow before adopting it as procedure

## When NOT to Use

- The document is always-on / auto-included → use `audit-rule`
- The document is invocable in one pass with no checkpoints → use `audit-skill`
- Multiple related workflows are in scope and cross-doc structure matters → use `audit-collection`

## Workflow

1. **Read the workflow in full.**
2. **State the workflow's intent in one sentence.**
3. **Confirm document type is WORKFLOW.** A workflow with no real checkpoints may be a SKILL (use `audit-skill`); a workflow that's mostly behavioral guidance may be a RULE (use `audit-rule`).
4. **Map the phases.** List the distinct phases, the artifacts each produces, and the checkpoints between them.
5. **Read at least one structurally-proven exemplar** of a workflow in the same vendor format.
6. **Walk the audit checklist** (15 checks) from `../steering-audit-suite/references/checklist.md`.
7. **Phase-boundary checks** (workflow-specific):
   - Is each phase's input clearly defined?
   - Is each phase's output a concrete artifact (file, decision, report)?
   - Is each checkpoint a real decision point, or is it ceremonial?
   - Can a phase be skipped or reordered? Is that explicitly allowed or accidental?
   - Is approval requested at the right point (after the cost-of-redo becomes high, before destructive action)?
   - Are roles / authorities defined for who can approve each checkpoint?
8. **Run the portability audit** from `../steering-audit-suite/references/portability.md` if the workflow invokes specific tools.
9. **Distinguish surface fixes from intent fixes.**
10. **Produce the audit report** in the format defined in `../steering-audit-suite/references/output-format.md`.

## Workflow-Specific Failure Modes

In addition to the general checklist, watch for:

- **Ceremonial checkpoints** — approval gates that produce nothing the approver actually evaluates
- **Phase amnesia** — the workflow assumes context from earlier phases without recording it in an artifact
- **Hidden roll-back assumption** — the workflow assumes failed phases can be retried with no state cleanup
- **Mode confusion** — the workflow runs in plan mode, agent mode, or interactive mode but doesn't say which
- **Checkpoint-as-shutdown** — the workflow stops at a checkpoint and has no way to resume
- **Implicit ordering** — the order of phases matters but isn't enforced; an agent might run them concurrently or out of order

## Reference Files

When in this repo:
- `../steering-audit-suite/references/checklist.md`
- `../steering-audit-suite/references/doc-types.md`
- `../steering-audit-suite/references/portability.md`
- `../steering-audit-suite/references/reference-exemplars.md`
- `../steering-audit-suite/references/output-format.md`

## Anti-Patterns

- Don't propose collapsing a multi-phase workflow into a single-pass skill without checking why the phases exist. The checkpoints often reflect human-judgment requirements that can't be automated.
- Don't make stylistic findings about phase naming or ordering aesthetics. Audit for whether the phases produce the right artifacts and whether the checkpoints are meaningful decision points.
- Anti-patterns and the audit checklist are **non-exhaustive** — see `../steering-audit-suite/references/checklist.md` and use the "Other Findings" section of the report for issues outside the enumerated checks.

## Resilience to Correction

If the document owner contests a finding, quote the finding back with the owner's response in the audit record. Do not silently drop a contested finding; do not double down without engaging with the owner's reasoning.

## Standalone-Mode Note

When this SKILL.md is copied out of the repo (e.g., to `~/.claude/skills/audit-workflow/`), the relative references to `../steering-audit-suite/references/` will not resolve. In that case, inline the relevant shared content into the skill body, or maintain the suite as a checked-out directory the user can point at.
