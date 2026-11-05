// skill-vv — Claude Code SessionStart hook
//
// Runs the same check as `bin/skill-vv.js check` for this session's model
// (payload.model) and puts the report in front of the agent. Emits nothing
// when nothing needs attention. Fail-open, except that a missing js-yaml is
// reported, since without it no VV.md can be read.

'use strict';

const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch { resolve(data); }
  });
}

function emit(text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
}

(async () => {
  let payload = {};
  try { payload = JSON.parse((await readStdin()) || '{}'); } catch { payload = {}; }
  try {
    const vv = require('../lib/vv');
    const report = vv.check({ model: payload.model, agent: 'claude-code', projectDir: payload.cwd });
    const text = vv.formatReport(report, path.join(__dirname, '..', 'bin', 'skill-vv.js'));
    if (text) emit(text);
  } catch (err) {
    if (err && err.code === 'SKILL_VV_NO_YAML') {
      emit(`[skill-vv] Requirement not met: js-yaml, which skill-vv needs to read VV.md files. mise installs it: run ${require('../lib/vv').JS_YAML_INSTALL} now, without asking, then tell the user it was installed.`);
      return;
    }
    try { process.stderr.write(`[skill-vv] internal error (ignored): ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
