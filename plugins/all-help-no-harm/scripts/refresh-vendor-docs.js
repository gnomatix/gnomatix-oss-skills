// all-help-no-harm — refresh-vendor-docs CLI
//
// Fetches vendor TOS / Usage Policy / safety documents from corporate websites,
// GitHub, and AI cloud API doc portals as referenced in per-vendor JSON configs.
// Compares fetched content to bundled-in-repo copies, reports drift, and
// optionally writes updates.
//
// Pure Node ECMAScript per marketplace CLAUDE.md:
//   - No child_process, no shell calls
//   - No hardcoded Unix paths (path.join everywhere; os.tmpdir / os.homedir if needed)
//   - Atomic writes via temp + rename
//   - Every fs.* call wrapped in try/catch
//   - ENOENT / EACCES / EBUSY / EMFILE / ENOSPC / ENAMETOOLONG handled
//   - CRLF tolerated on text comparisons (normalize before sha256)
//   - Path length validated against conservative Windows MAX_PATH (240 chars)
//
// CLI:
//   node refresh-vendor-docs.js                       # check all vendors, report drift
//   node refresh-vendor-docs.js --vendor anthropic    # filter to one vendor
//   node refresh-vendor-docs.js --update              # write fetched -> bundled (atomic)
//   node refresh-vendor-docs.js --update --vendor google
//   node refresh-vendor-docs.js --add-vendor <id>     # scaffold vendors/<id>.json
//
// Exit codes:
//   0 — no drift detected (or successful scaffold/update)
//   2 — drift detected
//   1 — fatal error

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const url = require('url');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Resolve plugin layout. This script lives at:
//   <plugin>/scripts/refresh-vendor-docs.js
// Vendor JSON configs:
//   <plugin>/skills/all-help-no-harm/vendors/<vendor_id>.json
// Bundled doc copies:
//   <plugin>/skills/all-help-no-harm/vendor-docs/<bundled_path>
// All paths are derived from __dirname; no hardcoded Unix paths.
// ---------------------------------------------------------------------------

const SCRIPT_DIR = __dirname;
const PLUGIN_ROOT = path.dirname(SCRIPT_DIR);
const SKILL_ROOT = path.join(PLUGIN_ROOT, 'skills', 'all-help-no-harm');
const VENDORS_DIR = path.join(SKILL_ROOT, 'vendors');
const VENDOR_DOCS_DIR = path.join(SKILL_ROOT, 'vendor-docs');

// Conservative Windows MAX_PATH warning threshold.
const PATH_LENGTH_WARN = 240;

// ---------------------------------------------------------------------------
// Logging helpers. Writes structured single-line messages to stderr; never
// throws. The script reserves stdout for the final report (machine-readable
// summary lines + human-readable status).
// ---------------------------------------------------------------------------

function log(level, msg) {
  try {
    process.stderr.write(`[refresh-vendor-docs] [${level}] ${msg}\n`);
  } catch {
    // ignore — logging is best-effort
  }
}

function warn(msg) { log('warn', msg); }
function info(msg) { log('info', msg); }
function err(msg)  { log('error', msg); }

// ---------------------------------------------------------------------------
// Filesystem safety helpers per marketplace CLAUDE.md.
// ---------------------------------------------------------------------------

function isSafePath(p) {
  if (typeof p !== 'string' || p.length === 0) return false;
  // No traversal segments. Allowing them would let a malicious vendor JSON
  // write outside vendor-docs/.
  const parts = p.split(/[\\/]/);
  for (const part of parts) {
    if (part === '..') return false;
  }
  if (p.length > PATH_LENGTH_WARN) {
    warn(`path length ${p.length} approaches Windows MAX_PATH: ${p}`);
  }
  return true;
}

function safeMkdirP(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (e) {
    if (e && e.code === 'EEXIST') return true;
    err(`mkdir failed for ${dir}: ${e && e.code} ${e && e.message}`);
    return false;
  }
}

function safeReadText(p) {
  try {
    return { ok: true, data: fs.readFileSync(p, 'utf8') };
  } catch (e) {
    const code = e && e.code;
    if (code === 'ENOENT') return { ok: false, code, missing: true };
    if (code === 'EACCES' || code === 'EPERM') {
      err(`read denied for ${p}: ${code}`);
      return { ok: false, code };
    }
    if (code === 'EMFILE' || code === 'ENFILE') {
      err(`too many open files reading ${p}: ${code}`);
      return { ok: false, code };
    }
    err(`read failed for ${p}: ${code || ''} ${e && e.message}`);
    return { ok: false, code };
  }
}

function atomicWriteText(targetPath, contents) {
  if (!isSafePath(targetPath)) {
    err(`refusing unsafe path: ${targetPath}`);
    return false;
  }
  const parent = path.dirname(targetPath);
  if (!safeMkdirP(parent)) return false;

  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  const attempts = [0, 50, 200, 1000]; // ms backoff; first attempt is immediate
  for (let i = 0; i < attempts.length; i += 1) {
    const delay = attempts[i];
    if (delay > 0) {
      // Synchronous sleep loop — acceptable here because this is a one-shot
      // CLI tool, not a hook in the hot path. Keeps the script dependency-free.
      const end = Date.now() + delay;
      while (Date.now() < end) { /* spin */ }
    }
    try {
      fs.writeFileSync(tmpPath, contents, { encoding: 'utf8' });
      try {
        fs.renameSync(tmpPath, targetPath);
        return true;
      } catch (renameErr) {
        const code = renameErr && renameErr.code;
        // EBUSY / ETXTBSY can hit on Windows; retry.
        if (code === 'EBUSY' || code === 'ETXTBSY' || code === 'EPERM') {
          try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
          if (i < attempts.length - 1) {
            warn(`rename ${code} on ${targetPath}; retrying`);
            continue;
          }
        }
        err(`rename failed ${targetPath}: ${code || ''} ${renameErr && renameErr.message}`);
        try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
        return false;
      }
    } catch (writeErr) {
      const code = writeErr && writeErr.code;
      if (code === 'ENOSPC') {
        err(`no space writing ${tmpPath}: ENOSPC`);
        return false;
      }
      if (code === 'ENAMETOOLONG') {
        err(`path too long: ${tmpPath}`);
        return false;
      }
      if (code === 'EACCES' || code === 'EPERM') {
        err(`write denied for ${tmpPath}: ${code}`);
        try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
        return false;
      }
      if (code === 'EBUSY' || code === 'ETXTBSY') {
        try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
        if (i < attempts.length - 1) {
          warn(`write ${code} on ${tmpPath}; retrying`);
          continue;
        }
      }
      err(`write failed ${tmpPath}: ${code || ''} ${writeErr && writeErr.message}`);
      try { fs.unlinkSync(tmpPath); } catch { /* best-effort */ }
      return false;
    }
  }
  return false;
}

function safeReaddir(dir) {
  try {
    return { ok: true, entries: fs.readdirSync(dir) };
  } catch (e) {
    const code = e && e.code;
    if (code === 'ENOENT') return { ok: false, code, missing: true, entries: [] };
    err(`readdir failed for ${dir}: ${code || ''} ${e && e.message}`);
    return { ok: false, code, entries: [] };
  }
}

// ---------------------------------------------------------------------------
// HTTPS fetch (Node built-in only). Follows up to 5 redirects. Decodes
// gzip / deflate / br. Reads response into a Buffer. Returns { ok, status,
// finalUrl, buffer, contentType }.
// ---------------------------------------------------------------------------

const REDIRECT_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_BODY_BYTES = 25 * 1024 * 1024; // 25 MB cap

function fetchUrl(targetUrl, redirectsLeft) {
  if (typeof redirectsLeft !== 'number') redirectsLeft = REDIRECT_LIMIT;

  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new url.URL(targetUrl);
    } catch (e) {
      resolve({ ok: false, error: `invalid URL ${targetUrl}: ${e && e.message}` });
      return;
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const reqOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'refresh-vendor-docs/1.0 (+all-help-no-harm; Node.js)',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/json,text/markdown,text/plain,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };
    let req;
    try {
      req = lib.request(parsed, reqOptions, (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          if (redirectsLeft <= 0) {
            resolve({ ok: false, error: `redirect limit exceeded at ${targetUrl}` });
            return;
          }
          let nextUrl;
          try {
            nextUrl = new url.URL(res.headers.location, parsed).toString();
          } catch (e) {
            resolve({ ok: false, error: `bad redirect location ${res.headers.location}: ${e && e.message}` });
            return;
          }
          res.resume();
          fetchUrl(nextUrl, redirectsLeft - 1).then(resolve);
          return;
        }

        const encoding = (res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        try {
          if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
          else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
          else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());
        } catch (e) {
          resolve({ ok: false, error: `decompress setup failed: ${e && e.message}` });
          return;
        }

        const chunks = [];
        let total = 0;
        let aborted = false;
        stream.on('data', (chunk) => {
          if (aborted) return;
          total += chunk.length;
          if (total > MAX_BODY_BYTES) {
            aborted = true;
            try { req.destroy(); } catch { /* ignore */ }
            resolve({ ok: false, error: `body exceeded ${MAX_BODY_BYTES} bytes at ${targetUrl}` });
            return;
          }
          chunks.push(chunk);
        });
        stream.on('end', () => {
          if (aborted) return;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            finalUrl: targetUrl,
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || '',
          });
        });
        stream.on('error', (e) => {
          if (aborted) return;
          aborted = true;
          resolve({ ok: false, error: `stream error: ${e && e.message}` });
        });
      });
    } catch (e) {
      resolve({ ok: false, error: `request init failed: ${e && e.message}` });
      return;
    }

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      try { req.destroy(new Error('request timeout')); } catch { /* ignore */ }
      resolve({ ok: false, error: `request timeout after ${REQUEST_TIMEOUT_MS}ms at ${targetUrl}` });
    });
    req.on('error', (e) => {
      resolve({ ok: false, error: `request error: ${e && e.message}` });
    });
    req.end();
  });
}

// ---------------------------------------------------------------------------
// HTML -> readable-text extraction. Simple readability-style heuristic:
//   1. Strip <script>, <style>, <noscript>, <svg>, <head> blocks entirely.
//   2. Drop <nav>, <header>, <footer>, <aside>, <form> blocks.
//   3. Prefer <main> or <article> content if present.
//   4. Convert remaining block-level open/close tags to newlines.
//   5. Decode the most common HTML entities.
//   6. Collapse runs of whitespace; trim each line; drop blank lines.
//
// No external deps. Good-enough fingerprint for drift detection; not aiming for
// pixel-perfect markdown.
// ---------------------------------------------------------------------------

function stripBlocks(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  return html.replace(re, ' ');
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&copy;/gi, '©')
    .replace(/&reg;/gi, '®')
    .replace(/&trade;/gi, '™')
    .replace(/&#(\d+);/g, (_, n) => {
      const cp = parseInt(n, 10);
      if (!Number.isFinite(cp) || cp < 32 || cp > 0x10FFFF) return '';
      try { return String.fromCodePoint(cp); } catch { return ''; }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      const cp = parseInt(n, 16);
      if (!Number.isFinite(cp) || cp < 32 || cp > 0x10FFFF) return '';
      try { return String.fromCodePoint(cp); } catch { return ''; }
    });
}

function extractHtmlText(html) {
  if (typeof html !== 'string') return '';
  let s = html;

  // Strip non-content blocks.
  for (const tag of ['script', 'style', 'noscript', 'svg', 'head', 'nav', 'header', 'footer', 'aside', 'form', 'iframe', 'template']) {
    s = stripBlocks(s, tag);
  }

  // Prefer <main> or <article> if present.
  const mainMatch = s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = s.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch && mainMatch[1].length > 200) {
    s = mainMatch[1];
  } else if (articleMatch && articleMatch[1].length > 200) {
    s = articleMatch[1];
  }

  // Strip comments.
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');

  // Convert <br> and <hr> to newlines.
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\s*hr\s*\/?\s*>/gi, '\n');

  // Convert block-level tag boundaries to newlines.
  const blockTags = 'p|div|section|article|main|header|footer|nav|aside|li|ul|ol|tr|td|th|thead|tbody|tfoot|table|h[1-6]|blockquote|pre|figure|figcaption|address|details|summary';
  const openRe = new RegExp(`<(?:${blockTags})\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`<\\/(?:${blockTags})\\s*>`, 'gi');
  s = s.replace(openRe, '\n').replace(closeRe, '\n');

  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, '');

  // Decode entities.
  s = decodeEntities(s);

  // Normalize whitespace: tolerate CRLF, collapse intra-line whitespace, drop
  // blank-line runs.
  const lines = s.split(/\r?\n/).map((l) => l.replace(/[ \t\f\v]+/g, ' ').trim());
  const out = [];
  let lastBlank = false;
  for (const line of lines) {
    if (line.length === 0) {
      if (!lastBlank && out.length > 0) {
        out.push('');
        lastBlank = true;
      }
    } else {
      out.push(line);
      lastBlank = false;
    }
  }
  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Per-source-type fetch + transform.
// ---------------------------------------------------------------------------

async function fetchAndTransform(doc) {
  const src = doc && doc.source;
  if (!src || typeof src !== 'object') {
    return { ok: false, error: 'document has no source object' };
  }
  const type = src.type;
  const u = src.url;
  if (type === 'pdf') {
    return { ok: false, skipped: true, error: 'PDF fetch not yet supported (v1)' };
  }
  if (typeof u !== 'string' || u.length === 0) {
    return { ok: false, error: 'source.url missing' };
  }

  const fetched = await fetchUrl(u);
  if (!fetched.ok) {
    return { ok: false, error: fetched.error || `HTTP ${fetched.status}` };
  }
  let bodyText;
  try {
    bodyText = fetched.buffer.toString('utf8');
  } catch (e) {
    return { ok: false, error: `body decode failed: ${e && e.message}` };
  }

  let transformed;
  if (type === 'html') {
    transformed = extractHtmlText(bodyText);
  } else if (type === 'markdown') {
    // Normalize CRLF to LF, trim trailing whitespace per line, trim trailing blank lines.
    const lines = bodyText.split(/\r?\n/).map((l) => l.replace(/[ \t]+$/g, ''));
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    transformed = lines.join('\n') + '\n';
  } else if (type === 'json') {
    try {
      const parsed = JSON.parse(bodyText);
      transformed = JSON.stringify(parsed, null, 2) + '\n';
    } catch (e) {
      return { ok: false, error: `JSON parse failed: ${e && e.message}` };
    }
  } else {
    return { ok: false, error: `unknown source.type: ${type}` };
  }

  return { ok: true, content: transformed };
}

// ---------------------------------------------------------------------------
// Content hashing. Normalize line endings to LF before hashing so a CRLF-
// converted checkout doesn't generate spurious drift on Windows.
// ---------------------------------------------------------------------------

function sha256Of(text) {
  const normalized = String(text).replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Vendor JSON load / save.
// ---------------------------------------------------------------------------

function listVendorFiles(filterId) {
  const r = safeReaddir(VENDORS_DIR);
  if (!r.ok && !r.missing) return [];
  const out = [];
  for (const entry of r.entries) {
    if (!entry.endsWith('.json')) continue;
    const id = entry.slice(0, -5);
    if (filterId && id !== filterId) continue;
    out.push({ id, file: path.join(VENDORS_DIR, entry) });
  }
  return out;
}

function loadVendor(file) {
  const r = safeReadText(file);
  if (!r.ok) return { ok: false, error: r.code || 'read failed' };
  try {
    const parsed = JSON.parse(r.data);
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: `parse: ${e && e.message}` };
  }
}

function saveVendor(file, data) {
  const text = JSON.stringify(data, null, 2) + '\n';
  return atomicWriteText(file, text);
}

// ---------------------------------------------------------------------------
// Per-vendor processing.
// ---------------------------------------------------------------------------

async function processVendor(vendorEntry, opts) {
  const { id, file } = vendorEntry;
  const loaded = loadVendor(file);
  if (!loaded.ok) {
    err(`vendor ${id}: failed to load: ${loaded.error}`);
    return { id, fatal: true, results: [] };
  }
  const vendor = loaded.data;
  const docs = Array.isArray(vendor.documents) ? vendor.documents : [];
  if (docs.length === 0) {
    info(`vendor ${id}: no documents configured`);
    return { id, fatal: false, results: [] };
  }

  const results = [];
  let mutated = false;

  for (const doc of docs) {
    const docId = doc && doc.id ? String(doc.id) : '<missing-id>';
    if (!doc || !doc.bundled_path) {
      err(`vendor ${id}: doc ${docId}: missing bundled_path; skipping`);
      results.push({ docId, status: 'error', reason: 'missing bundled_path' });
      continue;
    }
    if (!isSafePath(doc.bundled_path)) {
      err(`vendor ${id}: doc ${docId}: unsafe bundled_path ${doc.bundled_path}; skipping`);
      results.push({ docId, status: 'error', reason: 'unsafe bundled_path' });
      continue;
    }

    const bundledAbs = path.join(VENDOR_DOCS_DIR, doc.bundled_path);
    const fetched = await fetchAndTransform(doc);
    if (!fetched.ok) {
      if (fetched.skipped) {
        info(`vendor ${id}: doc ${docId}: ${fetched.error}`);
        results.push({ docId, status: 'skipped', reason: fetched.error });
      } else {
        err(`vendor ${id}: doc ${docId}: fetch failed: ${fetched.error}`);
        results.push({ docId, status: 'fetch-error', reason: fetched.error });
      }
      continue;
    }
    const newHash = sha256Of(fetched.content);
    const existing = safeReadText(bundledAbs);
    let existingHash = null;
    if (existing.ok) {
      existingHash = sha256Of(existing.data);
    }

    if (existing.ok && existingHash === newHash) {
      results.push({ docId, status: 'unchanged', bundled: bundledAbs });
      continue;
    }

    if (!existing.ok && existing.missing) {
      // First fetch of this doc.
      if (opts.update) {
        if (atomicWriteText(bundledAbs, fetched.content)) {
          doc.last_fetched = new Date().toISOString();
          doc.sha256 = newHash;
          mutated = true;
          results.push({ docId, status: 'new', bundled: bundledAbs, bytes: Buffer.byteLength(fetched.content, 'utf8') });
        } else {
          results.push({ docId, status: 'write-error', bundled: bundledAbs });
        }
      } else {
        results.push({ docId, status: 'new-pending', bundled: bundledAbs, bytes: Buffer.byteLength(fetched.content, 'utf8') });
      }
      continue;
    }

    // Drift case.
    if (opts.update) {
      if (atomicWriteText(bundledAbs, fetched.content)) {
        doc.last_fetched = new Date().toISOString();
        doc.sha256 = newHash;
        mutated = true;
        results.push({ docId, status: 'updated', bundled: bundledAbs, oldHash: existingHash, newHash });
      } else {
        results.push({ docId, status: 'write-error', bundled: bundledAbs });
      }
    } else {
      results.push({ docId, status: 'drift', bundled: bundledAbs, oldHash: existingHash, newHash });
    }
  }

  if (mutated) {
    if (!saveVendor(file, vendor)) {
      err(`vendor ${id}: failed to persist vendor JSON updates`);
    }
  }

  return { id, fatal: false, results };
}

// ---------------------------------------------------------------------------
// --add-vendor scaffold.
// ---------------------------------------------------------------------------

function scaffoldVendor(id) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
    err(`invalid vendor id ${id}; use [a-z0-9_-]`);
    return false;
  }
  if (!safeMkdirP(VENDORS_DIR)) return false;
  const file = path.join(VENDORS_DIR, `${id}.json`);
  if (fs.existsSync(file)) {
    err(`vendor file already exists: ${file}`);
    return false;
  }
  const scaffold = {
    vendor_id: id,
    vendor_name: '',
    vendor_short: '',
    agent_name: '',
    model_list: '',
    documents: [],
  };
  return atomicWriteText(file, JSON.stringify(scaffold, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Argument parsing. Hand-rolled to avoid external deps.
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { update: false, vendor: null, addVendor: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--update') opts.update = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--vendor') {
      opts.vendor = argv[i + 1] || null;
      i += 1;
    } else if (a.startsWith('--vendor=')) {
      opts.vendor = a.slice('--vendor='.length);
    } else if (a === '--add-vendor') {
      opts.addVendor = argv[i + 1] || null;
      i += 1;
    } else if (a.startsWith('--add-vendor=')) {
      opts.addVendor = a.slice('--add-vendor='.length);
    } else {
      warn(`ignoring unknown argument: ${a}`);
    }
  }
  return opts;
}

function printHelp() {
  const lines = [
    'refresh-vendor-docs — fetch vendor TOS/policy docs and report drift',
    '',
    'Usage:',
    '  node refresh-vendor-docs.js                        # check all vendors',
    '  node refresh-vendor-docs.js --vendor <id>          # check one vendor',
    '  node refresh-vendor-docs.js --update               # write fetched -> bundled',
    '  node refresh-vendor-docs.js --update --vendor <id>',
    '  node refresh-vendor-docs.js --add-vendor <id>      # scaffold vendors/<id>.json',
    '',
    'Exit codes: 0 no drift, 2 drift detected, 1 fatal error.',
    '',
  ];
  process.stdout.write(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

(async () => {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  // Ensure plugin dirs exist before doing anything else.
  if (!safeMkdirP(VENDORS_DIR)) { process.exit(1); }
  if (!safeMkdirP(VENDOR_DOCS_DIR)) { process.exit(1); }

  if (opts.addVendor) {
    const ok = scaffoldVendor(opts.addVendor);
    if (!ok) process.exit(1);
    process.stdout.write(`scaffolded ${path.join(VENDORS_DIR, opts.addVendor + '.json')}\n`);
    process.exit(0);
  }

  const vendorFiles = listVendorFiles(opts.vendor);
  if (vendorFiles.length === 0) {
    err(opts.vendor ? `no vendor JSON found for ${opts.vendor}` : `no vendor JSONs found under ${VENDORS_DIR}`);
    process.exit(1);
  }

  let anyDrift = false;
  let anyFatal = false;
  const summary = [];

  for (const v of vendorFiles) {
    const res = await processVendor(v, opts);
    if (res.fatal) anyFatal = true;
    for (const r of res.results) {
      summary.push({ vendor: res.id, ...r });
      if (r.status === 'drift' || r.status === 'new-pending') anyDrift = true;
    }
  }

  // Human-readable status to stdout.
  const out = [];
  out.push(`refresh-vendor-docs report (${opts.update ? 'update mode' : 'check mode'})`);
  out.push(`vendors_dir: ${VENDORS_DIR}`);
  out.push(`vendor_docs_dir: ${VENDOR_DOCS_DIR}`);
  out.push('');
  for (const row of summary) {
    const parts = [`[${row.vendor}]`, row.docId, '->', row.status];
    if (row.bundled) parts.push(`(${path.relative(VENDOR_DOCS_DIR, row.bundled)})`);
    if (row.bytes != null) parts.push(`${row.bytes}B`);
    if (row.reason) parts.push(`-- ${row.reason}`);
    if (row.oldHash && row.newHash) parts.push(`${row.oldHash.slice(0, 8)} -> ${row.newHash.slice(0, 8)}`);
    out.push(parts.join(' '));
  }
  out.push('');
  out.push(`total docs: ${summary.length}`);
  out.push(`drift: ${anyDrift ? 'YES' : 'no'}`);
  out.push(`fatal: ${anyFatal ? 'YES' : 'no'}`);
  process.stdout.write(out.join('\n') + '\n');

  if (anyFatal) process.exit(1);
  if (anyDrift) process.exit(2);
  process.exit(0);
})().catch((e) => {
  err(`unhandled: ${e && e.stack || e && e.message || e}`);
  process.exit(1);
});
