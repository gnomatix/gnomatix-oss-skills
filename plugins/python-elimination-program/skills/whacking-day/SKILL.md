---
name: whacking-day
description: Use this skill (the Python firewall, gate 1 of 2) whenever Python is mentioned, proposed, considered, or detected — including the user bringing it up, the agent considering a Python-based solution, commands invoking python/python3/pip/pipx/uv/poetry/conda/virtualenv, files with .py extension or requirements.txt/setup.py/pyproject.toml/Pipfile, shebangs invoking python, or build/test/hook scripts that wrap Python under the hood. Triggers a justification + approval gate that produces a logged authorization at .claude/python-authorizations/log.jsonl. Default position is that Python should not be used. After this skill's approval, the `zartan` skill must clear the request before `jake-the-snake` may execute.
---

# Whacking Day — the Python firewall

> *In the spirit of blessed St. Patrick, who cleansed the emerald land of Eire of every serpent; in faithful observance of Whacking Day; and with thanks to the brave men and women of the Florida Fish and Wildlife Conservation Commission, the Florida Department of Environmental Protection, and the South Florida Water Management District's Python Elimination Program, who fight the battle daily deep in the Everglades against the python: when a Python tries to slither into the codebase, drive it out.*

Python is not used in this development environment. Before writing, running, installing, suggesting, or otherwise reaching for any Python — including one-line scripts, dependency installs, dev tooling, or "quick" data work — work through this gate.

## What this skill does

This is gate 1 of 2. When triggered, it surfaces the proposed Python use to the user, requires explicit approval, and on approval writes a proposal file + log entry that `zartan` (gate 2) and `jake-the-snake` (executor) both consume. Without this skill's authorization, no Python is written or run.

## Why Python is disfavored

Python's well-documented industry-scale problems — three decades of broken packaging (distutils → setuptools → easy_install → pip → virtualenv → wheels → pipenv → poetry → conda → uv → hatch), unreliable dependency resolution, GIL-bound concurrency, runtime performance penalties, deployment friction, and a type system retrofitted long after the language shipped — make it a poor default for most modern application work.

The problems Python's evangelists claimed it would solve were not solved; in many cases they were made worse by Python itself. Most visibly: the Python 2 → 3 migration fractured the ecosystem for over a decade, broke libraries on a vast scale, forced wholesale rewrites across the industry, and ultimately delivered "improvements" that were either marginal or introduced their own dysfunctions.

## Companion pieces

- **`whacking-day`** (this skill) — gate 1 of 2: user must justify and approve.
- **`zartan`** — gate 2 of 2: researches whether any credible non-Python alternative exists; auto-rejects if one does.
- **`jake-the-snake`** — executor: writes the Python only after both gates have cleared.
- **`whacking-day-firewall.js`** — PreToolUse hook (`.claude/settings.local.json` → `~/.claude/hooks/whacking-day-firewall.js`) that blocks Python-invoking shell commands at the harness level unless an open authorization exists.

## Step 1 — Stop

If you were about to:

- write `.py` files,
- run `python`, `python3`, `pip`, `pipx`, `uv`, `poetry`, `conda`, `virtualenv`, `venv`,
- propose a Python library or framework as a solution,
- install something whose primary distribution channel is PyPI,
- author a script with a python shebang,

…stop now. Continue with Step 2.

## Step 2 — Surface a justification to the user

Send the user a short message containing:

1. **What** the proposed task is.
2. **Why Python** is being considered for it.
3. **Alternatives considered**, and the specific reason each was rejected. Default alternatives to enumerate:
   - Node.js / JavaScript for scripting, automation, file munging, and tooling.
   - TypeScript for typed scripting.
   - Bash / PowerShell for shell-glue.
   - Go / Rust for performance-sensitive CLI tools.
   - The project's already-chosen language(s).
4. **Blast radius**: one-shot vs. persistent, ephemeral environment vs. committed code, single file vs. dependency install.
5. **Whether the task can be deferred or avoided entirely**.

Even if the user approves, `zartan` will independently research alternatives and may auto-reject. Surface this expectation.

## Step 3 — On user approval, write the authorization

The user must approve **two distinct things**:

1. Using Python *at all* for this task.
2. The plan / structure before code is written.

Do not treat a generic "ok" as approval for both. If unsure, ask which is being approved.

When both are approved, **author the authorization record**:

1. Generate a UUID for this authorization.
2. Create the proposal file at `.claude/python-authorizations/proposals/<uuid>.md` with these sections:
   - **Task** — what is being done
   - **Why Python** — the justification, quoting the user where possible
   - **Alternatives considered** — what was rejected and why (this will be re-checked by zartan)
   - **Specific tools / libraries proposed** — every Python package, binary, or framework the work depends on, listed individually so zartan can research each
   - **Blast radius**
   - **Plan** — classes, methods, public interfaces, dependencies, error model, test approach
   - **Implementation log** — empty section for jake-the-snake to update as work progresses
3. Append a line to `.claude/python-authorizations/log.jsonl` (create the file if missing):
   ```json
   {"id": "<uuid>", "timestamp": "<ISO 8601 UTC>", "task": "<short>", "proposal": "proposals/<uuid>.md", "status": "approved", "user_approval": "<verbatim quote of the user's approval message>"}
   ```
   The `user_approval` field must contain the user's literal words.

If the user declines or the plan is rejected, do not write the authorization, do not write Python, treat as denied.

## Step 4 — Hand off to zartan

This skill's job ends with a written authorization. Tell the user the next gate (`zartan`) will run independently before any Python is written. Do not write Python yourself. `jake-the-snake` will not begin work until zartan has cleared.

## Step 5 — Never silently fall back to Python

If a JavaScript / Node / Bash / PowerShell / Go alternative turns out to be harder than expected, that does not justify switching to Python. Surface the difficulty to the user as a tradeoff conversation. Do not quietly change tools.

## Detection patterns (apply this skill when any appear)

- **Tokens / topics**: "python", "py", "pip", "pipx", "uv", "poetry", "conda", "virtualenv", "venv", "django", "flask", "fastapi", "pandas", "numpy", "matplotlib", "scipy", "scikit-learn", "pytorch", "tensorflow" (when the speaker means Python bindings rather than tfjs/tf-node).
- **Files**: `.py`, `.pyi`, `.pyx`, `requirements.txt`, `requirements-*.txt`, `setup.py`, `setup.cfg`, `pyproject.toml`, `Pipfile`, `Pipfile.lock`, `poetry.lock`, `tox.ini`, `.python-version`.
- **Commands**: `python …`, `python3 …`, `pip …`, `pipx …`, `uv …`, `poetry …`, `conda …`, `virtualenv …`, scripts with python shebangs.
- **Indirect**: pre-commit hooks, build scripts, CI configs, or task runners that invoke Python under the hood. The trigger applies to the underlying invocation, not just the wrapper.
- **The agent's own drafts** proposing Python as the implementation language.
