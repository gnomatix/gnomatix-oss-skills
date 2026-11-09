# Audit Report Format

Standard output shape for any audit produced by skills in this suite. Keep findings factual. No priority, no recommendation about whether to act on the finding — that is the document owner's call.

## Top-Level Structure

```
# Audit: <path to audited document>

## Stated Intent
<one sentence describing what the document is for>

## Document Type
<RULE | SKILL | WORKFLOW> — <brief justification>

## Reference Exemplar Comparison
<table or prose comparing audited doc to 2+ structurally-proven exemplars>

## Findings on the Audit Checklist
### [Check 1: Surface vs Behavior]
<finding + evidence: file lines, exact phrases>

### [Check 2: Example-as-Definition]
<...>

(...continue through all checks; include "no finding" entries explicitly so the reader knows the check was applied)

## Other Findings
<failures that don't fit any checklist item — name them explicitly>

## Refactoring Findings (if collection audit)
### Refactor: <operation>
<source, destination, reason, effect on invocation, risk>

## Portability Findings (if SKILL or tool-prescribing WORKFLOW)
### Portability: <dimension>
<currently assumes, available alternatives, detection strategy, fallback strategy>

## Surface vs Intent Distinction
**Surface fixes (wording, easy):**
- <list>

**Intent fixes (substantive, may require re-discussion):**
- <list>

## Authorization Note
<who authored the document, whether the auditor has authorization to rewrite, what the auditor did and did not change>
```

## Rules for the Auditor

- **Quote, don't paraphrase.** The exact wording is what's enforced.
- **Cite line numbers or section headers** for every finding.
- **Mark "no finding" explicitly** for each check applied. Silent omission looks like the check wasn't run.
- **Present findings, don't grade.** Avoid "this is bad" or "this is good." State what is and what it implies.
- **Distinguish surface from intent.** Wording fixes are cheap; structural intent fixes need discussion.
- **Don't rewrite without authorization.** Propose. The owner decides.
- **Don't audit your own behavior into the rule.** If the rule applies to you and you've been violating it, the audit isn't the place to confess.
- **Don't add new rules.** The audit surfaces findings about the existing rule, not new rules to adopt.
