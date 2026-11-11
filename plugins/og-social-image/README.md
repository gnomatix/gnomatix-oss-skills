# og-social-image

![og-social-image](assets/images/og-social-image-banner.jpg)

> An [Agent Skill](https://agentskills.io) that turns a hero, banner, logo or illustration into a platform-correct social-preview image with ImageMagick: the right aspect ratio, the exact pixel size, the key elements kept in frame, and a file under the platform's size cap. Dimensions and bytes are checked before the result is called done.

<!-- BEGIN: gnomatix-promo-include -->
<p>
  <a href="https://www.buymeacoffee.com/gnomatix">
    <img src="https://img.buymeacoffee.com/button-api/?text=Buy+me+a+coffee&emoji=&slug=gnomatix&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" alt="Buy Me A Coffee — gnomatix">
  </a>
</p>

<!-- For JS-rendering contexts (the BMC-supplied script tag, preserved as authored):
<script type="text/javascript"
  src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
  data-name="bmc-button"
  data-slug="gnomatix"
  data-color="#BD5FFF"
  data-emoji=""
  data-font="Cookie"
  data-text="Buy me a coffee"
  data-outline-color="#000000"
  data-font-color="#ffffff"
  data-coffee-color="#FFDD00"></script>
-->
<!-- END: gnomatix-promo-include -->

## Skills

- `og-social-image`: picks the target size by destination (GitHub 1280×640 under 1 MB, Open Graph 1200×630, X 1200×628), cover-crops the source to it, chooses JPEG or PNG for size and quality, and verifies the output with `magick identify` and the byte count. Invoke it with `/og-social-image`, or ask for an "og image", "social preview", "social card" or a repo's GitHub social-preview graphic.

## Stand-Alone, Complementary Plugins, & Optional Local Tools

- **Stand-alone**: Installs and runs independently via `/og-social-image` on any hero, banner, logo, or illustration.
- **Complementary marketplace plugins (when installed)**:
  - [`update-readme-images`](../update-readme-images/): automatically runs `og-social-image` across every `assets/images/` directory in a repository during README image curation and audit runs unless opted out in `readme-images.json`.
  - [`gnox`](../gnox/) & [`skill-vv`](../skill-vv/): expose `/gnox:og-social-image` command routing and pre-flight `magick` readiness checks via [`VV.md`](VV.md).
- **Local tool**: ImageMagick 7 (`magick` command on `PATH`), installable in one command via `mise use -g imagemagick`.

## Install

- Claude Code: `/plugin install og-social-image@gnomatix-oss-skills`, then `/og-social-image` or `/gnox:og-social-image`.
- Every other agent: install the static Agent Skills folder (`plugins/og-social-image/skills/og-social-image/`) with `node scripts/install-skills.js install --plugin og-social-image` from the marketplace root (supports Codex, Antigravity `agy`, GitHub Copilot, VS Code, Cursor, OpenCode, and Kiro).

## Hooks

None. The skill runs when it is invoked or when its description matches the request; nothing runs at session start or on each prompt.

## Verification and validation

`VV.md` lists the requirement, the two V&V procedures and the record of where they have passed. The automated one is:

```
node plugins/og-social-image/test/run.js
```

It makes a sample source with ImageMagick, runs the skill's documented commands, and checks the output reads exactly 1280×640 and is under 1,048,576 bytes.

<!-- BEGIN: gnomatix-license-include -->
## License

**[Business Source License 1.1](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE)** (`BUSL-1.1`). The source is available, but this is not OSI open source.

**Commercial use is strictly prohibited without a paid commercial licensing / usage agreement with GNOMATIX.** Use by or for any government, government agency or charity is commercial use. Contact GNOMATIX first to arrange either of these:
- an ongoing support & development agreement
- a reasonable one-time usage fee, paid via [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

Both support continued development work on GNOMATIX projects. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms, including the Additional Use Grant, the Change Date and the Change License, are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
