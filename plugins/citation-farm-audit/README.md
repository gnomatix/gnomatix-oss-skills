# citation-farm-audit

Checks the social-science and policy sources behind your claims before you rely on them. When a journal paper, think-tank or NGO report, white paper, or government or UN report is about to back a claim, the agent traces who wrote it, who paid for it, who cites it, and whether its chain of citations ever reaches real data. Citation farms, closed citation loops and grey literature passed off as evidence get flagged with the evidence attached. Every side of a debate gets the same checks, and the results are facts you can verify, not labels.

## What you get

- **A network card per claim** (`citation-farm-audit`): the citation graph from the policy document down to its primary data, the people and the money in it (authors, funders, boards, committee seats), the flags raised, where the chain ends (objective data, self-report or opinion), and what was not verified.
- **A person record per recurring name**: degree, thesis and repository link, appointment, funders, organizational roles and network position, each fact with its source. You decide what goes in the flag column.
- **A provenance card per source** (`source-provenance`): funding traced to the funder's own stated mission, author affiliations and career incentives, self-citation counts, the data the claim rests on, whether the method could have come out against its premise, and the declared conflicts set against the record.

## When it runs

- `citation-farm-audit`: whenever a social-science, psychology, criminology, gender-studies or policy source is used as evidence, and whenever an author's name turns up in three or more sources in your project.
- `source-provenance`: whenever any paper, review, report, white paper or government document is pulled as a source. It hands network-level patterns to `citation-farm-audit`.

## How it checks

- Public scholarly and funding records only: OpenAlex, Crossref, Europe PMC, NIH RePORTER, NSF and USAspending award search, ProPublica Nonprofit Explorer (US 990s) and the CRA charity listings (Canadian T3010s).
- No private correspondence, no contact with anyone's employer, no personal details. Person records hold public, professional facts.
- Funding is recorded as a fact and is never the verdict: the data and the method decide whether the work holds up.

## What's inside

- `skills/citation-farm-audit/SKILL.md`: the procedure (citation graph, people and money, flags, primary-data reach, fairness, co-authorship network, forward motion), the person-record fields, the network-card format, the API queries, and a worked example.
- `skills/citation-farm-audit/scripts/openalex-profile.mjs`: one author's citation profile from OpenAlex in one run: top works, co-authors, top citers marked as co-authors or not, self-citations, citing fields, funders. Node 18 or later, no dependencies: `node openalex-profile.mjs <OpenAlex author id>`.
- `skills/source-provenance/SKILL.md`: the six checks, the provenance-card format, the fairness rules, the references, and a worked example.

## Requirements

Node 18 or later (built-in `fetch`) for the profile script; curl for the example queries. No API keys. OpenAlex requests without a key share a small daily budget per IP address, so the skill keeps queries narrow and caches results under `~/.local/share/claude/`.

## Install

```sh
/plugin marketplace add github:gnomatix/gnomatix-oss-skills
/plugin install citation-farm-audit@gnomatix-oss-skills
```

For other agents, the skills are linked from `.agents/skills/`, `.github/skills/` and `.kiro/skills/` at the repo root; see the main README.
