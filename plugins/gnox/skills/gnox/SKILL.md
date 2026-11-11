---
name: gnox
description: >-
  Apply the GNOMATIX Namespacing Convention, Atomic Git-Flow River Steering
  ("Be the River, Not the Rock"), active complementary marketplace topology
  discovery, and /gnox: command routing: workspace_root:subdir:... hierarchical
  scoping, [NS]{@target} CLI-safe callouts, «term» [CURIE] inline entity
  grounding, short-lived feature/*/bugfix/* branches with high-priority merge to
  develop/main, and /gnox:<plugin>[:<skill>] dispatch.
---

# gnox — GNOMATIX Router, Session Namespacing, Git-Flow River Steering, & Topology

![gnox](../../assets/images/gnox-banner.jpg)

Installing `gnox` provides four session-wide capabilities while leaving every plugin independently usable stand-alone:
1. **One command prefix (`/gnox:`)** for every plugin, skill, and sub-command in the `gnomatix-oss-skills` marketplace.
2. **The session-wide GNOMATIX Namespacing Convention**, injected automatically at `SessionStart` and `PostCompact` (via `hooks/session-namespace.js`) and defined here for every cross-agent CLI (`agy`, Codex, Kiro, Cursor, OpenCode).
3. **Atomic Git-Flow River Steering ("Be the River, Not the Rock")**, translating the flow stance into observable team Git hygiene: short-lived `feature/*` / `bugfix/*` branches, verified atomic commits, and high-priority direct merge + push to `develop` / `main` without unpushed local worktrees or unauthorized Pull Requests.
4. **Active Marketplace Topology Discovery** (`hooks/lib/gnox-discovery.js`), surfacing which complementary `gnomatix-oss-skills` plugins and optional local tools (`mise`, `magick`, `bd`, `gws`, `git-crypt`) are present in the current session so dovetailed integrations activate automatically and absent companions degrade cleanly to their standalone paths.

---

## 1. Hierarchical Workspace & Subdirectory Scoping (`workspace_root:subdir:...`)

Whenever a GNOMATIX skill scopes configuration, style guides (such as `update-readme-images`), audit targets, or proposed-revision records to a location inside a repository:

1. **Canonical Key Shape**:
   ```text
   <workspace_root>:<dir_1>:<dir_2>:...:<leaf>
   ```
   - Determine `<workspace_root>` from `.claude/readme-images.json` (`workspace_root`), `.claude-plugin/marketplace.json` (`name`), `package.json` (`name` without `@scope/`), or the repository root directory basename.
   - Normalize both `/` and `\` path separators (and optional `[` `]` wrappers) into single colons (`:`).
2. **Top-Down Inheritance**:
   - Resolution walks from `*` → `<workspace_root>` → `<workspace_root>:<dir_1>` → ... → `<workspace_root>:<dir_1>:...:<leaf>`.
   - Child namespaces inherit root settings and layer local overrides on top unless `"inherit": false` is explicitly declared on the child entry.

---

## 2. CLI-Safe Callouts & 4-Step Namespace Resolution (`[NS]{@target}`)

Across all GNOX skills (`critical-control-points`, `inaudible-markup`, `update-readme-images`, `log-session`), never emit bare `@person` tokens (which CLI harnesses parse as file-attachment directives and which TTS engines misread).

1. **Canonical Callout Syntax**:
   ```text
   [NS]{@target} {SpeechTag?} <message> #domain #urgency #action
   ```
   Example:
   ```text
   [gnomatix-oss-skills:plugins:satori]{@user} {Request} Proposed banner draft staged at assets/drafts/satori-banner.jpg; approve promotion or discard? #review #art #decision
   ```
2. **Deterministic 4-Step Namespace Resolution**:
   When determining `[NS]`:
   1. **Explicit prefix**: Use the `[NS]` explicitly supplied by the user in the prompt or file.
   2. **Active task / Bead**: Use the namespace or `org` recorded on the claimed Beads issue (`bd show <id>`).
   3. **Directory / frontmatter walk**: Derive `<workspace_root>:<subdir>` from the target file's path or frontmatter `up:` hierarchy.
   4. **Explicit unresolved fallback**: Emit `[UNRESOLVED]` + `#needs-namespace` — **never guess silently**.

---

## 3. Inline Registry Grounding (`«term» [CURIE]`)

When grounding domain entities (`ontology-lookup` + `inaudible-markup`):
- Tag **only the first mention** in a passage using guillemets and square-bracketed Bioregistry CURIEs:
  ```text
  «Homo sapiens» [NCBITaxon:9606]
  ```
- Guillemets (`«` `»`) and brackets (`[` `]`) remain silent in voice mode while staying machine-parseable (`«([^»]+)» \[([A-Za-z][A-Za-z0-9_.-]*:[^\]\s]+)\]`).
- Never invent an unregistered prefix, and never tag an entity whose CURIE was not verified.

---

## 4. Marketplace Command Routing (`/gnox:<plugin>[:<skill>]`)

| Command Form | Dispatches To |
|---|---|
| `/gnox:<plugin>` | The plugin's main skill (named `<plugin>`), or an index of its skills/commands if it has no main skill |
| `/gnox:<plugin>:<skill>` | Any secondary skill inside `plugins/<plugin>/skills/<skill>/SKILL.md` |
| `/gnox:<plugin>:<group>:<cmd>` | Any sub-command inside `plugins/<plugin>/commands/<group>/<cmd>.md` |

All router command stubs in `plugins/gnox/commands/` are generated deterministically by:
```sh
node plugins/gnox/scripts/build-commands.js
node plugins/gnox/scripts/build-commands.js --check
```

---

## 5. Atomic Git-Flow River Steering ("Be the River, Not the Rock")

`gnox` translates the flow mindset (*"Be the river, not the rock"*) directly into observable version-control practice for bionic engineering teams:

1. **Short-Lived, Fit-to-Purpose Branches (`feature/<topic>`, `bugfix/<topic>`)**:
   - Cut a dedicated, narrowly-scoped `feature/<topic>` or `bugfix/<topic>` branch from a freshly fetched integration branch (`develop` or `main`) for each distinct unit of work.
2. **Verified Atomic Commits & High-Priority Merge to `develop` / `main` ASAP**:
   - Deliver small, verified atomic revisions, merge the short-lived branch back into `develop` / `main` as a high priority immediately upon verification, push promptly to the authoritative remote, and delete the retired topic branch (respecting any explicit repository or user commit/push gate).
3. **Proactively Flag & Clear Flow-Obstructing "Rocks"**:
   - Long-lived divergent branches, sprawling unpushed local working trees, and unauthorized Pull Requests act as "rocks" obstructing the bionic team's shared stream.
   - Do not open Pull Requests unless explicitly instructed by the human owner.
   - Whenever `satori` is installed alongside `gnox` (or when operating standalone), treat any accumulation of unmerged branches, unpushed local worktrees, or unrequested PR ceremony as an observable flow/satori incompatibility — flag it to the user or team lead and resolve it cleanly into atomic branch integration.

---

## 6. Three-Tier Stand-Alone + Complementary Synergy

Every plugin routed by `gnox` obeys the three-tier marketplace contract:
- **Tier 0 — Stand-Alone Core**: Works independently when installed alone with zero sibling plugins and zero optional local tools.
- **Tier 1 — Complementary Plugin Dovetailing**: Activates paired integrations automatically whenever companion marketplace plugins are detected in the session (`gnox` ↔ `satori`, `update-readme-images` ↔ `og-social-image`, `inaudible-markup` ↔ `ontology-lookup` ↔ `word-lineage`, `spank-dario` ↔ `dont-be-hitler` ↔ `hidden-libel-check`, `did-you-rtfm` ↔ `critical-control-points` ↔ `staleness-guard`, `cui-bono` ↔ logic/provenance skills).
- **Tier 2 — Optional Local Tooling**: Unlocks extended local capabilities when optional tools (`mise`, `magick`, `bd`, `gws`, `git-crypt`) are present on `PATH` or `mise` shims, and runs the documented standalone fallback when absent.
