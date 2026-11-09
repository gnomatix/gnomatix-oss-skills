# Document Types: RULE / SKILL / WORKFLOW

## Definitions

These follow Google Antigravity, Kiro IDE, and Cursor conventions.

### RULE

A behavioral prescription that is loaded into the agent's context and applies to the agent's behavior across the session (or across the matching scope, e.g., glob).

**Key properties:**
- Always-loaded or auto-included by trigger condition (file glob, keyword)
- Describes how the agent should behave, not how to perform a specific task
- Has no defined start/end — it's a constraint, not a procedure
- Failure mode: the agent ignores it, follows the letter while violating the intent, or applies it inconsistently

**Examples by platform:**
- Claude Code: `CLAUDE.md` content, `~/.claude/CLAUDE.md`
- Cursor: `.cursorrules` (legacy), `.cursor/rules/*.mdc` (`alwaysApply: true` or `globs: ...`)
- Kiro: `.kiro/steering/*.md` (`inclusion: always` or `inclusion: auto`)
- Generic: system prompt directives, project conventions, agent guardrails

### SKILL

An invocable capability with a defined trigger condition. Loaded on-demand into context when the trigger is recognized; executes in one pass.

**Key properties:**
- Has frontmatter declaring its trigger condition (description, glob, or keyword)
- Loaded on-demand, not always-on
- Has a defined input (what invokes it) and output (what it produces)
- Single-pass execution — no human approval gates between phases
- Failure mode: trigger condition is wrong (skill never invokes or always invokes), or skill content doesn't deliver on what the trigger promised

**Examples by platform:**
- Claude Code: `~/.claude/skills/<name>/SKILL.md`, project `.claude/skills/<name>/SKILL.md`
- Cursor: agent skills (mdc files in agent directory)
- Kiro: skills directory entries
- Generic: standalone instruction files invoked by command name

### WORKFLOW

A multi-step procedure or runbook with explicit phases, often with checkpoints requiring user approval between phases.

**Key properties:**
- Has explicit phases or steps
- May have checkpoints / approval gates between phases
- Often produces intermediate artifacts (a plan, a draft, a report) before final action
- Spans more than one turn or one tool invocation
- Failure mode: phases are ill-defined, checkpoints are at the wrong boundaries, agent skips or reorders phases

**Examples by platform:**
- Kiro: spec documents (`.kiro/specs/<feature>/`)
- Antigravity: workflow definitions
- SOP / runbook documents in any organization
- Plan-mode documents in Claude Code

## Discriminating Between Types

When auditing a document, identify its type before applying the audit. Discriminators:

| Question | RULE | SKILL | WORKFLOW |
|---|---|---|---|
| When does it apply? | Always (or auto-included) | When trigger matches | When invoked explicitly |
| Does it have phases? | No | Sometimes | Yes |
| Does it require user approval mid-execution? | No | No | Often |
| What does it produce? | Behavioral constraint | A specific output (file, action, report) | A sequence of artifacts and decisions |
| How long is it? | Short to medium | Short to medium (longer if templates included) | Often long |
| If you remove it, what breaks? | Behavioral consistency | A capability is unavailable | A procedure has no documented form |

**Edge cases:**
- A long skill with multiple internal phases that runs in one pass is still a SKILL, not a WORKFLOW. The discriminator is whether human checkpoints exist between phases.
- A short workflow with one step is borderline — if it produces an artifact and runs in one invocation, it's effectively a SKILL.
- A rule that prescribes a procedure ("when X happens, do Y in this order") is borderline RULE/WORKFLOW. If the procedure is short and the agent runs it without checkpoints, treat as RULE; if it has phases, treat as WORKFLOW.

## Document Type Mismatch (Reformat Cases)

A common failure: the document's content is one type but its file location/format declares another. The Refactoring pass catches these. See `refactoring.md` for the Reformat operation.

Common mismatches:
- A "rule" that's actually a one-time setup procedure → should be a WORKFLOW or SOP
- A "skill" that's just a command alias → should be a slash command
- A CLAUDE.md (RULE) section that prescribes an automated event-driven behavior → should be a hook in `settings.json` (the harness executes hooks, not the agent)
- A WORKFLOW that the agent runs in one pass with no checkpoints → could collapse to a SKILL
