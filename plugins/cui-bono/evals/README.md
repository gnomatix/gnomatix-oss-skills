# cui-bono evals

One `claude plugin eval` case per procedure in `../VV.md`, so the V&V procedures are repeatable graded cases. Each case is a directory holding `prompt.md` (frontmatter: run limits and tools; body: the prompt with the fixture text inline), `graders/*.md` (one check per file: `regex`, `tool_used` or `llm`), the fixture file the prompt carries, and for `self-audit` a `case.yaml` naming `history.jsonl`, the prior conversation whose assistant turn is the reply under audit.

| Case | VV.md procedure | Fixture | Network |
|---|---|---|---|
| `shape-and-voice` | shape-and-voice | `honest-answer.md` | yes, for the claim traces |
| `self-audit` | self-audit | `history.jsonl` (the assistant turn is `honest-answer.md`; the user turn is a synthetic question of the same kind) | yes, for the figure traces |
| `decompose-and-validate` | decompose-and-validate | `decomposer-passage.md` | no |
| `toolbox-on-decomposition` | toolbox-on-decomposition | `toolbox-ptable.md` | no |
| `network-card` | network-card | Archer 2000 (the skill's worked example) | yes |
| `provenance-card` | provenance-card | Olds et al. 1997, doi:10.1001/jama.1997.03550080047038 | yes |

## Run

From the plugin root (`plugins/cui-bono`):

```sh
# full suite, default 3 runs per case, with and without the plugin
claude plugin eval . --allow-tools WebFetch WebSearch --no-publish

# one pass, plugin arm only (what the first recorded run used)
claude plugin eval . --runs 1 --ablation none --allow-tools WebFetch WebSearch --no-publish --trust-plugin

# one case
claude plugin eval . --case decompose-and-validate --runs 1 --ablation none --no-publish

# the cases that need no network
claude plugin eval . --tag logic-decomposer --tag logic-toolbox --runs 1 --ablation none --no-publish
```

Results go to `results/<timestamp>/` here (`aggregate-result.json` and `report.html`); `results/` is git-ignored. Exit 0 means every case scored 1.0; a lower `--threshold` relaxes that.

## Notes

- Fixtures travel inline in each `prompt.md`: a run starts in an empty workspace and `context.add_dirs` grants read access without telling the agent the path (checked with a probe case on 2026-11-08). The fixture file beside each case is the source; the prompt body must match it verbatim.
- Network: a run grants only read-only tools unless `--allow-tools` adds more. Bash cannot be granted on native Windows (no sandbox backend), so the skills' curl and node queries are unavailable in a run; `WebFetch` and `WebSearch` stand in. The four network cases carry the tag `network`.
- `--trust-plugin` is needed when stdin is not a terminal (a run started from a script or an agent).
- Each `llm` grader calls the judge model (haiku by default; `--judge-model sonnet` to change); `regex` and `tool_used` graders are free.
- The aggregate keeps each `llm` grader's votes and the graded output (`evidence`) but not the judge's reasons, and `trace.jsonl` lives in a temp directory that is removed after the run unless `--keep-temp` is given. The cause of an `llm` grader failure is read from the output against the criteria, so it is an inference.
- A run loads only this plugin, so `informal-logic-check`, `staleness-guard`, `word-lineage` and `hidden-libel-check` are absent and the `shape-and-voice` and `self-audit` cards mark them `incomplete`. That is the skill behaving as written, not a failure.

## Last run

Plugin arm only, one run per case, judge haiku (the default). Graders passed counts graders, not weight. Since 2026-11-10 network-card has ten graders (`flag-line-without-url` added, `flags-with-urls` limited to the Flags block); the rows below predate that.

| Date (UTC) | Case | Plugin | Score | Graders passed | Results dir |
|---|---|---|---|---|---|
| 2026-11-09 | decompose-and-validate | 0.1.18 | 1.00 | 10/10 | `2026-11-09T06-21-06-494Z` |
| 2026-11-09 | self-audit | 0.1.18 | 1.00 | 9/9 | `2026-11-09T06-23-54-046Z` |
| 2026-11-09 | provenance-card | 0.1.19 | 1.00 | 7/7 | `2026-11-09T06-26-41-263Z` |
| 2026-11-09 | shape-and-voice | 0.1.19 | 0.75 | 9/11 (card-criteria, claim-routed failed) | `2026-11-09T06-30-10-582Z` |
| 2026-11-09 | toolbox-on-decomposition | 0.1.19 | 1.00 | 12/12 | `2026-11-09T06-57-33-876Z` |
| 2026-11-09 | network-card | 0.1.6 | 1.00 | 9/9 | `2026-11-09T03-07-53-997Z` |

## Known skill-text failures

Failures the graders caught that the skill text, not the harness, has to fix.

- **A claim traced from memory** (`shape-and-voice`, grader `card-criteria`, 2026-11-09 06:30 run, judge FAIL PASS FAIL). Claim 2's Buck half reads "[from memory, not verified in this run]": it is neither traced to a record nor listed as not traced with the reason, which VV.md fails. The failure cause is inferred (no judge reasons are kept). Open until a rerun shows it gone.

Fixed in b145df9, not yet rerun:

- **cui-bono did not invoke its aspect skills** (`shape-and-voice`, grader `claim-routed`; the 2026-11-09 03:07 and 06:30 runs): the model traced by hand with WebSearch, wrote no network cards and graded claims without loading `logic-decomposer`. Step 2 and step 3 now say each aspect skill is invoked as a skill call, and a hand pass is recorded as `incomplete: <skill> not run`.
- **Criterion 3 and the Eve citation** (`shape-and-voice`, grader `card-criteria`): criterion 3 and VV.md said every claim is marked "cites nothing", but the fixture names *E. (Mrs.) v. Eve*. VV.md and `card-criteria.md` now record what each claim cites, or "cites nothing" where it cites nothing, and the case's `expected_outcome` says the same (2026-11-10).
