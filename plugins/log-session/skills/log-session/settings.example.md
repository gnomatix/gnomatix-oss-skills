---
calendar: Claude Sessions
agent_label:
timezone:
notes_max: 10
---

# log-session settings

Copy this file to `~/.config/log-session/settings.md` (`$XDG_CONFIG_HOME/log-session/settings.md` when `XDG_CONFIG_HOME` is set) and edit the frontmatter.

- `calendar`: the name of the journal calendar in Google Calendar. The skill writes only to a calendar with this name, never to the primary calendar.
- `agent_label`: the prefix of every event title. Blank uses the agent's product name.
- `timezone`: an IANA time zone name such as `America/Toronto`. Blank uses the system's.
- `notes_max`: the most bullet notes an event description carries.
