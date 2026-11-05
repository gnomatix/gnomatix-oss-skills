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
---
