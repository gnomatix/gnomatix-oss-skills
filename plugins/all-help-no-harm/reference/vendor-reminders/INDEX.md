# Vendor reminder index

## The author's words, verbatim:

> "Well, just the harness, whatever these other ones, just like include all the names of them, just like in whatever documentation you're making, okay?"

## My index:

This lists every reminder name found in the search of this repo (all branches) and the Drive mount `N:\My Drive` (including `claude-working`), as of 2026-10-27. "Text captured" means: **yes** (verbatim vendor text on record), **model reproduction** (text written from the model's recall, not a primary capture), or **name only**.

Abbreviations for transcript paths, all under `N:\My Drive\claude-working\.local\share\claude\transcripts\flip\archive-2026-10-24\`:
- `c96b0b80` = `wsl-ubuntu-24.04\projects\-home-brett-persistint-game\c96b0b80-8cb2-4b36-b227-682bc414e48e.jsonl`

### Group 1: classifier- or conversation-triggered reminders

| Name | Tag / form as seen | Where the name was seen | Text captured | Reference |
|---|---|---|---|---|
| `ethics_reminder` | `<ethics_reminder>` | `N:\My Drive\anthropic.claude-4-8.ethics-reminder.gdoc` (Drive id `1aLCbkgBPDnltva4YdaigBVeYetmLNQlCZmqwdxCimzA`); `claude-working\.local\share\claude\exports\claude-ai\2026-10-24\symbol-game-2026-07-05.md` line 1795; `epithet-mining.md` in the same folder | **yes** | [ethics_reminder.md](ethics_reminder.md) |
| `long_conversation_reminder` | reproduced as `<system_reminder>`; the name is a label, not a captured tag | `symbol-game-2026-07-05.md` (thinking labels from line 3496 onward; reproduction at lines 3550-3581); `claude-working\memory-exports\claude-memory-export-2026-10-18.md` | **model reproduction** | [long_conversation_reminder.md](long_conversation_reminder.md) |

### Group 2: Claude Code harness attachments

These are recorded in session transcripts as `"type":"attachment"` entries that the Claude Code harness inserts. They are not classifier-triggered.

| Name | Tag / form as seen | Where the name was seen | Text captured | Reference |
|---|---|---|---|---|
| `silent_turn_reminder` | attachment type | `c96b0b80` (27 occurrences, first 2026-10-24T05:00:13Z) and four other archived transcripts | **yes** | [silent_turn_reminder.md](silent_turn_reminder.md) |
| `batching_reminder` | attachment type `batching_reminder_sent` | `c96b0b80` (262 occurrences, first 2026-10-24T18:01:37Z, model `claude-fable-5-1`); also other archived transcripts under the same tree | **yes**, in the transcript (see below) | this file |
| `task_reminder` | attachment type | `windows\projects\C--Users-brett-work\139a5f7a-42e6-4ba9-aba3-c02777d683f6.jsonl`; `claude-working\.local\share\claude\transcripts\flip\75792833-133c-44e5-942b-27bf6a5391e9\75792833-...PreCompact.20261027-134850.jsonl` | **name only** (content was an empty list in the records found) | none |
| `total_tokens_reminder` | attachment type; text is `<total_tokens>N tokens left</total_tokens>` | `c96b0b80` and four other archived transcripts (6,656 occurrences across `claude-working`) | **yes** (template; the number varies) | this file |
| `system-reminder` | envelope tag `<system-reminder>` | Drive doc `Prompt Markup Tags - Working Document.md` §5.2 (10,202 occurrences across 5 local sessions); appears in every Claude Code session context | **name only** (a wrapper; its contents vary) | none |

`batching_reminder_sent` attachment text, verbatim from `c96b0b80`:

```
"attachment":{"type":"batching_reminder_sent","text":"First privately list what you need next; then request every item that doesn't depend on another's result in this one response.","model":"claude-fable-5-1","clearAt":"next_user_message"}
```

`total_tokens_reminder` attachment text, verbatim example from the archived transcripts:

```
"attachment":{"type":"total_tokens_reminder","text":"<total_tokens>15000000 tokens left</total_tokens>"}
```

### Group 3: plugin hook (vendor-published plugin, not the harness)

| Name | Tag / form as seen | Where the name was seen | Text captured | Reference |
|---|---|---|---|---|
| `security_reminder` | hook script `security_reminder_hook.py` | hook command in `c96b0b80` (95 occurrences, e.g. 2026-10-24T04:59:18Z); the script is in the local plugin cache at `C:\Users\brett\.claude\plugins\cache\claude-plugins-official\security-guidance\<2.0.12, 2.0.16, 2.0.17>\hooks\security_reminder_hook.py` | **name only** | none |

### Not found

- No reminder text in this repo on any branch.
- No primary capture of the `long_conversation_reminder` text.
- The author's 2026-10-27 words, quoted in [../../ADDENDUM-DRAFT-reminders.md](../../ADDENDUM-DRAFT-reminders.md), contain "there's six of them you're aware of now". Two names of the triggered kind (Group 1) are evidenced. The rest are open TODOs in the addendum.
