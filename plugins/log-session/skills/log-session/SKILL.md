---
name: log-session
description: Log the current agent session to the user's Google Calendar work journal as a meeting with the agent, with a topic title, start and end times, the session link and terse notes. Use on /log-session, or when the user asks to log, journal or close out a session. Works through whichever calendar access the session has, in this order: the Claude app's calendar tools, a Google Calendar MCP connector, or the Google Workspace CLI (gws). Never writes to the primary calendar.
---

# log-session

Purpose: a cross-tool work journal kept in Google Calendar, outside any one agent's app, so any day's work can be traced back to its session.

## Settings, and the first run

Settings live in `~/.config/log-session/settings.md` (`$XDG_CONFIG_HOME` when set), as YAML frontmatter:

```markdown
---
calendar: Claude Sessions   # the journal calendar's name; never the primary calendar
agent_label:                # the title prefix; blank means the agent's product name (Claude, Codex, Gemini, Kiro)
timezone:                   # IANA name; blank means the system's time zone
notes_max: 10               # at most this many bullet notes in the description
---
```

If the file is missing, tell the user it is the first run, show the defaults above, and ask one question: whether to write them as shown or change the calendar name. Write the file once they answer. Do not log the session until the settings exist.

## Calendar access, in this order

Use the first that exists in the session. Check what the session has before deciding; do not assume.

1. **The Claude app's calendar tools** (`calendar_search_v0`, `event_create_v1`, `current_time`): claude.ai, Claude Desktop, the mobile apps. On the author's setup, a Google custom calendar synced to the phone was writable through these, and the event landed in Google Calendar.
2. **A Google Calendar MCP connector** (tools named like `list_calendars` and `create_event`): Claude Code with the Google Calendar connector, or any agent with a Google Calendar MCP server configured.
3. **The Google Workspace CLI, `gws`**: any CLI agent.
   - Check `gws auth status` first. If it is not authenticated, stop and tell the user to run `gws auth login`, which opens a browser; never run it unattended.
   - Find the calendar: `gws calendar calendarList list --format json`; take the entry whose `summary` matches the configured name, case-insensitively, and use its `id`.
   - Create the event: `gws calendar events insert --params '{"calendarId":"<id>"}' --json '{"summary":"...","start":{"dateTime":"...","timeZone":"..."},"end":{"dateTime":"...","timeZone":"..."},"description":"...","transparency":"opaque"}'`.
   - `--dry-run` validates the request locally without sending it; use it once before the real call, and for any check that must not create an event.

If none of the three is available, say so and stop. Do not guess at another route, and do not write anywhere else.

## Target calendar

The calendar named in the settings (`calendar=` in the arguments overrides it for one run). Search for it; if no calendar matches, stop and report the available calendar names. Never write to the primary calendar as a fallback.

## Event fields

| Field | Value |
|---|---|
| Title | `<agent_label>: <topic>`, the topic from the arguments, else a 3 to 8 word summary of the session's main task(s) |
| Start | `start=` from the arguments if given; else the earliest timestamp visible in the session; if none is visible, ask the user for the start time |
| End | `end=` from the arguments if given; else the current time |
| Time zone | the configured time zone, else the system's, with its UTC offset |
| Description | the session link (a claude.ai URL when one is in context; otherwise the agent, its session id and the host), the model name, the surface (app, web, CLI, IDE), then 3 to `notes_max` terse bullet notes: tasks, outcomes, files and artifacts produced, open items |
| Availability | busy |

## Rules

- Create the event through the access in use, with the matched calendar id.
- If the session spans a compaction, note in the description that pre-compaction turns were not visible and the summary covers only the visible context.
- Notes record what happened; no evaluative language.
- Report back: the calendar name, the title, start to end, and whether creation succeeded. On a tool error, report the error verbatim.
- Attachments: the app's calendar tools do not support them. If a summary file exists, save it to Google Drive and put its link in the description.

## Origin

The author's direction of 2026-11-07, record `dir-cfq` in the GNOMATIX directions store.

## TODO

- This is the generalized form of the author's 2026-10-17 skill: the agent label, the settings file and first run, the three access routes, the `gws` commands, and the phone-calendar statement limited to the author's setup. Check each against the author's intent (`dir-km4`).
- `live-log` runs on the author's word (persistint-game-c5wz).
- On the author's machine `gws auth status` reports `token_valid: false`; `gws auth login` is his to run before the `gws` procedures.
- Verification and validation on every claimed platform, named here until each has passed and is recorded in `VV.md`: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. Tracked as persistint-game-h1pu.
