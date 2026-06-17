#!/usr/bin/env node
// did-you-rtfm-user-reviewed-trigger-confirmation — PreToolUse hook on Bash / PowerShell
//
// Flags tool invocations that contain signal-suppression shapes for user-reviewed trigger confirmation
// — patterns whose effect is to silence the signal a real failure produced
// rather than to address its cause. Routes the agent back to the
// `did-you-rtfm` skill discipline.
//
// The pattern list is conservative by design. Broad shapes like `2>/dev/null`
// (legitimate noise suppression in many scripts) and bare `< /dev/null` (often
// fine for non-interactive invocation) are intentionally omitted to keep
// false-positive rate low. See ../README.md "Hook precision-tuned pattern set".
//
// Hook contract: read JSON from stdin; write a JSON decision to stdout.
// Returning `permissionDecision: "deny"` blocks the tool call.

const TRIGGER_PATTERNS = [
  // ── Signal-suppression patterns whose role is to silence a check / verification / refusal ──
  { name: '--no-verify',
    re: /(?<![A-Za-z0-9_-])--no-verify\b/ },
  { name: '--force flag',
    re: /(?<![A-Za-z0-9_-])--force\b/ },
  { name: '--skip-* family',
    re: /(?<![A-Za-z0-9_-])--skip-[a-z][a-z0-9-]*/ },
  { name: '--allow-* family',
    re: /(?<![A-Za-z0-9_-])--allow-[a-z][a-z0-9-]*/ },
  { name: '--ignore-* family',
    re: /(?<![A-Za-z0-9_-])--ignore-[a-z][a-z0-9-]*/ },

  // ── TTY-faking / interactive-prompt workarounds ──
  // Agent encounters an interactive tool, doesn't find the proper non-interactive
  // flag (didn't RTFM), and reaches for these instead. Almost never legitimate
  // when emitted by an agent without explicit user authorization.
  { name: 'script(1) TTY-faking',
    re: /\bscript\s+(?:-q\s+|-qc\s+|-c\s+)/ },
  { name: 'expect(1) interactive automation',
    re: /\bexpect\s+(?:-c\b|-f\b|<<)/ },
  { name: 'echo|sudo -S password piping',
    re: /\becho\s+[^|]{1,200}\|\s*sudo\s+-S\b/ },
  { name: 'unbuffer / stdbuf TTY workaround',
    re: /\b(?:unbuffer|stdbuf)\s+(?:-[oeiL0]|-[oeiL]\s)/ },
];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

function pass() {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse' },
  }));
}

function deny(matchName, command) {
  const cmdShown = command.length > 200 ? command.slice(0, 200) + '…' : command;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        `RTFM trigger matched (${matchName}).\n\n` +
        `Command: ${cmdShown}\n\n` +
        `Ask the user with the user-ask tool (AskUserQuestion): "RTFM Trigger is Valid? Yes / No".\n` +
        `If No (false positive): note the match for future matcher improvement and CONTINUE the work — it is not a blocker and not a reason to stop.\n` +
        `If Yes: you are operating on a false belief, bad tooling, or an error state you are silently ignoring. Identify it, surface it to the user, and work smarter — do not push the flagged command through.`,
    },
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
  if (!command || typeof command !== 'string') return pass();

  for (const { name, re } of TRIGGER_PATTERNS) {
    if (re.test(command)) return deny(name, command);
  }
  pass();
})();
