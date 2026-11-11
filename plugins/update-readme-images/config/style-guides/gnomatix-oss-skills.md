# Style Guide — `gnomatix-oss-skills` (Root Workspace)

- **Namespace**: `gnomatix-oss-skills` (Root workspace default; inherited by all `gnomatix-oss-skills:plugins:*` subdirectories unless `inherit: false`).
- **Scope**: Repository root `README.md` and all plugins under `plugins/*/`.

## 1. Visual Language

- **Hybrid Aesthetic**: **Simpsons 2D cel animation × Skottie Young comic illustration energy** — clean black ink linework, flat saturated colors, expressive simplified shapes, four-fingered cartoon hands, paired with Skottie Young's dynamic camera angles, chunky outlines, exaggerated posture, and lively facial attitude.
- **Skin & Costume Palette**:
  - Use classic yellow cartoon characters for generic/archetypal scenes (passing `did-you-rtfm-banner.jpg` or `all-help-no-harm-banner.jpg` in `ImagePaths`; avoid writing the two-word phrase `"yellow skin"` in text prompts to prevent upstream classifier false positives).
  - Use **realistic warm human skin tones** and faithful signature costume colors whenever characters represent real historical/living figures or recognizable pop-culture characters (e.g., Stanley "Old Willy" Wilson, Queen Elizabeth II, Destro's chrome mask, Zartan, Jake "The Snake" Roberts, Bono, Q).
- **Cartoon Physics**: Wile-E.-Coyote slapstick (X-eyes, motion lines, impact stars, comic `"WHACK!"` starbursts) — bright daylight, cheerful irreverence, never grim, gory, or photorealistic.

## 2. Multi-Axis Reference Layering (GNOMATIX SOP)

Every visual scene must engage source material across at least two axes:
1. **Pop-culture / fictional reference** (with specific issue, episode, or scene fidelity).
2. **Real-world institutional or historical parallel** (e.g., Berne Convention Art. 6bis, SFWMD Python Elimination Program, UDHR 1948, NASA Mission Control).
3. **Canonical character-trait alignment** (the character's canonical role must match the skill's actual mechanism).

## 3. Native In-Scene Typography & Framing

- **Diegetic In-Scene Lettering**: Render the plugin or skill title **natively inside the scene** in a theme-appropriate cartoon font (e.g., 1980s *G.I. Joe* slanted military stencil, royal Westminster heraldic scroll, carved mahogany-and-brass archive plaque, vintage workshop sign, or cosmic rock-poster neon) rather than slapping flat post-production SVG text boxes over the art.
- **Headroom & Face Clearance**: Always specify `"without covering or obscuring any character's face or head"` for overhead banners and keep at least 5% top-edge clearance so hats, crowns, spectacles, and hair are never clipped.
- **Anatomical Verification**: Verify every character has strictly two normal arms/hands before staging.

## 4. Reference Anchor Images (`ImagePaths`)

Always pass 1–3 gold-standard reference images from `reference_images` in the image generator's `ImagePaths` parameter to prevent style drift into unrelated cartoon styles.
