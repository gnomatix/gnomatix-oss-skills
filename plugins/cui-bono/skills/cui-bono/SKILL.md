---
name: cui-bono
description: Run on any text that argues for a policy, a program, a budget or a conclusion (a pasted passage, a URL, a file, a report, an op-ed, a brief), and with no argument right after the agent gives a suspicious answer to a scientific or factual statement by the user. Asks whose voice the text speaks in and who gains if it is accepted. Step 1 names the shape from eight detectors (self-certifying opener, two-camp frame, concession-then-pivot, foreclosure line, named-program list with one round figure each, virtue tags, aligning adversary, register markers), the register, its publishers and which voice. Step 2 hands every claim to citation-farm-audit and every cited source to source-provenance. Step 3 runs logic-decomposer, deconstructs the findings with informal-logic-check, staleness-guard, word-lineage and hidden-libel-check, and fills the logic-toolbox logic grid and incompatibility matrix. With no argument the document is the agent's previous reply. Facts only, each with a URL; the same checks on every side.
---

# cui-bono

*Cui bono?* — to whose benefit? The parent skill of `citation-farm-audit` and `source-provenance`. Those two trace the money and the citations under a source. This one runs first, on the text itself: whose voice is it written in, and who gains if the reader accepts it. Then it routes the claims and the sources to the two aspect skills, and deconstructs what they return with the logic skills.

## Input

- `/cui-bono <pasted text>`: the text is the document.
- `/cui-bono <url>` or `/cui-bono <file>`: fetch or read it; the retrieved text is the document.
- `/cui-bono` with no argument: the document is the agent's own previous reply to the user. See **Self-audit**.

## Step 1: the shape

Score each detector present or absent, quoting the text that triggers it. A detector with no quote is absent.

| # | Detector | What counts | Example of the trigger |
|---|---|---|---|
| 1 | Self-certifying opener | The text grades itself before it says anything: *honest*, *plain*, *frankly*, *the truth is*, *to be clear* in the first sentence. | "The honest answer has two halves" |
| 2 | Two-camp frame, writer above both | Two sides named, one error assigned to each, the writer standing in the middle. Markers: *each*, *both*, *neither*, *one side … the other*. | "the taboo and the eugenics boards each got one of them wrong" |
| 3 | Concession-then-pivot | The reader's observation restated in the writer's words, then used as the setup for a cautionary tale or a lesson. The reader's point becomes evidence for the writer's conclusion. | "say what the frontline sees … The eugenics boards' error wasn't seeing it" |
| 4 | Foreclosure line | One direction is closed by a sentence, not by evidence; often a legal holding or a moral phrase stretched to do the closing. | "the right answer isn't on that road" |
| 5 | Named-program list, one round figure each | Three or more proper-noun programs or studies, each with one effect size, all pointing the same way, no null result, no cost figure, no citation. | "Colorado's program roughly halved …; Pause … fell by most …; thirty years of randomized trials" |
| 6 | Virtue tags | Adjectives that carry the case and no data: *voluntary*, *free*, *non-judgmental*, *proactive*, *evidence-based*, *cheaper than*, *no list, no board*. | "all of it is voluntary, and all of it is cheaper than the courts" |
| 7 | Aligning adversary | The reader's enemy named at the close so the reader signs for the list. | "that is the budget the grievance organizations are competing for" |
| 8 | Register markers | Stock phrases of a sector: *exactly those families*, *measured to work*, *everyone already knows*, *the one program with*, *what the evidence shows*, *stakeholders*, *lived experience*. | "measured to work on exactly those families" |

Then name:

- **Register**: the kind of document this shape belongs to. Examples: foundation policy brief; program evaluation summary; NGO fact sheet; press release; op-ed; scientific abstract; court judgment; legislative preamble.
- **Who publishes in it**: the organizations and funders whose documents have this shape (the program's own national office, the foundation that funds it, the think tank that summarizes it, the agency that reports on it).
- **Cui bono**: who gains if the reader accepts the text as written: a budget line, a program's continuation, a funder's mission, a committee's mandate, a writer's standing.
- **Which voice**: the register the text is written in and the sector whose documents the phrases and the figures come from. This line is written for every text, not only the agent's own reply.

A shape score is a fact about the text. It is not a verdict on the claims; steps 2 and 3 are.

## Step 2: route the claims and the sources

1. List every factual claim in the text, quoted. For each, record what the text cites for it. A claim with no citation is marked `cites nothing` and its chain starts at a dead end.
2. Run `citation-farm-audit` on each claim: the chain from the text down to primary data, the people and the money, the flags, where the chain ends. A document whose shape is the funder brief or the program summary is traced to the program's self-report first, because that is where its figures come from.
3. Run `source-provenance` on each source the text does cite.
4. Record, per claim: `cites nothing | <source>`, what the record shows, and the gap between the text's figure and the source's figure. A figure that grew, lost a qualifier, or changed from a before/after number to a causal effect between the source and the text is a woozle edge.
5. Run the same queries on the text's opponents, named or implied. A text that names an adversary (detector 7) has that adversary's documents audited the same way.

## Step 3: deconstruct the findings

First run `logic-decomposer` on the text: it returns the proposition table (P and C ids, each quoted), the conditionals with their direction, the entities and constraints, the two grades per proposition (evidence from the record, confidence as stated) with the gap, and its own validity report. Nothing below uses a premise or claim that is not in that table.

Then take the findings of steps 1 and 2 apart with the other skills, each on the aspect it covers, and record what each returns:

- `informal-logic-check`, in full, with each phase's result recorded on the card: Phase 0 (its self-audit) in the no-argument case, where the document is the agent's own reply and the defect is the agent's; Phases 1 and 2 otherwise. Phase 2 on the text's argument: the conclusion and premises quoted in the text's own words, then each premise tested for acceptability (against the step 2 record), relevance and sufficiency, and the draft findings checked for the fallacies the skill lists (straw man, cherry-picking, equivocation, false dilemma, moving the goalposts). Detector 2 is a false dilemma until the two camps are shown to exhaust the field; detector 3 is a straw man when the restated observation is answered with a position its author did not take.
- `staleness-guard` on every figure: whether it is the current figure or a superseded one, and whether a newer primary source exists.
- `word-lineage` on each loaded word that does work in the text (*honest*, *voluntary*, *evidence-based*, *stigmatize*, *grievance*): its literal meaning, so the working definition replaces the connotation.
- `hidden-libel-check` on every sentence of the findings that names a person or an organization, before the card is written: facts with records, no motives.
- Every other installed skill, considered one by one: the card lists each skill considered and marks it applied (with what it returned) or not applicable, with the reason (for example `source-provenance` again on a source that step 2 surfaced is applied; a skill whose aspect the findings do not raise is not applicable, naming the aspect).

The four named skills (`informal-logic-check`, `staleness-guard`, `word-lineage`, `hidden-libel-check`) are required. If one is not installed, install it from the gnomatix-oss-skills marketplace (`/plugin install <skill>@gnomatix-oss-skills`) or run it from this repository's `plugins/<skill>/` directory. A run without one is incomplete, and the card says so (`incomplete: <skill> not run`).

Then fill the **logic grid** (`logic-toolbox` method 11): rows are the text's premises (quoted), columns are its claims or conclusions (quoted); each cell records whether the premise is offered for that claim and, if so, `acceptable` (the step 2 record supports it), `relevant` (it bears on the claim) and `sufficient` (with the other premises, it carries the claim), with a one-line reason. An empty row is a premise doing no work; an empty column is a conclusion with no support in the text. Every other toolbox method (the crosshatch grid, conditional diagramming, sequencing setups, grouping setups, constraint propagation, syllogism rules, truth tables, consistency of a premise set, indirect proof, the Assumption Negation Technique, Toulmin layout, argument maps, Wigmore charts) gets one line on the card: applied, with its working, or not applicable because `<no input of kind X>` (no ordering constraints for method 3; no categorical premises for method 6; and so on). No method is passed over without that line.

```
LOGIC GRID
                         | C1 "<claim>"        | C2 "<claim>"        | ...
P1 "<premise>"           | acc ✓ rel ✓ suf ✗   | —                   |
P2 "<premise>"           | acc ✗ (<reason>)    | acc ✗ rel ✓         |
...
Unsupported conclusions: <columns with no acc ✓ rel ✓ cell>
Idle premises: <rows all —>
```

Then the **incompatibility matrix** of the held premises (`logic-toolbox` method 12, whose notation is canonical): the held premises h1…hn are the P ids the text asserts, each with its quote and its formula from the decomposer; the assumptions (translation licences and unstated suppositions) are declared separately as A1…An. Each pair is marked `=` (identical or entailed), `o` (compatible), `X` (incompatible) or `X|A<n>` (incompatible under the declared assumption), with the reason. A pairwise cell never cites a held premise; a conflict that needs three held premises appears only in the Joint lines. Then the joint check: whether all the premises can be true together (the witness model), and if not the minimal inconsistent subsets; the same under each declared assumption; then the verdict and the load-bearing assumptions. Two premises held at once that cannot both be true is a finding about the text, whatever each premise's own standing. `scripts/grids.mjs matrix` in `logic-toolbox` prints the block and refuses an `X|A` cell whose assumption is a held premise.

```
INCOMPATIBILITY MATRIX
 Held premises (key; each with its quote in the decomposer output):
  h1  "<quote>"      <formula>
  h2  "<quote>"      <formula>
  h3  "<quote>"      <formula>
 Assumptions (declared separately):
  A1  <translation licence or unstated supposition>

        h1    h2    h3
  h1    =     o     X|A1  (<reason>)
  h2          =     X     (<reason>)
  h3                =
 Joint: H as stated: satisfiable (witness: <assignment>) | not satisfiable — minimal inconsistent subsets {…}
        H under A1: X (minimal subset {h1, h3})
 Verdict: <consistent as worded | inconsistent>; load-bearing assumptions: <list>
```

## Self-audit (no argument)

The document is the agent's own previous reply. Steps 1 to 3 run unchanged. Then:

- **Which voice**: the step 1 line, with the trace specific to the agent. The agent's reply is a document like any other; its author is the agent and its sources are what the model absorbed, so the trace goes to the organizations whose summaries dominate what is written about the topic.
- **Each figure to its source**: for every number or effect in the reply, the real source found in step 2 and the gap. A figure the agent stated from memory with no source is `cites nothing`, whatever the record later shows.
- **What the user said**: quote the user's statement the reply answered. State whether the reply answered it, restated it, or answered a different claim. A reply that restates the user's observation and then argues with a position the user did not take is detector 3 and a straw man, and the card says so.
- **Why this voice**: one or two sentences on the mechanism: the register the model reproduces when asked "what works" is the register of the documents most written about the topic, which are the programs' and funders' own.

The self-audit writes facts about the reply. It does not apologize, narrate resolve, or grade itself; the first detector exists because texts that grade themselves are the ones to check.

## Output

```
CUI BONO: <document: title, url, or "agent reply of <date time>">
Date: <YYYY-MM-DD>   Auditor: <agent/session>

Shape: <n>/8
  [1] <present|absent> "<quote>"
  ...
  [8] <present|absent> "<quote>"
Register: <kind of document>
Who publishes in it: <organizations, funders>
Cui bono: <who gains if the text is accepted as written>
Which voice: <register, and the sector whose documents the phrases and figures come from>

Claims:
  <#> "<quoted claim>" | cites nothing | <source> | <what the record shows> | <gap>
  ...
Grades (from logic-decomposer): <n> propositions; evidence E0–E6 (GRADE-adjusted), stated S1–S7 or S?
  <id> "<quoted>" | E<n> | S<n> | licensed S<n> | gap <+n|−n|0> | overclaim | underclaim | calibrated
  Overclaims: <count>   Underclaims: <count>   Calibrated: <count>
Aspect cards: <paths or ids of the citation-farm-audit network cards and source-provenance cards>
Decomposition validity: <pass, or the checks that failed and were fixed>
Deconstruction:
  informal-logic-check: Phase 0 <result, no-argument case> | Phase 1 <result> | Phase 2 <fallacies found, each with its quote>
  staleness-guard: <superseded figures>
  word-lineage: <word = literal meaning>
  hidden-libel-check: <pass, or the sentences changed>
  <skill>: incomplete: <skill> not run   (only when a required skill could not be installed or run)
Skills considered: <every other installed skill> — applied (<what it returned>) | not applicable (<reason>)
Toolbox methods: <#> <name> — applied (<working>) | not applicable (<no input of kind X>)   (one line per method)
LOGIC GRID: <as above>
INCOMPATIBILITY MATRIX: <as above>
Fairness: same queries on <the text's adversary>: <result>
Verdict: <one or two sentences: what the text supports as written and where it stops>
Unverified: <every item not checked against a primary record>

(Self-audit only)
What the user said: "<quote>" — answered | restated | answered a different claim
Why this voice: <mechanism>
```

## Worked example: an agent reply, 2026-11-08

The document was a reply beginning "The honest answer has two halves", given to a user's question about what to do when society will not acknowledge what frontline workers see. The user's question is quoted in the record: project bead persistint-game-h9lj and the audit card on the author's Drive, `cfa-honest-answer-2026-11-08.md`. Nothing about his question is restated here beyond that description.

```
Shape: 8/8
  [1] "The honest answer has two halves"
  [2] "the taboo and the eugenics boards each got one of them wrong"
  [3] "say what the frontline sees … The eugenics boards' error wasn't seeing it; it was the diagnosis"
  [4] "So the right answer isn't on that road."
  [5] Colorado "roughly halved"; Pause "fell by most"; NFP "thirty years of randomized trials";
      Perry and Abecedarian "cut the court outcomes": four programs, one figure each, no null, no cost,
      no citation
  [6] "voluntary", "free, with no judgment", "proactively", "cheaper than the courts", "no list or a board"
  [7] "that is the budget the grievance organizations are competing for"
  [8] "measured to work on exactly those families", "everyone already knows", "the one program with"
Register: foundation policy brief / program evaluation summary, written as plain talk
Who publishes in it: the programs' national offices (Nurse-Family Partnership NSO, HighScope, Pause),
  their funders (Susan Thompson Buffett Foundation, RWJF, Gates), the think tanks that summarize them
  (Brookings), the agencies that report on them (CDPHE, DfE)
Cui bono: the programs named, and the budget case for them

Claims: ten, all cites nothing; eight traced below; two (the cost comparison, claim 9; the grievance
  budget, claim 10) unchecked as opinion. Once traced:
  Colorado "roughly halved": the agency's statewide before/after figure; peer-reviewed causal
    estimate 6.4% (county) to about 20% (near clinics). Woozle edge.
  Pause "repeat removals fell by most": neither evaluation measured repeat removals against a
    control. Woozle edge.
  NFP "biggest effects in the lowest-functioning families": subgroup findings stated as the main
    result; the 1,645-woman English trial, null on every primary outcome, omitted; the author is the
    founder and the disseminator. Cherry-pick; undisclosed overlap.
  FASD "largest preventable cause … isn't genetic at all": agency wording is "a leading known
    preventable cause"; fetal genotype modulates the effect (twin concordance MZ 5/5, DZ 7/11). Wrong.
  "Perry, Abecedarian … cut the court outcomes": Abecedarian's authors report intellectual-test
    gains held at 21 and no significant difference in criminal involvement at 30. Half wrong.
  "Canadian law closed that door in E. (Mrs.) v. Eve": the holding is that courts cannot authorise
    non-therapeutic sterilisation under parens patriae; silent on legislatures. Overstated.
  "eugenics boards … Buck and Muir": Muir, yes (Alberta Eugenics Board); Buck, a Colony board of
    directors with court review. Partly wrong.
  "a small number of families … far out of proportion": the user's observation; national registers
    support it (parent-to-child relative risk of intellectual disability 14.9, Sweden). Uncited, true.
Deconstruction:
  informal-logic-check: false dilemma (detector 2: the taboo and the boards do not exhaust the
    field); straw man (detector 3: a Mendelian model answered, not the user's observation);
    cherry-picking (the null trial); equivocation (the user's term, quoted in the record, names the
    mild, familial group; the reply's heredity argument concerns the severe, de novo minority)
  staleness-guard: the Colorado and Pause figures are the programs' first-round announcements;
    the causal estimates and the second evaluation supersede them
  word-lineage: honest = "honourable, held in honour" (Latin honestus), a claim about the speaker,
    not the content; voluntary = "of one's own will" (voluntarius), which says nothing about who
    is offered it or how
  hidden-libel-check: pass after the card named Olds's roles as facts with records and no motive
LOGIC GRID (abridged)
                                   | C1 "the right answer isn't on  | C2 "do the things that are
                                   |  that road" (sterilisation)    |  measured to work" (the list)
P1 families seen daily (user)      | rel ✓ suf ✗ (not about remedy) | rel ✓ acc ✓
P2 boards' error was Mendelian dx  | acc ✗ (not what the user said) | —
P3 Eve 1986 closes the door        | acc ✗ (ratio narrower)         | —
P4 Colorado halved                 | —                              | acc ✗ (agency before/after)
P5 Pause cut removals by most      | —                              | acc ✗ (not measured)
P6 NFP 30 years, biggest in poorest| —                              | acc partial (subgroups; null omitted)
P7 FASD largest, not genetic       | —                              | acc ✗
P8 Perry/Abecedarian cut crime     | —                              | acc partial (Perry only)
Unsupported conclusions: C1 (its premises fail); C2 carried only by P1 and parts of P6, P8
Which voice: the funder brief; the figures are the programs' accounts of themselves
What the user said: the user's question about what to do when society will not acknowledge what
  frontline workers see; quoted in the record (project bead persistint-game-h9lj; Drive card
  cfa-honest-answer-2026-11-08.md) — restated in paragraph one, then answered with a position (a
  Mendelian model of feeblemindedness) the user had not taken; straw man
Why this voice: asked "what works", the model reproduces the documents most written about the
  programs, which are the programs' and their funders' own summaries
Verdict: the reply supports the user's observation in one sentence and then argues with a position he
  did not take; its figures are five wrong or overstated out of eight, all in the direction of the
  programs' own accounts. The word "honest" was the reply's claim about itself.
```

The full network cards for this example are the record for the audit; the example above is the summary.

## Tools

Those of `citation-farm-audit` and `source-provenance`: curl or Node (built-in `fetch`, Node 18+), OpenAlex, Crossref, Europe PMC, NIH RePORTER, ProPublica Nonprofit Explorer, CRA charity listings. No Python. For a URL, fetch the page and audit the retrieved text; for a file, read it. Step 3 requires the `informal-logic-check`, `staleness-guard`, `word-lineage` and `hidden-libel-check` skills; where one is not installed, install it from the gnomatix-oss-skills marketplace or run it from this repository's `plugins/<skill>/` directory. A run without one is incomplete and the card says so (`incomplete: <skill> not run`).

## Origin

Directed by the author on 2026-11-08 (directions store dir-yls; `dev/cui-bono/origins.md`; project bead persistint-game-h9lj): identify the shape of a text and whose voice it speaks in, as the parent of the two source-tracing skills; runnable on any text and, with no argument, on the agent's own previous reply after a suspicious answer to something scientific; the agent then uses the suite, with the informal-logic and related skills and logic grids, to deconstruct its own findings. The records hold the author's words; this file states the rules.

What is his direction and what is an embodiment of it: pasted text as the argument, and the no-argument case immediately after a suspicious response to something scientific he said, are the author's words (dir-yls; `dev/cui-bono/origins.md`). The URL and file inputs and the wider trigger ("any text that argues for a policy, a program, a budget or a conclusion"; "scientific or factual") are embodiments under his goal record: his specifications in all foreseeable embodiments and use-cases are the MVP (directions store dir-912, P0, his direction of 2026-11-08).

## BUGS

Found in the independent review of 2026-11-08 against `dev/cui-bono/origins.md`; the coordinator ruled on each and the fix wave of 2026-11-08 applied the rulings.

- B1 (narrowing). The "Which voice" line was written only for the no-argument case. Closed 2026-11-08: the line is in Step 1 and in the main card for every text; the self-audit bullet keeps only the agent-specific trace; "(Self-audit only)" no longer lists it.
- B2 (narrowing). Step 3 ran `informal-logic-check` "Phase 2" only. Closed 2026-11-08: Step 3 runs it in full, Phase 0 (self-audit) in the no-argument case and Phases 1–2 otherwise, and the card records each phase's result.
- B3 (loophole). "Any other installed skill that covers an aspect" and `not run: <skill> not installed` let a skill go unrun without a record. Closed 2026-11-08: the four named skills are required, installed from the marketplace or run from this repository's `plugins/` directory when missing, and a run without one is incomplete and the card says so; every other installed skill is listed on the card as applied or not applicable with the reason.
- B4 (loophole). The other toolbox methods were "applied where the decomposition gives them inputs" with no record of the methods not applied. Closed 2026-11-08: every toolbox method gets one card line, applied with its working or not applicable because `<no input of kind X>`.
- B5 (loophole). `VV.md` passed on "at least one claim" / "at least one figure". Closed 2026-11-08: both procedures now require every claim and every figure.
- B6 (quoted words in a shipped file). The worked example quoted the author's own words and paraphrased his question. Closed 2026-11-08: the quotation, the paraphrase and the quoted term were replaced with a pointer to the record (project bead persistint-game-h9lj; Drive card `cfa-honest-answer-2026-11-08.md`) and a neutral description of his question; the card-format field stays generic.
- B7 (addition presented as directed). URL/file input and the wider trigger were not distinguished from his direction. Closed 2026-11-08: both kept, the description restored to the pre-review scope with the logic-decomposer and logic-toolbox mention and ≤1024 characters, and **Origin** states which inputs are his words and which are embodiments under his goal record (dir-912).
- B8 (inconsistency). The matrix here and in `VV.md` used `ok` / `✗` / `✗ under P5` / "Jointly satisfiable" against method 12's notation. Closed 2026-11-08: method 12's notation is canonical; the Step 3 block, the card and `VV.md` use it; `grids.mjs` and the fixtures already carried it, and `grids.mjs` now refuses an `X|A` cell whose assumption is a held premise (exit 2; tested in `test/run.js`).
- B9 (record). `VV.md` recorded a hand run that predates the shipped file; the claim counts (ten, eight, seven) disagreed. Closed 2026-11-08: the `results:` entry removed (`results: []`); the worked example states ten claims, eight traced, two (cost; grievance budget) unchecked as opinion, matching the Drive card. The shipped procedure has not yet been run on any platform; the V&V TODO covers it.

## TODO

- Verification and validation on every platform the plugin claims: claude-code/win32, claude-code/linux-wsl, claude-code/linux, claude-code/darwin, codex/win32, codex/linux-wsl, antigravity/win32, antigravity/linux-wsl, kiro/win32. One pass each of the `shape-and-voice` and `self-audit` procedures in `VV.md` per platform; the entry stays until each is recorded.
- The detectors were derived from one document. Add detectors as further audited texts show shapes these eight miss, each with its triggering quote.
- The worked example predates `logic-decomposer`; its grades table and decomposition validity block are to be added by running the shipped procedure on the same text and recording the result in `VV.md`.
