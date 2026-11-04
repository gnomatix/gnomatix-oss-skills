# critical-control-points

An [Agent Skill](https://agentskills.io) for the moment a question surfaces that the agent cannot
settle alone: a decision, an ambiguity, a blocker, an issue, a request relayed from another agent.
The skill is what the agent does at that moment, so that nothing is asked idly, nothing is asked
in prose where it gets dropped, and nothing stops that does not have to.

## What it does

1. **Exhausts the agent's own tools first**: docs, SOPs, memory, the issue tracker, and the
   sibling skills `did-you-rtfm`, `actually-im-the-ahole` and `whacking-day`/`old-willy`.
   If those answer it, there is no question; the agent acts and records what it found.
2. **Captures the point** as one linked issue-tracker record with provenance (what it gates,
   what was already checked, the facts of the situation, pre-answered follow-ups).
3. **Keeps working** on everything the point does not gate. A control point is never reported
   as a blocker.
4. **Has a separate reviewer** write the neutral account of the situation and state it as one
   single question, with no numbered parts and no options chosen by the asker.
5. **Asks the user once**, through the AskUserQuestion tool, or raises it as a discussion
   ("Discuss now or later?"; for a blocker, now), or notifies in one line.
6. **Closes the loop**: the answer goes back onto the record; a standing rule goes into memory.

"Do you want me to do what you told me to do?" is not a control point. New information that
changes the picture is, and goes to the user at once.

## The big red button

The user or any agent can press it when the whole work is wrong: wrong direction, corrupted
data, a premise that invalidates everything in flight. Everything stops at the next safe point,
a P0 record is filed with what is broken and what was stopped, and nothing resumes until the
user says so.

## Contents

| Path | What |
|---|---|
| [`skills/critical-control-points/SKILL.md`](skills/critical-control-points/SKILL.md) | The skill: rules, the procedure, the reviewer prompt, the big red button, the line every dispatched subagent gets. |

No hooks. The skill applies to Claude Code and to any agent that reads the Agent Skills format.

## Install

Claude Code, from the marketplace:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install critical-control-points@gnomatix-oss-skills
```

Other agents: the skill folder is `plugins/critical-control-points/skills/critical-control-points/`;
the repository also exposes it under `.agents/skills/`, `.github/skills/` and `.kiro/skills/` (see
the root README for which platform reads which).

<!-- BEGIN: gnomatix-license-include -->
## License

**[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)** (`PolyForm-Noncommercial-1.0.0`). The source is available, but this is not OSI open source.

Noncommercial use is free under those terms. That includes personal research, study, hobby projects, and use by charitable, educational, public-research, public-safety or health, environmental, and government organizations.

**Commercial use is not permitted without a commercial license from GNOMATIX.** Contact GNOMATIX before any commercial use to arrange either of these:
- an ongoing support and development agreement
- a reasonable one-time usage fee, agreed first and paid through [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

See [`COMMERCIAL.md`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/COMMERCIAL.md) for details. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
