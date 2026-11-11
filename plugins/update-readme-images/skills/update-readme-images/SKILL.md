---
name: update-readme-images
description: >-
  Curate, generate, post-process, embed, and audit README.md and SKILL.md panel
  images across a repository using readme-images.json with project-specific
  asset priority (falling back to GNOX OSS Skills defaults), mandatory reporting
  of configured reference documents, external-user Interactive Design Mode
  handoff via gnox:local-config-wizard, GNOX-namespaced style guides
  (workspace_root:subdir:...), glob-matched rules documents (*, **), automatic
  og-social-image sync, and non-destructive assets/drafts staging.
---

# update-readme-images

![update-readme-images](../../assets/images/update-readme-images-banner.jpg)

Keep a repository's visual identity consistent across its root `README.md`, package/plugin `README.md` pages, release notes (`docs/releases/v*.md`), and individual `SKILL.md` files — both in `gnomatix-oss-skills` itself and in any end-user repository that adopts this skill.

Everything is driven by one configuration file (`readme-images.json`) that combines six mechanisms:
1. **Project-Specific Reference Priority with GNOX OSS Skills Fallback** — always resolves project-specific configuration and owning visual design documents first (`.gnox/readme-images.json` -> `.claude/readme-images.json` -> `config/readme-images.json` -> `readme-images.json`, plus any owning style/lessons documents in `${GNOX_PROJECT_VISUALS_DIR}/<workspace_root>/` or `~/work/project-visuals/<workspace_root>/`), falling back cleanly to the bundled GNOX OSS Skills defaults (`plugins/update-readme-images/config/...`) only when project-specific assets are absent.
2. **Mandatory Reporting of Configured Reference Documents** — whenever invoked, `update-readme-images` explicitly states every **Configured Reference Document** (`config`, `owning_style_docs`, `style_guide_docs`, `rules_docs`, and `reference_images`) along with its `[project-specific]` or `[gnomatix-oss-skills-fallback]` origin before generating or auditing any artwork.
3. **External End-User Fallback Confirmation & Interactive Design Mode** — when falling back to GNOX OSS Skills defaults for an end-user outside the GNOMATIX organization (e.g., not `brett` / `@gnomatix.com` / `gnomatix/*`), pauses before generating artwork to confirm whether the user wants to configure project-specific style guides and placement rules first, offering **Interactive Design Mode** via `/gnox:local-config-wizard` (`node plugins/gnox/scripts/local-config-wizard.js run update-readme-images`).
4. **Namespaced Style Guides (`workspace_root:subdir:...`)** — following the GNOMATIX hierarchical namespace SOP, so a root style guide sets the repository-wide visual language while subdirectory entries (`workspace_root:plugins:python-elimination-program`, `workspace_root:packages:ui`, etc.) inherit from the root and layer on local setting, cast, palette, and reference anchor images.
5. **Glob-Matched Rules Documents (`*`, `**`, `?`, `{a,b}`)** — binding file-path globs (`README.md`, `plugins/*/README.md`, `plugins/*/skills/*/SKILL.md`, `docs/releases/v*.md`, `docs/**/*.md`) to Markdown rules documents and structured panel specifications that state **which** panel images belong in each file and **where** and **how** they are placed.
6. **Automatic `og-social-image` Invocation & Non-Destructive `assets/drafts` Staging** — automatically generates and verifies a `1280×640` `< 1 MB` JPEG social preview (`<name>-og-image.jpg`) within **any** root or subdirectory using the web-standard `assets/images` layout unless explicitly disabled in `readme-images.json` or `magick` is unavailable and not installable via `mise`, and **never** overwrites an existing image in `assets/images/` directly (candidates are staged in `<dir>/assets/drafts/` with `.proposal.json` / `.proposal.md` manifests for asynchronous user approval via `critical-control-points` and `inaudible-markup`).

---

## 1. The Three Supported Panel Types

### Type 1 — `top-level-panel` (Top-Level Titled Hero Panels)
- **Where used**: Immediately after the level-1 heading (`# <Title>`) in the root `README.md` (`assets/images/gnomatix-oss-skills-banner.jpg`), in every `plugins/<plugin>/README.md` (`assets/images/<plugin>-banner.jpg`), and in versioned release notes `docs/releases/v<VERSION>.md` (`assets/images/releases/release-v<VERSION>-banner.jpg`).
- **Format & aspect ratio**: `16:9` (`1376×768` standard) or `21:9`, `JPEG` (`-quality 90–92`).
- **In-scene diegetic title**: Render the repository or plugin title natively inside the scene's architecture or signage (e.g., 1980s *G.I. Joe* stencil, Westminster heraldic scroll, brass workshop sign, cosmic neon) without covering or obscuring any character's head or face.
- **Automatic `og-social-image` companion**: Every directory using `assets/images/` automatically gets `<name>-og-image.jpg` (`1280×640`, `< 1 MB`) unless disabled in config (`auto_og_social_image.enabled: false`, `style_guides[ns].og_social_image: false`, or `companion_og_image.enabled: false`).

### Type 2 — `sub-panel` (Section & Skills Sub-Panels)
- **Where used**: Inside multi-skill or multi-component `README.md` sections (`### <Category>` under `## Plugins`, `## Skills`, `## What you get`, `## Contents`, `## Config`) and at the top of individual `skills/<skill>/SKILL.md` files.
- **Examples in `gnomatix-oss-skills`**:
  - Root `README.md` (`### ...` plugin category headings): `assets/images/category-*-v<VERSION>-panel.jpg` (release-version-suffixed so browsers and Git hosting CDNs never serve stale cached images across releases).
  - `plugins/cui-bono/README.md` (`## What you get` bullets) & `skills/{citation-farm-audit,source-provenance}/SKILL.md`: `citation-farm-audit-banner.jpg`, `source-provenance-banner.jpg`.
  - `plugins/python-elimination-program/README.md` (below `## Skills` table) & `skills/old-willy/SKILL.md`: `old-willy-computer-lab-panel.jpg`.
  - `plugins/agent-darktriad-check/README.md`: `kontentkop-badge-banner.jpg` (below `## Contents` table) and `gaslighting-meter-banner.jpg` (end of `## Config`).
  - `plugins/steering-audit-suite/README.md`: `steering-audit-suite-blueprint-banner.jpg` (immediately below `## Skills`).
- **Supported placement anchors**: `after-heading`, `after-table-in-section`, `after-bullet-matching`, `end-of-section`, and `after-h1`.

### Type 3 — `inset-oval` (Transparent-Corner Oval Inset Windows)
- **Where used**: Tribute, biography, author, or callout sections such as the Stanley Lee "Old Willy" Wilson (`1941–2022`) faculty yearbook tribute under `## Credits` in `plugins/python-elimination-program/README.md` (`assets/images/old-willy-tribute-oval.png`).
- **Mandatory technical contract**:
  - Must be a **4-channel RGBA PNG (`PNG32` / `srgba`)** — never JPEG.
  - All four exterior corners outside the oval border ring **must have `alpha == 0` (`transparent`)** so the oval window floats cleanly over light-mode, dark-mode, and callout backgrounds without rectangular boxes.
  - Interior portrait and concentric oval border ring (e.g., deep navy `#0B1F4A` outer ring + burnished gold `#D4AF37` inner trim) remain opaque (`alpha == 1`).

---

## 2. Non-Destructive Draft Staging & Asynchronous Proposed Revisions

**Hard rule: NEVER overwrite or replace any existing image in `assets/images/` directly.**

Whenever a target image already exists on disk (whether revising a hero banner, re-rendering an oval inset via `--make-oval-inset`, staging a candidate via `--stage-revision`, or running `--sync-og-images --regenerate`):

1. **Stage in `assets/drafts/`**:
   ```bash
   node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
     --stage-revision /path/to/candidate.jpg plugins/<plugin>/assets/images/<plugin>-banner.jpg \
     --reason "Updated signage placement per user note"
   ```
   Because `plugins/<plugin>/assets/images/<plugin>-banner.jpg` already exists, it is **left untouched** and the candidate is written to `plugins/<plugin>/assets/drafts/<plugin>-banner.jpg` alongside `<plugin>-banner.proposal.json` and `<plugin>-banner.proposal.md`.
2. **Seek Asynchronous User Approval (Non-Blocking)**:
   - Use **`critical-control-points`**: record the single neutral decision question from `<stem>.proposal.json` (`Approve promoting this draft to <target_path>, or discard the draft?`), optionally file a Beads task (`bd create`), and **continue all unblocked work** rather than stalling the session.
   - Use **`inaudible-markup`**: surface the proposal notification using the generated CLI-safe callout line (`[workspace_root:subdir]{@user} {Request} Proposed image revision staged at ... #review #art #decision`) — never bare `@person` tokens.
   - Run **`hidden-libel-check`** and **`spank-dario`** before committing any accompanying prose or commit message (zero tool attribution).
3. **Promote or Discard Only After User Decision**:
   ```bash
   # After explicit user approval:
   node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
     --promote-draft plugins/<plugin>/assets/drafts/<plugin>-banner.jpg \
     --approved-by "<verbatim quote of user's approval>"

   # Or if the user declines the candidate:
   node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
     --discard-draft plugins/<plugin>/assets/drafts/<plugin>-banner.jpg
   ```
   Promotions and discards are recorded in `.claude/readme-image-approvals/log.jsonl`, and `--promote-draft` refuses to run without `--approved-by`.

---

## 3. Procedure

### Step 1 — Resolve & Explicitly State Configured Reference Documents (`--resolve`)
Always run the CLI resolver first — never guess or hallucinate which style guide or rules apply:
```bash
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --resolve plugins/python-elimination-program/README.md
```
Before generating any image:
1. **State the `Configured Reference Documents` explicitly** to the user (config path, owning project visual style/lessons docs, style-guide docs, rules docs, and reference anchor images, with `[project-specific]` vs `[gnomatix-oss-skills-fallback]` origin tags).
2. **Read every resolved owning style document, style guide `doc`, and rules `doc` in full** (project-specific documents always take precedence over bundled fallbacks).
3. **External-User Fallback Gate**: If `external_fallback_gate.triggered` is `true` (falling back to GNOX OSS Skills defaults for a user outside the GNOMATIX org), **ask the user to confirm** before generating images whether they wish to proceed with the GNOMATIX OSS Skills defaults or enter **Interactive Design Mode** (`/gnox:local-config-wizard` -> `node plugins/gnox/scripts/local-config-wizard.js run update-readme-images`) to create project-specific style guides and placement rules.

### Step 2 — Generate Missing Panels or Stage Revisions for Existing Ones
1. **Use Release-Version-Specific Asset Suffixes (`-v<VERSION>`)**:
   Whenever creating or revising any image asset for a release, compute its release-versioned path (`--version-path <rel-path> --version <VERSION>`, e.g. `assets/images/category-your-work-done-v0.1.17-panel.jpg` or `assets/images/releases/release-v0.1.17-banner.jpg`) so browser disk caches, GitHub `/raw/main/...`, and Gitea `/media/branch/main/...` never serve stale cached images between releases.
2. **Retain Alternative Candidates in Gitea & Require Formal `0–12` Human Asset Review + Beads `TODO`**:
   - Retain all alternative candidate renders for any unreviewed agent-generated or skill-initiated asset under `assets/review/candidates/v<VERSION>/` in the live Gitea repository (`scripts/release.sh` excludes `assets/review` and `assets/drafts` from public GitHub snapshots so Gitea keeps the full review archive without bloating end-user installs).
   - Register every new or revised asset (`review_status: "PENDING_HUMAN_REVIEW"`) and its retained alternates in `assets/review/manifest.json`, regenerate the formal interactive Asset Review web page (`0–12` Spinal Tap rating scale + Comments box + auto-save to `assets/review/ratings.json`) via `--build-review`, and **always create a `TODO` human-review task in Beads (`bd create`)**:
     ```bash
     node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs --build-review
     # Launch local review persistence server (http://127.0.0.1:8799/assets/review/preview.html):
     node assets/review/review-server.js
     ```
3. **Lock visual style with `reference_images` and owning style guides**: pass 1–4 anchor images from the resolved namespace's `reference_images` (or owning `project-visuals` anchors) in `ImagePaths`, strictly obeying all anatomical, skin-tone, linework, and headroom rules in the resolved style documents.
2. **Build `inset-oval` PNG32 windows**:
   ```bash
   node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
     --make-oval-inset SRC.jpg plugins/<plugin>/assets/images/<name>-oval.png \
     --width 864 --height 1013 --outer-color "#0B1F4A" --inner-color "#D4AF37"
   ```
   (If `<name>-oval.png` already exists, the CLI automatically redirects output to `assets/drafts/<name>-oval.png` and emits a `.proposal.json`.)
3. **Sync automatic `og-social-image` previews across all `assets/images` directories**:
   ```bash
   node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
     --sync-og-images
   ```
   If `magick` is missing and `mise` is present, install it via `mise use -g imagemagick` (per `skill-vv`); if neither is available, `--sync-og-images` degrades gracefully (`skipped_missing_tool`).

### Step 3 — Embed Missing Panels & Audit (`--apply` & `--audit --verify-images`)
```bash
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs --apply <file>
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs --audit --verify-images
```
Confirm `0` failures before claiming done, and list any pending `assets/drafts/` proposals (`--list-drafts`) awaiting user approval.

### Step 4 — Interactive Design Mode or Quick Bootstrap in End-User Repositories
Prefer the non-LLM `gnox:local-config-wizard` CLI (Charmbracelet `gum` TUI or Node `readline` fallback, plus deterministic `validate` sanity checking):
```bash
node plugins/gnox/scripts/local-config-wizard.js run update-readme-images --repo /path/to/user-repo
node plugins/gnox/scripts/local-config-wizard.js validate update-readme-images --repo /path/to/user-repo
```
Or scaffold starter files non-interactively via `--init`:
```bash
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --init /path/to/user-repo --workspace-root my-repo
```
