---
name: logic-decomposer
description: Run before any formal check of an argument, a policy text, a report or the agent's own reply, and as step 3 of cui-bono. Converts natural language into the discrete objects the logic-toolbox methods consume: propositions, premises, conclusions and sub-conclusions, stated and unstated assumptions, conditionals with their direction (sufficient and necessary), quantifiers with their scope, definitions, entities, relations, constraints, and the Toulmin fields, each tied to the exact quote it came from. Grades every proposition twice, for the evidence under it (E0–E6, with the GRADE starting certainty in its own column) and for the confidence the text states (S1–S7 on the ICD 203 likelihood row, or S? for Kent's unmodified "possible"), and reports the gap as overclaim or underclaim. Runs eight internal validity checks on the decomposition itself before anything is handed on.
---

# logic-decomposer

The toolbox methods (`logic-toolbox`) work on discrete objects: propositions, conditionals, sets, constraints. Text does not come that way. This skill does the conversion, keeps every object tied to the words it came from, grades each proposition for evidence and for stated confidence, and checks its own output before anything downstream uses it. A decomposition that adds, drops or reverses anything corrupts every check built on it, so the validity checks are not optional.

Sources were checked on 2026-11-08; the reference with quotations is `../logic-toolbox/references/methods-research-2026-11-08.md`, parts F and G. An item marked **[unchecked]** there is marked the same here.

## Input

Any text: a pasted passage, a fetched page, a file, or the agent's own previous reply. The output is the decomposition tables and a validity report, written to the audit's record (the cui-bono card, or a file beside it).

## Step 1: segment and number

Split the text into sentences, numbered S1, S2, … in order; each bullet or list item is its own sentence. Nothing is skipped. Each sentence gets exactly one disposition in step 2.

## Step 2: classify every sentence

| Disposition | What it is | Goes to |
|---|---|---|
| `claim` | A proposition the text asserts and expects the reader to accept | P-table |
| `conclusion` | A claim the text offers other claims as support for; `sub-conclusion` when it is itself support for a further claim | P-table, marked C |
| `premise` | A claim offered as support for a conclusion | P-table, marked P, with the conclusion it supports |
| `conditional` | if/then, only if, unless, requires, without, all/every/any/no, either/or | Conditionals (step 4), and a P row (role premise or claim) linked to its K id, so it can enter the grid and the matrix |
| `definition` | States what a term means, or fixes a term's meaning by use | Definitions |
| `instruction` | Tells the reader to do something | Constraints (step 5) |
| `rhetorical` (R) | Self-reference, framing, transition, question, exhortation, address to the reader, evaluation of the text itself | Shape detectors in cui-bono; no proposition |
| `quote` | Words attributed to someone else | P-table, with the attribution as a separate claim ("X said Y") |

A sentence that does two things is split into numbered parts (S4a, S4b). A sentence with no propositional content is `rhetorical`, quoted; it is not dropped.

A `conditional` sentence keeps that one disposition for the coverage check and also gets a P row: its role is premise or claim as the text uses it, its quoted proposition is the conditional sentence, its formal column is the K form, and its `cites` and `supports` entries are filled like any other row; the P row names its K id (`K1`) so the conditional enters the logic grid and the incompatibility matrix instead of disappearing into the conditionals table.

## Step 3: the proposition table

One row per proposition, in the text's words, trimmed to the proposition. No paraphrase in the proposition column; a paraphrase needed for the toolbox goes in the formal column and is checked in step 7.

```
P-TABLE
id  | sentence | role        | proposition (quoted)                  | formal                       | supports | cites   | K  | h
P1  | S2       | premise     | "a small number of families ... run   | Fam(x) & ID(x) -> ID(kids)   | C1       | nothing | —  | h1
    |          |             |  from one generation to the next"     |                              |          |         |    |
P2  | S7       | premise     | "it works only if it is voluntary"    | Works -> Vol                 | C2       | nothing | K1 | h2
C1  | S5       | conclusion  | "the right answer isn't on that road" | /Sterilisation               | —        | nothing | —  | h3
A1  | —        | assumption  | [unstated] the two camps named        | —                            | C1       | —       | —  | —
    |          |  (unstated) |  exhaust the options                  |                              |          |         |    |
R1  | S1       | rhetorical  | "The honest answer has two halves"    | —                            | —        | —       | —  | —
```

- `role`: premise, conclusion, sub-conclusion, claim (asserted, supports nothing), assumption (`[unstated]`, never quoted as if the text said it), rhetorical.
- `formal`: the propositional or categorical form of the quoted proposition, in the toolbox notation (`/`, `->`, `<->`, `&`, `v`). Required for every P row that enters a toolbox method that takes formulas: methods 7 (truth tables), 8 (consistency of a premise set) and 12 (incompatibility matrix). Optional for a row that enters none of them; such a row is excluded from those three methods, and the exclusion is listed in the validity report.
- `supports`: the conclusion id this row is offered for. A premise offered for nothing is idle; a conclusion with no premises is unsupported. Both are findings.
- `cites`: what the text gives as the source, or `nothing`.
- `K`: for a P row made from a `conditional` sentence, the id of its row in the conditionals table (step 4); `—` otherwise.
- `h`: the held-premise id for toolbox method 12. The `h` ids are the P ids selected as held premises: the rows the text asserts (role premise, claim, conclusion or sub-conclusion), numbered h1…hn in P-table order, each with its formula. `[unstated]` assumptions and rhetorical rows never get an `h` id; an unstated assumption that the matrix needs is declared there separately as an A id.

**Standardisation.** Indicator words (*therefore*, *so*, *because*, *since*) are removed from the quoted proposition and recorded as the `supports` link. Sub-conclusions are marked. A longer argument also gets a tree (method 13 or 14 of the toolbox).

**Unstated assumptions.** Added only when a conclusion does not follow from its stated premises without one; the added premise is the weakest that closes the gap and one the author would hold. This is the moderate principle of charity: presume the arguer is giving reasons for claims they hold; do not rebuild the argument into a stronger one than the text makes. Each is marked `[unstated]` and listed in the validity report.

**Translating ordinary language** (categorical form, for the syllogism and Venn methods). A singular statement takes a parameter ("George went home": all people identical to George are people who went home). Adverbs of time and place become times and places ("he is always clean-shaven": all times are times he is clean-shaven). A conditional becomes an A or E statement ("if it is a mouse, it is a mammal": all mice are mammals). Exclusive *only*, *none but*, *none except* reverse subject and predicate ("none but the brave deserve the fair": all who deserve the fair are brave). *The only* does not reverse ("the only animals in this canyon are skunks": all animals in this canyon are skunks). Exceptive *all except S*, *all but S* become two statements (no S are P, and all non-S are P).

## Step 4: conditionals, with direction

Every conditional is written as `sufficient -> necessary` with its contrapositive beside it. The indicator word fixes the direction; clause order in the sentence does not.

| Indicator | Sufficient | Necessary | Example | Form |
|---|---|---|---|---|
| if A, B / if A then B / B if A / when, whenever / people who A, B / in order to A, B | A | B | "if the trial was randomized, the result stands" | A -> B |
| A only if B / only when | A | B | "it works only if it is voluntary" | A -> B |
| only A are B / only A may B | B | A | "only members may vote" | Vote -> Member |
| A unless B / except when B / until B / without B | /B | A | "repeat removals fall unless support stops" | /B -> A |
| A requires B / depends on B / must | A | B | "a causal claim requires a control group" | A -> B |
| no A without B / none but B are A / no A except B | A | B | "no cars except SUVs can safely travel this road" | SafeTravel -> SUV |
| all / every / any / each A are B | A | B | "all of it is voluntary" | A -> B |
| the only A are B | A | B | "the only program with thirty years of trials is NFP" | ThirtyYears -> NFP |
| no A is B | A | /B | "none of that needs a board" | A -> /B |
| either A or B | /A | B | "either the figure is causal or it is before/after" | /A -> B (and /B -> A) |
| A or B, but not both | /A | B, and A -> /B | | /A <-> B |
| A if and only if B | A | B, and B -> A | | A <-> B |

The *unless* rule (PowerScore's Unless Equation): the term after unless / except / until / without is the necessary condition; the other term, negated, is the sufficient condition. "Unless you try, you won't succeed": `Succeed -> Try`.

```
CONDITIONALS
id  | sentence | quoted                                   | indicator | form          | contrapositive  | kind
K1  | S7       | "it works only if it is voluntary"       | only if   | Works -> Vol  | /Vol -> /Works  | stated
```

The converse (`B -> A`) and inverse (`/A -> /B`) are not inferences and are never written as such. When the text treats one as following, that is a finding (affirming the consequent / denying the antecedent) handed to `informal-logic-check`.

**Quantified claims.** *All / every / no* give conditionals. *Some* gives an existential and chains only with *all* ("some A are B; all B are C" gives "some A are C"; two *some*s give nothing). *Most* is more than half and chains with *all*, not with another *most*. These chaining rules are the prep-industry statement of the quantifier rules **[unchecked against a textbook]**; the categorical rules in step 3 and toolbox method 6 are the checked form.

## Step 5: quantifiers, entities, relations, constraints

- **Quantifiers.** Each *all, every, some, most, a small number, none, few, many, the one, a share* is recorded with its scope (the set it ranges over) and its kind (universal, existential, proportion). A proportion word with no number is `proportion, unquantified`. Negation placement is checked (*not all* against *all … not*); a universal read as implying instances is flagged for existential import.
- **Entities.** Every person, organization, program, place, statute, study and dataset named, with one canonical name each; merges and splits noted; pronouns and descriptions resolved.
- **Relations.** funded, wrote, cited, ran, evaluated, ruled, measured, as `relation(subject, object)` with the sentence id.
- **Constraints.** Rules the text imposes or assumes: orderings (before/after, first/then), groupings (in/out, with/without), exclusions (never, no), quotas (at most, at least, exactly). These are the inputs to toolbox methods 1, 3, 4 and 5.
- **Toulmin fields** per argument: Claim, Data, Warrant (usually unstated: mark it), Backing, Qualifier, Rebuttal.

## Step 6: certainty and uncertainty grades

Every proposition in the P-table gets two independent grades, a starting certainty where the evidence is a study, and a gap. The grades are kept in separate columns and never merged into one word: likelihood and confidence language describe different things (the event, and the basis for the judgment), and the analytic standards that use them require the separation.

**Evidence grade** (from the record, after `citation-farm-audit` or `source-provenance` has traced the proposition; before that, from what the text itself cites):

| Grade | Meaning |
|---|---|
| E1 | primary data reachable and read: a registry, a dataset, a measured outcome, a court or administrative record |
| E2 | peer-reviewed primary study, read |
| E3 | peer-reviewed review or meta-analysis, read |
| E4 | grey literature: report, preprint, working paper, evaluation without peer review or data release |
| E5 | agency, program or interested-party self-report: press release, program page, annual report |
| E6 | recall, anecdote or uncited assertion |
| E0 | not found: searched and absent, places searched listed |

**Starting certainty** (from GRADE, in its own column). The evidence grade says what kind of record was reached; the certainty says how far that record's design can be trusted. It follows the source: a randomized trial starts **high**; an observational study (cohort, registry, before/after, case series) starts **low**; a proposition whose evidence is not a study (E4–E6 self-report, recall or assertion; E0 not found) has no starting certainty (`—`) and its licensed grade is the cap alone. Modifiers, from GRADE: down one level for risk of bias, inconsistency, indirectness, imprecision or publication bias; up one for a large effect (RR > 2 or < 0.5; two levels for RR > 5 or < 0.2), a dose-response gradient, or residual confounding that would reduce the effect. The certainty column records the start and each modifier applied (`low, +2 (RR 14.9)`).

**Stated-confidence grade** (from the text's own hedges and boosters, mapped to the seven-band likelihood row of ICD 203; for a claim about validity rather than occurrence, to the IPCC's five confidence qualifiers):

| Grade | Wording | Band |
|---|---|---|
| S7 | a flat declarative with no hedge; *certain*, *it is clear that*, *definitely*, *the evidence shows*, *everyone knows*, *halved*, *the largest*, *isn't at all* | almost certain, 95–99% |
| S6 | *very likely*, *highly probable*, *well established* | 80–95% |
| S5 | *likely*, *probably*, *we believe*, *roughly*, *about*, *most* | 55–80% |
| S4 | *roughly even*, *may or may not*, *mixed* | 45–55% |
| S3 | *unlikely*, *doubtful* | 20–45% |
| S2 | *very unlikely*, *highly improbable* | 5–20% |
| S1 | *almost no chance*, *remote* | 1–5% |
| S? | *possible*, *might*, *could*, *perhaps*, *some evidence*, *suggests*: a hedge with no odds attached | no band |

A flat declarative is S7: it is a statement of fact asserted without qualification. Hedges lower the grade; boosters raise it (Hyland's interactional metadiscourse: hedges *might, perhaps, possible, about*; boosters *in fact, definitely, it is clear that*).

**Licensed grade and gap.** The evidence grade sets a cap on the stated grade: E1–E2 up to S7; E3 up to S6; E4 up to S5; E5–E6 up to S4; E0 only S?. The starting certainty feeds the licensed grade under that cap: **high** licenses up to the cap; **low** licenses two bands below the cap; then each down modifier lowers the licensed grade one band and each up modifier raises it one band, never above the cap; `—` (no study) leaves the cap as the licensed grade. Gap = stated − licensed. Positive is **overclaim**; negative is **underclaim**; zero is calibrated. S? has no band, so where either side is S? there is no numeric gap and the gap column reads `n/a`: a stated band (S1–S7) on an E0 row is an **overclaim**, because E0 licenses only S?; a stated S? on an E0 row is **calibrated**, because S? is what E0 licenses; a stated S? on any other row is `n/a` in the verdict column as well. Across a document the gap distribution is its overclaim profile; the overclaims are the woozle candidates for `citation-farm-audit`.

```
GRADES
id  | proposition (quoted)              | evidence | certainty              | basis cited          | stated | markers           | licensed | gap  | verdict
P4  | "roughly halved teen births"      | E5       | —                      | none (agency figure) | S5     | "roughly"         | S4       | +1   | overclaim
P7  | "isn't genetic at all"            | E6       | —                      | none                 | S7     | flat, "at all"    | S4       | +3   | overclaim
P1  | "a small number of families …"    | E1*      | low, +2 (RR 14.9 > 5)  | none; registers found| S7     | flat              | S7       | 0    | calibrated (uncited)
P6  | "biggest effects in the lowest…"  | E2       | high, −1 (publication  | none; trials found   | S7     | flat              | S6       | +1   | overclaim
    |                                   |          |  bias: null trial omitted) |                  |        |                   |          |      |
```
P1: observational registry, low, cap S7, two bands below is S5, up two for the large effect, S7. P6: randomized trials, high, cap S7, down one for the omitted null, S6.
`E1*` marks a grade from the record where the text cited nothing: the proposition is true and uncited, and the card says both.

## Step 7: internal validity checks

Run every check and record pass or fail with the item that failed. A failed check is fixed before the decomposition is used. Consistency checks (toolbox method 12) run only after checks 1–8 pass, so that an incompatibility is a property of the text and not of the translation.

1. **Coverage.** Every sentence S1…Sn has exactly one disposition; none missing, none twice.
2. **Traceability.** Every proposition, conditional, entity and constraint carries a sentence id and a quote that appears verbatim in the text; the only rows without a quote are marked `[unstated]`.
3. **Nothing added.** Nothing in the formal column that the quoted span, read with the stated definitions, does not say; every `[unstated]` row is minimal and listed in the report with the gap it closes.
4. **Conditional direction.** Each conditional's indicator word is named and its form re-derived from the table in step 4; *only*, *the only* and *unless* checked individually; the contrapositive written and checked by negating and swapping.
5. **Quantifier scope.** Each quantifier names its set; proportions without a number are marked; negation placement and existential import checked.
6. **Entity consistency.** One canonical name per entity; merges, splits and resolved pronouns listed.
7. **Round trip.** Read the P-table and conditionals back as prose, in order, beside the text. Every difference in meaning is listed and is a defect in the decomposition, not in the text.
8. **Grades complete.** Every premise, conclusion, sub-conclusion and claim row of the P-table has an evidence grade, a starting certainty (or `—` where the evidence is not a study), a stated grade, a licensed grade and a gap, in separate columns; every P row with an `h` id, or that enters method 7 or 8, has a formal column, and any row excluded from those methods for lacking one is listed. Rows marked `[unstated]`, `rhetorical` or `quote` take `n/a` in each grade column; the attribution claim of a `quote` row is graded as a claim.

```
VALIDITY
coverage: pass (14 sentences, 14 dispositions)
traceability: pass
nothing added: pass (2 [unstated] assumptions listed: A1, A2)
conditional direction: fail — K3 "unless" written as A -> B; corrected to /B -> A
quantifier scope: pass (3 unquantified proportions: P1 "a small number", P9 "most", P11 "a share")
entity consistency: pass (merge: "Olds's Nurse-Family Partnership" = "NFP")
round trip: fail — read-back states P6 as the main result; the text states it of a subgroup; P6 corrected
grades complete: pass
```

## Output

The P-table, the conditionals, the quantifier / entity / relation / constraint lists, the Toulmin fields, the grades table and the validity report, in that order, as plain text blocks. Downstream: `logic-toolbox` takes the P, K, C and h ids and the constraints, where the `h` ids are the P ids selected as held premises for method 12 (step 3, column `h`: the asserted rows, numbered h1…hn, each with its formula; the h → P mapping is printed with the P-table); `informal-logic-check` Phase 2 takes the premises and conclusions; `citation-farm-audit` takes each P with its `cites` entry.

**Script.** `scripts/skeleton.mjs <textfile>` numbers the sentences and prints the empty P-table, the conditionals table pre-filled with every sentence carrying an indicator word, the empty grades table and the validity checklist. Node 18+, no dependencies.

## Sources for the method

- Translating ordinary language into categorical form (singular statements, adverbs, conditionals, exclusive and exceptive propositions, *the only*): Hurley, *A Concise Introduction to Logic*, §4.7, 12th-edition slides read; 13th ed. Cengage 2017, ISBN 978-1-305-95809-8. Hurley's *unless* rule **[unchecked]**; the propositional rendering above is the PowerScore Unless Equation (toolbox method 2). Lander University logic course page, same rules, read.
- Conditional indicators and the sufficient/necessary reading: PowerScore conditional-reasoning pages (barbri.com), read; 7Sage lawgic notes, read. Quantifier chaining (*some*, *most*) **[unchecked]**.
- Argument standardisation and reconstruction: A. Fisher, *The Logic of Real Arguments*, 2nd ed. (Cambridge 2004, ISBN 978-0-521-65481-4), ch. 2 summary read (recognise reasoning by linguistic clues; display its structure; decide whether it is correct); M. Scriven, *Reasoning* (McGraw-Hill 1976), schema as reproduced in D. Gasper, "Analysing Policy Arguments", *European Journal of Development Research*, June 1996, pp. 36–62, preprint read: clarify meanings; identify conclusions, stated and unstated; portray structure; extract unstated assumptions; evaluate premises and inferences; consider other arguments; overall evaluation (Scriven's own step count differs by source **[unchecked]**); T. Govier, *A Practical Study of Argument*, 7th ed. (Wadsworth 2009, ISBN 978-0-495-60340-5), standardisation and tree diagrams **[snippet]**.
- Principle of charity, moderate form: Govier, *Problems in Argument Analysis and Evaluation* (1987; Windsor Studies in Argumentation 2018, doi:10.22329/wsia.06.2018, record checked), "A New Approach to Charity"; Govier, "Uncharitable Thoughts About Charity", *Informal Logic* (1981), via a 2021 summary **[secondary]**.
- Claim, data, warrant, backing, qualifier, rebuttal: S. E. Toulmin, *The Uses of Argument*, updated ed. (Cambridge 2003, ISBN 978-0-521-53483-3, doi:10.1017/CBO9780511840005), pp. 97–105; B. Verheij, *Argumentation* 19:347–371 (2005), read.
- Probability words kept apart from confidence words; the seven-band likelihood row; the rule that a confidence level and a degree of likelihood are not combined in one sentence; information distinguished from assumptions and judgments: S. Kent, "Words of Estimative Probability", *Studies in Intelligence* 8(4), Fall 1964, PDF read (chart: certainty 100; almost certain 93 give or take almost 6; probable 75 ± 12; chances about even 50 ± 10; probably not 30 ± 10; almost certainly not 7 ± 5; impossibility 0; the rule that *possible* is not modified); US Intelligence Community Directive 203, *Analytic Standards* (ODNI, 2 January 2015, amended 2022 and 2023), PDF read, standard D.6.e. The high/moderate/low confidence definitions are in agency style guides, not the directive **[unchecked]**.
- Confidence from evidence (limited / medium / robust) × agreement (low / medium / high), five confidence qualifiers, likelihood scale, traceable account: M. D. Mastrandrea et al., IPCC AR5 Guidance Note on Consistent Treatment of Uncertainties (November 2010), PDF read; published as *Climatic Change* 108:675–691 (2011), doi:10.1007/s10584-011-0178-6, record checked.
- Evidence quality levels and what moves them: GRADE Handbook (gdt.gradepro.org), section 5, read: high / moderate / low / very low; randomized trials start high, observational low; down for risk of bias, inconsistency, indirectness, imprecision, publication bias; up for a large effect (RR > 2 or < 0.5 one level; > 5 or < 0.2 two), dose-response, or residual confounding that would reduce the effect. G. H. Guyatt et al., *BMJ* 336:924 (2008), doi:10.1136/bmj.39489.470347.AD, record checked.
- Hedges and boosters: K. Hyland, *Metadiscourse: Exploring Interaction in Writing* (Continuum 2005, ISBN 978-0-8264-7611-1), interactional resources table **[via secondary reproduction]**; K. Hyland, *Hedging in Scientific Research Articles* (Benjamins 1998, ISBN 978-90-272-5067-4); K. Hyland, "Persuasion and context", *Journal of Pragmatics* 30:437 (1998), doi:10.1016/S0378-2166(98)00009-5, record checked.
- Calibration as the outcome test of stated confidence: G. W. Brier, *Monthly Weather Review* 78(1):1–3 (1950) **[DOI unchecked; AMS page 403]**; A. H. Murphy & R. L. Winkler, "Reliability of Subjective Probability Forecasts of Precipitation and Temperature", *Applied Statistics* 26(1):41–47 (1977), doi:10.2307/2346866, record checked.

## Origin

Directed by the author on 2026-11-08 (directions store dir-yls; `dev/cui-bono/origins.md`): a decomposer that converts language into the discrete things the toolbox needs, with internal validity checks, and certainty/uncertainty metrics. This file states the rules; the records hold his words.

## BUGS

- Closed: the first writing's E1–E7 / S1–S5 scales were replaced on 2026-11-08 by the sourced scales above (E0–E6 with GRADE modifiers; S1–S7 and S? on the ICD 203 row), and the unchecked source lines by checked records; the items still **[unchecked]** are listed in the research reference's final section.
- B1 (inconsistency). The P-table's `formal` column was "(optional)" though methods 7, 8 and 12 take formulas. Closed 2026-11-08: the column is required for every P row that enters methods 7, 8 or 12 and optional otherwise; a row without one is excluded from those methods and the exclusion is listed in the validity report (step 3, check 8).
- B2 (inconsistency). A `conditional` sentence had no P row and was absent from the grid and the matrix. Closed 2026-11-08: a conditional sentence keeps its one disposition and also gets a P row (role premise or claim) linked to its K id in the new `K` column (step 2, step 3).
- B3 (inconsistency). Nothing assigned `h` ids. Closed 2026-11-08: the `h` ids are defined in step 3 (new `h` column: the P ids selected as held premises for method 12, the asserted rows numbered h1…hn) and in **Output**.
- B4 (departure from the cited source). Observational studies were said to start at E2 "from GRADE". Closed 2026-11-08: a separate starting-certainty column follows GRADE (randomized trials high, observational studies low, `—` where the evidence is not a study) and feeds the licensed grade under the E cap (high → up to the cap; low → two bands lower; then the modifiers), stated in step 6 with the mapping and example rows.
- B5 (record). Three source lines cited a DOI "record checked" that the research reference did not cover (Govier 2018 WSIA, Guyatt 2008 BMJ, Hyland 1998 J. Pragmatics). Closed 2026-11-08: each confirmed against Crossref and noted in the reference's "Review pass 2026-11-08" section.
- B6 (inconsistency). `scripts/skeleton.mjs` still printed the P-table's `formal` column as "(optional)" with no `K` or `h` columns, and the grades table without the `certainty` column, so B1–B4 were closed in the text while the shipped script contradicted them; the gap for a stated S? was undefined. Closed 2026-11-10: the script prints the step 3 and step 6 headers (`formal`, `K`, `h`; `certainty`), `test/fixtures/skeleton-small-expected.txt` matches, and step 6 states the S? rule. The method 12 gate now names checks 1–8 (check 8 holds the formal-column rule the matrix needs); bare *only*, *people who*, *in order to* and *then* (toolbox method 2) are in the step 4 table and the script; the residual-confounding upgrade from the GRADE source is in step 6.

## TODO

- Verification and validation on every platform the plugin claims (claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32): the `decompose-and-validate` procedure in `VV.md`, once per platform; the entry stays until each is recorded.
- Clear the remaining **[unchecked]** marks (Hurley's *unless* rule; the quantifier chaining rules; Scriven's own numbering; the agency confidence-level definitions; Hyland 2005's table; Brier's DOI) by reading the primary texts.
- Extend `skeleton.mjs` to pre-fill the quantifier list and the hedge/booster markers per sentence.
