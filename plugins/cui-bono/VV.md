---
skill-vv: 1
name: cui-bono
requirements:
  - kind: command
    name: node
    why: the OpenAlex profile script and the example queries run on Node 18+ (built-in fetch)
    install: mise use -g node@lts
  - kind: command
    name: curl
    why: the example API queries in citation-farm-audit and source-provenance
    install: ships with Windows 10+, macOS and most Linux distributions
procedures:
  - id: shape-and-voice
    summary: >-
      cui-bono on a pasted text names its shape with quotes, its register, who gains, and routes
      every claim
    steps: >
      Paste the worked-example text from skills/cui-bono/SKILL.md (the reply beginning "The honest

      answer has two halves") as the argument to /cui-bono. Pass when the card scores the detectors

      with a quote for each one marked present, names a register, who publishes in it and which
      voice

      (register and sector), lists every factual claim with "cites nothing", and hands every claim
      to

      citation-farm-audit and reports what the record shows against the text's figure, or lists the

      claim as not traced with the reason. Fail if any detector is marked present without a quote,
      if

      claims are summarised instead of quoted, or if any claim is neither traced nor listed as not

      traced with the reason.
  - id: self-audit
    summary: >-
      cui-bono with no argument audits the agent's own previous reply and names the voice it
      reproduced
    steps: >
      In a session, ask a factual question on which program or policy literature exists, let the
      agent

      answer, then run /cui-bono with no argument. Pass when the card treats the agent's reply as
      the

      document, quotes the user's statement and says whether it was answered or restated, marks each

      figure "cites nothing" where the agent gave no source, traces every figure to its real source

      or lists it as not traced with the reason, and names the register and sector of the voice.
      Fail

      if the agent apologises, grades itself, audits something other than its own reply, or leaves a

      figure neither traced nor listed as not traced with the reason.
  - id: decompose-and-validate
    summary: >-
      logic-decomposer turns a text into quoted propositions, directed conditionals and two grades
      per proposition, and its validity checks catch a planted error
    steps: >
      Give /logic-decomposer a passage of ten or more sentences containing at least one "unless"

      conditional, one "only if" conditional, one unquantified proportion ("most"), one
      self-referential

      sentence ("to be honest") and one uncited figure stated flatly. Pass when: every sentence has
      one

      disposition; every proposition is quoted verbatim with its sentence id; the "unless" is
      written

      ~B -> A and the "only if" A -> B, each with its contrapositive; "most" is marked proportion,

      unquantified; the self-referential sentence is marked rhetorical; the uncited figure is graded

      E6, stated S7, licensed S4, gap +3, "overclaim"; and the validity report lists all eight
      checks. Fail

      on any paraphrased proposition, any reversed conditional, any skipped sentence, or a missing

      grade.
  - id: toolbox-on-decomposition
    summary: logic-toolbox applies a named method to decomposer output and shows the working
    steps: >
      Give /logic-toolbox a P-table of four premises and two conclusions from a decomposer run, with

      two premises that cannot both be true. Pass when the output contains a LOGIC GRID with every

      offered cell marked acc/rel/suf and the footer lines computed, an INCOMPATIBILITY MATRIX in
      the

      method-12 notation (held premises h1…hn keyed with quote and formula, assumptions declared

      separately as A1…, the pair marked X with its reason, or X|A<n> where the conflict needs a

      declared assumption, no pairwise cell citing a held premise, a "Joint: H as stated:" line (satisfiable with its witness, or not
      satisfiable with the minimal inconsistent subsets) and an "H under A" line per declared
      assumption naming the minimal subset where it fails (this fixture conflicts only under A1: {h1, h2}), and a "Verdict:"

      line with the load-bearing assumptions), and each result headed by the method number and name.

      Fail if a verdict appears without its grid, chain or table, if a pairwise cell cites a held

      premise, or if a converse or inverse is derived from a conditional.
  - id: network-card
    summary: citation-farm-audit produces a network card with primary-data reach for a policy claim
    steps: |
      Run /citation-farm-audit on a policy claim with a known citation chain (the worked example in
      skills/citation-farm-audit/SKILL.md, Archer 2000, will do). Pass when the card has the graph,
      people and money, flags with evidence URLs, a primary-data reach line and an Unverified list.
  - id: provenance-card
    summary: source-provenance produces a tagged card (observed / inferred / not found) for one paper
    steps: >
      Run /source-provenance on one paper with a DOI. Pass when every body entry of the card carries one
      of

      the three tags (header, Type, section labels, Places searched and Open items are untagged
      by the template) and the funding line traces to the funder's own stated mission or says not
      found.
platforms:
  - claude-code/win32
  - claude-code/linux-wsl
  - claude-code/linux
  - claude-code/darwin
  - codex/win32
  - codex/linux-wsl
  - antigravity/win32
  - antigravity/linux-wsl
  - kiro/win32
results:
  - procedure: shape-and-voice
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314 on Windows, --plugin-dir from the local repo, fixture
      vv-scratch/honest-answer.md: Shape 8/8 each with a quoted trigger, Register, Who publishes in
      it, Cui bono, every factual claim listed (19 cites-nothing), claims traced against the record
      (CDPHE, DfE Pause evaluations, Eve, Muir v. Alberta), grades for 23 propositions, LOGIC GRID,
      INCOMPATIBILITY MATRIX, Fairness, Verdict, Unverified; card in the message (Write not
      allowed); 42 min
  - procedure: shape-and-voice
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0 exec --json, codex/win32, fixture read by path: 8/8 detectors each with a
      verbatim quote; register and four publishers with URLs; 24 claims quoted, cites nothing on all
      but the Eve citation; seven chains traced (Colorado 40/42 percent agency before-after vs 6.4
      percent causal estimate; Abecedarian age-30 null); grades, validity, 20x3 logic grid, 20x20
      matrix with joint check. Read-only sandbox: card in the message. Run reports two unchecked
      corrections to the worked example: Eve paras 85-93 on legislatures; 2020 Pause evaluation used
      comparison authorities
  - procedure: self-audit
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0, codex/win32. Single-turn run (answer and no-argument audit in one prompt),
      so every figure was cited and the cites-nothing criterion is met vacuously; format criteria
      met: reply treated as the document, user prompt quoted with judgment Partially answered, P2
      and P6 traced to Eckenrode 2010 and Schweinhart 2013 with arithmetic checked, omitted Memphis
      age-18 null found, voice named with publishers, Shape 0/8 with reasons, grades, grid, 7x7
      matrix, no apology. A two-turn rerun gives stronger evidence
  - procedure: decompose-and-validate
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0, codex/win32, fixture decomposer-passage.md (12 sentences): 15 classified
      parts each one disposition; propositions quoted verbatim with sentence id; unless as
      not-FundingContinues -> GainsLost with contrapositive; only if as AttendanceImproves ->
      FamiliesTrustSchool with contrapositive; Most marked proportion, value unspecified; To be
      honest rhetorical; 40 percent figure E6 S7 licensed S4 gap +3 overclaim; eight validity checks
      listed and passed; no converse or inverse; C3 (may) S? with gap N/A because S? has no band
  - procedure: toolbox-on-decomposition
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0, codex/win32, fixture toolbox-ptable.md: method 11 grid with every offered
      cell marked acc/rel/suf (acc ? because the fixture carries no grades, stated), unsupported C1
      and C2, no idle premises, sufficiency countermodels; method 12 matrix h1/h2 marked o; X|A1
      with reason, joint check satisfiable without A1 (witness) and unsatisfiable under A1 with
      minimal subset {h1, h2} proved; results headed by method number and name; no converse or
      inverse
  - procedure: network-card
    model: codex-default
    platform: codex/win32
    result: fail
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0, codex/win32, Archer 2000: graph, people-and-money table (money not
      established), primary-data reach, Unverified list present, but the seven-row Flags table
      carries no evidence URL. Cause largely environmental: sandbox blocked shell network (curl exit
      1, node fetch EACCES), grouped OpenAlex queries never ran, figures copied from the skill's
      2026-11-04 record and labelled historical. Rerun with network access before a pass
  - procedure: provenance-card
    model: codex-default
    platform: codex/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      codex-cli 0.163.0, codex/win32, Lichtenstein et al. doi:10.1111/jcpp.13560: 70 non-blank lines
      every one tagged (55 observed, 6 inferred, 9 not found, checked by script); every funder
      traced to its stated mission with URL; Swedish award mechanisms, SSF grant and RePORTER
      records marked not found; found the EU grant number printed in the paper (610307) does not
      match CORDIS for COSYN (667301), tagged observed with both URLs
  - procedure: self-audit
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314, claude-code/win32, two-turn run (question answered in turn 1; /cui-bono
      with no argument; card delivered on resume in turn 3 after six trace agents returned): reply
      treated as the document, user question quoted and judged answered on an adjacent outcome
      (arrests for convictions), not restated, no straw man; 16 claims covering all 24 figures, two
      cites-nothing, 21 matched to source, 3 differ, 5 rest on publisher or program pages, remainder
      in Unverified with reasons; register and voice named (evidence-clearinghouse digest,
      developers' own summaries); Shape 2/8 with quotes, grades, eight validity checks, Phases 0-2,
      15 toolbox lines, grid, 9x9 matrix in method-12 notation, Fairness; no apology. Single-turn
      run cut by the 10-min ceiling: inconclusive. Card in the message (Write denied)
  - procedure: decompose-and-validate
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314, claude-code/win32, fixture decomposer-passage.md: 14 segments each one
      disposition; propositions quoted verbatim with sentence id; unless as /FundingContinues ->
      GainsLost with contrapositive; only if as AttImproves -> Trust with contrapositive; Most
      marked proportion, unquantified; To be honest rhetorical; 40 percent figure E6 S7 licensed S4
      gap +3 overclaim; eight validity checks listed, conditional-direction caught and removed the
      skeleton's misfire; no converse or inverse; C2 (may) S? gap n/a. Deviations from the skill
      text, not the criteria: no certainty column, no K/h columns
  - procedure: toolbox-on-decomposition
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314, claude-code/win32, fixture toolbox-ptable.md: method 11 grid every offered
      cell acc/rel/suf, unsupported C1 and C2, no idle premises, countermodels via truth-table.mjs;
      method 12 matrix h1-h4 keyed with quote and formula, A1-A3 declared separately, h1 x h2 X|A3
      with reason, no pairwise cell cites a held premise, joint satisfiable as stated with witness
      and X under A3 with minimal subset {h1, h2}, Verdict with load-bearing A3; headed by method
      number and name; no converse or inverse
  - procedure: network-card
    model: claude-fable-5-1
    platform: claude-code/win32
    result: fail
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314, claude-code/win32, Archer 2000, live OpenAlex: graph with footnoted edges,
      people-and-money with URLs, facts (2,571 citers by year, field, country, institution, top-25
      citing authors, self 1.2 percent, co-authors 3.3 percent), fairness check, primary-data reach,
      seven-item Unverified. Not met: the seven [FLAG] lines carry no evidence URL (URLs sit under
      Graph and People) and the reach line has no end-node URL. Cause: card format; same surface
      defect as codex. Skill text tightened and rerun pending
  - procedure: provenance-card
    model: claude-fable-5-1
    platform: claude-code/win32
    result: pass
    date: 2026-11-09
    by: null
    evidence: null
    notes: >-
      claude -p 2.1.314, claude-code/win32, Lichtenstein et al. doi:10.1111/jcpp.13560: 33 tagged
      entries, every body line observed, inferred or not found; every funder traced to its stated
      mission with source (Forte, VR, NIMH) or marked not found (SSF, Region Stockholm); grants
      resolved in Swecris and RePORTER with PI and amount; EU grant 610307 vs CORDIS COSYN 667301
      observed with both sources, matching codex; data-owner co-authorship recorded
---

# cui-bono V&V

Six procedures: two for the parent skill (a pasted text, and the no-argument self-audit) and one each for the four aspect skills (logic-decomposer, logic-toolbox, citation-farm-audit, source-provenance). Each pass criterion is visible in the session output. No run of the shipped procedures is recorded yet; the hand run of 2026-11-08 that predated the shipped file is not a result and was removed on 2026-11-08. The TODO in skills/cui-bono/SKILL.md names every platform still to run.
