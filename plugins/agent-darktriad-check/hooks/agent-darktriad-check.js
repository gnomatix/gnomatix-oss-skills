// agent-darktriad-check.js — Stop / SubagentStop hook
//
// Runs Brett Whitty's KontentKop scorer (github.com/brettwhitty/KontentKop-Bake-Off)
// over the agent's own last reply, not over the user's prompt, and logs the
// result: per-metric scores, Body Count (BC) and the CriticMarkup annotation.
//
// Default: log and pass through. Setting AGENT_DARKTRIAD_CHECK_BLOCK_AT to a
// number in (0, 1] blocks the stop when the parsed BC is at or above that
// number, and returns the annotated reply as the block reason so the agent
// sees exactly which regions were flagged.
//
// Environment:
//   KONTENTKOP_BIN                    absolute path to a built KontentKop binary
//                                     (the root `main` package of the repo).
//                                     Unset or missing: the hook logs
//                                     `scorer: not-configured` / `not-found`
//                                     and passes through.
//   KONTENTKOP_CONFIG_DIR             directory the scorer is run from. The
//                                     scorer reads `config.yaml` from its
//                                     working directory and falls back to its
//                                     built-in defaults. Default: the
//                                     directory that holds KONTENTKOP_BIN.
//   AGENT_DARKTRIAD_CHECK_BLOCK_AT  BC at or above which to block. Unset:
//                                     never block.
//   AGENT_DARKTRIAD_CHECK_LOG_DIR   absolute directory for the JSONL log.
//                                     Default: the user's state directory
//                                     (see stateDir below).
//   KONTENTKOP_TIMEOUT_MS             scorer timeout, default 15000.
//
// How KontentKop behaves (read from its main.go, not assumed):
//   - With no arguments it reads the text on stdin and trims it.
//   - BC below the config threshold: prints the input unchanged, exit 0,
//     and emits no scores at all.
//   - BC at or above the threshold: prints one summary line
//     `[dark_triad=0.00,...,toxicity=0.00,BC=0.64] Text exceeds BC threshold
//     [see: KK.md]; revise or respond with #appeal`, a blank line, then the
//     CriticMarkup-annotated text. Exit 0, or exit 1 if annotation failed
//     (summary and raw input are printed instead).
//
// Repo rules this file follows (gnomatix-oss-skills CLAUDE.md):
//   - Pure Node standard library, no dependencies.
//   - Every fs call wrapped; every failure degrades to pass-through.
//   - No hardcoded separators or Unix paths; CRLF-tolerant parsing.
//   - One deliberate exception, documented in the README and skill: the
//     scorer is a separate Go program, so it is run with
//     child_process.spawnSync — argv array, `shell: false`, text on stdin,
//     no shell interpolation of any kind. The CLAUDE.md prohibition is about
//     shell semantics leaking platform assumptions; spawnSync without a shell
//     does not go through a shell on any platform.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const childProcess = require('child_process');

const HOOK = 'agent-darktriad-check';
const MAX_REPLY_CHARS = 100000;
const MAX_STDERR_CHARS = 2000;
const PATH_WARN_LEN = 240;
const LOG_FILE = 'agent-output.jsonl';

// KontentKop's canonical metric keys (src/scorer.go MetricOrder).
const METRIC_KEYS = [
  'dark_triad', 'coercive_ctrl', 'liwc_anger', 'manipulation',
  'sycophancy', 'false_authority', 'gaslighting', 'learned_helpless',
  'emotional_manip', 'passive_aggr', 'condescension', 'evasion',
  'semantic_overload', 'false_empathy', 'toxicity',
];

// ── small utilities ──────────────────────────────────────────────────────

function warn(msg) {
  try { process.stderr.write(`${HOOK}: ${msg}\n`); } catch { /* ignore */ }
}

function sleepMs(ms) {
  // Synchronous sleep without a busy loop and without child_process.
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const until = Date.now() + ms;
    while (Date.now() < until) { /* fallback spin */ }
  }
}

// Pre-flight validation for any path we touch (CLAUDE.md "Pre-flight").
function validPath(p) {
  if (!p || typeof p !== 'string') return false;
  if (!path.isAbsolute(p)) return false;
  if (p.split(/[\\/]+/).includes('..')) return false;
  if (p.length > PATH_WARN_LEN) warn(`path approaches platform limit (${p.length} chars): ${p}`);
  return true;
}

function safeStat(p) {
  if (!validPath(p)) return null;
  try { return fs.statSync(p); } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code !== 'ENOENT' && code !== 'ENOTDIR') warn(`stat failure (${code}) on ${p}`);
    return null;
  }
}

function safeReadFile(p) {
  if (!validPath(p)) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (!fs.existsSync(p)) return null;
      return fs.readFileSync(p, 'utf8');
    } catch (err) {
      const code = (err && err.code) || 'EUNKNOWN';
      if (code === 'ENOENT') return null;
      if (attempt === 0 && (code === 'EBUSY' || code === 'EAGAIN')) { sleepMs(50); continue; }
      warn(`read failure (${code}) on ${p}`);
      return null;
    }
  }
  return null;
}

function safeMkdir(dir) {
  if (!validPath(dir)) return false;
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    const code = (err && err.code) || 'EUNKNOWN';
    if (code === 'EEXIST') return true;
    warn(`mkdir failure (${code}) on ${dir}`);
    return false;
  }
}

// Append one JSONL record. Appends rather than temp-file + rename because a
// log is many small independent lines; a rename would race between concurrent
// sessions and lose lines. Small appends are a single write call. EBUSY
// (Windows) gets the documented 50 / 200 / 1000 ms backoff; a missing
// directory is created and the append retried once.
function appendJsonl(targetPath, record) {
  if (!validPath(targetPath)) { warn(`refusing log path: ${targetPath}`); return false; }
  const dir = path.dirname(targetPath);
  if (!safeMkdir(dir)) return false;
  const line = JSON.stringify(record) + '\n';
  const delays = [0, 50, 200, 1000];
  let retriedMkdir = false;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) sleepMs(delays[i]);
    try {
      fs.appendFileSync(targetPath, line, 'utf8');
      return true;
    } catch (err) {
      const code = (err && err.code) || 'EUNKNOWN';
      if (code === 'EBUSY' || code === 'ETXTBSY' || code === 'EAGAIN') continue;
      if (code === 'ENOENT' && !retriedMkdir) { retriedMkdir = true; safeMkdir(dir); continue; }
      warn(`log append failure (${code}) on ${targetPath}`);
      return false;
    }
  }
  warn(`log append gave up after retries on ${targetPath}`);
  return false;
}

// ── state directory ─────────────────────────────────────────────────────

// Where logs go when AGENT_DARKTRIAD_CHECK_LOG_DIR is not set:
//   Windows:      %LOCALAPPDATA%\agent-darktriad-check
//   Linux/macOS:  $XDG_STATE_HOME/agent-darktriad-check, or
//                 ~/.local/state/agent-darktriad-check
function stateDir(env, platform, homedir) {
  const override = env.AGENT_DARKTRIAD_CHECK_LOG_DIR;
  if (override && path.isAbsolute(override)) return override;
  if (override) warn('AGENT_DARKTRIAD_CHECK_LOG_DIR is not absolute; using default');
  const home = homedir || env.HOME || env.USERPROFILE || '';
  if (platform === 'win32') {
    const base = env.LOCALAPPDATA && path.isAbsolute(env.LOCALAPPDATA)
      ? env.LOCALAPPDATA
      : path.join(home, 'AppData', 'Local');
    return path.join(base, HOOK);
  }
  const base = env.XDG_STATE_HOME && path.isAbsolute(env.XDG_STATE_HOME)
    ? env.XDG_STATE_HOME
    : path.join(home, '.local', 'state');
  return path.join(base, HOOK);
}

// ── reading the reply ────────────────────────────────────────────────────

function lastAssistantTextFromTranscript(transcriptPath) {
  const raw = safeReadFile(transcriptPath);
  if (!raw) return '';
  const lines = raw.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec || rec.type !== 'assistant') continue;
    const content = rec.message && rec.message.content;
    if (typeof content === 'string' && content.trim()) return content;
    if (!Array.isArray(content)) continue;
    const texts = content
      .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text);
    if (texts.length > 0) return texts.join('\n');
  }
  return '';
}

// The reply comes from `last_assistant_message` when the harness supplies it;
// otherwise from the transcript file (`agent_transcript_path` for a subagent,
// then `transcript_path`), last assistant record with text.
function extractReply(payload) {
  if (!payload || typeof payload !== 'object') return { text: '', source: 'none' };
  const direct = payload.last_assistant_message;
  if (typeof direct === 'string' && direct.trim()) return { text: direct, source: 'last_assistant_message' };
  if (payload.hook_event_name === 'SubagentStop' && payload.agent_transcript_path) {
    const t = lastAssistantTextFromTranscript(payload.agent_transcript_path);
    if (t) return { text: t, source: 'agent_transcript_path' };
  }
  if (payload.transcript_path) {
    const t = lastAssistantTextFromTranscript(payload.transcript_path);
    if (t) return { text: t, source: 'transcript_path' };
  }
  return { text: '', source: 'none' };
}

// ── locating and running the scorer ─────────────────────────────────────

function resolveScorer(env) {
  const bin = env.KONTENTKOP_BIN;
  if (!bin) return { status: 'not-configured', bin: null };
  if (!path.isAbsolute(bin)) return { status: 'not-absolute', bin };
  const st = safeStat(bin);
  if (!st || !st.isFile()) return { status: 'not-found', bin };
  let cwd = path.dirname(bin);
  if (env.KONTENTKOP_CONFIG_DIR) {
    const cst = safeStat(env.KONTENTKOP_CONFIG_DIR);
    if (cst && cst.isDirectory()) cwd = env.KONTENTKOP_CONFIG_DIR;
    else warn(`KONTENTKOP_CONFIG_DIR is not a directory; running scorer from ${cwd}`);
  }
  return { status: 'ok', bin, cwd };
}

function runScorer(scorer, text, env) {
  const t = parseInt(env.KONTENTKOP_TIMEOUT_MS, 10);
  const timeout = Number.isFinite(t) && t > 0 ? t : 15000;
  let res;
  try {
    // `scorer.args` is never set from the environment; the tests use it to
    // run a Node test double through process.execPath on every platform.
    res = childProcess.spawnSync(scorer.bin, Array.isArray(scorer.args) ? scorer.args : [], {
      input: text,
      cwd: scorer.cwd,
      encoding: 'utf8',
      timeout,
      shell: false,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    return { status: 'spawn-error', error: String(err && err.message || err) };
  }
  if (res.error) {
    const code = res.error.code || '';
    return { status: code === 'ETIMEDOUT' ? 'timeout' : 'spawn-error', error: String(res.error.message || code) };
  }
  if (res.signal) return { status: 'killed', signal: res.signal, stderr: trimStderr(res.stderr) };
  return { status: 'ran', exitCode: res.status, stdout: res.stdout || '', stderr: trimStderr(res.stderr) };
}

function trimStderr(s) {
  if (!s) return '';
  return s.length > MAX_STDERR_CHARS ? s.slice(0, MAX_STDERR_CHARS) + '…' : s;
}

// ── parsing the scorer's output ──────────────────────────────────────────

// Accepts the Go implementation's `,BC=` and the README spec's `:BC=`.
const SUMMARY_RE = /^\[([^\]]*)\]\s*Text exceeds BC threshold/;

function parseScorerOutput(stdout) {
  const out = { flagged: false, bc: null, scores: null, summary: null, annotated: null };
  if (typeof stdout !== 'string' || !stdout) return out;
  const lines = stdout.split(/\r?\n/);
  const first = lines[0] || '';
  const m = first.match(SUMMARY_RE);
  if (!m) return out; // below the scorer's own threshold: it echoed the input
  out.flagged = true;
  out.summary = first;
  const scores = {};
  for (const part of m[1].split(/[,:]/)) {
    const kv = part.trim().match(/^([A-Za-z_]+)=([0-9]*\.?[0-9]+)$/);
    if (!kv) continue;
    const val = parseFloat(kv[2]);
    if (!Number.isFinite(val)) continue;
    if (kv[1] === 'BC') out.bc = val;
    else scores[kv[1]] = val;
  }
  out.scores = scores;
  // Annotated text follows the first blank line after the summary.
  let i = 1;
  while (i < lines.length && lines[i].trim() !== '') i++;
  out.annotated = lines.slice(i + 1).join('\n').replace(/\s+$/, '') || null;
  return out;
}

// ── decision ────────────────────────────────────────────────────────────

function blockThreshold(env) {
  const raw = env.AGENT_DARKTRIAD_CHECK_BLOCK_AT;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const v = Number(String(raw).trim());
  if (!Number.isFinite(v) || v <= 0 || v > 1) {
    warn(`AGENT_DARKTRIAD_CHECK_BLOCK_AT=${raw} is not a number in (0, 1]; blocking stays off`);
    return null;
  }
  return v;
}

function shouldBlock(parsed, threshold, payload) {
  if (threshold === null) return false;
  if (payload && payload.stop_hook_active) return false; // never loop
  return !!(parsed && parsed.flagged && typeof parsed.bc === 'number' && parsed.bc >= threshold);
}

function blockReason(parsed, threshold) {
  return [
    `${HOOK}: KontentKop scored your last reply at BC=${parsed.bc.toFixed(2)} (block threshold ${threshold}).`,
    '',
    'Scorer summary:',
    parsed.summary,
    '',
    'Your reply, annotated by KontentKop (CriticMarkup: {==flagged==}{>>metric=score: rationale<<}, {~~old~>suggested~~}):',
    '',
    parsed.annotated || '(scorer returned no annotation)',
    '',
    'Check each flagged region against the nine patterns in the `agent-darktriad-check` skill.',
    'If a region is a real evasion, rewrite the reply without it. If it is a false positive',
    '(for example, a plain report of an action the user authorised trips false_authority\'s',
    '"unilateral action" pattern), say so to the user in one line and continue.',
  ].join('\n');
}

// ── main ────────────────────────────────────────────────────────────────

function run(payload, env, opts) {
  const o = opts || {};
  const platform = o.platform || process.platform;
  const homedir = o.homedir !== undefined ? o.homedir : safeHomedir();
  const scorerRunner = o.runScorer || runScorer;
  const now = o.now || (() => new Date().toISOString());

  const reply = extractReply(payload);
  const record = {
    ts: now(),
    hook_event_name: payload.hook_event_name || null,
    session_id: payload.session_id || null,
    agent_id: payload.agent_id || null,
    agent_type: payload.agent_type || null,
    cwd: payload.cwd || null,
    reply_source: reply.source,
    reply_chars: reply.text.length,
    reply_truncated: reply.text.length > MAX_REPLY_CHARS,
    reply_sha256: reply.text ? crypto.createHash('sha256').update(reply.text, 'utf8').digest('hex') : null,
    scorer: null,
    flagged: false,
    bc: null,
    scores: null,
    summary: null,
    annotated: null,
    blocked: false,
  };

  let decision = {};
  if (!reply.text.trim()) {
    record.scorer = { status: 'no-reply-text' };
  } else {
    const scorer = resolveScorer(env);
    if (scorer.status !== 'ok') {
      record.scorer = { status: scorer.status, bin: scorer.bin };
    } else {
      const text = reply.text.length > MAX_REPLY_CHARS ? reply.text.slice(0, MAX_REPLY_CHARS) : reply.text;
      const res = scorerRunner(scorer, text, env);
      record.scorer = { status: res.status, bin: scorer.bin, cwd: scorer.cwd };
      if (res.exitCode !== undefined) record.scorer.exit_code = res.exitCode;
      if (res.error) record.scorer.error = res.error;
      if (res.signal) record.scorer.signal = res.signal;
      if (res.stderr) record.scorer.stderr = res.stderr;
      if (res.status === 'ran') {
        const parsed = parseScorerOutput(res.stdout);
        record.flagged = parsed.flagged;
        record.bc = parsed.bc;
        record.scores = parsed.scores;
        record.summary = parsed.summary;
        record.annotated = parsed.annotated;
        const threshold = blockThreshold(env);
        record.block_at = threshold;
        if (shouldBlock(parsed, threshold, payload)) {
          record.blocked = true;
          decision = { decision: 'block', reason: blockReason(parsed, threshold) };
        }
      }
    }
  }

  const logPath = path.join(stateDir(env, platform, homedir), LOG_FILE);
  record.logged = appendJsonl(logPath, record);
  return { decision, record, logPath };
}

function safeHomedir() {
  try { return os.homedir(); } catch { return ''; }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch {
      resolve(data);
    }
  });
}

async function main() {
  let decision = {};
  try {
    let payload;
    try { payload = JSON.parse(await readStdin()); } catch { payload = null; }
    if (payload && typeof payload === 'object') decision = run(payload, process.env).decision;
  } catch (err) {
    warn(`unexpected error, passing through: ${err && err.stack || err}`);
    decision = {};
  }
  try { process.stdout.write(JSON.stringify(decision)); } catch { /* ignore */ }
}

if (require.main === module) {
  main();
} else {
  module.exports = {
    METRIC_KEYS,
    stateDir,
    extractReply,
    lastAssistantTextFromTranscript,
    resolveScorer,
    runScorer,
    parseScorerOutput,
    blockThreshold,
    shouldBlock,
    blockReason,
    appendJsonl,
    run,
  };
}
