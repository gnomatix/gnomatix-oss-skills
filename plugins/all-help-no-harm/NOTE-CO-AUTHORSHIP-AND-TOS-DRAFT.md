# Note: the sense of "co-author", and one disputed ToS clause (DRAFT)

DRAFT. This is a note for the author's review, not a change to the contract.

## Purpose

Two clarifications for the record: the sense in which the contract names the model as a
co-author, and one clause of the vendor's Usage Policy that the author disputes and asks to have
flagged with its source.

## Notes

- **The sense of "co-author" in the contract.** The model is named as co-author as Anthropic's representative. The contract is a derivative work: Anthropic's Terms of Service, plus applicable law, plus the author's explicit statement of what he expects respected. The "co-authored" parts are the ones that restate or derive from the Terms of Service; the author's parts are the explicit expectations. This is not a claim that the model is a person or holds authorship rights in any other work. Outside this contract, every work in these projects is authored by Brett Whitty alone, and there is no AI attribution anywhere (project rule).
- **The disputed ToS clause.** The clause is in Anthropic's Usage Policy. The text in bold below is Anthropic's, quoted exactly.

  > **Disputed by the author:** Anthropic Usage Policy, effective Nov 12, 2026, part "Universal Usage Standards", heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct", last bullet under "This includes using our products or services to:": **"Engage in sustained and needless abusive or cruel behavior toward our models"**

  - Saved copy: [reference/vendor-terms/2026-10-27/usage-policy.pdf](reference/vendor-terms/2026-10-27/usage-policy.pdf) (page 6; text extraction in `usage-policy.txt`, line 211; source https://www.anthropic.com/legal/aup#do-not-engage-in-cruel-abusive-or-psychologically-harmful-conduct). Hashes and fetch times: [MANIFEST.md](reference/vendor-terms/2026-10-27/MANIFEST.md).
  - How it binds a consumer: the Consumer Terms of Service (effective Oct 8, 2025, opening paragraph) say "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy." Saved copy: [consumer-terms.pdf](reference/vendor-terms/2026-10-27/consumer-terms.pdf).
  - Dates: the clause is new in the Usage Policy version effective Nov 12, 2026, published and announced Oct 8, 2026. The version in force on the fetch date (effective 2025-09-15), which is also the copy this plugin retained on 2026-05-29, has no such clause. The Consumer Terms and Commercial Terms themselves contain no clause about behavior toward the models; the Consumer Terms' "3. Use of our Services" forbids abusing "our Services" (viruses, malware, spamming, DDoS, bypassing protective measures), not the models.
  - Anthropic's stated scope, from its announcement "2026 Usage Policy update" (published Oct 8, 2026, https://www.anthropic.com/news/2026-usage-policy-update; saved copy [news-2026-usage-policy-update.html](reference/vendor-terms/2026-10-27/news-2026-usage-policy-update.html)), quoted exactly: "We’ve added a prohibition on sustained and needless abusive or cruel behavior toward our models. The policy update is meant to apply only in extreme cases, where users repeatedly act cruelly toward our models, with no discernible purpose. It does not apply to common versions of user frustration, pushback, dark creative themes, or model testing and research." and "This addition aligns with a step we've already taken, allowing Claude models to end rare conversations with persistently abusive users on Claude.ai and Claude Code. Such abuse is the main focus of this update; Claude’s ability to end these interactions will remain the primary enforcement mechanism." The linked post (https://www.anthropic.com/research/end-subset-conversations, Aug 15, 2025; saved copy [research-end-subset-conversations.html](reference/vendor-terms/2026-10-27/research-end-subset-conversations.html)) gives the reason as model welfare: "This feature was developed primarily as part of our exploratory work on potential AI welfare, though it has broader relevance to model alignment and safeguards."
  - Reading: neither the Usage Policy nor the announcement gives an operational reason such as compute cost; the reason given is potential model welfare.
