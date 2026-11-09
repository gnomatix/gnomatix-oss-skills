# Reference Exemplars

When auditing a user-authored document, read at least two structurally-proven examples of the same kind for reference. Don't copy them — diagnose what makes them work and check whether the user-authored doc shares those properties.

"Structurally-proven" usually means published / widely-installed / authored by the platform vendor — but a well-regarded community example serves the same purpose.

## Where to Find Reference Exemplars

### Claude Code

- **Built-in skills** surfaced in the available-skills system reminder (e.g. `update-config`, `simplify`, `claude-api`, `review`, `security-review`, `find-skills`)
- **Installed plugin skills** under `~/.claude/plugins/marketplaces/claude-plugins-official/` (when present)
- **Skill marketplaces:** skills.sh, anthropics/skills, vercel-labs/agent-skills
- **Anthropic documentation** on Claude Code skills, hooks, agents, and slash commands

### Cursor

- **Cursor docs** on `.cursorrules` and `.cursor/rules/*.mdc` formats
- **Public Cursor rules collections** on GitHub (search "awesome-cursor-rules" or similar)
- **Project-shipped rules** in popular open-source projects that have committed `.cursor/rules/`

### Kiro IDE

- **Kiro built-in steering files** if installed
- **Kiro spec templates** for workflow exemplars
- **Documented Kiro convention** in Kiro's published docs

### Google Antigravity

- Format research pending. When working on Antigravity exemplars, document findings in `steering-audit-suite/design-notes/antigravity-format.md`.

### Generic / Cross-vendor

- **AGENTS.md** — emerging cross-vendor convention used by OpenAI Codex, Sourcegraph Cody, and others
- **CONTRIBUTING.md** style guides for the prescriptive-doc patterns they use

## What to Look For in an Exemplar

- **Frontmatter shape** — which fields, what they describe, how the description is phrased to match user intent rather than internal structure
- **Trigger conditions** — when to use, plus (in better exemplars) when NOT to use, sometimes explicit SKIP rules
- **Length and depth** — well-constructed skills favor short focused content; long ones earn their length with concrete templates or worked examples
- **Templates, output formats, worked examples** — does the exemplar show what success looks like?
- **Tool-call and file-edit boundaries** — how does it handle authorization, side effects, destructive operations?
- **Graceful degradation** — what happens when the assumed environment isn't present?

## What to Check the User-Authored Doc Against

- Does the description tell a future user when to invoke the skill, or does it describe internal mechanics?
- Is the trigger condition something a model can recognize from a user message?
- Does it include both positive triggers ("use when…") and negative ones ("skip when…")?
- Is the body proportional to the value? Long with no payoff is a smell.
- Does it produce an observable output? (Behavior change, file write, report)

## Anti-Pattern: Cargo-Culting from Exemplars

Don't copy structure from a manufacturer exemplar without understanding why it works there. The exemplar is a reference, not a template to clone. A skill that mimics the surface form of `find-skills` without addressing a real user-recognizable trigger is just paperwork.

## Fallback: Zero Exemplars Available

If you cannot find any exemplars for the document type and platform you're auditing:
- Note the absence in the audit output
- Skip the Reference Exemplar comparison section
- Proceed with the rest of the audit (checklist, refactoring, portability)
- Recommend that the project commission or commit at least one reference example
