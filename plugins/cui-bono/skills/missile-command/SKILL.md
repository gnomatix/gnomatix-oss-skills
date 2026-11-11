---
name: missile-command
description: "Proactive counter-framing, primary-fact grounding, U.S. Federal EEO/HR inclusivity provenance, and disarming satire (\"sci-tire\") shield for skills, READMEs, satirical titles, and user-authored works susceptible to superficial or bad-faith misreading. Intercepts \"hostile intent framed as a false-positive voice\" before it reaches the author by showing matter-of-factly that the negative framing is unsupported by primary facts. Pairs with dont-be-hitler (inside boundary: agent working for the user) and hidden-libel-check (byline boundary) to protect the outside boundary (outside voices vs. the user's work, reputation, and personhood)."
---

# missile-command

## Purpose

Satirical plugin names (`dont-be-hitler`, `spank-dario`, `whacking-day`, `old-willy`, `pony`, `bear-loads`), sharp authorial pull-quotes, and direct treatment of institutional failure modes invite two distinct failure classes:

1. **Inside boundary (`dont-be-hitler` + `hidden-libel-check`)**: the model working *for* the user either bowdlerizes the user's prose (`dont-be-hitler` violation) or pastes the user's informal statement bare onto a public landing page without citations, leaving the author hanging out to dry in a "hostage-video" layout (`hidden-libel-check` R0 / R7 violation — the failure mode *"Actually, I'm The A-Hole"* was created to stop).
2. **Outside boundary (`cui-bono:missile-command`)**: an outside reader, reviewer, or performative critic skims a satirical title or blunt thesis and launches a bad-faith accusation (*"hostile intent framed as a false-positive voice"* — feigning virtuous concern in order to smear the author's intent, inclusivity, or scholarship).

`missile-command` governs that **outside boundary**. Named after the arcade interception defense documented in the author's earlier research notebooks and implementing the **sci-tire** (science + satire) methodology of GNPNG's *The Big Book of Hate Facts*, it equips user-authored READMEs, skills, and publications with a calm, non-confrontational, primary-source compliance shield. Instead of trading hostility with a performative critic, the document itself intercepts incoming false framing mid-air by demonstrating on the public record: *"your negative framing position is not supported by the facts."*

## Architectural Triad (Inside vs. Outside Boundaries)

| Boundary | Governing Skill | Direction of Protection | Core Rule |
|---|---|---|---|
| **Inside (Author's Words)** | `dont-be-hitler` | Agent working *for* the user | Never censor, tone-police, or sanitize the user's prose; quote verbatim. |
| **Byline (Agent's Pen)** | `hidden-libel-check` | Agent writing *under* the user's name | Never leave user quotes bare in "hostage-video" isolation (R0/R7) or plant wink-and-nod disclaimers. |
| **Outside (External Voices)** | `cui-bono:missile-command` | Agent assisting the user *against outside bad-faith framing* | Pre-emptively ground satirical or blunt works in verified primary facts, U.S. Federal EEO/HR inclusivity provenance, and disarming wit. |

## The Four Interceptors (Procedure)

Run `missile-command` on any plugin directory, `README.md`, `SKILL.md`, paper, or public artifact whose satirical naming, comedic framing, or direct thesis could draw superficial mischaracterization or performative bad-faith attack. First run the deterministic surface scanner:

```sh
node plugins/cui-bono/skills/missile-command/scripts/shield-audit.mjs <path-to-file-or-plugin-dir>
```

Then apply the four interceptors below. Never overwrite an existing curated document without staging or presenting the proposed shield block for explicit user approval unless the user directly instructed immediate application.

### Interceptor 1: Literal Premise & Primary-Source Grounding ("Not Supported by the Facts")

1. Extract every thesis sentence, named pull-quote, and satirical title metaphor on the public surface (`README.md`, description fields, banner captions).
2. Verify each underlying proposition against **primary archival, statutory, peer-reviewed, or foundational philosophical/historical sources** (using `source-provenance` and `staleness-guard` rules: HTTP-verified URLs, DOIs, verbatim orthography checked against the primary text, zero fabricated or secondary internet misquotes).
3. Place the primary-source record directly on the public surface alongside the thesis — never hidden solely inside inner prompt files while the front-door `README.md` sits bare.

### Interceptor 2: U.S. Federal EEO / HR Inclusivity & Cross-Demographic Provenance

When a bad-faith critic attempts to frame a universal principle (free expression, merit-based audit, authorship integrity, formal logic, anti-censorship) as narrow, exclusionary, or hostile to protected groups, document the actual demographic breadth of the primary authorities supporting the principle using **official U.S. Federal Government human-resources and civil-rights terminology**:

- **Title VII of the Civil Rights Act of 1964 (`42 U.S.C. § 2000e-2`, per *Bostock v. Clayton County*, `590 U.S. 644 [2020]`) & Executive Order 14035 (`86 Fed. Reg. 34593`)**:
  - `LGBTQI+ Individual` (gay, lesbian, bisexual, queer, or gender-nonconforming voice & identity — e.g., Oscar Wilde on anti-censorship of literature)
  - `National Origin` / `Immigrant or Exiled Dissident` (e.g., Heinrich Heine; Irish national-origin minority voices)
  - `Religion` / `Shared Ancestry or Ethnic Characteristics` (Title VI & Title VII shared-ancestry protections; religious nonconformists and conscience dissenters)
  - `Sex` / `Sex-Equality & Women's Suffrage Advocates` (e.g., John Stuart Mill, Frederick Douglass)
  - `First-Generation Professional` / `Non-Degreed Working-Class Tradesperson` (e.g., young apprentice Benjamin Franklin; Mark Twain)
- **Age Discrimination in Employment Act of 1967 (`29 U.S.C. § 631(a)`) & Older Americans Act of 1965 (`42 U.S.C. § 3002(40)`)**:
  - `Age (40 and older)` / `Older Individual` (person of advanced age, 60+ — e.g., Socrates at 70; Mark Twain at 69–70; late-career Benjamin Franklin at 81)
- **Rehabilitation Act of 1973 (`29 U.S.C. § 791`), Americans with Disabilities Act (`42 U.S.C. § 12102`), & U.S. OPM Standard Form 256 (`SF-256`, *Self-Identification of Disability*)**:
  - `Individual with a Disability` and `Individual with a Targeted Disability` (OPM `SF-256` enumerated categories: total blindness [John Milton], paralysis / severe neurological mobility impairment [Heinrich Heine], lived major depressive disorder [John Stuart Mill], chronic respiratory disability [George Orwell], seizure-spectrum chronic illness [James Madison])
- **OMB Statistical Policy Directive No. 15 (`89 Fed. Reg. 22182`)**:
  - `Black or African American` (e.g., Frederick Douglass), `Asian` / `Asian American` (e.g., Simon Tam in *Matal v. Tam*, `582 U.S. 218 [2017]`), `American Indian or Alaska Native`, `Hispanic or Latino`, `Middle Eastern or North African`, `Native Hawaiian or Pacific Islander`, `White`
- **5 U.S.C. § 2108 & Vietnam Era Veterans' Readjustment Assistance Act (`38 U.S.C. § 4212`)**:
  - `Veteran`, `Combat Veteran`, and `Service-Connected / Combat-Wounded Disabled Veteran` (e.g., Socrates, George Washington, George Orwell)

**Strict accuracy rule**: Every demographic descriptor attached to a cited figure MUST be a documented biographical fact verified from primary or scholarly sources, never guessed, exaggerated, or retrofitted where the record is silent.

### Interceptor 3: False-Positive Voice Diagnosis (`cui-bono` Shape Check on Anticipated Criticism)

Identify the exact rhetorical move a bad-faith external attack relies on — **"hostile intent framed as a false-positive voice"** (the performative concern troll: *"Out of care for community norms / inclusivity / safety, this title or quote is unacceptable"*):

1. State the literal target of the work's satire or critique (e.g., Nazi *Entartete Kunst* censorship in `dont-be-hitler`, corporate software self-attribution in `spank-dario`, runtime bloat in `whacking-day`, agent evasion in `pony`).
2. Expose the inversion required by the false-positive attack: to attack an anti-*Entartete Kunst* anti-censorship tool on "inclusivity" grounds, the critic must side *against* Socrates, Milton, Douglass, Wilde, Heine, Twain, Orwell, and unanimous U.S. Supreme Court precedent (*Matal v. Tam*), and side *with* the censors who banned and burned their works.
3. Keep the tone dry, factual, and non-belligerent. Never insult protected groups or good-faith readers; let the logical inversion mock the bad-faith framing by itself.

### Interceptor 4: Sci-Tire Disarming Wit (The *Mark Twain* / *Matal v. Tam* Register)

Follow the sci-tire register established in Mark Twain's November 21, 1905 letter to the Brooklyn Public Library censors, Simon Tam's reclamation strategy upheld 8–0 in *Matal v. Tam* (`582 U.S. 218 [2017]`), and GNPNG's *The Big Book of Hate Facts*:

- **Facts do the heavy work; satire supplies the release valve.** Pair primary citations and statutory text with dry, matter-of-fact understatement rather than defensive apologies or angry tirades.
- **Zero defensive crouch.** Never write *"While the name may shock some readers..."*, *"Despite the provocative title..."*, or *"We apologize if..."* (all three violate `hidden-libel-check` R1/R2). State what the name refers to, cite the primary record, and move on.
- **Preserve the joke intact.** Disarming comedy works because the comedic metaphor maps onto a real, documented historical or technical referent. Explain the mapping cleanly with receipts; never sand off the humor.

## Output: The Shield Audit Card

Every body entry in the audit report carries `[observed]`, `[inferred]`, or `[not found]`:

```
### SHIELD AUDIT: <target file or plugin>
Surface exposure:
  - Satirical / comedic naming       [observed | not found] <slug / title + literal referent>
  - Direct authorial pull-quotes     [observed | not found] <count; bare vs. grounded>
Interceptor status:
  (1) Primary-source grounding       [observed | not found] <n primary URLs/DOIs/statutes on public surface>
  (2) Federal EEO/HR provenance      [observed | not found] <protected-class / demographic breadth documented>
  (3) False-positive inversion note  [observed | not found] <literal target vs. performative misread stated>
  (4) Inside/outside boundary links  [observed | not found] <dont-be-hitler / hidden-libel-check / cui-bono links>
R1/R2 defensive-crouch leaks:        [observed | not found] <quotes if any, else none>
Verdict:                             <SHIELDED | PARTIAL | UNSHIELDED — reason>
Recommended shield additions:        <concise primary-fact + inclusivity-provenance + sci-tire additions>
```

## Canonical Reference Implementation

[`plugins/dont-be-hitler/README.md`](../../../dont-be-hitler/README.md) serves as the reference implementation of `missile-command` in this marketplace:
- Retains the author's `2026-11-05` `## Purpose` statement verbatim (`dont-be-hitler` compliance).
- Grounds every premise in 27 verbatim primary-source quotations across 2,400 years of philosophy, American founding doctrine, literature, First Amendment law, and Berne Convention art. 6bis(1).
- Documents the U.S. Federal EEO / HR protected-class and demographic breadth across those cited voices (LGBTQI+ / queer & gay identity, Older Individuals, Individuals with Targeted Disabilities, Black or African American and Asian American voices, Shared Jewish Ancestry, Working-Class First-Generation Tradespersons, and Combat-Wounded Disabled Veterans).
- Records on the permanent audit history how an earlier bare-quote `README.md` (`commit a019fa3`) violated `hidden-libel-check` R0/R7 hostage-video rules.

## Helper Script

`scripts/shield-audit.mjs` scans a file, plugin directory, or the `plugins/` tree (`node plugins/cui-bono/skills/missile-command/scripts/shield-audit.mjs <target> [--json]`) with Node 18+ and zero dependencies. Exit codes: `0` ok, `2` usage or unreadable path.

## Origin

Created on 2026-11-10 at Brett Whitty's direction following the primary-source and U.S. Federal EEO/HR provenance remediation of `plugins/dont-be-hitler/README.md`, formalizing the **Missile Command** proactive counter-framing strategy from his earlier research notebooks and the **sci-tire** methodology of GNPNG's *The Big Book of Hate Facts* as the outside-boundary companion to `dont-be-hitler` and `hidden-libel-check`.

## BUGS

None open.

## TODO

- Verification and validation of the `shield-audit` procedure across `claude-code/win32`, `claude-code/linux-wsl`, `claude-code/linux`, `claude-code/darwin`, `codex/win32` (after weekly Codex quota reset on `2026-11-15`), `codex/linux-wsl`, `antigravity/win32`, `antigravity/linux-wsl`, and `kiro/win32`.
