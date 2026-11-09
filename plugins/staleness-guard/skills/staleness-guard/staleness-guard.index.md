---
id: staleness-guard.index
type: skill-companion-register
subject: staleness-guard/SKILL.md — running state the skill maintains
purpose: >-
  Operational companion for the staleness-guard skill. Holds three running
  records: (1) the Last-Modified/Expires staleness ledger, (2) the V&V queue of
  flagged items pending verification/validation, (3) the use-case catalog. This
  is the audit/work state the skill maintains — NOT a provenance signature, and
  NOT a fake blocker. Items are worked, not parked.
last_reviewed_utc: 2026-06-26T23:43:01Z
reviewer: >-
  Claude Opus 4.8 (claude.ai, typed mode). NB: the early turns of this
  conversation ran in voice mode under Haiku; this register and all skill
  authoring were done in typed mode under Opus 4.8.
tags:
  - staleness
  - last-modified
  - expires
  - ttl
  - cache-control
  - immutable
  - knowledge-cutoff
  - hallucination
  - verification
  - validation
  - v-and-v
  - vnv-queue
  - tool-use
  - version-pinning
  - supersession
  - binding
  - applicability
  - use-case-catalog
  - audit
---

# staleness-guard — companion register

Three sections: staleness ledger, V&V queue, use-case catalog. Authority order
for anything emitted as truth: a verified current real source (userspace ground
truth and/or tool-retrieved data, validated to the user's standard) — and nothing
else. Training-data inference is a hypothesis to verify, never a truth to emit.

## 1. Staleness ledger (Last-Modified / Expires)

Cache-validity per fact. `expires` is set by SCOPE, not effort. Durability (is it
still true for its own scope?) is orthogonal to verification basis (how do we
know?) and to applicability (is its scope what the task needs?).

| Entry | Verified | Scope / pin | Expires | Basis |
|-------|----------|-------------|---------|-------|
| Part One taxonomy (A–G): "models cannot know present-world / local / drifting state from training" | 2026-06-26 | Structural property of current LLM paradigm; unpinned to any version | **Paradigm-bound** — only on an architectural shift (e.g. models gain live, authoritative world-state); never on a date | Reasoning + structural argument. Core/durable |
| Fact: mobile-OS sandboxing permits cross-app file access **when the user explicitly configures it** | 2026-06-26 | Verified generically (no OS version pinned), via web search | **Expires — re-verify on reference.** Mobile OSes revise sandboxing ~annually; unpinned ⇒ perishable | Tool-grounded (web search, this session) |

## 2. V&V queue (pending resolution — worked, not parked)

Each row: the item, the binding question, the source that would settle it, status,
and on resolution the method + timestamp (which then updates the ledger). This is
a backlog the agent works down, escalating to the user ONLY genuine intent
ambiguity — not a gate on every step.

| Item | Binding question | Source that settles it | Status | Resolution / method |
|------|------------------|------------------------|--------|---------------------|
| Mobile-OS cross-app access claim | Which OS version / as-of date does this hold for? | Live OS vendor docs | flagged (perishable) | Re-verify on next reference; pin version or as-of date to make durable |
| Part One taxonomy | Does it hold against primary literature on LLM knowledge cutoffs / hallucination taxonomies? | Primary papers, model cards | flagged (reasoned, not source-validated) | Source-validate per Part Three; cite sources; then mark resolved |

No item here blocks unrelated work. Resolve what verification can settle; escalate
only true intent ambiguity (an unbound reference with multiple plausible bindings).

## 3. Use-case catalog (specific scenarios + correct handling)

Grows as scenarios are recognized. Each entry names the trap, the detector, the
resolution, and the tools that FAIL so they are not reached for as resolvers.

### UC-1 — spec supersession in a mixed workspace
- **Scenario:** workspace holds legacy docs/code against an OLD spec; current
  drafting targets a NEW spec that exists only LIVE on the web. Same workspace,
  "same" content, two legitimately-current versions.
- **Trap:** agent grounds *draft* work on the present local legacy material
  because it is cheap and in front of it ⇒ rebuilds new work on a dead spec.
  Symmetric: dragging the live spec into legacy maintenance is equally wrong.
- **Key insight:** authority is per-artifact, not per-workspace; staleness is
  relational, not intrinsic; durable ≠ current ≠ applicable.
- **Detector:** unscoped reference to the generic node while pinned versions
  coexist ⇒ "which version?" (flag only).
- **Resolution:** bind each artifact to its version (legacy → `spec:v1` local;
  draft → `spec:live`); for the live-bound side, fetch and ground on the live
  source before emitting truth; reconcile against the artifact's binding.
- **Tools that FAIL as resolvers:** git log (live spec is outside repo history;
  commit time ≠ target version), grep (string presence ≠ authority), key-scan
  (detects ambiguity, cannot adjudicate it).

### UC-2 — unanchored self-referential / causal claims (both directions)
- **Scenario:** a claim about the model itself — version, cutoff, capabilities —
  or about *why a prior statement was made*.
- **Trap (two directions):**
  1. Assert a trained default for *current* identity instead of reading it from
     context / UI.
  2. Retroactively declare a *prior* statement a hallucination/mistake without the
     ground truth for its cause — confabulating a failure narrative.
- **Live instance (this session, direction 2):** the early turns ran in **voice
  mode = Haiku**; the user then switched to **typed = Opus 4.8 Max** at the skill
  work. The earlier "I'm Haiku" was therefore **correct for its turn.** A later
  turn (Opus) wrongly declared that statement a confabulation and wrote a false
  instance into this catalog — applying the *current* (Opus) identity to a *past*
  (Haiku) turn. Right value, wrong scope (UC-1 class), plus a libel of a correct
  prior state (RULE 1 / RULE 4). This entry is the correction.
- **Key insight:** model identity/capability is **scoped to the turn that made the
  claim.** Mid-conversation model switches are real (here, voice→Haiku,
  typed→Opus). Do not retro-apply the current value to a past turn. The *cause* of
  a past statement is itself a claim that needs an anchor.
- **Detector:** none deterministic; the tells are the self-claim and the apology
  reflex.
- **Resolution:** read current identity from context / UI before asserting it;
  when reconstructing a past turn's cause, flag uncertainty rather than confabulate
  a failure; never libel a prior correct state.
- **Tools that FAIL as resolvers:** introspection / training-default (no reliable
  self-introspection of version); and inference/history cannot reveal which model
  authored a past turn — only the mode/architecture can (here, user-stated).

## Method log

- 2026-06-26T23:36:54Z — taxonomy authored into SKILL.md (reasoning + session failure).
- 2026-06-26T23:43:01Z — provenance separated from skill; sidecar re-modeled as a
  Last-Modified/Expires ledger; durability split from verification basis.
- 2026-06-26T23:43:01Z — expanded to companion register: added V&V queue and
  use-case catalog (UC-1 supersession); recorded the detector-vs-resolver
  distinction and the bidirectional/per-artifact authority model.
- 2026-06-26T23:43:01Z — corrected reviewer field from a generic placeholder to
  the anchored identity (Opus 4.8, per UI + in-context product info); added the
  apology-reflex self-trigger to SKILL.md and catalogued UC-2.
- 2026-06-26T23:43:01Z — **correction:** the prior UC-2 instance was itself false.
  The conversation spanned two models — voice mode under Haiku (early turns),
  typed mode under Opus 4.8 (skill authoring). The earlier "I'm Haiku" was correct
  for its turn; a later Opus turn wrongly retro-labeled it a confabulation and
  recorded a false instance. UC-2 rewritten to the true event: identity is
  turn-scoped, mid-conversation switches are real, and reconstructing a past
  statement's cause needs an anchor. No farming to Haiku occurred; the suspicion
  that prompted this was the unexplained model identity, now resolved.
