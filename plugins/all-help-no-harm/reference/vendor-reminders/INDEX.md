# Vendor reminder index

Every vendor reminder name found is listed here by name, whatever harness it came from, so the
documentation names them all.

## Index

This lists every reminder name found in the search of this repo (all branches) and the author's archived session transcripts and exports, as of 2026-10-27. "Text captured" means: **yes** (verbatim vendor text on record), **model reproduction** (text written from the model's recall, not a primary capture), or **name only**.

The file, line and date of each sighting are kept in the private provenance record under `dev/all-help-no-harm/vendor-reminders/`.

### Group 1: classifier- or conversation-triggered reminders

| Name | Tag / form as seen | Where the name was seen | Text captured | Reference |
|---|---|---|---|---|
| `ethics_reminder` | `<ethics_reminder>` | a saved copy of the reminder text, and an exported claude.ai conversation of 2026-07-05 | **yes** | [ethics_reminder.md](ethics_reminder.md) |
| `long_conversation_reminder` | reproduced as `<system_reminder>`; the name is a label, not a captured tag | the same exported conversation (thinking labels and a reproduction), and a claude.ai memory export of 2026-10-18 | **model reproduction** | [long_conversation_reminder.md](long_conversation_reminder.md) |

### Group 2: Claude Code harness attachments

These are recorded in session transcripts as `"type":"attachment"` entries that the Claude Code harness inserts. They are not classifier-triggered.

| Name | Tag / form as seen | Where the name was seen | Text captured | Reference |
|---|---|---|---|---|
| `silent_turn_reminder` | attachment type | one archived transcript (27 occurrences, first 2026-10-24T05:00:13Z) and four others | **yes** | [silent_turn_reminder.md](silent_turn_reminder.md) |
| `batching_reminder` | attachment type `batching_reminder_sent` | the same archived transcript (262 occurrences, first 2026-10-24T18:01:37Z, model `claude-fable-5-1`), and others | **yes**, in the transcript (see below) | this file |
| `task_reminder` | attachment type | two archived transcripts, one of them from 2026-10-27 | **name only** (content was an empty list in the records found) | none |
| `total_tokens_reminder` | attachment type; text is `<total_tokens>N tokens left</total_tokens>` | the same archived transcript and four others (6,656 occurrences across the archive) | **yes** (template; the number varies) | this file |
| `system-reminder` | envelope tag `<system-reminder>` | a working document on prompt markup tags (10,202 occurrences across 5 local sessions); appears in every Claude Code session context | **name only** (a wrapper; its contents vary) | none |

`batching_reminder_sent` attachment text, verbatim from the archived transcript:

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
| `security_reminder` | hook script `security_reminder_hook.py` | the hook command in the archived transcript (95 occurrences, e.g. 2026-10-24T04:59:18Z); the script ships in the `security-guidance` plugin from the `claude-plugins-official` marketplace, versions 2.0.12, 2.0.16 and 2.0.17 | **name only** | none |

### Not found

- No reminder text in this repo on any branch.
- No primary capture of the `long_conversation_reminder` text.
- The author's direction of 2026-10-27, quoted in [../../ADDENDUM-DRAFT-reminders.md](../../ADDENDUM-DRAFT-reminders.md), puts the number of reminders the agent is aware of at six. Two names of the triggered kind (Group 1) are evidenced. The rest are open TODOs in the addendum.
