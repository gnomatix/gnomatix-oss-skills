# log-session

![log-session](assets/images/log-session-banner.jpg)

> An [Agent Skill](https://agentskills.io) that keeps a work journal in Google Calendar, outside any one agent's app: `/log-session` writes the current session as a meeting with the agent, with a topic title, start and end times, the session link and terse notes, so any day's work can be traced back to its session. It writes only to the journal calendar you name, never to your primary calendar.

<!-- BEGIN: gnomatix-promo-include -->
<p>
  <a href="https://www.buymeacoffee.com/gnomatix">
    <img src="https://img.buymeacoffee.com/button-api/?text=Buy+me+a+coffee&emoji=&slug=gnomatix&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" alt="Buy Me A Coffee — gnomatix">
  </a>
</p>

<!-- For JS-rendering contexts (the BMC-supplied script tag, preserved as authored):
<script type="text/javascript"
  src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
  data-name="bmc-button"
  data-slug="gnomatix"
  data-color="#BD5FFF"
  data-emoji=""
  data-font="Cookie"
  data-text="Buy me a coffee"
  data-outline-color="#000000"
  data-font-color="#ffffff"
  data-coffee-color="#FFDD00"></script>
-->
<!-- END: gnomatix-promo-include -->

## Skills

- `log-session`: on `/log-session [topic] [start=…] [end=…] [calendar=…]`, or when you ask to log or close out a session. It finds the journal calendar by name, builds the event (title `<agent>: <topic>`, start and end, time zone, a description with the session link, model, surface and 3 to 10 bullet notes, availability busy), creates it, and reports the calendar, title, times and result.

## Calendar access

The skill uses the first of these that the session has:

1. the Claude app's calendar tools (claude.ai, Claude Desktop, the mobile apps);
2. a Google Calendar MCP connector (Claude Code with the connector, or any agent with a Google Calendar MCP server);
3. the Google Workspace CLI, `gws`, for any CLI agent. Install with `mise use -g github:googleworkspace/cli`, then `gws auth login` once, in a browser. The skill checks `gws auth status` and never runs the login unattended. `gws calendar events insert --dry-run` validates a request without creating anything.

With none of the three, it says so and stops.

## Settings

`~/.config/log-session/settings.md` holds the journal calendar's name, the title prefix, the time zone and the notes limit; `skills/log-session/settings.example.md` is the template. On the first run the skill shows the defaults, asks one question, and writes the file.

## Install

- Claude Code: `/plugin install log-session@gnomatix-oss-skills`, then `/log-session` or `/gnox:log-session`.
- Every other agent: the skill folder `plugins/log-session/skills/log-session/` is in the Agent Skills format and is linked from `.agents/skills/` and `.kiro/skills/` at the root of this repository.

## Hooks

None. The skill runs when invoked; nothing runs at session start or on each prompt.

## Verification and validation

`VV.md` lists the requirements (`gws` and its login, needed only on the CLI path, and the settings file) and three V&V procedures: the first-run settings, a `gws` dry run that creates nothing, and a live log that creates one real event in the journal calendar on the user's word.

<!-- BEGIN: gnomatix-license-include -->
## License

**[Business Source License 1.1](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE)** (`BUSL-1.1`). The source is available, but this is not OSI open source.

**Commercial use is strictly prohibited without a paid commercial licensing / usage agreement with GNOMATIX.** Use by or for any government, government agency or charity is commercial use. Contact GNOMATIX first to arrange either of these:
- an ongoing support & development agreement
- a reasonable one-time usage fee, paid via [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

Both support continued development work on GNOMATIX projects. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms, including the Additional Use Grant, the Change Date and the Change License, are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
