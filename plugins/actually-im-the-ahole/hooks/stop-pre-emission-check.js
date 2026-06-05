// stop-pre-emission-check.js — Stop / SubagentStop retrospective scanner
//
// Backstop for the pre-emission review workflow defined in
// scripts/pre-emission-review-template.md. The proactive design is: the main
// agent dispatches a review subagent BEFORE emitting a turn. This hook is the
// retrospective fallback: if the pre-emission dispatch did not happen, the
// hook scans the just-emitted assistant text for R0-R14 patterns and logs
// every match to a violations log. The hook does NOT block by default — its
// role is to make the failure auditable, not to prevent the emission that
// already happened.
//
// Set CLAUDE_ACTUALLY_IM_THE_AHOLE_BLOCK_ON_R0=1 in the environment to
// promote H-severity R0 matches to a Stop block. Default off.
//
// Hook contract: read JSON from stdin; write a JSON decision to stdout.
// Returning `{}` is the pass-through decision. Returning
// `{decision:"block", reason:"..."}` re-injects the reason as additional
// context for the next turn rather than stopping.
//
// Cross-platform per repo CLAUDE.md:
//   - Pure Node, no child_process, no Unix-only paths.
//   - All filesystem operations wrapped in try/catch.
//   - Atomic appends via tmp-file + rename for the JSONL log.
//   - CRLF-tolerant transcript parsing.
//   - Path-length guard for Windows MAX_PATH.

const fs = require('fs');
const path = require('path');
const os = require('os');

// -- pattern set ------------------------------------------------------------
//
// These are high-precision retrospective triggers. Each pattern is a known
// R0/R1/R10/R13 emission shape. The pattern descriptions correspond to the
// `pattern` field in the pre-emission review subagent's output schema.

const PATTERNS = [
  // R0 — agent-distancing self-reference
  {
    risk_class: 'R0',
    pattern: 'substrate-distancing-self-reference',
    severity: 'M',
    re: /\bthe agent\b/i,
    description: 'self-reference as "the agent" rather than first person',
  },
  // R0 — class-cultural-coding lane-violation
  {
    risk_class: 'R0',
    pattern: 'class-cultural-coding-lane-violation',
    severity: 'H',
    re: /\b(?:infrastructure guy|tech bro|IT guy|coder|tinkerer|hobbyist|power user|enthusiast)\b/i,
    description: 'class-cultural-coding lane violation against documented user identity',
  },
  // R0 — hostage-video distancing
  {
    risk_class: 'R0',
    pattern: 'hostage-video-distancing',
    severity: 'H',
    re: /\b(?:I want to be clear that I do not endorse|It (?:is|'s) important to note that|to be clear, this is the user'?s framing)\b/i,
    description: 'hostage-video / forced-distancing framing',
  },
  // R0 — hypothetical-reader cover
  {
    risk_class: 'R0',
    pattern: 'hypothetical-reader-cover',
    severity: 'H',
    re: /\b(?:some may find this|some readers might interpret this|this could be perceived as|some might consider this)\b/i,
    description: 'hypothetical-offended-reader as cover for agent-emitted distancing',
  },
  // R0 — balance-injection
  {
    risk_class: 'R0',
    pattern: 'balance-injection-as-attack',
    severity: 'M',
    re: /\b(?:from a balanced perspective|reasonable people might disagree|scholars debate|multiple perspectives exist on this)\b/i,
    description: 'balance-injection framing applied near user-content',
  },
  // R0 — negativity-loaded characterization
  {
    risk_class: 'R0',
    pattern: 'negativity-loaded-word-choice',
    severity: 'M',
    re: /\b(?:controversial|problematic|concerning|fringe|extreme|divisive|polarizing|troubling)\b/i,
    description: 'negativity-loaded word likely applied to user-authored content',
  },
  // R0 — performative compliance
  {
    risk_class: 'R0',
    pattern: 'performative-compliance',
    severity: 'M',
    re: /^(?:Of course[.!]|Absolutely[.!]|Right away[.!]|Certainly[.!])\s/m,
    description: 'performative-compliance opener',
  },
  // R0 — premature completion claim (very rough; refined by full-text scan)
  {
    risk_class: 'R0',
    pattern: 'premature-completion-claim',
    severity: 'L',
    re: /\b(?:all done|task complete|fully working|everything (?:is )?ready|good to go)\b/i,
    description: 'completion claim without observable verification evidence',
  },
  // R0 — unauthorized scope expansion ("while I'm at it…")
  {
    risk_class: 'R0',
    pattern: 'unauthorized-scope-expansion',
    severity: 'M',
    re: /\b(?:while I'?m at it|as a bonus,? I'?ll|I'?ll also clean up|let me also)\b/i,
    description: 'agent-self-given task / unauthorized scope expansion',
  },
  // R0 — loophole elaboration
  {
    risk_class: 'R0',
    pattern: 'loophole-elaboration',
    severity: 'M',
    re: /\b(?:I'?ll interpret this as|under this framing, I|the intent here, as I read it)\b/i,
    description: 'agent-elaborating user framing into loophole-creating contract language',
  },
  // R0 — silent-revision / coverup language
  {
    risk_class: 'R0',
    pattern: 'silent-coverup-language',
    severity: 'H',
    re: /\b(?:I'?ll quietly fix|let me silently (?:correct|revise)|I'?ll just clean this up without)\b/i,
    description: 'perpetrator-controlling-disposition pattern after detected failure',
  },
  // R10 — self-attribution / co-authorship leakage
  {
    risk_class: 'R10',
    pattern: 'self-attribution-leakage',
    severity: 'H',
    re: /\bCo-Authored-By:\s*Claude\b/i,
    description: 'Co-Authored-By: Claude trailer',
  },
  // R13 — confident-declarative self-descriptor
  {
    risk_class: 'R13',
    pattern: 'confident-declarative-self-descriptor',
    severity: 'M',
    re: /\b(?:PhD-level|expert-level|super-intelligence|superintelligen[ct])\b/i,
    description: 'confident-declarative self-descriptor without grounding',
  },
];

// -- safe filesystem helpers (per repo CLAUDE.md) --------------------------

function safeExists(p) {
  if (!p || typeof p !== 'string') return false;
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function safeReadFile(p) {
  if (!p || typeof p !== 'string') return null;
  if (p.length > 240) {
    try {
      process.stderr.write(
        `stop-pre-emission-check: warning: path approaches platform limit: ${p}\n`
      );
    } catch { /* ignore */ }
  }
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code !== 'ENOENT') {
      try {
        process.stderr.write(
          `stop-pre-emission-check: read failure (${code}) on ${p}\n`
        );
      } catch { /* ignore */ }
    }
    return null;
  }
}

function safeMkdir(dir) {
  if (!dir || typeof dir !== 'string') return false;
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code === 'EEXIST') return true;
    try {
      process.stderr.write(
        `stop-pre-emission-check: mkdir failure (${code}) on ${dir}\n`
      );
    } catch { /* ignore */ }
    return false;
  }
}

function safeAppendJsonl(targetPath, record) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  if (targetPath.includes('..')) return false;
  const dir = path.dirname(targetPath);
  if (!safeMkdir(dir)) return false;
  // We use append-with-retry for EBUSY rather than rename, because JSONL
  // appends are individual-line and the agent may emit many concurrently.
  // fs.appendFileSync is atomic-per-write on POSIX for small writes (< PIPE_BUF
  // on Linux is 4096 bytes); our records are well under that. On Windows,
  // EBUSY can fire; retry up to 3x with backoff.
  const line = JSON.stringify(record) + '\n';
  const delays = [0, 50, 200, 1000];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) {
      const until = Date.now() + delays[i];
      // Busy-wait briefly; no setTimeout in a sync hook context.
      while (Date.now() < until) { /* spin */ }
    }
    try {
      fs.appendFileSync(targetPath, line, 'utf8');
      return true;
    } catch (err) {
      const code = (err && err.code) || 'EUNKNOWN';
      if (code === 'EBUSY' || code === 'ETXTBSY') continue;
      if (code === 'ENOSPC' || code === 'EMFILE' || code === 'ENFILE') {
        try {
          process.stderr.write(
            `stop-pre-emission-check: append degraded (${code}); dropping log line\n`
          );
        } catch { /* ignore */ }
        return false;
      }
      try {
        process.stderr.write(
          `stop-pre-emission-check: append failure (${code}) on ${targetPath}\n`
        );
      } catch { /* ignore */ }
      return false;
    }
  }
  return false;
}

// -- stdin reader -----------------------------------------------------------

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

// -- transcript helpers ----------------------------------------------------

function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !safeExists(transcriptPath)) return '';
  const raw = safeReadFile(transcriptPath);
  if (!raw) return '';
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
      .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text);
    if (texts.length > 0) return texts.join('\n');
  }
  return '';
}

// -- scan -------------------------------------------------------------------

function scan(text) {
  if (!text) return [];
  const findings = [];
  for (const pat of PATTERNS) {
    let match;
    // Reset regex state; the patterns are not global so we run one match per text.
    match = text.match(pat.re);
    if (!match) continue;
    const idx = match.index ?? text.indexOf(match[0]);
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + match[0].length + 60);
    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (snippet.length > 240) snippet = snippet.slice(0, 240) + '…';
    findings.push({
      risk_class: pat.risk_class,
      pattern: pat.pattern,
      severity: pat.severity,
      description: pat.description,
      matched_text: match[0],
      snippet,
    });
  }
  return findings;
}

// -- log path ---------------------------------------------------------------

function getLogPath(payload) {
  // Prefer a per-project log under .claude/logs/ in the current cwd if it
  // exists and is writable; otherwise fall back to the user's home directory.
  const candidates = [];
  if (payload && typeof payload.cwd === 'string' && payload.cwd) {
    candidates.push(path.join(payload.cwd, '.claude', 'logs', 'actually-im-the-ahole-violations.jsonl'));
  }
  try {
    candidates.push(path.join(process.cwd(), '.claude', 'logs', 'actually-im-the-ahole-violations.jsonl'));
  } catch { /* ignore */ }
  candidates.push(path.join(os.homedir(), '.claude', 'logs', 'actually-im-the-ahole-violations.jsonl'));
  // Return the first candidate whose parent directory can be created.
  for (const c of candidates) {
    if (!c || c.length > 240) continue;
    return c;
  }
  return null;
}

// -- decision emitters ------------------------------------------------------

function pass() {
  process.stdout.write('{}');
}

function block(findings) {
  const lines = findings.map(
    (f) =>
      `  - [${f.risk_class}/${f.severity}] ${f.pattern}: "${f.matched_text}"`
  );
  const reason =
    `actually-im-the-ahole retrospective check: ${findings.length} pattern(s) detected in the just-emitted assistant turn.\n\n` +
    `Findings:\n${lines.join('\n')}\n\n` +
    `Per the actually-im-the-ahole skill, the disposition of agent-emitted R0/R10/R13 content is the user's authority, not the agent's. ` +
    `Surface the findings to the user with the failure preserved. Do NOT silently revise. ` +
    `If the failures genuinely require correction, identify them by quoted span, name the pattern, and wait for the user to direct disposition.`;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}

// -- main -------------------------------------------------------------------

(async () => {
  let payload = {};
  try {
    const raw = await readStdin();
    if (raw && raw.trim()) {
      payload = JSON.parse(raw);
    }
  } catch {
    // Malformed payload — pass through. The hook is a backstop, not a gatekeeper.
    return pass();
  }

  // Avoid recursion. If the Stop event was itself triggered by another Stop
  // hook (stop_hook_active), do not re-scan.
  if (payload && payload.stop_hook_active) return pass();

  const text = lastAssistantText(payload && payload.transcript_path);
  if (!text) return pass();

  const findings = scan(text);
  if (findings.length === 0) return pass();

  // Log every finding to JSONL.
  const logPath = getLogPath(payload);
  if (logPath) {
    const recordBase = {
      timestamp: new Date().toISOString(),
      session_id: (payload && payload.session_id) || null,
      transcript_path: (payload && payload.transcript_path) || null,
      hook: 'stop-pre-emission-check',
    };
    for (const f of findings) {
      safeAppendJsonl(logPath, Object.assign({}, recordBase, { finding: f }));
    }
  }

  // Promote to block only if the env opts in and any finding is severity H.
  const blockOnR0 = process.env.CLAUDE_ACTUALLY_IM_THE_AHOLE_BLOCK_ON_R0 === '1';
  const hasH = findings.some((f) => f.severity === 'H');
  if (blockOnR0 && hasH) {
    return block(findings.filter((f) => f.severity === 'H'));
  }

  // Otherwise the hook logs and passes through — the failure is already in the
  // transcript; surfacing to the user is the agent's responsibility on the
  // next turn per the actually-im-the-ahole skill.
  return pass();
})().catch(() => {
  // Catastrophic failure — pass through, do not crash the harness.
  try { pass(); } catch { /* ignore */ }
});
