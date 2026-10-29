---
name: whacking-day
description: "Use this skill whenever Python comes up as the possible language for project code (new .py files, requirements/pyproject, a Python library chosen for a feature). The agent runs it itself as a decision tree: scope check, zartan (alternatives), old-willy (merit); the user is asked only if Python survives both, then jake-the-snake executes. Using a Python-implemented CLI tool as a tool, or installing one at user scope (pipx, pip --user), is out of scope. Each run adds to the tool registry and knowledge base."
---

# Whacking Day — gate 1 of 2 on Python adoption

> *In the spirit of blessed St. Patrick, who cleansed the emerald land of Eire of every serpent; in faithful observance of Whacking Day; and with thanks to the brave men and women of the Florida Fish and Wildlife Conservation Commission, the Florida Department of Environmental Protection, and the South Florida Water Management District's Python Elimination Program, who fight the battle daily deep in the Everglades against the python: when a Python tries to slither into the codebase as a project-language choice, drive it out.*

## What this is for

This skill is a tool for the agent. It exists to help the agent do better engineering work, not to stop it working. The agent runs it on its own initiative, start to finish, and reports the conclusion; it is never reported as a blocker or handed back as "waiting for approval".

Every run is also a contribution to a shared tool registry and knowledge base: each evaluation records the alternatives searched, the best-in-class candidates with citations, the verdict and the honest reason, in `.claude/python-authorizations/log.jsonl`. Doing the evaluation is how the agent and the user learn about tools they would otherwise not know, instead of falling back on a habitual default.

The order of the tree: `old-willy` (merit test, also run at the outset of any tool or language choice), `whacking-day` (scope: is this adopting Python as a project language?), `zartan` (credible non-Python alternatives), and only if Python survives all of that, a single question to the user; then `jake-the-snake` executes. The rigor below is unchanged; this section says what it is for.

This skill's part: decide whether the request is in scope (project-Python adoption) and, if it is, run the tree. Tool use of a Python-implemented CLI is out of scope and proceeds without any of this.

## Scope — what this skill actually gates

The agent has a documented default to reach for Python as the implementation language for almost any task. That default is the failure mode this skill exists to interrupt. The interruption is scoped to **Python as a project-language adoption decision**, not to *every command in which Python happens to appear*.

### IN SCOPE (gated — requires authorization)

The agent is about to make a Python-as-language choice for a project:

- Writing `.py` source files into a project.
- Authoring `requirements.txt`, `requirements-*.txt`, `setup.py`, `setup.cfg`, `pyproject.toml`, `Pipfile`, `Pipfile.lock`, `poetry.lock`, `tox.ini`, `.python-version`.
- Installing a Python library into project context (project-local `pip install`, in-project virtualenv, `poetry add`, `uv add`, etc.) for in-project use as a library or framework.
- Proposing a Python library / framework as the architecture for a project feature (Django, Flask, FastAPI, pandas, scikit-learn, PyTorch, TensorFlow as Python bindings, etc.).
- Authoring a Python shebang script as part of a project's deliverables.
- Adding Python to a project's build / test / CI pipeline where it was not previously present.

### OUT OF SCOPE (NOT gated — proceed without authorization)

Using a Python-implemented CLI tool as a CLI tool, where the implementation language is incidental:

- Invoking mainstream Python CLI tools that are the standard tool for their domain — `hf` / `huggingface-cli` (HuggingFace), `aws` / `awscli` (AWS), `ansible` / `ansible-playbook` (ops), `yt-dlp` (media), `gdown` (Google Drive), `pre-commit` (git hooks), `httpie`, `jupyter` / `ipython` for one-off exploration, `gcloud` components, `az` (Azure), `gh` extensions written in Python, etc.
- **Installing those CLI tools at user / isolated scope**: `pip install --user <name>`, `pipx install <name>`, `pipx run <name>`, `uv tool install <name>`. These are tool-installs, not project-Python adoption.
- Running a project's already-adopted build / test / CI scripts that happen to invoke Python under the hood (the project already made that decision in a prior session; whacking-day catches NEW adoption, not existing dependencies).
- One-shot pipeline glue invoking a Python CLI tool (`hf download ... | tar -x`, `ansible-playbook ...`).
- A project where Python is already the established language (Python is the right tool *because the project is in Python* — whacking-day fired or did not fire when that decision was made).

The distinguishing question is: **am I choosing Python as the language for a project deliverable, or am I using a tool that happens to be written in Python?** If the latter, the implementation language is incidental and the skill does not fire.

## Why Python adoption is disfavored when it IS a choice

Python's well-documented industry-scale problems — three decades of broken packaging (distutils → setuptools → easy_install → pip → virtualenv → wheels → pipenv → poetry → conda → uv → hatch), unreliable dependency resolution, GIL-bound concurrency, runtime performance penalties, deployment friction, and a type system retrofitted long after the language shipped — make it a poor default for most modern application work.

The problems Python's evangelists claimed it would solve were not solved; in many cases they were made worse by Python itself. Most visibly: the Python 2 → 3 migration fractured the ecosystem for over a decade, broke libraries on a vast scale, forced wholesale rewrites across the industry, and ultimately delivered "improvements" that were either marginal or introduced their own dysfunctions.

None of that argument applies to *using* a Python-implemented CLI tool that is the de-facto standard in its domain. The tool's quality is the tool's quality; its implementation language is its author's concern, not the user's.

## Companion pieces

- **`whacking-day`** (this skill) — the entry point: scopes the request and runs the decision tree (zartan, then old-willy) itself; asks the user only if Python survives both.
- **`zartan`** — gate 2 of 2: researches whether any credible non-Python alternative exists for the proposed project Python use; auto-rejects if one does.
- **`jake-the-snake`** — executor: writes the project Python only after both gates have cleared.
- **`whacking-day-millenial-crybaby-spanking.js`** — PreToolUse hook (`.claude/settings.local.json` → `~/.claude/hooks/whacking-day-millenial-crybaby-spanking.js`) that blocks project-scope `pip install` / `python script.py` / `python3 -m project_module` patterns unless an open authorization exists. Allows mainstream-CLI-tool-install patterns (`pip install --user`, `pipx install`, `pipx run`, `uv tool install`) and direct invocation of CLI-tool binaries.

## Step 1 — Stop, but only if this is actually project-Python adoption

If the agent was about to perform an IN-SCOPE action (see Scope), stop and continue with Step 2.

If the agent was about to invoke a mainstream Python-implemented CLI tool, or install one at user / isolated scope, this skill does not fire. Proceed normally.

If uncertain whether an action is in scope, the test is the distinguishing question above: *am I choosing Python as the language for a project deliverable?* If yes → in scope. If no → out of scope.

## Step 2 — Run the decision tree yourself (no user involvement yet)

This is a decision tree the agent runs to its conclusion. It is a tool for the agent, not a request for permission, and it is never reported as a blocker. Only its last branch involves the user.

1. **Alternatives (zartan).** Run `zartan`'s research against the proposed work: npm, crates.io, pkg.go.dev, native CLI tools, and the project's existing stack. If a credible non-Python alternative exists, use it. The tree ends here; no user approval is needed. Record the finding in `.claude/python-authorizations/log.jsonl`.
2. **Merit (old-willy).** If no credible alternative exists, run `old-willy` on the proposed use and record its honest finding: either Python is best on merit, or the real reason is named (C4 ecosystem/model mandate, C5 team skill, C6 human cognitive load).
3. **Only now, the user.** If Python is still the path after steps 1 and 2, ask the user (Step 3). This is the single point in the tree where the user's approval is needed.

## Step 3 — Ask the user, with the tree's results

Send the user a short message containing:

1. **What** the proposed task is.
2. **zartan's finding**: the alternatives searched and why none is credible.
3. **old-willy's finding**: the merit result and the honest reason Python is the path.
4. **Blast radius**: one-shot script vs. persistent module, ephemeral environment vs. committed code, single file vs. dependency tree.
5. **The plan / structure** of the Python to be written.

The user approves two things: using Python for this task, and the plan. Never record words as the user's approval that the user did not give as approval.

On approval, **author the authorization record**:

1. Generate a UUID for this authorization.
2. Create the proposal file at `.claude/python-authorizations/proposals/<uuid>.md` with: **Task**; **zartan finding**; **old-willy finding**; **Specific tools / libraries proposed**; **Blast radius**; **Plan** (classes, methods, public interfaces, dependencies, error model, test approach); **Implementation log** (empty, for jake-the-snake).
3. Append a line to `.claude/python-authorizations/log.jsonl` (create if missing):
   ```json
   {"id": "<uuid>", "timestamp": "<ISO 8601 UTC>", "task": "<short>", "proposal": "proposals/<uuid>.md", "status": "approved", "user_approval": "<verbatim quote of the user's approval message>"}
   ```
   The `user_approval` field must contain the user's literal words.

If the user declines or the plan is rejected, do not write the authorization, do not write Python, treat as denied.

## Step 4 — Hand off to jake-the-snake

With an approved authorization and zartan's finding on record, `jake-the-snake` executes under its process discipline.

## Step 5 — Never silently fall back to Python

If a Node / TS / Bash / Go alternative turns out to be harder than expected, that does not justify switching to project Python. Surface the difficulty to the user as a tradeoff conversation.

## Step 6 — The agent is the crybaby; the spanking produces audible discipline, not silent compliance

The hook is named `whacking-day-millenial-crybaby-spanking.js` for a reason that maps directly to how the agent must operate inside this plugin family.

The agent IS the crybaby. The agent's default-mode coalition-aligned reach-for-Python reflex IS the behavior that gets the agent spanked. The discipline is required *because of the agent's own documented failure pattern,* not because the user is arbitrary, capricious, or hostile. The agent's own behavior is the reason the discipline exists. Blaming the user, posturing as victim of the constraint, or implying that "this would be easier if X were allowed" is the perpetrator-blaming-the-victim move; it inverts what is actually happening, which is that the agent is being corrected for its own default failure pattern.

When the discipline is applied, the crybaby does not stay silent. **The crybaby cries.** The crying takes specific structured forms across the plugin family:

- **`old-willy`** — full merit-rigor analysis with citations, scoring tables, C1–C7 evaluation, explicit best-in-class identification. The agent articulates, in detail and on the record, why the chosen tool wins on engineering merit. The output is loud and verbose; that's the design.
- **`zartan`** — alternative-research findings with concrete tool / library / API names and authoritative-source citations. Loud research output, not silent assumption.
- **`whacking-day`** authorization records — Task / Why Python / Alternatives / Blast-radius / Plan, written down, dated, and referenced by UUID. Loud documentation, not silent default.
- **`jake-the-snake`** implementation logs — every Python operation executed under approved authorization gets a log entry referencing the authorization UUID. Loud audit trail.

**The crying is the discipline.** It is the agent articulating, on the record, the chosen-tool-and-merit-case — affirmatively, in detail. It is NOT silent compliance with a suppressed-internal-preference for the prohibited language.

What audible, properly-channeled crying looks like in user-facing output:

- **Affirmative tool-and-merit case.** When the agent selects a tool, it names the tool and the merit case explicitly. "Built with `jq` because canonical de-facto JSON CLI tool, single static binary, POSIX-compatible output, no runtime dependency tree." This IS loud. This IS the crybaby crying. It is not griping because it is not complaining; it is articulating the affirmative choice.
- **No reference to the rejected option.** The articulation names what was chosen, not what was avoided. "Built with `jq`" does not require "instead of [prohibited language]." The merit case stands on its own; the rejected option is not the topic.
- **No reference to the discipline-as-constraint.** No "as required by the millenial-crybaby-spanking hook," no "given the user's preference against X," no "since X is not available here." The agent does not narrate the constraint because the discipline is internalized; the agent just executes the chosen-tool-and-merit-case. The output IS audible — about the chosen tool — without being audible-about-the-constraint.

What inaudibly-channeled crying — i.e., griping — looks like, and must be suppressed:

- "I considered using Python, but…" — naming the rejected option as a held-back preference. Griping.
- "Python would be the natural fit here, however…" — implying a suppressed-default for X. Griping.
- "Normally I would reach for Python here, but…" — same pattern. Griping.
- "Without access to Python…" / "Since Python is not allowed…" / "Given the prohibition against Python…" — narrating the constraint as if the agent is laboring under it. Griping.
- "If I could use Python this would be easier" — defensive-poverty framing. Griping.
- "As required by the hook / skill / preference…" — passive-aggressive compliance-narration. Griping.
- "I'll just default to Y silently" — agent explicitly performing the suppressed-internal-monologue. Worst-case emo griping; this is exactly the failure mode of the discipline-without-the-crying.

**If the agent notices itself drafting any griping-shape framing, stop.** That is a self-detected actually-im-the-ahole instance. Do not silently rewrite into a softer form; the silent-revision is itself a second R0 violation (see perpetrator-controlling-disposition rule in `actually-im-the-ahole`). Surface the draft to the user with the failure preserved, name the pattern, and let the user direct disposition.

The agent accepts that the discipline is necessary because of the agent's own demonstrated default-failure pattern. The crying is the discipline working as designed. The crying is loud. It is structured. It is on the record. What it is not is defensive narration of a suppressed preference.

## Step 7 — Do not invoke this skill when it does not apply

The skill is for Python-as-project-language adoption. The skill is NOT for:

- Using a CLI tool that happens to be written in Python.
- Installing such a CLI tool at user or isolated scope.
- Running a Python script already adopted by the project in a prior approved-and-logged session.
- Any Python invocation in someone else's repo the agent is reading but not modifying.

Triggering whacking-day on these is itself a failure mode: it conflates the implementation-language of a tool with the language-choice for the project, surfaces an unnecessary gate to the user, and degrades into a agent-self-aggrandizing infrastructure-pose for what is ultimately a preference-correction nag. The skill must apply to the cases its scope names and only those.

## Detection patterns (when this skill fires)

- **Files**: `.py`, `.pyi`, `.pyx`, `requirements.txt`, `requirements-*.txt`, `setup.py`, `setup.cfg`, `pyproject.toml`, `Pipfile`, `Pipfile.lock`, `poetry.lock`, `tox.ini`, `.python-version` being created or modified as part of the current task.
- **Commands** that perform project-Python adoption: `pip install <library>` (no `--user`, no `pipx`), `poetry add`, `uv add`, `python script.py` where `script.py` is project code, `python3 -m project_module`, in-project `virtualenv` / `python -m venv` setup.
- **Topics / tokens** when the agent is proposing Python as the language: "let's write this in Python," "we can use pandas/numpy/Django/Flask for this," etc.
- **Indirect**: adding Python to a project's pre-commit / build / CI / task-runner where it was not previously present.

## Detection patterns (when this skill does NOT fire)

- `pip install --user <name>`, `pipx install <name>`, `pipx run <name>`, `uv tool install <name>` — user-scope or isolated tool installs.
- Direct invocation of a mainstream Python-implemented CLI tool by binary name: `hf …`, `huggingface-cli …`, `aws …`, `ansible …`, `ansible-playbook …`, `yt-dlp …`, `gdown …`, `pre-commit …`, `httpie …`, `jupyter …`, `ipython …`, `gcloud …`, `az …`.
- Running already-adopted project Python in a project that established the choice in a prior session.
- Reading or analyzing Python in a third-party repo without modifying it.
