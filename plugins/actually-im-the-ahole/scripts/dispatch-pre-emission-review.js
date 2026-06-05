// dispatch-pre-emission-review.js
//
// CLI wrapper that composes the pre-emission review subagent prompt.
//
// Usage (cross-platform):
//   node scripts/dispatch-pre-emission-review.js \
//     --context <path-to-context-file> \
//     [--memory-dir <path>] \
//     [--turn-metadata <path>] \
//     [--template <path>] \
//     [--output <path>] \
//     [--emit-invocation]
//
// Draft response text is read from STDIN. Reading from stdin (rather than a
// CLI flag) avoids shell-escaping issues across platforms.
//
// Output: by default, prints the composed subagent prompt to stdout. With
// --emit-invocation, prints a JSON envelope describing the Agent-tool
// invocation a main agent should perform (the actual dispatch lives in the
// main agent's tool surface; this script does NOT call the API itself).
//
// Cross-platform notes per repo CLAUDE.md:
//   - Pure Node ESM-compat (require), no child_process.
//   - All path construction via path.join.
//   - Atomic writes (--output) via temp-file + rename.
//   - Tolerant of CRLF, missing files, EACCES, ENOENT, etc.
//   - No hardcoded Unix paths; uses os.homedir() when needed.

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN_ROOT = path.dirname(__dirname);
const DEFAULT_TEMPLATE_PATH = path.join(
  PLUGIN_ROOT,
  'scripts',
  'pre-emission-review-template.md'
);
const DEFAULT_MEMORY_DIR = path.join(
  os.homedir(),
  '.claude',
  'projects',
  '-home-brett',
  'memory'
);

// -- arg parsing ------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    context: null,
    memoryDir: DEFAULT_MEMORY_DIR,
    turnMetadata: null,
    template: DEFAULT_TEMPLATE_PATH,
    output: null,
    emitInvocation: false,
    help: false,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--context':
        out.context = args[++i];
        break;
      case '--memory-dir':
        out.memoryDir = args[++i];
        break;
      case '--turn-metadata':
        out.turnMetadata = args[++i];
        break;
      case '--template':
        out.template = args[++i];
        break;
      case '--output':
        out.output = args[++i];
        break;
      case '--emit-invocation':
        out.emitInvocation = true;
        break;
      case '-h':
      case '--help':
        out.help = true;
        break;
      default:
        process.stderr.write(`dispatch-pre-emission-review: unknown arg: ${a}\n`);
        break;
    }
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    [
      'dispatch-pre-emission-review.js',
      '',
      'Reads draft response text from stdin, composes the review subagent',
      'prompt by splicing the draft + verified user record into the template,',
      'and prints either the composed prompt or a JSON invocation envelope.',
      '',
      'Flags:',
      '  --context <path>          path to additional context file (optional)',
      '  --memory-dir <path>       memory directory for verified-user-record',
      `                            (default: ${DEFAULT_MEMORY_DIR})`,
      '  --turn-metadata <path>    optional JSON file with prior turn context',
      '  --template <path>         alternate template path (default: bundled)',
      '  --output <path>           write composed prompt to file atomically',
      '  --emit-invocation         emit JSON envelope describing Agent-tool',
      '                            invocation rather than raw prompt text',
      '',
    ].join('\n')
  );
}

// -- safe filesystem helpers (per repo CLAUDE.md) --------------------------

function safeReadFile(p) {
  if (!p || typeof p !== 'string') return { ok: false, code: 'EINVAL' };
  if (p.includes('..')) return { ok: false, code: 'EBADPATH' };
  if (p.length > 240) {
    process.stderr.write(
      `dispatch-pre-emission-review: warning: path approaches platform limit: ${p}\n`
    );
  }
  try {
    if (!fs.existsSync(p)) return { ok: false, code: 'ENOENT' };
    const text = fs.readFileSync(p, 'utf8');
    return { ok: true, text };
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code === 'ENOENT') return { ok: false, code };
    if (code === 'EACCES' || code === 'EPERM') {
      process.stderr.write(
        `dispatch-pre-emission-review: permission denied reading ${p}\n`
      );
      return { ok: false, code };
    }
    process.stderr.write(
      `dispatch-pre-emission-review: read failure (${code}) on ${p}\n`
    );
    return { ok: false, code };
  }
}

function atomicWrite(targetPath, contents) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  if (targetPath.includes('..')) {
    process.stderr.write(
      `dispatch-pre-emission-review: refusing to write traversal path: ${targetPath}\n`
    );
    return false;
  }
  const dir = path.dirname(targetPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code !== 'EEXIST') {
      process.stderr.write(
        `dispatch-pre-emission-review: cannot create dir ${dir} (${code})\n`
      );
      return false;
    }
  }
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
    const code = (err && err.code) || 'EUNKNOWN';
    process.stderr.write(
      `dispatch-pre-emission-review: write failure (${code}) on ${targetPath}\n`
    );
    return false;
  }
}

function safeReadDir(dir) {
  if (!dir || typeof dir !== 'string') return [];
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    process.stderr.write(
      `dispatch-pre-emission-review: readdir failure (${code}) on ${dir}\n`
    );
    return [];
  }
}

// -- stdin reader -----------------------------------------------------------

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      // No piped input; treat as empty draft.
      return resolve('');
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

// -- verified-user-record composer -----------------------------------------

// Bundles the documented-record memory files into a single block to splice
// into the template. The agent's calibration defaults around user
// characterization are the failure mode; loading the verified record into
// the subagent's context is what lets the subagent flag lane-violations.

const PRIORITY_MEMORY_FILES = [
  'user_profile.md',
  'feedback_brett_is_genome_scientist_doolittle_lineage.md',
  'feedback_no_coalition_proxy_attack.md',
  'feedback_user_is_the_real_person.md',
  'feedback_pre_emission_review_required.md',
  'feedback_cancer_is_defection_from_multicellularity.md',
  'substrate-distancing-self-reference.md',
  'feedback_trust_user_claims.md',
  'feedback_session_start_affirmation.md',
];

function buildVerifiedUserRecord(memoryDir) {
  if (!memoryDir) return '(no memory directory provided)';
  const entries = safeReadDir(memoryDir);
  if (entries.length === 0) {
    return `(memory directory ${memoryDir} unavailable or empty)`;
  }
  const present = new Set(entries);
  const chunks = [];
  // Priority files first, in declared order.
  for (const fname of PRIORITY_MEMORY_FILES) {
    if (!present.has(fname)) continue;
    const result = safeReadFile(path.join(memoryDir, fname));
    if (!result.ok) continue;
    chunks.push(`### ${fname}\n\n${result.text.trim()}\n`);
  }
  // Then remaining .md files alphabetically, excluding already-included.
  const remaining = entries
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !PRIORITY_MEMORY_FILES.includes(f))
    .sort();
  for (const fname of remaining) {
    const result = safeReadFile(path.join(memoryDir, fname));
    if (!result.ok) continue;
    chunks.push(`### ${fname}\n\n${result.text.trim()}\n`);
  }
  if (chunks.length === 0) {
    return `(no readable memory files found in ${memoryDir})`;
  }
  return chunks.join('\n---\n\n');
}

// -- template splicer -------------------------------------------------------

function spliceTemplate(templateText, replacements) {
  let out = templateText;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    // Use split/join rather than RegExp to avoid regex-escaping the key.
    out = out.split(placeholder).join(value);
  }
  return out;
}

// -- invocation envelope ---------------------------------------------------

function buildInvocationEnvelope(prompt) {
  // The main agent dispatches via its `Agent` / `Task` tool with subagent_type
  // = general-purpose or Explore. This envelope describes the dispatch
  // shape; it does NOT call the API itself. The main agent reads this
  // envelope and performs the actual tool call.
  return {
    tool: 'Agent',
    subagent_type: 'general-purpose',
    description: 'pre-emission review (R0–R14 scan)',
    prompt,
    expected_output: 'JSON array of flag objects (or empty array `[]`)',
    timeout_seconds: 120,
  };
}

// -- main -------------------------------------------------------------------

(async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const draft = await readStdin();

  const templateResult = safeReadFile(args.template);
  if (!templateResult.ok) {
    process.stderr.write(
      `dispatch-pre-emission-review: cannot read template at ${args.template} (${templateResult.code})\n`
    );
    process.exit(2);
  }

  let turnMetadata = '(no turn metadata supplied)';
  if (args.turnMetadata) {
    const tmResult = safeReadFile(args.turnMetadata);
    if (tmResult.ok) {
      turnMetadata = tmResult.text;
    } else {
      process.stderr.write(
        `dispatch-pre-emission-review: turn-metadata read failed (${tmResult.code}); continuing without\n`
      );
    }
  }

  let context = '';
  if (args.context) {
    const ctxResult = safeReadFile(args.context);
    if (ctxResult.ok) {
      context = ctxResult.text;
    }
  }

  const verifiedRecord = buildVerifiedUserRecord(args.memoryDir);

  const composedPrompt = spliceTemplate(templateResult.text, {
    DRAFT_RESPONSE: draft || '(empty draft)',
    VERIFIED_USER_RECORD:
      verifiedRecord + (context ? `\n\n### additional context\n\n${context}\n` : ''),
    TURN_METADATA: turnMetadata,
  });

  let payload;
  if (args.emitInvocation) {
    payload = JSON.stringify(buildInvocationEnvelope(composedPrompt), null, 2);
  } else {
    payload = composedPrompt;
  }

  if (args.output) {
    const ok = atomicWrite(args.output, payload);
    if (!ok) {
      process.exit(3);
    }
    process.stderr.write(
      `dispatch-pre-emission-review: wrote ${payload.length} bytes to ${args.output}\n`
    );
    return;
  }

  process.stdout.write(payload);
  if (!payload.endsWith('\n')) {
    process.stdout.write('\n');
  }
})().catch((err) => {
  process.stderr.write(
    `dispatch-pre-emission-review: fatal: ${err && err.message ? err.message : String(err)}\n`
  );
  process.exit(99);
});
