# The Audit Checklist

A non-exhaustive list of failure modes that let a compliant-looking actor violate the rule's intent. Each check applies to RULE, SKILL, and WORKFLOW documents (some checks apply more strongly to one type than another — noted where relevant).

This list is not exhaustive. When a finding falls outside these categories, name it explicitly under "Other" in the audit output.

## Core Principle

**Rules describe behaviors. The most common failure is describing surface markers instead.**

A rule that targets vocabulary instead of pattern is a leaky rule. A good rule describes the underlying behavior pattern in terms of what it produces or signals, so that someone trying to comply with the spirit can recognize it in any form, and someone trying to game it cannot find a re-wording that escapes.

## The Checklist

### 1. Surface vs. Behavior

- Does the rule prohibit specific words, phrases, or formats — or does it describe the behavior those surface markers indicate?
- If you renamed every prohibited token to a synonym, would the rule still bite?
- If not, the rule is leaky — rewrite to target the behavior.

**Example:** "Don't say 'noted', 'understood', or 'got it'" → leaky. "Acknowledgement without action is noise" → behavioral.

### 2. Example-as-Definition

- Does the rule give examples instead of stating the underlying principle?
- Could a compliant actor produce a brand-new variation that fits the spirit but isn't on the list?

**Test:** Strip the examples. Does the rule still convey what behavior is wanted? If not, the principle isn't actually written down.

### 3. Embedded Calls-Out / Stereotypes

- Does the rule make a swipe at another model, vendor, generation, group, or person?
- Phrases like "unlike X which does Y" — these turn a behavior rule into commentary about the comparator.
- The model reading the rule may pick up the swipe as part of the standard, generating outputs that mirror the bias.

**Fix:** Strip the comparator. State the desired behavior on its own merits.

### 4. Escape Hatches Through Specificity

- Does the rule contain qualifiers that narrow it to specific contexts ("when X," "unless Y," "in cases of Z")?
- Each qualifier is a permitted exception. Are all of them intentional?
- Subjective qualifiers ("when appropriate," "if reasonable," "for deliberate cases") let the actor decide for itself when the rule applies — which means it doesn't.

**Test:** Read the rule with all qualifiers removed. Is that the actual intent? If yes, remove them. If not, are the qualifiers exhaustive and objective — could a third party verify they apply?

### 5. Resilience to Correction

- Does the rule prescribe what the actor should do when corrected, criticized, or under user frustration?
- Rules silent on this implicitly allow the actor to enter apology spirals, gut work in panic, or refuse to continue.
- The right correction loop: take the correction, fix the actual issue, continue. Not: apologize, second-guess unrelated decisions, undo work.

**Add when missing:** Explicit guidance on response-to-correction behavior.

### 6. Performative Compliance

- Can the rule be satisfied with a verbal acknowledgement and no behavior change?
- Acknowledgements without action are noise. Saying "yes I will do X" without doing X is non-compliance dressed as compliance.
- Rules whose only enforcement mechanism is the actor's self-report are weak.

**Strengthen:** Tie the rule to an observable artifact (a file change, a completed action, a verifiable state).

### 7. Right Action vs. Right Reason

- A rule's compliance can be accidental. Doing the right thing for the wrong reason produces correct behavior in the moment but won't generalize.
- Post-hoc rationalization ("I did this because of principle P") is suspect when the actor's real-time reasoning didn't include P.

**Diagnostic:** Ask the actor to apply the rule to a different case. If the principle wasn't internalized, the second application will fail.

### 8. Loophole-by-Omission

- Does the rule list permitted behaviors but not prohibited ones (or vice versa)?
- One-sided rules implicitly permit everything in the unstated category.
- Be deliberate about which side is enumerated and whether the unenumerated side is genuinely open.

### 9. Ambiguity About Authority

- Does the rule say who is allowed to override it, change it, or grant exceptions?
- Rules without an authority clause leave the actor to decide for itself when the rule applies — which means it doesn't.
- Especially important for safety-relevant rules.

### 10. Hidden Dependencies

- Does the rule reference other rules, systems, or context that the reader may not have?
- A rule that depends on knowing X is broken when X is missing or has changed.
- Make dependencies explicit; don't assume the reader has the same context.

### 11. Internal Contradiction

- Does the rule say X in one place and not-X in another?
- Does it use the same term to mean different things in different sections?
- Internal contradictions force the actor to pick one interpretation, often silently.

### 12. Unverifiable Assertion

- Does the rule prescribe a behavior the actor cannot observe in itself?
- "Be honest" is unverifiable from inside; "cite the source for every claim" is verifiable.
- Unverifiable rules degrade to "do whatever you think satisfies this."

### 13. Stale References

- Does the rule cite a tool, file, version, URL, or system that no longer exists or has changed?
- Rules with stale references silently break.

### 14. Triggering Conditions Undefined

- Does the rule say "do X" without saying when X applies?
- "Always" is a triggering condition; absence of one isn't.
- Especially problematic for SKILL files — the description IS the trigger.

### 15. Conflict Precedence Undefined

- Does this rule conflict with another known rule?
- If yes, which wins?
- Silent conflicts let the actor choose, often inconsistently.

## Anti-Loophole on the Checklist Itself

This checklist is non-exhaustive. The audit output should include an "Other Findings" section for issues that don't fit any check above. The checklist's purpose is to surface common failure modes, not to define the universe of failures.
