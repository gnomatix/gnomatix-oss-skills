# Release Notes Panel Rules (`docs/releases/v*.md`)

- **Matched Glob**: `docs/releases/v*.md`
- **Panel ID**: `release-hero-psa-banner` (`top-level-panel`, `placement: "after-h1"`)
- **Asset Path**: `assets/images/releases/release-{file_stem}-banner.jpg` (referenced from `docs/releases/v<VERSION>.md` as `../../assets/images/releases/release-v<VERSION>-banner.jpg`)
- **Dimensions & Format**: `16:9` (`1376×768` standard), `JPEG` (`-quality 90`, `< 1 MB`), plus automatic `1280×640` `< 1 MB` OG social preview card when `assets/images` sync runs.
- **Visual & Compositional Requirements**:
  - Follows the active project's owning visual style guide (or `gnomatix-oss-skills` Saturday-morning 2D cel × Skottie Young ink linework with 100% realistic warm human complexions when in `gnomatix-oss-skills`).
  - Depicts the specific version's headline features and engineering theme in an engaging, humorous scene (such as a two-band 1980s PSA frame with diegetic in-scene title banner and clear character headroom).
  - Rewritten to tag-pinned `https://raw.githubusercontent.com/<org>/<repo>/v<VERSION>/assets/images/releases/release-v<VERSION>-banner.jpg` when published to GitHub Releases via `author-release-readme.mjs`.
