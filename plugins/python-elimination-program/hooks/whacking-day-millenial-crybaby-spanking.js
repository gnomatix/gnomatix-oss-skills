#!/usr/bin/env node
// whacking-day-millenial-crybaby-spanking — PreToolUse hook
//
// Blocks PROJECT-SCOPE Python invocations unless the current project has an
// open entry (status: approved | in-progress) in
// .claude/python-authorizations/log.jsonl.
//
// Project-scope = Python being adopted as a project's language: writing/running
// project .py files, `pip install <library>` into the project, etc.
//
// NOT blocked (passes through without authorization):
//   - User / isolated CLI-tool installs:  `pip install --user X`, `pipx install X`,
//     `pipx run X`, `uv tool install X`, `uv tool run X`.
//   - Direct invocation of mainstream Python-implemented CLI tools by their
//     binary name (`hf`, `huggingface-cli`, `aws`, `ansible`, `yt-dlp`, etc.).
//     These tools' implementation language is incidental; the user is using
//     them as CLI tools, not adopting Python.
//
// See skills/whacking-day/SKILL.md for the scope rationale.
//
// Hook contract: read JSON payload from stdin, write a JSON decision to
// stdout. Pass-through (no decision) is the default.

const fs = require('fs');
const path = require('path');

const PYTHON_TOKENS = new Set([
  'python', 'python2', 'python3', 'py',
  'pip', 'pip2', 'pip3', 'pipx',
  'uv', 'poetry', 'conda', 'mamba',
  'virtualenv', 'pyenv',
]);

// Mainstream Python-implemented CLI tools whose use is NOT project-Python
// adoption. Strictly: CLI tools whose primary purpose is operating on
// external systems / data (cloud APIs, model hubs, ops, media), NOT
// Python-source-code tooling. Tooling whose purpose IS to operate on Python
// source (formatters, linters, type-checkers, sphinx, mkdocs that emit Python
// stuff) is project-Python-adoption-adjacent and is NOT allowlisted; it falls
// through to the project-adoption gate.
const CLI_TOOL_BINARIES = new Set([
  'hf', 'huggingface-cli',
  'aws', 'awscli',
  'ansible', 'ansible-playbook', 'ansible-galaxy', 'ansible-vault',
  'yt-dlp', 'youtube-dl', 'gdown',
  'httpie', 'http', 'https',
  'gcloud', 'bq', 'gsutil',
  'az',
  'thefuck', 'tldr',
  'pgcli', 'mycli', 'litecli',
  'glances', 'bpytop',
  'docker-compose',
  // Deliberately NOT included (these are project-Python-adoption-adjacent and
  // must walk through the gate): pre-commit, jupyter, ipython, sphinx-build,
  // mkdocs, black, ruff, mypy, pylint, flake8, isort, gh-copilot.
]);

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

function normToken(token) {
  if (!token) return '';
  let t = token.replace(/^["']|["']$/g, '');
  t = path.basename(t);
  t = t.replace(/\.(exe|bat|cmd|sh|ps1)$/i, '');
  return t.toLowerCase();
}

function looksLikePython(token) {
  return PYTHON_TOKENS.has(normToken(token));
}

function isCliToolBinary(token) {
  return CLI_TOOL_BINARIES.has(normToken(token));
}

// Distinguish project-Python adoption from CLI-tool use within a single shell
// segment.
function segmentRequiresAuth(seg) {
  const trimmed = seg.trim();
  if (!trimmed) return false;

  // Get the head token (the command being invoked).
  const m = trimmed.match(/^("[^"]+"|'[^']+'|\S+)/);
  if (!m) return false;
  const headTok = normToken(m[1]);

  // Direct invocation of an allowlisted CLI tool — pass through.
  if (isCliToolBinary(headTok)) return false;

  // env VAR=... prefix: skip env vars and look at the actual command.
  let argTokens = trimmed.split(/\s+/);
  if (headTok === 'env') {
    // Strip env and VAR=val tokens, then re-evaluate as if without them.
    argTokens = argTokens.slice(1);
    while (argTokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argTokens[0])) {
      argTokens.shift();
    }
    if (!argTokens.length) return false;
    const realHead = normToken(argTokens[0]);
    if (isCliToolBinary(realHead)) return false;
    if (!PYTHON_TOKENS.has(realHead) && !argTokens.slice(1).some(t => /\.py(\b|$)/i.test(t))) {
      return false;
    }
    argTokens = argTokens.slice(1);
    // Fall through into Python-token analysis below as if the env-stripped
    // command were the original.
    return analyzePythonCommand(realHead, argTokens);
  }

  // Not a Python-token head and no .py args — not project Python.
  if (!PYTHON_TOKENS.has(headTok)) {
    if (argTokens.slice(1).some(t => /\.py(\b|$)/i.test(t))) return true;  // running a .py file
    return false;
  }

  return analyzePythonCommand(headTok, argTokens.slice(1));
}

// Given a Python-family head token and the rest of the args, decide whether
// this is project-Python adoption (block) or CLI-tool / user-scope use (pass).
function analyzePythonCommand(head, args) {
  // pip / pip3 / pipx — examine subcommand and flags.
  if (head === 'pip' || head === 'pip2' || head === 'pip3') {
    // Subcommand
    const sub = args[0] && args[0].toLowerCase();
    if (sub !== 'install' && sub !== 'download' && sub !== 'wheel') return false;
    // pip install --user X  → CLI tool install, pass
    if (args.includes('--user')) return false;
    return true;  // project-scope pip install — block
  }
  if (head === 'pipx') {
    // `pipx install X`, `pipx run X`, `pipx inject X`, etc. — all isolated
    // CLI-tool patterns. Pass.
    return false;
  }
  if (head === 'uv') {
    // `uv tool install X` / `uv tool run X` — isolated CLI tool. Pass.
    // `uv add` / `uv pip install` / `uv venv` — project adoption. Block.
    if (args[0] === 'tool') return false;
    return true;
  }
  if (head === 'poetry' || head === 'conda' || head === 'mamba' ||
      head === 'virtualenv' || head === 'pyenv') {
    // Project-scope environment / dependency management — block.
    return true;
  }
  // python / python3 / py: running Python code directly.
  if (head === 'python' || head === 'python2' || head === 'python3' || head === 'py') {
    // python -c '<inline>' — one-shot. Pass for short inline; block for in-project module.
    if (args[0] === '-c') return false;
    // python -m <module>: if <module> is a CLI-tool module (e.g. http.server),
    // arguably pass; here we conservatively block project-module invocations
    // (python -m mypackage) but allow stdlib one-shots.
    if (args[0] === '-m') {
      const mod = args[1] || '';
      // Stdlib one-shots commonly used as CLI tools:
      const stdlibCliMods = new Set([
        'http.server', 'json.tool', 'venv', 'pip', 'unittest', 'pdb',
        'timeit', 'cProfile', 'this', 'antigravity', 'tarfile', 'zipfile',
        'gzip', 'base64', 'uuid', 'webbrowser', 'tokenize',
      ]);
      if (stdlibCliMods.has(mod)) return false;
      // pip via -m is install — apply pip rules above.
      if (mod === 'pip') {
        if (args.slice(2).includes('--user')) return false;
        const sub = args[2] && args[2].toLowerCase();
        if (sub !== 'install' && sub !== 'download' && sub !== 'wheel') return false;
        return true;
      }
      return true;  // python -m project_module — project Python
    }
    // python script.py — project Python. Block.
    if (args.some(t => /\.py(\b|$)/i.test(t))) return true;
    // python (no args) — interactive REPL, pass.
    if (args.length === 0) return false;
    return true;
  }
  return true;
}

function commandRequiresAuth(command) {
  if (!command) return false;
  const segments = command.split(/&&|\|\||;|\|/);
  for (const seg of segments) {
    if (segmentRequiresAuth(seg)) return true;
  }
  return false;
}

function hasOpenAuthorization(cwd) {
  const logPath = path.join(cwd, '.claude', 'python-authorizations', 'log.jsonl');
  if (!fs.existsSync(logPath)) return false;
  const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const latestStatus = new Map();
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.id && entry.status) latestStatus.set(entry.id, entry.status);
    } catch { /* skip malformed */ }
  }
  for (const status of latestStatus.values()) {
    if (status === 'approved' || status === 'in-progress') return true;
  }
  return false;
}

function pass() {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse' }
  }));
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    }
  }));
}

(async () => {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    return pass();
  }
  const tool = payload.tool_name;
  if (tool !== 'Bash' && tool !== 'PowerShell') return pass();
  const command = payload.tool_input && payload.tool_input.command;
  if (!commandRequiresAuth(command)) return pass();
  const cwd = payload.cwd || process.cwd();
  if (hasOpenAuthorization(cwd)) return pass();
  deny(
    'whacking-day-millenial-crybaby-spanking: project-scope Python adoption detected ' +
    '(e.g. `pip install <library>` without --user, `python script.py`, `poetry add`, ' +
    '`uv add`, project venv setup), but no open authorization exists at ' +
    '.claude/python-authorizations/log.jsonl. Invoke the `whacking-day` skill to author ' +
    'a proposal and obtain explicit user approval. CLI-tool patterns ' +
    '(`pip install --user`, `pipx install`, `pipx run`, `uv tool install`, direct ' +
    'invocation of `hf`/`aws`/`ansible`/`yt-dlp`/etc.) are NOT blocked and should not ' +
    'trigger this hook — if you are seeing this message for one of those, the hook ' +
    'logic is wrong and needs adjustment, not authorization.'
  );
})();
