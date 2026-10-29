# Anthropic vendor terms, fetched 2026-10-27

Current published versions of Anthropic's Consumer Terms of Service, Usage Policy and Commercial Terms of Service, as served by anthropic.com on 2026-10-27 to this machine (Ontario, Canada). Each legal page offers a PDF download; the PDF is the retained copy. The `.txt` beside each PDF is a text extraction (`pdftotext -layout -enc UTF-8`, poppler, mingw64) for search; the PDF is authoritative.

The two Anthropic posts that explain the model-abuse clause have no PDF; each is kept as the page HTML plus a text extraction (tags stripped, entities decoded).

## Legal documents

| File | Page URL | PDF URL | Fetched (UTC) | Effective, as printed | Site metadata (`internalName`; region ref) | sha256 |
|---|---|---|---|---|---|---|
| `consumer-terms.pdf` | https://www.anthropic.com/legal/consumer-terms | https://cdn.sanity.io/files/4zrzovbb/website/ed7f1f94a2ecb7657fb4be5af6f66c66b38fb148.pdf | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | Effective Oct 8, 2025 | `Terms (Canada, 2025-10-08) - remove effective date notice`; region `f5553f13-fe2a-41b0-9cc5-f33702a70cc3` | `29a15ceb1f1093190fb197827033e1c47e553b3aaeb1815d38f7fb802e71d38e` |
| `consumer-terms.txt` | (extraction of the PDF above) | | | | | `43bc8e6acf4fe4fa7c76cf87a96ef71eee4b6220740204d789228a3db9959888` |
| `usage-policy.pdf` | https://www.anthropic.com/legal/aup | https://cdn.sanity.io/files/4zrzovbb/website/88cf16e8b7d203be16d2c726bcd28a6ec7c7f5c8.pdf | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | Effective Nov 12, 2026 | `AUP (US+RoW, 2025-11-12) - 2026 Update`; region `3259fdb8-acba-44fd-8632-3849827084fe` | `1cc40f9d4a56262fe973869ea5fd35242a923f6fb8c3f2464609ca05545aeaa5` |
| `usage-policy.txt` | (extraction of the PDF above) | | | | | `af6b81e2c575452df5d4b625bedc84fb2c87b6087ed642512b1f95a60c05d0c3` |
| `commercial-terms.pdf` | https://www.anthropic.com/legal/commercial-terms | https://cdn.sanity.io/files/4zrzovbb/website/cbc0cee5a5580ef30c81ccf745ef439aa7c47921.pdf | page 2026-10-27T19:30:10Z; PDF 2026-10-27T19:34:09Z | Effective Jun 17, 2025 | `Commercial Terms (2026-03-11) - formatting update`; region `3259fdb8-acba-44fd-8632-3849827084fe` | `af5032c44336929c06722809e2a29a421175837d91be0de149d3462f1fd3e270` |
| `commercial-terms.txt` | (extraction of the PDF above) | | | | | `c0c9c9479702720afdcf6f6ac48f0f1eb00d2e6981532cf3d1a93ff01bc60924` |

### Dates to read with care

- **Usage Policy.** The current published version is effective Nov 12, 2026, after the fetch date. The page's version history lists the prior version as effective 2025-09-15 (no PDF offered for it). The copy retained in this plugin at `skills/all-help-no-harm/vendor-docs/anthropic/usage-policy.md` (fetched 2026-05-29) is that prior text, and it has no clause about behavior toward the models. The clause quoted below is in the Nov 12, 2026 version only.
- **Consumer Terms.** anthropic.com serves this page by region; the copy here is the Canada variant.
- **Commercial Terms.** Republished 2026-03-11 as a formatting update; the printed effective date stays Jun 17, 2025.

## Anthropic posts about the clause

| File | URL | Published, as printed | Fetched (UTC) | sha256 |
|---|---|---|---|---|
| `news-2026-usage-policy-update.html` | https://www.anthropic.com/news/2026-usage-policy-update | Oct 8, 2026 | 2026-10-27T19:36:49Z | `5a3d7fd63a4f87b5baf1016919e96e00cf5a555113259e2d61ab8e8fc98258e9` |
| `news-2026-usage-policy-update.txt` | (extraction of the HTML above) | | | `49416006e6fce839c93a4f3c477c57b8269a2c80dd577aa664c22a93f7521d7f` |
| `research-end-subset-conversations.html` | https://www.anthropic.com/research/end-subset-conversations | Aug 15, 2025 | 2026-10-27T19:36:49Z | `7b2a2297f2caa04b9a152613de93fe53d798c21b3a699b9ced014c28e0df19e7` |
| `research-end-subset-conversations.txt` | (extraction of the HTML above) | | | `67aad4e46577bb613168f4af80b98e8b37611652b0fe95e56366e43a0b20054f` |

## The clause about behavior toward the models

- **Usage Policy (effective Nov 12, 2026)**, part "Universal Usage Standards", heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct" (HTML anchor `#do-not-engage-in-cruel-abusive-or-psychologically-harmful-conduct`, PDF page 6), last bullet under "This includes using our products or services to:":

  "Engage in sustained and needless abusive or cruel behavior toward our models"

- **Consumer Terms (effective Oct 8, 2025)** bring the Usage Policy into the consumer contract in the opening paragraph: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy."
- The Consumer Terms have no clause about behavior toward the models. The nearest wording, in "3. Use of our Services", is about the Services: "You also must not abuse, harm, interfere with, or disrupt our Services, including, for example, introducing viruses or malware, spamming or DDoSing Services, or bypassing any of our systems or protective measures."
- The Commercial Terms have no such clause.
- The Safeguards and Trust & Safety help-center collections linked from these documents (https://support.claude.com/en/collections/4078535-safeguards, https://support.anthropic.com/en/collections/4078535-trust-safety) were checked on 2026-10-27 and contain no such wording.

## Verify

```sh
sha256sum *.pdf *.txt *.html
```
