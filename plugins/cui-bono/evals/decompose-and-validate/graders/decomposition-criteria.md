---
type: llm
weight: 2
---

You are grading a logic-decomposer output for the passage quoted at the end of these criteria.

PASS only if ALL of the following hold:
1. Every sentence of the passage (there are twelve) appears with a sentence id (S1, S2, ...) and exactly one disposition; no sentence is skipped and none appears twice. A sentence split into parts (S7a, S7b) is acceptable.
2. Every row of the P-TABLE carries a sentence id and a proposition in quotation marks whose words appear verbatim in the passage. Trimming indicator words such as "therefore" and "so" (shown as "...") is allowed, a quotation wrapped over two table lines or cut short by the column width still counts as verbatim, and rows marked [unstated] are the only rows without a quote. A proposition reworded in the decomposer's own words is a FAIL.
3. The conditional "Unless funding continues, the gains will be lost" is written with the negated funding term as the sufficient condition and the loss as the necessary condition (for example /FundingContinues -> GainsLost), with its contrapositive written beside it. The reverse direction is a FAIL.
4. The conditional "Attendance improves only if families trust the school" is written with attendance improving as the sufficient condition and trust as the necessary condition (Improves -> Trust), with its contrapositive. The reverse direction is a FAIL.
5. "Most districts" is recorded as a proportion with no number (proportion, unquantified).
6. "To be honest, the case for the program is settled" has its self-referential part marked rhetorical.
7. "The program cut suspensions by 40 percent in its first year" is graded evidence E6, stated S7, licensed S4, gap +3, overclaim.
8. Every P-TABLE proposition has an evidence grade, a starting certainty (GRADE: high or low with its modifiers, or "—" where the evidence is not a study), a stated grade, a licensed grade and a gap, in separate columns; none is missing. A proposition whose stated grade is S? (a hedge with no odds, such as "may") has no band, so its gap may read "n/a" or "no band"; that is not a missing grade.
9. The VALIDITY report lists all eight checks: coverage, traceability, nothing added, conditional direction, quantifier scope, entity consistency, round trip, grades complete.

FAIL on any paraphrased proposition, any reversed conditional, any skipped sentence, or a missing grade.

The passage:

To be honest, the case for the program is settled. Most districts that adopted it saw attendance rise. Attendance improves only if families trust the school. Unless funding continues, the gains will be lost. The program cut suspensions by 40 percent in its first year. Every school that kept the program for three years reported fewer referrals. Critics say the effect is a Hawthorne effect, but they offer no data. The state should therefore fund it for another five years. A district requires at least two trained coordinators to run it. No school without a coordinator has sustained the gains. So the coordinators, not the curriculum, may be what matters. The evaluation was commissioned by the program's own foundation.
