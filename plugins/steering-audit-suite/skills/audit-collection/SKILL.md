---
name: audit-collection
description: Audit a body of related agent documents — a `.kiro/` tree, a `~/.claude/skills/` directory, a project's `docs/agent/` collection, or any directory of RULE/SKILL/WORKFLOW files. Runs per-document audits plus the cross-document refactoring pass (split / join / merge / clone / reformat). Use when reviewing the structure of a documentation set, not just one file. For single-document audits, use audit-rule, audit-skill, or audit-workflow directly.
---

# Audit Collection

Audit a body of related agent documents. Runs per-document audits and adds the cross-document refactoring pass.

## When to Use

- Reviewing a project's `.kiro/` tree, `~/.claude/skills/` directory, or `docs/agent/` collection
- Reorganizing an organization's standard SOPs / agent rules
- Migrating documents between vendors (Claude Code → Cursor, etc.) and want to consolidate
- Onboarding a new agent doc collection from another project / person

## When NOT to Use

- Auditing one document → use `audit-rule`, `audit-skill`, or `audit-workflow` directly
- Just looking up which checklist applies → read `../steering-audit-suite/references/`

## Workflow

1. **Enumerate the documents in scope.** List every file that prescribes agent behavior (RULE, SKILL, WORKFLOW), with paths.
2. **Classify each document by type.** Use discriminators in `../steering-audit-suite/references/doc-types.md`. Note any document whose type doesn't match its file location/format (Reformat candidate).
3. **Per-document audit pass.** For each document, invoke the appropriate single-doc audit (audit-rule, audit-skill, or audit-workflow). Collect findings.
4. **Cross-document refactoring pass.** Apply the operations in `../steering-audit-suite/references/refactoring.md`:
   - **Split:** any document covering multiple unrelated concerns?
   - **Join:** any documents that always need to be read together?
   - **Merge:** any documents with overlapping or contradictory content?
   - **Clone:** any pattern that should also live elsewhere (e.g., promoted from project to global)?
   - **Reformat:** any document whose content is one type but its format/location declares another?
5. **Conflict and overlap analysis:**
   - Do any two documents contradict each other?
   - Do any two documents share the same trigger condition (would both invoke for the same input)?
   - Are any documents orphaned (referenced nowhere, invoked never)?
6. **Vendor-mismatch analysis** (if the collection spans vendors):
   - Are documents intended to apply across vendors duplicated correctly?
   - Are documents in vendor-specific formats but with vendor-agnostic content (clone candidates for other vendors)?
7. **Produce the consolidated audit report** in the format defined in `../steering-audit-suite/references/output-format.md`. Per-doc findings + cross-doc refactor proposals.

## Output Structure

```
# Collection Audit: <root path>

## Inventory
| Path | Type | Vendor | Status |
|---|---|---|---|

## Per-Document Findings
### <path>
<findings from audit-rule/skill/workflow>

(...)

## Cross-Document Findings
### Refactor: <operation>
<source, destination, reason>

### Conflicts
<list of contradictions or overlapping triggers>

### Orphans
<documents referenced nowhere or never invoked>

## Vendor Coverage
<which document patterns exist in which vendor formats; gaps>
```

## Reference Files

- `../steering-audit-suite/references/doc-types.md`
- `../steering-audit-suite/references/checklist.md`
- `../steering-audit-suite/references/refactoring.md`
- `../steering-audit-suite/references/portability.md`
- `../steering-audit-suite/references/reference-exemplars.md`
- `../steering-audit-suite/references/output-format.md`

## Anti-Patterns

- Don't execute split/join/merge/clone/reformat operations without explicit authorization. Propose them. The author decides.
- Don't propose vendor coverage for collections that are intentionally single-vendor.
- Don't surface every per-document finding as a collection-level concern. Per-doc findings stay per-doc; the collection pass focuses on cross-document structure.
- Anti-patterns and the audit checklist are **non-exhaustive** — see `../steering-audit-suite/references/checklist.md` and use the "Other Findings" section of the report for issues outside the enumerated checks.

## Resilience to Correction

If the document owner contests a finding, quote the finding back with the owner's response in the audit record. Do not silently drop a contested finding; do not double down without engaging with the owner's reasoning.

## Standalone-Mode Note

When this SKILL.md is copied out of the repo (e.g., to `~/.claude/skills/audit-collection/`), the relative references to `../steering-audit-suite/references/` will not resolve. In that case, inline the relevant shared content into the skill body, or maintain the suite as a checked-out directory the user can point at.
