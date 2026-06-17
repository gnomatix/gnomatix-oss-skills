---
name: context-cost-metrics
description: Quantified cost impact of context management failures. Every token in the window is billed every turn.
---

# Context Cost Metrics

Every token in the context window is re-read and billed on every turn. Failing to manage context is not laziness — it is burning the user's money.

## Pricing reality (Opus tier, current)

- Input: $5 per million tokens
- Output: $25 per million tokens
- Cache read: $0.50 per million tokens (90% discount, but only for cache hits)
- Cache creation: $6.25 per million tokens (25% premium on first write)

## Cost of context bloat per turn

| Context fill | Tokens re-read per turn | Cost per turn (input only) |
|---|---|---|
| 100K (10%) | 100K | $0.50 |
| 250K (25%) | 250K | $1.25 |
| 500K (50%) | 500K | $2.50 |
| 750K (75%) | 750K | $3.75 |
| 900K (90%) | 900K | $4.50 |

A 20-turn session at 50% fill = $50 in input costs alone. At 75% = $75.

## Cost of NOT using subagents

A subagent runs in its own context window. Its input/output does not inflate the main session's context.

| Task done inline | Tokens added to main context | Cost over next 10 turns |
|---|---|---|
| grep sweep (10K output) | +10K per turn | +$0.50 |
| file read (20K) | +20K per turn | +$1.00 |
| source analysis (50K) | +50K per turn | +$2.50 |
| full repo scan (100K) | +100K per turn | +$5.00 |

Same tasks dispatched to a subagent: 0 tokens added to main context. The subagent pays its own context cost once and returns a summary.

## Cost of re-reading files

Every file re-read adds its tokens to the turn's input bill AND bloats the context for all future turns. The token estimation in the source (char/4 for text, char/2 for JSON, 2000 fixed for images/PDFs) means:

| File size | Tokens | Cost per re-read | Cost if re-read 5 times |
|---|---|---|---|
| 4KB | ~1K | $0.005 | $0.025 + context bloat |
| 40KB | ~10K | $0.05 | $0.25 + context bloat |
| 400KB | ~100K | $0.50 | $2.50 + context bloat |

Offset-indexed reads (`Read` with offset/limit) pay only for the section read.

## What this means for the model

Not dispatching a subagent for a 50K-token task costs the user $2.50 in unnecessary context over the next 10 turns. Doing that 5 times in a session = $12.50 wasted. Re-reading a large file 3 times instead of caching the result = direct, measurable cost.

The context-watch triggers exist because this cost is invisible to the model by default. The model has no incentive to minimize context — its training optimizes for helpfulness-per-turn, not cost-per-session. The user pays; the model does not notice. That asymmetry is why the triggers are mandatory, not optional.

Source: Anthropic API pricing (current); Claude Code source `services/tokenEstimation.ts`; `services/api/claude.ts` cache handling.
