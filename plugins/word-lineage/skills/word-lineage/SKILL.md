---
name: word-lineage
description: "Invoke on /word-lineage {word or words}. Traces an English word's lineage phylogenetically: which layer it came from (native Germanic, Norse, Latin, French, other), the evidence for it (similarity to the source-language word, conjugation, synonym set, core vs borrowed vocabulary), and its literal meaning read off the tree, placed on a NEXUS network of English and its donor languages with a cross-language synonym map. Also a word-choice mode (/word-lineage meaning: {phrase}): picks the synonym whose literal meaning matches. Gives one answer per word, plainly; refined with the author when an answer is wrong."
---

# word-lineage — reading a word off its family tree

## The method

English is a layered language: a native Germanic core with Norse, Latin, French and later
borrowings laid over it in known historical waves (Roman Britain, the Danelaw, the Norman
conquest, the scholarly Latin and Greek of the early modern period). A word's layer can be read
off evidence rather than looked up: its similarity to the same word in French, German, the other
Romance and Germanic languages (the information-theoretic view: how much a word in one language
tells you about its counterpart in another), its morphology (how it conjugates or forms its
plural), whether it belongs to the everyday core or to a ruling-class, legal, ceremonial or
scholarly register, and how it has drifted in meaning. Knowing the layer gives the word's
literal meaning, and the literal meaning settles what the word actually says, without a
thesaurus.

Synonyms are compared the same way, across the Romance and Germanic languages at once: for a
set of near-synonyms, each word's literal meaning is read off its lineage, and the one whose
literal meaning matches the intended meaning is the right word. The skill is refined by use:
when an answer is wrong, the correction goes into the procedure below as a dated refinement.

## The procedure (refined when an answer is wrong)

There are two modes.

- **Lineage mode** (`/word-lineage <word>`): steps 1–8 below, one output block per word.
- **Word-choice mode** (`/word-lineage meaning: <phrase>`, given a meaning to express rather than a word): list the candidate synonyms, give each one's literal meaning from steps 1–8, and pick the word whose literal meaning matches the meaning to express. Output is the word-choice block under "Output".

The network used in steps 6–7 is `reference/lineage-network.nex` (NEXUS, Newick tree, branch lengths in approximate centuries, a heuristic, not measured) and its terminal rendering `reference/lineage-network.txt`. Merge edges are numbered R0–R7 in both files.

For each word given:

1. **Core or new?** Is the word core vocabulary: body, kin, basic nature (air, water, egg), basic actions (eat, die, go), basic numbers? Core words are native until shown otherwise. Words for new things a ruling group brought in (law, church, government, cuisine, trade, science) point to that group's language.
2. **Similarity to each source language.** Compare the word with its counterpart in each candidate source: Old English/German, Old Norse, Latin, French, Greek. High similarity to one source, against low similarity to the native equivalent, marks a borrowing from that source (beef/*bœuf*, but cow is native). Low similarity everywhere marks native stock (egg/*œuf*, water/*eau*).
3. **Conjugation and morphology.** Strong verbs that change their vowel (sing/sang/sung) are Germanic. Regular verbs with Latin-type endings (-ate, -ize, -fy) came via Latin or French. Suffixes carry their layer: -ician, -ique/-ic, -ment and -ity are French or Latin, while -ness, -hood and -ship are Germanic.
4. **The synonym set.** List the word's synonyms and break each into its literal source, e.g. begin/commence, ask/inquire, kingly/royal/regal. The set shows the layers side by side, and the word's place in it confirms its layer.
5. **Fossils and drift.** Check whether English kept an older form or meaning that the source language has since replaced or narrowed (wife vs *Weib*/*Frau*; starve vs *sterben*; deer vs *Tier*). Note regional splits too, such as US states keeping different survivors.
6. **The historical wave.** Tie the layer to the period of England's history it came in: Roman/church Latin, Norse settlement, Norman French, later scholarly Latin and Greek, modern borrowings.
7. **Cross-language literal synonym map.** For the word, list its equivalent and its synonyms in German, Dutch, French, Spanish, Portuguese and Italian, plus Latin and Greek where relevant (Romanian too when it keeps a root the others lost). Group them by shared root, not by language. Place each root group on a node of the network. Then read the word's path: the chain of nodes from its root to English, and which split edge (inherited) or merge edge (R0–R7, borrowed) brought it into English, with that edge's date. Note edges running the other way (an English word back-borrowed into German, Dutch or French, R7): those are loans, not cognates.
8. **Working definition.** The working definition is the literal meaning read off the lineage (the parts and the root group's sense), the same for every reader. Regional or later senses get listed as drift (step 5), not as the definition. Where a synonym set exists, give each synonym its own literal sense on its own line, so the set separates by literal meaning instead of blurring together.

## Output

Lineage mode, one block per word, nothing outside its scope:

```
<word> — <layer> (via <path, e.g. Latin → Old French → English>)
Literal: <literal meaning read off the parts>
Evidence: <which of steps 1–6 decided it, one line each>
Native/other synonyms: <the set, each tagged with its layer>
Cross-language map: <one line per root group: root — members by language — node on the network>
Path on the network: <root node → ... → English stage, naming the split or merge edge (R#) and its date>
Synonym literals: <one line per synonym: synonym = literal sense, from <source>>
Working definition: <the literal meaning from the lineage>
```

Word-choice mode:

```
Meaning to express: <the meaning>
Candidates: <one line per candidate: word = literal sense, from <source>>
Pick: <the word whose literal meaning matches, and the one-line reason>
```

When a dictionary or reference was checked, cite it. When the answer comes from recall, say so in one word ("recall"). Corrections to an answer go into this skill as refinements. Each refinement is dated and lists what changed and why.

## Worked example: commence (synonym set begin, start)

Mine. No dictionary was checked; every etymological fact is from recall and marked "(recall)".

```
commence — Latin via French (Latin → Vulgar Latin → Old French → Anglo-Norman → Middle English)
Literal: "go into, together": com- "together, wholly" + in- "into" + ire "go", via Latin initium "a going-in, a beginning" and Vulgar Latin *cominitiare (recall)
Evidence:
  1 Core or new: not core; it is the formal, ceremonial register (courts, sessions, ceremonies), the vocabulary a ruling group brings (recall)
  2 Similarity: near-identical to French commencer, Italian cominciare, Spanish comenzar, Portuguese começar; no likeness to German/Dutch beginnen (recall)
  3 Morphology: regular weak verb, commence/commenced, against Germanic strong begin/began/begun with its vowel change; noun in French -ment (commencement) (recall)
  4 Synonym set: begin (Germanic) and start (Germanic) beside commence (French) and initiate (scholarly Latin): the layers side by side (recall)
  5 Drift: American English "commencement" = graduation ceremony, from the medieval university use (a degree-holder "commences" as master) that Cambridge also kept; general British use does not have it (recall)
  6 Wave: Norman French, entered English c. 1300 (recall)
Native/other synonyms: begin (native Germanic), start (native Germanic, sense shifted), initiate (scholarly Latin), inaugurate (scholarly Latin), commence (Norman French) (recall)
Cross-language map:
  A. Latin com- + in- + ire, *cominitiare — French commencer, Spanish comenzar, Portuguese começar, Italian cominciare, English commence — node Vulgar_Latin; into English on R2 (recall)
  B. Latin initium / initiare — Latin initiare, Spanish/Portuguese iniciar, Italian iniziare, German initiieren, English initiate — node Classical_Latin_Fossil; into English on R3, 1500-1700 (recall)
  C. Latin in- + capere "take in hand", incipere — Latin incipere, Romanian a începe, English incipient (adjective only) — node Latin; Romanian inherited it via Vulgar_Latin, English took incipient on R3 (recall)
  D. Germanic be- + *ginnan — German beginnen, Dutch beginnen, English begin — node West_Germanic; inherited, Old English beginnan (recall)
  E. Germanic *fanhan "catch, seize" — German anfangen, Dutch aanvangen ("catch on") — node West_Germanic; English kept the root only as fang, not as a "begin" verb (recall)
  F. Germanic *sturtijan "leap, plunge" — English start, German stürzen "plunge, fall", Dutch storten "pour, plunge" — node West_Germanic; inherited, Old English styrtan "leap up" (recall)
     Back-loan: German starten, Dutch starten come from English start (sport, engines), edge R7, 1800 on; loans, not cognates (recall)
  G. Iberian/French-only innovations, no English "begin" reflex — Spanish empezar (en + pieza, "into a piece"), French débuter / démarrer ("un-moor"), Italian avviare ("set on the way"), Latin principium → Spanish/Portuguese principiar — nodes Spanish, France_French, Italian; English debut is a later noun loan (recall)
  H. Greek archein "to begin, to lead" — Greek ἄρχω, English arch-, archaic (no English verb) — node Ancient_Greek; into English on R3 (recall)
Path on the network: Proto_Indo_European (*ei- "go") → Latin (ire, initium) → Vulgar_Latin (*cominitiare) → Old_French (comencier) → merge edge R2, Norman French → Middle English, 1066-1400, attested c. 1300 → Early_Modern_English → English_1776 → both British/Canadian and American English, where American adds the "graduation" sense (recall)
Synonym literals:
  commence = "go into, together": begin as a joint, formal act; from Latin com- + initiare (recall)
  begin = be- + *ginnan, Old English beginnan; the literal sense of *ginnan is not settled ("open, cut open" is one proposal) (recall)
  start = "leap up, spring": from Old English styrtan "leap up"; the "begin" sense comes from setting out with a jump (recall)
  initiate = "make a going-in": from Latin initiare, initium (recall)
  inaugurate = "consecrate by augury": from Latin inaugurare, in- + augur (recall)
Working definition: commence = to go into something together, i.e. to begin a joint or formal undertaking (a session, a trial, a ceremony).
```

Word-choice check on the same set (mine):

```
Meaning to express: a meeting formally opening, with everyone present
Candidates:
  commence = "go into, together" (recall)
  begin = native "begin", literal root unsettled (recall)
  start = "leap up, spring" (recall)
  initiate = "make a going-in" (recall)
Pick: commence, because its literal meaning is the joint, formal going-in; start literally means a sudden leap, which fits an engine or a runner, not a session.
```

## Refinements

(none yet)
