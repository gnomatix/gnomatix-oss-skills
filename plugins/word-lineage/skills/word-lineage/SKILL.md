---
name: word-lineage
description: "Invoke on /word-lineage <word or words>. Traces an English word's lineage phylogenetically: which layer it came from (native Germanic, Norse, Latin, French, other), the evidence for it (similarity to the source-language word, conjugation, synonym set, core vs borrowed vocabulary), and its literal meaning read off the tree, placed on a NEXUS network of English and its donor languages with a cross-language synonym map. Also a word-choice mode (/word-lineage meaning: <phrase>): picks the synonym whose literal meaning matches. Gives one answer per word, plainly; refined with the author when an answer is wrong."
---

# word-lineage — reading a word off its family tree

## The author's words (2026-10-27), verbatim

> "Here's a heuristic you can use if you wanted to actually know that and not be a retard, is you can look at the information theoretic, mutual information between a word in French and English. So like egg and oof, right? Two completely different words, O and water."

> "No, not just French. Any fucking thing. Any fucking, because we know the history of England. We know that there was waves where it was controlled by French. That's how the words got in there. And they evolve. And so there's Roman Latin words. So we know it was dominated by Rome. So there's Latin words. But people only learn the words that are new, right? This is what you're doing. And you're saying the shit, but you're not acknowledging what I'm saying. The more core the words, like people aren't going to learn a new word for air or water, right?"

> "Because of the conjugation of the verbs and things like this. So if you go, oh, the verb's conjugated like this, oh, then it's a word from French. Oh, then it's a word from German. People go, English is hard, but it's not. You just have to know what the origins of the words are. And usually the synonyms, like the synonyms are there and they're literal. So if you break down into literal synonym, it's one or the German. So the synonyms, that's how you know. Like, so sometimes the Germans use a different word because their language evolved, right? So English captures an old German word, but then the Germans have a new word, right? So actually, a German goes, oh, it's quaint or whatever. It sounds weird when you say it because you're using the old one. And this happens in between the United States in different parts, different states have different meanings. So all of what I'm describing is one rule for how you deconstruct language, and you know why. By looking at synonyms, breaking them down into literals, and understanding where they came from. It's a phylogenetic approach to language that allows you to understand the meaning of words systematically. And to not debate about them."

> "write a skill for that. Write me up a skill for it. And when I invoke it, then you give me an answer. And if the answer is wrong, then we refine the skill."

> "And part of the skills, what I'm saying is the synonyms, right? Literal synonyms, and then across languages. So Spanish, all of the Latin languages, right? We're bringing in Romance, Spanish, German, anything that comes from Latin. And we look at in each of those, the synonyms. And when we mapped, because usually the same one, like in colonial times, the same word, because they're trading, right? Portuguese, Spain. And then new words come in from Asia, right? Because it's all from colonial times. And then the cultures get cut off, right? At post-colonial, right? So all of, if you map it to the timeline, like, so you got to put the timeline of English, and then you got to go the division of American English, French, and then reunification during internet times, right? So it's like a tree that merges back in. So when you look at that evolutionary tree, build a little, make a nexus plot or whatever, pull up the history of the splitting and put it on a tree and put a fake distance metric on it. And then we'll use that tree as the heuristic. And then use the synonyms, okay? I really want to do this. I want to see this exercise and see if you can do it."

> "because this will without a this will allow us without a thesaurus, without a dictionary or whatever, it will allow us to essentially settle on the definition of a word, the working definition of a word, because it's literal. It's literal. Like, we the synonym confusion is because we're being non-specific."

> "It applies to all because I worked in Maryland. So I'm just saying, like, there's different people arrive at different meanings, but I go for the real meaning. That's the point, is I go for the real meaning, right? Which is the literal meaning. Literal meaning. Because words have literal meanings. So it's like, why use a wrong word and interpret it as other meaning when there is a word that literally means that, right? Use the literal meaning."

## My procedure (refined with the author when an answer is wrong)

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

When a dictionary or reference was checked, cite it. When the answer comes from recall, say so in one word ("recall"). The author's corrections to an answer go into this skill as a refinement. Each refinement is dated, his words are quoted verbatim, and my change is listed under "My refinement".

## My worked example: commence (synonym set begin, start)

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
