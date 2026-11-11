# Style Guide — `gnomatix-oss-skills` (Root Workspace)

- **Namespace**: `gnomatix-oss-skills` (Root workspace default; inherited by all `gnomatix-oss-skills:plugins:*` subdirectories unless `inherit: false`).
- **Scope**: Repository root `README.md` and all plugins under `plugins/*/`.
- **Owning Design Source**: `project-visuals/gnomatix-oss-skills/style-prompt.md` and `project-visuals/gnomatix-oss-skills/PROMPTING_LESSONS_LEARNED.md`.

## 1. Visual Language

- **Hybrid Aesthetic**: **Saturday-morning 2D cel animation × Skottie Young comic illustration energy** (*Simpsons* shape language × Skottie Young dynamic variant-cover energy) — clean black ink linework, flat saturated colors, simplified expressive shapes, four-fingered cartoon hands, paired with Skottie Young's exaggerated poses, dynamic camera angles, chunky outlines, and a slightly feral, lively edge in faces and gestures. Read as a Saturday-morning cartoon refined by a 2010s-era variant-cover illustrator: neither pure children's TV nor adult animation.
- **Skin & Costume Palette**:
  - **Realistic warm diverse human complexions and faithful costume colors on ALL human characters** (`warm tans`, peachy-fair, olive, and warm brown complexions) so every person reads naturally and stays recognizable.
  - **NEVER render Simpsons-yellow faces or Simpsons character clones** — keep the cartoon *shape language* lively and clean while keeping the human *color palette* faithful and natural. (Prompting note: avoid writing the unhyphenated two-word phrase `yellow` + `skin` in generator prompts to prevent upstream classifier false positives; pass realistic-complexion reference anchors in `ImagePaths` and specify `"realistic warm human complexions — never Simpsons-yellow faces"`.)
- **Tone & Cartoon Physics**: Funny, irreverent, deadpan PSA earnestness applied to technical/absurd subject matter. Bright sunlit or crisp daylight palettes (saturated greens, warm tans, golden afternoon yellows, sky blues). Wile-E.-Coyote slapstick physics (X-eyes, lolling tongues on defeated pythons/gremlins, motion lines, impact stars, Looney Tunes timing) — **never** dark, grim, gory, photorealistic, horror-styled, sepia, monochrome, or anime/manga-styled. Characters look like they are genuinely enjoying their work.

## 2. Multi-Axis Reference Layering (GNOMATIX SOP)

Every visual scene must engage source material across at least two axes:
1. **Pop-culture / fictional reference** (with specific issue, episode, or scene fidelity).
2. **Real-world institutional or historical parallel** (e.g., Berne Convention Art. 6bis, SFWMD Python Elimination Program, Nancy Reagan's `"Just Say No"`, UDHR 1948, NASA Mission Control).
3. **Canonical character-trait alignment** (the character's canonical traits must match their functional role in the skill or category; never stretch a surface-level name pull).

## 3. Native In-Scene Typography & Framing

- **Diegetic In-Scene Lettering**: When rendering titles or labels with modern natural-language image generators, integrate the title **natively inside the scene** on diegetic signage in a theme-appropriate cartoon font (e.g., 1980s *G.I. Joe* slanted military stencil, royal Westminster heraldic scroll, carved mahogany-and-brass archive plaque, vintage workshop sign, or cosmic rock-poster neon), or leave designated equipment surfaces blank for clean post-production seal/PSA-card overlays (`#0B1F4A` navy / `#000000` black with `#D62828` red, `#FFFFFF` white, and `#003F88` blue accents).
- **Headroom & Face Clearance**: Always specify `"without covering or obscuring any character's face or head"` for overhead banners and keep at least 5% top-edge clearance so hats, crowns, spectacles, and hair are never clipped.
- **Anatomical Verification**: Verify every character has strictly two normal arms/hands before staging.

## 4. Gold-Standard Reference Anchor Images (`ImagePaths`)

Always pass 1–3 realistic-human-skin-tone gold-standard reference images from `reference_images` (`python-elimination-program-banner.jpg`, `old-willy-computer-lab-panel.jpg`, `citation-farm-audit-banner.jpg`, `steering-audit-suite-banner.jpg`) in the image generator's `ImagePaths` parameter so generated characters inherit natural human skin tones and dynamic Skottie Young comic energy rather than yellow-skinned *Simpsons* frames.
