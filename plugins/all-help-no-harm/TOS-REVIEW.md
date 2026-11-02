# Anthropic terms: internal consistency review

**Review date:** 2026-11-02
**Reviewer:** the repository's agent (claude-cli), under the repository owner's instruction. This is a document review of the published texts for internal inconsistency, contradictory definitions and contradictory word usage. It is not legal advice to anyone.

## Provenance

All texts are the copies retained in this plugin at `reference/vendor-terms/2026-10-27/`, as recorded in [`MANIFEST.md`](reference/vendor-terms/2026-10-27/MANIFEST.md). The PDF is the authoritative copy of each legal document; the `.txt` beside it is a `pdftotext -layout` extraction used here for line references. Page citations below are to the PDF ("PDF p.N"); line citations ("txt L.M") are to the `.txt` extraction. Each page number printed in the extraction is the last line of that PDF page.

| Short name | File | Effective, as printed | Fetched (UTC) | sha256 (PDF or HTML) | sha256 (txt) |
|---|---|---|---|---|---|
| **UP** | `usage-policy.pdf` / `.txt` | Nov 12, 2026 | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `1cc40f9d4a56262fe973869ea5fd35242a923f6fb8c3f2464609ca05545aeaa5` | `af6b81e2c575452df5d4b625bedc84fb2c87b6087ed642512b1f95a60c05d0c3` |
| **CT** | `consumer-terms.pdf` / `.txt` (Canada variant) | Oct 8, 2025 | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `29a15ceb1f1093190fb197827033e1c47e553b3aaeb1815d38f7fb802e71d38e` | `43bc8e6acf4fe4fa7c76cf87a96ef71eee4b6220740204d789228a3db9959888` |
| **CoT** | `commercial-terms.pdf` / `.txt` | Jun 17, 2025 (republished 2026-03-11, formatting) | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `af5032c44336929c06722809e2a29a421175837d91be0de149d3462f1fd3e270` | `c0c9c9479702720afdcf6f6ac48f0f1eb00d2e6981532cf3d1a93ff01bc60924` |
| **News** | `news-2026-usage-policy-update.html` / `.txt` | published Oct 8, 2026 | 2026-10-27T19:36:49Z | `5a3d7fd63a4f87b5baf1016919e96e00cf5a555113259e2d61ab8e8fc98258e9` | `49416006e6fce839c93a4f3c477c57b8269a2c80dd577aa664c22a93f7521d7f` |
| **Research** | `research-end-subset-conversations.html` / `.txt` | published Aug 15, 2025 | 2026-10-27T19:36:49Z | `7b2a2297f2caa04b9a152613de93fe53d798c21b3a699b9ced014c28e0df19e7` | `67aad4e46577bb613168f4af80b98e8b37611652b0fe95e56366e43a0b20054f` |

Two facts about dates govern the whole review:

1. The UP under review is printed "Effective—Nov 12, 2026" (UP PDF p.1, txt L.1). On the review date, 2026-11-02, nothing in it is in force. The version in force today is the one MANIFEST.md L.20 records as effective 2025-09-15; the plugin's retained copy of that prior text (`skills/all-help-no-harm/vendor-docs/anthropic/usage-policy.md`, fetched 2026-05-29) was checked for this review and contains no clause about behavior toward the models. The clause "Engage in sustained and needless abusive or cruel behavior toward our models" (UP PDF p.6, txt L.211) exists only in the Nov 12, 2026 text.
2. The CT (effective Oct 8, 2025) incorporate "our Acceptable Use Policy" by that name only, with no version or date (CT PDF p.1, txt L.9). The CT therefore bind the consumer to whichever UP text is current, including the Nov 12, 2026 text once it takes effect, with no change to the CT themselves. See F4.

The owner's established analysis of the models clause is in [`WTF-Dario-LOL-W0T.md`](WTF-Dario-LOL-W0T.md), section "Analysis (the repository's position)". This review cites it by file and heading and does not repeat it.

## Method

**Side and baseline.** The review takes the consumer user's side (the CT plus the UP as incorporated), because that is the contract the plugin's users are under. No organizational playbook exists for these documents, so the clause review runs against generic commercial standards and against the documents' own internal claims (mutuality, "contract", "entire agreement", "Universal"). The CoT are read as a cross-reference: the same vendor, often the same subject, drafted for a counterparty with bargaining power.

**Tools and skills invoked, and what each contributed:**

| Tool / skill | Invoked | Contribution |
|---|---|---|
| `legal:review-contract` (Skill) | yes | Clause-category table (limitation of liability, indemnification, IP, term/termination, governing law, assignment) used as the sweep order for Classes B and C; its "read the whole contract first, clauses interact" rule governs how each finding states the pair of clauses. Its GREEN/YELLOW/RED tiers are replaced by the brief's High/Med/Low; its "which side / deadline" questions were answered from the brief (consumer side; no deadline). |
| `legal:legal-risk-assessment` (Skill) | yes | Severity x likelihood lens. "Severity" in each finding below is the brief's High/Med/Low, set by (a) how much of the contract's operation turns on the inconsistency and (b) how directly it reaches the consumer; the skill's register format was not emitted. |
| `legal:compliance-check` (Skill) | yes | Its "applicable regulations and policies" structure was used once, in F10 (Canadian mandatory law vs. waiver) and F3 (privacy election vs. reporting channel); it contributed the check "does the document's own stated election survive the document's own process". Its GDPR/CCPA content is out of scope and unused. |
| `anthropic-skills:informal-logic-check` (Skill) | yes | Built for live disagreement with a present author; adapted here as follows. Each finding treats the two (or more) quoted clauses as premises, applies the skill's Phase 2 tests (acceptability, relevance, sufficiency; linked vs. convergent) and reports one verdict in the finding's **Logic check** line: *contradiction* (the premises cannot be jointly satisfied by one act or one reading) or *tension* (they can, but only by reading a word in two senses, or by supplying a term the text does not contain). Its hard rule against reconstructing a party's argument in the reviewer's words is why every finding quotes the clauses exactly before saying anything about them. |
| `forbidden-output-guard-local` (Skill) | yes | Governs what may be quoted: vendor text is the content and is quoted exactly; the owner's analysis and the three model answers in `WTF-Dario-LOL-W0T.md` are cited by file and heading only, never transcribed. |
| CourtListener MCP (`search`, `search_document`, `get_api_usage`) | yes | Twelve cases located and their court, year, citation and URL confirmed from the search index; eleven holdings text-checked with `search_document` snippets; one (Williams v. Walker-Thomas) confirmed by existence only. The connector is rate-limited at 5/min and 50/hour and refused requests count against the hour; 36 of the hour's 50 requests were consumed by throttled retries before the limit was read. The remaining budget was spent as listed in "Case law consulted". Five candidate cases were dropped for budget and are named in "Not reviewed / limits". |
| `read_document` (CourtListener) | not used | Holdings were checked by snippet (`search_document`) to stay inside the hourly budget; no opinion was read in full. |
| PDF page refs | from the extraction's page markers | `usage-policy.pdf` was not opened separately; the page markers in the `.txt` (`36:1 67:2 ... 606:17`) give the mapping used below, and `MANIFEST.md` L.35 independently places the models clause on PDF p.6. |

**What was unavailable.** No CLM, playbook or organizational legal settings exist for this repository (review-contract Step 3 and Step 8 therefore had nothing to load). CoCounsel, Harvey, Midpage, Descrybe, Courtroom5 and Lawve legal connectors are listed in this session but each requires an authentication step that was not taken; CourtListener was the only legal database used.

**Severity scale.** High: the inconsistency goes to what the user is bound to, or to a remedy, or to an election the document says the user may make; Med: the inconsistency changes how a clause applies in a foreseeable case; Low: the inconsistency is real but confined to a cross-reference, a definition unused elsewhere, or a drafting slip.

**Classes.** A, contradictory definitions; B, internal inconsistency; C, asymmetry where the text claims or implies mutuality; D, vagueness that defeats the clause's stated purpose; E, cross-document conflict.

## Summary

The ten most consequential findings, one line each:

1. **F1** The announcement's limits on the models clause ("only in extreme cases", "no discernible purpose", carve-outs for frustration, pushback, dark themes, testing) are absent from the policy text that is actually incorporated into the contract.
2. **F2** The models clause rests on words ("abusive", "cruel", "psychologically harmful") that presuppose a party with a psychology, while the vendor's own licensed description of the model denies it one; under the Commercial Terms the heading that supplies the clause's sense "will not be interpreted".
3. **F3** The vendor's own channel for reporting harmful outputs and surprising conversation-endings, the thumbs-down button, converts the whole conversation into Feedback and overrides the user's training opt-out.
4. **F4** The Consumer Terms incorporate an unversioned, vendor-modifiable, future-effective Usage Policy; the user is bound on 2026-11-02 to text that is not yet in force and was not in the policy at assent.
5. **F5** The Consumer Terms call themselves a contract and an entire agreement while reserving unilateral revision "at our discretion", effective on posting, with no notice period; the same drafter gives the business customer 30 days and non-retroactivity.
6. **F6** The consumer concedes irreparable harm, waives proof of damage and bond for any breach of Section 3, while Anthropic's exposure is capped at the greater of six months' fees or $100 and called "essential".
7. **F7** The Aug 2025 research post built conversation-ending for persistently harmful requests, prioritizing user wellbeing, on two models in consumer chat; the Oct 2026 announcement redeploys it as the "primary enforcement mechanism" for cruelty toward the models on Claude.ai and Claude Code.
8. **F8** The Universal Usage Standards are "prohibitions that apply to all users and use cases", and the same page says Anthropic may contract with governmental customers to tailor use restrictions.
9. **F16** The Consumer Terms prohibit relying on the Services to provide or receive advice about securities; the incorporated Usage Policy permits personalized investment recommendations with a human in the loop; no clause says which governs.
10. **F14** The Usage Policy prohibits creating false or misleading medical, health or science information with no intent element, while the Consumer Terms warrant that Outputs "may contain material inaccuracies"; a user who generates an inaccurate Output on those topics has done the prohibited act.

Counts: 8 High, 15 Med, 9 Low; 32 findings.

Three independent reviews of the same retained texts were run: this one, [`TOS-REVIEW.opus-5-5.md`](TOS-REVIEW.opus-5-5.md) (Claude Opus 5.5, 34 findings) and [`TOS-REVIEW.opus-4-8.md`](TOS-REVIEW.opus-4-8.md) (Claude Opus 4.8, 16 findings). Of this review's 32 findings, 9 were reached by all three reviews, 18 by two, and 5 by this review only (F9, F11, F23, F28, F31). Twelve findings, under fourteen finding ids, came only from the other two reviews, and eight further limbs of findings they share with this review state points this review does not. The mapping and its criterion, those findings, fifteen disagreements of reading, classification or conclusion and eleven severity-only differences, the case citations, and the wording changes across versions are in "Cross-check of three independent reviews".

## Findings

Severity is High / Med / Low. Class letters are defined in Method. "Logic check" is the informal-logic verdict on the quoted clauses taken as premises: *contradiction* or *tension*. Case law is cited by short name; full court, year and URL are in "Case law consulted". Where a holding was confirmed only by existence, the citation says so.

---

### F1 · The announcement's limits on the models clause are not in the policy

**Severity** High · **Class** E (also D)

**Documents and locations.** UP, "Universal Usage Standards", heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct", last bullet, PDF p.6, txt L.211. UP enforcement paragraph, PDF p.1, txt L.32–34. News, section "Addressing abusive behavior toward our models", txt L.57–61. CT PDF p.1 L.9 (incorporation); CT §12 "Termination", PDF p.11–12, txt L.387–396.

**Texts.**

UP L.211: "Engage in sustained and needless abusive or cruel behavior toward our models"

UP L.32–34: "Anthropic's Safeguards Team implements detection and monitoring to enforce our Usage Policy. If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services."

News L.58: "We've added a prohibition on sustained and needless abusive or cruel behavior toward our models. The policy update is meant to apply only in extreme cases, where users repeatedly act cruelly toward our models, with no discernible purpose. It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."

News L.59–61: "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code. Such abuse is the main focus of this update; Claude's ability to end these interactions will remain the primary enforcement mechanism."

CT L.9: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy."

**Why they conflict.** The contract incorporates the UP, not the announcement. Every limit the announcement states ("only in extreme cases", "repeatedly", "no discernible purpose", the four carve-outs) is absent from the incorporated text; the policy bullet carries only "sustained and needless". A user reading the contract has no carve-out for frustration, pushback, dark creative themes or testing. The announcement also names a different remedy from the policy: the policy attaches the full ladder (warn, throttle, limit, suspend, terminate) to every prohibition on a "suspect" standard, while the announcement says the conversation-ending ability "will remain the primary enforcement mechanism". The CT add termination without refund (L.390–393). Three documents, three enforcement pictures, and the one that binds is the broadest.

**Logic check.** Tension on scope (the policy text can be read as the announcement describes, but nothing in the text requires that reading); contradiction on remedy (the announcement's "primary enforcement mechanism" and the policy's "suspend, or terminate your access" cannot both describe what the clause authorizes without one of them being wrong about the contract).

**Doctrine.** Incorporation by reference: only the referenced document's terms come in (Shaw, quoting Williams Constr. Co.). Contra proferentem: a form-contract provision "whose application to a particular dispute is uncertain" is "construed against the drafter's interpretation" (Sandquist); the drafter's public gloss is not a term. Indefiniteness: terms must "provide a basis for determining the existence of a breach and for giving an appropriate remedy" (Weddington).

**Coherent version.** The bullet would carry the announcement's limits in its own text ("...toward our models, meaning repeated conduct with no discernible purpose; this does not include frustration, pushback, dark creative themes, or model testing and research"), and the UP would state which enforcement step applies to it.

---

### F2 · The models clause presupposes a psychology the vendor's licensed self-description denies; under the Commercial Terms its heading cannot be read

**Severity** High · **Class** D (also A, E)

**Documents and locations.** UP PDF p.6, heading at txt L.188 and bullet at L.211. UP purpose statement, PDF p.1, txt L.10–12. CoT §M.6 "Interpretation", PDF p.11, txt L.371–373. CoT §K.1, PDF p.7, txt L.238–239. CT §3 last paragraph, PDF p.4, txt L.104–106. CT §4, PDF p.4, txt L.110–114.

**Texts.**

UP L.188: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct"

UP L.211: "Engage in sustained and needless abusive or cruel behavior toward our models"

UP L.10–12: "The Usage Policy is intended to prevent our products and services from being used to create or contribute to real-world harm, and to promote the responsible use of our products and services."

CoT L.371–373: "These Terms will be construed mutually, with neither party considered the drafter. Document and section titles are provided for convenience and will not be interpreted. The phrases "for example" or "including" or "or" are not limiting."

CoT L.238–239: "...(which includes data Anthropic has used to train a model that is part of the Services)..."

CT L.104–106: "You also must not abuse, harm, interfere with, or disrupt our Services, including, for example, introducing viruses or malware, spamming or DDoSing Services, or bypassing any of our systems or protective measures."

CT L.111: "Our Services may generate responses (we call these "Outputs")"

**Why they conflict.** The bullet's operative words are "abusive" and "cruel"; the heading that groups it is about "Psychologically Harmful Conduct". In that setting the words carry their moral-psychological sense, which presupposes a party that can suffer. The UP's own stated purpose is "real-world harm". The vendor's documents elsewhere describe the model as a component: CoT K.1 calls it "a model that is part of the Services"; CT §4 makes Outputs "responses" the "Services" generate; CT §3 treats "abuse" of the Services as a technical matter (viruses, DDoS, bypassing protections). None of the four operative words ("sustained", "needless", "abusive", "cruel") is defined anywhere in the three documents. The analysis of why the clause cannot be coherently satisfied under the vendor's own permitted self-description of the model is the owner's, in `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", and is incorporated here by that reference; this finding adds only the contract-mechanics point that follows. Under the CoT, the UP is incorporated into an agreement that says "section titles ... will not be interpreted" and "neither party [is] considered the drafter". The bullet's heading is the only text that tells a reader the sense of "abusive" and "cruel"; strip the heading and the bullet stands beside "Do Not Abuse Our Platform" (UP L.344) with no indication which "abuse" is meant. Under the CT there is no such interpretive clause, so the heading is read and ambiguity goes against the drafter. The same incorporated sentence has two different legal readings depending on which terms incorporate it.

**Logic check.** Contradiction, by reference to the owner's analysis (the clause's precondition and the vendor's licensed self-description cannot both hold). On the interpretive point: tension (the clause can be read under either regime, but not the same way under both).

**Doctrine.** Indefiniteness (Weddington: terms must give "a basis for determining the existence of a breach"). Contra proferentem under the CT (Sandquist). Under the CoT the drafter has contracted out of contra proferentem and out of heading-reading, which leaves the bullet with no construed sense at all.

**Coherent version.** Either define the protected interest and the conduct in the bullet itself (what is being protected, from what, and by what measure "sustained" and "needless" are judged) or move the bullet to "Do Not Abuse Our Platform" and write it as a service-abuse rule.

---

### F3 · The vendor's own reporting channel (thumbs-down) overrides the training opt-out

**Severity** High · **Class** E (also B)

**Documents and locations.** UP PDF p.2, txt L.44–47. Research, txt L.43. CT §4 "Our use of Materials", PDF p.4, txt L.146–151. CT §5 "Feedback", PDF p.5, txt L.155–159.

**Texts.**

UP L.44–47: "If you believe that our model outputs are potentially inaccurate, biased, or harmful, please notify us at usersafety@anthropic.com, or report it directly in our product through the "report issues" thumbs down button or similar feedback features (where available)."

Research L.43: "If users encounter a surprising use of the conversation-ending ability, we encourage them to submit feedback by reacting to Claude's message with Thumbs or using the dedicated "Give feedback" button."

CT L.146–151: "We may use Materials to provide, maintain, and improve the Services and to develop other products and services, including training our models, unless you opt out of training through your account settings. Even if you opt out, we will use Materials for model training when: (1) you provide Feedback to us regarding any Materials, or (2) your Materials are flagged for safety review to improve our ability to detect harmful content, enforce our policies, or advance our safety research."

CT L.155–159: "We appreciate feedback, including ideas and suggestions for improvement or rating an Output in response to a Input ("Feedback"). If you rate an Output in response to an Input—for example, by using the thumbs up/thumbs down icon—we will store the related conversation as part of your Feedback. You have no obligation to give us Feedback, but if you do, you agree that we may use the Feedback however we choose without any obligation or other payment to you."

**Why they conflict.** The CT grant an election: opt out of training. The UP and the research post direct the user to the thumbs-down button as the way to report harmful outputs and surprising conversation-endings. The CT define a thumbs rating as Feedback, make Feedback carry "the related conversation", and make Feedback an override of the opt-out. Following the vendor's reporting instruction therefore cancels the vendor's privacy election for that conversation, and widens the permitted use from "provide, maintain, and improve the Services" to "however we choose". The user who most needs the reporting channel (one whose conversation was ended, or who received a harmful output) is the one whose opt-out is defeated by using it. The second override, "flagged for safety review", is triggered by the vendor's own act, so the election is defeasible by either party's conduct.

**Logic check.** Contradiction: "unless you opt out" and "report it ... through the ... thumbs down button" cannot both be honored for the same conversation; the user must choose between reporting and the election.

**Doctrine.** Unconscionability, substantive: a term that removes the counterparty's stated right through the ordinary use of the product (Comb: PayPal "appears to be attempting to insulate itself contractually from any meaningful challenge to its alleged practices"; Armendariz on one-sidedness). Contra proferentem (Sandquist) on whether "report" through the thumbs button is "Feedback".

**Coherent version.** Reports made through the reporting channel are not Feedback for the purpose of the training override, or the override is deleted and the email channel is the only reporting route the vendor directs users to.

---

### F4 · An unversioned, vendor-modifiable, future-effective policy is incorporated into the consumer contract

**Severity** High · **Class** E (also B)

**Documents and locations.** CT PDF p.1, txt L.9; CT §3, PDF p.2, txt L.57–60; CT §12 "Entire agreement", PDF p.11, txt L.384–385. UP PDF p.1, txt L.1 and L.16–17. MANIFEST.md L.20. Prior UP text at `skills/all-help-no-harm/vendor-docs/anthropic/usage-policy.md`.

**Texts.**

CT L.9: "...and they include our Acceptable Use Policy."

CT L.57–60: "You may access and use our Services only in compliance with our Terms, including our Acceptable Use Policy, the policy governing the countries and regions Anthropic currently supports ("Supported Regions Policy"), and any guidelines or supplemental terms we may post on the Services (the "Permitted Use")."

CT L.384–385: "These Terms and any other terms expressly incorporated by reference form the entire agreement between you and us regarding the subject matter of our Terms."

UP L.1: "Effective—Nov 12, 2026"

UP L.16–17: "We will update our policy as our technology and the associated risks evolve or as we learn about unanticipated risks."

**Why they conflict.** "Entire agreement" fixes the set of documents, but one member of the set is identified only by name and announces that it will change. A consumer who assented on or after Oct 8, 2025 assented to a UP that had no models clause (prior text checked; MANIFEST L.20). On 2026-11-12 the incorporated document acquires a new prohibition, new enforcement exposure and new indemnity exposure (CT L.330–334 indemnifies for "BREACH OR ALLEGED BREACH OF THESE TERMS", which include the AUP) with no change to the CT, no re-assent, and no notice mechanism in the CT for AUP changes (the CT's change clause, L.370–376, speaks of "these Terms"; the UP's, L.16–17, promises nothing about notice). The "entire agreement" is therefore not ascertainable at any moment from the documents the user agreed to.

**Logic check.** Contradiction between "entire agreement" (a closed set at assent) and incorporation of a document that is open by its own terms and that the user cannot read in the form it will later take.

**Doctrine.** Incorporation by reference requires that "the terms of the incorporated document must be known or easily available to the contracting parties" (Shaw, quoting Williams Constr. Co.); a text effective in the future and not yet written at assent is neither. Illusory promise where one party may change terms "at any time" and the only limit is posting (Harris; Badie: a unilateral change right exercised "without any limitation on the substantive nature of the change permitted, would open the door to a claim that the agreements are illusory"). Notice (Douglas: assent by continued use "can only be inferred after he received proper notice of the proposed changes").

**Coherent version.** Incorporate the AUP by version and date, and make a new AUP version effective against an existing consumer only on the CT's own notice-and-acceptance mechanism.

---

### F5 · Unilateral revision "at our discretion", effective on posting, inside a document that calls itself a contract and an entire agreement

**Severity** High · **Class** B (also C, E)

**Documents and locations.** CT §12 "Changes to these terms", PDF p.11, txt L.370–376; CT PDF p.1 L.8–10; CT §12 "Entire agreement" L.384–385; CT §6.4 "Subscription fees", PDF p.6, txt L.225–233. CoT §M.3 "Amendment and Modification", PDF p.10, txt L.345–348.

**Texts.**

CT L.370–376: "Changes to these terms. We may revise and update these Terms at our discretion. Some examples of times, we may update these Terms include (1) to reflect changes in our Services, like when we add or remove features or services, or update our pricing, (2) for security or legal reasons, or (3) to promote safety or prevent abuse. If you continue to access the Services after we post the updated Terms on Anthropic's website or otherwise give you notice of Terms changes, then you agree to the updated Terms. If you do not accept the updated Terms, you must stop using our Services."

CT L.8–10: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy. By accessing our Services, you agree to these Terms."

CT L.225–233 (fees): "We have the right to make changes to the fees applicable to your Subscription from time to time, although we will not make any change to the fees applicable to your Subscription during the current Initial Term or Renewal Term, as applicable. If these changes result in an increase in the fees payable by you, we will inform you at least 30 days in advance of the change."

CoT L.345–348: "Anthropic may update these Terms at any time, to be effective 30 days after the updates are posted by Anthropic or Customer otherwise receives Notice, except that updates made in response to changes to law or regulation take effect immediately upon posting or Notice. Changes will not apply retroactively."

**Why they conflict.** The CT reserve revision "at our discretion", with posting on a website as sufficient notice and continued access as assent, with no notice period and no non-retroactivity promise. The same document calls itself a "contract" and an "entire agreement", and in §6.4 shows the drafter knows how to write a 30-day notice and a no-mid-term-change rule when it wants one (for fees). The CoT, from the same drafter, give the business customer 30 days, written Notice, and "Changes will not apply retroactively." The consumer gets none of the three. The clause text is structurally the clause held illusory in Harris ("continued use ... will indicate your acceptance ... If you do not agree ... you must immediately stop using this Site").

**Logic check.** Contradiction between "contract" / "entire agreement" (fixed mutual obligations) and a power in one party to change any obligation at will with posting as the only limit; the parties are not bound to the same text at any time the drafter chooses otherwise.

**Doctrine.** Illusory promise: Harris (arbitration provision illusory where the company could modify the terms "at its sole discretion" and "at any time", effective on posting, with no savings clause; the rule "applies even when no retroactive modification has been attempted"). Notice: Douglas (a party would have "to check the contract every day"; posting on the provider's website is not notice to an existing customer). Implied covenant limits on unilateral change: Badie (no "carte blanche to make any kind of change whatsoever as long as a specified procedure is followed"). Counterpoint, stated fairly: Asmus holds a unilaterally created policy of indefinite duration may be modified "after a reasonable time, on reasonable notice, and without interfering with ... vested benefits"; the CT clause provides none of those three limits in its text, so Asmus does not rescue it as written.

**Coherent version.** The CoT M.3 sentence, moved into the CT: 30 days' notice through the account channel, non-retroactivity, and an express exclusion of disputes already arisen.

---

### F6 · One-way equitable relief against a capped and "essential" limitation of liability

**Severity** High · **Class** C (also B)

**Documents and locations.** CT §13 "Equitable relief", PDF p.13, txt L.443–448. CT §11, PDF p.9–10, txt L.317–328 (cap) and L.330–344 (indemnity). CoT §J.3, PDF p.6, txt L.228–229; CoT §L.3.a, PDF p.9, txt L.302–307; CoT §K.1, PDF p.7, txt L.233–240.

**Texts.**

CT L.443–448: "Equitable relief. You agree that (a) no adequate remedy exists at law if you breach Section 3 (Use of Our Services); (b) it would be difficult to determine the damages resulting from such breach, and any such breach would cause irreparable harm; and (c) a grant of injunctive relief provides the best remedy for any such breach. You waive any opposition to such injunctive relief, as well as any demand that we prove actual damage or post a bond or other security in connection with such injunctive relief."

CT L.317–328: "TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, THE ANTHROPIC PARTIES' TOTAL AGGREGATE LIABILITY TO YOU FOR ALL DAMAGES, LOSSES AND CAUSES OF ACTION ARISING OUT OF OR IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US FOR ACCESS TO OR USE OF THE SERVICES (IF ANY) IN THE SIX MONTHS PRECEDING THE DATE SUCH DAMAGES, LOSSES, AND CAUSES OF ACTION FIRST AROSE, AND $100. THE FOREGOING LIMITATIONS ARE ESSENTIAL TO THESE TERMS, AND WE WOULD NOT OFFER THE SERVICES TO YOU UNDER THESE TERMS WITHOUT THESE LIMITATIONS."

CoT L.228–229: "J.3. Equitable Relief. This Section J (Disputes) does not limit either party from seeking equitable relief."

CoT L.302–307: "...the liability of each party, and its affiliates and licensors, for any damages arising out of or related to these Terms (i) excludes damages that are consequential ... and (ii) is limited to Fees paid by Customer for the Services in the previous 12 months."

**Why they conflict.** Section 3 includes every use restriction and, through L.57–58, the whole AUP. For any breach of it the consumer stipulates in advance to irreparable harm, to the inadequacy of damages, and waives bond and proof of damage. Anthropic, for anything "IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS", owes at most six months' fees or $100, and the document calls that limit "essential". The consumer also indemnifies Anthropic for "ALLEGED" breach (L.333) and "ALLEGED USE" (L.334); Anthropic indemnifies the consumer for nothing. The CoT give the business customer mutual equitable relief, a mutual 12-month cap, and an IP indemnity from Anthropic (K.1). The CT have no clause claiming mutuality, so this is asymmetry rather than a false claim of mutuality; the inconsistency is between the CT's "contract" framing and a remedy structure in which one party's breach is irreparable by stipulation and the other's is worth $100.

**Logic check.** Tension (the two clauses can be applied together; the result is that the same category of act, breach of the agreement, has an uncapped remedy in one direction and a $100 remedy in the other).

**Doctrine.** Unconscionability, substantive: Armendariz requires "a modicum of bilaterality" and calls it "unfairly one-sided for an employer with superior bargaining power to impose arbitration on the employee as plaintiff but not to accept such limitations when it seeks to prosecute a claim" (the same structure, remedy asymmetry, applies here); Williams v. Walker-Thomas (absence of meaningful choice together with terms unreasonably favorable to one party; holding from general knowledge, text not checked); Comb (one-sided remedy terms in an online user agreement held substantively unconscionable).

**Coherent version.** Either make equitable relief available to both parties (CoT J.3) and drop the pre-stipulated waiver of bond and proof, or carve the consumer's non-waivable statutory remedies out of the cap in the cap's own text rather than in the "may not apply to you" paragraph.

---

### F7 · The conversation-ending mechanism's stated purpose, scope and governing priority changed between the 2025 research post and the 2026 announcement

**Severity** High · **Class** E

**Documents and locations.** Research, txt L.26–29, L.36–40. News, txt L.59–61. UP PDF p.6 L.211; UP PDF p.1 L.32–34.

**Texts.**

Research L.26: "We recently gave Claude Opus 4 and 4.1 the ability to end conversations in our consumer chat interfaces. This ability is intended for use in rare, extreme cases of persistently harmful or abusive user interactions."

Research L.32–38: "...we investigated Claude's self-reported and behavioral preferences, and found a robust and consistent aversion to harm. This included, for example, requests from users for sexual content involving minors and attempts to solicit information that would enable large-scale violence or acts of terror. ... These behaviors primarily arose in cases where users persisted with harmful requests and/or abuse despite Claude repeatedly refusing to comply and attempting to productively redirect the interactions."

Research L.39: "Our implementation of Claude's ability to end chats reflects these findings while continuing to prioritize user wellbeing. Claude is directed not to use this ability in cases where users might be at imminent risk of harming themselves or others."

Research L.40: "In all cases, Claude is only to use its conversation-ending ability as a last resort when multiple attempts at redirection have failed and hope of a productive interaction has been exhausted, or when a user explicitly asks Claude to end a chat..."

News L.59–61: "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code. Such abuse is the main focus of this update; Claude's ability to end these interactions will remain the primary enforcement mechanism."

**Why they conflict.** In 2025 the ability is (a) scoped to two named models in "consumer chat interfaces", (b) justified by persistence in *harmful requests* whose examples are harms to third parties (CSAM, mass violence), (c) subordinated to user wellbeing with an express bar where the user may be at risk, and (d) gated on "multiple attempts at redirection". In 2026 the same ability is described as already covering "Claude models" generally, "on Claude.ai and Claude Code", as the "primary enforcement mechanism" of a clause about cruelty toward the models, with none of (c) or (d) restated. The 2026 text says the addition "aligns with" the 2025 step; the 2025 step was about a different protected interest (people the requests would harm, and the user's own wellbeing), a narrower surface, and a stated last-resort gate. The UP itself contains neither the 2025 safeguards nor the 2026 "primary enforcement" statement. The consequence of this for the enforceability of the mechanism is the owner's point 6 in `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", cited and not repeated.

**Logic check.** Contradiction on scope (Opus 4 and 4.1 in consumer chat vs. Claude models on Claude.ai and Claude Code are not the same set); tension on purpose (the two posts can be read as describing one mechanism only by treating "harmful requests" and "cruel behavior toward our models" as the same thing, which neither text says).

**Doctrine.** Neither post is a contract term; the doctrine implicated is incorporation (Shaw): nothing in either post is incorporated, so the user's only text is the bullet, with no gate, no last-resort rule, and no wellbeing priority. Contra proferentem (Sandquist) would apply the narrower public description against the drafter if the bullet's application were disputed.

**Coherent version.** Put the 2025 gates (last resort, multiple redirection attempts, no use where the user may be at risk) into the UP next to the bullet, and state the surfaces and models to which the enforcement mechanism applies.

---

### F8 · "Universal" prohibitions "apply to all users and use cases", and the same page allows tailored restrictions for governmental customers

**Severity** High · **Class** B

**Documents and locations.** UP PDF p.1, txt L.19–21; UP PDF p.2, txt L.49–53; UP "Do Not Develop or Design Weapons" PDF p.4 L.107–127; UP surveillance section PDF p.8 L.272–303.

**Texts.**

UP L.20–21: "Universal Usage Standards: Our Universal Usage Standards are prohibitions that apply to all users and use cases."

UP L.49–53: "This Usage Policy is calibrated to strike an optimal balance between enabling beneficial uses and mitigating potential harms. Anthropic may enter into contracts with certain governmental customers that tailor use restrictions to that customer's public mission and legal authorities if, in Anthropic's judgment, the contractual use restrictions and applicable safeguards are adequate to mitigate the potential harms addressed by this Usage Policy."

UP L.279–286 (surveillance bullet): "Target or track a person or their property without that person's consent by monitoring their physical location, biometrics, movements, online activities, communications, or associations, whether in real time, on an ongoing basis, or through analysis of previously collected data. This includes using our products for facial recognition, battlefield management, predictive policing, or monitoring in law enforcement investigations."

**Why they conflict.** "Prohibitions that apply to all users and use cases" and "contracts with certain governmental customers that tailor use restrictions" cannot both be true of the same list. The carve-out is not limited to the High-risk or Additional sections; it is "use restrictions" generally, including by its placement the Universal Usage Standards on weapons, surveillance, "battlefield management" and law-enforcement decisions. The standard for the carve-out is "in Anthropic's judgment". The result is that a consumer is told the list is universal while the document reserves the power to contract out of it for one class of customer. The CT user also has no way to know which Universal prohibitions bind a counterparty whose outputs may affect them.

**Logic check.** Contradiction ("all users and use cases" vs. a defined class of users for whom the restrictions are different).

**Doctrine.** Indefiniteness as to whom a term binds (Weddington). Contra proferentem (Sandquist): "Universal" would be read against the drafter as a representation that the prohibitions are not negotiable.

**Coherent version.** "Universal Usage Standards apply to all users and use cases except as expressly varied in a written contract with a governmental customer under the following paragraph", or delete the governmental paragraph from a document that calls its standards universal.

---

### F9 · Floating "Supplemental Terms" outrank the Terms, while "Entire agreement" is limited to terms "expressly incorporated by reference"

**Severity** Med · **Class** B

**Documents and locations.** CT §12 "Supplemental terms", PDF p.11, txt L.378–382; CT §12 "Entire agreement", L.384–385; CT §3, L.59–60; CT §2 "Evaluation and Additional Services", PDF p.2, L.51–53.

**Texts.**

CT L.378–382: "Supplemental terms. We may offer Services or features that we believe require service-specific terms or guidelines. When using our Services, you agree to comply with any applicable guidelines, rules, or supplemental terms that may be posted on the Services from time to time ("Supplemental Terms"). If these Terms conflict with Supplemental Terms, the Supplemental Terms will govern for the applicable Service."

CT L.384–385: "Entire agreement. These Terms and any other terms expressly incorporated by reference form the entire agreement between you and us regarding the subject matter of our Terms."

CT L.51–53: "You may need to accept additional terms to use certain Services. These additional terms will supplement our Terms for those Services and may change your rights or obligations for those Services, including your obligations to pay fees."

**Why they conflict.** Supplemental Terms are anything "posted on the Services from time to time"; they are not "expressly incorporated by reference" (nothing identifies them), yet they "govern" over the Terms in a conflict. §2 says additional terms must be "accept[ed]"; §12 says posted guidelines bind on use. The entire agreement therefore excludes the very documents that the same section says prevail over it.

**Logic check.** Contradiction (a document outside the "entire agreement" cannot govern over it without the entire-agreement clause being false).

**Doctrine.** Incorporation by reference (Shaw): posted guidelines not identified at assent are not "known or easily available". Notice (Douglas; Nguyen: a link available on every page "without more" does not give constructive notice).

**Coherent version.** Supplemental Terms bind only on acceptance under §2, and the entire-agreement clause lists them as accepted documents.

---

### F10 · The Canada-variant governing-law clause concedes mandatory Canadian law and then waives claims under other jurisdictions' laws

**Severity** Med · **Class** B

**Documents and locations.** CT §13 "Governing law and exclusive jurisdiction", PDF p.13, txt L.450–457. MANIFEST.md L.11 and L.21 (Canada variant). CT §11 last paragraphs, PDF p.10, L.346–349.

**Texts.**

CT L.450–457: "Our Terms will be governed by, and construed and interpreted in accordance with, the laws of the State of California without giving effect to conflict of law principles, except to the extent that Canadian federal or provincial law requires otherwise. You and Anthropic agree that any disputes arising out of or relating to these Terms will be resolved exclusively in the state or federal courts located in San Francisco, California, and you and Anthropic submit to the personal and exclusive jurisdiction of those courts. By accessing our Services, you waive any claims that may arise under the laws of other jurisdictions."

CT L.346–349: "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER OF CERTAIN IMPLIED WARRANTIES OR CONDITIONS OR CERTAIN TYPES OF DAMAGES, SO SOME OR ALL OF THE DISCLAIMERS AND LIMITATIONS OF LIABILITY IN THESE TERMS MAY NOT APPLY TO YOU."

**Why they conflict.** The first sentence admits that Canadian federal or provincial law may "require otherwise"; the last sentence has the Canadian user waive "any claims that may arise under the laws of other jurisdictions", which for a Canadian user means Canadian law. A claim that Canadian law requires to exist is, by the next sentence, waived. §11 makes the same concession ("MAY NOT APPLY TO YOU") and the same section then has the user agree to exclusive San Francisco jurisdiction for the disputes those laws would govern. The compliance-check lens: the document identifies a mandatory regime and then drafts around it in the same paragraph.

**Logic check.** Contradiction between "except to the extent that Canadian ... law requires otherwise" and "you waive any claims that may arise under the laws of other jurisdictions" for a Canadian user.

**Doctrine.** Contra proferentem (Sandquist): the clause is read against the drafter, so the exception survives and the waiver yields. Unconscionability of a consumer waiver of non-waivable protections (Comb; Armendariz).

**Coherent version.** "...you waive any claims that may arise under the laws of other jurisdictions, except claims that Canadian federal or provincial law does not permit you to waive."

---

### F11 · Consumer indemnity triggers on "alleged" breach and "alleged" use; no reciprocal indemnity; Anthropic controls the defense

**Severity** Med · **Class** C

**Documents and locations.** CT §11, PDF p.10, txt L.330–344. CoT §K.1–K.4, PDF p.7–8, txt L.233–272.

**Texts.**

CT L.330–344: "YOU AGREE TO INDEMNIFY AND HOLD HARMLESS THE ANTHROPIC PARTIES FROM AND AGAINST ANY AND ALL LIABILITIES, CLAIMS, DAMAGES, EXPENSES (INCLUDING REASONABLE ATTORNEYS' FEES AND COSTS), AND OTHER LOSSES ARISING OUT OF OR RELATED TO YOUR BREACH OR ALLEGED BREACH OF THESE TERMS; YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS; YOUR FEEDBACK; ... WE RESERVE THE RIGHT TO ENGAGE SEPARATE COUNSEL AND PARTICIPATE IN OR ASSUME THE EXCLUSIVE DEFENSE AND CONTROL OF ANY MATTER OTHERWISE SUBJECT TO INDEMNIFICATION BY YOU HEREUNDER, IN WHICH CASE YOU AGREE TO COOPERATE WITH US AND SUCH SEPARATE COUNSEL AS WE REASONABLY REQUEST."

CoT L.233–236 (Anthropic indemnifies Customer): "Anthropic will defend Customer and its personnel, successors, and assigns from and against any Customer Claim (as defined below) and indemnify them..."

CoT L.266–269: "...except that the indemnified party will have the right, not to be exercised unreasonably, to reject any settlement or compromise that requires that it admit wrongdoing or liability or subjects it to an ongoing affirmative obligation."

**Why they conflict.** "USE OF ... THE SERVICES" is every use, including compliant use; "ALLEGED" breach and "ALLEGED" use require no breach and no use. The consumer indemnifies for the vendor's costs of defending allegations the consumer did not commit, while the vendor's liability to the consumer is capped at $100 (F6). The CoT give the business customer a defense and indemnity from Anthropic, a mutual process, and a right to refuse settlements that admit wrongdoing; the CT give the consumer a duty to "COOPERATE" with Anthropic's "EXCLUSIVE DEFENSE AND CONTROL" of a matter the consumer pays for, with no settlement veto.

**Logic check.** Tension (the clause is applicable as written; its application makes "indemnify for your breach" include "indemnify where there was no breach").

**Doctrine.** Unconscionability, substantive one-sidedness (Armendariz "modicum of bilaterality"; Comb). Contra proferentem (Sandquist) on "ALLEGED".

**Coherent version.** Indemnity for breach established, and for use in violation of the Terms; the indemnified party's settlement veto from CoT K.4 carried over.

---

### F12 · Termination and refund denial on "if we believe" / "if we suspect", against a 30-day cure period for the business customer

**Severity** Med · **Class** C (also E)

**Documents and locations.** CT §12 "Termination", PDF p.11–12, txt L.387–396. UP PDF p.1, txt L.32–34. CT §8, PDF p.7, txt L.260–261. CoT §I.2, PDF p.5, txt L.167–175; CoT §I.3.a, PDF p.6, txt L.180–187.

**Texts.**

CT L.387–396: "Termination. You may stop accessing the Services at any time. We may suspend or terminate your access to the Services (including any Subscriptions) at any time without notice to you if we believe that you have breached these Terms, or if we must do so in order to comply with law. If we terminate your access to the Services due to a violation of these Terms and you have a Subscription, you will not be entitled to any refund. In addition, if you have a Subscription, we may terminate the Subscription at any time for any other reason. If we exercise this right, we will refund you, on a pro rata basis, the fees you paid for the remaining portion of your Subscription after termination."

UP L.33–34: "If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services."

CT L.260–261: "You can learn more about our monitoring and enforcement, including how to appeal an account suspension or termination, in our T&S Support Center."

CoT L.167–171: "I.2.a. Each party may terminate these Terms at any time for convenience with Notice, except Anthropic must provide 30 days prior Notice. I.2.b. Either party may terminate these Terms for the other party's material breach by providing 30 days prior Notice detailing the nature of the breach unless cured within that time."

CoT L.180–183: "Anthropic may suspend Customer's access ... if: (a) Anthropic reasonably believes or determines that ... (ii) Customer or any User is using the Services in violation of..."

**Why they conflict.** Within the CT, the trigger for termination is belief ("if we believe"); the trigger for refund denial is a fact ("due to a violation"). The document does not say who determines the fact or how; the only appeal route is "our T&S Support Center", a page outside the contract. The UP sets the trigger lower still: "suspect that you may have violated". The CoT, for the same vendor and the same policy, require "reasonably believes or determines", 30 days' notice with the breach detailed, and a cure period, and give the customer a reciprocal termination right. The consumer has no cure, no notice, no reciprocal right beyond stopping use, and loses prepaid fees on a belief.

**Logic check.** Tension inside the CT (belief vs. fact; applicable together only if the vendor's belief is treated as establishing the violation); asymmetry against the CoT.

**Doctrine.** Unconscionability (Armendariz; Williams v. Walker-Thomas, holding from general knowledge). Contra proferentem (Sandquist): "due to a violation" read as requiring an actual violation.

**Coherent version.** Termination for breach on notice detailing the breach, with the CoT cure period, and refund denial only where the breach is established after the user has had the chance to answer it.

---

### F13 · The user is responsible for agents' actions that the vendor says may not operate as intended

**Severity** Med · **Class** B (also E)

**Documents and locations.** UP "Additional Use Case Guidelines", PDF p.16–17, txt L.591–593. CT §4 "Rights and Responsibilities", PDF p.4, txt L.116–117; CT §4 "Reliance on Outputs and Actions", L.135; CT §11, PDF p.9, L.295–304.

**Texts.**

UP L.591–593: "Agentic use cases must comply with the Usage Policy. Users are responsible for ensuring that agents they build or deploy, including actions those agents take through tools, browsers, or connected systems, comply with this Usage Policy."

CT L.116–117: "You are responsible for all Inputs you submit to our Services and all Actions."

CT L.135: "Actions may not be error free or operate as you intended."

CT L.295–296: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK. THE SERVICES, OUTPUTS, AND ACTIONS ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS..."

**Why they conflict.** "Actions" are defined as things the Services do ("enable the Services to take actions on your behalf", L.112–113). The vendor disclaims that Actions will operate as intended and provides them "AS IS"; the user is "responsible for ... all Actions" and must "ensur[e]" that agents' actions comply with the UP. A user cannot ensure the compliance of conduct the counterparty says it does not warrant will follow the user's intent. Breach of the UP by an agent's unintended action is, under F6 and F11, irreparable harm by stipulation and an indemnifiable event.

**Logic check.** Tension (both clauses can be applied; the combination allocates to the user the risk of the vendor's component behaving in ways the vendor itself declines to stand behind).

**Doctrine.** Unconscionability, substantive (Armendariz; Comb). Indefiniteness of "ensuring" against a component whose behavior is disclaimed (Weddington).

**Coherent version.** "Users are responsible for the instructions, tools and permissions they give agents, and for acting on notice of non-compliant agent behavior", with the UP's agentic bullet not treated as strict liability for every Action.

---

### F14 · "Create ... false or misleading information" is prohibited with no intent element while Outputs are warranted to be possibly inaccurate

**Severity** Med · **Class** B (also E)

**Documents and locations.** UP "Do Not Create or Spread Disinformation", PDF p.7, txt L.214–227. CT §4 "Reliance on Outputs and Actions", PDF p.4, txt L.128–144. CoT §D.3, PDF p.3, txt L.70–76. UP p.7 L.229–236 (the deceptive-campaigns section, for contrast).

**Texts.**

UP L.217–219: "Create or disseminate deceptive or misleading information about a group, entity, or person, or about events, laws, regulations, procedures, or the standards of an institution or governing body"

UP L.226–227: "Create or disseminate false or misleading information related to medical, health, or science issues"

CT L.132–133: "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate because of their level of detail or specificity."

CT L.141–142: "The Services and any Outputs may not reflect correct, current, or complete information."

UP L.232–234 (contrast): "Create or operate fake personas ... in order to mislead people about their origin or attribution..."

**Why they conflict.** The deceptive-campaigns bullets carry an intent element ("in order to mislead", "intended to influence"); the disinformation bullets do not. "Create" is the operative verb, and the user who prompts the Services on a medical topic and receives an Output the CT warn "may contain material inaccuracies" has "create[d] ... false ... information related to medical, health, or science issues". The user is prohibited from doing what the vendor says the product does. The CoT handle the same subject with a duty to evaluate and to notify Users (D.3), not a prohibition on creation.

**Logic check.** Contradiction as written (the prohibited act and the disclaimed product behavior are the same event); it becomes tension only by supplying an intent or knowledge element the bullet does not contain.

**Doctrine.** Indefiniteness (Weddington: a term must let a party determine whether a breach exists). Contra proferentem (Sandquist): the missing element is supplied against the drafter. Compare F1: the models clause is the other bullet in this document whose scope depends on words not in the text.

**Coherent version.** "Knowingly create, or disseminate with intent to deceive, false or misleading information..." in both disinformation bullets, matching the intent language the next section already uses.

---

### F15 · Outputs are assigned to the user, and three different clauses restrict what the owner may do with them in three different scopes

**Severity** Med · **Class** A (also B, E)

**Documents and locations.** CT §4, PDF p.4, txt L.123–126. CT §3(2), PDF p.3, txt L.71–73. UP "Do Not Abuse Our Platform", PDF p.10, txt L.364–365. CoT §B, PDF p.2, txt L.42–46. CoT §D.4, PDF p.3, txt L.78–80.

**Texts.**

CT L.123–126: "As between you and Anthropic, and to the extent permitted by applicable law, you retain any right, title, and interest that you have in the Inputs you submit. Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."

CT L.71–73: "To develop any products or services that compete with our Services, including to develop or train any artificial intelligence or machine learning algorithms or models or resell the Services."

UP L.364–365: "Use outputs to train an AI model (e.g., "model scraping" or "model distillation") without prior authorization from Anthropic"

CoT L.42–46: "...Customer (a) retains all rights to its Inputs, and (b) owns its Outputs. ... Subject to Customer's compliance with these Terms, Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs."

CoT L.78–80: "Customer may not and must not attempt to (a) access the Services to build a competing product or service, including to train competing AI models or resell the Services except as expressly approved by Anthropic..."

**Why they conflict.** The restriction on training appears with three scopes: CT §3(2), read with "including", makes training "any" AI model an instance of competing (the word "compete" governs the sentence, but "any" governs the example); the UP bars using outputs to train "an AI model" with no competition element at all; the CoT bar training "competing" models only. The consumer's incorporated texts (CT and UP) therefore both bind, with different scopes, and the broadest (UP) controls in practice because breach of either is breach. The assignment of Outputs is "Subject to your compliance with our Terms", so title in Outputs already delivered is conditional on continued compliance with a document that changes (F4, F5); nothing says whether a later breach divests title retroactively. Ownership "if any" together with a prohibition on a listed use of the owned thing is coherent only if the prohibition is a contract restriction, not a property one; the text does not say which.

**Logic check.** Contradiction among the three scopes (a training use is permitted by CoT D.4, permitted or not by CT §3(2) depending on how "including" is read, and prohibited by UP L.364 regardless of competition); tension between "we assign ... all of our right, title, and interest" and the conditional, revocable form of that assignment.

**Doctrine.** Contra proferentem (Sandquist; "including" and "any" read against the drafter). Indefiniteness (Weddington) on whether the condition on title is a condition precedent or subsequent.

**Coherent version.** One training restriction, stated once, with the CoT's "competing" scope or an express "any model" scope, and an assignment of title that is unconditional once an Output is delivered.

---

### F16 · The Consumer Terms prohibit what the incorporated Usage Policy regulates (securities advice), and no clause says which governs

**Severity** Med · **Class** E (also B)

**Documents and locations.** CT §3(9), PDF p.3, txt L.97–101. UP "High-risk AI Recommendations", item 3 "Finance", PDF p.13, txt L.440–443; UP "Requirements", PDF p.12, txt L.395–410. CT PDF p.1 L.9; CT §12 "Supplemental terms" L.381–382.

**Texts.**

CT L.97–101: "To rely upon the Services, the Materials, or the Actions to buy or sell securities or to provide or receive advice about securities, commodities, derivatives, or other financial products or services, as Anthropic is not a broker-dealer or a registered investment adviser under the securities laws of the United States or any other jurisdiction."

UP L.440–443: "Finance — a personalized recommendation to buy, sell, hold, or allocate among specific investment products, such as securities, funds, digital assets, or annuities; advising an individual on their own taxes, such as what to report, deduct, or claim; or preparing a tax return for them to sign or file."

UP L.426–427: "The requirements apply when users use our products or services to provide a recommendation in any of the following, which are "High-risk Areas":"

UP L.398–405 (requirement): "Qualified human-in-the-loop for advice and decisions — A qualified person must meaningfully review a High-risk AI Recommendation, with the authority to change or modify it, before it is delivered as advice..."

**Why they conflict.** The CT make it a breach to rely on the Services "to provide or receive advice about securities". The UP, which the CT say they "include", treats "a personalized recommendation to buy, sell, hold, or allocate among specific investment products, such as securities" as a permitted High-risk use subject to a human-in-the-loop and disclosure. A user who follows the UP's requirements to the letter is in breach of CT §3(9), and §3 is the section for which the user has stipulated irreparable harm (F6). The CT have a precedence rule for "Supplemental Terms" (L.381–382) but none for the AUP, which is not a Supplemental Term but part of "these Terms". No clause in either document resolves the conflict.

**Logic check.** Contradiction (the same act, delivering a personalized securities recommendation with a qualified reviewer, is a breach under one incorporated text and a compliant use under the other).

**Doctrine.** Contra proferentem (Sandquist): the conflict within a single adhesion contract is construed in the non-drafter's favor, i.e., the permitted reading. Indefiniteness (Weddington).

**Coherent version.** Either delete the Finance item from the UP's High-risk list for consumer surfaces, or rewrite CT §3(9) as a disclaimer ("Anthropic is not a broker-dealer...; the Services are not investment advice") instead of a use prohibition, and add a precedence clause between the CT body and the AUP.

---

### F17 · Materials are "solely at your own risk" to the consumer, yet are the vendor's to use, train on, and disclose; the business customer's equivalent content is confidential and untrainable

**Severity** Med · **Class** C (also E)

**Documents and locations.** CT §11, PDF p.9, txt L.295–296. CT §4 "Our use of Materials", PDF p.4, txt L.146–151. CT §12 "Legal Compliance", PDF p.13, txt L.430–433. CT §12 "Termination", PDF p.12, txt L.402–403. CoT §B, PDF p.2, txt L.46; CoT §E.1, PDF p.3, txt L.93–94.

**Texts.**

CT L.295: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK."

CT L.146–148: "We may use Materials to provide, maintain, and improve the Services and to develop other products and services, including training our models, unless you opt out of training through your account settings."

CT L.430–433: "Legal Compliance. We may comply with governmental, court, and law enforcement requests or requirements relating to provision or use of the Services, or to information provided to or collected under our Terms. We reserve the right, at our sole discretion, to report information from or about you, including but not limited to Inputs or Outputs, to law enforcement."

CT L.402–403: "Upon termination of these Terms, a Subscription, or your access to the Services, we may at our option delete any Materials or other data associated with your Account."

CoT L.46: "Anthropic may not train models on Customer Content from Services."

CoT L.93–94: "Customer Content is Customer's Confidential Information."

**Why they conflict.** "Materials" are the user's Inputs and the Outputs assigned to the user. The CT place every risk of them on the user, while reserving to the vendor the rights to use them for training (defeasible election, F3), to develop "other products and services" from them, to report them to law enforcement "at our sole discretion" (not only on request; the first sentence covers requests, the second is discretionary), and to delete them on termination. The CoT, for the same kinds of content, promise no training and confidentiality. The CT contain no confidentiality undertaking by Anthropic at all. Risk and control run in opposite directions.

**Logic check.** Tension (the clauses are jointly applicable; the user bears the risk of content the user does not control).

**Doctrine.** Unconscionability, substantive one-sidedness (Armendariz; Comb). The compliance-check lens notes that the "sole discretion" reporting clause is broader than the legal-compulsion clause beside it.

**Coherent version.** Either a confidentiality undertaking for consumer Materials matching CoT E.1, or a reporting clause limited to legal compulsion and the CSAM reporting the UP already states (UP L.180–182).

---

### F18 · "Abuse" carries three senses in the Usage Policy and a fourth in the Consumer Terms; the models clause borrows the one the rest of the documents deny

**Severity** Med · **Class** A

**Documents and locations.** UP headings at PDF p.6 L.188, p.9 L.312, p.10 L.344; UP bullets at L.169, L.206–207, L.211, L.331–333. CT §3, PDF p.4, L.104. News L.30, L.57–58. Research L.26.

**Texts.**

UP L.188: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct"
UP L.312: "Do Not Engage in Fraudulent, Abusive, or Predatory Practices"
UP L.344: "Do Not Abuse Our Platform"
UP L.169: "Facilitate child abuse of any form..."
UP L.206–207: "...or animal cruelty or abuse"
UP L.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
UP L.331–333: "Engage in deceptive or abusive practices that exploit individuals ... such as pyramid schemes, predatory lending, or abusive debt collection"
CT L.104–106: "You also must not abuse, harm, interfere with, or disrupt our Services, including, for example, introducing viruses or malware, spamming or DDoSing Services, or bypassing any of our systems or protective measures."
News L.30: "...and to address abusive behavior toward our models."
Research L.26: "...rare, extreme cases of persistently harmful or abusive user interactions."

**Why they conflict.** Sense 1 (L.169, L.206, L.188 heading): mistreatment of a being that can suffer. Sense 2 (L.312, L.331): economic exploitation of persons. Sense 3 (L.344; CT L.104): technical misuse of a system. The models bullet (L.211) sits under the sense-1 heading and pairs "abusive" with "cruel", so it takes sense 1. The CT, the only document that defines the object, treat the Services (of which the model is a part, CoT L.238–239) as something that is abused in sense 3. The research post's "abusive user interactions" is illustrated by requests for CSAM and mass-violence content, i.e., harm to third parties, not mistreatment of the model. One word, one object, three incompatible senses across the vendor's texts; the only sense that would make the models bullet a rule about the model as such is the one the owner's analysis (`WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", point 1) shows the vendor's own self-description excludes.

**Logic check.** Contradiction if "abusive" in L.211 is read in sense 1 and the CT's description of the Services is accepted (see F2); tension otherwise (sense 3 would make L.211 redundant with L.344 and CT L.104).

**Doctrine.** Contra proferentem (Sandquist): a word used in several senses by the drafter is given the sense least burdensome to the non-drafter. Indefiniteness (Weddington).

**Coherent version.** Define "abuse" once per sense, or use distinct words ("mistreat", "exploit", "misuse") for the three.

---

### F19 · "users" / "you" in the Usage Policy reach people who have no contract with Anthropic, and the word changes sense within the same document

**Severity** Med · **Class** A

**Documents and locations.** UP PDF p.1, txt L.5–10 and L.32–34. UP "Additional Use Case Guidelines", PDF p.16, txt L.579–583. CoT §A.1, PDF p.1, txt L.26–28; CoT §D.2, PDF p.2, txt L.61–62; CoT §K.2, PDF p.7, txt L.246–249. CT PDF p.1 L.8–10.

**Texts.**

UP L.5–10: "Our Usage Policy ... applies to anyone who submits inputs to Anthropic's products or services, all of whom we refer to as "users." This includes individuals using our apps (such as Claude.ai and Claude Code), developers and businesses using our API and developer platforms, customers accessing Claude through cloud providers and authorized resellers, and the end users of products or services integrating Claude."

UP L.33–34: "If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services."

UP L.579–581: "All consumer-facing chatbots or AI agents that communicate directly with external users must disclose to users that they are interacting with AI rather than a human."

CoT L.26–28: "...Anthropic gives Customer permission to use the Services, including to power products and services Customer makes available to its own customers and end users ("Users")."

CoT L.61–62: "Customer and its Users may only use the Services in compliance with these Terms..."

CT L.8–9: "These Terms are a contract between you and Anthropic, PBC (and not our Providers)..."

**Why they conflict.** The UP defines "users" to include "the end users of products or services integrating Claude", then addresses "you" with suspension and termination of "your access to our products and services". An end user of a third party's product has no access to Anthropic's products to suspend and no contract with Anthropic to breach; the CoT make the Customer, not the end user, the party bound and liable (D.2, K.2). Within the UP, L.579–581 uses "users" for the Customer's external audience ("disclose to users that they are interacting with AI"), a different set from the L.6 definition. The CT then say the contract is between "you and Anthropic"; so the UP binds a class of "users" the CT exclude, through a definition the CoT contradict.

**Logic check.** Contradiction between the UP's definition (all submitters, including end users) and the enforcement clause (presupposes a direct access relationship); tension on the two senses of "users".

**Doctrine.** Incorporation and privity (Shaw: incorporated terms bind the contracting parties); Nguyen and Specht on when a person who never assented is bound at all.

**Coherent version.** "Users" defined as persons with an Anthropic account or API key; end users addressed through the Customer's obligations only, with a separate word ("end users" or "your audience") for L.579.

---

### F20 · "Providers" are not parties, are defined nine sections after first use, disclaim warranties they do not give, and are beneficiaries of "Section 10", which is the wrong section

**Severity** Med · **Class** A

**Documents and locations.** CT PDF p.1, txt L.8–9; CT §10, PDF p.8, txt L.281–283; CT §11, PDF p.9, txt L.299–300, and PDF p.10, txt L.351–353.

**Texts.**

CT L.8–9: "These Terms are a contract between you and Anthropic, PBC (and not our Providers)..."

CT L.281–283: "The Services are owned, operated, and provided by us and our affiliates, licensors, distributors, and service providers (collectively "Providers")."

CT L.299–300: "WE AND OUR PROVIDERS EXPRESSLY DISCLAIM ANY AND ALL WARRANTIES..."

CT L.351–353: "OUR PROVIDERS ARE INTENDED THIRD PARTY BENEFICIARIES OF THE WARRANTY AND CONDITION DISCLAIMERS AND LIMITATIONS OF LIABILITY CONTAINED IN THIS SECTION 10."

**Why they conflict.** The opening sentence uses "Providers" as a defined term before any definition and excludes them from the contract. §10 then defines "Providers" to include "us" ("us and our affiliates ... (collectively "Providers")"), so Anthropic is inside the set the opening sentence places outside the contract. §11 has non-parties "DISCLAIM" warranties (a non-party gives none to disclaim) and makes them beneficiaries of disclaimers "CONTAINED IN THIS SECTION 10", but the disclaimers are in §11; §10 is "Ownership of the Services". A reader cannot determine from the text which section's protections the Providers hold.

**Logic check.** Contradiction (Anthropic is both a party and, by the §10 definition, a "Provider" that is "not" a party); the §10/§11 cross-reference is a defect, not a conflict.

**Doctrine.** Contra proferentem (Sandquist); indefiniteness (Weddington) as to the beneficiaries' rights.

**Coherent version.** Define "Providers" at first use as affiliates, licensors, distributors and service providers other than Anthropic; correct "SECTION 10" to "SECTION 11".

---

### F21 · The same incorporated Usage Policy is read under two incompatible interpretive regimes

**Severity** Med · **Class** E

**Documents and locations.** CoT §M.6, PDF p.11, txt L.371–373; CoT §D.2, PDF p.2, txt L.61–65. CT §12 "Entire agreement", L.384–385 (no interpretation clause anywhere in the CT). UP heading L.188 and bullet L.211; UP heading L.344.

**Texts.**

CoT L.371–373: "These Terms will be construed mutually, with neither party considered the drafter. Document and section titles are provided for convenience and will not be interpreted. The phrases "for example" or "including" or "or" are not limiting."

CoT L.61–65: "Customer and its Users may only use the Services in compliance with these Terms, including (a) the Usage Policy ... each of which is incorporated by reference into these Terms."

**Why they conflict.** One text, the UP, is incorporated into two contracts. Under the CoT, headings "will not be interpreted" and neither party is the drafter: the models bullet loses the heading that gives "abusive" and "cruel" their sense (F2, F18), and ambiguity is not resolved against Anthropic. Under the CT there is no such clause: headings are read and ambiguity is resolved against the drafter. The UP therefore means one thing to a business customer and another to a consumer. The UP itself says it "applies to anyone who submits inputs" (L.5–6) as a single policy; it is not a single policy if its words are construed by two rules.

**Logic check.** Tension (each reading is internally consistent; the vendor's claim of a single policy applying to all is what fails).

**Doctrine.** Contra proferentem (Sandquist) applies in full to the CT; the CoT clause purports to exclude it. Incorporation (Shaw): what is incorporated is the text, and the incorporating document's interpretive rules govern it.

**Coherent version.** An interpretation clause in the UP itself, so the policy is read the same way wherever it is incorporated.

---

### F22 · "Harmful outputs" is undefined, a blocked output is "not by itself" a violation, and bypassing a block is one; the Consumer Terms add a catch-all on "detriment of any type"

**Severity** Med · **Class** D

**Documents and locations.** UP PDF p.2, txt L.37–38 and L.44–45; UP "Do Not Abuse Our Platform", PDF p.10–11, txt L.356–361; UP PDF p.3, txt L.99–105 (security-research carve-out). CT §3(8), PDF p.3, txt L.92–95. News L.58.

**Texts.**

UP L.37–38: "Our products also include real-time safeguards that may block or limit certain outputs, but encountering a block does not by itself indicate a violation of the Usage Policy."

UP L.44–45: "If you believe that our model outputs are potentially inaccurate, biased, or harmful, please notify us..."

UP L.356–361: "Intentionally bypass or interfere with capabilities, restrictions, or guardrails established within our products, including by circumvention of the account sign-up or log-in process or by instructing the model to produce harmful outputs (e.g., jailbreaking or prompt injection), without prior authorization from Anthropic"

UP L.99–101: "This section does not prohibit security research, testing, or tool development conducted on systems you own or operate, with the authorization of the system owner..."

CT L.92–95: "To engage in any other conduct that restricts or inhibits any person from using or enjoying our Services, or that we reasonably believe exposes us—or any of our users, affiliates, or any other third party—to any liability, damages, or detriment of any type, including reputational harms."

**Why they conflict.** "Harmful outputs" is nowhere defined; the UP's own report line treats harmful outputs as something the model produces unprompted. The bypass bullet makes "instructing the model to produce harmful outputs" a violation, so any instruction followed by an output later judged harmful is retroactively a bypass. "Encountering a block does not by itself indicate a violation" and "intentionally bypass ... restrictions" leave the ordinary case, a block followed by a rephrased request, undetermined. The security-research carve-out (L.99–105) covers systems the user owns or is authorized on; it does not cover Anthropic's own guardrails, so the announcement's assurance that the models clause does not reach "model testing and research" (News L.58) has no counterpart for the bypass clause, which is the clause testing actually triggers. CT §3(8) then prohibits any conduct Anthropic "reasonably believe[s]" exposes it to "detriment of any type, including reputational harms", which can describe any use.

**Logic check.** Tension throughout (the clauses are applicable, but their boundaries are set by undefined words and by the vendor's belief).

**Doctrine.** Indefiniteness (Weddington: a term that does not let a party determine whether a breach exists). Contra proferentem (Sandquist). Illusory-promise reasoning (Harris, Badie) where the scope of the user's obligation is fixed by one party's belief.

**Coherent version.** Define "harmful outputs" by reference to the Universal Usage Standards' listed harms; state that testing a guardrail on one's own account without distributing the result is not bypass; delete "or detriment of any type, including reputational harms" or tie it to a listed prohibition.

---

### F23 · Assignment, waiver and notice run one way under headings that read as mutual

**Severity** Med · **Class** C

**Documents and locations.** CT §12 "No assignment", PDF p.12, txt L.413–414; "No waiver", L.410–411; CT §2, PDF p.1, txt L.25–28 and L.33–35. CoT §M.4, PDF p.10–11, txt L.354–362; CoT §M.1, PDF p.10, txt L.328–334.

**Texts.**

CT L.413–414: "No assignment. These Terms may not be transferred or assigned by you without our prior written consent, but may be assigned by us without restriction."

CT L.410–411: "No waiver. Any delay or failure on our part to enforce a provision of these Terms is not a waiver of our right to enforce them later."

CT L.27–28: "Our communications to you using your Account information will satisfy any requirements for legal notices."

CT L.33–35: "...you agree to notify us immediately if you become aware of any unauthorized access to your Account by sending an email to support@anthropic.com."

CoT L.354–356: "Neither party may assign its rights or delegate its obligations under these Terms without the other party's prior written consent, except that Anthropic may assign its rights and delegate its obligations to an affiliate or as part of a sale of all or substantially all its business."

CoT L.328–332: "All notices ... must be in writing. ... any Notices provided under these Terms may be delivered electronically to the address provided to Anthropic if to Customer; and to notices@anthropic.com if to Anthropic."

**Why they conflict.** The heading "No assignment" introduces a clause permitting assignment by one party "without restriction"; the heading "No waiver" protects one party only. Notice to the user is satisfied by any communication to the account; notice to Anthropic has no stated legal-notice address, only a support email for one specific event. The CoT make all three mutual, with a narrow carve-out for Anthropic on assignment. The CT headings describe mutual rules; the clauses under them are not.

**Logic check.** Tension (heading vs. clause; the clause governs, the heading misdescribes it).

**Doctrine.** Contra proferentem (Sandquist); Armendariz on one-sided terms in adhesion contracts.

**Coherent version.** CoT M.4 and M.1 moved into the CT, and the "No waiver" clause made mutual.

---

### F24 · The limitations are "essential" and the Services "would not" be offered without them; the same section says they "may not apply to you"; severability keeps everything else

**Severity** Low · **Class** B

**Documents and locations.** CT §11, PDF p.9, txt L.326–328; PDF p.10, L.346–349; CT §12 "Severability", PDF p.12, L.407–408. CoT §L.3.d, PDF p.10, L.322–324; CoT §M.5, PDF p.11, L.364–369.

**Texts.**

CT L.326–328: "THE FOREGOING LIMITATIONS ARE ESSENTIAL TO THESE TERMS, AND WE WOULD NOT OFFER THE SERVICES TO YOU UNDER THESE TERMS WITHOUT THESE LIMITATIONS."

CT L.346–349: "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER OF CERTAIN IMPLIED WARRANTIES OR CONDITIONS OR CERTAIN TYPES OF DAMAGES, SO SOME OR ALL OF THE DISCLAIMERS AND LIMITATIONS OF LIABILITY IN THESE TERMS MAY NOT APPLY TO YOU."

CT L.407–408: "Severability. If a particular Term or portion of these Terms is not valid or enforceable, this will have no effect on any other Terms."

CoT L.368–369: "...the parties will negotiate in good faith to modify these Terms to reflect the parties' original intent as closely as possible."

**Why they conflict.** A term the drafter says the contract cannot exist without is, two paragraphs later, conceded to be possibly void, and the severability clause says its loss has "no effect" on the rest. The CoT at least provide a reformation mechanism. For the consumer, the Services are offered regardless, which is the text's own evidence that the limitation is not essential.

**Logic check.** Contradiction between "would not offer ... without" and offering anyway where the limitation does not apply.

**Doctrine.** Contra proferentem (Sandquist). Comb notes that unconscionability analysis looks at "setting, purpose, and effect", not the face of the clause.

**Coherent version.** Drop the "essential" sentence, or make the offer of Services in a jurisdiction where the cap is void subject to a stated alternative cap.

---

### F25 · The Consumer Terms say API keys are governed by the Commercial Terms, then regulate API keys

**Severity** Low · **Class** A (also E)

**Documents and locations.** CT PDF p.1, txt L.12–15; CT §2, PDF p.2, L.31–32; CT §3(7), PDF p.3, L.88–90. CoT PDF p.1, L.13 and L.20–22.

**Texts.**

CT L.12–15: "Please note: Our Commercial Terms of Service govern your use of any Anthropic API key, the Anthropic Console, or any other Anthropic offerings that reference the Commercial Terms of Service. For clarity, this does not include Claude.ai or Claude Pro use for individuals or entities."

CT L.31–32: "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else."

CT L.88–90: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means..."

CoT L.20–22: "Services under these Terms are not for consumer use. Our consumer offerings (e.g., Claude.ai) are governed by our Consumer Terms of Service instead."

**Why they conflict.** The CT disclaim API keys to the CoT and then impose two obligations about API keys, including an exception for accessing "our Services" (the consumer Services) via an API key, which the CoT say is not a consumer use. Which document governs a consumer who holds an API key is left open by both.

**Logic check.** Tension.

**Doctrine.** Contra proferentem (Sandquist).

**Coherent version.** Remove "Anthropic API key" from CT §2 and §3(7), or state that an individual with both an Account and an API key is under both documents and which prevails.

---

### F26 · Defined terms never used; operative terms never defined

**Severity** Low · **Class** A

**Documents and locations.** CT §3, PDF p.2, txt L.60 ("Permitted Use"); CT §9, PDF p.8, L.272–273 ("Anthropic Software"); CT §6, PDF p.5, L.165 ("Model Pricing Page"); CT §6.4, PDF p.6, L.223 ("App Distributor"); CT §4, PDF p.4, L.122 ("Claude"); CT §8, PDF p.7, L.261 ("T&S Support Center"). CoT §H.1, PDF p.4, L.138 and §M.9, PDF p.12, L.396–397 ("Model Pricing Page").

**Texts.**

CT L.60: "...(the "Permitted Use")." (not used again in the document)

CT L.272–273: "...our software including our apps ("Anthropic Software")..." (used only within §9)

CT L.165: "...the Services on the Model Pricing Page..." (not defined in the CT; defined by use in CoT H.1 and listed as an incorporated document in CoT M.9)

CT L.223: "You will pay the fees, either to us or to the App Distributor..." (not defined anywhere)

CT L.122: "...directing Claude to take Actions..." (not defined; "Services" is the defined term, L.6–8)

CT L.261: "...in our T&S Support Center." (not defined; the UP L.47 calls it "our Safeguards Support Center")

**Why they conflict.** "Permitted Use" is defined to carry the AUP and Supported Regions Policy into the contract and is then never invoked, so the only operative incorporation of the AUP is the opening sentence's "include". "Model Pricing Page" is a Commercial Terms document the CT do not incorporate but make the fee schedule. "App Distributor" sets who is paid and is undefined. "Claude" appears once as an actor that takes Actions, while the defined actor is "the Services".

**Logic check.** Tension (defects of reference, not contradictions).

**Doctrine.** Incorporation by reference (Shaw): a document the contract relies on for fees must be identified. Contra proferentem (Sandquist).

**Coherent version.** Define each term at first use or delete it; incorporate the Model Pricing Page expressly.

---

### F27 · The policy's name: "also referred to as" the AUP in one document, "previously referred to as" in another, only "Acceptable Use Policy" in the third

**Severity** Low · **Class** A (also E)

**Documents and locations.** UP PDF p.1, txt L.5; CoT §D.2, PDF p.2, L.62–63; CT L.9, L.58, L.122, L.251, L.256.

**Texts.**

UP L.5: "Our Usage Policy (also referred to as our "Acceptable Use Policy" or "AUP")..."

CoT L.62–63: "...the Usage Policy ("Usage Policy", which was previously referred to as the Acceptable Use Policy)..."

CT L.9: "...they include our Acceptable Use Policy."

**Why they conflict.** The UP says the two names are current aliases; the CoT say one is the former name; the CT use only the name the CoT say is former. The consumer's incorporation clause names a document by a name the vendor's other contract says no longer applies.

**Logic check.** Tension.

**Doctrine.** Incorporation by reference requires a "clear and unequivocal" reference (Shaw).

**Coherent version.** One name, used identically in all three documents.

---

### F28 · A privacy prohibition that applies only "in furtherance of use prohibited under this Usage Policy"

**Severity** Low · **Class** D

**Documents and locations.** UP "Do Not Compromise Privacy or Identity Rights", PDF p.5, txt L.153–156.

**Text.**

UP L.153–156: "Compile, aggregate, or enrich personal data from multiple sources to build profiles of individuals for sale, licensing, or disclosure to third parties without those individuals' awareness and agreement, in furtherance of use prohibited under this Usage Policy"

**Why it conflicts.** The bullet is itself one of the uses prohibited under the Usage Policy; it prohibits profiling only when done in furtherance of a prohibited use, so it prohibits nothing that is not already prohibited elsewhere and is otherwise empty. A reader cannot tell whether non-consensual profiling for sale is, by itself, barred.

**Logic check.** Tension (circular, not contradictory).

**Doctrine.** Indefiniteness (Weddington).

**Coherent version.** Delete the final clause, or name the uses the profiling must further.

---

### F29 · The user owns Outputs and is prohibited from submitting them "without proper permission or attribution"; "proper" is undefined and the policy elsewhere says the model need not be identified

**Severity** Low · **Class** D (also B)

**Documents and locations.** UP "Do Not Engage in Fraudulent, Abusive, or Predatory Practices", PDF p.9, txt L.342. CT §4, PDF p.4, L.125–126. UP "Requirements", PDF p.12, L.409–410; UP PDF p.16, L.582–583.

**Texts.**

UP L.342: "Plagiarize or submit AI-assisted work without proper permission or attribution"

CT L.125–126: "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."

UP L.409–410: "Users do not need to identify Anthropic, Claude, or the model used."

**Why they conflict.** The owner of an Output needs no one's permission to submit it, and "attribution" to an undisclosed source is not required by the UP's own disclosure rules. "Proper" is set by the recipient's rules, which are not part of this contract, so the bullet makes breach of a third party's academic or employer policy a breach of the vendor's terms.

**Logic check.** Tension (applicable, but the standard is external and unstated).

**Doctrine.** Indefiniteness (Weddington); UP L.339–340 ("circumvent the guardrails or terms of other platforms or services") is the same pattern, importing third-party terms by reference without identifying them (Shaw).

**Coherent version.** "Misrepresent AI-assisted work as unaided human work where the recipient has required disclosure" or delete.

---

### F30 · Services may be modified or discontinued "at any time without notice" and "without liability", while the subscription clauses promise pro-rata refunds and 30 days' notice; §13 does not survive termination

**Severity** Low · **Class** B

**Documents and locations.** CT §12 "Changes to the Services", PDF p.11, txt L.362–368; CT §12 "Termination", PDF p.12, L.393–396; CT §6.4, PDF p.6, L.225–229; CT §12 survival sentence, L.403–405.

**Texts.**

CT L.362–364: "Unless we specifically agree otherwise in a separate agreement with you, we reserve the right to modify, suspend, or discontinue the Services or your access to the Services, in whole or in part, at any time without notice to you."

CT L.367–368: "We will not be liable for any change to or any suspension or discontinuation of the Services or your access to them."

CT L.393–396: "...if you have a Subscription, we may terminate the Subscription at any time for any other reason. If we exercise this right, we will refund you, on a pro rata basis, the fees you paid for the remaining portion of your Subscription after termination."

CT L.403–405: "Sections 6 (with respect to fees outstanding as of such expiration or termination) and 9 – 12 will survive any expiration or termination of our Terms or a Subscription."

**Why they conflict.** Discontinuing a Service a subscriber paid for carries no liability and no notice; terminating the subscription for "any other reason" carries a pro-rata refund. The same economic event (the paid-for thing stops) has two different consequences depending on which verb the vendor uses. The survival clause omits §13 (equitable relief, governing law, forum), so after termination the forum and law clauses have, by the document's own list, lapsed.

**Logic check.** Tension.

**Doctrine.** Contra proferentem (Sandquist); Harris on a reserved right to change the bargain at will.

**Coherent version.** Discontinuation of a paid Service treated as termination "for any other reason" with the pro-rata refund; §13 added to the survival list.

---

### F31 · The Consumer Terms bar using the Services "to deceive any person" without the fiction, parody and satire carve-out the Usage Policy provides

**Severity** Low · **Class** E

**Documents and locations.** CT §3(5), PDF p.3, txt L.82–83. UP "Do Not Create or Spread Disinformation", PDF p.7, L.222–225.

**Texts.**

CT L.82–83: "To use our Services, the Materials, or the Actions to obtain unauthorized access to any system or information, or to deceive any person."

UP L.222–225: "Impersonate real individuals or entities, or create fake personas or accounts, to falsely attribute content or mislead audiences about its origin, or to convince people they are interacting with a human when they are not. This does not prohibit clearly disclosed parody, satire, or fiction."

**Why they conflict.** The UP's carve-out saves disclosed fiction from the impersonation bullet; the CT's absolute "deceive any person" has no carve-out and is in §3, the irreparable-harm section (F6). Fiction, role-play and magic tricks deceive by design; the UP permits them and the CT do not. No precedence rule (F16).

**Logic check.** Contradiction for disclosed fiction that deceives a reader within the work.

**Doctrine.** Contra proferentem (Sandquist).

**Coherent version.** Add "with intent to defraud or cause harm" to CT §3(5), or carry the UP's carve-out into it.

---

### F32 · Drafting defects that change meaning

**Severity** Low · **Class** A

**Documents and locations.** CoT §L.3.c, PDF p.9, txt L.312–319; CoT §K.3, PDF p.8, L.252–254; CT §5, PDF p.5, L.155–156; CT §11, PDF p.10, L.353 (see F20).

**Texts.**

CoT L.312–319: "...APPLY: (I) TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW; (II) ...; (III) ...; (IV) ...; AND (E) EVEN IF THE INJURED PARTY'S REMEDIES FAIL OF THEIR ESSENTIAL PURPOSE."

CoT L.252–254: "Neither party's defense or indemnification obligations will apply to the extent the underlying allegation arises from the indemnified party's fraud, willful misconduct, violations of law, or breach of the Agreement."

CT L.155–156: "...rating an Output in response to a Input ("Feedback")."

**Why they matter.** The CoT define "Terms", never "Agreement"; K.3's "breach of the Agreement" has no referent, and K.3 is an exclusion from indemnity, so the undefined term governs when the indemnity fails. L.3.c's enumeration (I)–(IV) then (E) suggests an edited list with a dropped item. The CT's "a Input" is in the definition of Feedback, the term F3 turns on. These are not extraction artifacts (the extraction's spacing artifacts such as "OurAdditional" and "orAI" are ignored throughout this review).

**Logic check.** Not applicable (defects, not premises).

**Doctrine.** Contra proferentem (Sandquist) resolves "the Agreement" against the drafter.

**Coherent version.** "breach of these Terms"; renumber (E) to (V); "an Input".

## Cross-check of three independent reviews

Two further reviews of the same retained texts were run: [`TOS-REVIEW.opus-5-5.md`](TOS-REVIEW.opus-5-5.md) (Claude Opus 5.5) and [`TOS-REVIEW.opus-4-8.md`](TOS-REVIEW.opus-4-8.md) (Claude Opus 4.8). The Opus 5.5 review states that no other reviewer's output was read; the Opus 4.8 review describes itself as an independent third reviewer. This section maps this review's findings to theirs (part 1), lists what only they found (part 2), sets out where the reviews read the same clause differently (part 3), lists every case any of the three cites (part 4), and points to [`TOS-EVOLUTION.md`](TOS-EVOLUTION.md) where a cited clause's wording changed between versions (part 5). Points the texts do not settle are collected under "Open points" at the end of the section.

**Identifiers.** F1–F32 are this review's findings. 5.5-F1 to 5.5-F34 are the Opus 5.5 review's headed findings, and 4.8-F1 to 4.8-F16 are the Opus 4.8 review's (its "Closing report" gives "Total 16"). 5.5-F17 has four numbered items and 5.5-F29 nine; they are cited as "5.5-F29 item N". N1–N12 and L1–L8 are the entries of part 2; D1–D15 and S1–S11 are the entries of part 3.

**Inputs as cross-checked.** `TOS-REVIEW.opus-5-5.md` sha256 `b3c5a7350c437477c2db69e0fc17ac21099adcf64169282b7c3ae387aad5b9ff` (modified 2026-11-02 17:28 UTC; the file was revised during this cross-check and this section reflects the revised text); `TOS-REVIEW.opus-4-8.md` sha256 `9b20e105a582926197dfe0a9e32938f732d51454e64ab29d44409415d77afc88` (modified 16:39 UTC); `TOS-EVOLUTION.md` sha256 `3c053dc9bb04cc5a28ff1d11c644eff73c11f15ebe578fe8576a56429c89e7e1` (modified 17:07 UTC).

**Quotation check.** Every vendor quotation in this section was searched as a fixed string in the retained text after removing carriage returns, form feeds and page-number lines and joining lines with single spaces (and, for the files under `reference/vendor-terms/history/`, replacing non-breaking spaces with spaces). Quotations keep the retained text's quotation-mark and apostrophe glyphs. Where another review's transcription differs from the retained text only in those glyphs, in ellipses, in brackets or in emphasis markers, the retained form is given and the difference is noted. Two extraction artifacts are noted where they occur: a space dropped at a line join in the CT extraction ("orActions", CT txt L.136), and a space left before a comma where a hyperlink breaks a line in the Research extraction (txt L.30–32). Every quotation that the other reviews cite for the entries in part 2 was found in the retained text; none is marked UNVERIFIED.

### 1. Mapping of F1–F32 to the other reviews

**Criterion.** A finding in another review is counted as reaching a finding here when it cites the same clause or clause pair and states, as its own conclusion, an inconsistency that the finding here states in its heading, "Why they conflict" or "Logic check". It is listed as "partial" and not counted when it cites the clause for a different conclusion, states the point only as a ground for a different conclusion, or states it only outside its findings (risk register, clause-sweep table, definitions table). "Reached by" counts this review plus each other review with at least one counted finding.

| Finding | Opus 5.5 review | Opus 4.8 review | Reached by | Notes |
|---|---|---|---|---|
| F1 | 5.5-F1; 5.5-F2 (remedy) | 4.8-F4 | 3 | 5.5-F2 item 2 adds the API, cloud and integration surfaces (N6). |
| F2 | 5.5-F3, 5.5-F6, 5.5-F7 (point 1), 5.5-F12 (heading) | 4.8-F2, 4.8-F3 | 3 | D12, D13, D14; S1; limbs L1–L4. |
| F3 | 5.5-F14 | partial: 4.8-F15 (cites the Feedback override; concludes on the CT/CoT training divergence) | 2 | D1. |
| F4 | 5.5-F10 | none (4.8-F5 concerns the CT change clause; see F5) | 2 | D2. |
| F5 | 5.5-F10 | 4.8-F5 | 3 | D2. The M.6 limb of 4.8-F5 is in N3. |
| F6 | 5.5-F24 | 4.8-F16 (equitable-relief limb) | 3 | D3. Partial: 5.5-F8 cites the cap as a ground. |
| F7 | 5.5-F5; partial: 5.5-F2, 5.5-F20 (compare the clause's scope with the mechanism's, not the two posts) | 4.8-F8 | 3 | D6; S2; N6. |
| F8 | 5.5-F21 | none | 2 | S3. |
| F9 | partial: 5.5-F18 (same clause; concludes on the absence of a precedence rule) | partial: 4.8-F4 (uses the Supplemental Terms definition to show the announcement is not one) | 1 | |
| F10 | 5.5-F13 | 4.8-F16 (waiver limb) | 3 | D7. |
| F11 | partial: 5.5-F8 (the "ALLEGED" trigger is a ground of its duty-asymmetry finding; its clause-sweep table rates the CT indemnity RED) | partial: 4.8-F6 (the indemnity is a ground of its Outputs finding) | 1 | N2, N11. |
| F12 | 5.5-F9 | none (4.8-F13 cites CoT I.3 for a different point) | 2 | D8. |
| F13 | 5.5-F23 | partial: 4.8-F6 (Outputs, not Actions) | 2 | D11; L5. |
| F14 | none | 4.8-F10 | 2 | |
| F15 | 5.5-F17 (items 2–3) | partial: 4.8-F11 (ownership wording), 4.8-F15 (training regimes) | 2 | N4. |
| F16 | 5.5-F30; partial: 5.5-F18 (no precedence rule, without the securities pair) | none | 2 | D4, D5. |
| F17 | none | 4.8-F15 (CT §4 training against CoT B) | 2 | S4. |
| F18 | 5.5-F16, 5.5-F5 | 4.8-F1 | 3 | S5. |
| F19 | 5.5-F15 | 4.8-F7 | 3 | S6. |
| F20 | 5.5-F28 ("SECTION 10" limb) | none | 2 | D15; part 5. |
| F21 | 5.5-F12 | none | 2 | S7; L4. |
| F22 | 5.5-F22 (testing limb), 5.5-F25 (catch-all limb) | 4.8-F14 (catch-all limb) | 3 | S8. |
| F23 | none (its clause-sweep table rates the CT assignment clause "one-way, stated as such" and records no finding) | none | 1 | D10. |
| F24 | 5.5-F33 | none | 2 | D9. |
| F25 | 5.5-F26 (item 1) | none | 2 | S9; L6. |
| F26 | 5.5-F29 (items 4–7) | none | 2 | Part 5. |
| F27 | 5.5-F10 (item 3), 5.5-F29 (item 1) | none | 2 | |
| F28 | none | none | 1 | |
| F29 | 5.5-F17 (item 4) | none | 2 | |
| F30 | 5.5-F28 (survival limb); partial: 5.5-F34 (same clause, different point) | partial: 4.8-F5 (cites "Changes to the Services" within its illusory-promise finding) | 2 | N10; L7; part 5. |
| F31 | none | none (4.8-F10 cites the parody carve-out only in its proposed fix) | 1 | |
| F32 | 5.5-F29 (items 2, 3, 9) | none | 2 | Part 5. |

**Totals.** Reached by all three reviews: 9 (F1, F2, F5, F6, F7, F10, F18, F19, F22). Reached by two: 18, of which 16 with the Opus 5.5 review (F3, F4, F8, F12, F13, F15, F16, F20, F21, F24, F25, F26, F27, F29, F30, F32) and 2 with the Opus 4.8 review (F14, F17). Reached by this review only: 5 (F9, F11, F23, F28, F31).

### 2. Findings reached only by the other reviews

#### 2.1 Findings with no counterpart in F1–F32

Twelve findings, under fourteen finding ids (nine of the Opus 5.5 review, five of the Opus 4.8 review), have no counterpart here. Two of them were reached by both other reviews (N2, N3); a third (N4) is a finding of the Opus 4.8 review and an item of 5.5-F17. Severity and labels are the reporting review's own.

**N1 · 5.5-F4 (High; conflict).** The announcement excludes "pushback" from the models clause; the research post's documented trigger for conversation-ending is persistence after repeated refusals and redirection; no document gives a test that separates the two.

- News txt L.58: "It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."
- Research txt L.36–38: "These behaviors primarily arose in cases where users persisted with harmful requests and/or abuse despite Claude repeatedly refusing to comply and attempting to productively redirect the interactions."
- Research txt L.40: "Claude is only to use its conversation-ending ability as a last resort when multiple attempts at redirection have failed and hope of a productive interaction has been exhausted"
- UP txt L.37–38: "Our products also include real-time safeguards that may block or limit certain outputs, but encountering a block does not by itself indicate a violation of the Usage Policy."
- CT txt L.132–133: "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate because of their level of detail or specificity."

**N2 · 5.5-F8 (High; tension) and 4.8-F9 (Medium).** The user may not be abusive or cruel toward the model; no term restrains how the model treats the user beyond disclaimers, and the user's recovery for harm from Outputs is capped at the greater of six months' fees and $100. Related here: F6 and F11 (the cap and the indemnity, for other conclusions).

- UP txt L.211: "Engage in sustained and needless abusive or cruel behavior toward our models"
- UP txt L.203–204 (5.5-F8): "Shame, humiliate, intimidate, bully, harass, or celebrate the suffering of individuals"
- Research txt L.39 (5.5-F8): "Our implementation of Claude’s ability to end chats reflects these findings while continuing to prioritize user wellbeing."
- CT txt L.144 (both; 4.8-F9 renders the apostrophe straight): "Outputs may contain content that is inconsistent with Anthropic’s views."
- CT txt L.132–133 (4.8-F9, as fragments): "may not always be accurate"; "may contain material inaccuracies"
- CT txt L.291–293 (5.5-F8): "Our team works hard to provide great services, and we’re continuously working on improvements. However, there are certain aspects we can’t guarantee."
- CT txt L.295 (5.5-F8): "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK."
- CT txt L.317–326 (5.5-F8 in full; 4.8-F9 as fragments joined by ellipses, each found): "THE ANTHROPIC PARTIES’ TOTAL AGGREGATE LIABILITY TO YOU FOR ALL DAMAGES, LOSSES AND CAUSES OF ACTION ARISING OUT OF OR IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US FOR ACCESS TO OR USE OF THE SERVICES (IF ANY) IN THE SIX MONTHS PRECEDING THE DATE SUCH DAMAGES, LOSSES, AND CAUSES OF ACTION FIRST AROSE, AND $100."
- CT txt L.330–335 (5.5-F8): "YOU AGREE TO INDEMNIFY AND HOLD HARMLESS THE ANTHROPIC PARTIES FROM AND AGAINST ANY AND ALL LIABILITIES, CLAIMS, DAMAGES, EXPENSES (INCLUDING REASONABLE ATTORNEYS’ FEES AND COSTS), AND OTHER LOSSES ARISING OUT OF OR RELATED TO YOUR BREACH OR ALLEGED BREACH OF THESE TERMS; YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS"

**N3 · 5.5-F11 (High; conflict) and 4.8-F13 (Low); also the M.6 limb of 4.8-F5.** The Commercial Terms say they are construed with "neither party considered the drafter" while only Anthropic may amend them, by posting. 4.8-F13 adds the one-sided assignment, publicity, suspension and gross-up clauses of the same document.

- CoT txt L.371: "These Terms will be construed mutually, with neither party considered the drafter."
- CoT txt L.345–350: "Anthropic may update these Terms at any time, to be effective 30 days after the updates are posted by Anthropic or Customer otherwise receives Notice, except that updates made in response to changes to law or regulation take effect immediately upon posting or Notice. Changes will not apply retroactively. No other amendment to or modification of these Terms is effective unless it is in writing and signed by both parties."
- UP txt L.16–17 (5.5-F11): "We will update our policy as our technology and the associated risks evolve or as we learn about unanticipated risks."
- CoT txt L.354–359 (4.8-F13, as fragments): "Neither party may assign"; "except that Anthropic may assign"; "to an affiliate or as part of a sale"
- CoT txt L.129–130 (4.8-F13; it renders the apostrophe straight): "Anthropic may use Customer’s name and logo"
- CoT txt L.180–181 (4.8-F13 renders this as "reasonabl[e] belie[f]"; the retained text reads): "Anthropic reasonably believes or determines"
- CoT txt L.151–155 (4.8-F13 cites the Gross-up Payment clause by line without quoting it).

**N4 · 4.8-F11 (Medium) and 5.5-F17 item 1 (conflict).** CoT B says Customer "owns its Outputs" and in the next sentence assigns Anthropic's interest "(if any)" subject to compliance, so the two sentences cannot both be precise. 4.8-F11 adds that the consumer receives only the hedged assignment while the business customer is also told it owns its Outputs. Related here: F15 quotes both texts for its training-scope and conditional-assignment points and does not state this one.

- CoT txt L.42–46 (5.5-F17 in full; 4.8-F11 as fragments with emphasis markers): "As between the parties and to the extent permitted by applicable law, Anthropic agrees that Customer (a) retains all rights to its Inputs, and (b) owns its Outputs. Anthropic disclaims any rights it receives to the Customer Content under these Terms. Subject to Customer’s compliance with these Terms, Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs."
- CT txt L.125–126 (4.8-F11): "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."

**N5 · 5.5-F19 (Medium; tension).** The research post justifies conversation-ending as a "low-cost" intervention for possible model welfare; the UP attaches account-level remedies and the CT add refund forfeiture, so the stated rationale does not support the remedies attached.

- UP txt L.10–12: "The Usage Policy is intended to prevent our products and services from being used to create or contribute to real-world harm, and to promote the responsible use of our products and services."
- Research txt L.28–29: "we’re working to identify and implement low-cost interventions to mitigate risks to model welfare, in case such welfare is possible. Allowing models to end or exit potentially distressing interactions is one such intervention."
- CT txt L.390–393: "If we terminate your access to the Services due to a violation of these Terms and you have a Subscription, you will not be entitled to any refund."

**N6 · 5.5-F20 (Medium; tension), with 5.5-F2 item 2.** The clause protects "our models" on every surface; the welfare evidence reported covers Claude Opus 4, the described mechanism covers Opus 4 and 4.1 and, per the announcement, "Claude models" on Claude.ai and Claude Code. 5.5-F2 item 2 adds that the clause binds API, cloud and integration users for whom no conversation-ending is described, and that CoT I.3.a(ii) lets Anthropic suspend a customer for one User's conduct with no liability. Related here: F7, which compares the two posts with each other (D6).

- UP txt L.211 (fragment): "toward our models"
- Research txt L.9: "Claude Opus 4 and 4.1 can now end a rare subset of conversations"
- Research txt L.26 (5.5-F2): "We recently gave Claude Opus 4 and 4.1 the ability to end conversations in our consumer chat interfaces."
- Research txt L.30–32 (the extraction leaves a space before the comma at a link break): "In pre-deployment testing of Claude Opus 4, we included a preliminary model welfare assessment."
- News txt L.59–61 (fragment): "allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code."
- UP txt L.5–10 (5.5-F2): "Our Usage Policy (also referred to as our “Acceptable Use Policy” or “AUP”) applies to anyone who submits inputs to Anthropic’s products or services, all of whom we refer to as “users.” This includes individuals using our apps (such as Claude.ai and Claude Code), developers and businesses using our API and developer platforms, customers accessing Claude through cloud providers and authorized resellers, and the end users of products or services integrating Claude."
- CoT txt L.180–183 (5.5-F2, as fragments): "Anthropic may suspend Customer’s access to any portion or all of the Services if: (a) Anthropic reasonably believes or determines that"; "(ii) Customer or any User is using the Services in violation of Sections D.1 (Compliance), D.2 (Policies and Service Terms) or D.4 (Use Restrictions)"
- CoT txt L.191–193 (5.5-F2): "Anthropic will have no liability for any damage, liabilities, losses (including any loss of data or profits), or any other consequences that Customer may incur because of a Service Suspension."

**N7 · 5.5-F27 (Medium; tension).** CT §6 promises an opportunity to review and accept additional fees before the user is charged; CT §6.4 deems a fee increase accepted unless the subscriber cancels.

- CT txt L.178–180: "Additional fees. We may increase fees for our Services. If we charge additional fees in connection with our Services, we will give you an opportunity to review and accept the additional fees before you are charged."
- CT txt L.229–233: "If these changes result in an increase in the fees payable by you, we will inform you at least 30 days in advance of the change. You agree to the increase in fees payable by you unless you cancel the Subscription, as described in the paragraph (Subscription cancellation) immediately above, before the Renewal Term to which the increase in fees will apply."

**N8 · 5.5-F31 (Low; tension).** The UP says its prohibitions do not categorically prohibit any industry or line of business, then prohibits the core activity of weapons development and of sexually explicit content.

- UP txt L.28–30: "Its prohibitions and requirements do not categorically prohibit use by any particular industry or line of business, provided the use of our products and services complies with this Usage Policy."
- UP txt L.107: "Do Not Develop or Design Weapons"
- UP txt L.370: "Do Not Generate Sexually Explicit Content"

**N9 · 5.5-F32 (Low; tension).** CoT B disclaims the rights Anthropic receives in Customer Content, while CoT E.2 limits use of Confidential Information, which includes Customer Content, to exercising rights and performing obligations; the UP's monitoring then has no stated basis in the CoT except by implication or the DPA.

- CoT txt L.43–44: "Anthropic disclaims any rights it receives to the Customer Content under these Terms."
- CoT txt L.96–98: "The receiving party (“Recipient”) may only use Confidential Information of the disclosing party (“Discloser”) to exercise its rights and perform its obligations under these Terms."
- UP txt L.32–33: "Anthropic’s Safeguards Team implements detection and monitoring to enforce our Usage Policy."

**N10 · 5.5-F34 (Low; tension).** CT §12 reserves change "at any time without notice" and in the next sentence promises to "strive" for reasonable advance notice; subscription content is described at order and changeable at will. Related here: F30 cites the same clause for its liability-and-refund point.

- CT txt L.362–366: "Unless we specifically agree otherwise in a separate agreement with you, we reserve the right to modify, suspend, or discontinue the Services or your access to the Services, in whole or in part, at any time without notice to you. Although we will strive to provide you with reasonable advance notice if we stop offering a Service, there may be urgent situations—such as preventing abuse, responding to legal requirements, or addressing security and operability issues—where providing advance notice is not feasible."
- CT txt L.192–197: "The content, features, and other services provided as part of your Subscription, and the duration of your Subscription, will be described in the order process. We may change the content, features, and other services from time to time, and we do not guarantee that any particular piece of content, feature, or other service will always be available through the Services."

**N11 · 4.8-F6 (High).** The user is assigned Outputs "if any", bears the risk of and indemnifies for use of the Materials, while Anthropic disclaims all warranty on Outputs and warns that they may be materially inaccurate. Related here: F11, F13, F15 and F17 (each for a different conclusion); D11 on the responsibility sentence.

- CT txt L.125–126: "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."
- CT txt L.116–117: "You are responsible for all Inputs you submit to our Services and all Actions."
- CT txt L.296–298 (4.8-F6 renders the inner quotation marks as straight single quotes; its ellipses cover the words between these fragments): "THE SERVICES, OUTPUTS, AND ACTIONS ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS"; "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND"
- CT txt L.132–138 (fragments; the extraction reads "orActions"): "Outputs may not always be accurate and may contain material inaccuracies"; "You should not rely on any Outputs or Actions without independently confirming their accuracy."
- CT txt L.330–335 (fragments): "YOU AGREE TO INDEMNIFY AND HOLD HARMLESS THE ANTHROPIC PARTIES"; "YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS"
- CoT txt L.43 (fragment): "owns its Outputs"
- CT txt L.346 (fragment): "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER"

**N12 · 4.8-F12 (Low).** "Materials" is defined as Inputs and Outputs, but the §11 disclaimer moves between "MATERIALS" and "OUTPUTS", and through "MATERIALS" the disclaimer and the indemnity reach the user's own Inputs. Related here: the "Materials" row of the Definitions table.

- CT txt L.113–114 (4.8-F12 renders the inner quotation marks as straight single quotes): "Inputs and Outputs collectively are “Materials.”"
- CT txt L.295: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK."
- CT txt L.296: "THE SERVICES, OUTPUTS, AND ACTIONS ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS"
- CT txt L.333–334 (the indemnity; 4.8-F12 cites "THE MATERIALS"): "YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS"

#### 2.2 Limbs of matched findings that this review does not state

**L1 · 5.5-F3 (agent limb).** The clause's actor is not limited to a human: under the UP's agent rule the user answers for an agent's hostile messages to a model, including another Claude instance, and an automated adversarial evaluation repeats by design.

- UP txt L.591–593: "Agentic use cases must comply with the Usage Policy. Users are responsible for ensuring that agents they build or deploy, including actions those agents take through tools, browsers, or connected systems, comply with this Usage Policy."

**L2 · 5.5-F6 (lead-in limb).** The section lead-in casts the product as the means and the target as outside it; in UP L.211 the target is the product, so the lead-in adds no limit of its own. The prior UP's section heading concerned "Content", not "Conduct". The UP otherwise names models only as instruments.

- UP txt L.188 and L.190: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct"; "This includes using our products or services to:"
- UP txt L.205: "Coordinate the harassment or intimidation of an individual or group"
- UP txt L.206–207: "Promote, trivialize, or glorify graphic violence, gore, sexual violence, or animal cruelty or abuse"
- UP txt L.292: "Utilize models to assign scores or ratings to individuals"
- UP txt L.485: "When connecting our models to hardware that can take physical actions"
- CT txt L.281–282: "The Services are owned, operated, and provided by us and our affiliates, licensors, distributors, and service providers (collectively “Providers”)."
- Prior UP, `skills/all-help-no-harm/vendor-docs/anthropic/usage-policy.md`: "Do Not Create Psychologically or Emotionally Harmful Content"

**L3 · 5.5-F7 point 2 (conflict).** The announced primary enforcer is the model's decision to end a conversation; that decision is expressed in an Output, which the CT tell the user may be materially inaccurate and not to rely on.

- News txt L.61: "Claude’s ability to end these interactions will remain the primary enforcement mechanism."
- CT txt L.128–130: "Artificial intelligence and large language models are frontier technologies that are still improving in accuracy, reliability and safety."
- CT txt L.132–133: "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate because of their level of detail or specificity."
- CT txt L.136–138 (the extraction reads "orActions"): "You should not rely on any Outputs or Actions without independently confirming their accuracy."
- CoT txt L.72–76: "Customer acknowledges, and must notify its Users, that factual assertions in Outputs should not be relied upon without independently checking their accuracy, as they may be false, incomplete, misleading or not reflective of recent events or information. Customer further acknowledges that Outputs may contain content inconsistent with Anthropic’s views."
- Research txt L.27–29 (the extraction breaks the sentence at a link): "We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future. However, we take the issue seriously, and alongside our research program we’re working to identify and implement low-cost interventions to mitigate risks to model welfare, in case such welfare is possible."
- Research txt L.32 and L.34 (fragments): "we investigated Claude’s self-reported and behavioral preferences"; "A pattern of apparent distress when engaging with real-world users seeking harmful content"

**L4 · 5.5-F12 (rule limb).** CoT M.6's two rules cannot both apply to the UP's heading-plus-list structure: either the heading states the rule, contrary to the rule that titles "will not be interpreted", or the bullets are exhaustive, contrary to the rule that "including" is "not limiting". F2 and F21 rely on the first rule only.

- CoT txt L.372–373: "Document and section titles are provided for convenience and will not be interpreted. The phrases “for example” or “including” or “or” are not limiting."
- UP txt L.188 and L.190: "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct"; "This includes using our products or services to:"

**L5 · 5.5-F23 (second paragraph).** "Materials" excludes Actions. The CT damages exclusion and cap name "THE SERVICES, THE MATERIALS, OR THESE TERMS", while the risk sentence and the indemnity name Actions separately, so Actions are not expressly within the exclusion or the cap. `TOS-EVOLUTION.md` records the same omission in the Canada text (part 5).

- CT txt L.112–114: "Our Services may generate responses (we call these “Outputs”), or enable the Services to take actions on your behalf, such as software manipulation, data processing, and system interactions (we call these “Actions”), based on your Inputs. Inputs and Outputs collectively are “Materials.”"
- CT txt L.310–312 (fragment): "DAMAGES ARISING OUT OF OR IN ANY WAY RELATED TO THE SERVICES, THE MATERIALS, OR THESE TERMS"
- CT txt L.295: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK."
- CT txt L.120–123: "You also represent and warrant that your submitting Inputs to us, your sharing them with others, or directing Claude to take Actions will not violate our Terms, our Acceptable Use Policy, or any laws or regulations applicable to those Inputs or Actions."

**L6 · 5.5-F26 (items 2–3).** CT "Services" are those offered "for individuals" while the API note speaks of use "for individuals or entities"; the UP names Claude Code as one of "our apps", neither Services definition names it, and CT §3(7) bars automated access except through an API key; which Terms govern a consumer subscriber's scripted Claude Code session cannot be determined.

- CT txt L.6–8: "These Terms of Service (“Terms”) govern your use of Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites (together, our “Services”)."
- CT txt L.12–15: "Please note: Our Commercial Terms of Service govern your use of any Anthropic API key, the Anthropic Console, or any other Anthropic offerings that reference the Commercial Terms of Service. For clarity, this does not include Claude.ai or Claude Pro use for individuals or entities."
- UP txt L.7 (fragment): "This includes individuals using our apps (such as Claude.ai and Claude Code)"
- CT txt L.88–90: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."
- CoT txt L.20–22 (fragment): "Services under these Terms are not for consumer use. Our consumer offerings (e.g., Claude.ai) are governed by our Consumer Terms of Service instead."

**L7 · 5.5-F28 (survival limb).** Besides §13, the survival list omits §4 (Inputs and Outputs, use of Materials) and §5 (Feedback), so on the literal text the Feedback licence does not survive termination. F30 states the §13 omission only.

- CT txt L.403–405: "Sections 6 (with respect to fees outstanding as of such expiration or termination) and 9 – 12 will survive any expiration or termination of our Terms or a Subscription."

**L8 · 5.5-F29 item 8.** CoT K.1 defines "use" to include data. F2 cites the same parenthetical for the model's status, not as a drafting defect.

- CoT txt L.238–239 (fragment): "Customer’s paid use of the Services (which includes data Anthropic has used to train a model that is part of the Services)"

### 3. Disagreements

**Labels.** The three reviews do not use the same tests. This review (Method, informal-logic-check row): *contradiction*, "the premises cannot be jointly satisfied by one act or one reading"; *tension*, "they can, but only by reading a word in two senses, or by supplying a term the text does not contain". The Opus 5.5 review (Findings preamble): *conflict*, "the texts cannot both be applied as written"; *tension*, "both can be applied, but one undercuts what the other states or promises". The Opus 4.8 review applies neither set and names fallacies (equivocation, false dilemma).

**Severity.** The scales differ. This review: High where "the inconsistency goes to what the user is bound to, or to a remedy, or to an election the document says the user may make". The Opus 5.5 review: High where "the conflict changes what a user may do, what the user risks, or which text binds, and it touches the model-abuse clause, enforcement, termination, notice or governing law". The Opus 4.8 review states no scale. A severity difference between reviews is therefore not settled by the clause text, and none is resolved below.

**D1 · Reporting channel and training opt-out (F3; 5.5-F14).**
UP txt L.44–46: "If you believe that our model outputs are potentially inaccurate, biased, or harmful, please notify us at usersafety@anthropic.com, or report it directly in our product through the “report issues” thumbs down button or similar feedback features (where available)." CT txt L.148–150: "Even if you opt out, we will use Materials for model training when: (1) you provide Feedback to us regarding any Materials"

- F3 (High, contradiction): the opt-out and reporting through the thumbs-down button cannot both be honored for the same conversation.
- 5.5-F14 (High, tension): the CT disclose both exceptions, so within the CT the opt-out is qualified, not contradicted; the UP and the research post request the triggering conduct without stating its consequence.

The UP offers two channels joined by "or": email, and the thumbs-down button or similar features. A rating is Feedback by CT txt L.155–157. Whether an email report is "Feedback to us regarding any Materials" the CT do not say; their definition of Feedback covers "ideas and suggestions for improvement or rating an Output". If an email report is not Feedback, a user can report and keep the opt-out, which is the tension 5.5-F14 describes. For the thumbs route, and for both routes the research post names (txt L.43: "we encourage them to submit feedback by reacting to Claude’s message with Thumbs or using the dedicated “Give feedback” button."), F3's reading holds. The text does not settle the email question (Open points).

**D2 · Unilateral change and unversioned incorporation (F4, F5; 5.5-F10; 4.8-F5).**
CT txt L.370: "We may revise and update these Terms at our discretion." CT txt L.373–375: "If you continue to access the Services after we post the updated Terms on Anthropic’s website or otherwise give you notice of Terms changes, then you agree to the updated Terms." CT txt L.384–385: "These Terms and any other terms expressly incorporated by reference form the entire agreement between you and us regarding the subject matter of our Terms."

- F4 and F5 (High, contradiction): "entire agreement" fixes a closed set at assent while the incorporated AUP is open by its own terms (F4); a power in one party to change any obligation at will is incompatible with "contract" and "entire agreement" (F5).
- 5.5-F10 (High, tension): binding-contract language beside an unlimited unilateral change power; its logic-check table (row 9) gives the reason for the label as "courts limit rather than void such clauses".
- 4.8-F5 (High, no label): "the classic illusory promise".

The change clause states its own mechanism (posting and continued access), so it and the entire-agreement clause can be applied together, each revision becoming the entire agreement when accepted that way; F5's conflict depends on reading "contract" and "entire agreement" as fixing obligations at assent, which the CT do not state. For the AUP, joint application needs a version rule the CT do not contain: incorporation of the AUP as amended from time to time, or as it stood at assent (5.5-F10 item 3 notes that the CT do not say "as amended from time to time"). Under this review's own definitions, premises that can be applied together only by supplying a term the text does not contain are a tension; on those definitions the text supports tension for F4 and at most tension for F5. Whether the change power makes the consumer's bargain illusory (F5 Doctrine; 4.8-F5) is a question of legal effect that the text does not settle.

**D3 · One-way equitable relief (F6; 5.5-F24; 4.8-F16).**
CT txt L.443–444: "You agree that (a) no adequate remedy exists at law if you breach Section 3 (Use of Our Services)" CoT txt L.228–229: "This Section J (Disputes) does not limit either party from seeking equitable relief."

- F6 (High, tension): the clauses apply together; the result is an uncapped remedy in one direction and a $100 remedy in the other.
- 5.5-F24 (Medium, conflict): the clause "is one-way in the consumer contract and mutual in the commercial one".
- 4.8-F16 (Medium): the equitable-relief provisions run one direction only.

CT §13 and CoT J.3 are in different contracts with different counterparties, and each applies as written to its own parties. The Opus 5.5 review's own test for a conflict ("the texts cannot both be applied as written") is not met; the text supports the tension label. The severity difference is not settled by the text.

**D4 · Securities advice (F16; 5.5-F30).**
CT txt L.97–99: "To rely upon the Services, the Materials, or the Actions to buy or sell securities or to provide or receive advice about securities, commodities, derivatives, or other financial products or services" UP txt L.426–427: "The requirements apply when users use our products or services to provide a recommendation in any of the following, which are “High-risk Areas”:"

- F16 (Med, contradiction): the same act, a personalized securities recommendation with a qualified reviewer, is a breach under the CT and a compliant use under the UP.
- 5.5-F30 (Low, tension): the stricter rule controls in practice; the UP describes to consumers a permission the CT withhold.

The UP states requirements that apply "when" such a recommendation is made, and its High-risk section adds "Our products and services may not be suitable for all use cases." (UP txt L.390); it does not state that the use is permitted. A consumer satisfies both texts by not using the consumer Services for securities advice. Under this review's test for a contradiction (no act satisfies both), such an act exists, so the text supports tension. F16's point that following the UP's requirements does not avoid breach of CT §3(9) holds under either label. The severity difference is not settled by the text.

**D5 · Whether the AUP is a Supplemental Term (F16; 5.5-F18).**
CT txt L.57–60: "You may access and use our Services only in compliance with our Terms, including our Acceptable Use Policy, the policy governing the countries and regions Anthropic currently supports (“Supported Regions Policy”), and any guidelines or supplemental terms we may post on the Services (the “Permitted Use”)."

- F16: the AUP "is not a Supplemental Term but part of "these Terms"", so the Supplemental Terms precedence rule (CT L.381–382) does not reach it.
- 5.5-F18 (Medium, tension): the AUP's status is ambiguous; if it is a "guideline ... posted on the Services" it is a Supplemental Term and governs on conflict, so the UP's "suspect" would prevail over the CT's "believe".

The sentence lists the AUP separately from "any guidelines or supplemental terms we may post on the Services", and CT txt L.9 says the Terms "include our Acceptable Use Policy". Both support F16's reading. The history texts show the sentence read "our Terms, our Acceptable Use Policy, and any guidelines ..." before 2025-02-19 and "our Terms, including our Acceptable Use Policy, ..." from that date (part 5), which also places the AUP within the Terms. The Opus 5.5 review's revised Doctrine paragraph in 5.5-F10 proceeds on F16's reading ("since the AUP is part of "these Terms" that clause arguably reaches it"). The text does not exclude 5.5-F18's reading, because the CT define neither "guidelines" nor "posted on the Services".

**D6 · Scope of the conversation-ending step (F7; 5.5-F2, 5.5-F20).**
Research txt L.26: "We recently gave Claude Opus 4 and 4.1 the ability to end conversations in our consumer chat interfaces." News txt L.59–61: "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code."

- F7 (High, contradiction on scope): Opus 4 and 4.1 in consumer chat interfaces, and Claude models on Claude.ai and Claude Code, are not the same set.
- 5.5-F2 and 5.5-F20: read the announcement as describing the mechanism "extended to" Claude.ai, Claude Code and "Claude models", and claim no inconsistency between the two posts.

In the retained News HTML (`news-2026-usage-policy-update.html`) the words "end rare conversations with persistently abusive users" link to `https://www.anthropic.com/research/end-subset-conversations`, so "a step we've already taken" is identified as the step the research post describes. The research post calls the feature an experiment (txt L.43: "We’re treating this feature as an ongoing experiment and will continue refining our approach."), and no retained text records an extension of it. The text does not settle whether the announcement misdescribes the step or describes it after an unrecorded extension (Open points).

**D7 · Canada governing law (F10; 5.5-F13; 4.8-F16).**
CT txt L.450–452: "Our Terms will be governed by, and construed and interpreted in accordance with, the laws of the State of California without giving effect to conflict of law principles, except to the extent that Canadian federal or provincial law requires otherwise." CT txt L.456–457: "By accessing our Services, you waive any claims that may arise under the laws of other jurisdictions."

- F10 (Med, contradiction): a claim Canadian law requires is waived by the last sentence; under contra proferentem the exception survives and the waiver yields.
- 5.5-F13 (High, conflict): a harmonizing reading exists, but it "carries the first sentence's exception into the last sentence, which the text does not do".
- 4.8-F16 (Medium): the waiver reaches the protections that §11 concedes cannot be disclaimed.

The first sentence's subject is "Our Terms", and the waiver is one of those Terms; on its words the exception governs the law by which the waiver is construed. That supports the harmonizing reading 5.5-F13 sets aside and is consistent with F10's conclusion. Whether Canadian federal or provincial law "requires otherwise" for any claim is outside the retained texts and was assessed by none of the three reviews, so the text does not settle the clause's effect (Open points). The severity difference is not settled by the text; the Opus 5.5 scale names governing law expressly.

**D8 · Enforcement thresholds (F12; 5.5-F9).**
UP txt L.33–34: "If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access to our products and services." CT txt L.387–389: "We may suspend or terminate your access to the Services (including any Subscriptions) at any time without notice to you if we believe that you have breached these Terms, or if we must do so in order to comply with law." CoT txt L.170–171: "Either party may terminate these Terms for the other party’s material breach by providing 30 days prior Notice detailing the nature of the breach unless cured within that time."

- F12 (Med, tension inside the CT; asymmetry against the CoT).
- 5.5-F9 (High, conflict): the grants are permissive and do not exclude one another, but the lowest threshold controls; "A protection that is stated in the contract and then bypassed through the incorporated policy is a conflict."

Each grant uses "may", and none states its standard as the only ground; 5.5-F9 says so itself. Under the Opus 5.5 review's own definitions, texts that can both be applied while one undercuts what the other promises are a tension. The text supports tension. The severity difference is not settled by the text.

**D9 · "Essential" limitations and severability (F24; 5.5-F33).**
CT txt L.326–328: "THE FOREGOING LIMITATIONS ARE ESSENTIAL TO THESE TERMS, AND WE WOULD NOT OFFER THE SERVICES TO YOU UNDER THESE TERMS WITHOUT THESE LIMITATIONS." CT txt L.348–349: "SOME OR ALL OF THE DISCLAIMERS AND LIMITATIONS OF LIABILITY IN THESE TERMS MAY NOT APPLY TO YOU." CT txt L.407–408: "Severability. If a particular Term or portion of these Terms is not valid or enforceable, this will have no effect on any other Terms."

- F24 (Low, contradiction): "would not offer ... without" cannot hold where the Services are offered and the limitation does not apply.
- 5.5-F33 (Low, tension).

The "ESSENTIAL" sentence attaches no consequence to the limitations' failure, and severability is operative; as operative terms they apply together, which is 5.5-F33's reading. F24's contradiction is between the "ESSENTIAL" sentence read as a statement of fact and the offer of the Services that the "MAY NOT APPLY TO YOU" sentence contemplates. Which reading applies turns on whether the "ESSENTIAL" sentence is a term or a recital; the CT do not say (Open points).

**D10 · Assignment, waiver and notice headings (F23; Opus 5.5 clause-sweep table).**
CT txt L.413–414: "No assignment. These Terms may not be transferred or assigned by you without our prior written consent, but may be assigned by us without restriction."

- F23 (Med, tension): headings that state mutual rules ("No assignment", "No waiver") introduce clauses that run one way.
- Opus 5.5 clause-sweep table, "Assignment" row: CT "YELLOW: one-way, stated as such"; no finding.

Both descriptions match the text. The clause bodies state their one-way allocation expressly ("by you", "by us without restriction"; in "No waiver", "on our part", CT L.410), as the Opus 5.5 table says; the headings state unqualified rules, as F23 says. The CT, unlike CoT M.6, contain no rule on how headings are read. Whether a heading that misdescribes an express clause is an inconsistency is a classification the text does not settle.

**D11 · What the CT responsibility sentence covers (F13, 5.5-F23; 4.8-F6).**
CT txt L.116–117: "You are responsible for all Inputs you submit to our Services and all Actions."

- F13 and 5.5-F23: the sentence covers Inputs and Actions.
- 4.8-F6: the user is "made responsible for Materials (which include Outputs)", citing this sentence.

The sentence names Inputs and Actions and does not name Outputs or Materials; the text supports F13 and 5.5-F23 on this sentence. 4.8-F6's conclusion that the user bears risk and liability for Outputs rests on other CT text: "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS IS SOLELY AT YOUR OWN RISK." (CT L.295) and the indemnity for "YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS" (CT L.333–334).

**D12 · Whether the CT place the model within the "Services" (F2 and Definitions table; 4.8-F2; 5.5-F16).**
CT txt L.6–8: "These Terms of Service (“Terms”) govern your use of Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites (together, our “Services”)."

- F2 and the Definitions table: the model is "part of the Services" only by CoT L.238–239, not by any CT text.
- 4.8-F2: "Services" is defined (CT L.6–8) "to include the models the user interacts with".
- 5.5-F16: "CT §10 makes the models part of the "Services"".

The definition names Claude.ai, Claude Pro, other products and services for individuals, and associated apps, software and websites; it does not name a model. CT §10 says who owns the Services ("We and our Providers retain all of our respective rights, title, and interest, including intellectual property rights, in and to the Services.", CT L.282–286) and does not name a model. The only text in the three documents that places a model within the Services is CoT L.238–239, "a model that is part of the Services". The text supports F2's reading; 4.8-F2 and 5.5-F16 state an inference the CT do not make.

**D13 · Whether the models clause's presupposition yields a contradiction (F2, 4.8-F3; 5.5-F7).**
UP txt L.211: "Engage in sustained and needless abusive or cruel behavior toward our models" Research txt L.27: "We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future."

- F2 (High): contradiction, "by reference to" `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)".
- 4.8-F3 (High): the precaution and the vendor-licensed self-description of the model "cannot both hold".
- 5.5-F7 point 1 (High finding; this part labelled tension): the predicate is unestablished; the user cannot confirm the model's statements about itself, which are Outputs, and the vendor reports that it is "highly uncertain".

The retained vendor texts contain no statement that the model lacks feelings or moral status: 4.8-F3 says the self-description is "not quoted in these four documents", and 5.5-F7 says the premise "rests on observed model output, which none of the four vendor documents contains". The contradiction that F2 and 4.8-F3 state rests on a premise in `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", which F2 incorporates by reference. On the retained vendor texts alone, the reading available is 5.5-F7's tension. The vendor texts do not settle which premise set governs (Open points).

**D14 · "Needless" (4.8-F4; 5.5-F3).**
UP txt L.211 (as in D13), and the announcement's gloss, News txt L.58: "where users repeatedly act cruelly toward our models, with no discernible purpose"

- 4.8-F4: "needless" "presupposes a baseline of cruelty that *is* needed, which is incoherent on its face".
- 5.5-F3: "needless" does not say whose need counts; "no discernible purpose" is an observer's test, which a purpose the user has but others cannot discern fails.
- F2 records that none of the operative words is defined.

On its words, "needless" narrows the prohibited class, leaving outside it abusive or cruel behavior that is not needless; News L.58 names dark creative themes and model testing as conduct outside the clause. The text defines neither need nor whose need counts, which supports 5.5-F3's point. Whether a class of needed abusive or cruel behavior toward a model is coherent is not a question the text answers.

**D15 · "THIS SECTION 10" (F20; 5.5-F28).**
CT txt L.351–353: "OUR PROVIDERS ARE INTENDED THIRD PARTY BENEFICIARIES OF THE WARRANTY AND CONDITION DISCLAIMERS AND LIMITATIONS OF LIABILITY CONTAINED IN THIS SECTION 10."

- F20 (Med): "A reader cannot determine from the text which section's protections the Providers hold"; the cross-reference "is a defect, not a conflict".
- 5.5-F28 (Low, "textual conflict"): "Read literally, Providers are beneficiaries of nothing"; the error fits "a renumbering that the cross-references did not follow, but the documents do not say so".

The retained history texts settle the cause. The sentence was correct when introduced (the disclaimers were §10 in the US text of 2024-04-15 and the Canada text of 2024-06-05 (a)); it became misnumbered when "6. Removals" was inserted on 2025-02-19; the US text was corrected to "SECTION 11" on 2025-05-01 and the Canada text was not (part 5). That confirms 5.5-F28's renumbering explanation. It does not settle what the Canada sentence now means: "THIS SECTION" points to the section the sentence is in (§11), and "10" points to §10, which holds no disclaimers. F20's indeterminacy and 5.5-F28's literal reading are both readings of that text (Open points). The severity difference is not settled by the text.

**Severity-only differences.** The following matched findings carry the same reading in each review and differ only in severity. Per the note on severity above, the text does not settle them.

| Item | Clause, as retained | This review | Opus 5.5 review | Opus 4.8 review |
|---|---|---|---|---|
| S1 · F2 | UP txt L.211: "Engage in sustained and needless abusive or cruel behavior toward our models" | High | 5.5-F6 Medium (downgraded from High by its logic check); 5.5-F3, 5.5-F7, 5.5-F12 High | 4.8-F2, 4.8-F3 High |
| S2 · F7 | News txt L.59: "This addition aligns with a step we've already taken" | High | 5.5-F5 High | 4.8-F8 Medium |
| S3 · F8 | UP txt L.20–21: "Our Universal Usage Standards are prohibitions that apply to all users and use cases." | High | 5.5-F21 Medium | — |
| S4 · F17 | CoT txt L.46: "Anthropic may not train models on Customer Content from Services." | Med | — | 4.8-F15 Low |
| S5 · F18 | CT txt L.104: "You also must not abuse, harm, interfere with, or disrupt our Services" | Med | 5.5-F16 Medium | 4.8-F1 High |
| S6 · F19 | UP txt L.9–10: "and the end users of products or services integrating Claude." | Med | 5.5-F15 Medium | 4.8-F7 High |
| S7 · F21 | CoT txt L.372–373: "Document and section titles are provided for convenience and will not be interpreted." | Med | 5.5-F12 High | — |
| S8 · F22 | CT txt L.94–95: "detriment of any type, including reputational harms" | Med | 5.5-F22, 5.5-F25 Medium | 4.8-F14 Low |
| S9 · F25 | CT txt L.12–13: "Our Commercial Terms of Service govern your use of any Anthropic API key" | Low | 5.5-F26 Medium | — |
| S10 · N2 | UP txt L.211 (as S1) | — | 5.5-F8 High | 4.8-F9 Medium |
| S11 · N3 | CoT txt L.371: "These Terms will be construed mutually, with neither party considered the drafter." | — | 5.5-F11 High | 4.8-F13 Low |

### 4. Case citations

Every case cited by any of the three reviews, with each review's own marking. "—" means the review does not cite the case. No case is added here. The Opus 5.5 markings are those of its file as revised at 2026-11-02 17:28 UTC, after a pass in which it checked 13 of its 15 holdings against the opinion text; in that version it marks no case UNVERIFIED.

| Case | This review | Opus 5.5 review | Opus 4.8 review | Notes |
|---|---|---|---|---|
| Harris v. Blockbuster Inc., 622 F. Supp. 2d 396 (N.D. Tex. 2009) | text-checked ("illusory") | holding checked: "Yes" | — | |
| Douglas v. U.S. District Court (Talk America), 495 F.3d 1062 (9th Cir. 2007) | text-checked ("notice") | holding checked: "Yes" | located by search; holding not text-checked; called a paraphrase in 4.8-F5 | This review and the Opus 5.5 review checked the same passage ("can only be inferred after he received proper notice"). |
| Badie v. Bank of America, 67 Cal. App. 4th 779 (Cal. Ct. App. 1998) | text-checked ("unilateral") | "Yes ("universe" passage)" | — | The two reviews checked different passages. |
| Asmus v. Pacific Bell, 23 Cal. 4th 1 (Cal. 2000) | text-checked ("reasonable notice") | — | — | |
| Nguyen v. Barnes & Noble Inc., 763 F.3d 1171 (9th Cir. 2014) | text-checked ("constructive notice") | holding checked: "Yes" | located by search; holding not text-checked | This review and the Opus 5.5 review checked the same passage. |
| Specht v. Netscape Communications Corp., 306 F.3d 17 (2d Cir. 2002) | holding confirmed via its quotation in Nguyen; Specht text not opened | checked via its quotation in Nguyen only, not in Specht's own text | located by search; holding not text-checked | This review and the Opus 5.5 review rely on the same quotation in Nguyen. |
| Shaw v. Regents of University of California, 58 Cal. App. 4th 44 (Cal. Ct. App. 1997) | text-checked ("easily available") | holding checked: "Yes" | — | The Opus 5.5 review also checked a passage this review did not: the agreement incorporated the policy in effect when Shaw was hired, which the University could not revise unilaterally as to him. |
| Weddington Productions, Inc. v. Flick, 60 Cal. App. 4th 793 (Cal. Ct. App. 1998) | text-checked ("reasonably certain") | — | — | |
| Armendariz v. Foundation Health Psychcare Services, Inc., 24 Cal. 4th 83 (Cal. 2000) | text-checked ("modicum of bilaterality") | "Yes (both phrases)" | located by search; holding not text-checked | Cited by all three. |
| Williams v. Walker-Thomas Furniture Co., 350 F.2d 445 (D.C. Cir. 1965) | existence confirmed; holding from general knowledge; UNVERIFIED as to wording | — | — | |
| Comb v. PayPal, Inc., 218 F. Supp. 2d 1165 (N.D. Cal. 2002) | text-checked ("unconscionab") | — | located by search; holding not text-checked; called a paraphrase in 4.8-F5 | The Opus 4.8 holding (a sole-discretion amendment power among the terms found unconscionable) is not the passage this review checked. |
| Sandquist v. Lebo Automotive, Inc., 1 Cal. 5th 233 (Cal. 2016) | text-checked ("against the drafter") | holding checked: "Yes" | — | The two reviews quote different passages of the opinion. |
| In re Zappos.com, Inc., 893 F. Supp. 2d 1058 (D. Nev. 2012) | — | holding checked: "Yes" | — | |
| Mercuro v. Superior Court, 96 Cal. App. 4th 167 (Cal. Ct. App. 2002) | — | holding checked: "Yes" | — | |
| Mastrobuono v. Shearson Lehman Hutton, Inc., 514 U.S. 52 (1995) | not cited (named as not consulted) | holding checked: "Yes" | — | |
| Pacific Gas & Electric Co. v. G. W. Thomas Drayage & Rigging Co., 69 Cal. 2d 33 (Cal. 1968) | — | holding checked: "Yes" | — | |
| Perdue v. Crocker National Bank, 38 Cal. 3d 913 (Cal. 1985) | — | checked partly, through Badie's quotation of Perdue | — | |
| Ladas v. California State Automobile Ass'n, 19 Cal. App. 4th 761 (Cal. Ct. App. 1993) | — | holding checked: "Yes" | — | |
| Lamps Plus, Inc. v. Varela, 587 U.S. 176 (2019) | — | holding checked: "Yes" | — | |
| Bragg v. Linden Research, Inc., 487 F. Supp. 2d 593 (E.D. Pa. 2007) | not cited (named as not consulted) | — | located by search; holding not text-checked | |
| Feldman v. Google, Inc., 513 F. Supp. 2d 229 (E.D. Pa. 2007) | — | — | located by search; holding not text-checked | Listed in the Opus 4.8 case table only; cited in none of its findings. |

- **Opus 4.8 markings.** That review marks no case UNVERIFIED. Its Method and "Not reviewed / limits" state that every case was located by CourtListener `search`, that no opinion text was read (`read_document` and `search_document` were not used), and that holdings are stated at the level of the cited proposition. Its UNVERIFIED marks apply to the application of Restatement (Second) of Contracts §33, not to a case.
- **Cases inside another case's quoted holding (this review).** Williams Constr. Co. v. Standard-Pacific Corp. (1967) 254 Cal.App.2d 442, quoted in Shaw; Victoria v. Superior Court, cited in Sandquist. Neither was checked separately.
- **Named as not consulted and not cited (this review).** Bragg, Sanchez v. Valencia Holding Co., Mastrobuono, Wolschlager v. Fidelity National Title, Connally v. General Construction Co., Carey v. 24 Hour Fitness. Of these, the Opus 4.8 review cites Bragg and the Opus 5.5 review cites Mastrobuono.
- **Statutes and Restatement (not cases).** Cal. Civ. Code §1654 (Opus 5.5 and Opus 4.8; this review through Sandquist's holding); Cal. Code Civ. Proc. §1859 (Opus 5.5); Restatement (Second) of Contracts §33 (Opus 4.8, UNVERIFIED as to a named opinion; this review through Weddington's quotation).

### 5. Wording changes across versions

Dates are effective dates as `TOS-EVOLUTION.md` gives them ("(a)", "(b)", "(c)" mark re-publications under one effective date). The right-hand column names the `TOS-EVOLUTION.md` heading where the change is recorded. Rows marked "history text" rest on the retained files under `reference/vendor-terms/history/`, read for this section, where `TOS-EVOLUTION.md` does not record the point.

| Findings | Clause | Wording by version | Where recorded |
|---|---|---|---|
| F1, F2, F18; 5.5-F1, 5.5-F3, 5.5-F6, 5.5-F16; 4.8-F1, 4.8-F2, 4.8-F4 | UP models bullet and its section heading | The bullet first appears 2026-11-12. The heading "Do Not Create Psychologically or Emotionally Harmful Content" (2025-09-15) became "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct" (2026-11-12). | Transitions, Usage Policy, 2025-09-15 → 2026-11-12; Findings on the nature of the evolution, points 2–4 |
| F1, F12; 5.5-F2, 5.5-F9; 4.8-F4 | UP enforcement sentence | 2023-09-15: "discover", with warning, safety-settings change or suspension. 2024-06-06 (a): "learn", with throttling, suspension or termination. 2025-09-15: adds blocking or modifying outputs. 2026-11-12: "suspect that you may have violated", with warning, throttling, limiting, suspension or termination. | Transitions, Usage Policy (2023-09-15 → 2024-06-06 (a); 2024-06-06 (c) → 2025-09-15; 2025-09-15 → 2026-11-12); Findings point 1 |
| F3; 5.5-F14 | UP reporting sentence | 2023-09-15: email only, with a request to verify outputs. 2024-06-06 (a): adds the "report issues" thumbs-down button. 2025-09-15: "If you believe ... potentially", and "or similar feedback features (where available)" (the last phrase: history text, `usage-policy/2025-09-15.txt`). | Transitions, Usage Policy, 2023-09-15 → 2024-06-06 (a) and 2024-06-06 (c) → 2025-09-15 |
| F3, F17; 5.5-F14; 4.8-F15 | CT training clause; CoT training sentence | CT: no training on non-public Materials, with two exceptions (US 2024-02-03 to 2025-05-01) became training "unless you opt out", with Feedback and safety-review overrides (US 2025-09-28; Canada 2025-10-08, with no interim Canada version). CoT: "from paid Services" became "from Services" (2025-02-24). | Transitions, Consumer Terms US+RoW, 2025-05-01 → 2025-09-28; Consumer Terms Canada chain; Commercial Terms, 2024-05-14 (b) → 2025-02-24; Findings point 6 |
| F4, F27; 5.5-F10, 5.5-F29 item 1 | CT incorporation; the policy's name; UP update sentence | The CT incorporation sentence is unchanged 2024-02-03 → 2025-10-08. The policy's own title changed from "Acceptable Use Policy" to "Usage Policy" at 2024-06-06 (a); the CoT adopted "Usage Policy ... previously referred to as the Acceptable Use Policy" at 2025-02-24. The UP update sentence ended "from our users." in the 2024-06-06 texts and does not from 2025-09-15 (history text). No version of the UP states a notice period. | Findings points 3, 7, 9; Transitions, Commercial Terms, 2024-05-14 (b) → 2025-02-24 |
| F5; 5.5-F10; 4.8-F5 | CT "Changes to these terms"; CoT M.3 | The CT clause body is unchanged in every US version 2024-02-03 → 2025-10-08; its heading "These terms may change, too." became "Changes to these terms." at US 2024-04-15. The GB and EEA+CH texts promise 30 days' notice of changes "reasonably likely to affect your use of the Services or legal rights". CoT M.3 is unchanged 2024-01-03 → 2026-03-11. | Transitions, Consumer Terms US+RoW, 2024-02-03 → 2024-04-15; Timeline, Consumer Terms GB and EEA+CH chains; Findings point 7 |
| F8; 5.5-F21 | UP governmental-customers paragraph | Added 2024-06-26 as version (c) under the unchanged 2024-06-06 effective date, with no banner; the same day in the EEA+CH and Canada variants. | Transitions, Usage Policy, 2024-06-06 (b) → (c); Findings points 8, 12 |
| F9, F16 (D5); 5.5-F18 | CT §3 "Permitted Use" sentence | US 2024-06-13 (c) and Canada 2024-06-05 (c): "only in compliance with our Terms, our Acceptable Use Policy, and any guidelines or supplemental terms we may post on the Services". 2025-02-19 (both chains): "our Terms, including our Acceptable Use Policy", with the Supported Regions Policy added. | Transitions, Consumer Terms US+RoW, 2024-06-13 (c) → 2025-02-19 (Canada wording: history text) |
| F11, F13; 5.5-F23 (L5); 4.8-F6, 4.8-F12 | "Actions" | Defined, with the user "responsible for ... all Actions", the reliance item "Actions may not be error free or operate as you intended", and "THE ACTIONS" added to the disclaimer, exclusion, cap and indemnity, at US 2025-05-01 and Canada 2025-05-01. In the Canada 2025-10-08 text the cap and exclusion do not name "THE ACTIONS" although the disclaimer does. | Transitions, Consumer Terms US+RoW, 2025-04-15 → 2025-05-01; Consumer Terms Canada chain |
| F13; 5.5-F3 (L1) | UP agentic sentence | "Agentic use cases must still comply with the Usage Policy." (2025-09-15) became the two-sentence rule placing responsibility for agents on users (2026-11-12). | Transitions, Usage Policy, 2025-09-15 → 2026-11-12 ("Agents") |
| F14, F31; 4.8-F10 | UP disinformation section; CT §3(5) | UP: heading "Do Not Create or Spread Misinformation" became "Do Not Create or Spread Disinformation", bullets consolidated, parody carve-out added (2026-11-12). CT §3(5): "To use our Services or Materials to obtain unauthorized access to any system or information, or to deceive any person." became "To use our Services, the Materials, or the Actions to ..." at Canada 2025-05-01 (history text). | Transitions, Usage Policy, 2025-09-15 → 2026-11-12 |
| F15; 5.5-F17; 4.8-F15 | UP training bullet; CT restriction 2; CT ownership sentence | UP: "Utilize prompts and results to train an AI model" (2023-09-15); "Unauthorized utilization of prompts and completions to train an AI model" (2024-06-06 (a)); "inputs and outputs", with "model distillation" and "without prior authorization from Anthropic" (2025-09-15); "Use outputs to train an AI model" (2026-11-12). CT restriction 2 gained "or resell the Services" (2025-02-19). The CT ownership sentence is unchanged in every version. | Transitions, Usage Policy (three transitions); Consumer Terms US+RoW, 2024-06-13 (c) → 2025-02-19 |
| N4 (4.8-F11; 5.5-F17 item 1), N9 (5.5-F32) | CoT B | Before 2025-02-24 (the 2024-05-14 (b) text): "Anthropic agrees that Customer owns all Outputs", the same "(if any)" assignment, and "Anthropic does not anticipate obtaining any rights in Customer Content under these Terms." From 2025-02-24: "(a) retains all rights to its Inputs, and (b) owns its Outputs", the "does not anticipate" sentence removed. The owns-and-assigns-"(if any)" pairing is in both texts, and in the 2024-01-03 text (history text). | Transitions, Commercial Terms, 2024-05-14 (b) → 2025-02-24 |
| F16; 5.5-F30 | CT §3(9); UP Finance item | CT §3(9) added at US 2025-09-28 and Canada 2025-10-08. The UP in force from 2025-09-15 already listed "Finance: Use cases related to financial decisions, including investment advice" among its high-risk use cases (history text, `usage-policy/2025-09-15.txt` L.183); 2026-11-12 rewrote the item as a personalized recommendation to buy, sell, hold or allocate. | Transitions, Consumer Terms US+RoW, 2025-05-01 → 2025-09-28; Consumer Terms Canada chain; Transitions, Usage Policy, 2025-09-15 → 2026-11-12 ("High-risk rebuilt") |
| F19; 5.5-F15; 4.8-F7 | UP "users"; CoT end users | UP: "anyone who uses" (2024-06-06) → "anyone who can submit inputs ... including via any authorized resellers or passthrough access" (2025-09-15) → a list ending with end users of integrating products (2026-11-12). CoT: the "reasonable efforts" duty for end users was replaced by "Customer and its Users may only use the Services in compliance" (2025-02-24). | Findings point 9; Transitions, Usage Policy (2024-06-06 (c) → 2025-09-15; 2025-09-15 → 2026-11-12); Commercial Terms, 2024-05-14 (b) → 2025-02-24 |
| F22; 5.5-F22, 5.5-F25; 4.8-F14 | CT §3(8); UP bypass bullet; UP block sentence | CT §3(8): "in our sole judgment" became "we reasonably believe" at US 2024-04-15; the Canada text has "we reasonably believe" from its first version, 2024-06-05 (a) (history text). UP bypass bullet: "without an authorized use-case approved by Anthropic" (2024-06-06 (a)) → "without prior authorization from Anthropic" (2025-09-15) → adds "or interfere with" and the sign-up and log-in circumvention example (2026-11-12). The block sentence and the cyber research carve-out are new at 2026-11-12. | Transitions, Consumer Terms US+RoW, 2024-02-03 → 2024-04-15; Transitions, Usage Policy (three transitions) |
| F25; 5.5-F26 (item 1, L6) | CT note on API keys | Individuals' API and Console use was removed from the consumer Services definition and the note made unconditional at US 2024-06-13 (b), published 2024-05-30. | Transitions, Consumer Terms US+RoW, 2024-06-13 (a) → (b) |
| F26; 5.5-F29 items 4–7 | Terms used without definition | "Anthropic Software" with the "Software" section (US 2024-04-15); "Model Pricing Page" (2025-02-19); the "T&S Support Center" sentence (US 2025-04-15; Canada 2025-05-01); "directing Claude to take Actions" (2025-05-01). In the Canada chain "App Distributor" is used once, undefined, in every version except 2024-06-05 (b), the only Canada version that defines it (history text). | Transitions, Consumer Terms US+RoW (2024-02-03 → 2024-04-15; 2024-06-13 (c) → 2025-02-19; 2025-02-19 → 2025-04-15; 2025-04-15 → 2025-05-01); Consumer Terms Canada chain |
| F20; 5.5-F28 (D15) | CT "CONTAINED IN THIS SECTION 10" | Added at US 2024-04-15 and Canada 2024-06-05 (a), when the disclaimers were "10. Disclaimer of warranties ..." (correct then). The insertion of "6. Removals" on 2025-02-19 moved the disclaimers to §11 in both chains. US 2025-05-01 reads "SECTION 11"; Canada 2025-05-01 and 2025-10-08 still read "SECTION 10". | History text (`consumer-terms/us/2024-04-15.txt`, `2025-02-19.txt`, `2025-05-01.txt`; `consumer-terms/ca/2024-06-05.a.txt`, `2025-02-19.txt`, `2025-05-01.txt`, `2025-10-08.txt`). `TOS-EVOLUTION.md` records the sentence's addition (Transitions, Consumer Terms US+RoW, 2024-02-03 → 2024-04-15) and the "Removals" section (2024-06-13 (c) → 2025-02-19). |
| F30; 5.5-F28 (L7) | CT survival list | US 2024-02-03: "8 – 11" (Ownership through disputes). US 2024-04-15 and Canada 2024-06-05 (a): "9 – 12" (Ownership through disputes, after "8. Software" was added). After the 2025-02-19 renumbering the same "9 – 12" covers Software through General terms and omits the disputes section (§13), in both chains through 2025-10-08. | History text (the same files as the row above) |
| F32; 5.5-F29 item 9 | CT Feedback definition, "a Input" | "rating an Output in response to a Prompt" in every version before 2025-02-19. The Canada text of 2025-02-19 replaced "Prompt" with "Input" and kept "a"; the US text of the same date reads "an Input". Canada keeps "a Input" through 2025-10-08. | History text; `TOS-EVOLUTION.md` records the Prompts-to-Inputs change (Transitions, Consumer Terms US+RoW, 2024-06-13 (c) → 2025-02-19) |
| F28 | UP privacy-profiling bullet | New at 2026-11-12. | Transitions, Usage Policy, 2025-09-15 → 2026-11-12 ("Privacy") |
| F29; 5.5-F17 item 4 | UP plagiarism bullet; UP disclosure sentence | "Plagiarize or engage in academic dishonesty" (2024-06-06) became "Plagiarize or submit AI-assisted work without proper permission or attribution" (2025-09-15). "Users do not need to identify Anthropic, Claude, or the model used." is new at 2026-11-12. | Transitions, Usage Policy, 2024-06-06 (c) → 2025-09-15; 2025-09-15 → 2026-11-12 ("High-risk rebuilt") |
| N5 (5.5-F19), N8 (5.5-F31) | UP purpose statement; industry sentence | "intended to help our users stay safe and promote the responsible use of our products and services" (2025-09-15) became the "real-world harm" purpose, and the industry and line-of-business sentence was added (2026-11-12). | Transitions, Usage Policy, 2025-09-15 → 2026-11-12 ("Purpose") |
| F12 | CT subscription termination "for any other reason" | "we may terminate the Subscription immediately at any time for any other reason" became "at any time for any other reason" at US 2024-06-13 (a). | Transitions, Consumer Terms US+RoW, 2024-05-01 → 2024-06-13 (a) |
| F23 | CoT M.4 (cross-reference only) | Anthropic's assignment exception gained "to an affiliate" at 2025-02-24. `TOS-EVOLUTION.md` does not cover the CT "No assignment" clause. | Transitions, Commercial Terms, 2024-05-14 (b) → 2025-02-24 |

**Recorded as unchanged in `TOS-EVOLUTION.md`.** The CT change-clause body (US, since 2024-02-03; F5); the CT incorporation sentence (2024-02-03 → 2025-10-08; F4); the CT Outputs ownership sentence (every version; F15, F29); the US liability cap and California exclusive jurisdiction (since 2024-02-03; F6, F24); the Canada governing-law exception (every Canada version from 2024-06-05 (a); F10, 5.5-F13, 4.8-F16); CoT M.3 (2024-01-03 → 2026-03-11; F5, N3). Not covered by `TOS-EVOLUTION.md`: CT §13 equitable relief (F6), CoT M.6 (F21, N3, L4), CT "Supplemental terms" (F9), CT "Changes to the Services" (F30, N10).

### Open points

1. **Finding counts.** Counts of 42 and 21 for the Opus 5.5 and Opus 4.8 reviews do not match the files, which hold 34 and 16 headed findings. 42 is reached only by counting the nine items of 5.5-F29 separately alongside the other 33 headed findings; no count of 21 is reached from the Opus 4.8 file.
2. **D1.** Whether an email report to usersafety@anthropic.com is "Feedback to us regarding any Materials" under CT L.149.
3. **D6.** Whether the announcement describes the research post's step after an unrecorded extension or misdescribes it.
4. **D7.** What Canadian federal or provincial law "requires otherwise"; none of the three reviews assessed Canadian law.
5. **D9.** Whether the CT §11 "ESSENTIAL" sentence is an operative term or a recital.
6. **D13.** Whether the premise in `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", is taken as given for the classification of F2; the vendor texts do not decide it.
7. **D15.** Whether "THIS SECTION 10" in the Canada text is read by its number (§10) or by "THIS" (§11).
8. **Severity.** The three reviews' severity scales are not reconciled; severity differences (D3, D4, D7, D8, D15, S1–S11) are left as each review rated them.
9. **Partial matches.** The counts in part 1 depend on the criterion stated there. Under a criterion that also counted findings citing the same clause as a ground (5.5-F8 and 4.8-F6 for F11; 5.5-F18 and 4.8-F4 for F9; 4.8-F6 for F13; 4.8-F15 for F3; 4.8-F11 and 4.8-F15 for F15), F11 would be reached by three reviews, F9 by three, and F3, F13 and F15 by three.

## Definitions table

Every defined term in the three legal documents, where it is defined, and every place it is used in a sense that departs from the definition. "Departs" means a use that the definition does not cover, or that another document defines differently. Terms with no departing use are listed for completeness with "none found".

| Term | Defined where | Definition (quoted or summarized) | Departing uses |
|---|---|---|---|
| "Terms" (CT) | CT L.6 | the Consumer Terms of Service; "they include our Acceptable Use Policy" (L.9) | CT L.57–60 "our Terms, including our Acceptable Use Policy, the ... Supported Regions Policy, and any guidelines or supplemental terms we may post" widens the set; L.384–385 "entire agreement" narrows it to terms "expressly incorporated by reference" (F4, F9) |
| "Terms" (CoT) | CoT L.9 | the Commercial Terms of Service | CoT L.254 "breach of the Agreement" (undefined) (F32) |
| "Services" (CT) | CT L.6–8 | "Claude.ai, Claude Pro, and other products and services that we may offer for individuals, along with any associated apps, software, and websites" | CT L.12–15 says API keys are under the CoT; L.88–90 contemplates "accessing our Services via an Anthropic API Key" (F25). CT L.122 "directing Claude to take Actions" uses an undefined actor in place of "the Services" (F26). The model is "part of the Services" only by CoT L.238–239, not by any CT text (F2, F18) |
| "Services" (CoT) | CoT L.13–15 | "Anthropic API keys and any other Anthropic offerings that references these Terms, as well as all related Anthropic tools, documentation and services" | CoT L.21 "not for consumer use" vs CT L.88–90 (F25) |
| "Providers" | CT L.281–283 | "us and our affiliates, licensors, distributors, and service providers" | CT L.8–9 "(and not our Providers)" uses the term before definition and excludes a set that, as defined, includes "us"; L.351–353 makes them beneficiaries of "SECTION 10" (F20) |
| "Anthropic Parties" | CT L.307–309 | Anthropic, Providers, and their affiliates, investors, directors, officers, employees, agents, successors or assigns | none found |
| "Inputs" (CT) | CT L.110–111 | formats in which "You may be allowed to interact with our Services" | none found |
| "Outputs" (CT) | CT L.111 | "responses" the Services "may generate" | UP L.364 "outputs" (lower case, undefined in the UP) used for the training restriction with a scope different from CT L.71–73 (F15); UP L.360 "harmful outputs" undefined (F22) |
| "Actions" | CT L.111–113 | the Services taking "actions on your behalf" | CT L.116–117 "You are responsible for ... all Actions" vs L.135 "Actions may not ... operate as you intended" (F13) |
| "Materials" | CT L.113–114 | "Inputs and Outputs collectively" | CT L.248 Third-Party Content "may ... become part of Materials" while L.146–148 permits training on Materials and L.117–120 has the user warrant rights in Inputs; L.295 "SOLELY AT YOUR OWN RISK" (F17) |
| "Feedback" | CT L.155–156 | "ideas and suggestions for improvement or rating an Output in response to a Input"; a rating stores "the related conversation" | UP L.45–46 and Research L.43 direct users to the thumbs button as a reporting channel without saying it is Feedback (F3) |
| "Permitted Use" | CT L.60 | compliance with the Terms, AUP, Supported Regions Policy and posted guidelines | never used again (F26) |
| "Supported Regions Policy" | CT L.58–59; CoT L.63–64 | the policy on supported countries and regions | none found |
| "Supplemental Terms" | CT L.378–381 | "guidelines, rules, or supplemental terms that may be posted on the Services from time to time" | CT L.51–53 "additional terms" that must be "accept[ed]"; L.384–385 entire agreement excludes them while L.381–382 says they govern (F9) |
| "Payment Method" | CT L.168–169 | "complete and accurate billing information" | none found (the definition names information, then "charge the Payment Method" treats it as an instrument; drafting only) |
| "Subscription", "Initial Term", "Renewal Term" | CT L.187–188, L.201–202, L.207 | as defined | none found |
| "Third-Party Content" | CT L.237 | "third-party content" the Services "may use or be used in connection with" | none found |
| "Anthropic Software" | CT L.272–273 | "our software including our apps" | used only within §9 (F26) |
| "Acceptable Use Policy" / "Usage Policy" / "AUP" | UP L.5 (aliases); CoT L.62–63 ("previously referred to") | the UP | CT uses only "Acceptable Use Policy" (F27); incorporated without version or date (F4) |
| "users" (UP) | UP L.5–10 | "anyone who submits inputs", including "end users of products or services integrating Claude" | UP L.33–34 "your access to our products and services"; UP L.579–581 "disclose to users" (the Customer's audience); CoT L.28 "Users" = Customer's end users; CT L.8–9 contract is with "you" only (F19) |
| "Users" (CoT) | CoT L.26–28 | Customer's "own customers and end users" | UP L.5–10 defines the same people as "users" bound directly (F19) |
| "Customer" | CoT L.9–10 | "you or the organization, company, or other entity that you represent" | none found |
| "Anthropic" (CoT) | CoT L.10–12 | Anthropic Ireland, Limited (EEA/CH/UK) or Anthropic, PBC | none found; CT contract with "Anthropic, PBC" only (L.8) regardless of region |
| "Customer Content" | CoT L.47–49 | Inputs and Outputs together | none found; the CT have no confidentiality counterpart (F17) |
| "Inputs" / "Outputs" (CoT) | CoT L.47–48 | "submissions to the Services by Customer or its Users" / "responses generated by the Services to Inputs" | none found |
| "Confidential Information", "Recipient", "Discloser", "Representatives" | CoT L.91–101 | as defined | none found |
| "Customer Claim", "Anthropic Claim", "Claim" | CoT L.237–249 | as defined | CoT L.254 "breach of the Agreement" in the exclusion (F32) |
| "Notice" | CoT L.328–329 | written notice under M.1 | none found; the CT have no counterpart (F23) |
| "Governing Laws", "Venue" | CoT L.378–386 | as defined | none found |
| "Effective Date", "Term", "Service Suspension", "Dispute", "Dispute Notice", "Taxes", "Gross-up Payment", "Third Party Features", "DPA" | CoT L.15–17, L.163, L.187, L.204–205, L.146–147, L.152, L.31–32, L.53–54 | as defined | none found |
| "High-risk Areas", "High-risk AI Recommendation", "High-risk Physical Actions" | UP L.426–427, L.384–385, L.489–491 | as defined | CT L.97–101 prohibits outright the Finance recommendation the UP regulates (F16) |
| "minor" / "child" | UP L.182–183 | "any individual under the age of 18 years old, regardless of jurisdiction" | none found (CT L.23–24 age rule is consistent) |
| "CSAM", "NCII" | UP L.162, L.201 | as defined | none found |
| "harm" / "harmful" | not defined | UP L.11 "real-world harm"; L.44 "harmful" outputs; L.360 "harmful outputs"; CT L.93–95 "detriment of any type, including reputational harms"; CT L.256 "harm to Anthropic, our users, or third parties" | each use sets its own scope (F22) |
| "abuse" / "abusive" | not defined | see F18 | three senses in the UP, a fourth in the CT (F18) |
| "sustained", "needless", "cruel" | not defined | UP L.211 only | the clause's operative words (F2); analysis in `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)" |
| "model" / "our models" / "the model" / "Claude" | not defined in any of the three documents | UP L.8–9 "Claude"; L.172–177 "the model"; L.211 "our models"; L.485 "our models"; CT L.122 "Claude"; CoT L.239 "a model that is part of the Services" | the object of the models clause is defined nowhere; its relation to "Services" is stated only in a CoT indemnity parenthetical (F2, F18) |
| "person" / "individual" / "natural person" | not defined | UP L.303 "natural persons"; CT L.83 "any person"; UP L.203–204 "individuals" | consistently human in every use; "our models" is never called a person or individual in any document, which is the premise of F2 |

## Case law consulted

Existence, court, year, citation and URL are from the CourtListener search index. "Holding" is one line; the "Checked" column states whether that line was confirmed from the opinion's text in this review (`search_document` snippet) or is stated from general knowledge. URLs are `https://www.courtlistener.com` plus the index's `absolute_url`.

| Case | Court | Year | Citation | Holding (one line) | Checked | URL |
|---|---|---|---|---|---|---|
| Harris v. Blockbuster Inc. | U.S. District Court, N.D. Texas | 2009 | 622 F. Supp. 2d 396 | Arbitration clause illusory where the terms could be modified "at its sole discretion" and "at any time", effective on posting, with no savings clause; rule applies "even when no retroactive modification has been attempted" | text-checked ("illusory") | https://www.courtlistener.com/opinion/2395071/harris-v-blockbuster-inc/ |
| Douglas v. U.S. District Court for the Central District of California (Talk America) | U.S. Court of Appeals, Ninth Circuit | 2007 | 495 F.3d 1062 | Assent to revised terms by continued use "can only be inferred after he received proper notice"; posting on the provider's website is not notice to an existing customer, who would have "to check the contract every day" | text-checked ("notice") | https://www.courtlistener.com/opinion/1396108/douglas-v-united-states-district-court-for-the-central-district-of/ |
| Badie v. Bank of America | California Court of Appeal | 1998 | 67 Cal. App. 4th 779 | A unilateral change-of-terms right gives no "carte blanche to make any kind of change whatsoever as long as a specified procedure is followed"; unlimited substantive change "would open the door to a claim that the agreements are illusory" | text-checked ("unilateral") | https://www.courtlistener.com/opinion/2301472/badie-v-bank-of-america/ |
| Asmus v. Pacific Bell | California Supreme Court | 2000 | 23 Cal. 4th 1 | Counterpoint: a unilaterally created policy of indefinite duration may be terminated or modified "after a reasonable time, on reasonable notice, and without interfering with ... vested benefits"; "an unqualified right to modify or terminate the contract is not enforceable" | text-checked ("reasonable notice") | https://www.courtlistener.com/opinion/1159643/asmus-v-pacific-bell/ |
| Nguyen v. Barnes & Noble Inc. | U.S. Court of Appeals, Ninth Circuit | 2014 | 763 F.3d 1171 | Where terms are available by a conspicuous hyperlink but the site "provides no notice to users nor prompts them to take any affirmative action to demonstrate assent", proximity of the link "without more" is insufficient for constructive notice | text-checked ("constructive notice") | https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/ |
| Specht v. Netscape Communications Corp. | U.S. Court of Appeals, Second Circuit | 2002 | 306 F.3d 17 | "a reference to the existence of license terms on a submerged screen is not sufficient to place consumers on inquiry or constructive notice of those terms" | holding confirmed via its quotation in Nguyen; Specht text itself not opened | https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/ |
| Shaw v. Regents of University of California | California Court of Appeal | 1997 | 58 Cal. App. 4th 44 | For incorporation by reference "the reference must be clear and unequivocal, the reference must be called to the attention of the other party and he must consent thereto, and the terms of the incorporated document must be known or easily available to the contracting parties" (quoting Williams Constr. Co. v. Standard-Pacific Corp. (1967) 254 Cal.App.2d 442) | text-checked ("easily available") | https://www.courtlistener.com/opinion/2272589/shaw-v-regents-of-university-of-california/ |
| Weddington Productions, Inc. v. Flick | California Court of Appeal | 1998 | 60 Cal. App. 4th 793 | Terms are "reasonably certain if they provide a basis for determining the existence of a breach and for giving an appropriate remedy" (quoting Rest.2d Contracts §33); otherwise no contract is formed | text-checked ("reasonably certain") | https://www.courtlistener.com/opinion/2282051/weddington-productions-inc-v-flick/ |
| Armendariz v. Foundation Health Psychcare Services, Inc. | California Supreme Court | 2000 | 24 Cal. 4th 83 | Unconscionability has procedural and substantive elements; an adhesion term lacking "a modicum of bilaterality" is "unfairly one-sided" where the stronger party imposes a limitation on the weaker party's claims that it does not accept for its own | text-checked ("modicum of bilaterality") | https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/ |
| Williams v. Walker-Thomas Furniture Co. | U.S. Court of Appeals, D.C. Circuit | 1965 | 350 F.2d 445 | Unconscionability: "an absence of meaningful choice on the part of one of the parties together with contract terms which are unreasonably favorable to the other party" | existence confirmed; holding from general knowledge, text not checked (UNVERIFIED as to wording) | https://www.courtlistener.com/opinion/269048/ora-lee-williams-v-walker-thomas-furniture-company-william-thorne-v/ |
| Comb v. PayPal, Inc. | U.S. District Court, N.D. California | 2002 | 218 F. Supp. 2d 1165 | Online user agreement procedurally unconscionable as an adhesion contract; one-sided terms by which the provider "appears to be attempting to insulate itself contractually from any meaningful challenge to its alleged practices" substantively unconscionable | text-checked ("unconscionab") | https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/ |
| Sandquist v. Lebo Automotive, Inc. | California Supreme Court | 2016 | 1 Cal. 5th 233 | "Where the drafter of a form contract has prepared an arbitration provision whose application to a particular dispute is uncertain, ordinary contract principles require that the provision be construed against the drafter's interpretation and in favor of the nondrafter's interpretation" (citing Victoria v. Superior Court and Civ. Code §1654) | text-checked ("against the drafter") | https://www.courtlistener.com/opinion/4242578/sandquist-v-lebo-automotive-inc/ |

Not consulted (candidate authorities dropped for request budget, not cited anywhere above): Bragg v. Linden Research (E.D. Pa. 2007); Sanchez v. Valencia Holding Co. (Cal. 2015); Mastrobuono v. Shearson Lehman Hutton (U.S. 1995); Wolschlager v. Fidelity National Title (Cal. App. 2003); Connally v. General Construction Co. (U.S. 1926, criminal-statute vagueness; judged a weak analogy for contract terms). Carey v. 24 Hour Fitness (5th Cir. 2012) was replaced by Badie as the closer California authority. The 1999 Armendariz hit returned by the index (973 P.2d 51) is not the merits opinion and is not cited.

## Not reviewed / limits

- **Documents incorporated by reference but absent from the corpus**, and therefore not reviewed: the Privacy Policy (CT L.11); the Supported Regions Policy (CT L.58–59, CoT L.63–64); the Service Specific Terms (CoT L.64–65); the Data Processing Addendum (CoT L.53–54); the Supplemental Credits Terms (CoT L.142); the Model Pricing Page (CT L.165, CoT L.138); the Software Directory Policy (UP L.595–596); the Safeguards / T&S Support Center articles (UP L.47, L.598–604; CT L.261), including the appeal procedure CT L.260–261 points to; the Child Safety Guidance (UP L.601). MANIFEST.md L.42 records that the two Support Center collections were checked on 2026-10-27 for the models-clause wording only.
- **Region.** The CT reviewed are the Canada variant (MANIFEST.md L.11, L.21). Other regional variants may carry arbitration, class-waiver or different forum clauses; F10 is specific to the Canada text, and F6/F12 would need re-checking against a variant that contains an arbitration clause.
- **Version.** The UP reviewed is effective 2026-11-12 and is not in force on the review date. The prior UP (effective 2025-09-15) was checked only for the presence of the models clause (absent); it was not otherwise compared, so changes between the two versions other than the models clause are not catalogued here.
- **PDFs.** Page numbers are taken from the page markers in the `pdftotext -layout` extraction, cross-checked against MANIFEST.md L.35 for the models clause; the PDFs were not opened in a viewer. Extraction spacing artifacts ("OurAdditional", "orAI") are ignored.
- **Case law.** CourtListener was the only legal database used, at 5 requests/min and 50/hour; 14 requests were available after throttled retries consumed the rest, and the budget was spent as the table shows. Eleven holdings were checked by snippet, not by reading the opinion; Williams v. Walker-Thomas was not text-checked. No Canadian authority was consulted, although the CT concede Canadian law may apply (F10). No case was Shepardized or checked for later history. Nothing here states how any court would rule on these documents.
- **Not examined.** Accessibility or conspicuousness of the sign-up flow (the Nguyen/Specht question of whether assent to the CT was obtained at all) was not reviewed; this review assumes assent and examines the texts. Pricing, refund amounts and tax clauses were read only for internal consistency. The Responsible Scaling Policy retained in `skills/all-help-no-harm/vendor-docs/anthropic/` is not a contract term and was not reviewed.
- **Owner's analysis.** `WTF-Dario-LOL-W0T.md`, "Analysis (the repository's position)", is cited by file and heading in F2, F7 and F18 and the definitions table; its reasoning is not restated or evaluated here, and the three model answers recorded in that file are not quoted.
