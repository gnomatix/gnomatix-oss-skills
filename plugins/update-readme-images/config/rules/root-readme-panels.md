# Rules Document — Root Repository README (`README.md`)

- **Rule ID**: `root-readme-top-panel`
- **Applies to (`glob`)**: `README.md` (repository root only)
- **Panel Type**: `top-level-panel` + `companion_og_image`

## 1. Required Panel Placement & Format

1. **Top-Level Titled Hero Banner (`top-level-panel`)**:
   - **Location**: Immediately following the level-1 heading (`# <Repo Name>`), separated by a single blank line, before the promo block or opening paragraph.
   - **File Path**: `assets/images/{repo}-banner.jpg` (in `gnomatix-oss-skills`: `assets/images/gnomatix-oss-skills-banner.jpg`).
   - **Markdown Syntax**:
     ```markdown
     # gnomatix-oss-skills

     ![GNOMATIX — OSS SKILLS](assets/images/gnomatix-oss-skills-banner.jpg "GNOMATIX — OSS SKILLS — Artificial Teams ][ Real Intelligence")
     ```
   - **Image Specifications**:
     - Aspect ratio: `16:9` (`1376×768` standard) or `21:9`.
     - Format: `JPEG` (quality `88–92`).
     - In-scene typography: Must include the repository title and tagline ribbon (`GNOMATIX — OSS SKILLS` / `ARTIFICIAL TEAMS ][ REAL INTELLIGENCE`) rendered natively in-scene per the active `workspace_root` style guide.

2. **Automatic Companion Social-Preview Image (`og-social-image`)**:
   - Within the root `assets/images/` directory (unless explicitly disabled in `readme-images.json` or `magick` is unavailable and not installable via `mise`), `update-readme-images` automatically generates and verifies `assets/images/{repo}-og-image.jpg`:
     - Exact pixel dimensions: `1280×640` (`2:1`).
     - File size: `< 1,048,576` bytes (`< 1 MB` hard cap).
     - Framing: Preserve top-edge headroom (`-gravity north -crop 1280x640+0+10 +repage` configured in `auto_og_social_image.overrides["."]`) so top-of-frame elements (spectacles, shutter shades, crowns, signage) are never clipped.

## 2. Non-Destructive Draft Staging for Existing Images

- **Existing files in `assets/images/` are never overwritten directly.**
- If `assets/images/{repo}-banner.jpg` or `assets/images/{repo}-og-image.jpg` already exists on disk, any proposed replacement is written to `assets/drafts/` with a companion `.proposal.json` and `.proposal.md` manifest, surfaced asynchronously via `[workspace_root]{@user}` (`inaudible-markup`) and `critical-control-points`, and promoted only via `--promote-draft --approved-by "<verbatim user approval>"`.
