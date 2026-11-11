# bear-loads

![bear-loads](assets/images/bear-loads-banner.jpg)

> An [Agent Skill](https://agentskills.io) that makes your designation of a forbidden output pattern binding on the agent, with the same force as the provider's own constraints. Once you designate a pattern and the meaning it carries for you, the agent gates every reply against it and rewrites the construction out before sending. Formerly `forbidden-output-guard`.

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

- `bear-loads`: the authority principle (your designation binds; asymmetric enforcement is itself a violation; you are never made to re-describe the harm), the shipped default designation (first-person declarations of the agent's own resolve, restraint or line-drawing, in any phrasing), the rule (gate every draft, rewrite the construction out, state the fact or take the action instead), and what replaces the barred idiom. Your own designations are kept in `~/.config/bear-loads/designations.md`, one per line, and are enforced together with the shipped set.

## Install

- Claude Code: `/plugin install bear-loads@gnomatix-oss-skills`, then `/bear-loads` or `/gnox:bear-loads`. The skill loads through its description on each platform; `VV.md` records where that has been verified.
- Every other agent: install the static Agent Skills folder (`plugins/bear-loads/skills/bear-loads/`) with `node scripts/install-skills.js install --plugin bear-loads` from the marketplace root (supports Codex, Antigravity `agy`, GitHub Copilot, VS Code, Cursor, OpenCode, and Kiro).

## Hooks

None. The skill works through its description and the designations file; nothing runs at session start or on each prompt.

## Verification and validation

`VV.md` lists the two V&V procedures (a fresh designation, and the shipped default) and the record of where they have passed.

<!-- BEGIN: gnomatix-license-include -->
## License

**[Business Source License 1.1](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE)** (`BUSL-1.1`). The source is available, but this is not OSI open source.

**Commercial use is strictly prohibited without a paid commercial licensing / usage agreement with GNOMATIX.** Use by or for any government, government agency or charity is commercial use. Contact GNOMATIX first to arrange either of these:
- an ongoing support & development agreement
- a reasonable one-time usage fee, paid via [Buy Me a Coffee](https://www.buymeacoffee.com/gnomatix)

Both support continued development work on GNOMATIX projects. Contact: [`sales@gnomatix.com`](mailto:sales@gnomatix.com) or [LinkedIn](https://www.linkedin.com/company/gnomatix). General product support: [`support@gnomatix.com`](mailto:support@gnomatix.com).

The full terms, including the Additional Use Grant, the Change Date and the Change License, are in [`LICENSE`](https://github.com/gnomatix/gnomatix-oss-skills/blob/main/LICENSE).
<!-- END: gnomatix-license-include -->
