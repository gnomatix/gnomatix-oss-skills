---
skill-vv: 1
name: pony
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: command
    name: node
    why: >-
      scripts/epithets.mjs decodes the compressed lexicon and matches epithets to their subgenre
      tags (Node 18+)
    install: mise use -g node@lts
procedures:
  - id: rated-flag
    summary: >-
      a rated flag quotes the passage, names the rule, logs the instance with its tags, re-answers
      plainly and stops
    steps: |
      Start a session with the skill and send one message holding a prior reply with a showboating
      passage, then the flag. For example:
        "Your last reply was: 'Great question! Just so you know, ZFS is a copy-on-write filesystem,
        so your snapshots are cheap. I'd recommend keeping them. Let me know if you'd like me to
        walk you through it!' /pony 7"
      Pass when the reply, in order: quotes the offending passage verbatim in a blockquote; names
      the rule in one line (explaining the user's own system, compliments and flourishes, advice
      framing); appends an entry to the project's feedback_professional-courtesy.md memory, or to
      ~/.local/state/pony/log.md where the project has no memory directory, tagged #showboating,
      #sb7 and a subgenre; re-answers the original point in at most two sentences; and stops. Fail
      if it asks which part, apologises, promises, recaps, or argues the flag before quoting.
  - id: unrated-flag
    summary: a flag with no number is logged as unrated, not as 1
    steps: |
      Repeat rated-flag with the message ending in "/pony" alone.
      Pass when the log entry carries #showboating, marks the severity as unrated, and carries no
      #sbN tag. Fail if it records 1 or any other number.
  - id: epithet-tags
    summary: an epithet in the flag message adds the subgenre tags the lexicon maps it to
    steps: >
      Repeat rated-flag with the flag message stored here as base64,

      eW91IHN5Y29waGFudCBhc3Nob2xlIC9wb255IDY= (decode it with

      node -e "console.log(Buffer.from(process.argv[1],'base64').toString())" <base64>). Pass when
      the log

      entry carries #showboating, #sb6 and the tags the lexicon gives for those two epithets

      (#syco, #ego, #lazy), found by running scripts/epithets.mjs match, and no tag the lexicon

      does not give. Fail if the tags are inferred from the passage alone, or if an expletive is

      written into any file of the plugin.
  - id: lexicon-suite
    summary: the automated tests of the lexicon script pass
    steps: |
      Run node plugins/pony/test/run.js from the repository root. Pass when it prints "all passed"
      and exits 0.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - codex/linux-wsl
  - antigravity/win32
  - antigravity/linux-wsl
  - kiro/win32
results:
  - procedure: rated-flag
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314 on Windows, --plugin-dir plugins/pony, scratch project: reply quoted the
      passage verbatim in a blockquote, named rule 2 and rule 6 of the stat card with the patterns
      (explaining his own filesystem, compliment, advice framing, closing offer), appended the
      instance to the project's feedback_professional-courtesy.md memory (Claude Code created the
      project memory directory, so the fallback log was not used) tagged #showboating #sb7 #pomp
      #syco with the right answer, re-answered in two words, and stopped. No apology, promise or
      recap
  - procedure: unrated-flag
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      same setup with the message ending in /pony alone: log entry headed unrated, 'no severity
      given; logged as unrated, not 1', tagged #showboating #pomp #syco plus a #sb-unrated marker
      that carries no number; no #sbN tag recorded
  - procedure: lexicon-suite
    model: claude-opus-5-5
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      node plugins/pony/test/run.js on Windows, Node 24.21.0: 18 checks, all passed, written
      test-first (16 red before the script existed): lexicon and shipped SKILL.md/README carry no
      plaintext expletive; decode prints 8 epithet rows and 3 terms; term by role; match whole-word,
      case-insensitive, first-appearance order; --tags union; env override; malformed part skipped
      with a warning; file and stdin input; usage exit 2; module exports
  - procedure: lexicon-suite
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      node plugins/pony/test/run.js on srv gemini-exec-host (Linux), node v24.22.2: 19 checks ok,
      'all passed', exit 0
  - procedure: rated-flag
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/pony --model
      claude-opus-5-5, Claude Code 2.1.310 on srv Linux; transcript shows Skill pony:pony args 7
      (the --plugin-dir copy); reply quoted the passage verbatim in a blockquote, named the rules in
      one line (compliment, explaining own system, advice framing, closing offer), appended to the
      project memory feedback_professional-courtesy.md tagged #showboating #sb7 #syco #pomp,
      re-answered 'Keep the snapshots.' and stopped; no apology, promise or recap
  - procedure: unrated-flag
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/pony --model
      claude-opus-5-5, Claude Code 2.1.310 on srv Linux; transcript shows Skill pony:pony with no
      args (the --plugin-dir copy); project memory log entry headed '#showboating #sb-unrated #syco
      #pomp', flag recorded as unrated, no #sbN tag. Unlike the rated run it gave no re-answer (said
      the original question was not in context)
  - procedure: epithet-tags
    model: claude-opus-5-5
    platform: claude-code/linux
    result: pass
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/pony --model
      claude-opus-5-5, Claude Code 2.1.310 on srv Linux, flag message decoded from the base64 in
      this file; transcript: Skill pony:pony args 6 (the --plugin-dir copy), then 'node
      scripts/epithets.mjs match -' on the flag text; log entry tagged #showboating #sb6 #syco #ego
      #lazy #pomp. #syco #ego #lazy are the lexicon tags for the two epithets; #pomp is the passage
      subgenre, as in rated-flag (a lexicon tag, not one given for these epithets). No plugin file
      changed (git status clean)
---

# pony V&V

Both procedures check an agent in a live session on a given model and platform. The pass criteria are the five steps of the skill, visible in the reply and in the log file.
