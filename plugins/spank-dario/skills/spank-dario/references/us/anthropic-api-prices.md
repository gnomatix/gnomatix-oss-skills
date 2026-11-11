# Anthropic API list prices, for the usage cost in bin/estimate.js --usage

The prices are in `anthropic-api-prices.json`. `bin/estimate.js --usage` uses them to compute the API-equivalent cost of the tokens in Claude Code session transcripts. Claude Code's `/usage` computes its cost figure the same way.

## Sources

- **Prices:** Anthropic, "Pricing", https://platform.claude.com/docs/en/about-claude/pricing, read 2026-11-11.
  - "All prices are in USD."
  - Rows used, per million tokens (base input, 5m cache writes, 1h cache writes, cache hits and refreshes, output):
    - Claude Fable 5.1: $10, $12.50, $20, $0.25, $50
    - Claude Mythos 5.1: $10, $12.50, $20, $0.25, $50
    - Claude Opus 5.5: $4, $5, $8, $0.20, $20
    - Claude Opus 5: $5, $6.25, $10, $0.50, $25
    - Claude Sonnet 5.5: $2, $2.50, $4, $0.10, $10
    - Claude Haiku 4.5: $1, $1.25, $2, $0.10, $5
  - "For Claude 4.6 and later models, specifying US-only inference through the `inference_geo` parameter incurs a 1.1x multiplier on all token pricing categories, including input tokens, output tokens, cache writes, and cache reads."
  - Model IDs for those names are from the model table of Anthropic's claude-api skill (Claude Code 2.1.310, cached 2026-10-06): `claude-fable-5-1`, `claude-mythos-5-1`, `claude-opus-5-5`, `claude-opus-5`, `claude-sonnet-5-5`, `claude-haiku-4-5`.
- **Claude Haiku 5.5 (`claude-haiku-5-5`), two rows by prompt size:** same page, read 2026-11-11. The model ID was given by the maintainer with the task; it was not read from the claude-api skill's model table.
  - Table header: "| Model | Base input tokens | 5m cache writes | 1h cache writes | Cache hits and refreshes | Output tokens |"
  - "Claude Haiku 5.5 (for prompts up to 100,000 tokens)": $0.10 / MTok, $0.125 / MTok, $0.20 / MTok, $0.01 / MTok, $0.50 / MTok
  - "Claude Haiku 5.5 (for prompts over 100,000 tokens)": $0.50 / MTok, $0.625 / MTok, $1 / MTok, $0.05 / MTok, $2.50 / MTok
  - From "Long context pricing": "Claude Haiku 5.5 is priced by prompt length: a request whose prompt is over 100,000 tokens pays higher prices. A request's prompt length counts all of its input tokens, including cache reads and cache writes. Each request is priced on its own: a request over the threshold pays the higher prices even when part of its prompt is a cache hit, and earlier requests keep the prices they were billed at."
  - From "Data residency pricing": "On Claude Haiku 5.5, the multiplier also applies to the higher prices for prompts over 100,000 tokens"
  - How `lib/usage.js` applies this: each request's prompt is `input_tokens + cache_read_input_tokens + ephemeral_5m_input_tokens + ephemeral_1h_input_tokens` (output tokens are not part of it). A prompt of more than 100,000 tokens takes the "over" row for all of the request's tokens; a prompt of 100,000 tokens or fewer takes the "up to" row. The page states the boundary only through the two row labels and the sentence "a request whose prompt is over 100,000 tokens pays higher prices"; it has no further sentence on a prompt of exactly 100,000 tokens. Exactly 100,000 is not over 100,000, so it takes the "up to" row by the label wording. In `anthropic-api-prices.json` the rows are `prompt_rows`, with `prompt_tokens_up_to: 100000` and `prompt_tokens_over: 100000`.
- **How Claude Code's `/usage` computes its figure:** Anthropic, "Manage costs effectively", https://code.claude.com/docs/en/costs.md, read 2026-11-11.
  - "Claude Code computes the dollar figure locally from token counts at list price, unless a modelPricing table is in effect."
  - "The figure is an estimate, so for authoritative billing see Manage costs for your organization."
  - "The Session block in /usage shows API token usage and is intended for API users. Claude Pro, Max, and Ultra subscribers have usage included in their subscription, so the session cost figure isn't relevant for billing purposes."
  - "Thinking tokens are billed as output tokens"

## Token counts

From each assistant record's `message.usage` in the Claude Code transcript (`~/.claude/projects/<project>/<session>.jsonl`, and the session's `subagents/` directory): `input_tokens`, `cache_creation.ephemeral_5m_input_tokens`, `cache_creation.ephemeral_1h_input_tokens`, `cache_read_input_tokens`, `output_tokens`. Claude Code writes one record per content block, each with the same `message.id` and usage, so each `message.id` is counted once. `output_tokens` already holds the thinking tokens (`output_tokens_details.thinking_tokens` is a part of it).

## Not on file

- Prices that depend on more than the model and the prompt size: fast mode (`speed: "fast"`), the Batch API. Records needing them are reported as NOT PRICED until the user sets `token_prices` in the config.
- A cache write without the 5m/1h split (`cache_creation_input_tokens` with no `cache_creation` object): it has no single price, and its prompt size for the Haiku 5.5 rows is not known. Reported as NOT PRICED.
- An `inference_geo` other than `global` or `us`: no multiplier for it is on file. Reported as NOT PRICED, naming the value.
- Models released after the read date. Set `token_prices` for them, from the pricing page.
