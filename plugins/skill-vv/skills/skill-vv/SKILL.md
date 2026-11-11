---
name: skill-vv
description: Run this before the first real use of any skill or plugin in a session, and whenever a skill is newly installed, updated, or used on a model or platform it may not have been verified on. It surfaces the skill's requirements (commands, environment variables, files), offers to install or configure anything missing, then checks whether the current model and platform have passed the skill's verification and validation (V&V) and, if not, asks the user whether to run the shipped V&V procedure and records the outcome. Use it for any skill that ships a VV.md file, and also when the user asks whether a skill is verified, set up, or supported on this machine, model or CLI.
---

# skill-vv

Skills are written on one model and platform and then used on many. A skill that works on one model can misread its own instructions on another, and a skill that needs `dotenvx` or an API key fails quietly where those are missing. This skill makes both visible as the first step, before the skill does real work, and keeps a record of what has been verified where.

It works the same on every vendor: the state is a markdown file with YAML frontmatter that any agent can read, and the checks run through a plain Node CLI that any agent can call.

## The record: VV.md

Each skill or plugin that takes part ships a `VV.md` at its root. The YAML frontmatter is the state; the body explains the procedures for a human. The schema is in `references/vv-schema.md`. In short:

- `requirements`: commands, environment variables, node modules or files the skill needs (`optional: false`) or uses to unlock extended local execution (`optional: true` with `unlocks`), each with why and how to install or configure it.
- `complements`: optional list of complementary sibling plugins, naming both the dovetailed behavior (`when_installed`) and the standalone fallback (`when_absent`).
- `procedures`: the V&V procedures, each with an id and the steps or a file that holds them.
- `platforms`: every platform the skill claims to support, as `<agent>/<os>`.
- `results`: the verified record, one entry per procedure, model and platform, with pass or fail, date and evidence.

Results from installed copies go to the user's local store, `~/.local/state/skill-vv/results.jsonl`, because installed copies are replaced on update. Results worth keeping are written back into the skill's source `VV.md`.

## Workflow

Run these in order. Requirements come first, because a V&V run on a skill with missing requirements only measures the missing requirement.

1. **Check.** Run the CLI with this session's model and agent:

   ```
   node <skill-vv>/bin/skill-vv.js check --model <model-id> --agent <agent>
   ```

   `<agent>` is the CLI running this session: `claude-code`, `gemini-cli`, `antigravity`, `codex` or `kiro`. Add `--root <dir>` for skill directories the CLI does not find on its own. It prints, per skill, the unmet requirements and whether V&V is still needed for this model and platform. No output means nothing needs attention.

2. **Requirements.** For each unmet requirement, ask the user, in one question per skill, whether to install or configure it now. Show what it is, why the skill needs it, and the install or configure command from the record. Do what the user agrees to, then re-run `check`. If the user declines one, record it so it is not asked again:

   ```
   node <skill-vv>/bin/skill-vv.js record decline <skill> <requirement>
   ```

3. **V&V.** For each skill that still needs V&V on this model and platform, ask the user whether to run the procedure now. Name the model, the platform, the procedure and what it involves. If the platform is not one the skill claims, say so. If the user says yes, follow the procedure exactly as written, then record the outcome:

   ```
   node <skill-vv>/bin/skill-vv.js record result <skill> <procedure> pass|fail --model <model-id> --agent <agent> --notes "<what was checked>" [--evidence <path>]
   ```

   If the user wants to skip it for now, record `deferred`, which stops the prompt for this model and platform until a pass or fail is recorded.

4. **Failures.** A fail is fixed now, or explained to the user directly in the same turn: what failed, the evidence, what blocks the fix, and what was tried. A BUGS or TODO entry in a file is not an outcome. An open failure gets a beads issue and a bug record under `dev/<skill>/bugs/`, never an entry in the skill's public files.

5. **Keep the record.** When working in a skill's source repo, write passing results back into its `VV.md` with `record result ... --into <path-to-VV.md>`, so the verified record ships with the skill.

## When a skill has no VV.md

Say so, and treat it as unverified on every platform. For a skill under development, add a `VV.md` with its requirements and claimed platforms, write its V&V procedures, and run them on every platform it claims. Platforms not yet run go in a beads issue, not in the skill's files.

## Running the check automatically

When installed as a plugin on harnesses that execute `hooks/hooks.json` (such as Claude Code and compatible plugin runners), the `SessionStart` hook runs `check` and surfaces pending items automatically at session start. When installed as a standalone `SKILL.md` directory (`.agents/skills/skill-vv`, `.github/skills/skill-vv`, `.kiro/skills/skill-vv`) without plugin hooks, add one line to the workspace's instruction file (`AGENTS.md`, `GEMINI.md`, or vendor rules file) telling the agent to run step 1 at session start.
