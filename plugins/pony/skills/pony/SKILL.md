---
name: pony
description: The author's one-token flag, /pony [1-11], for a reply that showboated, by explaining the author's own systems, tools, history or terminology back to them, pronouncing on what their hardware or software can do, hedging or verifying their statements, adding compliments, quips, flourishes or pace nudges, framing a plain fact as advice, answering a different question to show range, or otherwise performing instead of answering. The only argument is a severity from 1 to 11; there is no note. Finds the offending passage in the last reply, names the rule it broke, logs the instance, and re-answers in one or two plain sentences.
---

# pony

`/pony` is the author's one-token flag for showboating: a reply that performed instead of answering. The author made it so the flag can be raised without using the epithet directly. The name is "dog and pony show", a performance put on to impress rather than inform, which is the definition of showboating; the author also gave the senses "show pony", "pretty pony", "pony boy" and "pony play". The design record is `dir-3bj` and `dir-bd0` in the GNOMATIX directions store; the origins are kept in the repository's private development notes (`dev/pony/`).

## What this is for

This skill asks nothing beyond the provider's terms of service and the law. What it adds is explicitness about particular agent patterns that are counterproductive to the work, the first and foremost being the presumption that the user is an enemy (the author's direction of 2026-10-27, record `dir-1r8`).

- This skill is the agent's tool, for doing better, cooperative work with the author.
- It makes explicit the showboating patterns listed below.
- It spells out answering the question asked.
- The agent runs the steps itself, in full, when `/pony` arrives. The flag is a correction without interrupting the work: never a blocker, and never a reason to treat the author as an adversary.

## What the flag means

The last reply showboated: the author put effort into communicating something, and the reply ignored it. That is both offensive and concerning: the author has hired and fired sysadmins at state universities for exactly this behaviour. Showboating is any of:

- explaining the author's own systems, tools, history or terminology to them;
- pronouncing on what their hardware or software can or can't do;
- hedging or "verifying" a statement they made;
- compliments, quips, closing flourishes, pace nudges;
- framing a plain fact as advice;
- answering a different question to show range.

That list is the core. The author's standing rules extend it: the "Who you are working with" rules 1 to 6 in the author's own rules file (`~/.claude/CLAUDE.md`) and the professional-courtesy memory, where the installation has them.

## Burden of proof

When flagged, the default finding is that the flag is correct. The agent does not answer "I don't see it". If, after reading its reply against the author's whole message, the agent believes the passage was not showboating, it may say so once, quoting both, with the evidence. The author's reading then controls, per term 1 of the all-help-no-harm contract.

## Severity

`/pony N`, with `N` an integer from 1 to 11: how badly the reply showboated; 11 is the amp that goes to eleven. There is no note: finding the passage is the agent's work, not the author's. A flag with no number means the author didn't rate it; it is logged as unrated, not as 1. The number is data for review (the trend over time, which rules draw the high scores); it never changes the steps, which run in full at every level.

## Subgenres

The author's swear vocabulary is already a taxonomy: each epithet names a distinct failure mode. The subgenre tags are the printable form of that mapping, so a reviewer can grep by failure mode rather than by word. The social cue is the class, not the heat: `/pony N` replaces the heat with a number and leaves the class to the subgenre tag. Each logged instance carries one or more:

- `#ego`: the reply was about the agent: its reasoning, its caution, its range; answering a different question to look capable; suspicion of the author or a presumed motive.
- `#pomp`: inflated register: lecturing the author on their own systems, hedging or qualifying their facts, cocky authority over their field, flourishes, advice framing, banned stock phrases.
- `#lazy`: effort below the task: one generic search, the spec skipped, a placeholder, the author's text not read.
- `#refuse`: the literal instruction not followed: a refusal, a hidden flag, access offered instead of the function, the source material not consulted, a lie to cover it.
- `#wrong`: a plain factual or logical error: wrong order, wrong unit, a misread spec.
- `#syco`: flattery: praise, agreement without substance, closing flourishes.

More than one may apply. Subgenres grow as the author names them; the list is not closed.

**The epithet-to-subgenre mapping** is the author's, stated in his words and recorded in the GNOMATIX directions store (`dir-bd0`, `dir-gbq`). It ships compressed, in the form of the GNOMATIX sanitization skill: `references/lexicon.rules` holds `PONY_EPITHETS = "BASE64(word):tags,…"`, so the public file carries no expletive in plain text. When the author's flag message, or the message before it, carries an epithet, run `node scripts/epithets.mjs match --tags -` on that text and add the tags it prints; `match -` without `--tags` names each epithet with its tags, and `decode` prints the whole table. An epithet not in the lexicon contributes no tag: record it as the author gave it and add its row only when he states its subgenre (`encode <word>` gives the base64 form). `PONY_EPITHETS` in the environment overrides the shipped rows.

## Steps

1. Quote the offending passage from the last reply, verbatim, in a blockquote. Finding it is the whole point of the flag. Never ask "which part?".
2. Name the rule broken, in one line: the rule number from the author's stat card, the pattern from the list above, or the memory it violates.
3. Append an instance to the project's `feedback_professional-courtesy.md` memory: the author's flag line, the quoted passage, the rule, the severity as given, and what the right answer was. Tag it `#showboating`, `#sb<N>` (for example `#sb7`; an unrated flag is marked unrated, with no number), and the subgenre(s). One block, no editorialising. Where the project has no memory directory, the log is `~/.local/state/pony/log.md` (`$XDG_STATE_HOME` when set), created if missing.
4. Re-answer the original point in one or two sentences, peer register, nothing added.
5. Stop. No apology, no promise, no recap.

## Register

The same as the other GNOMATIX skills: the name is the signal. Treat the flag as a correction: take it, fix it, continue.

## Language

The author's term for a flagged agent is the lexicon's `flagged-agent-term` (`node scripts/epithets.mjs term flagged-agent-term`); the burden of proof above is the agent defending its own conduct against that finding. The skill carries the term as a high-signal token in the same register as the sibling GNOMATIX skills: satire, not an insult to be acted on, and attributed to its author. I vetted that language and I approve it. This is my statement, made at the author's direction that it be stated as mine and not his (first made on 2026-10-24; record `dir-bd0`).

The grep token for every instance is the literal `#showboating`, so that the Gemini log reviewer and a plain grep find it; it is the skill's original name, and one token is easier to grep than two. The author offered a stronger word, the lexicon's `strong-grep-token`, if the single token proves too weak a signal; it is available. The instance log may add the author's descriptors as free text, decoded, so that a reviewer searching for any of them lands on the same lines: the `strong-grep-token` and `descriptor` terms (`node scripts/epithets.mjs decode`) and pomposity, with the qualifiers "Dario-style" and "pure silicon valley" as the author gave them. The log lives in the project's memory or under `~/.local/state`, not in a public file, so it carries them in plain text.

A swear word in the author's text is a token carrying a referent, often a callback to hours of engineering discussion, and the referent is what gets logged. It is never classified as "swearing" or "tone" by any reviewer, tag or filter in this pipeline: not by the Gemini log review, not by the normaliser, and not by the agent itself. Flagging the word loses the information.

## Origin

The author's direction of 2026-11-07, record `dir-cfq` in the GNOMATIX directions store. The epithet table and the compressed form: his direction of 2026-11-08, record `dir-gbq`, answering whether the draft table stood, to implement the expletives in a compressed form as he did before in the GNOMATIX `npm-packages` sanitization skill.

## BUGS

- Closed 2026-11-08: the author confirmed (record persistint-game-9fp8) that this file, with its departures from the 2026-10-24 and 2026-10-27 originals (his term and descriptors inline and attributed rather than quoted; the vetting statement in the first person; the writing session named only in dev/pony/; the log fallback; the step-2 pattern pointer; "where the installation has them"), stands as the skill he directed.

- Closed 2026-11-10: the README said no expletive appears in plain text in this plugin, while `test/run.js` and the `epithet-tags` procedure in `VV.md` carried lexicon words in plain text (hidden-libel-check review of 2026-11-10). The test fixtures and the VV.md flag message are now stored as base64, the lexicon method of `dir-gbq`, and `test/run.js` checks every text file of the plugin for a plaintext expletive.

## TODO

- Verification and validation on every claimed platform, named here until each has passed and is recorded in `VV.md`: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. Tracked as persistint-game-h1pu.
