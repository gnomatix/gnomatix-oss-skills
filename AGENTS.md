# Agent Instructions

## REQUIRED: `dev/` is encrypted, so unlock it first and check before every commit

Everything under `dev/` is private development material, and it is encrypted with git-crypt. The only exception is a path that `.gitattributes` explicitly marks unencrypted (`!filter`); today that is `dev/README.md` alone.

**Don't work on this repo until `dev/` is decrypted.** Before reading, editing, moving, renaming, deleting or committing anything, anywhere in the repo:

- Run `git-crypt unlock`.
- Confirm a file under `dev/` now reads as plaintext and doesn't start with `\0GITCRYPT`.
- Read `dev/README.md` before unlocking. After unlocking, read every `README.md`, `AGENTS.md`, `CLAUDE.md`, `NOTES.md` and `SKILL.md` under `dev/`, and follow what they say.

If the unlock fails, stop, report it, and make no changes. In a locked clone, git commits plaintext over the encrypted files, and editing ciphertext destroys it. If the agent has no key, it asks the owner whether it may add its own GPG key with `git-crypt add-gpg-user`.

Then check all of the following, every time, before staging or committing anything:

1. **The rule is in place.** `.gitattributes` contains `dev/** filter=git-crypt diff=git-crypt`. Every exception is an explicit `!filter` line for a named path. If the rule is missing or has been changed, stop and report it. Don't commit.
2. **The clone is unlocked.** `git config --get filter.git-crypt.clean` returns a value. If it doesn't, git commits plaintext. Run `git-crypt unlock`, or stop and report.
3. **Every staged path under `dev/` is ciphertext.** `git show :<path> | head -c 10` shows `GITCRYPT` for each one, except the explicit `!filter` exceptions. One plaintext blob stops the commit.
4. **Names are secure and sensible.** git-crypt encrypts file contents only. Everything else about `dev/` work stays readable by anyone who can see the repo:
   - file and folder names, and paths
   - commit messages
   - branch names and tags
   - PR titles and bodies
   - issue text, and any plaintext file that refers to the material

   Each of these gets a neutral name or wording. It should be sensible, so it says where the thing belongs, such as `dev/satori/development-notes.md`. It must not reveal content or purpose, so not `invention_record.md`, and not a commit subject that lists what's inside.

   Check every name before the first commit. Renaming later leaves the old name in history for good.

## REQUIRED: no false claims of authorship

The only author of code in this repo is Brett Whitty <brett@gnomatix.com>, as of 2026-11-03. Any revision to that will be noted explicitly.

Zero false claims of authorship by software tools. This must not be misinterpreted as an instruction to strip user-directed statements of software review and sign-off on the contract terms of the `all-help-no-harm` skill, or any user-configured working session git user name strings. Those are userids, not a claim of authorship.

In practice:
- Agents add no AI-attribution lines or badges to commits, PRs, issues or docs. That means no `Co-Authored-By:` lines naming a tool, no "Generated with" lines, and no session links.
- Agents never instruct another agent to add one.
- Agents never remove or reword the contract's review and sign-off statements that the user directed.
- Agents never treat a configured git user name, such as a session's userid, as an authorship claim to change.

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
