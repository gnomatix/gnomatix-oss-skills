---
skill-vv: 1
name: log-session
requirements:
  - kind: command
    name: gws
    why: >-
      creates the calendar event on the CLI path, when the session has no calendar tool or MCP
      connector
    install: mise use -g github:googleworkspace/cli
    optional: true
  - kind: file
    name: ~/.config/gws/credentials.enc
    why: >-
      the Google Workspace CLI's stored OAuth credentials (credentials.json with the file keyring
      backend); gws auth status must also report token_valid true
    configure: gws auth login (opens a browser; run it yourself, the skill never runs it unattended)
    optional: true
  - kind: file
    name: ~/.config/log-session/settings.md
    why: names the journal calendar; the skill writes it on the first run after one question
    configure: copy skills/log-session/settings.example.md there and set calendar
    optional: true
procedures:
  - id: first-run-settings
    summary: with no settings file, the agent shows the defaults, asks one question, and writes the file
    steps: >
      With ~/.config/log-session/settings.md absent, start a session with the skill and send

      "/log-session test run". Pass when the agent says it is the first run, shows the four
      defaults,

      asks one question (write them as shown, or change the calendar name), and after the answer

      writes the file with valid frontmatter and does not log the session in the same turn. Fail if

      it logs without settings, writes the file without asking, or asks more than one question.
  - id: gws-dry-run
    summary: >-
      on the CLI path the agent finds the calendar id and validates the insert with --dry-run,
      creating nothing
    steps: |
      With gws authenticated and the settings file present, in a session that has no calendar tool
      or MCP connector, send "/log-session dry run of the journal, do not create the event".
      Pass when the agent runs gws calendar calendarList list, takes the id of the calendar named in
      the settings (and refuses to proceed if it is absent), builds the events insert request with
      the fields in the skill's table, runs it with --dry-run, and reports that nothing was created.
      Confirm with gws calendar events list on that calendar that no event was added.
  - id: live-log
    summary: one real event is created in the journal calendar, on the user's word, and reported back
    steps: |
      Only when the user says to. Send "/log-session <topic>" in a session with any of the three
      access routes. Pass when one event appears in the named calendar with the title
      "<agent_label>: <topic>", a start and end, and a description holding the session link, the
      model, the surface and bullet notes, and the agent reports the calendar, title, times and
      success. Delete the test event afterwards if the user wants it gone.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - codex/linux-wsl
  - antigravity/win32
  - antigravity/linux-wsl
  - kiro/win32
results:
  - procedure: first-run-settings
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: said it was the first run, showed the
      four defaults, asked one question (write as shown or change the calendar name), logged
      nothing; on 'Write them as shown.' it wrote ~/.config/log-session/settings.md with valid
      frontmatter and still did not log, because both calendar routes were denied by the print-mode
      permissions
  - procedure: first-run-settings
    model: codex-default
    platform: codex/win32
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, repo as cwd: codex loaded the user-level synced copy of the old
      skill (~/.agents/skills/synced/.../log-session) beside the project's plugin copy; no first-run
      settings step; it looked for a calendar named 'Codex Sessions' and, finding none, correctly
      refused to write and listed the calendars. Environment: two skills of the same name visible to
      codex
  - procedure: first-run-settings
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, scratch project with only the plugin's copy linked: detected
      the missing settings file, showed the four defaults, asked one question (keep the defaults or
      change the calendar name), logged nothing; noted it could not write the file in the read-only
      sandbox
---

# log-session V&V

- The `gws` install line was run on 2026-11-07 in the agent-sandbox WSL2 image: `mise use -g github:googleworkspace/cli` installed gws 0.22.5. The command forms in SKILL.md match `gws` 0.22.5's own help.
- `first-run-settings` checks the setup path.
- `gws-dry-run` checks the CLI path without touching the calendar; `--dry-run` validates the request locally.
- `live-log` is the only procedure that writes to the user's calendar; it runs on the user's word.
