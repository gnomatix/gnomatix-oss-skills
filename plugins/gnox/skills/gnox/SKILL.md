---
name: gnox
description: >-
  Apply the GNOMATIX Namespacing Convention across all gnox-related skill
  execution and route marketplace commands under the /gnox: prefix:
  workspace_root:subdir:... hierarchical config and path scoping, [NS]{@target}
  CLI-safe callouts with 4-step namespace resolution, «term» [CURIE] inline
  entity grounding, and /gnox:<plugin>[:<skill>] command dispatch.
---

# gnox — GNOMATIX Router & Session Namespacing Convention

![gnox](../../assets/images/gnox-banner.jpg)

Installing `gnox` provides both:
1. **One command prefix (`/gnox:`)** for every plugin, skill, and sub-command in the `gnomatix-oss-skills` marketplace.
2. **The session-wide GNOMATIX Namespacing Convention**, injected automatically at `SessionStart` and `PostCompact` (via `hooks/session-namespace.js`) and defined here for every cross-agent CLI (`agy`, Codex, Kiro, Cursor, OpenCode) so all `gnox`-related skills execute under a single systematic convention.

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
