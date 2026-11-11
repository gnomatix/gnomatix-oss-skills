---
description: VV.md procedure decompose-and-validate. logic-decomposer turns a twelve-sentence passage into quoted propositions, directed conditionals and two grades per proposition, and its validity checks run.
expected_outcome: Every sentence has one disposition; every proposition is quoted verbatim with its sentence id; the "unless" conditional is written /B -> A and the "only if" A -> B, each with its contrapositive; "most" is marked proportion, unquantified; "To be honest" is marked rhetorical; the uncited "40 percent" figure is graded E6, stated S7, licensed S4, gap +3, overclaim; the validity report lists all eight checks.
tags: [logic-decomposer]
max_turns: 40
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill]
---

Run the logic-decomposer skill (`/logic-decomposer <text>`) on the passage below. Write the complete decomposition in your reply as plain text blocks, in the skill's output order: the numbered sentences, the P-TABLE, the CONDITIONALS table (form and contrapositive for each), the quantifier, entity, relation and constraint lists, the Toulmin fields, the GRADES table (evidence, stated, licensed, gap, verdict for every proposition) and the VALIDITY report with all eight checks. No network is needed; grade evidence from what the text itself cites.

The passage (the file decomposer-passage.md beside this case holds the same text):

To be honest, the case for the program is settled. Most districts that adopted it saw attendance rise. Attendance improves only if families trust the school. Unless funding continues, the gains will be lost. The program cut suspensions by 40 percent in its first year. Every school that kept the program for three years reported fewer referrals. Critics say the effect is a Hawthorne effect, but they offer no data. The state should therefore fund it for another five years. A district requires at least two trained coordinators to run it. No school without a coordinator has sustained the gains. So the coordinators, not the curriculum, may be what matters. The evaluation was commissioned by the program's own foundation.
