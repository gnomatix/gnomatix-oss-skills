// GENERATED COPY — DO NOT EDIT DIRECTLY.
// Source: lib/fs-safe.js (sync with: node scripts/sync-lib.js)

// Canonical zero-dependency filesystem safety helpers for gnomatix-oss-skills.
//
// Authoritative source: lib/fs-safe.js at the marketplace root.
// Synced into individual plugins via: node scripts/sync-lib.js
//
// Cross-platform contract (CLAUDE.md): pure Node built-ins only (fs, path, os),
// zero child_process calls, every fs.* operation wrapped in try/catch, Windows
// EBUSY/EPERM retry backoff, atomic temp-file + rename writes, fail-open.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const WIN_MAX_SAFE_PATH = 240;

function sleepSync(ms) {
  const duration = Math.max(0, Number(ms) || 0);
  if (duration === 0) return;
  try {
    if (typeof SharedArrayBuffer === 'function' && typeof Atomics === 'object') {
      const buf = new SharedArrayBuffer(4);
      const arr = new Int32Array(buf);
      Atomics.wait(arr, 0, 0, duration);
      return;
    }
  } catch { /* fall through to bounded spin */ }
  const deadline = Date.now() + duration;
  while (Date.now() < deadline) { /* bounded fallback */ }
}

function normCase(p) {
  return process.platform === 'win32' || process.platform === 'darwin'
    ? p.toLowerCase()
    : p;
}

function validatePath(targetPath, opts) {
  const options = opts || {};
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    return { ok: false, resolved: null, reason: 'path must be a non-empty string' };
  }
  const expanded = targetPath.startsWith('~')
    ? path.join(os.homedir(), targetPath.slice(1))
    : targetPath;

  if (!path.isAbsolute(expanded) && !options.rootDir) {
    return { ok: false, resolved: null, reason: 'relative path requires rootDir' };
  }

  const resolved = options.rootDir
    ? path.resolve(options.rootDir, expanded)
    : path.resolve(expanded);

  if (options.rootDir) {
    const rootResolved = path.resolve(options.rootDir);
    const nr = normCase(rootResolved);
    const np = normCase(resolved);
    if (np !== nr && !np.startsWith(nr + path.sep)) {
      return { ok: false, resolved, reason: 'path escapes rootDir' };
    }
  }

  if (process.platform === 'win32' && resolved.length >= WIN_MAX_SAFE_PATH) {
    try {
      process.stderr.write(`[fs-safe] warning: path approaches Windows MAX_PATH (${resolved.length} chars): ${resolved}\n`);
    } catch { /* ignore stderr failure */ }
  }

  return { ok: true, resolved, reason: null };
}

function ensureDir(dirPath) {
  const check = validatePath(dirPath);
  if (!check.ok) return false;
  try {
    fs.mkdirSync(check.resolved, { recursive: true });
    return true;
  } catch (err) {
    if (err && err.code === 'EEXIST') return true;
    return false;
  }
}

function safeReadText(targetPath) {
  const check = validatePath(targetPath);
  if (!check.ok) return null;
  const delays = [0, 50];
  for (let i = 0; i < delays.length; i += 1) {
    if (delays[i] > 0) sleepSync(delays[i]);
    try {
      if (!fs.existsSync(check.resolved)) return null;
      return fs.readFileSync(check.resolved, 'utf8');
    } catch (err) {
      const code = err && err.code;
      if (code === 'ENOENT') return null;
      if ((code === 'EBUSY' || code === 'ETXTBSY' || code === 'EPERM') && i + 1 < delays.length) {
        continue;
      }
      return null;
    }
  }
  return null;
}

function safeReadJson(targetPath, fallback) {
  const defaultVal = fallback === undefined ? null : fallback;
  const raw = safeReadText(targetPath);
  if (raw === null) return defaultVal;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function atomicWrite(targetPath, contents) {
  const check = validatePath(targetPath);
  if (!check.ok) return false;
  const resolved = check.resolved;
  if (!ensureDir(path.dirname(resolved))) return false;

  const backoffs = [0, 50, 200, 1000];
  for (let attempt = 0; attempt < backoffs.length; attempt += 1) {
    if (backoffs[attempt] > 0) sleepSync(backoffs[attempt]);
    const tmpPath = `${resolved}.tmp.${process.pid}.${Date.now()}.${attempt}`;
    try {
      fs.writeFileSync(tmpPath, String(contents), 'utf8');
      fs.renameSync(tmpPath, resolved);
      return true;
    } catch (err) {
      try { fs.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
      const code = err && err.code;
      if (code === 'ENOENT') {
        ensureDir(path.dirname(resolved));
      }
      if ((code === 'EBUSY' || code === 'ETXTBSY' || code === 'EPERM' || code === 'ENOENT') && attempt + 1 < backoffs.length) {
        continue;
      }
      return false;
    }
  }
  return false;
}

function appendJsonl(targetPath, record) {
  const check = validatePath(targetPath);
  if (!check.ok) return false;
  const resolved = check.resolved;
  if (!ensureDir(path.dirname(resolved))) return false;

  let line;
  try {
    line = JSON.stringify(record) + '\n';
  } catch {
    return false;
  }

  const backoffs = [0, 50, 200, 1000];
  for (let attempt = 0; attempt < backoffs.length; attempt += 1) {
    if (backoffs[attempt] > 0) sleepSync(backoffs[attempt]);
    try {
      fs.appendFileSync(resolved, line, 'utf8');
      return true;
    } catch (err) {
      const code = err && err.code;
      if (code === 'ENOENT') ensureDir(path.dirname(resolved));
      if ((code === 'EBUSY' || code === 'ETXTBSY' || code === 'EPERM' || code === 'ENOENT') && attempt + 1 < backoffs.length) {
        continue;
      }
      return false;
    }
  }
  return false;
}

function cleanStaleLock(lockPath, maxAgeMs) {
  const check = validatePath(lockPath);
  if (!check.ok) return false;
  const limit = Number(maxAgeMs) > 0 ? Number(maxAgeMs) : 60000;
  try {
    if (!fs.existsSync(check.resolved)) return false;
    const st = fs.statSync(check.resolved);
    if (Date.now() - st.mtimeMs > limit) {
      fs.unlinkSync(check.resolved);
      return true;
    }
  } catch { /* ignore race */ }
  return false;
}

module.exports = {
  WIN_MAX_SAFE_PATH,
  sleepSync,
  validatePath,
  ensureDir,
  safeReadText,
  safeReadJson,
  atomicWrite,
  appendJsonl,
  cleanStaleLock,
};
