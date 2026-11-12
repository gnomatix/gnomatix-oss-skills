'use strict';
// Limits a hosted marketplace sync (claude.ai) applies to a plugin snapshot.
// A plugin that breaks the bin rule is skipped; the others are reported as warnings.
//   - plugin description (marketplace entry and plugin.json): at most 500 characters
//   - SKILL.md description: at most 1024 characters, no angle brackets
//   - no top-level bin/ directory in a plugin
//   - every file named skill.md (any case) under skills/ is read as a skill and
//     must start with YAML frontmatter

const fs = require('fs');
const path = require('path');

const PLUGIN_DESCRIPTION_MAX = 500;
const SKILL_DESCRIPTION_MAX = 1024;

function readFrontmatter(text) {
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  return lines.slice(1, end).join('\n');
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

function foldLines(lines) {
  let out = '';
  let pendingBreaks = 0;
  for (const line of lines) {
    if (line === '') {
      pendingBreaks += 1;
      continue;
    }
    if (out !== '') out += pendingBreaks > 0 ? '\n'.repeat(pendingBreaks) : ' ';
    pendingBreaks = 0;
    out += line;
  }
  return out;
}

// Value of a top-level frontmatter key as a string: plain, quoted, folded (>) and
// literal (|) scalars, including values wrapped over indented continuation lines.
function readFrontmatterScalar(frontmatter, key) {
  if (typeof frontmatter !== 'string') return null;
  const lines = frontmatter.split(/\r?\n/);
  const prefix = `${key}:`;
  const at = lines.findIndex((l) => l === prefix || l.startsWith(`${prefix} `) || l.startsWith(`${prefix}\t`));
  if (at === -1) return null;
  const first = lines[at].slice(prefix.length).trim();

  const continuation = [];
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() !== '' && indentOf(line) === 0) break;
    continuation.push(line);
  }
  while (continuation.length && continuation[continuation.length - 1].trim() === '') continuation.pop();

  const block = /^([>|])[+-]?\d*$/.exec(first);
  if (block) {
    const indents = continuation.filter((l) => l.trim() !== '').map(indentOf);
    const base = indents.length ? Math.min(...indents) : 0;
    const body = continuation.map((l) => (l.trim() === '' ? '' : l.slice(base)));
    return block[1] === '|' ? body.join('\n') : foldLines(body);
  }

  const joined = foldLines([first, ...continuation.map((l) => l.trim())].filter((l, i) => i > 0 || l !== ''));
  if (joined.startsWith('"')) {
    let out = '';
    for (let i = 1; i < joined.length; i += 1) {
      const ch = joined[i];
      if (ch === '"') return out;
      if (ch === String.fromCharCode(92) && i + 1 < joined.length) {
        i += 1;
        const esc = joined[i];
        out += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
        continue;
      }
      out += ch;
    }
    return out;
  }
  if (joined.startsWith("'")) {
    let out = '';
    for (let i = 1; i < joined.length; i += 1) {
      if (joined[i] === "'") {
        if (joined[i + 1] === "'") {
          out += "'";
          i += 1;
          continue;
        }
        return out;
      }
      out += joined[i];
    }
    return out;
  }
  const comment = joined.search(/\s#/);
  return (comment === -1 ? joined : joined.slice(0, comment)).trim();
}

function findSkillFiles(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      findSkillFiles(full, found);
    } else if (entry.isFile() && entry.name.toLowerCase() === 'skill.md') {
      found.push(full);
    }
  }
  return found;
}

function descriptionProblems(label, text, max, noAngleBrackets) {
  const problems = [];
  if (typeof text !== 'string') return problems;
  if (text.length > max) problems.push(`${label} is ${text.length} characters; the hosted sync limit is ${max}`);
  if (noAngleBrackets && /[<>]/.test(text)) {
    problems.push(`${label} contains an angle bracket, which the hosted sync reads as an XML tag`);
  }
  return problems;
}

// plugins: [{ name, dir, marketplaceFile, marketplaceDescription }]
// Returns [{ file, message }].
function checkHostedSyncLimits(plugins) {
  const out = [];
  for (const plugin of plugins) {
    for (const message of descriptionProblems(
      `marketplace entry description of "${plugin.name}"`,
      plugin.marketplaceDescription,
      PLUGIN_DESCRIPTION_MAX,
      false
    )) {
      out.push({ file: plugin.marketplaceFile, message });
    }

    const manifest = path.join(plugin.dir, '.claude-plugin', 'plugin.json');
    let manifestDescription = null;
    try {
      manifestDescription = JSON.parse(fs.readFileSync(manifest, 'utf8')).description;
    } catch (_) {
      manifestDescription = null;
    }
    for (const message of descriptionProblems('plugin.json description', manifestDescription, PLUGIN_DESCRIPTION_MAX, false)) {
      out.push({ file: manifest, message });
    }

    const bin = path.join(plugin.dir, 'bin');
    if (fs.existsSync(bin) && fs.statSync(bin).isDirectory()) {
      out.push({
        file: bin,
        message: 'top-level bin/ directory; the hosted sync skips a plugin that ships bin/ executables (use scripts/, hooks, commands or mcpServers)',
      });
    }

    for (const skillFile of findSkillFiles(path.join(plugin.dir, 'skills'), [])) {
      const frontmatter = readFrontmatter(fs.readFileSync(skillFile, 'utf8'));
      if (frontmatter === null) {
        out.push({
          file: skillFile,
          message: 'the hosted sync reads every skill.md under skills/ as a skill; this one does not start with YAML frontmatter (---)',
        });
        continue;
      }
      const description = readFrontmatterScalar(frontmatter, 'description');
      for (const message of descriptionProblems('SKILL.md description', description, SKILL_DESCRIPTION_MAX, true)) {
        out.push({ file: skillFile, message });
      }
    }
  }
  return out;
}

module.exports = {
  PLUGIN_DESCRIPTION_MAX,
  SKILL_DESCRIPTION_MAX,
  readFrontmatter,
  readFrontmatterScalar,
  checkHostedSyncLimits,
};
