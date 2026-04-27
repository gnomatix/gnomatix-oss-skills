#!/usr/bin/env node
// whacking-day-firewall — PreToolUse hook
//
// Blocks Python-invoking shell commands unless the current project has an
// open entry (status: approved | in-progress) in
// .claude/python-authorizations/log.jsonl.
//
// Authorizations are authored via the `whacking-day` skill, cleared by the
// `zartan` skill, and consumed by the `jake-the-snake` skill. This hook is
// the harness-level enforcement layer; the skills are the procedural layer.
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

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

function looksLikePython(token) {
  if (!token) return false;
  let t = token.replace(/^["']|["']$/g, '');
  t = path.basename(t);
  t = t.replace(/\.(exe|bat|cmd|sh|ps1)$/i, '');
  return PYTHON_TOKENS.has(t.toLowerCase());
}

function commandIsPython(command) {
  if (!command) return false;
  const segments = command.split(/&&|\|\||;|\|/);
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^("[^"]+"|'[^']+'|\S+)/);
    if (!m) continue;
    if (looksLikePython(m[1])) return true;
    const argTokens = trimmed.split(/\s+/).slice(1);
    if (argTokens.some(t => /\.py(\b|$)/i.test(t))) return true;
  }
  return false;
}

function hasOpenAuthorization(cwd) {
  const logPath = path.join(cwd, '.claude', 'python-authorizations', 'log.jsonl');
  if (!fs.existsSync(logPath)) return false;
  const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean);
  // Track latest status per id (later lines override earlier).
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
  if (!commandIsPython(command)) return pass();
  const cwd = payload.cwd || process.cwd();
  if (hasOpenAuthorization(cwd)) return pass();
  deny(
    'whacking-day-firewall: Python invocation detected, but this project has ' +
    'no open authorization at .claude/python-authorizations/log.jsonl. ' +
    'Invoke the `whacking-day` skill to author a proposal and obtain explicit ' +
    'user approval. After approval, the `zartan` skill must clear the request ' +
    '(no non-Python alternative exists). Only then will `jake-the-snake` execute.'
  );
})();
