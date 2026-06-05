// Copy GNOMATIX brand assets from the marketplace assets/ directory into
// the extension's media/ directory.
//
// This script exists because the build environment did not have permission
// to copy the binary PNGs at scaffold time. Run it once with:
//
//   node scripts/copy-assets.js
//
// from the vscode-extension directory. It is idempotent.
//
// Cross-platform per repo CLAUDE.md: pure Node, no shell, atomic writes,
// defensive fs error handling.

'use strict';

const fs = require('fs');
const path = require('path');

const EXT_ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(EXT_ROOT, 'media');

// Walk up from EXT_ROOT looking for the marketplace root (the directory
// that contains .claude-plugin/marketplace.json AND assets/images/).
function findMarketplaceRoot(startDir) {
  let dir = startDir;
  // Bound the walk so we don't spin forever on a malformed layout.
  for (let i = 0; i < 12; i++) {
    const manifest = path.join(dir, '.claude-plugin', 'marketplace.json');
    const assetsImages = path.join(dir, 'assets', 'images');
    let hasManifest = false;
    let hasAssets = false;
    try { hasManifest = fs.existsSync(manifest); } catch { /* pass */ }
    try { hasAssets = fs.existsSync(assetsImages); } catch { /* pass */ }
    if (hasManifest && hasAssets) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return undefined;
}

function atomicCopy(src, dest) {
  // Read source defensively; copy via temp file + rename to avoid leaving
  // a partial PNG at dest if the process crashes mid-write.
  let data;
  try {
    data = fs.readFileSync(src);
  } catch (err) {
    return { ok: false, reason: `read ${src}: ${err.message}` };
  }
  const tmp = `${dest}.tmp.${process.pid}.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, dest);
    return { ok: true };
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
    return { ok: false, reason: `write ${dest}: ${err.message}` };
  }
}

function main() {
  try {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  } catch (err) {
    console.error(`Could not create ${MEDIA_DIR}: ${err.message}`);
    process.exit(1);
  }

  const root = findMarketplaceRoot(EXT_ROOT);
  if (!root) {
    console.error(
      'Could not locate marketplace root above this extension. ' +
        'Pass it explicitly via GNOMATIX_MARKETPLACE_ROOT env var.',
    );
    const env = process.env.GNOMATIX_MARKETPLACE_ROOT;
    if (!env) {
      process.exit(1);
    }
  }

  const marketplaceRoot = root || process.env.GNOMATIX_MARKETPLACE_ROOT;
  const srcDir = path.join(marketplaceRoot, 'assets', 'images');

  const jobs = [
    { src: 'gnomatix-new-xs.png', dest: 'icon.png' },
    { src: 'gnomatix-new-xs.png', dest: 'gnomatix-wordmark.png' },
    { src: 'gnomatix-killbots-activate-xs.png', dest: 'gnomatix-killbots.png' },
  ];

  let failed = 0;
  for (const j of jobs) {
    const result = atomicCopy(
      path.join(srcDir, j.src),
      path.join(MEDIA_DIR, j.dest),
    );
    if (result.ok) {
      console.log(`copied ${j.src} -> media/${j.dest}`);
    } else {
      console.error(`FAILED ${j.src} -> media/${j.dest}: ${result.reason}`);
      failed++;
    }
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log('');
  console.log('Note: media/icon.png is the wordmark at its native size.');
  console.log('VS Code recommends a 128x128 PNG for the extension icon');
  console.log('and Activity Bar. If your packaged extension shows a');
  console.log('blurry or distorted icon, resize media/icon.png manually');
  console.log('(or with a one-off ImageMagick/sharp invocation).');
}

main();
