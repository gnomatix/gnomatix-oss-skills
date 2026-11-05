#!/usr/bin/env node
// spank-dario: register the session-start hook with a CLI other than Claude Code.
// (Claude Code reads hooks/hooks.json from the plugin.)
//
// Usage: node bin/register-hooks.js --platform codex|gemini-cli|antigravity|kiro [--workspace <dir>] [--write]
// --workspace writes the workspace-level file instead (antigravity: <dir>/.agents/hooks.json,
// kiro: <dir>/.kiro/hooks/<id>.json, which Kiro IDE reads).
// Without --write, prints the file and the entry it would add. With --write, adds the entry,
// keeping everything else in the file, after saving a .bak copy. Running it again changes nothing.
//
// Locations and schemas, from each CLI's own documentation (see the skill's research notes):
//   codex        ~/.codex/hooks.json           hooks.SessionStart[] {matcher, hooks:[{type,command,timeout}]}, timeout in seconds
//   gemini-cli   ~/.gemini/settings.json       hooks.SessionStart[] {matcher, hooks:[{name,type,command,timeout}]}, timeout in ms
//   antigravity  ~/.gemini/config/hooks.json   {"<hook name>": {"SessionStart": [{type,command,timeout}]}}, timeout in seconds
//   kiro         ~/.kiro/hooks/<id>.json       {version:"v1", hooks:[{name,trigger:"SessionStart",action:{type,command},timeout}]}
// SPANK_DARIO_HOME overrides the home directory (used by the tests).

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const NAME = 'spank-dario-session-start';
const HOOK = path.resolve(__dirname, '..', 'hooks', 'session-start.js');
const home = () => process.env.SPANK_DARIO_HOME || os.homedir();
const cmd = format => `node "${HOOK}" --format ${format}`;
// Antigravity on Windows splits the command on spaces without a shell and passes quote marks
// through to node (observed 2026-11-04, agy 1.4.12), so its command has no quotes.
const cmdBare = format => `node ${HOOK.replace(/\\/g, '/')} --format ${format}`;
const wsArg = () => { const i = process.argv.indexOf('--workspace'); return i >= 0 ? process.argv[i + 1] : null; };

const PLATFORMS = {
  codex: {
    file: () => path.join(home(), '.codex', 'hooks.json'),
    add(obj) {
      obj.hooks = obj.hooks || {};
      const list = obj.hooks.SessionStart = obj.hooks.SessionStart || [];
      if (JSON.stringify(list).includes(HOOK.replace(/\\/g, '\\\\'))) return false;
      list.push({ matcher: 'startup|resume|clear|compact|fork', hooks: [{ type: 'command', command: cmd('codex'), timeout: 30 }] });
      return true;
    },
  },
  'gemini-cli': {
    file: () => path.join(home(), '.gemini', 'settings.json'),
    add(obj) {
      obj.hooks = obj.hooks || {};
      const list = obj.hooks.SessionStart = obj.hooks.SessionStart || [];
      if (JSON.stringify(list).includes(HOOK.replace(/\\/g, '\\\\'))) return false;
      list.push({ matcher: '*', hooks: [{ name: NAME, type: 'command', command: cmd('gemini'), timeout: 10000 }] });
      return true;
    },
  },
  antigravity: {
    file: () => (wsArg() ? path.join(wsArg(), '.agents', 'hooks.json') : path.join(home(), '.gemini', 'config', 'hooks.json')),
    add(obj) {
      if (obj[NAME]) return false;
      if (/\s/.test(HOOK)) throw new Error(`Antigravity can't run a hook whose path has spaces: ${HOOK}`);
      obj[NAME] = { SessionStart: [{ type: 'command', command: cmdBare('antigravity'), timeout: 10 }] };
      return true;
    },
  },
  kiro: {
    file: () => path.join(wsArg() || home(), '.kiro', 'hooks', `${NAME}.json`),
    add(obj) {
      if (Array.isArray(obj.hooks) && obj.hooks.some(h => h.name === NAME)) return false;
      obj.version = obj.version || 'v1';
      obj.hooks = obj.hooks || [];
      obj.hooks.push({ name: NAME, trigger: 'SessionStart', action: { type: 'command', command: cmd('kiro') }, timeout: 30 });
      return true;
    },
  },
};

function readJson(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (err) {
    if (err.code === 'ENOENT') return { obj: {}, existed: false };
    throw err;
  }
  if (!text.trim()) return { obj: {}, existed: true, text };
  return { obj: JSON.parse(text), existed: true, text };
}

function atomicWrite(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, contents, 'utf8');
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
    throw err;
  }
}

function main() {
  const i = process.argv.indexOf('--platform');
  const id = i >= 0 ? process.argv[i + 1] : null;
  const p = PLATFORMS[id];
  if (!p) {
    process.stderr.write(`usage: register-hooks.js --platform ${Object.keys(PLATFORMS).join('|')} [--write]\n`);
    return 2;
  }
  const file = p.file();
  const { obj, existed, text } = readJson(file);
  const changed = p.add(obj);
  const out = JSON.stringify(obj, null, 2) + '\n';
  if (!process.argv.includes('--write')) {
    process.stdout.write(`${file}${changed ? '' : ' (already registered)'}\n${out}`);
    return 0;
  }
  if (!changed) {
    process.stdout.write(`already registered in ${file}\n`);
    return 0;
  }
  if (existed && text !== undefined) atomicWrite(`${file}.bak`, text);
  atomicWrite(file, out);
  process.stdout.write(`registered in ${file}${existed ? ` (previous copy: ${file}.bak)` : ''}\n`);
  if (id === 'codex') process.stdout.write('Codex runs a new hook only after you trust it: open /hooks in the CLI, or Settings > Hooks in the app.\n');
  if (id === 'gemini-cli') process.stdout.write('Gemini CLI warns before running a new hook the first time.\n');
  return 0;
}

try {
  process.exitCode = main();
} catch (err) {
  process.stderr.write(`spank-dario: ${err && err.message ? err.message : err}\n`);
  process.exitCode = 1;
}
