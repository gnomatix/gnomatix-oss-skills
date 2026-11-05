'use strict';
// spank-dario: find tool-attribution lines in commit messages and PR text.
// Pure Node. Shared by hooks/commit-msg-no-tool-attribution.js and bin/check-text.js.
//
// Flags a line when it is one of:
//   - a Co-Authored-By trailer naming an AI tool, model or vendor address
//   - a "Generated with/by <tool>" line, or the 🤖 Generated badge
//   - a session link: Claude-Session: trailer or a claude.ai/code/session_ URL
// Leaves everything else alone, including review and sign-off statements and the
// commit's author and committer identity, which git keeps outside the message.

const TOOL = '(?:claude(?:\\s+code)?|anthropic|openai|chatgpt|gpt-?\\d[\\w.-]*|codex|gemini|bard|copilot|kiro|amazon\\s+q|q\\s+developer|cursor|aider|devin|windsurf|codeium|tabnine|cody|sonnet|opus|haiku|fable|mythos)';
const TOOL_ADDR = '(?:noreply@anthropic\\.com|noreply@openai\\.com|[\\w.+-]*\\[bot\\]@users\\.noreply\\.github\\.com)';

const RULES = [
  { id: 'co-authored-by', re: new RegExp(`^\\s*co-authored-by\\s*:.*(?:\\b${TOOL}\\b|${TOOL_ADDR})`, 'i') },
  { id: 'generated-with', re: new RegExp(`^.*\\bgenerated\\s+(?:with|by|using)\\b.*\\b${TOOL}\\b`, 'i') },
  { id: 'generated-badge', re: /🤖\s*generated/i },
  { id: 'session-trailer', re: /^\s*claude-session\s*:/i },
  { id: 'session-link', re: /claude\.ai\/code\/session_/i },
];

function findAttribution(text) {
  const hits = [];
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, i) => {
    // Git strips comment lines from commit messages; don't flag them.
    if (/^#/.test(line)) return;
    for (const r of RULES) {
      if (r.re.test(line)) { hits.push({ line: i + 1, rule: r.id, text: line }); break; }
    }
  });
  return hits;
}

function stripAttribution(text) {
  const eol = /\r\n/.test(text) ? '\r\n' : '\n';
  const flagged = new Set(findAttribution(text).map(h => h.line));
  const kept = String(text).split(/\r?\n/).filter((_, i) => !flagged.has(i + 1));
  // Collapse trailing blank lines left behind by removed trailers.
  while (kept.length > 1 && kept[kept.length - 1] === '' && kept[kept.length - 2] === '') kept.pop();
  return kept.join(eol);
}

module.exports = { findAttribution, stripAttribution, RULES };
