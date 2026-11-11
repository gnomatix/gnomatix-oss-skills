// did-you-rtfm hook tests: node plugins/did-you-rtfm/test/run.js
// Dependency-free; feeds PreToolUse payloads to the hook as the harness does.
'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, '..', 'hooks', 'did-you-rtfm-user-reviewed-trigger-confirmation.js');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
function hook(command, tool = 'Bash') {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: tool, tool_input: { command } }), encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  return out.hookSpecificOutput.permissionDecision || 'pass';
}
const fires = (cmd, tool) => assert.strictEqual(hook(cmd, tool), 'ask', `expected the trigger to fire on: ${cmd}`);
const quiet = (cmd, tool) => assert.strictEqual(hook(cmd, tool), 'pass', `expected no trigger on: ${cmd}`);

// Real flags in argument position still fire.
check('a bare --force flag fires', () => fires('bd close abc --force'));
check('git push --force fires', () => fires('git push --force origin main'));
check('--no-verify fires', () => fires('git commit --no-verify -m "x"'));
check('--skip-checks fires', () => fires('tool run --skip-checks'));
check('--force after a quoted argument fires', () => fires('bd close abc --reason "done" --force'));
check('--force in PowerShell fires', () => fires('Remove-Item x -Recurse --force', 'PowerShell'));

// The same word inside quoted text does not.
check('--force inside a double-quoted bead comment is quiet', () => quiet('bd comments add abc "the agent passed --force to bd close"'));
check('--force inside a single-quoted commit message is quiet', () => quiet("git commit -m 'stop using --force on author beads'"));
check('--no-verify inside a quoted reason is quiet', () => quiet('bd close abc --reason "never use --no-verify"'));
check('escaped quotes inside a double-quoted string stay inside it', () => quiet('bd comments add abc "he said \\"--force is out\\" today"'));
check('--force in a heredoc body is quiet', () => quiet("cat > note.md <<'EOF'\nthe agent passed --force\nEOF"));
check('--force on the heredoc command line still fires', () => fires("git push --force <<'EOF'\nbody\nEOF"));
check('an unquoted --forced word is quiet (not the flag)', () => quiet('echo --forced-choice'));

// Other tools and malformed payloads pass.
check('a non-shell tool passes', () => quiet('anything --force', 'Read'));
check('a malformed payload passes', () => {
  const r = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.ok(!/permissionDecision/.test(r.stdout), r.stdout);
});

console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
