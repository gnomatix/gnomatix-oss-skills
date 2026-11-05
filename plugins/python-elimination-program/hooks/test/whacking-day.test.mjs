// Cases for whacking-day-millenial-crybaby-spanking.js.
// Run: node plugins/python-elimination-program/hooks/test/whacking-day.test.mjs
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'whacking-day-millenial-crybaby-spanking.js');

const cases = [
  // Prose that mentions Python commands without executing them.
  ['heredoc prose', "cat >> BUGS.md <<'EOF'\n- #6: pip is probed with\npython3 -m pip --version\nEOF\nci -u BUGS.md", 'pass'],
  ['heredoc dash form', "cat <<-EOF > notes.md\n\tpip install requests\n\tEOF", 'pass'],
  ['heredoc separators', "cat >> BUGS.md <<'EOF'\nPython 3.12 default; python3 -m mypkg | pip install x\nEOF", 'pass'],
  ['double-quoted prose', 'bd comments add x "note; python3 -m mypkg was wrong"', 'pass'],
  ['single-quoted prose', "echo 'then | pip install requests'", 'pass'],
  // Real project-scope Python: still denied.
  ['real pip install', 'pip install requests', 'deny'],
  ['real script', 'python3 build.py', 'deny'],
  ['chained real', 'cd x && python3 -m mypkg', 'deny'],
  ['heredoc then real', "cat > a <<EOF\nhello\nEOF\npython3 run.py", 'deny'],
  ['bash -c executes', 'bash -c "python3 run.py"', 'deny'],
  // Windows line endings and PowerShell quoting (tool_name PowerShell for names starting "PS").
  ['heredoc CRLF', "cat >> a <<'EOF'\r\nx; python3 -m mypkg\r\nEOF\r\n", 'pass'],
  ['PS here-string prose', "@'\nnote; python3 -m mypkg\n'@ | Add-Content notes.md", 'pass'],
  ['PS backtick escape', 'Write-Host "say `"hi`" then; python3 -m mypkg"', 'pass'],
  ['PS doubled quote', "Write-Host 'it''s; pip install requests'", 'pass'],
  ['PS real pip', 'pip install requests', 'deny'],
  ['PS real script', 'python build.py', 'deny'],
  // CLI-tool patterns: still passed.
  ['pipx', 'pipx install black', 'pass'],
  ['pip --user', 'pip install --user black', 'pass'],
];

let failures = 0;
for (const [name, command, want] of cases) {
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ tool_name: name.startsWith('PS') ? 'PowerShell' : 'Bash', tool_input: { command }, cwd: '/nonexistent' }),
    encoding: 'utf8',
  });
  let got;
  try { got = JSON.parse(r.stdout).hookSpecificOutput.permissionDecision || 'pass'; } catch { got = 'error'; }
  if (got !== want) failures++;
  console.log(`${got === want ? 'ok  ' : 'FAIL'} ${name.padEnd(20)} want=${want} got=${got}`);
}
process.exitCode = failures ? 1 : 0;
