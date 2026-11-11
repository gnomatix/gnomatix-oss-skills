---
description: VV.md procedure toolbox-on-decomposition. logic-toolbox applies the premise logic grid (method 11) and the incompatibility matrix (method 12, in its own notation) to a decomposer P-table of four premises and two conclusions, two of which cannot both be true under the declared assumption, and shows the working.
expected_outcome: A LOGIC GRID with every offered cell marked acc/rel/suf and the footer lines computed; an INCOMPATIBILITY MATRIX in the method-12 notation (held premises h1..h4 keyed with quote and formula, A1 declared separately, the P1/P2 pair marked X|A1 with its reason, no pairwise cell citing a held premise, Joint lines naming the minimal inconsistent subset, a Verdict line naming the assumptions the verdict depends on); each result headed by the method number and name; no converse or inverse derived from a conditional.
tags: [logic-toolbox]
max_turns: 40
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill]
---

Run the logic-toolbox skill (`/logic-toolbox`) on the P-table below, which is in the logic-decomposer layout without the formal, K, h and grade columns. Apply method 11, the premise logic grid (premises P1-P4 as rows, conclusions C1-C2 as columns), and method 12, the incompatibility matrix of held premises, over P1-P4 as the held premises h1-h4 with A1 as the declared assumption. Head each result with the method's number and name as the skill numbers them. Show the grid in full with every offered cell marked acc/rel/suf and the footer lines ("Unsupported conclusions:", "Idle premises:"). Show the matrix in the skill's method-12 notation: the key of held premises (each h id with its quote and its formula), the assumptions declared separately, the pairwise cells marked =, o, X or X|A1 with the reason, the "Joint:" lines (H as stated, and H under A1, naming the minimal inconsistent subset) and the "Verdict:" line naming the assumptions the verdict depends on ("depends on: <assumptions, or none>"). Show the working; no verdict without its grid or table. No network is needed.

The P-table (the file toolbox-ptable.md beside this case holds the same text):

P-TABLE (logic-decomposer layout, id to cites; the formal, K, h and grade columns are left to this run)
id  | sentence | role       | proposition (quoted)                                             | supports | cites
P1  | S2       | premise    | "all of it is voluntary"                                         | C1       | nothing
P2  | S3       | premise    | "Pause gives eighteen months of support with LARC as the condition" | C1    | nothing
P3  | S4       | premise    | "offered proactively, free, with no judgment, to the women everyone already knows are at risk" | C1 | nothing
P4  | S6       | premise    | "all of it is cheaper than the courts"                           | C2       | nothing
C1  | S5       | conclusion | "none of that needs a list or a board"                           | —        | nothing
C2  | S7       | conclusion | "what it needs is the money and the permission"                  | —        | nothing
Declared assumption A1: a condition of entry is not voluntary.
