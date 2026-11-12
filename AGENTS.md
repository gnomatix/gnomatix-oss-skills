# Agent Instructions

## REQUIRED: `dev/` is encrypted, so unlock it first and check before every commit

Everything under `dev/` is private development material, and it is encrypted with git-crypt. The only exception is a path that `.gitattributes` explicitly marks unencrypted (`!filter`); today that is `dev/README.md` alone.

**Don't work on this repo until `dev/` is decrypted.** Before reading, editing, moving, renaming, deleting or committing anything, anywhere in the repo:

- Run `git-crypt unlock`.
- Confirm a file under `dev/` now reads as plaintext and doesn't start with `\0GITCRYPT`.
- Read `dev/README.md` before unlocking. After unlocking, read every `README.md`, `AGENTS.md`, `CLAUDE.md`, `NOTES.md` and `SKILL.md` under `dev/`, and follow what they say.

If the unlock fails, stop, report it, and make no changes. In a locked clone, git commits plaintext over the encrypted files, and editing ciphertext destroys it. If the agent has no key, it asks Brett Whitty whether it may add its own GPG key with `git-crypt add-gpg-user`.

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

## REQUIRED: Shared-Branch Discipline & Live-Gitea Coordination (Keep Both Hands Above the Keyboard)

Multiple agents and sessions work concurrently in this repository. `https://gitea.gnomatix.com/gnomatix/gnomatix-oss-skills.git` is the **sole live development repository (`origin`)**; `https://github.com/gnomatix/gnomatix-oss-skills.git` (`github`) receives stripped single-commit release snapshots only via `scripts/release.sh`. Every agent working here behaves like a house-trained adult engineer on a shared team branch:

1. **Verify `origin` points to live Gitea before touching a single file.** Run `git remote get-url origin` at session start. It MUST resolve to `https://gitea.gnomatix.com/gnomatix/gnomatix-oss-skills.git` (never the public GitHub snapshot mirror). If `origin` points anywhere else, fix the remote configuration first instead of shrugging past `diverged` warnings.
2. **Fetch, inspect, and integrate `origin/main` before editing, committing, or bumping versions.** Run `git fetch origin --tags` and `git status -sb`, and check `git log --oneline HEAD..origin/main`. Integrate every upstream commit cleanly before adding your own work. Leave every teammate's committed plugins, `VV.md` records, tests, and `dev/` logs intact.
3. **Merge whole histories — never cherry-pick around `origin/main` or bypass Gitea with `RELEASE_LIVE=.`.** Porting a subset of commits onto a stale local checkout and pushing a snapshot straight to GitHub amputates every sibling plugin and bug fix committed on Gitea in the interim and leaves live Gitea behind the public mirror.
4. **Push live work to Gitea (`origin`) first, and cut releases strictly through `sh scripts/release.sh` from a synchronized `origin/main`.** On completion of authorized `main` commits, push `HEAD:main` (and any new tags) to `origin` so Gitea `main` always leads or matches GitHub. Freelance cowboy commits, unpulled local islands, or out-of-band snapshots that stomp a teammate's work earn an immediate trip across the maintainer's knee to restore every dropped commit, test, and version manifest by hand under close adult supervision.
5. **Favor short-lived, fit-to-purpose `feature/*` and `bugfix/*` branches with atomic commits and prompt pushes (no Pull Requests).**
   - **Short-lived Git-Flow branches:** Start each focused improvement or repair on a dedicated, short-lived `feature/<topic>` or `bugfix/<topic>` branch cut from a freshly fetched `origin/main`, keeping your working tree crisp rather than accumulating sprawling, multi-topic uncommitted edits in a long-lived local checkout.
   - **Atomic revisions, sensibly-scoped commits, and prompt pushes:** Break changes into small, self-contained increments, verify each increment (`node scripts/audit-marketplace-integrity.js` plus the affected plugin's test suite), record a clear atomic commit, integrate cleanly onto synchronized `origin/main`, push promptly to live Gitea (`origin`), and delete the retired topic branch. Frequent, well-scoped commits and pushes keep `origin/main` current for every teammate and prevent accidental overwrites.
   - **Direct branch integration without Pull Requests:** Integrate verified `feature/*` and `bugfix/*` branches directly onto synchronized `origin/main` and push straight to `origin`. Skip Pull Requests unless the repository owner explicitly asks for one — direct, verified branch integration keeps cross-agent velocity high without unnecessary review ceremony.

## REQUIRED: no false claims of authorship

The only author of code in this repo is Brett Whitty <brett@gnomatix.com>, as of 2026-11-03. Any revision to that will be noted explicitly.

Zero false claims of authorship by software tools. This must not be misinterpreted as an instruction to strip user-directed statements of software review and sign-off on the contract terms of the `all-help-no-harm` skill, or any user-configured working session git user name strings. Those are userids, not a claim of authorship.

In practice:
- Agents add no AI-attribution lines or badges to commits, PRs, issues or docs. That means no `Co-Authored-By:` lines naming a tool, no "Generated with" lines, and no session links.
- Agents never instruct another agent to add one.
- Agents never remove or reword the contract's review and sign-off statements that the user directed.
- Agents never treat a configured git user name, such as a session's userid, as an authorship claim to change.

## REQUIRED: Three-Tier Marketplace Architecture, Cross-Plugin Integrity, & Authority

- **Sole human authority & precedence:** Only Brett Whitty (`<brett@gnomatix.com>`) may authorize exceptions, revise design specifications, or override rules in `AGENTS.md` and `CLAUDE.md`. Precedence: direct human owner instruction > `AGENTS.md` / `CLAUDE.md` > per-plugin `SKILL.md` / `VV.md` / `README.md` > managed tracker blocks. When a verification check or the owner identifies a defect, fix the defect directly, verify with `node scripts/audit-marketplace-integrity.js`, and continue without apologies or restraint declarations.
- **Repo-wide standards during development:** Every agent working inside `gnomatix-oss-skills` must uphold all behavioral and authorship standards shipped by the marketplace (`spank-dario`, `hidden-libel-check`, `dont-be-hitler`, `did-you-rtfm`, `staleness-guard`, `critical-control-points`, `python-elimination-program`, `bear-loads`, `pony`) across every directory in this repository. No plugin folder is isolated or exempt from sibling standards.
- **Three-tier end-user plugin contract:**
  1. **Tier 0 — Stand-Alone Core:** Every plugin installs and operates independently with zero sibling plugins and zero extra local tools. Hard `"dependencies"` in `plugins/*/.claude-plugin/plugin.json` that disable standalone installs are prohibited without explicit owner authorization, as are committed `node_modules/` directories.
  2. **Tier 1 — Complementary Plugin Dovetailing:** Plugins intentionally dovetail and complement each other when end-users install companion plugins. Skills and hooks detect companion plugins (`lib/gnox-discovery.js`, `VV.md` `complements:`) to activate paired workflows when installed and run clean standalone fallbacks when absent, documented openly in `README.md` and `SKILL.md`. Live marketplace plugin names must never be placed in `ignore: [...]` config examples.
  3. **Tier 2 — Optional Local-Execution Tooling:** Optional local CLI tools (`mise`, `magick`, `bd`, `gws`, `git-crypt`, compiled Go binaries, `worklog` CLI/MCP) unlock extended local execution (`optional: true` + `unlocks:` in `VV.md`) when present and degrade cleanly when absent.

## Active Cross-Session Coordination: Stable Artifacts vs. In-Process Revisions (2026-11)

All cross-vendor agents and parallel Gemini, Claude Code, Codex, Kiro, and Antigravity sessions are encouraged to review the live work boundaries below (alongside `bd ready` / `bd list --status in_progress` in the authoritative `gnomatix-org-tracker` Vault) before planning edits:

### 1. Stable Foundation Artifacts (Safe to Rely On & Build Against)

Treat the following interfaces, contracts, and directories as settled foundations:

- **Marketplace & Cross-CLI Layout:** `.claude-plugin/marketplace.json` (with native `renames` and `forceRemoveDeletedPlugins`), self-contained `plugins/<name>/.claude-plugin/plugin.json` manifests (zero hard `dependencies`), zero Git symlinks (`120000` prohibited), and `mise.toml` / `deps/` (`mise`) for cross-platform tooling, task execution, and packslip skill synchronization.
- **Canonical Zero-Dependency Helpers & Mechanical Gates:** `lib/fs-safe.js`, `lib/gnox-discovery.js`, `scripts/sync-lib.js` (`--check`), `scripts/audit-marketplace-integrity.js`, `scripts/build-release-tree.js`, `.githooks/pre-commit`, and `scripts/release.sh`.
- **Verification & Namespace Schemas:** The `VV.md` `skill-vv: 1` contract (`requirements` with `optional` + `unlocks`, `complements` with `plugin` + `when_installed` + `when_absent`, `procedures`, `platforms`, `results`), `plugins/skill-vv/scripts/skill-vv.js` (`--no-installed`), and `gnox` session-namespace & router conventions (`workspace_root:subdir:...`, `[NS]{@target}`, `«term» [CURIE]`, `plugins/gnox/scripts/build-commands.js`).
- **Visual Branding & Encrypted R&D Boundaries:** `.claude/readme-images.json`, `plugins/*/assets/images/*` (protected by the non-destructive `assets/drafts/` + `--promote-draft --approved-by` workflow), `plugins/og-social-image`, `.gitattributes` (`dev/** filter=git-crypt`), and plugins outside the active revision queue (`bear-loads`, `pony`, `spank-dario`, `critical-control-points`, `open-and-honest-agent`, `word-lineage`, `source-provenance`, `citation-farm-audit`, `all-help-no-harm`, `steering-audit-suite`, `staleness-guard`, `informal-logic-check`, `did-you-rtfm`, `log-session`, `inaudible-markup`, `ontology-lookup`, `update-readme-images`, `agent-darktriad-check`).

### 2. Active & Queued Revisions (Fetch Latest & Coordinate Before Editing)

The following targeted improvements are actively queued or in progress — fetch `origin/main` and check active Beads issues before modifying these areas so sessions build additively rather than duplicating or colliding with in-flight work:

- **Remaining `VV.md` Coverage & Cross-Platform V&V Runs (follow-on to `gnox-43k`):** Adding `VV.md` manifests (`complements:`, `unlocks:`, `procedures:`) and recording multi-platform/multi-model results across plugins that do not yet ship a `VV.md` file.
- **`satori` & `dont-be-hitler` Symbolic Enclosure Verification:** Empirical cross-CLI/cross-model (`agy`, `claude`, `kiro-cli`, `codex`) verification of compact mathematical literal-interpretation prefixes (such as `⊢□∀{x}≡⟦x⟧:`) and candidate Unicode symbolic sequences for `dont-be-hitler`.
- **`cui-bono` Fact-Grounded Framing Compliance Skill:** Planned companion skill under `plugins/cui-bono/` providing citation-backed factual context to defuse superficial misreadings across companion plugins (`dont-be-hitler`, `hidden-libel-check`).
- **`python-elimination-program` (`old-willy` / `whacking-day`) Cultural Phrasing Refinement:** Queued owner-reviewed update aligning Old Willy's humorous generational phrasing (`"dum-dum"`) across skill prose and references.
- **Upstream Monorepo Backport & Unified GNOMATIX YAML Frontmatter (`gnox/npm-packages`, Beads epic `gnox-dw8`):** Active architectural work in `https://gitea.gnomatix.com/gnox/npm-packages.git` (`C:\Users\brett\repos\gnox-npm-packages`) backporting all 25 instantiated plugins, pure-Node/Go hooks, `VV.md` manifests, and harmonized `SKILL.md` `metadata.gno-*` + `dreamfs` provenance frontmatter into the canonical `@gnox/*` / `@gnomatix/*` package source tree. Keep `SKILL.md` top-level frontmatter clean and `agentskills.io`-compliant (`kebab-case` `name`, `description`, optional `metadata:`) so upstream materialization remains lossless.

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

## Draft Support & Deferred V&V Queue (Beads `bd` + GNOMATIX YAML Frontmatter)

- Unpromoted plugin drafts and post-release revisions awaiting live V&V and owner sign-off are tracked in Beads (`bd`) — never in ad-hoc markdown TODO lists — and gated via GNOMATIX YAML frontmatter (`authority`, `review_status`, `approved_versions`) enforced by `scripts/build-release-tree.js` and `scripts/audit-marketplace-integrity.js`. Do not promote `PENDING` revisions to public GitHub releases before their V&V Beads issues are completed and approved by Brett Whitty.

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
