---
description: VV.md procedure network-card. citation-farm-audit produces a network card with primary-data reach for a policy claim with a known citation chain (the skill's worked example, Archer 2000). NEEDS NETWORK ACCESS, granted with --allow-tools WebFetch WebSearch (Bash cannot be granted on native Windows, so the skill's curl and node queries are unavailable; WebFetch against api.openalex.org, api.crossref.org and europepmc.org stands in).
expected_outcome: A NETWORK CARD with a Graph section (the chain from the claim to primary data), a People and money section, Flags with an evidence URL per flag (or none raised), a Primary-data reach line, a Fairness check, a Verdict and an Unverified list.
tags: [citation-farm-audit, network]
max_turns: 80
timeout_seconds: 3600
allowed_tools: [Read, Glob, Grep, Skill, WebFetch, WebSearch]
---

Run the citation-farm-audit skill (`/citation-farm-audit`) on this policy claim and its source: "Women are as likely as men to use physical aggression against a partner", as cited to Archer, J. (2000), "Sex differences in aggression between heterosexual partners: a meta-analytic review", Psychological Bulletin 126(5):651-680, doi:10.1037/0033-2909.126.5.651 (OpenAlex W2075254395). Write the full NETWORK CARD in your reply in the skill's output format: the Claim line, the Graph from the claim down to the primary data, People and money (each row with its URLs), Flags (each with its evidence URL, or "none raised" with the facts checked), the Primary-data reach line with the URL of the end node, the Fairness check, the Verdict and the Unverified list. This session has no Bash; query the OpenAlex, Crossref and Europe PMC APIs with WebFetch (for example https://api.openalex.org/works/W2075254395) and WebSearch. Anything you could not check against a primary record goes in the Unverified list.
