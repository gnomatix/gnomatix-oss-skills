---
name: author-release-readme
description: >-
  Author or update versioned release notes (docs/releases/v<VERSION>.md and
  GitHub Release bodies) with accurate marketplace and per-plugin version
  matrices, cross-CLI install/update/migrate commands, and a release-specific
  16:9 PSA panel image generated and embedded through update-readme-images.
---

# author-release-readme

Create or update a versioned release message (`docs/releases/v<VERSION>.md`) paired with a release-specific `16:9` PSA panel illustration (`assets/images/releases/release-v<VERSION>-banner.jpg` + `1280×640` companion OG card) managed by `update-readme-images`.

---

## 1. Non-Negotiable Release & Visual Rules

1. **Always Resolve & Report Configured Reference Documents First**:
   Run `update-readme-images.mjs --resolve docs/releases/v<VERSION>.md` before generating any release panel image, read every resolved project-specific or fallback style guide and rules document in full, and **explicitly state the Configured Reference Documents** (with `[project-specific]` vs `[gnomatix-oss-skills-fallback]` origin tags) in your output.
2. **Real Version & Migration Telemetry**:
   Never invent version numbers or plugin counts. `scripts/author-release-readme.mjs` inspects `VERSION`, `.VERSIONS.json`, prior `v*` Git tags, and `.claude-plugin/migrations.json` to build the exact Newly Published / Updated Plugin Version Matrix and migration summary.
3. **Candid PSA Release Register & 16:9 Illustration**:
   - Pair substantive engineering highlights and copy-pasteable cross-CLI commands (`Claude Code`, `Codex`, `Antigravity agy`, `Copilot`, `VS Code`, `Cursor`, `OpenCode`, `Kiro`) with a memorable 1980s Saturday-morning PSA closer (`# Just say NO to <ANTI-PATTERN>!` / `## ... Knowing is half the battle.`).
   - Illustrate the release's headline improvements and anti-pattern victory in a dedicated `16:9` (`1376×768`) panel at `assets/images/releases/release-v<VERSION>-banner.jpg`, passing gold-standard `reference_images` in `ImagePaths` and keeping natural human complexions, dynamic comic ink linework, and clear headroom around diegetic signage.
4. **Protect Historic Releases & Existing Artwork**:
   - Never modify or overwrite historic draft release `v0.1.0`.
   - Never overwrite an existing `assets/images/releases/release-v<VERSION>-banner.jpg` directly; stage candidate revisions in `assets/drafts/` via `update-readme-images.mjs --stage-revision`.
   - Zero AI co-authorship or tool-attribution lines (`spank-dario`), and review prose against `hidden-libel-check` (`R0`–`R14`).

---

## 2. Procedure

### Step 1 — Resolve Reference Documents for the Target Version
```sh
V=$(tr -d '\r\n' < VERSION)
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --resolve "docs/releases/v${V}.md"
```
Report the **Configured Reference Documents** returned by `--resolve` before generating artwork.

### Step 2 — Generate the Release-Specific `16:9` PSA Panel Image & Register Formal Human Review
1. Generate `1376×768` (`16:9`, JPEG `< 1 MB`) artwork illustrating the release's new capabilities and PSA theme, locked to the resolved `reference_images`, and save (or stage via `--stage-revision` if already present) with its release-version suffix at:
   `assets/images/releases/release-v<VERSION>-banner.jpg`
2. Retain any alternate candidate renders under `assets/review/candidates/v<VERSION>/` in Gitea, register the new release banner (`review_status: "PENDING_HUMAN_REVIEW"`) and alternates in `assets/review/manifest.json`, run `update-readme-images.mjs --build-review` to update `assets/review/preview.html` (`0–12` rating scale + comments), and create a `TODO` human-review task in Beads (`bd create`).

### Step 3 — Author `docs/releases/v<VERSION>.md` & Sync Images
```sh
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" \
  --subtitle "static cross-CLI installer, style-locked panels, & local config doctor" \
  --psa-noun "SYMLINKS" \
  --apply-images
```
Verify placement and pixel dimensions via:
```sh
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --audit "docs/releases/v${V}.md" --verify-images
```

### Step 4 — Render or Publish the GitHub Release Body (After Tag Push)
When publishing to GitHub Releases, `author-release-readme.mjs` rewrites relative image links (`../../assets/images/releases/...`) to tag-pinned raw URLs (`https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/v<VERSION>/assets/images/releases/...`) so the panel renders natively on the GitHub Releases page:
```sh
# Preview GitHub Release Markdown body:
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" --render-github-body

# Create or update GitHub Release for tag v<VERSION> (never touches v0.1.0):
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" --publish-github-release
```
