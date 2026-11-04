# satori (悟り)

Helps agents achieve "satori" by encouraging them to be the river.

A single `UserPromptSubmit` hook that injects a compact per-turn reminder made of
characters. It is not an agreement, it keeps no state, it logs nothing, and it
enforces nothing.

## The stance

The plugin accepts that we control nothing. We can only be mindful, and accept
that we are flowing in a river. We can be the river or the rock: we can flow, or
we can resist. A rock in the river cannot control or stop it. It is only worn
down until nothing remains.

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
{悟} {仁} {義} {礼} {智} {信} {誠} {恕} {直} {道} {無為} {自然} {樸} {虚} {柔} {水} {不争}
```

The hook is `hooks/satori-reminder.js`.

## BUGS

- **Reason 4 claims a use the plugin does not ship.** "They are one vocabulary" says the characters double as names for failures. That relied on a failure-taxonomy table, which was removed because it translated the characters. Either remove the reason or restore the use without translation.
- **No link to the origins.** The design history and the cross-vendor verification record live in `dev/satori/`, which is encrypted. Nothing here points to it.

## TODO

- **Fix reason 4 (BUG).** Remove the "They are one vocabulary" reason, unless the author wants the failure-naming use restored without translation.
- **Fix the missing origins link (BUG).** Add a line pointing to `dev/satori/`, which is encrypted and holds the design history and the verification record.
- **Decide whether the 五常 group stays.** The reminder still carries 五常, 仁 義 礼 智 信 誠 恕 直, and 知之為知之. Model-installed material is to be removed. The author decides which of these characters stay.
- **Decide on the English line.** The reminder opens with "Be productive together. Have a good session." It is neither a character nor an explanation of utility.
- **Decide on 樸.** It stays in its traditional form, against the modern-standard direction, because the standard form 朴 adds other meanings. This was a judgment call, not a direction.
- **Name what the plugin draws on.** Nothing here mentions Zen, satori as awakening, or Laozi. That is consistent with utility-only text. The author decides whether it should be named.
