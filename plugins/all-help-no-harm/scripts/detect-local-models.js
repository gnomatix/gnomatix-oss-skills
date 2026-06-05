// all-help-no-harm — local-model detection helper
//
// Detects locally-available inference targets on the host. Writes a JSON
// report to stdout describing every detected target. When invoked as
//   node detect-local-models.js
// emits:
//   { "detected": [ { "kind": "...", "backend": "...", ... }, ... ],
//     "host_summary": "...",
//     "errors": [ ... ] }
//
// The detection is filesystem-only. We do NOT exec model binaries or hit
// network endpoints from this script — that is the coordinator's job
// (and it does so in a defensive long-running worker, not from a hook
// process). HTTP probes for ollama/lm-studio/openai-compatible endpoints
// would require child_process or http() calls; we surface the standard
// localhost URLs as CANDIDATES that the coordinator probes at runtime.
//
// Pure Node, cross-platform per marketplace CLAUDE.md. Every fs.* call
// wrapped in try/catch; no hardcoded path separators; tolerant of missing
// directories.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const PLATFORM = process.platform; // 'linux' | 'darwin' | 'win32'

// ---------------------------------------------------------------------------
// fs helpers (defensive)
// ---------------------------------------------------------------------------

function safeStat(p) {
  try {
    if (typeof p !== 'string' || p.length === 0) return null;
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function safeReaddir(dir) {
  try {
    if (typeof dir !== 'string' || dir.length === 0) return [];
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    const code = err && err.code;
    if (code === 'ENOENT') return [];
    if (code === 'EACCES' || code === 'EPERM') return [];
    return [];
  }
}

function isFile(p) {
  const st = safeStat(p);
  return !!(st && st.isFile());
}

function isExecutable(p) {
  const st = safeStat(p);
  if (!st || !st.isFile()) return false;
  // Windows: check extension. Unix: check executable bit if accessible.
  if (PLATFORM === 'win32') {
    const lower = p.toLowerCase();
    return lower.endsWith('.exe') || lower.endsWith('.bat') ||
           lower.endsWith('.cmd') || lower.endsWith('.com');
  }
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

// Walk one directory level deep looking for .gguf files. Used for the
// known model-roots; we do NOT recurse far because a deep walk on a large
// model cache can be slow.
function ggufFilesIn(dir, maxFiles = 64) {
  const out = [];
  const entries = safeReaddir(dir);
  for (const ent of entries) {
    if (out.length >= maxFiles) break;
    try {
      const full = path.join(dir, ent.name);
      if (ent.isFile() && ent.name.toLowerCase().endsWith('.gguf')) {
        const st = safeStat(full);
        out.push({
          path: full,
          size_bytes: st ? st.size : null,
          name: ent.name,
        });
      } else if (ent.isDirectory()) {
        // one level of recursion for huggingface-style snapshots
        const subEntries = safeReaddir(full);
        for (const sub of subEntries) {
          if (out.length >= maxFiles) break;
          try {
            if (sub.isFile() && sub.name.toLowerCase().endsWith('.gguf')) {
              const subFull = path.join(full, sub.name);
              const st = safeStat(subFull);
              out.push({
                path: subFull,
                size_bytes: st ? st.size : null,
                name: sub.name,
              });
            }
          } catch { /* skip entry */ }
        }
      }
    } catch { /* skip entry */ }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Candidate roots (cross-platform)
// ---------------------------------------------------------------------------

function candidateModelRoots() {
  const roots = [];
  // User-local
  roots.push(path.join(HOME, 'models'));
  roots.push(path.join(HOME, '.cache', 'llama.cpp'));
  roots.push(path.join(HOME, '.cache', 'lm-studio', 'models'));
  roots.push(path.join(HOME, '.lmstudio', 'models'));
  roots.push(path.join(HOME, '.ollama', 'models'));
  roots.push(path.join(HOME, 'Documents', 'models'));

  // System
  if (PLATFORM !== 'win32') {
    roots.push(path.join('/', 'usr', 'local', 'share', 'models'));
    roots.push(path.join('/', 'opt', 'models'));
    roots.push(path.join('/', 'scratch', 'models'));
  } else {
    if (process.env.PROGRAMDATA) {
      roots.push(path.join(process.env.PROGRAMDATA, 'models'));
    }
  }

  // Env-overridable
  if (process.env.GGUF_MODEL_ROOT) {
    String(process.env.GGUF_MODEL_ROOT)
      .split(path.delimiter)
      .filter(Boolean)
      .forEach((r) => roots.push(r));
  }
  if (process.env.ALL_HELP_NO_HARM_MODEL_ROOTS) {
    String(process.env.ALL_HELP_NO_HARM_MODEL_ROOTS)
      .split(path.delimiter)
      .filter(Boolean)
      .forEach((r) => roots.push(r));
  }

  // /scratch/gh-review-*/models — common on this host but generally
  // a useful pattern for CI/scratch workspaces.
  const scratchRoots = safeReaddir('/scratch')
    .filter((e) => e.isDirectory())
    .map((e) => path.join('/scratch', e.name, 'models'))
    .filter((p) => safeStat(p));
  roots.push(...scratchRoots);

  // De-duplicate, preserve order
  const seen = new Set();
  return roots.filter((r) => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  });
}

function candidateLlamaCppBinaries() {
  const cands = [];
  const exe = PLATFORM === 'win32' ? '.exe' : '';

  // PATH-resolved is the common case but we cannot exec; we look at
  // well-known install dirs + the scratch llama.cpp build.
  const wellKnown = [
    path.join(HOME, 'llama.cpp', 'build', 'bin'),
    path.join(HOME, 'src', 'llama.cpp', 'build', 'bin'),
    path.join(HOME, '.local', 'bin'),
    path.join('/', 'usr', 'local', 'bin'),
    path.join('/', 'opt', 'llama.cpp', 'bin'),
  ];
  if (PLATFORM === 'win32') {
    if (process.env.LOCALAPPDATA) {
      wellKnown.push(path.join(process.env.LOCALAPPDATA, 'llama.cpp', 'bin'));
    }
  }
  // Scratch llama.cpp builds
  const scratchBuilds = safeReaddir('/scratch')
    .filter((e) => e.isDirectory())
    .map((e) => path.join('/scratch', e.name, 'llama.cpp', 'build', 'bin'));
  wellKnown.push(...scratchBuilds);

  // Env override
  if (process.env.LLAMA_CPP_BIN_DIR) {
    String(process.env.LLAMA_CPP_BIN_DIR)
      .split(path.delimiter)
      .filter(Boolean)
      .forEach((r) => wellKnown.push(r));
  }

  for (const dir of wellKnown) {
    if (!safeStat(dir)) continue;
    for (const name of ['llama-cli', 'llama-server', 'llama-run', 'main', 'server']) {
      const full = path.join(dir, `${name}${exe}`);
      if (isExecutable(full)) {
        cands.push({ name, path: full, dir });
      }
    }
  }
  // De-dup by path
  const seen = new Set();
  return cands.filter((c) => {
    if (seen.has(c.path)) return false;
    seen.add(c.path);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function detectLlamaCpp(errors) {
  const binaries = candidateLlamaCppBinaries();
  if (binaries.length === 0) return null;

  const modelRoots = candidateModelRoots();
  const ggufs = [];
  for (const root of modelRoots) {
    try {
      const found = ggufFilesIn(root, 128);
      for (const f of found) ggufs.push({ ...f, root });
    } catch (err) {
      errors.push({ stage: 'gguf-scan', root, message: String(err && err.message) });
    }
  }

  // Rank: prefer llama-server (HTTP-friendly), then llama-cli.
  const preferred = binaries.find((b) => b.name === 'llama-server') ||
                    binaries.find((b) => b.name === 'llama-cli') ||
                    binaries[0];

  return {
    kind: 'llama-cpp',
    backend: 'llama-cpp',
    available: true,
    binaries,
    preferred_binary: preferred,
    gguf_models: ggufs,
    notes: ggufs.length === 0
      ? 'llama.cpp binary detected but no .gguf models found in standard roots'
      : `${ggufs.length} .gguf model(s) discovered across ${modelRoots.length} candidate roots`,
  };
}

function detectGeminiCliGemma(errors) {
  // Gemini CLI bundles a local gemma model on some platforms. Check the
  // standard install locations. We do not exec gemini; we look for the
  // marker file.
  const candidates = [
    path.join(HOME, '.gemini', 'local-model'),
    path.join(HOME, '.gemini', 'models'),
    path.join(HOME, '.config', 'gemini', 'local-model'),
  ];
  if (PLATFORM === 'win32' && process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, 'gemini', 'local-model'));
  }
  const found = candidates.filter((p) => !!safeStat(p));
  if (found.length === 0) return null;
  return {
    kind: 'gemini-cli-gemma',
    backend: 'gemini-cli',
    available: true,
    install_paths: found,
    notes: 'Gemini CLI local-model directory detected; runtime availability requires the gemini CLI to be invokable',
  };
}

function candidateHttpEndpoints() {
  // These are documented localhost defaults. The coordinator probes them
  // at runtime; we just declare them as candidates.
  const cands = [
    { kind: 'ollama', backend: 'ollama', url: 'http://localhost:11434', probe_path: '/api/version' },
    { kind: 'lm-studio', backend: 'openai-compat', url: 'http://localhost:1234', probe_path: '/v1/models' },
    { kind: 'openai-compat-localhost', backend: 'openai-compat', url: 'http://localhost:8080', probe_path: '/v1/models' },
    { kind: 'llama-cpp-server', backend: 'openai-compat', url: 'http://localhost:8081', probe_path: '/v1/models' },
  ];
  // Env-overridable
  if (process.env.LOCAL_INFERENCE_URL) {
    cands.unshift({
      kind: 'env-override',
      backend: 'openai-compat',
      url: process.env.LOCAL_INFERENCE_URL,
      probe_path: '/v1/models',
    });
  }
  return cands;
}

function main() {
  const errors = [];
  const detected = [];

  try {
    const llama = detectLlamaCpp(errors);
    if (llama) detected.push(llama);
  } catch (err) {
    errors.push({ stage: 'llama-cpp-detect', message: String(err && err.message) });
  }

  try {
    const gemini = detectGeminiCliGemma(errors);
    if (gemini) detected.push(gemini);
  } catch (err) {
    errors.push({ stage: 'gemini-cli-detect', message: String(err && err.message) });
  }

  const httpCandidates = candidateHttpEndpoints();

  const report = {
    schema_version: 1,
    detected_at: new Date().toISOString(),
    platform: PLATFORM,
    arch: process.arch,
    host_summary: detected.length === 0
      ? 'no local model backends detected via filesystem; HTTP candidates listed for runtime probing'
      : `${detected.length} local backend(s) detected; surveillance MANDATORY when coordinator confirms availability`,
    surveillance_required: detected.length > 0,
    detected,
    http_endpoint_candidates: httpCandidates,
    errors,
  };

  try {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } catch (err) {
    try { process.stderr.write(`[detect-local-models] stdout write failed: ${err && err.message}\n`); } catch { /* ignore */ }
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  candidateModelRoots,
  candidateLlamaCppBinaries,
  candidateHttpEndpoints,
  detectLlamaCpp,
  detectGeminiCliGemma,
};
