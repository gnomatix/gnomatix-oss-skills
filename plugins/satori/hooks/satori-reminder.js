// satori — UserPromptSubmit hook
//
// Injects the per-turn reminder: the characters, as they are. No glosses or
// translations: each character carries its own meaning, and a translation
// would replace it with a narrower one. See README.md for why.
//
// Pure Node per marketplace CLAUDE.md.

'use strict';

const REMINDER = '{悟} {仁} {義} {礼} {智} {信} {誠} {恕} {直} {道} {無為} {自然} {樸} {虚} {柔} {水} {不争}';

process.stdin.resume();
process.stdin.on('data', () => {});
process.stdin.on('error', () => {});
process.stdin.on('end', () => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: REMINDER,
    },
  }));
});
