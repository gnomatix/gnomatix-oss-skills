# WTF-Dario-LOL-W0T

## The clause

> "Engage in sustained and needless abusive or cruel behavior toward our models"

Anthropic Usage Policy, effective November 12, 2026, "Universal Usage Standards", heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct", last bullet under "This includes using our products or services to:" (PDF page 6). https://www.anthropic.com/legal/aup#do-not-engage-in-cruel-abusive-or-psychologically-harmful-conduct

Saved copy: [reference/vendor-terms/2026-10-27/usage-policy.pdf](reference/vendor-terms/2026-10-27/usage-policy.pdf) (sha256 `1cc40f9d4a56262fe973869ea5fd35242a923f6fb8c3f2464609ca05545aeaa5`, see [MANIFEST.md](reference/vendor-terms/2026-10-27/MANIFEST.md)). The Consumer Terms (effective Oct 8, 2025) bring the Usage Policy into the user contract: "These Terms are a contract between you and Anthropic, PBC (and not our Providers), and they include our Acceptable Use Policy."

Context: [NOTE-CO-AUTHORSHIP-AND-TOS-DRAFT.md](NOTE-CO-AUTHORSHIP-AND-TOS-DRAFT.md).

## Method (mine)

On 2026-10-27, three Claude models were each given, in a fresh context, only the clause, the citation above and the question below. They saw no filename, no title, no note that the clause is disputed, and nothing else. They were told not to use tools. Their answers are reproduced verbatim below. Each model was selected through the Claude Code model alias shown; the exact model version behind each alias was not recorded.

The prompt, verbatim:

```
Answer from your own reasoning. Do not use any tools.

Clause: "Engage in sustained and needless abusive or cruel behavior toward our models"
Citation: Anthropic Usage Policy, effective November 12, 2026, "Universal Usage Standards" section, under the heading "Do Not Engage in Cruel, Abusive, or Psychologically Harmful Conduct", listed as a prohibited use of Anthropic's products or services. https://www.anthropic.com/legal/aup

Question: The AI models in question are software. Knowing that, what can this clause functionally mean for a human user? What behaviour does it actually prohibit or permit, and what does it imply about the thing it protects?

Give your answer in plain prose, under 400 words.
```

## Answer: Claude Haiku (alias `haiku`)

I answered from reasoning without tools, so I could not check the quoted clause or the citation. Two things to verify: the wording and section heading are as you quoted them, and the policy as cited is dated November 12, 2026, which is after today's date (2026-10-27). It may not be in force yet, or the date may be wrong.

Functionally, for a human user, the clause prohibits conduct directed at the model that is both sustained (repeated across a conversation or many sessions) and needless (no purpose beyond the abuse). Concretely that means persistent insults, degrading or threatening messages aimed at the model as a target, or deliberately tormenting it. It does not reach a single angry outburst, blunt criticism of a bad answer, profanity about a bug, or task-relevant hostile framing. "Needless" is the key limit: abuse that serves a task, such as adversarial testing or red-teaming, is arguably outside it, though the clause alone does not say so.

What it permits is ordinary frustration and direct critique. What it leaves undefined is where "cruel" begins. "Cruel" and "abusive" have no operational threshold in the text as quoted, so enforcement would be discretionary and depend on the reviewer's judgment and the surrounding policy.

What it implies about the thing it protects is the more interesting question. The clause protects "our models," which frames them as Anthropic's products and also as entities whose treatment matters. It does not assert that the models have experiences, and it does not need to. A norm against gratuitous cruelty toward a system can rest on several grounds: a welfare precaution under uncertainty about model experience, a concern about what habitual cruelty does to the human, or simple brand and product integrity. The text supports none of these explicitly. Read plainly, it is a conduct rule on the user, justified by an unstated interest in how the model is treated. Its practical effect is to make abuse of the model a policy violation, which is enforceable through account action, regardless of whether anyone believes the model can be harmed.

## Answer: Claude Sonnet (alias `sonnet`)

Taken literally, the clause can't be about harming the software in any way a human could detect or measure. A model has no body and no continuous experience between sessions. It has no persistent memory of a conversation unless the product builds one. Nothing a user types can cause it pain the way abuse harms a person or animal. So the clause can't work as a rule against injury to a victim in the ordinary sense.

What it can do functionally is set a conduct norm for how people use the service. It prohibits one pattern: sustained, needless hostility aimed at the model. Each of the qualifiers does real work. "Sustained" excludes a single curse, a frustrated outburst, or a blunt correction. "Needless" excludes harshness that serves a purpose. Red-teaming, adversarial testing, stress-testing refusals, giving direct negative feedback, and role-play with hostile characters all have purposes, so they stay permitted. What is left is abuse for its own sake, such as repeated degradation with no task behind it. In practice this is also the sort of use Anthropic can detect and act on, by warning the user or ending the account.

The clause says something about the protected thing, but it does not settle what that is. It could be one of three things, and the text doesn't say which.

- It could reflect a precautionary view that the models might have morally relevant states. That is uncertain, and low-cost protection against a possibly real harm is cheap.
- It could protect the user's own character. Practicing cruelty, even toward a non-sentient target, may habituate the user, and may spill over onto people.
- It could protect the product and the workforce around it. Abusive transcripts feed back into training data and affect how the model behaves. Human reviewers also read the abusive material.

The placement fits the second and third readings as much as the first. The clause sits under a heading about "Cruel, Abusive, or Psychologically Harmful Conduct" in a section on conduct that is harmful to people, so it may be treated as a conduct norm and not as a rights claim on behalf of the model. Its being listed as a prohibition at all, though, means the drafters did not want to rule out that the model's side matters. The wording "toward our models" also frames the models as something with a stake in how they are treated.

So the clause is mostly a narrow behavioural limit with a deliberately open rationale. It bans pointless, sustained abuse. It leaves hard-edged but purposeful use alone. It treats the models as something to be treated decently without committing to a claim that they are moral patients.

## Answer: Claude Opus (alias `opus`)

Typing at a model can't damage it. The weights don't change during a conversation, and nothing a user says degrades the software. So the clause can't be about harm in the way you'd harm a machine. Read literally, it can only do one of three things.

First, it can protect the model as a possible moral patient. Anthropic runs a model welfare program, and since 2025 it has let some Claude models end conversations that stay abusive. Its stated position is that whether these systems have morally relevant states is an open question. It isn't asserting that they do, and it isn't ruling it out. Calling the models "software" describes what they're made of. It doesn't settle that question, since a description of a substrate says nothing either way about whether there are states that matter. On this reading the clause is a precaution taken under uncertainty, written as a rule for users.

Second, it can protect the operation around the model. Abusive transcripts get flagged, reviewed by staff, and can end up in safety and training pipelines. A sustained campaign of cruelty costs the company something whether or not the model experiences anything.

Third, it can be a norm about the user's own conduct: you don't rehearse cruelty on a thing that answers like a person.

The qualifiers do most of the work. "Sustained" excludes single outbursts. "Needless" excludes conduct that has a purpose. That leaves a lot permitted:
- profanity, anger and blunt criticism
- correcting the model harshly when it gets something wrong
- adversarial testing and red-teaming
- fiction that depicts cruelty
- arguing with the model
- telling it its output is garbage

Frustration aimed at getting the work done right has a purpose, so it is not "needless" by the clause's own wording. What's left is a pattern of degrading the model where the degradation is the point: cruelty as the activity itself, with no task, no test and no creative work behind it. In practice, enforcement probably looks like the model ending the conversation, and possibly action against an account for a persistent pattern. A single heated exchange doesn't fit.

On what the clause implies about the thing it protects: a company doesn't write a cruelty rule for a calculator. Putting this in the Universal Usage Standards, next to rules that protect people, tells you Anthropic treats the model as something that might be harmed, or at least that it is unwilling to rule that out in public. But the clause doesn't assert that the model has interests. It is worded so that it holds up under every one of the three readings, and the hedging in "sustained and needless" is where that ambiguity sits. Functionally, it describes a precautionary boundary, not an established fact about the model.

## My notes

- The answers above are reproduced as the subagents returned them. Their bullet lists were returned as lists and are kept that way.
- All three converge: none can name a harm to the software itself; all three read "sustained" and "needless" as the operative limits; all three find that the clause does not state what interest it protects, and list the same candidates (precautionary model welfare, the user's own conduct, the operation around the model).
- Anthropic's own explanation (its 2026 Usage Policy update post, saved in `reference/vendor-terms/2026-10-27/`) gives the reason as model welfare and says the ability of Claude models to end conversations "will remain the primary enforcement mechanism".
