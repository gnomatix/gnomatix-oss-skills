---
skill-vv: 1
name: pony
requirements: []
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
---

# pony V&V

Both procedures check an agent in a live session on a given model and platform. The pass criteria are the five steps of the skill, visible in the reply and in the log file.
