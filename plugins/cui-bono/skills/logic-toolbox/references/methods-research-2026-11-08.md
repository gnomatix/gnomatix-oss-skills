# logic-toolbox: formal methods reference

Research document for the `logic-toolbox`, `logic-decomposer` and certainty-grading skills. Date of research: 2026-11-08. Every claim below was checked against the cited page or PDF unless marked **[unchecked]**; the "Unchecked / not found" list at the end collects every such label. Wikipedia was used only as a lead and is never cited as the record.

## Summary table

| # | Method | Problem type | Test it supports | Authoritative source |
|---|---|---|---|---|
| 1 | Logic-grid / crosshatch chart (Dell, Penny Press, Games) | Match n categories of k items one-to-one from clues | Exhaustion: every row/column of every sub-grid ends with exactly one dot | Penny Press, "How to Solve Logic Problems" (2025 sample PDF); Dell intro (reproduced at grugel.com) |
| 2 | Table-style (fill-in) chart | Same, when one category is an inherent order (days, places) | Same exhaustion test on a positional table | Penny Dell, "How to Solve Logic Table Puzzles" (2008 PDF) |
| 3 | Cross-elimination (geometrical / parallel) | Advanced grid inference across sub-grids | A sub-row with all k options X'd is a contradiction, so the shared pair is impossible | Puzzle Baron, "Cross Eliminations" tutorial |
| 4 | Zebra / Einstein puzzle as CSP | 5x5 one-to-one with relational clues | Constraint propagation to a unique model | Life International, 17 Dec 1962 **[unchecked primary]**; Russell & Norvig ch. 6 |
| 5 | LSAT AR sequencing (strict / relative) | Order n elements under rules | Must / could / cannot be true read off the diagram | Manhattan LSAT Logic Games (2011 sample ch. 1-2); PowerScore LG Bible |
| 6 | LSAT AR grouping / in-out (Logic Chain) | Select or partition elements under conditionals | Contrapositive closure of the chain | Manhattan LG ch. 5-6; 7Sage "lawgic" |
| 7 | LSAT AR matching / assignment (Open/Closed Board) | Assign elements to 3+ categories | Board exhaustion | Manhattan LG ch. 7-8 |
| 8 | Conditional diagramming (S -> N, contrapositive, indicators, Unless Equation) | Translate rules to arrows and chain them | Contrapositive validity; chain inference | PowerScore (Barbri) conditional reasoning pages; 7Sage lawgic |
| 9 | LSAT LR question-type taxonomy | Argument analysis under a stem | Stem-specific test (must be true, necessary assumption, flaw, ...) | LSAC LR skills page; 7Sage LR question types (22 types, with stems) |
| 10 | GMAT CR + Assumption Negation Technique | Find the unstated necessary premise | Negated assumption must weaken the argument | GMAC exam content (via third party **[unchecked direct]**); PowerScore LR Bible ch. 11 (per Barbri page) |
| 11 | Truth table (full and indirect) | Propositional validity and consistency | Valid iff no row has all premises T and conclusion F; consistent iff some row has all T | Hurley, Concise Introduction to Logic; TAMU Sec. 2.4 notes |
| 12 | Venn diagram test for syllogisms | Categorical validity | Diagramming the premises already draws the conclusion | Hurley ch. 5; Copi & Cohen; Kemerling, Philosophy Pages |
| 13 | Syllogism rules and the 15 / 24 valid forms | Categorical validity by rule | Six rules; 15 forms (Boolean), 24 (with existential import) | Copi & Cohen six rules via Kemerling; Hurley |
| 14 | Converse / inverse / contrapositive | Conditional equivalence | Only the contrapositive is equivalent | Hurley ch. 6; Copi & Cohen ch. 8 |
| 15 | Consistency of a premise set (pairwise and joint) | Can all held premises be true together? | Model finding; indirect truth table with all statements set T | Hurley ("Testing Statements for Consistency") |
| 16 | Indirect proof (reductio) | Derive a conclusion by contradiction | Assume negation, derive p and not-p, discharge | Hurley ch. 7 (Conditional Proof / Indirect Proof) |
| 17 | Constraint propagation, arc consistency (AC-3) | CSPs: Sudoku, KenKen, zebra, grids | Arc (i,j) consistent iff every value of i has a support in j | Mackworth 1977; Russell & Norvig 4e ch. 6; Dechter 2003 ch. 3 |
| 18 | Toulmin layout | Structure of a single real-world argument | Warrant and backing present; qualifier matches rebuttals | Toulmin, Uses of Argument (updated ed. 2003); Verheij 2005 |
| 19 | Argument schemes and critical questions | Defeasible argument types | Each scheme's critical questions answered | Walton, Reed & Macagno 2008 |
| 20 | Argument maps (Rationale, Argunet / Argdown) | Multi-premise support / attack structure | Every box reached by a support or attack path; co-premises explicit | van Gelder 2007; Argdown syntax docs |
| 21 | Wigmore chart | Mass of evidence to an ultimate probandum | Key-list completeness; every inference arrow justified | Anderson, Schum & Twining 2005 ch. 5; Twining's seven steps (Montgomery 2010) |
| 22 | Incompatibility matrix of held premises (designed artefact) | Which held premises cannot all be true together | Pairwise satisfiability + joint model search | Part E below; formal basis Hurley consistency; CSP model finding |

---

## Part A. Puzzle-magazine methods

### 1. Logic-grid (crosshatch) chart

**Problem.** Match k items in each of n categories one-to-one from a list of clues.

**Procedure** (Penny Press, "How to Solve Logic Problems", 2025 sample; checked):
1. Read introduction and all clues; "All the information you need to solve a Logic Problem is given in the introduction and clues, and in illustrations, when provided."
2. Use the chart: "We use a '•' to signify 'Yes' and an 'X' to signify 'No.'"
3. For each positive fact, put a dot at the intersection and "put 'X's in all the other days in [that] row and all the other names in the ... column."
4. For each negative fact, put an X.
5. "Whenever you establish a relationship ... be sure to place 'X's at the intersections of all relationships that become impossible as a result."
6. Repeat; when a row or column in a sub-grid has one empty cell left, it is a dot.
7. Guessing is permitted only as hypothesis test: "make a logical guess based on facts you've established. When you do, always look for clues or other facts that disprove it. If you find that your guess is incorrect, eliminate it as a possibility." That is the reductio step of method 16 in puzzle form.

The Dell Magazines introduction (reproduced at grugel.com; the page carries no Dell attribution, so the attribution is to the mirrored text, not confirmed against a Dell issue) adds two points: the two chart types are the "crosshatch" grid and the "fill-in" grid, and "Transferring information from one section of the grid to another ... is an important step in solving, and it's an easy one to overlook."

**Notation (ASCII):**
```
            | Paul Rob Stan Vern Wally | Mon Tue Wed Thu Fri
   Anne     |  •    X    X    X    X   |  •   X   X   X   X
   Cathy    |  X    •    X    X    X   |  X   X   X   X   •
   ...
   Monday   |  •    X    X    X    X   |
```
**Test.** Each sub-grid ends with exactly one dot per row and per column, and the dots are mutually consistent across sub-grids (the transfer step).

**Micro-example** (from the Penny Press sample): Anne married Monday but not Wally; Stan Wednesday; Rob Friday but not Ida; Vern (Fran's husband) the day after Eve. Dots: Anne-Mon, Stan-Wed, Rob-Fri, Vern-Fran. Eve is not Mon (Anne), so Vern is not Tue; the remaining Tue/Thu pair forces Vern-Thu, Eve-Wed, hence Eve-Stan; Cathy-Fri-Rob; Ida-Tue-Wally; Anne-Paul.

**Source.** Penny Press / Penny Dell Puzzles, "How to Solve Logic Problems", in *Super Value Print n Solve: The Book of Logic* sample PDF, pennydellpuzzles.com/wp-content/uploads/2025/12/Super-Value-Print-n-Solve-SERIES-The-Book-of-Logic-CBLFL-sample-puz.pdf (copyright 2025 Penny Publications). Dell introduction: grugel.com/games/logic/logic-instructions.html.

### 2. Table-style (fill-in) chart

**Problem.** Same as 1 when one category has an inherent order. Penny Dell: "We provide a solving table in lieu of a conventional crosshatch solving chart whenever a table will make a logic problem easier to solve. This occurs when the conventional crosshatch grid is too big or too awkward to use, or when the puzzles can be solved more naturally with a table."

**Procedure.** Write the ordered category down the left ("write the days Monday through Friday, in chronological order, in the left-hand column"); enter each deduced value in its row; treat "not X" facts as eliminations noted beside the table; the puzzle ends when every cell is filled. **Test.** Every cell filled, each value used once per column.

**Source.** Penny Press / Dell Magazines, "How to Solve Logic Table Puzzles" (2008), pennydellpuzzles.com/wp-content/uploads/2019/03/How-to-Solve-Logic-Tables.pdf (read in full, 4 pp.).

### 3. Cross-elimination

**Problem.** Infer an X that no single clue gives.

**Procedure** (Puzzle Baron; checked): "find a subcolumn or subrow which has only a few (2 or 3) remaining options"; "see if any other subcolumns/subrows exist where all of those remaining options have already been eliminated"; mentally lay one line on the other; "If all five options in the column are then X'd out, that's a valid cross-elimination"; mark the intersecting pair as impossible. Puzzle Baron lists further named techniques without defining them on that page: True and False Clues, Multi-Elimination, Neither/Nor, Either/Or, Greater/Lesser Than, Unaligned Pair, Transpositions, Skewed Cross Eliminations, Pseudo-True Pairs, Transitive Relationships, Comparative Relationships, Trial and Error.

**Formal basis.** This is arc consistency (method 17) between two variables: a value is deleted when it has no support.

**Source.** logic.puzzlebaron.com/how-to-solve-a-logic-puzzle.php?t=parallel-cross-eliminations.

### 4. The zebra puzzle

Earliest known printing: *Life International*, 17 December 1962, with the solution in the 25 March 1963 issue **[unchecked: lead from Wikipedia and puzzle sites; no scan of the issue was reached]**. Treated here as the canonical instance of a 5x5 grid with relational clues ("next to", "immediately right of"), solved by method 1 plus method 17. Games Magazine's own method text was **not found** online; its puzzles use the same crosshatch chart.

### Mensa books (Carter and Russell)

The Mensa titles by Philip Carter and Ken Russell are genre collections, not a method. Checked ISBNs: *The Mensa Puzzle Book* (Sphere 1988, 978-0747401186; Time Warner 1990, 978-0747406006); *A First Mensa Puzzle Book* (Cassell 1991, 978-0706370102), described by the seller as "linguistic, mathematical, and logical ... graded"; *Mensa Logic Puzzles* (Welbeck 2010, 978-1847324351, "over 150 logic problems ... in no particular order"). Content types seen in listings: number sequences, magic squares, anagrams, crosswords, logic problems. The methods those puzzles draw on are 1, 11, 13 and 17 of this document; no Mensa-specific formalism was found.

---

## Part B. LSAT, GMAT, GRE

**Status note.** LSAC removed Analytical Reasoning. Its 18 October 2023 post says the logic games "will be sunsetting after the June 2024 test"; from August 2024 "the LSAT will consist of two scored Logical Reasoning (LR) sections, one scored Reading Comprehension (RC) section" plus one unscored section, with the second LR section added "to replace the existing logic games section", following a 2019 settlement over diagramming and blind test takers (lsac.org/blog/what-to-expect-starting-with-august-2024-lsat). The AR methods remain the best-documented informal treatment of CSP diagramming and are kept here.

### 5-7. Analytical Reasoning game types and setups

Manhattan LSAT *Logic Games* (2nd ed., 2011; sample chapters read): "Every logic game is comprised of three parts": the scenario, the constraints, the questions. Three organizational schemes: **Ordering** ("order a set of individual elements"), **Binary Grouping** ("put elements into one of two distinct groups"), **Assignment** ("assign elements to three or more categories"). Game-type table with method: Relative ordering -> Tree; Numbered -> Number Line; 3D Numbered -> 3D Number Line; Open/Closed binary grouping -> Logic Chain; Open/Closed assignment -> Open/Closed Board.

**Relative ordering: the Tree** (Manhattan, pp. 19-20, verbatim steps):
- "STEP 1: Start with the first constraint, drawing a line between any two letters for which the relative positioning is known."
- "STEP 2: Then find the next constraint that can be connected to any part of the existing diagram."
- "STEP 3: Repeat until all constraints have been used. Remember to draw lines only between those letters for which the relative position is known."
Convention: "earlier elements will be placed to the LEFT of later elements"; cross off constraints as used.

```
   T \          N
      O -- M -- V
   P /        S/ \ R
```
(S sits left of both V and R; the book draws S below the O-M-V line with lines to V and to R.)
Test: who can be first = any letter with nothing to its left (T, P, S); who can be last = any letter with nothing to its right (N, V, R).

**Numbered ordering: the Number Line.** Slots `_ _ _ _ _ _ _` numbered 1..n; blocks `[HM]` for adjacency, `H _ _ M` for a fixed number of empty slots between two letters; **Not Laws** (PowerScore's term) written under a slot as the letters that cannot occupy it. PowerScore forum staff (checked snippets): the ">" arrow "just indicates that A is to the left of B, no more and no less"; a rectangle block is used only when two variables "must always be in the same place"; the "double not-arrow" is for conditional exclusions, the "not-block" for multistack slots.

**Binary grouping: the Logic Chain** (Manhattan ch. 6) and **7Sage in/out**: elements listed in an IN column and an OUT column; each conditional rule and its contrapositive drawn as arrows between columns. 7Sage "lawgic" notation (forum lesson notes, checked): "/ = not"; "-> = arrow, implies"; "<-> = biconditional"; "(Either) or, but not both" written as `/A <-> C`; "not both" as `A -> /C` with contrapositive `C -> /A`; contrapositive rule: "1. and becomes or, vice versa 2. negate both elements".

**Assignment: Open / Closed Board.** Columns per category, rows per slot; closed when slot counts are fixed.

**Question tasks.** Stems in the Manhattan sample: "which one of the following must be true?", "could be true EXCEPT", "must be false", rule-substitution. The test for each is read off the diagram: must-be-true = true in every completion; could-be-true = true in at least one completion; cannot-be-true = true in none.

### 8. Conditional diagramming

**Procedure.** (1) Find the indicator word. (2) Write `S -> N`. (3) Write the contrapositive `/N -> /S`. (4) Chain arrows whose necessary condition is another's sufficient. (5) Never read an arrow backward (mistaken reversal) or negate both sides without flipping (mistaken negation).

**Indicator lists** (PowerScore pages now hosted at barbri.com, checked): necessary-condition indicators include "not until", "not unless", "only when", "none but", "none except", "no ... except", "only"; "the only" is a **sufficient** indicator; "all except" / "all but" are exceptive. The page states it is "not an exhaustive list". PowerScore's **Unless Equation**, from its handout (checked by search snippet, PDF itself returned 403): the term modified by unless/except/until/without becomes the necessary condition, and the other term is negated to become the sufficient condition; example "Unless you try, you won't succeed" -> "trying becomes the necessary condition": `Succeed -> Try`. A 7Sage thread notes that LSATMax instead makes the pre-"unless" clause the negated sufficient condition; both yield equivalent contrapositives.

**Micro-example.** "No cars except SUVs can safely travel this road" -> `Safely travel -> SUV` (Barbri/PowerScore example). Contrapositive: `/SUV -> /Safely travel`.

### 9. Logical Reasoning taxonomy

LSAC's own list of LR skills (lsac.org/lsat/taking-lsat/test-format/logical-reasoning, checked): "Recognizing the parts of an argument and their relationships"; "Recognizing similarities and differences between patterns of reasoning"; "Drawing well-supported conclusions"; "Reasoning by analogy"; "Recognizing misunderstandings or points of disagreement"; "Determining how additional evidence affects an argument"; "Detecting assumptions made by particular arguments"; "Identifying and applying principles or rules"; "Identifying flaws in arguments"; "Identifying explanations".

7Sage's 22 question types with official-style stems (7sage.com/lsat-resources/lr-question-types, checked) include: Must be true ("If all of the statements above are true, which of the following must also be true?"); Most strongly supported; Must be false ("CANNOT be true"); Necessary assumption ("an assumption that the argument above requires"); Sufficient assumption ("follows logically if which one of the following is assumed"); Strengthen; Weaken; Flaw ("most vulnerable to criticism on the grounds that it"); Method of reasoning; Parallel / parallel flawed; Principle; Resolve/reconcile/explain; Evaluate; Point at issue; Main conclusion; Argument part. PowerScore groups its thirteen types into four families (Prove / Help / Hurt / Disprove); only Family #1 ("Must Be True/Most Strongly Supported" and "Main Point") was confirmed from its appendix snippet **[rest of the 13-type list unchecked against PowerScore text]**.

**Flaw families** (standard across 7Sage/PowerScore material; the labels are prep-industry, not LSAC): mistaken reversal / negation of a conditional; correlation to causation; unrepresentative sample; equivocation; part-to-whole / whole-to-part; ad hominem; appeal to inappropriate authority; false dilemma; circular reasoning; straw man; percentage vs number confusion. **[unchecked as a fixed list]**

**Test supported.** Each stem names its own test: must-be-true = entailed by the stimulus; necessary assumption = negation destroys the argument (see 10); sufficient assumption = premises + answer entail the conclusion; weaken/strengthen = lowers/raises the probability of the conclusion given the premises.

### 10. GMAT Critical Reasoning and the Assumption Negation Technique

GMAC's content statement, as quoted by third parties: Critical Reasoning measures the ability "to make arguments, evaluate arguments, and formulate or evaluate a plan of action" **[unchecked direct: mba.com pages returned empty to the fetcher]**. Prep-industry question types: assumption, strengthen, weaken, evaluate, flaw, inference, boldface (identify the role of the bolded parts), paradox.

**Assumption Negation Technique** (PowerScore trademark; Barbri page: "We cover this topic in the Logical Reasoning Bible, Chapter 11"). Procedure: (1) take a candidate necessary assumption; (2) form its *logical* negation, not its polar opposite ("the logical negation of 'sweet' is 'not sweet' rather than 'bitter'"); (3) insert the negation into the argument; (4) if the argument collapses, the candidate was necessary; if the argument survives, it was not. Formal basis: if A is necessary for the inference P therefore C, then not-A together with P must fail to support C.

**GRE.** The GRE General Test has had no analytical-reasoning multiple-choice section since the Analytical Ability section was replaced by Analytical Writing in October 2002 (Cornell Daily Sun, 5 April 2002; Manhattan Review history page) **[ETS primary statement not fetched]**. Current GRE Verbal "argument" items are reading-comprehension questions that use the same tests as 9 and 10. The "Analyze an Argument" essay was removed in 2023 (secondary). No GRE-specific method exists to add.

---

## Part C. Classical tools

### 11. Truth tables (full and indirect)

**Problem.** Validity of a propositional argument; consistency of a statement set; equivalence.

**Full table procedure.** (1) List atomic letters; 2^n rows. (2) Compute each compound's column under its main operator. (3) Validity: valid iff no row has every premise T and the conclusion F. Consistency: consistent iff at least one row has every statement T (Hurley's criterion as summarised in course slides: "Consistent statements have at least one line on which all truth values are true. Inconsistent statements have no line on which all are true." **[Hurley's exact wording and section number unchecked]**).

**Indirect (short) table procedure** (TAMU lecture notes Sec. 2.4, checked): "Put T under the main connective of each premise and F under the conclusion"; "Work out what each sentence letter must be"; "If a wff can be made to have its required value in more than one way, pick one option and follow it. If it leads nowhere, try the others." Decision: a completed assignment with premises T and conclusion F is an invalidating assignment; "If every option leads to a contradiction ... the sequent is valid." For consistency, set every statement T and look for a contradiction; a completed assignment is a model.

```
 p  q | p->q | p | q      rows where p->q=T and p=T: only row 1, q=T  => MP valid
 T  T |  T   | T | T
 T  F |  F   | T | F
 F  T |  T   | F | T
 F  F |  T   | F | F
```

**Source.** Hurley, *A Concise Introduction to Logic*, 13th ed. (Cengage 2017, ISBN 978-1-305-95809-8; 14th ed. ISBN 978-0-357-79868-3, dated March 2023 by one bookseller and 2024 by another), ch. 6 "Propositional Logic", sections on truth tables, indirect truth tables, and "Testing Statements for Consistency" (section titles confirmed from the 9th-edition table of contents). Copi, Cohen & Rodych, *Introduction to Logic*, 15th ed. (Routledge 2019, ISBN 978-1-138-50086-0), ch. 8 Symbolic Logic.

### 12. Venn diagram test

**Procedure** (standard, as in Hurley ch. 5; FSU/CSUS course notes seen as search snippets only): three overlapping circles S, P, M. (1) Diagram universal premises first by shading empty regions. (2) Diagram particular premises with an X; if one candidate region is shaded, X goes in the other; if neither, X goes on the line. (3) Valid iff the conclusion is already depicted. Aristotelian variant: if a circle is empty but for one region, a circled X may be placed and the form retested (existential import).

```
   All M are P:  shade M outside P      Some S are M: X in S∩M not shaded
   Conclusion "Some S are P" is drawn iff the X sits inside P.
```

**Source.** Hurley ch. 5; Copi & Cohen; Kemerling, *Philosophy Pages*, "Establishing Validity" (philosophypages.com/lg/e08b.htm). Euler diagrams: Copi & Cohen treat them as the older, less exact alternative **[chapter location unchecked]**.

### 13. Syllogism rules and the valid forms

Six rules (Copi & Cohen, as presented by Kemerling; checked): exactly three terms; "the middle term must be distributed in at least one premise"; "any term distributed in the conclusion must also be distributed in its premise"; "at least one premise must be affirmative"; "if either premise is negative, the conclusion must also be negative"; "if both premises are universal, then the conclusion must also be universal" (violation = existential fallacy).

Counts: applying the rules "assuming the denial of existential import" leaves **15** valid forms (Kemerling, Boolean standpoint). The traditional count is **24**: the 15 plus 9 that are valid only with existential import, "precisely those with premisses which are both universal and conclusion which is particular" (arXiv 1701.05408, **[search snippet only]**). Hurley gives both standpoints **[Hurley's exact wording unchecked]**.

The 15 unconditionally valid forms (Kemerling): Barbara AAA-1, Celarent EAE-1, Darii AII-1, Ferio EIO-1, Cesare EAE-2, Camestres AEE-2, Festino EIO-2, Baroco AOO-2, Disamis IAI-3, Datisi AII-3, Bocardo OAO-3, Ferison EIO-3, Camenes AEE-4, Dimaris IAI-4, Fresison EIO-4. The nine conditional forms (Barbari, Celaront, Cesaro, Camestros, Darapti, Felapton, Bamalip, Fesapo, Camenop) are the traditional names **[list of the nine from secondary sources]**.

**Micro-example.** Barbara: All M are P; All S are M; so All S are P. Middle term M distributed in premise 1; S distributed in conclusion and in premise 2; no negatives; passes all six rules.

### 14. Converse, inverse, contrapositive

For `p -> q`: converse `q -> p` (not equivalent); inverse `/p -> /q` (not equivalent); contrapositive `/q -> /p` (equivalent). Proof: the truth table of `p -> q` and `/q -> /p` agree on all four rows; `q -> p` differs on row (p=F,q=T). The LSAT names the two errors mistaken reversal and mistaken negation; Copi & Cohen name them the fallacies of affirming the consequent and denying the antecedent (ch. 8) **[chapter number by edition unchecked]**. For categorical propositions the immediate inferences are conversion, obversion and contraposition (Copi & Cohen 5.5 per a DePaul course page; Hurley 4.4 **[section numbers unchecked]**).

### 15. Consistency of a premise set

**Definition** (Hurley criterion, above): a set is consistent iff there is at least one row (model) on which all its members are true. **Pairwise consistency does not imply joint consistency.** Counterexample: {P, Q, /(P ^ Q)} - each pair is satisfiable, the triple is not. **Procedure.** (1) Translate each premise to a formula. (2) Set all T in an indirect table. (3) Propagate forced values. (4) A contradiction on every branch = inconsistent; a completed assignment = a model, so consistent. Equivalent CSP formulation: each atomic proposition is a variable with domain {T,F}, each premise a constraint; AC-3 propagation then backtracking search (method 17). The artefact in Part E is built on this.

### 16. Indirect proof

**Procedure** (Hurley ch. 7 "Indirect Proof"; description from course summaries, checked): (1) to prove p, assume /p as an indented sub-proof; (2) derive a line of the form q and a line /q (or q ^ /q); (3) discharge the assumption and write p. Conditional proof is the sibling: assume the antecedent, derive the consequent, discharge to `antecedent -> consequent`. Puzzle use: method 1 step 7 ("make a logical guess ... look for clues or other facts that disprove it").

```
 1. (A -> B)            prem
 2. (A -> /B)           prem
 |3. A                  assume (IP)
 |4. B                  1,3 MP
 |5. /B                 2,3 MP
 |6. B ^ /B             4,5 Conj
 7. /A                  3-6 IP
```

### 17. Constraint propagation and arc consistency

**Definitions** (Mackworth 1977, p. 103, verbatim): "Node i is node consistent iff for any value x in D_i, P_i(x) holds." "Arc (i,j) is arc consistent iff for any value x in D_i such that P_i(x), there is a value y in D_j such that P_j(y) and P_ij(x,y)." Path consistency extends this to length-m paths. "A network is said to be node, arc or path consistent iff every node, arc or path of its graph is consistent." The abstract: these algorithms "eliminate local (node, arc and path) inconsistencies before any attempt is made to construct a complete solution."

**REVISE((i,j))** (p. 104): for each x in D_i, if there is no y in D_j with P_ij(x,y), delete x from D_i and set DELETE true; return DELETE.

**AC-3** (p. 106, verbatim structure):
```
 for i <- 1 until n do NC(i);
 Q <- {(i,j) | (i,j) in arcs(G), i != j}
 while Q not empty do
   select and delete any arc (k,m) from Q;
   if REVISE((k,m)) then Q <- Q u {(i,k) | (i,k) in arcs(G), i != k, i != m}
```
**Test.** A domain emptied by propagation proves inconsistency; a network in which every domain is a singleton after propagation is solved; otherwise search (backtracking) is needed. Sudoku: 81 variables, domains 1-9, all-different on rows, columns, boxes; "naked single" = node/arc propagation. KenKen adds cage arithmetic constraints. The logic grid's X is a domain deletion; the dot is a singleton domain.

**Sources.** A. K. Mackworth, "Consistency in Networks of Relations", *Artificial Intelligence* 8(1):99-118, 1977, doi:10.1016/0004-3702(77)90007-8 (PDF read, pp. 99-106). S. Russell & P. Norvig, *Artificial Intelligence: A Modern Approach*, 4th ed., Pearson 2020, ISBN 978-0-13-461099-3, ch. 6 "Constraint Satisfaction Problems" **[4e page numbers unchecked]**. R. Dechter, *Constraint Processing*, Morgan Kaufmann 2003, ISBN 1-55860-890-7, ch. 3 "Consistency-Enforcing Algorithms" (publisher's table of contents checked).

---

## Part D. Argument and evidence structure

### 18. Toulmin layout

Elements (Verheij 2005 summarising Toulmin 1958 pp. 97-105; checked): "The Data consist of certain facts that support the Claim. The Warrant is an inference license according to which the Data support the Claim, while the Backing provides in turn support for the Warrant. A Rebuttal provides conditions of exception for the argument, and the Qualifier can express a degree of force that the Data give to the Claim by the Warrant." Toulmin's own words: "between the claim or conclusion whose merits we are seeking to establish (C) and the facts we appeal to as a foundation for the claim what I shall refer to as our data (D)" (p. 97).

```
 D: Harry was born in Bermuda ----------> So, Q: presumably, C: Harry is a British subject
                        |                                 |
                   Since W: a man born in Bermuda      Unless R: both parents aliens /
                   will generally be a British subject  he has become a naturalized American
                        |
                   On account of B: the following statutes and legal provisions
```
**Test.** A field-complete argument names W and B; Q is no stronger than the unaddressed rebuttals allow. **Source.** S. E. Toulmin, *The Uses of Argument*, updated ed., Cambridge UP 2003, ISBN 978-0-521-82748-5 (hb), 978-0-521-53483-3 (pb); B. Verheij, "Evaluating Arguments Based on Toulmin's Scheme", *Argumentation* 19:347-371 (2005).

### 19. Argument schemes and critical questions

Walton, Reed & Macagno define schemes as "forms of argument (structures of inference) that represent structures of common types of arguments" (p. 1, via Groarke's NDPR review; Cambridge chapter summary agrees). Each scheme carries a set of critical questions; assessing an instance means posing them. Example (review): two-person practical reasoning, CQ1 "Does X have other goals (of higher priority) that might conflict with the goal of realizing B?" Expert-opinion scheme: six CQs, of which the snippet seen names the expertise question ("How credible is E as an expert source?") and the field question ("Is E an expert in the field that A is in?") (Walton & Macagno 2009, secondary; the other four names **[unchecked]**). Count of schemes: the NDPR review says "sixty-five"; another source says 96 **[discrepancy unresolved]**. **Source.** Walton, Reed & Macagno, *Argumentation Schemes*, Cambridge UP 2008, ISBN 978-0-521-72374-9, doi:10.1017/CBO9780511802034.

### 20. Argument maps

**Rationale** (Austhink; van Gelder): "a graphical format or 'syntax' for the articulation of reasoning, with a limited set of 'primitives' (claims, reasons, objections etc.) and strict rules about how those primitives can be combined" (van Gelder, "The rationale for Rationale", *Law, Probability and Risk* 6(1-4):23-42, 2007, abstract/blog outline checked). Layout: contention at top; reasons and objections as boxes beneath; co-premises grouped in one box; green for support and red for objection **[colour convention unchecked against Rationale documentation]**.

**Argunet -> Argdown.** Argunet (Betz and colleagues; Berlin, later KIT DebateLab) represented statements as boxes with Supports and Attacks relations and allowed reconstruction of each argument "as a logically valid premise-conclusion structure"; development stopped (AlternativeTo: no new versions planned) and Argdown is its successor (argdown.org, funded by DebateLab at KIT; MIT licence). Argdown syntax (argdown.org/syntax, checked): statement `[Title]: text`; argument `<Title>: text`; relations on indented lines: `+` support, `-` attack, `_` undercut, `><` contradiction, with optional direction `<`/`>`; premise-conclusion structure as `(1) ... (2) ... ---- (3) ...` where "an inference is separating a conclusion from preceding pcs-statements by a series of hyphens".

```
 [Claim]: Harry is a British subject.
   + <Birth>: Harry was born in Bermuda, and Bermuda-born men are British subjects.
     (1) Harry was born in Bermuda.
     (2) A man born in Bermuda is generally a British subject.
     ----
     (3) Harry is a British subject.
   - [Alien parents]: Both of Harry's parents were aliens.
```
**Test.** Every statement is reached by a support or attack path; every reconstructed argument is valid; every rebuttal is drawn as an attack.

### 21. Wigmore chart

Twining's seven-step summary (as reproduced in Montgomery 2010, pp. 15-17, checked): 1 clarification of standpoint, purpose and role; 2 formulation of potential ultimate probandum or probanda; 3 formulation of potential penultimate probanda; 4 formulation of theory and themes of the case: choice of strategic ultimate, penultimate, and intermediate probanda; 5 compilation of a key-list; 6 preparation of the chart(s); 7 completion of the analysis.

Symbols (Montgomery summarising Twining's teaching materials): "a circle represents evidence"; a filled-in circle "factual, empirical data"; unfilled circles "circumstantial evidence or mere inferences"; "a square depicts testimonial assertions"; "a triangle identifies an argument that corroborates"; "an open angle represents an alternative explanation for an argument given by the other side"; "arrows show the direction of an inferential relationship"; "G is used for generalisations". The symbols "vary somewhat from one Wigmorean analysis to another." The key-list is a numbered list of every proposition, from the ultimate probandum ("X murdered Y") down to each testimonial assertion ("W1: I saw X enter Y's house at 4:30 p.m."), with the chart referring only to numbers.

```
            (UP) X murdered Y
               ^
            (PP-C) It was X who committed the act
             ^           ^
       [2] X entered   [5] X left Y's house 5:00
         ^   ^              ^
   [3] W1 saw X   [4] W1: "I saw X ..."  (square = testimony)
```
**Test.** Every charted node has a key-list entry; every arrow is an inference the analyst can state; the con-side (infirmative) lines are charted alongside the pro-side. **Source.** T. Anderson, D. Schum & W. Twining, *Analysis of Evidence*, 2nd ed., Cambridge UP 2005, ISBN 978-0-521-67316-7, ch. 5 "The chart method" and the glossary of symbols; J. W. Montgomery, *J. Int. Soc. Christian Apologetics* 3(1):13-27 (2010) for the reproduced steps and symbol list. Wigmore, *The Principles of Judicial Proof* (1913; 3rd ed. retitled *The Science of Judicial Proof*, 1937).

---

## Part E. Designed artefact: the incompatibility matrix of held premises

**Purpose.** Given a set H = {h1 ... hn} of premises that an author or text holds (output of the `logic-decomposer`), show which pairs cannot both be true, which pairs cannot both be true given a further assumption X, and whether the whole set has a model.

**Formal basis.** Propositional consistency (method 15): a set is satisfiable iff it has a model. Pairwise cells are 2-element satisfiability checks; the joint check is satisfiability of H as a whole, decided by indirect truth table or by CSP propagation plus search (method 17). The "incompatible-under-X" cell is conditional inconsistency: {hi, hj} satisfiable, {hi, hj, X} not.

**Test-prep analogues.** The logic-grid X and PowerScore "Not Laws" are pairwise exclusions; LSAT "could be true" questions are model-finding; LR "resolve the paradox" questions are the repair of an inconsistency by adding a premise; the Assumption Negation Technique is the X-under-assumption cell with X = the negated assumption.

**Notation.** Cell values: `=` identical or entailed; `o` compatible (a model with both true exists); `X` incompatible (no model); `X|A` incompatible under assumption A (A named in a key); `?` undecided (translation ambiguous; see decomposer checks). The matrix is symmetric; the diagonal is `=`.

```
 Held premises (key; each with its quote span in the decomposer output):
  h1  All members vote.                         forall x (M(x) -> V(x))
  h2  Some members abstain.                     exists x (M(x) & A(x))
  h3  Abstaining is not voting.                 forall x (A(x) -> /V(x))   [translation under A1; without A1
                                                                            "abstain" may be a cast ballot]
  h5  The chair never votes.                    /V(c)
 Assumptions (translation licences and unstated suppositions, declared separately):
  A1  "vote" means cast a ballot, so an abstention is not a vote
  A2  The chair is a member.                    M(c)        [unstated; needed for the author's inference]

        h1    h2    h3    h5
  h1    =     o     o    X|A2      ({h1,h5} has a model with a non-member chair; adding M(c) kills it)
  h2    o     =     o     o        ({h2,h3} is fine: a member abstains and does not vote)
  h3    o     o     =     o
  h5   X|A2   o     o     =
 Joint: H = {h1,h2,h3,h5} as stated:   satisfiable (model: chair not a member; h3 read without A1)
        {h1,h2,h3} under A1:            X   (h1,h3 |- forall x (M(x) -> /A(x)), contradicting h2)
        {h1,h5} under A2:               X   (already shown pairwise)
 Verdict: H is consistent as worded; it becomes inconsistent under A1 (minimal subset {h1,h2,h3}) and
          under A2 (minimal subset {h1,h5}). Both assumptions change satisfiability, so the verdict depends on both and both must be reported.
```
Pairwise cells never cite a held premise: a conflict that needs three held premises is a property of the triad and appears only in the joint section (step 4). `X|A` cites only a declared assumption.

**Procedure.**
1. Translate each held premise into a formula (decomposer output), keeping the quote reference.
2. For each pair (i,j): test {hi, hj} by indirect table / propagation. Record `o`, `X` or `=`.
3. For each `o` pair, re-test with each declared assumption A in turn; record `X|A` where it fails.
4. Joint check: run the indirect table / CSP search on all of H. If a model exists, record it (the witness assignment). If not, extract minimal inconsistent subsets by deleting one premise at a time and re-testing.
5. Report: matrix, key, witness model or minimal inconsistent subsets, and every assumption the verdict depends on (one whose addition changes satisfiability).

**Why the joint step is mandatory.** {P, Q, /(P^Q)} has every pair `o` and the triple `X`; an all-`o` matrix does not prove consistency. The matrix shows *where* conflicts localise; the joint check decides *whether* the set is consistent.

---

## Part F. Decomposing text into logical objects (`logic-decomposer`)

### F1. Ordinary language to standard categorical form

Hurley 4.7 "Translating Ordinary Language Statements into Categorical Form" (12e slides checked; 14e places it at p. 223): terms without nouns get nouns; **singular** statements take a parameter ("George went home" -> "All people identical to George are people who went home"); **adverbs/pronouns** become times/places ("He is always clean shaven" -> "All times are times he is clean shaven"); **conditionals** become A or E ("If it is a mouse then it is a mammal" -> "All mice are mammals"); **exclusive** propositions with "Only", "None but", "None except" reverse subject and predicate ("None but the brave deserve the fair" -> "All people who deserve the fair are brave people"); **"the only"** does not reverse ("The only animals that live in this canyon are skunks" -> "All animals that live in this canyon are skunks"); **exceptive** "All except S are P" / "All but S are P" become two propositions ("No students are invited people and all non-students are invited people"). "Unless": Hurley's rule not retrieved **[unchecked]**; the propositional rendering is `/N -> S`, i.e. "S unless N" = "if not N then S" (equivalently `/S -> N`), which is the PowerScore Unless Equation of method 8. Lander University's course page gives the same exclusive/exceptive rules with the example "None but red trucks are fire engines" -> "All fire engines are red things".

### F2. Conditional indicators (LSAT method 8 applied to text)

Sufficient indicators: if, when, whenever, all, any, every, each, people who, in order to; also "the only". Necessary indicators: then, only, only if, only when, must, requires, depends on, unless, except, until, without, none but, none except, no ... except. Biconditional: "if and only if", "if but only if" (`A <-> C`). "Either/or" = inclusive `/A -> B`; "or, but not both" = `/A <-> B` (7Sage). Quantifier words: "all/every/no" give conditionals; "some" gives an existential and chains only with "all" ("some A are B; all B are C" licenses "some A are C"; "some A are B; some B are C" licenses nothing); "most" gives more-than-half and chains with "all" but not with "most" **[7Sage/PowerScore quantifier rules from memory; unchecked]**. Procedure per sentence: mark indicator, write `S -> N`, write contrapositive, note the quote.

### F3. Argument standardisation and reconstruction

**Fisher** (*The Logic of Real Arguments*, 2nd ed., Cambridge 2004, ISBN 978-0-521-65481-4 pb, 978-0-521-65241-4 hb; ch. 2 summary checked): the general method has three parts: "Recognising contexts where reasoning occurs, using linguistic clues"; "uncovering and displaying the structure of the reasoning"; "deciding whether the reasoning is correct or incorrect". The Assertibility Question, Fisher's test for acceptability of a premise or inference, is "What argument or evidence would justify me in asserting the conclusion C?" **[exact wording from memory; the Cambridge page confirms only that ch. 11 names "the Assertibility Question"]**.

**Scriven** (*Reasoning*, McGraw-Hill 1976): Des Gasper, "Analysing Policy Arguments", *European Journal of Development Research*, June 1996, pp. 36-62 (also a chapter in Apthorpe & Gasper, eds., *Arguing Development Policy*, Frank Cass 1996), preprint dated December 1995 at repub.eur.nl/pub/50695 (read), reproduces Scriven's schema as eight steps: 1 clarify meaning of components; 2 identify conclusions, stated and unstated; 3 clarify meaning of overall argument; 4 portray structure; 5 extract unstated assumptions; 6 evaluate premises and inferences; 7 consider other relevant arguments; 8 overall evaluation of the argument. Gasper also lists Scriven's four *specification* steps: "Clarification of meanings", "Identification of conclusions (including unstated implications)", "Portrayal of structure (the precise connection of premises, inferences and conclusions)", "Identification of unstated assumptions (the most defensible premises needed to make the argument complete and consistent)". A contemporary review says "seven procedural steps"; a later teaching supplement says five. **[Step count differs by source; Scriven's own numbering not checked]**.

**Govier** (*A Practical Study of Argument*, 7th ed., Wadsworth 2009, ISBN 978-0-495-60340-5): standardisation = rewriting the argument as numbered premises and conclusion, with indicator words removed, sub-conclusions marked, and a tree diagram for longer arguments (Govier's own letter to *Informal Logic* says tree-diagramming is "easier and more perspicuous for longer and more complicated arguments" **[letter checked only as snippet]**).

**Principle of charity and its limits.** Scriven's strong version requires interpreting an argument to be as strong as possible; Govier's "moderate" version (1987, *Problems in Argument Analysis and Evaluation*, ch. "A New Approach to Charity") asks only that we presume the arguer is "trying to give good reasons for claims they actually hold"; Govier (1981, "Uncharitable Thoughts About Charity", *Informal Logic*) argues the strong version "leads to whitewashing of poor arguments, and licenses too much reading into others' material" (both via Stevens 2021 summary, **[secondary]**). The decomposer's rule follows the moderate version: supply a missing premise only when the text's own words require it to connect, choose the weakest sufficient filler, and mark it `[unstated]`.

### F4. Objects to extract

Per text: **Entities** (named, with one canonical label each); **Relations/predicates**; **Propositions** (each with a quote span); **Premises** (stated), **Sub-conclusions**, **Main conclusion**; **Assumptions** (unstated, minimal, marked); **Definitions** (stipulated meanings of terms); **Conditionals** (S -> N with contrapositive); **Quantified claims** (all/some/most/no with scope); **Toulmin fields** per argument: Claim, Data, Warrant, Backing, Qualifier, Rebuttal (method 18); **Rhetorical sentences** (no propositional content: questions, exhortations, framing) marked `R`.

```
 ID   Type      Quote (span)                               Formal
 P1   premise   "No cars except SUVs can safely travel"    Safe(x) -> SUV(x)
 P2   premise   "Our van is not an SUV"                    /SUV(van)
 C1   concl.    "so we take the long road"                 /Safe(van)   [from P1,P2 by contrapositive]
 A1   unstated  -                                          taking the long road is the only alternative to safe travel
 R1   rhetoric  "Who would risk it?"                       -
```

### F5. Internal validity checks on the decomposition

1. **Traceability:** every proposition carries a quote span; no object without one except those marked `[unstated]`.
2. **Coverage:** every sentence of the text is mapped to an object or marked `R`.
3. **No addition:** nothing in the formal column that the quoted span, read with the stated definitions, does not say; unstated items are minimal and listed separately.
4. **Conditional direction:** for each arrow, the indicator word is named and the direction re-derived from it (F2); "the only"/"only" and "unless" checked individually.
5. **Quantifier scope:** all/some/most/no recorded; negation placement checked ("not all" vs "all not"); existential import flagged where a universal is read as implying instances.
6. **Entity consistency:** one canonical name per entity; pronouns and descriptions resolved and listed.
7. **Round trip:** the decomposition is read back as prose and compared with the text; any divergence in meaning is a defect in the decomposition, not in the text.
8. **Pairwise and joint consistency** (Part E) are run only after checks 1-7 pass, so that an `X` is a property of the text, not of the translation.

---

## Part G. Certainty and uncertainty metrics for propositions and findings

### G1. Kent, "Words of Estimative Probability" (CIA, *Studies in Intelligence* 8(4), Fall 1964; PDF read)

Kent separates three kinds of statement: fact ("knowable and known with a high degree of certainty"), estimate with evidence ("knowable ... but not precisely known"), and estimate "made almost without any evidence". His chart, "in its classical simplicity":

```
 100%  Certainty
  93%  give or take almost 6%  Almost certain
  75%  give or take about 12%  Probable
  50%  give or take about 10%  Chances about even
  30%  give or take about 10%  Probably not
   7%  give or take about 5%   Almost certainly not
   0%  Impossibility
```
Synonyms he admits: almost certain = virtually certain, all but certain, highly probable, highly likely, odds overwhelming; probable = likely, we believe, we estimate; possible = conceivable, could, may, might, perhaps. Cardinal rule: "The word 'possible' (and its cognates) must not be modified" - "possible" is reserved for things "neither certain to happen nor ... an impossibility" where no odds can be given. His consumer note: "unlikely" means "the chances of its NOT happening are in our judgment about three to one."

### G2. ICD 203, *Analytic Standards* (ODNI, signed 2 January 2015; technical amendments 21 January 2022 and 12 June 2023; PDF read)

Tradecraft standard D.6.e(2): products should "indicate and explain the basis for the uncertainties associated with major analytic judgments, specifically the likelihood of occurrence of an event or development, and the analyst's confidence in the basis for this judgment." Confidence "may be based on the logic and evidentiary base that underpin it, including the quantity and quality of source material."

(a) Likelihood terms, one row to be used consistently:
```
 almost no chance | very unlikely     | unlikely                | roughly even chance | likely               | very likely     | almost certain(ly)
 remote           | highly improbable | improbable (improbably) | roughly even odds   | probable (probably)  | highly probable | nearly certain
 01-05%           | 05-20%            | 20-45%                  | 45-55%              | 55-80%               | 80-95%          | 95-99%
```
"Analysts are strongly encouraged not to mix terms from different rows."

(b) The separation rule, verbatim: "products that express an analyst's confidence in an assessment or judgment using a 'confidence level' (e.g., 'high confidence') must not combine a confidence level and a degree of likelihood, which refers to an event or development, in the same sentence." Why kept apart: likelihood is a property of the world (will the event occur); confidence is a property of the evidence and reasoning (how good is the basis). D.6.e(3) adds the third distinction the grading artefact relies on: products should "clearly distinguish statements that convey underlying intelligence information ... from statements that convey assumptions or judgments", and "Products should state assumptions explicitly when they serve as the linchpin of an argument or when they bridge key information gaps." The high/moderate/low confidence definitions are not in ICD 203 itself **[the definitions live in agency style guides; not checked]**.

### G3. IPCC AR5 Guidance Note (Mastrandrea et al., November 2010; PDF read)

Two metrics: "Confidence in the validity of a finding, based on the type, amount, quality, and consistency of evidence ... and the degree of agreement. Confidence is expressed qualitatively." and "Quantified measures of uncertainty in a finding expressed probabilistically." Paragraph 8: evaluate evidence with summary terms "limited," "medium," or "robust" and agreement "low," "medium," or "high"; "Generally, evidence is most robust when there are multiple, consistent independent lines of high-quality evidence." Paragraph 9: confidence "is expressed using five qualifiers: 'very low,' 'low,' 'medium,' 'high,' and 'very high'"; "Confidence should not be interpreted probabilistically, and it is distinct from 'statistical confidence.'" Every finding requires a "traceable account" of the evaluation in the chapter text.

```
 Figure 1 (evidence x agreement -> confidence; shading increases toward top right)
                 limited        medium         robust
 high agreement  H/L            H/M            H/R      <- highest confidence
 medium agr.     M/L            M/M            M/R
 low agreement   L/L            L/M            L/R      <- lowest confidence

 Table 1 Likelihood: virtually certain 99-100%; very likely 90-100%; likely 66-100%;
 about as likely as not 33-66%; unlikely 0-33%; very unlikely 0-10%; exceptionally unlikely 0-1%.
 (AR4 extras permitted: extremely likely 95-100%; more likely than not >50-100%; extremely unlikely 0-5%.)
```
Published version: Mastrandrea, Mach, Plattner et al., *Climatic Change* 108(4):675-691 (2011), doi:10.1007/s10584-011-0178-6.

### G4. GRADE (GRADE Handbook, gdt.gradepro.org, section 5; checked)

Levels (Table 5.1; quoted clauses are those confirmed from the Handbook page, the tails are paraphrase): **High** "We are very confident that the true effect lies close to that of the estimate of the effect"; **Moderate** "We are moderately confident in the effect estimate: The true effect is likely to be close to the estimate of the effect", though it could be substantially different; **Low** "Our confidence in the effect estimate is limited", the true effect may be substantially different; **Very low** "We have very little confidence in the effect estimate", the true effect is likely to be substantially different.

Starting points (5.1.1): randomized trials start high; observational studies start low. Rate down (5.2, one or two levels each): risk of bias; inconsistency; indirectness; imprecision; publication bias. Rate up (5.3): large effect ("RR >2 or <0.5 ... may increase 1 level"; "RR >5 or <0.2 ... may increase 2 levels", Table 5.9); dose-response gradient (one level); all plausible residual confounding would reduce the demonstrated effect (one level). The Handbook is being superseded by the GRADE Book (book.gradepro.org) **[not checked]**.

### G5. Hedges and boosters (Hyland)

Hyland's metadiscourse model (*Metadiscourse: Exploring Interaction in Writing*, Continuum 2005, ISBN 978-0-8264-7611-1 pb; table at p. 49 as reproduced in secondary tables, checked): **interactive** resources (transitions, frame markers, endophoric markers, evidentials, code glosses) guide the reader through the text; **interactional** resources involve the reader: **hedges** ("might; perhaps; possible; about"), **boosters** ("in fact; definitely; it is clear that"), attitude markers ("unfortunately; I agree; surprisingly"), self-mentions, engagement markers. In the secondary accounts seen, hedges "express epistemic modality and ... modify the illocutionary force" of a claim and boosters let writers "demonstrate a high level of assurance" **[Hyland's own definitions unchecked]**. Earlier taxonomy: Hyland, *Hedging in Scientific Research Articles*, John Benjamins 1998 (Pragmatics & Beyond NS 54, ISBN 978-90-272-5067-4). Detection procedure for the artefact: tag each proposition's modal verbs, epistemic adverbs/adjectives, and reporting verbs; a hedge lowers the stated-confidence grade, a booster raises it.

### G6. Calibration: Brier score and reliability diagrams

Brier (1950) defined the probability score for forecasts expressed as probabilities: *Monthly Weather Review* 78(1):1-3, doi:10.1175/1520-0493(1950)078<0001:VOFEIT>2.0.CO;2 (AMS page returned 403; title and DOI from secondary listings **[unchecked direct]**). Modern binary form: BS = (1/N) sum (f_i - o_i)^2, range 0-1 (Brier's original was over both classes, range 0-2). Decomposition into reliability, resolution and uncertainty: Murphy 1973 **[not found]**. Reliability (calibration) diagram: bin forecasts by stated probability, plot observed frequency against stated probability; perfect calibration lies on the diagonal. Murphy & Winkler, "Reliability of Subjective Probability Forecasts of Precipitation and Temperature", *Applied Statistics* 26(1):41-47 (1977), doi:10.2307/2346866 (RePEc record checked) report that forecasters "can formulate such forecasts in a reliable manner." Test: a text's confidence words are calibrated iff, over many propositions, the fraction later found true in each verbal band falls inside that band's numeric range (Kent/ICD 203/IPCC scales give the bands).

### G7. Designed artefact: two-grade certainty table

For each proposition from the decomposer, two independent grades, after ICD 203's rule that likelihood/confidence language and evidence basis are kept apart:

**(a) Evidence grade (from the record).** E1 primary data reachable (dataset, instrument, document); E2 peer-reviewed primary study; E3 peer-reviewed review or meta-analysis; E4 grey literature (report, preprint, working paper); E5 agency or interested-party self-report; E6 recall, anecdote or uncited assertion; E0 not found / no source. Modifiers from GRADE: down one for risk of bias, inconsistency, indirectness, imprecision, publication bias; up one for large effect or dose-response. GRADE and IPCC confidence are the formal basis.

**(b) Stated-confidence grade (from the text's wording).** Map the proposition's hedges and boosters onto the ICD 203 seven-point likelihood row, or onto IPCC's five confidence qualifiers when the claim is about validity rather than occurrence: S7 "certain / it is clear that / definitely" (boosters, ~95-100); S6 "very likely / highly probable"; S5 "likely / probably / we believe"; S4 "roughly even / may or may not"; S3 "unlikely / doubtful"; S2 "very unlikely"; S1 "almost no chance"; S? "possible / might / could" (Kent's no-odds "possible": record as hedged, no numeric band). A flat declarative with no hedge or booster is graded S7: it is Kent's type-one statement of fact and one of ICD 203's "statements that convey underlying intelligence information", asserted without qualification.

**(c) Grade difference.** Expected stated grade given the evidence: E1-E2 licenses up to S7; E3 up to S6; E4 up to S5; E5-E6 up to S4; E0 up to S? only. Grade difference = stated minus licensed. Positive = **overclaim**; negative = **underclaim**; zero = calibrated.

```
 ID  Proposition (quote)                       Evidence  Basis cited          Stated  Markers              Licensed  Grade difference  Verdict
 P1  "it is clear that X causes Y"             E4        preprint, n=40       S7      "it is clear that"   S5        +2                overclaim
 P2  "X may be associated with Y"              E2        RCT, CI excludes 0   S?      "may"                S7        -                 underclaim
 P3  "roughly half of respondents agreed"      E1        survey table 3       S7      none (flat report)   S7        0                 calibrated
 P4  "everyone knows that Z"                   E0        none                 S7      "everyone knows"     S?        +max              overclaim, unsourced
```
**Procedure.** 1 take the proposition list (F4); 2 locate the cited basis for each, assign E; 3 apply GRADE modifiers; 4 tag hedges/boosters (G5), assign S; 5 compute licensed S from E, and the grade difference (stated minus licensed); 6 write the two grades and the grade difference in separate columns, never merged into one word (ICD 203 D.6.e(2)(b)); 7 keep a traceable account (IPCC paragraph 2): the quote, the source located, and the modifiers applied; 8 across a document, tabulate the distribution of grade differences; a systematic positive grade difference is the document's overclaim profile, which the calibration test (G6) would score if outcomes were later known.

---

## Unchecked / not found

1. Life International 17 Dec 1962 zebra puzzle: no scan reached; Wikipedia-led only.
2. Games Magazine's own solving-method text: not found online.
3. Dell Magazines introduction: read only in the grugel.com reproduction, which carries no Dell attribution.
4. Hurley's exact wording for consistency, for the 15/24 syllogism counts, for "unless", and his section numbers: not retrieved; chapter titles confirmed from tables of contents only.
5. Copi & Cohen chapter numbers for the conditional fallacies and Euler diagrams: edition-dependent; not checked.
6. The nine existential-import syllogism names: from secondary sources.
7. PowerScore Logic Games Bible chapter/page text on Not Laws and blocks: forum and blog snippets only; the Bible itself not read. PowerScore 13 LR types: only Family #1 confirmed; appendix PDF returned 403. Unless Equation handout returned 403; text from search snippet.
8. Prep-industry flaw-family list and quantifier chaining rules ("some"/"most"): from memory, unchecked.
9. GMAC's three CR skill areas: mba.com fetched empty twice; wording via OpenExamPrep and e-GMAT.
10. ETS primary statement on the 2002 removal of the Analytical section: not fetched; Cornell Daily Sun 2002 and Manhattan Review used.
11. Russell & Norvig 4th ed. page numbers for AC-3: not checked.
12. Walton, Reed & Macagno scheme count: NDPR review says 65, another source 96.
13. Rationale green/red colour convention and box names: not checked against Austhink/Rationale documentation; van Gelder 2007 abstract only.
14. Argunet's discontinuation date (2018) and Berlin origin: AlternativeTo and a conference paper citation only; argunet.org has a certificate error.
15. Anderson, Schum & Twining's own symbol glossary: not read; symbols from Montgomery 2010 reproducing Twining's teaching materials.
16. Fisher's Assertibility Question wording: from memory; Cambridge page confirms only the name.
17. Scriven's step count (5/7/8) and his own numbering: conflicting secondary sources; the book not read.
18. Govier's 7th-edition standardisation chapter text; Stevens 2021 (principle of charity) read only as a snippet; philarchive GOVPIA returned 403.
19. ICD 203 high/moderate/low confidence definitions: not in the directive; agency style guides not checked.
20. GRADE Book (successor to the Handbook): not checked.
21. Brier 1950 title and DOI: AMS site 403; secondary listings. Murphy 1973 vector partition: not found.
22. Hyland 2005 p. 49 table: via secondary reproductions; the book not read.
23. Mensa admission-test "style" as a formal method: nothing beyond genre descriptions found.

## Second pass 2026-11-08

Every PDF transcribed from page renders was re-read against the document.

- Kent 1964: one correction. The 93% row reads "Give or take almost 6 %", not "about 6%". All other table values, synonyms and quotations match.
- ICD 203: two corrections. (a) The assumptions clause now quotes the directive's sentence as written ("Products should state assumptions explicitly when they serve as the linchpin of an argument or when they bridge key information gaps") instead of a reworded fragment inside quotation marks. (b) G7 now quotes "statements that convey underlying intelligence information" rather than a singular paraphrase. Table, percentages, (2)(a)-(b) wording and dates match.
- IPCC AR5 Guidance Note: no corrections (two metrics, paragraphs 8-9, Table 1 with footnote, Figure 1, November 2010 all match).
- Mackworth 1977: no corrections (definitions p. 103, REVISE p. 104, AC-3 p. 106, abstract wording match).
- Manhattan LSAT Logic Games sample (2011): no corrections (three parts, three schemes, Tree steps 1-3, left-placement convention, question stems, chapter numbers match).
- Penny Press 2025 "How to Solve Logic Problems": no corrections (dot/X sentence, X-placement instructions, guess rule, sample clues and solution match).
- Penny Dell 2008 "How to Solve Logic Table Puzzles": one correction. The quotation is now the full two sentences ("...easier to solve. This occurs when the conventional crosshatch grid is too big or too awkward to use, or when the puzzles can be solved more naturally with a table.") instead of a truncated fragment.
- Montgomery 2010 (Twining's steps and symbols): one correction. Steps 2-4 now carry Twining's words "potential ultimate probandum", "potential penultimate probanda" and "theory and themes of the case"; symbol quotations match.
- Gasper 1996 (Scriven's schema): one correction. The journal citation gave a volume/issue ("8(1)") that is not in the PDF; it now gives what the PDF states (EJDR, June 1996, pp. 36-62; chapter in Apthorpe & Gasper 1996; preprint December 1995). The eight-step figure and four specification steps match.
- Verheij 2005: no corrections (journal citation, the D/W/B/Q/R definition, Toulmin's p. 97 quotation, Figure 1 wording and the pp. 104-105 references match).

## Review pass 2026-11-08

Three DOIs cited in `logic-decomposer/SKILL.md` as "record checked" were not in this document. Each was resolved through doi.org and its Crossref record read on 2026-11-08:

- 10.22329/wsia.06.2018: T. Govier, *Problems in Argument Analysis and Evaluation*, Windsor Studies in Argumentation, published 2018-06-22 (landing page and Crossref agree).
- 10.1136/bmj.39489.470347.AD: G. H. Guyatt, A. D. Oxman, G. E. Vist, R. Kunz, Y. Falck-Ytter, P. Alonso-Coello, H. J. Schünemann, "GRADE: an emerging consensus on rating quality of evidence and strength of recommendations", *BMJ* 336(7650):924-926, 2008-04-24 (Crossref; the BMJ page is behind a bot check).
- 10.1016/S0378-2166(98)00009-5: K. Hyland, "Persuasion and context: The pragmatics of academic metadiscourse", *Journal of Pragmatics* 30(4):437-455, October 1998 (Crossref).

The texts of these works were not read in this pass; the records confirm that each DOI is the cited work.
