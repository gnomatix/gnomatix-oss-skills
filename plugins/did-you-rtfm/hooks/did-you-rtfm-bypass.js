#!/usr/bin/env node
// did-you-rtfm-bypass — PreToolUse hook on Bash / PowerShell
//
// Denies tool invocations that contain bypass-flag or signal-suppression shapes
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

const BYPASS_PATTERNS = [
  // ── Bypass flags whose role is to silence a check / verification / refusal ──
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
      permissionDecision: 'deny',
      permissionDecisionReason:
        `did-you-rtfm-bypass: command contains a bypass / signal-suppression shape ` +
        `(${matchName}) that this hook treats as a workaround pending explicit ` +
        `user authorization.\n\n` +
        `Command: ${cmdShown}\n\n` +
        `Bypass flags exist for cases where the user has accepted the trade-off; ` +
        `agent-side use without user authorization is a workaround per the ` +
        `did-you-rtfm skill.\n\n` +
        `Required: invoke the did-you-rtfm skill.\n` +
        `  1. Why is the underlying check / validation / verification failing?\n` +
        `  2. Is the failure caused by a phantom-blocker (stale training-data, ` +
        `misremembered flag, version conflation, hallucinated parameter)?\n` +
        `  3. Have you read the version-specific docs for the tool you're invoking ` +
        `with the bypass flag?\n` +
        `  4. For interactive-tool workarounds: is there a proper non-interactive ` +
        `flag you missed (e.g., --batch, --yes, --non-interactive, --no-tty)?\n\n` +
        `If, after the above, the bypass is genuinely the correct path: surface the ` +
        `situation to the user with evidence. The user authorizes plan changes — ` +
        `never the agent.`,
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

  for (const { name, re } of BYPASS_PATTERNS) {
    if (re.test(command)) return deny(name, command);
  }
  pass();
})();
