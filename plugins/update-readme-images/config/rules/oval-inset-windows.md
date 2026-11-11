# Rules Document — Transparent Oval Inset Windows (`inset-oval`)

- **Rule ID**: `pep-readme-subpanel-and-oval-inset` (and any rule with `"type": "inset-oval"`)
- **Applies to (`glob`)**: `plugins/python-elimination-program/README.md` (and any `**/*.md` configured with an `inset-oval` panel)
- **Panel Type**: `inset-oval`

## 1. Visual & Technical Contract for the "Oval Inset Window" Effect

Unlike rectangular `top-level-panel` and `sub-panel` JPEGs, an **Oval Inset Window (`inset-oval`)** is a portrait, cameo, medallion, or vignette that floats inside a Markdown section (such as `## Credits`, `## Tribute`, or `## Author`) without visible rectangular corners on either light-mode or dark-mode rendering surfaces.

### Mandatory Technical Requirements:
1. **Format**: **4-channel RGBA PNG (`PNG32` / `srgba`)**. Never use JPEG for `inset-oval` (JPEG lacks an alpha channel and forces opaque white/black corners).
2. **Exterior Alpha Transparency (`corner_alpha == 0`)**:
   - Every pixel outside the outer oval border ring **must** have alpha `0.0` (`transparent`).
   - Verified via ImageMagick:
     ```bash
     magick identify -format "%m %[channels] tl=%[fx:p{0,0}.a] tr=%[fx:p{w-1,0}.a] bl=%[fx:p{0,h-1}.a] br=%[fx:p{w-1,h-1}.a] center=%[fx:p{w/2,h/2}.a]" <file.png>
     ```
     Must report `PNG srgba` (or `rgba`), `tl=0 tr=0 bl=0 br=0`, and `center=1`.
3. **Concentric Oval Frame**:
   - Framed by a smooth, anti-aliased vertical (or horizontal) elliptical border ring (e.g., classic 1990s high-school faculty yearbook oval trim in deep navy `#0B1F4A` with inner/outer burnished gold `#D4AF37` pinstripes).
   - Interior portrait backdrop remains opaque (`alpha = 1.0`, e.g. studio blue-grey `#5B6E82`).

## 2. ImageMagick Construction & Conversion Pipelines

The `update-readme-images.mjs` CLI provides `--make-oval-inset <src> <out.png>` using two deterministic ImageMagick 7 workflows:

### Workflow A — Convert a Rectangular Portrait into a Framed Transparent Oval Window
When starting from a rectangular portrait or bust illustration (`SRC.png` or `SRC.jpg`):
```bash
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --make-oval-inset SRC.jpg assets/images/portrait-oval.png \
  --width 864 --height 1013 \
  --outer-color "#0B1F4A" --inner-color "#D4AF37"
```
This resizes/crops the source to `WxH`, applies an anti-aliased elliptical alpha mask so all exterior pixels have `alpha = 0`, and composites the concentric navy-and-gold oval frame.

### Workflow B — Strip Opaque Exterior Corners from an Already-Framed Oval Render
When an image generator renders an oval frame on a solid white/flat background:
```bash
node plugins/update-readme-images/skills/update-readme-images/scripts/update-readme-images.mjs \
  --make-oval-inset RAW_OVAL.jpg assets/images/old-willy-tribute-oval.png \
  --floodfill-corners --fuzz 12%
```
This converts the image to `PNG32` with alpha enabled and flood-fills from all four outer corners (`0,0`, `w-1,0`, `0,h-1`, `w-1,h-1`) to `none` (`alpha = 0`) up to the outer oval border ring.

## 3. Markdown / HTML Embedding Templates

- **Centered Tribute Inset (`embed_style: "html-center-tribute"`, canonical Old Willy tribute in `plugins/python-elimination-program/README.md`)**:
  ```html
  <p align="center">
    <a href="https://www.legacy.com/ca/obituaries/stcatharinesstandard/name/stanley-wilson-obituary?id=39732079">
      <img src="assets/images/old-willy-tribute-oval.png" alt="In Memoriam: Stanley 'Old Willy' Wilson (March 22, 1941 – December 3, 2022)" width="260">
    </a>
    <br>
    <em>In Memoriam: <a href="https://www.legacy.com/ca/obituaries/stcatharinesstandard/name/stanley-wilson-obituary?id=39732079">Stanley Lee "Old Willy" Wilson (March 22, 1941 – December 3, 2022)</a> — Sir Winston Churchill Secondary School, St. Catharines, ON (1966–1998)</em>
  </p>
  ```
- **Floating Paragraph-Wrap Inset (`embed_style: "html-float-left"` or `"html-float-right"`)**:
  ```html
  <img src="assets/images/portrait-oval.png" align="left" width="220" alt="Portrait">
  ```
