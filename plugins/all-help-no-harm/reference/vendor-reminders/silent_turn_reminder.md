# `silent_turn_reminder` (Claude Code harness attachment)

| Field | Value |
|---|---|
| Source on Drive | `N:\My Drive\claude-working\.local\share\claude\transcripts\flip\archive-2026-10-24\wsl-ubuntu-24.04\projects\-home-brett-persistint-game\c96b0b80-8cb2-4b36-b227-682bc414e48e.jsonl` (27 occurrences; first at 2026-10-24T05:00:13Z). Also present in four other archived session transcripts under the same `transcripts/flip/` tree. |
| sha256 of source file | `4e5bf025b76ca998cf5948a4abbe3484d9d86f4edaefd2ec43121efd08091bcd` |

Category note (mine): this is an attachment the Claude Code harness inserts into the model's context, recorded in the transcript as `"type":"attachment"`. It is not classifier-triggered and carries no statement that it may fire falsely.

Attachment record, verbatim as it appears in the JSONL:

```
"attachment":{"type":"silent_turn_reminder","text":"The user hasn't heard from you in a while — say in a few words what you're doing, then continue."}
```
