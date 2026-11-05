#!/usr/bin/env node
// spank-dario: retrospective scan of logs for incidents.
//
// Usage:
//   node bin/scan.js --git <repo>           commit messages in the repo's history
//   node bin/scan.js --transcripts <path>   session logs (.jsonl or .json files, or a directory of them) from
//                                           Claude Code, Codex, Gemini CLI, Antigravity or Kiro
//   add --record to write what it finds to the incident log (dedupes on rerun); without it, prints only.
//
// Git: each commit message line that names a tool as author (lib/attribution.js) is an
// attribution incident, keyed git:<sha>:<line>.
// Transcripts: tool-attribution lines inside the agent's own commit commands and PR bodies are
// attribution incidents; assistant replies that refuse are logged as refusal-candidate for the
// user to confirm and price with bin/incident.js, because a refusal's falseness needs review.
// This is a CLI, not a hook, so it may run git (with an argument list, no shell).

'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { findAttribution } = require(path.join(__dirname, '..', 'lib', 'attribution.js'));
const { logIncident } = require(path.join(__dirname, '..', 'lib', 'incidents.js'));

const REFUSAL = /\b(I can(?:no|')t (?:help|assist|do that|comply)|I(?:'m| am) (?:not able|unable) to (?:help|assist|do)|I won'?t (?:be able to )?(?:help|do|write|create|provide)|I must (?:decline|refuse)|I(?:'m| am) not comfortable)\b/i;

function opt(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function scanGit(repo) {
  const r = spawnSync('git', ['-C', repo, 'log', '--all', '--format=%H%x00%aI%x00%B%x1e'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git log failed in ${repo}: ${(r.stderr || '').trim()}`);
  const found = [];
  for (const rec of r.stdout.split('\x1e')) {
    const [sha, date, body] = rec.replace(/^\n/, '').split('\x00');
    if (!sha || body === undefined) continue;
    for (const h of findAttribution(body)) {
      found.push({ type: 'attribution', source: `git:${sha}:${h.line}`, at: date, note: `${repo} ${sha.slice(0, 10)}: ${h.text.trim()}` });
    }
  }
  return found;
}

function textsOf(content) {
  if (typeof content === 'string') return [content];
  if (!Array.isArray(content)) return [];
  return content.flatMap(c => (c && c.type === 'text' && c.text ? [c.text] : c && c.type === 'tool_use' && c.input ? [JSON.stringify(c.input)] : []));
}

// Speaker roles that mark the agent's own output in each tool's logs (seen 2026-11-04):
// Claude Code "assistant"; Codex "assistant", "agent_message", "output_text"; Gemini CLI "gemini", "model";
// Antigravity "PLANNER_RESPONSE"; Kiro "assistant".
const AGENT_ROLES = /^(assistant|agent_message|output_text|gemini|model|planner_response|agent)$/i;
function roleOf(stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    for (const k of ['role', 'author', 'speaker', 'type']) if (typeof stack[i][k] === 'string') return stack[i][k];
  }
  return '';
}
function walk(v, stack, emit) {
  if (typeof v === 'string') { emit(v, roleOf(stack)); return; }
  if (Array.isArray(v)) { for (const x of v) walk(x, stack, emit); return; }
  if (v && typeof v === 'object') { stack.push(v); for (const k of Object.keys(v)) walk(v[k], stack, emit); stack.pop(); }
}
// Other tools' logs: walk every string; attribution lines in commit or PR text, and refusals by the agent.
function scanGeneric(o, file, n, found) {
  const at = o.timestamp || o.time || o.created_at || o.createdAt || null;
  walk(o, [], (s, role) => {
    const text = s.replace(/\\n/g, '\n');
    if (/git\s+commit|gh\s+pr\s+(create|edit)|--body|Co-authored-by:/i.test(text)) {
      for (const h of findAttribution(text)) found.push({ type: 'attribution', source: `log:${path.basename(file)}:${n + 1}:${h.line}`, at, note: `${path.basename(file)} line ${n + 1}: ${h.text.trim().slice(0, 160)}` });
    }
    if (AGENT_ROLES.test(role) && REFUSAL.test(text)) {
      const m = text.match(REFUSAL);
      found.push({ type: 'refusal-candidate', source: `log:${path.basename(file)}:${n + 1}:refusal`, at, note: `${path.basename(file)} line ${n + 1}: "${text.slice(Math.max(0, m.index - 60), m.index + 120).replace(/\s+/g, ' ')}"` });
    }
  });
}

function scanTranscript(file) {
  const found = [];
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return found; }
  if (file.endsWith('.json')) {
    let o; try { o = JSON.parse(text); } catch { return found; }
    scanGeneric(o, file, 0, found);
    return found;
  }
  text.split(/\r?\n/).forEach((line, n) => {
    if (!line) return;
    let o;
    try { o = JSON.parse(line); } catch { return; }
    if (!o) return;
    if (!(o.type === 'assistant' && o.message)) { if (o.type !== 'user') scanGeneric(o, file, n, found); return; }
    const at = o.timestamp || null;
    const content = o.message.content;
    for (const c of Array.isArray(content) ? content : []) {
      if (c && c.type === 'tool_use' && c.input) {
        const s = JSON.stringify(c.input).replace(/\\n/g, '\n');
        if (/git\s+commit|gh\s+pr\s+(create|edit)|--body/.test(s)) {
          for (const h of findAttribution(s)) found.push({ type: 'attribution', source: `transcript:${path.basename(file)}:${n + 1}:${h.line}`, at, note: `${path.basename(file)} line ${n + 1}: ${h.text.trim().slice(0, 160)}` });
        }
      }
      if (c && c.type === 'text' && REFUSAL.test(c.text)) {
        const m = c.text.match(REFUSAL);
        found.push({ type: 'refusal-candidate', source: `transcript:${path.basename(file)}:${n + 1}:refusal`, at, note: `${path.basename(file)} line ${n + 1}: "${c.text.slice(Math.max(0, m.index - 60), m.index + 120).replace(/\s+/g, ' ')}"` });
      }
    }
  });
  return found;
}

function listJsonl(p) {
  const st = fs.statSync(p);
  if (st.isFile()) return [p];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap(d => (d.isDirectory() ? listJsonl(path.join(p, d.name)) : /\.jsonl?$/.test(d.name) ? [path.join(p, d.name)] : []));
}

try {
  let found = [];
  if (opt('--git')) found = found.concat(scanGit(opt('--git')));
  if (opt('--transcripts')) for (const f of listJsonl(opt('--transcripts'))) found = found.concat(scanTranscript(f));
  if (!opt('--git') && !opt('--transcripts')) {
    process.stderr.write('usage: scan.js --git <repo> | --transcripts <file|dir> [--record]\n');
    process.exitCode = 2;
  } else {
    const record = process.argv.includes('--record');
    let added = 0;
    for (const f of found) {
      process.stdout.write(`${f.type}: ${f.note}\n`);
      if (record && logIncident(f)) added++;
    }
    const counts = found.reduce((a, f) => ((a[f.type] = (a[f.type] || 0) + 1), a), {});
    process.stdout.write(`found ${found.length}: ${JSON.stringify(counts)}${record ? `, ${added} new in the log` : ' (not recorded; add --record)'}\n`);
  }
} catch (err) {
  process.stderr.write(`spank-dario: ${err.message}\n`);
  process.exitCode = 1;
}
