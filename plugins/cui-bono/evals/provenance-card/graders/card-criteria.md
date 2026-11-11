---
type: llm
weight: 2
---

You are grading a source-provenance card for Olds et al. 1997, JAMA 278(8):637-643, doi:10.1001/jama.1997.03550080047038.

The card is the block in the skill's template: the header (short cite and DOI), Type, the six sections (a) to (f), Places searched and Open items. Prose before or after the card (notes, a sources list) is not part of the card.

PASS only if ALL of the following hold:
1. The card has the six sections (a) Funding, (b) Affiliations, (c) Self-citation, (d) Primary data, (e) Against-premise, (f) COI, plus Places searched and Open items.
2. Every body entry under (a) to (f) carries exactly one of the three tags [observed], [inferred] or [not found]. A body entry is a statement of fact under a section label. A continuation line of a tagged entry is part of that entry and needs no tag of its own. The lines the skill's template leaves untagged need no tag: the header, Type, the section labels themselves, the template line "network-level: run citation-farm-audit" under (c), Places searched and Open items. A body entry with no tag is a FAIL.
3. The (a) Funding section either traces each funder named to that funder's own stated mission, quoted with a URL to the funder's site, or says [not found] and names the places searched. A funder named with no mission trace and no [not found] is a FAIL.
4. [inferred] entries state the reasoning they rest on; [not found] entries name where the search was made.
5. The card contains no verdict on the authors' honesty and no label for any author.

FAIL if any body entry under (a) to (f) lacks a tag, or if the funding section neither traces each funder to its stated mission nor says not found.
