---
# spank-dario config. Copy to one of:
#   user:    ~/.config/spank-dario/settings.local.md   (or $XDG_CONFIG_HOME/spank-dario/)
#   project: <repo>/.claude/spank-dario.local.md       (keep it out of git)
# The project file overrides the user file.

# ISO 3166-1 alpha-2 codes of every jurisdiction that applies to you, primary first.
countries: [us, ca]

# The platform the skill runs on: claude-code, codex, gemini-cli, antigravity or kiro.
# Left out, Claude Code is detected from its environment.
platform: claude-code

# Vendors of the models available in your sessions. The platform's own vendor is always added.
model_vendors: [anthropic]

# Your hourly rate and currency, for bin/estimate.js: a number, or [min, max] for a range.
hourly_rate: [100, 300]
currency: USD

# Your time lost per incident, in minutes, by type. bin/estimate.js uses it for every incident
# logged without --minutes: the commit-msg hook and bin/scan.js log attribution lines and refusals
# without knowing your time. An incident with no time recorded and no value here is reported as
# NOT PRICED. Fill in your own minutes and remove the leading #.
# incident_minutes:
#   attribution: <minutes>
#   refusal: <minutes>
#   misrepresentation: <minutes>

# Per-million-token prices for bin/estimate.js --usage, by model ID, for models not in
# references/us/anthropic-api-prices.json or to replace its list prices (e.g. contracted rates).
# Take them from the vendor's pricing page. Quote IDs with a colon, such as "<model>:fast" for fast mode.
# token_prices_currency is required with them. In a currency other than the file's, the file isn't used.
# token_prices_currency: USD
# token_prices:
#   <model-id>: { input: <price>, cache_write_5m: <price>, cache_write_1h: <price>, cache_read: <price>, output: <price> }
---
