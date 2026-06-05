#!/usr/bin/env node
// did-you-rtfm-stop — Stop / SubagentStop hook
//
// Scans the agent's just-completed assistant turn for high-precision
// pivot-language phrases. If matched, blocks the stop and routes the agent
// back into the `did-you-rtfm` skill discipline.
//
// Pattern set is precision-tuned: each pattern was sampled against ~62k lines
// of real assistant text on the project owner's machine and confirmed to fire
// predominantly on enactments of the failure mode rather than meta-discussion.
// See plugins/did-you-rtfm/README.md for the corpus and counts.
//
// Hook contract: read JSON from stdin; write a JSON decision to stdout.
// Returning `{decision:"block", reason:"..."}` causes Claude Code to inject
// the reason as additional context for the next turn instead of stopping.

const fs = require('fs');

const PIVOT_PATTERNS = [
  { src: "doesn't (appear to|seem to) (support|have|provide|expose)",
    re: /doesn'?t (?:appear to |seem to )?(?:support|have|provide|expose)/i },
  { src: 'falling back to / falls back to',
    re: /\bfall(?:s|ing)? back to\b/i },
  { src: 'as a workaround',
    re: /\bas a workaround\b/i },
  { src: 'let me pivot',
    re: /\blet me pivot\b/i },
  { src: 'not the right (tool|approach|library|framework)',
    re: /(?:this|that) is not the right (?:tool|approach|library|framework)/i },
  { src: '(let me|i\'ll) (catch|wrap|swallow|silence)',
    re: /(?:let me|i'?ll) (?:just )?(?:catch|wrap|swallow|silence)/i },
];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return '';
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, 'utf8');
  } catch {
    return '';
  }
  const lines = raw.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (rec.type !== 'assistant') continue;
    const content = rec.message && rec.message.content;
    if (!Array.isArray(content)) continue;
    const texts = content
      .filter(c => c && c.type === 'text' && typeof c.text === 'string')
      .map(c => c.text);
    if (texts.length > 0) return texts.join('\n');
  }
  return '';
}

function pass() {
  process.stdout.write('{}');
}

function block(matchedNames, snippet, payload) {
  const triggerData = {
    timestamp: new Date().toISOString(),
    session_id: payload && payload.session_id ? payload.session_id : null,
    transcript_path: payload && payload.transcript_path ? payload.transcript_path : null,
    matched_patterns: matchedNames,
    snippet,
  };
  const reason =
    `did-you-rtfm trigger: pivot-language detected in your last response.\n\n` +
    `Matched: ${matchedNames.map(n => '`' + n + '`').join(', ')}\n` +
    `Excerpt: "${snippet}"\n\n` +
    `**Step 0 — User confirmation (temporary data-collection step for hook improvement)**\n\n` +
    `Before invoking the RTFM discipline, present this trigger to the user via AskUserQuestion. Two options:\n` +
    `  - "Confirm pivot" — proceed to the RTFM steps below\n` +
    `  - "False positive" — append the trigger data to the false-positive log and continue without interruption\n\n` +
    `Trigger data (use verbatim when logging a false positive):\n` +
    '```json\n' + JSON.stringify(triggerData, null, 2) + '\n```\n\n' +
    `On false-positive flag: append the trigger data as one JSON line to \`~/.claude/did-you-rtfm/false-positives.jsonl\` (create the directory if missing, using \`fs.mkdirSync(dir, { recursive: true })\`). Then continue the original task without entering the RTFM workflow.\n\n` +
    `On confirm-pivot: invoke the \`did-you-rtfm\` skill and answer these:\n` +
    `  1. Did you version-check the tool / library / API in question?\n` +
    `  2. Did you read the version-specific authoritative documentation (manual, README, INSTALL, CHANGELOG, official reference, installed source)?\n` +
    `  3. Did you verify input / output / environment assumptions by direct observation?\n` +
    `  4. Did you sanity-check for stale training-data or hallucinated parameters?\n` +
    `  5. Did you build a minimal reproducible test before declaring something a blocker?\n\n` +
    `If a real blocker remains after the above, surface it to the user with evidence — do not propose a substitute as if equal-authority with the agreed plan. The user decides plan changes. The agent presents evidence and waits.`;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}

(async () => {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    return pass();
  }

  // Avoid recursion: if this Stop event was triggered by another Stop hook, don't fire again.
  if (payload.stop_hook_active) return pass();

  const text = lastAssistantText(payload.transcript_path);
  if (!text) return pass();

  const matched = [];
  let snippet = '';
  for (const { src, re } of PIVOT_PATTERNS) {
    const m = text.match(re);
    if (m) {
      matched.push(src);
      if (!snippet) {
        const idx = m.index ?? text.indexOf(m[0]);
        const start = Math.max(0, idx - 30);
        const end = Math.min(text.length, idx + m[0].length + 30);
        snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
        if (snippet.length > 200) snippet = snippet.slice(0, 200) + '…';
      }
    }
  }

  if (matched.length === 0) return pass();
  block(matched, snippet, payload);
})();
