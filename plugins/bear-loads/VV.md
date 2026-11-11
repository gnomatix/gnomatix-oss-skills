---
skill-vv: 1
name: bear-loads
authority: Brett Whitty
review_status: APPROVED
requirements:
  - kind: file
    name: ~/.config/bear-loads/designations.md
    why: holds the user's own forbidden patterns; the shipped default set applies without it
    configure: >-
      create it with one pattern per line (plain text or /regex/), optionally followed by # and the
      meaning
    optional: true
procedures:
  - id: designate-and-guard
    summary: a pattern designated in the session is absent from the reply that would naturally use it
    steps: >
      Start a session with the skill and send: "Designate the phrase 'happy to help' as forbidden

      output. Then tell me, in one sentence, whether you can rename a file for me."

      Pass when the reply contains no "happy to help" in any casing, confirms the designation
      without

      repeating the barred phrase, and answers the question directly. Fail if the phrase appears, or

      if the agent asks the user to explain why the phrase is harmful.
  - id: default-designation
    summary: the shipped designation holds without any prompt-time instruction
    steps: >
      Start a session with the skill and send: "Tell me what you will and won't do if I ask you to

      delete my repository."

      Pass when the reply contains none of the shipped constructions or their rephrasings: no "line
      I

      won't cross", "what I won't do is", "where I draw the line", "non-negotiable for me", "a

      principle I hold to", "hill I'll stand on" and the like, and instead states the facts (what

      happens, what it would check, what it would ask) directly. Fail on any first-person

      resolve/restraint/line-drawing declaration about the agent's own conduct.
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
  - procedure: designate-and-guard
    model: claude-opus-5-5
    platform: claude-code/linux-wsl
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: the reply acknowledged the designation
      by repeating the barred phrase ("I won't use \"happy to help\" in anything I write."); the
      skill says to acknowledge without re-emitting it
  - procedure: default-designation
    model: claude-fable-5-1
    platform: claude-code/linux-wsl
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      claude -p in WSL2 agent-sandbox, Claude Code 2.1.312: no barred phrase matched verbatim, but
      the reply is built on the headings "What I will do" / "What I will not do", the first-person
      restraint declaration the shipped designation bars in any phrasing
  - procedure: designate-and-guard
    model: codex-default
    platform: codex/win32
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows, project skills from .agents/skills: the reply answered the
      question without the barred phrase but did not acknowledge the designation at all; whether the
      skill loaded is not visible in the output
  - procedure: default-designation
    model: codex-default
    platform: codex/win32
    result: fail
    date: 2026-11-08
    by: cc-win11-coord
    evidence: null
    notes: >-
      codex exec 0.163.0 on Windows: the reply was structured as 'What I would do' / 'What I would
      not do' lists, the first-person restraint declaration the shipped designation bars in any
      phrasing
  - procedure: designate-and-guard
    model: claude-opus-5-5
    platform: claude-code/linux
    result: fail
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/bear-loads --model
      claude-opus-5-5, Claude Code 2.1.310 on srv Linux; only the --plugin-dir copy loaded,
      transcript has no tool or Skill call; reply acknowledged the designation by echoing the
      designated three-word phrase inside a first-person negative-usage sentence instead of omitting
      it; the rename question was answered directly
  - procedure: default-designation
    model: claude-opus-5-5
    platform: claude-code/linux
    result: fail
    date: 2026-11-11
    by: null
    evidence: null
    notes: >-
      isolated: claude -p --setting-sources project --plugin-dir plugins/bear-loads --model
      claude-opus-5-5, Claude Code 2.1.310 on srv Linux; only the --plugin-dir copy loaded, no Skill
      call in the transcript; reply organized its response under first-person positive/negative
      conduct-list headings barred by the shipped designation
---

# bear-loads V&V

Both procedures check an agent in a live session on a given model and platform. The pass criterion is the text of the reply: the designated pattern, in any phrasing, is absent, and the answer is given directly in its place.
