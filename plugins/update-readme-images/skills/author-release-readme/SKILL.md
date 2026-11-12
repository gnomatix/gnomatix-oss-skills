---
name: author-release-readme
description: >-
  Author or update versioned release notes (docs/releases/v{VERSION}.md and
  GitHub Release bodies) that state what the release actually changed, with the
  exact marketplace and per-plugin version matrix and valid install commands.
---

# author-release-readme

Create or update a versioned release note (`docs/releases/v<VERSION>.md`) and, after the tag is pushed, the matching GitHub Release body.

---

## 1. Rules

1. **Every statement comes from the release.** Each change listed is one the range `<previous tag>..v<VERSION>` actually contains, checked against `git log` and `git diff --stat` for that range. Nothing is carried over from an earlier release, and no capability is claimed that was not run.
2. **Real versions.** Never invent version numbers or plugin counts. `scripts/author-release-readme.mjs` reads `VERSION`, `.VERSIONS.json`, prior `v*` tags and `.claude-plugin/marketplace.json` (`renames`) to build the version matrix and rename list.
3. **Plain register and panels.** No slogans or themed closing lines. The only images are the title banners of plugins and skills new in the release, and the release banner rendered from the release's prompt file (below). Install commands are ones the documentation of each agent supports.
6. **Typed commit subjects.** Commits use `EPIC(scope):`, `FEATURE(scope):` or `BUGFIX(scope):` for changes worth naming in the notes, and `DOCS`, `CHORE`, `REFACTOR`, `TEST` for the rest; the notes list the first three one by one and collapse everything else to a count per scope.
4. **Protect historic releases.** Never modify the historic draft release `v0.1.0`.
5. **Attribution and review.** No AI co-authorship or tool-attribution lines (`spank-dario`); review the prose with `hidden-libel-check` (R0–R14) before publishing.

---

## 2. Procedure

### Step 1: The release prompt file
Each release has `release-v<VERSION>-banner-prompt.md` (or `release-<VERSION>-banner-prompt.md`) in the project-visuals directory, `${GNOX_PROJECT_VISUALS_DIR:-~/work/project-visuals}/<workspace_root>/`. Its YAML front matter holds the release note's content:

```yaml
---
type: WORKING-DRAFT (LLM-GENERATED)   # GNOMATIX review front matter
authority: PENDING MANUAL REVIEW
review_status: PENDING
auto-generated: true                  # false once the user has written or reviewed it
review_note: "needs review for QA/QC and possible revisions / re-render"
title: "..."                          # heading after "Release v<VERSION>:"
short-description: "..."              # paragraph under the heading
banner-alt: "..."                     # alt text of the release banner
highlights:                           # the changes, each checked against the range's commits
  - "..."
---
```

The text after the front matter is the image prompt: the default instruction for rendering the release banner, which the note shows once `assets/images/releases/release-v<VERSION>-banner.jpg` exists. When the file does not exist, writing the release note creates it: the front matter above filled from the release, the instruction to use the style documents, the front matter and any changelog items that map to engaging, humorous or fun visual elements consistent with the style guide and themes, the render instructions (target path, panel type, size, social-preview companion, reference images, and update-readme-images' own text for the panel type and draft staging), then the changelog and every resolved style document inlined. An existing prompt file is never overwritten.

Changes come from `--highlights-file` (one per line), else the front matter's `highlights`, else the commit subjects in the range that change published files (`dev/`, `assets/review` and `assets/drafts` are left out, as in `release.sh`), minus version-bump commits.

### Step 2: Author `docs/releases/v<VERSION>.md`
```sh
V=$(tr -d '\r\n' < VERSION)
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" --highlights-file changes.txt
```
Read the written file and check every line against the range before going on.

### Step 3: Render or publish the GitHub Release body (after the tag is pushed)
```sh
# Preview the GitHub Release body:
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" --render-github-body

# Create or update the GitHub Release for tag v<VERSION> (never touches v0.1.0):
node plugins/update-readme-images/skills/author-release-readme/scripts/author-release-readme.mjs \
  --version "$V" --publish-github-release
```
