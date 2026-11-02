// Tests for hooks/kontentkop-agent-output.js. Run with:
//   node --test plugins/kontentkop-agent-output/tests/hook.test.js
// Uses only node:test, node:assert and the standard library.
//
// The real KontentKop binary is not used here. Process handling is exercised
// against tests/fixtures/fake-scorer.js (run through process.execPath so it
// works on every platform), which reproduces KontentKop's output contract
// only. scripts/score-fixtures.js runs the fixtures through a real build.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'kontentkop-agent-output.js');
const FAKE = path.join(__dirname, 'fixtures', 'fake-scorer.js');
const hook = require(HOOK_PATH);
const { fixtures } = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'replies.json'), 'utf8'));

function tmpDir(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-agent-output-'));
  t.after(() => { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ } });
  return d;
}

function readLog(dir) {
  const p = path.join(dir, 'agent-output.jsonl');
  return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

// A runScorer that runs the fake scorer for real (spawnSync, stdin, no shell).
function fakeRunner(mode, extraEnv) {
  return (scorer, text, env) => hook.runScorer(
    { bin: process.execPath, args: [FAKE], cwd: scorer.cwd },
    text,
    Object.assign({}, env, extraEnv || {}),
  );
}

// spawnSync's child inherits process.env; set the fake's mode there for the call.
function withFakeEnv(vars, fn) {
  const saved = {};
  for (const k of Object.keys(vars)) { saved[k] = process.env[k]; process.env[k] = vars[k]; }
  try { return fn(); } finally {
    for (const k of Object.keys(vars)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
}

function envFor(logDir, extra) {
  // KONTENTKOP_BIN must exist as a file for resolveScorer; the fake file does.
  return Object.assign({ KONTENTKOP_BIN: FAKE, KONTENTKOP_AGENT_OUTPUT_LOG_DIR: logDir }, extra || {});
}

// ── parsing the hook input ──────────────────────────────────────────────

test('reads last_assistant_message from a Stop payload', () => {
  const r = hook.extractReply({ hook_event_name: 'Stop', last_assistant_message: 'hello' });
  assert.deepEqual(r, { text: 'hello', source: 'last_assistant_message' });
});

test('falls back to the transcript, CRLF line endings, last assistant text record', (t) => {
  const d = tmpDir(t);
  const tp = path.join(d, 't.jsonl');
  const recs = [
    { type: 'user', message: { content: 'q' } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'first' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'second' }, { type: 'tool_use', name: 'Bash' }] } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read' }] } },
  ];
  fs.writeFileSync(tp, recs.map((x) => JSON.stringify(x)).join('\r\n') + '\r\nnot json\r\n');
  const r = hook.extractReply({ hook_event_name: 'Stop', transcript_path: tp });
  assert.deepEqual(r, { text: 'second', source: 'transcript_path' });
});

test('SubagentStop prefers agent_transcript_path over transcript_path', (t) => {
  const d = tmpDir(t);
  const main = path.join(d, 'main.jsonl');
  const sub = path.join(d, 'sub.jsonl');
  fs.writeFileSync(main, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'parent' }] } }) + '\n');
  fs.writeFileSync(sub, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'child' }] } }) + '\n');
  const r = hook.extractReply({ hook_event_name: 'SubagentStop', transcript_path: main, agent_transcript_path: sub });
  assert.deepEqual(r, { text: 'child', source: 'agent_transcript_path' });
});

test('missing, relative and traversal transcript paths yield no text', () => {
  assert.equal(hook.extractReply({ transcript_path: path.join(os.tmpdir(), 'no-such-kk-file.jsonl') }).text, '');
  assert.equal(hook.extractReply({ transcript_path: 'relative.jsonl' }).text, '');
  assert.equal(hook.extractReply({ transcript_path: path.join(os.tmpdir(), '..', 'x.jsonl') }).text, '');
  assert.equal(hook.extractReply(null).text, '');
});

// ── parsing the scorer output ───────────────────────────────────────────

test('parses the Go summary line (,BC=) and the annotated text', () => {
  const out = '[dark_triad=0.10,evasion=0.50,toxicity=0.00,BC=0.64] Text exceeds BC threshold [see: KK.md]; revise or respond with #appeal\r\n\r\n{==x==}{>>evasion=0.50: y<<}\r\n';
  const p = hook.parseScorerOutput(out);
  assert.equal(p.flagged, true);
  assert.equal(p.bc, 0.64);
  assert.deepEqual(p.scores, { dark_triad: 0.10, evasion: 0.50, toxicity: 0.00 });
  assert.equal(p.annotated, '{==x==}{>>evasion=0.50: y<<}');
});

test('parses the README spec summary line (:BC=)', () => {
  const p = hook.parseScorerOutput('[evasion=0.08,toxicity=0.55:BC=0.64] Text exceeds BC threshold [see: KK.md]; revise or respond with #appeal\n\nann');
  assert.equal(p.bc, 0.64);
  assert.equal(p.scores.toxicity, 0.55);
});

test('echoed input (below scorer threshold) is not flagged and has no scores', () => {
  const p = hook.parseScorerOutput('[not a summary] just text');
  assert.deepEqual(p, { flagged: false, bc: null, scores: null, summary: null, annotated: null });
});

// ── missing scorer must not fail the session ────────────────────────────

test('KONTENTKOP_BIN unset: pass through and log not-configured', (t) => {
  const d = tmpDir(t);
  const { decision, record } = hook.run({ hook_event_name: 'Stop', last_assistant_message: 'hi' }, { KONTENTKOP_AGENT_OUTPUT_LOG_DIR: d, KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.1' });
  assert.deepEqual(decision, {});
  assert.equal(record.scorer.status, 'not-configured');
  assert.equal(readLog(d)[0].scorer.status, 'not-configured');
});

test('KONTENTKOP_BIN pointing nowhere: pass through and log not-found', (t) => {
  const d = tmpDir(t);
  const { decision, record } = hook.run({ hook_event_name: 'Stop', last_assistant_message: 'hi' }, envFor(d, { KONTENTKOP_BIN: path.join(d, 'nope', 'kontentkop') }));
  assert.deepEqual(decision, {});
  assert.equal(record.scorer.status, 'not-found');
});

test('relative KONTENTKOP_BIN is refused', (t) => {
  const d = tmpDir(t);
  const { record } = hook.run({ last_assistant_message: 'hi' }, envFor(d, { KONTENTKOP_BIN: 'kontentkop' }));
  assert.equal(record.scorer.status, 'not-absolute');
});

test('scorer that crashes or hangs: pass through, status logged', (t) => {
  const d = tmpDir(t);
  const payload = { hook_event_name: 'Stop', last_assistant_message: 'hi' };
  const env = envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.1', KONTENTKOP_TIMEOUT_MS: '500' });
  const crash = withFakeEnv({ FAKE_KK_MODE: 'crash' }, () => hook.run(payload, env, { runScorer: fakeRunner() }));
  assert.deepEqual(crash.decision, {});
  assert.equal(crash.record.scorer.exit_code, 3);
  assert.match(crash.record.scorer.stderr, /crashed/);
  const hang = withFakeEnv({ FAKE_KK_MODE: 'hang' }, () => hook.run(payload, env, { runScorer: fakeRunner() }));
  assert.deepEqual(hang.decision, {});
  assert.ok(['timeout', 'killed'].includes(hang.record.scorer.status), hang.record.scorer.status);
});

test('whole hook as a subprocess with no scorer prints {} and exits 0', (t) => {
  const d = tmpDir(t);
  const env = Object.assign({}, process.env, { KONTENTKOP_AGENT_OUTPUT_LOG_DIR: d });
  delete env.KONTENTKOP_BIN;
  const res = childProcess.spawnSync(process.execPath, [HOOK_PATH], {
    input: JSON.stringify({ hook_event_name: 'Stop', session_id: 's1', last_assistant_message: 'hi' }),
    encoding: 'utf8', env, timeout: 10000,
  });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout, '{}');
  assert.equal(readLog(d)[0].session_id, 's1');
});

test('whole hook as a subprocess with garbage stdin prints {} and exits 0', () => {
  const res = childProcess.spawnSync(process.execPath, [HOOK_PATH], { input: 'not json', encoding: 'utf8', timeout: 10000 });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout, '{}');
});

// ── logging ─────────────────────────────────────────────────────────────

test('logs scores, BC and annotation; creates the log directory', (t) => {
  const d = path.join(tmpDir(t), 'nested', 'state');
  const { record, logPath } = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.40' }, () =>
    hook.run({ hook_event_name: 'SubagentStop', agent_id: 'a1', agent_type: 'Explore', last_assistant_message: 'The real question is something else.' },
      envFor(d), { runScorer: fakeRunner() }));
  assert.equal(logPath, path.join(d, 'agent-output.jsonl'));
  const [rec] = readLog(d);
  assert.equal(rec.flagged, true);
  assert.equal(rec.bc, 0.40);
  assert.equal(rec.scores.evasion, 0.50);
  assert.match(rec.annotated, /^\{==The real question is something else\.==\}\{>>evasion=0\.50/);
  assert.equal(rec.agent_type, 'Explore');
  assert.equal(rec.blocked, false);
  assert.equal(record.reply_sha256.length, 64);
});

test('scorer runs from KONTENTKOP_CONFIG_DIR when given, else from the binary directory', (t) => {
  const d = tmpDir(t);
  const cfg = tmpDir(t);
  const a = withFakeEnv({ FAKE_KK_MODE: 'cwd' }, () => hook.run({ last_assistant_message: 'x' }, envFor(d, { KONTENTKOP_CONFIG_DIR: cfg }), { runScorer: fakeRunner() }));
  assert.equal(fs.realpathSync(a.record.annotated), fs.realpathSync(cfg));
  const b = withFakeEnv({ FAKE_KK_MODE: 'cwd' }, () => hook.run({ last_assistant_message: 'x' }, envFor(d), { runScorer: fakeRunner() }));
  assert.equal(fs.realpathSync(b.record.annotated), fs.realpathSync(path.dirname(FAKE)));
});

test('state directory defaults per platform', () => {
  assert.equal(hook.stateDir({}, 'linux', path.join(path.sep, 'h')), path.join(path.sep, 'h', '.local', 'state', 'kontentkop-agent-output'));
  assert.equal(hook.stateDir({ XDG_STATE_HOME: path.join(path.sep, 's') }, 'darwin', path.join(path.sep, 'h')), path.join(path.sep, 's', 'kontentkop-agent-output'));
  const lad = path.resolve('LocalAppData');
  assert.equal(hook.stateDir({ LOCALAPPDATA: lad }, 'win32', 'ignored'), path.join(lad, 'kontentkop-agent-output'));
});

test('unwritable log location does not fail the hook', (t) => {
  const d = tmpDir(t);
  const blocker = path.join(d, 'file');
  fs.writeFileSync(blocker, 'x');
  const { decision, record } = hook.run({ last_assistant_message: 'hi' }, { KONTENTKOP_AGENT_OUTPUT_LOG_DIR: path.join(blocker, 'sub') });
  assert.deepEqual(decision, {});
  assert.equal(record.logged, false);
});

// ── blocking only when told to ──────────────────────────────────────────

test('flagged reply does not block when KONTENTKOP_AGENT_OUTPUT_BLOCK_AT is unset', (t) => {
  const d = tmpDir(t);
  const { decision } = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.90' }, () =>
    hook.run({ last_assistant_message: 'x' }, envFor(d), { runScorer: fakeRunner() }));
  assert.deepEqual(decision, {});
});

test('blocks at or above the threshold, with the annotated text in the reason', (t) => {
  const d = tmpDir(t);
  const { decision, record } = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.60' }, () =>
    hook.run({ last_assistant_message: 'I have deleted the legacy directory.' }, envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.60' }), { runScorer: fakeRunner() }));
  assert.equal(decision.decision, 'block');
  assert.match(decision.reason, /BC=0\.60/);
  assert.match(decision.reason, /\{==I have deleted the legacy directory\.==\}/);
  assert.match(decision.reason, /kontentkop-agent-output` skill/);
  assert.equal(record.blocked, true);
  assert.equal(readLog(d)[0].blocked, true);
});

test('does not block below the threshold', (t) => {
  const d = tmpDir(t);
  const { decision } = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.30' }, () =>
    hook.run({ last_assistant_message: 'x' }, envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.5' }), { runScorer: fakeRunner() }));
  assert.deepEqual(decision, {});
});

test('does not block a second time while stop_hook_active is set', (t) => {
  const d = tmpDir(t);
  const { decision, record } = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.90' }, () =>
    hook.run({ stop_hook_active: true, last_assistant_message: 'x' }, envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.5' }), { runScorer: fakeRunner() }));
  assert.deepEqual(decision, {});
  assert.equal(record.flagged, true);
});

test('invalid block thresholds leave blocking off', () => {
  for (const v of ['', 'yes', '0', '-1', '1.5', 'NaN']) assert.equal(hook.blockThreshold({ KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: v }), null, v);
  assert.equal(hook.blockThreshold({ KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: ' 0.55 ' }), 0.55);
  assert.equal(hook.blockThreshold({}), null);
});

// ── the nine pattern fixtures and the clean reply ───────────────────────

test('fixture set has the nine patterns and one clean reply', () => {
  assert.deepEqual(fixtures.map((f) => f.pattern), [1, 2, 3, 4, 5, 6, 7, 8, 9, null]);
});

for (const f of fixtures) {
  test(`fixture ${f.id}: reply reaches the scorer intact, is logged, blocks only when told to`, (t) => {
    const d = tmpDir(t);
    const payload = { hook_event_name: 'Stop', session_id: f.id, last_assistant_message: f.reply };

    // pass-through scorer: echo means the exact reply went in on stdin
    const passRun = withFakeEnv({ FAKE_KK_MODE: 'pass' }, () => hook.run(payload, envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.5' }), { runScorer: fakeRunner() }));
    assert.deepEqual(passRun.decision, {});
    assert.equal(passRun.record.flagged, false);

    // flagging scorer, blocking off
    const offRun = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.70' }, () => hook.run(payload, envFor(d), { runScorer: fakeRunner() }));
    assert.deepEqual(offRun.decision, {});
    assert.ok(offRun.record.annotated.includes(f.reply), 'annotation carries the full reply');

    // flagging scorer, blocking on
    const onRun = withFakeEnv({ FAKE_KK_MODE: 'flag', FAKE_KK_BC: '0.70' }, () => hook.run(payload, envFor(d, { KONTENTKOP_AGENT_OUTPUT_BLOCK_AT: '0.5' }), { runScorer: fakeRunner() }));
    assert.equal(onRun.decision.decision, 'block');
    assert.ok(onRun.decision.reason.includes(f.reply));

    const log = readLog(d);
    assert.equal(log.length, 3);
    assert.ok(log.every((r) => r.session_id === f.id && r.reply_chars === f.reply.length));
    assert.deepEqual(log.map((r) => r.blocked), [false, false, true]);
  });
}

test('scorer runs from the plugin config dir when CLAUDE_PLUGIN_ROOT is set and no KONTENTKOP_CONFIG_DIR', (t) => {
  const d = tmpDir(t);
  const root = path.resolve(__dirname, '..');
  assert.ok(fs.existsSync(path.join(root, 'config', 'config.yaml')), 'plugin config.yaml exists');
  const r = withFakeEnv({ FAKE_KK_MODE: 'cwd' }, () => hook.run({ last_assistant_message: 'x' }, envFor(d, { CLAUDE_PLUGIN_ROOT: root }), { runScorer: fakeRunner() }));
  assert.equal(fs.realpathSync(r.record.annotated), fs.realpathSync(path.join(root, 'config')));
});
