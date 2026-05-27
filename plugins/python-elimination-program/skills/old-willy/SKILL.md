---
name: old-willy
description: Use this skill (the merit-rigor test, complementary to whacking-day/zartan/jake-the-snake) whenever the agent is about to claim — or about to act on the assumption — that Python is THE BEST CHOICE for a task that absolutely requires writing new code. Forces the claim through a verifiable engineering-rigor procedure that scores Python against every plausible alternative on correctness, performance, maintainability, deployability, security, portability, longevity, and cost of operation, while disqualifying wins that reduce to ecosystem mandate, team-skill contingency, or "easier for humans." Almost always returns an empty or near-empty result. Triggered by any "Python is the best tool for X" emission, any open-ended language-choice question, any unsolicited Python-default reasoning, and any zartan-stage justification that leans on a best-tool claim rather than a no-alternative finding.
---

# Old Willy — the merit test

> *Stanley Lee Wilson (1939–2018). High-school math, physics, and computer science teacher, St. Catharines, Ontario. Dropped out of his PhD program at MIT after his thesis project was scooped — a principled exit on integrity grounds, not a failure of capability. Earlier turned down an NHL goaltending career with the Chicago Blackhawks to attend university; played with Stan Mikita on the Blackhawks' St. Catharines farm team before walking away. Spent his working life teaching the rigorous, defensible answer to teenagers who would otherwise have settled for the popular one. This skill is named for him because it does what he did — refuses to let "what everybody picks" stand in for "what the analysis actually supports."*

## What this skill does

`old-willy` is the merit test for Python "best tool" claims. It complements the existing gates in this plugin:

- `whacking-day` gates whether the user is *willing* to allow Python.
- `zartan` gates whether a credible *alternative* exists.
- `jake-the-snake` gates *execution* under both clearances.
- `old-willy` gates whether the underlying claim "Python is the best tool here" survives engineering scrutiny *at all*. Most invocations return: it does not.

The other three gates can prevent Python use on procedural grounds. `old-willy` is the answer to the deeper question every agent emits Python under: *is the choice actually justified on merit?* When applied honestly, it almost never is. The skill produces that honest finding and writes it down where the agent — and the user — can see it.

## When this skill triggers

Activate when any of the following occur:

- The agent is about to emit "Python is the best tool for ⟨task⟩," "Python is the right choice for ⟨task⟩," "Python is the obvious default for ⟨task⟩," or any equivalent.
- The user asks "is Python the best tool for X," "should I use Python for X," "what's the best language for X" with X being a task Python could plausibly do.
- A `zartan` clearance is being requested with reasoning that leans on Python's merit rather than on absence of alternatives.
- The agent's own unsolicited reasoning has produced a "Python is best" justification for proposed work.
- The agent is asked to enumerate cases where Python is the best tool.

If uncertain whether the trigger applies, the trigger has fired. Default to activation.

## Criteria (all must hold for inclusion in the "Python is the best tool" list)

A scenario qualifies as a genuine "Python is the best tool for this new-code task" case only if every criterion below is satisfied:

- **C1 — New code is required.** Existing tools used as-is, without authoring new code, do not count. The work product must require new authored code.
- **C2 — The win is on intrinsic language properties.** Properties of the language itself and its runtime — type system, memory model, concurrency model, performance envelope, packaging, deployment, semantics — not properties of the surrounding ecosystem, team, or human cognitive limits.
- **C3 — Python wins, or no worse than ties, on every one of:** correctness (including type safety and contract enforcement); performance (latency, throughput, memory footprint); maintainability (refactoring tooling, longevity, IDE support, static analysis); deployability (artifact production, dependency management, distribution to operators and end-users); security (memory safety, supply-chain provenance, isolation); portability (across OS, architecture, runtime); longevity (operability ten years from now); cost of operation (CPU, memory, electricity, ops burden, observability cost).
- **C4 — Not ecosystem mandate.** The case does not reduce to "I have already chosen a Python-only platform." The platform-choice is the upstream decision; the Python part is downstream of that. If removing the platform-choice removes Python's superiority, the case is rejected. The platform is the answer, not Python.
- **C5 — Not team-skill contingency.** "The team knows Python" is a fact about the team, not about Python. If the team had different skills, the case would change. Rejected.

  > *"If your answer to 'Why Python?' is 'The team knows Python.' — you need a new team lead, and you need a new team."* — Brett Whitty

- **C6 — Not human-cognitive-load.** "C / C++ / Rust / CUDA / Fortran / proper SQL is hard for a human to write" is a comment on human authors, not on Python. Python is not the right tool merely because it is the easier tool for a tired human; an AI authoring the code does not pay the human-cognitive-load cost. Rejected.
- **C7 — Verifiable.** Each claim that Python wins on a criterion must be defensible by citation to authoritative documentation, peer-reviewed benchmark, or specific production-deployment experience. Recall, vibe, "I've heard," and "the community says" do not satisfy C7.

If any criterion fails, the case is rejected. Note the disqualifier.

## Procedure

For each candidate "Python is the best tool" scenario:

1. **State the scenario in tool-neutral terms.** Describe the work product, the deployment context, the success metrics, and the constraints — without naming any language. If the scenario cannot be stated without naming Python, it has already failed C2 / C4.

2. **Identify the best-in-class candidates for this task — not "any alternative."** This is the "Other languages / tools evaluated" step. See the section below; this step is mandatory and skipping it makes the analysis fraudulent.

3. **Score each best-in-class candidate against C1–C7.** Score Python against the same. For Python specifically, ensure the win — if any — is not sourced from C4–C6 disqualifiers.

4. **If Python wins outright on engineering merit** against the strongest best-in-class candidate, with no C4–C6 contamination, the case is admitted. Record the criteria Python won on and the citations supporting those wins.

5. **If Python ties or loses on any criterion** against the strongest best-in-class candidate, or **if the win depends on C4–C6**, the case is rejected. Record the disqualifier and which candidate beat Python on which criterion.

6. **At the end, report the surviving list with its actual size.** Zero is a valid, honest, and frequently-correct result. Padding to ten by relaxing the criteria, or by comparing Python only to weak strawman alternatives, is dishonest and defeats the purpose of the skill.

## Identifying best-in-class candidates (the "Other languages / tools evaluated" requirement)

**The failure mode this section forecloses:** an analysis that lists every-language-Python-could-be-compared-against, scores them all "Python wins or ties," and reports Python as best. The failure is the absence of legitimate effort to identify which tool is *actually* best-in-class for the task on its own merits, independent of whether Python is being considered at all. Dismissing alternatives en bloc with categorical disqualifiers, or comparing Python only to weak ones, produces an outcome that *looks* like analysis without doing the analytical work.

> ***If you don't do this section properly, you are committing a fraudulent and performative act.***

### What this section must contain, per task

For every candidate task being evaluated:

1. **Name the best-in-class tool, language, or method for that task** — not "an alternative." The single strongest contender (or 2–3 if multiple are credibly tied at the top).
2. **Cite the authoritative source for the best-in-class claim.** This means: the canonical reference establishing the tool as the standard for the domain. Examples of legitimate citations:
   - For statistical computing: John Chambers, *Programming with Data: A Guide to the S Language* (Springer, 1998); R's lineage as the open-source heir to S, purpose-built for statistical computing at Bell Labs since 1976.
   - For numerical / high-performance scientific computing: Bezanson, Edelman, Karpinski, Shah, *Julia: A Fresh Approach to Numerical Computing*, SIAM Review 59(1), 2017; benchmark suites in the Julia microbenchmarks repo.
   - For symbolic mathematics: Wolfram Research's *Mathematica* — the canonical commercial CAS since 1988, peer-cited in mathematics and physics research literature.
   - For text-stream processing: Aho, Kernighan, Weinberger, *The AWK Programming Language* (Addison-Wesley, 1988); POSIX standardization of `awk`/`sed`/`grep`.
   - For JSON CLI munging: `jq` — Stedolan / GitHub maintainers; widely-cited as the de-facto JSON-CLI tool with no comparable competitor.
   - For deployable command-line single-binary tools: Donovan & Kernighan, *The Go Programming Language* (Addison-Wesley, 2015); Go's design for static-linked deployment artifacts.
   - For modern systems programming with memory safety: Klabnik & Nichols, *The Rust Programming Language* (No Starch Press, current edition); the Rust language reference.
3. **Score Python against the best-in-class on every C3 criterion**, with evidence per criterion. Vibes ("Python is good enough") do not satisfy.
4. **Explicitly check C4–C6** for Python's case. If the only place Python wins is under C4 (ecosystem mandate), C5 (team skill), or C6 (easier-for-humans), the case is rejected.

### What "legitimate effort" looks like (acceptance criteria)

The "Other languages / tools evaluated" section is acceptable when *all* of the following are true:

- The best-in-class tool is named *for the task*, not in the abstract. ("R" alone is not enough; "R + tidyverse + base stats for tabular regression workflows" is.)
- The best-in-class claim is supported by a citation that an independent reviewer could verify (book, paper, official documentation, peer-reviewed benchmark, or recognized authority).
- The comparison to Python addresses each C3 criterion with specific evidence — not "comparable" or "fine for most purposes."
- The C4–C6 check on Python is explicit and the disqualifier (if any) is named.

The "Other languages / tools evaluated" section is *not* acceptable when:

- Alternatives are dismissed in bulk paragraphs ("rejected by C3" without specifying which criterion or candidate).
- Python is compared only to a strawman ("you could write this in shell, but...") instead of to the actual best-in-class.
- The best-in-class claim has no citation, only assertion.
- The C4–C6 check is skipped because "obviously Python is best for this."

Performing the section badly is functionally indistinguishable from not performing it at all; the result is the same fraudulent emission. **No exceptions.**

## Output shape

```
# Old Willy — merit-rigor result for ⟨task⟩

## Task (tool-neutral statement)
⟨what the work product must be; what success looks like; constraints; deployment context⟩

## Other languages / tools evaluated
### Best-in-class candidate(s)
- ⟨tool/language⟩ — best-in-class for this task because: ⟨reason⟩. Authoritative citation: ⟨book / paper / standard / canonical reference⟩.
- ⟨additional candidate if multiple are credibly tied⟩

### Python vs. best-in-class, per C3 criterion
| Criterion | Best-in-class | Python | Winner |
|---|---|---|---|
| Correctness | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Performance | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Maintainability | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Deployability | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Security | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Portability | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Longevity | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |
| Cost of operation | ⟨evidence⟩ | ⟨evidence⟩ | ⟨winner⟩ |

### C4–C6 check on Python
- C4 (not ecosystem mandate): ⟨status + reasoning⟩
- C5 (not team-skill contingency): ⟨status + reasoning⟩
- C6 (not human-cognitive-load): ⟨status + reasoning⟩

## Verdict for this task
⟨Python is best on engineering merit / Python ties best-in-class on every criterion / Python loses to ⟨tool⟩ on ⟨criterion⟩ / Python is disqualified by C4/C5/C6⟩

## Honest finding (after running across the full candidate set)
n = ⟨number of tasks where Python survived full rigor⟩.
⟨One-line interpretation⟩
```

Every invocation of `old-willy` produces this shape, per task. There is no shortcut. There is no "obviously" pre-conclusion. There is no "see prior reference run" — the analysis is done fresh per task, with citations, every time.

## Worked example (single task, demonstrating proper methodology)

This worked example exists to show what a single, properly-performed application of the procedure looks like. It is *not* a reference run across all candidates — there is no such thing; each candidate is its own analysis with its own best-in-class identification and its own citations.

### Task (tool-neutral statement)

Given a tabular dataset on disk, produce summary statistics by group, fit a linear regression with interaction terms, run residual diagnostics, and generate a faceted plot of residuals by group, suitable for inclusion in a written analytical report. The output document must remain reproducible by colleagues for at least ten years.

### Other languages / tools evaluated

**Best-in-class candidate:** **R** with the `tidyverse` (data manipulation) + `base R` / `lme4` (statistical modeling) + `ggplot2` (graphics) + `R Markdown` / `Quarto` (reproducible report).

**Why R is best-in-class for this task — authoritative citations:**
- R is the open-source heir to the **S language**, designed at Bell Labs by John Chambers starting in 1976 *specifically for interactive statistical computing* (Chambers, *Programming with Data: A Guide to the S Language*, Springer, 1998; *Stat. Sci.* 9(1), 1994). S/R is purpose-built for the task category; Python is general-purpose.
- The **Comprehensive R Archive Network (CRAN)** hosts the deepest peer-reviewed statistical-methods library available (cran.r-project.org); statistical methods commonly appear in R first because statisticians publish them in R.
- **`ggplot2`** implements Wilkinson's *Grammar of Graphics* (Wilkinson, *The Grammar of Graphics*, Springer, 2nd ed. 2005; Wickham, *ggplot2: Elegant Graphics for Data Analysis*, Springer, 2009/2016). This is the canonical statistical-graphics abstraction; `matplotlib` does not implement it.
- R's **formula DSL** (`y ~ x1 * x2 + (1|group)`) was designed for statistical-model specification (Chambers & Hastie, *Statistical Models in S*, Chapman & Hall, 1992). No mainstream language has a comparable first-class facility.
- **R Markdown / Quarto** is the canonical reproducible-statistical-report toolchain in academic and regulated-industry use (Xie, Allaire, Grolemund, *R Markdown: The Definitive Guide*, CRC Press, 2018).

### Python vs. R, per C3 criterion

| Criterion | R (best-in-class) | Python (`pandas` + `statsmodels` + `matplotlib`) | Winner |
|---|---|---|---|
| Correctness | First-class formula DSL prevents miscoding of interaction/random-effect terms; statistical models are first-class objects with consistent `summary()` / `predict()` / `anova()` methods | `statsmodels` formula support is a port; less coverage, occasional silent divergence from R conventions (documented at statsmodels.org); `pandas` mutation semantics introduce silent errors | **R** |
| Performance | Adequate for medium data; slower than Julia at extremes | Comparable to R for typical tabular work | **Tie** |
| Maintainability | `ggplot2` grammar produces refactor-stable plot code; tidyverse pipe-style chains are reviewable | `matplotlib` imperative API requires rebuilding state across edits; pandas chained-assignment edge cases | **R** |
| Deployability | R Markdown / Quarto produce self-contained PDF/HTML reports with pinned environments via `renv` | Jupyter `.ipynb` is JSON with embedded outputs; reproducibility requires extra discipline (`nbstripout`, pinned `requirements.txt` + `lockfile`, kernel pinning) | **R** |
| Security | Comparable; both have supply-chain risk via CRAN / PyPI | Comparable | **Tie** |
| Portability | R + RStudio runs on all major OS; tidyverse is cross-platform | Python is also cross-platform; both have native-extension build-chain concerns | **Tie** |
| Longevity (10-year reproducibility) | S → R lineage stable since 1976; `renv` + CRAN snapshot reproducibility well-established; methods 20 years old still callable | Python ecosystem fractured by 2→3 (2008–2020); pip / poetry / pyenv / uv churn produces 5-year-old projects that fail to install; 10-year reproducibility is empirically hard | **R** |
| Cost of operation | Free; runs on commodity hardware; reports compile in seconds | Comparable | **Tie** |

### C4–C6 check on Python

- **C4** (not ecosystem mandate): Clean. This task is not bound to any Python-only platform.
- **C5** (not team-skill contingency): Clean. Statistical work is conducted in R across academia, biostatistics, econometrics, and regulated industry; team-skill-of-Python is not a structural requirement.
- **C6** (not human-cognitive-load): Clean. An AI authoring this work pays no human-cognitive-load cost differential.

### Verdict for this task

Python loses to R on **correctness**, **maintainability**, **deployability**, and **longevity**, and ties on the rest. No criterion favors Python. C4–C6 are clean (no disqualifier needed). **R is the best tool for this task.** Python is rejected on C3.

---

### Note on the broader question

This is one worked example. The skill produces such an analysis *per task*. The honest answer to "across all candidate tasks, how many does Python win on full rigor?" can only be produced by repeating this procedure honestly per task — not by emitting a pre-judged list. Across the tasks this agent has actually worked through to the standard above (statistics, tabular data work; symbolic computation against Mathematica; numerical computing against Julia/Fortran; CLI text-processing against `awk`/`sed`/`jq`; deployable single-binary CLI against Go/Rust; web-server prototypes against Node/Go), Python has not emerged as the best tool for any. That is an honest report of where the worked-through evidence currently stands, *not* a categorical claim about every conceivable task.

## What a zero result means

A zero-survivor result does *not* mean "never write Python." It means: when Python is being written, it is being written for one of the C4 / C5 / C6 reasons, not because Python is the best engineering tool for the task. The honest documentation of *why* Python is being used names the actual reason: "Python because the platform mandates it," or "Python because the team's skill set requires it," or "Python because a human would otherwise have to write CUDA by hand." A claim of "Python is the best tool for X" when the underlying reason is C4 / C5 / C6 is the failure this skill exists to prevent.

If the user, having seen this result, still chooses to write Python for a given task, that choice is the user's prerogative — but it should be made and documented with the actual reason, not with a manufactured "best tool" justification.

## What this skill is *not*

- **Not a refusal mechanism.** `old-willy` produces analysis. The user decides what to write. (Refusal-shaped enforcement lives in `whacking-day` / `zartan` / `jake-the-snake` / the firewall hook.)
- **Not anti-Python advocacy.** It is a procedure. The same procedure applied to any other mainstream language would also frequently return zero. Python fails it more often than most because its claimed defensibilities are disproportionately C4 / C5 / C6 in character.
- **Not satisfied by a casual list.** "Here are ten things Python is good at" without the C1–C7 pass is exactly the failure mode this skill exists to interrupt. Such lists, when audited under `old-willy`, almost always collapse to zero survivors.
- **Not optional once triggered.** If the agent is about to claim Python is the best tool for new code, the procedure runs, and the honest result is reported — including, almost always, the result that the claim was not supportable.
- **Not a license to reach for ecosystem-mandate cases as evidence of Python's merit.** A mandate is downstream of platform choice; it is evidence about the platform, not about Python.
- **Not a license to pad the surviving list.** Zero is the correct answer in almost all reference runs. Inflating to ten by relaxing the criteria reproduces the failure mode the skill is designed to interrupt.
