---
description: "Traces social-science and policy sources to their authors, funders, citation networks and primary data, and writes a verifiable network card and person records."
argument-hint: "[source-or-claim]"
---

# citation-farm-audit

Target or claim: $ARGUMENTS

## Complementary Dovetailing (`cui-bono`)

If the `cui-bono:citation-farm-audit` skill is available in this session, invoke `cui-bono:citation-farm-audit` via the `Skill` tool with `$ARGUMENTS` and follow it in full. Otherwise execute the standalone procedure below directly.

## Standalone Procedure

Run on any policy-relevant source (journal paper, think-tank or NGO report, white paper, government or UN report) before it is cited as evidence, and on any author whose name recurs in three or more sources in the project. No Python; use `curl` or Node 18+ (`${CLAUDE_PLUGIN_ROOT}/scripts/openalex-profile.mjs <OpenAlex-author-id>`).

1. **Build the citation graph, top to bottom:** Trace each factual claim from the policy document down through every cited node until it reaches primary data (dataset, registry, measured outcome), a primary study, or a dead end (uncited assertion, opinion, press release, broken link). Quote the claim at adjacent nodes and mark any edge where a figure changes, rounds up, or drops its qualifier.
2. **Map the people and the money:** Record affiliations, co-authors, advisory/committee seats, declared funding (Crossref `funder`, OpenAlex `funders`/`awards`, NIH RePORTER, NSF, USAspending, US 990 via ProPublica Nonprofit Explorer, Canadian T3010 via CRA), funder stated missions, and role overlaps in the chain.
3. **Assess all eight objective flag patterns (every raised flag requires a resolvable URL):**
   - Closed citation loop
   - Mutual-citation cluster (Fister Jr., Fister & Perc 2016, `https://doi.org/10.3389/fphy.2016.00049`)
   - High self-citation (Ioannidis et al. 2019, `https://doi.org/10.1371/journal.pbio.3000384`)
   - Woozle chain
   - Shared funder
   - Author-reviewer-citer overlap
   - Grey literature promoted to evidence
   - Advocacy-funded justification
   Format every raised flag as `[FLAG] <type>: <one-line fact>  <evidence url>` (or `[FLAG candidate] <type>: <fact>  evidence not retrieved: <what was tried>`). Never emit a bare ID without a resolvable URL.
4. **Primary-data reach:** Classify the end node (`objective | self-report only | opinion only`) with its resolvable URL. Lead with current primary registry/cohort/trial records over pre-registry hand-counted samples; report unadjusted alongside mediator-adjusted figures when adjustment conditions on post-exposure mediators; research every user-supplied fact to its primary record.
5. **Fairness (Folta precedent, `https://doi.org/10.1038/nbt.3384`):** Report verifiable public professional facts only — never motives, labels, or private personal information. Apply identical queries across opposing camps. Funding is a fact to check method and data, never the verdict.
6. **Co-authorship network & forward motion:** Check decade-by-decade co-authors, share of non-co-author top citers, citing fields, and whether works feed instruments, datasets, or replicated studies used outside the immediate cluster. Record `"inside established network"` or `"outside network: new subfield or unverified"` with links; leave the person-record `Flag` column blank for the project author.

## Output Format

```text
NETWORK CARD: <policy document or claim>
Date: <YYYY-MM-DD>   Auditor: <agent/session>

Claim: "<exact text from the policy document>"  <url>

Graph:
  <policy doc> --cites--> <report> --cites--> <paper> --data--> <dataset|NONE>

People and money:
  <name> | <role in chain> | <affiliation> | <funder(s)> | <other seats>  <urls>

Flags:
  [FLAG] <type>: <one-line fact>  <evidence url>
Primary-data reach: objective | self-report only | opinion only  <url of the end node>
Fairness check: same queries run on <opposing camp>: <result>
Verdict: <one or two sentences: what the chain supports and where it stops>
Unverified: <every item not checked against a primary record>
```
