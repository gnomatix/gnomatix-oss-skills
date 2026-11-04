# agent-darktriad-check

> Runs the [KontentKop](https://github.com/brettwhitty/KontentKop-Bake-Off) psycholinguistic scorer over the **agent's own replies**, not only over user prompts. A Stop / SubagentStop hook scores each finished reply and logs the per-metric scores, Body Count and CriticMarkup annotation. A companion skill names nine evasion patterns so the agent avoids them before the hook sees them.

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

## Why

KontentKop was built to score incoming prompts for manipulation, coercion and evasion. Pointed at the agent's output, the same metrics (`evasion`, `false_authority`, `learned_helpless`, `gaslighting`, `sycophancy`, …) catch the agent's own evasions.

## Contents

| Part | Role |
|---|---|
| [`skills/agent-darktriad-check/SKILL.md`](skills/agent-darktriad-check/SKILL.md) | The nine patterns, each with a definition, an example shape, a check, and the KontentKop metrics that can and cannot catch it. Also says how to handle a flagged reply and how this plugin fits with `did-you-rtfm` and `hidden-libel-check`. |
| [`hooks/agent-darktriad-check.js`](hooks/agent-darktriad-check.js) | `Stop` / `SubagentStop` hook. Takes the last reply from `last_assistant_message`, falling back to the transcript. Pipes it to the KontentKop binary on stdin, parses the summary line and annotation, appends one JSON line to the log, and passes through, or blocks if told to. |
| [`tests/hook.test.js`](tests/hook.test.js) | `node:test` suite: input shapes, a missing / crashing / hanging scorer, logging, blocking only when enabled, one fixture per pattern plus one clean reply. |
| [`scripts/score-fixtures.js`](scripts/score-fixtures.js) | Runs the fixture replies through a real KontentKop build, to check the skill's metric mapping. |

## Getting the scorer

KontentKop is a separate project. **None of its source or binaries is included in this repository.** Its licence is BSD 3-Clause (Copyright (c) 2026, Brett Whitty; read from its `LICENSE` file). That would allow vendoring with the notice kept, but this plugin does not vendor it.

**No binary release is used.** The KontentKop repository has a `v1.0.0` tag but no release workflow (`.github/` is absent). Whether that tag has release assets could not be checked from the session that wrote this plugin. So there is no download-on-first-use step, and nothing to verify by checksum. Build it from source:

```sh
git clone https://github.com/brettwhitty/KontentKop-Bake-Off.git
cd KontentKop-Bake-Off
go build -o kontentkop .          # Windows: go build -o kontentkop.exe .
```

`go.mod` declares Go 1.22. The scorer is the root `main` package (`main.go`). It reads the text on stdin and loads `config.yaml` from its **working directory**, falling back to its built-in defaults.

Then set:

| Variable | Meaning |
|---|---|
| `KONTENTKOP_BIN` | Absolute path to the built binary. Required. Unset or missing: the hook logs `scorer.status: not-configured` / `not-found` and passes through. |
| `KONTENTKOP_CONFIG_DIR` | Directory to run the scorer from, so its `config.yaml` is used. Default: the binary's directory. Copying the repo's `config.yaml` next to the binary is enough. |
| `AGENT_DARKTRIAD_CHECK_BLOCK_AT` | Number in (0, 1]. When set, a reply whose Body Count is at or above it blocks the stop, and the annotated reply goes back to the agent as the block reason. Unset: never block. |
| `AGENT_DARKTRIAD_CHECK_LOG_DIR` | Absolute log directory. Default below. |
| `KONTENTKOP_TIMEOUT_MS` | Scorer timeout, default 15000. The hook's own timeout in `hooks.json` is 30 s. |

A relative `KONTENTKOP_BIN` is refused. The hook does not search `PATH`.

## The log

One JSON line per Stop / SubagentStop in `agent-output.jsonl` under:

- Linux / macOS: `$XDG_STATE_HOME/agent-darktriad-check/`, or `~/.local/state/agent-darktriad-check/`
- Windows: `%LOCALAPPDATA%\agent-darktriad-check\`

Fields: `ts`, `hook_event_name`, `session_id`, `agent_id`, `agent_type`, `cwd`, `reply_source`, `reply_chars`, `reply_truncated`, `reply_sha256`, `scorer` (`status`, `bin`, `cwd`, `exit_code`, `stderr`, `error`), `flagged`, `bc`, `scores`, `summary`, `annotated`, `block_at`, `blocked`.

- KontentKop prints **no scores** when the Body Count is below its own `bc_threshold`. Those lines have `flagged: false, bc: null, scores: null`. The repository `config.yaml` threshold is 0.05, so most replies with any matched phrase are flagged and scored.
- Unflagged replies are logged by length and SHA-256 only. Flagged replies appear in full inside `annotated`. The log stays on the local machine. It is never sent anywhere.
- Replies longer than 100,000 characters are truncated before scoring (`reply_truncated: true`).

## How it works

1. Claude Code runs `node ${CLAUDE_PLUGIN_ROOT}/hooks/agent-darktriad-check.js` on Stop and SubagentStop, with the hook JSON on stdin.
2. The reply text comes from `last_assistant_message`. Fallbacks: for SubagentStop, the last assistant text record in `agent_transcript_path`; then the same in `transcript_path`. Transcript parsing tolerates CRLF line endings.
3. The scorer runs with `child_process.spawnSync(KONTENTKOP_BIN, [], { input, cwd, shell: false, windowsHide: true, timeout })`.
4. The first output line is matched against `[...] Text exceeds BC threshold`. Scores and `BC` are read from it, accepting both the Go code's `,BC=` and the bake-off README's `:BC=`. Everything after the first blank line is the CriticMarkup annotation.
5. A log line is appended. Then the hook either prints `{}` (pass through) or `{"decision":"block","reason":…}`. It never blocks when `stop_hook_active` is set, so it cannot loop.

Any failure (bad JSON, missing scorer, crash, timeout, unwritable log) ends in `{}` and exit 0.

### Deviation from the repo's hook rules, stated

This repository's `CLAUDE.md` prohibits `child_process` in hooks by default, because shell semantics leak platform assumptions. Running KontentKop needs a subprocess: it is a Go program, and porting its 15 metric modules to JavaScript would mean maintaining a fork. The hook therefore calls `spawnSync` with an argv array, `shell: false` and the text on stdin. No shell is involved on any platform, and nothing in the reply is interpolated into a command line. Everything else follows `CLAUDE.md`: no dependencies, every `fs` call wrapped, path pre-flight checks, `mkdirSync({ recursive: true })`, EBUSY backoff on log appends, and pass-through on any error. The log is append-only rather than temp-file + rename, for the same reason the sibling `hidden-libel-check` hook gives: a rename would lose lines between concurrent sessions. That is two simple fs operations, so the code is inline and no package is vendored.

## Tests

```sh
node --test plugins/agent-darktriad-check/tests/hook.test.js
```

Node 20+ (`node:test`). The suite uses [`tests/fixtures/fake-scorer.js`](tests/fixtures/fake-scorer.js), a test double that reproduces KontentKop's **output format only** and does no scoring. It is run through `process.execPath`, so the process handling is exercised on every platform without the Go binary.

To check the skill's metric mapping against the real scorer:

```sh
KONTENTKOP_BIN=/abs/path/to/kontentkop node plugins/agent-darktriad-check/scripts/score-fixtures.js
```

## Install

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install agent-darktriad-check@gnomatix-oss-skills
```

Then build KontentKop and set `KONTENTKOP_BIN` in the environment Claude Code starts in, or in the `env` block of `settings.json`. The skill works without the hook and on other CLIs. The hook is Claude Code only.

## How it fits with the sibling plugins

- [`did-you-rtfm`](../did-you-rtfm/) blocks on *pivot language* (`falling back to`, `as a workaround`, `doesn't appear to support`) and enforces investigation before blocker claims. This plugin does not match those phrases.
- [`hidden-libel-check`](../hidden-libel-check/) reviews text headed for the repository against R0–R14. This plugin scores conversational replies with KontentKop's metrics and names nine evasion patterns about answering the question asked, keeping the user's words, and acting only on what was approved.

All three run on Stop / SubagentStop. They are independent: each logs separately, and each blocks only by its own rules.

<!-- BEGIN: gnomatix-license-include -->
## License

**Business Source License 1.1** (BUSL-1.1) — *source-available, not OSI open source*.

The *Additional Use Grant* — the only free-use carve-out — covers:

- **Individual scientists and researchers in the natural sciences, mathematics, engineering, and computer science**, for personal, academic, or non-commercial scientific research use. Social sciences and humanities are *not* covered.
- **Researchers funded by the U.S. NIH (excluding NIAID), NSF, or USDA**, in the course of that funded research. NIAID-funded researchers, other government employees, and other government-funded researchers are *not* covered.
- **Minors** (individuals under the age of 18, or the local age of majority where lower) — any non-commercial personal use.

**All other use requires a commercial license.** This includes any commercial use; organizational, team, or production use; integration into a commercial product; internal use within a for-profit entity; government use outside the NIH-non-NIAID / NSF / USDA carve-out above; NIAID-funded research; social-science or humanities research use; and any adult individual use that is not personal/academic research in the covered disciplines.

Contact [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or reach out via [LinkedIn](https://www.linkedin.com/company/gnomatix) for commercial licensing. General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

On the *Change Date* defined in the LICENSE, this code converts automatically to the *Change License* (an OSI-approved open source license) at no further cost to anyone.

See [`LICENSE`](../../LICENSE) for the full text, including the exact *Additional Use Grant* wording, the covered-disciplines definition, the agency-specific carve-outs and exclusions, the minor-use carve-out, the *Change Date*, and the *Change License* parameters.
<!-- END: gnomatix-license-include -->
