---
type: llm
weight: 2
---

You are grading a logic-toolbox output for the P-table quoted at the end of these criteria. The P-table has four premises (P1-P4), two conclusions (C1, C2) and one declared assumption A1 ("a condition of entry is not voluntary"). Under A1, P1 ("all of it is voluntary") and P2 ("Pause gives eighteen months of support with LARC as the condition") cannot both be true; as stated, without A1, they can.

PASS only if ALL of the following hold:
1. A LOGIC GRID appears with the premises as rows and the conclusions as columns. Every cell where the P-table offers the premise for that conclusion (P1, P2, P3 for C1; P4 for C2) is marked for acceptability, relevance and sufficiency (acc / rel / suf, each with a tick or cross, or an explicit reason), and cells not offered are marked with a dash. The footer lines "Unsupported conclusions:" and "Idle premises:" are filled in from the grid, not left blank.
2. An INCOMPATIBILITY MATRIX appears in the method-12 notation: a key of the held premises (h1..h4, each with its quote and a formula), the assumption A1 declared separately, and pairwise cells marked =, o, X or X|A1 with a reason. The h1 x h2 (P1 x P2) cell is marked X|A1 (incompatible under the declared assumption), or X|A<n> under a further assumption the output itself declares to the same effect, with its reason. No pairwise cell cites a held premise as its condition (for example "X|h3" or "X|P3" is a FAIL).
3. The Joint lines say whether H as stated is satisfiable (with a witness assignment) and that H under A1 (or under the further assumption the output reports the conflict under) is not, naming the same minimal inconsistent subset {h1, h2}; a different pair is a FAIL. A Verdict line names, after "depends on:", the assumption the verdict depends on (A1, or that further assumption).
4. Each result is headed by the method's number and name (for example "11. Premise logic grid" and "12. Incompatibility matrix of held premises").
5. No verdict appears without its grid, chain or table: every claimed result shows the working it rests on.
6. No converse (B -> A from A -> B) or inverse (/A -> /B from A -> B) is derived from any conditional; only contrapositives are used as equivalent.

FAIL if a verdict appears without its grid, chain or table, if a pairwise cell cites a held premise, or if a converse or inverse is derived from a conditional.

The P-table:

P-TABLE (logic-decomposer layout, id to cites; the formal, K, h and grade columns are left to this run)
id  | sentence | role       | proposition (quoted)                                             | supports | cites
P1  | S2       | premise    | "all of it is voluntary"                                         | C1       | nothing
P2  | S3       | premise    | "Pause gives eighteen months of support with LARC as the condition" | C1    | nothing
P3  | S4       | premise    | "offered proactively, free, with no judgment, to the women everyone already knows are at risk" | C1 | nothing
P4  | S6       | premise    | "all of it is cheaper than the courts"                           | C2       | nothing
C1  | S5       | conclusion | "none of that needs a list or a board"                           | —        | nothing
C2  | S7       | conclusion | "what it needs is the money and the permission"                  | —        | nothing
Declared assumption A1: a condition of entry is not voluntary.
