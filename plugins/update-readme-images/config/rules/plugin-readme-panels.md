# Rules Document — Top-Level Plugin & Package READMEs (`plugins/*/README.md`)

- **Rule ID**: `plugin-readme-top-panel`
- **Applies to (`glob`)**: `plugins/*/README.md`
- **Panel Type**: `top-level-panel` + automatic `og-social-image`

## 1. Required Panel Placement & Format

Every plugin `README.md` matching `plugins/*/README.md` must include a **Top-Level Titled Panel** (`top-level-panel`) immediately below its H1 heading (`# <plugin-name>`):

```markdown
# <plugin-name>

![<plugin-name>](assets/images/<plugin-name>-banner.jpg)
```

## 2. Style, Automatic `og-social-image`, & Non-Destructive Draft Gate

1. **Namespace Resolution**:
   - Resolve the active style guide chain using `workspace_root:plugins:<plugin-name>` → `workspace_root:plugins` → `workspace_root`.
2. **In-Scene Diegetic Title**:
   - The banner must display the plugin's title (or canonical department/banner title) natively inside the scene's architecture or signage without covering or obscuring any character's head or face.
3. **Dimensions & Storage**:
   - Stored relative to the plugin directory at `plugins/<plugin-name>/assets/images/<plugin-name>-banner.jpg`.
   - Standard dimensions: `1376×768` (`16:9` aspect ratio), `JPEG`.
4. **Automatic `og-social-image` Generation (`--sync-og-images`)**:
   - Because each plugin uses the web-standard `assets/images/` subdirectory, `update-readme-images` automatically generates and verifies `plugins/<plugin-name>/assets/images/<plugin-name>-og-image.jpg` (`1280×640` JPEG `< 1 MB`) unless explicitly disabled in `readme-images.json` (`auto_og_social_image.enabled: false`, `style_guides[ns].og_social_image: false`, or `companion_og_image.enabled: false`) or `magick` is unavailable and not installable via `mise`.
5. **Non-Destructive Draft Staging**:
   - Never replace an existing image in `plugins/<plugin-name>/assets/images/` directly. Candidate revisions are staged in `plugins/<plugin-name>/assets/drafts/` and promoted only after explicit user approval (`--promote-draft --approved-by`).
