#!/usr/bin/env node
// Formal Asset Review Suite Builder & Helper for update-readme-images
//
// Generates and maintains:
//   - assets/review/manifest.json   (registry of active & retained alternate candidate assets + human review status)
//   - assets/review/ratings.json    (persisted 0-12 Spinal Tap ratings & revision comments)
//   - assets/review/preview.html    (interactive dark-mode review page with 0-12 rating scale & comments)
//   - assets/review/review-server.js (local persistence HTTP server on 127.0.0.1:8799)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function versionedAssetPath(relPath, releaseVersion) {
  const normRel = String(relPath || '').replace(/\\/g, '/');
  const tag = String(releaseVersion || '').trim().replace(/^v?/, 'v');
  if (!tag || tag === 'v') return normRel;
  if (normRel.includes(`-${tag}.`) || normRel.includes(`-${tag}-`)) return normRel;
  const panelMatch = /^(.*)-panel(\.[a-z0-9]+)$/i.exec(normRel);
  if (panelMatch) {
    const baseWithoutOldVer = panelMatch[1].replace(/-v\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i, '');
    return `${baseWithoutOldVer}-${tag}-panel${panelMatch[2]}`;
  }
  const bannerMatch = /^(.*)-banner(\.[a-z0-9]+)$/i.exec(normRel);
  if (bannerMatch && !/release-v\d+\.\d+\.\d+$/i.test(bannerMatch[1])) {
    const baseWithoutOldVer = bannerMatch[1].replace(/-v\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i, '');
    return `${baseWithoutOldVer}-${tag}-banner${bannerMatch[2]}`;
  }
  const extMatch = /^(.*)(\.[a-z0-9]+)$/i.exec(normRel);
  if (extMatch) {
    const baseWithoutOldVer = extMatch[1].replace(/-v\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i, '');
    return `${baseWithoutOldVer}-${tag}${extMatch[2]}`;
  }
  return `${normRel}-${tag}`;
}

export function buildReviewServerSource() {
  return `#!/usr/bin/env node
// review-server.js
// Lightweight local review persistence server for assets/review/preview.html
// Saves ratings (0..12) and comments directly to assets/review/ratings.json

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const RATINGS_FILE = path.join(HERE, 'ratings.json');
const PORT = Number(process.env.GNOX_ASSET_REVIEW_PORT || 8799);

if (!fs.existsSync(RATINGS_FILE)) {
  fs.writeFileSync(RATINGS_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), items: {} }, null, 2) + '\\n');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'GET' && (urlPath === '/' || urlPath === '/preview.html')) {
    res.writeHead(302, { Location: '/assets/review/preview.html' });
    res.end();
    return;
  }

  if (req.method === 'GET' && urlPath === '/ratings') {
    try {
      const data = fs.readFileSync(RATINGS_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ updatedAt: null, items: {} }));
    }
    return;
  }

  if (req.method === 'POST' && urlPath === '/save') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const payload = {
          updatedAt: new Date().toISOString(),
          items: parsed.items || parsed
        };
        fs.writeFileSync(RATINGS_FILE, JSON.stringify(payload, null, 2) + '\\n');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, savedAt: payload.updatedAt }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
    });
    return;
  }

  const filePath = path.resolve(REPO_ROOT, '.' + decodeURIComponent(urlPath));
  const rel = path.relative(REPO_ROOT, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(\`Asset Review server listening on http://127.0.0.1:\${PORT}/assets/review/preview.html -> \${RATINGS_FILE}\`);
});
`;
}

export function buildPreviewHtml(manifest) {
  const workspaceRoot = manifest.workspace_root || 'repository';
  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];
  const storageKey = `gnox_asset_reviews_${workspaceRoot}_v1`;

  function renderCard(item, sectionId) {
    const hasImg = Boolean(item.img);
    const isPending = (item.review_status || 'PENDING_HUMAN_REVIEW') === 'PENDING_HUMAN_REVIEW';
    const isAlt = item.variant === 'alternate';
    const mediaHtml = hasImg
      ? (item.checkerboard
        ? `<div class="checkerboard"><img src="${escHtml(item.img)}" style="max-width:${escHtml(item.maxWidth || '100%')}; border:none;" alt="${escHtml(item.id)}" loading="lazy" /></div>`
        : `<img src="${escHtml(item.img)}" alt="${escHtml(item.id)}" loading="lazy" />`)
      : `<div class="queued-box"><div class="queued-badge">QUEUED CANDIDATE</div><div class="queued-prompt">${escHtml(item.plannedPrompt || '')}</div></div>`;

    const borderStyle = isPending && !isAlt
      ? 'border: 2px solid #FFD90F;'
      : (isAlt ? 'border: 1px dashed #60a5fa;' : '');

    return `
      <div class="card" data-card-id="${escHtml(item.id)}" data-section="${escHtml(sectionId)}" data-has-img="${hasImg ? '1' : '0'}" data-pending="${isPending ? '1' : '0'}" data-variant="${escHtml(item.variant || 'active')}" style="${borderStyle}">
        <div class="card-header">
          <div>
            <h3>${escHtml(item.role)}</h3>
            <div class="target">Target: <code>${escHtml(item.target)}</code> • Release: <code>${escHtml(item.release_version || 'unversioned')}</code> • Status: <code>${escHtml(item.review_status || 'PENDING_HUMAN_REVIEW')}</code> • ID: <code>${escHtml(item.id)}</code></div>
          </div>
          <span class="rating-pill" id="pill-${escHtml(item.id)}">Unrated</span>
        </div>
        ${mediaHtml}
        <p class="desc">${escHtml(item.desc || '')}</p>
        <div class="review-controls">
          <div class="rating-row">
            <label for="rate-${escHtml(item.id)}">Rating (0–12):</label>
            <select id="rate-${escHtml(item.id)}" data-id="${escHtml(item.id)}" class="rating-select">
              <option value="">— Select (0–12) —</option>
              <option value="12">12 — Beyond Spinal Tap (Hall of Fame / Frame It!)</option>
              <option value="11">11 — Spinal Tap Perfection (Ship Immediately)</option>
              <option value="10">10 — Exceptional</option>
              <option value="9">9 — Very Good (Keep)</option>
              <option value="8">8 — Good Candidate</option>
              <option value="7">7 — Decent / Minor Tweaks</option>
              <option value="6">6 — Borderline</option>
              <option value="5">5 — Mediocre</option>
              <option value="4">4 — Weak</option>
              <option value="3">3 — Poor</option>
              <option value="2">2 — Bad</option>
              <option value="1">1 — Terrible</option>
              <option value="0">0 — Complete Trash (Nuke &amp; Redo)</option>
            </select>
          </div>
          <div class="comment-row">
            <label for="comment-${escHtml(item.id)}">Comments / Revision Notes:</label>
            <textarea id="comment-${escHtml(item.id)}" data-id="${escHtml(item.id)}" class="comment-box" rows="2" placeholder="Add rating rationale, revision instructions, font/title feedback, keep/promote/trash..."></textarea>
          </div>
        </div>
      </div>`;
  }

  const sectionsHtml = sections.map((sec, idx) => `
  <section class="plugin-section" id="section-${escHtml(sec.id || idx)}">
    <div class="plugin-header">
      <h2>${sec.num != null ? sec.num : idx + 1}. <code>${escHtml(sec.title || sec.id)}</code></h2>
      <div class="plugin-meta">
        ${sec.scope ? `<span><strong>Scope:</strong> <code>${escHtml(sec.scope)}</code></span>` : ''}
        ${sec.theme ? `<span><strong>Theme:</strong> ${escHtml(sec.theme)}</span>` : ''}
        ${sec.todo_ref ? `<span><strong>Human Review TODO:</strong> <code>${escHtml(sec.todo_ref)}</code></span>` : ''}
      </div>
    </div>
    <div class="grid">
      ${(sec.items || []).map((it) => renderCard(it, sec.id || String(idx))).join('\n')}
    </div>
  </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escHtml(workspaceRoot)} — Formal Visual Asset Review Suite (0–12 Rating &amp; Comments)</title>
<style>
  * { box-sizing: border-box; }
  body { background: #111418; color: #f0f4f8; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 0 32px 64px 32px; }
  .topbar {
    position: sticky; top: 0; z-index: 100;
    background: rgba(17, 20, 24, 0.96); backdrop-filter: blur(8px);
    border-bottom: 2px solid #2d3642; padding: 14px 24px; margin: 0 -32px 28px -32px;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  }
  .topbar-title h1 { color: #FFD90F; margin: 0; font-size: 22px; }
  .topbar-title .sub { color: #9fb3c8; font-size: 13px; margin-top: 2px; }
  .toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .status-indicator { font-size: 13px; padding: 6px 12px; border-radius: 6px; background: #1e2630; border: 1px solid #334050; color: #7cc4fa; }
  .btn {
    background: #2b3543; color: #fff; border: 1px solid #48566a; padding: 7px 13px;
    border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
  }
  .btn:hover { background: #384659; }
  .btn-primary { background: #FFD90F; color: #111; border-color: #e6c200; }
  .btn-primary:hover { background: #ffe347; }
  .plugin-section { margin-bottom: 42px; }
  .plugin-header {
    background: #1a2028; border-left: 5px solid #FFD90F; padding: 12px 18px;
    border-radius: 6px; margin-bottom: 18px;
  }
  .plugin-header h2 { margin: 0 0 6px 0; color: #FFD90F; font-size: 21px; }
  .plugin-header h2 code { color: #fff; background: #262f3b; padding: 2px 8px; border-radius: 4px; }
  .plugin-meta { display: flex; flex-wrap: wrap; gap: 18px; color: #b8c7d8; font-size: 13.5px; }
  .plugin-meta code { color: #7cc4fa; background: #12161c; padding: 2px 6px; border-radius: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(540px, 1fr)); gap: 22px; }
  .card {
    background: #1c2128; border: 1px solid #303844; border-radius: 12px; padding: 18px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4); display: flex; flex-direction: column;
  }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
  .card h3 { margin: 0 0 4px 0; color: #f8fafc; font-size: 16.5px; }
  .target { color: #8da2b8; font-size: 12px; line-height: 1.5; }
  .target code { color: #7cc4fa; background: #12161b; padding: 1px 5px; border-radius: 3px; }
  .rating-pill {
    font-size: 12.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
    background: #2b323c; color: #9fb3c8; white-space: nowrap;
  }
  .pill-high { background: #14532d; color: #86efac; border: 1px solid #22c55e; }
  .pill-eleven { background: #713f12; color: #fde047; border: 1px solid #facc15; }
  .pill-twelve { background: #581c87; color: #f5d0fe; border: 2px solid #e879f9; box-shadow: 0 0 12px rgba(232, 121, 249, 0.55); }
  .pill-mid { background: #3b2f13; color: #fcd34d; border: 1px solid #f59e0b; }
  .pill-low { background: #4c111b; color: #fca5a5; border: 1px solid #ef4444; }
  .card img { max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #000; display: block; margin: 0 auto 12px auto; }
  .checkerboard {
    background-image: linear-gradient(45deg, #2a2f37 25%, transparent 25%), linear-gradient(-45deg, #2a2f37 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2f37 75%), linear-gradient(-45deg, transparent 75%, #2a2f37 75%);
    background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: #181b20; padding: 16px; border-radius: 8px; margin-bottom: 12px;
  }
  .queued-box { background: #141920; border: 2px dashed #3b4859; border-radius: 8px; padding: 18px; margin-bottom: 12px; }
  .queued-badge { color: #FFD90F; font-weight: 700; font-size: 13px; margin-bottom: 8px; }
  .queued-prompt { color: #cbd5e1; font-size: 13.5px; line-height: 1.5; }
  .desc { color: #cbd5e1; font-size: 13.5px; line-height: 1.45; margin: 0 0 14px 0; }
  .review-controls { margin-top: auto; background: #14181e; border: 1px solid #28303d; border-radius: 8px; padding: 12px; }
  .rating-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .rating-row label, .comment-row label { font-size: 12.5px; font-weight: 600; color: #9fb3c8; }
  .rating-select {
    flex: 1; background: #1f2630; color: #fff; border: 1px solid #3c4858; border-radius: 6px;
    padding: 6px 10px; font-size: 13.5px; font-weight: 600;
  }
  .comment-row { display: flex; flex-direction: column; gap: 5px; }
  .comment-box {
    width: 100%; background: #1f2630; color: #f0f4f8; border: 1px solid #3c4858; border-radius: 6px;
    padding: 8px 10px; font-size: 13px; font-family: inherit; resize: vertical;
  }
  .comment-box:focus, .rating-select:focus { outline: none; border-color: #FFD90F; }
</style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-title">
      <h1>${escHtml(workspaceRoot)} — Formal Visual Asset Review Suite</h1>
      <div class="sub">Active Versioned Assets + Retained Gitea Alternates • Rate 0–12 &amp; Comment (Auto-Saves to assets/review/ratings.json via node assets/review/review-server.js &amp; Browser)</div>
    </div>
    <div class="toolbar-actions">
      <div class="status-indicator" id="save-status">Ready • 0 rated</div>
      <button class="btn" onclick="filterCards('all')">Show All</button>
      <button class="btn btn-primary" onclick="filterCards('pending')">Pending Human Review</button>
      <button class="btn" onclick="filterCards('active')">Active Live Only</button>
      <button class="btn" onclick="filterCards('alternate')">Retained Alternates</button>
      <button class="btn" onclick="copyReviewSummary()">Copy Review Summary</button>
      <button class="btn btn-primary" onclick="exportRatingsJson()">Download ratings.json</button>
    </div>
  </div>

  ${sectionsHtml}

<script>
const STORAGE_KEY = ${JSON.stringify(storageKey)};
const SERVER_URL = 'http://127.0.0.1:8799';
let state = {};

function updatePill(id, rating) {
  const pill = document.getElementById('pill-' + id);
  if (!pill) return;
  pill.className = 'rating-pill';
  if (rating === '' || rating === undefined || rating === null) {
    pill.textContent = 'Unrated';
    return;
  }
  const n = Number(rating);
  pill.textContent = 'Rating: ' + n + ' / 12';
  if (n === 12) pill.classList.add('pill-twelve');
  else if (n === 11) pill.classList.add('pill-eleven');
  else if (n >= 8) pill.classList.add('pill-high');
  else if (n >= 5) pill.classList.add('pill-mid');
  else pill.classList.add('pill-low');
}

function updateStats(syncMsg) {
  const entries = Object.values(state);
  const ratedCount = entries.filter(e => e.rating !== undefined && e.rating !== '').length;
  const commentCount = entries.filter(e => e.comment && e.comment.trim().length > 0).length;
  const el = document.getElementById('save-status');
  el.textContent = (syncMsg || 'Saved') + ' • ' + ratedCount + ' rated • ' + commentCount + ' comments';
}

let saveTimer = null;
function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateStats('Saving...');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const res = await fetch(SERVER_URL + '/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state })
      });
      if (res.ok) updateStats('Synced to ratings.json');
      else updateStats('Saved in browser');
    } catch {
      updateStats('Saved in browser (run node assets/review/review-server.js to sync to disk)');
    }
  }, 250);
}

async function init() {
  try {
    const localRaw = localStorage.getItem(STORAGE_KEY);
    if (localRaw) state = JSON.parse(localRaw);
  } catch {}

  try {
    const res = await fetch(SERVER_URL + '/ratings');
    if (res.ok) {
      const remote = await res.json();
      if (remote && remote.items && Object.keys(remote.items).length > 0) {
        state = { ...remote.items, ...state };
      }
    }
  } catch {}

  document.querySelectorAll('.rating-select').forEach(sel => {
    const id = sel.dataset.id;
    if (state[id] && state[id].rating !== undefined) {
      sel.value = state[id].rating;
      updatePill(id, state[id].rating);
    }
    sel.addEventListener('change', () => {
      state[id] = state[id] || {};
      state[id].rating = sel.value;
      state[id].updatedAt = new Date().toISOString();
      updatePill(id, sel.value);
      persistState();
    });
  });

  document.querySelectorAll('.comment-box').forEach(box => {
    const id = box.dataset.id;
    if (state[id] && state[id].comment) {
      box.value = state[id].comment;
    }
    box.addEventListener('input', () => {
      state[id] = state[id] || {};
      state[id].comment = box.value;
      state[id].updatedAt = new Date().toISOString();
      persistState();
    });
  });

  updateStats('Loaded');
}

function filterCards(mode) {
  document.querySelectorAll('.card').forEach(card => {
    if (mode === 'all') card.style.display = 'flex';
    else if (mode === 'pending') card.style.display = card.dataset.pending === '1' ? 'flex' : 'none';
    else if (mode === 'active') card.style.display = card.dataset.variant === 'active' ? 'flex' : 'none';
    else if (mode === 'alternate') card.style.display = card.dataset.variant === 'alternate' ? 'flex' : 'none';
  });
}

function exportRatingsJson() {
  const blob = new Blob([JSON.stringify({ updatedAt: new Date().toISOString(), items: state }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ratings.json';
  a.click();
}

async function copyReviewSummary() {
  const lines = [];
  for (const [id, val] of Object.entries(state)) {
    if ((val.rating !== undefined && val.rating !== '') || (val.comment && val.comment.trim())) {
      lines.push('- **' + id + '**: Rating=' + (val.rating !== '' && val.rating !== undefined ? val.rating + '/12' : 'unrated') + (val.comment ? ' — ' + val.comment.trim() : ''));
    }
  }
  const text = lines.length ? lines.join('\\n') : 'No ratings or comments entered yet.';
  await navigator.clipboard.writeText(text);
  updateStats('Copied summary to clipboard!');
}

init();
</script>
</body>
</html>
`;
}

export function generateReviewSuite(repoRoot) {
  const reviewDir = path.join(repoRoot, 'assets', 'review');
  const manifestPath = path.join(reviewDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing asset review manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.mkdirSync(reviewDir, { recursive: true });

  const previewPath = path.join(reviewDir, 'preview.html');
  const serverPath = path.join(reviewDir, 'review-server.js');
  const ratingsPath = path.join(reviewDir, 'ratings.json');

  fs.writeFileSync(previewPath, buildPreviewHtml(manifest), 'utf8');
  fs.writeFileSync(serverPath, buildReviewServerSource(), 'utf8');
  if (!fs.existsSync(ratingsPath)) {
    fs.writeFileSync(ratingsPath, JSON.stringify({ updatedAt: null, items: {} }, null, 2) + '\n', 'utf8');
  }

  let totalCards = 0;
  let pendingCards = 0;
  for (const sec of manifest.sections || []) {
    for (const it of sec.items || []) {
      totalCards += 1;
      if ((it.review_status || 'PENDING_HUMAN_REVIEW') === 'PENDING_HUMAN_REVIEW') pendingCards += 1;
    }
  }

  return {
    review_dir: 'assets/review',
    manifest_path: 'assets/review/manifest.json',
    preview_html: 'assets/review/preview.html',
    review_server: 'assets/review/review-server.js',
    ratings_json: 'assets/review/ratings.json',
    sections: (manifest.sections || []).length,
    total_cards: totalCards,
    pending_human_review_cards: pendingCards
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const k = tok.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[k] = next;
        i += 1;
      } else {
        out[k] = true;
      }
    }
  }
  return out;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(args.repo || process.cwd());
  if (args['version-path'] && typeof args['version-path'] === 'string') {
    const ver = args.version || fs.readFileSync(path.join(repoRoot, 'VERSION'), 'utf8').trim();
    process.stdout.write(versionedAssetPath(args['version-path'], ver) + '\n');
    process.exit(0);
  }
  const summary = generateReviewSuite(repoRoot);
  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    process.stdout.write(`Generated ${summary.preview_html} (${summary.total_cards} cards across ${summary.sections} section(s); ${summary.pending_human_review_cards} pending human review).\nRun: node ${summary.review_server}\n`);
  }
}
