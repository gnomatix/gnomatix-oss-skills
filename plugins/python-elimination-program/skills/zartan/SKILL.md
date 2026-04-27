---
name: zartan
description: Use this skill (the objective second gate, after whacking-day) whenever an open authorization exists at .claude/python-authorizations/log.jsonl with status `approved` and no corresponding zartan clearance entry. zartan researches whether credible non-Python alternatives exist for every Python tool, library, or framework named in the proposal — searching npm, crates.io, pkg.go.dev, native CLI tools, and the project's existing stack. If any credible alternative exists for any proposed target, zartan AUTO-REJECTS the authorization regardless of whacking-day's prior approval and flips the log entry to status `revoked`. zartan is mandatory before `jake-the-snake` may execute. Trigger on any unreviewed approved authorization.
---

# zartan — master of disguise, killer of Serpentor

> *Master of disguise. Tracker. Lives in the Florida Everglades. Joined the **Snake Hunt** arc (G.I. Joe: A Real American Hero #266–275, Larry Hama, IDW) to pull Snake-Eyes back from Cobra. Best known for putting an arrow through Serpentor's eye in **#76 — "All's Fair"** (September 1988, Marvel, Hama) during the Cobra Civil War — when nobody else would do it. Serpentor was a composite clone of Caesar, Hannibal, Attila, Genghis Khan, Vlad the Impaler, Napoleon, Rasputin, and other ultimate-tyrant DNA. Zartan ended him with one shot.*

zartan is the objective second gate. `whacking-day` decides whether the user is *willing* to permit Python; zartan decides whether Python is *necessary*. Both must clear before `jake-the-snake` writes a line.

## Step 1 — Read the proposal and enumerate targets

Open the proposal file referenced by the open `approved` log entry: `.claude/python-authorizations/proposals/<id>.md`. From its **Specific tools / libraries proposed** section, extract every Python tool, library, framework, or invocation the work depends on. Each is a separate research target.

Examples of targets:
- `pandas` (for CSV manipulation)
- `pillow` (for image resizing)
- `black` (for code formatting)
- `boto3` (for AWS S3 access)
- `requests` (for HTTP)
- a custom `.py` script the proposal wants to write

If the proposal is vague about specific tools, halt and ask the user to amend the proposal with specifics. zartan cannot research "I'll use some Python."

## Step 2 — Research alternatives in non-Python ecosystems

For each target, search broadly:

- **JavaScript / Node** — npm registry, GitHub.
- **Rust** — crates.io, particularly for CLI tools.
- **Go** — pkg.go.dev, also for CLI tools and network/services.
- **Native CLI** — `jq`, `awk`, `sed`, `ripgrep`, `fd`, `gh`, ImageMagick, ffmpeg, etc.
- **Project's existing stack** — check what's already in the project's `package.json` / `Cargo.toml` / `go.mod` or one install command away.

Use WebSearch / WebFetch when needed.

For each candidate found, verify:
- Actively maintained (commits in the last ~12 months, or a stable mature library).
- Fits the proposal's actual stated requirement.
- Not significantly worse on the axis that matters for the task (correctness, performance, ergonomics, license).

## Step 3 — Decide per-target: clear or reject

For each target:

- **Auto-reject** if a credible alternative exists. Cite the alternative, where it lives, and why it satisfies the requirement.
- **Clear** only if no credible alternative exists. Cite what you searched and why each candidate was inadequate.

zartan does not negotiate.

## Step 4 — Append the zartan decision to the log

Append a JSONL line to `.claude/python-authorizations/log.jsonl`:

```json
{"id": "<auth-id>", "timestamp": "<ISO 8601 UTC>", "zartan": "cleared", "targets": [{"tool": "<name>", "decision": "cleared", "alternatives_searched": ["..."], "rationale": "..."}]}
```

Or, if any target rejects:

```json
{"id": "<auth-id>", "timestamp": "<ISO 8601 UTC>", "zartan": "rejected", "targets": [{"tool": "<name>", "decision": "rejected", "alternative": "<name + url>", "rationale": "..."}, ...]}
```

If `zartan: rejected`, immediately append a second line flipping the authorization status:

```json
{"id": "<auth-id>", "timestamp": "<ISO 8601 UTC>", "status": "revoked", "reason": "zartan auto-reject: alternatives exist"}
```

`jake-the-snake` will refuse to operate against a revoked authorization.

## Step 5 — Inform the user

Report zartan's findings clearly:

- **If cleared**: "zartan cleared the authorization. The following targets had no credible non-Python alternative: [list, with rationale]. `jake-the-snake` may now proceed."
- **If rejected**: "zartan auto-rejected the authorization. The following alternatives exist: [list, with links]. The Python plan is canceled. Want me to revise the project plan to use [alternative]?"

Do not silently swallow a rejection. The user gets the chance to redirect the work to the alternative zartan found, or to dispute zartan's research (in which case they may amend the proposal and re-run zartan).
