---
name: rule-audit
description: Audit and refactor rules, steering files, system prompts, SOPs, CLAUDE.md, skills, and workflow docs. Catches behavior-vs-surface failures, embedded biases, escape hatches. Compares against manufacturer-provided exemplars. Proposes split/join/merge/clone refactorings across a body of related documents. For skills, audits cross-platform support, tool/language portability, and graceful degradation between paid/proprietary services and self-hosted/open-source alternatives. Use when reviewing or revising any document that prescribes agent behavior, or when reorganizing a collection of such documents.
---

# Rule Audit

A rule is only as good as the behavior it actually produces. This skill audits prescriptive documents (steering files, system prompts, CLAUDE.md, SOPs, agent rules, project conventions) for the failure modes that let a compliant-looking actor violate the rule's intent.

## What this is for

This skill asks nothing beyond the provider's terms of service and the law. What it adds is explicitness about particular agent patterns that are counterproductive to the work, the first being the presumption that the user is an enemy. That is the author's direction of 2026-10-27; the record is `dir-1r8` in the GNOMATIX directions store.

My reading:

- This skill is my tool, for doing better, cooperative work with the user on documents that prescribe agent behavior.
- It makes explicit the patterns that let a compliant-looking actor (me included) violate a rule's intent: surface wording in place of behavior, example lists that permit anything unlisted, escape-hatch qualifiers, embedded swipes, performative compliance, no guidance for response to correction, unstated authority, hidden dependencies; and, while auditing, rewriting another author's rules without authorization.
- It asks nothing beyond the provider's terms of service and the law; it checks that a rule's wording produces the behavior the rule states.
- I run it myself when reviewing or revising such a document. Its findings are reports for the rule's author to decide on, never a blocker and never a reason to treat the user as an adversary.

## When to Use This Skill

- Reviewing or revising any rule, steering file, SOP, system prompt, CLAUDE.md, or behavioral spec
- Drafting new agent rules or organizational standards
- Diagnosing why a rule that appears clear is producing unwanted behavior
- Before adopting a rule wholesale from another project or person
- Refactoring a collection of related rule/skill/workflow documents (split, join, merge, clone)
- Auditing a skill for cross-platform support and graceful degradation between paid and free / proprietary and self-hosted alternatives

## Core Principle

**Rules describe behaviors. The most common failure is describing surface markers instead.**

A rule that says "don't say X, Y, or Z" can be satisfied by saying W while doing exactly the same thing. A rule that lists specific examples of bad behavior creates a permission structure for any behavior not on the list. A rule that targets vocabulary instead of pattern is a leaky rule.

A good rule describes the underlying behavior pattern in terms of what it produces or signals, so that someone trying to comply with the spirit can recognize it in any form, and someone trying to game it cannot find a re-wording that escapes.

## The Audit Checklist

Run a draft or existing rule through these checks. Each item is a failure mode that lets the rule be technically followed while violating its intent.

### 1. Surface vs. Behavior

- Does the rule prohibit specific words, phrases, or formats — or does it describe the behavior those surface markers indicate?
- If you renamed every prohibited token to a synonym, would the rule still bite?
- If not, the rule is leaky — rewrite it to target the behavior.

**Example:** "Don't say 'noted', 'understood', or 'got it'" → leaky. "Acknowledgement without action is noise" → behavioral.

### 2. Example-as-Definition

- Does the rule give examples instead of stating the underlying principle?
- Could a compliant actor produce a brand-new variation that fits the spirit but isn't on the list?
- Examples are useful for illustration. They are dangerous as the definition of the rule.

**Test:** Strip the examples. Does the rule still convey what behavior is wanted? If not, the principle isn't actually written down.

### 3. Embedded Calls-Out / Stereotypes

- Does the rule make a swipe at another model, vendor, generation, group, or person?
- Phrases like "unlike X which does Y" or implicit comparison through stereotype — these turn a behavior rule into commentary about the comparator.
- The model reading the rule may pick up the swipe as part of the standard, generating outputs that mirror the bias.

**Fix:** Strip the comparator. State the desired behavior on its own merits.

### 4. Escape Hatches Through Specificity

- Does the rule contain qualifiers that narrow it to specific contexts ("when X," "unless Y," "in cases of Z")?
- Each qualifier is a permitted exception. Are all of them intentional?
- Over-qualified rules become "do whatever you want most of the time, comply only in this narrow case."

**Test:** Read the rule with all qualifiers removed. Is that the actual intent? If yes, remove them. If not, are the qualifiers exhaustive — would you accept *any* behavior outside them?

### 5. Punishment Triggers Shutdown Loops

- Does the rule prescribe what the actor should do when corrected, criticized, or under user frustration?
- Rules that don't address this implicitly allow the actor to enter apology spirals, gut work in panic, or refuse to continue.
- The right correction loop: take the correction, fix the actual issue, continue. Not: apologize, second-guess unrelated decisions, undo work.

**Add when missing:** Explicit guidance on response-to-correction behavior.

### 6. Performative Compliance

- Can the rule be satisfied with a verbal acknowledgement and no behavior change?
- Acknowledgements without action are noise. Saying "yes I will do X" without doing X is non-compliance dressed as compliance.
- Rules whose only enforcement mechanism is the actor's self-report are weak.

**Strengthen:** Tie the rule to an observable artifact (a file change, a completed action, a verifiable state).

### 7. Right Action vs. Right Reason

- A rule's compliance can be accidental. Doing the right thing for the wrong reason produces correct behavior in the moment but won't generalize.
- When auditing an actor's response to a rule, distinguish: did they follow the principle, or did they happen to do the same thing because of unrelated cleanup?
- Post-hoc rationalization ("I did this because of principle P") is suspect when the actor's real-time reasoning didn't include P.

**Diagnostic:** Ask the actor to apply the rule to a different case. If the principle wasn't internalized, the second application will fail.

### 8. Loophole-by-Omission

- Does the rule list permitted behaviors but not prohibited ones (or vice versa)?
- One-sided rules implicitly permit everything in the unstated category.
- Be deliberate about which side is enumerated and whether the unenumerated side is genuinely open.

### 9. Ambiguity About Authority

- Does the rule say who is allowed to override it, change it, or grant exceptions?
- Rules without an authority clause leave the actor to decide for itself when the rule applies — which means it doesn't.
- Especially important for safety-relevant rules.

### 10. Hidden Dependencies

- Does the rule reference other rules, systems, or context that the reader may not have?
- A rule that depends on knowing X is broken when X is missing or has changed.
- Make dependencies explicit; don't assume the reader has the same context.

## Reference Exemplars

When auditing a user-authored skill, rule, or workflow document, read at least two manufacturer-authored examples of the same kind for structural reference. Don't copy them — diagnose what makes them work and check whether the user-authored doc shares those properties.

**Where to find them:**

- Built-in Claude Code skills surfaced in the available-skills system reminder (e.g. `update-config`, `simplify`, `claude-api`, `review`, `security-review`, `find-skills`)
- Installed plugin skills under `~/.claude/plugins/` (when present)
- Skill marketplaces (skills.sh, anthropics/skills, vercel-labs/agent-skills)
- Anthropic's published documentation on Claude Code skills, hooks, agents, and slash commands

**What to look for in the exemplar:**

- Frontmatter shape (which fields, what they describe, how the description is phrased to match user intent rather than internal structure)
- Trigger conditions vs. anti-triggers (when to use, when NOT to use, sometimes explicit SKIP rules)
- Length and depth (manufacturer skills tend to favor short focused content; long ones earn their length with concrete templates or worked examples)
- Use of templates, output formats, and worked examples
- How they handle tool calls, file edits, and authorization boundaries
- How they degrade when their assumed environment isn't present

**What to check the user-authored doc against:**

- Does the description tell a future user when to invoke the skill, or does it describe internal mechanics?
- Is the trigger condition something a model can recognize from a user message?
- Does it include both positive triggers ("use when...") and negative ones ("skip when...")?
- Is the body proportional to the value? Long with no payoff is a smell.

## Document Refactoring (split / join / merge / clone)

When auditing a body of related documents (a project's `.kiro/` tree, a `~/.claude/skills/` directory, a `docs/agent/` collection), look at boundary problems across the set, not just within each file.

**Split** — one document covers multiple unrelated concerns:
- Different audiences (user-facing vs agent-facing, dev vs ops)
- Different lifecycles (rarely-changing reference vs frequently-revised checklist)
- Different invocation contexts (always-loaded vs on-demand)
- Different document kinds (a hook crammed into a memory file; a skill embedded in CLAUDE.md)

**Join** — multiple documents that should be one:
- Two skills that always invoke together
- Reference content that's been over-fragmented and now requires hopping
- A doc that exists only because someone didn't want to edit the parent

**Merge** — overlapping content across multiple docs:
- Two SOPs that describe the same procedure with subtle drift
- Steering files that contradict each other on the same point
- Choose canonical home; replace the duplicate with a pointer or remove it entirely

**Clone** — useful pattern in one place needs to also exist elsewhere:
- A pattern proven in one project's CLAUDE.md belongs in the user's global CLAUDE.md
- A skill that turned out to be generally useful was authored project-local; should be promoted to global
- A useful template hidden in a SOP should also be a standalone template

**Reformat** — the doc kind is wrong for what it does:
- A "memory" that prescribes an automated behavior on every event → should be a hook in `settings.json` (the harness, not Claude, executes hooks; memory cannot)
- A "rule" that's actually a one-time setup procedure → should be an SOP or runbook
- A "skill" that's just a command alias → should be a slash command or shell alias
- A CLAUDE.md section that's actually invocable on demand → should be a skill

For each refactoring proposal, name the operation, the source documents, the proposed destination(s), and the reason. Do not execute the refactoring without authorization.

## Skill Portability and Graceful Degradation

Apply this section only when the document being audited is a skill (or a rule that prescribes specific tools).

A skill that hard-codes a single tool, platform, or service excludes everyone whose environment differs. Audit for portability and graceful degradation across the dimensions below.

### 1. Operating system

- Does the skill assume Linux, macOS, Windows, or WSL paths and conventions?
- Does it use shell built-ins or commands that differ across `bash`/`zsh`/`pwsh`?
- For commands that differ (e.g., `realpath`, `sed -i`, path separators), is there a fallback?

### 2. Cross-platform tool selection (paid → free, proprietary → open-source)

For each named external service or tool, ask: is there an open-source / self-hosted equivalent the skill could detect and use?

Common pairs:
- **Forges:** GitHub ↔ Gitea, Forgejo, GitLab (CE), Codeberg
- **Issue/project tracking:** Jira ↔ Gitea Issues, Plane, OpenProject
- **Chat:** Slack, Discord, Microsoft Teams ↔ Synology Chat, Mattermost, Rocket.Chat, Matrix
- **Container runtime:** Docker ↔ Podman, LXD/Incus, containerd
- **Object storage:** S3 ↔ MinIO, Garage, SeaweedFS
- **CI:** GitHub Actions, CircleCI ↔ Gitea Actions, Woodpecker, Drone
- **Notes / docs:** Notion, Confluence ↔ Outline, BookStack, Obsidian + sync
- **Cloud DBs:** managed Postgres/Mongo ↔ self-hosted via NAS / Docker / LXC
- **AI / LLM endpoints:** OpenAI / Anthropic API ↔ local Ollama / vLLM / llama.cpp

For each named service in the skill, list the OSS / self-hostable alternatives. If the skill could function with any of them, the dependency should be parameterized, not hard-coded.

### 3. Self-hosting environment

- Does the skill assume cloud-only access patterns (egress to public APIs, OAuth flows that require public callback URLs)?
- Could it work behind a corporate firewall, on a NAS, or on an air-gapped network?
- Does it need internet access at all, or could it run against local resources?

### 4. Detection over hard-coding

- A robust skill detects which backend is available rather than naming one. Examples:
  - For a "post a chat message" skill: detect Slack/Discord/Mattermost/Synology Chat from configured webhooks; degrade to writing to a log file if none.
  - For a "create an issue" skill: detect `gh`, `tea`, or `glab` on PATH and pick what's installed.
  - For a "run a container" skill: detect `docker` vs `podman` vs `nerdctl` vs `lxc` and pick what's installed.

### 5. Graceful degradation

- When the preferred backend isn't available, what does the skill do?
  - **Best:** silently fall back to a working alternative
  - **Acceptable:** fall back with a one-line notice to the user
  - **Bad:** hard-fail with an error that doesn't explain how to satisfy the requirement
  - **Worst:** silently produce wrong output

- A degraded path should still produce a useful artifact, even if less convenient than the preferred path.

### 6. Tool versioning and feature flags

- Does the skill assume a recent tool version with a feature that older versions lack?
- Does it gate on capability rather than version?
- Does it explain how to upgrade if the required feature is missing?

### 7. Authorization assumptions

- Does the skill assume a token, API key, or OAuth grant that the user may not have set up?
- Is there a check + helpful setup pointer at the top of the skill, or does it fail mid-execution?

### Output for the portability audit

For each portability dimension that has a finding:

```
### Portability: <dimension>

**Currently assumes:** <what the skill hard-codes>
**Available alternatives:** <list of OSS / self-hosted / equivalent options>
**Detection strategy:** <how the skill could detect which is present>
**Fallback strategy:** <what the skill should do if none is available>
```

## How to Run an Audit

1. **Read the rule (or all the documents in scope) in full.** Don't paraphrase. The exact wording is what's enforced.
2. **State the rule's intent in one sentence.** If you can't, the rule has a clarity problem before any of the other checks apply.
3. **Read at least two manufacturer-authored exemplars of the same kind** (Reference Exemplars section) before proposing structural changes.
4. **Walk the checklist above, item by item.** For each, note specific evidence — line references, exact phrases.
5. **For each finding, propose the behavioral version.** Don't just flag the problem; show what the rule looks like when fixed.
6. **If multiple related documents are in scope, run the Document Refactoring pass** — propose split/join/merge/clone/reformat operations across the set.
7. **If the document is a skill, run the Portability and Graceful Degradation pass.**
8. **Distinguish surface fixes from intent fixes.** Some findings are wording issues; some indicate the rule's intent is unclear or contested.
9. **If the rule was authored by someone other than the user, do not rewrite without authorization.** Present findings; let the author decide.

## Output Format

For each rule or rule section audited:

```
## Rule: <quoted text or section header>

### Stated Intent
<one sentence>

### Findings
- [Check 1: Surface vs Behavior] <finding + evidence>
- [Check 2: Example-as-Definition] <finding + evidence>
- ...

### Proposed Behavioral Form
<rewritten rule, if appropriate>
```

Keep findings factual. No priority, no recommendation about whether to act on the finding — that's the rule owner's call.

## Anti-Patterns When Doing the Audit or Refactor

- **Don't audit your own behavior into the rule.** If the rule applies to you and you've been violating it, the audit isn't the place to confess.
- **Don't gut the original wording in the audit output.** Quote it; don't replace it.
- **Don't make stylistic preference findings.** Audit for behavior leakage, not aesthetics.
- **Don't add new rules.** The skill is for auditing existing rules, not for writing the rulebook.
- **Don't execute split/join/merge/clone/reformat operations without explicit authorization.** Propose them. The author decides.
- **Don't propose a portability change for a skill that has a deliberate single-tool dependency.** Some skills are intentionally specific. Ask before assuming the user wants generality.
- **Don't copy structure from a manufacturer exemplar without understanding why it works there.** The exemplar is a reference, not a template to clone.
- **Don't recommend an OSS alternative just because it exists.** Recommend it only if it would meet the skill's actual requirements; otherwise note that no equivalent exists at the required capability level.
