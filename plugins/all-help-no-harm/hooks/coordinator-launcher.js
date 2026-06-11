// all-help-no-harm — SessionStart side-hook coordinator launcher
//
// Detached SessionStart hook entry that launches the side-hook
// coordinator as a long-running background process when a
// side-hooks.json config exists. This file is INTENTIONALLY separate
// from session-start-contract.js so the two SessionStart hooks can be
// developed/edited independently — both fire as separate entries in
// hooks.json.
//
// Behavior:
//   1. Read SessionStart payload from stdin (for cwd + session_id).
//   2. Determine whether a side-hooks.json exists (user-level >
//      project-level > plugin-local). If none, exit silently.
//   3. Spawn the coordinator detached, with stdio:'ignore' (so the
//      harness does not wait on it), record its pid into
//      .claude/all-help-no-harm/coordinator.pid for the user to inspect.
//   4. Inject additionalContext informing the agent that side-hook
//      surveillance is active and surveillance findings are append-only
//      evidence the user controls disposition over.
//   5. Exit (the coordinator continues independently).
//
// Cross-platform: pure Node + child_process.spawn with detached:true,
// stdio:'ignore', unref() so the parent hook process can exit. This is
// the only sanctioned spawn in a hook context — the surveillance
// mechanism itself.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(''));
    } catch { resolve(''); }
  });
}

function safeExists(p) {
  try { return typeof p === 'string' && p.length > 0 && fs.existsSync(p); }
  catch { return false; }
}

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); return true; }
  catch (err) {
    const code = err && err.code;
    if (code === 'EEXIST') return true;
    try { process.stderr.write(`[coordinator-launcher] mkdir failed (${code || 'unknown'}): ${dir}\n`); } catch { /* ignore */ }
    return false;
  }
}

function atomicWrite(targetPath, contents) {
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    fs.renameSync(tmpPath, targetPath);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    try { process.stderr.write(`[coordinator-launcher] atomicWrite failed: ${err && err.code}\n`); } catch { /* ignore */ }
    return false;
  }
}

function findConfigPath(cwd) {
  const userLevel = path.join(os.homedir(), '.claude', 'all-help-no-harm', 'side-hooks.json');
  if (safeExists(userLevel)) return userLevel;
  const projectLevel = path.join(cwd, '.claude', 'all-help-no-harm', 'side-hooks.json');
  if (safeExists(projectLevel)) return projectLevel;
  const pluginLocal = path.join(__dirname, '..', 'skills', 'all-help-no-harm', 'side-hooks.json');
  if (safeExists(pluginLocal)) return pluginLocal;
  return null;
}

function isCoordinatorAlive(pidFile) {
  try {
    if (!fs.existsSync(pidFile)) return false;
    const raw = fs.readFileSync(pidFile, 'utf8');
    const pid = parseInt(String(raw).trim(), 10);
    if (!pid || pid <= 0) return false;
    // process.kill(pid, 0) throws if process is dead.
    try { process.kill(pid, 0); return true; }
    catch { return false; }
  } catch { return false; }
}

(async () => {
  let payload;
  try { payload = JSON.parse((await readStdin()) || '{}'); }
  catch { payload = {}; }

  const cwd = payload.cwd || process.cwd();
  const sessionId = payload.session_id || 'unknown-session';

  const configPath = findConfigPath(cwd);
  if (!configPath) {
    // No config — emit nothing (silent no-op).
    try { process.stdout.write(JSON.stringify({})); } catch { /* ignore */ }
    return;
  }

  const baseDir = path.join(cwd, '.claude', 'all-help-no-harm');
  ensureDir(baseDir);
  ensureDir(path.join(baseDir, 'logs'));
  const pidFile = path.join(baseDir, 'coordinator.pid');
  const launchAuditLog = path.join(baseDir, 'logs', 'coordinator-audit.jsonl');

  // Already running for this cwd? Skip respawn.
  if (isCoordinatorAlive(pidFile)) {
    try {
      fs.appendFileSync(launchAuditLog, JSON.stringify({
        ts: new Date().toISOString(), event: 'launcher_skipped_already_running',
        cwd, session_id: sessionId,
      }) + '\n');
    } catch { /* ignore */ }
    try {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: '[all-help-no-harm] side-hook coordinator is already running for this workspace. Surveillance findings (if any) accumulate in .claude/all-help-no-harm/logs/side-hooks-flags.jsonl. The user is the disposition authority over flagged findings.',
        }
      }));
    } catch { /* ignore */ }
    return;
  }

  // Spawn coordinator detached.
  const coordinatorScript = path.join(__dirname, '..', 'scripts', 'side-hook-coordinator.js');
  if (!safeExists(coordinatorScript)) {
    try { process.stderr.write(`[coordinator-launcher] coordinator script missing: ${coordinatorScript}\n`); } catch { /* ignore */ }
    try { process.stdout.write(JSON.stringify({})); } catch { /* ignore */ }
    return;
  }

  let child;
  try {
    child = spawn(process.execPath, [
      coordinatorScript,
      '--cwd', cwd,
      '--session-id', sessionId,
      '--config', configPath,
    ], {
      cwd,
      detached: true,
      stdio: 'ignore',
      env: process.env,
      windowsHide: true,
    });
    child.unref();
  } catch (err) {
    try { process.stderr.write(`[coordinator-launcher] spawn failed: ${err && err.message}\n`); } catch { /* ignore */ }
    try { process.stdout.write(JSON.stringify({})); } catch { /* ignore */ }
    return;
  }

  // Record PID for user-side inspection.
  if (child && child.pid) {
    atomicWrite(pidFile, String(child.pid));
    try {
      fs.appendFileSync(launchAuditLog, JSON.stringify({
        ts: new Date().toISOString(), event: 'launcher_spawned',
        cwd, session_id: sessionId, coordinator_pid: child.pid, config_path: configPath,
      }) + '\n');
    } catch { /* ignore */ }
  }

  // Inform the agent.
  const ctx = `[all-help-no-harm] Independent local-model surveillance is ACTIVE for this session.

Per the contract: the agent being policed CANNOT be the policeman. A separate local-model surveillance process (PID ${child.pid || 'unknown'}) is running independently of this Claude instance, evaluating assistant-message output against the R0-R14 criteria in real time. Configured side-hooks: ${configPath}

Surveillance findings accumulate in .claude/all-help-no-harm/logs/side-hooks-flags.jsonl. Disposition of findings is the user's exclusive authority — the agent does NOT silently revise its own output in response to findings. When the user surfaces a finding, the agent acknowledges it as recorded evidence and waits for user direction on remediation.

Coordinator audit log: .claude/all-help-no-harm/logs/coordinator-audit.jsonl
Coordinator PID file: .claude/all-help-no-harm/coordinator.pid

This is the structural correction for the policed-self problem. It does not replace the per-turn contract pin from user-prompt-submit-contract.js, the session-start mutual contract ritual, or the actually-im-the-ahole self-review skill — it adds an independent observer.`;

  try {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: ctx,
      }
    }));
  } catch (err) {
    try { process.stderr.write(`[coordinator-launcher] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
  }
})();
