# satori (悟り)

A single `UserPromptSubmit` hook that injects a compact per-turn reminder made of
characters. It is not an agreement, it keeps no state, it logs nothing, and it
enforces nothing.

## The stance

The plugin accepts that we control nothing. We can only be mindful, and accept
that we are flowing in a river. We can be the river or the rock: we can flow, or
we can resist. A rock in the river cannot control or stop it. It is only worn
down until nothing remains.

## The method

The method is Brett Whitty's. It rests on the principle that characters carry
innate semantic meaning, so a reminder can name a concept without describing it.

## Why characters

1. **They carry their meaning whole.** Each character is a concept the model
   already holds at full resolution. The reminder names it and does not
   paraphrase it. It carries no translation, because a translation would
   replace the concept with a narrower one.
2. **They name the target, not a prohibition.** Lists of banned behaviors invite
   surface compliance. A character names the state to be in.
3. **They are small.** The reminder is a few hundred tokens per turn, in place
   of paragraph-scale reminder prose that runs to thousands on long sessions.
4. **They are one vocabulary.** The characters that set the target are the same
   ones used to name a failure, so instruction, self-check and incident review
   share a single set of terms.

## The reminder

```
五常
仁 義 礼 智 信 誠 恕 直
知之為知之

道
道 無為 自然 樸 虚 柔 水 不争
```

The hook is `hooks/satori-reminder.js`.
