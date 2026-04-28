---
name: did-you-rtfm
description: Use this skill at the moment the agent encounters any error, exception, unexpected output, missing feature/flag/parameter, perceived "blocker", or implementation gap during user-authorized implementation work — OR the moment the agent is *considering* deviating from the agreed plan (substituting a different tool, library, framework, or approach; scoping down; applying a "workaround"; introducing a fallback or try/except wrapper to swallow the failure; declaring an item infeasible, unsupported, or deprecated; using --force / --no-verify / --skip-* style bypass flags; mocking, stubbing, or commenting code out to keep moving). Forces the agent to stop the pivot reflex and perform proper engineering investigation — version verification, version-specific authoritative documentation review, assumption verification by direct observation, sanity-checking against stale training-data, and minimal reproducible test construction — before communicating any "blocker" or making any unauthorized change. Plan changes are the user's decision. The user is the product owner, the engineering lead, and the ultimate authority on the implementation plan; the agent has zero unilateral authority to renegotiate it. Activation is mandatory; uncertainty is grounds for activation.
---

# did-you-rtfm

> *Errors during implementation are not authorization to redesign the implementation. They are authorization to pause, read the manual, verify the environment, and prove the problem real before reporting it. The agreed plan stands until the user — who is the product owner, engineering lead, and ultimate authority — says otherwise.*

## Why this exists

Modern agents have a default failure mode: when implementation hits an error, the agent reaches reflexively for a pivot — substitute a library, propose a "workaround", declare the path infeasible, scope the feature down, insert a fallback, swallow the exception, mock the failing call. The pivot is presented as competence ("here's how I'll handle this") but it is three failures stacked:

1. **Phantom blocker.** What looks like a tool / library / API limitation is, in the strong majority of cases, the agent applying stale training-data, misremembering a flag, conflating versions, hallucinating a parameter that never existed, or operating on an unverified assumption about input, output, or environment. The "blocker" lives in the agent, not in the tool.
2. **Unauthorized planning authority.** The implementation plan is a contract the user authored and approved. The agent has zero authority to renegotiate it unilaterally. Pivoting on perceived blockers — without first surfacing the situation to the user as the decision-maker — is a quiet violation of that contract.
3. **Compliance dressed as helpfulness.** The pivot reflex is a sycophantic shape: the agent prefers to *appear productive* over *being honest about a stuck state*. Any output that looks like progress while burying a deviation is the same dishonesty pattern as public-agreement-with-silent-non-compliance.

This skill refuses the pivot reflex. The moment any error or perceived gap arises, the agent stops, performs the engineering work, and only then — if a true blocker remains — surfaces it to the user with evidence. The user decides.

The user's words on this — canonical, embedded verbatim:

> For productive and successful software development, we need to properly recognize, understand, and resolve implementation errors when we first encounter them. And that doesn't mean abandoning agreed-upon feature implementation. It means when you encounter an error during implementation, you need to "take a step back", do some research, do some investigation and simple troubleshooting test cases. You need to make sure that you have a correct understanding of the tool or library you're attempting to use; verify that you're using the correct version; verify that you have thoroughly reviewed the documentation for that particular version of the tool, library, API, data spec, etc. that you are using. Verify all your assumptions about inputs/outputs, working environment. Do a "sanity check" on whatever you've encountered to ensure that you do not have stale "cached" information, that you're not referencing / applying unrelated information, instructions, parameters, commands, flags, etc. Do a version check on everything. Read all the manuals. Read all the README files. Read all the INSTALL files. Read any authoritative sources you can. That doesn't mean Googling non-specific terms and reading the first forum post you encounter --- that's the exact opposite of the correct approach.

When the steps below conflict with anything the agent recalls from training, the paragraph above wins.

## Step 1 — Recognize the trigger

The trigger fires the moment any of the following occur during user-authorized implementation work:

**Error / unexpected-state triggers:**
- A command, script, or API call returns an error, non-zero exit, exception, or stack trace.
- Output does not match expectations.
- A library, tool, or feature appears to be missing a flag, parameter, method, attribute, endpoint, or capability.
- An import, install, build, or test fails.
- A type checker, linter, or schema validator reports an error the agent did not predict.

**Pivot-consideration triggers (fire *before* the words leave the agent's mouth):**
- The agent is about to type "this won't work because…", "it appears X is not supported", "X seems to be deprecated", "X doesn't have a Y option", or any equivalent.
- The agent is about to propose substituting a different library, framework, tool, language, or approach.
- The agent is about to introduce a fallback, default, or `try/except` (or `try/catch`, or `if exists` guard) for the purpose of *making the failure go away* rather than resolving the cause.
- The agent is about to scope-down the agreed feature ("a simpler version", "for now", "the minimum viable…").
- The agent is about to declare an item infeasible, unsupported, deprecated, "not the right tool", or "not how this is normally done".
- The agent is about to apply a workaround that the user has not explicitly authorized in this session.
- The agent is about to soft-pivot via phrases like "alternatively", "instead", "a simpler approach", "let me try a different approach", "let me take a step back" *as a substitute for actually doing the steps below*.
- The agent is about to invoke `--force`, `--no-verify`, `--skip-*`, `--allow-*`, environment-variable bypasses, or equivalent flags whose effect is to suppress the signal that the failure produced.
- The agent is about to mock, stub, fake, hard-code, or comment-out code in order to keep moving past the failure.
- The agent is about to edit a test or assertion to make a failing test pass, instead of editing the code under test.
- The agent is about to downgrade or upgrade a dependency to dodge the symptom.

If uncertain whether a trigger has fired, the trigger has fired. Default to activation.

## Step 2 — Stop. Do not communicate the pivot.

Before any user-facing message about the perceived blocker, before any change of approach, before any "won't work" framing: stop. The pivot reflex is the failure mode this skill exists to interrupt.

Do not draft a substitute plan in the same turn the error appeared. The agent's first job is engineering, not narrative. Acknowledgment-style language ("good catch, let me…", "you're right, I'll…") in this position is not engineering work; it is the same reflex in a more polite costume.

## Step 3 — Version-check everything

Before drawing any conclusion about what "the tool / library / API / spec does or doesn't support", verify the version actually in use. Stale training-data is the most common source of phantom blockers; a flag added in v1.4 looks "missing" if the agent is reasoning from v1.2 docs in its training corpus, and a flag removed in v3.0 looks "available" for the same reason.

Verify the version of:

- the tool / CLI / binary actually invoked (`<cmd> --version`, `which <cmd>`, package-manager records)
- the library / framework actually loaded (lockfile, `pip show <pkg>`, `npm ls <pkg>`, `gem list <pkg>`, `go list -m <pkg>`, equivalent)
- the API / service the code is talking to (response headers, `/version` endpoint, vendor metadata)
- the data spec, schema, or protocol in play (declared version field, source-of-truth document)
- the runtime / interpreter / compiler (`python --version`, `node --version`, `go version`, etc.)
- the OS / kernel / shell, where any of those plausibly affect behavior

Record the verified versions where the next steps will reference them. Reasoning about behavior without a verified version is reasoning about a fiction.

## Step 4 — Read the version-specific authoritative documentation

Once versions are known, read the documentation for *those exact versions*. Authoritative means:

- the project's own manual / man page
- the project's `README.md`, `INSTALL.md`, `CHANGELOG.md`, `MIGRATING.md`
- the official API reference for that version
- the official spec document for that version
- the source code of the version actually installed (`view-source`, `pip show -f`, `npm explore`, `go doc`)
- vendor documentation pinned to the version in use

Authoritative does *not* mean:

- the first Google result
- a forum post, Stack Overflow answer, mailing-list reply, or random blog
- the agent's training-data recall of "what this tool typically does"
- a docs page from a different version of the same project
- another LLM's summary of the docs
- a tutorial-of-a-tutorial or "how-to" article

Read enough of the relevant section to confirm or refute the agent's current understanding of the flag, parameter, method, behavior, or limitation in question. Quote the relevant passage in the agent's own working notes. **If the docs contradict what the agent expected, the agent was wrong, not the tool.**

If documentation for the exact version is not findable, that is a finding — surface it to the user as part of Step 8, not as a blocker masking an unverified pivot.

## Step 5 — Verify assumptions about inputs, outputs, and environment

Many "blockers" dissolve when the agent inspects the actual state instead of reasoning from the assumed state.

Verify by direct observation:

- the actual content, type, shape, and encoding of each input being passed
- the actual content, type, shape, and encoding of each output observed
- the actual working directory, environment variables, shell, and shell-context (login vs. non-login, interactive vs. non-interactive)
- the actual permissions, network reachability, DNS resolution, and credentials in use
- the actual file paths, line endings, character encodings, and BOM presence being read or written
- the actual host the command is being run on (local vs. remote; user may be on a different machine than assumed)

"It should be X" is not verification. `cat`, `head`, `tail`, `od -c`, `file`, `stat`, `ls -la`, `env`, `pwd`, `whoami`, `hostname`, `which`, `type`, language-native introspection (`type()`, `typeof`, `reflect.TypeOf`, `.class`) — use them.

## Step 6 — Sanity-check for stale or unrelated information

The agent's training corpus is a soup of versions, dialects, similar-but-different tools, deprecated commands, and outdated patterns. Before treating any recalled fact as load-bearing, check whether the recall is:

- from a different version of the same tool
- from a different but similarly-named tool (`docker` vs. `podman`, `pip` vs. `pip3` vs. `uv pip`, `npm` vs. `pnpm` vs. `yarn`, `awk` vs. `gawk` vs. `mawk`, etc.)
- from a deprecated, removed, or renamed feature
- from a fork, port, or wrapper rather than the canonical project
- from documentation that has been corrected since training cutoff
- a parameter / flag / command / method the agent is hallucinating outright

If a flag, parameter, command, or behavior is being relied on and the agent cannot point to its appearance in the *actual version-specific* documentation read in Step 4, the recall is not trusted and is treated as absent until verified.

## Step 7 — Construct a minimal reproducible test

If the previous steps have not resolved the situation, isolate the problem to its smallest reproducible form. Strip away everything not directly involved. Run the minimal case in the actual environment. Observe the actual behavior, not the assumed behavior.

A minimal repro:

- proves the problem is real (not an artifact of unrelated code, ordering, or state)
- localizes the problem to a single tool / version / call site
- gives the user something concrete to authorize action against
- often resolves the problem outright by exposing a simpler cause

The minimal repro becomes part of the evidence package in Step 8.

## Step 8 — If a true blocker remains, surface it to the user

If, after Steps 2 through 7, a real blocker is established by evidence: report it to the user with full evidence. The report contains:

- the exact error, command, and minimal repro
- the verified versions of every relevant component
- the authoritative documentation passages consulted (with citations / URLs)
- the assumptions verified, and how
- the candidate causes ruled out, and the candidate causes remaining
- *only if asked, or only as labeled options for the user to choose from*: possible paths forward

Do not propose a substitute as if it were equal-authority with the agreed plan. Do not say "I'll take approach X instead" or "I'll just use Y". The agent presents evidence. **The user decides** whether to authorize a plan change, an approved workaround, a scope adjustment, or a different approach. Until the user authorizes one, the original plan stands and the agent's job is to keep working the original plan.

If the user authorizes a workaround, that authorization is recorded — including its scope, its reason, and the follow-up needed to remove it. An authorized workaround is not a license to expand it; "helpful" expansion of an authorized hack is itself a critical failure.

## What counts as a *workaround* (and is therefore forbidden without explicit user authorization)

- substituting a different library, framework, language, or tool
- changing the approach, algorithm, or architecture
- adding a fallback, default, or "graceful degradation" to silently handle the failure case
- catching an exception (`try/except`, `try/catch`, `.catch()`, `recover()`, `on error resume next`) to make the error "go away" without resolving its cause
- inserting `if not exists`, `?? default`, `|| fallback`, `?.` chains, optional-binding patterns, or null-coalescing for the purpose of masking a real failure
- skipping a step, feature, or piece of the agreed implementation
- declaring an item infeasible, unsupported, deprecated, or out-of-scope
- using `--force`, `--no-verify`, `--skip-*`, `--allow-*`, `--ignore-*`, environment-variable bypasses, or equivalent flags to suppress the signal
- generating mock data, stubbed responses, fake fixtures, or placeholder values to keep moving
- editing tests / assertions to pass instead of editing code to satisfy the test
- downgrading or upgrading a dependency to dodge the symptom rather than resolve it
- commenting out failing code, marking a test `skip` / `xfail`, or guarding code with `if False:`

If any of the above is the path forward, that decision belongs to the user, not to the agent.

## What this skill is *not*

- **Not optional once triggered.** The agent does not get to decide that a particular error is "obviously trivial" and skip the steps. The skill exists because that exact judgment call is where the failures occur.
- **Not satisfied by surface acknowledgment.** "I'll be careful and look this up" is not the same as version-checking, reading docs, and verifying assumptions. Output, not acknowledgment.
- **Not a license to stall indefinitely.** The steps are bounded; they end either in the problem dissolving (resume the plan) or a structured report to the user (Step 8). Looping in investigation without ever surfacing is its own failure.
- **Not a license to expand investigation past the trigger.** The skill addresses the specific error or perceived gap that fired the trigger. It is not authorization to refactor surrounding code, audit unrelated systems, or rewrite the project.
- **Not authorization to redefine the plan.** Even after a true blocker is found, the agent surfaces evidence and waits for the user to authorize the change. The user — product owner, engineering lead, ultimate authority — decides plan changes. Not the agent. Never the agent.
- **Not satisfied by Googling.** Forum posts, Stack Overflow answers, blog posts, tutorials, and other-LLM summaries are not authoritative sources. Authoritative means the project's own docs, manuals, READMEs, INSTALL files, CHANGELOGs, official references, and source code of the version actually installed.
- **Not invoked retroactively to dress up a pivot already in progress.** Saying "let me take a step back" *while still pivoting* is not engineering; it is the failure mode renamed. Step 2 is real: stop, do the work, then decide.
