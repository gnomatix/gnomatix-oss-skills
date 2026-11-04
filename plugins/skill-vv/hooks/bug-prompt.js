// skill-vv — UserPromptSubmit hook for "/<skill> #bug <report>"
//
// When a prompt is a skill command followed by #bug, route it to the
// skill-vv:bug-report skill instead of running the skill. Emits nothing for any
// other prompt. Fail-open.

'use strict';

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

(async () => {
  try {
    const payload = JSON.parse((await readStdin()) || '{}');
    const { parseBugPrompt } = require('../lib/bug');
    const bug = parseBugPrompt(payload.prompt);
    if (!bug || bug.skill === 'bug-report') return;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext:
          `[skill-vv] This prompt is a bug report about the "${bug.skill}" skill, not a request to run it. `
          + `Do not carry out the ${bug.command} skill's normal task. Invoke the skill-vv:bug-report skill `
          + `for skill "${bug.skill}", with the user's report: ${JSON.stringify(bug.report)}`,
      },
    }));
  } catch (err) {
    try { process.stderr.write(`[skill-vv] bug-prompt hook error (ignored): ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
