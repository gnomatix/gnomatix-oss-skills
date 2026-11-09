---
name: og-social-image
description: >-
  Generate a correctly-sized social / Open Graph ("OG") / GitHub social-preview
  image from a source hero, banner, logo, or illustration using ImageMagick CLI.
  Use when the user wants an "og image", "o-image", "social preview", "social card",
  "Twitter/X card", "link preview image", or a repo's GitHub social-preview graphic.
  Handles exact target dimensions, cover-crop framing, and platform file-size limits.
metadata:
  status: draft
---

# OG / Social-Preview Image Generator

Turn a source image (hero/banner/illustration) into a platform-correct social
preview: right aspect ratio, exact pixel size, key elements kept in frame, and
**under the platform's file-size cap**. Built and verified for the `tcb` project
(generated `tcb-md-og-image.jpg` from a 1408×683 hero panel).

## Target sizes (pick by destination)

| Destination | Pixels | Ratio | Size cap |
|---|---|---|---|
| **GitHub repo social preview** | **1280×640** | 2:1 | **< 1 MB (hard)** |
| Open Graph (FB / LinkedIn / X large) | 1200×630 | ~1.91:1 | keep < ~1 MB |
| X/Twitter summary_large_image | 1200×628 | ~1.91:1 | < 5 MB |

GitHub's 1 MB limit is the strict one — a too-big file is silently rejected in
repo Settings. When unsure of the destination, ask; default to GitHub 1280×640.

## Procedure

1. **Confirm tooling + source dimensions** (never assume):
   ```bash
   magick -version            # or: convert -version
   magick identify SRC.png    # note WxH and aspect ratio
   ```

2. **Cover-crop to the exact target** (fills the box, centered, no distortion):
   ```bash
   magick SRC.png -resize 1280x640^ -gravity center -extent 1280x640 -strip OUT
   ```
   - `-resize WxH^`  → the `^` means *fill/cover* the box (scales so both
     dimensions are >= target).
   - `-gravity center -extent WxH` → center-crop to the exact target.
   - `-strip` → drop metadata (smaller, no EXIF leakage).
   - This trims only the overflow. If source ratio ≈ target ratio, crop is tiny
     (e.g. 1408×683 → 1280×640 trims ~20px/side).

3. **Choose format for size + quality** (rich illustration/photo → JPEG):
   ```bash
   magick SRC.png ... -quality 92 OUT.jpg     # q88–92: ~250–400 KB at 1280×640
   ```
   - **JPEG q88–92**: best size/quality for colorful art or photos; no banding.
   - **256-color PNG** (`-colors 256 -define png:compression-level=9`): works,
     but can band gradients (starbursts, lighting).
   - **Avoid full-color PNG** for OG — often >1 MB and over GitHub's cap.
   - GitHub accepts PNG / JPG / GIF for social preview.

4. **Verify before claiming done** (dimensions AND byte size):
   ```bash
   magick identify OUT.jpg                 # must read exactly 1280x640
   ls -l OUT.jpg                           # bytes < 1048576 (1 MB)
   ```

## Framing rules

- Keep destination-critical elements **inside the safe crop**: logos/wordmarks
  near edges, faces, and **intentional art** (ask if a visual element like
  burst/explosion effects is deliberate — don't slice it).
- Source wider than target → crop loses left/right; taller → loses top/bottom.
  Pick the source (or `-gravity`) so nothing important falls off.

## Deliver

- Write the OG file next to the source (e.g. `assets/images/<name>-og-image.jpg`).
- Keep the full-res original for README/splash use.
- The user sets it in **GitHub → Settings → General → Social preview** (this skill
  produces the file; it does not change repo settings).

## Origin

The author's direction of 2026-11-07, record `dir-cfq` in the GNOMATIX directions store.

## TODO

- The `status: draft` frontmatter key moved under `metadata`; confirm with the author whether the draft status stands.
- Verification and validation on every claimed platform, named here until each has passed and is recorded in `VV.md`: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. Tracked as persistint-game-h1pu.
