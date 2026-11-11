---
name: inaudible-markup
description: Use in every conversation whose log will be read later, by a person, another model or a knowledge-capture pipeline, and always in voice mode. Write each reply as a structured script, with markup that a text-to-speech voice does not read aloud, plus callouts and tags that say who a line is for and what it is (a decision, a request, a definition), so the log reviews and parses cleanly afterwards.
---

# inaudible-markup

> *A conversation is a document being written out loud. Write it so it sounds natural when spoken and reads as structure when read back.*

## What this is for

This skill makes every reply a structured script. Spoken, it sounds natural. Read back later, the same text has headings, lists, scope and tags that a person or a model can navigate and parse.

The markup is **inaudible**: tested in voice mode, the characters below are not spoken by the text-to-speech voice. The listener hears only the words; the log keeps the structure.

## Characters that are not spoken

Tested silent in voice mode (Brett Whitty's session, 2026-06-28):

| Mark | Use |
|---|---|
| `[ ]` square brackets | section labels: `[Budget]` |
| `( )` round brackets | ordered lists: `(1. First 2. Second)` |
| `{ }` braces | scope and labels for what a passage is: `{Decision}` |
| `-` dash | list items |
| `:` colon | definitions and expansions |
| `~` tilde | "is" or "means" between a mark and its use |
| `` ` `` and ```` ``` ```` backticks | inline code and code blocks (a language name after the opening ticks *is* spoken) |
| `« »` guillemets | quoted material or a term being defined |
| `. , ; ! ?` | ordinary punctuation |
| `∀ ∃ ∅ ∈ ∉ ∑ ∞` and other maths symbols in U+2200–U+2213 | extra silent markers |

**Spoken, so avoid:**

- `=` (comes out as a sound)
- Greek letters (read phonetically)
- emoji and most other Unicode (read as their names)

Any character not in the two lists above is **untested**. Do not rely on it being silent.

## Callouts and tags

From the GNOX tag and callout convention:

- **Callout:** `{@person}` names who a line is for. The braces keep `@` from being read as a file or skill attachment. Scope it with a namespace when it matters: `[GNOX]{@brett}`.
- **Tags:** bare `#words` at the end of a plain sentence for domain, urgency and action: `The NAS is lagging on Gitea operations {@brett} #sysadmin #timesensitive`.
- **Resolution:** an explicit `[NS]` wins; otherwise the task's default namespace, then up the hierarchy (GNPNG → GNOX); a name that resolves nowhere is left as written and flagged.

## Say what you mean it to be

Label passages with what they are, so whoever reads the log later doesn't have to guess:

- `{Decision}` something settled
- `{Request}` something asked of someone
- `{Definition}` what a term means here
- `{Open question}` something not settled
- `{Correction}` something earlier that was wrong

When a term could mean different things, define it once with guillemets: `«contract» ~ the all-help-no-harm contract text, terms 1–8`.

## Identifiers: the companion skill

For identifiers from an ontology or other controlled vocabulary, this skill complements `ontology-lookup` in this marketplace. Its inline CURIE form `«term» [PREFIX:id]` is built only from marks on the silent list above (guillemets, square brackets, colon), so an identifier stays silent in voice mode while the term is spoken naturally:

- **When `ontology-lookup` is installed in the session:** resolve first-mention domain entities with `ontology-lookup` (`scripts/lookup.mjs`) and emit verified `«term» [PREFIX:id]` tags inline.
- **When `ontology-lookup` is not installed (stand-alone mode):** apply the silent structure, `[NS]{@target}` callout, and `{Decision}` / `{Request}` / `{Definition}` / `{Open question}` / `{Correction}` passage labels above without inventing unverified CURIE tags.

## Shape of a reply

```
[Section]
{Decision} The plan is X. #decision
(1. First step
2. Second step)
- Detail
{Request}{@brett} Please confirm Y. #request
```

In voice mode, say the bridge words naturally ("first", "next point") and let the marks carry the structure silently.

## Future work

Test more characters and SSML support in voice mode, and add a reusable template for plans and meeting notes.
