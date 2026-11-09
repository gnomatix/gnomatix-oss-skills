# Document Refactoring Operations

When auditing a body of related documents (a project's `.kiro/` tree, a `~/.claude/skills/` directory, a `docs/agent/` collection), look at boundary problems across the set, not just within each file.

The five operations: **split**, **join**, **merge**, **clone**, **reformat**.

## Split

One document covers multiple unrelated concerns. Examples:
- Different audiences (user-facing vs agent-facing, dev vs ops)
- Different lifecycles (rarely-changing reference vs frequently-revised checklist)
- Different invocation contexts (always-loaded vs on-demand)
- Different document kinds (a hook crammed into a memory file; a skill embedded in CLAUDE.md)
- Different scopes (one rule that applies broadly + one that applies only in a narrow context)

**Split signal:** the doc's table of contents has sections that no single reader needs together.

## Join

Multiple documents that should be one. Examples:
- Two skills that always invoke together
- Reference content that's been over-fragmented and now requires the reader to hop between files
- A doc that exists only because someone didn't want to edit the parent
- Two short docs in the same scope with the same audience

**Join signal:** to use one of the docs, the reader always needs the other.

## Merge

Overlapping content across multiple docs. Examples:
- Two SOPs that describe the same procedure with subtle drift
- Steering files that contradict each other on the same point
- A general rule and a specific case of the same rule that have diverged

**Merge approach:** choose canonical home; replace duplicate with a pointer or remove entirely. Document which version was authoritative and reconcile any drift before merging.

## Clone

Useful pattern in one place needs to also exist elsewhere. Examples:
- A pattern proven in one project's CLAUDE.md belongs in the user's global CLAUDE.md
- A skill that turned out to be generally useful was authored project-local; should be promoted to global
- A useful template hidden in a SOP should also be a standalone template
- A vendor-specific skill should have a generic version

**Clone vs. import:** if both copies will be edited independently and may diverge, clone. If one is canonical and the other should track it, link/import.

## Reformat

The doc kind is wrong for what it does. Examples:
- A "memory" that prescribes an automated behavior on every event → should be a hook in `settings.json` (the harness, not the agent, executes hooks)
- A "rule" that's actually a one-time setup procedure → should be an SOP / runbook / WORKFLOW
- A "skill" that's just a command alias → should be a slash command or shell alias
- A CLAUDE.md / RULE section that's actually invocable on demand → should be a SKILL
- A "skill" with explicit human-approval phases → should be a WORKFLOW
- A WORKFLOW that runs in one pass with no checkpoints → could collapse to a SKILL

See `doc-types.md` for the discriminators between RULE / SKILL / WORKFLOW.

## Authorization

Refactoring operations modify multiple files and may change a document's invocation semantics. **Do not execute without explicit authorization from the document owner.** The audit pass produces refactor proposals; the owner decides whether to apply.

## Output Format for Refactor Proposals

For each proposed operation:

```
### Refactor: <operation>

**Source:** <file paths>
**Destination:** <file paths or new location>
**Reason:** <one or two sentences>
**Effect on invocation:** <what changes about how the doc is loaded/triggered>
**Risk:** <what could break>
```
