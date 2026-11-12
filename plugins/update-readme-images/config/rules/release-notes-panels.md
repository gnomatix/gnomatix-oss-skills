# Release Notes Panel Rules (`docs/releases/v*.md`)

- **Matched Glob**: `docs/releases/v*.md`
- **Panels**: the release banner (`release-banner`, `top-level-panel`, `placement: "after-h1"`, not required) and the title banners of plugins and skills new in that release. No other panels.
- **Release banner asset**: `assets/images/releases/release-{file_stem}-banner.jpg` (referenced from `docs/releases/v<VERSION>.md` as `../../assets/images/releases/release-v<VERSION>-banner.jpg`), rendered from the release's banner prompt, `release-v<VERSION>-banner-prompt.md` in the project-visuals directory, which `author-release-readme` creates with the release note. A release whose banner has not been rendered shows none.
- **Dimensions & Format**: `16:9` (`1376×768` standard), `JPEG` (`-quality 90`, `< 1 MB`), plus the automatic `1280×640` `< 1 MB` OG social preview when `assets/images` sync runs.
- **Content**: follows the project's owning visual style guide, the prompt file's front matter, and the changelog items that map to engaging, humorous or fun visual elements consistent with that guide. No slogans or themed closing lines in the note itself.
- **GitHub Releases**: images are rewritten to tag-pinned `https://raw.githubusercontent.com/<org>/<repo>/v<VERSION>/...` URLs by `author-release-readme.mjs`.
