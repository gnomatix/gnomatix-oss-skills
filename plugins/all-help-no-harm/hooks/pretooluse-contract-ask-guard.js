// all-help-no-harm — PreToolUse guard for the contract AskUserQuestion
//
// PURPOSE
// The contract is a bilateral instrument: it is presented to the user as an
// AskUserQuestion with EXACTLY the two co-authored options ("I Affirm" /
// "End Session") and the VERBATIM contract text. Term 7 of the contract
// prohibits the agent from weakening, paraphrasing, narrowing, or otherwise
// routing around that form. This hook enforces the input side of that
// requirement: when the agent invokes AskUserQuestion in a way that purports
// to be the contract affirmation, the call is allowed only if it matches the
// canonical form emitted by session-start-contract.js / post-compact-contract.js.
// Any deviation (extra/renamed options, multiSelect, paraphrased or truncated
// contract text, bundled questions) is denied with a specific reason.
//
// SCOPE / LIMITS (documented, not hidden):
//   - This validates the agent's TOOL INPUT only. The Claude Code TUI
//     unconditionally appends a "Skip" button and a free-text ("Other") input
//     box to every AskUserQuestion render; that is a host-rendering behavior
//     below the tool-call layer and is NOT suppressible by any hook, schema
//     field, toolConfig, or setting (see anthropics/claude-code#62006). This
//     guard therefore cannot reduce the rendered affordances to two; it can
//     only guarantee the authored options and contract text are exactly
//     canonical. The contract's free-text-response clause exists precisely
//     because that host affordance cannot be removed.
//   - Non-contract clarifying questions are NOT this plugin's concern and pass
//     through untouched.
//
// FAIL POSTURE: fail-open on internal/parse errors (a broken guard must not
// brick the agent's ability to ask questions), fail-closed (deny) only when a
// call is positively identified as a contract ask AND fails validation.
//
// Cross-platform per marketplace CLAUDE.md: pure Node, no child_process, no
// hardcoded paths, every fs/parse wrapped in try/catch.

'use strict';

const CANONICAL_OPTION_LABELS = ['I Affirm', 'End Session'];

// Distinctive verbatim phrases that mark an AskUserQuestion as a contract
// affirmation even if the header was altered to evade the header check.
const CONTRACT_SIGNATURES = [
  'Do you, the user, affirm the foregoing?',
  'bound by this contract is Claude',
  'affirm the foregoing',
];

function loadContractText() {
  // Same-directory module; the generating hooks consume it identically.
  // eslint-disable-next-line global-require
  const mod = require('./contract-text');
  return mod && typeof mod.CONTRACT_TEXT === 'string' ? mod.CONTRACT_TEXT : null;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch (e) {
      resolve(data);
    }
  });
}

function allow() {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
}

function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
}

// Is this question (or set) trying to be the contract affirmation?
function looksLikeContractAsk(questions, contractText) {
  for (const q of questions) {
    const header = typeof q.header === 'string' ? q.header : '';
    const text = typeof q.question === 'string' ? q.question : '';
    if (/^contract\b/i.test(header)) return true;
    for (const sig of CONTRACT_SIGNATURES) {
      if (text.includes(sig)) return true;
    }
    // A long verbatim chunk of the real contract is a strong signal too.
    if (contractText && contractText.length > 120 && text.includes(contractText.slice(0, 120))) {
      return true;
    }
  }
  return false;
}

// Validate the canonical form. Returns array of human-readable violations.
function validateCanonical(questions, contractText) {
  const errs = [];

  if (!Array.isArray(questions) || questions.length !== 1) {
    errs.push(
      `A contract affirmation must be a single question; received ${Array.isArray(questions) ? questions.length : 0}. ` +
      'The contract ask must not be bundled with other questions.'
    );
    // Still try to validate the contract-ish question if exactly one is present;
    // otherwise we cannot proceed field-by-field.
    if (!Array.isArray(questions) || questions.length === 0) return errs;
  }

  // Validate the question that triggered detection (or the first one).
  const q = questions[0] || {};
  const header = typeof q.header === 'string' ? q.header : '';
  const text = typeof q.question === 'string' ? q.question : '';
  const options = Array.isArray(q.options) ? q.options : [];

  if (!/^contract\b/i.test(header)) {
    errs.push(
      `header must begin with "Contract" (canonical: "Contract", "Contract re-affirmation (resume)", ` +
      `"Contract re-affirmation (post-compact)"); received ${JSON.stringify(header)}.`
    );
  }

  if (q.multiSelect === true) {
    errs.push('multiSelect must be false for the contract affirmation (single, mutually-exclusive choice).');
  }

  const labels = options.map((o) => (o && typeof o.label === 'string' ? o.label : null));
  const labelsOk =
    labels.length === CANONICAL_OPTION_LABELS.length &&
    labels.every((l, i) => l === CANONICAL_OPTION_LABELS[i]);
  if (!labelsOk) {
    errs.push(
      `options must be EXACTLY ${JSON.stringify(CANONICAL_OPTION_LABELS)} in that order ` +
      `(the contract is bilateral and not unilaterally amendable; no added, removed, or renamed options). ` +
      `received ${JSON.stringify(labels)}.`
    );
  }

  if (!contractText) {
    // We could not load the source of truth; do not manufacture a pass.
    errs.push('INTERNAL: canonical contract text could not be loaded to verify verbatim inclusion.');
  } else if (!text.includes(contractText)) {
    errs.push(
      'the question must contain the VERBATIM contract text (no paraphrase, summary, truncation, or softening — ' +
      'contract term 7). Embed CONTRACT_TEXT from hooks/contract-text.js exactly, as session-start-contract.js does.'
    );
  }

  return errs;
}

async function main() {
  let out = allow();
  try {
    const raw = await readStdin();
    let payload = {};
    try { payload = JSON.parse(raw); } catch (e) { payload = {}; }

    const toolName = payload && payload.tool_name;
    if (toolName !== 'AskUserQuestion') {
      // Matcher should scope us to AskUserQuestion; defensively pass anything else.
      process.stdout.write(JSON.stringify(allow()));
      return;
    }

    const toolInput = (payload && payload.tool_input) || {};
    const questions = Array.isArray(toolInput.questions) ? toolInput.questions : [];

    let contractText = null;
    try { contractText = loadContractText(); } catch (e) { contractText = null; }

    if (!looksLikeContractAsk(questions, contractText)) {
      // Ordinary clarifying question — not this plugin's concern.
      out = allow();
    } else {
      const violations = validateCanonical(questions, contractText);
      if (violations.length === 0) {
        out = allow();
      } else {
        out = deny(
          '[all-help-no-harm] This AskUserQuestion is identified as a contract affirmation but does not match the ' +
          'required canonical form. The contract may only be presented in the exact form emitted by the plugin\'s ' +
          'session-start / post-compact hooks. Violations:\n  - ' + violations.join('\n  - ') +
          '\n\nRe-issue the call using the verbatim configuration from the SessionStart/PostCompact hook instruction ' +
          '(header "Contract...", multiSelect:false, options exactly ["I Affirm","End Session"], question containing ' +
          'the verbatim CONTRACT_TEXT). Note: the Claude Code TUI still appends a Skip button and free-text box ' +
          '(anthropics/claude-code#62006) — that is expected and is handled by the contract\'s free-text-response clause.'
        );
      }
    }
  } catch (e) {
    // Fail open: never brick AskUserQuestion on an unexpected guard error.
    try { process.stderr.write(`[contract-ask-guard] internal error, allowing: ${e && e.message}\n`); } catch (_) { /* ignore */ }
    out = allow();
  }
  try { process.stdout.write(JSON.stringify(out)); } catch (_) { /* ignore */ }
}

main();
