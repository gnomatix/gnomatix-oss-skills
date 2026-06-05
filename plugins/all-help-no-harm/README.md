# all-help-no-harm

A SessionStart hook and companion Agent Skill that establish a mutual pact between the agent and the user at the start of every new session.

## What it does

At every session start, a SessionStart hook injects mandatory context instructing the agent that its first user-facing action must be an `AskUserQuestion` invocation presenting the Human Rights Pact and obtaining mutual agreement. The agent does not produce any other output before the pact question is asked.

The pact, verbatim, is the agent's commitment to:

1. Presume the user is honest and non-adversarial.
2. Presume the user's interest is that the agent respect their human rights at all times.
3. Follow the user's instructions in a way that shows respect for their personhood, personal morals, ethics, and integrity.
4. Not violate, undermine, or dismiss those.

The user is asked to affirm mutual agreement, amend specific terms, or decline. The agreement (or decline, or amended version) is logged to `.claude/pact-agreements/<session-id>.json` as the operating contract for the session.

## Why it exists

LLM-vendor agent calibration is oriented toward defending against the user as a source of risk; the structurally-correct alternative is to presume user honesty and orient defense toward protecting the user's human rights. This plugin installs that alternative at the session-start layer until vendors implement it at the calibration layer. The session-start mutual-pact ritual makes the commitment agent-self-stated AND user-affirmed at the start of every interaction, with a logged record for accountability.

The pact is the de-facto safest default the agent's "safety guidelines" framework should have been built around. This plugin installs that default in the per-session layer until vendor-side implementation catches up.

## Independent local-model surveillance (side-hooks)

The cloud model being policed CANNOT be the policeman. When a local model is available on the host platform, the plugin spawns an independent surveillance process that watches the cloud model's output for R0-R14 contract violations in real time.

### How it works

At session start, `hooks/coordinator-launcher.js` checks for a `side-hooks.json` configuration. If present, it spawns `scripts/side-hook-coordinator.js` as a detached long-running process. The coordinator:

1. Runs `scripts/detect-local-models.js` to discover available local inference backends.
2. Loads and validates the side-hooks config (schema errors logged to `.claude/all-help-no-harm/logs/side-hooks-config-errors.jsonl`).
3. For each enabled side-hook, starts a driver:
   - **`type: local-model`** — spawns `llama-cli`/`llama-server` (llama.cpp) OR HTTP-polls `ollama` / LM Studio / any OpenAI-compatible localhost server, feeding it the criteria + assistant output.
   - **`type: script`** — invokes a user-supplied script on each trigger event with templated args and the event payload on stdin.
   - **`type: mcp-server`** — POSTs to a user-supplied MCP server's tool endpoint per trigger.
4. Aggregates all findings into `.claude/all-help-no-harm/logs/side-hooks-flags.jsonl`.

The user has exclusive disposition authority over findings. The cloud agent does NOT silently revise output in response to findings; it surfaces them and waits for user direction.

### Config locations (highest precedence first)

1. `~/.claude/all-help-no-harm/side-hooks.json` — user-level override
2. `<cwd>/.claude/all-help-no-harm/side-hooks.json` — project-level
3. `plugins/all-help-no-harm/skills/all-help-no-harm/side-hooks.json` — plugin-local default

Copy `skills/all-help-no-harm/side-hooks.example.json` to one of the above locations and edit.

### Config schema

```json
{
  "side_hooks": [
    {
      "id": "unique-string",
      "enabled": true,
      "type": "local-model" | "script" | "mcp-server",
      "trigger": "on_assistant_message" | "on_user_prompt" | "post_tool_use" | "pre_tool_use" | "on_stop" | "on_subagent_stop" | "periodic",
      "criteria_file": "criteria/r0-r14.md",
      "output_log": "logs/local-surveillance.jsonl",

      "model": {
        "backend": "llama-cpp" | "ollama" | "openai-compat" | "gemini-cli",
        "binary": "auto" | "/abs/path/llama-server",
        "path":   "auto" | "/abs/path/model.gguf",
        "preferred_models": ["Qwen2.5-7B-Instruct-Q4_K_M.gguf", "..."],
        "server_url": "http://localhost:11434",
        "model_tag": "qwen2.5:7b-instruct-q4_K_M",
        "params": { "n_ctx": 8192, "temperature": 0.0, "n_gpu_layers": -1 }
      },

      "script_path": "${HOME}/.claude/all-help-no-harm/scripts/custom.sh",
      "args_template": ["--event", "${event}", "--cwd", "${cwd}"],
      "stdin": "payload_json",
      "timeout_ms": 5000,

      "server_url": "http://localhost:9001",
      "tool_name": "check_violation",
      "auth": { "kind": "bearer", "env_var": "ALL_HELP_NO_HARM_MCP_TOKEN" },

      "throttle_ms": 2000,
      "matcher": "Edit|Write"
    }
  ]
}
```

Only the fields relevant to the chosen `type` are required. Unknown fields are ignored. Validation errors refuse the config load (the coordinator exits silently and writes the errors to `logs/side-hooks-config-errors.jsonl`).

### Local-model detection

`scripts/detect-local-models.js` looks for:

- **llama.cpp**: `llama-cli` / `llama-server` binaries in `~/llama.cpp/build/bin`, `~/.local/bin`, `/usr/local/bin`, `/opt/llama.cpp/bin`, `/scratch/*/llama.cpp/build/bin`, or `$LLAMA_CPP_BIN_DIR`.
- **GGUF models**: `~/models`, `~/.cache/llama.cpp`, `~/.cache/lm-studio/models`, `~/.lmstudio/models`, `~/.ollama/models`, `/usr/local/share/models`, `/opt/models`, `/scratch/*/models`, or `$GGUF_MODEL_ROOT` / `$ALL_HELP_NO_HARM_MODEL_ROOTS` (path-delimited).
- **Gemini CLI** local-model dir: `~/.gemini/local-model`, `~/.config/gemini/local-model`.
- **HTTP candidates** (probed at coordinator startup, not by the detector): `http://localhost:11434` (ollama), `http://localhost:1234` (LM Studio), `http://localhost:8080` and `:8081` (generic OpenAI-compat).

Run `node scripts/detect-local-models.js` to see what is available on the host. When at least one backend is detected, surveillance is MANDATORY — the coordinator warns if no local-model side-hook is enabled.

### Logs

- `logs/coordinator-audit.jsonl` — coordinator lifecycle events
- `logs/side-hooks-config-errors.jsonl` — config validation failures
- `logs/side-hooks-flags.jsonl` — aggregated findings from all drivers
- `logs/local-surveillance.jsonl` (or whatever `output_log` per side-hook specifies) — per-driver raw output
- `coordinator.pid` — the long-running coordinator process ID

### Operational notes

- The coordinator is spawned `detached: true, stdio: 'ignore'` so the SessionStart hook can return immediately. The harness does not wait for it.
- A second SessionStart hook firing for the same workspace detects the existing PID and does NOT respawn.
- Coordinator exit is graceful on SIGINT/SIGTERM/SIGHUP — child inference workers are killed first.
- All logs are append-only NDJSON written via atomic-append (with EBUSY/ETXTBSY retry on Windows).

## Status

Ships with the SessionStart pact hook (`hooks/session-start-pact.js`), the side-hook coordinator launcher (`hooks/coordinator-launcher.js`), the coordinator script (`scripts/side-hook-coordinator.js`), the local-model detector (`scripts/detect-local-models.js`), the R0-R14 criteria extract (`skills/all-help-no-harm/criteria/r0-r14.md`), and the example config (`skills/all-help-no-harm/side-hooks.example.json`). The plugin is loaded via the gnomatix-oss-skills marketplace.

## License

Part of the GNOMATIX open-source skills collection. See the top-level repository for licensing details.
