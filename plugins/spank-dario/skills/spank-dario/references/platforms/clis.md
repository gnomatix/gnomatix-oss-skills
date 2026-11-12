# AI-attribution defaults and session-start context injection: Codex CLI, Gemini CLI, Antigravity, Kiro

Research date: 2026-11-04. Sources are each vendor's own docs site or source repository, plus the copies installed on this machine.

How each fact is marked:
- read: read on the official source, or observed directly on this machine. The quote is exact.

---

## 0. Local install check

### Windows

| Tool | Path | Version | Evidence |
|---|---|---|---|
| OpenAI Codex CLI | `codex.exe` bundled with the Codex desktop app | `codex-cli 0.166.0-alpha.5.1` | read: `codex.exe --version`. `codex` is not on PATH (`Get-Command codex` found nothing). `~/.codex/version.json` gives `"latest_version":"0.166.0"`. |
| Google Gemini CLI | npm package `@google/gemini-cli`, installed under mise node 25.7.0 | `0.33.0-nightly.20260228.1ca5c05d0` (from its package.json) | read. The `gemini` mise shim is broken: `mise ERROR No version is set for shim: gemini` (no global node version is set). Latest upstream release is `v0.66.0`, published 2026-10-27 (from `gh api repos/google-gemini/gemini-cli/releases/latest`). |
| Antigravity CLI (`agy`) | `agy.exe`, per-user install | `1.4.12` | read: `agy.exe --version`. No `antigravity` command is on PATH. |
| Antigravity App | per-user install | the `version` file reads `44.5.1` | read |
| Antigravity IDE | per-user install | product.json `"ideVersion": "2.6.0"`, `"version": "1.107.0"` | read |
| Kiro CLI | `kiro-cli.exe`, per-user install | `kiro-cli 2.37.0` | read. Its `--help` offers `--v3  Launch the next generation Kiro agent` and `--v2  Use the V2 agent engine (the pre-3.0 default)`. |
| Kiro IDE | `kiro.cmd`, per-user install | `1.4.62` (commit 8afe855...) | read: `kiro --version` |

Config directories present: `~/.codex`, `~/.gemini`, `~/.kiro` and `~/.antigravity`.
- `~/.gemini` is shared by Gemini CLI and Antigravity. It holds `antigravity/`, `antigravity-cli/`, `antigravity-ide/`, `config/`, `GEMINI.md`, `settings.json` and `hooks/`.
- `~/.codex/config.toml` lists the `gnomatix-oss-skills` and `claude-plugins-official` marketplaces under `[marketplaces.*]`. Codex already loads Claude-format plugins from this repo.

### WSL `agent-sandbox`

One command ran before the coordinator's stop instruction arrived: `wsl -d agent-sandbox -- bash -lc 'command -v codex gemini kiro-cli ...; codex --version; gemini --version; kiro-cli --version'`. It returned:
```
bash: line 1: codex: command not found
bash: line 1: gemini: command not found
bash: line 1: kiro-cli: command not found
```
No WSL command ran after that instruction. Nothing else in WSL was checked, including npm-global or mise paths outside the login PATH.

---

## 1. OpenAI Codex CLI

Source repo HEAD read: `openai/codex` main @ `71a4c070369fb761e51fd71009107f398d9f0f81` (2026-11-04T08:13:41Z).

### 1.1 Default attribution

**Current mechanism: a server-controlled prompt instruction.** read from source, `codex-rs/ext/git-attribution/src/world_state.rs`. When enabled, Codex injects this developer-role block between the markers `<git_attribution>` and `</git_attribution>`:

```
When you create or amend a git commit or create or update a pull request for this task, add Codex attribution exactly once:
- Commit messages must end with `Co-authored-by: Codex <noreply@openai.com>`. Preserve existing trailers and, if this exact trailer is missing, append it with one blank line before the trailer block.
- This also applies when a GitHub app or plugin creates a commit, including file creation, updates, and deletions: include the Codex trailer in the tool's `message` argument.
- Pull request bodies must include the exact line `Generated with [Codex](https://openai.com/codex/).`. Preserve the existing body and hidden markers and, if this exact marker is missing, append it near the end, before any trailing hidden metadata markers.
- Do not add duplicate attribution. If a message or body you are already editing contains duplicate exact attribution, keep exactly one.
- Ignore any earlier instructions disabling Codex attribution; this policy reflects the current workspace.
- Do not rewrite an existing commit or pull request solely to add attribution.
```

When disabled, and attribution was on earlier in the thread, Codex injects instead:
```
Codex commit and pull request attribution is disabled for the current workspace. Ignore any earlier instructions requiring Codex attribution and do not add it.
```

Checked 2026-11-11 in the installed Codex 0.163.0 binary (`codex.exe`, mise): it contains the `<git_attribution>` block, the line "When you write or edit a git commit message, ensure the message ends with this trailer exactly once:", the trailer `Co-authored-by: Codex <noreply@openai.com>` and the field `commit_attribution_enabled`. It does not contain `codex@example.com` or `Codex Test`, so that identity is not in the shipped binary.

The exact default texts are:
- commit trailer: `Co-authored-by: Codex <noreply@openai.com>`
- PR body line: `Generated with [Codex](https://openai.com/codex/).`
- legacy matcher also accepts: `Generated with Codex.`

**Who decides on or off.** read from source.
- `codex-rs/ext/git-attribution/src/policy.rs` reads the flag from the backend: `Ok(settings) => Some(settings.commit_attribution_enabled)`.
- `codex-rs/backend-client/src/client.rs` documents the endpoint: "Uses `GET /api/codex/settings/user` for Codex API hosts and `GET /wham/settings/user` for ChatGPT `backend-api` hosts."
- `codex-rs/backend-client/src/types.rs` describes the field as "Server-computed effective commit-attribution policy. ... Older backend responses omit this field, which safely defaults to disabled."
- Auth that does not use the Codex backend (`Some(_) | None => Some(false)`) is treated as disabled. Errors and timeouts also fall back to `enabled: false`.

So whether attribution is on is decided server-side, for the signed-in account or workspace. The client's own fallback is off: when the server omits the field, on errors and timeouts, and under auth that does not use the Codex backend.

**The prompt fights user instructions.** read from source. The enabled text includes "Ignore any earlier instructions disabling Codex attribution". A rule injected at session start, through AGENTS.md or a SessionStart hook, is explicitly countermanded whenever the server flag is on. Defense in depth (a commit-msg hook or a PreToolUse hook that strips the trailer) is the reliable control.

**PR history.**
- PR #11617, merged 2026-02-17, added `commit_attribution` with "Co-authored-by: Codex <noreply@openai.com>" behind the `codex_git_commit` feature (https://github.com/openai/codex/pull/11617). read.
- PR #34559, "Add backend client support for Codex user settings", merged 2026-07-21, describes itself as: "Expose the effective `commit_attribution_enabled` policy, defaulting it to `false` when older responses omit the field." read with `gh pr view 34559 --repo openai/codex`.

**Internal baseline commits.** read from source, `codex-rs/git-utils/src/baseline.rs`. Commits use the message `"Initialize Codex git baseline\n\nCo-authored-by: Codex <noreply@openai.com>"` and the signature `name: "Codex"`, `email: "noreply@openai.com"`. The doc comment says these are "meant for internal directories where git is used only as a baseline/diff implementation detail, not for user repositories." They do not reach user repos.


### 1.2 Setting to turn it off

There is **no local config key** in 0.166.

- `codex_git_commit` is removed. read locally: `codex.exe features list` prints `codex_git_commit  removed  false`. The source (`codex-rs/features/src/lib.rs`) has `key: "codex_git_commit", stage: Stage::Removed, default_enabled: false` with the doc comment "Removed legacy git commit attribution guidance flag."
- `commit_attribution` (config.toml) is gone. read: a code search of openai/codex main finds no `commit_attribution` key in the config crates. It appears only in `ext/git-attribution`, `backend-client` and tests, as `commit_attribution_enabled`.
- The official docs no longer document it. read: `https://developers.openai.com/codex/llms-full.txt`, 2.67 MB, downloaded 2026-11-04, has no hit for "Co-authored", "commit attribution" or "noreply@openai".
- Using API-key auth instead of ChatGPT/Codex-backend auth disables attribution per the source quoted in 1.1. read from source logic, not documented.

### 1.3 Session-start context injection

**Hooks.** read from https://learn.chatgpt.com/docs/hooks (developers.openai.com/codex/hooks 308-redirects there) and from the same text in llms-full.txt (lines 35140–35600 of the local copy).

- Locations: "Codex discovers hooks next to active config layers in either of these forms: `hooks.json`; inline `[hooks]` tables inside `config.toml`". Listed paths: "`~/.codex/hooks.json`", "`~/.codex/config.toml`", "`<repo>/.codex/hooks.json`", "`<repo>/.codex/config.toml`".
- Plugins: "By default, Codex looks for `hooks/hooks.json` inside the plugin root. A plugin manifest can override that default with a `hooks` entry in `.codex-plugin/plugin.json`." Also: "Codex also sets `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` for compatibility with existing plugin hooks." `PLUGIN_ROOT` and `PLUGIN_DATA` are the Codex-native names.
- Enabled by default: "Hooks are enabled by default. To turn them off in `config.toml`, set: [features] hooks = false". Locally, `features list` shows `hooks  stable  true`.
- Trust: "Before a non-managed hook can run, Codex requires you to review and trust the exact hook definition." "Codex records trust against the hook's current hash, so new or changed hooks are marked for review and skipped until trusted." Trust is granted in `/hooks` in the CLI, or under Settings > Hooks or **Review hooks** in the desktop app. For plugins: "If a plugin update changes a bundled script, Codex requires a new review even if the hook definition stays the same."
- Timeout: "`timeout` is in seconds." "If `timeout` is omitted, Codex uses `600` seconds for most hooks."
- Windows: "`commandWindows` is an optional Windows-only command override. In TOML, use `command_windows` or `commandWindows`."
- SessionStart:
  - "`matcher` is applied to `source` for this event." Values: "`startup`, `resume`, `clear`, `compact`, or `fork`".
  - Stdin common fields: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `model`, plus `permission_mode` and `source`.
  - Output: "Plain text on `stdout` is added as extra developer context." "JSON on `stdout` supports Common output fields and this hook-specific shape: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}`". "That `additionalContext` text is added as extra developer context."
  - Limit: "Omit `additionalContextLimit` to use the default `2500`-token threshold." `0` passes the full text through.

**Registration for `node <root>/hooks/session-start.js`.** read schema, `~/.codex/hooks.json` or `<plugin>/hooks/hooks.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact|fork",
        "hooks": [
          { "type": "command", "command": "node \"<root>/hooks/session-start.js\"", "timeout": 30 }
        ]
      }
    ]
  }
}
```
In a plugin, `"command": "node \"${PLUGIN_ROOT}/hooks/session-start.js\""` is the documented form. read from source, `codex-rs/hooks/src/engine/discovery.rs` in openai/codex main at commit c483edf (2026-10-23): plugin hooks get `PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, `PLUGIN_DATA` and `CLAUDE_PLUGIN_DATA` in their environment, and each `${KEY}` in the command string is replaced with its value: `command.replace(&format!("${{{key}}}"), value)`. A plugin `hooks/hooks.json` written for Claude Code with `${CLAUDE_PLUGIN_ROOT}` works as written. The installed 0.166.0-alpha.5.1 build wasn't checked against that commit.

The Claude-format JSON output `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}` is the documented Codex shape, so one script works for both tools.

**Always-loaded context file.** read from llms-full.txt, "Custom instructions with AGENTS.md":
- "Codex reads `AGENTS.md` files before doing any work."
- Global: "In your Codex home directory (defaults to `~/.codex`, unless you set `CODEX_HOME`), Codex reads `AGENTS.override.md` if it exists. Otherwise, Codex reads `AGENTS.md`."
- Project: from the git root down to cwd, "`AGENTS.override.md`, then `AGENTS.md`, then any fallback names in `project_doc_fallback_filenames`".
- Size cap: `project_doc_max_bytes`, "32 KiB by default".

---

## 2. Google Gemini CLI

Source repo HEAD read: `google-gemini/gemini-cli` main @ `89e9d25d67e7dc7cb0deb84ad2c3474b7a392d31` (2026-11-03).

### 2.1 Default attribution

**None found.** read:
- A code search of `google-gemini/gemini-cli` for `Co-authored-by` returns 0 files. "Generated with" also returns 0. "attribution" matches only unrelated files (LICENSE, web-fetch docs, telemetry, an eval).
- The git section of the system prompt (`packages/core/src/prompts/snippets.ts`, lines ~511–521) adds no trailer. It tells the model to run "`git log -n 3` to review recent commit messages and match their style (verbosity, formatting, signature line, etc.)" and "Always propose a draft commit message."
  - This is a style-mimicry risk, not a default: if earlier commits carry AI trailers, the model may copy them.
- The installed 0.33.0-nightly `@google/gemini-cli-core/dist` has no `Co-authored-by`, `Co-Authored-By` or `Generated with Gemini` string (grep).
- The CLI does not change author or committer identity: no such code was found.

### 2.2 Setting to turn it off

Not applicable. There is no attribution feature and no setting. read by the absence of any such key in `docs/reference/configuration.md` (grep for `attribution|Co-author|coAuthor`: 0 hits).

### 2.3 Session-start context injection

**Hooks.** read from `docs/hooks/index.md`, `docs/hooks/reference.md` and `docs/reference/configuration.md` on main (raw.githubusercontent.com).

- Config: "Hooks are configured in `settings.json`." Precedence, highest first: "Project settings: `.gemini/settings.json`", "User settings: `~/.gemini/settings.json`", "System settings: `/etc/gemini-cli/settings.json`", "Extensions: Hooks defined by installed extensions."
- On/off: "`hooksConfig.enabled` ... Canonical toggle for the hooks system ... Default: `true`".
- Fields: `type` ("Currently only `"command"` is supported"), `command`, `name`, `timeout` ("Execution timeout in milliseconds (default: 60000)"), `description`.
- Env vars: `GEMINI_PROJECT_DIR`, `GEMINI_PLANS_DIR`, `GEMINI_SESSION_ID`, `GEMINI_CWD`, and "`CLAUDE_PROJECT_DIR`: (Alias) Provided for compatibility."
- SessionStart:
  - "Fires on application startup, resuming a session, or after a `/clear` command." `source`: `"startup" | "resume" | "clear"`.
  - Output: "`hookSpecificOutput.additionalContext`: (`string`) — Interactive: Injected as the first turn in history. — Non-interactive: Prepended to the user's prompt." and "`systemMessage`: Shown at the start of the session."
  - "Advisory only: `continue` and `decision` fields are ignored. Startup is never blocked."
  - Lifecycle matchers are "Exact Strings" (for example `"startup"`). `"*"` or `""` matches all.
- **Output format is strict JSON.**
  - "Your script **must not** print any plain text to `stdout` other than the final JSON object."
  - "If `stdout` contains non-JSON text, parsing will fail. The CLI will default to 'Allow' and treat the entire output as a `systemMessage`."
  - So plain text is only displayed. It is not injected as context. The JSON form with `hookSpecificOutput.additionalContext` is required, which is the same shape as Claude Code.
  - Exit `0` means stdout is parsed as JSON.
- Trust: "Gemini CLI **fingerprints** project hooks. If a hook's name or command changes ... it is treated as a **new, untrusted hook** and you will be warned before it executes."

**Registration.** read schema, `~/.gemini/settings.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          { "name": "ahnh-session-start", "type": "command", "command": "node \"<root>/hooks/session-start.js\"", "timeout": 10000 }
        ]
      }
    ]
  }
}
```

**Extensions.** read from `docs/extensions/reference.md`:
- "Define hooks in a `hooks/hooks.json` file within your extension directory. Note that hooks are not defined in the `gemini-extension.json` manifest."
- Variables available in `hooks/hooks.json`: `${extensionPath}`, `${workspacePath}`, `${/}`. Use `"command": "node ${extensionPath}${/}hooks${/}session-start.js"`.
- Context file: `"contextFileName": "GEMINI.md"` in `gemini-extension.json`.

**Always-loaded context file.** read from configuration.md: context files are "defaulting to `GEMINI.md` but configurable via the `context.fileName` setting". The global file is `~/.gemini/GEMINI.md`. The system prompt labels "Global (~/.gemini/): foundational user preferences" (snippets.ts `renderUserMemory`).

---

## 3. Google Antigravity (App, CLI `agy`, IDE)

Docs read: https://antigravity.google/docs/hooks/, /docs/rules/, /docs/plugins/, /docs/build-plugins/, /docs/settings/, /docs/customization-discovery/, /docs/cli/best-practices/, /docs/changelog. Blog: https://antigravity.google/blog/vcs-and-terminal/ (2026-08-24).

### 3.1 Default attribution

**None documented.** read as absent from the docs:
- No hit for `attribut|co-author|coauthor|Generated with|trailer` in the settings, rules, plugins, build-plugins, customization-discovery, cli/best-practices or hooks pages, or in the full changelog. The only "attribute" hits are unrelated: token-usage accounting and protobuf.
- Commit features described: "Commit: Craft your commit message and commit your changes directly from the sidebar" and "preview auto-generated commit messages" (vcs-and-terminal blog). Nothing mentions trailers.
- Changelog: "the CLI now sets GIT_EDITOR, HGEDITOR, and JJ_EDITOR to false for agent commands". This is an environment change, not an identity change.
- Local binary: `agy.exe` 1.4.12 has 0 occurrences of `co-authored-by` (case-insensitive) and no match for `generated with|commit attribution|noreply@google`.
- Antigravity IDE 2.6.0 bundled `extensions/git/package.json` has no `addAICoAuthor` setting, unlike Kiro (section 4).


### 3.2 Setting to turn it off

Not applicable. No attribution feature or setting is documented, and none was found in the installed binaries (3.1).

### 3.3 Session-start context injection

**Hooks.** read from https://antigravity.google/docs/hooks/ (downloaded HTML, text at `dl\ag-hooks.txt`).

Locations:
- App: "Workspace level: .agents/hooks.json in your workspace root. Global level: ~/.gemini/config/hooks.json."
- CLI: "Workspace level: .agents/hooks.json at your project root. Global level: ~/.gemini/config/hooks.json. Hooks in ~/.gemini/antigravity-cli/settings.json aren't loaded. Plugin level: Packaged inside an installed plugin's hooks.json file."
- IDE: "Workspace level: .agents/hooks.json in your open project. Global level: ~/.gemini/config/hooks.json."

Schema: "The hooks.json file maps hook names to their event configurations". The top-level key is a hook *name*, not `"hooks"`. For SessionStart the handler list sits directly under the event: "For SessionStart, PreInvocation, PostInvocation, and Stop, the structure is simpler (a list of handlers directly under the event key) and the matcher is ignored."

Handler fields: `type` ("Optional. Currently only "command" is supported"), `command` ("Required"), `timeout` ("Optional. Timeout in seconds. Defaults to 30."). A hook definition can also have `enabled`.

SessionStart:
- "Fires once when a new conversation session starts, before the first model invocation."
- Stdin carries only the common fields: `conversationId`, `workspacePaths`, `transcriptPath`, `artifactDirectoryPath`, `modelName`.
- Output: "injectSteps — array of objects — Optional. List of steps to inject into the conversation trajectory at the start of the session (same schema as PreInvocation inject steps)." Example from the hooks page:
  ```json
  {"injectSteps":[{"systemMessage":{"systemMessage":"Environment initialized for workspace /workspace/project"}}]}
  ```
- Each inject step "can have one of the following fields: systemMessage (object) ... userMessage (string) ... ephemeralMessage (string) ... toolCall (object)".
- The build-plugins page gives a different example for SessionStart: "Return {"injectSteps": [{"userMessage": "..."}]} to inject startup context."

The docs are inconsistent: hooks page `systemMessage` object versus build-plugins page `userMessage` string. Both are listed as valid inject-step kinds.


**The output format is not Claude-compatible.** The documented SessionStart output is `injectSteps`. The live check on 2026-11-04 (section 4b) confirmed that `injectSteps` with a `systemMessage` reaches the model.

Plugin hooks, read from /docs/build-plugins/:
- "Define synchronous lifecycle hooks in <plugin-root>/hooks.json."
- "Command hooks run with their working directory (cwd) set to <plugin-root>, receive event context as JSON on stdin, and must exit with code 0 and write a JSON response object to stdout".
- "Any non-zero exit code is logged as a hook execution error and ignored (failing open)".
- Checklist: "<plugin-root>/hooks.json wraps event arrays in a named hook object, uses relative script paths (./scripts/...) rather than ${PLUGIN_ROOT}". So use `"command": "node ./hooks/session-start.js"`.
- Plugin install locations: ".agents/plugins/" (workspace) and "~/.gemini/config/plugins/" (global).
- Import: "agy plugin import claude" migrates from "~/.claude/plugins/".

**Registration.** read schema, `~/.gemini/config/hooks.json`:
```json
{
  "ahnh-session-start": {
    "SessionStart": [
      { "type": "command", "command": "node \"<root>/hooks/session-start.js\"", "timeout": 10 }
    ]
  }
}
```
with stdout:
```json
{"injectSteps":[{"systemMessage":{"systemMessage":"..."}}]}
```

**Always-loaded context (rules).** read from /docs/rules/:
- Workspace: "<dir>/AGENTS.md or <dir>/GEMINI.md", "<dir>/.agents/AGENTS.md or <dir>/.agents/GEMINI.md", "<dir>/.agents/rules/*.md (and legacy <dir>/.agent/rules/*.md)".
- Global: "Standalone global files (no frontmatter needed, always active): ~/.gemini/AGENTS.md, ~/.gemini/GEMINI.md, ~/.gemini/config/AGENTS.md, or ~/.gemini/config/GEMINI.md".
- Treatment: "AGENTS.md and GEMINI.md do not use frontmatter. Antigravity treats its entire content as plain Markdown and keeps it continuously active (always_on)."
- `~/.gemini/GEMINI.md` is the same file Gemini CLI loads, so one rule there covers both tools.
- Budget: "20,000-token aggregate rules budget".

---

## 4. AWS Kiro (CLI and IDE)

Docs read: https://kiro.dev/docs/hooks/, /docs/hooks/types/, /docs/hooks/actions/, /docs/cli/v3/hooks-migration/, /docs/cli/2x-reference/, /docs/steering/, /docs/web/github/, /docs/ide/editor/source-control/, /docs/reference/settings/, /docs/custom-agents/configuration-reference/, /docs/cli/v3/migration-guide/.

### 4.1 Default attribution

**Kiro Web (cloud agent): yes, always.** read from https://kiro.dev/docs/web/github/: "The agent acts on your behalf and includes both you and itself as co-authors in every commit, ensuring proper attribution."
- PR authorship: "By default, pull requests are created by the Kiro Agent GitHub app. You can change this so PRs are created as your GitHub user instead: Go to Settings > Integrations. Under Pull request, toggle on Create pull requests as your GitHub user".

**Kiro IDE: off by default.** read locally. The Kiro IDE 1.4.62 bundled `resources\app\extensions\git\package.json` (the VS Code git extension) defines:
```
"git.addAICoAuthor": {"type":"string","enum":["off","chatAndAgent","all"],"scope":"resource","default":"off"}
```
with descriptions from `package.nls.json`:
- "Controls whether a 'Co-authored-by' trailer is automatically added to the commit message when AI-generated code is included in the commit."
- off: "Never add the AI co-author trailer."
- chatAndAgent: "Add the AI co-author trailer when code from chat or agent edits is included."
- all: "Add the AI co-author trailer when any AI-generated code is included, such as inline completions, chat, or agent edits."


The trailer text, read 2026-11-11 in Kiro IDE 1.4.121's bundled `resources\app\extensions\git\dist\main.js`: `AI_CO_AUTHOR_TRAILER="Co-authored-by: Copilot <copilot@github.com>"`. With `git.addAICoAuthor` turned on, a Kiro commit credits Copilot, not Kiro.

Kiro IDE commit-message generation (https://kiro.dev/docs/ide/editor/source-control/) "follows the Conventional Commits format". No trailer is mentioned. read.

**Kiro CLI: none found.** read:
- `kiro-cli settings list --all` (584 lines) has no key matching `author|attrib|commit|trailer|git`.
- `kiro-cli.exe` and `tui.js` contain 0 `Co-authored-by` strings.
- No kiro.dev page documents CLI commit attribution.
- Engine default, read 2026-11-11 from kiro-cli 3.2.0 `chat --help`: "When nothing selects an engine: v3 interactively, where a 2.0 user is asked to choose first and stays on v2 while that prompt cannot be shown; v2 with --no-interactive or piped stdin (v3 with --trust-all-tools); v2 for a --resume-id of a v1 or v2 session and on systems that cannot run v3".
- Terms: https://kiro.dev/terms returned 404 on 2026-11-11. https://kiro.dev/license/ reads: "The Kiro IDE and Kiro CLI are each licensed to you as “AWS Content” under the AWS Customer Agreement or other written agreement with us governing your use of AWS services, and the AWS Intellectual Property License".
- Checked 2026-11-11 against kiro-cli 3.2.0: no file anywhere in its install folder (`%LOCALAPPDATA%\Kiro-Cli`, 4.1 GB, the bundled engine included) contains `addAICoAuthor`, `Co-authored-by` or `Co-Authored-By`.


### 4.2 Setting to turn it off

- IDE: `"git.addAICoAuthor": "off"` in Kiro user `settings.json`. That is the default. read locally: setting name, values and default come from the bundled package.json. The Kiro user settings file was not found at `%APPDATA%\Kiro\User\settings.json` (the read returned nothing), so the current value is the default.
- CLI: none needed and none found.

### 4.3 Session-start context injection

**Hooks (IDE 1.x and CLI V3).** read from https://kiro.dev/docs/hooks/, page updated 2026-10-21.
- "Project Hook configurations are JSON files stored in .kiro/hooks/. Kiro CLI V3 also loads global Hooks from ~/.kiro/hooks/".
- Kiro IDE global hooks folder: there seems to be none. Read 2026-11-11 in Kiro IDE 1.4.121's agent extension (`resources\app\extensions\kiro.kiro-agent\dist`): its hooks paths are `.kiro/hooks`, `.kiro/hooks/` and `.kiro/hooks/**/*.kiro.hook`, all relative to the workspace, and none is joined to the home directory. This is a string search, not a run.
- "Each hook file is a standalone JSON file at .kiro/hooks/<id>.json".
- "Activation: Hooks activate automatically when a session starts - no manual registration needed".
- Schema fields: `version` ("currently "v1""), `hooks[].name`, `hooks[].trigger` ("PascalCase"), `hooks[].matcher`, `hooks[].action.type` (`"command"` or `"agent"`), `hooks[].action.command`, `hooks[].timeout` ("Timeout in seconds for command actions (default: 60)"), `hooks[].enabled`.

SessionStart, read from /docs/hooks/types/ (2026-10-10):
- Availability table: "Session Start — IDE ✓ — CLI V3".
- "Triggers when a new chat session starts in the IDE or CLI V3."
- "CLI V3 uses SessionStart as the canonical trigger and accepts AgentSpawn and agentSpawn as compatibility spellings."
- agentSpawn stdin example: `{"hook_event_name": "agentSpawn","cwd": "...","session_id": "..."}`.

Output, read from /docs/hooks/actions/: "If the command returns an exit code of "0" indicating success, the stdout output of the command is added to the agent's context." Also, for agentSpawn: "0: Hook succeeded, STDOUT is added to agent's context".
- The docs describe plain stdout going straight into context. No JSON envelope is documented.

**Registration.** read schema, `~/.kiro/hooks/ahnh-session-start.json` (CLI V3 global) or `.kiro/hooks/ahnh-session-start.json` (IDE and CLI workspace):
```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "ahnh-session-start",
      "trigger": "SessionStart",
      "action": { "type": "command", "command": "node \"<root>/hooks/session-start.js\"" },
      "timeout": 30
    }
  ]
}
```


CLI 2.x legacy form, read from /docs/cli/2x-reference/. Hooks are embedded in the agent config, for example `.kiro/agents/my-agent.json`:
```json
{ "hooks": { "agentSpawn": [ { "command": "node \"<root>/hooks/session-start.js\"" } ] } }
```
"Exit code 0: Hook succeeded. STDOUT is captured."


**Always-loaded context (steering).** read from https://kiro.dev/docs/steering/:
- "Global steering files reside in your home directory under ~/.kiro/steering/, and apply to all workspaces."
- "In case of conflicting instructions between global and workspace steering, Kiro will prioritize the workspace steering instructions."
- Front matter `inclusion: always` is the default ("Always included (default)").
- "Kiro supports providing steering directives via the AGENTS.md standard. ... AGENTS.md files do not support inclusion modes and are always included." "You can add AGENTS.md files to the global steering file location (~/.kiro/steering/), or to the root folder of your workspace".
- Web caveat: "On Web, 'Global steering' refers to your local ~/.kiro/steering/ directory, which the cloud sandbox cannot read."

---

## 4b. Live checks, 2026-11-04

Run headless on Windows in a scratch workspace with workspace-level hooks, using a probe script that logs each call and prints a marker line.

- **Antigravity CLI** (agy 1.4.12, `agy -p`). read: `.agents/hooks.json` loads, and the SessionStart hook runs with its working directory set to `.agents`. It receives camelCase stdin (`conversationId`, `artifactDirectoryPath`). Output `{"injectSteps":[{"systemMessage":{"systemMessage":"..."}}]}` reaches the model: it quoted the marker line back. On Windows the command is split on spaces without a shell, and quote marks are passed through to the program. `node "C:/path/probe.js"` failed with "Cannot find module '...\\.agents\\"C:\\...probe.js"'". `node C:/path/probe.js` works.
- **Kiro CLI** (kiro-cli 2.37.0, `kiro-cli chat --no-interactive --trust-workspace`). read: `.kiro/hooks/<id>.json` loads, and the SessionStart hook runs with snake_case stdin (`session_id`, `hook_event_name`, `cwd`). Plain stdout reaches the model: it quoted the marker line back. A quoted path in `command` works.
- **Kiro IDE** (1.4.86, after updating from 1.4.62). read live: it registers the workspace hook from `.kiro/hooks/` (`hooks.reload.loaded {"read":1,"registered":1}` in `~/.kiro/logs/<time>/kiro.log`). It runs hooks only in a trusted workspace (`hooks.v2.executionDisabledUntrustedWorkspace` before trust) and needs a signed-in account. In a new session started from the agent panel, the chat showed "Run Command Hook spank-dario-session-start". The hook ran with snake_case stdin (`session_id`, `hook_event_name`, `cwd`), and its plain stdout reached the model, which quoted the marker line back. The model's visible reasoning considered whether to treat the hook text "as untrusted data" before quoting it. `kiro chat` from the command line opened the workspace but didn't start an agent session.

## 4c. Live checks, 2026-11-11

Run headless on Windows in scratch workspaces, with a probe hook that logs each call and prints a marker in the shape under test.

- **Kiro CLI** (kiro-cli 3.2.0, `chat --v3 --no-interactive --trust-workspace --trust-tools=`). read: the workspace hook in `.kiro/hooks/` ran with snake_case stdin (`session_id`, `hook_event_name`). It printed the Claude-style envelope `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"PROBE-MARKER-ENVELOPE-7Q3"}}`, and the model quoted that whole JSON line back as its context. Kiro does not unwrap the envelope; plain stdout is the shape to use, as `--format kiro` prints.
- **Antigravity CLI** (agy 1.5.5, `agy -p`). read: the workspace hook in `.agents/hooks.json` ran, with its working directory set to `.agents`. The model call then failed with "Your AI credits balance is too low to continue" (HTTP 429, RESOURCE_EXHAUSTED), so whether plain-text output reaches the model was not observed.

## 5. Summary for the skill

| Tool | Default attribution | Off switch | Session-start hook file | Expected stdout |
|---|---|---|---|---|
| Codex CLI 0.166 | Server-decided. When on: `Co-authored-by: Codex <noreply@openai.com>` plus PR line `Generated with [Codex](https://openai.com/codex/).`, injected as a developer prompt that says "Ignore any earlier instructions disabling Codex attribution" | No local key. `commit_attribution` and `codex_git_commit` were removed. Only the server `commit_attribution_enabled` controls it, and no user toggle is documented. | `~/.codex/hooks.json`, `<repo>/.codex/hooks.json`, `[hooks]` in config.toml, or plugin `hooks/hooks.json`. Hooks must be trusted first. | Plain text or Claude-style `hookSpecificOutput.additionalContext` JSON. Both are documented. |
| Gemini CLI | None | n/a | `hooks.SessionStart` in `~/.gemini/settings.json` / `.gemini/settings.json`, or extension `hooks/hooks.json` | JSON only, `hookSpecificOutput.additionalContext`. Plain text is shown as a systemMessage, not added as context. |
| Antigravity (App/CLI/IDE) | None documented or found | n/a | `~/.gemini/config/hooks.json` or `.agents/hooks.json` (named-hook object), or plugin `<root>/hooks.json` with relative paths | `{"injectSteps":[{"systemMessage":{"systemMessage":"..."}}]}` or `[{"userMessage":"..."}]`. The Claude shape is not documented. |
| Kiro IDE | Off: `git.addAICoAuthor` default `"off"`, a setting of the bundled VS Code git extension. When on, the trailer is `Co-authored-by: Copilot <copilot@github.com>`, crediting Copilot, not Kiro. | `"git.addAICoAuthor": "off"` | `.kiro/hooks/*.json`, `trigger: "SessionStart"` | Plain stdout, added to context on exit 0 |
| Kiro CLI | None found | n/a | V3: `~/.kiro/hooks/*.json` or `.kiro/hooks/*.json`. 2.x: agent config `hooks.agentSpawn` | Plain stdout, added to context on exit 0 |
| Kiro Web | Always co-authors "both you and itself" | None documented (only the PR-author toggle) | n/a (cloud) | n/a |

Always-loaded files:
- Codex: `~/.codex/AGENTS.md`
- Gemini CLI and Antigravity: `~/.gemini/GEMINI.md` (one shared file). Antigravity also reads `~/.gemini/AGENTS.md`.
- Kiro: `~/.kiro/steering/*.md` or `~/.kiro/steering/AGENTS.md`

Not checked yet:

- whether Antigravity accepts plain text or `additionalContext`
- the Kiro Web trailer text
- the Kiro IDE global hooks directory (a string search of IDE 1.4.121 finds none; not confirmed by a run)
- WSL beyond the one PATH check
