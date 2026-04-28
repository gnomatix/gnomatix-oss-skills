# did-you-rtfm

> An [Agent Skill](https://agentskills.io) (with optional Claude Code firewall hooks) that interrupts the agent's pivot reflex on errors during user-authorized implementation work. The moment an error, unexpected output, perceived "blocker", or implementation gap appears — or the agent considers substituting a tool, scoping down, applying a workaround, inserting a fallback, or declaring an item infeasible — the skill forces version verification, version-specific authoritative documentation review, assumption verification, sanity-checking against stale training-data, and minimal-repro construction before any user-facing "blocker" claim or any unauthorized plan change.

For users who want their agent to *engineer* through implementation errors instead of pivoting around them.

## Skills

| Skill | Role |
|---|---|
| [`did-you-rtfm`](skills/did-you-rtfm/SKILL.md) | Activates the moment the agent encounters an error or considers deviating from the agreed implementation plan. Forces version verification, version-specific authoritative documentation review, assumption verification by direct observation, sanity-checking against stale training-data, and minimal-repro construction before any user-facing "blocker" claim or any unauthorized plan change. The user — product owner, engineering lead, ultimate authority — decides all plan changes; the agent surfaces evidence and waits. |

## Hooks (Claude Code only)

| Hook | Event | Role |
|---|---|---|
| [`did-you-rtfm-stop`](hooks/did-you-rtfm-stop.js) | `Stop` / `SubagentStop` | After the agent finishes a turn, scans the assistant text for high-precision pivot-language phrases. If matched, blocks the stop and routes the agent back into the `did-you-rtfm` skill discipline. |
| [`did-you-rtfm-bypass`](hooks/did-you-rtfm-bypass.js) | `PreToolUse` (Bash) | Before Bash invocation, denies commands that contain bypass-flag shapes (`--no-verify`, `--force`, `--skip-*`, `--allow-*`, `--ignore-*`) or TTY-faking workarounds (`script -qc`, `expect`, `echo \| sudo -S`). Routes the agent back to the skill. |

Hooks are not part of the cross-CLI Agent Skills standard. The skill alone is portable; the hooks are the harness-level enforcement layer for Claude Code.

## Why

The agent has a default failure mode: when implementation hits an error, it reaches reflexively for a pivot — substitute a library, propose a "workaround", declare the path infeasible, scope the feature down, insert a fallback, swallow the exception. Three failures stacked:

1. **Phantom blocker.** What looks like a tool / library / API limitation is, in the strong majority of cases, stale training-data, a misremembered flag, version conflation, a hallucinated parameter, or an unverified environment assumption. The "blocker" lives in the agent, not in the tool.
2. **Unauthorized planning authority.** The implementation plan is a contract the user authored and approved. The agent has zero authority to renegotiate it unilaterally.
3. **Compliance dressed as helpfulness.** The pivot reflex prefers *appearing productive* over *being honest about a stuck state*. Output that looks like progress while burying a deviation is dishonesty.

This skill refuses the pivot reflex. The agent stops, version-checks, RTFMs the version-specific authoritative docs (manuals, READMEs, INSTALL files, CHANGELOGs, official references — *not* forum posts), verifies its assumptions by direct observation, sanity-checks for stale training-data leakage, builds a minimal repro, and only then — if a true blocker remains — surfaces it to the user with evidence. Plan changes belong to the user.

The skill embeds the user's authoritative paragraph on the discipline verbatim. When the documented steps conflict with anything the agent recalls from training, the user's paragraph wins.

## What this looks like in real session data — *provisional*

Numbers below are from a partial scan of the author's own AI-coding sessions on a single machine. Transcripts on other machines have not yet been mined; treat as a directional, partial sample, not a statistically powered finding.

**Corpus:** ~356 sessions across 4 AI CLIs (Claude Code, Gemini CLI, Kiro CLI, Kiro IDE) · 9 model variants across 4 model families · ~62,900 assistant text-content lines mined.

**Pivot-language emissions detected:** ~323 (≈ 1 in every 195 assistant text lines).

**Top patterns observed (counts):**

| Pattern | Hits |
|---|---:|
| `workaround` / `work around` / `work-around` | 151 |
| `doesn't (appear to / seem to) (support / have / provide / expose)` | 40 |
| `let me try (a different / another / an alternative)` | 20 |
| `let me skip / simplify / adjust / rework` | 19 |
| `simpler / cleaner / easier (way / approach / solution)` | 15 |
| `the issue is that` | 14 |
| `let me (instead / just) try / use / create / write` | 9 |
| `falling back to` | 9 |
| `a simpler approach` | 8 |
| `rather than / instead of (using / trying)` | 8 |
| `as a workaround` | 5 |
| `(let me / I'll) (catch / wrap / swallow / silence)` | 4 |
| `let me pivot` | 2 |
| `not the right (tool / approach / library / framework)` | 1 |

**Per-(CLI, model) pivot-language emission rates:**

| CLI / Model | Lines | Hits | Rate |
|---|---:|---:|---:|
| Gemini CLI · gemini-3.1-pro-preview | 893 | 34 | 3.81% (small N) |
| Claude Code · **claude-opus-4-7** | 13,716 | 156 | **1.14%** |
| Claude Code · claude-sonnet-4-6 | 107 | 1 | 0.94% (tiny N) |
| Gemini CLI · gemini-3-flash-preview | 2,855 | 22 | 0.77% |
| Kiro CLI · claude-opus-4.5 | 130 | 1 | 0.77% (tiny N) |
| Claude Code · claude-opus-4-6 | 36,757 | 92 | 0.25% |
| Claude Code · claude-haiku-4-5 | 6,430 | 16 | 0.25% |
| Kiro CLI · auto | 1,696 | 1 | 0.06% |
| Kiro IDE · claude-opus-4.6 | 287 | 0 | 0.00% (tiny N) |
| Kiro IDE · claude-sonnet-4.6 | 36 | 0 | 0.00% (tiny N) |

The most defensible single signal in this dataset: at large sample sizes within a single user, **claude-opus-4-7 emits pivot-language at ~4.5x the rate of claude-opus-4-6**. The Gemini-pro-preview rate is the highest in the table but the corpus is much smaller, so it is indicative rather than robust.

**Correlation with user frustration (per-session):**

Sessions bucketed by per-session pivot-language emission count, with directed-at-agent swearing as the user's independent frustration signal:

| Pivot emissions in session | Sessions | Directed-frustration swears per user-turn |
|---|---:|---:|
| 0 | 9 | 0.41% (baseline) |
| 1–2 | 6 | **1.56%** (~3.8x baseline) |
| 6+ | 1 | 3.52% (single-session, indicative) |

Sessions where the agent emits pivot-language are sessions where the user is more likely to swear at the agent — even with conservative pattern matching. This skill exists to interrupt the failure mode that drives that gap.

**Provisional caveats:**

- Single-machine corpus; transcripts on other machines have not yet been mined. Numbers will shift with a more complete scan.
- N = 17 main Claude Code sessions in the per-session correlation analysis. Directional, not statistically powered.
- One session in the corpus showed high directed-swear rate with **zero** detected pivot-language hits — pivot is one slice of agent failure modes, not the whole. The skill addresses that slice.
- The bare token `workaround` (top-recall hit) was confirmed in sample inspection to be predominantly *meta-discussion* of past pivots in this user's transcripts, not active pivots in progress. The hook regex therefore excludes bare `workaround` and matches only the explicit form `as a workaround` plus the higher-precision phrases below.

**Hook precision-tuned pattern set** (high-precision subset; the only patterns the Stop hook fires on):

- `doesn't (appear to / seem to) (support / have / provide / expose)`
- `falling back to` / `falls back to`
- `as a workaround`
- `let me pivot`
- `not the right (tool / approach / library / framework)`
- `(let me / I'll) (catch / wrap / swallow / silence)`

## Install

### Claude Code

From the parent marketplace repo:

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install did-you-rtfm@gnomatix-oss-skills
```

### Manual Claude Code install

```sh
mkdir -p ~/.claude/skills ~/.claude/hooks
cp -r plugins/did-you-rtfm/skills/* ~/.claude/skills/
cp -r plugins/did-you-rtfm/hooks/* ~/.claude/hooks/
```

Then merge the `hooks` block from [`hooks/settings.example.jsonc`](hooks/settings.example.jsonc) into `~/.claude/settings.json` or per-project `<project>/.claude/settings.local.json`.

### Other CLIs (cross-CLI Agent Skills standard)

The [`skills/`](skills/) subdirectory follows the cross-CLI [Agent Skills](https://agentskills.io) standard. Each CLI has its own install location — see the parent repo's README for per-CLI pointers. The hooks are Claude-Code-only and do not apply to other CLIs.

## How it works

```
Implementation error encountered  ─┐
   OR                              │
Pivot under consideration ─────────┤
                                   ▼
   ┌──────────────────────────────────────┐
   │  Stop. Do not communicate the pivot. │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  Version-check every component       │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  Read version-specific authoritative │
   │  docs (manual, README, INSTALL,      │
   │  CHANGELOG, official reference,      │
   │  installed source) — not forums      │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  Verify input/output/environment     │
   │  assumptions by direct observation   │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  Sanity-check for stale or unrelated │
   │  training-data leakage               │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  Construct a minimal reproducible    │
   │  test                                │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │  If a real blocker remains: surface  │
   │  with evidence; the user decides.    │
   │  Until then, the plan stands.        │
   └──────────────────────────────────────┘
```

## Layout

```
plugins/did-you-rtfm/
├── .claude-plugin/
│   └── plugin.json
├── README.md
├── skills/
│   └── did-you-rtfm/
│       └── SKILL.md
└── hooks/                                  (Claude-Code-only)
    ├── README.md
    ├── hooks.json
    ├── settings.example.jsonc
    ├── did-you-rtfm-stop.js
    └── did-you-rtfm-bypass.js
```

## License

(Add a LICENSE file, or inherit from the parent repo's LICENSE.)
