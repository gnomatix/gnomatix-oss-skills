---
name: logic-toolbox
description: Run on the output of logic-decomposer (a proposition table, conditionals, constraints), as step 3 of cui-bono, or on any argument or puzzle-shaped problem the user gives. The formal methods of logic puzzles and reasoning tests, each with its procedure, notation and the test it supports: the crosshatch logic grid and table chart with cross-elimination, conditional diagramming with contrapositives and the Unless Equation, sequencing (tree, number line) and grouping (logic chain) setups with must / could / cannot inference, constraint propagation (AC-3), syllogism rules and the valid forms, Venn tests, full and indirect truth tables, consistency of a premise set, indirect proof, the Assumption Negation Technique and the flaw families, the premise logic grid, the incompatibility matrix of held premises with a joint-satisfiability check, Toulmin layout, argument schemes with critical questions, argument maps (Argdown), and Wigmore charts. Every result names the method and shows the work.
---

# logic-toolbox

The methods below are the ones logic puzzles and the reasoning sections of admission tests have refined into procedures anyone can follow and check, together with the classical tools they rest on. They work on the discrete objects that `logic-decomposer` produces. Each method says what problem it solves, the steps, the notation, the test it supports, a micro-example and its source. A result that does not show its grid, chain or table is not a result of this skill.

Sources were checked on 2026-11-08; the full reference with quotations is `references/methods-research-2026-11-08.md` in this skill. An item marked **[unchecked]** there is marked the same here.

## Summary

| # | Method | Problem | Test it supports |
|---|---|---|---|
| 1 | Crosshatch logic grid; table chart; cross-elimination | Match n categories of k items from clues | every sub-grid ends with one dot per row and column, consistent across sub-grids |
| 2 | Conditional diagramming | If/then rules, indicators, unless | contrapositive; chain inference; no reversal, no negation |
| 3 | Sequencing setups (tree, number line) | Order elements under rules | must / could / cannot be true |
| 4 | Grouping and assignment setups (logic chain, board) | Select or partition elements | must / could / cannot be true |
| 5 | Constraint propagation (arc consistency, AC-3) | Any constraint set over finite domains | emptied domain = inconsistent; singletons = solved |
| 6 | Syllogism rules; Venn test | Two categorical premises and a conclusion | six rules; 15 forms (24 with existential import); diagram already shows the conclusion |
| 7 | Truth tables, full and indirect | Propositional validity, consistency, equivalence | no row with premises T and conclusion F; a row with all T |
| 8 | Consistency of a premise set | Can the held premises all be true? | model finding; pairwise is not joint |
| 9 | Indirect proof | A conclusion claimed to follow | assume the negation, derive a contradiction |
| 10 | Assumption Negation Technique; flaw families | The unstated bridge and the named flaw | the negation collapses the argument |
| 11 | Premise logic grid | Premises against conclusions | acceptable / relevant / sufficient per cell |
| 12 | Incompatibility matrix of held premises | Which held premises cannot be true together | pairwise cells plus a mandatory joint check |
| 13 | Toulmin layout; argument schemes | The structure of one argument | warrant and backing present; critical questions answered |
| 14 | Argument maps (Argdown) | Support and attack structure of a case | every statement reached; every reconstruction valid |
| 15 | Wigmore chart | A mass of evidence to an ultimate proposition | key-list complete; every arrow an inference the analyst can state |

## 1. Crosshatch logic grid, table chart, cross-elimination

**Problem.** Match k items in each of n categories one-to-one from clues (the Dell, Penny Press and Games Magazine logic problem; the zebra puzzle).

**Steps** (Penny Press, "How to Solve Logic Problems"). (1) Read the introduction and every clue; all the information needed is in them. (2) The chart uses a dot for yes and an X for no. (3) A positive fact is a dot; put X in the rest of that row and column within the sub-grid. (4) A negative fact is an X. (5) Whenever a relationship is established, place X at every intersection it makes impossible, in every sub-grid (the transfer step the Dell introduction calls easy to overlook). (6) A row or column of a sub-grid with one empty cell left is a dot. (7) A guess is allowed only as a hypothesis test: make it, look for facts that disprove it, and eliminate it when they do (method 9 in puzzle form).

**Table chart.** When one category has an inherent order (days, places, ranks), write that category down the left in order and fill the other categories into its rows; eliminations are noted beside the table (Penny Dell, "How to Solve Logic Table Puzzles").

**Cross-elimination** (Puzzle Baron). Take a sub-row or sub-column with two or three options left; find another sub-row or sub-column where all of those options are already X'd; the pair they share is impossible. This is arc consistency (method 5) between two variables.

**Notation.**
```
            | Paul Rob Stan Vern Wally | Mon Tue Wed Thu Fri
   Anne     |  •    X    X    X    X   |  •   X   X   X   X
   Cathy    |  X    •    X    X    X   |  X   X   X   X   •
   Monday   |  •    X    X    X    X   |
```
**Test.** Each sub-grid ends with exactly one dot per row and per column, and the dots agree across sub-grids. Open cells after propagation mean the clues underdetermine the answer; list the possibilities; that is the finding, never a guess recorded as a result.

**Use here.** Programs × (who evaluated, who funded the evaluation, who disseminates); authors × (institution, funder, committee seat). The record fills the cells; a cell the record cannot fill is `not found`.

**Sources.** Penny Press / Penny Dell Puzzles, "How to Solve Logic Problems", sample PDF in *The Book of Logic* (pennydellpuzzles.com, 2025), read; Penny Dell, "How to Solve Logic Table Puzzles" (2008 PDF), read in full; Puzzle Baron, "Cross Eliminations" (logic.puzzlebaron.com), read. Dell Magazines' introduction read only in a mirror without Dell attribution **[unchecked]**. Games Magazine's own method text not found; its puzzles use the same chart. The zebra puzzle's first printing (*Life International*, 17 December 1962) **[unchecked]**.

## 2. Conditional diagramming

**Problem.** Rules of the form if/then, only if, unless, requires, all/no; what follows.

**Steps.** (1) Find the indicator word. (2) Write `S -> N` (sufficient to necessary). (3) Write the contrapositive `/N -> /S`. (4) Chain arrows whose necessary term is another's sufficient term (`A -> B`, `B -> C` gives `A -> C`). (5) For "if X", start at X and follow arrows forward only; what is reached must be true; nothing else is forced. (6) A term reached as both `T` and `/T` marks an inconsistent set. (7) Never read an arrow backward (mistaken reversal: affirming the consequent) and never negate both ends without swapping (mistaken negation: denying the antecedent).

**Indicators.** Sufficient: if, when, whenever, all, any, every, each, people who, in order to, *the only*. Necessary: then, only, only if, only when, must, requires, depends on, unless, except, until, without, none but, none except, no … except. Biconditional: if and only if, if but only if. "Either A or B" is `/A -> B` (and `/B -> A`); "or, but not both" is `/A <-> B`. The PowerScore list states it is not exhaustive.

**Unless Equation** (PowerScore). The term after unless / except / until / without becomes the necessary condition; the other term is negated and becomes the sufficient condition. "Unless you try, you won't succeed": `Succeed -> Try`. The alternative reading (negate the pre-unless clause as sufficient) gives the same contrapositive.

**Notation** (7Sage "lawgic"): `/` not; `->` implies; `<->` biconditional; contrapositive: negate both ends, swap them, and turn *and* into *or* and *or* into *and*.

**Micro-example.** "No cars except SUVs can safely travel this road": `SafeTravel -> SUV`; contrapositive `/SUV -> /SafeTravel`. From the 2026-11-08 case: "a causal claim requires a control group" (`Causal -> Control`) with "the Colorado figure has no control group" (`/Control`) gives `/Causal`: the text's "roughly halved" as a program effect cannot be true under the text's own rule.

**Sources.** PowerScore conditional-reasoning pages (hosted at barbri.com), read; 7Sage lawgic notes, read; Manhattan LSAT *Logic Games* (2nd ed., 2011), sample chapters read. The PowerScore Unless Equation handout returned 403; its rule from the search snippet **[unchecked]**. Copi, Cohen & Rodych, *Introduction to Logic*, 15th ed. (Routledge 2019, ISBN 978-1-138-50086-0), ch. 8; Hurley, *A Concise Introduction to Logic*, 13th ed. (Cengage 2017, ISBN 978-1-305-95809-8), ch. 6; chapter numbers by edition **[unchecked]**.

## 3. Sequencing setups

**Problem.** Order n elements under constraints (chronology, rank, priority). LSAC withdrew Analytical Reasoning from the LSAT after June 2024 (lsac.org, 18 October 2023); the methods stand as the best-documented informal treatment of ordering constraints.

**Relative ordering: the Tree** (Manhattan). (1) Start with the first constraint; draw a line between any two letters whose relative position is known. (2) Find the next constraint that connects to any part of the diagram. (3) Repeat until every constraint is used; draw lines only between letters whose relative position is known. Earlier elements sit to the left.
```
   T \          N
      O -- M -- V
   P /        S/ \ R
```
Test: who can be first = any letter with nothing to its left; who can be last = any letter with nothing to its right.

**Numbered ordering: the Number Line.** Slots `_ _ _ _ _` numbered 1..n; `[HM]` a block (adjacent, in that order); `H _ _ M` a fixed gap; `A - B` A before B; under a slot, the letters that cannot occupy it (PowerScore's Not Laws). A chain of length k keeps its head out of the last k−1 slots and its tail out of the first k−1.

**Question tests.** Must be true = true in every completion; could be true = true in at least one; cannot be true = true in none. For "if X", add X and propagate.

**Use here.** Any timeline a text asserts (statute, board decision, operation, court review; study, press release, citation, policy adoption). The record supplies the dates; the setup shows the order the text's argument needs and whether the record allows it.

**Sources.** Manhattan LSAT *Logic Games*, 2nd ed. (2011), sample chapters 1–2, read (steps quoted there); PowerScore forum staff posts on arrows, blocks and Not Laws, read as snippets; the *Logic Games Bible* itself not read **[unchecked]**.

## 4. Grouping and assignment setups

**Problem.** Elements selected in or out, or partitioned into groups, under conditionals and quotas.

**Binary grouping: the Logic Chain / in-out** (Manhattan; 7Sage). Two columns, IN and OUT; each conditional and its contrapositive drawn as an arrow between columns; `A -> /B` (not both) with contrapositive `B -> /A`; `/A <-> B` (one or the other, not both). Chains close under contrapositives.

**Assignment: Open / Closed Board.** A column per group, a row per slot; closed when the slot counts are fixed. Place forced elements; mark `A <-> /B` pairs as sharing one slot between them.

**Test.** Must / could / cannot, as in method 3.

**Micro-example** (2026-11-08 case). "All of it is voluntary" (`Funded -> Voluntary`); "Pause … with LARC as the condition" read as a condition of entry (`Pause -> /Voluntary`): chain `Pause -> /Voluntary -> /Funded`. The text's own rules exclude one of its own list items, or "voluntary" is doing two jobs (equivocation; hand to `word-lineage` and `informal-logic-check`).

**Sources.** Manhattan LSAT *Logic Games* (2011) chapter table (Ordering → Tree / Number Line; Binary Grouping → Logic Chain; Assignment → Open/Closed Board), read; 7Sage in/out and lawgic notes, read.

## 5. Constraint propagation and arc consistency

**Problem.** Variables with finite domains and constraints between them: the general form of methods 1, 3 and 4, and the method behind Sudoku and KenKen.

**Definitions** (Mackworth 1977). Node i is node consistent iff every value in its domain satisfies its unary constraint. Arc (i, j) is arc consistent iff for every value x of i there is a value y of j such that the constraint on (i, j) holds. A network is arc consistent iff every arc is.

**REVISE((i, j)).** For each x in D_i, if no y in D_j supports it, delete x from D_i.

**AC-3.**
```
 for each i: NC(i)
 Q <- {(i,j) | (i,j) an arc, i != j}
 while Q not empty:
   take (k,m) from Q
   if REVISE((k,m)) then Q <- Q u {(i,k) | (i,k) an arc, i != k, i != m}
```
**Test.** A domain emptied by propagation proves inconsistency; every domain a singleton is a solution; otherwise branch on the smallest domain, propagate, backtrack on an empty domain. The logic grid's X is a domain deletion; its dot is a singleton.

**Use here.** A text that asserts a set of facts about who did what when; the record supplies the domains; propagation finds the assertion the record cannot support.

**Sources.** A. K. Mackworth, "Consistency in Networks of Relations", *Artificial Intelligence* 8(1):99–118 (1977), doi:10.1016/0004-3702(77)90007-8, pp. 99–106 read; R. Dechter, *Constraint Processing* (Morgan Kaufmann 2003, ISBN 1-55860-890-7), ch. 3, publisher's contents checked; S. Russell & P. Norvig, *Artificial Intelligence: A Modern Approach*, 4th ed. (Pearson 2020, ISBN 978-0-13-461099-3), ch. 6; page numbers **[unchecked]**.

## 6. Syllogism rules and the Venn test

**Problem.** Two categorical premises (A: all S are P; E: no S are P; I: some S are P; O: some S are not P) and a conclusion.

**Six rules** (Copi & Cohen, as given by Kemerling). (1) Exactly three terms. (2) The middle term is distributed in at least one premise. (3) A term distributed in the conclusion is distributed in its premise. (4) At least one premise is affirmative. (5) A negative premise requires a negative conclusion, and a negative conclusion a negative premise. (6) Two universal premises do not give a particular conclusion (the existential fallacy, on the Boolean reading).

**Valid forms.** Fifteen without existential import: Barbara AAA-1, Celarent EAE-1, Darii AII-1, Ferio EIO-1, Cesare EAE-2, Camestres AEE-2, Festino EIO-2, Baroco AOO-2, Disamis IAI-3, Datisi AII-3, Bocardo OAO-3, Ferison EIO-3, Camenes AEE-4, Dimaris IAI-4, Fresison EIO-4. Nine more with existential import (universal premises, particular conclusion), making the traditional 24; their names **[unchecked]**.

**Venn test.** Three overlapping circles. Shade the universal premises first; place the X for a particular premise in the unshaded candidate region, or on the line if two remain. Valid iff the conclusion is already drawn.

**Micro-example.** "All the programs on the list are voluntary. Pause is on the list. So Pause is voluntary." Barbara; valid. The argument then stands or falls on the first premise, which the decomposer graded E6 at S7 (uncited, asserted flat).

**Sources.** G. Kemerling, *Philosophy Pages*, "Establishing Validity" (philosophypages.com/lg/e08b.htm), read; Copi, Cohen & Rodych 15th ed.; Hurley 13th ed. ch. 5. The 15 vs 24 count: Kemerling (Boolean) and arXiv 1701.05408 (traditional) **[snippet only]**.

## 7. Truth tables, full and indirect

**Full table.** List the atoms; 2^n rows; compute each compound under its main operator. Valid iff no row has every premise T and the conclusion F. Consistent iff some row has every statement T. Tautology iff all rows T; contradiction iff all rows F.

**Indirect (short) table.** Put T under each premise's main connective and F under the conclusion; work out what each atom must be; where a formula can be satisfied in more than one way, branch. A completed assignment is an invalidating assignment; a contradiction on every branch proves validity. For consistency, set every statement T and look for a completed assignment (a model).
```
 p  q | p->q | p | q     rows with p->q = T and p = T: only row 1, where q = T   => modus ponens valid
 T  T |  T   | T | T
 T  F |  F   | T | F
 F  T |  T   | F | T
 F  F |  T   | F | F
```
**Converse, inverse, contrapositive.** For `p -> q`: the contrapositive `/q -> /p` agrees on all four rows; the converse `q -> p` and inverse `/p -> /q` differ on row (p = F, q = T). Only the contrapositive is equivalent.

**Sources.** Hurley 13th ed., ch. 6 (truth tables, indirect truth tables, "Testing Statements for Consistency"; section titles confirmed from the 9th-edition table of contents; exact wording **[unchecked]**); Texas A&M logic course notes, section 2.4 (indirect tables), read.

## 8. Consistency of a premise set

**Definition.** A set is consistent iff at least one model makes every member true. **Pairwise consistency does not give joint consistency**: {P, Q, /(P & Q)} has every pair satisfiable and the triple not.

**Steps.** (1) Translate each premise to a formula (from the decomposer). (2) Indirect table with every statement set T, or CSP: each atom a variable with domain {T, F}, each premise a constraint, AC-3 then search (method 5). (3) A contradiction on every branch: inconsistent. A completed assignment: consistent, and the assignment is the witness model.

**Source.** Hurley ch. 6 (consistency); the CSP formulation is method 5. Method 12 is built on this.

## 9. Indirect proof

**Steps.** (1) To prove p, assume `/p` in an indented sub-proof. (2) Derive a line q and a line `/q` (or `q & /q`). (3) Discharge the assumption and write p. Conditional proof is the sibling: assume the antecedent, derive the consequent, discharge to `antecedent -> consequent`. (4) If no contradiction can be derived, the conclusion does not follow from these premises; the assignment in which the premises hold and the conclusion fails is the counterexample the text must answer.
```
 1. A -> B            prem
 2. A -> /B           prem
 |3. A                assume (IP)
 |4. B                1,3 MP
 |5. /B               2,3 MP
 |6. B & /B           4,5
 7. /A                3–6 IP
```
**Puzzle form.** Method 1 step 7: make a guess, look for facts that disprove it, eliminate it.

**Source.** Hurley ch. 7 (conditional proof, indirect proof), via course summaries; exact text **[unchecked]**.

## 10. Assumption Negation Technique; flaw families

**Problem.** A conclusion that does not follow from its stated premises; which unstated premise bridges it, and does the bridge hold.

**Assumption Negation Technique** (PowerScore, *Logical Reasoning Bible* ch. 11). (1) Take a candidate necessary assumption. (2) Form its *logical* negation, not its polar opposite (the negation of "sweet" is "not sweet", not "bitter"). (3) Put the negation into the argument. (4) If the argument collapses, the candidate was necessary; if it survives, it was not. Formal basis: if A is necessary for "P therefore C", then `/A` with P must fail to support C.

**Stem tests** (LSAC's skill list; 7Sage's 22 stems). Must be true = entailed by the premises. Sufficient assumption = premises plus the answer entail the conclusion. Necessary assumption = the negation test. Strengthen / weaken = raises / lowers the probability of the conclusion given the premises; the facts come from the record (`citation-farm-audit`), not from invention.

**Flaw families** (prep-industry labels; the textbook fallacies). Mistaken reversal and mistaken negation of a conditional; correlation read as cause; unrepresentative sample; equivocation (one word, two meanings across premises); part-to-whole and whole-to-part; ad hominem; appeal to inappropriate authority; false dilemma (two options presented as exhaustive); circular reasoning (the conclusion restated as a premise); straw man (a position answered that was not held); percentage against number. The list as a fixed set **[unchecked]**. Each named flaw goes to `informal-logic-check` for the Phase 2 record.

**Sources.** LSAC, "Logical Reasoning" skills page (lsac.org), read; 7Sage, "LR question types" (22 stems), read; PowerScore pages at barbri.com naming the Assumption Negation Technique and *Logical Reasoning Bible* ch. 11, read; GMAC's own Critical Reasoning statement **[unchecked: mba.com returned empty]**.

## 11. Premise logic grid

**Problem.** An argument with several premises and one or more conclusions: which premises carry which conclusions, and how well.

**Steps.** (1) Rows: premises (P ids, quoted). Columns: conclusions (C ids, quoted). (2) In each cell where the text offers the premise for that conclusion, mark `acc` (acceptable: the evidence grade from `logic-decomposer` is E1–E3, or the record supports it), `rel` (relevant: bears on the conclusion's truth) and `suf` (sufficient: with the other marked premises in the column the conclusion follows; test with method 2, 6 or 9). (3) Mark `—` where the premise is not offered for that conclusion. (4) Rows: an empty row is an idle premise. Columns: a column with no `acc ✓ rel ✓` cell is an unsupported conclusion; a column whose `suf` is ✗ everywhere needs an unstated assumption (method 10).

**Basis.** Govier's acceptability, relevance and grounds criteria (*A Practical Study of Argument*, 7th ed., Wadsworth 2009, ISBN 978-0-495-60340-5) **[unchecked: the research reference documents Govier's standardisation rules, not the ARG criteria]**; the grid is this skill's arrangement of them.

```
LOGIC GRID
                      | C1 "<quote>"          | C2 "<quote>"
P1 "<quote>"          | acc ✓ rel ✓ suf ✗     | —
P2 "<quote>"          | acc ✗ (E5/S7) rel ✓   | acc ✗ rel ✓
Unsupported conclusions: <columns with no acc ✓ rel ✓>
Idle premises: <rows all —>
```

## 12. Incompatibility matrix of held premises

**Problem.** A text, an author or a body holds a set H = {h1 … hn}. Which pairs cannot both be true, which cannot both be true given a further assumption, and does the whole set have a model.

**Basis.** Method 8: a set is satisfiable iff it has a model. Pairwise cells are two-member satisfiability checks; the joint check is satisfiability of H; an `X|A` cell is conditional inconsistency ({hi, hj} satisfiable, {hi, hj, A} not). Test-prep analogues: the grid's X and the Not Law are pairwise exclusions; a "could be true" question is model finding; "resolve the paradox" is repairing an inconsistency by adding a premise; the Assumption Negation Technique is the `X|A` cell with A the negated assumption.

**Steps.** (1) Translate each held premise to a formula, keeping its quote reference; declare the assumptions separately (translation licences and unstated suppositions). (2) For each pair, test {hi, hj}: `=` identical or entailed; `o` compatible (a model exists); `X` incompatible (none). (3) For each `o` pair, re-test with each declared assumption A; record `X|A` where it fails. (4) Joint check on all of H by indirect table or CSP search; record the witness model, or extract minimal inconsistent subsets by deleting one premise at a time and re-testing. (5) Report the matrix, the key, the witness or the minimal subsets, and every assumption that was load-bearing. Pairwise cells never cite a held premise: a conflict that needs three held premises appears only in the joint section. `?` marks a cell undecidable because the translation is ambiguous; it goes back to the decomposer.

**Why the joint step is mandatory.** {P, Q, /(P & Q)}: every pair `o`, the triple `X`. The matrix shows where conflicts localise; the joint check decides whether the set is consistent.

```
INCOMPATIBILITY MATRIX
 Held premises (key; each with its quote in the decomposer output):
  h1  "<quote>"      <formula>
  h2  "<quote>"      <formula>
 Assumptions (declared separately):
  A1  <translation licence or unstated supposition>

        h1    h2    h3
  h1    =     o     X|A1  (<reason>)
  h2          =     o
  h3                =
 Joint: H as stated: satisfiable (witness: <assignment>) | not satisfiable — minimal inconsistent subsets {…}
        H under A1: X (minimal subset {h1, h3})
 Verdict: <consistent as worded | inconsistent>; load-bearing assumptions: <list>
```

**Micro-example** (2026-11-08 case). h1 "all of it is voluntary"; h2 "Pause … with LARC as the condition"; h3 "offered proactively … to the women everyone already knows are at risk"; A1: a condition of entry is not voluntary. h1 × h2: `X|A1`; h1 × h3: `o`. Joint under A1: X, minimal subset {h1, h2}. Verdict: consistent only if "voluntary" is read two ways, which is an equivocation finding, not a model.

## 13. Toulmin layout; argument schemes and critical questions

**Toulmin.** Claim (C); Data (D), the facts appealed to; Warrant (W), the inference licence from D to C; Backing (B), support for W; Qualifier (Q), the force D gives C; Rebuttal (R), the conditions of exception.
```
 D: <quote> --------------------> So, Q: <word>, C: <quote>
                 |                              |
            Since W: [often unstated]       Unless R: <quote or "none offered">
                 |
            On account of B: <quote or "none offered">
```
**Test.** W and B are named; Q is no stronger than the unaddressed rebuttals allow. A map with D and no W is a map of an enthymeme: name the warrant before judging it.

**Argument schemes** (Walton, Reed & Macagno). Schemes are forms of common defeasible arguments (expert opinion, cause to effect, analogy, practical reasoning, …), each with critical questions; assessing an instance means posing them. Expert opinion: how credible is E as an expert; is E an expert in the field the claim is in; the remaining questions **[unchecked]**. The count of schemes is given as 65 by one source and 96 by another **[unresolved]**.

**Sources.** S. E. Toulmin, *The Uses of Argument*, updated ed. (Cambridge 2003, ISBN 978-0-521-53483-3 pb, doi:10.1017/CBO9780511840005); B. Verheij, "Evaluating Arguments Based on Toulmin's Scheme", *Argumentation* 19:347–371 (2005), read; D. Walton, C. Reed & F. Macagno, *Argumentation Schemes* (Cambridge 2008, ISBN 978-0-521-72374-9, doi:10.1017/CBO9780511802034), via the NDPR review and the publisher's summary.

## 14. Argument maps (Argdown)

**Problem.** Lay out a case so that every support and attack is visible and every argument is reconstructed as premises and conclusion.

**Argdown syntax** (argdown.org). Statement `[Title]: text`; argument `<Title>: text`; relations on indented lines, `+` support, `-` attack, `_` undercut, `><` contradiction, with optional direction `<` or `>`; a premise-conclusion structure as numbered statements with a line of hyphens before each conclusion.
```
 [Claim]: Harry is a British subject.
   + <Birth>: Bermuda-born men are British subjects, and Harry was born in Bermuda.
     (1) Harry was born in Bermuda.
     (2) A man born in Bermuda is generally a British subject.
     ----
     (3) Harry is a British subject.
   - [Alien parents]: Both of Harry's parents were aliens.
```
**Test.** Every statement is reached by a support or attack path; every reconstructed argument is valid (method 7 or 9); every rebuttal is drawn as an attack. Rationale (van Gelder) is the same discipline in a graphical tool: a fixed set of primitives (claims, reasons, objections) with strict combination rules.

**Sources.** Argdown syntax documentation (argdown.org/syntax), read; T. van Gelder, "The rationale for Rationale", *Law, Probability and Risk* 6(1–4):23–42 (2007), abstract read; Rationale's colour convention **[unchecked]**; Argunet's discontinuation **[secondary]**.

## 15. Wigmore chart

**Problem.** A factual proposition to be proved by many items of evidence, each through its own chain of inference.

**Twining's seven steps.** (1) Clarify standpoint, purpose and role. (2) Formulate the ultimate probandum. (3) Formulate the penultimate probanda. (4) Formulate the theory and themes; choose the strategic probanda. (5) Compile the key-list: a numbered list of every proposition from the ultimate probandum down to each testimonial assertion. (6) Draw the chart, referring only to key-list numbers. (7) Complete the analysis.

**Symbols** (as reproduced from Twining's teaching materials). Circle: evidence; filled circle: empirical data; open circle: circumstantial evidence or inference; square: testimonial assertion; triangle: corroborating argument; open angle: the other side's alternative explanation; arrow: direction of inference; G: generalisation. Symbols vary between analysts.
```
            (UP) <ultimate probandum>
               ^
            (PP) <penultimate probandum>
             ^           ^
       [2] <inference>  [5] <inference>
         ^   ^
   [3] <inference>  [4] <testimony>  (square)
```
**Test.** Every charted node has a key-list entry; every arrow is an inference the analyst can state, with its generalisation written out; the con side is charted beside the pro side. A proposition whose every chain passes through one uncorroborated node is proved only as well as that node.

**Use here.** A policy claim resting on several studies: each study an item, each "the study shows X" an inference node whose generalisation ("a before/after fall in a program's counties shows the program caused it") is written down and tested.

**Sources.** T. Anderson, D. Schum & W. Twining, *Analysis of Evidence*, 2nd ed. (Cambridge 2005, ISBN 978-0-521-67316-7), ch. 5; the steps and symbols as reproduced in J. W. Montgomery, *J. Int. Soc. Christian Apologetics* 3(1):13–27 (2010), read; the book's own glossary **[unchecked]**. J. H. Wigmore, *The Principles of Judicial Proof* (1913; 3rd ed. *The Science of Judicial Proof*, 1937).

## Output

For each method applied: its number and name, the inputs by id (P, K, C, h from `logic-decomposer`), the grid, chain, table or map, and the result in the method's own terms (must / could / cannot; valid / invalid with the counterexample row; consistent / inconsistent with the witness or the minimal inconsistent set; the named flaw with its quote). Nothing is reported without its working.

**Scripts.** `scripts/grids.mjs` prints the empty or filled LOGIC GRID, INCOMPATIBILITY MATRIX and cross-elimination grids; `scripts/truth-table.mjs` prints a full table with the validity or consistency verdict; `scripts/conditionals.mjs` prints rules, contrapositives, chains and forced values. Node 18+, no dependencies; see the plugin README.

## Origin

Directed by the author on 2026-11-08 (directions store dir-yls; `dev/cui-bono/origins.md`): research the standard Games Magazine / Mensa / GRE, GMAT, LSAT preparation / logic and puzzle-solving formal methods and make them a toolbox, with logic grids and the mutual incompatibility of held premises. This file states the methods; the records hold his words. Mensa's puzzle books (Carter and Russell) were found to be genre collections drawing on methods 1, 6, 7 and 5, with no formalism of their own; the GRE has had no analytical-reasoning section since 2002 **[ETS statement unchecked]**.

## BUGS

- Closed: the first writing's unchecked textbook citations were replaced on 2026-11-08 from the research reference; the items still marked **[unchecked]** are listed in that file's final section.
- B1 (inconsistency). Method 12's notation differed from the matrix in `cui-bono`'s card and `VV.md` (`ok` / `✗` / `✗ under P5` / "Jointly satisfiable"). Closed 2026-11-08: method 12's notation is canonical; `cui-bono`'s Step 3 block and card and `VV.md` now use it; `scripts/grids.mjs` and `test/fixtures/matrix-*` already carried it (`=` / `o` / `X` / `X|A1`, assumptions declared, `A1` as the assumption), and `grids.mjs` now refuses an `X|A` cell whose `under` value is a held-premise id or is not a declared or A-prefixed assumption id (error, exit 2; four checks in `test/run.js`).
- B2 (stale numbering). The header comment of `scripts/grids.mjs` was reported as "methods 4, 9 and 10". Closed 2026-11-08: the file was first committed in fa33a73 with the header already reading "methods 1, 11 and 12" (the review saw a pre-commit working copy); verified in the fix wave, no change needed.

## TODO

- Verification and validation on every platform the plugin claims (claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32): the `toolbox-on-decomposition` procedure in `VV.md`, once per platform; the entry stays until each is recorded.
- Clear the remaining **[unchecked]** marks by reading the primary texts named in `references/methods-research-2026-11-08.md` ("Unchecked / not found"): Hurley's and Copi's section wording, the PowerScore Bibles, the nine existential-import forms, the Walton scheme count, Rationale's documentation, Anderson–Schum–Twining's glossary; and Govier's ARG criteria for method 11.
