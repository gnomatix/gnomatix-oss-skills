# goal-compliant-task-queue: system design

Source of requirements: Brett's words, in [`../skills/goal-compliant-task-queue/references/brett-spec.md`](../skills/goal-compliant-task-queue/references/brett-spec.md). Principle (Brett, 2026-11-05 23:46): "a RELIABLE SOFTWARE TOOL will do PROGRAMMATIC work"; and "NO FUCKING HOOKS".

## Components

| Component | Files | Job |
|---|---|---|
| Core library | `lib/worklog.mjs` | All state, rules and refusals. Every other component calls it. |
| CLI | `scripts/worklog`, `lib/cli.mjs` | The agent's command-line interface; text arguments as files so his words arrive byte for byte. |
| MCP server | `lib/mcp-server.mjs`, `.mcp.json` | The same operations as `worklog_*` tools over stdio JSON-RPC; no network. |
| Page template | `templates/working-document.html` | One dependency-free page for both the hub (`mode: "hub"`) and each document (`mode: "doc"`); content embedded as JSON; the store holds only Brett's ticks and comments. |
| claude.ai hub | built by `artifact-payload --hub` | Tab per open question; the claude.ai equivalent of the pane (A31). |
| claude.ai documents | built by `artifact-payload <slug>` | One per open question (A14). |
| Claude Code pane | `hooks/hooks.json`, `hooks/register.tsx`, `types/index.d.ts` | Tabbed pane from `worklog.json`; `/worklog-pane`. Intercepts nothing. |
| Skill | `skills/goal-compliant-task-queue/SKILL.md` | When the agent runs each step; cites the A-numbers. |
| Commands | `commands/worklog.md`, `commands/worklog-status.md` | Brett's views of the queue. |
| Curator | `agents/task-queue-curator.md` | Optional background audit (config `curator.enabled`). |
| Config | `${XDG_CONFIG_HOME:-~/.config}/goal-compliant-task-queue/config.json` | Brett's switches; read and validated, never written. |

## Stores

| Store | Writer | Readers |
|---|---|---|
| `<state>/questions/<slug>.json`: subject, quote, task id, URL, status, sections, review, review history, asks, answers, records | `worklog` only | everything |
| `<state>/prompts/YYYY-MM-DD.jsonl`: every prompt verbatim with id | `worklog log` | metrics, curator |
| `<state>/worklog.json`: the sync view (open questions oldest first, active, hub URL) | `worklog sync` | pane, hub page |
| `<state>/hub.json`: hub URL | `worklog link --hub` | sync |
| `<state>/docs/<slug>/payload/`, `<state>/hub/`: pages, capabilities, ArtifactData files | `artifact-payload` | the agent's Artifact / ArtifactData calls |
| `<state>/pane-ticks.json`: ticks Brett makes in the pane | the pane | `worklog pull --pane` |
| claude.ai page store, collection `review` (`<sid>` or `<slug>~<sid>` on the hub): Brett's ticks and comments | the page, owner only | ArtifactData `list` → `worklog pull` |
| claude.ai page store, collection `items` | the agent (ArtifactData, as owner) | mirror for other readers |
| beads | `worklog resolve` (`bd create`), the agent (`bd close`) | curator, Brett |

## Data flow

```
receipt ──log──▶ prompts/*.jsonl                                      (A22, A25, A27)
   │ agent classifies: question?
   ▼
TaskCreate + worklog open ──▶ questions/<slug>.json (status open)      (A1, A5, A14)
   ▼
worklog section … (answer in section 2, materials, context)            (A9, A15, A16)
   ▼
artifact-payload ──▶ page.html + capabilities.json + batch.json
   ▼ agent: Artifact publish, worklog link, ArtifactData batch; same for the hub; worklog sync for the pane   (A17, A18, A31)
Brett ticks / comments on the page, hub or pane
   ▼ agent: ArtifactData list out_dir ──▶ worklog pull               (A11)
agent asks "Have I sufficiently responded to your question?" ──▶ worklog asked   (A2, A6)
   ▼
Brett replies ──▶ worklog answer (verbatim; exact "yes" → answered; else open)   (A2, A3)
   ▼ only if answered
worklog resolve ──▶ bd create … --status in_progress ──▶ status resolved          (A2, A7, A13)
   ▼ agent: log work, memories, review; then bd close                (A2)
```

## Stage gates and metrics (A28, A29)

Gates enforced by the tool (refusals, exit code 2):

1. `open`: a second document for the same slug; a subject that only repeats his words (A5, A14).
2. `section 1`: his question cannot be rewritten.
3. `asked`: no answer written yet (A2: ask only when the evidence shows it is answered).
4. `answer`: only an exact "yes" after an ask moves to `answered`.
5. `resolve`: anything but `answered` (A2, A7); a half-finished earlier resolve; a failed `bd create` leaves the question `answered` and records nothing.
6. Every write: config disabled or invalid.

Metrics (`worklog metrics`): questions opened / open / answered / resolved; minutes from open to first ask, per question and median; first-ask "yes" against rework; asks in total; answers ready but not asked; orphans; records made before "yes" (must be 0); prompts logged by source.

## Failure modes and how each is detected

| Failure | Detection |
|---|---|
| Question left unasked while new ones open (A6) | `open` warns; `status` "Answer ready, Brett not asked"; hub ● and pane ⚠️; metric `ready_not_asked` |
| Record made before "yes" (A7) | `resolve` refuses; `status` / `metrics` `records_before_yes` |
| Task without a document, document without a task or page | `status --tasks <ids>` orphans |
| His words altered | stored as read; tests compare bytes (profanity, quotes, CRLF, U+2028, emoji) |
| Page script broken by content (the q1.html incident) | content is JSON in a data script with `<` escaped; tests parse every generated page's script |
| Pane or hub stale (A18) | both built from one `worklog sync`; test checks the hub's data equals `worklog.json` |
| Two writers at once | lock file; stale lock removed after 60 s |
| Crash mid-write | temp file + rename; tests check no temp or lock files remain |
| Crash between `bd create` and the state write | a `creating` record is saved first; the next `resolve` refuses and says to check beads |
| Agent ticks a box (A9) | page store rules: `review` writable only by the owner; the agent has no tick command; curator flags it |
| Diverging ticks (page, hub, pane) | `pull` keeps the later `updated`; full history in `review_history` |

## Requirement traceability

| A | Requirement (short) | Component | Test (`tests/worklog.test.mjs` unless noted) |
|---|---|---|---|
| A1 | Questions go in the task queue, not beads | skill steps 3–4; `open` creates no record | `resolve: refused before "yes"…` |
| A2 | Active until the ask; "yes" → bead, active; review; else back to discussion | `asked`, `answer`, `resolve` (`--status in_progress`); skill 17–21 | `asked / answer…`, `resolve…` (both) |
| A3 | Task stays open while he answers | `answer` keeps `open` unless "yes" | `asked / answer…` |
| A4 | Don't spam the task list | skill step 2 (only questions) | judgment (curator checks) |
| A5 | Descriptive Jira-style subjects | `open` requires `--subject`, refuses one equal to the quote | `open: creates…` |
| A6 | Don't let questions sit unasked | `open` warning, `status`, hub ●, pane ⚠️ | `open warns…`, `status…` |
| A7 | Records only after resolution | `resolve` gate | `resolve: refused before "yes"…`, MCP test |
| A8 | Visible markdown-style artifact in the pane | hub, documents, pane | page parse tests; `hooks/pane.test.tsx` |
| A9 | Only Brett ticks; USER COMMENT; FULL CONTEXT; SUPPORTING MATERIALS | template; `CAPABILITIES` owner-only `review`; sections | `artifact-payload…` (capabilities), `section…` |
| A10 | Editable user comment box | template textarea (owner) | page parse tests |
| A11 | Document before asking; his response updates it | skill 14–15; `pull`; answers shown on page and pane | `pull…`, `pull --pane…` |
| A12 | Asking is high cost for the agent; authorization still asked | skill 14 | judgment |
| A13 | Triage what goes into beads | `resolve` gate; bead body built from the record | `resolve…` |
| A14 | One document per open question, linked from tasks | `open` duplicate refusal; `task_id`; skill 13 | `open: creates…` |
| A15 | Clickable links, emoji preferred, hover text | `parseMaterial`, `iconFor`; template links with `title` and accessible name | `section…` |
| A16 | Self-answering questions stated plainly | skill step 8 | judgment |
| A17 | Tabbed panel display | pane mod; hub page | `hooks/pane.test.tsx`; `hub and pane…` |
| A18 | Pane up to date | `sync` after each change; pane reloads at session start and on `/worklog-pane` | `sync…`, `hub and pane…` |
| A19–A21 | Own errors: apology, plan, non-destructive rollback-able fix | skill step 22 | judgment |
| A22 | Triage control point on receipt | `log`; skill 1–2 | `log…` |
| A23–A24 | Mock-up of the gino/gnobot/enkente intake; bionic pair | whole design | n/a (purpose) |
| A25 | Minimal information loss | verbatim storage everywhere | verbatim checks across tests |
| A26 | High-fidelity exchange | verbatim; materials; review history | as A25 |
| A27 | Capture and retention | `log`, records, bead body | `log…`, `resolve…` |
| A28 | Traceability, control points, metrics, gates | gates above; `status`, `metrics`; prompt ids | `status…`, `metrics…` |
| A29 | Atomic, component-driven, experiments with data | atomic writes, one function per operation, metrics | `a full run writes nothing outside…` |
| A30 | No Gitea issue tracking | beads only; nothing calls Gitea | (no Gitea code path) |
| A31 | claude.ai UI plus the Claude Code pane equivalent | hub + documents + pane from one sync | `hub and pane render the same data…` |
