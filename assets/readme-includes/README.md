# gnomatix README boilerplate includes

Canonical content blocks for `README.md` files across this repo. Each block is delimited by `<!-- BEGIN: <id> -->` / `<!-- END: <id> -->` markers so batch-update tools can find and refresh them in place without touching surrounding prose.

When the canonical content changes, edit the file here and propagate to every README by re-copying the marker-delimited block.

## Available blocks

| File | Block ID | Purpose |
|---|---|---|
| [`promo.md`](promo.md) | `gnomatix-promo-include` | "Buy Me A Coffee" button + GNOMATIX branding. Sits near the top of each README, below the heading and tagline, above the main content. |
| [`license.md`](license.md) | `gnomatix-license-include` | License declaration (Business Source License 1.1) for the project. Sits in the `## License` section at the bottom of each README. |

## How to use

For each README that should carry one of these blocks:

1. Open the README.
2. Locate the appropriate spot (top for promo, bottom for license).
3. Paste the marker-delimited block from the corresponding file in this directory.
4. Do not edit the block content in the consuming README; edit the canonical file here, then propagate to every README.

The marker comments are preserved in rendered output so a future batch script can `sed`-replace block content between markers without disturbing surrounding prose.
