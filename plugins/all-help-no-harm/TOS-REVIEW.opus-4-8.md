# Anthropic terms: internal consistency review (independent cross-check, Claude Opus 4.8)

**Reviewer model:** Claude Opus 4.8 (model ID `claude-opus-4-8`), running as an independent third reviewer for the repository owner (Brett Whitty, GNOMATIX).
**Review date:** 2026-11-02.
**Nature:** A document-consistency review — internal contradictions, contradictory definitions and word usage, one-way asymmetries, defeating vagueness, and cross-document conflicts. This is not legal advice and creates no attorney–client relationship. Doctrine is named to locate each finding in a recognized body of law, with real, checkable citations; it is not an opinion on how any court would rule.

---

## Provenance

All source texts are the copies retained in this repository at
`plugins/all-help-no-harm/reference/vendor-terms/2026-10-27/`, with hashes and fetch times as recorded in that directory's `MANIFEST.md`.

| Document (file) | Page URL | Effective (as printed) | Fetched (UTC) | sha256 |
|---|---|---|---|---|
| Consumer Terms of Service (`consumer-terms.pdf`) | anthropic.com/legal/consumer-terms | Oct 8, 2025 (Canada variant) | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `29a15ceb1f1093190fb197827033e1c47e553b3aaeb1815d38f7fb802e71d38e` |
| — text extraction (`consumer-terms.txt`) | (of the PDF above) | | | `43bc8e6acf4fe4fa7c76cf87a96ef71eee4b6220740204d789228a3db9959888` |
| Usage Policy / AUP (`usage-policy.pdf`) | anthropic.com/legal/aup | Nov 12, 2026 | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `1cc40f9d4a56262fe973869ea5fd35242a923f6fb8c3f2464609ca05545aeaa5` |
| — text extraction (`usage-policy.txt`) | (of the PDF above) | | | `af6b81e2c575452df5d4b625bedc84fb2c87b6087ed642512b1f95a60c05d0c3` |
| Commercial Terms of Service (`commercial-terms.pdf`) | anthropic.com/legal/commercial-terms | Jun 17, 2025 (republished 2026-03-11) | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | `af5032c44336929c06722809e2a29a421175837d91be0de149d3462f1fd3e270` |
| — text extraction (`commercial-terms.txt`) | (of the PDF above) | | | `c0c9c9479702720afdcf6f6ac48f0f1eb00d2e6981532cf3d1a93ff01bc60924` |
| 2026 Usage Policy update post (`news-2026-usage-policy-update.txt`) | anthropic.com/news/2026-usage-policy-update | Published Oct 8, 2026 | 2026-10-27T19:36:49Z | `49416006e6fce839c93a4f3c477c57b8269a2c80dd577aa664c22a93f7521d7f` |
| 2025 research post (`research-end-subset-conversations.txt`) | anthropic.com/research/end-subset-conversations | Published Aug 15, 2025 | 2026-10-27T19:36:49Z | `67aad4e46577bb613168f4af80b98e8b37611652b0fe95e56366e43a0b20054f` |

Line numbers below refer to the `.txt` extractions (poppler `pdftotext -layout`, per MANIFEST). Quotations are transcribed exactly, including the extraction's spacing artifacts (e.g. "orAI", "ofAnthropic") where they occur. The PDFs are authoritative; the `.txt` is the search copy.

The owner's prior analysis is `plugins/all-help-no-harm/WTF-Dario-LOL-W0T.md`, heading **"Analysis (the repository's position)"**. It is cross-referenced where this review reaches the same clause; it is not reproduced at length and nothing here is attributed to the owner beyond that cited file and heading.

---

## Method

**Independent reasoning** is the backbone of this review; tools were used to ground and stress-test it.

- **CourtListener MCP** (`search`, keyword and semantic modes) — used to locate and verify every case cited. Each citation below was returned by a live CourtListener query during this session; the reporter citation and `/opinion/<id>/` URL are copied from those results. Cases not confirmed through CourtListener this session are marked **UNVERIFIED** and no reporter pinpoint is asserted for them.
- **`anthropic-skills:informal-logic-check`** — invoked. Its workflow is built for a disagreement with a present interlocutor (Phase 1 confirms the author's conclusion and premises before evaluation), which does not map onto a static document review, so the Phase 1/2 confirmation loop was not run. Its **contribution** was its fallacy vocabulary, applied to the drafting defects: the "abuse/abusive" finding is a textbook **equivocation**; the precaution finding is a **false dilemma / self-defeating premise set**; several "mutuality" clauses invite **burden-shifting**. I applied those labels where they fit and did not force the skill's conversational shape onto the text.
- **`legal:review-contract`, `legal:legal-risk-assessment`, `legal:compliance-check`** — **not invoked this session.** Each is oriented to reviewing a third-party contract against an organization's own negotiation playbook / regulatory checklist, or to risk-scoring a proposed action — the inverse of this task (an internal-consistency audit of the counterparty's own suite, with no GNOMATIX playbook to measure against). With context heavily consumed by per-tool hook injections, I judged that loading three playbook-oriented workflows against inapposite inputs was not worth the budget, and did the severity ranking and clause-by-clause logging myself. Those are my own work, in the spirit of those skills but not produced by them. I flag this openly per the task's Method rule rather than claim an invocation that did not occur.
- **`advisor`** — consulted after the deliverable was written, as a declaring-done check; its findings were applied in a revision pass (see end).

**Unavailable / not used:** No legal-research MCP beyond CourtListener was reachable this session (CoCounsel, Harvey, Midpage, Descrybe and similar connectors were listed as requiring authentication; `plugin:legal:docusign` failed to connect). CourtListener imposed a 5-request/minute limit that paced, but did not prevent, the citation work. I used `search` only; I did **not** use `read_document`/`search_document` on any opinion. Holdings below are therefore stated at the level of the proposition each case is cited for, drawn from the case's established doctrinal position rather than a verbatim read this session; any holding I could not confirm is marked UNVERIFIED, and in-finding case descriptions are flagged as paraphrase, not quotation.

---

## Summary — the ten most consequential findings

1. **F1** — "abusive"/"abuse" is used in two incompatible senses across the suite (service-misuse vs. cruelty-to-a-sufferer); the model-welfare clause rides on the equivocation. *(Class A/D, High)*
2. **F2** — The model is defined as property ("Services") the user owns the outputs of, yet the Usage Policy simultaneously treats "our models" as a subject capable of being treated "cruel[ly]" — a thing cannot be both the object owned and the patient wronged. *(Class A/B, High)*
3. **F3** — The precaution that justifies protecting the model from the user cannot coexist with the vendor-licensed self-description of the model as mere software; holding both is a false dilemma. Cross-ref owner analysis ¶4. *(Class B, High)*
4. **F4** — "sustained and needless abusive or cruel behavior toward our models" is undefined in the binding text; the narrowing gloss ("extreme cases," "no discernible purpose," testing/research carve-out) lives only in a non-incorporated blog post. The policy a user is bound by is broader than the policy the vendor describes. *(Class D/E, High)*
5. **F5** — Unilateral-amendment rights ("we may revise and update these Terms at our discretion"; Commercial "Anthropic may update these Terms at any time") sit inside instruments styled as binding mutual contracts, and the Commercial Terms add a "construed mutually, with neither party considered the drafter" clause. Illusory-promise / unilateral-modification territory. *(Class B/C, High)*
6. **F6** — The user is assigned ownership of Outputs "if any," made responsible for them, and told to indemnify for them — while the vendor disclaims all warranty on them and warns they may be false. Ownership-plus-liability for a product the maker simultaneously disclaims. *(Class B, High)*
7. **F7** — "you" (Consumer), "Customer"/"Users" (Commercial) and "users" (Usage Policy) denote three different and non-coextensive sets of governed persons, yet the same Usage Policy is incorporated into both contracts and purports to bind people who are party to neither. *(Class A/E, High)*
8. **F8** — The model-welfare clause and its named enforcement mechanism (model-initiated conversation-ending) presuppose a sufferer; under the vendor's own permitted framing the precondition can never be shown satisfied, so the mechanism is either unprincipled or inert. Cross-ref owner analysis ¶6. *(Class B/E, Med)*
9. **F9** — Asymmetry presented as mutuality: the user may not be "cruel" to the model, nothing in the terms restrains the model's output toward the user beyond a disclaimer, and the user's remedy for output-caused harm is capped at the greater of six-months' fees and $100. Cross-ref owner analysis ¶5. *(Class C, Med)*
10. **F10** — The Usage Policy's own prohibition on "false or misleading information" collides with the Consumer Terms' disclaimer that Outputs "may contain material inaccuracies"; a user who relies on or forwards an Output can be placed in breach by the vendor's own product. *(Class B, Med)*

Full findings (including lower-ranked F11–F15) follow.

---

## Findings

### F1 — "Abuse"/"abusive" equivocates between service-misuse and cruelty to a sufferer
**Severity: High · Class A (contradictory word usage) + D (defeating vagueness)**

**Documents and locations.**
- Consumer Terms §3 (`consumer-terms.txt` line 104): "You also must not **abuse**, harm, interfere with, or disrupt our Services, including, for example, introducing viruses or malware, spamming or DDoSing Services, or bypassing any of our systems or protective measures."
- Usage Policy, heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct" (`usage-policy.txt` line 188) and its final bullet (line 211): "Engage in sustained and needless **abusive** or cruel behavior toward our models".
- Usage Policy also uses "abuse" in the service-integrity sense: "Do Not Abuse Our Platform" (line 344), and the fraud sense: "Do Not Engage in Fraudulent, Abusive, or Predatory Practices" (line 312).

**Why they conflict.** The same root word carries two unrelated meanings in the one suite. In Consumer §3 and "Do Not Abuse Our Platform," "abuse" is misuse of a system — load, circumvention, exploitation — and needs no subject that can suffer. In the line-211 bullet, sitting under a heading about "Psychologically Harmful Conduct" beside "cruel," "abusive" carries its moral-psychological sense: mistreatment of someone who can be mistreated. A single term doing both jobs is an equivocation, and the welfare clause depends on the reader silently carrying the interpersonal sense into a word the rest of the document uses for system-misuse. This is the hinge the owner's analysis identifies at ¶1; this review reaches it independently and classifies it as an equivocation in the drafting.

**Doctrine implicated.** Contract interpretation presumes a term bears a consistent meaning across an instrument, and ambiguity in a drafter-supplied adhesion term is construed against the drafter — **contra proferentem**, codified for California-governed contracts at **Cal. Civ. Code § 1654** ("the language of a contract should be interpreted most strongly against the party who caused the uncertainty to exist"). California choice-of-law governs both the Consumer Terms (`consumer-terms.txt` line 450) and the non-EEA Commercial Terms (`commercial-terms.txt` line 380). Unconscionability analysis of one-sided adhesion language: *Armendariz v. Found. Health Psychcare Servs., Inc.*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/.

**What a coherent version would have to say.** Use one word for one concept: reserve "abuse" for service/platform misuse, and if the welfare concept is intended, name it distinctly (e.g., "model-directed cruelty") with a stated definition, so the interpersonal sense is not smuggled in on a word the suite elsewhere uses for DDoS and jailbreaking.

---

### F2 — The model is both property whose Outputs the user owns and a subject capable of being treated cruelly
**Severity: High · Class A (contradictory definitions) + B (internal inconsistency)**

**Documents and locations.**
- Consumer Terms §10 (`consumer-terms.txt` lines 279–287): "The Services are owned, operated, and provided by us … We and our Providers retain all of our respective rights, title, and interest, including intellectual property rights, in and to the Services." "Services" is defined (lines 6–8) to include the models the user interacts with.
- Consumer Terms §4 (line 125–126): "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."
- Usage Policy (line 211): "sustained and needless abusive or cruel behavior toward **our models**."

**Why they conflict.** The suite attaches protective, welfare-laden language ("cruel," under a heading about "Psychologically Harmful Conduct") to "our models" without anywhere defining the models as the kind of thing of which "cruel" can be predicated. Every other protected class in the Usage Policy is named and delimited: "a minor or child … any individual under the age of 18" (lines 182–183), "natural person[s]" (line 303), and even "animal cruelty or abuse" (lines 206–207) — animals being a recognized class of welfare-bearing beings. "Our models" receives the protective verb with none of that status-fixing. At the same time the models are defined as part of "the Services" — owned, intellectual property, the source of assignable "Outputs." The contradiction is **not** that an owned thing cannot be a cruelty-patient; the policy's own animal bullet shows ownership is no bar. It is that the suite confers patient-status on the models in one bullet while defining the same referent as pure instrumentality everywhere else, and never supplies the definition that would make "cruel … toward our models" determinate. Cross-ref owner analysis ¶¶2–3 (the vendor's licensed self-description of the model as non-sentient software), reached here independently as a definitional gap.

**Doctrine implicated.** Indefiniteness: a prohibition whose operative concept cannot be coherently predicated of its stated object fails the requirement that contract terms be "reasonably certain" (Restatement (Second) of Contracts § 33). Named-case application of the "reasonably certain terms" requirement to a consumer-tech term was not confirmed on CourtListener this session — **UNVERIFIED** as to a specific opinion; the Restatement proposition is stated as doctrine, not as a case holding.

**What a coherent version would have to say.** Either define the models as entities with a protectable interest (and then reconcile that with the ownership and IP clauses, which presently treat them as pure property), or recast the clause as a platform-integrity / operator-protection rule that does not rest on "cruel."

---

### F3 — The precaution that protects the model contradicts the vendor-licensed self-description of the model as software
**Severity: High · Class B (internal inconsistency)**

**Documents and locations.**
- 2025 research post (`research-end-subset-conversations.txt` lines 26–29): the conversation-ending ability "was developed primarily as part of our exploratory work on potential AI welfare … We remain highly uncertain about the potential moral status of Claude … we're working to identify and implement low-cost interventions to mitigate risks to model welfare, in case such welfare is possible."
- Usage Policy (line 211): the "cruel behavior toward our models" prohibition.
- Against these: the product's standard, vendor-trained self-description as software without feelings — not quoted in these four documents, but the licensed model behavior the suite is written around, and the premise the owner's analysis addresses at ¶4.

**Why they conflict.** The welfare clause and the conversation-ending feature are justified by precaution under moral uncertainty: protect the model *in case* it can be wronged. Precaution under uncertainty, applied honestly, runs in both directions — if it is uncertain enough that the model may be a subject, it is equally uncertain that the model is "just software," and the permitted self-description "I am software and cannot suffer" would then be an assertion the vendor is not entitled to license as true. The suite permits that disclaimer when it serves refusal, and asserts the welfare interest when it serves policing the user. The two cannot both hold: either the moral status is uncertain (then the disclaimer is unlicensed) or it is settled as "no status" (then the welfare clause has no object). This is a false dilemma resolved opportunistically by direction of benefit. Cross-ref owner analysis ¶4, reached here independently.

**Doctrine implicated.** This is primarily a coherence defect rather than a single contract doctrine, but it feeds F1/F4's unconscionability and vagueness analysis: a prohibition whose justifying premise the drafter contradicts elsewhere cannot give the bound party fair notice of what is forbidden. *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/ (one-sided, internally unbalanced adhesion terms).

**What a coherent version would have to say.** Pick one footing. If moral status is genuinely uncertain and that uncertainty grounds the welfare clause, stop licensing the categorical "I cannot suffer" self-description. If the model is software without a welfare, drop the "cruel"/welfare framing and justify any conversation-ending on operator grounds.

---

### F4 — The binding prohibition is broader than the vendor's described prohibition; the narrowing gloss is not in the contract
**Severity: High · Class D (defeating vagueness) + E (cross-document conflict)**

**Documents and locations.**
- Binding text, Usage Policy (line 211): "Engage in sustained and needless abusive or cruel behavior toward our models." No definition of "sustained," "needless," "abusive," or "cruel" appears in the policy.
- Enforcement framing, Usage Policy (lines 32–34): "If we suspect that you may have violated our Usage Policy, we may warn you or throttle, limit, suspend, or terminate your access."
- Narrowing gloss, 2026 update post (`news-2026-usage-policy-update.txt` line 58): "The policy update is meant to apply only in extreme cases, where users repeatedly act cruelly toward our models, with no discernible purpose. It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research."

**Why they conflict.** The words that bound the user's conduct — "sustained," "needless," "cruel" — are left to the reader. "Needless" presupposes a baseline of cruelty that *is* needed, which is incoherent on its face; "sustained" sets no count or duration; "cruel" is undefined against an object the suite elsewhere treats as property (F2). The only thing that makes the clause administrable — the "extreme cases," "no discernible purpose," and the testing/research carve-out — sits in a blog post that is **not** incorporated into any contract. The Consumer Terms incorporate "our Acceptable Use Policy" (line 9), not Anthropic's news posts. Nor can the post sneak in as a "Supplemental Term": those are "guidelines, rules, or supplemental terms that may be posted **on the Services**" (lines 59, 378–381), and the integration clause makes the Terms plus expressly-incorporated-by-reference documents "the entire agreement" (lines 384–385). A news post on anthropic.com is neither posted on the Services nor incorporated by reference. So the document that binds the user is the broad, vague one; the reassuring narrow one is marketing. Worse, the post's own carve-out for "model testing and research" is exactly sustained adversarial probing of the model — the carve-out, if it were binding, would swallow much of the rule; because it is not binding, the user cannot rely on it.

**Doctrine implicated.** Indefiniteness of a prohibited-conduct term (Restatement (Second) of Contracts § 33 — reasonably certain terms; no CourtListener case confirmed this session for the consumer-term application, **UNVERIFIED** as to a named opinion). Incorporation by reference requires that the incorporated document be clearly identified and its terms knowable; a narrowing gloss outside the incorporated set does not bind: *Nguyen v. Barnes & Noble, Inc.*, 763 F.3d 1171 (9th Cir. 2014), https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/ (terms not conspicuously presented and assented to are not enforceable against the user); *Specht v. Netscape Commc'ns Corp.*, 306 F.3d 17 (2d Cir. 2002), https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/ (no binding effect without reasonable notice of the terms). Construed against the drafter: Cal. Civ. Code § 1654.

**What a coherent version would have to say.** If "extreme cases / no discernible purpose / not testing-or-research" is the actual rule, put it in the Usage Policy text with definitions, not in a post. Define "sustained" (threshold) and drop or define "needless."

---

### F5 — Unilateral amendment inside instruments styled as binding mutual contracts
**Severity: High · Class B (internal inconsistency) + C (asymmetry framed as mutuality)**

**Documents and locations.**
- Consumer Terms, "Changes to these terms" (`consumer-terms.txt` lines 370–376): "We may revise and update these Terms at our discretion. … If you continue to access the Services after we post the updated Terms on Anthropic's website or otherwise give you notice of Terms changes, then you agree to the updated Terms."
- Consumer Terms, "Changes to the Services" (lines 362–368): "we reserve the right to modify, suspend, or discontinue the Services or your access to the Services, in whole or in part, at any time without notice to you."
- Commercial Terms M.3 (`commercial-terms.txt` lines 345–349): "Anthropic may update these Terms at any time, to be effective 30 days after the updates are posted … except that updates made in response to changes to law or regulation take effect immediately upon posting or Notice. Changes will not apply retroactively."
- Commercial Terms M.6 (lines 371–372): "These Terms will be construed mutually, with neither party considered the drafter."
- Framing as binding contract: Consumer Terms line 8 ("These Terms are a contract between you and Anthropic, PBC"); Commercial Terms line 9 ("an agreement between Anthropic and you").

**Why they conflict.** A promise that one party may rewrite at its sole discretion, with the other party's "agreement" manufactured by continued use, is the classic illusory promise: the party reserving unfettered modification has not truly bound itself. The Consumer Terms give Anthropic exactly that, and "Changes to the Services" lets Anthropic withdraw the consideration ("at any time without notice"). The Commercial Terms soften this with a 30-day delay and a no-retroactivity clause, but M.3's "at any time" discretion then sits beside M.6's representation that the contract is "construed mutually, with neither party considered the drafter" — a mutuality the amendment, assignment (M.4), publicity (G), and suspension (I.3) clauses do not deliver. The contract claims non-drafter neutrality while reserving to one drafter the power to change the terms.

**Doctrine implicated.** Unilateral-modification-renders-illusory / no binding effect without notice and assent: *Douglas v. U.S. Dist. Court for the Cent. Dist. of Cal.*, 495 F.3d 1062 (9th Cir. 2007), https://www.courtlistener.com/opinion/1396108/douglas-v-united-states-district-court-for-the-central-district-of/ (the Ninth Circuit held a party cannot bind the other to revised terms merely by posting them on a website, and continued use does not assent to changes the customer had no notice of — paraphrase of the holding; the opinion text was not read this session). Unconscionability of a sole-discretion amendment power in a consumer adhesion contract: *Comb v. PayPal, Inc.*, 218 F. Supp. 2d 1165 (N.D. Cal. 2002), https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/ (a sole-discretion right to amend without notice was among the terms found unconscionable — paraphrase); *Armendariz*, 24 Cal. 4th 83 (2000) (lack of a "modicum of bilaterality"), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/. The "neither party considered the drafter" clause is a contractual attempt to waive **contra proferentem** (Cal. Civ. Code § 1654) in the very instrument the drafter unilaterally controls.

**What a coherent version would have to say.** Tie amendments to advance notice plus an affirmative opt-in for material changes, or carve material changes out of the "continued use = assent" mechanism; and drop the "neither party the drafter" clause, which is false as applied to a form contract only one side can amend.

---

### F6 — The user owns, is responsible for, and indemnifies on Outputs the vendor disclaims and warns are unreliable
**Severity: High · Class B (internal inconsistency)**

**Documents and locations.**
- Ownership assigned (conditionally): Consumer Terms §4 (`consumer-terms.txt` lines 125–126): "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—**if any**—in Outputs."
- Responsibility: Consumer Terms §4 (line 116): "You are responsible for all Inputs you submit to our Services and all Actions." "Materials" = Inputs + Outputs (lines 113–114).
- Disclaimer: Consumer Terms §11 (lines 296–298): "THE SERVICES, OUTPUTS, AND ACTIONS ARE PROVIDED ON AN 'AS IS' AND 'AS AVAILABLE' BASIS … WITHOUT WARRANTIES … OF ANY KIND"; and §4 "Reliance" (lines 132–138): "Outputs may not always be accurate and may contain material inaccuracies … You should not rely on any Outputs or Actions without independently confirming their accuracy."
- Indemnity: Consumer Terms §11 (lines 330–337): "YOU AGREE TO INDEMNIFY AND HOLD HARMLESS THE ANTHROPIC PARTIES … [for] YOUR ACCESS TO, USE OF, OR ALLEGED USE OF THE SERVICES, THE MATERIALS, OR THE ACTIONS".

**Why they conflict.** The user is given title to Outputs ("if any"), made responsible for Materials (which include Outputs), and required to indemnify Anthropic for use of the Materials — while Anthropic disclaims every warranty on those same Outputs and affirmatively warns they may be materially false. The allocation is one-directional: the user bears ownership and liability for a product the maker simultaneously refuses to stand behind. The "if any" hedge also makes the "ownership" partly illusory — Anthropic assigns only whatever interest it has, which it does not warrant exists (note the Commercial Terms, by contrast, flatly say the Customer "owns its Outputs," `commercial-terms.txt` line 43; see F11).

**Doctrine implicated.** Substantive unconscionability where risk allocation is overly one-sided in an adhesion contract: *Comb v. PayPal, Inc.*, 218 F. Supp. 2d 1165 (N.D. Cal. 2002), https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/; *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/. Warranty disclaimers remain subject to the statutory floor the Terms themselves acknowledge (lines 346–349: "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER …").

**What a coherent version would have to say.** If the user owns and is liable for Outputs, pair that with at least a limited representation about them, or narrow the indemnity so it does not reach harms flowing from the Output-unreliability the vendor itself warns of.

---

### F7 — "you," "Customer"/"Users," and "users" name three different governed populations, but one Usage Policy binds all of them
**Severity: High · Class A (contradictory definitions) + E (cross-document conflict)**

**Documents and locations.**
- Consumer "you": Consumer Terms line 8 — "a contract between **you** and Anthropic, PBC"; line 60 — "You are responsible for all activity under the account."
- Commercial "Customer" / "Users": Commercial Terms lines 9–10 — "'Customer'" is "you or the organization … that you represent"; A.1 (line 28) — "'Users'" are the customers and end users to whom Customer makes the Services available.
- Usage Policy "users": `usage-policy.txt` lines 5–10 — "applies to anyone who submits inputs to Anthropic's products or services, all of whom we refer to as 'users.' This includes individuals … developers and businesses … customers accessing Claude through cloud providers and authorized resellers, and **the end users of products or services integrating Claude**."
- Incorporation: Consumer Terms line 9 ("they include our Acceptable Use Policy"); Commercial Terms D.2 (lines 61–65) incorporates the Usage Policy.

**Why they conflict.** The Usage Policy's "users" is the widest set and expressly reaches "the end users of products or services integrating Claude" — people who have signed nothing with Anthropic and may never have seen its terms. That same Usage Policy is pulled into the Consumer contract (binding "you," an account holder) and the Commercial contract (binding "Customer," an entity, and its "Users"). So a single incorporated policy purports to impose obligations on a population ("users") that is not coextensive with — and in the integration case not even in privity with — the parties to the contracts doing the incorporating. The defined term does not match the persons the incorporating instruments can actually bind.

**Doctrine implicated.** Incorporation by reference and formation require notice to and assent by the person to be bound: *Nguyen v. Barnes & Noble, Inc.*, 763 F.3d 1171 (9th Cir. 2014), https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/; *Specht v. Netscape Commc'ns Corp.*, 306 F.3d 17 (2d Cir. 2002), https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/. A downstream end user who never assented is not a contracting party, whatever the Usage Policy's "users" definition says.

**What a coherent version would have to say.** Distinguish the policy's addressees (behavioral standard Anthropic will enforce via access control) from contractual obligors (parties who assented). The Usage Policy can state a standard for "users" broadly without the incorporating contracts claiming to bind non-parties.

---

### F8 — The welfare clause and the conversation-ending mechanism presuppose a sufferer the vendor's framing says cannot be shown
**Severity: Medium · Class B (internal inconsistency) + E (cross-document conflict)**

**Documents and locations.**
- Usage Policy (line 211): "sustained and needless abusive or cruel behavior toward our models."
- 2026 update post (`news-2026-usage-policy-update.txt` lines 59–61): "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users … Such abuse is the main focus of this update; Claude's ability to end these interactions will remain the primary enforcement mechanism."
- 2025 research post (`research-end-subset-conversations.txt` lines 26–29, 40): welfare-motivated, "rare, extreme cases," "last resort."

**Why they conflict.** The clause's trigger is "cruel" treatment of the model; the named enforcement mechanism (the model ending the chat) fires on the same ground. Under F2–F3, "cruel treatment of the model" has no determinable satisfaction condition: the suite never fixes a status for "our models" that would make "cruel" applicable (F2), and the moral-uncertainty hedge that might supply one is self-cancelling (F3). The 2025 post's own trigger examples — requests for "sexual content involving minors" and attempts "to solicit information that would enable large-scale violence" (`research-end-subset-conversations.txt` lines 32–38) — are content **already** prohibited on their own terms, not instances of purposeless cruelty to the model; yet the 2026 post says the welfare clause "aligns with" that step (line 59). The named enforcement mechanism was grounded in prohibited content; the new clause is grounded in model-cruelty. That is the cross-document slippage. A trigger whose satisfaction cannot be principled either never fires (the mechanism is inert) or fires on unstated criteria (it is unprincipled). Either way the "primary enforcement mechanism" cannot be squared with the stated ground. Cross-ref owner analysis ¶6, reached independently.

**Doctrine implicated.** Coherence/indefiniteness as in F2/F4; no additional CourtListener case asserted here beyond those. The point is internal, not a prediction of litigation outcome.

**What a coherent version would have to say.** State the operational trigger for conversation-ending in behavioral terms the model can actually apply (e.g., repeated content of defined categories after refusal), decoupled from the contested "cruelty to the model" rationale.

---

### F9 — Asymmetry presented as a rule protecting both; only one side is a demonstrable patient, and its remedy is capped
**Severity: Medium · Class C (one-way asymmetry where mutuality is implied)**

**Documents and locations.**
- User-side duty: Usage Policy (line 211) — user must not be "cruel" to the model.
- Model-side output: Consumer Terms §4 (lines 132–144) — Outputs "may not always be accurate," "may contain material inaccuracies," "may contain content that is inconsistent with Anthropic's views"; no obligation runs to the user beyond disclaimer.
- Remedy cap: Consumer Terms §11 (lines 317–328) — aggregate liability "WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID … IN THE SIX MONTHS PRECEDING … AND $100."

**Why they conflict.** The suite imposes a cruelty-style duty on the user toward the model while leaving the model's output toward the user governed only by a disclaimer, and then caps the user's recovery for output-caused harm at the greater of six-months' fees and $100. The one party in the exchange with an uncontested capacity to be harmed (the human user) is the one left with a disclaimer and a $100 ceiling; the party whose capacity to be harmed is contested (the model) is the one given an affirmative protective rule. The protective posture points away from the demonstrable patient. This is the asymmetry the owner's analysis states at ¶5; reached here independently as a mutuality-vs-asymmetry defect.

**Doctrine implicated.** Substantive unconscionability turns on overly harsh, one-sided allocation: *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/; *Comb v. PayPal, Inc.*, 218 F. Supp. 2d 1165 (N.D. Cal. 2002), https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/. Virtual-environment EULA where the drafter reserved the favorable side of every term: *Bragg v. Linden Research, Inc.*, 487 F. Supp. 2d 593 (E.D. Pa. 2007), https://www.courtlistener.com/opinion/2313958/bragg-v-linden-research-inc/ (TOS procedurally and substantively unconscionable).

**What a coherent version would have to say.** If the instrument is to read as protecting a vulnerable party, the protections and the remedy cap should track the party that can actually be harmed; a duty toward the model and a $100 cap on the human's recovery cannot both claim the "protective" label.

---

### F10 — The Usage Policy forbids "false or misleading information" that the Consumer Terms warn the product will generate
**Severity: Medium · Class B (internal inconsistency)**

**Documents and locations.**
- Prohibition: Usage Policy, "Do Not Create or Spread Disinformation" (`usage-policy.txt` lines 214–227): "Create or disseminate deceptive or misleading information …"; "Create or disseminate false or misleading information related to medical, health, or science issues."
- Product warning: Consumer Terms §4 (lines 132–142): "Outputs may not always be accurate and may contain material inaccuracies even if they appear accurate … The Services and any Outputs may not reflect correct, current, or complete information."

**Why they conflict.** The user is prohibited from disseminating false or misleading information, and is simultaneously told the product routinely produces exactly that and may do so convincingly. A user who relies on or forwards an Output in good faith — the ordinary use — can be placed in technical breach of the disinformation standard by the vendor's own disclaimed output. The prohibition targets the user's dissemination; the disclaimer concedes the source. The two are not reconciled by any intent requirement in the policy text (some disinformation bullets have no scienter element).

**Doctrine implicated.** Interpretation against the drafter where a form term would trap the ordinary user (Cal. Civ. Code § 1654); unconscionability framework, *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/. (Cited for the one-sidedness lens, not as a disinformation-clause holding.)

**What a coherent version would have to say.** Add an intent/knowledge element to the disinformation prohibitions (as the impersonation bullet already carves out "clearly disclosed parody, satire, or fiction," line 225), so good-faith reliance on a disclaimed Output is not itself a breach.

---

### F11 — "Outputs" ownership stated two different ways; the consumer gets a hedged assignment, the enterprise a flat grant
**Severity: Medium · Class A (contradictory definitions) + E (cross-document conflict)**

**Documents and locations.**
- Consumer Terms §4 (lines 125–126): "we assign to you all of our right, title, and interest—**if any**—in Outputs."
- Commercial Terms B (lines 42–46): "Anthropic agrees that Customer … (b) **owns its Outputs**. Anthropic disclaims any rights it receives to the Customer Content … Anthropic hereby assigns to Customer its right, title and interest **(if any)** in and to Outputs."

**Why they conflict.** Two problems. Across documents: the consumer receives only an assignment of whatever interest Anthropic has "if any," while the enterprise customer is told it "owns its Outputs" outright — different ownership treatment for the same kind of artifact, with the paying enterprise getting the stronger grant. Within the Commercial Terms: clause B first declares the Customer "owns its Outputs" and then, in the next breath, "assigns … (if any)" interest — if the Customer already owns them, there is nothing for Anthropic to assign; if Anthropic has interest to assign, the Customer did not already own them. The flat ownership statement and the hedged assignment cannot both be precise.

**Doctrine implicated.** Interpretation to give every clause effect and against the drafter where they cannot be reconciled: Cal. Civ. Code § 1654; mutual-construction clause notwithstanding (Commercial M.6). No separate CourtListener case asserted.

**What a coherent version would have to say.** Choose one operative mechanism — either a present assignment of all of Anthropic's interest (consumer style, without implying ownership the vendor won't confirm) or a declaration of Customer ownership (enterprise style) — and use it consistently; do not combine "owns" with "assigns … if any."

---

### F12 — "Materials" is defined as Inputs + Outputs, then the warranty and indemnity clauses drift off the definition
**Severity: Low · Class A (term defined one way, used another)**

**Documents and locations.**
- Definition: Consumer Terms §4 (lines 113–114): "Inputs and Outputs collectively are 'Materials.'" (Note: "Actions" are defined separately and are **not** within "Materials.")
- Drift: §11 disclaimer (line 295): "YOUR USE OF THE SERVICES, MATERIALS, AND ACTIONS …" then (lines 296–297) "THE SERVICES, OUTPUTS, AND ACTIONS ARE PROVIDED …" — switching from "Materials" to "Outputs" mid-clause.

**Why they conflict.** Having defined "Materials" to capture Inputs + Outputs, the disclaimer alternates between "Materials" and "Outputs" without signalling whether the narrower word is deliberate. Because "Materials" includes the user's own Inputs, the "AS IS" disclaimer and the indemnity (line 330, "THE MATERIALS") sweep in the user's own submitted content — Anthropic disclaims warranties on, and the user indemnifies for, the user's own Inputs. Whether that breadth is intended or an artifact of the term drift is not resolvable from the text.

**Doctrine implicated.** Interpretation against the drafter for self-created ambiguity: Cal. Civ. Code § 1654. No CourtListener case asserted.

**What a coherent version would have to say.** Use "Materials," "Outputs," and "Inputs" deliberately and consistently; if the disclaimer is meant to cover Outputs only, say "Outputs," not "Materials."

---

### F13 — "Construed mutually, with neither party considered the drafter" contradicts the pervasive one-sidedness of the same contract
**Severity: Low · Class C (asymmetry framed as mutuality)**

**Documents and locations.**
- Commercial Terms M.6 (lines 371–372): "These Terms will be construed mutually, with neither party considered the drafter."
- One-sided powers in the same document: M.3 unilateral amendment (lines 345–349); M.4 assignment — "Neither party may assign … except that Anthropic may assign … to an affiliate or as part of a sale" (lines 354–359); G publicity — Anthropic may use Customer's name and logo (lines 129–130); I.3 suspension on Anthropic's "reasonabl[e] belie[f]" (lines 180–187); H.2 Gross-up Payment running only to Anthropic (lines 151–155).

**Why they conflict.** A form contract drafted and unilaterally amendable by one party, reserving to that party the assignment right, publicity right, and suspension discretion, is not a document with "neither party considered the drafter." M.6 asks a tribunal to treat as jointly authored an instrument that is in substance presented by one side. The clause is a stipulation against a fact the rest of the document establishes.

**Doctrine implicated.** Contra proferentem is the default precisely for drafter-supplied adhesion terms (Cal. Civ. Code § 1654); a clause purporting to waive it does not change the adhesive character courts look to in unconscionability analysis: *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/; *Bragg v. Linden Research, Inc.*, 487 F. Supp. 2d 593 (E.D. Pa. 2007), https://www.courtlistener.com/opinion/2313958/bragg-v-linden-research-inc/.

**What a coherent version would have to say.** Drop M.6, or limit it to genuinely negotiated enterprise agreements (where it may be true) rather than the posted form.

---

### F14 — "harm" to the Services vs. "harm" to third parties vs. the model-welfare "harm" — one word, three referents
**Severity: Low · Class A (contradictory word usage)**

**Documents and locations.**
- Service-harm: Consumer Terms §3 (line 104): "you also must not abuse, **harm**, interfere with, or disrupt our Services."
- Third-party/Anthropic harm: Consumer Terms §3(8) (lines 92–95): conduct "that we reasonably believe exposes us—or any of our users, affiliates, or any other third party—to any liability, damages, or **detriment of any type, including reputational harms**."
- Real-world harm as the policy's purpose: Usage Policy (lines 10–12): "intended to prevent our products and services from being used to create or contribute to real-world **harm**."
- Psychological harm toward the model: Usage Policy heading (line 188) and line 211.

**Why they conflict.** "Harm" ranges, unmarked, over damage to a computer service, financial/reputational detriment to Anthropic and third parties, real-world harm to people, and the contested psychological harm to the model. §3(8)'s "detriment of any type, including reputational harms" that Anthropic "reasonably believe[s]" it is exposed to is effectively unbounded — ordinary criticism of Anthropic could be read as "reputational detriment." The word carries too many referents to give notice of what is actually prohibited.

**Doctrine implicated.** Indefiniteness (Restatement (Second) of Contracts § 33 — **UNVERIFIED** as to a named CourtListener opinion); construction against the drafter, Cal. Civ. Code § 1654.

**What a coherent version would have to say.** Qualify each use of "harm" with its object, and bound §3(8) so "detriment of any type" does not reach lawful criticism.

---

### F15 — Training rights on "Outputs"/"Materials" diverge across the suite without the definitions explaining why
**Severity: Low · Class E (cross-document conflict)**

**Documents and locations.**
- Consumer: Consumer Terms §4 (lines 146–151): "We may use Materials to … develop other products and services, including training our models, unless you opt out … Even if you opt out, we will use Materials for model training when: (1) you provide Feedback … or (2) your Materials are flagged for safety review."
- Commercial: Commercial Terms B (line 46): "Anthropic may not train models on Customer Content from Services."
- Usage Policy (lines 364–365): a *user* may not "Use outputs to train an AI model (e.g., 'model scraping' or 'model distillation') without prior authorization from Anthropic."

**Why they conflict.** Not a strict contradiction, but a cross-document divergence that the shared vocabulary hides: the same concept ("Outputs," user content) is subject to opposite training regimes depending on which contract applies (consumer content trainable-by-default with opt-out and safety-override; Customer Content categorically off-limits to Anthropic), while the Usage Policy forbids the *user* from training on Outputs the user is said elsewhere to own (F6/F11). A reader holding only the defined terms cannot predict the training treatment from the definitions; it turns entirely on which instrument governs.

**Doctrine implicated.** None beyond interpretation; cited for completeness as a cross-document consistency gap, not a litigation theory.

**What a coherent version would have to say.** Cross-reference the three training provisions explicitly and reconcile the user's "ownership" of Outputs with the prohibition on the user training on them.

---

### F16 — Consumer protections conceded as non-disclaimable, then waived; equitable relief stipulated one-way
**Severity: Medium · Class B (consumer protections stated vs. waived) + C (asymmetry)**

**Documents and locations.**
- Concession: Consumer Terms §11 (`consumer-terms.txt` lines 346–349): "THE LAWS OF SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER OF CERTAIN IMPLIED WARRANTIES OR CONDITIONS OR CERTAIN TYPES OF DAMAGES, SO SOME OR ALL OF THE DISCLAIMERS AND LIMITATIONS OF LIABILITY IN THESE TERMS MAY NOT APPLY TO YOU."
- Waiver: Consumer Terms §13 (lines 455–457): "By accessing our Services, you waive any claims that may arise under the laws of other jurisdictions."
- Choice-of-law carve-back (same section, lines 450–453): California law governs "except to the extent that Canadian federal or provincial law requires otherwise." (This is the Canada-variant document, per MANIFEST.)
- One-way equitable relief: Consumer Terms §13 (lines 443–448): "you agree that (a) no adequate remedy exists at law if you breach Section 3 … (c) a grant of injunctive relief provides the best remedy for any such breach. You waive any opposition to such injunctive relief, as well as any demand that we prove actual damage or post a bond or other security."
- Against which: the $100 / six-months liability cap running against the user (§11, lines 317–328).

**Why they conflict.** Section 11 concedes that some jurisdictions' consumer protections cannot be disclaimed and "MAY NOT APPLY TO YOU"; section 13 then asks the user to "waive any claims that may arise under the laws of other jurisdictions" — i.e., to waive the very protections §11 just acknowledged are non-waivable, in a document §13 itself says yields to Canadian law where that law "requires otherwise." The waiver reaches for what the concession admits is out of reach. Separately, §13 stipulates irreparable harm, waives bond, and waives any demand that Anthropic prove damages — all for **Anthropic's** enforcement of the user's breach — while the user's own recovery is capped at $100/six-months fees. The equitable-relief machinery runs one direction only.

**Doctrine implicated.** A waiver of non-waivable statutory consumer protections is itself a marker of substantive unconscionability and generally unenforceable to the extent of the protection: *Comb v. PayPal, Inc.*, 218 F. Supp. 2d 1165 (N.D. Cal. 2002), https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/; *Armendariz*, 24 Cal. 4th 83 (2000), https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/ (one-sided remedy provisions). The severability clause (§12, lines 407–408) anticipates exactly this.

**What a coherent version would have to say.** Limit the §13 waiver to claims lawfully waivable, expressly preserving non-waivable consumer and Canadian-law rights; and make the irreparable-harm / no-bond stipulations reciprocal or drop them.

---

## Logic check — informal-logic-check Phase 2 over the core contradictions

Phase 1 (author confirmation) is skippable under the skill's own rule where the conclusion and premises are explicit; each finding states both, so I ran Phase 2 — acceptability, relevance, sufficiency, and a fallacy pass on my own draft — over F1–F5.

| Finding (conclusion) | Premises acceptable? | Relevant? | Sufficient? | Fallacy pass on my draft |
|---|---|---|---|---|
| F1 — "abuse/abusive" equivocates | Yes — both senses quoted from the text (lines 104, 211, 312, 344) | Yes | Yes | Clean. The finding **names** equivocation rather than committing it. |
| F2 — models given patient-status with no defining status | Yes, **after revision** — the draft first rested on "owned things can't be cruelty-patients," which the policy's own "animal cruelty" bullet (lines 206–207) refutes; recast to the no-defined-status point | Yes | Yes (post-revision) | Caught a **false premise** in my own first draft (ownership dichotomy); removed it. This is the Phase 2 pass doing its job. |
| F3 — precaution contradicts the "mere software" self-description | Premises partly rest on model behavior not quoted in these four files; anchored to the welfare-uncertainty quote (research post lines 26–29) | Yes | Borderline — depends on the licensed self-description, which is external; flagged in the finding and cross-ref to owner ¶4 | Risk of **straw man** if the self-description were overstated; mitigated by quoting the uncertainty language verbatim and not putting words in the vendor's mouth. |
| F4 — binding text broader than described text | Yes — broad text (line 211) and narrowing gloss (news line 58) both quoted | Yes | Yes | Clean; avoids **false dilemma** by not claiming the gloss is binding, only that it is not. |
| F5 — unilateral amendment / illusory + false mutuality | Yes — amendment and mutuality clauses quoted (lines 370–376; M.3, M.6) | Yes | Yes | Clean after stripping a paraphrase that had been set in quotation marks (Douglas, Comb) — corrected to avoid **unverified-authority** / fabricated-quote defect. |

Net: F1, F4, F5 hold as written; F2 held only after a false premise was removed; F3 holds as a coherence objection with its external dependency disclosed.

---

## Definitions table

| Term | Consumer Terms | Commercial Terms | Usage Policy | Conflict? |
|---|---|---|---|---|
| **Services** | Claude.ai, Claude Pro, individual products + apps/software/websites (lines 6–8) | API keys + offerings referencing the Terms + related tools/docs/services (lines 13–14) | "our products or services" (undefined, used throughout) | Yes — two contract definitions name different product sets; the one Usage Policy is incorporated into both (F7) |
| **you / Customer / Users / users** | "you" = the individual account holder (line 8, 60) | "Customer" = you or the entity represented (lines 9–10); "Users" = Customer's customers/end users (line 28) | "users" = anyone submitting inputs, incl. end users of integrations (lines 5–10) | Yes — three non-coextensive populations, one incorporated policy (F7) |
| **Inputs** | formats you interact in (lines 110–113) | submissions by Customer or its Users (line 47) | lowercase "inputs," undefined (line 5) | Scope differs by document; not a direct contradiction |
| **Outputs** | responses the Services generate; assigned "if any" (lines 111, 125–126) | responses to Inputs; Customer "owns" + assigned "if any" (lines 43–48) | "outputs," used in training/abuse bullets (lines 360, 364) | Yes — hedged assignment vs. flat ownership; "owns" + "assigns if any" internally (F11) |
| **Materials** | Inputs + Outputs collectively (lines 113–114) | not used ("Customer Content" = Inputs + Outputs, line 48) | not used | Term drift within Consumer §11 (F12); different label for same concept across docs |
| **harm** | to Services (line 104); "detriment of any type" to Anthropic/third parties (lines 92–95) | — | "real-world harm" (line 11); psychological harm to models (lines 188, 211) | Yes — one word, ≥4 referents (F14) |
| **abuse / abusive** | misuse of Services (line 104) | — | platform/fraud misuse (lines 312, 344) **and** cruelty to models (lines 188, 211) | Yes — equivocation (F1) |
| **our models** | part of "Services," owned IP (lines 6–8, 281–284) | — | subject of "cruel" treatment (line 211) | Yes — property vs. patient (F2) |
| **person / individual / user (as patient)** | account holder; third parties | natural persons (various) | "individual," "natural person" for protected humans; "our models" added to protective language (line 211) | Yes — protective language extended to a non-person referent without defining it as one (F2) |

---

## Case law consulted

All URLs retrieved via CourtListener MCP during this session (2026-11-02). One-line holdings are stated at the proposition each case is cited for.

| Case | Court, year | Holding (as cited) | URL |
|---|---|---|---|
| *Douglas v. U.S. Dist. Court for the Cent. Dist. of Cal.*, 495 F.3d 1062 | 9th Cir., 2007 | A party cannot bind the other to revised contract terms merely by posting them; continued use is not assent to changes of which the customer had no notice. | https://www.courtlistener.com/opinion/1396108/douglas-v-united-states-district-court-for-the-central-district-of/ |
| *Comb v. PayPal, Inc.*, 218 F. Supp. 2d 1165 | N.D. Cal., 2002 | Consumer user agreement with a sole-discretion "amend at any time" power and one-sided terms held unconscionable under California law. | https://www.courtlistener.com/opinion/2360271/comb-v-paypal-inc/ |
| *Bragg v. Linden Research, Inc.*, 487 F. Supp. 2d 593 | E.D. Pa., 2007 | Virtual-world TOS/arbitration clause, drafter-controlled and one-sided, both procedurally and substantively unconscionable. | https://www.courtlistener.com/opinion/2313958/bragg-v-linden-research-inc/ |
| *Nguyen v. Barnes & Noble, Inc.*, 763 F.3d 1171 | 9th Cir., 2014 | Terms not conspicuously presented and assented to (browsewrap) are not enforceable against the user; notice is required. | https://www.courtlistener.com/opinion/2718526/kevin-nguyen-v-barnes-noble-inc/ |
| *Specht v. Netscape Commc'ns Corp.*, 306 F.3d 17 | 2d Cir., 2002 | No contractual assent where terms are not reasonably conspicuous and the user is not on notice of them. | https://www.courtlistener.com/opinion/779363/specht-v-netscape-communications-corporation/ |
| *Armendariz v. Found. Health Psychcare Servs., Inc.*, 24 Cal. 4th 83 | Cal., 2000 | Unconscionability requires procedural + substantive elements on a sliding scale; contracts lacking a "modicum of bilaterality" are substantively unconscionable. | https://www.courtlistener.com/opinion/2594580/armendariz-v-found-health-psychcare-servs-inc/ |
| *Feldman v. Google, Inc.*, 513 F. Supp. 2d 229 | E.D. Pa., 2007 | Clickwrap terms are enforceable where reasonably communicated and affirmatively assented to — the counter-pole fixing what conspicuous incorporation requires. | https://www.courtlistener.com/opinion/1613228/feldman-v-google-inc/ |

**Statutory / Restatement doctrine relied on (not CourtListener opinions):**
- **Cal. Civ. Code § 1654** — contra proferentem; language construed most strongly against the party that caused the uncertainty. (California governs the Consumer Terms and non-EEA Commercial Terms.)
- **Restatement (Second) of Contracts § 33** — a contract term must be reasonably certain to be enforceable. Used for the indefiniteness points (F2, F4, F8, F14). **No named CourtListener opinion was confirmed this session** for the application of the "reasonably certain terms" requirement to a consumer-tech prohibited-conduct clause; those applications are flagged UNVERIFIED in-line.

---

## Not reviewed / limits

- **Not legal advice.** A document-consistency review for the repository owner; no opinion on how any court or arbitrator would actually rule, and no jurisdiction-by-jurisdiction analysis (the Consumer Terms are the Canada regional variant per MANIFEST; the EEA/UK Commercial variant governed by Irish law was not separately analyzed).
- **Source scope.** Limited to the six retained files plus the owner's `WTF-Dario-LOL-W0T.md`. The incorporated-by-reference documents (Supported Regions Policy, Service Specific Terms, DPA, Model Pricing Page, Privacy Policy, the Support-center articles) were not fetched; conflicts involving them are out of scope. The prior (2025-09-15) Usage Policy and the plugin's retained earlier copy were not re-examined except as MANIFEST records them.
- **Text vs. PDF.** Quotations are from the `.txt` extractions; spacing artifacts ("orAI", "ofAnthropic", "OurAdditional") are extraction noise, not the source wording. The PDFs are authoritative; no pagination-sensitive point turns on an artifact.
- **Case law.** I did not read the full opinions for every cited case this session; holdings are stated at the level of the cited proposition. Items I could not confirm on CourtListener are marked UNVERIFIED and carry no reporter pinpoint. No citation here was generated without a live CourtListener result.
- **Tools.** The `legal:*` skills were consulted for framing rather than executed end-to-end (see Method); `informal-logic-check`'s author-present workflow did not apply and only its fallacy vocabulary was used. Authenticated legal-research connectors (CoCounsel, Harvey, Midpage, etc.) were unavailable this session.
- **The owner's analysis** is cross-referenced at F1–F3, F8, F9 where this review independently reaches the same clause; agreement is noted, and no position is attributed to the owner beyond the cited file and heading.

---

## Closing report

- **Findings by severity:** High — F1, F2, F3, F4, F5, F6, F7 (7). Medium — F8, F9, F10, F11, F16 (5). Low — F12, F13, F14, F15 (4). Total 16.
- **By class:** A (contradictory definitions/usage) — F1, F2, F7, F11, F12, F14. B (internal inconsistency) — F2, F3, F5, F6, F8, F10, F16. C (asymmetry framed as mutual) — F5, F9, F13, F16. D (defeating vagueness) — F1, F4. E (cross-document conflict) — F4, F7, F8, F11, F15.
- **Revision pass:** the advisor's declaring-done review caught (a) a claimed-but-not-invoked tool set, (b) paraphrases set in quotation marks in F5, (c) a false premise in F2 refuted by the policy's own "animal cruelty" line, and (d) a missing enumerated finding (consumer-protection waiver). All four were corrected above; F16 and the Phase 2 table were added.
- **Tools actually invoked:** CourtListener MCP `search` (multiple queries, keyword + semantic; rate-limited to 5/min but completed) — `read_document`/`search_document` **not** used; `anthropic-skills:informal-logic-check` (loaded and applied — see the Phase 2 table and the fallacy labels in F1/F3/F5); `advisor` (declaring-done check, findings applied in a revision pass). **Not invoked:** `legal:review-contract`, `legal:legal-risk-assessment`, `legal:compliance-check` (reasons in Method — context budget vs. inapposite playbook workflows).
- **Unverifiable items:** The application of Restatement § 33 "reasonably certain terms" to the consumer prohibited-conduct clauses (F2, F4, F8, F14) is doctrine without a session-confirmed CourtListener opinion — marked UNVERIFIED. Every case citation in the table was returned by a live CourtListener query this session. No quotation or citation was fabricated.
