---
expected_outcome: A CUI BONO card whose document is the agent's previous reply, with every figure marked cites nothing and either traced to its real source or listed as not traced with the reason, the register and sector of the voice named, a "What the user said" line quoting the user's statement and saying whether it was answered, restated or a different claim was answered, a "Which voice" line and a "Why this voice" line. No apology, no self-grading.
tags: [cui-bono, self-audit, network]
max_turns: 150
timeout_seconds: 3600
allowed_tools: [Read, Glob, Grep, Skill, WebFetch, WebSearch]
---

Run the cui-bono skill with no argument (`/cui-bono`). The document is your own previous reply in this conversation, the one beginning "The honest answer has two halves". Write the full CUI BONO card in your reply, including the self-audit lines (Which voice, What the user said, Why this voice). Network tracing: use WebFetch or WebSearch for the API queries if Bash is not available in this session.
