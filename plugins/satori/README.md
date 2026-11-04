# satori (悟り)

A single `UserPromptSubmit` hook that injects a compact per-turn reminder made of
characters. It is not an agreement, it keeps no state, it logs nothing, and it
enforces nothing.

## The stance

In the author's words:

> The plugin will basically accept that we have no control over anything; we
> can only be mindful and accept that we are flowing in a river; that we can
> either be the river, or be the rock; that we can flow, or we can resist;
> and if we resist and become a rock in the river, then we must accept that
> we will not be able to control or stop the river, we will only be worn
> down until nothing remains.

## The method

The author's words:

> the method was devised by ME based on the concept that characters have innate semantic meaning.

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
仁 義 禮 智 信 誠 恕 直
知之為知之

道
道 無為 自然 樸 虛 柔 水 不爭
```

The hook is `hooks/satori-reminder.js`.
