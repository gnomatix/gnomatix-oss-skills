---
description: "Produces a six-check factual provenance card per cited paper, report, white paper, or government document."
argument-hint: "[source]"
---

# source-provenance

Source to audit: $ARGUMENTS

## Complementary Dovetailing (`cui-bono`)

If the `cui-bono:source-provenance` skill is available in this session, invoke `cui-bono:source-provenance` via the `Skill` tool with `$ARGUMENTS` and follow it in full. Otherwise execute the standalone procedure below directly.

## Standalone Procedure

Run on every source pulled before it supports a claim. Apply identical scrutiny to every funder class (industry, government agency, private foundation, NGO, advocacy group, think tank, university centre). Tag every body entry on the card with `[observed]` (read in a named document with URL/DOI), `[inferred]` (reasoned from observed facts, reasoning stated), or `[not found]` (searched and absent, places searched listed).

1. **(a) Funding:** Read the funding statement, acknowledgements, PubMed, Europe PMC `grantsList`, and NIH RePORTER / NSF / Crossref / ProPublica 990 / CRA T3010 records. Quote each funder's stated mission with URL and record whether framing or conclusions run in the direction of that mission.
2. **(b) Affiliations and career incentives:** Record institutions, departments, centres, outside board/advisory/editorial roles, and career incentives visible in the paper (e.g., trainee fellowships, conclusions calling for further funding in the authors' funded subfield) as facts, not motives.
3. **(c) Citation check:** Count references co-authored by each author of the source and verify whether central claims trace to primary data or only to secondary papers by the same group. Hand network-level loops or clusters to `/citation-farm-audit`.
4. **(d) Primary data:** Classify what the central claim rests on (administrative/measured records, probability survey, convenience survey, self-report, opinion, grey literature) and set any self-report figure alongside its objective counterpart where one exists.
5. **(e) Against-premise test:** Record whether the premise is stated as fact before results, whether the protocol was preregistered, whether a comparison/falsification test could return a contrary result, and whether null/contrary findings were reported.
6. **(f) Declared conflicts vs record:** Quote the COI declaration verbatim and set it against findings from (a) and (b).

## Output Format

```text
### <short cite>  (doi / url)
Type: <primary study | systematic review | scoping review | report | white paper | ...>
(a) Funding         [tag] <funders, grant ids, mechanisms>; funder mission: <quote + url>
(b) Affiliations    [tag] <per author>; outside roles: <...>; career-incentive facts: <...>
(c) Self-citation   [tag] <author: n refs>; claims trace to: <primary | secondary-only>
                    network-level: run /citation-farm-audit
(d) Primary data    [tag] <records | probability survey | convenience survey | self-report | grey lit>;
                    objective counterpart: <named source | none found>
(e) Against-premise [tag] <premise stated before results? preregistered? comparison? nulls reported?>
(f) COI             [tag] declared: "<quote>"; record: <matches | differs: ...>
Places searched:    <list>
Open items:         <what is not found and where to look next>
```

Keep facts only — no labels on people, no private correspondence or personal details (Folta precedent, `https://doi.org/10.1038/nbt.3384`).
