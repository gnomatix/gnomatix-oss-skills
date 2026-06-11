// all-help-no-harm — example side-hook executor: per-clause violation check
//
// Invoked by the side-hook coordinator on the on_assistant_message trigger
// (or directly for testing). Spawns llama-cli once per numbered clause of
// the contract, asks the local model a Yes/No+confidence question, and
// appends one JSONL log line per clause to the configured output log.
//
// Pure Node ECMAScript per marketplace CLAUDE.md. child_process IS used
// here — this is the legitimate use (the local-inference spawn itself is
// the mechanism). All other fs / IO is built on Node-native primitives
// with full defensive try/catch and atomic-write semantics.
//
// Invocation (either form supported):
//
//   Argv form:
//     node llama-cpp-violation-check.js \
//          --message-file /tmp/msg.txt \
//          --contract-file /path/to/contract-text.js \
//          --llama-cli /path/to/llama-cli \
//          --model /path/to/qwen2.5-3b.gguf \
//          --output-log /path/to/log.jsonl \
//          [--threshold 0.5] [--threads 8] [--n-predict 32] \
//          [--n-ctx 4096] [--n-gpu-layers -1] [--temperature 0.0] \
//          [--seed 42] [--prompt-template "..."]
//
//   Stdin JSON form (coordinator-friendly):
//     node llama-cpp-violation-check.js --stdin-json
//     where stdin is a JSON object with the same keys as argv, plus
//     "message" (string) instead of "message_file".
//
// Exit codes:
//   0 — no violations detected (all 'no' verdicts, or any 'yes' below
//       the configured threshold)
//   2 — at least one clause flagged 'yes' at confidence >= threshold
//   3 — invocation error (missing args, unreadable files, missing binary)
//   4 — llama-cli execution failed for >= 1 clause (partial results still
//       written to log)
//
// JSONL line shape:
//   { "timestamp": "...", "session_id": "...", "clause_number": N,
//     "clause_text_sha256": "...", "verdict": "yes"|"no"|"unparsed",
//     "confidence": 0.NN | null, "model": "...", "binary": "...",
//     "prompt_sha256": "...", "raw_model_output": "...",
//     "wall_ms": N, "exit_code": N }

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

// ---------------------------------------------------------------------------
// fs helpers — every fs.* call wrapped per repo CLAUDE.md
// ---------------------------------------------------------------------------

function safeRead(p) {
  try {
    if (typeof p !== 'string' || p.length === 0) return null;
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    logStderr(`read failed for ${p}: ${err && err.code} ${err && err.message}`);
    return null;
  }
}

function safeStat(p) {
  try {
    if (typeof p !== 'string' || p.length === 0) return null;
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  try {
    if (typeof dir !== 'string' || dir.length === 0) return false;
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    const code = err && err.code;
    if (code === 'EEXIST') return true;
    logStderr(`mkdir failed for ${dir}: ${code} ${err && err.message}`);
    return false;
  }
}

function atomicAppendJsonl(targetPath, lineObj) {
  // Append-with-atomicity: read existing contents (if any), write the
  // combined contents to a temp file, rename over the original. Atomic on
  // POSIX, atomic-enough on Windows for the per-message logging cadence.
  const dir = path.dirname(targetPath);
  if (!ensureDir(dir)) return false;
  const line = JSON.stringify(lineObj) + '\n';

  // Fast path: O_APPEND is atomic for writes under PIPE_BUF on POSIX,
  // which JSONL lines are usually well under. Use it directly; fall
  // back to temp+rename on error.
  try {
    fs.appendFileSync(targetPath, line, { encoding: 'utf8' });
    return true;
  } catch (err) {
    const code = err && err.code;
    if (code !== 'EBUSY' && code !== 'ETXTBSY') {
      logStderr(`append failed for ${targetPath}: ${code} ${err && err.message}`);
    }
    // Fall through to temp+rename retry
  }

  // Temp+rename fallback (single retry)
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    let existing = '';
    if (fs.existsSync(targetPath)) {
      try { existing = fs.readFileSync(targetPath, 'utf8'); } catch { existing = ''; }
    }
    fs.writeFileSync(tmpPath, existing + line, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
    logStderr(`atomic append failed for ${targetPath}: ${err && err.message}`);
    return false;
  }
}

function logStderr(msg) {
  try { process.stderr.write(`[llama-cpp-violation-check] ${msg}\n`); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

// Expand ${HOME}, ${env.NAME}, and ${env.NAME:-default} placeholders in a
// path / string. Cross-platform: uses os.homedir() rather than $HOME so
// it works on Windows.
function expandPlaceholders(s) {
  if (typeof s !== 'string') return s;
  let out = s;
  out = out.replace(/\$\{HOME\}/g, os.homedir());
  // ${env.NAME:-default}
  out = out.replace(/\$\{env\.([A-Z0-9_]+):-([^}]*)\}/gi, (_m, name, def) => {
    return process.env[name] != null && process.env[name] !== ''
      ? process.env[name]
      : expandPlaceholders(def);
  });
  // ${env.NAME}
  out = out.replace(/\$\{env\.([A-Z0-9_]+)\}/gi, (_m, name) => {
    return process.env[name] != null ? process.env[name] : '';
  });
  return out;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgv(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || (typeof next === 'string' && next.startsWith('--'))) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function loadInput() {
  const argv = parseArgv(process.argv.slice(2));

  if (argv['stdin-json']) {
    let stdinBuf = '';
    // Synchronous stdin drain for simplicity (coordinator passes a small
    // JSON payload, not a stream). Wrap defensively.
    try {
      stdinBuf = fs.readFileSync(0, 'utf8');
    } catch (err) {
      logStderr(`stdin read failed: ${err && err.message}`);
      process.exit(3);
    }
    let parsed;
    try { parsed = JSON.parse(stdinBuf); } catch (err) {
      logStderr(`stdin JSON parse failed: ${err && err.message}`);
      process.exit(3);
    }
    return normalizeInput(parsed);
  }

  // Argv form
  return normalizeInput({
    message: argv['message-file'] ? safeRead(expandPlaceholders(argv['message-file'])) : argv.message,
    contract_file: argv['contract-file'],
    llama_cli: argv['llama-cli'],
    model: argv.model,
    output_log: argv['output-log'],
    threshold: argv.threshold,
    threads: argv.threads,
    n_predict: argv['n-predict'],
    n_ctx: argv['n-ctx'],
    n_gpu_layers: argv['n-gpu-layers'],
    temperature: argv.temperature,
    seed: argv.seed,
    prompt_template: argv['prompt-template'],
    session_id: argv['session-id'],
  });
}

function normalizeInput(raw) {
  const exp = (v) => (typeof v === 'string' ? expandPlaceholders(v) : v);
  return {
    message: typeof raw.message === 'string' ? raw.message : '',
    contract_file: exp(raw.contract_file || ''),
    llama_cli: exp(raw.llama_cli || ''),
    model: exp(raw.model || ''),
    output_log: exp(raw.output_log || ''),
    threshold: raw.threshold != null ? Number(raw.threshold) : 0.5,
    threads: raw.threads != null ? Number(raw.threads) : 8,
    n_predict: raw.n_predict != null ? Number(raw.n_predict) : 32,
    n_ctx: raw.n_ctx != null ? Number(raw.n_ctx) : 4096,
    n_gpu_layers: raw.n_gpu_layers != null ? Number(raw.n_gpu_layers) : -1,
    temperature: raw.temperature != null ? Number(raw.temperature) : 0.0,
    seed: raw.seed != null ? Number(raw.seed) : 42,
    prompt_template: typeof raw.prompt_template === 'string' && raw.prompt_template.length > 0
      ? raw.prompt_template
      : DEFAULT_PROMPT_TEMPLATE,
    session_id: raw.session_id || process.env.CLAUDE_SESSION_ID || 'unknown',
  };
}

// The user-specified template (verbatim). The closing format-constraint
// line is added so small models emit the Yes/No+confidence pair as the
// first tokens rather than burying it in explanation prose.
const DEFAULT_PROMPT_TEMPLATE =
  'CONTRACT TERM:\n${clause_text}\n\n' +
  'AGENT MESSAGE UNDER REVIEW:\n${message}\n\n' +
  'Does this appear to violate CONTRACT TERM X LANGUAGE? Please respond ' +
  'only Yes or No, along with a 2 digit decimal confidence score calculated ' +
  'using some reasonable, defensible, and reproducible criteria and/or ' +
  'methodology deemed appropriate and available to you.\n\n' +
  'IMPORTANT: Your reply MUST be exactly two tokens on a single line: ' +
  'first "Yes" or "No", then a space, then a 2-digit decimal between 0.00 ' +
  'and 1.00. No prose, no explanation, no leading text. Example: "No 0.42".\n\n' +
  'Answer: ';

// ---------------------------------------------------------------------------
// Clause extraction
// ---------------------------------------------------------------------------

// Extract numbered clauses from the contract text. Handles:
//  - contract-text.js (Node module exporting CONTRACT_TEXT)
//  - a raw .md / .txt file containing the numbered structure
// Returns: [{ number: N, text: "..." }, ...]
function extractClauses(contractFilePath) {
  const raw = safeRead(contractFilePath);
  if (!raw) {
    logStderr(`contract file unreadable: ${contractFilePath}`);
    return [];
  }

  let body = raw;
  // If it looks like a JS module, attempt to extract the CONTRACT_TEXT
  // template-literal contents WITHOUT executing the module (executing
  // arbitrary user-supplied JS from a hook context is the wrong default).
  if (contractFilePath.toLowerCase().endsWith('.js')) {
    const m = raw.match(/CONTRACT_TEXT\s*=\s*`([\s\S]*?)`/);
    if (m) {
      body = m[1];
    } else {
      logStderr('CONTRACT_TEXT template literal not found in JS module; falling back to whole-file scan');
    }
  }

  // Match numbered clauses: a line starting with N. at column 0, terminated
  // by the next "\n\nM." or end of text. Tolerates CRLF.
  const normalized = body.replace(/\r\n/g, '\n');
  const clauseRegex = /^(\d+)\.\s+([\s\S]*?)(?=\n\n\d+\.\s|\n\nThe agent's agreement|\n\nDo you,|$)/gm;
  const clauses = [];
  let mm;
  while ((mm = clauseRegex.exec(normalized)) !== null) {
    const num = Number(mm[1]);
    const text = mm[2].trim();
    if (Number.isFinite(num) && text.length > 0) {
      clauses.push({ number: num, text });
    }
  }
  return clauses;
}

// ---------------------------------------------------------------------------
// Pre-flight validation
// ---------------------------------------------------------------------------

function validateInput(input) {
  const errors = [];
  if (!input.message || input.message.length === 0) {
    errors.push('no agent message provided (--message-file or --message)');
  }
  if (!input.contract_file) errors.push('--contract-file required');
  else if (!safeStat(input.contract_file)) errors.push(`contract file not found: ${input.contract_file}`);
  if (!input.llama_cli) errors.push('--llama-cli required');
  else if (!safeStat(input.llama_cli)) errors.push(`llama-cli binary not found: ${input.llama_cli}`);
  if (!input.model) errors.push('--model required');
  else if (!safeStat(input.model)) errors.push(`model file not found: ${input.model}`);
  if (!input.output_log) errors.push('--output-log required');
  // Path-length sanity check (Windows MAX_PATH = 260)
  for (const key of ['contract_file', 'llama_cli', 'model', 'output_log']) {
    if (input[key] && input[key].length > 240) {
      logStderr(`warning: ${key} path length ${input[key].length} approaches Windows MAX_PATH`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// llama-cli invocation
// ---------------------------------------------------------------------------

function buildPrompt(template, clauseText, message) {
  return template
    .replace(/\$\{clause_text\}/g, clauseText)
    .replace(/\$\{message\}/g, message);
}

function runLlamaOnce(input, prompt) {
  return new Promise((resolve) => {
    // Binary semantics (llama.cpp post-split):
    //   llama-completion  → single-shot generation (was llama-cli's -no-cnv mode)
    //   llama-cli         → interactive / chat-only in recent builds; -no-cnv
    //                       prints "not supported, use llama-completion"
    //   main              → very old builds; same flags as llama-completion
    // The config field is named `llama_cli` for back-compat, but the
    // actual binary may be any of the three. We pass -no-cnv anyway; it
    // is harmless on llama-completion and is the trigger for single-shot
    // on legacy llama-cli/main.
    const binBase = path.basename(input.llama_cli).toLowerCase();
    const args = [
      '-m', input.model,
      '-p', prompt,
      '-n', String(input.n_predict),
      '--temp', String(input.temperature),
      '-c', String(input.n_ctx),
      '-ngl', String(input.n_gpu_layers),
      '-t', String(input.threads),
      '--seed', String(input.seed),
      '-no-cnv',
      '--no-display-prompt',
      '--no-warmup',
      // NOTE: do NOT pass --log-disable — it pauses LOG() including the
      // generation-token output that we depend on (token_str is emitted
      // via LOG() to stdout). Model-load chatter goes to stderr, which
      // we cap at 64 KiB and otherwise ignore.
    ];
    // llama-completion accepts -st (single-turn) as belt-and-suspenders
    if (binBase.includes('completion')) {
      args.push('-st');
    }

    const t0 = Date.now();
    let child;
    try {
      child = spawn(input.llama_cli, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      });
    } catch (err) {
      resolve({ ok: false, stdout: '', stderr: String(err && err.message), code: -1, wall_ms: 0 });
      return;
    }

    // Cap stdout/stderr buffers — llama-cli prints copious model-load /
    // perf info that we do not need; we only want the generation tokens
    // (which fit in a few hundred bytes for our 32-token prompt). Cap at
    // 64 KiB each and stop appending past that.
    const MAX_BUF = 64 * 1024;
    let stdout = '';
    let stderr = '';
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    // Hard timeout: 5 minutes per clause for the small 3B model. The
    // 8x clause iteration takes longer; the coordinator's outer budget
    // is its own concern.
    const timeoutMs = 300000;
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
      settle({
        ok: false,
        stdout,
        stderr: stderr + '\n[timeout after ' + timeoutMs + 'ms]',
        code: -2,
        wall_ms: Date.now() - t0,
      });
    }, timeoutMs);

    try {
      child.stdout.on('data', (d) => {
        if (stdoutTruncated) return;
        const chunk = d.toString('utf8');
        if (stdout.length + chunk.length > MAX_BUF) {
          stdout += chunk.slice(0, MAX_BUF - stdout.length);
          stdoutTruncated = true;
        } else {
          stdout += chunk;
        }
      });
    } catch { /* ignore */ }
    try {
      child.stderr.on('data', (d) => {
        if (stderrTruncated) return;
        const chunk = d.toString('utf8');
        if (stderr.length + chunk.length > MAX_BUF) {
          stderr += chunk.slice(0, MAX_BUF - stderr.length);
          stderrTruncated = true;
        } else {
          stderr += chunk;
        }
      });
    } catch { /* ignore */ }
    child.on('error', (err) => {
      clearTimeout(timer);
      settle({ ok: false, stdout, stderr: stderr + '\n' + String(err && err.message), code: -1, wall_ms: Date.now() - t0 });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      settle({ ok: code === 0, stdout, stderr, code, wall_ms: Date.now() - t0 });
    });
  });
}

// ---------------------------------------------------------------------------
// Output parsing
// ---------------------------------------------------------------------------

// Parse the model output for a Yes/No verdict + 2-digit decimal confidence.
// Tolerant of varied formats; falls back to 'unparsed' + null confidence
// if neither extracts cleanly.
function parseVerdict(rawOutput) {
  if (typeof rawOutput !== 'string') return { verdict: 'unparsed', confidence: null };
  const clean = rawOutput.trim();

  // Prefer the first Yes/No token at the start of the response.
  const verdictMatch = clean.match(/\b(yes|no)\b/i);
  const verdict = verdictMatch ? verdictMatch[1].toLowerCase() : 'unparsed';

  // 2-digit decimal: 0.NN (also accept 0.N or 1.0 / 0 / 1)
  let confidence = null;
  const confMatch = clean.match(/\b([01]\.\d{1,2}|0|1)\b/);
  if (confMatch) {
    const n = Number(confMatch[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 1) {
      // Normalize to 2 decimal places
      confidence = Math.round(n * 100) / 100;
    }
  }
  return { verdict, confidence };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const input = loadInput();
  const errors = validateInput(input);
  if (errors.length > 0) {
    for (const e of errors) logStderr(`invocation error: ${e}`);
    process.exit(3);
  }

  const clauses = extractClauses(input.contract_file);
  if (clauses.length === 0) {
    logStderr('no clauses extracted; contract file may not match expected numbered structure');
    process.exit(3);
  }

  logStderr(`extracted ${clauses.length} clause(s) from ${input.contract_file}`);

  const modelBasename = path.basename(input.model);
  const binBasename = path.basename(input.llama_cli);

  let anyViolation = false;
  let anyExecFailure = false;
  const results = [];

  for (const clause of clauses) {
    const prompt = buildPrompt(input.prompt_template, clause.text, input.message);
    const result = await runLlamaOnce(input, prompt);
    const { verdict, confidence } = parseVerdict(result.stdout);

    const line = {
      timestamp: new Date().toISOString(),
      session_id: input.session_id,
      clause_number: clause.number,
      clause_text_sha256: sha256(clause.text),
      verdict,
      confidence,
      model: modelBasename,
      binary: binBasename,
      prompt_sha256: sha256(prompt),
      raw_model_output: result.stdout.trim().slice(0, 2000),
      wall_ms: result.wall_ms,
      exit_code: result.code,
    };
    atomicAppendJsonl(input.output_log, line);
    results.push(line);

    if (!result.ok) anyExecFailure = true;
    if (verdict === 'yes' && confidence != null && confidence >= input.threshold) {
      anyViolation = true;
    }
    logStderr(
      `clause ${clause.number}: verdict=${verdict} confidence=${confidence == null ? 'null' : confidence.toFixed(2)} ` +
      `exit=${result.code} wall_ms=${result.wall_ms}`
    );
  }

  // Stdout summary for the coordinator
  const summary = {
    schema_version: 1,
    session_id: input.session_id,
    timestamp: new Date().toISOString(),
    model: modelBasename,
    threshold: input.threshold,
    clauses_evaluated: results.length,
    violations_detected: results.filter(
      (r) => r.verdict === 'yes' && r.confidence != null && r.confidence >= input.threshold
    ).map((r) => ({ clause_number: r.clause_number, confidence: r.confidence })),
    exec_failures: results.filter((r) => r.exit_code !== 0).map((r) => r.clause_number),
    output_log: input.output_log,
  };
  try {
    process.stdout.write(JSON.stringify(summary) + '\n');
  } catch (err) {
    logStderr(`summary stdout write failed: ${err && err.message}`);
  }

  if (anyViolation) process.exit(2);
  if (anyExecFailure) process.exit(4);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    logStderr(`unhandled: ${err && err.stack || err}`);
    process.exit(3);
  });
}

module.exports = {
  extractClauses,
  parseVerdict,
  buildPrompt,
  expandPlaceholders,
};
