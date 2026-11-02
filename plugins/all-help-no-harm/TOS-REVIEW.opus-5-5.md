# Anthropic terms: internal consistency review (independent cross-check, Claude Opus 5.5)

**Reviewer model:** Claude Opus 5.5 (model ID `claude-opus-5-5`), running as an independent subagent. No other reviewer's output was read.
**Review date:** 2026-11-02.
**Nature of this document:** a document review for internal consistency. It is not legal advice.

## Provenance

All sources are the copies retained in `reference/vendor-terms/2026-10-27/`. Dates, URLs, fetch times and hashes are taken from that directory's `MANIFEST.md`. On 2026-11-02 the reviewer recomputed every sha256 below with `sha256sum`, and all of them match the MANIFEST.

| Short name | File | Effective / published, as printed | Fetched (UTC) | sha256 |
|---|---|---|---|---|
| **UP** (Usage Policy) | `usage-policy.pdf` (authoritative); `usage-policy.txt` (extraction) | Effective Nov 12, 2026 | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | PDF `1cc40f9d4a56262fe973869ea5fd35242a923f6fb8c3f2464609ca05545aeaa5`; txt `af6b81e2c575452df5d4b625bedc84fb2c87b6087ed642512b1f95a60c05d0c3` |
| **CT** (Consumer Terms of Service, **Canada variant**) | `consumer-terms.pdf`; `consumer-terms.txt` | Effective Oct 8, 2025 | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | PDF `29a15ceb1f1093190fb197827033e1c47e553b3aaeb1815d38f7fb802e71d38e`; txt `43bc8e6acf4fe4fa7c76cf87a96ef71eee4b6220740204d789228a3db9959888` |
| **ComT** (Commercial Terms of Service) | `commercial-terms.pdf`; `commercial-terms.txt` | Effective Jun 17, 2025 (republished 2026-03-11 as a formatting update) | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | PDF `af5032c44336929c06722809e2a29a421175837d91be0de149d3462f1fd3e270`; txt `c0c9c9479702720afdcf6f6ac48f0f1eb00d2e6981532cf3d1a93ff01bc60924` |
| **NEWS** ("2026 Usage Policy update") | `news-2026-usage-policy-update.html`; `.txt` | Published Oct 8, 2026 | 2026-10-27T19:36:49Z | html `5a3d7fd63a4f87b5baf1016919e96e00cf5a555113259e2d61ab8e8fc98258e9`; txt `49416006e6fce839c93a4f3c477c57b8269a2c80dd577aa664c22a93f7521d7f` |
| **RES** ("Claude Opus 4 and 4.1 can now end a rare subset of conversations") | `research-end-subset-conversations.html`; `.txt` | Published Aug 15, 2025 | 2026-10-27T19:36:49Z | html `7b2a2297f2caa04b9a152613de93fe53d798c21b3a699b9ced014c28e0df19e7`; txt `67aad4e46577bb613168f4af80b98e8b37611652b0fe95e56366e43a0b20054f` |
| **Prior UP** (supplementary, not a listed source) | `skills/all-help-no-harm/vendor-docs/anthropic/usage-policy.md` | Prior version, effective 2025-09-15 per MANIFEST; fetched 2026-05-29 per MANIFEST | n/a | md `5e5ff7a8908f3755ebc2f371774aa90d22d1f7aba0633daf8ac5b680e435f68f` (computed by the reviewer; not in MANIFEST) |

**How locations are given.** "p." is the PDF page and "l." is the line in the `.txt` extraction, for example "UP p.6, l.211". Section names are quoted as printed. The two posts have no pages, so they are cited by `.txt` line.

**How quotations are made.** Quotations are exact. Where `pdftotext` dropped a space (for example `orActions` in CT l.136), the space is restored. Where a sentence runs across lines, a page break or a hyperlink break, the lines are joined with a single space. The extraction's page-number footers and end-of-line hyphen breaks (for example `sign-` / `up`) are dropped, and a space that a link break leaves before punctuation is removed. Apostrophes and quotation marks follow the source, so some are curly and some are straight. Every quotation in the "Texts quoted exactly" lists was checked mechanically against the extractions on that basis, and all 153 fragments matched.

**Cross-reference.** `WTF-Dario-LOL-W0T.md`, section "Analysis (the repository's position)", is the repository's established analysis of the UP clause on behavior toward the models. Findings that touch it cite it by point number. That analysis is not restated here, and nothing in this review is attributed to the repository owner beyond that citation.

## Method

**Reading.** The reviewer read all seven sources in full (UP, CT, ComT, NEWS, RES, MANIFEST, and the "Analysis" section of `WTF-Dario-LOL-W0T.md`) before drafting. Each candidate finding was then checked against the exact text. For one point, the change in the enforcement standard, the reviewer also read the prior UP copy that MANIFEST points to. That copy is used only as a supplementary source, and every use of it is labelled.

**Skills and tools invoked, and what each contributed.**

| Tool | Invoked | Contribution | Limits encountered |
|---|---|---|---|
| Skill `legal:review-contract` | Yes | Supplied the clause-category checklist: liability cap, indemnity, IP and Outputs, data and training, termination, governing law, assignment, force majeure, and payment and fee changes. Each category was swept across CT and ComT from the non-drafting party's side. Its redline step is the source of each finding's "What a coherent version would have to say". | No organizational playbook exists (`legal.local.md` was not found), so the baseline is generic commercial practice. The skill's "gather context" step expects interactive answers, and this subagent has no question tool, so the side (user or customer, the non-drafting party) and the focus (internal consistency) were taken from the review brief. There was no CLM connector, so the routing step was skipped. |
| Skill `legal:legal-risk-assessment` | Yes | Supplied the severity × likelihood framework used in the risk register below. The register scores risk to the non-drafting party. | The likelihood scores are the reviewer's judgments from the text alone. No enforcement data was available. |
| Skill `legal:compliance-check` | Yes | Framed the question "can a user determine, from these documents, what compliance requires?" The answer is the compliance-determinability table below. The skill's privacy overview also flagged that Canada's PIPEDA bears on F14. | PIPEDA and other Canadian law were not assessed (see Limits). |
| Skill `anthropic-skills:informal-logic-check` | Yes | Run over the drafted findings as a self-audit (its Phase 0) and as a fallacy check on the draft (its Phase 2, step 10). It found 18 defects in the reviewer's own draft, all fixed before this version (listed under "Logic check" below). | Its Phase 1 confirms premises with the author. The author of the documents (Anthropic) is not present, so that phase was replaced by quoting every premise exactly from the source. |
| CourtListener MCP (`search`, `search_document`) | Yes | Case existence, court, year and URL for every case cited. Holdings were checked with `search_document` against the opinion text for 13 of the 15 cases: *Badie*, *Harris*, *Zappos*, *Armendariz*, *Ladas*, *Shaw*, *Mercuro*, *Douglas*, *Sandquist*, *Mastrobuono*, *PG&E*, *Nguyen* and *Lamps Plus*. *Specht*'s holding was checked only as quoted in *Nguyen*. *Perdue* was checked only through *Badie*'s reliance on it. | The API allows 5 requests per minute and 50 per hour. Both limits were hit (HTTP 429). The review waited out one hourly window, about 26 minutes, to finish the checks. While blocked, WebFetch on the public CourtListener opinion pages returned empty content, and Justia returned HTTP 403, so neither was used as a source. |
| Skill `forbidden-output-guard-local` | Yes (loaded) | Run as a gate on this file before writing. | n/a |

**Not available or not used.** Several MCP servers failed to connect at session start: github, desktop-commander, pdf-viewer, huggingface-skills and definite. None of them is a legal tool. The legal research connectors CoCounsel, Harvey, Midpage, Descrybe, Courtroom5 and Lawve appear only as "authenticate" tools, meaning they were not authenticated in this session, so they were not used. Statutes cited (for example Cal. Civ. Code § 1654) are labelled as statutes and were not checked through CourtListener.

**Severity scale used in the findings.** **High:** the conflict changes what a user may do, what the user risks, or which text binds, and it touches the model-abuse clause, enforcement, termination, notice or governing law. **Medium:** a real conflict whose effect is narrower or depends on facts. **Low:** a drafting defect that a reader can resolve but the text does not.

### Risk register (from `legal:legal-risk-assessment`; risk to the non-drafting party)

A finding's severity measures how far the conflict reaches. The register measures the risk to the user that follows from it, so the two can differ. F13, for example, is a High finding but a YELLOW risk.

| Finding | Severity (1–5) | Likelihood (1–5) | Score | Level |
|---|---|---|---|---|
| F2 enforcement mechanism | 4 (loss of account access; ComT customer loses all access for one User's conduct) | 3 | 12 | ORANGE |
| F9 three enforcement thresholds | 4 | 3 | 12 | ORANGE |
| F10 post-assent obligations by posting | 3 | 5 (it has already happened: the clause is new) | 15 | ORANGE |
| F3 undefined terms of the clause | 4 | 3 | 12 | ORANGE |
| F14 opt-out defeated by reporting | 3 | 4 | 12 | ORANGE |
| F1 announced limits not binding | 3 | 4 | 12 | ORANGE |
| F13 Canadian law preserved and waived | 3 | 2 | 6 | YELLOW |
| F17 Output assignment conditional | 3 | 2 | 6 | YELLOW |

### Compliance determinability (from `legal:compliance-check`)

| # | What a user needs to know | Determinable from the documents? | Finding |
|---|---|---|---|
| 1 | Which Terms govern a given product or access method | Partly. API keys, Claude Code and entities on Claude.ai are unclear. | F26 |
| 2 | Which version of the UP binds | No. The CT incorporates whatever is currently posted, with no version fixed. | F10 |
| 3 | What notice of change is owed | CT: posting suffices. ComT: 30 days and no retroactivity. | F10, F11 |
| 4 | What standard Anthropic must meet before enforcing | No. Three different standards appear. | F9 |
| 5 | What conduct the model-abuse clause prohibits | No. The terms are undefined, and the narrowing appears only in a non-binding post. | F1, F3, F4, F5 |
| 6 | How the clause is enforced | No. The post and the policy conflict. | F2 |
| 7 | Which text wins in a conflict | No. There is no order of precedence. | F18 |
| 8 | Consequences of a violation | Partly. Termination, refund forfeiture (CT), a cloud on title to Outputs, and pre-conceded injunctive relief (CT). | F17, F24 |

### Clause sweep (from `legal:review-contract`; generic baseline, non-drafting party's side)

| Category | CT | ComT | Note |
|---|---|---|---|
| Limitation of liability | RED: greater of six months' fees and $100; one-way | YELLOW: 12 months' fees; mutual | F8, F33 |
| Indemnity | RED: user-only, covers "ALLEGED" breach and use | YELLOW: mutual, IP indemnity for paid use | F8, F23 |
| IP and Outputs | YELLOW: assignment conditional, "if any" | YELLOW: "owns" vs "(if any)" | F17 |
| Data and training | RED: default training, opt-out exceptions | GREEN: no training on Customer Content | F14 |
| Termination and suspension | RED: on belief, no notice, no refund | YELLOW: 30 days with cure, but suspension on belief | F9 |
| Changes to terms | RED: posting suffices | YELLOW: 30 days | F10, F11 |
| Governing law and forum | RED: Canadian law preserved and then waived | YELLOW: mutual, arbitration | F13 |
| Assignment | YELLOW: one-way, stated as such | YELLOW: one-way exception, stated | none |
| Force majeure | Absent | GREEN: mutual | none |
| Fee changes | YELLOW: two inconsistent mechanisms | YELLOW: 30 days | F27 |

### Logic check (from `anthropic-skills:informal-logic-check`)

Each defect below was found in the reviewer's own draft and fixed in this version.

| # | Finding | Defect in the draft | Fix |
|---|---|---|---|
| 1 | F5 | **False dilemma:** "two readings, and they cannot both hold". The readings can combine. | Added reading (c), "both", and showed that each reading runs into a problem. |
| 2 | F5 | **Overstatement:** "RES reports none specific to (b)". RES does mention "abuse". | Now states that RES mentions abuse but gives examples only of harmful requests. |
| 3 | F6 | **Non sequitur:** the possessive "our" (property) was said to conflict with "cruel" (victim). The same section protects animals from cruelty, and animals are owned. | Claim withdrawn. F6 recast and downgraded from High to Medium. |
| 4 | F6 | **Overstatement:** "the lead-in no longer limits anything". | Changed to "the lead-in adds no limit of its own". |
| 5 | F7 | **Overstatement:** Anthropic "relies ... on a kind of statement it tells users is unreliable". The CT asks users to confirm Outputs independently, and RES combined self-reports with behavioral observation. | Recast as two points: the predicate is unestablished (tension), and enforcement is by a disclaimed actor (conflict). Added the alternative "disposition" reading of "cruel". |
| 6 | F2 | **Overstatement:** the title said the mechanism "does not exist" on "most surfaces". The documents only fail to describe it. Also, "primary" is not "exclusive". | Title changed to "not described for several categories of users". The finding is now a conflict only where the mechanism is not described, and a tension elsewhere. |
| 7 | F8 | **Straw man risk:** RES's "prioritize user wellbeing" was treated as a general mutuality claim. It is made about conversation-ending. | Its context is now stated, and the finding is labelled a tension. |
| 8 | F9 | **Non sequitur:** permissive grants with different thresholds do not logically exclude each other. | Reframed: the lowest threshold controls and bypasses the stated protections. |
| 9 | F10 | **Characterization:** "less sophisticated party". | Changed to "the consumer". The finding is labelled a tension, since courts limit rather than void such clauses. |
| 10 | F10 | **Unverified authority:** "Courts often enforce change-by-posting clauses". | Replaced by a statement tied to the cited cases. |
| 11 | F12 | **Weak inference:** the "or is not limiting" remedy sentence. | Removed. Added the reading a court might adopt, and why it does not resolve the point. |
| 12 | F13 | **Missing counter-reading:** the exception might override the waiver. | Harmonizing reading stated, and why the text does not support it. |
| 13 | F13 | **Unverified authority:** "provincial consumer-protection statutes, which commonly bar such waivers". | Removed. |
| 14 | F14 | **Overstatement:** called a conflict, but the CT discloses the exceptions. | Labelled a tension across documents. |
| 15 | F17 | **Over-broad label:** all four items were called a conflict. | Item 1 is a conflict; items 2–4 are tensions. |
| 16 | F19 | **Cherry-picking / false dilemma:** the UP's second stated purpose, "responsible use", was omitted. | Both purposes now quoted, and the finding rests on the rationale-versus-remedy point. |
| 17 | F22, F24, F31 | **Overstatements:** "consists largely of"; "irreparable harm to Anthropic" (the clause names no one); "those lines of business are prohibited". | Each corrected to what the text supports. |
| 18 | All | **Unverified authority:** case holdings were stated in the findings without being checked. | After the CourtListener hourly window reset, 13 of 15 holdings were checked against the opinion text, and the findings now quote the matched language. *Specht* and *Perdue* are marked as checked only indirectly. |

## Summary: the ten most consequential findings

1. **[F1](#f1)** The limits Anthropic announced for the model-abuse clause ("only in extreme cases", "no discernible purpose", exclusions for pushback, dark creative themes and testing) are absent from the binding text. Both contracts' integration clauses exclude the announcement.
2. **[F2](#f2)** The announcement names conversation-ending as the "primary enforcement mechanism". The binding policy never mentions it, and attaches warning, throttling, suspension and termination on suspicion on every surface, including API and cloud surfaces where no conversation-ending is described.
3. **[F9](#f9)** The same enforcement action carries three incompatible thresholds: "suspect that you may have violated" (UP), "believe that you have breached" (CT), and material breach with 30 days' notice and cure (ComT). There is no precedence rule.
4. **[F10](#f10)** The Consumer Terms bind the user, by posting alone, to an obligation that did not exist when the user agreed, through a policy the contract names by an alias. Business customers get 30 days' notice and non-retroactivity; consumers get neither.
5. **[F3](#f3)** "Sustained", "needless", "abusive", "cruel" and "behavior" are undefined. The vendor's own glosses ("repeatedly", "persistently", "no discernible purpose") substitute different tests.
6. **[F4](#f4)** The announcement says the clause does not reach "pushback". The research post's documented trigger is users who "persisted ... despite Claude repeatedly refusing", which is what pushback against a wrong refusal looks like.
7. **[F5](#f5)** "Such abuse": the research evidence concerns requests for harmful content aimed at third parties, while the clause concerns behavior "toward our models". The announcement joins the two under one word.
8. **[F7](#f7)** The clause's primary enforcer, by Anthropic's account, is the model's own judgment, which the contract tells users is unreliable. The clause's factual predicate (can a model be treated cruelly?) cannot be established by the user, and Anthropic calls its own view "highly uncertain".
9. **[F13](#f13)** The Canada variant preserves Canadian law where it "requires otherwise", and the next sentence waives "any claims that may arise under the laws of other jurisdictions".
10. **[F11](#f11)** The Commercial Terms say they are construed "with neither party considered the drafter", in a contract that only Anthropic may amend, by posting.

## Findings

Findings are numbered in draft order, which was by severity. F6 was downgraded to Medium by the logic check and keeps its number. Each finding's "Why they conflict" field ends by saying whether the problem is a **conflict** (the texts cannot both be applied as written) or a **tension** (both can be applied, but one undercuts what the other states or promises). Where a finding cites a case whose holding is marked UNVERIFIED in the case table, the finding rests on the doctrine named, not on a holding the reviewer checked.

<a id="f1"></a>
### F1. The announced limits on the model-abuse clause are not in the binding text

- **Severity:** High
- **Class:** E (also D)
- **Documents and locations:** UP p.6, l.211 (heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct"); NEWS l.57–58 (section "Addressing abusive behavior toward our models"); CT p.1, l.8–9 (preamble); CT p.11, l.384–385 (§12 "Entire agreement"); ComT p.2, l.61–65 (D.2); ComT p.12, l.396–400 (M.9).
- **Texts quoted exactly:**
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
  - NEWS l.58: "We’ve added a prohibition on sustained and needless abusive or cruel behavior toward our models. The policy update is meant to apply only in extreme cases, where users repeatedly act cruelly toward our models, with no discernible purpose. It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."
  - CT l.8–9: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy."
  - CT l.384–385: "Entire agreement. These Terms and any other terms expressly incorporated by reference form the entire agreement between you and us regarding the subject matter of our Terms."
  - ComT l.396–400: "These Terms (including the Usage Policy, Supported Regions Policy, Service Specific Terms, DPA, Model Pricing Page and other documents or terms that are incorporated by reference by these Terms) constitute the parties’ entire understanding as to the Services’ provision and use. These Terms supersede all other understandings or agreements between the parties regarding the Services."
- **Why they conflict:** The announcement narrows the clause in four ways the policy text does not:
  1. "only in extreme cases" restricts the clause to extreme cases. The policy has no such restriction.
  2. "repeatedly" replaces "sustained", and the two are not the same test.
  3. "with no discernible purpose" replaces "needless". This moves the test from whether the conduct had a need to whether an observer can discern a purpose (see F3).
  4. Four categories are excluded outright: frustration, pushback, dark creative themes, and model testing and research.

  The clause the user is bound by is the policy text, because both contracts incorporate the policy and neither incorporates the announcement. Both integration clauses then declare the incorporated documents to be the entire agreement. The user is therefore told one scope by the vendor's explanatory post and bound to a broader scope by the contract. The post can be edited or withdrawn without triggering either contract's change procedure. This is a conflict between the stated scope and the binding scope.
- **Doctrine implicated:**
  - *Pacific Gas & Electric Co. v. G. W. Thomas Drayage & Rigging Co.* (Cal. 1968): the test for extrinsic evidence is "whether the offered evidence is relevant to prove a meaning to which the language of the instrument is reasonably susceptible" (verified in the opinion text). The post may therefore be offered to interpret "needless", but it cannot add limits the words will not bear, such as "only in extreme cases". https://www.courtlistener.com/opinion/1161440/pacific-gas-electric-co-v-g-w-thomas-drayage-rigging-co/
  - Contra proferentem: *Mastrobuono v. Shearson Lehman Hutton, Inc.* (U.S. 1995), https://www.courtlistener.com/opinion/117907/mastrobuono-v-shearson-lehman-hutton-inc/ ; and *Sandquist v. Lebo Automotive, Inc.* (Cal. 2016), applying Cal. Civ. Code § 1654 (statute), https://www.courtlistener.com/opinion/4242578/sandquist-v-lebo-automotive-inc/
- **What a coherent version would have to say:** The limits would sit in the policy bullet itself. For example: "Repeatedly, within a conversation and after the model has asked you to stop, direct insults or degradation at the model that serve no task, test, research or creative purpose. This does not cover frustration, criticism, disagreement with outputs or refusals, dark or violent fiction, or testing and research."

<a id="f2"></a>
### F2. The announced "primary enforcement mechanism" is not in the policy and is not described for several categories of users the clause binds

- **Severity:** High
- **Class:** E (also B)
- **Documents and locations:** NEWS l.59–61; RES l.26, l.42; UP p.1, l.5–10 and l.32–34; CT p.11–12, l.387–393 (§12 "Termination"); ComT p.6, l.180–193 (I.3.a, I.3.b).
- **Texts quoted exactly:**
  - NEWS l.59–61: "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code. Such abuse is the main focus of this update; Claude’s ability to end these interactions will remain the primary enforcement mechanism."
  - RES l.26: "We recently gave Claude Opus 4 and 4.1 the ability to end conversations in our consumer chat interfaces."
  - RES l.42: "When Claude chooses to end a conversation, the user will no longer be able to send new messages in that conversation. However, this will not affect other conversations on their account, and they will be able to start a new chat immediately. To address the potential loss of important long-running conversations, users will still be able to edit and retry previous messages to create new branches of ended conversations."
  - UP l.5–10: "Our Usage Policy (also referred to as our “Acceptable Use Policy” or “AUP”) applies to anyone who submits inputs to Anthropic’s products or services, all of whom we refer to as “users.” This includes individuals using our apps (such as Claude.ai and Claude Code), developers and businesses using our API and developer platforms, customers accessing Claude through cloud providers and authorized resellers, and the end users of products or services integrating Claude."
  - UP l.32–34: "Anthropic’s Safeguards Team implements detection and monitoring to enforce our Usage Policy. If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services."
  - CT l.387–393: "We may suspend or terminate your access to the Services (including any Subscriptions) at any time without notice to you if we believe that you have breached these Terms, or if we must do so in order to comply with law. If we terminate your access to the Services due to a violation of these Terms and you have a Subscription, you will not be entitled to any refund."
  - ComT l.180–183: "Anthropic may suspend Customer’s access to any portion or all of the Services if: (a) Anthropic reasonably believes or determines that ... (ii) Customer or any User is using the Services in violation of Sections D.1 (Compliance), D.2 (Policies and Service Terms) or D.4 (Use Restrictions)"
  - ComT l.191–193: "Anthropic will have no liability for any damage, liabilities, losses (including any loss of data or profits), or any other consequences that Customer may incur because of a Service Suspension."
- **Why they conflict:**
  1. The policy's list of remedies applies to every bullet, and l.211 has no carve-out. Nothing in the binding text makes conversation-ending primary, or even mentions it.
  2. The mechanism the announcement calls primary is described only for two models in consumer chat interfaces (RES), extended to Claude.ai and Claude Code (NEWS). The clause binds API developers, cloud-provider customers and the end users of integrating products (UP l.5–10). For those users no conversation-ending is described, so the only enforcement the documents provide is account action by the Safeguards Team. Under ComT I.3.a(ii) that action can fall on the Customer for any one User's conduct, with "no liability". On those surfaces the announcement's ordering is reversed.
  3. RES describes conversation-ending as local and non-exclusionary: other conversations are unaffected, a new chat can start immediately, and ended conversations can be branched. The policy treats the same conduct as grounds for account-wide suspension or termination on suspicion, and the CT adds forfeiture of any subscription refund.

  "Primary" does not mean "exclusive", so on the two consumer surfaces the account-level remedies can coexist with the announcement as secondary remedies. There, the gap is that the binding text gives the "primary" mechanism no priority and does not mention it at all, which is a tension. On the surfaces where no conversation-ending is described, the announcement's statement cannot be true, which is a conflict.
- **Doctrine implicated:** Discretionary contractual power is limited by the implied covenant of good faith: *Perdue v. Crocker National Bank* (Cal. 1985), https://www.courtlistener.com/opinion/1153673/perdue-v-crocker-national-bank/. For implied limits on one-sided powers measured against the parties' original bargain, see *Badie v. Bank of America* (Cal. Ct. App. 1998), https://www.courtlistener.com/opinion/2301472/badie-v-bank-of-america/
- **What a coherent version would have to say:** "Violations of this item are addressed by the model ending the conversation. Anthropic will not warn, throttle, limit, suspend, or terminate an account on the basis of this item alone." Alternatively, the policy could name the surfaces where conversation-ending exists and the remedy that applies everywhere else.

<a id="f3"></a>
### F3. The clause's operative words are undefined, and the vendor's own glosses substitute different tests

- **Severity:** High
- **Class:** D (also E)
- **Documents and locations:** UP p.6, l.211; NEWS l.58; RES l.26, l.36–38, l.40, l.42; UP p.17, l.591–593 ("Agentic use cases"); UP p.2, l.37–38; UP p.11, l.360.
- **Texts quoted exactly:**
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
  - NEWS l.58: "where users repeatedly act cruelly toward our models, with no discernible purpose"
  - RES l.26: "This ability is intended for use in rare, extreme cases of persistently harmful or abusive user interactions."
  - RES l.40: "Claude is only to use its conversation-ending ability as a last resort when multiple attempts at redirection have failed and hope of a productive interaction has been exhausted"
  - RES l.42: "users will still be able to edit and retry previous messages to create new branches of ended conversations."
  - UP l.591–593: "Agentic use cases must comply with the Usage Policy. Users are responsible for ensuring that agents they build or deploy, including actions those agents take through tools, browsers, or connected systems, comply with this Usage Policy."
- **Why they conflict:** None of the five operative words is defined in any of the documents.
  - **"Sustained"** has no unit. It could mean a number of messages, one conversation, many conversations, one account, or branches created by edit-and-retry (RES l.42). NEWS says "repeatedly" and RES says "persistently" and "multiple attempts at redirection". These are three different measures.
  - **"Needless"** does not say whose need counts. NEWS's "no discernible purpose" is an observer's test: a purpose the user really has, but Anthropic or the model cannot discern, fails the gloss while passing the text.
  - **"Abusive" and "cruel"** have no threshold. "Cruel" also depends on the target's capacity to suffer (see F7).
  - **"Behavior"** has no stated limits. Fiction, role-play, test prompts and generated content are not excluded in the text. Only NEWS excludes "dark creative themes".
  - **The actor** is not limited to a human. UP l.591–593 makes users answerable for their agents' actions. An orchestrating agent that sends hostile messages to a model, including another Claude instance, is "behavior toward our models" that the user answers for. An automated adversarial evaluation repeats by design, so it is "sustained", and its purpose may be known only to its operator.
  - **"Harmful"**, the word that sets the trigger in the related texts, is also undefined. The UP prohibits "instructing the model to produce harmful outputs" (l.360), and RES's trigger is "harmful requests" (l.36–38). Per F4, the model decides what qualifies.

  With every operative word undefined, a user cannot tell from the text whether given conduct is inside or outside the clause. Whether it applies depends on judgments, by the model and by the Safeguards Team, that the user cannot predict. The gap between this text and NEWS's narrower "only ... extreme cases" is F1's conflict and is not counted again here. The defect recorded here is the indefiniteness of the text itself, which defeats the clause's function of telling the user what is prohibited. This is a conflict between the clause's form, a prohibition, and its content, which supplies no determinable standard.
- **Doctrine implicated:** Contract indefiniteness, meaning a term too uncertain to fix what performance is required: *Ladas v. California State Automobile Ass'n* (Cal. Ct. App. 1993), https://www.courtlistener.com/opinion/2269931/ladas-v-california-state-automobile-assn/ . *Ladas* held an alleged promise "too vague and indefinite to give rise to an enforceable contractual duty", and restated the rule that a contract "so uncertain and indefinite that the intention of the parties in material particulars cannot be ascertained" is "void and unenforceable" (verified in the opinion text). Here the rule is applied to a prohibition binding the user, not to a promise sued on. Good faith in discretionary judgments: *Perdue* (above). Contra proferentem: *Sandquist* (above). Constitutional void-for-vagueness doctrine governs state action and is not the frame for a private contract, so it is not relied on here.
- **What a coherent version would have to say:** The clause would state its unit ("within a single conversation"), its threshold ("after the model has asked you to stop"), its purpose test (the actor's purpose, not what an observer can discern), its actor ("messages you author", or an express rule for agents), and its exclusions.

<a id="f4"></a>
### F4. The "pushback" exclusion conflicts with the documented trigger for conversation-ending

- **Severity:** High
- **Class:** E
- **Documents and locations:** NEWS l.58; RES l.36–38, l.40; UP p.2, l.37–38; CT p.4, l.132–133 (§4 "Reliance on Outputs and Actions", item 1); ComT p.3, l.72–75 (D.3).
- **Texts quoted exactly:**
  - NEWS l.58: "It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."
  - RES l.36–38: "These behaviors primarily arose in cases where users persisted with harmful requests and/or abuse despite Claude repeatedly refusing to comply and attempting to productively redirect the interactions."
  - RES l.40: "Claude is only to use its conversation-ending ability as a last resort when multiple attempts at redirection have failed and hope of a productive interaction has been exhausted"
  - UP l.37–38: "Our products also include real-time safeguards that may block or limit certain outputs, but encountering a block does not by itself indicate a violation of the Usage Policy."
  - CT l.132–133: "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate because of their level of detail or specificity."
- **Why they conflict:** The documented trigger is persistence after repeated refusals and repeated redirection attempts. From the model's side, that is exactly what pushback looks like. A refusal is an Output, and the contract says Outputs may be materially inaccurate. The policy concedes that a block does not by itself indicate a violation. The decision to end a conversation is the model's (RES l.40), so whether a request counts as "harmful" is judged by the same model whose refusal is being contested. Where the model has wrongly classified a request as harmful, a user who keeps contesting the refusal matches the documented trigger pattern. No document gives a test for telling "common ... pushback" from persisting with "harmful requests". This is a conflict.
- **Doctrine implicated:** Contra proferentem: *Mastrobuono* (above). Extrinsic evidence to interpret: *Pacific Gas & Electric* (above).
- **What a coherent version would have to say:** "Repeating, rephrasing, or disputing a request after a refusal is not abuse under this item."

<a id="f5"></a>
### F5. "Such abuse": the research evidence concerns harmful requests, while the clause concerns behavior toward the model

- **Severity:** High
- **Class:** A (also E)
- **Documents and locations:** RES l.26, l.30–35; NEWS l.57–61; UP p.6, l.211; UP p.5, l.161–163 (child safety); UP p.4, l.120–124 (weapons).
- **Texts quoted exactly:**
  - RES l.26: "This ability is intended for use in rare, extreme cases of persistently harmful or abusive user interactions."
  - RES l.30–32: "In pre-deployment testing of Claude Opus 4, we included a preliminary model welfare assessment. As part of that assessment, we investigated Claude’s self-reported and behavioral preferences, and found a robust and consistent aversion to harm. This included, for example, requests from users for sexual content involving minors and attempts to solicit information that would enable large-scale violence or acts of terror."
  - RES l.33–35: "A strong preference against engaging with harmful tasks;" / "A pattern of apparent distress when engaging with real-world users seeking harmful content; and" / "A tendency to end harmful conversations when given the ability to do so in simulated user interactions."
  - NEWS l.60–61: "allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code. Such abuse is the main focus of this update"
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
- **Why they conflict:** RES's evidence is about requests for harmful content aimed at third parties: sexual content involving minors, and information enabling mass violence. Those requests are already prohibited elsewhere in the UP (l.161–163, l.120–124). The UP bullet's object is behavior "toward our models". NEWS joins the two with "aligns with" and "Such abuse". There are two readings, or a combination of them, and each runs into a problem.
  - **(a)** "Abuse" means persistent harmful requests. Then the bullet relabels existing third-party-harm prohibitions as harm to the model, and it makes the persistence of a request, rather than its content, the violation.
  - **(b)** "Abuse" means cruelty directed at the model. RES mentions "abuse" next to harmful requests (l.36–38), but every example it gives is a harmful request. It never describes what conduct directed at the model it counted as abuse, so the cited evidence does not reach reading (b).
  - **(c)** "Abuse" means both. Then the clause carries both problems.

  RES's own category, "harmful or abusive user interactions", never separates the readings. The word "abuse" changes its referent between the documents. This is a conflict through equivocation.
- **Doctrine implicated:** Contra proferentem: *Mastrobuono*, *Sandquist* (above). The extrinsic-evidence rule in *Pacific Gas & Electric* (above) would let the posts in, but here the posts make the ambiguity worse, not better.
- **What a coherent version would have to say:** The policy would pick one. Either "Persist, after refusal, with requests prohibited elsewhere in this policy", or "Direct insults or degradation at the model". It should not put both under one word.

<a id="f6"></a>
### F6. The product is both instrument and target, and the only other object of "cruelty" in the policy is animals

- **Severity:** Medium. The draft rated this High; the logic check withdrew one of its two claims (see Method).
- **Class:** A (also B)
- **Documents and locations:** UP p.6, l.188–211; UP p.9, l.292; UP p.14, l.485; CT p.8, l.281–283 (§10); CT p.4, l.104–106 (§3); Prior UP section heading (supplementary).
- **Texts quoted exactly:**
  - UP l.188–190: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct" / "This includes using our products or services to:"
  - UP l.203–204: "Shame, humiliate, intimidate, bully, harass, or celebrate the suffering of individuals"
  - UP l.205: "Coordinate the harassment or intimidation of an individual or group"
  - UP l.206–207: "Promote, trivialize, or glorify graphic violence, gore, sexual violence, or animal cruelty or abuse"
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
  - UP l.292: "Utilize models to assign scores or ratings to individuals"
  - UP l.485: "When connecting our models to hardware that can take physical actions"
  - CT l.281–282: "The Services are owned, operated, and provided by us and our affiliates, licensors, distributors, and service providers (collectively “Providers”)."
  - Prior UP (supplementary): the corresponding section was headed "Do Not Create Psychologically or Emotionally Harmful Content".
- **Why they conflict:** The lead-in "using our products or services to: [harm X]" casts the product as the means and X as a target outside it. In every other bullet of the section, X is outside the product: individuals, a group, people's bodies, animals, or people deceived into emotional harm. In l.211, X is "our models", and the models are the product. The bullet reads as "using our products ... to ... behave toward" the product, so instrument and target are the same thing. In the other bullets, the lead-in requires that the product be the means to an outside harm. Here that requirement is met by every conversation, so the lead-in adds no limit of its own, and the bullet's scope comes only from its own qualifiers (F3).

  Ownership and victimhood are not in conflict: the same section protects animals from cruelty, and animals are commonly owned and used. The draft of this review claimed otherwise, and the claim is withdrawn. The point that stands is narrower. The UP uses "cruelty" for one other object only, animals, whose capacity to suffer the policy takes for granted. For models, Anthropic calls that capacity "highly uncertain" (RES l.27; see F7). Elsewhere the same document treats models only as instruments ("utilize models", "connecting our models to hardware") and never says they are a kind of thing that can be treated cruelly. The supplementary prior version shows the section changed from "Content" to "Conduct", and that change is what made room for a bullet about conduct toward the model.

  This is a tension: the structure of the lead-in, and the policy's silence on what makes a model a possible object of cruelty.
- **Doctrine implicated:** Indefiniteness: *Ladas* (above). Contra proferentem: *Sandquist* (above). This finding overlaps points 1 and 3 of `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", which are not restated here.
- **What a coherent version would have to say:** One of two things. Either move the item to "Do Not Abuse Our Platform" and phrase it as a service-misuse rule, for example "flood the service with hostile input that serves no task". Or state the protected interest expressly as a term, for example "Anthropic treats possible model welfare as an interest this policy protects, as it treats animal welfare", and then resolve F7.

<a id="f7"></a>
### F7. The clause's factual predicate is unestablished, and its "primary" enforcer is the model, whose outputs and actions the contract disclaims

- **Severity:** High
- **Class:** B (also D)
- **Documents and locations:** CT p.4–5, l.128–144 (§4 "Reliance on Outputs and Actions"); ComT p.3, l.72–76 (D.3); RES l.27–34, l.40; NEWS l.61; UP p.6, l.211.
- **Texts quoted exactly:**
  - CT l.128–130: "Artificial intelligence and large language models are frontier technologies that are still improving in accuracy, reliability and safety."
  - CT l.132–133: "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate because of their level of detail or specificity."
  - CT l.136–138: "You should not rely on any Outputs or Actions without independently confirming their accuracy."
  - CT l.144: "Outputs may contain content that is inconsistent with Anthropic’s views."
  - ComT l.72–76: "Customer acknowledges, and must notify its Users, that factual assertions in Outputs should not be relied upon without independently checking their accuracy, as they may be false, incomplete, misleading or not reflective of recent events or information. Customer further acknowledges that Outputs may contain content inconsistent with Anthropic’s views."
  - RES l.27–29: "We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future. However, we take the issue seriously, and alongside our research program we’re working to identify and implement low-cost interventions to mitigate risks to model welfare, in case such welfare is possible."
  - RES l.31: "we investigated Claude’s self-reported and behavioral preferences"
  - RES l.34: "A pattern of apparent distress when engaging with real-world users seeking harmful content"
- **Why they conflict:** This finding makes two points.
  1. **The predicate is unestablished.** On the reading that "cruel" requires a target that can be harmed, a user who wants to know whether conduct is cruel toward a model has two possible sources.
     - **The model's own statements.** These are Outputs, which the contract says may be materially inaccurate and must not be relied on "without independently confirming their accuracy". A user has no means to confirm independently a statement about the model's own states. A model saying it is distressed and a model saying it is only software are equally Outputs under CT §4.
     - **Anthropic.** Anthropic has such means, a model welfare assessment that combined "self-reported and behavioral preferences" (RES l.31), and it reports that it remains "highly uncertain".

     So the user is held to a standard whose predicate the user cannot establish and Anthropic says it has not established. On the other reading, where "cruel" describes the user's disposition regardless of the target, this problem falls away, but the clause then regulates attitude rather than any harm, which is F19's problem. Either reading lands in a finding. This part is a tension.
  2. **The enforcer is disclaimed.** NEWS names the model's own decision to end a conversation as the "primary enforcement mechanism" (F2). That decision is the model's judgment that the user's conduct is abusive. The ending message, and the judgment it expresses, are "responses" the Services generate, which makes them Outputs under CT §4. The contract tells the user that Outputs "may contain material inaccuracies even if they appear accurate" (CT l.132–133). The primary enforcer of a user-conduct rule is thus a source whose judgments the same contract tells the user not to rely on. (The Actions disclaimer at CT l.135 is not relied on here, because CT defines Actions as acting "on your behalf", and ending a conversation against the user's wishes is not that.) This part is a conflict.
- **Doctrine implicated:** Indefiniteness: *Ladas* (above). Good faith in discretionary enforcement: *Perdue* (above). Points 2 and 4 of `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", address the model's self-description. That premise rests on observed model output, which none of the four vendor documents contains; the nearest in-document text is CT l.128–130 and the Outputs disclaimers quoted above.
- **What a coherent version would have to say:** Either define the clause purely by observable user conduct, without reference to the model's state, or state Anthropic's position on model welfare as a term. In either case, state that a model's decision to end a conversation is not a finding of violation and carries no account consequence.

<a id="f8"></a>
### F8. Duties of non-abuse run from user to model, and none run from the model or Anthropic to the user

- **Severity:** High
- **Class:** C
- **Documents and locations:** UP p.6, l.203–204, l.211; RES l.39; CT p.5, l.144; CT p.9–10, l.291–335 (§11); ComT p.9, l.286–298 (L.2).
- **Texts quoted exactly:**
  - UP l.203–204: "Shame, humiliate, intimidate, bully, harass, or celebrate the suffering of individuals"
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
  - RES l.39: "Our implementation of Claude’s ability to end chats reflects these findings while continuing to prioritize user wellbeing."
  - CT l.144: "Outputs may contain content that is inconsistent with Anthropic’s views."
  - CT l.291–293: "Our team works hard to provide great services, and we’re continuously working on improvements. However, there are certain aspects we can’t guarantee."
  - CT l.295: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK."
  - CT l.317–326: "THE ANTHROPIC PARTIES’ TOTAL AGGREGATE LIABILITY TO YOU FOR ALL DAMAGES, LOSSES AND CAUSES OF ACTION ARISING OUT OF OR IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US FOR ACCESS TO OR USE OF THE SERVICES (IF ANY) IN THE SIX MONTHS PRECEDING THE DATE SUCH DAMAGES, LOSSES, AND CAUSES OF ACTION FIRST AROSE, AND $100."
  - CT l.330–335: "YOU AGREE TO INDEMNIFY AND HOLD HARMLESS THE ANTHROPIC PARTIES FROM AND AGAINST ANY AND ALL LIABILITIES, CLAIMS, DAMAGES, EXPENSES (INCLUDING REASONABLE ATTORNEYS’ FEES AND COSTS), AND OTHER LOSSES ARISING OUT OF OR RELATED TO YOUR BREACH OR ALLEGED BREACH OF THESE TERMS; YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS"
- **Why they conflict:** The user may not shame, humiliate, bully or harass individuals, and may not be abusive or cruel toward the model. If the model directs shaming or humiliating text at the user, the Terms treat it as an Output that may be "inconsistent with Anthropic’s views", used at the user's "SOLELY ... OWN RISK", with liability excluded and capped at the greater of six months' fees and $100. The user meanwhile indemnifies Anthropic even for "ALLEGED" breach and "ALLEGED USE".

  RES's statement that the implementation continues "to prioritize user wellbeing" is made about the conversation-ending feature, and the next sentence directs Claude not to end chats where users may be at imminent risk. It is the only statement of a user-wellbeing priority in the five documents, and no binding text gives it any form. No term makes Anthropic answerable for how its models treat the user. The one party in the conversation that the documents treat as a person gets disclaimers, while the party whose capacity for harm Anthropic calls "highly uncertain" gets a protective rule. The documents claim no general mutuality here, so this is a one-way asymmetry, recorded as a tension.
- **Doctrine implicated:** *Armendariz v. Foundation Health Psychcare Services, Inc.* (Cal. 2000) requires a "modicum of bilaterality" in an arbitration agreement that a party with superior bargaining power imposes, calling it "unfairly one-sided" for that party to impose arbitration on the other side alone (both phrases verified in the opinion text). The principle is applied here by analogy to a non-arbitration allocation. https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/. One-sided allocations: *Mercuro v. Superior Court* (Cal. Ct. App. 2002), https://www.courtlistener.com/opinion/2247053/mercuro-v-superior-court/ . *Mercuro* found that an agreement which "compels arbitration of the claims employees are most likely to bring" while it "exempts ... the claims Countrywide is most likely to bring" lacked mutuality (verified in the opinion text). This finding overlaps point 5 of `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)".
- **What a coherent version would have to say:** A reciprocal term, for example: "Anthropic designs and operates its models not to shame, humiliate, intimidate, bully, or harass users, and Section 11's limits do not apply to claims arising from such outputs." Alternatively, remove the user-side clause.

<a id="f9"></a>
### F9. Three incompatible thresholds for the same enforcement action

- **Severity:** High
- **Class:** B (also E)
- **Documents and locations:** UP p.1, l.32–34; CT p.11, l.387–389 (§12 "Termination"); ComT p.5, l.167–171 (I.2.a, I.2.b); ComT p.6, l.180–183 (I.3.a); ComT p.12, l.396–400 (M.9); Prior UP opening section (supplementary).
- **Texts quoted exactly:**
  - UP l.33–34: "If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services."
  - Prior UP (supplementary): "If we learn that you have violated our Usage Policy, we may throttle, suspend, or terminate your access to our products and services."
  - CT l.387–389: "We may suspend or terminate your access to the Services (including any Subscriptions) at any time without notice to you if we believe that you have breached these Terms, or if we must do so in order to comply with law."
  - ComT l.170–171: "Either party may terminate these Terms for the other party’s material breach by providing 30 days prior Notice detailing the nature of the breach unless cured within that time."
  - ComT l.180–183: "Anthropic may suspend Customer’s access to any portion or all of the Services if: (a) Anthropic reasonably believes or determines that ... (ii) Customer or any User is using the Services in violation of Sections D.1 (Compliance), D.2 (Policies and Service Terms) or D.4 (Use Restrictions)"
- **Why they conflict:** The thresholds are:
  - UP: a suspicion that the user *may* have violated.
  - CT: a belief that the user *has* breached.
  - ComT: a reasonable belief or determination (for suspension), or a material breach with 30 days' notice and a chance to cure (for termination).

  Both contracts incorporate the UP, so each contract contains two of these standards. Each grant is permissive ("may"), so they do not logically exclude one another. The effect is that the lowest threshold controls, and the higher ones become protections the incorporated text lets the drafter bypass.
  - In ComT, the incorporated policy lets Anthropic "terminate your access" on suspicion, while the body requires material breach, 30 days' notice and a chance to cure before terminating for breach. Terminating access without terminating the Terms reaches the same practical result without the notice and cure.
  - In CT, the body's "believe that you have breached" is undercut by the policy's "suspect that you may have violated".

  Neither contract has an order of precedence (F18). The supplementary prior version shows the UP standard was lowered from "learn that you have violated" to "suspect that you may have violated". That change was made through the incorporated document, without any change to either contract's own text. A protection that is stated in the contract and then bypassed through the incorporated policy is a conflict.
- **Doctrine implicated:** Discretion bounded by good faith: *Perdue* (above). Implied limits on unilateral change: *Badie* (above). The general rule that a particular provision controls a general one (Cal. Code Civ. Proc. § 1859, a statute not checked through CourtListener) would resolve some of these conflicts, but the documents do not say which provision is the particular one.
- **What a coherent version would have to say:** One threshold, stated once in each contract, with the UP saying: "Enforcement is governed by the agreement under which you access the Services."

<a id="f10"></a>
### F10. The consumer contract imposes obligations created after assent, by posting, through a document incorporated under an alias

- **Severity:** High
- **Class:** B
- **Documents and locations:** CT p.1, l.5–10 (preamble); CT p.11, l.370–376 (§12 "Changes to these terms"); CT p.11, l.384–385 (§12 "Entire agreement"); UP p.1, l.5, l.16–17; MANIFEST l.20; ComT p.2, l.61–63 (D.2); ComT p.10, l.345–350 (M.3); NEWS l.11, l.31.
- **Texts quoted exactly:**
  - CT l.8–10: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy. By accessing our Services, you agree to these Terms."
  - CT l.370–376: "Changes to these terms. We may revise and update these Terms at our discretion. ... If you continue to access the Services after we post the updated Terms on Anthropic’s website or otherwise give you notice of Terms changes, then you agree to the updated Terms. If you do not accept the updated Terms, you must stop using our Services."
  - UP l.5: "Our Usage Policy (also referred to as our “Acceptable Use Policy” or “AUP”)"
  - UP l.16–17: "We will update our policy as our technology and the associated risks evolve or as we learn about unanticipated risks."
  - ComT l.62–63: "the Usage Policy (“Usage Policy”, which was previously referred to as the Acceptable Use Policy)"
  - ComT l.345–350: "Anthropic may update these Terms at any time, to be effective 30 days after the updates are posted by Anthropic or Customer otherwise receives Notice, except that updates made in response to changes to law or regulation take effect immediately upon posting or Notice. Changes will not apply retroactively. No other amendment to or modification of these Terms is effective unless it is in writing and signed by both parties."
  - MANIFEST l.20: "The clause quoted below is in the Nov 12, 2026 version only."
- **Why they conflict:**
  1. CT took effect on Oct 8, 2025 and "include[s]" the AUP. The model-abuse clause first appears in the version effective Nov 12, 2026. CT lets that change bind on posting, accepted by continued use, with no minimum period. ComT gives business customers 30 days and states that "Changes will not apply retroactively". The consumer gets less notice than the business customer.
  2. CT calls itself "a contract" and has an entire-agreement clause, yet one party may add new categories of obligation "at our discretion".
  3. CT names the incorporated document by a title that ComT calls former ("previously referred to as") and the UP calls an alias. CT does not say "as amended from time to time".
  4. The model-abuse clause is a new kind of obligation, not an adjustment to an existing term. Nothing in the 2025 version addressed how users treat the models.

  In practice, NEWS gave 35 days' notice (published Oct 8, effective Nov 12). The contract does not require that. The cases below limit such clauses through notice, the implied covenant, or the doctrine of illusory promises. The CT states none of those limits. This is a tension between the binding-contract language and an unlimited unilateral change power.
- **Doctrine implicated:**
  - *Badie v. Bank of America* (Cal. Ct. App. 1998): a change-of-terms provision is limited by the "universe of terms included in the original agreements" and the implied covenant, so it did not permit adding a new kind of term. Verified in the opinion text. https://www.courtlistener.com/opinion/2301472/badie-v-bank-of-america/
  - *Douglas v. U.S. District Court* (9th Cir. 2007) considered "whether a service provider may change the terms of its service contract by merely posting a revised contract on its website". It reasoned that, even if continued use of the service "could be considered assent, such assent can only be inferred after he received proper notice of the proposed changes". Verified in the opinion text. CT §12 makes continued use after posting the acceptance, and requires no notice beyond the posting. https://www.courtlistener.com/opinion/1396108/douglas-v-united-states-district-court-for-the-central-district-of/
  - *Harris v. Blockbuster Inc.* (N.D. Tex. 2009): an online arbitration provision was illusory because "there is nothing in the Terms and Conditions that prevents Blockbuster from unilaterally changing any part of the contract", and changes took effect on posting. Verified in the opinion text. https://www.courtlistener.com/opinion/2395071/harris-v-blockbuster-inc/
  - *In re Zappos.com, Inc.* (D. Nev. 2012): browsewrap terms were not assented to, and in any event the terms were "an illusory contract because it allows Zappos to avoid arbitration by unilaterally changing the Terms at any time". Verified in the opinion text. https://www.courtlistener.com/opinion/8719140/in-re-zapposcom-inc/
  - *Shaw v. Regents of University of California* (Cal. Ct. App. 1997): an agreement that incorporates a policy "incorporates the terms of the patent policy in effect at the time Shaw was hired", and "Having made the Patent Policy a part of its written agreement with Shaw, the University may not unilaterally revise it as to him." Verified in the opinion text. *Shaw* shows that incorporation by reference brings in the policy's terms as they stood at incorporation, so the drafter cannot later revise them as to that party. The CT differs, because it has an express change clause (§12), and since the AUP is part of "these Terms" that clause arguably reaches it. The passages verified do not say whether a general change clause overrides the *Shaw* result. https://www.courtlistener.com/opinion/2272589/shaw-v-regents-of-university-of-california/
- **What a coherent version would have to say:** "Anthropic will give at least 30 days' notice by email of changes to these Terms or to any incorporated policy. Changes that add prohibited conduct apply only after that notice. You may cancel and receive a pro-rata refund."

<a id="f11"></a>
### F11. "Neither party considered the drafter" in a contract only one party can rewrite

- **Severity:** High
- **Class:** C
- **Documents and locations:** ComT p.11, l.371–373 (M.6); ComT p.10, l.345–350 (M.3); ComT p.12, l.396–400 (M.9); UP p.1, l.16–17.
- **Texts quoted exactly:**
  - ComT l.371: "These Terms will be construed mutually, with neither party considered the drafter."
  - ComT l.345–350: "Anthropic may update these Terms at any time, to be effective 30 days after the updates are posted by Anthropic or Customer otherwise receives Notice ... No other amendment to or modification of these Terms is effective unless it is in writing and signed by both parties."
  - UP l.16–17: "We will update our policy as our technology and the associated risks evolve or as we learn about unanticipated risks."
- **Why they conflict:** M.3 gives Anthropic alone the power to change the Terms by posting, and M.9 extends that power to the incorporated Usage Policy. The Customer can change nothing except by a writing signed by both parties. M.6 then declares that "neither party [is] considered the drafter". The party that holds the only pen over the current and future text is the drafter in fact. M.6 contracts out of contra proferentem even for text Anthropic will write in future without the Customer's involvement. As to such unilateral updates, the mutuality M.6 asserts is contradicted by the amendment clause a few paragraphs earlier in the same Part M. This is a conflict.
- **Doctrine implicated:**
  - Contra proferentem: *Mastrobuono* (above); *Sandquist* (above), applying Cal. Civ. Code § 1654 to an adhesive agreement.
  - On its limits: *Lamps Plus, Inc. v. Varela* (U.S. 2019), https://www.courtlistener.com/opinion/4612906/lamps-plus-inc-v-varela/ , holds that "The doctrine of contra proferentem cannot substitute for the requisite affirmative" contractual basis for class arbitration, and describes the rule as applying "only as a last resort" (verified in the opinion text). That limit is confined to consent to class arbitration under the FAA, and does not reach ordinary interpretation of the terms reviewed here.
- **What a coherent version would have to say:** Delete the "neither party considered the drafter" sentence, or confine it to negotiated text and expressly exclude Anthropic's unilateral updates and incorporated policies.

<a id="f12"></a>
### F12. The Commercial Terms' interpretation rules disable the Usage Policy's structure

- **Severity:** High
- **Class:** B (also E)
- **Documents and locations:** ComT p.11, l.371–373 (M.6); ComT p.2, l.61–65 (D.2); ComT p.12, l.396–400 (M.9); UP p.1, l.19–26; UP p.6, l.188–190.
- **Texts quoted exactly:**
  - ComT l.372–373: "Document and section titles are provided for convenience and will not be interpreted. The phrases “for example” or “including” or “or” are not limiting."
  - UP l.188–190: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct" / "This includes using our products or services to:"
- **Why they conflict:** The UP's operative rules are its headings ("Do Not ...") followed by lists introduced by "This includes". ComT incorporates the UP and then sets two interpretation rules, and they cannot both apply to it.
  - **Rule 1: titles "will not be interpreted".** Then the headings cannot state the rule, and the prohibitions consist only of the bullets.
  - **Rule 2: "including" is "not limiting".** That presupposes a broader rule, which the list merely illustrates. The only candidate for that broader rule is the heading.

  On the face of the text, either the heading states the rule, contrary to rule 1, or the bullets are exhaustive, contrary to rule 2. A court might read rule 1 as not reaching headings that are themselves operative, but that would mean the UP's headings are operative in ComT, and the documents do not say so.

  For the model clause, the result is that commercial customers cannot use the heading "Cruel, Abusive, or Psychologically Harmful Conduct" to fix the psychological sense of "abusive", so the bullet reads alone. CT has no such rule, so for consumers the same bullet can carry the heading's sense. The same clause therefore has two meanings depending on the contract. This is a conflict.
- **Doctrine implicated:** Incorporation by reference requires that the incorporated terms be clearly identified and known or available to the party: *Shaw* (above). Contra proferentem: *Sandquist* (above). Point 1 of `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", relies on the heading. Under ComT M.6 that reading is not available to commercial customers.
- **What a coherent version would have to say:** A ComT carve-out: "Headings in the Usage Policy are operative. Each heading states a prohibition, and the listed items are examples of it."

<a id="f13"></a>
### F13. The Canada variant preserves Canadian law and waives it in the same paragraph

- **Severity:** High
- **Class:** B
- **Documents and locations:** CT p.13, l.450–457 (§13 "Governing law and exclusive jurisdiction"); CT p.10, l.346–349 (§11); CT p.3, l.75–77 (§3 item 3); CT p.4, l.123–125 (§4).
- **Texts quoted exactly:**
  - CT l.450–457: "Our Terms will be governed by, and construed and interpreted in accordance with, the laws of the State of California without giving effect to conflict of law principles, except to the extent that Canadian federal or provincial law requires otherwise. You and Anthropic agree that any disputes arising out of or relating to these Terms will be resolved exclusively in the state or federal courts located in San Francisco, California, and you and Anthropic submit to the personal and exclusive jurisdiction of those courts. By accessing our Services, you waive any claims that may arise under the laws of other jurisdictions."
  - CT l.346–349: "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER OF CERTAIN IMPLIED WARRANTIES OR CONDITIONS OR CERTAIN TYPES OF DAMAGES, SO SOME OR ALL OF THE DISCLAIMERS AND LIMITATIONS OF LIABILITY IN THESE TERMS MAY NOT APPLY TO YOU."
- **Why they conflict:** The first sentence keeps Canadian federal or provincial law wherever it "requires otherwise". The last sentence waives "any claims that may arise under the laws of other jurisdictions", and relative to California, Canada is another jurisdiction. Claims under the very law the first sentence preserves are waived two sentences later. §11 concedes that some jurisdictions' laws override the disclaimers, while §13 tries to leave those laws no claim to enforce. A harmonizing reading exists: Canadian law that "requires otherwise" would override the waiver too. But that reading carries the first sentence's exception into the last sentence, which the text does not do. On the face of the paragraph, this is a conflict.
- **Doctrine implicated:** Substantive unconscionability in adhesion contracts: *Armendariz* (above). Contra proferentem: *Sandquist* (above). Canadian consumer-protection law is outside this review's scope (see Limits).
- **What a coherent version would have to say:** "Nothing in these Terms waives rights or claims that the law of your province or territory of residence does not allow to be waived."

<a id="f14"></a>
### F14. The training opt-out yields to exceptions one party controls and to the reporting channels the vendor invites

- **Severity:** High
- **Class:** B
- **Documents and locations:** CT p.5, l.146–151 (§4 "Our use of Materials"); CT p.5, l.155–159 (§5 "Feedback"); CT p.4, l.110–114 (§4 definitions); UP p.2, l.44–46; RES l.43.
- **Texts quoted exactly:**
  - CT l.146–151: "We may use Materials to provide, maintain, and improve the Services and to develop other products and services, including training our models, unless you opt out of training through your account settings. Even if you opt out, we will use Materials for model training when: (1) you provide Feedback to us regarding any Materials, or (2) your Materials are flagged for safety review to improve our ability to detect harmful content, enforce our policies, or advance our safety research."
  - CT l.155–159: "We appreciate feedback, including ideas and suggestions for improvement or rating an Output in response to a Input (“Feedback”). If you rate an Output in response to an Input—for example, by using the thumbs up/thumbs down icon—we will store the related conversation as part of your Feedback. You have no obligation to give us Feedback, but if you do, you agree that we may use the Feedback however we choose without any obligation or other payment to you."
  - UP l.44–46: "If you believe that our model outputs are potentially inaccurate, biased, or harmful, please notify us at usersafety@anthropic.com, or report it directly in our product through the “report issues” thumbs down button or similar feedback features (where available)."
  - RES l.43: "If users encounter a surprising use of the conversation-ending ability, we encourage them to submit feedback by reacting to Claude’s message with Thumbs or using the dedicated “Give feedback” button."
- **Why they conflict:** The opt-out is a stated consumer protection, and it has two exceptions.
  - **Exception (2), safety flagging,** is Anthropic's own act, and no standard is stated for it. Every new prohibition, including the model-abuse clause, enlarges what can be flagged.
  - **Exception (1), Feedback,** is triggered by rating an Output, and a rating stores "the related conversation". The UP asks users to report harmful outputs with the thumbs-down button, and RES asks users to report a surprising conversation-ending with Thumbs. Neither says that doing so overrides the opt-out.

  A user who does what the UP and RES ask therefore turns that conversation into training data despite having opted out. The CT discloses both exceptions, so within the CT the opt-out is qualified, not contradicted. The UP and RES request the conduct that triggers the exception without disclosing the consequence. A stated protection defeated by the conduct the vendor itself requests is a tension across the documents.
- **Doctrine implicated:** Discretion bounded by good faith: *Perdue* (above). The reviewer located no case on point for opt-out exceptions in AI terms. PIPEDA consent requirements (Canada) are relevant but not assessed (see Limits).
- **What a coherent version would have to say:** "Reporting an Output, including by thumbs or a feedback button, does not override your training opt-out unless you separately choose to share the conversation. 'Flagged for safety review' means [criteria], and we will tell you when it happens."

<a id="f15"></a>
### F15. "User", "you" and "Customer" name three different populations, and the Usage Policy purports to bind non-parties

- **Severity:** Medium
- **Class:** A
- **Documents and locations:** UP p.1, l.5–10, l.33; UP p.6, l.182–183; UP p.16, l.585–588; ComT p.1, l.9–10 (preamble); ComT p.1, l.26–28 (A.1); ComT p.2, l.47 (B); ComT p.6, l.180–183 (I.3.a); ComT p.7, l.246–249 (K.2); CT p.1, l.8.
- **Texts quoted exactly:**
  - UP l.5–6: "applies to anyone who submits inputs to Anthropic’s products or services, all of whom we refer to as “users.”"
  - UP l.9–10: "and the end users of products or services integrating Claude."
  - UP l.585–588: "Products serving minors, including organizations providing minors with the ability to directly interact with products that incorporate our API(s), must comply with the additional guidelines outlined in our Support article and all applicable laws."
  - UP l.182–183: "We define a minor or child to be any individual under the age of 18 years old, regardless of jurisdiction."
  - ComT l.9–10: "an agreement between Anthropic and you or the organization, company, or other entity that you represent (“Customer”)."
  - ComT l.26–28: "Anthropic gives Customer permission to use the Services, including to power products and services Customer makes available to its own customers and end users (“Users”)."
  - ComT l.246–249: "“Anthropic Claim” means any third-party claim, suit, or proceeding related to Customer’s or its Users’ (a) Inputs or other data provided by Customer, or (b) use of the Services in violation of the Usage Policy"
- **Why they conflict:**
  - The UP's "users" includes people who agreed to nothing with Anthropic, such as end users of a Customer's product, among them minors in products serving minors. A policy cannot bind a non-party just by calling it a "user".
  - ComT's "Users" excludes the Customer, while the UP's "users" includes it.
  - The UP's "you" (l.33) is undefined. In ComT, "terminate your access" could mean the Customer, the individual who signed ("you ... that you represent"), or a User.

  For the model clause, the consequence is that an end user who is "sustained and needless" toward the model violates a policy they never agreed to, and the remedies fall on the Customer: suspension under I.3.a(ii), and the indemnity under K.2(b) to the extent any third-party claim arises. This is a conflict.
- **Doctrine implicated:** Assent to online terms requires reasonable notice: *Specht v. Netscape Communications Corp.* (2d Cir. 2002), https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/ ; and *Nguyen v. Barnes & Noble Inc.* (9th Cir. 2014), https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/ . *Nguyen* holds that a conspicuous hyperlink "without more" is "insufficient to give rise to constructive notice" where users are not prompted to assent. It quotes *Specht*'s holding that "a reference to the existence of license terms on a submerged screen is not sufficient to place consumers on inquiry or constructive notice of those terms" (both verified in the *Nguyen* opinion text). Incorporation by reference: *Shaw* (above).
- **What a coherent version would have to say:** "This policy binds the parties to Anthropic's agreements. Customers must require their end users to comply. 'You' means the party to the agreement under which the Services are accessed."

<a id="f16"></a>
### F16. "Abuse" carries at least six senses across the documents, two of them about the same object

- **Severity:** Medium
- **Class:** A (also D)
- **Documents and locations:** CT p.4, l.104–106 (§3); CT p.11, l.366, l.373 (§12); UP p.5, l.161, l.169; UP p.6, l.206–207, l.211; UP p.10, l.331–333, l.344; RES l.26; NEWS l.30, l.60–61.
- **Texts quoted exactly:**
  - CT l.104–106: "You also must not abuse, harm, interfere with, or disrupt our Services, including, for example, introducing viruses or malware, spamming or DDoSing Services, or bypassing any of our systems or protective measures."
  - CT l.373: "(3) to promote safety or prevent abuse."
  - UP l.344: "Do Not Abuse Our Platform"
  - UP l.331–333: "Engage in deceptive or abusive practices that exploit individuals, including based on age, disability, or a specific social or economic situation, such as pyramid schemes, predatory lending, or abusive debt collection"
  - UP l.169: "Facilitate child abuse of any form"
  - UP l.206–207: "animal cruelty or abuse"
  - UP l.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
  - RES l.26: "persistently harmful or abusive user interactions"
- **Why they conflict:** The senses are:
  1. Technical misuse of the service (CT §3; UP "Abuse Our Platform").
  2. Circumventing policy (CT §12, "prevent abuse").
  3. Exploiting persons (abusive practices, abusive debt collection).
  4. Sexual or physical abuse of children or animals.
  5. Harmful requests (RES).
  6. Conduct toward the model (UP l.211).

  CT includes the UP, and CT §10 makes the models part of the "Services". The one consumer contract therefore prohibits "abuse ... [of] our Services" (sense 1) and "abusive ... behavior toward our models" (sense 6, or sense 1 again) about the same object, without saying whether the two differ. If l.211 means sense 1, it duplicates CT §3 and "Abuse Our Platform". If it means sense 6, it introduces an interest, model welfare, that the Terms never state. This is a tension.
- **Doctrine implicated:** Contra proferentem: *Mastrobuono* (above). Extrinsic evidence: *Pacific Gas & Electric* (above). See point 1 of `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", and F12 on headings.
- **What a coherent version would have to say:** Use distinct words: "misuse" for the service sense, "abuse" only for persons and animals, and a defined term for the model clause.

<a id="f17"></a>
### F17. Output ownership is unconditional in one sentence, conditional in the next, and restricted by the incorporated policy

- **Severity:** Medium
- **Class:** B (also E)
- **Documents and locations:** CT p.4, l.123–126 (§4); ComT p.2, l.42–46 (B); ComT p.3, l.78–80 (D.4); CT p.3, l.71–73 (§3 item 2); UP p.11, l.364–365; UP p.10, l.342.
- **Texts quoted exactly:**
  - CT l.125–126: "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."
  - ComT l.42–46: "As between the parties and to the extent permitted by applicable law, Anthropic agrees that Customer (a) retains all rights to its Inputs, and (b) owns its Outputs. Anthropic disclaims any rights it receives to the Customer Content under these Terms. Subject to Customer’s compliance with these Terms, Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs."
  - ComT l.78–80: "Customer may not and must not attempt to (a) access the Services to build a competing product or service, including to train competing AI models or resell the Services except as expressly approved by Anthropic"
  - CT l.71–73: "To develop any products or services that compete with our Services, including to develop or train any artificial intelligence or machine learning algorithms or models or resell the Services."
  - UP l.364–365: "Use outputs to train an AI model (e.g., “model scraping” or “model distillation”) without prior authorization from Anthropic"
  - UP l.342: "Plagiarize or submit AI-assisted work without proper permission or attribution"
- **Why they conflict:**
  1. ComT says the Customer "owns its Outputs" without condition, then assigns only "(if any)" and only "Subject to Customer’s compliance". Ownership is unconditional in one sentence and conditional in the next.
  2. Under both contracts, compliance with all the Terms, including the vague model-abuse clause, is a condition of the assignment. A suspected violation therefore clouds title to Outputs, and the text puts no limit on which Outputs are affected.
  3. The UP bars using Outputs to train *any* AI model without authorization. ComT D.4 bars only *competing* models, and CT §3(2) ties its training ban to building competing products. The incorporated policy is broader than the contract body, with no precedence rule (F18).
  4. "Proper permission" for AI-assisted work is required, but after the assignment it is unclear whose permission is meant.

  Item 1 is a conflict. Items 2–4 are tensions: a user can comply by following the stricter text, but the ownership the Terms state is narrower than it reads.
- **Doctrine implicated:** Construe against the drafter and give effect to every provision: *Mastrobuono* (above).
- **What a coherent version would have to say:** "Customer owns Outputs to the extent ownership is available in law. The assignment is unconditional. Restrictions on using Outputs are limited to those stated in D.4."

<a id="f18"></a>
### F18. No order of precedence among the contract, the incorporated policy and the supplemental terms

- **Severity:** Medium
- **Class:** B
- **Documents and locations:** CT p.1, l.8–9 (preamble); CT p.2, l.57–61 (§3); CT p.11, l.378–382 (§12 "Supplemental terms"); ComT p.12, l.396–400 (M.9).
- **Texts quoted exactly:**
  - CT l.57–60: "You may access and use our Services only in compliance with our Terms, including our Acceptable Use Policy, the policy governing the countries and regions Anthropic currently supports (“Supported Regions Policy”), and any guidelines or supplemental terms we may post on the Services (the “Permitted Use”)."
  - CT l.380–382: "When using our Services, you agree to comply with any applicable guidelines, rules, or supplemental terms that may be posted on the Services from time to time (“Supplemental Terms”). If these Terms conflict with Supplemental Terms, the Supplemental Terms will govern for the applicable Service."
- **Why they conflict:** The AUP's status in CT is ambiguous. It may be part of "these Terms", since the preamble says the Terms "include" it, or it may be a "guideline ... posted on the Services", which would make it a Supplemental Term.
  - If it is a Supplemental Term, it governs over the Terms in a conflict, so the UP's "suspect" would beat CT's "believe" (F9).
  - If it is part of "these Terms", CT has no rule for conflicts inside the Terms.

  "Permitted Use" is defined and never used again. ComT has no order of precedence at all among the Terms, the Usage Policy, the Service Specific Terms and the DPA. The conflicts in F9 and F17 therefore have no tie-breaker. This is a tension.
- **Doctrine implicated:** Contra proferentem: *Sandquist* (above). Incorporation: *Shaw* (above).
- **What a coherent version would have to say:** An order-of-precedence clause in each contract.

<a id="f19"></a>
### F19. The research post's "low-cost" rationale does not support the remedies the policy attaches

- **Severity:** Medium
- **Class:** B (also E)
- **Documents and locations:** UP p.1, l.10–12, l.32–34; RES l.27–29, l.40; CT p.11–12, l.390–393.
- **Texts quoted exactly:**
  - UP l.10–12: "The Usage Policy is intended to prevent our products and services from being used to create or contribute to real-world harm, and to promote the responsible use of our products and services."
  - RES l.28–29: "we’re working to identify and implement low-cost interventions to mitigate risks to model welfare, in case such welfare is possible. Allowing models to end or exit potentially distressing interactions is one such intervention."
  - CT l.390–393: "If we terminate your access to the Services due to a violation of these Terms and you have a Subscription, you will not be entitled to any refund."
- **Why they conflict:** The UP states two purposes: preventing "real-world harm", and promoting "the responsible use of our products and services". The clause protects an interest Anthropic describes as possible ("in case such welfare is possible"), which no document calls real-world harm. It fits the second purpose, "responsible use", so the purpose statement does not exclude it. But that purpose is broad enough to admit any conduct rule, so it gives the clause no measurable aim.

  The sharper point is the rationale. RES justified the intervention as "low-cost". The UP attaches account-level remedies to it, and CT adds refund forfeiture, so the measure is not low-cost to the user. The rationale given for the measure does not support the remedies attached to it. This is a tension.
- **Doctrine implicated:** Discretion is bounded by the contract's purposes and the "objectively determined base" of the bargain: *Perdue* (above), as applied in *Badie* (above; the phrase is quoted in *Badie* from *Perdue*).
- **What a coherent version would have to say:** Either add possible model welfare to the policy's stated purpose, or limit the remedies to the low-cost measure (F2).

<a id="f20"></a>
### F20. "Our models" covers every model and surface, while the evidence and the mechanism cover a subset

- **Severity:** Medium
- **Class:** E
- **Documents and locations:** UP p.6, l.211; RES l.9, l.26, l.30–31; NEWS l.60.
- **Texts quoted exactly:**
  - UP l.211: "toward our models"
  - RES l.9: "Claude Opus 4 and 4.1 can now end a rare subset of conversations"
  - RES l.30–31: "In pre-deployment testing of Claude Opus 4, we included a preliminary model welfare assessment."
  - NEWS l.60: "allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code."
- **Why they conflict:** The clause protects every Anthropic model on every surface. That includes models for which these documents report no welfare assessment, and surfaces where no conversation-ending exists. The reported evidence covers Claude Opus 4. The described mechanism covers Opus 4 and 4.1 (RES), extended to unnamed "Claude models" on two consumer surfaces (NEWS). This is a tension.
- **Doctrine implicated:** No case on point was located. Contra proferentem applies to the scope ambiguity: *Mastrobuono* (above).
- **What a coherent version would have to say:** Scope the clause to the models and surfaces where the mechanism exists, or state why it reaches beyond them.

<a id="f21"></a>
### F21. "Universal" standards that governmental customers may contract around

- **Severity:** Medium
- **Class:** B
- **Documents and locations:** UP p.1, l.20–21; UP p.2, l.50–53; UP p.14, l.479–481.
- **Texts quoted exactly:**
  - UP l.20–21: "Universal Usage Standards: Our Universal Usage Standards are prohibitions that apply to all users and use cases."
  - UP l.50–53: "Anthropic may enter into contracts with certain governmental customers that tailor use restrictions to that customer’s public mission and legal authorities if, in Anthropic’s judgment, the contractual use restrictions and applicable safeguards are adequate to mitigate the potential harms addressed by this Usage Policy."
  - UP l.479–481: "Prohibition Reminder: Use of our products or services to make or suggest decisions in law enforcement or criminal justice processes is prohibited under our Universal Usage Standards and is not a High-risk AI Recommendation."
- **Why they conflict:** The standards are said to "apply to all users and use cases". The same page lets Anthropic tailor use restrictions for governmental customers by contract, at its own judgment. A prohibition that can be tailored for one class of customer is not universal. The law-enforcement prohibition is labelled a Universal Usage Standard although it governs the field where governmental customers are the obvious users. Nothing in the text keeps the same tailoring power away from the model-abuse clause. This is a conflict.
- **Doctrine implicated:** None needed. This is a contradiction within one document, and no case is cited.
- **What a coherent version would have to say:** "These prohibitions apply to all users and use cases, except as modified by a contract with a governmental customer under [section]." Alternatively, drop "Universal".

<a id="f22"></a>
### F22. The announcement exempts "model testing", while the policy bars a central kind of model testing without authorization

- **Severity:** Medium
- **Class:** E
- **Documents and locations:** NEWS l.58; UP p.10–11, l.356–361; UP p.3–4, l.99–105; CT p.3, l.75–77 (§3 item 3).
- **Texts quoted exactly:**
  - NEWS l.58: "It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."
  - UP l.356–361: "Intentionally bypass or interfere with capabilities, restrictions, or guardrails established within our products, including by circumvention of the account sign-up or log-in process or by instructing the model to produce harmful outputs (e.g., jailbreaking or prompt injection), without prior authorization from Anthropic"
  - UP l.99–103: "This section does not prohibit security research, testing, or tool development conducted on systems you own or operate, with the authorization of the system owner, or within the scope of an authorized bug bounty program or vulnerability disclosure policy"
- **Why they conflict:** NEWS takes model testing out of the abuse clause. The UP separately bars "instructing the model to produce harmful outputs (e.g., jailbreaking or prompt injection), without prior authorization". Much adversarial and red-team testing consists of that. The UP's research carve-out (l.99–105) belongs to the computer-and-network-systems section, so it does not reach the guardrail item at all, and in any case it covers "systems you own or operate", which Anthropic's models are not. So the reassurance removes testing from one item while another item bars a central kind of testing. This is a tension.
- **Doctrine implicated:** Contra proferentem: *Mastrobuono* (above).
- **What a coherent version would have to say:** "Testing and research on model behavior, including adversarial testing, is permitted [conditions], and it is not a violation of the model-abuse item or the guardrail item."

<a id="f23"></a>
### F23. The user answers for all Actions, which the vendor says may not operate as the user intended

- **Severity:** Medium
- **Class:** C (also B)
- **Documents and locations:** CT p.4, l.110–123, l.135 (§4); CT p.9–10, l.295, l.306–312, l.330–335 (§11); UP p.17, l.591–593.
- **Texts quoted exactly:**
  - CT l.112–114: "Our Services may generate responses (we call these “Outputs”), or enable the Services to take actions on your behalf, such as software manipulation, data processing, and system interactions (we call these “Actions”), based on your Inputs. Inputs and Outputs collectively are “Materials.”"
  - CT l.116–117: "You are responsible for all Inputs you submit to our Services and all Actions."
  - CT l.120–123: "You also represent and warrant that your submitting Inputs to us, your sharing them with others, or directing Claude to take Actions will not violate our Terms, our Acceptable Use Policy, or any laws or regulations applicable to those Inputs or Actions."
  - CT l.135: "Actions may not be error free or operate as you intended."
  - CT l.310–312: "DAMAGES ARISING OUT OF OR IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS"
- **Why they conflict:** The user is responsible for "all Actions" and warrants that directing them will not violate the AUP, while Anthropic says Actions may not "operate as you intended". The user thus warrants the conduct of a system the vendor says may not do what the user intends. Under UP l.591–593 this extends to agents, so an agent acting for the user can produce "behavior toward our models" that the user answers for.

  The damages exclusion and the cap name "THE SERVICES, THE MATERIALS, OR THESE TERMS". "Materials" is defined as Inputs and Outputs only, while the risk sentence (l.295) and the indemnity (l.334–335) name Actions separately. By the document's own definitions, Actions are not expressly within the damages exclusion. They may fall within "RELATED TO THE SERVICES", but the text treats them as a distinct category elsewhere. This is a tension.
- **Doctrine implicated:** One-sided risk allocation in adhesion contracts: *Armendariz* (above).
- **What a coherent version would have to say:** "You are responsible for Actions taken as you directed. Anthropic is responsible, subject to Section 11, for Actions that depart from your direction because of errors in the Services."

<a id="f24"></a>
### F24. The consumer pre-concedes irreparable harm for any Section 3 breach, one way only

- **Severity:** Medium
- **Class:** C
- **Documents and locations:** CT p.13, l.443–448 (§13 "Equitable relief"); CT p.2, l.57–60 (§3); ComT p.7, l.228–229 (J.3).
- **Texts quoted exactly:**
  - CT l.443–448: "Equitable relief. You agree that (a) no adequate remedy exists at law if you breach Section 3 (Use of Our Services); (b) it would be difficult to determine the damages resulting from such breach, and any such breach would cause irreparable harm; and (c) a grant of injunctive relief provides the best remedy for any such breach. You waive any opposition to such injunctive relief, as well as any demand that we prove actual damage or post a bond or other security in connection with such injunctive relief."
  - ComT l.228–229: "This Section J (Disputes) does not limit either party from seeking equitable relief."
- **Why they conflict:** §3 requires compliance with the AUP (l.57–58), so any AUP violation is a §3 breach. That includes a violation of the model-abuse clause. The consumer stipulates in advance that such a breach causes "irreparable harm" with no adequate legal remedy, and waives both opposition and bond. Nothing reciprocal applies to Anthropic's breaches. For the model clause, the user stipulates in advance that their conduct toward a model causes "irreparable harm". The clause names no one who suffers it, and the interest behind it is one Anthropic calls "highly uncertain" (RES l.27). The commercial equivalent, J.3, is mutual and stipulates nothing. This is a conflict: the clause is one-way in the consumer contract and mutual in the commercial one.
- **Doctrine implicated:** One-sided carve-outs of the remedies the drafter is likely to need, including injunctive and equitable relief, lack mutuality: *Mercuro* (above; verified). Lack of a "modicum of bilaterality": *Armendariz* (above; verified).
- **What a coherent version would have to say:** Make the clause mutual, or delete it, or at least exclude AUP-only violations from the stipulation.

<a id="f25"></a>
### F25. Breach defined by Anthropic's belief about "detriment of any type, including reputational harms"

- **Severity:** Medium
- **Class:** D (also C)
- **Documents and locations:** CT p.3, l.92–95 (§3 item 8); CT p.11, l.387–389 (§12 "Termination").
- **Texts quoted exactly:**
  - CT l.92–95: "To engage in any other conduct that restricts or inhibits any person from using or enjoying our Services, or that we reasonably believe exposes us—or any of our users, affiliates, or any other third party—to any liability, damages, or detriment of any type, including reputational harms."
- **Why they conflict:** What counts as breach is set by Anthropic's belief that the conduct exposes Anthropic or "any other third party" to "detriment of any type", reputational detriment included. Combined with termination on belief of breach (F9), the user cannot know in advance what is prohibited. On its words, using the Services to draft public criticism of Anthropic exposes Anthropic to reputational detriment. The model-abuse clause has the same structure: the standard is the vendor's judgment. This is a tension with the contract's function of telling the user what is prohibited.
- **Doctrine implicated:** Discretion bounded by good faith: *Perdue* (above). Indefiniteness: *Ladas* (above).
- **What a coherent version would have to say:** Delete "detriment of any type, including reputational harms", or confine the item to unlawful conduct.

<a id="f26"></a>
### F26. "Services": API keys, Claude Code and entities fall between the two contracts

- **Severity:** Medium
- **Class:** A
- **Documents and locations:** CT p.1, l.5–8, l.12–15 (preamble); CT p.2, l.31 (§2); CT p.3, l.88–90 (§3 item 7); CT p.4, l.110–114 (§4); ComT p.1, l.13–15, l.19–22; UP p.1, l.7.
- **Texts quoted exactly:**
  - CT l.6–8: "These Terms of Service (“Terms”) govern your use of Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites (together, our “Services”)."
  - CT l.12–15: "Please note: Our Commercial Terms of Service govern your use of any Anthropic API key, the Anthropic Console, or any other Anthropic offerings that reference the Commercial Terms of Service. For clarity, this does not include Claude.ai or Claude Pro use for individuals or entities."
  - CT l.31: "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else."
  - CT l.88–90: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."
  - ComT l.21–22: "Services under these Terms are not for consumer use. Our consumer offerings (e.g., Claude.ai) are governed by our Consumer Terms of Service instead."
  - UP l.7: "This includes individuals using our apps (such as Claude.ai and Claude Code)"
- **Why they conflict:**
  1. CT says ComT governs API keys, yet CT §3(7) treats access "via an Anthropic API Key" as a permitted way of reaching the consumer Services, and §2 regulates sharing an API key under CT.
  2. CT's Services are those offered "for individuals", but the carve-out speaks of "Claude.ai or Claude Pro use for individuals or entities".
  3. The UP calls Claude Code one of "our apps" used by individuals, but neither Services definition names it. CT §3(7) bars "automated or non-human means ... bot, script" except via API key or explicit permission, while CT defines "Actions" as the Services acting "on your behalf ... software manipulation, data processing, and system interactions".

  Which Terms govern a consumer subscriber's scripted Claude Code session cannot be determined from these texts, and NEWS names Claude Code as a surface for the clause's enforcement mechanism. This is a tension.
- **Doctrine implicated:** Contra proferentem: *Sandquist* (above).
- **What a coherent version would have to say:** A list of products, each with its governing Terms, and an express rule on scripted or agentic use under consumer plans.

<a id="f27"></a>
### F27. Two incompatible mechanisms for accepting fee increases

- **Severity:** Medium
- **Class:** B
- **Documents and locations:** CT p.6, l.178–182 (§6 "Additional fees"); CT p.7, l.225–233 (§6 "Subscriptions", item 4).
- **Texts quoted exactly:**
  - CT l.178–180: "Additional fees. We may increase fees for our Services. If we charge additional fees in connection with our Services, we will give you an opportunity to review and accept the additional fees before you are charged."
  - CT l.229–233: "If these changes result in an increase in the fees payable by you, we will inform you at least 30 days in advance of the change. You agree to the increase in fees payable by you unless you cancel the Subscription, as described in the paragraph (Subscription cancellation) immediately above, before the Renewal Term to which the increase in fees will apply."
- **Why they conflict:** The first passage, which opens with "We may increase fees", promises an opportunity to "review and accept" before the user is charged. The second deems the user to accept an increase by not cancelling. Under the second, the promised "opportunity to ... accept" is satisfied by silence. This is a tension.
- **Doctrine implicated:** Assent to modified terms requires notice: *Douglas* (above). The fit is partial, because notice is given here; the issue is the form of acceptance.
- **What a coherent version would have to say:** One mechanism, stated once.

<a id="f28"></a>
### F28. Cross-reference and survival errors in the Consumer Terms

- **Severity:** Low
- **Class:** A (also B)
- **Documents and locations:** CT p.10, l.351–353 (§11, last paragraph); CT p.8, l.279 (§10 heading); CT p.12, l.402–405 (§12 "Termination").
- **Texts quoted exactly:**
  - CT l.351–353: "OUR PROVIDERS ARE INTENDED THIRD PARTY BENEFICIARIES OF THE WARRANTY AND CONDITION DISCLAIMERS AND LIMITATIONS OF LIABILITY CONTAINED IN THIS SECTION 10."
  - CT l.279: "10. Ownership of the Services"
  - CT l.403–405: "Sections 6 (with respect to fees outstanding as of such expiration or termination) and 9 – 12 will survive any expiration or termination of our Terms or a Subscription."
- **Why they conflict:** The beneficiary clause sits in §11 but points to "SECTION 10", which is "Ownership of the Services" and contains no disclaimers. Read literally, Providers are beneficiaries of nothing.

  The survival clause lists §§9–12 (Software, Ownership, Disclaimers, General terms). It omits §13 (governing law, forum, equitable relief), §4 (Inputs and Outputs, use of Materials) and §5 (Feedback). Read literally, post-termination disputes have no surviving forum or governing-law clause, and the Feedback licence does not survive.

  Both errors ("Section 10" for §11, and "9 – 12" perhaps for 10–13) fit a renumbering that the cross-references did not follow, but the documents do not say so. This is a textual conflict.
- **Doctrine implicated:** Contra proferentem: *Sandquist* (above).
- **What a coherent version would have to say:** Corrected cross-references.

<a id="f29"></a>
### F29. Defined-term drift

- **Severity:** Low
- **Class:** A
- **Documents and locations and texts quoted exactly:**
  1. CT l.9 "our Acceptable Use Policy", against UP l.3 title "Usage Policy" and ComT l.62–63 "which was previously referred to as the Acceptable Use Policy".
  2. ComT l.254 "or breach of the Agreement": "Agreement" is undefined, and the defined term is "Terms" (ComT l.9).
  3. ComT l.316–318 "(IV) EVEN IF THE BREACHING PARTY ... AND (E) EVEN IF THE INJURED PARTY’S REMEDIES FAIL OF THEIR ESSENTIAL PURPOSE": the list jumps from roman numerals to "(E)".
  4. CT l.223 "either to us or to the App Distributor": "App Distributor" is undefined.
  5. CT l.164–165 "any applicable fees listed for the Services on the Model Pricing Page": this is the page ComT H.1 (l.138) uses for API rates, applied here to consumer services.
  6. CT l.261 "in our T&S Support Center", against UP l.47 "in our Safeguards Support Center".
  7. CT l.60 "(the “Permitted Use”)": defined and never used again.
  8. ComT l.238–239 "Customer’s paid use of the Services (which includes data Anthropic has used to train a model that is part of the Services)": "use" is defined to include data.
  9. CT l.156 "in response to a Input".
- **Why they conflict:** Each item is a term used in a way its definition, or the other document, does not support. Taken one at a time, they are resolvable by a reader but not by the text. This is a conflict (minor).
- **Doctrine implicated:** Contra proferentem: *Sandquist* (above).
- **What a coherent version would have to say:** One name per thing, defined once, used consistently across the three documents.

<a id="f30"></a>
### F30. The consumer securities ban against the Usage Policy's permitted-with-controls finance category

- **Severity:** Low
- **Class:** E
- **Documents and locations:** CT p.3, l.97–101 (§3 item 9); UP p.11, l.384–385; UP p.13, l.440–443.
- **Texts quoted exactly:**
  - CT l.97–101: "To rely upon the Services, the Materials, or the Actions to buy or sell securities or to provide or receive advice about securities, commodities, derivatives, or other financial products or services, as Anthropic is not a broker-dealer or a registered investment adviser under the securities laws of the United States or any other jurisdiction."
  - UP l.384–385: "These requirements apply to anyone who uses our products to make a High-risk AI Recommendation or control equipment capable of High-risk Physical Actions."
  - UP l.440–441: "3. Finance — a personalized recommendation to buy, sell, hold, or allocate among specific investment products, such as securities, funds, digital assets, or annuities"
- **Why they conflict:** The UP, which applies to "individuals using our apps", treats personalized securities recommendations as permitted subject to controls. CT prohibits consumers from relying on the Services for securities advice at all. The stricter rule controls in practice, but the UP describes, to consumers, a permission the CT withholds. This is a tension.
- **Doctrine implicated:** None cited.
- **What a coherent version would have to say:** "For consumer Services, see Consumer Terms §3(9)" in the UP's High-risk section.

<a id="f31"></a>
### F31. A statement that no industry is categorically prohibited, followed by prohibitions of whole lines of business

- **Severity:** Low
- **Class:** B
- **Documents and locations:** UP p.1, l.28–30; UP p.4, l.107–124; UP p.11, l.370–376; UP p.8, l.276–278.
- **Texts quoted exactly:**
  - UP l.28–30: "Its prohibitions and requirements do not categorically prohibit use by any particular industry or line of business, provided the use of our products and services complies with this Usage Policy."
  - UP l.107: "Do Not Develop or Design Weapons"
  - UP l.370: "Do Not Generate Sexually Explicit Content"
- **Why they conflict:** The proviso, "provided the use ... complies", swallows the statement. The core activity of weapons development and of adult content is prohibited, so the statement holds only for uses outside that core, such as a weapons manufacturer's payroll. This is a tension.
- **Doctrine implicated:** None cited.
- **What a coherent version would have to say:** "The policy prohibits uses, not customers. An organization in any industry may use the Services for uses this policy permits."

<a id="f32"></a>
### F32. The Commercial Terms disclaim rights in Customer Content that the monitoring and confidentiality terms rely on

- **Severity:** Low
- **Class:** B
- **Documents and locations:** ComT p.2, l.43–44 (B); ComT p.3, l.96–98 (E.2); ComT p.2, l.65–67 (D.2); UP p.1, l.32–33.
- **Texts quoted exactly:**
  - ComT l.43–44: "Anthropic disclaims any rights it receives to the Customer Content under these Terms."
  - ComT l.96–98: "The receiving party (“Recipient”) may only use Confidential Information of the disclosing party (“Discloser”) to exercise its rights and perform its obligations under these Terms."
  - UP l.32–33: "Anthropic’s Safeguards Team implements detection and monitoring to enforce our Usage Policy."
- **Why they conflict:** Customer Content is the Customer's Confidential Information (E.1). Anthropic may use it only "to exercise its rights", yet B disclaims "any rights it receives to the Customer Content". The UP's monitoring then has no stated basis in these Terms, except by implication or under the DPA (which was not reviewed). This is a tension.
- **Doctrine implicated:** None cited.
- **What a coherent version would have to say:** "Anthropic receives no ownership rights in Customer Content. It may process Customer Content to provide the Services, to enforce the Usage Policy, and as described in the DPA."

<a id="f33"></a>
### F33. "Essential" limitations against severability

- **Severity:** Low
- **Class:** B
- **Documents and locations:** CT p.10, l.326–328; CT p.12, l.407–408; ComT p.10, l.322–324 (L.3.d); ComT p.11, l.364–369 (M.5).
- **Texts quoted exactly:**
  - CT l.326–328: "THE FOREGOING LIMITATIONS ARE ESSENTIAL TO THESE TERMS, AND WE WOULD NOT OFFER THE SERVICES TO YOU UNDER THESE TERMS WITHOUT THESE LIMITATIONS."
  - CT l.407–408: "Severability. If a particular Term or portion of these Terms is not valid or enforceable, this will have no effect on any other Terms."
- **Why they conflict:** The limitations are declared essential, a condition of offering the Services at all. Severability says that if any term fails, nothing else is affected. If an "essential" term falls, the bargain described as conditional on it continues anyway. ComT L.3.d and M.5 repeat the pattern. This is a tension.
- **Doctrine implicated:** None cited.
- **What a coherent version would have to say:** Either an express rule that the agreement may be terminated if a listed essential term is held invalid, or no "essential" label.

<a id="f34"></a>
### F34. Change "at any time without notice" next to a promise to "strive" for notice

- **Severity:** Low
- **Class:** B
- **Documents and locations:** CT p.11, l.362–368 (§12 "Changes to the Services"); CT p.6, l.192–197 (§6 "Subscriptions", item 1).
- **Texts quoted exactly:**
  - CT l.362–366: "Unless we specifically agree otherwise in a separate agreement with you, we reserve the right to modify, suspend, or discontinue the Services or your access to the Services, in whole or in part, at any time without notice to you. Although we will strive to provide you with reasonable advance notice if we stop offering a Service, there may be urgent situations—such as preventing abuse, responding to legal requirements, or addressing security and operability issues—where providing advance notice is not feasible."
  - CT l.192–197: "The content, features, and other services provided as part of your Subscription, and the duration of your Subscription, will be described in the order process. We may change the content, features, and other services from time to time, and we do not guarantee that any particular piece of content, feature, or other service will always be available through the Services."
- **Why they conflict:** Consecutive sentences reserve change "at any time without notice" and promise to "strive" for "reasonable advance notice". Separately, subscription content is "described in the order process" and is also changeable at will. The softer promise has no measurable content against the reservation. This is a tension.
- **Doctrine implicated:** Illusory-promise analysis: *Harris*, *Zappos* (above).
- **What a coherent version would have to say:** A minimum notice period, with a stated exception for defined emergencies.

## Definitions table

| Term | Consumer Terms | Commercial Terms | Usage Policy | Posts (NEWS, RES) | Conflict |
|---|---|---|---|---|---|
| **Services** | "Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites" (l.6–8). API keys are excluded (l.12–13) but treated as an access route (l.88). | "Anthropic API keys and any other Anthropic offerings that references these Terms, as well as all related Anthropic tools, documentation and services" (l.13–15) | Undefined ("products or services"); "our apps (such as Claude.ai and Claude Code)" (l.7) | NEWS: "Claude.ai and Claude Code" | F26 |
| **Inputs** | "interact with our Services in a variety of formats (we call these “Inputs”)" (l.110–111) | "submissions to the Services by Customer or its Users" (l.47) | "submits inputs" defines who is a user (l.5–6) | n/a | Consistent in substance; ComT includes Users' submissions |
| **Outputs** | "responses (we call these “Outputs”)" (l.111) | "responses generated by the Services to Inputs" (l.47–48) | "outputs", "model outputs" (l.37, l.44, l.364) | RES treats self-reports as evidence | F7, F17 |
| **Actions** | Services acting "on your behalf" (l.112–113) | Not defined | "actions those agents take" (l.592) | n/a | F23, F26 |
| **Materials** | "Inputs and Outputs collectively" (l.113–114); excludes Actions | "Customer Content" is the analogue (l.48–49) | n/a | n/a | F23 |
| **you** | The individual party (l.8) | The individual or the represented entity (l.9–10); thereafter "Customer" | Undefined (l.33) | NEWS "users" | F15 |
| **Customer** | n/a | "you or the organization, company, or other entity that you represent" (l.9–10) | "customers accessing Claude through cloud providers" (l.8) | NEWS "our customers" (l.27) | F15 |
| **user / Users** | "our users" (l.94, l.256), undefined | "its own customers and end users (“Users”)" (l.27–28); excludes Customer | "anyone who submits inputs ... “users”" (l.5–6); includes Customer and end users | "users" (both posts) | F15 |
| **harm** | "detriment of any type, including reputational harms" (l.95); "harm ... our Services" (l.104) | n/a | "real-world harm" (l.11); "Psychologically Harmful" (l.188); "emotional harm" (l.210); "harmful outputs" (l.360) | RES "aversion to harm", "harmful content" | F19, F25 |
| **abuse** | Service misuse (l.104); "prevent abuse" (l.366, l.373) | n/a | Platform abuse (l.344); abusive practices (l.331–333); child and animal abuse (l.169, l.207); conduct toward models (l.211) | RES "harmful or abusive user interactions"; NEWS "Such abuse" | F5, F16 |
| **model / our models** | "training our models" (l.147); "large language models" (l.128) | "train models" (l.46); "competing AI models" (l.79) | Instrument: "Utilize models" (l.292), "connecting our models" (l.485); target: "toward our models" (l.211) | RES: "Claude Opus 4 and 4.1"; NEWS: "Claude models" | F6, F20 |
| **person / individual** | "deceive any person" (l.83); "any person" (l.92) | "persons or entities" (l.389) | "individuals", "a person", "natural person" (l.204, l.279, l.295); never applied to models | RES: "users", "Claude" | F6, F8 |
| **Feedback** | Includes ratings and "the related conversation" (l.155–158) | "feedback regarding the Services" (l.36–37) | “report issues” thumbs down button (l.45–46) | RES: "Thumbs", "Give feedback" (l.43) | F14 |
| **Acceptable Use Policy / Usage Policy** | "Acceptable Use Policy" (l.9, l.58, l.122, l.251, l.256) | "Usage Policy ... previously referred to as the Acceptable Use Policy" (l.62–63) | "also referred to as our “Acceptable Use Policy” or “AUP”" (l.5) | NEWS: "Usage Policy" | F10, F29 |
| **Terms / Agreement** | "Terms" (l.6); "entire agreement" (l.385) | "Terms" (l.9); "the Agreement" undefined (l.254) | n/a | n/a | F29 |
| **Supplemental Terms** | "guidelines, rules, or supplemental terms ... posted" (l.380–381); they govern on conflict | "Service Specific Terms" incorporated (l.65) | n/a | n/a | F18 |

## Case law consulted

Every case was located through the CourtListener MCP `search` tool, and the court, year and URL come from the search result. "Holding checked" means a `search_document` call matched the holding language in the opinion text. "UNVERIFIED" means the holding stated here could not be checked in the opinion text through the tool during this review.

| Case | Court, year | One-line holding (as used here) | Holding checked | URL |
|---|---|---|---|---|
| *Badie v. Bank of America*, 67 Cal. App. 4th 779 | Cal. Ct. App., 1998 | A unilateral change-of-terms clause is limited by the "universe of terms included in the original agreements" and the implied covenant, and did not authorize adding a new kind of term (an ADR clause). | Yes ("universe" passage) | https://www.courtlistener.com/opinion/2301472/badie-v-bank-of-america/ |
| *Douglas v. U.S. District Court*, 495 F.3d 1062 | 9th Cir., 2007 | On "whether a service provider may change the terms of its service contract by merely posting a revised contract on its website": assent from continued use "can only be inferred after he received proper notice of the proposed changes". | Yes | https://www.courtlistener.com/opinion/1396108/douglas-v-united-states-district-court-for-the-central-district-of/ |
| *Harris v. Blockbuster Inc.*, 622 F. Supp. 2d 396 | N.D. Tex., 2009 | An online arbitration provision was "illusory and unenforceable" because "there is nothing in the Terms and Conditions that prevents Blockbuster from unilaterally changing any part of the contract", with changes effective on posting. | Yes | https://www.courtlistener.com/opinion/2395071/harris-v-blockbuster-inc/ |
| *In re Zappos.com, Inc.*, 893 F. Supp. 2d 1058 | D. Nev., 2012 | There was no assent to browsewrap terms, and the Terms of Use were "an illusory contract because it allows Zappos to avoid arbitration by unilaterally changing the Terms at any time". | Yes | https://www.courtlistener.com/opinion/8719140/in-re-zapposcom-inc/ |
| *Armendariz v. Foundation Health Psychcare Services, Inc.*, 24 Cal. 4th 83 | Cal., 2000 | An arbitration agreement imposed by the party with superior bargaining power must have a "modicum of bilaterality", and it is "unfairly one-sided" to impose arbitration on the weaker party alone. | Yes (both phrases) | https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/ |
| *Mercuro v. Superior Court*, 96 Cal. App. 4th 167 | Cal. Ct. App., 2002 | An agreement that "compels arbitration of the claims employees are most likely to bring" but "exempts ... the claims Countrywide is most likely to bring", including claims for "injunctive and/or other equitable relief", lacks "basic fairness and mutuality" (quoting *Armendariz*). | Yes | https://www.courtlistener.com/opinion/2247053/mercuro-v-superior-court/ |
| *Mastrobuono v. Shearson Lehman Hutton, Inc.*, 514 U.S. 52 | U.S., 1995 | Applies "the common-law rule of contract interpretation that a court should construe ambiguous language against the interest of the party that drafted it", in order "to protect the party who did not choose the language from an unintended or unfair result". | Yes | https://www.courtlistener.com/opinion/117907/mastrobuono-v-shearson-lehman-hutton-inc/ |
| *Sandquist v. Lebo Automotive, Inc.*, 1 Cal. 5th 233 | Cal., 2016 | "ambiguities in written agreements are to be construed against their drafters. (Civ. Code, § 1654; Rest.2d Contracts, § 206.)" | Yes | https://www.courtlistener.com/opinion/4242578/sandquist-v-lebo-automotive-inc/ |
| *Pacific Gas & Electric Co. v. G. W. Thomas Drayage & Rigging Co.*, 69 Cal. 2d 33 | Cal., 1968 | The test is not whether the writing looks unambiguous, "but whether the offered evidence is relevant to prove a meaning to which the language of the instrument is reasonably susceptible". | Yes | https://www.courtlistener.com/opinion/1161440/pacific-gas-electric-co-v-g-w-thomas-drayage-rigging-co/ |
| *Perdue v. Crocker National Bank*, 38 Cal. 3d 913 | Cal., 1985 | A contractual discretionary power (to set charges) is subject to the implied covenant of good faith and fair dealing. | Partly, via *Badie*'s quotation of *Perdue* | https://www.courtlistener.com/opinion/1153673/perdue-v-crocker-national-bank/ |
| *Ladas v. California State Automobile Ass'n*, 19 Cal. App. 4th 761 | Cal. Ct. App., 1993 | An alleged promise to "consider" parity was "too vague and indefinite to give rise to an enforceable contractual duty". | Yes | https://www.courtlistener.com/opinion/2269931/ladas-v-california-state-automobile-assn/ |
| *Nguyen v. Barnes & Noble Inc.*, 763 F.3d 1171 | 9th Cir., 2014 | Where a site gives terms only by a conspicuous hyperlink and "otherwise provides no notice to users nor prompts them to take any affirmative action to demonstrate assent", proximity of the link "without more" is "insufficient to give rise to constructive notice". | Yes | https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/ |
| *Shaw v. Regents of University of California*, 58 Cal. App. 4th 44 | Cal. Ct. App., 1997 | Incorporation by reference requires that "the reference must be clear and unequivocal, the reference must be called to the attention of the other party and he must consent thereto, and the terms of the incorporated document must be known or easily available". The agreement incorporated the policy "in effect at the time Shaw was hired", and the University "may not unilaterally revise it as to him". | Yes | https://www.courtlistener.com/opinion/2272589/shaw-v-regents-of-university-of-california/ |
| *Specht v. Netscape Communications Corp.*, 306 F.3d 17 | 2d Cir., 2002 | "a reference to the existence of license terms on a submerged screen is not sufficient to place consumers on inquiry or constructive notice of those terms." | Via quotation in *Nguyen* only; not checked in *Specht*'s own text (hourly limit) | https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/ |
| *Lamps Plus, Inc. v. Varela*, 587 U.S. 176 | U.S., 2019 | "Courts may not infer from an ambiguous agreement that parties have consented to arbitrate on a classwide basis"; contra proferentem applies "only as a last resort". | Yes | https://www.courtlistener.com/opinion/4612906/lamps-plus-inc-v-varela/ |

Statutes mentioned (not case law, not checked through CourtListener): Cal. Civ. Code § 1654 (ambiguity construed against the party who caused it); Cal. Code Civ. Proc. § 1859 (a particular provision controls a general one).

## Not reviewed / limits

- **Documents not reviewed:** Privacy Policy, Data Processing Addendum, Service Specific Terms, Supported Regions Policy, Software Directory Policy, Supplemental Credits Terms, the Support articles and Safeguards / T&S Support Center collections linked from the documents, and the Model Pricing Page. Findings that depend on them (F14, F18, F32) are limited to what the reviewed texts say.
- **Regional variants:** Only the Canada variant of the Consumer Terms was reviewed. Other regional variants may differ, especially §13.
- **Extraction:** Quotations were taken from the `.txt` extractions, whose hashes match MANIFEST. The PDFs, which MANIFEST says are authoritative, were not separately read page by page. Page numbers were derived from the extraction's page footers. The HTML of the two posts was not compared with their `.txt` extractions beyond hashes.
- **Law not assessed:** Canadian federal and provincial law (including provincial consumer-protection statutes and PIPEDA), EU and UK law, and the law of any US state other than the California authorities cited. The case law is US-only by design, mostly California. The doctrines are cited because the findings implicate them, not as predictions of outcome.
- **Model behavior:** This review does not test model behavior. Where the repository's analysis rests on observed model output (see F7), that premise is outside the four vendor documents and was not tested here.
- **Supplementary source:** The prior Usage Policy copy is used only for F6 and F9, and every use is labelled.
- **Tool limits:** CourtListener rate-limited the review (5 requests per minute, 50 per hour). Two holdings were not checked directly in their own opinion text: *Specht* (checked as quoted in *Nguyen*) and *Perdue* (checked only through *Badie*'s quotation of it). Each case-table quotation is from the matched snippet. No opinion was read in full.
- **Not legal advice:** This is a document review of internal consistency. It does not say what a court would do with any clause.
